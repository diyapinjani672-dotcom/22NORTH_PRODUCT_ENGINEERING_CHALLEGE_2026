from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from database.db import get_db
from models.models import Booking, Voucher, Disruption
from schemas.schemas import VoucherOut
from services.voucher_service import issue_vouchers_for_booking

router = APIRouter(prefix="/api", tags=["vouchers"])


@router.get("/vouchers", response_model=list[VoucherOut])
def list_vouchers(booking_id: str = Query(...), db: Session = Depends(get_db)):
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
    issue_vouchers_for_booking(db, booking, flight, disruption)
    return db.query(Voucher).filter(Voucher.booking_id == booking_id).order_by(Voucher.created_at.desc()).all()


@router.post("/vouchers/{voucher_id}/redeem", response_model=VoucherOut)
def redeem_voucher(voucher_id: str, db: Session = Depends(get_db)):
    voucher = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found.")
    if voucher.status != "ACTIVE":
        raise HTTPException(status_code=409, detail=f"Voucher is already {voucher.status.lower()}.")
    if voucher.expires_at and voucher.expires_at < datetime.utcnow():
        voucher.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=410, detail="Voucher has expired.")

    voucher.status = "REDEEMED"
    db.commit()
    db.refresh(voucher)
    return voucher
