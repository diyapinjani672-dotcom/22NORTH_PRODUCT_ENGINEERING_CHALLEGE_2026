import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'

export default function Landing() {
  const [pnr, setPnr] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAppContext()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(pnr, lastName)
      login(res.token, res.booking, res.group_members || [])
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (demoPnr, demoLast) => {
    setPnr(demoPnr)
    setLastName(demoLast)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="max-w-6xl mx-auto w-full px-6 pt-8 flex items-center gap-2">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M2 16 L22 8 L18 16 L22 22 L2 16 Z" fill="#E8A94C" transform="rotate(20 12 12)" />
        </svg>
        <span className="font-display font-bold text-xl tracking-tight">SkyJet Airways</span>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-gold text-sm tracking-widest mb-4">DISRUPTION RECOVERY</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight mb-5">
            Your flight changed.<br />Your plan doesn't have to wait.
          </h1>
          <p className="text-ink-muted text-lg mb-8 max-w-md">
            Check your flight status, rebook instantly, or request a refund —
            no hold music required.
          </p>
          <div className="flex items-center gap-6 text-sm text-ink-faint">
            <div>
              <p className="font-display font-semibold text-2xl text-ink">65</p>
              <p>aircraft, Asia-wide</p>
            </div>
            <div className="w-px h-10 bg-night-border" />
            <div>
              <p className="font-display font-semibold text-2xl text-ink">&lt;1 min</p>
              <p>vs 25 min hold time</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-3xl p-8 shadow-glass"
        >
          <h2 className="font-display font-semibold text-xl mb-1">Find your booking</h2>
          <p className="text-ink-muted text-sm mb-6">Enter the details from your confirmation email.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="pnr" className="block text-sm text-ink-muted mb-1.5">Booking reference (PNR)</label>
              <input
                id="pnr"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.toUpperCase())}
                placeholder="e.g. SKY4A9"
                required
                className="w-full bg-night-raised border border-night-border rounded-xl px-4 py-3 font-mono tracking-wider outline-none focus:border-gold/60"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm text-ink-muted mb-1.5">Last name</label>
              <input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Shah"
                required
                className="w-full bg-night-raised border border-night-border rounded-xl px-4 py-3 outline-none focus:border-gold/60"
              />
            </div>

            {error && (
              <p role="alert" className="text-disrupt text-sm bg-disrupt/10 border border-disrupt/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Looking up your flight…' : 'Find My Flight'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-night-border">
            <p className="text-xs text-ink-faint mb-2">Try a demo booking:</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => fillDemo('SKY1B6', 'Iyer')} className="text-xs px-2.5 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/30">Boarding now</button>
              <button onClick={() => fillDemo('SKY4A9', 'Shah')} className="text-xs px-2.5 py-1.5 rounded-lg bg-disrupt/10 text-disrupt border border-disrupt/30">Cancelled + family</button>
              <button onClick={() => fillDemo('SKY7X2', 'Nair')} className="text-xs px-2.5 py-1.5 rounded-lg bg-gold/10 text-gold border border-gold/30">Delayed flight</button>
              <button onClick={() => fillDemo('SKY9Q1', 'Mehta')} className="text-xs px-2.5 py-1.5 rounded-lg bg-recovery/10 text-recovery border border-recovery/30">On-time flight</button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
