"""Localized AI reply templates for offline/demo mode."""

REPLIES = {
    "en": {
        "greeting": "Hi {name}! I'm here to help with flight {flight_no}. Ask about disruptions, rebooking, refunds, baggage, vouchers, hotels, boarding, or seats.",
        "disruption": "Flight {flight_no} is affected by {reason}. {detail}",
        "rebook_recommend": "I recommend flight {alt_flight} departing at {dep_time} — {seats} seats open. Recovery score: {score}/100.",
        "rebook_none": "No strong alternate yet — try a refund or waitlist.",
        "refund_eligible": "You're eligible for a refund. {note} Estimated: ${amount:.2f}.",
        "refund_ineligible": "{note} I'd suggest rebooking instead.",
        "baggage": "Bag {tag} is {status} — last seen at {location}.",
        "voucher": "You have {count} active voucher(s) worth ${total:.2f}. Check your Voucher Wallet.",
        "hotel": "Due to the disruption, a hotel voucher of ${amount:.2f} has been issued. Redeem in your Voucher Wallet.",
        "boarding": "Flight {flight_no} boards at Gate {gate}, Terminal {terminal}. Status: {status}.",
        "seat": "Your seat is {seat} ({cabin}). Preferred: {preferred}.",
        "faq": "SkyJet covers rebooking at no extra cost for airline-caused disruptions. Refunds follow our delay/cancellation policy. Vouchers auto-issue for long delays.",
        "agent": "I can connect you with a live agent. Would you like to escalate?",
        "fallback": "I can help with disruptions, rebooking, refunds, baggage, vouchers, hotels, boarding, seats, or general policy questions.",
    },
    "hi": {
        "greeting": "नमस्ते {name}! मैं फ़्लाइट {flight_no} में आपकी मदद के लिए यहाँ हूँ।",
        "disruption": "फ़्लाइट {flight_no} {reason} के कारण प्रभावित है। {detail}",
        "rebook_recommend": "मैं {alt_flight} की सलाह देता/देती हूँ — {dep_time} पर प्रस्थान, {seats} सीटें उपलब्ध।",
        "rebook_none": "अभी कोई अच्छा विकल्प नहीं — रिफंड या वेटलिस्ट आज़माएँ।",
        "refund_eligible": "आप रिफंड के पात्र हैं। अनुमानित: ${amount:.2f}।",
        "refund_ineligible": "{note} पुनः बुकिंग बेहतर विकल्प हो सकती है।",
        "baggage": "बैग {tag} — स्थिति: {status}, अंतिम स्कैन: {location}।",
        "voucher": "आपके पास {count} सक्रिय वाउचर (${total:.2f}) हैं।",
        "hotel": "विघ्न के कारण ${amount:.2f} का होटल वाउचर जारी किया गया।",
        "boarding": "फ़्लाइट {flight_no} — गेट {gate}, टर्मिनल {terminal}। स्थिति: {status}।",
        "seat": "आपकी सीट {seat} ({cabin})। पसंद: {preferred}।",
        "faq": "एयरलाइन-कारण विघ्न पर मुफ्त पुनः बुकिंग। रिफंड नीति देरी/रद्दीकरण पर आधारित।",
        "agent": "क्या आप लाइव एजेंट से बात करना चाहेंगे?",
        "fallback": "विघ्न, पुनः बुकिंग, रिफंड, सामान, वाउचर, होटल, बोर्डिंग, सीट — किस में मदद चाहिए?",
    },
    "es": {
        "greeting": "¡Hola {name}! Estoy aquí para ayudarte con el vuelo {flight_no}.",
        "disruption": "El vuelo {flight_no} está afectado por {reason}. {detail}",
        "rebook_recommend": "Recomiendo el vuelo {alt_flight} a las {dep_time} — {seats} asientos disponibles.",
        "rebook_none": "Sin alternativa clara — prueba reembolso o lista de espera.",
        "refund_eligible": "Eres elegible para reembolso. Estimado: ${amount:.2f}.",
        "refund_ineligible": "{note} Te sugiero re reservar.",
        "baggage": "Equipaje {tag}: {status}, última ubicación: {location}.",
        "voucher": "Tienes {count} cupón(es) activo(s) por ${total:.2f}.",
        "hotel": "Se emitió un cupón de hotel de ${amount:.2f} por la interrupción.",
        "boarding": "Vuelo {flight_no} — Puerta {gate}, Terminal {terminal}. Estado: {status}.",
        "seat": "Tu asiento es {seat} ({cabin}). Preferencia: {preferred}.",
        "faq": "Re reserva sin costo por interrupciones de la aerolínea. Reembolsos según política de retraso/cancelación.",
        "agent": "¿Quieres hablar con un agente?",
        "fallback": "Puedo ayudar con interrupciones, re reserva, reembolsos, equipaje, cupones, hotel, embarque o asientos.",
    },
}


def t(lang: str, key: str, **kwargs) -> str:
    lang = lang if lang in REPLIES else "en"
    template = REPLIES[lang].get(key, REPLIES["en"].get(key, key))
    try:
        return template.format(**kwargs)
    except KeyError:
        return template
