"""
Build merged journey timeline from scheduled milestones, disruptions, and notifications.
"""
from datetime import timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from models.models import Booking, Flight, Disruption, Notification, FlightStatus


def build_journey_timeline(
    booking: Booking,
    flight: Flight,
    disruption: Optional[Disruption],
    notifications: List[Notification],
) -> List[dict]:
    events = []
    dep = flight.scheduled_departure
    arr = flight.scheduled_arrival
    check_in = dep - timedelta(hours=24)
    boarding = dep - timedelta(minutes=45)

    events.append({
        "id": f"sch_checkin_{booking.id}",
        "kind": "CHECK_IN",
        "title": "Online check-in opens",
        "detail": f"Check in for {flight.flight_number} from {flight.origin_city}",
        "at": check_in.isoformat(),
        "source": "scheduled",
        "status": "completed" if dep < __import__("datetime").datetime.utcnow() else "upcoming",
    })
    events.append({
        "id": f"sch_boarding_{booking.id}",
        "kind": "BOARDING",
        "title": "Boarding begins",
        "detail": f"Gate {flight.gate}, Terminal {flight.terminal}",
        "at": boarding.isoformat(),
        "source": "scheduled",
        "status": "active" if flight.status == FlightStatus.BOARDING else "upcoming",
    })
    events.append({
        "id": f"sch_departure_{booking.id}",
        "kind": "DEPARTURE",
        "title": "Scheduled departure",
        "detail": f"{flight.origin_code} → {flight.destination_code}",
        "at": (flight.estimated_departure or dep).isoformat(),
        "source": "scheduled",
        "status": "delayed" if flight.status == FlightStatus.DELAYED else "upcoming",
    })
    events.append({
        "id": f"sch_arrival_{booking.id}",
        "kind": "ARRIVAL",
        "title": "Scheduled arrival",
        "detail": flight.destination_city,
        "at": (flight.estimated_arrival or arr).isoformat(),
        "source": "scheduled",
        "status": "upcoming",
    })

    if disruption:
        events.append({
            "id": disruption.id,
            "kind": disruption.type,
            "title": f"Disruption: {disruption.type.replace('_', ' ').title()}",
            "detail": disruption.reason_detail or disruption.reason,
            "at": disruption.announced_at.isoformat(),
            "source": "disruption",
            "status": "alert",
        })

    for n in notifications:
        events.append({
            "id": n.id,
            "kind": n.type,
            "title": n.title,
            "detail": n.message,
            "at": n.created_at.isoformat(),
            "source": "notification",
            "status": "info",
        })

    events.sort(key=lambda e: e["at"])
    return events
