import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, UserGroup } from '@/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  groups: UserGroup[]
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, pass: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    pass: string,
    fullName: string,
  ) => Promise<{ error: any }>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user)
      } else {
        setIsLoading(false)
      }
    })

    // Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // We call handleUserSession but avoid awaiting it to keep callback sync
        // React state updates inside handleUserSession will trigger re-renders naturally
        handleUserSession(session.user)
      } else {
        setUser(null)
        setGroups([])
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUserSession = async (sbUser: SupabaseUser) => {
    try {
      // Fetch profile data from 'reurb_profiles' table
      const { data: profile, error } = await supabase
        .from('reurb_profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      }

      // Default role if profile is missing (fallback)
      const role = profile?.role || 'viewer'
      const fullName =
        profile?.full_name || sbUser.user_metadata?.full_name || 'Usuário'

      const mappedUser: User = {
        id: sbUser.id,
        username: sbUser.email || '',
        name: fullName,
        groupIds: [role], // Use role as group ID for simplicity in this implementation
        active: true,
      }

      setUser(mappedUser)
      // Map roles to permissions (Simplified Mock Logic)
      const permissions = getPermissionsForRole(role)
      setGroups([
        {
          id: role,
          name: role.charAt(0).toUpperCase() + role.slice(1),
          role: role as any,
          permissions,
        },
      ])

      setIsAuthenticated(true)
    } catch (e) {
      console.error('Auth handling error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['all']
      case 'manager':
        return ['edit_projects', 'view_reports']
      default:
        return ['view_only']
    }
  }

  const signIn = async (email: string, pass: string) => {
    // Trimming email prevents 400 Bad Request due to whitespace
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    })
    return { error }
  }

  const signUp = async (email: string, pass: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`
    // Trimming email prevents 400 Bad Request due to whitespace
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: redirectUrl,
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
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
        signIn,
        signUp,
        signOut,
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
