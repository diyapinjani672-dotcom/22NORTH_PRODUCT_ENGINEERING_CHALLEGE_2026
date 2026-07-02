import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import ExplainabilityPanel from './ExplainabilityPanel.jsx'

const QUICK_PROMPTS = [
  'Why is my flight cancelled?',
  'What is my best option?',
  'Where is my baggage?',
  'Do I have meal vouchers?',
  'Hotel voucher status?',
  'When does boarding start?',
  'Can I change my seat?',
  'What is the refund policy?',
]

const ACTION_ROUTES = {
  rebook: '/recovery/alternates',
  alternate_flights: '/recovery/alternates',
  refund: '/recovery/refund',
  waitlist: '/recovery',
  contact_agent: '/recovery',
  view_status: '/dashboard',
  view_baggage: '/baggage',
  view_vouchers: '/vouchers',
  view_boarding_pass: '/boarding-pass',
}

export default function AIAssistant() {
  const { session, pushToast, locale, t } = useAppContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t("Hi! I'm SkyJet's recovery assistant. Ask about your flight, baggage, vouchers, hotel, boarding, seats, or refunds.")
      }
    ])
  }, [locale, t])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  if (!session) return null

  const send = async (text) => {
    const message = text ?? input
    if (!message.trim() || sending) return
    setMessages((m) => [...m, { role: 'user', content: message }])
    setInput('')
    setSending(true)
    try {
      const res = await chatApi.send(session.booking.id, message, locale)
      setMessages((m) => [...m, {
        role: 'assistant',
        content: res.reply,
        actions: res.suggested_actions,
        intent: res.intent,
        explanation: res.explanation,
      }])
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI assistant"
        className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full bg-gold text-night shadow-glass flex items-center justify-center text-xl font-display font-bold"
      >
        {open ? '✕' : '✦'}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-24 left-5 z-50 w-[calc(100%-2.5rem)] max-w-sm h-[32rem] glass rounded-2xl shadow-glass flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-night-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-recovery animate-pulseGlow" />
              <p className="font-display font-semibold text-sm">{t('Recovery Assistant')}</p>
              <span className="ml-auto text-[10px] text-ink-faint uppercase">{locale}</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm ${
                      m.role === 'user'
                        ? 'bg-gold text-night rounded-br-sm'
                        : 'bg-night-raised text-ink rounded-bl-sm'
                    }`}
                  >
                    {m.intent && m.role === 'assistant' && (
                      <span className="text-[10px] font-mono text-gold uppercase block mb-1">{t(m.intent)}</span>
                    )}
                    {m.content}
                    {m.explanation && (
                      <ExplainabilityPanel
                        summary={m.explanation.summary}
                        factors={m.explanation.factors}
                        title="Why"
                      />
                    )}
                    {m.actions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.actions.map((a) =>
                          ACTION_ROUTES[a] ? (
                            <button
                              key={a}
                              onClick={() => { setOpen(false); navigate(ACTION_ROUTES[a]) }}
                              className="text-xs px-2 py-1 rounded-lg bg-night-surface border border-night-border hover:border-gold/50 hover:text-gold"
                            >
                              {t(a)}
                            </button>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-night-raised rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-ink-faint">
                    {t('typing…')}
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full border border-night-border text-ink-muted hover:text-gold hover:border-gold/50"
                >
                  {t(q)}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send() }}
              className="border-t border-night-border p-2 flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('Ask about your flight…')}
                aria-label="Message the assistant"
                className="flex-1 bg-night-raised rounded-lg px-3 py-2 text-sm outline-none border border-transparent focus:border-gold/50"
              />
              <button type="submit" className="btn-primary px-3 py-2 text-sm">{t('Send')}</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

