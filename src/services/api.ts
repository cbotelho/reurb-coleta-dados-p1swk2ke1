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

const mapProject = (row: any): Project => ({
  id: 0,
  local_id: row.id,
  sync_status: 'synchronized',
  date_added: new Date(row.created_at).getTime(),
  date_updated: new Date(row.updated_at).getTime(),
  name: row.name,
  description: row.description || '',
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
  parent_item_id: row.quadra_id,
  status: row.status || 'not_surveyed',
})

const getPermissionsForGroup = (group: string): string[] => {
  switch (group) {
    case 'Administradores':
    case 'Administrador':
    case 'super_admin':
      return ['all']
    case 'SEHAB':
    case 'admin':
      return ['manage_users', 'edit_projects', 'view_reports', 'manage_groups']
    case 'Técnicos Amapá Terra':
    case 'Vistoriador':
    case 'operator':
      return ['edit_projects', 'view_reports']
    case 'Next Ambiente':
    case 'Analista':
    case 'manager':
      return ['edit_projects', 'view_reports']
    case 'Externo':
    case 'viewer':
      return ['view_only']
    default:
      return ['view_only']
  }
}

const mapProfile = (row: any): User => {
  // Use grupo_acesso as the primary group
  const grupoAcesso = row.grupo_acesso || 'viewer'
  
  // Extract Creator Name if available
  const creatorName = row.criado_por

  return {
    id: row.id,
    username: row.nome_usuario || '',
    firstName: row.nome || '',
    lastName: row.sobrenome || '',
    name:
      row.nome ||
      `${row.nome || ''} ${row.sobrenome || ''}`.trim() ||
      'Usuário',
    email: row.email || row.nome_usuario, // Sometimes username is email, fallback
    photoUrl: row.foto,
    status: (row.situacao as 'active' | 'inactive' | 'suspended') || 'active',
    lastLoginAt: row.ultimo_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdById: row.criado_por,
    createdBy: creatorName,
    groupIds: [grupoAcesso],
    groupNames: [grupoAcesso],
    active: row.situacao === 'Ativo',
  }
}

const mapSurvey = (row: any): Survey => ({
  ...row,
  sync_status: 'synchronized',
  residents_count: row.residents_count || 0,
  rooms_count: row.rooms_count || 0,
  has_children: row.has_children ?? false,
  survey_date: row.survey_date?.split('T')[0],
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
        config[row.key] = row.value
      })
      return config
    } catch (e) {
      console.error('Error in getAppConfig:', e)
      return {}
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    if (!isOnline()) return db.getProjects()

    try {
      const { data, error } = await supabase
        .from('reurb_projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      const projects = (data || []).map(mapProject)
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

      if (error) throw error
      const project = mapProject(data)
      db.updateProject(project)
      return project
    } catch {
      return db.getProject(id) || null
    }
  },

  async updateProject(id: string, updates: Partial<any>): Promise<Project> {
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
    const { data: profile } = await supabase
      .from('reurb_profiles')
      .select('*')
      .eq('id', user?.id)
      .single()
    
    console.log('User profile:', profile)
    console.log('User group:', profile?.grupo_acesso)

    // Try the simplest possible update - just updated_at
    const simpleUpdate = {
      updated_at: new Date().toISOString()
    }

    console.log('Simple update payload:', simpleUpdate)

    const { data, error } = await supabase
      .from('reurb_projects')
      .update(simpleUpdate)
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
    
    // Check if RLS is blocking by trying to count rows
    const { count } = await supabase
      .from('reurb_projects')
      .select('*', { count: 'exact', head: true })
      .eq('id', id)
    
    console.log('Project exists check:', count)
    
    // Now try with actual data
    if (updates.name) {
      console.log('Trying to update name...')
      const { data: nameData, error: nameError } = await supabase
        .from('reurb_projects')
        .update({ name: updates.name })
        .eq('id', id)
        .select()
        
      if (nameError) {
        console.error('Name update error:', nameError)
      } else {
        console.log('Name update success:', nameData)
        console.log('Name update affected rows:', nameData?.length || 0)
      }
    }
    
    // Try city update separately
    if (updates.city !== undefined) {
      console.log('Trying to update city to:', updates.city)
      const { data: cityData, error: cityError } = await supabase
        .from('reurb_projects')
        .update({ city: updates.city })
        .eq('id', id)
        .select()
        
      if (cityError) {
        console.error('City update error:', cityError)
        console.error('City update error details:', cityError.details)
      } else {
        console.log('City update success:', cityData)
        console.log('City update affected rows:', cityData?.length || 0)
      }
    }
    
    // Try state update separately
    if (updates.state !== undefined) {
      console.log('Trying to update state to:', updates.state)
      const { data: stateData, error: stateError } = await supabase
        .from('reurb_projects')
        .update({ state: updates.state })
        .eq('id', id)
        .select()
        
      if (stateError) {
        console.error('State update error:', stateError)
        console.error('State update error details:', stateError.details)
      } else {
        console.log('State update success:', stateData)
        console.log('State update affected rows:', stateData?.length || 0)
      }
    }
    
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
      // For offline, just remove from local cache
      const current = db.getProject(id)
      if (current) {
        // Remove from local storage when offline
        // The actual deletion will sync when online
      }
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

      if (error) throw error
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

      if (error) throw error
      const q = mapQuadra(data)
      db.saveQuadra(q)
      return q
    } catch {
      return db.getQuadra(id) || null
    }
  },

  async updateQuadra(id: string, updates: Partial<any>): Promise<Quadra> {
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

    // Try the simplest possible update - just updated_at
    const simpleUpdate = {
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('reurb_quadras')
      .update(simpleUpdate)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }
    
    // Now try with actual data
    if (updates.name) {
      const { data: nameData, error: nameError } = await supabase
        .from('reurb_quadras')
        .update({ name: updates.name })
        .eq('id', id)
        .select()
        
      if (nameError) {
        console.error('Name update error:', nameError)
      }
    }
    
    if (updates.area !== undefined) {
      const { data: areaData, error: areaError } = await supabase
        .from('reurb_quadras')
        .update({ area: updates.area })
        .eq('id', id)
        .select()
        
      if (areaError) {
        console.error('Area update error:', areaError)
      }
    }
    
    if (updates.description !== undefined) {
      const { data: descData, error: descError } = await supabase
        .from('reurb_quadras')
        .update({ description: updates.description } as any)
        .eq('id', id)
        .select()
        
      if (descError) {
        console.error('Description update error:', descError)
      }
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

  async deleteQuadra(id: string): Promise<void> {
    if (!isOnline()) {
      // For offline, just remove from local cache
      const current = db.getQuadra(id)
      if (current) {
        // Remove from local storage when offline
        // The actual deletion will sync when online
      }
      return
    }

    const { error } = await supabase
      .from('reurb_quadras')
      .delete()
      .eq('id', id)

    if (error) throw error
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

      if (error) throw error
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

      if (error) throw error
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

      if (error) throw error
      const lotes = (data || []).map(mapLote)
      lotes.forEach((l) => l.parent_item_id && db.saveLote(l, l.parent_item_id))
      return lotes
    } catch (e) {
      return db.getAllLotes()
    }
  },

  async getLote(id: string): Promise<Lote | null> {
    if (!isOnline()) return db.getLote(id) || null

    try {
      const { data, error } = await supabase
        .from('reurb_properties')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      const lote = mapLote(data)
      if (lote.parent_item_id) db.saveLote(lote, lote.parent_item_id)
      return lote
    } catch {
      return db.getLote(id) || null
    }
  },

  async saveLote(lote: Partial<Lote> & { quadra_id?: string }): Promise<Lote> {
    if (!isOnline()) {
      return db.saveLote(
        { ...lote, sync_status: 'pending' },
        lote.quadra_id || lote.parent_item_id || '',
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

    if (lote.quadra_id) payload.quadra_id = lote.quadra_id

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
        if (!lote.quadra_id) throw new Error('Quadra ID required')
        query = supabase
          .from('reurb_properties')
          .insert(payload)
          .select()
          .single()
      }

      const { data, error } = await query
      if (error) throw error
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
        lote.quadra_id || lote.parent_item_id || '',
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

  // Surveys
  async getSurveyByPropertyId(propertyId: string): Promise<Survey | null> {
    if (!isOnline()) return db.getSurveyByPropertyId(propertyId) || null

    try {
      const { data, error } = await supabase
        .from('reurb_surveys')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) return db.getSurveyByPropertyId(propertyId) || null
      const survey = mapSurvey(data)
      db.saveSurvey({ ...survey, sync_status: 'synchronized' })
      return survey
    } catch {
      return db.getSurveyByPropertyId(propertyId) || null
    }
  },

  async saveSurvey(survey: Partial<Survey>): Promise<Survey> {
    if (!survey.property_id) throw new Error('Property ID is required')

    if (!isOnline()) {
      return db.saveSurvey({ ...survey, sync_status: 'pending' })
    }

    // Campos válidos da tabela reurb_surveys
    const validFields = [
      'id', 'property_id', 'applicant_name', 'applicant_cpf', 'applicant_nis',
      'applicant_civil_status', 'applicant_profession', 'applicant_income',
      'acquisition_mode', 'acquisition_year', 'acquisition_document',
      'property_type', 'property_area', 'property_address', 'property_number',
      'property_complement', 'property_neighborhood', 'property_city',
      'property_state', 'property_cep', 'property_zone', 'property_face',
      'property_paviment', 'property_energy_supply', 'property_water_supply',
      'property_sewage_system', 'property_urbanization', 'property_irregular',
      'property_observations', 'surveyor_name', 'surveyor_document',
      'survey_date', 'survey_status', 'created_at', 'updated_at'
    ]

    const payload: any = {}
    validFields.forEach(field => {
      if (survey[field as keyof Survey] !== undefined) {
        payload[field] = survey[field as keyof Survey]
      }
    })

    payload.updated_at = new Date().toISOString()

    try {
      let query
      if (survey.id && survey.id.length > 10) {
        query = supabase
          .from('reurb_surveys')
          .update(payload)
          .eq('id', survey.id)
          .select()
          .single()
      } else {
        delete payload.id
        query = supabase.from('reurb_surveys').insert(payload).select().single()
      }

      const { data, error } = await query
      if (error) throw error
      const saved = mapSurvey(data)
      db.saveSurvey({ ...saved, sync_status: 'synchronized' })
      return saved
    } catch (e) {
      console.warn('Save survey failed, saving locally', e)
      return db.saveSurvey({ ...survey, sync_status: 'pending' })
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
      }
    } catch {
      return db.getDashboardStats()
    }
  },

  // Users & Groups
  async getUsers(): Promise<User[]> {
    if (!isOnline()) return db.getUsers()
    try {
      // Fetch users from reurb_profiles table
      const { data, error } = await supabase.from('reurb_profiles').select('*')

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
      const payload = {
        nome: user.firstName,
        sobrenome: user.lastName,
        nome_usuario: user.username,
        email: user.email,
        foto: user.photoUrl,
        grupo_acesso: user.groupIds && user.groupIds.length > 0 ? user.groupIds[0] : 'Externo',
        situacao: user.status === 'active' ? 'Ativo' : 'Inativo',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('reurb_profiles')
        .update(payload)
        .eq('id', user.id)

      if (error) throw error
    } else {
      // Create new user via Edge Function
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: user.email,
          password: user.password,
          nome: user.firstName,
          sobrenome: user.lastName,
          nome_usuario: user.username,
          grupo_acesso: user.groupIds && user.groupIds.length > 0 ? user.groupIds[0] : 'Externo',
          foto: user.photoUrl,
          situacao: user.status === 'active' ? 'Ativo' : 'Inativo',
          criado_por: user.createdById || 'system',
        },
      })

      if (error) throw error
    }
  },

  async deleteUser(id: string): Promise<void> {
    // Get user email first
    const { data: profile } = await supabase
      .from('reurb_profiles')
      .select('email')
      .eq('id', id)
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
      .from('reurb_profiles')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // Groups
  async getGroups(): Promise<UserGroup[]> {
    if (!isOnline()) return db.getGroups()
    try {
      // Get unique groups from reurb_profiles
      const { data, error } = await supabase
        .from('reurb_profiles')
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
          reurb_profiles:user_id ( nome )
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
        else if (!a.reurb_profiles) type = 'system'

        return {
          id: a.id,
          action: a.action,
          details: a.details || '',
          user_name: a.reurb_profiles?.nome || 'Sistema',
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
