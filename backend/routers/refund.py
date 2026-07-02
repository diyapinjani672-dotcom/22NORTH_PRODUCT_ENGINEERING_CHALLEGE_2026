from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Booking, Refund, Notification, AnalyticsEvent
from schemas.schemas import RefundRequest, RefundEligibilityResponse, RefundOut, ExplanationFactor
from services.recovery_service import refund_eligibility

router = APIRouter(prefix="/api", tags=["refund"])


@router.get("/refund/eligibility", response_model=RefundEligibilityResponse)
def check_eligibility(booking_id: str = Query(...), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    elig = refund_eligibility(booking, booking.flight)
    return RefundEligibilityResponse(
        eligible=elig["eligible"],
        refund_type_options=elig["refund_type_options"],
        estimated_amount=elig["estimated_amount"],
        estimated_processing_days=elig["estimated_processing_days"],
        policy_note=elig["policy_note"],
        factors=[ExplanationFactor(**f) for f in elig["factors"]],
        explanation_summary=elig["explanation_summary"],
    )


@router.post("/refund", response_model=RefundOut)
def request_refund(payload: RefundRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    elig = refund_eligibility(booking, booking.flight)
    if not elig["eligible"]:
        raise HTTPException(status_code=400, detail=elig["policy_note"])

    refund = Refund(
        booking_id=booking.id,
        amount=elig["estimated_amount"],
        refund_type=payload.refund_type,
        reason=payload.reason or "Flight disruption",
    )
    db.add(refund)
    booking.status = "REFUNDED"

    db.add(Notification(
        booking_id=booking.id,
        type="REFUND",
        title="Refund Request Received",
        message=f"Your {payload.refund_type.lower()} refund of ${elig['estimated_amount']:.2f} "
                f"is being processed.",
    ))
    db.add(AnalyticsEvent(event_type="refund", booking_id=booking.id))

    db.commit()
    db.refresh(refund)
    return RefundOut(
        id=refund.id,
        amount=refund.amount,
        refund_type=refund.refund_type,
        status=refund.status.value,
        estimated_processing_days=refund.estimated_processing_days,
        reason=refund.reason,
        created_at=refund.created_at,
        factors=[ExplanationFactor(**f) for f in elig["factors"]],
        explanation_summary=elig["explanation_summary"],
    )
