import { useAppContext } from '../hooks/useAppContext.jsx'

const STATUS_MAP = {
  ON_TIME: { label: 'On Time', dot: 'bg-recovery', text: 'text-recovery', bg: 'bg-recovery/10 border-recovery/30' },
  BOARDING: { label: 'Boarding', dot: 'bg-recovery', text: 'text-recovery', bg: 'bg-recovery/10 border-recovery/30' },
  DEPARTED: { label: 'Departed', dot: 'bg-ink-muted', text: 'text-ink-muted', bg: 'bg-night-raised border-night-border' },
  LANDED: { label: 'Landed', dot: 'bg-ink-muted', text: 'text-ink-muted', bg: 'bg-night-raised border-night-border' },
  DELAYED: { label: 'Delayed', dot: 'bg-gold', text: 'text-gold', bg: 'bg-gold/10 border-gold/30' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-disrupt', text: 'text-disrupt', bg: 'bg-disrupt/10 border-disrupt/30' },
  DIVERTED: { label: 'Diverted', dot: 'bg-disrupt', text: 'text-disrupt', bg: 'bg-disrupt/10 border-disrupt/30' },
}

export default function StatusBadge({ status, pulse = false }) {
  const { t } = useAppContext()
  const s = STATUS_MAP[status] || STATUS_MAP.ON_TIME
  return (
    <span className={`badge border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${pulse ? 'animate-pulseGlow' : ''}`} />
      {t(s.label)}
    </span>
  )
}

