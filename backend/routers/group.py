from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import (
    Booking, BookingGroup, Flight, Rebooking, Refund, Notification,
    RebookingStatus, RefundStatus,
)
from schemas.schemas import (
    GroupMemberOut, GroupRebookRequest, GroupRefundRequest, GroupRecoveryResponse,
)
from services.recovery_service import score_alternate, refund_eligibility

router = APIRouter(prefix="/api", tags=["group"])


def _get_group_bookings(db: Session, master_pnr: str) -> list[Booking]:
    group = db.query(BookingGroup).filter(BookingGroup.master_pnr == master_pnr.upper()).first()
    if not group:
        booking = db.query(Booking).filter(Booking.pnr == master_pnr.upper()).first()
        return [booking] if booking else []
    return db.query(Booking).filter(Booking.group_id == group.id).all()


@router.get("/group", response_model=list[GroupMemberOut])
def get_group(master_pnr: str = Query(...), db: Session = Depends(get_db)):
    bookings = _get_group_bookings(db, master_pnr)
    if not bookings:
        raise HTTPException(status_code=404, detail="Group not found.")
    return [
        GroupMemberOut(
            booking_id=b.id,
            pnr=b.pnr,
            passenger_name=f"{b.passenger.first_name} {b.passenger.last_name}",
            seat_number=b.seat_number,
            status=b.status,
            is_primary=b.is_primary,
        )
        for b in bookings
    ]


@router.post("/group/rebook", response_model=GroupRecoveryResponse)
def group_rebook(payload: GroupRebookRequest, db: Session = Depends(get_db)):
    new_flight = db.query(Flight).filter(Flight.id == payload.new_flight_id).first()
    if not new_flight:
        raise HTTPException(status_code=404, detail="Flight not found.")

    results = []
    success = 0
    for bid in payload.booking_ids:
        booking = db.query(Booking).filter(Booking.id == bid).first()
        if not booking:
            results.append({"booking_id": bid, "success": False, "error": "Not found"})
            continue
        if new_flight.seats_available <= 0:
            results.append({"booking_id": bid, "success": False, "error": "Sold out"})
            continue

        score = score_alternate(booking.flight, new_flight)
        db.add(Rebooking(
            original_booking_id=booking.id,
            new_flight_id=new_flight.id,
            status=RebookingStatus.CONFIRMED,
            recovery_score=score,
        ))
        new_flight.seats_available -= 1
        booking.flight_id = new_flight.id
        booking.status = "REBOOKED"
        db.add(Notification(
            booking_id=booking.id,
            type="REBOOKING",
            title="Group Rebooking Confirmed",
            message=f"Your group was rebooked onto {new_flight.flight_number}.",
        ))
        results.append({"booking_id": bid, "success": True, "flight": new_flight.flight_number})
        success += 1

    db.commit()
    return GroupRecoveryResponse(success_count=success, results=results)


@router.post("/group/refund", response_model=GroupRecoveryResponse)
def group_refund(payload: GroupRefundRequest, db: Session = Depends(get_db)):
    results = []
    success = 0
    for bid in payload.booking_ids:
        booking = db.query(Booking).filter(Booking.id == bid).first()
        if not booking:
            results.append({"booking_id": bid, "success": False, "error": "Not found"})
            continue
        elig = refund_eligibility(booking, booking.flight)
        if not elig["eligible"]:
            results.append({"booking_id": bid, "success": False, "error": "Not eligible"})
            continue

        db.add(Refund(
            booking_id=booking.id,
            amount=elig["estimated_amount"],
            refund_type=payload.refund_type,
            status=RefundStatus.REQUESTED,
            estimated_processing_days=elig["estimated_processing_days"],
        ))
        booking.status = "REFUNDED"
        db.add(Notification(
            booking_id=booking.id,
            type="REFUND",
            title="Group Refund Initiated",
            message=f"Refund of ${elig['estimated_amount']:.2f} is being processed.",
        ))
        results.append({"booking_id": bid, "success": True, "amount": elig["estimated_amount"]})
        success += 1

    db.commit()
    return GroupRecoveryResponse(success_count=success, results=results)
