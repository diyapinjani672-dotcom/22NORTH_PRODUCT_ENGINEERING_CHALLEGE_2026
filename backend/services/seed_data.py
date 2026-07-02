"""
Seeds the database with realistic demo data:
- 3 demo passengers/bookings (cancelled, delayed, on-time) so judges can see every state
- A pool of alternate flights for rebooking
- Sample disruptions and notifications

Run with: python -m services.seed_data
"""
from datetime import datetime, timedelta

from database.db import Base, engine, SessionLocal
from models.models import (
    Passenger, Flight, Booking, Disruption, Notification, FlightStatus,
    BookingGroup, Baggage, BaggageScan, Voucher, AnalyticsEvent,
)

CITIES = [
    ("BOM", "Mumbai"), ("DEL", "Delhi"), ("BLR", "Bengaluru"),
    ("SIN", "Singapore"), ("BKK", "Bangkok"), ("DXB", "Dubai"),
]


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    now = datetime.utcnow()

    # ---- Passengers ----
    p1 = Passenger(first_name="Aarav", last_name="Shah", email="aarav.shah@example.com",
                    phone="+91 98200 11223", frequent_flyer_tier="Gold",
                    frequent_flyer_number="SJ-GOLD-4471", emergency_contact_name="Priya Shah",
                    emergency_contact_phone="+91 98200 99887", preferred_seat="Window",
                    preferred_meal="Vegetarian")
    p2 = Passenger(first_name="Meera", last_name="Nair", email="meera.nair@example.com",
                    phone="+91 90210 55667", frequent_flyer_tier="Silver",
                    emergency_contact_name="Ravi Nair", emergency_contact_phone="+91 90210 11009",
                    preferred_seat="Aisle", preferred_meal="Standard")
    p3 = Passenger(first_name="Kabir", last_name="Mehta", email="kabir.mehta@example.com",
                    phone="+91 99887 22110", frequent_flyer_tier="Platinum",
                    frequent_flyer_number="SJ-PLAT-1092", emergency_contact_name="Anjali Mehta",
                    emergency_contact_phone="+91 99887 44332", preferred_seat="Window",
                    preferred_meal="Vegan")
    p4 = Passenger(first_name="Ishaan", last_name="Verma", email="ishaan.verma@example.com",
                    phone="+91 91234 55889", frequent_flyer_tier="Silver",
                    emergency_contact_name="Neha Verma", emergency_contact_phone="+91 91234 99001",
                    preferred_seat="Aisle", preferred_meal="Standard")
    p5 = Passenger(first_name="Zoya", last_name="Khan", email="zoya.khan@example.com",
                    phone="+91 90045 66771", frequent_flyer_tier="Gold",
                    frequent_flyer_number="SJ-GOLD-7723", emergency_contact_name="Imran Khan",
                    emergency_contact_phone="+91 90045 22110", preferred_seat="Window",
                    preferred_meal="Halal")
    p6 = Passenger(first_name="Rohan", last_name="Iyer", email="rohan.iyer@example.com",
                    phone="+91 98765 43210", frequent_flyer_tier="Silver",
                    emergency_contact_name="Divya Iyer", emergency_contact_phone="+91 98765 11223",
                    preferred_seat="Window", preferred_meal="Standard")
    p7 = Passenger(first_name="Ananya", last_name="Rao", email="ananya.rao@example.com",
                    phone="+91 99123 45678", frequent_flyer_tier="Platinum",
                    frequent_flyer_number="SJ-PLAT-3305", emergency_contact_name="Suresh Rao",
                    emergency_contact_phone="+91 99123 88990", preferred_seat="Aisle",
                    preferred_meal="Vegetarian")
    p8 = Passenger(first_name="Devika", last_name="Pillai", email="devika.pillai@example.com",
                    phone="+91 90876 54321", frequent_flyer_tier="Silver",
                    emergency_contact_name="Arjun Pillai", emergency_contact_phone="+91 90876 12233",
                    preferred_seat="Window", preferred_meal="Vegan")
    db.add_all([p1, p2, p3, p4, p5, p6, p7, p8])
    db.commit()

    # ---- Primary flights tied to the demo bookings ----
    f_cancelled = Flight(
        flight_number="SJ 202", origin_code="BOM", origin_city="Mumbai",
        destination_code="SIN", destination_city="Singapore",
        scheduled_departure=now + timedelta(hours=3), scheduled_arrival=now + timedelta(hours=9, minutes=30),
        status=FlightStatus.CANCELLED, gate="B12", terminal="T2", aircraft_type="A321neo",
        duration_minutes=390, stops=0, seats_available=0,
    )
    f_delayed = Flight(
        flight_number="SJ 118", origin_code="DEL", origin_city="Delhi",
        destination_code="DXB", destination_city="Dubai",
        scheduled_departure=now + timedelta(hours=2), scheduled_arrival=now + timedelta(hours=5, minutes=15),
        estimated_departure=now + timedelta(hours=5), estimated_arrival=now + timedelta(hours=8, minutes=15),
        status=FlightStatus.DELAYED, gate="C04", terminal="T3", aircraft_type="B737 MAX",
        duration_minutes=195, stops=0, seats_available=0,
    )
    f_ontime = Flight(
        flight_number="SJ 340", origin_code="BLR", origin_city="Bengaluru",
        destination_code="BKK", destination_city="Bangkok",
        scheduled_departure=now + timedelta(hours=5), scheduled_arrival=now + timedelta(hours=9),
        estimated_departure=now + timedelta(hours=5), estimated_arrival=now + timedelta(hours=9),
        status=FlightStatus.ON_TIME, gate="A21", terminal="T1", aircraft_type="A320",
        duration_minutes=240, stops=0, seats_available=45,
    )
    f_diverted = Flight(
        flight_number="SJ 556", origin_code="BLR", origin_city="Bengaluru",
        destination_code="DXB", destination_city="Dubai",
        scheduled_departure=now - timedelta(hours=1), scheduled_arrival=now + timedelta(hours=3),
        estimated_departure=now - timedelta(hours=1), estimated_arrival=now + timedelta(hours=4, minutes=30),
        status=FlightStatus.DIVERTED, gate="D02", terminal="T2", aircraft_type="A320neo",
        duration_minutes=240, stops=0, seats_available=0,
    )
    f_shortdelay = Flight(
        flight_number="SJ 275", origin_code="DEL", origin_city="Delhi",
        destination_code="BOM", destination_city="Mumbai",
        scheduled_departure=now + timedelta(hours=1, minutes=30), scheduled_arrival=now + timedelta(hours=3, minutes=45),
        estimated_departure=now + timedelta(hours=2, minutes=15), estimated_arrival=now + timedelta(hours=4, minutes=30),
        status=FlightStatus.DELAYED, gate="A08", terminal="T1", aircraft_type="A320",
        duration_minutes=135, stops=0, seats_available=0,
    )
    f_boarding = Flight(
        flight_number="SJ 410", origin_code="BOM", origin_city="Mumbai",
        destination_code="DEL", destination_city="Delhi",
        scheduled_departure=now + timedelta(minutes=45), scheduled_arrival=now + timedelta(hours=2, minutes=15),
        estimated_departure=now + timedelta(minutes=45), estimated_arrival=now + timedelta(hours=2, minutes=15),
        status=FlightStatus.BOARDING, gate="B03", terminal="T2", aircraft_type="A321",
        duration_minutes=90, stops=0, seats_available=12,
    )
    f_cancelled_flex = Flight(
        flight_number="SJ 630", origin_code="BLR", origin_city="Bengaluru",
        destination_code="SIN", destination_city="Singapore",
        scheduled_departure=now + timedelta(hours=4), scheduled_arrival=now + timedelta(hours=8, minutes=20),
        status=FlightStatus.CANCELLED, gate="A14", terminal="T1", aircraft_type="B787",
        duration_minutes=260, stops=0, seats_available=0,
    )
    f_basic_ontime = Flight(
        flight_number="SJ 512", origin_code="DEL", origin_city="Delhi",
        destination_code="BKK", destination_city="Bangkok",
        scheduled_departure=now + timedelta(hours=6), scheduled_arrival=now + timedelta(hours=10, minutes=30),
        estimated_departure=now + timedelta(hours=6), estimated_arrival=now + timedelta(hours=10, minutes=30),
        status=FlightStatus.ON_TIME, gate="C11", terminal="T3", aircraft_type="A320",
        duration_minutes=270, stops=0, seats_available=30,
    )
    db.add_all([f_cancelled, f_delayed, f_ontime, f_diverted, f_shortdelay, f_boarding, f_cancelled_flex, f_basic_ontime])
    db.commit()

    # ---- Bookings ----
    b1 = Booking(pnr="SKY4A9", passenger_id=p1.id, flight_id=f_cancelled.id, seat_number="14A",
                 cabin_class="Economy", fare_amount=210.0, fare_type="Standard")
    b2 = Booking(pnr="SKY7X2", passenger_id=p2.id, flight_id=f_delayed.id, seat_number="22C",
                 cabin_class="Economy", fare_amount=175.0, fare_type="Basic")
    b3 = Booking(pnr="SKY9Q1", passenger_id=p3.id, flight_id=f_ontime.id, seat_number="3A",
                 cabin_class="Business", fare_amount=560.0, fare_type="Flex")
    b4 = Booking(pnr="SKY3L7", passenger_id=p4.id, flight_id=f_diverted.id, seat_number="18B",
                 cabin_class="Economy", fare_amount=245.0, fare_type="Standard")
    b5 = Booking(pnr="SKY8M4", passenger_id=p5.id, flight_id=f_shortdelay.id, seat_number="9C",
                 cabin_class="Economy", fare_amount=95.0, fare_type="Standard")
    b6 = Booking(pnr="SKY1B6", passenger_id=p6.id, flight_id=f_boarding.id, seat_number="21A",
                 cabin_class="Economy", fare_amount=88.0, fare_type="Basic")
    b7 = Booking(pnr="SKY6D3", passenger_id=p7.id, flight_id=f_cancelled_flex.id, seat_number="2A",
                 cabin_class="Business", fare_amount=640.0, fare_type="Flex")
    b8 = Booking(pnr="SKY2F9", passenger_id=p8.id, flight_id=f_basic_ontime.id, seat_number="15D",
                 cabin_class="Economy", fare_amount=130.0, fare_type="Basic")
    db.add_all([b1, b2, b3, b4, b5, b6, b7, b8])
    db.commit()

    # ---- Family group (Shah family on cancelled BOM->SIN flight) ----
    grp_shah = BookingGroup(master_pnr="SKY4A9", name="Shah Family")
    db.add(grp_shah)
    db.commit()

    p1b = Passenger(first_name="Priya", last_name="Shah", email="priya.shah@example.com",
                    phone="+91 98200 99887", frequent_flyer_tier="Silver",
                    preferred_seat="Aisle", preferred_meal="Vegetarian", language="hi")
    p1c = Passenger(first_name="Ravi", last_name="Shah", email="ravi.shah@example.com",
                    phone="+91 98200 33445", frequent_flyer_tier="Silver",
                    preferred_seat="Window", preferred_meal="Standard", language="en")
    db.add_all([p1b, p1c])
    db.commit()

    b1b = Booking(pnr="SKY4B2", passenger_id=p1b.id, flight_id=f_cancelled.id,
                  group_id=grp_shah.id, is_primary=False, seat_number="14B",
                  cabin_class="Economy", fare_amount=210.0, fare_type="Standard")
    b1c = Booking(pnr="SKY4C7", passenger_id=p1c.id, flight_id=f_cancelled.id,
                  group_id=grp_shah.id, is_primary=False, seat_number="14C",
                  cabin_class="Economy", fare_amount=180.0, fare_type="Standard")
    b1.group_id = grp_shah.id
    b1.is_primary = True
    db.add_all([b1b, b1c])
    db.commit()

    # ---- Baggage for demo bookings ----
    bag1 = Baggage(booking_id=b1.id, tag_number="SJ0123456789", status="DELAYED",
                   last_scan_location="BOM Terminal 2", last_scan_at=now - timedelta(minutes=30),
                   weight_kg=23.0)
    bag2 = Baggage(booking_id=b2.id, tag_number="SJ0987654321", status="IN_TRANSIT",
                   last_scan_location="DEL Terminal 3", last_scan_at=now - timedelta(minutes=10),
                   weight_kg=18.5)
    bag3 = Baggage(booking_id=b6.id, tag_number="SJ0555123456", status="LOADED",
                   last_scan_location="BOM Gate B03", last_scan_at=now - timedelta(minutes=5),
                   weight_kg=15.0)
    db.add_all([bag1, bag2, bag3])
    db.commit()

    for bag, locs in [
        (bag1, [
            ("BOM Check-in", "CHECKED_IN", now - timedelta(hours=2)),
            ("BOM Sorting", "IN_TRANSIT", now - timedelta(hours=1)),
            ("BOM Terminal 2", "DELAYED", now - timedelta(minutes=30)),
        ]),
        (bag2, [
            ("DEL Check-in", "CHECKED_IN", now - timedelta(hours=3)),
            ("DEL Terminal 3", "IN_TRANSIT", now - timedelta(minutes=10)),
        ]),
        (bag3, [
            ("BOM Check-in", "CHECKED_IN", now - timedelta(hours=1)),
            ("BOM Gate B03", "LOADED", now - timedelta(minutes=5)),
        ]),
    ]:
        for loc, st, ts in locs:
            db.add(BaggageScan(baggage_id=bag.id, location=loc, status=st, scanned_at=ts))
    db.commit()

    # ---- Pre-seeded vouchers for disrupted bookings ----
    db.add_all([
        Voucher(booking_id=b1.id, type="MEAL", amount=25.0, code="MEAL-SKY4A9A1",
                status="ACTIVE", issued_reason="Flight cancellation", expires_at=now + timedelta(days=7)),
        Voucher(booking_id=b1.id, type="HOTEL", amount=150.0, code="HOTEL-SKY4A9B2",
                status="ACTIVE", issued_reason="Overnight stay", expires_at=now + timedelta(days=8)),
        Voucher(booking_id=b2.id, type="MEAL", amount=20.0, code="MEAL-SKY7X2C3",
                status="ACTIVE", issued_reason="Extended delay", expires_at=now + timedelta(days=7)),
    ])
    db.commit()

    # ---- Analytics seed events ----
    for evt_type, bid in [
        ("chat_message", b1.id), ("chat_message", b1.id), ("chat_message", b2.id),
        ("rebook", b3.id), ("refund", b7.id), ("chat_message", b4.id),
    ]:
        db.add(AnalyticsEvent(event_type=evt_type, booking_id=bid))
    db.commit()

    # ---- Disruptions ----
    db.add(Disruption(
        flight_id=f_cancelled.id, type="CANCELLATION", reason="WEATHER",
        reason_detail="Severe thunderstorms and low visibility at Singapore Changi Airport have "
                       "forced a full ground stop on inbound traffic.",
        delay_minutes=0, announced_at=now - timedelta(minutes=40),
    ))
    db.add(Disruption(
        flight_id=f_delayed.id, type="DELAY", reason="TECHNICAL",
        reason_detail="A routine pre-flight maintenance check identified an issue requiring "
                       "additional inspection before departure.",
        delay_minutes=225, announced_at=now - timedelta(minutes=25),
    ))
    db.add(Disruption(
        flight_id=f_diverted.id, type="DIVERSION", reason="WEATHER",
        reason_detail="Flight SJ 556 was diverted en route due to an unexpected sandstorm near "
                       "Dubai and is now re-routing to land after a short ground hold.",
        delay_minutes=90, announced_at=now - timedelta(hours=1, minutes=10),
    ))
    db.add(Disruption(
        flight_id=f_shortdelay.id, type="DELAY", reason="ATC",
        reason_detail="Air traffic control has issued a short ground delay program at Delhi due "
                       "to runway congestion.",
        delay_minutes=45, announced_at=now - timedelta(minutes=20),
    ))
    db.add(Disruption(
        flight_id=f_cancelled_flex.id, type="CANCELLATION", reason="CREW",
        reason_detail="Flight SJ 630 is cancelled due to a crew duty-time limitation with no "
                       "standby crew available in time for departure.",
        delay_minutes=0, announced_at=now - timedelta(minutes=55),
    ))
    db.commit()

    # ---- Alternate flight pool (rebooking candidates across all disrupted routes) ----
    alt_flights = [
        # BOM -> SIN (for f_cancelled)
        Flight(flight_number="SJ 204", origin_code="BOM", origin_city="Mumbai",
               destination_code="SIN", destination_city="Singapore",
               scheduled_departure=now + timedelta(hours=6), scheduled_arrival=now + timedelta(hours=12, minutes=30),
               status=FlightStatus.ON_TIME, gate="B14", terminal="T2", aircraft_type="A321neo",
               duration_minutes=390, stops=0, seats_available=18),
        Flight(flight_number="SJ 812", origin_code="BOM", origin_city="Mumbai",
               destination_code="SIN", destination_city="Singapore",
               scheduled_departure=now + timedelta(hours=9), scheduled_arrival=now + timedelta(hours=17),
               status=FlightStatus.ON_TIME, gate="B08", terminal="T2", aircraft_type="B787",
               duration_minutes=330, stops=1, seats_available=42),
        Flight(flight_number="SJ 226", origin_code="BOM", origin_city="Mumbai",
               destination_code="SIN", destination_city="Singapore",
               scheduled_departure=now + timedelta(hours=26), scheduled_arrival=now + timedelta(hours=32, minutes=30),
               status=FlightStatus.ON_TIME, gate="B12", terminal="T2", aircraft_type="A321neo",
               duration_minutes=390, stops=0, seats_available=3),

        # DEL -> DXB (for f_delayed)
        Flight(flight_number="SJ 122", origin_code="DEL", origin_city="Delhi",
               destination_code="DXB", destination_city="Dubai",
               scheduled_departure=now + timedelta(hours=4), scheduled_arrival=now + timedelta(hours=7, minutes=15),
               status=FlightStatus.ON_TIME, gate="C06", terminal="T3", aircraft_type="B737 MAX",
               duration_minutes=195, stops=0, seats_available=27),
        Flight(flight_number="SJ 990", origin_code="DEL", origin_city="Delhi",
               destination_code="DXB", destination_city="Dubai",
               scheduled_departure=now + timedelta(hours=10), scheduled_arrival=now + timedelta(hours=13, minutes=15),
               status=FlightStatus.ON_TIME, gate="C09", terminal="T3", aircraft_type="A320",
               duration_minutes=195, stops=0, seats_available=9),

        # BLR -> DXB (for f_diverted)
        Flight(flight_number="SJ 558", origin_code="BLR", origin_city="Bengaluru",
               destination_code="DXB", destination_city="Dubai",
               scheduled_departure=now + timedelta(hours=2), scheduled_arrival=now + timedelta(hours=6),
               status=FlightStatus.ON_TIME, gate="D04", terminal="T2", aircraft_type="A320neo",
               duration_minutes=240, stops=0, seats_available=22),
        Flight(flight_number="SJ 780", origin_code="BLR", origin_city="Bengaluru",
               destination_code="DXB", destination_city="Dubai",
               scheduled_departure=now + timedelta(hours=8), scheduled_arrival=now + timedelta(hours=12, minutes=45),
               status=FlightStatus.ON_TIME, gate="D01", terminal="T2", aircraft_type="A321neo",
               duration_minutes=225, stops=0, seats_available=6),

        # DEL -> BOM (for f_shortdelay)
        Flight(flight_number="SJ 277", origin_code="DEL", origin_city="Delhi",
               destination_code="BOM", destination_city="Mumbai",
               scheduled_departure=now + timedelta(hours=3), scheduled_arrival=now + timedelta(hours=5, minutes=15),
               status=FlightStatus.ON_TIME, gate="A10", terminal="T1", aircraft_type="A320",
               duration_minutes=135, stops=0, seats_available=33),

        # BLR -> SIN (for f_cancelled_flex)
        Flight(flight_number="SJ 632", origin_code="BLR", origin_city="Bengaluru",
               destination_code="SIN", destination_city="Singapore",
               scheduled_departure=now + timedelta(hours=7), scheduled_arrival=now + timedelta(hours=11, minutes=20),
               status=FlightStatus.ON_TIME, gate="A16", terminal="T1", aircraft_type="B787",
               duration_minutes=260, stops=0, seats_available=14),
        Flight(flight_number="SJ 640", origin_code="BLR", origin_city="Bengaluru",
               destination_code="SIN", destination_city="Singapore",
               scheduled_departure=now + timedelta(hours=13), scheduled_arrival=now + timedelta(hours=18, minutes=10),
               status=FlightStatus.ON_TIME, gate="A18", terminal="T1", aircraft_type="A321neo",
               duration_minutes=290, stops=1, seats_available=40),
    ]
    db.add_all(alt_flights)
    db.commit()

    # ---- Notifications ----
    notifications = [
        Notification(booking_id=b1.id, type="CANCELLATION", title="Flight Cancelled",
                     message="SJ 202 (BOM → SIN) has been cancelled due to weather. "
                             "We're finding recovery options for you now.",
                     created_at=now - timedelta(minutes=38)),
        Notification(booking_id=b1.id, type="REBOOKING", title="Recovery Options Ready",
                     message="We found 3 alternate flights to get you to Singapore.",
                     created_at=now - timedelta(minutes=30)),
        Notification(booking_id=b2.id, type="DELAY", title="Flight Delayed",
                     message="SJ 118 (DEL → DXB) is delayed by 3h 45m due to a technical inspection.",
                     created_at=now - timedelta(minutes=23)),
        Notification(booking_id=b2.id, type="GATE_CHANGE", title="Gate Changed",
                     message="Your departure gate has changed to C04.",
                     created_at=now - timedelta(minutes=15)),
        Notification(booking_id=b3.id, type="BOARDING", title="Boarding Reminder",
                     message="SJ 340 (BLR → BKK) boards in 90 minutes at gate A21.",
                     created_at=now - timedelta(minutes=5)),
        Notification(booking_id=b4.id, type="DELAY", title="Flight Diverted",
                     message="SJ 556 (BLR → DXB) was diverted due to weather and is re-routing. "
                             "Expect a 90-minute delay on arrival.",
                     created_at=now - timedelta(hours=1, minutes=5)),
        Notification(booking_id=b5.id, type="DELAY", title="Short Delay",
                     message="SJ 275 (DEL → BOM) is delayed by 45 minutes due to ATC congestion.",
                     created_at=now - timedelta(minutes=18)),
        Notification(booking_id=b6.id, type="BOARDING", title="Boarding Now",
                     message="SJ 410 (BOM → DEL) is now boarding at gate B03.",
                     created_at=now - timedelta(minutes=2)),
        Notification(booking_id=b7.id, type="CANCELLATION", title="Flight Cancelled",
                     message="SJ 630 (BLR → SIN) has been cancelled due to a crew duty-time limit.",
                     created_at=now - timedelta(minutes=50)),
    ]
    db.add_all(notifications)
    db.commit()

    print("Seed complete.")
    print("Demo logins:")
    print(f"  Cancelled (Standard fare)      -> PNR: SKY4A9 | Last name: Shah  [FAMILY GROUP: SKY4B2, SKY4C7]")
    print(f"  Delayed 3h45m (Basic fare)      -> PNR: SKY7X2 | Last name: Nair")
    print(f"  On time (Flex, Business)        -> PNR: SKY9Q1 | Last name: Mehta")
    print(f"  Diverted                        -> PNR: SKY3L7 | Last name: Verma")
    print(f"  Delayed 45m (edge case, <60min) -> PNR: SKY8M4 | Last name: Khan")
    print(f"  Boarding now (Basic fare)       -> PNR: SKY1B6 | Last name: Iyer")
    print(f"  Cancelled (Flex, Business)      -> PNR: SKY6D3 | Last name: Rao")
    print(f"  On time (Basic fare)            -> PNR: SKY2F9 | Last name: Pillai")

    db.close()


if __name__ == "__main__":
    seed()
