from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Flight, Disruption
from schemas.schemas import FlightStatusResponse, BookingOut
from services.recovery_service import is_disrupted

router = APIRouter(prefix="/api", tags=["flights"])


@router.get("/booking", response_model=BookingOut)
def get_booking(booking_id: str = Query(...), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking


@router.get("/flight-status", response_model=FlightStatusResponse)
def flight_status(booking_id: str = Query(...), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    flight = booking.flight
    disruption = (
        db.query(Disruption)
        .filter(Disruption.flight_id == flight.id)
        .order_by(Disruption.announced_at.desc())
        .first()
    )
    return FlightStatusResponse(
        flight=flight,
        is_disrupted=is_disrupted(flight),
        disruption=disruption,
    )
