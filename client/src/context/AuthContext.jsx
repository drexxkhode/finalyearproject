import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = '__turfUsers'

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const register = ({ name, email, phone, password }) => {
    const users = getUsers()
    if (users.find(u => u.email === email)) throw new Error('Email already registered.')
    const newUser = { id: `U${Date.now()}`, name, email, phone, password }
    saveUsers([...users, newUser])
    return newUser
  }

  const login = ({ email, password }) => {
    const users = getUsers()
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password.')
    setUser(found)
    return found
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
