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

const mapProfile = (row: any): User => {
  // Extract group IDs and Names from nested reurb_user_group_membership
  const groups = row.reurb_user_group_membership || []
  const groupIds = groups.map((g: any) => g.group_id)
  const groupNames = groups.map(
    (g: any) => g.reurb_user_groups?.name || 'Unknown',
  )

  return {
    id: row.id,
    username: row.username || '',
    name: row.full_name || '',
    email: row.username, // Sometimes username is email, fallback
    groupIds: groupIds.length > 0 ? groupIds : [row.role || 'viewer'],
    groupNames: groupNames,
    active: true,
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

    const { data, error } = await supabase
      .from('reurb_projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    const project = mapProject(data)
    db.updateProject(project)
    return project
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
      // Fetch users with their group memberships
      const { data, error } = await supabase
        .from('reurb_profiles')
        .select(
          '*, reurb_user_group_membership(group_id, reurb_user_groups(name))',
        )

      if (error) throw error

      return (data || []).map(mapProfile)
    } catch (e) {
      console.error('Error fetching users:', e)
      return db.getUsers()
    }
  },

  async saveUser(
    user: Partial<User> & { email?: string; password?: string },
  ): Promise<void> {
    if (user.id) {
      // Update existing user profile
      const payload = {
        full_name: user.name,
        username: user.username,
        role: user.groupIds && user.groupIds.length > 0 ? 'user' : 'viewer', // Fallback role for backward compatibility
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('reurb_profiles')
        .update(payload)
        .eq('id', user.id)

      if (error) throw error

      // Update Group Memberships
      if (user.groupIds) {
        // First delete existing
        await supabase
          .from('reurb_user_group_membership')
          .delete()
          .eq('user_id', user.id)

        // Then insert new
        if (user.groupIds.length > 0) {
          const membershipData = user.groupIds.map((gid) => ({
            user_id: user.id,
            group_id: gid,
          }))
          const { error: groupError } = await supabase
            .from('reurb_user_group_membership')
            .insert(membershipData)

          if (groupError) console.error('Error saving groups:', groupError)
        }
      }
    } else {
      // Create new user via Edge Function
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: user.email,
          password: user.password,
          fullName: user.name,
          username: user.username,
          role: 'user', // Default role, groups handle permission
          groupIds: user.groupIds,
        },
      })
      if (error) throw error
    }
  },

  async deleteUser(id: string): Promise<void> {
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
      const { data, error } = await supabase
        .from('reurb_user_groups')
        .select('*')
      if (error) throw error
      return (data || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        permissions: g.permissions || [],
        created_at: g.created_at,
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
          reurb_profiles:user_id ( full_name )
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
          user_name: a.reurb_profiles?.full_name || 'Sistema',
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
