import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { rebookApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import FlightCard from '../components/FlightCard.jsx'
import ExplainabilityPanel from '../components/ExplainabilityPanel.jsx'
import { CardSkeleton } from '../components/Skeleton.jsx'

export default function AlternateFlights() {
  const { session, updateBooking, pushToast, t } = useAppContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rebookingId, setRebookingId] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const [sortBy, setSortBy] = useState('recommended')
  const navigate = useNavigate()

  useEffect(() => {
    rebookApi.alternates(session.booking.id)
      .then(setData)
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [session.booking.id])

  const handleRebook = async (flight) => {
    setRebookingId(flight.id)
    try {
      const result = await rebookApi.rebook(session.booking.id, flight.id)
      updateBooking({ ...session.booking, flight: result.new_flight, status: 'REBOOKED' })
      setConfirmed(result)
      pushToast(`${t('Rebooked to flight')} ${flight.flight_number}!`, 'success')
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setRebookingId(null)
    }
  }

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 mx-auto rounded-full bg-recovery/10 border border-recovery/30 flex items-center justify-center text-4xl text-recovery mb-6">
          ✓
        </motion.div>
        <h1 className="font-display font-bold text-2xl mb-2">{t("You're rebooked!")}</h1>
        <p className="text-ink-muted mb-4">
          {t('Confirmed on flight')} {confirmed.new_flight.flight_number}, {t('departing')}{' '}
          {new Date(confirmed.new_flight.scheduled_departure).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}.
        </p>
        <div className="glass rounded-xl p-4 mb-4 flex items-center justify-center gap-2">
          <span className="text-xs text-ink-faint">{t('Recovery Score')}</span>
          <span className="font-mono font-bold text-recovery text-lg">{confirmed.recovery_score}/100</span>
        </div>
        <ExplainabilityPanel summary={confirmed.explanation_summary} factors={confirmed.score_factors} />
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full mt-6">{t('Back to Dashboard')}</button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 grid gap-4">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    )
  }

  const options = [...(data?.options || [])].sort((a, b) => {
    if (sortBy === 'departure') return new Date(a.scheduled_departure) - new Date(b.scheduled_departure)
    if (sortBy === 'duration') return a.duration_minutes - b.duration_minutes
    if (sortBy === 'score') return (b.recovery_score || 0) - (a.recovery_score || 0)
    return a.id === data.recommended_flight_id ? -1 : b.id === data.recommended_flight_id ? 1 : 0
  })

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('ALTERNATE FLIGHTS')}</p>
          <h1 className="font-display font-bold text-2xl">
            {t(data.original_flight.origin_city)} → {t(data.original_flight.destination_city)}
          </h1>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort alternate flights"
          className="bg-night-raised border border-night-border rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="recommended">{t('Sort: Recommended')}</option>
          <option value="score">{t('Sort: Recovery Score')}</option>
          <option value="departure">{t('Sort: Earliest Departure')}</option>
          <option value="duration">{t('Sort: Shortest Duration')}</option>
        </select>
      </div>

      {options.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-ink-muted mb-4">{t('No alternate flights available on this route right now.')}</p>
          <button onClick={() => navigate('/recovery/refund')} className="btn-secondary">{t('Request a Refund Instead')}</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {options.map((f) => (
            <FlightCard
              key={f.id}
              flight={f}
              recommended={f.id === data.recommended_flight_id}
              scoreFactors={f.score_factors}
              onRebook={handleRebook}
              loading={rebookingId === f.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

