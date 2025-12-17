import {
  Project,
  Quadra,
  Lote,
  SyncLogEntry,
  DashboardStats,
  User,
  UserGroup,
  AppSettings,
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
}

// Seed Data for Auth
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
    permissions: ['manage_users', 'view_reports'],
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
    groupId: 'g1',
  },
]

const DEFAULT_SETTINGS: AppSettings = {
  apiEndpoint: 'https://api.reurb-app.com/v1',
  cacheEnabled: true,
  syncFrequency: 'auto-15m',
  pushNotifications: true,
}

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
  }

  private ensureAuthData() {
    if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
      this.saveItems(STORAGE_KEYS.GROUPS, SEED_GROUPS)
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.saveItems(STORAGE_KEYS.USERS, SEED_USERS)
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveItems(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    }
  }

  private ensureSeedData() {
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS)
    let projectsUpdated = false
    const projectMap = new Map<string, string>()

    SEED_PROJECTS.forEach((seedP) => {
      const existing = projects.find((p) => p.local_id === seedP.local_id)
      if (!existing) {
        projects.push(seedP)
        projectsUpdated = true
        projectMap.set(seedP.local_id, seedP.field_348)
      } else {
        projectMap.set(existing.local_id, existing.field_348)
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

    // Ensure coords
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

  // Auth Methods
  authenticate(username: string, pass: string): User | null {
    // In a real app, verify hash. Here we check the hardcoded specific user or generic for others if we had them.
    // Spec: carlos.botelho / @#Cvb75195364#@
    if (username === 'carlos.botelho' && pass === '@#Cvb75195364#@') {
      const users = this.getItems<User>(STORAGE_KEYS.USERS)
      return users.find((u) => u.username === username) || null
    }
    // Allow demo login for other seeded users if we add them later, simplified
    return null
  }

  getUserGroup(groupId: string): UserGroup | undefined {
    return this.getItems<UserGroup>(STORAGE_KEYS.GROUPS).find(
      (g) => g.id === groupId,
    )
  }

  // Settings
  getSettings(): AppSettings {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return settings ? JSON.parse(settings) : DEFAULT_SETTINGS
  }

  saveSettings(settings: AppSettings) {
    this.saveItems(STORAGE_KEYS.SETTINGS, settings)
  }

  clearCache() {
    // Keeps Auth and Settings, clears data
    const settings = this.getSettings()
    const users = this.getItems(STORAGE_KEYS.USERS)
    const groups = this.getItems(STORAGE_KEYS.GROUPS)
    localStorage.clear()
    this.saveItems(STORAGE_KEYS.SETTINGS, settings)
    this.saveItems(STORAGE_KEYS.USERS, users)
    this.saveItems(STORAGE_KEYS.GROUPS, groups)
    this.seedAll() // Reseed initial data
  }

  // Projects
  getProjects(): Project[] {
    return this.getItems<Project>(STORAGE_KEYS.PROJECTS)
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.local_id === id)
  }

  // Quadras
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

  // Lotes
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

  // Stats
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

  // Sync Logic
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

  // Logs
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
}

export const db = new DBService()
