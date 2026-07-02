# API Documentation

Base URL: `http://localhost:8000`
Interactive Swagger UI: `http://localhost:8000/docs`
All request/response bodies are JSON.

Auth: this MVP uses a simple demo token (base64 of the booking id), returned
from `/api/auth/login`. Endpoints below take `booking_id` directly for
simplicity; in production, the token would be sent as a `Bearer` header and
verified server-side on every call (see `ASSUMPTIONS.md`).

---

## POST `/api/auth/login`

Log in with PNR + last name.

**Request**
```json
{ "pnr": "SKY4A9", "last_name": "Shah" }
```

**Response `200`**
```json
{
  "token": "YmtnXzZlNzA4ZGY1OTk=",
  "booking": { "id": "bkg_...", "pnr": "SKY4A9", "seat_number": "14A", "...": "..." }
}
```

**Response `401`** — PNR/last name combination not found.

---

## GET `/api/booking?booking_id={id}`

Returns the full booking record (passenger + flight nested).

---

## GET `/api/flight-status?booking_id={id}`

Returns current flight status plus the active disruption, if any.

**Response `200`**
```json
{
  "flight": { "flight_number": "SJ 202", "status": "CANCELLED", "...": "..." },
  "is_disrupted": true,
  "disruption": { "type": "CANCELLATION", "reason": "WEATHER", "reason_detail": "..." }
}
```

---

## GET `/api/alternate-flights?booking_id={id}`

Returns ranked alternate flights on the same origin/destination pair.
Ranking uses `services/recovery_service.score_alternate()` — a 0–100
Recovery Score weighted on time proximity to the original schedule, number of
stops, and seat scarcity.

**Response `200`**
```json
{
  "original_flight": { "...": "..." },
  "options": [ { "flight_number": "SJ 204", "seats_available": 18, "...": "..." } ],
  "recommended_flight_id": "flt_8b459efecb"
}
```

---

## POST `/api/rebook`

Moves the passenger's booking onto a new flight and decrements seat inventory.

**Request**
```json
{ "booking_id": "bkg_...", "new_flight_id": "flt_..." }
```

**Response `200`**
```json
{
  "id": "rbk_...",
  "status": "CONFIRMED",
  "recovery_score": 78,
  "fare_difference": 0.0,
  "new_flight": { "...": "..." }
}
```

**Response `409`** — selected flight sold out between page load and click.

---

## GET `/api/refund/eligibility?booking_id={id}`

Evaluates refund policy for the booking (see `ASSUMPTIONS.md` for the rule
set) without creating a refund record.

**Response `200`**
```json
{
  "eligible": true,
  "refund_type_options": ["Full", "Travel Credit"],
  "estimated_amount": 210.0,
  "estimated_processing_days": 7,
  "policy_note": "Your flight was cancelled by SkyJet Airways, so you qualify for a full refund..."
}
```

---

## POST `/api/refund`

Creates a (simulated) refund request. No payment integration — this only
writes a `Refund` row and a notification.

**Request**
```json
{ "booking_id": "bkg_...", "refund_type": "Full", "reason": "Flight disruption" }
```

**Response `200`**
```json
{ "id": "rfd_...", "amount": 210.0, "refund_type": "Full", "status": "PROCESSING", "estimated_processing_days": 7 }
```

**Response `400`** — booking is not eligible under policy.

---

## POST `/api/chat`

Sends a message to the AI recovery assistant. Uses OpenAI if
`OPENAI_API_KEY` is set; otherwise falls back to a deterministic rule-based
responder so the assistant always works offline.

**Request**
```json
{ "booking_id": "bkg_...", "message": "What is my best option?" }
```

**Response `200`**
```json
{
  "reply": "Based on your itinerary, I'd recommend flight SJ 204...",
  "suggested_actions": ["rebook"],
  "recommended_flight_id": "flt_8b459efecb"
}
```

---

## GET `/api/notifications?booking_id={id}`

Returns the notification timeline for a booking, newest first.

---

## GET `/api/profile?booking_id={id}`

Returns the passenger's profile (contact info, emergency contact, frequent
flyer status, preferences).

---

## GET `/api/health`

Liveness check: `{ "status": "ok", "service": "skyjet-recovery-api" }`
