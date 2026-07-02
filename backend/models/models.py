"""
SQLAlchemy models for the SkyJet Flight Recovery platform.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship

from database.db import Base


def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


class FlightStatus(str, enum.Enum):
    ON_TIME = "ON_TIME"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"
    DIVERTED = "DIVERTED"
    BOARDING = "BOARDING"
    DEPARTED = "DEPARTED"
    LANDED = "LANDED"


class RebookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class RefundStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    PROCESSING = "PROCESSING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(String, primary_key=True, default=lambda: gen_id("pax"))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False, index=True)
    email = Column(String)
    phone = Column(String)
    frequent_flyer_tier = Column(String, default="Silver")
    frequent_flyer_number = Column(String)
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    preferred_seat = Column(String, default="Window")
    preferred_meal = Column(String, default="Standard")
    language = Column(String, default="en")

    bookings = relationship("Booking", back_populates="passenger")


class Flight(Base):
    __tablename__ = "flights"

    id = Column(String, primary_key=True, default=lambda: gen_id("flt"))
    flight_number = Column(String, nullable=False, index=True)
    airline = Column(String, default="SkyJet Airways")
    origin_code = Column(String, nullable=False)
    origin_city = Column(String, nullable=False)
    destination_code = Column(String, nullable=False)
    destination_city = Column(String, nullable=False)
    scheduled_departure = Column(DateTime, nullable=False)
    scheduled_arrival = Column(DateTime, nullable=False)
    estimated_departure = Column(DateTime, nullable=True)
    estimated_arrival = Column(DateTime, nullable=True)
    status = Column(Enum(FlightStatus), default=FlightStatus.ON_TIME)
    gate = Column(String, default="TBD")
    terminal = Column(String, default="T1")
    aircraft_type = Column(String, default="A320")
    duration_minutes = Column(Integer, default=120)
    stops = Column(Integer, default=0)
    seats_available = Column(Integer, default=0)

    bookings = relationship("Booking", back_populates="flight", foreign_keys="Booking.flight_id")


class BookingGroup(Base):
    __tablename__ = "booking_groups"

    id = Column(String, primary_key=True, default=lambda: gen_id("grp"))
    master_pnr = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, default="Family Booking")

    bookings = relationship("Booking", back_populates="group")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: gen_id("bkg"))
    pnr = Column(String, unique=True, nullable=False, index=True)
    passenger_id = Column(String, ForeignKey("passengers.id"))
    flight_id = Column(String, ForeignKey("flights.id"))
    group_id = Column(String, ForeignKey("booking_groups.id"), nullable=True)
    is_primary = Column(Boolean, default=False)
    seat_number = Column(String, default="12A")
    cabin_class = Column(String, default="Economy")
    fare_amount = Column(Float, default=150.0)
    fare_type = Column(String, default="Standard")
    booking_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="CONFIRMED")

    passenger = relationship("Passenger", back_populates="bookings")
    flight = relationship("Flight", back_populates="bookings", foreign_keys=[flight_id])
    group = relationship("BookingGroup", back_populates="bookings")


class Disruption(Base):
    __tablename__ = "disruptions"

    id = Column(String, primary_key=True, default=lambda: gen_id("dis"))
    flight_id = Column(String, ForeignKey("flights.id"))
    type = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    reason_detail = Column(Text)
    delay_minutes = Column(Integer, default=0)
    announced_at = Column(DateTime, default=datetime.utcnow)


class Rebooking(Base):
    __tablename__ = "rebookings"

    id = Column(String, primary_key=True, default=lambda: gen_id("rbk"))
    original_booking_id = Column(String, ForeignKey("bookings.id"))
    new_flight_id = Column(String, ForeignKey("flights.id"))
    status = Column(Enum(RebookingStatus), default=RebookingStatus.CONFIRMED)
    recovery_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    fare_difference = Column(Float, default=0.0)

    new_flight = relationship("Flight", foreign_keys=[new_flight_id])
    original_booking = relationship("Booking", foreign_keys=[original_booking_id])


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(String, primary_key=True, default=lambda: gen_id("rfd"))
    booking_id = Column(String, ForeignKey("bookings.id"))
    amount = Column(Float, default=0.0)
    refund_type = Column(String, default="Full")
    status = Column(Enum(RefundStatus), default=RefundStatus.REQUESTED)
    estimated_processing_days = Column(Integer, default=7)
    reason = Column(String, default="Flight disruption")
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: gen_id("ntf"))
    booking_id = Column(String, ForeignKey("bookings.id"))
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: gen_id("msg"))
    booking_id = Column(String, ForeignKey("bookings.id"))
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    intent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(String, primary_key=True, default=lambda: gen_id("vch"))
    booking_id = Column(String, ForeignKey("bookings.id"))
    type = Column(String, nullable=False)  # MEAL, HOTEL, LOUNGE
    amount = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    code = Column(String, unique=True, nullable=False)
    status = Column(String, default="ACTIVE")  # ACTIVE, REDEEMED, EXPIRED
    issued_reason = Column(String)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class Baggage(Base):
    __tablename__ = "baggage"

    id = Column(String, primary_key=True, default=lambda: gen_id("bag"))
    booking_id = Column(String, ForeignKey("bookings.id"))
    tag_number = Column(String, nullable=False)
    status = Column(String, default="CHECKED_IN")
    last_scan_location = Column(String)
    last_scan_at = Column(DateTime)
    weight_kg = Column(Float, default=23.0)


class BaggageScan(Base):
    __tablename__ = "baggage_scans"

    id = Column(String, primary_key=True, default=lambda: gen_id("bsc"))
    baggage_id = Column(String, ForeignKey("baggage.id"))
    location = Column(String, nullable=False)
    status = Column(String, nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow)


class BoardingPassScan(Base):
    __tablename__ = "boarding_pass_scans"

    id = Column(String, primary_key=True, default=lambda: gen_id("bps"))
    booking_id = Column(String, ForeignKey("bookings.id"))
    gate_code = Column(String)
    valid = Column(Boolean, default=True)
    message = Column(String)
    scanned_at = Column(DateTime, default=datetime.utcnow)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(String, primary_key=True, default=lambda: gen_id("evt"))
    event_type = Column(String, nullable=False)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=True)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
