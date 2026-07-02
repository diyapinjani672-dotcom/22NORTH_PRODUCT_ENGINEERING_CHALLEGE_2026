# Key Assumptions

## Product scope

- **Disruption types**: Delay and Cancellation are fully modeled and
  surfaced in the UI. Diversion exists in the data model for future work but
  has no dedicated UI treatment yet, given the 48-hour window.
- **One passenger per booking** for the MVP (no group/multi-passenger PNR
  flows) — group bookings are explicitly routed to "Contact Agent."
- **Domestic/regional network**: alternate-flight search only looks at
  flights sharing the exact same origin/destination pair as the original.
  Multi-city reroutes (e.g., via a connection) are out of scope.
- **No payment integration**, per the brief's constraint — refunds are
  simulated: eligibility is calculated for real from policy rules, but
  submitting a refund only writes a database record and a notification, no
  money moves.

## Auth & security

- Login is PNR + last name, matching the brief ("no real authentication
  service is needed"). The returned "token" is a base64-encoded booking id —
  sufficient to demo protected routes, but **not** production-grade auth.
  Production would need signed, expiring tokens and rate limiting on login
  to prevent PNR enumeration.
- No password reset, MFA, or account-level login (bookings, not accounts,
  are the unit of access) — consistent with how most airline self-service
  portals actually work pre-login.

## Data & business rules

- **Refund policy** (see `services/recovery_service.py::refund_eligibility`)
  is a simplified, explainable rule set for demo purposes:
  cancelled → full refund; delayed 3h+ → full refund; delayed 1–3h → partial
  refund or travel credit; Basic fares with no disruption → not eligible.
  A real policy engine would be more nuanced (fare rules by market, DOT/EU261
  style regulatory requirements, etc.) but the shape — transparent,
  rule-driven eligibility a passenger can see the reasoning for — is meant to
  carry over directly.
- **Recovery Score** (0–100) is a simple weighted heuristic (time proximity,
  stops, seat scarcity) chosen for explainability over sophistication; it's
  designed to be replaceable with a more advanced model without changing the
  API contract.
- Flight/passenger data is **mocked and seeded** (`services/seed_data.py`),
  standing in for the real Passenger/Flight APIs mentioned in the brief.
  The service layer is written so those seed-backed queries could be swapped
  for real PSS/DCS API calls without changing router or frontend code.

## AI assistant

- Defaults to a **deterministic rule-based responder** (no external API
  calls) so the demo is fully reproducible and has zero latency/cost risk
  during judging. Setting `OPENAI_API_KEY` upgrades it to real LLM
  completions with no other code changes — and it fails open back to the
  mock if that call errors, so the assistant never goes down.

## Non-functional

- SQLite for local dev; the codebase is Postgres-ready via `DATABASE_URL`
  with no model changes required.
- No CI/CD pipeline was set up in the 48-hour window; see `ARCHITECTURE.md`
  for what production hardening would add (JWT auth, observability, real
  data integrations, notification delivery).
