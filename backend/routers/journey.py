from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Flight, Disruption, Notification
from schemas.schemas import JourneyResponse, JourneyEventOut
from services.journey_service import build_journey_timeline

router = APIRouter(prefix="/api", tags=["journey"])


@router.get("/journey", response_model=JourneyResponse)
def get_journey(booking_id: str = Query(...), db: Session = Depends(get_db)):
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
    notifications = (
        db.query(Notification)
        .filter(Notification.booking_id == booking_id)
        .order_by(Notification.created_at.asc())
        .all()
    )
    events = build_journey_timeline(booking, flight, disruption, notifications)
    return JourneyResponse(events=[JourneyEventOut(**e) for e in events])
