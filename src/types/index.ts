export type SyncStatus = 'pending' | 'synchronized' | 'failed'

export interface BaseEntity {
  id: number // Deprecated in favor of UUIDs for remote, but kept for compatibility
  local_id: string // UUID
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
  mapId?: string
  isActive: boolean
  createdAt: number
}

export interface MarkerConfig {
  id: string
  label: string
  color: string
  icon: 'circle' | 'square' | 'triangle'
}

export interface CustomLayer {
  id: string
  name: string
  data: any
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
  coordinates: any
  style: DrawingStyle
  createdAt: number
  notes?: string
  layerId?: string
  updatedAt?: number
}

export interface DrawingHistory {
  id: string
  drawingId: string
  timestamp: number
  action: 'create' | 'update' | 'delete' | 'style_change'
  details: string
  userId: string
  userName: string
}

export interface GeoAlert {
  id: string
  name: string
  enabled: boolean
  condition: 'enter' | 'exit'
  geometryId: string
  targetProjectId?: string
  lastTriggered?: number
}

export interface Project extends BaseEntity {
  name: string
  description: string
  image_url?: string
  latitude?: string
  longitude?: string
  auto_update_map?: boolean
  last_map_update?: number
  parent_id?: number
  parent_item_id?: number
  linked_id?: number
  created_by?: string // UUID from Supabase
  sort_order?: number
}

export interface Quadra extends BaseEntity {
  name: string
  area: string
  parent_item_id: string // Project UUID
  project_name?: string
  document_url?: string
  image_url?: string
}

export interface Lote extends BaseEntity {
  name: string
  area: string
  description: string
  images: string[]
  latitude?: string
  longitude?: string
  parent_item_id: string // Quadra UUID
  created_by?: string
  deleted?: number
  status?: string
  coordinates?: { x: number; y: number }
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
  googleMapsApiKey?: string
}

export interface ActiveSession {
  id: string
  userId: string
  userName: string
  lastActive: number
  color: string
}
