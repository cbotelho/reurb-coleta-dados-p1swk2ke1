import { supabase } from '@/lib/supabase/client'
import { ReurbProfile } from '@/types/reurb.types'

export const userService = {
  // Buscar perfil do usuário atual
  async getCurrentReurbProfile(): Promise<ReurbProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('reurb_user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil do usuario:', error)
      return null
    }

    return data as ReurbProfile
  },

  // Buscar perfil de um usuário específico (apenas admin)
  async getReurbProfile(userId: string): Promise<ReurbProfile | null> {
    const { data, error } = await supabase
      .from('reurb_user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil do usuario:', error)
      return null
    }

    return data as ReurbProfile
  },

  // Listar todos os perfis de usuário (apenas admin)
  async listReurbProfiles(): Promise<ReurbProfile[]> {
    const { data, error } = await supabase
      .from('reurb_user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao listar perfis de usuario:', error)
      return []
    }

    return data as ReurbProfile[]
  },

  // Atualizar perfil do usuário
  async updateReurbProfile(
    userId: string,
    updates: Partial<Omit<ReurbProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ReurbProfile | null> {
    const { data, error } = await supabase
      .from('reurb_user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil do usuario:', error)
      return null
    }

    return data as ReurbProfile
  },

  // Verificar se o usuário tem uma permissão específica
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Por enquanto, retorna true para admin e verifica no banco para outros
      const profile = await this.getReurbProfile(userId)
      if (!profile) return false
      
      // Se for admin, tem todas as permissões
      if (profile.grupo_acesso === 'Administrador' || profile.grupo_acesso === 'Administradores') {
        return true
      }
      
      // TODO: Implementar verificacao real na tabela de permissoes
      return false
    } catch (error) {
      console.error('Erro ao verificar permissao:', error)
      return false
    }
  }
}
