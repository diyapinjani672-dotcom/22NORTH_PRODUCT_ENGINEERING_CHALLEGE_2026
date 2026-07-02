# Architecture

## System Diagram

```mermaid
flowchart TB
    subgraph Client["Passenger Device"]
        UI["React SPA (Vite)\nDashboard · Recovery · Chat"]
    end

    subgraph Edge["Delivery"]
        CDN["Static hosting / CDN\n(Vercel / S3+CloudFront)"]
        LB["API Gateway / Load Balancer"]
    end

    subgraph App["Application Layer (FastAPI, containerized, horizontally scalable)"]
        AUTH["Auth Router\nPNR + last name"]
        FLIGHT["Flights Router\nstatus lookup"]
        REBOOK["Rebook Router\nalternates + rebook"]
        REFUND["Refund Router\neligibility + request"]
        CHAT["Chat Router"]
        NOTIF["Notifications Router"]
        PROFILE["Profile Router"]
        SVC["Service Layer\nrecovery_service · ai_service"]
    end

    subgraph AI["AI Layer"]
        MOCK["Rule-based mock\n(default, offline)"]
        LLM["OpenAI API\n(optional, if key present)"]
    end

    subgraph Data["Data Layer"]
        DB[("SQLite (dev)\nPostgres (prod)")]
    end

    subgraph External["External / Future Integrations"]
        PSS["Airline PSS / DCS\n(flight status, inventory)"]
        NOTIFY["Push/SMS/Email provider"]
        AGENT["Contact Center Handoff\n(CRM / ticketing)"]
    end

    UI --> CDN
    UI -- HTTPS/JSON --> LB
    LB --> AUTH & FLIGHT & REBOOK & REFUND & CHAT & NOTIF & PROFILE
    AUTH & FLIGHT & REBOOK & REFUND & NOTIF & PROFILE --> SVC
    CHAT --> SVC
    SVC --> DB
    CHAT --> MOCK
    CHAT -.optional.-> LLM
    SVC -.future.-> PSS
    NOTIF -.future.-> NOTIFY
    App -.escalation.-> AGENT
```

## Why this shape

**Thin client, fat service layer.** All disruption logic — what counts as a
disruption, how alternates are scored, whether a refund is owed — lives in
`services/recovery_service.py`, not in route handlers or the frontend. That
keeps the rules testable in isolation and reusable: the REST API and the AI
assistant both call the same scoring/eligibility functions, so a passenger
gets the same answer whether they tap a button or ask the chatbot.

**Stateless API, swappable data store.** FastAPI containers hold no session
state (the demo token is just an encoded booking id), so they scale
horizontally behind a load balancer. SQLite is used for local development and
grading convenience; the `DATABASE_URL` env var is the only change needed to
point at Postgres in production.

**AI is pluggable, not load-bearing.** The chat assistant defaults to a
deterministic rule-based responder so the whole demo works with zero external
dependencies and zero latency risk during judging. Setting `OPENAI_API_KEY`
swaps in real completions without any other code change, and the service
fails open back to the mock if the API call errors.

## Production hardening (beyond this MVP)

- **Auth**: replace the demo token with signed JWTs issued after PNR
  verification, short expiry, refresh flow.
- **Real flight data**: `flight-status` and `alternate-flights` would call
  the airline's PSS/DCS (e.g., Amadeus, Sabre) instead of the local DB;
  the service layer's interface wouldn't need to change.
- **Rate limiting & WAF** at the gateway to protect the login endpoint from
  PNR enumeration.
- **Observability**: structured logging + tracing per request, dashboards on
  rebook/refund conversion and AI deflection rate (see Business Understanding
  in the challenge brief — this is the metric the COO actually cares about).
- **Notifications**: wire `Notification` creation to a push/SMS/email
  provider (e.g., SNS, Twilio) instead of only writing a DB row.
- **Database**: Postgres with read replicas for status polling at scale
  during mass-disruption events (the 40%-of-passengers-call scenario is
  exactly when read load spikes hardest).
