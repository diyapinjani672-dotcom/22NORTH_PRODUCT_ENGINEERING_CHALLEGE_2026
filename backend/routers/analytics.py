from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.db import get_db
from models.models import (
    Rebooking, Refund, Disruption, ChatMessage, AnalyticsEvent, Booking,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):
    total_disruptions = db.query(Disruption).count()
    rebook_count = db.query(Rebooking).count()
    refund_count = db.query(Refund).count()
    refund_volume = db.query(func.coalesce(func.sum(Refund.amount), 0.0)).scalar() or 0.0
    chat_sessions = db.query(func.count(func.distinct(ChatMessage.booking_id))).scalar() or 0

    disrupted_bookings = db.query(Booking).filter(Booking.status.in_(["CONFIRMED", "REBOOKED", "REFUNDED"])).count()
    rebook_conversion = round(rebook_count / max(disrupted_bookings, 1), 2)

    agent_escalations = db.query(AnalyticsEvent).filter(AnalyticsEvent.event_type == "agent_escalation").count()
    deflection_rate = round(1 - (agent_escalations / max(chat_sessions, 1)), 2)

    avg_score = db.query(func.coalesce(func.avg(Rebooking.recovery_score), 0)).scalar() or 0

    trend = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        rb = db.query(Rebooking).filter(Rebooking.created_at >= day_start, Rebooking.created_at < day_end).count()
        rf = db.query(Refund).filter(Refund.created_at >= day_start, Refund.created_at < day_end).count()
        trend.append({"date": day.isoformat(), "rebooks": rb, "refunds": rf})

    return {
        "deflection_rate": min(deflection_rate, 0.95),
        "rebook_conversion": min(rebook_conversion, 0.85),
        "refund_volume_usd": round(float(refund_volume), 2),
        "refund_count": refund_count,
        "rebook_count": rebook_count,
        "total_disruptions": total_disruptions,
        "total_chat_sessions": chat_sessions,
        "avg_recovery_score": round(float(avg_score), 1),
        "trend_7d": trend,
    }
