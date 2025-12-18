import {
  Project,
  Quadra,
  Lote,
  SyncLogEntry,
  DashboardStats,
  User,
  UserGroup,
  AppSettings,
  SavedCoordinate,
  MapKey,
  MarkerConfig,
  CustomLayer,
  MapDrawing,
  GeoAlert,
  DrawingLayer,
  DrawingHistory,
  ActiveSession,
} from '@/types'
import { SEED_PROJECTS, SEED_QUADRAS, SEED_LOTES } from './seedData'

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const STORAGE_KEYS = {
  PROJECTS: 'reurb_projects',
  QUADRAS: 'reurb_quadras',
  LOTES: 'reurb_lotes',
  LOGS: 'reurb_logs',
  USERS: 'reurb_users',
  GROUPS: 'reurb_groups',
  SETTINGS: 'reurb_settings',
  SAVED_COORDS: 'reurb_saved_coords',
  MAP_KEYS: 'reurb_map_keys',
  MARKER_CONFIGS: 'reurb_marker_configs',
  CUSTOM_LAYERS: 'reurb_custom_layers',
  MAP_DRAWINGS: 'reurb_map_drawings',
  DRAWING_HISTORY: 'reurb_drawing_history',
  DRAWING_LAYERS: 'reurb_drawing_layers',
  GEO_ALERTS: 'reurb_geo_alerts',
  SESSIONS: 'reurb_sessions',
}

// ... Keep existing SEED constants ...
const SEED_GROUPS: UserGroup[] = [
  {
    id: 'g1',
    name: 'Administrador Master',
    role: 'admin',
    permissions: ['all'],
  },
  {
    id: 'g2',
    name: 'Administrador do Sistema',
    role: 'admin',
    permissions: ['manage_users', 'manage_groups', 'view_reports'],
  },
  {
    id: 'g3',
    name: 'Amapá Terras',
    role: 'manager',
    permissions: ['edit_projects', 'view_reports'],
  },
  { id: 'g4', name: 'SEHAB', role: 'manager', permissions: ['edit_projects'] },
  {
    id: 'g5',
    name: 'Next Ambiente',
    role: 'viewer',
    permissions: ['view_only'],
  },
]

const SEED_USERS: User[] = [
  {
    id: 'u1',
    username: 'carlos.botelho',
    name: 'Carlos Botelho',
    groupIds: ['g1'],
    active: true,
  },
]

const DEFAULT_SETTINGS: AppSettings = {
  apiEndpoint: 'https://api.reurb-app.com/v1',
  cacheEnabled: true,
  syncFrequency: 'auto-15m',
  pushNotifications: true,
  googleMapsApiKey: '',
}

const SEED_SAVED_COORDS: SavedCoordinate[] = [
  {
    id: 'sc1',
    name: 'Praça Central',
    latitude: '0.0420571',
    longitude: '-51.1247705',
  },
  {
    id: 'sc2',
    name: 'Prefeitura',
    latitude: '0.038521',
    longitude: '-51.070012',
  },
]

const DEFAULT_MARKER_CONFIGS: MarkerConfig[] = [
  {
    id: 'synchronized',
    label: 'Sincronizado',
    color: '#22c55e',
    icon: 'circle',
  },
  { id: 'pending', label: 'Pendente', color: '#f97316', icon: 'circle' },
  { id: 'failed', label: 'Falha', color: '#ef4444', icon: 'circle' },
  { id: 'default', label: 'Padrão', color: '#3b82f6', icon: 'circle' },
]

const DEFAULT_DRAWING_LAYERS: DrawingLayer[] = [
  { id: 'default_layer', name: 'Camada Padrão', visible: true },
]

class DBService {
  constructor() {
    this.init()
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      this.seedAll()
    } else {
      this.ensureSeedData()
      this.ensureAuthData()
      this.ensureSavedCoords()
      this.ensureMapData()
    }
  }

  private seedAll() {
    this.saveItems(STORAGE_KEYS.PROJECTS, SEED_PROJECTS)
    this.saveItems(STORAGE_KEYS.QUADRAS, SEED_QUADRAS)
    this.saveItems(STORAGE_KEYS.LOTES, SEED_LOTES)
    this.saveItems(STORAGE_KEYS.LOGS, [])
    this.saveItems(STORAGE_KEYS.GROUPS, SEED_GROUPS)
    this.saveItems(STORAGE_KEYS.USERS, SEED_USERS)
    this.saveItems(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    this.saveItems(STORAGE_KEYS.SAVED_COORDS, SEED_SAVED_COORDS)
    this.saveItems(STORAGE_KEYS.MARKER_CONFIGS, DEFAULT_MARKER_CONFIGS)
    this.saveItems(STORAGE_KEYS.MAP_KEYS, [])
    this.saveItems(STORAGE_KEYS.CUSTOM_LAYERS, [])
    this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, [])
    this.saveItems(STORAGE_KEYS.DRAWING_HISTORY, [])
    this.saveItems(STORAGE_KEYS.DRAWING_LAYERS, DEFAULT_DRAWING_LAYERS)
    this.saveItems(STORAGE_KEYS.GEO_ALERTS, [])
    this.saveItems(STORAGE_KEYS.SESSIONS, [])
  }

  private ensureAuthData() {
    if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
      this.saveItems(STORAGE_KEYS.GROUPS, SEED_GROUPS)
    }
    const users = this.getItems<User>(STORAGE_KEYS.USERS)
    if (!users || users.length === 0) {
      this.saveItems(STORAGE_KEYS.USERS, SEED_USERS)
    } else {
      const migrated = users.map((u: any) => ({
        ...u,
        groupIds: u.groupIds || (u.groupId ? [u.groupId] : []),
        active: u.active ?? true,
      }))
      if (JSON.stringify(migrated) !== JSON.stringify(users)) {
        this.saveItems(STORAGE_KEYS.USERS, migrated)
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveItems(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    }
  }

  private ensureSavedCoords() {
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_COORDS)) {
      this.saveItems(STORAGE_KEYS.SAVED_COORDS, SEED_SAVED_COORDS)
    }
  }

  private ensureMapData() {
    if (!localStorage.getItem(STORAGE_KEYS.MARKER_CONFIGS)) {
      this.saveItems(STORAGE_KEYS.MARKER_CONFIGS, DEFAULT_MARKER_CONFIGS)
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAP_KEYS)) {
      this.saveItems(STORAGE_KEYS.MAP_KEYS, [])
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_LAYERS)) {
      this.saveItems(STORAGE_KEYS.CUSTOM_LAYERS, [])
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAP_DRAWINGS)) {
      this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, [])
    }
    if (!localStorage.getItem(STORAGE_KEYS.DRAWING_HISTORY)) {
      this.saveItems(STORAGE_KEYS.DRAWING_HISTORY, [])
    }
    if (!localStorage.getItem(STORAGE_KEYS.DRAWING_LAYERS)) {
      this.saveItems(STORAGE_KEYS.DRAWING_LAYERS, DEFAULT_DRAWING_LAYERS)
    }
    if (!localStorage.getItem(STORAGE_KEYS.GEO_ALERTS)) {
      this.saveItems(STORAGE_KEYS.GEO_ALERTS, [])
    }
  }

  private ensureSeedData() {
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS)
    let projectsUpdated = false
    const projectMap = new Map<string, string>()

    SEED_PROJECTS.forEach((seedP) => {
      const existingIndex = projects.findIndex(
        (p) => p.local_id === seedP.local_id,
      )
      if (existingIndex === -1) {
        projects.push(seedP)
        projectsUpdated = true
        projectMap.set(seedP.local_id, seedP.field_348)
      } else {
        // Force update critical projects like Marabaixo 1 if they don't match seed coords
        if (seedP.local_id === 'proj-1') {
          const p = projects[existingIndex]
          if (
            p.latitude !== seedP.latitude ||
            p.longitude !== seedP.longitude
          ) {
            projects[existingIndex] = {
              ...p,
              latitude: seedP.latitude,
              longitude: seedP.longitude,
            }
            projectsUpdated = true
          }
        }
        projectMap.set(
          projects[existingIndex].local_id,
          projects[existingIndex].field_348,
        )
      }
    })

    if (projectsUpdated) this.saveItems(STORAGE_KEYS.PROJECTS, projects)

    const quadras = this.getItems<Quadra>(STORAGE_KEYS.QUADRAS)
    let quadrasUpdated = false

    SEED_QUADRAS.forEach((seedQ) => {
      const existing = quadras.find((q) => q.local_id === seedQ.local_id)
      if (!existing) {
        quadras.push(seedQ)
        quadrasUpdated = true
      }
    })

    if (quadrasUpdated) this.saveItems(STORAGE_KEYS.QUADRAS, quadras)

    const lotes = this.getItems<Lote>(STORAGE_KEYS.LOTES)
    let lotesUpdated = false

    SEED_LOTES.forEach((seedL) => {
      const existing = lotes.find((l) => l.local_id === seedL.local_id)
      if (!existing) {
        lotes.push(seedL)
        lotesUpdated = true
      }
    })

    lotes.forEach((l) => {
      if (!l.coordinates) {
        l.coordinates = {
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
        }
        lotesUpdated = true
      }
    })

    if (lotesUpdated) this.saveItems(STORAGE_KEYS.LOTES, lotes)
  }

  private getItems<T>(key: string): T[] {
    const items = localStorage.getItem(key)
    return items ? JSON.parse(items) : []
  }

  private saveItems<T>(key: string, items: T[]) {
    localStorage.setItem(key, JSON.stringify(items))
  }

  authenticate(username: string, pass: string): User | null {
    const users = this.getItems<User>(STORAGE_KEYS.USERS)
    const user = users.find((u) => u.username === username && u.active)
    if (user && pass === '@#Cvb75195364#@') {
      return user
    }
    if (user && pass === 'password') {
      return user
    }
    return null
  }

  getUsers(): User[] {
    return this.getItems<User>(STORAGE_KEYS.USERS)
  }

  saveUser(user: User): User {
    if (user.id === 'u1' || user.username === 'carlos.botelho') {
      if (!user.groupIds.includes('g1')) {
        user.groupIds.push('g1')
      }
      user.active = true
    }

    const users = this.getItems<User>(STORAGE_KEYS.USERS)
    const index = users.findIndex((u) => u.id === user.id)
    if (index !== -1) {
      users[index] = user
    } else {
      user.id = user.id || generateUUID()
      users.push(user)
    }
    this.saveItems(STORAGE_KEYS.USERS, users)
    return user
  }

  deleteUser(userId: string) {
    if (userId === 'u1') {
      throw new Error('Não é possível excluir o usuário mestre.')
    }

    const users = this.getItems<User>(STORAGE_KEYS.USERS)
    const filtered = users.filter((u) => u.id !== userId)
    this.saveItems(STORAGE_KEYS.USERS, filtered)
  }

  getGroups(): UserGroup[] {
    return this.getItems<UserGroup>(STORAGE_KEYS.GROUPS)
  }

  getUserGroup(groupId: string): UserGroup | undefined {
    return this.getItems<UserGroup>(STORAGE_KEYS.GROUPS).find(
      (g) => g.id === groupId,
    )
  }

  saveGroup(group: UserGroup): UserGroup {
    if (group.id === 'g1') {
      if (!group.permissions.includes('all')) {
        group.permissions = ['all']
      }
    }

    const groups = this.getItems<UserGroup>(STORAGE_KEYS.GROUPS)
    const index = groups.findIndex((g) => g.id === group.id)
    if (index !== -1) {
      groups[index] = group
    } else {
      group.id = group.id || generateUUID()
      groups.push(group)
    }
    this.saveItems(STORAGE_KEYS.GROUPS, groups)
    return group
  }

  deleteGroup(groupId: string) {
    if (groupId === 'g1') {
      throw new Error('Não é possível excluir o grupo Administrador Master.')
    }

    const groups = this.getItems<UserGroup>(STORAGE_KEYS.GROUPS)
    const filteredGroups = groups.filter((g) => g.id !== groupId)
    this.saveItems(STORAGE_KEYS.GROUPS, filteredGroups)

    const users = this.getItems<User>(STORAGE_KEYS.USERS)
    const updatedUsers = users.map((u) => ({
      ...u,
      groupIds: u.groupIds.filter((gid) => gid !== groupId),
    }))
    this.saveItems(STORAGE_KEYS.USERS, updatedUsers)
  }

  updateGroupMembers(groupId: string, userIds: string[]) {
    if (groupId === 'g1' && !userIds.includes('u1')) {
      userIds.push('u1')
    }

    const users = this.getItems<User>(STORAGE_KEYS.USERS)
    const updatedUsers = users.map((u) => {
      const isMember = userIds.includes(u.id)
      const hasGroup = u.groupIds.includes(groupId)

      if (isMember && !hasGroup) {
        return { ...u, groupIds: [...u.groupIds, groupId] }
      } else if (!isMember && hasGroup) {
        return { ...u, groupIds: u.groupIds.filter((id) => id !== groupId) }
      }
      return u
    })
    this.saveItems(STORAGE_KEYS.USERS, updatedUsers)
  }

  getSettings(): AppSettings {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return settings ? JSON.parse(settings) : DEFAULT_SETTINGS
  }

  saveSettings(settings: AppSettings) {
    this.saveItems(STORAGE_KEYS.SETTINGS, settings)
  }

  clearCache() {
    const settings = this.getSettings()
    const users = this.getItems(STORAGE_KEYS.USERS)
    const groups = this.getItems(STORAGE_KEYS.GROUPS)
    const mapKeys = this.getItems(STORAGE_KEYS.MAP_KEYS)
    const markerConfigs = this.getItems(STORAGE_KEYS.MARKER_CONFIGS)

    localStorage.clear()
    this.saveItems(STORAGE_KEYS.SETTINGS, settings)
    this.saveItems(STORAGE_KEYS.USERS, users)
    this.saveItems(STORAGE_KEYS.GROUPS, groups)
    this.saveItems(STORAGE_KEYS.MAP_KEYS, mapKeys)
    this.saveItems(STORAGE_KEYS.MARKER_CONFIGS, markerConfigs)
    this.seedAll()
  }

  getProjects(): Project[] {
    return this.getItems<Project>(STORAGE_KEYS.PROJECTS)
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.local_id === id)
  }

  updateProject(project: Project): Project {
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS)
    const index = projects.findIndex((p) => p.local_id === project.local_id)
    if (index !== -1) {
      const updatedProject = {
        ...project,
        sync_status: 'pending',
        date_updated: Date.now(),
      } as Project
      projects[index] = updatedProject
      this.saveItems(STORAGE_KEYS.PROJECTS, projects)
      this.logActivity(
        'Projeto',
        'Iniciado',
        `Projeto ${project.field_348} atualizado localmente.`,
      )
      return updatedProject
    }
    throw new Error('Project not found')
  }

  getQuadrasByProject(projectId: string): Quadra[] {
    return this.getItems<Quadra>(STORAGE_KEYS.QUADRAS).filter(
      (q) => q.parent_item_id === projectId,
    )
  }

  getQuadra(id: string): Quadra | undefined {
    return this.getItems<Quadra>(STORAGE_KEYS.QUADRAS).find(
      (q) => q.local_id === id,
    )
  }

  getLotesByQuadra(quadraId: string): Lote[] {
    return this.getItems<Lote>(STORAGE_KEYS.LOTES).filter(
      (l) => l.parent_item_id === quadraId,
    )
  }

  getAllLotes(): Lote[] {
    return this.getItems<Lote>(STORAGE_KEYS.LOTES)
  }

  getLote(id: string): Lote | undefined {
    return this.getItems<Lote>(STORAGE_KEYS.LOTES).find(
      (l) => l.local_id === id,
    )
  }

  saveLote(loteData: Partial<Lote>, quadraId: string): Lote {
    const lotes = this.getItems<Lote>(STORAGE_KEYS.LOTES)
    const now = Date.now()
    let savedLote: Lote

    if (loteData.local_id) {
      const index = lotes.findIndex((l) => l.local_id === loteData.local_id)
      if (index !== -1) {
        savedLote = {
          ...lotes[index],
          ...loteData,
          sync_status: 'pending',
          date_updated: now,
          parent_item_id: quadraId,
        } as Lote
        lotes[index] = savedLote
      } else {
        throw new Error('Lote not found')
      }
    } else {
      savedLote = {
        ...loteData,
        id: 0,
        local_id: generateUUID(),
        sync_status: 'pending',
        date_added: now,
        date_updated: now,
        parent_item_id: quadraId,
        field_352: loteData.field_352 || [],
        coordinates: { x: Math.random() * 90 + 5, y: Math.random() * 90 + 5 },
      } as Lote
      lotes.push(savedLote)
    }

    this.saveItems(STORAGE_KEYS.LOTES, lotes)
    this.logActivity(
      'Lote',
      loteData.local_id ? 'Iniciado' : 'Iniciado',
      `Lote ${savedLote.field_338} salvo localmente.`,
    )
    return savedLote
  }

  deleteLote(localId: string) {
    const lotes = this.getItems<Lote>(STORAGE_KEYS.LOTES)
    const filtered = lotes.filter((l) => l.local_id !== localId)
    this.saveItems(STORAGE_KEYS.LOTES, filtered)
    this.logActivity('Lote', 'Iniciado', `Lote removido localmente.`)
  }

  getDashboardStats(): DashboardStats {
    const lotes = this.getItems<Lote>(STORAGE_KEYS.LOTES)
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS)
    const logs = this.getItems<SyncLogEntry>(STORAGE_KEYS.LOGS)
    const lastSyncLog = logs.find((l) => l.status === 'Sucesso')

    return {
      collected: lotes.length,
      synced: lotes.filter((l) => l.sync_status === 'synchronized').length,
      pending: lotes.filter(
        (l) => l.sync_status === 'pending' || l.sync_status === 'failed',
      ).length,
      pendingImages: lotes
        .filter((l) => l.sync_status !== 'synchronized')
        .reduce((acc, l) => acc + (l.field_352?.length || 0), 0),
      totalProjects: projects.length,
      lastSync: lastSyncLog ? lastSyncLog.timestamp : undefined,
    }
  }

  getPendingItems() {
    return {
      lotes: this.getItems<Lote>(STORAGE_KEYS.LOTES).filter(
        (l) => l.sync_status === 'pending' || l.sync_status === 'failed',
      ),
      projects: this.getItems<Project>(STORAGE_KEYS.PROJECTS).filter(
        (p) => p.sync_status === 'pending',
      ),
      quadras: this.getItems<Quadra>(STORAGE_KEYS.QUADRAS).filter(
        (q) => q.sync_status === 'pending',
      ),
    }
  }

  updateLoteStatus(
    localId: string,
    status: 'synchronized' | 'failed',
    remoteId?: number,
  ) {
    const lotes = this.getItems<Lote>(STORAGE_KEYS.LOTES)
    const index = lotes.findIndex((l) => l.local_id === localId)
    if (index !== -1) {
      lotes[index].sync_status = status
      if (remoteId) lotes[index].id = remoteId
      this.saveItems(STORAGE_KEYS.LOTES, lotes)
    }
  }

  getLogs(): SyncLogEntry[] {
    return this.getItems<SyncLogEntry>(STORAGE_KEYS.LOGS).sort(
      (a, b) => b.timestamp - a.timestamp,
    )
  }

  logActivity(type: SyncLogEntry['type'], status: string, message: string) {
    const logs = this.getItems<SyncLogEntry>(STORAGE_KEYS.LOGS)
    const entry: SyncLogEntry = {
      id: generateUUID(),
      timestamp: Date.now(),
      type,
      status: status as any,
      message,
    }
    logs.unshift(entry)
    if (logs.length > 100) logs.pop()
    this.saveItems(STORAGE_KEYS.LOGS, logs)
  }

  // Saved Coordinates Methods
  getSavedCoordinates(): SavedCoordinate[] {
    return this.getItems<SavedCoordinate>(STORAGE_KEYS.SAVED_COORDS)
  }

  saveSavedCoordinate(coord: SavedCoordinate): SavedCoordinate {
    const coords = this.getItems<SavedCoordinate>(STORAGE_KEYS.SAVED_COORDS)
    const index = coords.findIndex((c) => c.id === coord.id)
    if (index !== -1) {
      coords[index] = coord
    } else {
      coord.id = coord.id || generateUUID()
      coords.push(coord)
    }
    this.saveItems(STORAGE_KEYS.SAVED_COORDS, coords)
    return coord
  }

  deleteSavedCoordinate(id: string) {
    const coords = this.getItems<SavedCoordinate>(STORAGE_KEYS.SAVED_COORDS)
    const filtered = coords.filter((c) => c.id !== id)
    this.saveItems(STORAGE_KEYS.SAVED_COORDS, filtered)
  }

  // Map Keys
  getMapKeys(): MapKey[] {
    return this.getItems<MapKey>(STORAGE_KEYS.MAP_KEYS)
  }

  getActiveMapKey(): MapKey | undefined {
    return this.getMapKeys().find((k) => k.isActive)
  }

  saveMapKey(key: MapKey): MapKey {
    const keys = this.getMapKeys()
    const index = keys.findIndex((k) => k.id === key.id)

    // If making active, deactivate others
    if (key.isActive) {
      keys.forEach((k) => (k.isActive = false))
    }

    if (index !== -1) {
      keys[index] = key
    } else {
      key.id = key.id || generateUUID()
      key.createdAt = Date.now()
      keys.push(key)
    }
    this.saveItems(STORAGE_KEYS.MAP_KEYS, keys)
    return key
  }

  deleteMapKey(id: string) {
    const keys = this.getMapKeys()
    const filtered = keys.filter((k) => k.id !== id)
    this.saveItems(STORAGE_KEYS.MAP_KEYS, filtered)
  }

  // Marker Configs
  getMarkerConfigs(): MarkerConfig[] {
    const configs = this.getItems<MarkerConfig>(STORAGE_KEYS.MARKER_CONFIGS)
    return configs.length ? configs : DEFAULT_MARKER_CONFIGS
  }

  saveMarkerConfig(config: MarkerConfig) {
    const configs = this.getMarkerConfigs()
    const index = configs.findIndex((c) => c.id === config.id)
    if (index !== -1) {
      configs[index] = config
    } else {
      configs.push(config)
    }
    this.saveItems(STORAGE_KEYS.MARKER_CONFIGS, configs)
  }

  // Custom Layers
  getCustomLayers(): CustomLayer[] {
    return this.getItems<CustomLayer>(STORAGE_KEYS.CUSTOM_LAYERS)
  }

  saveCustomLayer(layer: CustomLayer): CustomLayer {
    const layers = this.getCustomLayers()
    const index = layers.findIndex((l) => l.id === layer.id)
    if (index !== -1) {
      layers[index] = layer
    } else {
      layers.push(layer)
    }
    this.saveItems(STORAGE_KEYS.CUSTOM_LAYERS, layers)
    return layer
  }

  deleteCustomLayer(id: string) {
    const layers = this.getCustomLayers()
    const filtered = layers.filter((l) => l.id !== id)
    this.saveItems(STORAGE_KEYS.CUSTOM_LAYERS, filtered)
  }

  // Drawing Layers (User Created)
  getDrawingLayers(): DrawingLayer[] {
    const layers = this.getItems<DrawingLayer>(STORAGE_KEYS.DRAWING_LAYERS)
    if (!layers || layers.length === 0) {
      return DEFAULT_DRAWING_LAYERS
    }
    return layers
  }

  saveDrawingLayer(layer: DrawingLayer): DrawingLayer {
    const layers = this.getDrawingLayers()
    const index = layers.findIndex((l) => l.id === layer.id)
    if (index !== -1) {
      layers[index] = layer
    } else {
      layers.push(layer)
    }
    this.saveItems(STORAGE_KEYS.DRAWING_LAYERS, layers)
    return layer
  }

  deleteDrawingLayer(id: string) {
    const layers = this.getDrawingLayers()
    const filtered = layers.filter((l) => l.id !== id)

    if (filtered.length === 0) {
      filtered.push({
        id: 'default_layer',
        name: 'Camada Padrão',
        visible: true,
      })
    }
    this.saveItems(STORAGE_KEYS.DRAWING_LAYERS, filtered)

    const fallbackLayerId = filtered[0].id
    const drawings = this.getMapDrawings()
    let drawingsUpdated = false
    const updatedDrawings = drawings.map((d) => {
      if (d.layerId === id) {
        drawingsUpdated = true
        return { ...d, layerId: fallbackLayerId }
      }
      return d
    })

    if (drawingsUpdated) {
      this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, updatedDrawings)
    }
  }

  // Map Drawings
  getMapDrawings(): MapDrawing[] {
    return this.getItems<MapDrawing>(STORAGE_KEYS.MAP_DRAWINGS)
  }

  saveMapDrawing(
    drawing: MapDrawing,
    user?: User | null,
    action: DrawingHistory['action'] = 'create',
    details: string = '',
  ): MapDrawing {
    const drawings = this.getMapDrawings()
    const index = drawings.findIndex((d) => d.id === drawing.id)
    if (index !== -1) {
      drawing.updatedAt = Date.now()
      drawings[index] = drawing
    } else {
      drawing.createdAt = Date.now()
      drawings.push(drawing)
    }
    this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, drawings)

    // Log history
    if (user) {
      this.logDrawingHistory({
        id: generateUUID(),
        drawingId: drawing.id,
        timestamp: Date.now(),
        action,
        details,
        userId: user.id,
        userName: user.name,
      })
    }

    return drawing
  }

  setMapDrawings(drawings: MapDrawing[]) {
    this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, drawings)
  }

  deleteMapDrawing(id: string, user?: User | null) {
    const drawings = this.getMapDrawings()
    const filtered = drawings.filter((d) => d.id !== id)
    this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, filtered)

    if (user) {
      this.logDrawingHistory({
        id: generateUUID(),
        drawingId: id,
        timestamp: Date.now(),
        action: 'delete',
        details: 'Geometria removida',
        userId: user.id,
        userName: user.name,
      })
    }
  }

  // Drawing History
  getDrawingHistory(drawingId?: string): DrawingHistory[] {
    const history = this.getItems<DrawingHistory>(STORAGE_KEYS.DRAWING_HISTORY)
    if (drawingId) {
      return history
        .filter((h) => h.drawingId === drawingId)
        .sort((a, b) => b.timestamp - a.timestamp)
    }
    return history.sort((a, b) => b.timestamp - a.timestamp)
  }

  private logDrawingHistory(entry: DrawingHistory) {
    const history = this.getItems<DrawingHistory>(STORAGE_KEYS.DRAWING_HISTORY)
    history.push(entry)
    // Optional: Limit history size
    if (history.length > 5000) history.shift()
    this.saveItems(STORAGE_KEYS.DRAWING_HISTORY, history)
  }

  // User Sessions (Mocking realtime collaboration)
  updateUserSession(user: User, active: boolean = true) {
    const sessions = this.getItems<ActiveSession>(STORAGE_KEYS.SESSIONS)
    const index = sessions.findIndex((s) => s.userId === user.id)
    const now = Date.now()

    // Assign a consistent color for the user
    const colors = [
      '#f44336',
      '#E91E63',
      '#9C27B0',
      '#673AB7',
      '#3F51B5',
      '#2196F3',
      '#009688',
      '#4CAF50',
      '#FF9800',
      '#FF5722',
    ]
    const color = colors[user.id.charCodeAt(0) % colors.length]

    if (index !== -1) {
      if (active) {
        sessions[index].lastActive = now
      } else {
        sessions.splice(index, 1) // Remove session on explicit inactive
      }
    } else if (active) {
      sessions.push({
        id: generateUUID(),
        userId: user.id,
        userName: user.name,
        lastActive: now,
        color,
      })
    }

    // Clean up stale sessions (> 2 minutes)
    const activeSessions = sessions.filter(
      (s) => now - s.lastActive < 2 * 60 * 1000,
    )

    this.saveItems(STORAGE_KEYS.SESSIONS, activeSessions)
  }

  getActiveSessions(): ActiveSession[] {
    const sessions = this.getItems<ActiveSession>(STORAGE_KEYS.SESSIONS)
    const now = Date.now()
    // Mock other users for demo purposes if only 1 user
    if (sessions.length <= 1) {
      // Return mocked users for "collaboration" visual
      return [
        ...sessions,
        {
          id: 'mock1',
          userId: 'u_mock_1',
          userName: 'Ana Souza (Fiscal)',
          lastActive: now - 10000,
          color: '#E91E63',
        },
        {
          id: 'mock2',
          userId: 'u_mock_2',
          userName: 'João Silva (Campo)',
          lastActive: now - 45000,
          color: '#FF9800',
        },
      ]
    }

    return sessions.filter((s) => now - s.lastActive < 5 * 60 * 1000)
  }

  // Geo Alerts
  getGeoAlerts(): GeoAlert[] {
    return this.getItems<GeoAlert>(STORAGE_KEYS.GEO_ALERTS)
  }

  saveGeoAlert(alert: GeoAlert): GeoAlert {
    const alerts = this.getGeoAlerts()
    const index = alerts.findIndex((a) => a.id === alert.id)
    if (index !== -1) {
      alerts[index] = alert
    } else {
      alerts.push(alert)
    }
    this.saveItems(STORAGE_KEYS.GEO_ALERTS, alerts)
    return alert
  }

  deleteGeoAlert(id: string) {
    const alerts = this.getGeoAlerts()
    const filtered = alerts.filter((a) => a.id !== id)
    this.saveItems(STORAGE_KEYS.GEO_ALERTS, filtered)
  }
}

export const db = new DBService()
