"""
AI Assistant with intent routing, explainability, and multi-language replies.
"""
import os
from typing import List, Optional

from sqlalchemy.orm import Session

from models.models import Flight, Booking, Disruption, Baggage, Voucher
from services.recovery_service import is_disrupted, refund_eligibility, score_alternate_with_factors
from i18n.messages import t

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

INTENTS = [
    "greeting", "disruption", "rebook", "refund", "baggage", "voucher",
    "hotel", "boarding", "seat", "faq", "agent", "general",
]


def classify_intent(message: str) -> str:
    text = message.lower()
    if any(w in text for w in ["hi", "hello", "hey", "namaste", "hola"]):
        return "greeting"
    if any(w in text for w in ["bag", "baggage", "luggage", "equipaje", "सामान", "बैग"]):
        return "baggage"
    if any(w in text for w in ["voucher", "coupon", "meal", "food", "वाउचर"]):
        return "voucher"
    if any(w in text for w in ["hotel", "room", "overnight", "होटल"]):
        return "hotel"
    if any(w in text for w in ["board", "gate", "boarding pass", "embarque", "बोर्ड"]):
        return "boarding"
    if any(w in text for w in ["seat", "window", "aisle", "सीट", "asiento"]):
        return "seat"
    if any(w in text for w in ["policy", "faq", "rule", "cover", "help me understand"]):
        return "faq"
    if any(w in text for w in ["agent", "human", "person", "talk to someone"]):
        return "agent"
    if any(w in text for w in ["refund", "money back", "reembolso", "रिफंड"]):
        return "refund"
    if any(w in text for w in ["best option", "rebook", "alternate", "recommend", "what should"]):
        return "rebook"
    if any(w in text for w in ["why", "cancel", "delay", "disrupt", "reach", "arrive", "today"]):
        return "disruption"
    return "general"


def _mock_reply(
    message: str,
    booking: Booking,
    flight: Flight,
    disruption: Optional[Disruption],
    best_alt: Optional[Flight],
    db: Session,
    lang: str = "en",
) -> dict:
    intent = classify_intent(message)
    actions: List[str] = []
    recommended_id = None
    explanation = {"intent": intent, "factors": [], "summary": ""}

    if intent == "greeting":
        reply = t(lang, "greeting", name=booking.passenger.first_name, flight_no=flight.flight_number)

    elif intent == "disruption":
        if disruption:
            reply = t(lang, "disruption", flight_no=flight.flight_number,
                      reason=disruption.reason.lower(), detail=disruption.reason_detail or "")
            explanation["factors"] = [
                {"label": f"Disruption type: {disruption.type}", "weight": 40, "impact": "negative"},
                {"label": f"Cause: {disruption.reason}", "weight": 35, "impact": "negative"},
                {"label": f"Delay: {disruption.delay_minutes} min", "weight": 25, "impact": "negative"},
            ]
            explanation["summary"] = disruption.reason_detail or disruption.reason
        else:
            reply = f"Flight {flight.flight_number} is on time with no reported disruptions."
        actions = ["view_status"]

    elif intent == "rebook":
        if best_alt:
            score, factors = score_alternate_with_factors(flight, best_alt)
            reply = t(lang, "rebook_recommend",
                      alt_flight=best_alt.flight_number,
                      dep_time=best_alt.scheduled_departure.strftime("%I:%M %p"),
                      seats=best_alt.seats_available, score=score)
            explanation["factors"] = [{"label": f["label"], "weight": abs(f["delta"]), "impact": f["impact"]} for f in factors]
            explanation["summary"] = f"Recovery score {score}/100 based on timing, stops, and availability."
            actions = ["rebook"]
            recommended_id = best_alt.id
        else:
            reply = t(lang, "rebook_none")
            actions = ["refund", "waitlist"]

    elif intent == "refund":
        elig = refund_eligibility(booking, flight)
        if elig["eligible"]:
            reply = t(lang, "refund_eligible", note=elig["policy_note"], amount=elig["estimated_amount"])
            actions = ["refund"]
        else:
            reply = t(lang, "refund_ineligible", note=elig["policy_note"])
            actions = ["rebook"]
        explanation["factors"] = elig["factors"]
        explanation["summary"] = elig["explanation_summary"]

    elif intent == "baggage":
        bags = db.query(Baggage).filter(Baggage.booking_id == booking.id).all()
        if bags:
            bag = bags[0]
            reply = t(lang, "baggage", tag=bag.tag_number, status=bag.status,
                      location=bag.last_scan_location or "origin airport")
            explanation["factors"] = [{"label": f"Bag {bag.tag_number}: {bag.status}", "weight": 100, "impact": "neutral"}]
        else:
            reply = "No checked baggage on this booking."
        actions = ["view_baggage"]

    elif intent in ("voucher", "hotel"):
        vouchers = db.query(Voucher).filter(Voucher.booking_id == booking.id, Voucher.status == "ACTIVE").all()
        if intent == "hotel":
            hotel = next((v for v in vouchers if v.type == "HOTEL"), None)
            if hotel:
                reply = t(lang, "hotel", amount=hotel.amount)
            else:
                reply = "No hotel voucher issued yet. Long delays or cancellations trigger auto-issue."
        else:
            total = sum(v.amount for v in vouchers)
            reply = t(lang, "voucher", count=len(vouchers), total=total)
        actions = ["view_vouchers"]

    elif intent == "boarding":
        reply = t(lang, "boarding", flight_no=flight.flight_number, gate=flight.gate,
                  terminal=flight.terminal, status=flight.status.value)
        actions = ["view_boarding_pass"]

    elif intent == "seat":
        reply = t(lang, "seat", seat=booking.seat_number, cabin=booking.cabin_class,
                  preferred=booking.passenger.preferred_seat)
        actions = ["view_status"]

    elif intent == "faq":
        reply = t(lang, "faq")

    elif intent == "agent":
        reply = t(lang, "agent")
        actions = ["contact_agent"]

    else:
        reply = t(lang, "fallback")

    return {
        "reply": reply,
        "suggested_actions": actions,
        "recommended_flight_id": recommended_id,
        "intent": intent,
        "explanation": explanation,
    }


def get_ai_response(
    message: str,
    booking: Booking,
    flight: Flight,
    disruption: Optional[Disruption],
    best_alt: Optional[Flight],
    db: Session,
    lang: str = "en",
) -> dict:
    lang = lang or booking.passenger.language or "en"
    if not OPENAI_API_KEY:
        return _mock_reply(message, booking, flight, disruption, best_alt, db, lang)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        system_prompt = (
            f"You are SkyJet's recovery assistant. Reply in language code '{lang}'. Be concise. "
            f"Passenger: {booking.passenger.first_name}. Flight: {flight.flight_number}, status {flight.status}. "
            f"Handle intents: baggage, vouchers, hotel, boarding, seat, refund, rebook, FAQ."
        )
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            max_tokens=250,
        )
        reply_text = resp.choices[0].message.content
        intent = classify_intent(message)
        return {
            "reply": reply_text,
            "suggested_actions": [],
            "recommended_flight_id": best_alt.id if best_alt else None,
            "intent": intent,
            "explanation": {"intent": intent, "factors": [], "summary": "AI-generated response"},
        }
    except Exception:
        return _mock_reply(message, booking, flight, disruption, best_alt, db, lang)
