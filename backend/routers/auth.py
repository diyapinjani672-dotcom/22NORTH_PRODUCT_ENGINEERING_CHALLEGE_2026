"""
Simple auth: passenger identifies themselves with PNR + last name.
"""
import base64

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Passenger, BookingGroup
from schemas.schemas import LoginRequest, LoginResponse, GroupMemberOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    booking = (
        db.query(Booking)
        .join(Passenger)
        .filter(Booking.pnr == payload.pnr.upper().strip())
        .filter(Passenger.last_name.ilike(payload.last_name.strip()))
        .first()
    )
    if not booking:
        raise HTTPException(status_code=401, detail="We couldn't find a booking with that PNR and last name.")

    token = base64.b64encode(booking.id.encode()).decode()

    group_members = []
    if booking.group_id:
        members = db.query(Booking).filter(Booking.group_id == booking.group_id).all()
        group_members = [
            GroupMemberOut(
                booking_id=m.id,
                pnr=m.pnr,
                passenger_name=f"{m.passenger.first_name} {m.passenger.last_name}",
                seat_number=m.seat_number,
                status=m.status,
                is_primary=m.is_primary,
            )
            for m in members
        ]

    return LoginResponse(token=token, booking=booking, group_members=group_members)
