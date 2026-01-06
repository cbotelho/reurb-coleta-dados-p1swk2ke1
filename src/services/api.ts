import { supabase } from '@/lib/supabase/client'
import { Project, Quadra, Lote, DashboardStats, User, Survey } from '@/types'
import { db } from './db'

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
})

const mapQuadra = (row: any): Quadra => ({
  id: 0,
  local_id: row.id,
  sync_status: 'synchronized',
  date_added: new Date(row.created_at).getTime(),
  date_updated: new Date(row.updated_at).getTime(),
  name: row.name,
  area: row.area || '',
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
})

const mapProfile = (row: any): User => ({
  id: row.id,
  username: row.username || '',
  name: row.full_name || '',
  groupIds: [row.role || 'viewer'],
  active: true,
})

const mapSurvey = (row: any): Survey => ({
  ...row,
  sync_status: 'synchronized',
  residents_count: row.residents_count || 0,
  rooms_count: row.rooms_count || 0,
  has_children: row.has_children ?? false,
})

const isOnline = () => navigator.onLine

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    if (!isOnline()) return db.getProjects()

    try {
      const { data, error } = await supabase
        .from('reurb_projects')
        .select('*')
        .order('created_at', { ascending: false })

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

  async createProject(project: Partial<Project>): Promise<Project> {
    if (!isOnline()) throw new Error('Requires internet')

    const { data, error } = await supabase
      .from('reurb_projects')
      .insert({
        name: project.name,
        description: project.description,
        image_url: project.image_url,
        latitude: project.latitude ? parseFloat(project.latitude) : null,
        longitude: project.longitude ? parseFloat(project.longitude) : null,
        auto_update_map: project.auto_update_map,
      })
      .select()
      .single()

    if (error) throw error
    const newProject = mapProject(data)
    db.updateProject(newProject)
    return newProject
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (!isOnline()) throw new Error('Requires internet')

    const payload: any = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.description !== undefined)
      payload.description = updates.description
    if (updates.image_url !== undefined) payload.image_url = updates.image_url
    if (updates.latitude !== undefined)
      payload.latitude = updates.latitude ? parseFloat(updates.latitude) : null
    if (updates.longitude !== undefined)
      payload.longitude = updates.longitude
        ? parseFloat(updates.longitude)
        : null
    if (updates.auto_update_map !== undefined)
      payload.auto_update_map = updates.auto_update_map
    if (updates.last_map_update !== undefined)
      payload.last_map_update = new Date(updates.last_map_update).toISOString()
    payload.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('reurb_projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    const updated = mapProject(data)
    db.updateProject(updated)
    return updated
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
      // Limit to 2000 to prevent massive payloads in demo
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
        lote.quadra_id || '',
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
      status: 'synchronized',
    }

    if (lote.quadra_id) payload.quadra_id = lote.quadra_id

    try {
      let query
      if (
        lote.local_id &&
        lote.local_id.length > 10 &&
        lote.local_id.includes('-')
      ) {
        // Heuristic: UUIDs usually have hyphens. If local ID is UUID-like, update.
        // Or if it matches a known format.
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
        lote.quadra_id || '',
      )
    }
  },

  async deleteLote(id: string): Promise<void> {
    if (!isOnline()) {
      db.deleteLote(id) // Ideally mark as deleted
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

    const payload = { ...survey, updated_at: new Date().toISOString() }
    delete (payload as any).sync_status
    delete (payload as any).local_id

    // Cleanup undefined
    Object.keys(payload).forEach(
      (key) =>
        (payload as any)[key] === undefined && delete (payload as any)[key],
    )

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
        delete (payload as any).id
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
      const localStats = db.getDashboardStats()
      return {
        collected: totalLotes || 0,
        synced: totalLotes || 0,
        pending: localStats.pending,
        pendingImages: localStats.pendingImages,
        totalProjects: totalProjects || 0,
        lastSync: Date.now(),
        pendingSurveys: localStats.pendingSurveys,
      }
    } catch {
      return db.getDashboardStats()
    }
  },

  async getUsers(): Promise<User[]> {
    if (!isOnline()) return db.getUsers()
    try {
      const { data } = await supabase.from('reurb_profiles').select('*')
      return (data || []).map(mapProfile)
    } catch {
      return db.getUsers()
    }
  },

  async saveUser(user: Partial<User>): Promise<void> {
    if (!user.id || !isOnline()) return
    await supabase
      .from('reurb_profiles')
      .update({ full_name: user.name, role: user.groupIds?.[0] || 'viewer' })
      .eq('id', user.id)
  },

  async deleteUser(id: string): Promise<void> {
    if (!isOnline()) return
    await supabase.from('reurb_profiles').delete().eq('id', id)
  },
}
