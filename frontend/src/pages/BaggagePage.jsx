import { useEffect, useState } from 'react'
import { baggageApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import BaggageTracker from '../components/BaggageTracker.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

export default function BaggagePage() {
  const { session, pushToast, t } = useAppContext()
  const [bags, setBags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    baggageApi.list(session.booking.id)
      .then(setBags)
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [session.booking.id])

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-10"><PageSkeleton /></div>

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('BAGGAGE')}</p>
      <h1 className="font-display font-bold text-2xl mb-8">{t('dashboard.baggage')}</h1>
      <BaggageTracker bags={bags} loading={false} />
    </div>
  )

}
