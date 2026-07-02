from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.db import get_db
from models.models import Notification
from schemas.schemas import NotificationOut

router = APIRouter(prefix="/api", tags=["notifications"])


@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(
    booking_id: str = Query(...),
    since: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Notification).filter(Notification.booking_id == booking_id)
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00").replace("+00:00", ""))
            q = q.filter(Notification.created_at > since_dt)
        except ValueError:
            pass
    return q.order_by(Notification.created_at.desc()).all()
