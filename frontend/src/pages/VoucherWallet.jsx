import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { vouchersApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

const TYPE_ICONS = { MEAL: '🍽', HOTEL: '🏨', LOUNGE: '✈' }

export default function VoucherWallet() {
  const { session, pushToast, t } = useAppContext()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(null)

  const load = () => {
    vouchersApi.list(session.booking.id)
      .then(setVouchers)
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [session.booking.id])

  const redeem = async (v) => {
    setRedeeming(v.id)
    try {
      await vouchersApi.redeem(v.id)
      pushToast(`${t(v.type + ' Voucher')} ${t('Redeemed') || 'redeemed'}!`, 'success')
      load()
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setRedeeming(null)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-10"><PageSkeleton /></div>

  const active = vouchers.filter((v) => v.status === 'ACTIVE')
  const total = active.reduce((s, v) => s + v.amount, 0)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('WALLET')}</p>
      <h1 className="font-display font-bold text-2xl mb-2">{t('voucher.title')}</h1>
      <p className="text-ink-muted text-sm mb-8">
        {t('Auto-issued based on disruption severity')} · {active.length} {t('active')} · ${total.toFixed(2)} {t('total value')}
      </p>

      {vouchers.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-ink-muted">
          {t('No vouchers yet. Long delays or cancellations trigger automatic issuance.')}
        </div>
      ) : (
        <div className="grid gap-4">
          {vouchers.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass rounded-2xl p-5 border ${v.status === 'ACTIVE' ? 'border-gold/30' : 'border-night-border opacity-70'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{TYPE_ICONS[v.type] || '🎫'}</span>
                  <div>
                    <p className="font-display font-semibold">{t(v.type + ' Voucher')}</p>
                    <p className="text-xs text-ink-muted">{t(v.issued_reason)}</p>
                  </div>
                </div>
                <p className="font-mono font-bold text-xl text-gold">${v.amount.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-ink-faint">{v.code}</p>
                {v.status === 'ACTIVE' ? (
                  <button
                    onClick={() => redeem(v)}
                    disabled={redeeming === v.id}
                    className="btn-primary text-xs px-4 py-1.5"
                  >
                    {redeeming === v.id ? '…' : t('voucher.redeem')}
                  </button>
                ) : (
                  <span className="text-xs text-ink-faint uppercase">{t(v.status)}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

