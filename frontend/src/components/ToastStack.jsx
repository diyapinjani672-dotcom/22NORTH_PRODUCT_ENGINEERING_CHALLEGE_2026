import { AnimatePresence, motion } from 'framer-motion'
import { useAppContext } from '../hooks/useAppContext.jsx'

const STYLES = {
  success: 'border-recovery/40 text-recovery',
  error: 'border-disrupt/40 text-disrupt',
  info: 'border-gold/40 text-gold',
}

export default function ToastStack() {
  const { toasts, dismissToast } = useAppContext()

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-[calc(100%-2.5rem)] max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`glass rounded-xl px-4 py-3 border shadow-glass flex items-center justify-between gap-3 ${STYLES[t.type] || STYLES.info}`}
            role="status"
          >
            <span className="text-sm text-ink">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-ink-faint hover:text-ink">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
