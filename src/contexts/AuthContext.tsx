import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '@/services/db'
import { User, UserGroup } from '@/types'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  groups: UserGroup[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, pass: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUserStr = sessionStorage.getItem('reurb_user')
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr)
        const allGroups = db.getGroups()
        const userGroups = allGroups.filter((g) => u.groupIds.includes(g.id))
        setUser(u)
        setGroups(userGroups)
        setIsAuthenticated(true)
      } catch (e) {
        console.error('Failed to parse saved user', e)
        sessionStorage.removeItem('reurb_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, pass: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const user = db.authenticate(username, pass)
    if (user) {
      const allGroups = db.getGroups()
      const userGroups = allGroups.filter((g) => user.groupIds.includes(g.id))
      setUser(user)
      setGroups(userGroups)
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
    setGroups([])
    setIsAuthenticated(false)
    sessionStorage.removeItem('reurb_user')
    toast.info('Sessão encerrada.')
  }

  const hasPermission = (permission: string) => {
    if (!groups.length) return false
    // Check if any group has the permission or 'all'
    return groups.some(
      (g) =>
        g.permissions.includes('all') || g.permissions.includes(permission),
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        groups,
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
