import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '@/services/db' // Still used for Group Definitions mockup
import { User, UserGroup } from '@/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'

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
  const [session, setSession] = useState<Session | null>(null)
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        mapSupabaseUser(session.user)
      } else {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        mapSupabaseUser(session.user)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const mapSupabaseUser = (sbUser: any) => {
    // Map Supabase user to local User type
    // In a real app, we would fetch user profile from 'profiles' table
    // Here we will just use the metadata
    const mappedUser: User = {
      id: sbUser.id,
      username: sbUser.email || '',
      name: sbUser.user_metadata?.full_name || sbUser.email || 'Usuário',
      groupIds: ['g1'], // Defaulting to Master for demo purposes
      active: true,
    }
    setUser(mappedUser)

    // Load groups (mocked locally for now as role management is advanced)
    const allGroups = db.getGroups()
    const userGroups = allGroups.filter((g) =>
      mappedUser.groupIds.includes(g.id),
    )
    setGroups(userGroups)

    setIsAuthenticated(true)
    setIsLoading(false)
  }

  const login = async (username: string, pass: string) => {
    setIsLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: pass,
    })

    if (error) {
      toast.error(error.message || 'Credenciais inválidas.')
      setIsLoading(false)
      return false
    }

    if (data.user) {
      toast.success('Login realizado com sucesso!')
      return true
    }

    return false
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setGroups([])
    setIsAuthenticated(false)
    toast.info('Sessão encerrada.')
  }

  const hasPermission = (permission: string) => {
    if (!groups.length) return false
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
