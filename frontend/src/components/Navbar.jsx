import { NavLink, useNavigate } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext.jsx'
import { profileApi } from '../services/api.js'
import { LOCALES } from '../i18n/index.js'

const links = [
  { to: '/dashboard', labelKey: 'nav.dashboard' },
  { to: '/recovery', labelKey: 'nav.recovery' },
  { to: '/notifications', labelKey: 'nav.notifications' },
  { to: '/vouchers', labelKey: 'nav.vouchers' },
  { to: '/baggage', labelKey: 'nav.baggage' },
  { to: '/boarding-pass', labelKey: 'nav.boarding' },
  { to: '/profile', labelKey: 'nav.profile' },
]

export default function Navbar() {
  const { session, logout, darkMode, setDarkMode, t, locale, setLocale, unreadNotifications } = useAppContext()
  const navigate = useNavigate()

  if (!session) return null

  const hasGroup = session.groupMembers?.length > 1

  const changeLanguage = async (code) => {
    setLocale(code)
    try {
      await profileApi.update(session.booking.id, { language: code })
    } catch {
      // locale still works client-side
    }
  }

  return (
    <nav className="sticky top-0 z-40 glass border-b">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M2 16 L22 8 L18 16 L22 22 L2 16 Z" fill="#E8A94C" transform="rotate(20 12 12)" />
          </svg>
          <span className="font-display font-bold text-lg tracking-tight">SkyJet</span>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-2.5 py-2 rounded-lg text-xs font-medium transition-colors relative ${
                  isActive ? 'text-gold bg-gold/10' : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              {t(l.labelKey)}
              {l.to === '/notifications' && unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-disrupt text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </NavLink>
          ))}
          {hasGroup && (
            <NavLink to="/recovery/group" className={({ isActive }) =>
              `px-2.5 py-2 rounded-lg text-xs font-medium ${isActive ? 'text-gold bg-gold/10' : 'text-ink-muted hover:text-ink'}`
            }>
              {t('nav.group')}
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={locale}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label="Language"
            className="bg-night-raised border border-night-border rounded-lg px-2 py-1.5 text-xs outline-none"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <NavLink to="/ops" className="text-xs text-ink-faint hover:text-gold hidden md:block">Ops</NavLink>
          <button
            aria-label="Toggle dark mode"
            onClick={() => setDarkMode((d) => !d)}
            className="w-9 h-9 rounded-lg border border-night-border flex items-center justify-center hover:border-gold/50 text-ink-muted hover:text-gold transition-colors"
          >
            {darkMode ? '☾' : '☀'}
          </button>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="text-sm text-ink-muted hover:text-disrupt transition-colors"
          >
            {t('nav.signout')}
          </button>
        </div>
      </div>
      <div className="lg:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {[...links, ...(hasGroup ? [{ to: '/recovery/group', labelKey: 'nav.group' }] : [])].map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive ? 'text-gold bg-gold/10' : 'text-ink-muted'
              }`
            }
          >
            {t(l.labelKey)}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
