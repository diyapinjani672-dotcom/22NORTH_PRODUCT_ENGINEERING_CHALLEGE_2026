import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { flightApi, journeyApi, baggageApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import RouteVisualization from '../components/RouteVisualization.jsx'
import JourneyTimeline from '../components/JourneyTimeline.jsx'
import BaggageTracker from '../components/BaggageTracker.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const { session, pushToast, t } = useAppContext()
  const [statusData, setStatusData] = useState(null)
  const [journey, setJourney] = useState([])
  const [bags, setBags] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    Promise.all([
      flightApi.status(session.booking.id),
      journeyApi.get(session.booking.id),
      baggageApi.list(session.booking.id),
    ])
      .then(([status, j, b]) => {
        if (mounted) {
          setStatusData(status)
          setJourney(j.events)
          setBags(b)
        }
      })
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [session.booking.id])

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10"><PageSkeleton /></div>

  const { flight, is_disrupted, disruption } = statusData
  const { passenger } = session.booking
  const hasGroup = session.groupMembers?.length > 1

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-ink-muted text-sm">{t('dashboard.welcome')}</p>
          <h1 className="font-display font-bold text-3xl">{passenger.first_name} {passenger.last_name}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-faint">{t('dashboard.bookingRef')}</p>
          <p className="font-mono text-gold text-lg tracking-widest">{session.booking.pnr}</p>
        </div>
      </div>

      {is_disrupted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-disrupt/30 bg-disrupt/10 px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="font-display font-semibold text-disrupt">
              {flight.status === 'CANCELLED' ? t('dashboard.cancelled') : t('dashboard.delayed')}
            </p>
            <p className="text-sm text-ink-muted mt-0.5">{t(disruption?.reason_detail)}</p>
          </div>
          <div className="flex gap-2">
            {hasGroup && (
              <button onClick={() => navigate('/recovery/group')} className="btn-secondary whitespace-nowrap text-sm">
                {t('Family Recovery')}
              </button>
            )}
            <button onClick={() => navigate('/recovery')} className="btn-primary whitespace-nowrap text-sm">
              {t('dashboard.viewRecovery')}
            </button>
          </div>
        </motion.div>
      )}

      <div className="glass rounded-3xl p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <p className="font-display font-bold text-2xl">{flight.flight_number}</p>
            <StatusBadge status={flight.status} pulse={is_disrupted} />
          </div>
          <p className="text-sm text-ink-muted">{t(flight.origin_city)} → {t(flight.destination_city)}</p>
        </div>

        <RouteVisualization originCode={flight.origin_code} destCode={flight.destination_code} status={flight.status} size="lg" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-night-border">
          <InfoBlock label="Scheduled Departure" value={formatDateTime(flight.scheduled_departure)} />
          <InfoBlock label="Scheduled Arrival" value={formatDateTime(flight.scheduled_arrival)} />
          <InfoBlock label="Gate" value={flight.gate} mono />
          <InfoBlock label="Terminal" value={flight.terminal} mono />
        </div>

        {flight.estimated_departure && flight.status === 'DELAYED' && (
          <div className="mt-4 pt-4 border-t border-night-border grid grid-cols-2 gap-4">
            <InfoBlock label="Revised Departure" value={formatDateTime(flight.estimated_departure)} accent="gold" />
            <InfoBlock label="Revised Arrival" value={formatDateTime(flight.estimated_arrival)} accent="gold" />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide mb-3">{t('dashboard.journey')}</p>
          <JourneyTimeline events={journey} loading={false} />
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide mb-3">{t('dashboard.baggage')}</p>
          <BaggageTracker bags={bags} loading={false} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-ink-faint uppercase tracking-wide mb-3">{t('Booking Details')}</p>
          <Row label="Seat" value={session.booking.seat_number} />
          <Row label="Cabin" value={session.booking.cabin_class} />
          <Row label="Fare Type" value={session.booking.fare_type} />
          <Row label="Aircraft" value={flight.aircraft_type} />
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-ink-faint uppercase tracking-wide mb-3">{t('Passenger')}</p>
          <Row label="Frequent Flyer" value={passenger.frequent_flyer_tier} />
          <Row label="Preferred Seat" value={passenger.preferred_seat} />
          <Row label="Meal" value={passenger.preferred_meal} />
          <Row label="Contact" value={passenger.email} />
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ label, value, mono, accent }) {
  const { t } = useAppContext()
  return (
    <div>
      <p className="text-xs text-ink-faint mb-1">{t(label)}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${accent === 'gold' ? 'text-gold' : 'text-ink'}`}>{t(value)}</p>
    </div>
  )
}

function Row({ label, value }) {
  const { t } = useAppContext()
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-ink-muted">{t(label)}</span>
      <span className="font-medium">{t(value)}</span>
    </div>
  )
}

