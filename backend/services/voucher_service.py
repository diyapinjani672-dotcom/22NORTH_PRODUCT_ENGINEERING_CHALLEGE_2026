"""
Auto-issue meal/hotel/lounge vouchers based on disruption severity.
"""
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from models.models import Voucher, Booking, Flight, Disruption, FlightStatus


def _voucher_code(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def issue_vouchers_for_booking(
    db: Session, booking: Booking, flight: Flight, disruption: Optional[Disruption]
) -> List[Voucher]:
    existing = db.query(Voucher).filter(Voucher.booking_id == booking.id).all()
    if existing:
        return existing

    vouchers = []
    expires = datetime.utcnow() + timedelta(days=7)
    delay_minutes = disruption.delay_minutes if disruption else 0

    if flight.status == FlightStatus.CANCELLED:
        vouchers.extend([
            Voucher(
                booking_id=booking.id, type="MEAL", amount=25.0, currency="USD",
                code=_voucher_code("MEAL"), status="ACTIVE",
                issued_reason="Flight cancellation — meal voucher",
                expires_at=expires,
            ),
            Voucher(
                booking_id=booking.id, type="HOTEL", amount=150.0, currency="USD",
                code=_voucher_code("HOTEL"), status="ACTIVE",
                issued_reason="Flight cancellation — overnight hotel",
                expires_at=expires + timedelta(days=1),
            ),
            Voucher(
                booking_id=booking.id, type="LOUNGE", amount=35.0, currency="USD",
                code=_voucher_code("LOUNGE"), status="ACTIVE",
                issued_reason="Flight cancellation — lounge access",
                expires_at=expires,
            ),
        ])
    elif flight.status in (FlightStatus.DELAYED, FlightStatus.DIVERTED):
        if delay_minutes >= 180 or flight.status == FlightStatus.DIVERTED:
            vouchers.extend([
                Voucher(
                    booking_id=booking.id, type="MEAL", amount=20.0, currency="USD",
                    code=_voucher_code("MEAL"), status="ACTIVE",
                    issued_reason=f"Extended delay ({delay_minutes} min) — meal voucher",
                    expires_at=expires,
                ),
                Voucher(
                    booking_id=booking.id, type="HOTEL", amount=120.0, currency="USD",
                    code=_voucher_code("HOTEL"), status="ACTIVE",
                    issued_reason="Extended delay — hotel if overnight",
                    expires_at=expires + timedelta(days=1),
                ),
            ])
        elif delay_minutes >= 60:
            vouchers.append(Voucher(
                booking_id=booking.id, type="MEAL", amount=15.0, currency="USD",
                code=_voucher_code("MEAL"), status="ACTIVE",
                issued_reason=f"Delay ({delay_minutes} min) — meal voucher",
                expires_at=expires,
            ))

    for v in vouchers:
        db.add(v)
    if vouchers:
        db.commit()
    return vouchers
