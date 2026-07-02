"""
Pydantic schemas — API request/response contracts.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ExplanationFactor(BaseModel):
    label: str
    weight: Optional[int] = None
    delta: Optional[int] = None
    impact: str = "neutral"


class ExplanationOut(BaseModel):
    intent: Optional[str] = None
    factors: List[ExplanationFactor] = []
    summary: str = ""


class LoginRequest(BaseModel):
    pnr: str
    last_name: str


class FlightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    flight_number: str
    airline: str
    origin_code: str
    origin_city: str
    destination_code: str
    destination_city: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    estimated_departure: Optional[datetime] = None
    estimated_arrival: Optional[datetime] = None
    status: str
    gate: str
    terminal: str
    aircraft_type: str
    duration_minutes: int
    stops: int
    seats_available: int


class DisruptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: str
    reason: str
    reason_detail: Optional[str] = None
    delay_minutes: int
    announced_at: datetime


class PassengerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    frequent_flyer_tier: str
    frequent_flyer_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_seat: str
    preferred_meal: str
    language: str


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    pnr: str
    seat_number: str
    cabin_class: str
    fare_amount: float
    fare_type: str
    booking_date: datetime
    status: str
    is_primary: bool = False
    group_id: Optional[str] = None
    passenger: PassengerOut
    flight: FlightOut


class GroupMemberOut(BaseModel):
    booking_id: str
    pnr: str
    passenger_name: str
    seat_number: str
    status: str
    is_primary: bool


class LoginResponse(BaseModel):
    token: str
    booking: BookingOut
    group_members: List[GroupMemberOut] = []


class FlightStatusResponse(BaseModel):
    flight: FlightOut
    is_disrupted: bool
    disruption: Optional[DisruptionOut] = None


class AlternateFlightOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    flight_number: str
    airline: str
    origin_code: str
    origin_city: str
    destination_code: str
    destination_city: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    estimated_departure: Optional[datetime] = None
    estimated_arrival: Optional[datetime] = None
    status: str
    gate: str
    terminal: str
    aircraft_type: str
    duration_minutes: int
    stops: int
    seats_available: int
    recovery_score: int = 0
    score_factors: List[ExplanationFactor] = []


class AlternateFlightsResponse(BaseModel):
    original_flight: FlightOut
    options: List[AlternateFlightOption]
    recommended_flight_id: Optional[str] = None


class RebookRequest(BaseModel):
    booking_id: str
    new_flight_id: str


class RebookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str
    recovery_score: int
    created_at: datetime
    fare_difference: float
    new_flight: FlightOut
    score_factors: List[ExplanationFactor] = []
    explanation_summary: str = ""


class RefundRequest(BaseModel):
    booking_id: str
    refund_type: str = "Full"
    reason: Optional[str] = "Flight disruption"


class RefundEligibilityResponse(BaseModel):
    eligible: bool
    refund_type_options: List[str]
    estimated_amount: float
    estimated_processing_days: int
    policy_note: str
    factors: List[ExplanationFactor] = []
    explanation_summary: str = ""


class RefundOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    amount: float
    refund_type: str
    status: str
    estimated_processing_days: int
    reason: str
    created_at: datetime
    factors: List[ExplanationFactor] = []
    explanation_summary: str = ""


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: str
    title: str
    message: str
    created_at: datetime
    read: bool


class ChatRequest(BaseModel):
    booking_id: str
    message: str
    language: Optional[str] = "en"


class ChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    recommended_flight_id: Optional[str] = None
    intent: Optional[str] = None
    explanation: Optional[ExplanationOut] = None


class JourneyEventOut(BaseModel):
    id: str
    kind: str
    title: str
    detail: str
    at: str
    source: str
    status: str


class JourneyResponse(BaseModel):
    events: List[JourneyEventOut]


class VoucherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: str
    amount: float
    currency: str
    code: str
    status: str
    issued_reason: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


class BaggageScanOut(BaseModel):
    location: str
    status: str
    scanned_at: datetime


class BaggageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tag_number: str
    status: str
    last_scan_location: Optional[str] = None
    last_scan_at: Optional[datetime] = None
    weight_kg: float
    scans: List[BaggageScanOut] = []


class BoardingPassOut(BaseModel):
    booking_id: str
    pnr: str
    passenger_name: str
    flight_number: str
    origin_code: str
    destination_code: str
    seat: str
    gate: str
    terminal: str
    boarding_time: datetime
    departure_time: datetime
    barcode_data: str
    status: str


class BoardingPassScanRequest(BaseModel):
    booking_id: str
    gate_code: str


class BoardingPassScanResponse(BaseModel):
    valid: bool
    message: str
    scanned_at: datetime


class GroupRebookRequest(BaseModel):
    master_pnr: str
    new_flight_id: str
    booking_ids: List[str]


class GroupRefundRequest(BaseModel):
    master_pnr: str
    booking_ids: List[str]
    refund_type: str = "Full"


class GroupRecoveryResponse(BaseModel):
    success_count: int
    results: List[dict]


class AnalyticsSummary(BaseModel):
    deflection_rate: float
    rebook_conversion: float
    refund_volume_usd: float
    refund_count: int
    rebook_count: int
    total_disruptions: int
    total_chat_sessions: int
    avg_recovery_score: float
    trend_7d: List[dict]


class ProfileUpdateRequest(BaseModel):
    booking_id: str
    language: Optional[str] = None


class ProfileUpdateResponse(BaseModel):
    passenger: PassengerOut
