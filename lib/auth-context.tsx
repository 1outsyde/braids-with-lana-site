'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { outsydeClient } from './outsyde'
import { clearReferralCode, normalizeReferralCode, storedReferralCode } from './referral'

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
  // Display name (users.name). /api/auth/me returns these since backend 2026-10-18.
  name?: string | null
  displayName?: string | null
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: { email: string; password: string; firstName: string; lastName: string; referralCode?: string | null }) => Promise<{ referralApplied: boolean }>
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
        const { data } = await outsydeClient.get<{ user?: User } & Partial<User>>('/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  // referralCode: undefined = use a code kept from an invite link this visit (signup inside booking);
  // null or '' = the customer cleared the field, send none. Never fails the signup (Outsyde referral Step 6).
  const register = async (input: { email: string; password: string; firstName: string; lastName: string; referralCode?: string | null }) => {
    const { referralCode: typedCode, ...formData } = input
    const referralCode = typedCode === undefined ? storedReferralCode() : normalizeReferralCode(typedCode)
    const suffix = String(Math.floor(1000 + Math.random() * 9000))
    // First name only: the last name is never part of anything public (Outsyde display name rule).
    const username = (formData.firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member') + suffix
    const { data } = await outsydeClient.post<{ user: User; accessToken?: string; referralApplied?: boolean }>('/auth/register', {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`,
      username,
      role: 'consumer',
      source: 'braids-with-lana',
      ...(referralCode ? { referralCode } : {}),
    })
    if (data.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('outsyde_access_token', data.accessToken)
      document.cookie = `outsyde_access_token=${data.accessToken}; path=/; SameSite=Lax`
    }
    clearReferralCode()
    setUser(data.user)
    return { referralApplied: data.referralApplied === true }
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
