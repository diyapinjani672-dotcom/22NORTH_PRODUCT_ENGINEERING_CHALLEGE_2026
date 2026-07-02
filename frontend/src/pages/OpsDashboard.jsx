import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { analyticsApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

function KpiCard({ label, value, suffix = '', accent }) {
  const { t } = useAppContext()
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <p className="text-xs text-ink-faint uppercase tracking-wide mb-2">{t(label)}</p>
      <p className={`font-display font-bold text-3xl ${accent || 'text-ink'}`}>
        {value}{suffix}
      </p>
    </motion.div>
  )
}

export default function OpsDashboard() {
  const { pushToast, t } = useAppContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.summary()
      .then(setData)
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10"><PageSkeleton /></div>

  const maxTrend = Math.max(...data.trend_7d.map((d) => d.rebooks + d.refunds), 1)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('COO KPIs')}</p>
      <h1 className="font-display font-bold text-3xl mb-8">{t('ops.title')}</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label={t('ops.deflection')} value={(data.deflection_rate * 100).toFixed(0)} suffix="%" accent="text-recovery" />
        <KpiCard label={t('ops.rebookConv')} value={(data.rebook_conversion * 100).toFixed(0)} suffix="%" accent="text-gold" />
        <KpiCard label={t('ops.refundVol')} value={`$${data.refund_volume_usd.toLocaleString()}`} accent="text-disrupt" />
        <KpiCard label="Avg Recovery Score" value={data.avg_recovery_score} suffix="/100" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Total Rebooks" value={data.rebook_count} />
        <KpiCard label="Total Refunds" value={data.refund_count} />
        <KpiCard label="Disruptions Handled" value={data.total_disruptions} />
      </div>

      <div className="glass rounded-2xl p-6">
        <p className="font-display font-semibold mb-4">{t('7-Day Trend — Rebooks vs Refunds')}</p>
        <div className="flex items-end gap-2 h-40">
          {data.trend_7d.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: '120px' }}>
                <div
                  className="w-full bg-recovery rounded-t"
                  style={{ height: `${(d.rebooks / maxTrend) * 100}%`, minHeight: d.rebooks ? 4 : 0 }}
                  title={`${d.rebooks} rebooks`}
                />
                <div
                  className="w-full bg-disrupt/70 rounded-b"
                  style={{ height: `${(d.refunds / maxTrend) * 100}%`, minHeight: d.refunds ? 4 : 0 }}
                  title={`${d.refunds} refunds`}
                />
              </div>
              <p className="text-[10px] text-ink-faint">{d.date.slice(5)}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-recovery rounded" /> {t('Rebooks')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-disrupt/70 rounded" /> {t('Refunds')}</span>
        </div>
      </div>
    </div>
  )
}

