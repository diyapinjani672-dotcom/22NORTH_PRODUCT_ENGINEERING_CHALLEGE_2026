import { motion } from 'framer-motion'
import { useAppContext } from '../hooks/useAppContext.jsx'

const STATUS_STEPS = ['CHECKED_IN', 'IN_TRANSIT', 'LOADED', 'ARRIVED']
const STATUS_LABELS = {
  CHECKED_IN: 'Checked In',
  IN_TRANSIT: 'In Transit',
  LOADED: 'Loaded on Aircraft',
  DELAYED: 'Delayed',
  ARRIVED: 'Arrived',
  MISSING: 'Missing',
}

export default function BaggageTracker({ bags, loading }) {
  const { t } = useAppContext()

  if (loading) return <div className="glass rounded-2xl p-6 animate-pulse h-32" />
  if (!bags?.length) {
    return <div className="glass rounded-2xl p-6 text-sm text-ink-muted text-center">{t('No checked baggage on this booking.')}</div>
  }

  return (
    <div className="space-y-4">
      {bags.map((bag) => {
        const stepIdx = STATUS_STEPS.indexOf(bag.status)
        return (
          <motion.div key={bag.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-gold text-sm">{bag.tag_number}</p>
                <p className="font-display font-semibold">{t(STATUS_LABELS[bag.status] || bag.status)}</p>
              </div>
              <p className="text-xs text-ink-muted">{bag.weight_kg} kg</p>
            </div>
            {bag.last_scan_location && (
              <p className="text-sm text-ink-muted mb-3">
                {t('Last seen:')} {t(bag.last_scan_location)}
                {bag.last_scan_at && ` · ${new Date(bag.last_scan_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
            <div className="flex gap-1">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex-1">
                  <div className={`h-1.5 rounded-full ${i <= stepIdx || bag.status === 'DELAYED' ? 'bg-gold' : 'bg-night-border'}`} />
                  <p className="text-[10px] text-ink-faint mt-1 truncate">{t(STATUS_LABELS[step])}</p>
                </div>
              ))}
            </div>
            {bag.scans?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-night-border space-y-1">
                {bag.scans.map((s, i) => (
                  <div key={i} className="flex justify-between text-xs text-ink-muted">
                    <span>{t(s.location)}</span>
                    <span>{new Date(s.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

