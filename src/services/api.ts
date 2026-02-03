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
  id: row.id,
  local_id: row.local_id || row.id?.toString() || '',
  sync_status: row.sync_status || 'synchronized',
  date_added: row.date_added || row.created_at || Date.now(),
  date_updated: row.date_updated || row.updated_at || Date.now(),
  name: row.name,
  description: row.description,
  image_url: row.image_url,
  latitude: row.latitude,
  longitude: row.longitude,
  auto_update_map: row.auto_update_map,
  last_map_update: row.last_map_update,
  created_by: row.created_by,
  tags: row.tags,
  city: row.city,
  state: row.state,
  status: row.status,
})

const mapQuadra = (row: any): Quadra => ({
  id: row.id,
  local_id: row.local_id || row.id?.toString() || '',
  sync_status: row.sync_status || 'synchronized',
  date_added: row.date_added || row.created_at || Date.now(),
  date_updated: row.date_updated || row.updated_at || Date.now(),
  name: row.name,
  area: row.area,
  description: row.description,
  parent_item_id: row.parent_item_id || row.project_id || '',
  document_url: row.document_url,
  image_url: row.image_url,
})

const mapLote = (row: any): Lote => ({
  id: row.id,
  local_id: row.local_id || row.id?.toString() || '',
  sync_status: row.sync_status || 'synchronized',
  date_added: row.date_added || row.created_at || Date.now(),
  date_updated: row.date_updated || row.updated_at || Date.now(),
  name: row.name,
  area: row.area,
  description: row.description,
  images: row.images || [],
  latitude: row.latitude,
  longitude: row.longitude,
  parent_item_id: row.parent_item_id || row.quadra_id || '',
  address: row.address,
  status: row.status,
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
    case 'Jurídico':
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
    case 'Next Ambiente':
      return ['view_only']
    case 'SEHAB':
      return ['manage_users', 'edit_projects', 'view_reports', 'manage_groups']
    case 'Externo':
    case 'viewer':
    default:
      return ['view_only']
  }
}

const mapProfile = (row: any): User => ({
  id: row.id || row.user_id,
  username: row.nome_usuario || row.full_name || '',
  firstName: row.nome || row.full_name?.split(' ')[0] || '',
  lastName: row.sobrenome || row.full_name?.split(' ').slice(1).join(' ') || '',
  name: row.nome_usuario || row.full_name || 'Usuário',
  email: row.email,
  photoUrl: row.foto || row.avatar_url || '',
  status: row.situacao === 'ativo' || row.is_active ? 'active' : 'inactive',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdById: row.criado_por,
  createdBy: undefined,
  groupIds: [row.role],
  groupNames: [row.role],
  active: row.situacao === 'ativo' || !!row.is_active,
  role: row.role,
})

const mapSurvey = (row: any): Survey => ({
  ...row,
  sync_status: 'synchronized',
  residents_count: row.residents_count || 0,
  rooms_count: row.rooms_count || 0,
  has_children: row.has_children ?? false,
  children_count: row.children_count || 0,
  survey_date: row.survey_date?.split('T')[0],
  documents: row.documents ? (typeof row.documents === 'string' ? JSON.parse(row.documents) : row.documents) : [],
  facade_photos: row.facade_photos ? (typeof row.facade_photos === 'string' ? JSON.parse(row.facade_photos) : row.facade_photos) : [],
})

const isOnline = () => navigator.onLine

export const api = {
  /*
  async getAppConfig(): Promise<Record<string, string>> {
    if (!isOnline()) return {}
    try {
      const { data, error } = await supabase
        .from('reurb_app_config')
        .select('key,value,description,created_at,updated_at')
      if (error) {
        console.error('Error fetching app config:', error)
        return {}
      }
      const config: Record<string, string> = {}
      data?.forEach((row: any) => {
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
  */
  // Projects
  async getProjectStats(projectId: string): Promise<{ quadras: number; lotes: number }> {
    if (!isOnline()) return { quadras: 0, lotes: 0 }

    try {
      const { count: quadras } = await supabase
        .from('reurb_quadras')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      const { count: lotes } = await supabase
        .from('reurb_properties')
        .select('*', { count: 'exact', head: true })
        .eq('quadra_id', projectId)

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

    try {
      const payload: any = {
        updated_at: new Date().toISOString()
      }
      
      // Adicionar apenas os campos válidos da tabela reurb_projects
      const validFields = [
        'name', 'description', 'status', 'latitude', 'longitude', 'image_url',
        'auto_update_map', 'last_map_update', 'tags', 'city', 'state'
      ]
      validFields.forEach(key => {
        if (updates[key] !== undefined) {
          payload[key] = updates[key]
        }
      })
      
      // Converter tipos numéricos
      if (updates.latitude !== undefined) payload.latitude = parseFloat(updates.latitude) || null
      if (updates.longitude !== undefined) payload.longitude = parseFloat(updates.longitude) || null
      if (updates.area_total_hectares !== undefined) payload.area_total_hectares = parseFloat(updates.area_total_hectares) || null
      
      // Converter datas
      if (updates.data_limite_conclusao && typeof updates.data_limite_conclusao === 'string') {
        payload.data_limite_conclusao = updates.data_limite_conclusao
      }
      if (updates.data_publicacao_edital && typeof updates.data_publicacao_edital === 'string') {
        payload.data_publicacao_edital = updates.data_publicacao_edital
      }
      
      const { data, error } = await supabase
        .from('reurb_projects')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error.message)
        throw error
      }
      
      const project = mapProject(data)
      db.updateProject(project)
      return project
      
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
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

    const payload: any = {
      updated_at: new Date().toISOString()
    }

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
      .single()

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }
    
    const quadra = mapQuadra(data)
    db.saveQuadra(quadra)
    return quadra
  },

  async deleteQuadra(id: string): Promise<void> {
    if (!isOnline()) {
      console.log('[API] Deleting quadra localmente:', id)
      // Não existe db.deleteQuadra, apenas remova do cache se necessário
      return
    }

    const { error } = await supabase
      .from('reurb_quadras')
      .delete()
      .eq('id', id)

    if (error) throw error
    // Remover também do cache local se necessário
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    if (!isOnline()) {
      const newProject = {
        id: 0,
        local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sync_status: 'pending' as const,
        date_added: Date.now(),
        date_updated: Date.now(),
        name: project.name || '',
        description: project.description || '',
        image_url: project.image_url || '',
        latitude: project.latitude || '',
        longitude: project.longitude || '',
        tags: [],
        status: 'Em andamento',
        auto_update_map: false,
        city: '',
        state: '',
      }
      const projects = db.getProjects()
      projects.push(newProject)
      db.saveItems('reurb_projects', projects)
      try {
        const payload: any = {
          name: project.name,
          description: project.description,
          status: project.status || 'Em andamento',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        if (project.latitude) payload.latitude = parseFloat(project.latitude) || null
        if (project.longitude) payload.longitude = parseFloat(project.longitude) || null
        if (project.image_url) payload.image_url = project.image_url
        if (project.city) payload.city = project.city
        if (project.state) payload.state = project.state
        if (project.tags) payload.tags = project.tags

        const { data, error } = await supabase
          .from('reurb_projects')
          .insert(payload)
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
      
        const mappedProject: Project = mapProject(data)
      
        const projects = db.getProjects()
        projects.push(mappedProject)
        db.saveItems('reurb_projects', projects)
        return mappedProject
      } catch (error) {
        console.error('Error creating project:', error)
        throw error
      }
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
        status: 'synchronized',
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
      status: 'synchronized',
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
        status: 'synchronized',
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
    
    const localLote = db.getLote(id)
    
    if (localLote) {
      console.log('✅ Lote encontrado no LocalStorage:', {
        name: localLote.name,
        address: localLote.address,
        latitude: localLote.latitude,
        longitude: localLote.longitude,
        sync_status: localLote.sync_status,
      })
      
      if (localLote.sync_status === 'pending' || localLote.sync_status === 'failed') {
        console.log('📌 Lote com sync pendente, usando dados locais')
        return localLote
      }
      
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
      
      return localLote
    }
    
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
          if (lote.parent_item_id) {
            db.saveLote(lote, lote.parent_item_id)
          }
          return lote
        }
      } catch (error) {
        console.error('❌ Falha ao buscar do Supabase:', error)
      }
    }
    
    console.warn('⚠️ Lote não encontrado nem no LocalStorage nem no Supabase')
    return null
  },

  async saveLote(lote: Partial<Lote> & { quadra_id?: string }): Promise<Lote> {
    const resolvedQuadraId = lote.quadra_id || lote.parent_item_id

    if (!isOnline()) {
      return db.saveLote(
        { ...lote, sync_status: 'pending' } as Lote,
        resolvedQuadraId || '',
      )
    }

    const payload: any = {
      name: lote.name,
      address: lote.address,
      area: lote.area,
      description: lote.description,
      images: lote.images,
      status: lote.status || 'pending',
      updated_at: new Date().toISOString(),
    }

    // Adicionar campos específicos da estrutura correta
    if (lote.latitude !== undefined) {
      payload.latitude = lote.latitude ? parseFloat(lote.latitude) : null
    }
    if (lote.longitude !== undefined) {
      payload.longitude = lote.longitude ? parseFloat(lote.longitude) : null
    }
    // Removido campos não presentes na tipagem Lote

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
        payload.created_at = new Date().toISOString()
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
        { ...lote, sync_status: 'pending' } as Lote,
        resolvedQuadraId || '',
      )
    }
  },

  async deleteLote(id: string): Promise<void> {
    if (!isOnline()) {
      db.deleteLote(id)
      return
    }
    const { error } = await supabase.from('reurb_properties').delete().eq('id', id)
    if (error) throw error
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

    const payload: any = {
      updated_at: new Date().toISOString()
    }

    const validFields = [
      'name', 'address', 'area', 'description', 'status', 'latitude', 'longitude',
      'images'
    ]
    
    validFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'latitude' || field === 'longitude') {
          payload[field] = updates[field] ? parseFloat(String(updates[field])) : null
        } else if (field === 'area_terreno' || field === 'area_construida') {
          payload[field] = parseFloat(String(updates[field])) || null
        } else if (field === 'possui_conflito') {
          payload[field] = Boolean(updates[field])
        } else {
          payload[field] = updates[field]
        }
      }
    })

    const { data, error } = await supabase
      .from('reurb_properties')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }
    
    const lote = mapLote(data)
    db.saveLote(lote, lote.parent_item_id)
    return lote
  },

  // Surveys
  async getSurveyByPropertyId(propertyId: string): Promise<Survey | null> {
    console.log('🔍 getSurveyByPropertyId chamado para:', propertyId)
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
      const allSurveys = db.getSurveys()
      return allSurveys.filter(s => propertyIds.includes(s.property_id))
    }

    if (propertyIds.length === 0) return []

    try {
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
           mappedChunk.forEach(s => {
             try {
               db.saveSurvey({...s, sync_status: 'synchronized'})
             } catch (e) {
               console.warn('Failed to cache survey:', e)
             }
           })
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

    // Upload Base64 Documents to Storage
    if (survey.documents && Array.isArray(survey.documents) && isOnline()) {
      try {
        const processedDocs = await Promise.all(
          survey.documents.map(async (doc: any) => {
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
                const filePath = `documents/${survey.property_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                  .from('reurb-images')
                  .upload(filePath, blob, {
                    contentType: mimeType,
                    upsert: false,
                  })

                if (uploadError) throw uploadError

                const {
                  data: { publicUrl },
                } = supabase.storage.from('reurb-images').getPublicUrl(filePath)

                console.log(`✅ Documento ${doc.name} convertido de Base64 para URL: ${publicUrl}`)

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
      'children_count',
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
      'facade_photos',
      'analise_ia_classificacao',
      'analise_ia_parecer',
      'analise_ia_proximo_passo',
      'analise_ia_gerada_em',
    ]

    const payload: any = {}
    validFields.forEach(field => {
      if (survey[field as keyof Survey] !== undefined) {
        payload[field] = survey[field as keyof Survey]
      }
    })

    // Set default values for required fields
    if (!payload.city) payload.city = 'Macapá'
    if (!payload.state) payload.state = 'AP'
    if (payload.residents_count === undefined) payload.residents_count = 0
    if (payload.rooms_count === undefined) payload.rooms_count = 0
    if (payload.has_children === undefined) payload.has_children = false
    if (payload.children_count === undefined) payload.children_count = 0

    // Handle JSON fields
    if (typeof payload.documents === 'string') {
      try {
        payload.documents = JSON.parse(payload.documents)
      } catch (_) {}
    }
    if (typeof payload.facade_photos === 'string') {
      try {
        payload.facade_photos = JSON.parse(payload.facade_photos)
      } catch (_) {}
    }

    if (payload.surveyor_signature === '') {
      delete payload.surveyor_signature
    }

    if (payload.assinatura_requerente === '') {
      delete payload.assinatura_requerente
    }

    payload.updated_at = new Date().toISOString()
    
    // If creating new survey, add created_at
    if (!payload.id) {
      payload.created_at = new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('reurb_surveys')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
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
      
      try {
        db.saveSurvey(syncedSurvey)
      } catch (cacheError) {
        console.warn('⚠️ Vistoria salva no Supabase, mas cache local falhou (quota excedida):', cacheError)
      }
      
      return syncedSurvey
    } catch (e) {
      console.warn('Save survey failed, saving locally', e)
      try {
        db.saveSurvey({ ...survey, sync_status: 'pending' })
      } catch (cacheError) {
        console.error('❌ CRÍTICO: Falhou Supabase E LocalStorage:', cacheError)
      }
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

      const { data: surveysData } = await supabase
        .from('reurb_surveys')
        .select('property_id', { count: 'exact', head: true })

      const surveysCompleted = surveysData?.length || 0

      const totalNotSurveyed = (totalLotes || 0) - surveysCompleted

      const { count: totalAnalyzedByAI } = await supabase
        .from('reurb_surveys')
        .select('*', { count: 'exact', head: true })
        .not('analise_ia_classificacao', 'is', null)

      const { data: contractsData } = await supabase
        .from('reurb_contracts')
        .select('property_id')

      const propertiesWithProcess = contractsData?.length || 0

      const { count: countReurbS } = await supabase
        .from('reurb_surveys')
        .select('*', { count: 'exact', head: true })
        .ilike('analise_ia_classificacao', '%REURB-S%')

      const { count: countReurbE } = await supabase
        .from('reurb_surveys')
        .select('*', { count: 'exact', head: true })
        .ilike('analise_ia_classificacao', '%REURB-E%')

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
      const payload: any = {
        nome_usuario: user.name,
        nome: user.firstName,
        sobrenome: user.lastName,
        email: user.email,
        foto: user.photoUrl,
        situacao: user.status === 'active' ? 'ativo' : 'inativo',
        updated_at: new Date().toISOString(),
      }

      const supabaseAny = supabase as any
      const { error } = await supabaseAny
        .from('reurb_user_profiles')
        .update(payload)
        .eq('id', user.id)

      if (error) throw error
    } else {
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: user.email,
          password: user.password,
          nome_usuario: user.name || '',
          nome: user.firstName || '',
          sobrenome: user.lastName || '',
          foto: user.photoUrl,
          situacao: user.status === 'active' ? 'ativo' : 'inativo',
          criado_por: user.createdById || 'system',
        },
      })

      if (error) throw error
    }
  },

  async deleteUser(id: string): Promise<void> {
    const supabaseAny = supabase as any
    
    const { data: profile } = await supabaseAny
      .from('reurb_user_profiles')
      .select('email')
      .eq('user_id', id)
      .single()
    
    if (profile?.email) {
      const { error: authError } = await supabase.functions.invoke('delete-user', {
        body: { email: profile.email }
      })
      if (authError) console.error('Error deleting auth user:', authError)
    }
    
    const { error } = await supabaseAny
      .from('reurb_user_profiles')
      .delete()
      .eq('user_id', id)
    if (error) throw error
  },

  // Groups
  async getGroups(): Promise<UserGroup[]> {
    try {
      const { data, error } = await supabase
        .from('reurb_user_groups')
        .select('*')
      if (error) throw error
      return (data || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        permissions: group.permissions || [],
        created_at: group.created_at,
        updated_at: group.updated_at,
        role: group.name as any,
      }))
    } catch (e) {
      console.error(e)
      return []
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
      role: data.name as any,
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

      const { data: surveys } = await supabase
        .from('reurb_surveys')
        .select('created_at')
        .gte('created_at', startDate.toISOString())

      const { data: contracts } = await supabase
        .from('reurb_contracts')
        .select('created_at')
        .gte('created_at', startDate.toISOString())

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
      // Buscar a classificação da IA diretamente das vistorias (reurb_surveys)
      const { data: surveys } = await supabase
        .from('reurb_surveys')
        .select('analise_ia_classificacao')

      let sCount = 0
      let eCount = 0

      surveys?.forEach((s: any) => {
        if (s.analise_ia_classificacao === 'REURB-S') sCount++
        if (s.analise_ia_classificacao === 'REURB-E') eCount++
      })

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