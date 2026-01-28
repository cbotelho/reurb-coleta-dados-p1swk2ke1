import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, UserGroup } from '@/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { userService } from '@/services/userService'

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
  hasPermission: (permission: string) => Promise<boolean>
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
      // Busca o perfil do usuário na tabela reurb_user_profiles
      let profile = await userService.getCurrentReurbProfile()
      
      if (!profile) {
        // Se não existir perfil, tenta criar um com perfil de cidadão
        const { error } = await supabase
          .from('reurb_user_profiles')
          .insert([{
            id: sbUser.id,
            nome_usuario: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Usuário',
            email: sbUser.email,
            grupo_acesso: 'cidadão',
            situacao: 'ativo'
          }])
          
        if (error) {
          console.error('Erro ao criar perfil do usuário:', error)
          throw new Error('Falha ao criar perfil do usuário')
        }
        
        // Busca o perfil recém-criado
        const newProfile = await userService.getReurbProfile(sbUser.id)
        if (!newProfile) {
          throw new Error('Falha ao carregar perfil recém-criado')
        }
        profile = newProfile
      }

      // Atualiza último login
      await userService.updateReurbProfile(sbUser.id, {
        ultimo_login: new Date().toISOString()
      })

      // Mapeia para o formato de usuário do frontend
      const mappedUser: User = {
        id: sbUser.id,
        username: sbUser.email?.split('@')[0] || '',
        name: profile.nome_usuario || profile.nome || '',
        firstName: profile.nome_usuario?.split(' ')[0] || '',
        lastName: profile.nome_usuario?.split(' ').slice(1).join(' ') || '',
        email: profile.email || sbUser.email || '',
        photoUrl: profile.foto,
        status: profile.situacao === 'ativo' ? 'active' : 'inactive',
        active: profile.situacao === 'ativo',
        lastLoginAt: profile.ultimo_login,
        createdAt: profile.created_at,
        groupIds: [profile.grupo_acesso || ''],
        role: profile.grupo_acesso || '',
        grupo_acesso: profile.grupo_acesso || ''
      }

      setUser(mappedUser)
      
      // Define os grupos do usuário com base no perfil
      const userRole = profile.grupo_acesso || 'cidadão'
      const permissions = getPermissionsForRole(userRole)
      
      setGroups([
        {
          id: userRole,
          name: getRoleName(userRole),
          role: userRole,
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
      case 'Administrador':
      case 'Administradores':
        return 'Administrador'
      case 'tecnico':
        return 'Técnico'
      case 'gestor':
        return 'Gestor'
      case 'cidadão':
        return 'Cidadão'
      default:
        return role
    }
  }

  const getPermissionsForRole = (role: string): string[] => {
    // Este método agora é apenas para permissões locais do frontend
    // As permissões reais são verificadas no banco de dados
    switch (role) {
      case 'Administrador':
      case 'Administradores':
      case 'admin':
        return ['all']
      case 'gestor':
      case 'SEHAB':
        return ['manage_projects', 'view_reports', 'manage_documents']
      case 'tecnico':
      case 'Técnicos Amapá Terra':
        return ['edit_projects', 'view_reports', 'upload_documents']
      case 'Next Ambiente':
        return ['view_only']
      case 'Externo':
      case 'Externo Editar':
        return ['edit_projects']
      case 'cidadão':
        return ['view_own_data', 'upload_documents']
      default:
        return []
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

  const hasPermission = useCallback(async (permission: string) => {
    if (!user) return false
    
    // Se for admin, tem todas as permissões
    if (user.grupo_acesso === 'Administrador' || user.grupo_acesso === 'Administradores') return true
    
    // Verifica a permissão no banco de dados
    try {
      return await userService.hasPermission(user.id, permission)
    } catch (error) {
      console.error('Erro ao verificar permissão:', error)
      return false
    }
  }, [user])

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
