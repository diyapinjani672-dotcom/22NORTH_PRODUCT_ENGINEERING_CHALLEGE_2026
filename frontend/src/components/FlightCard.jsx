import { motion } from 'framer-motion'
import ExplainabilityPanel from './ExplainabilityPanel.jsx'
import { useAppContext } from '../hooks/useAppContext.jsx'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m}m`
}

export default function FlightCard({ flight, recommended, onRebook, loading, scoreFactors, label }) {
  const { t } = useAppContext()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-5 relative ${recommended ? 'ring-1 ring-gold/60' : ''}`}
    >
      {recommended && (
        <div className="absolute -top-3 left-5 badge bg-gold text-night border-none font-display">
          ✦ {t('Best Option')} {flight.recovery_score ? `${flight.recovery_score}/100` : ''}
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-display font-semibold text-lg">{flight.flight_number}</p>
          <p className="text-ink-muted text-sm">{t(flight.airline)} · {t(flight.aircraft_type)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-ink-muted">{t('Seats left')}</p>
          <p className={`font-mono font-semibold ${flight.seats_available <= 5 ? 'text-gold' : 'text-recovery'}`}>
            {flight.seats_available}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="font-mono text-xl font-semibold">{formatTime(flight.scheduled_departure)}</p>
          <p className="text-xs text-ink-muted">{flight.origin_code}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <p className="text-xs text-ink-faint">{formatDuration(flight.duration_minutes)}</p>
          <div className="w-full h-px bg-night-border relative">
            <div className="absolute inset-0 bg-runway" />
          </div>
          <p className="text-xs text-ink-faint">
            {flight.stops === 0 ? t('Nonstop') : t(`${flight.stops} stops`)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-semibold">{formatTime(flight.scheduled_arrival)}</p>
          <p className="text-xs text-ink-muted">{flight.destination_code}</p>
        </div>
      </div>

      {scoreFactors?.length > 0 && (
        <ExplainabilityPanel factors={scoreFactors} title="Score breakdown" />
      )}

      <button
        onClick={() => onRebook(flight)}
        disabled={loading}
        className="btn-primary w-full text-sm mt-3"
      >
        {loading ? t('Rebooking…') : (t(label) || t('Rebook This Flight'))}
      </button>
    </motion.div>
  )
}

