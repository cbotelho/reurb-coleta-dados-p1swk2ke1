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

  // Função utilitária para nome do grupo
  const getRoleName = (role: string): string => {
    switch (role) {
      case 'admin':
      case 'Administrador':
      case 'Administradores':
        return 'Administrador'
      case 'vistoriador':
      case 'Vistoriador':
        return 'Vistoriador'
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

  // Função utilitária para permissões
  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
      case 'Administrador':
      case 'Administradores':
        return ['all']
      case 'vistoriador':
      case 'Vistoriador':
        return [
          // CRUD completo
          'projects:read', 'projects:create', 'projects:update', 'projects:delete',
          'properties:read', 'properties:create', 'properties:update', 'properties:delete',
          'quadras:read', 'quadras:create', 'quadras:update', 'quadras:delete',
          'surveys:read', 'surveys:create', 'surveys:update', 'surveys:delete',
          // Documentos
          'documentos:read_all', 'documentos:write_own', 'documentos:delete_own',
          // Imagens
          'image_metadata:read_all', 'image_metadata:write_own', 'image_metadata:delete_own',
        ]
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
            id: crypto.randomUUID(),
            user_id: sbUser.id,
            full_name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Usuário',
            email: sbUser.email,
            role: 'vistoriador',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
        last_login: new Date().toISOString()
      }) 

      // Mapeia para o formato de usuário do frontend
      const mappedUser: User = {
        id: sbUser.id,
        username: sbUser.email?.split('@')[0] || '',
        name: profile.full_name || '',
        firstName: profile.full_name?.split(' ')[0] || '',
        lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
        email: profile.email || sbUser.email || '',
        photoUrl: profile.avatar_url || '',
        status: profile.is_active ? 'active' : 'inactive',
        active: !!profile.is_active,
        lastLoginAt: profile.last_login || '',
        createdAt: profile.created_at,
        groupIds: [profile.role || ''],
        role: profile.role || '',
        // grupo_acesso removido, usar apenas role
      }

      setUser(mappedUser)
      
      // Define os grupos do usuário com base no perfil
      const userRole = profile.role || 'vistoriador'
      const permissions = getPermissionsForRole(userRole)
      
      setGroups([
        {
          id: userRole,
          name: getRoleName(userRole),
          role: userRole as any,
          permissions,
        },
      ])
      
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Erro ao processar sessão do usuário:', error)
      setUser(null)
      setGroups([])
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
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
    if (user.role === 'admin' || 
      user.role === 'Administrador' || 
      user.role === 'Administradores') return true
    
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