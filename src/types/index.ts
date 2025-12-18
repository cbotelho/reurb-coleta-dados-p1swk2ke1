export type SyncStatus = 'pending' | 'synchronized' | 'failed'

export interface BaseEntity {
  id: number
  local_id: string
  sync_status: SyncStatus
  date_added: number
  date_updated: number
}

export interface SavedCoordinate {
  id: string
  name: string
  latitude: string
  longitude: string
}

export interface MapKey {
  id: string
  name: string
  key: string
  isActive: boolean
  createdAt: number
}

export interface MarkerConfig {
  id: string // e.g., 'synchronized', 'pending', 'failed', 'default'
  label: string
  color: string
  icon: 'circle' | 'square' | 'triangle'
}

export interface CustomLayer {
  id: string
  name: string
  data: any // GeoJSON
  visible: boolean
  zIndex: number
  opacity?: number
}

export type DrawingType = 'marker' | 'polyline' | 'polygon'

export type MarkerIconType =
  | 'circle'
  | 'pin'
  | 'home'
  | 'star'
  | 'alert'
  | 'flag'

export interface DrawingStyle {
  strokeColor: string
  strokeWeight: number
  fillColor: string
  fillOpacity: number
  markerIcon?: MarkerIconType
  markerSize?: number
}

export interface DrawingLayer {
  id: string
  name: string
  visible: boolean
}

export interface MapDrawing {
  id: string
  type: DrawingType
  coordinates: any // lat/lng object or array of them
  style: DrawingStyle
  createdAt: number
  notes?: string
  layerId?: string
}

export interface GeoAlert {
  id: string
  name: string
  enabled: boolean
  condition: 'enter' | 'exit'
  geometryId: string // ID of a MapDrawing (Polygon)
  targetProjectId?: string
  lastTriggered?: number
}

export interface Project extends BaseEntity {
  field_348: string // Loteamento
  field_350: string // Levantamento
  field_351?: string // Nome da Imagem (URL)
  latitude?: string
  longitude?: string
  auto_update_map?: boolean
  last_map_update?: number
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
  field_331?: string // Document
  field_332?: string // Image
}

export interface Lote extends BaseEntity {
  field_338: string // Lote Name/Number
  field_339: string // Area Lote
  field_340: string // Memorial Descritivo
  field_352: string[] // Array of image paths/data
  latitude?: string
  longitude?: string
  parent_item_id: string // Local ID of Quadra
  created_by?: number
  deleted?: number
  status?: string
  coordinates?: { x: number; y: number } // Percentage 0-100 for map placement
}

export interface SyncLogEntry {
  id: string
  timestamp: number
  type: 'Lote' | 'Imagem' | 'Quadra' | 'Projeto' | 'Sistema' | 'Usuario'
  status: 'Sucesso' | 'Falha' | 'Pendente' | 'Iniciado' | 'Alerta'
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

export interface UserGroup {
  id: string
  name: string
  role: 'admin' | 'manager' | 'viewer'
  permissions: string[]
}

export interface User {
  id: string
  username: string
  name: string
  groupIds: string[]
  active: boolean
}

export interface AppSettings {
  apiEndpoint: string
  cacheEnabled: boolean
  syncFrequency: 'manual' | 'auto-5m' | 'auto-15m' | 'auto-1h'
  pushNotifications: boolean
  googleMapsApiKey?: string // Deprecated, kept for backward compatibility logic
}
