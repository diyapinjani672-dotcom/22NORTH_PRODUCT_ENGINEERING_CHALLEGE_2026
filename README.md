# SkyJet Flight Recovery MVP v2

Self-service disruption recovery platform with AI assistant, explainability, vouchers, baggage tracking, boarding pass, family recovery, and ops analytics.

## Features

- **Live Journey Timeline** — scheduled milestones + disruptions + notifications
- **Explainable AI** — factor breakdown on refunds, rebook scores, and chat replies
- **Smarter AI** — baggage, vouchers, hotel, boarding, seat, FAQ intents + EN/HI/ES replies
- **Proactive notifications** — 30s background polling with toast alerts
- **Family/group recovery** — rebook or refund multiple passengers in one action
- **Voucher wallet** — auto-issued meal/hotel/lounge vouchers, redeemable
- **Multi-language UI** — English, Hindi, Spanish switcher in navbar
- **Ops Analytics Dashboard** — deflection rate, rebook conversion, refund volume (`/ops`)
- **Baggage tracking** — tag status with scan history
- **Digital boarding pass** — barcode + gate scan simulation

## Quick Start

### Backend

```bash
cd backend
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m services.seed_data   # reset demo data
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

## Demo Logins

| Scenario | PNR | Last Name |
|----------|-----|-----------|
| Cancelled + family group | SKY4A9 | Shah |
| Delayed 3h45m | SKY7X2 | Nair |
| On time | SKY9Q1 | Mehta |
| Boarding now | SKY1B6 | Iyer |
| Diverted | SKY3L7 | Verma |

## API Endpoints (new in v2)

- `GET /api/journey` — merged timeline
- `GET /api/vouchers`, `POST /api/vouchers/{id}/redeem`
- `GET /api/baggage`
- `GET /api/boarding-pass`, `POST /api/boarding-pass/scan`
- `GET /api/group`, `POST /api/group/rebook`, `POST /api/group/refund`
- `GET /api/analytics/summary`
- `GET /api/notifications?since=` — polling support
- `PATCH /api/profile` — update language
