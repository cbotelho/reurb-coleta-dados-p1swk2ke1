export interface Project {
  id: number
  local_id: string
  sync_status?: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  description: string
  image_url: string
  latitude?: string
  longitude?: string
  auto_update_map?: boolean | null
  last_map_update?: number
  created_by?: number | null
  tags?: string[]
  city?: string | null
  state?: string | null
  status?: string | null
  [key: string]: any
}

export interface Quadra {
  id: number
  local_id: string
  sync_status?: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  area: string
  parent_item_id?: string | null
  document_url?: string | null
  image_url?: string | null
  status?: string | null
  [key: string]: any
}

export interface Lote {
  id: number
  local_id: string
  sync_status?: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  address: string
  area: string
  description: string
  images: string[]
  latitude?: string
  longitude?: string
  parent_item_id?: string | null
  status: string
  quadra_id?: string
  [key: string]: any
}

export interface Survey {
  id: string
  property_id: string
  residents_count: number
  rooms_count: number
  has_children: boolean
  survey_date?: string
  sync_status?: 'pending' | 'synchronized' | 'failed'
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface User {
  id: string
  username: string
  name: string
  groupIds: string[]
  active: boolean
}

export interface UserGroup {
  id: string
  name: string
  role: string
  permissions: string[]
}

export interface DashboardStats {
  collected: number
  synced: number
  pending: number
  pendingImages: number
  totalProjects: number
  lastSync: number
  pendingSurveys: number
  totalSurveyed: number
  totalFamilies?: number
  totalContracts?: number
  totalQuadras?: number
}

export interface SyncLogEntry {
  id: string
  timestamp: number
  type: 'upload' | 'download' | 'error' | 'info'
  status: 'success' | 'error' | 'warning'
  message: string
}

export interface AppSettings {
  apiEndpoint: string
  cacheEnabled: boolean
  syncFrequency: string
  pushNotifications: boolean
  googleMapsApiKey: string
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
  id: string
  label: string
  color: string
  icon: string
}

export interface CustomLayer {
  id: string
  name: string
  visible: boolean
  [key: string]: any
}

export interface MapDrawing {
  id: string
  createdAt: number
  updatedAt: number
  [key: string]: any
}

export interface DrawingHistory {
  id: string
  drawingId: string
  timestamp: number
  action: 'create' | 'update' | 'delete'
  details: string
  userId: string
  userName: string
}

export interface DrawingLayer {
  id: string
  name: string
  visible: boolean
}

export interface GeoAlert {
  id: string
  [key: string]: any
}

export interface ActiveSession {
  id: string
  userId: string
  userName: string
  lastActive: number
  color: string
}
