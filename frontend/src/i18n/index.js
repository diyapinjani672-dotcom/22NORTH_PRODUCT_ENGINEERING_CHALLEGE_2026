import en from './locales/en.json'
import hi from './locales/hi.json'
import es from './locales/es.json'

const translations = { en, hi, es }

export function t(locale, key) {
  if (!key) return ''
  
  // Convert key to string if it isn't
  const strKey = String(key).trim()

  // 1. Try exact match in translations
  const exact = translations[locale]?.[strKey] ?? translations.en?.[strKey]
  if (exact !== undefined) return exact

  // 2. If it's not in the JSON but we are in 'en', return key as-is
  if (!locale || locale === 'en') return strKey

  // 3. Fallback pattern matching for dynamic values
  const patterns = {
    hi: [
      { regex: /^Departure (\d+) min from original$/i, rep: 'मूल उड़ान से $1 मिनट का अंतर' },
      { regex: /^Only (\d+) seats left$/i, rep: 'केवल $1 सीटें बची हैं' },
      { regex: /^(\d+) seats available$/i, rep: '$1 सीटें उपलब्ध हैं' },
      { regex: /^Delay of (\d+) minutes \(3\+ hours\)$/i, rep: '$1 मिनट की देरी (3+ घंटे)' },
      { regex: /^Delay of (\d+) minutes \(1–3 hours\)$/i, rep: '$1 मिनट की देरी (1-3 घंटे)' },
      { regex: /^Delay only (\d+) minutes$/i, rep: 'देरी केवल $1 मिनट' },
      { regex: /^Your flight is delayed by (\d+) minutes\.$/i, rep: 'आपकी उड़ान $1 मिनट विलंबित है।' },
      { regex: /^Your flight is delayed by (\d+) minutes \(3\+ hours\), qualifying for a full refund under our extended-delay policy\.$/i, rep: 'आपकी उड़ान $1 मिनट (3+ घंटे) विलंबित है, जो हमारी विस्तारित देरी नीति के तहत पूर्ण रिफंड के लिए योग्य है।' },
      { regex: /^Your flight is delayed by (\d+) minutes\. You qualify for a partial refund or travel credit\.$/i, rep: 'आपकी उड़ान $1 मिनट विलंबित है। आप आंशिक रिफंड या यात्रा क्रेडिट के पात्र हैं।' },
      { regex: /^Delay of (\d+) minutes is below the 60-minute refund threshold\.$/i, rep: '$1 मिनट की देरी 60 मिनट की रिफंड सीमा से कम है।' },
      { regex: /^Rebook (\d+) passenger\(s\)$/i, rep: '$1 यात्री(यों) को पुनः बुक करें' },
      { regex: /^Refund (\d+) passenger\(s\)$/i, rep: '$1 यात्री(यों) का रिफंड करें' },
      { regex: /^Rebooked (\d+) passenger\(s\)!$/i, rep: '$1 यात्री(यों) को सफलतापूर्वक पुनः बुक किया गया!' },
      { regex: /^Refund initiated for (\d+) passenger\(s\)!$/i, rep: '$1 यात्री(यों) के लिए रिफंड प्रक्रिया शुरू की गई!' },
      { regex: /^(\d+) of (\d+) passengers processed\.$/i, rep: '$2 में से $1 यात्रियों की प्रक्रिया पूरी हो चुकी है।' },
      { regex: /^1 bag \((\d+)kg\) checked at desk (\d+)$/i, rep: 'डेस्क $2 पर 1 बैग ($1kg) चेक किया गया' },
      { regex: /^Bag arrived at Carousel (\d+)$/i, rep: 'सामान कैरोसेल $1 पर आ गया है' },
      { regex: /^Auto-issued based on disruption severity · (\d+) active · \$([\d.]+) total value$/i, rep: 'विघ्न की गंभीरता के आधार पर स्वतः जारी · $1 सक्रिय · कुल मूल्य $$2' },
      { regex: /^Estimated departure revised to (\d{2}:\d{2})$/i, rep: 'अनुमानित प्रस्थान समय बदलकर $1 किया गया' },
      { regex: /^Gate changed from (\d+) to (\d+)$/i, rep: 'गेट $1 से बदलकर $2 हो गया है' },
      { regex: /^Boards in (\d+) minutes at gate ([A-Z0-9]+)$/i, rep: 'गेट $2 पर $1 मिनट में बोर्डिंग शुरू' },
      { regex: /^Meal voucher issued \(\$([\d.]+)\)$/i, rep: 'भोजन वाउचर जारी ($$1)' },
      { regex: /^Hotel voucher issued \(\$([\d.]+)\)$/i, rep: 'होटल वाउचर जारी ($$1)' },
      { regex: /^Rebooked to flight ([A-Z0-9 ]+)$/i, rep: 'फ्लाइट $1 पर पुनः बुक किया गया' },
      { regex: /^Estimated: \$([\d.]+)\.$/i, rep: 'अनुमानित: $$1.' },
      { regex: /^\((.*)\) — ~(\d+) days\.$/i, rep: '($1) — ~$2 दिन।' },
      { regex: /^Confirmed on flight (.*), departing (.*)\.$/i, rep: 'फ़्लाइट $1 पर पुष्टि की गई, प्रस्थान: $2.' },
      { regex: /^Check in for (.*) from (.*)$/i, rep: '$2 से $1 के लिए चेक-इन करें' },
      { regex: /^Gate (.*), Terminal (.*)$/i, rep: 'गेट $1, टर्मिनल $2' },
      { regex: /^(\d+) stop\(s\) vs nonstop$/i, rep: 'बिना स्टॉप के मुकाबले $1 स्टॉप' },
      { regex: /^(\d+) stop$/i, rep: '$1 स्टॉप' },
      { regex: /^(\d+) stops$/i, rep: '$1 स्टॉप' }
    ],
    es: [
      { regex: /^Departure (\d+) min from original$/i, rep: 'Salida a $1 min del original' },
      { regex: /^Only (\d+) seats left$/i, rep: 'Solo quedan $1 asientos' },
      { regex: /^(\d+) seats available$/i, rep: '$1 asientos disponibles' },
      { regex: /^Delay of (\d+) minutes \(3\+ hours\)$/i, rep: 'Retraso de $1 minutos (3+ horas)' },
      { regex: /^Delay of (\d+) minutes \(1–3 hours\)$/i, rep: 'Retraso de $1 minutos (1–3 horas)' },
      { regex: /^Delay only (\d+) minutes$/i, rep: 'Retraso de solo $1 minutos' },
      { regex: /^Your flight is delayed by (\d+) minutes\.$/i, rep: 'Su vuelo tiene un retraso de $1 minutos.' },
      { regex: /^Your flight is delayed by (\d+) minutes \(3\+ hours\), qualifying for a full refund under our extended-delay policy\.$/i, rep: 'Su vuelo tiene un retraso de $1 minutos (3+ horas), lo que califica para un reembolso completo bajo nuestra política de retraso extendido.' },
      { regex: /^Your flight is delayed by (\d+) minutes\. You qualify for a partial refund or travel credit\.$/i, rep: 'Su vuelo tiene un retraso de $1 minutos. Califica para un reembolso parcial o crédito de viaje.' },
      { regex: /^Delay of (\d+) minutes is below the 60-minute refund threshold\.$/i, rep: 'El retraso de $1 minutos está por debajo del límite de reembolso de 60 minutos.' },
      { regex: /^Rebook (\d+) passenger\(s\)$/i, rep: 'Re reservar a $1 pasajero(s)' },
      { regex: /^Refund (\d+) passenger\(s\)$/i, rep: 'Reembolsar a $1 pasajero(s)' },
      { regex: /^Rebooked (\d+) passenger\(s\)!$/i, rep: '¡Re reservado para $1 pasajero(s)!' },
      { regex: /^Refund initiated for (\d+) passenger\(s\)!$/i, rep: '¡Reembolso iniciado para $1 pasajero(s)!' },
      { regex: /^(\d+) of (\d+) passengers processed\.$/i, rep: '$1 de $2 pasajeros procesados.' },
      { regex: /^1 bag \((\d+)kg\) checked at desk (\d+)$/i, rep: '1 maleta ($1kg) registrada en el mostrador $2' },
      { regex: /^Bag arrived at Carousel (\d+)$/i, rep: 'El equipaje llegó al carrusel $1' },
      { regex: /^Auto-issued based on disruption severity · (\d+) active · \$([\d.]+) total value$/i, rep: 'Emitido automáticamente según la gravedad de la interrupción · $1 activo(s) · valor total de $$2' },
      { regex: /^Estimated departure revised to (\d{2}:\d{2})$/i, rep: 'Salida estimada modificada a las $1' },
      { regex: /^Gate changed from (\d+) to (\d+)$/i, rep: 'Puerta cambiada de la $1 a la $2' },
      { regex: /^Boards in (\d+) minutes at gate ([A-Z0-9]+)$/i, rep: 'Embarque en $1 minutos en la puerta $2' },
      { regex: /^Meal voucher issued \(\$([\d.]+)\)$/i, rep: 'Cupón de comida emitido ($$1)' },
      { regex: /^Hotel voucher issued \(\$([\d.]+)\)$/i, rep: 'Cupón de hotel emitido ($$1)' },
      { regex: /^Rebooked to flight ([A-Z0-9 ]+)$/i, rep: 'Re reservado al vuelo $1' },
      { regex: /^Estimated: \$([\d.]+)\.$/i, rep: 'Estimado: $$1.' },
      { regex: /^\((.*)\) — ~(\d+) days\.$/i, rep: '($1) — ~$2 días.' },
      { regex: /^Confirmed on flight (.*), departing (.*)\.$/i, rep: 'Confirmado en el vuelo $1, saliendo el $2.' },
      { regex: /^Check in for (.*) from (.*)$/i, rep: 'Check-in para $1 desde $2' },
      { regex: /^Gate (.*), Terminal (.*)$/i, rep: 'Puerta $1, Terminal $2' },
      { regex: /^(\d+) stop\(s\) vs nonstop$/i, rep: '$1 escalas vs directo' },
      { regex: /^(\d+) stop$/i, rep: '$1 escala' },
      { regex: /^(\d+) stops$/i, rep: '$1 escalas' }
    ]
  }

  const localePatterns = patterns[locale]
  if (localePatterns) {
    for (const p of localePatterns) {
      if (p.regex.test(strKey)) {
        return strKey.replace(p.regex, p.rep)
      }
    }
  }

  return strKey
}

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'es', label: 'Español' },
]
