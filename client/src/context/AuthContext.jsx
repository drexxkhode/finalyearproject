import { createContext, useContext, useState } from 'react';
import { loginRequest, registerRequest } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const setUser = (u) => {
    if (u) { localStorage.setItem('user', JSON.stringify(u)); setUserState(u) }
    else   { localStorage.removeItem('user'); setUserState(null) }
  }

  const login = async (data) => {
    const res = await loginRequest(data)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user',  JSON.stringify(res.user))
    setUserState(res.user)
    return res.user
  }

  // register now returns token + user from server (auto-login)
  // After register the user is logged in but email_verified = 0
  const register = async (data) => {
    const res = await registerRequest({
      name: data.name, email: data.email,
      contact: data.phone ?? data.contact, password: data.password,
    })
    // Auto-login — store token and user just like login does
    if (res.token && res.user) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user',  JSON.stringify(res.user))
      setUserState(res.user)
    }
    return res
  }

  // Called after email verification — update stored token + user
  // so email_verified flips to 1 without requiring a full re-login
  const updateVerified = (token, updatedUser) => {
    localStorage.setItem('token', token)
    const merged = { ...(JSON.parse(localStorage.getItem('user') ?? '{}')), ...updatedUser }
    localStorage.setItem('user', JSON.stringify(merged))
    setUserState(merged)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, updateVerified }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)