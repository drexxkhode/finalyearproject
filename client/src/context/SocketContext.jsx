/**
 * SocketContext.jsx  —  src/context/SocketContext.jsx
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_API_URL ?? 'http://localhost:5000'

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!user) return

    // Get the JWT token — this is what the server auth middleware expects
    const token = localStorage.getItem('token')
    if (!token) return

    if (socketRef.current?.connected) return

    const socket = io(SOCKET_URL, {
      auth:       { token },          // ← send JWT, not just userId
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay:    1000,
    })

    socket.on('connect',       () => setConnected(true))
    socket.on('disconnect',    () => setConnected(false))
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message))

    socketRef.current = socket

    return () => {
      setTimeout(() => {
        if (socketRef.current === socket) {
          socket.disconnect()
          socketRef.current = null
          setConnected(false)
        }
      }, 100)
    }
  }, [user?.id])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext);