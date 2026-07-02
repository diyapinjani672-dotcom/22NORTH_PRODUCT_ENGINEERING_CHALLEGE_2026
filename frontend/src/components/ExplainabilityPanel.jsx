import { useAppContext } from '../hooks/useAppContext.jsx'

const IMPACT_STYLES = {
  positive: 'text-recovery bg-recovery/10 border-recovery/30',
  negative: 'text-disrupt bg-disrupt/10 border-disrupt/30',
  neutral: 'text-gold bg-gold/10 border-gold/30',
}

export default function ExplainabilityPanel({ summary, factors = [], title }) {
  const { t } = useAppContext()
  const displayTitle = title || 'Why this decision?'

  if (!factors?.length && !summary) return null

  return (
    <div className="rounded-xl border border-night-border bg-night-raised/50 p-4 mt-3">
      <p className="text-xs font-mono text-gold tracking-widest mb-2 uppercase">{t(displayTitle)}</p>
      {summary && <p className="text-sm text-ink-muted mb-3">{t(summary)}</p>}
      {factors.length > 0 && (
        <div className="space-y-2">
          {factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink">{t(f.label)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${IMPACT_STYLES[f.impact] || IMPACT_STYLES.neutral}`}>
                {f.delta != null ? (f.delta >= 0 ? `+${f.delta}` : f.delta) : f.weight != null ? `${f.weight}%` : t(f.impact)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

