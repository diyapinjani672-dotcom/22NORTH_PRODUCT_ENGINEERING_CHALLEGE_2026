from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, BoardingPassScan, FlightStatus
from schemas.schemas import BoardingPassOut, BoardingPassScanRequest, BoardingPassScanResponse

router = APIRouter(prefix="/api", tags=["boarding-pass"])


@router.get("/boarding-pass", response_model=BoardingPassOut)
def get_boarding_pass(booking_id: str = Query(...), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    flight = booking.flight
    pax = booking.passenger
    boarding_time = flight.scheduled_departure - timedelta(minutes=45)
    barcode = f"SJ|{booking.pnr}|{flight.flight_number}|{booking.seat_number}|{flight.gate}"

    return BoardingPassOut(
        booking_id=booking.id,
        pnr=booking.pnr,
        passenger_name=f"{pax.first_name} {pax.last_name}",
        flight_number=flight.flight_number,
        origin_code=flight.origin_code,
        destination_code=flight.destination_code,
        seat=booking.seat_number,
        gate=flight.gate,
        terminal=flight.terminal,
        boarding_time=boarding_time,
        departure_time=flight.estimated_departure or flight.scheduled_departure,
        barcode_data=barcode,
        status=flight.status.value,
    )


@router.post("/boarding-pass/scan", response_model=BoardingPassScanResponse)
def scan_boarding_pass(payload: BoardingPassScanRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    flight = booking.flight
    now = datetime.utcnow()
    valid = True
    message = "Boarding pass accepted. Have a pleasant flight!"

    if flight.status not in (FlightStatus.BOARDING, FlightStatus.ON_TIME):
        valid = False
        message = f"Cannot board — flight status is {flight.status.value}."
    elif payload.gate_code.upper() != flight.gate.upper():
        valid = False
        message = f"Wrong gate. Please proceed to Gate {flight.gate}."
    elif now < flight.scheduled_departure - timedelta(hours=2):
        valid = False
        message = "Boarding has not opened yet. Please wait."

    scan = BoardingPassScan(
        booking_id=booking.id,
        gate_code=payload.gate_code,
        valid=valid,
        message=message,
        scanned_at=now,
    )
    db.add(scan)
    db.commit()

    return BoardingPassScanResponse(valid=valid, message=message, scanned_at=now)
