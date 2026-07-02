from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Passenger
from schemas.schemas import PassengerOut, ProfileUpdateRequest, ProfileUpdateResponse

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/profile", response_model=PassengerOut)
def get_profile(booking_id: str = Query(...), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking.passenger


@router.patch("/profile", response_model=ProfileUpdateResponse)
def update_profile(payload: ProfileUpdateRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    pax = booking.passenger
    if payload.language:
        pax.language = payload.language
    db.commit()
    db.refresh(pax)
    return ProfileUpdateResponse(passenger=pax)
