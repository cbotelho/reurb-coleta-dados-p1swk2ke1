export interface Project {
  id: number
  local_id: string
  sync_status: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  description: string
  image_url: string
  latitude: string | null
  longitude: string | null
  auto_update_map: boolean
  last_map_update: number
  created_by?: string
  parent_id?: number
  parent_item_id?: number
  linked_id?: number
  sort_order?: number
  // New fields for dashboard
  tags?: string[]
  city?: string
  state?: string
  status?: string
}

export interface Quadra {
  id: number
  local_id: string
  sync_status: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  area: string
  parent_item_id: string // UUID of Project
  document_url?: string
  image_url?: string
}

export interface Lote {
  id: number
  local_id: string
  sync_status: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  address?: string
  area: string
  description: string
  images: string[]
  latitude: string | null
  longitude: string | null
  parent_item_id: string // UUID of Quadra
  coordinates?: { x: number; y: number }
  created_by?: number
  deleted?: number
  status?: string // 'not_surveyed' | 'surveyed' | 'in_analysis' | 'regularized'
}

export interface Survey {
  id: string
  local_id?: string
  sync_status?: 'pending' | 'synchronized' | 'failed'
  property_id: string
  form_number?: string
  survey_date?: string
  city: string
  state: string

  // Applicant
  applicant_name: string
  applicant_cpf?: string
  applicant_rg?: string
  applicant_civil_status?: string
  applicant_profession?: string
  applicant_income?: string
  applicant_nis?: string
  spouse_name?: string
  spouse_cpf?: string

  // Household
  residents_count: number
  has_children: boolean

  // Occupation
  occupation_time?: string
  acquisition_mode?: string
  property_use?: string

  // Characteristics
  construction_type?: string
  roof_type?: string
  floor_type?: string
  rooms_count: number
  conservation_state?: string
  fencing?: string

  // Infrastructure
  water_supply?: string
  energy_supply?: string
  sanitation?: string
  street_paving?: string

  // Meta
  observations?: string
  surveyor_name?: string

  created_at?: string
  updated_at?: string
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
  role: 'admin' | 'manager' | 'viewer'
  permissions: string[]
}

export interface AppSettings {
  apiEndpoint: string
  cacheEnabled: boolean
  syncFrequency: 'manual' | 'auto-5m' | 'auto-15m' | 'auto-1h'
  pushNotifications: boolean
  googleMapsApiKey: string
}

export interface DashboardStats {
  collected: number
  synced: number
  pending: number
  pendingImages: number
  totalProjects: number
  lastSync?: number
  pendingSurveys?: number
  totalSurveyed?: number
}

export interface SyncLogEntry {
  id: string
  timestamp: number
  type: 'Lote' | 'Quadra' | 'Projeto' | 'Vistoria'
  status: 'Pendente' | 'Sincronizando' | 'Sucesso' | 'Erro'
  message: string
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
  icon: 'circle' | 'pin' | 'home' | 'star' | 'alert' | 'flag'
}

export type MarkerIconType = MarkerConfig['icon']

export interface CustomLayer {
  id: string
  name: string
  data: any // GeoJSON
  visible: boolean
  zIndex: number
}

export interface DrawingStyle {
  strokeColor: string
  strokeWeight: number
  fillColor: string
  fillOpacity: number
  markerIcon?: MarkerIconType
  markerSize?: number
}

export interface MapDrawing {
  id: string
  type: 'marker' | 'polygon' | 'polyline' | 'rectangle'
  coordinates: any
  style?: DrawingStyle
  createdAt: number
  updatedAt?: number
  notes?: string
  layerId?: string
}

export interface DrawingLayer {
  id: string
  name: string
  visible: boolean
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

export interface ActiveSession {
  id: string
  userId: string
  userName: string
  lastActive: number
  color: string
}

export interface GeoAlert {
  id: string
  name: string
  enabled: boolean
  condition: 'enter' | 'exit'
  geometryId: string
  lastTriggered?: number
}
