import { useEffect, useRef } from 'react'
import { notificationsApi } from '../services/api.js'
import { useAppContext } from './useAppContext.jsx'

export function useNotificationPolling(intervalMs = 30000) {
  const { session, pushToast, setUnreadNotifications } = useAppContext()
  const lastSeenRef = useRef(localStorage.getItem('skyjet_last_notif') || new Date().toISOString())

  useEffect(() => {
    if (!session?.booking?.id) return

    const poll = async () => {
      try {
        const newItems = await notificationsApi.listSince(session.booking.id, lastSeenRef.current)
        if (newItems.length > 0) {
          newItems.reverse().forEach((n) => {
            pushToast(`${n.title}: ${n.message}`, 'info')
          })
          lastSeenRef.current = newItems[0].created_at
          localStorage.setItem('skyjet_last_notif', lastSeenRef.current)
          setUnreadNotifications((c) => c + newItems.length)
        }
      } catch {
        // silent fail on poll
      }
    }

    poll()
    const id = setInterval(poll, intervalMs)
    return () => clearInterval(id)
  }, [session?.booking?.id, pushToast, setUnreadNotifications, intervalMs])
}
