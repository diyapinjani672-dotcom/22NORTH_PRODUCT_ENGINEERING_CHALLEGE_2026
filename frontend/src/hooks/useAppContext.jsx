import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { t as translate } from '../i18n/index.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = sessionStorage.getItem('skyjet_session')
    return raw ? JSON.parse(raw) : null
  })
  const [darkMode, setDarkMode] = useState(true)
  const [toasts, setToasts] = useState([])
  const [locale, setLocaleState] = useState(() => {
    return sessionStorage.getItem('skyjet_locale') || 'en'
  })
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (session?.booking?.passenger?.language) {
      setLocaleState(session.booking.passenger.language)
    }
  }, [session?.booking?.passenger?.language])

  const login = useCallback((token, booking, groupMembers = []) => {
    const s = { token, booking, groupMembers }
    sessionStorage.setItem('skyjet_session', JSON.stringify(s))
    setSession(s)
    if (booking.passenger?.language) {
      setLocaleState(booking.passenger.language)
      sessionStorage.setItem('skyjet_locale', booking.passenger.language)
    }
  }, [])

  const updateBooking = useCallback((booking) => {
    setSession((prev) => {
      const next = { ...prev, booking }
      sessionStorage.setItem('skyjet_session', JSON.stringify(next))
      return next
    })
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('skyjet_session')
    setSession(null)
    setUnreadNotifications(0)
  }, [])

  const setLocale = useCallback((code) => {
    setLocaleState(code)
    sessionStorage.setItem('skyjet_locale', code)
  }, [])

  const t = useCallback((key) => translate(locale, key), [locale])

  const pushToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <AppContext.Provider
      value={{
        session,
        login,
        updateBooking,
        logout,
        darkMode,
        setDarkMode,
        toasts,
        pushToast,
        dismissToast,
        locale,
        setLocale,
        t,
        unreadNotifications,
        setUnreadNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
