from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Flight, Disruption, ChatMessage, AnalyticsEvent
from schemas.schemas import ChatRequest, ChatResponse, ExplanationOut, ExplanationFactor
from services.ai_service import get_ai_response
from services.recovery_service import rank_alternates

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    flight = booking.flight
    disruption = (
        db.query(Disruption)
        .filter(Disruption.flight_id == flight.id)
        .order_by(Disruption.announced_at.desc())
        .first()
    )

    candidates = (
        db.query(Flight)
        .filter(Flight.origin_code == flight.origin_code)
        .filter(Flight.destination_code == flight.destination_code)
        .filter(Flight.id != flight.id)
        .filter(Flight.seats_available > 0)
        .all()
    )
    ranked = rank_alternates(flight, candidates)
    best_alt = ranked[0] if ranked else None

    lang = payload.language or booking.passenger.language or "en"

    db.add(ChatMessage(booking_id=booking.id, role="user", content=payload.message))

    result = get_ai_response(payload.message, booking, flight, disruption, best_alt, db, lang)

    db.add(ChatMessage(
        booking_id=booking.id,
        role="assistant",
        content=result["reply"],
        intent=result.get("intent"),
    ))
    db.add(AnalyticsEvent(event_type="chat_message", booking_id=booking.id))
    db.commit()

    explanation = result.get("explanation")
    exp_out = None
    if explanation:
        exp_out = ExplanationOut(
            intent=explanation.get("intent"),
            factors=[ExplanationFactor(**f) for f in explanation.get("factors", [])],
            summary=explanation.get("summary", ""),
        )

    return ChatResponse(
        reply=result["reply"],
        suggested_actions=result.get("suggested_actions", []),
        recommended_flight_id=result.get("recommended_flight_id"),
        intent=result.get("intent"),
        explanation=exp_out,
    )
