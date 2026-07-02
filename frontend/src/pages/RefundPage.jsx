import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { refundApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import ExplainabilityPanel from '../components/ExplainabilityPanel.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

export default function RefundPage() {
  const { session, updateBooking, pushToast, t } = useAppContext()
  const [elig, setElig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refundType, setRefundType] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    refundApi.eligibility(session.booking.id)
      .then((d) => { setElig(d); setRefundType(d.refund_type_options[0] || null) })
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [session.booking.id])

  const submit = async () => {
    setSubmitting(true)
    try {
      const result = await refundApi.request(session.booking.id, refundType)
      updateBooking({ ...session.booking, status: 'REFUNDED' })
      setDone(result)
      pushToast(t('Refund request submitted.'), 'success')
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="max-w-lg mx-auto px-6 py-10"><PageSkeleton /></div>

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 mx-auto rounded-full bg-recovery/10 border border-recovery/30 flex items-center justify-center text-4xl text-recovery mb-6">
          ✓
        </motion.div>
        <h1 className="font-display font-bold text-2xl mb-2">{t('Refund initiated')}</h1>
        <p className="text-ink-muted mb-4">
          ${done.amount.toFixed(2)} ({t(done.refund_type)}) — ~{done.estimated_processing_days} {t('business days')}.
        </p>
        <ExplainabilityPanel summary={done.explanation_summary} factors={done.factors} title="Decision breakdown" />
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full mt-6">{t('Back to Dashboard')}</button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('REFUND REQUEST')}</p>
      <h1 className="font-display font-bold text-2xl mb-6">{t('refund.title')}</h1>

      <div className={`glass rounded-2xl p-6 mb-4 border ${elig.eligible ? 'border-recovery/30' : 'border-disrupt/30'}`}>
        <p className={`font-display font-semibold mb-2 ${elig.eligible ? 'text-recovery' : 'text-disrupt'}`}>
          {elig.eligible ? t('refund.eligible') : t('refund.notEligible')}
        </p>
        <p className="text-sm text-ink-muted">{t(elig.policy_note)}</p>
      </div>

      <ExplainabilityPanel summary={elig.explanation_summary} factors={elig.factors} />

      {elig.eligible && (
        <>
          <div className="glass rounded-2xl p-6 mb-6 mt-4 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('Estimated amount')}</span>
              <span className="font-mono font-semibold text-lg">${elig.estimated_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">{t('Processing time')}</span>
              <span className="font-medium">~{elig.estimated_processing_days} {t('business days')}</span>
            </div>
            <div>
              <p className="text-sm text-ink-muted mb-2">{t('Refund type')}</p>
              <div className="flex gap-2">
                {elig.refund_type_options.map((type) => (
                  <button
                    key={type}
                    onClick={() => setRefundType(type)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm border transition-colors ${
                      refundType === type ? 'border-gold bg-gold/10 text-gold' : 'border-night-border text-ink-muted hover:border-gold/40'
                    }`}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={submit} disabled={submitting} className="btn-primary w-full">
            {submitting ? t('Submitting…') : t('Submit Refund Request')}
          </button>
        </>
      )}

      {!elig.eligible && (
        <button onClick={() => navigate('/recovery/alternates')} className="btn-secondary w-full mt-4">
          {t('Rebook Instead')}
        </button>
      )}
    </div>
  )
}

