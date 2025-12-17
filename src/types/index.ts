export type SyncStatus = 'pending' | 'synchronized' | 'failed'

export interface BaseEntity {
  id: number // Remote ID (can be null if not synced, but using number for simplicity in types, 0 if null)
  local_id: string // UUID for local management
  sync_status: SyncStatus
  date_added: number
  date_updated: number
}

export interface Project extends BaseEntity {
  field_348: string // Loteamento
  field_350: string // Levantamento
  field_351?: string // Nome da Imagem (URL)
  parent_id?: number
  parent_item_id?: number
  linked_id?: number
  created_by?: number
  sort_order?: number
}

export interface Quadra extends BaseEntity {
  field_329: string // Quadra Name
  field_330: string // Area
  parent_item_id: string // Local ID of Project
  field_349?: string // Project Name (denormalized for display)
}

export interface Lote extends BaseEntity {
  field_338: string // Lote Name/Number
  field_339: string // Area Lote
  field_340: string // Memorial Descritivo
  field_352: string[] // Array of image paths/data (simplified from comma-separated string)
  parent_item_id: string // Local ID of Quadra
}

export interface SyncLogEntry {
  id: string
  timestamp: number
  type: 'Lote' | 'Imagem' | 'Quadra' | 'Projeto'
  status: 'Sucesso' | 'Falha' | 'Pendente' | 'Iniciado'
  message: string
}

export interface DashboardStats {
  collected: number
  synced: number
  pending: number
  pendingImages: number
  totalProjects: number
  lastSync?: number
}
