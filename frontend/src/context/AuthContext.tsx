import { createContext, useContext, useState, useEffect } from 'react'
import type {ReactNode} from 'react'
import client from '../api/client'

interface User {
  user_id: number
  user_name: string
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ must_change_password: boolean }>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    try {
      const res = await client.get('/api/auth/me')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMe() }, [])

  const login = async (email: string, password: string) => {
    const res = await client.post('/api/auth/login', { email, password })
    setUser(res.data.user)
    return { must_change_password: res.data.must_change_password }
  }

  const logout = async () => {
    await client.post('/api/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}