import { supabase } from '@/lib/supabase/client'
import { Project, Quadra, Lote, DashboardStats, User } from '@/types'

// Helper to map DB rows to App types
const mapProject = (row: any): Project => ({
  id: 0, // Legacy number compatibility
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

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('reurb_projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapProject)
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('reurb_projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return mapProject(data)
  },

  async createProject(project: Partial<Project>): Promise<Project> {
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
    return mapProject(data)
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
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
    return mapProject(data)
  },

  // Quadras
  async getQuadras(projectId: string): Promise<Quadra[]> {
    const { data, error } = await supabase
      .from('reurb_quadras')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(mapQuadra)
  },

  async getQuadra(id: string): Promise<Quadra | null> {
    const { data, error } = await supabase
      .from('reurb_quadras')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return mapQuadra(data)
  },

  // Lotes
  async getLotes(quadraId: string): Promise<Lote[]> {
    const { data, error } = await supabase
      .from('reurb_properties')
      .select('*')
      .eq('quadra_id', quadraId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(mapLote)
  },

  async getAllLotes(): Promise<Lote[]> {
    const { data, error } = await supabase
      .from('reurb_properties')
      .select('*')
      .limit(1000)

    if (error) throw error
    return (data || []).map(mapLote)
  },

  async getLote(id: string): Promise<Lote | null> {
    const { data, error } = await supabase
      .from('reurb_properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return mapLote(data)
  },

  async saveLote(lote: Partial<Lote> & { quadra_id?: string }): Promise<Lote> {
    const payload: any = {
      name: lote.name,
      area: lote.area,
      description: lote.description,
      images: lote.images,
      latitude: lote.latitude ? parseFloat(lote.latitude) : null,
      longitude: lote.longitude ? parseFloat(lote.longitude) : null,
      updated_at: new Date().toISOString(),
    }

    if (lote.quadra_id) payload.quadra_id = lote.quadra_id

    let query
    if (lote.local_id && lote.local_id.length > 10) {
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
    return mapLote(data)
  },

  async deleteLote(id: string): Promise<void> {
    const { error } = await supabase
      .from('reurb_properties')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    // Count Projects
    const { count: totalProjects } = await supabase
      .from('reurb_projects')
      .select('*', { count: 'exact', head: true })

    // Count Lotes
    const { count: totalLotes } = await supabase
      .from('reurb_properties')
      .select('*', { count: 'exact', head: true })

    return {
      collected: totalLotes || 0,
      synced: totalLotes || 0,
      pending: 0,
      pendingImages: 0,
      totalProjects: totalProjects || 0,
      lastSync: Date.now(),
    }
  },

  // Users / Profiles
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('reurb_profiles').select('*')
    if (error) throw error
    return (data || []).map(mapProfile)
  },

  async saveUser(user: Partial<User>): Promise<void> {
    if (!user.id) throw new Error('Cannot create user without Auth ID')

    // Normally updating role needs admin privilege or specific RLS
    // For this demo, we assume the user might be updating own profile or has permission
    const { error } = await supabase
      .from('reurb_profiles')
      .update({
        full_name: user.name,
        role: user.groupIds?.[0] || 'viewer',
      })
      .eq('id', user.id)

    if (error) throw error
  },

  async deleteUser(id: string): Promise<void> {
    // Note: Deleting from auth.users via client is not possible usually.
    // This probably deletes the profile data.
    const { error } = await supabase
      .from('reurb_profiles')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
