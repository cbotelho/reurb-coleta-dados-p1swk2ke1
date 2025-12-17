import { Project, Quadra, Lote, SyncLogEntry, DashboardStats } from '@/types'
import { SEED_PROJECTS, SEED_QUADRAS, SEED_LOTES } from './seedData'

// UUID Generator since 'uuid' package is not available
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
}

class DBService {
  constructor() {
    this.init()
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS))
      localStorage.setItem(STORAGE_KEYS.QUADRAS, JSON.stringify(SEED_QUADRAS))
      localStorage.setItem(STORAGE_KEYS.LOTES, JSON.stringify(SEED_LOTES))
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]))
    } else {
      this.ensureSeedData()
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
        if (existing.field_348 !== seedP.field_348) {
          existing.field_348 = seedP.field_348
          projectsUpdated = true
        }
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
      } else if (existing.id !== seedQ.id) {
        // Ensure ID is updated if seed changed (e.g. from 101 to 1)
        existing.id = seedQ.id
        quadrasUpdated = true
      }
    })

    quadras.forEach((q) => {
      if (projectMap.has(q.parent_item_id)) {
        const correctName = projectMap.get(q.parent_item_id)
        if (correctName && q.field_349 !== correctName) {
          q.field_349 = correctName
          quadrasUpdated = true
        }
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
      } else if (existing.parent_item_id !== seedL.parent_item_id) {
        existing.parent_item_id = seedL.parent_item_id
        lotesUpdated = true
      }
    })

    if (lotesUpdated) this.saveItems(STORAGE_KEYS.LOTES, lotes)
  }

  // Generic Getters
  private getItems<T>(key: string): T[] {
    const items = localStorage.getItem(key)
    return items ? JSON.parse(items) : []
  }

  private saveItems<T>(key: string, items: T[]) {
    localStorage.setItem(key, JSON.stringify(items))
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
      } as Lote
      lotes.push(savedLote)
    }

    this.saveItems(STORAGE_KEYS.LOTES, lotes)
    this.logActivity(
      'Lote',
      loteData.local_id ? 'Atualizado' : 'Criado',
      `Lote ${savedLote.field_338} salvo localmente.`,
    )
    return savedLote
  }

  deleteLote(localId: string) {
    const lotes = this.getItems<Lote>(STORAGE_KEYS.LOTES)
    const filtered = lotes.filter((l) => l.local_id !== localId)
    this.saveItems(STORAGE_KEYS.LOTES, filtered)
    this.logActivity('Lote', 'Removido', `Lote removido localmente.`)
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

  clearLogs() {
    this.saveItems(STORAGE_KEYS.LOGS, [])
  }
}

export const db = new DBService()
