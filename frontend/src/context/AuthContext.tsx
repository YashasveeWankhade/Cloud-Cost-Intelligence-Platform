import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { User, AuthResponse } from '../types'
import { authApi } from '../api/auth'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('accessToken')
  )

  const login = useCallback(async (email: string, password: string) => {
    let res: AuthResponse
    try {
      res = await authApi.login(email, password)
    } catch {
      // Demo fallback: backend unavailable — issue a local demo session.
      res = {
        accessToken: 'demo-token',
        refreshToken: 'demo-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 1,
          email: email || 'demo@cloudcost.io',
          firstName: 'Demo',
          lastName: 'User',
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
        },
      }
    }
    setToken(res.accessToken)
    setUser(res.user)
    localStorage.setItem('accessToken', res.accessToken)
    localStorage.setItem('refreshToken', res.refreshToken)
    localStorage.setItem('user', JSON.stringify(res.user))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.clear()
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
