/**
 * useSlots.js  —  src/hooks/useSlots.js
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useSocket } from '../context/SocketContext'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

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

export function useSlots(onSlotExpired) {
  const { socket, connected } = useSocket()

  const [slots,       setSlots]       = useState({})
  const [loadedTurfs, setLoadedTurfs] = useState(new Set())
  const [lockedSlots, setLockedSlots] = useState({})

  const tickersRef      = useRef({})         // { [slotId]: intervalId }
  const fetchingRef     = useRef(new Set())  // turfIds mid-fetch
  const lockedSlotsRef  = useRef({})         // mirror of lockedSlots for use in event handlers
  const activeTurfIdRef = useRef(null)       // currently viewed turfId

  // Keep ref in sync with state so event handlers always see latest value
  useEffect(() => { lockedSlotsRef.current = lockedSlots }, [lockedSlots])

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
    // Always re-fetch if we have a socket (gets fresh lock state too)
    fetchingRef.current.add(turfId)

    const fetched = await fetchSlots(turfId, todayISO())

    setSlots(prev => ({ ...prev, [turfId]: fetched }))
    setLoadedTurfs(prev => new Set([...prev, turfId]))
    fetchingRef.current.delete(turfId)

    socket?.emit('turf:join', turfId)
  }, [socket])

  const refreshSlots = useCallback(async (turfId, date) => {
    const fetched  = await fetchSlots(turfId, date)
    const myLocked = new Set(
      Object.values(lockedSlotsRef.current)
        .filter(l => l.turfId === turfId)
        .map(l => l.slotId)
    )
    setSlots(prev => ({
      ...prev,
      [turfId]: fetched.map(s =>
        myLocked.has(s.id) ? { ...s, status: 'locked', lockedBy: 'you' } : s
      ),
    }))
    socket?.emit('turf:join', turfId)
  }, [socket])

  // ── Re-join room on reconnect ─────────────────────────────────────────
  useEffect(() => {
    if (!connected || !socket) return
    const turfId = activeTurfIdRef.current
    if (turfId) {
      // Re-fetch fresh data and re-join socket room
      fetchingRef.current.delete(turfId)  // allow re-fetch
      ensureSlots(turfId)
    }
  }, [connected]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket event listeners ────────────────────────────────────────────
  // Registered once — use refs to access latest state without re-subscribing
  useEffect(() => {
    if (!socket) return

    // Server sends ALL current locks for the turf on join.
    // This is the single source of truth — overlay on fetched slots.
    socket.on('turf:current-locks', ({ turfId, locks }) => {
      const myUserId = String(
        JSON.parse(localStorage.getItem('user') ?? '{}')?.id ?? ''
      )

      // Rebuild lockedSlots for THIS user from server data
      const myLocks = locks.filter(l => String(l.userId) === myUserId)

      setSlots(prev => {
        if (!prev[turfId]) return prev
        const lockedByOtherIds = new Set(
          locks.filter(l => String(l.userId) !== myUserId).map(l => l.slotId)
        )
        const myLockedIds = new Set(myLocks.map(l => l.slotId))
        return {
          ...prev,
          [turfId]: prev[turfId].map(s => {
            if (myLockedIds.has(s.id))      return { ...s, status: 'locked', lockedBy: 'you' }
            if (lockedByOtherIds.has(s.id)) return { ...s, status: 'locked', lockedBy: 'other' }
            return s
          }),
        }
      })

      // Restore tickers for user's own locks (e.g. after page refresh)
      myLocks.forEach(lock => {
        const existing = lockedSlotsRef.current[lock.slotId]
        if (!existing) {
          // Find label from slots
          setSlots(prev => {
            const slot = prev[turfId]?.find(s => s.id === lock.slotId)
            const label = slot?.label ?? `Slot ${lock.slotId}`
            const expiresAt = new Date(lock.expiresAt).getTime()
            const countdown = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))

            setLockedSlots(p => ({
              ...p,
              [lock.slotId]: {
                turfId,
                slotId:   lock.slotId,
                label,
                expiresAt,
                countdown,
              },
            }))
            startTicker(lock.slotId, expiresAt)
            return prev  // don't modify slots here
          })
        }
      })
    })

    // Another user locked a slot — update visually for everyone else
    socket.on('slot:locked', ({ turfId, slotId }) => {
      // Don't overwrite 'you' with 'other'
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

    // Slot released — update visually for ALL users immediately
    socket.on('slot:released', ({ turfId, slotId, reason }) => {
      // Update the slot grid for everyone
      setSlots(prev => {
        if (!prev[turfId]) return prev
        return {
          ...prev,
          [turfId]: prev[turfId].map(s =>
            s.id === slotId ? { ...s, status: 'available', lockedBy: null } : s
          ),
        }
      })

      // If this was MY slot (expired or released by server), clean up timer
      const myLock = lockedSlotsRef.current[slotId]
      if (myLock && myLock.turfId === turfId) {
        stopTicker(slotId)
        setLockedSlots(prev => { const n = { ...prev }; delete n[slotId]; return n })
        if (reason === 'expired') onSlotExpired?.(slotId)
      }
    })

    // Slot permanently booked
    socket.on('slot:booked', ({ turfId, slotId }) => {
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
  }, [socket, startTicker, stopTicker, onSlotExpired]) // NO lockedSlots here — use ref instead

  // ── LOCK ──────────────────────────────────────────────────────────────
  const lockSlot = useCallback((turfId, slotId, slotLabel) => {
    if (!socket) return
    socket.emit('slot:lock', { turfId, slotId })

    socket.once('slot:lock:ack', ({ ok, turfId: aTurf, slotId: aSlot, expiresAt, reason }) => {
      if (!ok) {
        // Race condition — show as locked by other
        applyToTurf(aTurf, aSlot, { status: 'locked', lockedBy: 'other' })
        onSlotExpired?.(aSlot, reason)
        return
      }
      applyToTurf(aTurf, aSlot, { status: 'locked', lockedBy: 'you' })
      const countdown = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
      setLockedSlots(prev => ({
        ...prev,
        [aSlot]: { turfId: aTurf, slotId: aSlot, label: slotLabel, expiresAt, countdown },
      }))
      startTicker(aSlot, expiresAt)
    })
  }, [socket, applyToTurf, startTicker, onSlotExpired])

  // ── RELEASE ───────────────────────────────────────────────────────────
  const releaseSlot = useCallback((turfId, slotId) => {
    // Fix: update UI immediately for the releasing user, don't wait for server echo
    stopTicker(slotId)
    setLockedSlots(prev => { const n = { ...prev }; delete n[slotId]; return n })
    applyToTurf(turfId, slotId, { status: 'available', lockedBy: null })
    // Tell server — it will broadcast to all OTHER users in the room
    socket?.emit('slot:release', { turfId, slotId })
  }, [socket, stopTicker, applyToTurf])

  const releaseAll = useCallback(() => {
    Object.values(lockedSlotsRef.current).forEach(({ turfId, slotId }) => {
      stopTicker(slotId)
      applyToTurf(turfId, slotId, { status: 'available', lockedBy: null })
      socket?.emit('slot:release', { turfId, slotId })
    })
    setLockedSlots({})
  }, [socket, stopTicker, applyToTurf])

  // ── CONFIRM ───────────────────────────────────────────────────────────
  const confirmSlot = useCallback((turfId, slotId) => {
    stopTicker(slotId)
    setLockedSlots(prev => { const n = { ...prev }; delete n[slotId]; return n })
    socket?.emit('slot:confirm', { turfId, slotId })
  }, [socket, stopTicker])

  const confirmAll = useCallback((turfId) => {
    const mine = Object.values(lockedSlotsRef.current).filter(l => l.turfId === turfId)
    mine.forEach(({ slotId }) => {
      stopTicker(slotId)
      socket?.emit('slot:confirm', { turfId, slotId })
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
    ensureSlots, refreshSlots,
    lockSlot, releaseSlot, releaseAll,
    confirmSlot, confirmAll,
    leaveSlotRoom, fmtCountdown,
  }
}