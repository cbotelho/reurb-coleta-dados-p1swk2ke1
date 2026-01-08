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
  resendConfirmation: (email: string) => Promise<{ error: any }>
  logout: () => void // Alias for signOut
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
      const grupoAcesso = profile?.grupo_acesso || 'Externo'
      const fullName =
        profile?.nome || profile?.nome_usuario || sbUser.user_metadata?.full_name || 'Usuário'

      const mappedUser: User = {
        id: sbUser.id,
        username: profile?.nome_usuario || sbUser.email || '',
        name: fullName,
        firstName: profile?.nome || '',
        lastName: profile?.sobrenome || '',
        email: profile?.email || sbUser.email,
        photoUrl: profile?.foto,
        status: profile?.situacao === 'Ativo' ? 'active' : 'inactive',
        active: profile?.situacao === 'Ativo',
        lastLoginAt: profile?.ultimo_login,
        createdAt: profile?.created_at,
        groupIds: [grupoAcesso], // Fallback if groups not loaded here
      }

      // Update last login
      await supabase
        .from('reurb_profiles')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', sbUser.id)

      setUser(mappedUser)
      // Map roles to permissions
      const permissions = getPermissionsForRole(grupoAcesso)
      setGroups([
        {
          id: grupoAcesso,
          name: getRoleName(grupoAcesso),
          role: grupoAcesso as any,
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

  const getRoleName = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrador'
      case 'admin':
        return 'Administrador'
      case 'operator':
        return 'Operador'
      case 'viewer':
        return 'Visualizador'
      default:
        return role
    }
  }

  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'Administradores':
      case 'super_admin':
        return ['all']
      case 'Administrador':
      case 'admin':
        return [
          'manage_users',
          'edit_projects',
          'view_reports',
          'manage_groups',
        ]
      case 'Vistoriador':
      case 'operator':
        return ['edit_projects', 'view_reports']
      case 'Analista':
      case 'manager':
        return ['edit_projects', 'view_reports']
      default:
        return ['view_only']
    }
  }

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    })
    return { error }
  }

  const signUp = async (email: string, pass: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`
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

  const resendConfirmation = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
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
        logout: signOut,
        resendConfirmation,
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
