import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { boardingPassApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import BarcodeDisplay from '../components/BarcodeDisplay.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

export default function BoardingPass() {
  const { session, pushToast, t } = useAppContext()
  const [pass, setPass] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gateInput, setGateInput] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    boardingPassApi.get(session.booking.id)
      .then((p) => { setPass(p); setGateInput(p.gate) })
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [session.booking.id])

  const simulateScan = async () => {
    setScanning(true)
    setScanResult(null)
    try {
      const result = await boardingPassApi.scan(session.booking.id, gateInput)
      setScanResult(result)
      pushToast(t(result.message), result.valid ? 'success' : 'error')
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setScanning(false)
    }
  }

  if (loading) return <div className="max-w-md mx-auto px-6 py-10"><PageSkeleton /></div>
  if (!pass) return null

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('BOARDING')}</p>
      <h1 className="font-display font-bold text-2xl mb-8">{t('boarding.title')}</h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl overflow-hidden mb-6"
      >
        <div className="bg-gold px-6 py-4 flex justify-between items-center">
          <span className="font-display font-bold text-night">{t('SkyJet Airways')}</span>
          <span className="font-mono text-night text-sm">{t(pass.status)}</span>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-ink-faint uppercase">{t('Passenger')}</p>
            <p className="font-display font-semibold text-lg">{pass.passenger_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ink-faint">{t('From')}</p>
              <p className="font-mono text-xl font-bold">{pass.origin_code}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-faint">{t('To')}</p>
              <p className="font-mono text-xl font-bold">{pass.destination_code}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-ink-faint">{t('Flight')}</p>
              <p className="font-mono font-semibold">{pass.flight_number}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">{t('Seat')}</p>
              <p className="font-mono font-semibold">{pass.seat}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">{t('Gate')}</p>
              <p className="font-mono font-semibold text-gold">{pass.gate}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-ink-faint">{t('Boarding')}</p>
              <p>{new Date(pass.boarding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">{t('Departure')}</p>
              <p>{new Date(pass.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <BarcodeDisplay data={pass.barcode_data} />
          <p className="text-center font-mono text-gold tracking-widest">{pass.pnr}</p>
        </div>
      </motion.div>

      <div className="glass rounded-2xl p-5">
        <p className="font-display font-semibold mb-3">{t('boarding.scan')}</p>
        <div className="flex gap-2 mb-3">
          <input
            value={gateInput}
            onChange={(e) => setGateInput(e.target.value)}
            placeholder={t('Gate code')}
            className="flex-1 bg-night-raised rounded-lg px-3 py-2 text-sm outline-none border border-night-border focus:border-gold/50 font-mono"
          />
          <button onClick={simulateScan} disabled={scanning} className="btn-primary px-4 text-sm">
            {scanning ? t('Scanning…') : t('Scan')}
          </button>
        </div>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-xl p-3 text-sm ${scanResult.valid ? 'bg-recovery/10 text-recovery border border-recovery/30' : 'bg-disrupt/10 text-disrupt border border-disrupt/30'}`}
          >
            {scanResult.valid ? '✓ ' : '✕ '}{t(scanResult.message)}
          </motion.div>
        )}
      </div>
    </div>
  )
}

