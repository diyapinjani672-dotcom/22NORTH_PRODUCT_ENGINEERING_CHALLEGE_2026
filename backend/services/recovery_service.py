"""
Recovery business logic with explainable scoring and refund factors.
"""
from datetime import datetime
from typing import List, Optional, Tuple

from models.models import Flight, Booking, FlightStatus


def is_disrupted(flight: Flight) -> bool:
    return flight.status in (FlightStatus.DELAYED, FlightStatus.CANCELLED, FlightStatus.DIVERTED)


def score_alternate_with_factors(original: Flight, candidate: Flight) -> Tuple[int, List[dict]]:
    factors = []
    score = 100

    delta_minutes = abs((candidate.scheduled_departure - original.scheduled_departure).total_seconds() / 60)
    time_penalty = min(delta_minutes / 15, 40)
    if time_penalty > 0:
        factors.append({
            "label": f"Departure {int(delta_minutes)} min from original",
            "delta": -round(time_penalty),
            "impact": "negative" if time_penalty > 15 else "neutral",
        })
    score -= time_penalty

    if candidate.stops > 0:
        stop_penalty = candidate.stops * 15
        factors.append({
            "label": f"{candidate.stops} stop(s) vs nonstop",
            "delta": -stop_penalty,
            "impact": "negative",
        })
        score -= stop_penalty
    else:
        factors.append({"label": "Nonstop flight", "delta": 0, "impact": "positive"})

    if candidate.seats_available <= 3:
        factors.append({
            "label": f"Only {candidate.seats_available} seats left",
            "delta": -10,
            "impact": "negative",
        })
        score -= 10
    elif candidate.seats_available >= 20:
        factors.append({
            "label": f"{candidate.seats_available} seats available",
            "delta": 5,
            "impact": "positive",
        })
        score += 5

    if candidate.scheduled_arrival.date() == original.scheduled_arrival.date():
        factors.append({"label": "Same-day arrival", "delta": 5, "impact": "positive"})
        score += 5

    final = max(0, min(100, round(score)))
    return final, factors


def score_alternate(original: Flight, candidate: Flight) -> int:
    score, _ = score_alternate_with_factors(original, candidate)
    return score


def rank_alternates(original: Flight, candidates: List[Flight]) -> List[Flight]:
    return sorted(candidates, key=lambda c: score_alternate(original, c), reverse=True)


def refund_eligibility(booking: Booking, flight: Flight) -> dict:
    factors = []
    eligible = False
    refund_type_options = []
    estimated_amount = 0.0
    estimated_processing_days = 0
    policy_note = ""
    explanation_summary = ""

    if flight.status == FlightStatus.CANCELLED:
        eligible = True
        refund_type_options = ["Full", "Travel Credit"]
        estimated_amount = booking.fare_amount
        estimated_processing_days = 7
        policy_note = (
            "Your flight was cancelled by SkyJet Airways, so you qualify for a full refund "
            "or travel credit under our disruption policy."
        )
        factors = [
            {"label": "Flight cancelled by airline", "weight": 45, "impact": "positive"},
            {"label": "Airline-caused disruption (not passenger)", "weight": 30, "impact": "positive"},
            {"label": f"{booking.fare_type} fare rules apply", "weight": 15, "impact": "neutral"},
            {"label": f"{booking.cabin_class} cabin", "weight": 10, "impact": "neutral"},
        ]
        explanation_summary = "Airline cancellation → full refund eligible under EU261-style policy."

    elif flight.status == FlightStatus.DELAYED:
        delay = 0
        if flight.estimated_departure:
            delay = (flight.estimated_departure - flight.scheduled_departure).total_seconds() / 60
        if delay >= 180:
            eligible = True
            refund_type_options = ["Full", "Travel Credit"]
            estimated_amount = booking.fare_amount
            estimated_processing_days = 7
            policy_note = (
                f"Your flight is delayed by {int(delay)} minutes (3+ hours), "
                f"qualifying for a full refund under our extended-delay policy."
            )
            factors = [
                {"label": f"Delay of {int(delay)} minutes (3+ hours)", "weight": 40, "impact": "positive"},
                {"label": "Extended delay policy triggered", "weight": 35, "impact": "positive"},
                {"label": f"{booking.fare_type} fare", "weight": 15, "impact": "neutral"},
                {"label": "Technical/ATC disruption", "weight": 10, "impact": "positive"},
            ]
            explanation_summary = f"Delay ≥180 min → full refund eligible (${estimated_amount:.2f})."
        elif delay >= 60:
            eligible = True
            refund_type_options = ["Partial", "Travel Credit"]
            estimated_amount = round(booking.fare_amount * 0.5, 2)
            estimated_processing_days = 10
            policy_note = (
                f"Your flight is delayed by {int(delay)} minutes. "
                f"You qualify for a partial refund or travel credit."
            )
            factors = [
                {"label": f"Delay of {int(delay)} minutes (1–3 hours)", "weight": 30, "impact": "positive"},
                {"label": "Partial refund tier applies", "weight": 25, "impact": "positive"},
                {"label": f"{booking.fare_type} fare limits options", "weight": 20, "impact": "neutral"},
                {"label": "50% fare compensation", "weight": 25, "impact": "neutral"},
            ]
            explanation_summary = f"Delay 60–179 min → partial refund (${estimated_amount:.2f})."
        else:
            eligible = False
            policy_note = f"Delay of {int(delay)} minutes is below the 60-minute refund threshold."
            factors = [
                {"label": f"Delay only {int(delay)} minutes", "weight": 50, "impact": "negative"},
                {"label": "Below 60-min refund threshold", "weight": 30, "impact": "negative"},
                {"label": "Rebooking recommended instead", "weight": 20, "impact": "neutral"},
            ]
            explanation_summary = "Short delay — rebook or wait; refund not eligible."

    elif booking.fare_type == "Basic":
        eligible = False
        policy_note = "Basic fares are non-refundable outside of airline-caused disruptions."
        factors = [
            {"label": "Basic fare — non-refundable", "weight": 50, "impact": "negative"},
            {"label": "No airline-caused disruption", "weight": 30, "impact": "negative"},
            {"label": "Travel credit may be available on rebook", "weight": 20, "impact": "neutral"},
        ]
        explanation_summary = "Basic fare + no major disruption → not eligible."

    else:
        eligible = True
        refund_type_options = ["Travel Credit"]
        estimated_amount = round(booking.fare_amount * 0.8, 2)
        estimated_processing_days = 14
        policy_note = "Standard cancellation policy applies; a service fee is deducted."
        factors = [
            {"label": "Voluntary cancellation request", "weight": 40, "impact": "neutral"},
            {"label": "20% service fee deducted", "weight": 30, "impact": "negative"},
            {"label": f"{booking.fare_type} fare rules", "weight": 30, "impact": "neutral"},
        ]
        explanation_summary = f"Standard policy → 80% travel credit (${estimated_amount:.2f})."

    return {
        "eligible": eligible,
        "refund_type_options": refund_type_options,
        "estimated_amount": estimated_amount,
        "estimated_processing_days": estimated_processing_days,
        "policy_note": policy_note,
        "factors": factors,
        "explanation_summary": explanation_summary,
    }
