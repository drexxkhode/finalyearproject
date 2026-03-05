import { useState, useCallback } from 'react'

/**
 * useNotification — returns { notif, notify }
 * notify(msg, type) where type is 's' (success) or 'e' (error)
 */
export function useNotification() {
  const [notif, setNotif] = useState(null)

  const notify = useCallback((msg, type = 's') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 3000)
  }, [])

  return { notif, notify }
}
