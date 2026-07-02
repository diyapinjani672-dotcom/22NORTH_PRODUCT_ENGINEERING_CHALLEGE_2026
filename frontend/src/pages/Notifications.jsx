import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { notificationsApi, journeyApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import JourneyTimeline from '../components/JourneyTimeline.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

const ICONS = {
  DELAY: { icon: '⏱', color: 'text-gold', bg: 'bg-gold/10' },
  GATE_CHANGE: { icon: '⚑', color: 'text-gold', bg: 'bg-gold/10' },
  REBOOKING: { icon: '↻', color: 'text-recovery', bg: 'bg-recovery/10' },
  REFUND: { icon: '$', color: 'text-recovery', bg: 'bg-recovery/10' },
  BOARDING: { icon: '✈', color: 'text-recovery', bg: 'bg-recovery/10' },
  CANCELLATION: { icon: '✕', color: 'text-disrupt', bg: 'bg-disrupt/10' },
}

export default function Notifications() {
  const { session, pushToast, setUnreadNotifications, t } = useAppContext()
  const [items, setItems] = useState([])
  const [journey, setJourney] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('timeline')

  useEffect(() => {
    Promise.all([
      notificationsApi.list(session.booking.id),
      journeyApi.get(session.booking.id),
    ])
      .then(([notifs, j]) => {
        setItems(notifs)
        setJourney(j.events)
        setUnreadNotifications(0)
      })
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [session.booking.id])

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-10"><PageSkeleton /></div>

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('TIMELINE')}</p>
      <h1 className="font-display font-bold text-2xl mb-4">{t('nav.notifications')}</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('timeline')} className={`px-4 py-1.5 rounded-lg text-sm ${tab === 'timeline' ? 'bg-gold/10 text-gold border border-gold/30' : 'text-ink-muted border border-night-border'}`}>
          {t('dashboard.journey')}
        </button>
        <button onClick={() => setTab('alerts')} className={`px-4 py-1.5 rounded-lg text-sm ${tab === 'alerts' ? 'bg-gold/10 text-gold border border-gold/30' : 'text-ink-muted border border-night-border'}`}>
          {t('Alerts')} ({items.length})
        </button>
      </div>

      {tab === 'timeline' ? (
        <JourneyTimeline events={journey} loading={false} />
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-ink-muted">{t('No notifications yet.')}</div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-night-border" />
          <div className="space-y-6">
            {items.map((n, i) => {
              const conf = ICONS[n.type] || ICONS.DELAY
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <div className={`absolute -left-8 w-8 h-8 rounded-full ${conf.bg} ${conf.color} flex items-center justify-center text-sm border border-night-border`}>
                    {conf.icon}
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-display font-semibold text-sm">{t(n.title)}</p>
                      <p className="text-xs text-ink-faint">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-sm text-ink-muted">{t(n.message)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

