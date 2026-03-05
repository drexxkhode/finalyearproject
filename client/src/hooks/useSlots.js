import { useState, useEffect, useRef, useCallback } from 'react'
import { TURFS, makeSlots } from '../data/turfs'

/**
 * useSlots — manages all turf slot state including:
 *   - initial slot generation
 *   - live 5-second simulation (uses functional updater, won't touch unrelated state)
 *   - lock / release a slot with a 5-minute countdown
 */
export function useSlots(onLockExpired) {
  const [slots, setSlots] = useState(() => {
    const m = {}
    TURFS.forEach(t => { m[t.id] = makeSlots() })
    return m
  })

  const [countdown, setCountdown] = useState(300)
  const cdRef = useRef(null)

  // ── Live simulation — empty deps so interval is created exactly once ──
  useEffect(() => {
    const iv = setInterval(() => {
      setSlots(prev => {
        let changed = false
        const next = { ...prev }
        TURFS.forEach(t => {
          const sl = [...next[t.id]]
          const i  = Math.floor(Math.random() * sl.length)
          if (sl[i].status === 'available' && !sl[i].lockedBy && Math.random() > 0.97) {
            sl[i] = { ...sl[i], status: 'booked' }
            next[t.id] = sl
            changed = true
          }
        })
        return changed ? next : prev   // avoid re-render if nothing changed
      })
    }, 5000)
    return () => clearInterval(iv)
  }, [])  // ← intentionally empty

  const lockSlot = useCallback((turfId, hour) => {
    if (cdRef.current) clearInterval(cdRef.current)
    setCountdown(300)
    cdRef.current = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) {
          clearInterval(cdRef.current)
          setSlots(prev => {
            const sl = prev[turfId].map(s =>
              s.hour === hour ? { ...s, status: 'available', lockedBy: null } : s
            )
            return { ...prev, [turfId]: sl }
          })
          onLockExpired?.()
          return 300
        }
        return p - 1
      })
    }, 1000)

    setSlots(prev => {
      const sl = prev[turfId].map(s =>
        s.hour === hour ? { ...s, status: 'locked', lockedBy: 'you' } : s
      )
      return { ...prev, [turfId]: sl }
    })
  }, [onLockExpired])

  const releaseSlot = useCallback((turfId, hour) => {
    clearInterval(cdRef.current)
    setSlots(prev => {
      const sl = prev[turfId].map(s =>
        s.hour === hour ? { ...s, status: 'available', lockedBy: null } : s
      )
      return { ...prev, [turfId]: sl }
    })
  }, [])

  const confirmSlot = useCallback((turfId, hour) => {
    setSlots(prev => {
      const sl = prev[turfId].map(s =>
        s.hour === hour ? { ...s, status: 'booked', lockedBy: null } : s
      )
      return { ...prev, [turfId]: sl }
    })
  }, [])

  const fmtCountdown = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return { slots, lockSlot, releaseSlot, confirmSlot, countdown, fmtCountdown }
}
