/**
 * useSlots.js  —  src/hooks/useSlots.js
 *
 * v2 — advance booking support via slot_locks table.
 * Every lock/release/confirm socket event now carries lockDate so the
 * server can store and look up locks against a specific booking date.
 * The slot:locked / slot:released broadcasts include lockDate so each
 * client only applies the visual update when their viewDate matches.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useSocket } from '../context/SocketContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// sessionStorage key — persists the last-viewed date across refreshes
const SK_SLOT_DATE = 'tf_slot_date'

async function fetchSlots(turfId, date) {
  try {
    const res = await axios.get(`${API}/bookings/slots`, {
      params: { turf_id: turfId, date },
    })
    return res.data.slots ?? []
  } catch {
    return []
  }
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// Returns the persisted viewing date, falling back to today if it's in the past
function getPersistedDate() {
  const saved = sessionStorage.getItem(SK_SLOT_DATE)
  const today = todayISO()
  return (saved && saved >= today) ? saved : today
}

export function useSlots(onSlotExpired) {
  const { socket, connected } = useSocket()

  const [slots,       setSlots]       = useState({})
  const [loadedTurfs, setLoadedTurfs] = useState(new Set())
  const [lockedSlots, setLockedSlots] = useState({})

  // The date the user is currently viewing — persisted in sessionStorage
  const [viewDate, setViewDate] = useState(getPersistedDate)

  const tickersRef      = useRef({})
  const fetchingRef     = useRef(new Set())
  const lockedSlotsRef  = useRef({})
  const activeTurfIdRef = useRef(null)
  const viewDateRef     = useRef(viewDate)

  // Keep refs in sync with state
  useEffect(() => { lockedSlotsRef.current = lockedSlots }, [lockedSlots])
  useEffect(() => {
    viewDateRef.current = viewDate
    sessionStorage.setItem(SK_SLOT_DATE, viewDate)
  }, [viewDate])

  // ── Countdown ticker ──────────────────────────────────────────────────
  const startTicker = useCallback((slotId, expiresAt) => {
    if (tickersRef.current[slotId]) clearInterval(tickersRef.current[slotId])
    tickersRef.current[slotId] = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
      setLockedSlots(prev => {
        if (!prev[slotId]) { clearInterval(tickersRef.current[slotId]); return prev }
        return { ...prev, [slotId]: { ...prev[slotId], countdown: remaining } }
      })
      if (remaining <= 0) {
        clearInterval(tickersRef.current[slotId])
        delete tickersRef.current[slotId]
      }
    }, 1000)
  }, [])

  const stopTicker = useCallback((slotId) => {
    if (tickersRef.current[slotId]) {
      clearInterval(tickersRef.current[slotId])
      delete tickersRef.current[slotId]
    }
  }, [])

  // ── Patch one slot's visual state ─────────────────────────────────────
  const applyToTurf = useCallback((turfId, slotId, patch) => {
    setSlots(prev => {
      if (!prev[turfId]) return prev
      return {
        ...prev,
        [turfId]: prev[turfId].map(s => s.id === slotId ? { ...s, ...patch } : s),
      }
    })
  }, [])

  // ── Fetch + join room ─────────────────────────────────────────────────
  const ensureSlots = useCallback(async (turfId) => {
    activeTurfIdRef.current = turfId
    if (fetchingRef.current.has(turfId)) return
    fetchingRef.current.add(turfId)

    const date    = viewDateRef.current
    const fetched = await fetchSlots(turfId, date)

    setSlots(prev => ({ ...prev, [turfId]: fetched }))
    setLoadedTurfs(prev => new Set([...prev, turfId]))
    fetchingRef.current.delete(turfId)

    // Send viewDate so the server returns only locks for this date
    socket?.emit('turf:join', { turfId, viewDate: date })
  }, [socket])

  const refreshSlots = useCallback(async (turfId, date) => {
    const today    = todayISO()
    const safeDate = (date && date >= today) ? date : today

    setViewDate(safeDate)
    viewDateRef.current = safeDate

    const fetched = await fetchSlots(turfId, safeDate)

    // Overlay the user's own locked slots only when viewing the date they locked for
    const myLocked = new Set(
      Object.values(lockedSlotsRef.current)
        .filter(l => l.turfId === turfId && l.lockDate === safeDate)
        .map(l => l.slotId)
    )

    setSlots(prev => ({
      ...prev,
      [turfId]: fetched.map(s =>
        myLocked.has(s.id) ? { ...s, status: 'locked', lockedBy: 'you' } : s
      ),
    }))

    socket?.emit('turf:join', { turfId, viewDate: safeDate })
  }, [socket])

  // ── Re-join room on socket reconnect ─────────────────────────────────
  useEffect(() => {
    if (!connected || !socket) return
    const turfId = activeTurfIdRef.current
    if (turfId) {
      fetchingRef.current.delete(turfId)
      ensureSlots(turfId)
    }
  }, [connected]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket event listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    // Server sends locks for the exact viewDate the user joined with.
    // No cross-date bleed — each lock row is date-specific in slot_locks.
    socket.on('turf:current-locks', ({ turfId, locks }) => {
      const myUserId = String(
        JSON.parse(localStorage.getItem('user') ?? '{}')?.id ?? ''
      )

      const myLocks          = locks.filter(l => String(l.userId) === myUserId)
      const lockedByOtherIds = new Set(
        locks.filter(l => String(l.userId) !== myUserId).map(l => l.slotId)
      )
      const myLockedIds = new Set(myLocks.map(l => l.slotId))

      setSlots(prev => {
        if (!prev[turfId]) return prev
        return {
          ...prev,
          [turfId]: prev[turfId].map(s => {
            if (myLockedIds.has(s.id))      return { ...s, status: 'locked', lockedBy: 'you' }
            if (lockedByOtherIds.has(s.id)) return { ...s, status: 'locked', lockedBy: 'other' }
            return s
          }),
        }
      })

      // Restore countdown tickers for the user's own locks after a refresh
      myLocks.forEach(lock => {
        if (!lockedSlotsRef.current[lock.slotId]) {
          const expiresAt = new Date(lock.expiresAt).getTime()
          const countdown = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
          if (countdown <= 0) return

          setSlots(prev => {
            const slot  = prev[turfId]?.find(s => s.id === lock.slotId)
            const label = slot?.label ?? `Slot ${lock.slotId}`

            setLockedSlots(p => ({
              ...p,
              [lock.slotId]: {
                turfId,
                slotId:   lock.slotId,
                label,
                lockDate: viewDateRef.current,   // the date this lock is for
                expiresAt,
                countdown,
              },
            }))
            startTicker(lock.slotId, expiresAt)
            return prev
          })
        }
      })
    })

    // Another user locked a slot — only apply if they locked it for the
    // same date the current user is viewing
    socket.on('slot:locked', ({ turfId, slotId, lockDate }) => {
      if (lockDate !== viewDateRef.current) return   // different date — ignore
      setSlots(prev => {
        if (!prev[turfId]) return prev
        return {
          ...prev,
          [turfId]: prev[turfId].map(s =>
            s.id === slotId && s.lockedBy !== 'you'
              ? { ...s, status: 'locked', lockedBy: 'other' }
              : s
          ),
        }
      })
    })

    // Slot released — only apply if it's for the date being viewed
    socket.on('slot:released', ({ turfId, slotId, lockDate, reason }) => {
      if (lockDate !== viewDateRef.current) return   // different date — ignore

      setSlots(prev => {
        if (!prev[turfId]) return prev
        return {
          ...prev,
          [turfId]: prev[turfId].map(s =>
            s.id === slotId ? { ...s, status: 'free', lockedBy: null } : s
          ),
        }
      })

      const myLock = lockedSlotsRef.current[slotId]
      if (myLock && myLock.turfId === turfId) {
        stopTicker(slotId)
        setLockedSlots(prev => { const n = { ...prev }; delete n[slotId]; return n })
        if (reason === 'expired') onSlotExpired?.(slotId)
      }
    })

    // Slot permanently booked — only apply for the matching date
    socket.on('slot:booked', ({ turfId, slotId, lockDate }) => {
      if (lockDate && lockDate !== viewDateRef.current) return
      setSlots(prev => {
        if (!prev[turfId]) return prev
        return {
          ...prev,
          [turfId]: prev[turfId].map(s =>
            s.id === slotId ? { ...s, status: 'booked', lockedBy: null } : s
          ),
        }
      })
    })

    return () => {
      socket.off('turf:current-locks')
      socket.off('slot:locked')
      socket.off('slot:released')
      socket.off('slot:booked')
    }
  }, [socket, startTicker, stopTicker, onSlotExpired])

  // ── LOCK ──────────────────────────────────────────────────────────────
  // lockDate defaults to viewDate — the date the user is currently browsing
  const lockSlot = useCallback((turfId, slotId, slotLabel) => {
    if (!socket) return
    const lockDate = viewDateRef.current
    socket.emit('slot:lock', { turfId, slotId, lockDate })

    socket.once('slot:lock:ack', ({ ok, turfId: aTurf, slotId: aSlot, lockDate: aDate, expiresAt, reason }) => {
      if (!ok) {
        applyToTurf(aTurf, aSlot, { status: 'locked', lockedBy: 'other' })
        onSlotExpired?.(aSlot, reason)
        return
      }
      applyToTurf(aTurf, aSlot, { status: 'locked', lockedBy: 'you' })
      const countdown = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
      setLockedSlots(prev => ({
        ...prev,
        [aSlot]: {
          turfId:   aTurf,
          slotId:   aSlot,
          label:    slotLabel,
          lockDate: aDate ?? lockDate,   // store which date this lock is for
          expiresAt,
          countdown,
        },
      }))
      startTicker(aSlot, expiresAt)
    })
  }, [socket, applyToTurf, startTicker, onSlotExpired])

  // ── RELEASE ───────────────────────────────────────────────────────────
  const releaseSlot = useCallback((turfId, slotId) => {
    const lock     = lockedSlotsRef.current[slotId]
    const lockDate = lock?.lockDate ?? viewDateRef.current
    stopTicker(slotId)
    setLockedSlots(prev => { const n = { ...prev }; delete n[slotId]; return n })
    applyToTurf(turfId, slotId, { status: 'free', lockedBy: null })
    socket?.emit('slot:release', { turfId, slotId, lockDate })
  }, [socket, stopTicker, applyToTurf])

  const releaseAll = useCallback(() => {
    Object.values(lockedSlotsRef.current).forEach(({ turfId, slotId, lockDate }) => {
      stopTicker(slotId)
      applyToTurf(turfId, slotId, { status: 'free', lockedBy: null })
      socket?.emit('slot:release', { turfId, slotId, lockDate: lockDate ?? viewDateRef.current })
    })
    setLockedSlots({})
  }, [socket, stopTicker, applyToTurf])

  // ── CONFIRM ───────────────────────────────────────────────────────────
  const confirmSlot = useCallback((turfId, slotId) => {
    const lock     = lockedSlotsRef.current[slotId]
    const lockDate = lock?.lockDate ?? viewDateRef.current
    stopTicker(slotId)
    setLockedSlots(prev => { const n = { ...prev }; delete n[slotId]; return n })
    socket?.emit('slot:confirm', { turfId, slotId, lockDate })
  }, [socket, stopTicker])

  const confirmAll = useCallback((turfId) => {
    const mine = Object.values(lockedSlotsRef.current).filter(l => l.turfId === turfId)
    mine.forEach(({ slotId, lockDate }) => {
      stopTicker(slotId)
      socket?.emit('slot:confirm', { turfId, slotId, lockDate: lockDate ?? viewDateRef.current })
    })
    setLockedSlots(prev => {
      const n = { ...prev }
      mine.forEach(({ slotId }) => delete n[slotId])
      return n
    })
  }, [socket, stopTicker])

  const leaveSlotRoom = useCallback((turfId) => {
    activeTurfIdRef.current = null
    socket?.emit('turf:leave', turfId)
  }, [socket])

  const fmtCountdown = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return {
    slots, loadedTurfs, lockedSlots,
    viewDate,
    ensureSlots, refreshSlots,
    lockSlot, releaseSlot, releaseAll,
    confirmSlot, confirmAll,
    leaveSlotRoom, fmtCountdown,
  }
}