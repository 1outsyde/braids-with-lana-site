'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { outsydeClient } from './outsyde'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  loyaltyPoints: number
  profileImageUrl?: string | null
  businessId?: string | null
  username?: string | null
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
        if (!token) {
          if (mounted) setUser(null)
          return
        }
        const { data } = await outsydeClient.get<{ user?: User } & Partial<User>>('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (mounted) setUser(data.user ?? (data.id ? (data as User) : null))
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await outsydeClient.post<{ user: User; accessToken?: string }>('/auth/mobile/login', { email, password })
    if (data.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('outsyde_access_token', data.accessToken)
      document.cookie = `outsyde_access_token=${data.accessToken}; path=/; SameSite=Lax`
    }
    setUser(data.user)
    return data.user
  }

  const register = async (formData: { email: string; password: string; firstName: string; lastName: string }) => {
    const suffix = String(Math.floor(1000 + Math.random() * 9000))
    const username = `${formData.firstName}${formData.lastName}`.toLowerCase().replace(/\s+/g, '') + suffix
    const { data } = await outsydeClient.post<{ user: User; accessToken?: string }>('/auth/register', {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`,
      username,
      role: 'consumer',
      source: 'braids-with-lana',
    })
    if (data.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('outsyde_access_token', data.accessToken)
      document.cookie = `outsyde_access_token=${data.accessToken}; path=/; SameSite=Lax`
    }
    setUser(data.user)
  }

  const logout = async () => {
    await outsydeClient.post('/auth/logout')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('outsyde_access_token')
      document.cookie = 'outsyde_access_token=; path=/; max-age=0'
    }
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
