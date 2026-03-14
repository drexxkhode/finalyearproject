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

  const register = async (data) => {
    return await registerRequest({
      name: data.name, email: data.email,
      contact: data.phone, password: data.password,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)