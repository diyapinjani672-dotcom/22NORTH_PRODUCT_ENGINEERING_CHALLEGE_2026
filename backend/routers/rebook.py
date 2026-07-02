from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Flight, Rebooking, Notification, RebookingStatus, AnalyticsEvent
from schemas.schemas import (
    AlternateFlightsResponse, AlternateFlightOption, RebookRequest, RebookingOut,
    ExplanationFactor,
)
from services.recovery_service import rank_alternates, score_alternate_with_factors

router = APIRouter(prefix="/api", tags=["rebooking"])


@router.get("/alternate-flights", response_model=AlternateFlightsResponse)
def alternate_flights(booking_id: str = Query(...), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    original = booking.flight
    candidates = (
        db.query(Flight)
        .filter(Flight.origin_code == original.origin_code)
        .filter(Flight.destination_code == original.destination_code)
        .filter(Flight.id != original.id)
        .filter(Flight.seats_available > 0)
        .all()
    )
    ranked = rank_alternates(original, candidates)
    recommended_id = ranked[0].id if ranked else None

    options = []
    for f in ranked:
        score, factors = score_alternate_with_factors(original, f)
        options.append(AlternateFlightOption(
            id=f.id,
            flight_number=f.flight_number,
            airline=f.airline,
            origin_code=f.origin_code,
            origin_city=f.origin_city,
            destination_code=f.destination_code,
            destination_city=f.destination_city,
            scheduled_departure=f.scheduled_departure,
            scheduled_arrival=f.scheduled_arrival,
            estimated_departure=f.estimated_departure,
            estimated_arrival=f.estimated_arrival,
            status=f.status.value,
            gate=f.gate,
            terminal=f.terminal,
            aircraft_type=f.aircraft_type,
            duration_minutes=f.duration_minutes,
            stops=f.stops,
            seats_available=f.seats_available,
            recovery_score=score,
            score_factors=[ExplanationFactor(label=fa["label"], delta=fa["delta"], impact=fa["impact"]) for fa in factors],
        ))

    return AlternateFlightsResponse(
        original_flight=original,
        options=options,
        recommended_flight_id=recommended_id,
    )


@router.post("/rebook", response_model=RebookingOut)
def rebook(payload: RebookRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    new_flight = db.query(Flight).filter(Flight.id == payload.new_flight_id).first()
    if not new_flight:
        raise HTTPException(status_code=404, detail="Selected flight not found.")
    if new_flight.seats_available <= 0:
        raise HTTPException(status_code=409, detail="Sorry, this flight just sold out. Please pick another.")

    score, factors = score_alternate_with_factors(booking.flight, new_flight)

    rebooking = Rebooking(
        original_booking_id=booking.id,
        new_flight_id=new_flight.id,
        status=RebookingStatus.CONFIRMED,
        recovery_score=score,
        fare_difference=0.0,
    )
    db.add(rebooking)

    new_flight.seats_available -= 1
    booking.flight_id = new_flight.id
    booking.status = "REBOOKED"

    db.add(Notification(
        booking_id=booking.id,
        type="REBOOKING",
        title="Rebooking Confirmed",
        message=f"You're confirmed on flight {new_flight.flight_number} "
                f"departing {new_flight.scheduled_departure.strftime('%I:%M %p')}.",
    ))
    db.add(AnalyticsEvent(event_type="rebook", booking_id=booking.id))

    db.commit()
    db.refresh(rebooking)

    summary = f"Recovery score {score}/100 — " + ", ".join(f["label"] for f in factors[:2])
    return RebookingOut(
        id=rebooking.id,
        status=rebooking.status.value,
        recovery_score=rebooking.recovery_score,
        created_at=rebooking.created_at,
        fare_difference=rebooking.fare_difference,
        new_flight=new_flight,
        score_factors=[ExplanationFactor(label=f["label"], delta=f["delta"], impact=f["impact"]) for f in factors],
        explanation_summary=summary,
    )
