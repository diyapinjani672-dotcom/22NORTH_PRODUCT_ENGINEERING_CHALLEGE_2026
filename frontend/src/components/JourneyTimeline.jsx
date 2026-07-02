import { motion } from 'framer-motion'
import { useAppContext } from '../hooks/useAppContext.jsx'

const SOURCE_COLORS = {
  scheduled: 'border-gold/30 bg-gold/5',
  disruption: 'border-disrupt/30 bg-disrupt/10',
  notification: 'border-recovery/30 bg-recovery/5',
}

const STATUS_DOT = {
  completed: 'bg-ink-faint',
  upcoming: 'bg-night-border',
  active: 'bg-recovery animate-pulseGlow',
  delayed: 'bg-gold',
  alert: 'bg-disrupt',
  info: 'bg-gold/70',
}

export default function JourneyTimeline({ events, loading }) {
  const { t } = useAppContext()

  if (loading) {
    return <div className="glass rounded-2xl p-6 animate-pulse h-48" />
  }
  if (!events?.length) {
    return <div className="glass rounded-2xl p-6 text-center text-ink-muted text-sm">{t('No journey events yet.')}</div>
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-night-border" />
      <div className="space-y-4">
        {events.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="relative"
          >
            <div className={`absolute -left-8 w-8 h-8 rounded-full border border-night-border flex items-center justify-center`}>
              <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[e.status] || STATUS_DOT.info}`} />
            </div>
            <div className={`rounded-xl p-4 border ${SOURCE_COLORS[e.source] || SOURCE_COLORS.notification}`}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className="font-display font-semibold text-sm">{t(e.title)}</p>
                <span className="text-xs text-ink-faint font-mono uppercase">{t(e.source)}</span>
              </div>
              <p className="text-sm text-ink-muted">{t(e.detail)}</p>
              <p className="text-xs text-ink-faint mt-1">
                {new Date(e.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

