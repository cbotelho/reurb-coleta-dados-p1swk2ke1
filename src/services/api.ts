import { supabase } from '@/lib/supabase/client'
import {
  Project,
  Quadra,
  Lote,
  DashboardStats,
  User,
  Survey,
  ProductivityData,
  ModalityData,
  RecentActivityItem,
  TitlingGoalData,
  UserGroup,
} from '@/types'
import { db } from './db'
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { decryptApiKey, encryptApiKey } from '@/utils/encryption'

const base64ToBlob = (base64: string, mimeType: string = 'application/octet-stream') => {
  const arr = base64.split(',')
  const dataStr = arr.length > 1 ? arr[1] : base64
  const bstr = atob(dataStr)
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mimeType })
}

const mapProject = (row: any): Project => ({
  id: 0,
  local_id: row.id,
  sync_status: 'synchronized',
  date_added: new Date(row.created_at).getTime(),
  date_updated: new Date(row.updated_at).getTime(),
  name: row.name || row.field_348 || `Projeto ${row.id}`, // Usando name como prioridade
  description: row.description || row.field_350 || '', // Usando field_350 como description
  image_url: row.image_url || '',
  latitude: row.latitude?.toString(),
  longitude: row.longitude?.toString(),
  auto_update_map: row.auto_update_map,
  last_map_update: row.last_map_update
    ? new Date(row.last_map_update).getTime()
    : 0,
  created_by: row.created_by,
  tags: row.tags || [],
  city: row.city,
  state: row.state,
  status: row.status,
})

const mapQuadra = (row: any): Quadra => ({
  id: 0,
  local_id: row.id,
  sync_status: 'synchronized',
  date_added: new Date(row.created_at).getTime(),
  date_updated: new Date(row.updated_at).getTime(),
  name: row.name,
  area: row.area || '',
  description: row.description || '',
  parent_item_id: row.project_id,
  document_url: row.document_url,
  image_url: row.image_url,
})

const mapLote = (row: any): Lote => ({
  id: 0,
  local_id: row.id,
  sync_status: 'synchronized',
  date_added: new Date(row.created_at).getTime(),
  date_updated: new Date(row.updated_at).getTime(),
  name: row.name,
  address: row.address || '',
  area: row.area || '',
  description: row.description || '',
  images: row.images || [],
  latitude: row.latitude?.toString(),
  longitude: row.longitude?.toString(),
  parent_item_id: row.quadra_id || row.parent_item_id, // Garante consistência para busca local
  status: row.status || 'not_surveyed',
})

const getPermissionsForGroup = (group: string): string[] => {
  switch (group) {
    case 'admin':
    case 'Administrador':
    case 'Administradores':
      return ['all']
    case 'Assistente Social':
      return [
        'insert_survey', 'edit_survey', 'view_project', 'view_quadra', 'view_lote',
        'create_social_report', 'edit_social_report', 'delete_social_report',
        'print_reports', 'generate_ai_report'
      ]
    case 'Jurídico': // (Assumido similar a Assistente, mas focado em parecer legal, ajustado conforme necessidade)
      return [
        'view_project', 'view_quadra', 'view_lote', 'view_survey',
        'create_legal_report', 'edit_legal_report', 'print_reports'
      ]
    case 'Técnico':
    case 'vistoriador':
    case 'Vistoriador':
      return [
        'insert_lote', 'edit_lote', 'insert_survey', 'edit_survey',
        'view_social_report', 'generate_ai_report', 'print_reports'
      ]
    case 'Next':
    case 'Next Ambiente': // Manter compatibilidade
      return ['view_only']
    // Legados para garantir compatibilidade
    case 'SEHAB':
      return ['manage_users', 'edit_projects', 'view_reports', 'manage_groups']
    case 'Externo':
    case 'viewer':
    default:
      return ['view_only']
  }
}

// CORREÇÃO: Usar grupo_acesso em vez de role
const mapProfile = (row: any): User => ({
  id: row.user_id,
  username: row.nome_usuario || row.full_name || '',
  firstName: row.nome || row.full_name?.split(' ')[0] || '',
  lastName: row.sobrenome || row.full_name?.split(' ').slice(1).join(' ') || '',
  name: row.nome_usuario || row.full_name || 'Usuário',
  email: row.email,
  photoUrl: row.foto || row.avatar_url || '',
  status: row.situacao === 'ativo' || row.is_active ? 'active' : 'inactive',
  lastLoginAt: row.ultimo_login,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdById: row.criado_por,
  createdBy: undefined,
  groupIds: [row.grupo_acesso || row.role], // Usar grupo_acesso como prioridade
  groupNames: [row.grupo_acesso || row.role],
  active: row.situacao === 'ativo' || !!row.is_active,
  role: row.grupo_acesso || row.role, // Usar grupo_acesso
  grupo_acesso: row.grupo_acesso || row.role,
})

const mapSurvey = (row: any): Survey => ({
  ...row,
  sync_status: 'synchronized',
  residents_count: row.residents_count || 0,
  rooms_count: row.rooms_count || 0,
  has_children: row.has_children ?? false,
  survey_date: row.survey_date?.split('T')[0],
  documents: row.documents ? (typeof row.documents === 'string' ? JSON.parse(row.documents) : row.documents) : [],
})

const isOnline = () => navigator.onLine

export const api = {
  async getAppConfig(): Promise<Record<string, string>> {
    if (!isOnline()) return {}
    try {
      const { data, error } = await supabase
        .from('reurb_app_config')
        .select('*')
      if (error) {
        console.error('Error fetching app config:', error)
        return {}
      }
      const config: Record<string, string> = {}
      data?.forEach((row: any) => {
        // Descriptografar a chave do Google Maps
        if (row.key === 'google_maps_api_key') {
          config[row.key] = decryptApiKey(row.value)
        } else {
          config[row.key] = row.value
        }
      })
      return config
    } catch (e) {
      console.error('Error in getAppConfig:', e)
      return {}
    }
  },

  async setAppConfig(key: string, value: string): Promise<boolean> {
    if (!isOnline()) return false
    try {
      // Criptografar a chave do Google Maps antes de salvar
      const encryptedValue = key === 'google_maps_api_key' 
        ? encryptApiKey(value) 
        : value
      
      const { error } = await supabase
        .from('reurb_app_config')
        .upsert({ 
          key, 
          value: encryptedValue,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)

      if (error) {
        console.error('Error saving app config:', error)
        return false
      }
      return true
    } catch (e) {
      console.error('Error in setAppConfig:', e)
      return false
    }
  },

  // Projects
  async getProjectStats(projectId: string): Promise<{ quadras: number; lotes: number }> {
    if (!isOnline()) return { quadras: 0, lotes: 0 } // TODO: Implement offline stats count if needed

    try {
      const { count: quadras } = await supabase
        .from('reurb_quadras')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      const { count: lotes } = await supabase
        .from('reurb_properties')
        .select('*, reurb_quadras!inner(project_id)', { count: 'exact', head: true })
        .eq('reurb_quadras.project_id', projectId)

      return {
        quadras: quadras || 0,
        lotes: lotes || 0
      }
    } catch (e) {
      console.error('Error fetching project stats:', e)
      return { quadras: 0, lotes: 0 }
    }
  },

  async getProjects(): Promise<Project[]> {
    if (!isOnline()) return db.getProjects()

    try {
      const { data, error } = await supabase
        .from('reurb_projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const projects = (data || []).map(mapProject)
      
      // Wipe & Map Strategy: Limpar seeds antes de atualizar com dados reais
      db.purgeSeedProjects()
      
      projects.forEach((p) => db.updateProject(p))
      return projects
    } catch (e) {
      console.warn('API getProjects failed, using cache', e)
      return db.getProjects()
    }
  },

  async getProject(id: string): Promise<Project | null> {
    if (!isOnline()) return db.getProject(id) || null

    try {
      const { data, error } = await supabase
        .from('reurb_projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const project = mapProject(data)
      db.updateProject(project)
      return project
    } catch {
      return db.getProject(id) || null
    }
  },

  async updateProject(id: string, updates: Record<string, any>): Promise<Project> {
    if (!isOnline()) {
      const current = db.getProject(id)
      if (current) {
        const updated = { ...current, ...updates, date_updated: Date.now() }
        db.updateProject(updated)
        return updated
      }
      throw new Error('Offline project not found')
    }

    console.log('Updating project ID:', id)
    console.log('Raw updates received:', updates)
    
    // Check current user and permissions
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user?.id, user?.email)
    
    // Check user profile and permissions
    // CORREÇÃO: Usar grupo_acesso em vez de role
    const { data: profile } = await supabase
      .from('reurb_user_profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single()
    
    console.log('User profile:', profile)
    console.log('User grupo_acesso:', profile?.grupo_acesso)

    // Prepare update payload
    const payload: any = {
      updated_at: new Date().toISOString()
    }

    // Add only provided fields to payload
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.city !== undefined) payload.city = updates.city
    if (updates.state !== undefined) payload.state = updates.state
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.latitude !== undefined) payload.latitude = updates.latitude ? parseFloat(updates.latitude) : null
    if (updates.longitude !== undefined) payload.longitude = updates.longitude ? parseFloat(updates.longitude) : null
    if (updates.image_url !== undefined) payload.image_url = updates.image_url
    if (updates.tags !== undefined) payload.tags = updates.tags

    console.log('Update payload:', payload)

    const { data, error } = await supabase
      .from('reurb_projects')
      .update(payload)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      throw error
    }
    
    console.log('Update result:', data)
    console.log('Update affected rows:', data?.length || 0)
    
    // Fetch final project state
    const { data: finalProject, error: fetchError } = await supabase
      .from('reurb_projects')
      .select('*')
      .eq('id', id)
      .single()
      
    if (fetchError) {
      console.error('Error fetching final project:', fetchError)
      throw fetchError
    }
    
    console.log('Final project state:', finalProject)
    const project = mapProject(finalProject)
    db.updateProject(project)
    return project
  },

  async deleteProject(id: string): Promise<void> {
    if (!isOnline()) {
      console.log('[API] Deleting project locally:', id)
      db.deleteProject(id)
      return
    }

    const { error } = await supabase
      .from('reurb_projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Quadras
  async getQuadras(projectId: string): Promise<Quadra[]> {
    if (!isOnline()) return db.getQuadrasByProject(projectId)

    try {
      const { data, error } = await supabase
        .from('reurb_quadras')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const quadras = (data || []).map(mapQuadra)
      quadras.forEach((q) => db.saveQuadra(q))
      return quadras
    } catch (e) {
      return db.getQuadrasByProject(projectId)
    }
  },

  async getQuadra(id: string): Promise<Quadra | null> {
    if (!isOnline()) return db.getQuadra(id) || null

    try {
      const { data, error } = await supabase
        .from('reurb_quadras')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const q = mapQuadra(data)
      db.saveQuadra(q)
      return q
    } catch {
      return db.getQuadra(id) || null
    }
  },

  async updateQuadra(id: string, updates: Partial<Quadra>): Promise<Quadra> {
    if (!isOnline()) {
      const current = db.getQuadra(id)
      if (current) {
        const updated = { ...current, ...updates, date_updated: Date.now() }
        db.saveQuadra(updated)
        return updated
      }
      throw new Error('Offline quadra not found')
    }

    console.log('Updating quadra ID:', id)
    console.log('Raw updates received:', updates)

    // Prepare update payload
    const payload: any = {
      updated_at: new Date().toISOString()
    }

    // Add only provided fields to payload
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.area !== undefined) payload.area = updates.area
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.document_url !== undefined) payload.document_url = updates.document_url
    if (updates.image_url !== undefined) payload.image_url = updates.image_url

    const { data, error } = await supabase
      .from('reurb_quadras')
      .update(payload)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }
    
    // Fetch final quadra state
    const { data: finalQuadra, error: fetchError } = await supabase
      .from('reurb_quadras')
      .select('*')
      .eq('id', id)
      .single()
      
    if (fetchError) {
      console.error('Error fetching final quadra:', fetchError)
      throw fetchError
    }
    
    const quadra = mapQuadra(finalQuadra)
    db.saveQuadra(quadra)
    return quadra
  },

  // CORREÇÃO: Adicionar método deleteQuadra no db.ts ou usar método existente
  async deleteQuadra(id: string): Promise<void> {
    if (!isOnline()) {
      // Remover do cache local
      db.deleteQuadra(id)
      return
    }

    const { error } = await supabase
      .from('reurb_quadras')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    if (!isOnline()) {
      const newProject = {
        id: 0,
        local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: project.name || '',
        description: project.description || '',
        latitude: project.latitude || '',
        longitude: project.longitude || '',
        image_url: project.image_url || '',
        date_added: Date.now(),
        date_updated: Date.now(),
        sync_status: 'pending' as const,
      }
      const projects = db.getProjects()
      projects.push(newProject)
      db.saveItems('reurb_projects', projects)
      return newProject
    }

    try {
      const { data, error } = await supabase
        .from('reurb_projects')
        .insert({
          name: project.name,
          description: project.description,
          latitude: project.latitude ? parseFloat(project.latitude) : null,
          longitude: project.longitude ? parseFloat(project.longitude) : null,
          image_url: project.image_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      const mappedProject: Project = {
        id: 0,
        local_id: (data as any).id,
        sync_status: 'synchronized',
        date_added: Date.now(),
        date_updated: Date.now(),
        name: project.name || `Projeto ${(data as any).id}`,
        description: project.description || '',
        image_url: project.image_url || '',
        latitude: project.latitude || '',
        longitude: project.longitude || '',
      }
      
      const projects = db.getProjects()
      projects.push(mappedProject)
      db.saveItems('reurb_projects', projects)
      return mappedProject
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  async createQuadra(quadra: Partial<Quadra> & { project_id: string }): Promise<Quadra> {
    if (!isOnline()) {
      const newQuadra = {
        id: 0,
        local_id: Date.now().toString(),
        sync_status: 'pending' as const,
        date_added: Date.now(),
        date_updated: Date.now(),
        name: quadra.name || '',
        area: quadra.area || '',
        description: quadra.description || '',
        parent_item_id: quadra.project_id,
        document_url: quadra.document_url,
        image_url: quadra.image_url,
      }
      db.saveQuadra(newQuadra)
      return newQuadra
    }

    const payload: any = {
      name: quadra.name,
      area: quadra.area,
      description: quadra.description,
      project_id: quadra.project_id,
      document_url: quadra.document_url,
      image_url: quadra.image_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const { data, error } = await supabase
        .from('reurb_quadras')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const saved = mapQuadra(data)
      db.saveQuadra(saved)
      return saved
    } catch (e) {
      console.warn('Create quadra failed, saving locally', e)
      const newQuadra = {
        id: 0,
        local_id: Date.now().toString(),
        sync_status: 'pending' as const,
        date_added: Date.now(),
        date_updated: Date.now(),
        name: quadra.name || '',
        area: quadra.area || '',
        description: quadra.description || '',
        parent_item_id: quadra.project_id,
        document_url: quadra.document_url,
        image_url: quadra.image_url,
      }
      db.saveQuadra(newQuadra)
      return newQuadra
    }
  },

  // Lotes
  async getLotes(quadraId: string): Promise<Lote[]> {
    if (!isOnline()) return db.getLotesByQuadra(quadraId)

    try {
      const { data, error } = await supabase
        .from('reurb_properties')
        .select('*')
        .eq('quadra_id', quadraId)
        .order('name', { ascending: true })

      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const lotes = (data || []).map(mapLote)
      lotes.forEach((l) => db.saveLote(l, quadraId))
      return lotes
    } catch (e) {
      return db.getLotesByQuadra(quadraId)
    }
  },

  async getAllLotes(): Promise<Lote[]> {
    if (!isOnline()) return db.getAllLotes()

    try {
      const { data, error } = await supabase
        .from('reurb_properties')
        .select('*')
        .limit(2000)

      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const lotes = (data || []).map(mapLote)
      lotes.forEach((l) => l.parent_item_id && db.saveLote(l, l.parent_item_id))
      return lotes
    } catch (e) {
      return db.getAllLotes()
    }
  },

  async getLote(id: string): Promise<Lote | null> {
    console.log('🔍 getLote chamado para ID:', id)
    
    // 1. SEMPRE buscar do LocalStorage PRIMEIRO (offline-first pattern)
    console.log('💾 Buscando lote do LocalStorage (offline-first)...')
    const localLote = db.getLote(id)
    
    if (localLote) {
      console.log('✅ Lote encontrado no LocalStorage:', {
        name: localLote.name,
        address: localLote.address,
        latitude: localLote.latitude,
        longitude: localLote.longitude,
        sync_status: localLote.sync_status,
      })
      
      // Se está pendente de sync, retorna dados locais
      if (localLote.sync_status === 'pending' || localLote.sync_status === 'failed') {
        console.log('📌 Lote com sync pendente, usando dados locais')
        return localLote
      }
      
      // Se já está sincronizado, tenta atualizar do Supabase em background
      if (isOnline()) {
        try {
          console.log('🔄 Atualizando lote do Supabase em background...')
          const { data } = await supabase
            .from('reurb_properties')
            .select('*')
            .eq('id', id)
            .single()
          
          if (data) {
            const updatedLote = mapLote(data)
            if (updatedLote.parent_item_id) {
              db.saveLote(updatedLote, updatedLote.parent_item_id)
            }
            return updatedLote
          }
        } catch (error) {
          console.warn('⚠️ Falha ao atualizar do Supabase, usando cache local:', error)
        }
      }
      
      // Retorna dados locais se Supabase falhou ou offline
      return localLote
    }
    
    // 2. Se não existe local, buscar do Supabase (novo lote)
    if (isOnline()) {
      try {
        console.log('🌐 Lote não encontrado localmente, buscando no Supabase...')
        const { data, error } = await supabase
          .from('reurb_properties')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.warn('⚠️ Erro ao buscar do Supabase:', error)
          throw error
        }
        
        if (data) {
          console.log('✅ Lote encontrado no Supabase:', {
            name: data.name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
          })
          
          const lote = mapLote(data)
          // Salvar no cache local
          if (lote.parent_item_id) {
            db.saveLote(lote, lote.parent_item_id)
          }
          return lote
        }
      } catch (error) {
        console.error('❌ Falha ao buscar do Supabase:', error)
      }
    }
    
    // 3. Lote não encontrado em nenhum lugar
    console.warn('⚠️ Lote não encontrado nem no LocalStorage nem no Supabase')
    return null
  },

  async saveLote(lote: Partial<Lote> & { quadra_id?: string }): Promise<Lote> {
    const resolvedQuadraId = lote.quadra_id || lote.parent_item_id

    if (!isOnline()) {
      return db.saveLote(
        { ...lote, sync_status: 'pending' },
        resolvedQuadraId || '',
      )
    }

    const payload: any = {
      name: lote.name,
      address: lote.address,
      area: lote.area,
      description: lote.description,
      images: lote.images,
      latitude: lote.latitude ? parseFloat(lote.latitude) : null,
      longitude: lote.longitude ? parseFloat(lote.longitude) : null,
      updated_at: new Date().toISOString(),
      status: lote.status,
    }

    if (resolvedQuadraId) payload.quadra_id = resolvedQuadraId

    try {
      let query
      if (
        lote.local_id &&
        lote.local_id.length > 10 &&
        lote.local_id.includes('-')
      ) {
        query = supabase
          .from('reurb_properties')
          .update(payload)
          .eq('id', lote.local_id)
          .select()
          .single()
      } else {
        if (!resolvedQuadraId) throw new Error('Quadra ID required')
        query = supabase
          .from('reurb_properties')
          .insert(payload)
          .select()
          .single()
      }

      const { data, error } = await query
      if (error) {
        console.error('PostgREST', error.code, error.details, error.hint, error.message)
        throw error
      }
      const saved = mapLote(data)
      db.saveLote(
        { ...saved, sync_status: 'synchronized' },
        saved.parent_item_id,
      )
      return saved
    } catch (e) {
      console.warn('Save lote failed, saving locally', e)
      return db.saveLote(
        { ...lote, sync_status: 'pending' },
        resolvedQuadraId || '',
      )
    }
  },

  async deleteLote(id: string): Promise<void> {
    if (!isOnline()) {
      db.deleteLote(id)
      return
    }
    await supabase.from('reurb_properties').delete().eq('id', id)
    db.deleteLote(id)
  },

  async updateLote(id: string, updates: Record<string, any>): Promise<Lote> {
    if (!isOnline()) {
      const current = db.getLote(id)
      if (current) {
        const updated = { ...current, ...updates, date_updated: Date.now() }
        db.saveLote(updated, current.parent_item_id)
        return updated
      }
      throw new Error('Offline lote not found')
    }

    console.log('Updating lote ID:', id)
    console.log('Raw updates received:', updates)

    // Prepare update payload
    const payload: any = {
      updated_at: new Date().toISOString()
    }

    // Add only provided fields to payload
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.address !== undefined) payload.address = updates.address
    if (updates.area !== undefined) payload.area = updates.area
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.latitude !== undefined) {
      payload.latitude = updates.latitude ? parseFloat(String(updates.latitude)) : null
    }
    if (updates.longitude !== undefined) {
      payload.longitude = updates.longitude ? parseFloat(String(updates.longitude)) : null
    }
    if (updates.images !== undefined) payload.images = updates.images

    const { data, error } = await supabase
      .from('reurb_properties')
      .update(payload)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }
    
    // Fetch final lote state
    const { data: finalLote, error: fetchError } = await supabase
      .from('reurb_properties')
      .select('*')
      .eq('id', id)
      .single()
      
    if (fetchError) {
      console.error('Error fetching final lote:', fetchError)
      throw fetchError
    }
    
    const lote = mapLote(finalLote)
    db.saveLote(lote, lote.parent_item_id)
    return lote
  },

  // Surveys
  async getSurveyByPropertyId(propertyId: string): Promise<Survey | null> {
    console.log('🔍 getSurveyByPropertyId chamado para:', propertyId)
    // Validação de UUID
    const isUuid = (val: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val)
    if (!isUuid(propertyId)) {
      console.warn('❌ propertyId inválido, abortando query:', propertyId)
      return null
    }
    if (!isOnline()) {
      console.log('💾 Offline, buscando vistoria do LocalStorage')
      return db.getSurveyByPropertyId(propertyId) || null
    }
    try {
      console.log('🌐 Buscando vistoria no Supabase...')
      const { data, error } = await supabase
        .from('reurb_surveys')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      console.log('📊 Resposta Supabase:', { 
        encontrou: !!data, 
        erro: error?.message,
        vistoria_id: data?.id,
        applicant_name: data?.applicant_name,
        created_at: data?.created_at
      })
      if (error) {
        console.warn('⚠️ Erro ao buscar vistoria:', error)
        return db.getSurveyByPropertyId(propertyId) || null
      }
      if (!data) {
        console.log('ℹ️ Nenhuma vistoria encontrada no Supabase')
        return db.getSurveyByPropertyId(propertyId) || null
      }
      console.log('✅ Vistoria encontrada no Supabase, salvando no cache')
      const survey = mapSurvey(data)
      try {
        db.saveSurvey({ ...survey, sync_status: 'synchronized' })
      } catch (cacheError) {
        console.warn('⚠️ Não foi possível salvar vistoria no cache (quota excedida):', cacheError)
      }
      return survey
    } catch (err) {
      console.error('❌ Exceção ao buscar vistoria:', err)
      return db.getSurveyByPropertyId(propertyId) || null
    }
  },

  async getSurveysByPropertyIds(propertyIds: string[]): Promise<Survey[]> {
    if (!isOnline()) {
      // Offline implementation: filter from local DB
      const allSurveys = db.getSurveys()
      return allSurveys.filter(s => propertyIds.includes(s.property_id))
    }

    if (propertyIds.length === 0) return []

    try {
      // Chunk requests if too many IDs (Supabase URL Limit)
      const chunkSize = 50
      let allSurveys: Survey[] = []

      for (let i = 0; i < propertyIds.length; i += chunkSize) {
        const chunk = propertyIds.slice(i, i + chunkSize)
        const { data, error } = await supabase
          .from('reurb_surveys')
          .select('*')
          .in('property_id', chunk)
        
        if (error) {
          console.error('Error fetching surveys chunk:', error)
          continue
        }
        
        if (data) {
           const mappedChunk = data.map(mapSurvey)
           allSurveys = [...allSurveys, ...mappedChunk]
           // Cache them
           mappedChunk.forEach(s => db.saveSurvey({...s, sync_status: 'synchronized'}))
        }
      }
      
      return allSurveys
    } catch (e) {
      console.error('Error fetching surveys bulk:', e)
      return []
    }
  },

  async saveSurvey(survey: Partial<Survey>): Promise<Survey> {
    if (!survey.property_id) throw new Error('Property ID is required')

    if (!isOnline()) {
      return db.saveSurvey({ ...survey, sync_status: 'pending' })
    }

    // --- FIX: Upload Base64 Documents to Storage before saving to Database ---
    if (survey.documents && Array.isArray(survey.documents) && isOnline()) {
      try {
        const processedDocs = await Promise.all(
          survey.documents.map(async (doc: any) => {
            // Check if doc has Base64 data and implies it needs upload
            if (
              doc.data &&
              typeof doc.data === 'string' &&
              (doc.data.startsWith('data:') || doc.data.length > 1000) &&
              (!doc.url || doc.url.startsWith('blob:'))
            ) {
              try {
                const mimeType = doc.type || 'application/octet-stream'
                const blob = base64ToBlob(doc.data, mimeType)
                const fileExt = doc.name.split('.').pop() || 'bin'
                // Use a dedicated folder in the bucket
                const filePath = `documents/${survey.property_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

                // Upload to 'reurb-images' bucket (as it is the one we know exists and is public)
                const { error: uploadError } = await supabase.storage
                  .from('reurb-images')
                  .upload(filePath, blob, {
                    contentType: mimeType,
                    upsert: false,
                  })

                if (uploadError) throw uploadError

                // Get Public URL
                const {
                  data: { publicUrl },
                } = supabase.storage.from('reurb-images').getPublicUrl(filePath)

                console.log(`✅ Documento ${doc.name} convertido de Base64 para URL: ${publicUrl}`)

                // Return clean object w/o Base64 data
                return {
                  id: doc.id,
                  name: doc.name,
                  size: doc.size,
                  type: doc.type,
                  url: publicUrl,
                  uploadedAt: new Date().toISOString(),
                }
              } catch (e) {
                console.error(`❌ Falha ao fazer upload do documento ${doc.name}`, e)
                // In case of error, we KEEP the data so user doesn't lose it,
                // but warn to try again later.
                return doc
              }
            }
            return doc
          }),
        )
        survey.documents = processedDocs
      } catch (err) {
        console.error('Erro geral ao processar upload de documentos:', err)
      }
    }
    // -----------------------------------------------------------------------

    // Campos válidos da tabela reurb_surveys
    const validFields = [
      'id',
      'property_id',
      'form_number',
      'survey_date',
      'city',
      'state',
      'applicant_name',
      'applicant_cpf',
      'applicant_rg',
      'applicant_civil_status',
      'applicant_profession',
      'applicant_income',
      'applicant_nis',
      'spouse_name',
      'spouse_cpf',
      'residents_count',
      'has_children',
      'occupation_time',
      'acquisition_mode',
      'property_use',
      'construction_type',
      'roof_type',
      'floor_type',
      'rooms_count',
      'conservation_state',
      'fencing',
      'water_supply',
      'energy_supply',
      'sanitation',
      'street_paving',
      'observations',
      'surveyor_name',
      'surveyor_signature',
      'assinatura_requerente',
      'documents',
      'analise_ia_classificacao',
      'analise_ia_parecer',
      'analise_ia_proximo_passo',
      'analise_ia_gerada_em',
      'created_at',
      'updated_at',
    ]

    const payload: any = {}
    validFields.forEach(field => {
      if (survey[field as keyof Survey] !== undefined) {
        payload[field] = survey[field as keyof Survey]
      }
    })

    // Enviar documents como JSON nativo para coluna JSONB
    // Se vier como string (edge case), tenta parsear; caso falhe, mantém como está
    if (typeof payload.documents === 'string') {
      try {
        payload.documents = JSON.parse(payload.documents)
      } catch (_) {
        // mantém valor original; PostgREST retornará erro útil se for inválido
      }
    }

    if (payload.surveyor_signature === '') {
      delete payload.surveyor_signature
    }

    if (payload.assinatura_requerente === '') {
      delete payload.assinatura_requerente
    }

    payload.updated_at = new Date().toISOString()

    try {
      // --- FIX 406/400: USAR UPSERT PARA EVITAR CONFLITOS DE ID ---
      // Se payload.id estiver presente, o Postgres tentará atualizar ou inserir
      
      const { data, error } = await supabase
        .from('reurb_surveys')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        // Log MUITO detalhado para diagnosticar 400
        const errorDetails = {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
          status: (error as any)?.status,
          statusText: (error as any)?.statusText,
        }
        console.error('❌ SUPABASE ERROR in saveSurvey():', errorDetails)
        console.error('Payload que foi enviado:', payload)
        console.error('Survey ID:', survey.id)
        throw error
      }
      const saved = mapSurvey(data)
      const syncedSurvey = { ...saved, sync_status: 'synchronized' as const }
      
      // Tentar salvar no cache, mas retornar survey mesmo se falhar
      try {
        db.saveSurvey(syncedSurvey)
      } catch (cacheError) {
        console.warn('⚠️ Vistoria salva no Supabase, mas cache local falhou (quota excedida):', cacheError)
      }
      
      return syncedSurvey
    } catch (e) {
      console.warn('Save survey failed, saving locally', e)
      // Salva localmente para não perder dados e RE-LEVA o erro quando online
      try {
        db.saveSurvey({ ...survey, sync_status: 'pending' })
      } catch (cacheError) {
        console.error('❌ CRÍTICO: Falhou Supabase E LocalStorage:', cacheError)
      }
      // Se está offline, a função já teria retornado antes. Portanto, este catch indica falha online.
      // Re-lançamos o erro para que a UI trate como falha de sincronização (não como offline).
      throw e
    }
  },

  // Stats & Users
  async getDashboardStats(): Promise<DashboardStats> {
    if (!isOnline()) return db.getDashboardStats()
    try {
      const { count: totalProjects } = await supabase
        .from('reurb_projects')
        .select('*', { count: 'exact', head: true })

      const { count: totalLotes } = await supabase
        .from('reurb_properties')
        .select('*', { count: 'exact', head: true })

      const { count: totalSurveyed } = await supabase
        .from('reurb_properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'surveyed')

      const { count: totalFamilies } = await supabase
        .from('reurb_surveys')
        .select('*', { count: 'exact', head: true })

      const { count: totalQuadras } = await supabase
        .from('reurb_quadras')
        .select('*', { count: 'exact', head: true })

      const { count: totalContracts } = await supabase
        .from('reurb_contracts')
        .select('*', { count: 'exact', head: true })

        // Buscar lotes com vistoria completa (surveys exists)
        const { data: surveysData } = await supabase
          .from('reurb_surveys')
          .select('property_id')
      
        const surveysCompleted = surveysData?.length || 0
      
        // Total de lotes não vistoriados (sem survey)
        const totalNotSurveyed = (totalLotes || 0) - surveysCompleted
      
        // Contar surveys com análise IA
        const { count: totalAnalyzedByAI } = await supabase
          .from('reurb_surveys')
          .select('*', { count: 'exact', head: false }) // Usa GET, não HEAD
          .filter('analise_ia_classificacao', 'is', 'not.null')
      
        // Contar lotes com processo (contratos)
        const { data: contractsData } = await supabase
          .from('reurb_contracts')
          .select('property_id')
      
        const propertiesWithProcess = contractsData?.length || 0

        // Contar surveys REURB-S (via IA)
        const { count: countReurbS } = await supabase
          .from('reurb_surveys')
          .select('*', { count: 'exact', head: false })
          .ilike('analise_ia_classificacao', '%25REURB-S%25') // encode %

        // Contar surveys REURB-E (via IA)
        const { count: countReurbE } = await supabase
          .from('reurb_surveys')
          .select('*', { count: 'exact', head: false })
          .ilike('analise_ia_classificacao', '%25REURB-E%25')
      
        const localStats = db.getDashboardStats()

      return {
        collected: totalLotes || 0,
        synced: totalLotes || 0,
        pending: localStats.pending,
        pendingImages: localStats.pendingImages,
        totalProjects: totalProjects || 0,
        lastSync: Date.now(),
        pendingSurveys: localStats.pendingSurveys,
        totalSurveyed: totalSurveyed || 0,
        totalFamilies: totalFamilies || 0,
        totalContracts: totalContracts || 0,
        totalQuadras: totalQuadras || 0,
          totalProperties: totalLotes || 0,
          totalSurveysCompleted: surveysCompleted,
          totalSurveysNotCompleted: totalNotSurveyed,
          totalAnalyzedByAI: totalAnalyzedByAI || 0,
          totalPropertiesWithProcess: propertiesWithProcess,
          totalReurbS: countReurbS || 0,
          totalReurbE: countReurbE || 0,
      }
    } catch {
      return db.getDashboardStats()
    }
  },

  // Users & Groups
  async getUsers(): Promise<User[]> {
    if (!isOnline()) return db.getUsers()
    try {
      // Fetch users from reurb_user_profiles table
      // CORREÇÃO: Usar colunas corretas da tabela reurb_user_profiles
      const { data, error } = await supabase
        .from('reurb_user_profiles')
        .select('*')

      if (error) throw error

      return (data || []).map(mapProfile)
    } catch (e) {
      console.error('Error fetching users:', e)
      return db.getUsers()
    }
  },

  async saveUser(
    user: Partial<User> & {
      email?: string
      password?: string
      createdById?: string
    },
  ): Promise<void> {
    if (user.id) {
      // Update existing user profile
      // CORREÇÃO: Usar grupo_acesso em vez de role
      const payload = {
        nome_usuario: user.name,
        nome: user.firstName,
        sobrenome: user.lastName,
        email: user.email,
        foto: user.photoUrl,
        grupo_acesso: user.groupIds && user.groupIds.length > 0 ? user.groupIds[0] : 'vistoriador',
        situacao: user.status === 'active' ? 'ativo' : 'inativo',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('reurb_user_profiles')
        .update(payload)
        .eq('user_id', user.id)

      if (error) throw error
    } else {
      // Create new user via Edge Function
      // CORREÇÃO: Usar grupo_acesso em vez de role
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: user.email,
          password: user.password,
          nome_usuario: user.name || '',
          nome: user.firstName || '',
          sobrenome: user.lastName || '',
          grupo_acesso: user.groupIds && user.groupIds.length > 0 ? user.groupIds[0] : 'vistoriador',
          foto: user.photoUrl,
          situacao: user.status === 'active' ? 'ativo' : 'inativo',
          criado_por: user.createdById || 'system',
        },
      })

      if (error) throw error
    }
  },

  async deleteUser(id: string): Promise<void> {
    // Get user email first
    const { data: profile } = await supabase
      .from('reurb_user_profiles')
      .select('email')
      .eq('user_id', id)
      .single()
    
    if (profile?.email) {
      // Delete from auth.users via edge function
      const { error: authError } = await supabase.functions.invoke('delete-user', {
        body: { email: profile.email }
      })
      if (authError) console.error('Error deleting auth user:', authError)
    }
    
    // Delete profile
    const { error } = await supabase
      .from('reurb_user_profiles')
      .delete()
      .eq('user_id', id)
    if (error) throw error
  },

  // Groups
  async getGroups(): Promise<UserGroup[]> {
    if (!isOnline()) return db.getGroups()
    try {
      // Get unique groups from reurb_user_profiles
      // CORREÇÃO: Buscar grupo_acesso em vez de role
      const { data, error } = await supabase
        .from('reurb_user_profiles')
        .select('grupo_acesso')
        .not('grupo_acesso', 'is', null)
      
      if (error) throw error
      
      // Get unique groups and map to UserGroup format
      const uniqueGroups = [...new Set((data || []).map((row: any) => row.grupo_acesso))]
      
      return uniqueGroups.map((group: string) => ({
        id: group,
        name: group,
        description: `Grupo: ${group}`,
        permissions: getPermissionsForGroup(group),
        created_at: new Date().toISOString(),
        role: group as any, // CORREÇÃO: Forçar o tipo apropriado
      }))
    } catch (e) {
      console.error(e)
      return db.getGroups()
    }
  },

  async saveGroup(group: Partial<UserGroup>): Promise<UserGroup> {
    if (!isOnline()) throw new Error('Offline group management not supported')

    const payload = {
      name: group.name,
      description: group.description,
      permissions: group.permissions,
      updated_at: new Date().toISOString(),
    }

    let query
    if (group.id) {
      query = supabase
        .from('reurb_user_groups')
        .update(payload)
        .eq('id', group.id)
        .select()
        .single()
    } else {
      query = supabase
        .from('reurb_user_groups')
        .insert(payload)
        .select()
        .single()
    }

    const { data, error } = await query
    if (error) throw error

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      permissions: data.permissions || [],
      created_at: data.created_at,
      role: data.name as any, // CORREÇÃO: Forçar o tipo apropriado
    }
  },

  async deleteGroup(id: string): Promise<void> {
    if (!isOnline()) throw new Error('Offline group management not supported')
    const { error } = await supabase
      .from('reurb_user_groups')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // --- Analytical Methods ---

  async getProductivityStats(): Promise<ProductivityData[]> {
    if (!isOnline()) return db.getProductivityStats()

    try {
      const startDate = subMonths(new Date(), 6)

      // Fetch surveys (cadastros) created in last 6 months
      const { data: surveys } = await supabase
        .from('reurb_surveys')
        .select('created_at')
        .gte('created_at', startDate.toISOString())

      // Fetch contracts (titulos) created in last 6 months
      const { data: contracts } = await supabase
        .from('reurb_contracts')
        .select('created_at')
        .gte('created_at', startDate.toISOString())

      // Aggregate data
      const stats: ProductivityData[] = []
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i)
        const start = startOfMonth(d)
        const end = endOfMonth(d)

        const cadastros = (surveys || []).filter((s) => {
          const date = new Date(s.created_at || '')
          return date >= start && date <= end
        }).length

        const titulos = (contracts || []).filter((c) => {
          const date = new Date(c.created_at || '')
          return date >= start && date <= end
        }).length

        stats.push({
          month: format(d, 'MMM', { locale: ptBR }),
          cadastros,
          titulos,
          fullDate: format(d, 'MMMM yyyy', { locale: ptBR }),
        })
      }
      return stats
    } catch (e) {
      console.error('Error fetching productivity stats:', e)
      return db.getProductivityStats()
    }
  },

  async getModalitiesStats(): Promise<ModalityData[]> {
    if (!isOnline()) return db.getModalitiesStats()

    try {
      const { data: projects } = await supabase
        .from('reurb_projects')
        .select('tags')

      let sCount = 0
      let eCount = 0

      projects?.forEach((p: any) => {
        if (p.tags && Array.isArray(p.tags)) {
          if (p.tags.some((t: string) => t.includes('REURB-S'))) sCount++
          if (p.tags.some((t: string) => t.includes('REURB-E'))) eCount++
        }
      })

      // If no data, fallback to mock to show UI
      if (sCount === 0 && eCount === 0) return db.getModalitiesStats()

      return [
        { name: 'REURB-S', value: sCount, fill: 'hsl(var(--chart-1))' },
        { name: 'REURB-E', value: eCount, fill: 'hsl(var(--chart-2))' },
      ]
    } catch {
      return db.getModalitiesStats()
    }
  },

  async getRecentActivities(): Promise<RecentActivityItem[]> {
    if (!isOnline()) return db.getRecentActivities()

    try {
      const { data: audits, error } = await supabase
        .from('reurb_audit_processes')
        .select(
          `
          id, action, details, created_at, target_type,
          reurb_user_profiles:user_id ( nome )
        `,
        )
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      return audits.map((a: any) => {
        let type: RecentActivityItem['type'] = 'other'
        if (a.action.includes('cadastro')) type = 'registration'
        else if (a.action.includes('aprova')) type = 'approval'
        else if (a.action.includes('Edital') || a.action.includes('Documento'))
          type = 'document'
        else if (!a.reurb_user_profiles) type = 'system'

        return {
          id: a.id,
          action: a.action,
          details: a.details || '',
          user_name: a.reurb_user_profiles?.nome || 'Sistema',
          timestamp: a.created_at,
          type,
        }
      })
    } catch {
      return db.getRecentActivities()
    }
  },

  async getTitlingGoalStats(): Promise<TitlingGoalData> {
    if (!isOnline()) return db.getTitlingGoalStats()

    try {
      // Count titles issued this year
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString()
      const { count } = await supabase
        .from('reurb_contracts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfYear)

      const current = count || 0
      const currentMonth = new Date().getMonth() + 1
      const monthly_rhythm = Math.round(current / (currentMonth || 1))

      return {
        current,
        goal: 2000,
        monthly_rhythm,
      }
    } catch {
      return db.getTitlingGoalStats()
    }
  },
}