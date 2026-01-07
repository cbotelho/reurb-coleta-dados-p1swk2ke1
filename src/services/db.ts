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
  Survey,
  ProductivityData,
  ModalityData,
  RecentActivityItem,
  TitlingGoalData,
} from '@/types'
import { SEED_PROJECTS, SEED_QUADRAS, SEED_LOTES } from './seedData'
import { subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  SURVEYS: 'reurb_surveys',
}

// ... (Rest of seed data constants same as original file, omitting to save space, but they should be here)
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
  { id: 'surveyed', label: 'Vistoriado', color: '#3b82f6', icon: 'home' },
  {
    id: 'not_surveyed',
    label: 'Não Vistoriado',
    color: '#9ca3af',
    icon: 'circle',
  },
  { id: 'default', label: 'Padrão', color: '#7c3aed', icon: 'circle' },
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
    this.saveItems(STORAGE_KEYS.SURVEYS, [])
  }

  // ... (Keep existing private ensure methods)
  private ensureAuthData() {
    if (!localStorage.getItem(STORAGE_KEYS.GROUPS))
      this.saveItems(STORAGE_KEYS.GROUPS, SEED_GROUPS)
    const users = this.getItems<User>(STORAGE_KEYS.USERS)
    if (!users || users.length === 0)
      this.saveItems(STORAGE_KEYS.USERS, SEED_USERS)
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS))
      this.saveItems(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }

  private ensureSavedCoords() {
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_COORDS))
      this.saveItems(STORAGE_KEYS.SAVED_COORDS, SEED_SAVED_COORDS)
  }

  private ensureMapData() {
    if (!localStorage.getItem(STORAGE_KEYS.MARKER_CONFIGS))
      this.saveItems(STORAGE_KEYS.MARKER_CONFIGS, DEFAULT_MARKER_CONFIGS)
    if (!localStorage.getItem(STORAGE_KEYS.DRAWING_LAYERS))
      this.saveItems(STORAGE_KEYS.DRAWING_LAYERS, DEFAULT_DRAWING_LAYERS)
  }

  private ensureSeedData() {
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS))
      this.saveItems(STORAGE_KEYS.PROJECTS, SEED_PROJECTS)
  }

  // ... (Keep existing generic methods)
  getItems<T>(key: string): T[] {
    const items = localStorage.getItem(key)
    return items ? JSON.parse(items) : []
  }

  saveItems<T>(key: string, items: T[]) {
    localStorage.setItem(key, JSON.stringify(items))
  }

  // ... (Keep all existing project, quadra, lote, survey methods)
  getProjects(): Project[] {
    return this.getItems<Project>(STORAGE_KEYS.PROJECTS)
  }
  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.local_id === id)
  }
  updateProject(project: Project): Project {
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS)
    const index = projects.findIndex((p) => p.local_id === project.local_id)
    if (index !== -1) projects[index] = { ...project, date_updated: Date.now() }
    else projects.push(project)
    this.saveItems(STORAGE_KEYS.PROJECTS, projects)
    return project
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
  saveQuadra(quadra: Quadra): Quadra {
    const quadras = this.getItems<Quadra>(STORAGE_KEYS.QUADRAS)
    const index = quadras.findIndex((q) => q.local_id === quadra.local_id)
    if (index !== -1) quadras[index] = quadra
    else quadras.push(quadra)
    this.saveItems(STORAGE_KEYS.QUADRAS, quadras)
    return quadra
  }

  getAllLotes(): Lote[] {
    return this.getItems<Lote>(STORAGE_KEYS.LOTES)
  }
  getLotesByQuadra(quadraId: string): Lote[] {
    return this.getAllLotes().filter((l) => l.parent_item_id === quadraId)
  }
  getLote(id: string): Lote | undefined {
    return this.getAllLotes().find((l) => l.local_id === id)
  }
  saveLote(loteData: Partial<Lote>, quadraId: string): Lote {
    const lotes = this.getAllLotes()
    let savedLote: Lote

    if (loteData.local_id) {
      const index = lotes.findIndex((l) => l.local_id === loteData.local_id)
      if (index !== -1) {
        savedLote = {
          ...lotes[index],
          ...loteData,
          date_updated: Date.now(),
          parent_item_id: quadraId,
        } as Lote
        lotes[index] = savedLote
      } else {
        savedLote = {
          ...loteData,
          parent_item_id: quadraId,
          date_updated: Date.now(),
        } as Lote
        lotes.push(savedLote)
      }
    } else {
      savedLote = {
        ...loteData,
        id: 0,
        local_id: generateUUID(),
        sync_status: 'pending',
        date_added: Date.now(),
        date_updated: Date.now(),
        parent_item_id: quadraId,
        images: loteData.images || [],
        status: loteData.status || 'not_surveyed',
      } as Lote
      lotes.push(savedLote)
    }
    this.saveItems(STORAGE_KEYS.LOTES, lotes)
    return savedLote
  }
  deleteLote(localId: string) {
    const lotes = this.getAllLotes().filter((l) => l.local_id !== localId)
    this.saveItems(STORAGE_KEYS.LOTES, lotes)
  }
  updateLoteStatus(
    localId: string,
    status: 'synchronized' | 'failed',
    remoteId?: number,
  ) {
    const lotes = this.getAllLotes()
    const index = lotes.findIndex((l) => l.local_id === localId)
    if (index !== -1) {
      lotes[index].sync_status = status
      if (remoteId) lotes[index].id = remoteId
      this.saveItems(STORAGE_KEYS.LOTES, lotes)
    }
  }

  getSurveys(): Survey[] {
    return this.getItems<Survey>(STORAGE_KEYS.SURVEYS)
  }
  getSurveyByPropertyId(propertyId: string): Survey | undefined {
    return this.getSurveys()
      .filter((s) => s.property_id === propertyId)
      .sort(
        (a, b) =>
          new Date(b.updated_at || 0).getTime() -
          new Date(a.updated_at || 0).getTime(),
      )[0]
  }
  saveSurvey(surveyData: Partial<Survey>): Survey {
    const surveys = this.getSurveys()
    const now = new Date().toISOString()
    let savedSurvey: Survey

    if (surveyData.id) {
      const index = surveys.findIndex((s) => s.id === surveyData.id)
      if (index !== -1) {
        savedSurvey = {
          ...surveys[index],
          ...surveyData,
          updated_at: now,
        } as Survey
        surveys[index] = savedSurvey
      } else {
        savedSurvey = { ...surveyData, updated_at: now } as Survey
        surveys.push(savedSurvey)
      }
    } else {
      savedSurvey = {
        ...surveyData,
        id: generateUUID(),
        created_at: now,
        updated_at: now,
        sync_status: surveyData.sync_status || 'pending',
      } as Survey
      surveys.push(savedSurvey)
    }
    this.saveItems(STORAGE_KEYS.SURVEYS, surveys)
    return savedSurvey
  }
  updateSurveyStatus(
    localId: string,
    status: 'synchronized' | 'failed',
    remoteId?: string,
  ) {
    const surveys = this.getSurveys()
    const index = surveys.findIndex((s) => s.id === localId)
    if (index !== -1) {
      surveys[index].sync_status = status
      if (remoteId) surveys[index].id = remoteId
      this.saveItems(STORAGE_KEYS.SURVEYS, surveys)
    }
  }

  getDashboardStats(): DashboardStats {
    const lotes = this.getAllLotes()
    const surveys = this.getSurveys()
    const quadras = this.getItems<Quadra>(STORAGE_KEYS.QUADRAS)
    const projects = this.getProjects()

    return {
      collected: lotes.length,
      synced: lotes.filter((l) => l.sync_status === 'synchronized').length,
      pending: lotes.filter(
        (l) => l.sync_status === 'pending' || l.sync_status === 'failed',
      ).length,
      pendingImages: lotes
        .filter((l) => l.sync_status !== 'synchronized')
        .reduce((acc, l) => acc + (l.images?.length || 0), 0),
      totalProjects: projects.length,
      pendingSurveys: surveys.filter(
        (s) => s.sync_status === 'pending' || s.sync_status === 'failed',
      ).length,
      totalSurveyed: lotes.filter(
        (l) => l.status === 'surveyed' || l.status === 'regularized',
      ).length,
      totalFamilies: surveys.length,
      totalQuadras: quadras.length,
      totalContracts: 0,
    }
  }

  // Enhanced Dashboard Stats for Offline Mode
  getProductivityStats(): ProductivityData[] {
    // Generate last 6 months mock/calculated data
    const data: ProductivityData[] = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthLabel = format(date, 'MMM', { locale: ptBR })
      // For offline dev, use random numbers that increase slightly
      data.push({
        month: monthLabel,
        cadastros: 20 + i * 5 + Math.floor(Math.random() * 10),
        titulos: 5 + i * 3 + Math.floor(Math.random() * 5),
      })
    }
    return data
  }

  getModalitiesStats(): ModalityData[] {
    return [
      { name: 'REURB-S', value: 842, fill: 'hsl(var(--chart-1))' },
      { name: 'REURB-E', value: 406, fill: 'hsl(var(--chart-2))' },
    ]
  }

  getRecentActivities(): RecentActivityItem[] {
    return [
      {
        id: '1',
        action: 'Novo cadastro realizado',
        details: 'Por: João Silva',
        user_name: 'João Silva',
        timestamp: new Date().toISOString(),
        type: 'registration',
      },
      {
        id: '2',
        action: 'Dossiê aprovado pela IA',
        details: 'Análise automática',
        user_name: 'Sistema',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        type: 'approval',
      },
    ]
  }

  getTitlingGoalStats(): TitlingGoalData {
    return {
      current: 1248,
      goal: 2000,
      monthly_rhythm: 145,
    }
  }

  getPendingItems() {
    return {
      lotes: this.getAllLotes().filter(
        (l) => l.sync_status === 'pending' || l.sync_status === 'failed',
      ),
      projects: this.getProjects().filter((p) => p.sync_status === 'pending'),
      quadras: this.getItems<Quadra>(STORAGE_KEYS.QUADRAS).filter(
        (q) => q.sync_status === 'pending',
      ),
      surveys: this.getSurveys().filter(
        (s) => s.sync_status === 'pending' || s.sync_status === 'failed',
      ),
    }
  }

  getLogs(): SyncLogEntry[] {
    return this.getItems<SyncLogEntry>(STORAGE_KEYS.LOGS)
  }
  logActivity(type: SyncLogEntry['type'], status: string, message: string) {
    const logs = this.getLogs()
    logs.unshift({
      id: generateUUID(),
      timestamp: Date.now(),
      type,
      status: status as any,
      message,
    })
    if (logs.length > 100) logs.pop()
    this.saveItems(STORAGE_KEYS.LOGS, logs)
  }

  // ... (Keep existing getter/setters for Settings, Users, Groups, Maps)
  getSettings(): AppSettings {
    return (
      this.getItems<AppSettings>(STORAGE_KEYS.SETTINGS)[0] || DEFAULT_SETTINGS
    )
  }
  saveSettings(s: AppSettings) {
    this.saveItems(STORAGE_KEYS.SETTINGS, [s])
  }
  getUsers(): User[] {
    return this.getItems<User>(STORAGE_KEYS.USERS)
  }
  getGroups(): UserGroup[] {
    return this.getItems<UserGroup>(STORAGE_KEYS.GROUPS)
  }

  getSavedCoordinates(): SavedCoordinate[] {
    return this.getItems<SavedCoordinate>(STORAGE_KEYS.SAVED_COORDS)
  }
  getMapKeys(): MapKey[] {
    return this.getItems<MapKey>(STORAGE_KEYS.MAP_KEYS)
  }
  getEffectiveMapKey(): MapKey | undefined {
    const keys = this.getMapKeys()
    const active = keys.find((k) => k.isActive)
    if (active) return active
    const s = this.getSettings()
    if (s.googleMapsApiKey)
      return {
        id: 'sys',
        name: 'System',
        key: s.googleMapsApiKey,
        isActive: true,
        createdAt: 0,
      }
    return undefined
  }

  getMarkerConfigs(): MarkerConfig[] {
    return this.getItems<MarkerConfig>(STORAGE_KEYS.MARKER_CONFIGS)
  }
  getCustomLayers(): CustomLayer[] {
    return this.getItems<CustomLayer>(STORAGE_KEYS.CUSTOM_LAYERS)
  }
  saveCustomLayer(l: CustomLayer) {
    const layers = this.getCustomLayers()
    const idx = layers.findIndex((lay) => lay.id === l.id)
    if (idx !== -1) layers[idx] = l
    else layers.push(l)
    this.saveItems(STORAGE_KEYS.CUSTOM_LAYERS, layers)
  }
  deleteCustomLayer(id: string) {
    this.saveItems(
      STORAGE_KEYS.CUSTOM_LAYERS,
      this.getCustomLayers().filter((l) => l.id !== id),
    )
  }

  getDrawingLayers(): DrawingLayer[] {
    return this.getItems<DrawingLayer>(STORAGE_KEYS.DRAWING_LAYERS)
  }
  saveDrawingLayer(l: DrawingLayer) {
    const layers = this.getDrawingLayers()
    const idx = layers.findIndex((lay) => lay.id === l.id)
    if (idx !== -1) layers[idx] = l
    else layers.push(l)
    this.saveItems(STORAGE_KEYS.DRAWING_LAYERS, layers)
  }
  deleteDrawingLayer(id: string) {
    this.saveItems(
      STORAGE_KEYS.DRAWING_LAYERS,
      this.getDrawingLayers().filter((l) => l.id !== id),
    )
  }

  getMapDrawings(): MapDrawing[] {
    return this.getItems<MapDrawing>(STORAGE_KEYS.MAP_DRAWINGS)
  }
  setMapDrawings(d: MapDrawing[]) {
    this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, d)
  }
  saveMapDrawing(
    d: MapDrawing,
    user?: User | null,
    action: DrawingHistory['action'] = 'create',
    details: string = '',
  ) {
    const drawings = this.getMapDrawings()
    const idx = drawings.findIndex((dr) => dr.id === d.id)
    if (idx !== -1) {
      d.updatedAt = Date.now()
      drawings[idx] = d
    } else {
      d.createdAt = Date.now()
      drawings.push(d)
    }
    this.saveItems(STORAGE_KEYS.MAP_DRAWINGS, drawings)
    if (user)
      this.logDrawingHistory({
        id: generateUUID(),
        drawingId: d.id,
        timestamp: Date.now(),
        action,
        details,
        userId: user.id,
        userName: user.name,
      })
    return d
  }
  deleteMapDrawing(id: string, user?: User | null) {
    this.saveItems(
      STORAGE_KEYS.MAP_DRAWINGS,
      this.getMapDrawings().filter((d) => d.id !== id),
    )
    if (user)
      this.logDrawingHistory({
        id: generateUUID(),
        drawingId: id,
        timestamp: Date.now(),
        action: 'delete',
        details: 'Removido',
        userId: user.id,
        userName: user.name,
      })
  }

  getDrawingHistory(drawingId?: string): DrawingHistory[] {
    const h = this.getItems<DrawingHistory>(STORAGE_KEYS.DRAWING_HISTORY)
    return drawingId ? h.filter((hist) => hist.drawingId === drawingId) : h
  }
  private logDrawingHistory(entry: DrawingHistory) {
    const h = this.getItems<DrawingHistory>(STORAGE_KEYS.DRAWING_HISTORY)
    h.push(entry)
    if (h.length > 5000) h.shift()
    this.saveItems(STORAGE_KEYS.DRAWING_HISTORY, h)
  }

  updateUserSession(user: User, active: boolean = true) {
    const sessions = this.getItems<ActiveSession>(STORAGE_KEYS.SESSIONS)
    const index = sessions.findIndex((s) => s.userId === user.id)
    if (active && index === -1) {
      sessions.push({
        id: generateUUID(),
        userId: user.id,
        userName: user.name,
        lastActive: Date.now(),
        color: '#2196F3',
      })
    } else if (active && index !== -1) {
      sessions[index].lastActive = Date.now()
    } else if (!active && index !== -1) {
      sessions.splice(index, 1)
    }
    this.saveItems(
      STORAGE_KEYS.SESSIONS,
      sessions.filter((s) => Date.now() - s.lastActive < 120000),
    )
  }
  getActiveSessions(): ActiveSession[] {
    return this.getItems<ActiveSession>(STORAGE_KEYS.SESSIONS)
  }

  getGeoAlerts(): GeoAlert[] {
    return this.getItems<GeoAlert>(STORAGE_KEYS.GEO_ALERTS)
  }
  saveGeoAlert(a: GeoAlert) {
    const alerts = this.getGeoAlerts()
    const idx = alerts.findIndex((al) => al.id === a.id)
    if (idx !== -1) alerts[idx] = a
    else alerts.push(a)
    this.saveItems(STORAGE_KEYS.GEO_ALERTS, alerts)
  }
  deleteGeoAlert(id: string) {
    this.saveItems(
      STORAGE_KEYS.GEO_ALERTS,
      this.getGeoAlerts().filter((a) => a.id !== id),
    )
  }
}

export const db = new DBService()
