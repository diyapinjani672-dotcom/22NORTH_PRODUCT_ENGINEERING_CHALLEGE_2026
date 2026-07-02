import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { groupApi, rebookApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import FlightCard from '../components/FlightCard.jsx'
import { PageSkeleton, CardSkeleton } from '../components/Skeleton.jsx'

export default function GroupRecovery() {
  const { session, pushToast, t, updateBooking } = useAppContext()
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState([])
  const [alternates, setAlternates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('rebook')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const masterPnr = session.booking.pnr

  useEffect(() => {
    const membersList = session.groupMembers?.length
      ? session.groupMembers
      : null

    if (membersList) {
      setMembers(membersList)
      setSelected(membersList.map((m) => m.booking_id))
      setLoading(false)
    } else {
      groupApi.get(masterPnr)
        .then((m) => { setMembers(m); setSelected(m.map((x) => x.booking_id)) })
        .catch(() => setMembers([]))
        .finally(() => setLoading(false))
    }

    rebookApi.alternates(session.booking.id)
      .then(setAlternates)
      .catch(() => {})
  }, [session.booking.id, masterPnr, session.groupMembers])

  const toggle = (id) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  const handleGroupRebook = async (flight) => {
    setSubmitting(true)
    try {
      const res = await groupApi.rebook(masterPnr, flight.id, selected)
      setResult(res)
      pushToast(t(`Rebooked ${res.success_count} passenger(s)!`), 'success')
      updateBooking({ ...session.booking, status: 'REBOOKED' })
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGroupRefund = async () => {
    setSubmitting(true)
    try {
      const res = await groupApi.refund(masterPnr, selected, 'Full')
      setResult(res)
      pushToast(t(`Refund initiated for ${res.success_count} passenger(s)!`), 'success')
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-10"><PageSkeleton /></div>

  if (members.length <= 1) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-ink-muted mb-4">{t('This booking is not part of a family/group PNR.')}</p>
        <button onClick={() => navigate('/recovery')} className="btn-primary">{t('Go to Recovery')}</button>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-recovery/10 border border-recovery/30 flex items-center justify-center text-4xl text-recovery mb-6">✓</div>
        <h1 className="font-display font-bold text-2xl mb-2">{t('Group action complete')}</h1>
        <p className="text-ink-muted mb-6">{t(`${result.success_count} of ${selected.length} passengers processed.`)}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">{t('Back to Dashboard')}</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('GROUP')}</p>
      <h1 className="font-display font-bold text-2xl mb-6">{t('group.title')}</h1>

      <div className="glass rounded-2xl p-5 mb-6">
        <p className="text-xs text-ink-faint uppercase mb-3">{t('Select passengers (PNR')} {masterPnr})</p>
        <div className="space-y-2">
          {members.map((m) => (
            <label key={m.booking_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-night-raised cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(m.booking_id)}
                onChange={() => toggle(m.booking_id)}
                className="accent-gold"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{m.passenger_name} {m.is_primary && <span className="text-gold text-xs">({t('primary')})</span>}</p>
                <p className="text-xs text-ink-muted">{m.pnr} · {t('Seat')} {m.seat_number} · {t(m.status)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode('rebook')} className={`flex-1 py-2 rounded-xl text-sm border ${mode === 'rebook' ? 'border-gold bg-gold/10 text-gold' : 'border-night-border text-ink-muted'}`}>
          {t('group.rebookAll')}
        </button>
        <button onClick={() => setMode('refund')} className={`flex-1 py-2 rounded-xl text-sm border ${mode === 'refund' ? 'border-gold bg-gold/10 text-gold' : 'border-night-border text-ink-muted'}`}>
          {t('group.refundAll')}
        </button>
      </div>

      {mode === 'refund' ? (
        <button onClick={handleGroupRefund} disabled={submitting || selected.length === 0} className="btn-primary w-full">
          {submitting ? t('Processing…') : t(`Refund ${selected.length} passenger(s)`)}
        </button>
      ) : alternates ? (
        <div className="grid gap-4">
          {alternates.options.slice(0, 3).map((f) => (
            <FlightCard
              key={f.id}
              flight={f}
              recommended={f.id === alternates.recommended_flight_id}
              scoreFactors={f.score_factors}
              onRebook={() => handleGroupRebook(f)}
              loading={submitting}
              label={`Rebook ${selected.length} passenger(s)`}
            />
          ))}
        </div>
      ) : (
        <CardSkeleton />
      )}
    </div>
  )
}

