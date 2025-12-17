import { Project, Quadra, Lote, SyncLogEntry, DashboardStats } from '@/types'

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

// Initial Seed Data
const SEED_PROJECTS: Project[] = [
  {
    id: 1,
    local_id: 'proj-1',
    sync_status: 'synchronized',
    date_added: 1762453923000,
    date_updated: 1762455377000,
    field_348: 'Marabaixo 1',
    field_350: '1762455359_PLANTA_GERAL_REUB_MARABAIXO_I-modelo2.pdf',
    field_351: '1762455374_Marabaixo_1.jpg',
    parent_id: 0,
    parent_item_id: 1, // Matches Acceptance Criteria
    linked_id: 0,
    created_by: 1,
    sort_order: 0,
  },
  {
    id: 2,
    local_id: 'proj-2',
    sync_status: 'synchronized',
    date_added: 1762692888000,
    date_updated: 0,
    field_348: 'Oiapoque',
    field_350: '',
    field_351: '',
    parent_id: 0,
    parent_item_id: 2, // Matches Acceptance Criteria
    linked_id: 0,
    created_by: 1,
    sort_order: 0,
  },
]

// Generate 40 Quadras
const SEED_QUADRAS: Quadra[] = Array.from({ length: 40 }, (_, i) => {
  const index = i + 1
  const isMarabaixo = index <= 20
  const projectId = isMarabaixo ? 'proj-1' : 'proj-2'
  const projectName = isMarabaixo ? 'Marabaixo 1' : 'Oiapoque'
  const quadraNum = isMarabaixo ? index : index - 20

  return {
    id: 100 + index,
    local_id: `quad-${index}`,
    sync_status: 'synchronized',
    date_added: Date.now(),
    date_updated: Date.now(),
    field_329: `Quadra ${quadraNum}`,
    field_330: `${Math.floor(Math.random() * 2000) + 3000}m²`,
    parent_item_id: projectId,
    field_349: projectName,
    field_331: `planta_quadra_${quadraNum}_${isMarabaixo ? 'marabaixo' : 'oiapoque'}.pdf`,
    field_332: `vista_aerea_${quadraNum}_${isMarabaixo ? 'marabaixo' : 'oiapoque'}.jpg`,
  }
})

const SEED_LOTES: Lote[] = [
  {
    id: 1001,
    local_id: 'lote-1',
    sync_status: 'synchronized',
    date_added: Date.now(),
    date_updated: Date.now(),
    field_338: 'Lote 01',
    field_339: '250m²',
    field_340: 'Terreno plano, sem benfeitorias.',
    field_352: [],
    parent_item_id: 'quad-1',
  },
  {
    id: 0,
    local_id: 'lote-2',
    sync_status: 'pending',
    date_added: Date.now(),
    date_updated: Date.now(),
    field_338: 'Lote 02',
    field_339: '255m²',
    field_340: 'Contém pequena construção.',
    field_352: [],
    parent_item_id: 'quad-1',
  },
]

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

    // Ensure specific seed projects exist and have correct names
    const requiredProjects = SEED_PROJECTS.filter(
      (p) => p.id === 1 || p.id === 2,
    ) // Marabaixo 1 and Oiapoque

    requiredProjects.forEach((seedP) => {
      const existingIndex = projects.findIndex((p) => p.id === seedP.id)
      if (existingIndex === -1) {
        // Missing, add it
        projects.push(seedP)
        projectsUpdated = true
        projectMap.set(seedP.local_id, seedP.field_348)
      } else {
        // Exists, check name
        const p = projects[existingIndex]
        if (p.field_348 !== seedP.field_348) {
          p.field_348 = seedP.field_348
          projectsUpdated = true
        }
        projectMap.set(p.local_id, p.field_348)
      }
    })

    if (projectsUpdated) {
      this.saveItems(STORAGE_KEYS.PROJECTS, projects)
    }

    // Update Quadras
    const quadras = this.getItems<Quadra>(STORAGE_KEYS.QUADRAS)
    let quadrasUpdated = false

    // Check if we need to seed the 40 quadras (if they don't exist by ID)
    SEED_QUADRAS.forEach((seedQ) => {
      const existing = quadras.find((q) => q.id === seedQ.id)
      if (!existing) {
        quadras.push(seedQ)
        quadrasUpdated = true
      } else {
        // Update fields if missing
        if (seedQ.field_331 && !existing.field_331) {
          existing.field_331 = seedQ.field_331
          quadrasUpdated = true
        }
        if (seedQ.field_332 && !existing.field_332) {
          existing.field_332 = seedQ.field_332
          quadrasUpdated = true
        }
      }
    })

    // Also update project names in Quadras
    quadras.forEach((q) => {
      if (projectMap.has(q.parent_item_id)) {
        const correctName = projectMap.get(q.parent_item_id)
        if (correctName && q.field_349 !== correctName) {
          q.field_349 = correctName
          quadrasUpdated = true
        }
      }
    })

    if (quadrasUpdated) {
      this.saveItems(STORAGE_KEYS.QUADRAS, quadras)
    }
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
      // Update
      const index = lotes.findIndex((l) => l.local_id === loteData.local_id)
      if (index !== -1) {
        savedLote = {
          ...lotes[index],
          ...loteData,
          sync_status: 'pending', // Mark as pending on update
          date_updated: now,
          parent_item_id: quadraId,
        } as Lote
        lotes[index] = savedLote
      } else {
        throw new Error('Lote not found')
      }
    } else {
      // Create
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

    const collected = lotes.length
    const synced = lotes.filter((l) => l.sync_status === 'synchronized').length
    const pending = lotes.filter(
      (l) => l.sync_status === 'pending' || l.sync_status === 'failed',
    ).length
    const pendingImages = lotes
      .filter((l) => l.sync_status !== 'synchronized')
      .reduce((acc, l) => acc + (l.field_352?.length || 0), 0)

    const lastSyncLog = logs.find((l) => l.status === 'Sucesso')

    return {
      collected,
      synced,
      pending,
      pendingImages,
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
    // Keep only last 100 logs
    if (logs.length > 100) logs.pop()
    this.saveItems(STORAGE_KEYS.LOGS, logs)
  }

  clearLogs() {
    this.saveItems(STORAGE_KEYS.LOGS, [])
  }
}

export const db = new DBService()
