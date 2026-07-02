from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Baggage, BaggageScan
from schemas.schemas import BaggageOut, BaggageScanOut

router = APIRouter(prefix="/api", tags=["baggage"])


@router.get("/baggage", response_model=list[BaggageOut])
def get_baggage(booking_id: str = Query(...), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    bags = db.query(Baggage).filter(Baggage.booking_id == booking_id).all()
    result = []
    for bag in bags:
        scans = (
            db.query(BaggageScan)
            .filter(BaggageScan.baggage_id == bag.id)
            .order_by(BaggageScan.scanned_at.asc())
            .all()
        )
        result.append(BaggageOut(
            id=bag.id,
            tag_number=bag.tag_number,
            status=bag.status,
            last_scan_location=bag.last_scan_location,
            last_scan_at=bag.last_scan_at,
            weight_kg=bag.weight_kg,
            scans=[BaggageScanOut(location=s.location, status=s.status, scanned_at=s.scanned_at) for s in scans],
        ))
    return result
