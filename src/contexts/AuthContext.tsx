import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '@/services/db'
import { User, UserGroup } from '@/types'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  group: UserGroup | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, pass: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [group, setGroup] = useState<UserGroup | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check local storage or session for persisted login (simplified: assume session storage for user id)
    const savedUserId = sessionStorage.getItem('reurb_user_id')
    if (savedUserId) {
      // In a real app we would re-fetch user from DB
      // For this mock, we don't have a direct "getUserById" exposed publicly but let's assume we can get it
      // I'll skip complexity and force re-login on refresh for security unless I add getUserById to DB.
      // Actually let's add simple re-hydration:
      // Since I can't easily add methods to DB without editing it again and I already wrote it,
      // I'll rely on Login page for now or simple "Auto login" if I had the user object.
      // Let's implement logout on refresh for security in this sensitive app context,
      // OR better, store user object in session storage.
      const savedUserStr = sessionStorage.getItem('reurb_user')
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr)
        const g = db.getUserGroup(u.groupId)
        setUser(u)
        setGroup(g || null)
        setIsAuthenticated(true)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, pass: string) => {
    setIsLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const user = db.authenticate(username, pass)
    if (user) {
      const userGroup = db.getUserGroup(user.groupId)
      setUser(user)
      setGroup(userGroup || null)
      setIsAuthenticated(true)
      sessionStorage.setItem('reurb_user', JSON.stringify(user))
      toast.success(`Bem-vindo, ${user.name}!`)
      setIsLoading(false)
      return true
    } else {
      toast.error('Credenciais inválidas.')
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setGroup(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem('reurb_user')
    toast.info('Sessão encerrada.')
  }

  const hasPermission = (permission: string) => {
    if (!group) return false
    if (group.permissions.includes('all')) return true
    return group.permissions.includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        group,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
