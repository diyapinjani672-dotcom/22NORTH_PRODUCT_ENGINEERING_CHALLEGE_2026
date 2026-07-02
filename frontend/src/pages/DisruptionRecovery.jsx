import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { flightApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import RouteVisualization from '../components/RouteVisualization.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

const OPTIONS = [
  {
    key: 'rebook',
    title: 'Rebook Flight',
    desc: 'Move to the next available flight on your route, free of charge.',
    icon: '↻',
    route: '/recovery/alternates',
  },
  {
    key: 'refund',
    title: 'Request Refund',
    desc: 'Get a full or partial refund based on our disruption policy.',
    icon: '$',
    route: '/recovery/refund',
  },
  {
    key: 'waitlist',
    title: 'Join Waitlist',
    desc: "We'll notify you the moment a seat opens on a sooner flight.",
    icon: '☰',
    route: null,
  },
  {
    key: 'agent',
    title: 'Contact Agent',
    desc: 'For complex itineraries or group bookings, talk to a human.',
    icon: '☎',
    route: null,
  },
]

export default function DisruptionRecovery() {
  const { session, pushToast, t } = useAppContext()
  const [statusData, setStatusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [waitlisted, setWaitlisted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    flightApi.status(session.booking.id)
      .then(setStatusData)
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [session.booking.id])

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-10"><PageSkeleton /></div>

  const { flight, is_disrupted, disruption } = statusData

  const handleClick = (opt) => {
    if (opt.route) return navigate(opt.route)
    if (opt.key === 'waitlist') {
      setWaitlisted(true)
      pushToast(t('Added to waitlist — we\'ll notify you if a seat opens up.'), 'success')
      return
    }
    if (opt.key === 'agent') {
      pushToast(t('Connecting you to the next available agent…'), 'info')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('RECOVERY CENTER')}</p>
        <h1 className="font-display font-bold text-3xl mb-2">{t("Let's get you back on track")}</h1>
        <p className="text-ink-muted">
          {t('Flight')} {flight.flight_number} · {t(flight.origin_city)} → {t(flight.destination_city)}
        </p>
      </div>

      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <StatusBadge status={flight.status} pulse={is_disrupted} />
          {disruption && <span className="text-xs text-ink-faint font-mono">{t('Reason')}: {t(disruption.reason)}</span>}
        </div>
        <RouteVisualization originCode={flight.origin_code} destCode={flight.destination_code} status={flight.status} />
        {disruption && (
          <p className="text-sm text-ink-muted mt-4 pt-4 border-t border-night-border">{t(disruption.reason_detail)}</p>
        )}
      </div>

      {session.groupMembers?.length > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/recovery/group')}
          className="glass rounded-2xl p-4 mb-4 w-full text-left border border-gold/30 hover:border-gold/50"
        >
          <p className="font-display font-semibold text-gold">{t('Family / Group Recovery')}</p>
          <p className="text-sm text-ink-muted">{t('Rebook or refund all passengers in one action')}</p>
        </motion.button>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleClick(opt)}
            disabled={opt.key === 'waitlist' && waitlisted}
            className="glass rounded-2xl p-6 text-left hover:border-gold/50 transition-colors group disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-display font-bold mb-4 group-hover:bg-gold group-hover:text-night transition-colors">
              {opt.icon}
            </div>
            <p className="font-display font-semibold mb-1">
              {opt.key === 'waitlist' && waitlisted ? t('Added to Waitlist ✓') : t(opt.title)}
            </p>
            <p className="text-sm text-ink-muted">{t(opt.desc)}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

