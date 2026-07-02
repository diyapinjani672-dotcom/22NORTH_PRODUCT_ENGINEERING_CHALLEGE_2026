"""
SkyJet Airways — Self-Service Flight Recovery API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.db import Base, engine
from routers import (
    auth, flights, rebook, refund, chat, notifications, profile,
    journey, vouchers, baggage, boarding_pass, group, analytics,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SkyJet Flight Recovery API",
    description="Self-service disruption recovery with AI, vouchers, baggage, and ops analytics.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(flights.router)
app.include_router(rebook.router)
app.include_router(refund.router)
app.include_router(chat.router)
app.include_router(notifications.router)
app.include_router(profile.router)
app.include_router(journey.router)
app.include_router(vouchers.router)
app.include_router(baggage.router)
app.include_router(boarding_pass.router)
app.include_router(group.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "skyjet-recovery-api", "version": "2.0.0"}
