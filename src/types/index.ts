export interface Project {
  id: number
  local_id: string
  sync_status: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  description: string
  image_url: string
  latitude?: string
  longitude?: string
  auto_update_map?: boolean
  last_map_update?: number
  created_by?: number
  tags?: string[]
  city?: string
  state?: string
  status?: string
  // Legacy fields kept for compatibility with seed data
  field_348?: string
  field_350?: string
  field_351?: string
  parent_id?: number
  parent_item_id?: number
  linked_id?: number
  sort_order?: number
}

export interface Quadra {
  id: number
  local_id: string
  sync_status: 'pending' | 'synchronized' | 'failed'
  date_added: number
  date_updated: number
  name: string
  area: string
  description?: string
  parent_item_id: string
  document_url?: string
  image_url?: string
  // Legacy fields
  field_329?: string
  field_330?: string
  field_349?: string
  field_331?: string
  field_332?: string
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
  latitude?: string
  longitude?: string
  parent_item_id: string
  status:
    | 'not_surveyed'
    | 'surveyed'
    | 'regularized'
    | 'pending'
    | 'failed'
    | 'synchronized'
  // Legacy fields
  field_338?: string
  field_339?: string
  field_340?: string
  field_352?: string[]
  created_by?: number
  deleted?: number
}

export interface Survey {
  id: string
  local_id?: string
  property_id: string
  sync_status: 'pending' | 'synchronized' | 'failed'
  created_at?: string
  updated_at?: string

  // Applicant
  applicant_name?: string
  applicant_cpf?: string
  applicant_rg?: string
  applicant_civil_status?: string
  applicant_profession?: string
  applicant_income?: string
  applicant_nis?: string
  spouse_name?: string
  spouse_cpf?: string

  // Address
  city?: string
  state?: string

  // Household
  residents_count: number
  has_children: boolean

  // Property Info
  form_number?: string
  survey_date?: string
  occupation_time?: string
  acquisition_mode?: string
  property_use?: string
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

  observations?: string
  surveyor_name?: string
  surveyor_signature?: string
  assinatura_requerente?: string
  
  // AI Analysis (SisReub Insight - Lei 13.465/2017)
  analise_ia_classificacao?: string // 'REURB-S' | 'REURB-E'
  analise_ia_parecer?: string
  analise_ia_proximo_passo?: string
  analise_ia_gerada_em?: string
  
  // Documents
  documents?: Array<{
    id: string
    name: string
    size: number
    type: string
    data?: string
    url?: string
    uploadedAt?: Date
  }>
}

export interface User {
  id: string
  username: string
  firstName?: string
  lastName?: string
  name: string // Full Name
  email?: string
  photoUrl?: string
  status?: 'active' | 'inactive' | 'suspended'
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string // Name of creator
  createdById?: string // ID of creator
  groupIds: string[]
  groupNames?: string[]
  active: boolean // Legacy boolean, mapped from status
  role?: string // Adicionado para compatibilidade
  grupo_acesso?: string // Grupo de acesso do REURB
}

export interface UserGroup {
  id: string
  name: string
  description?: string
  role?: 'admin' | 'manager' | 'viewer' | 'Administrador' | 'Administradores' | 'tecnico' | 'gestor' | 'SEHAB' | 'Técnicos Amapá Terra' | 'Next Ambiente' | 'Externo' | 'Externo Editar' // kept for compatibility
  permissions: string[]
  created_at?: string
}

export interface SyncLogEntry {
  id: string
  timestamp: number
  type: 'upload' | 'download' | 'error'
  status: 'success' | 'failed'
  message: string
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
  totalFamilies: number
  totalContracts: number
  totalQuadras: number
    totalProperties: number
    totalSurveysCompleted: number
    totalSurveysNotCompleted: number
    totalAnalyzedByAI: number
    totalPropertiesWithProcess: number
  }

// Analytics Types
export interface ProductivityData {
  month: string
  cadastros: number
  titulos: number
  fullDate?: string
}

export interface ModalityData {
  name: string // REURB-S or REURB-E
  value: number
  fill: string
}

export interface RecentActivityItem {
  id: string
  action: string
  details: string
  user_name: string
  user_avatar?: string
  timestamp: string // ISO string
  type: 'registration' | 'approval' | 'document' | 'system' | 'other'
}

export interface TitlingGoalData {
  current: number
  goal: number
  monthly_rhythm: number
}

// Map Types
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
  icon: string // 'circle' | 'square' | 'triangle' | 'star' | 'pin'
}

export interface CustomLayer {
  id: string
  name: string
  url?: string // For WMS/XYZ/GeoJSON url
  data?: any // For direct GeoJSON
  type: 'wms' | 'xyz' | 'geojson'
  visible: boolean
  opacity?: number
  zIndex: number
}

export interface DrawingLayer {
  id: string
  name: string
  visible: boolean
}

export interface DrawingStyle {
  strokeColor?: string
  strokeWeight?: number
  fillColor?: string
  fillOpacity?: number
  markerIcon?: 'circle' | 'pin' | 'home' | 'star' | 'alert' | 'flag'
  markerSize?: number
}

export type MarkerIconType = NonNullable<DrawingStyle['markerIcon']>

export interface MapDrawing {
  id: string
  type: 'point' | 'line' | 'polyline' | 'polygon' | 'circle' | 'rectangle' | 'marker'
  coordinates: any // GeoJSON coordinates or specific format
  style?: DrawingStyle
  properties?: {
    color: string
    width: number
    fillColor?: string
    fillOpacity?: number
    radius?: number // for circles
    text?: string // for markers/labels
    layerId: string // Link to DrawingLayer
  }
  notes?: string
  layerId?: string
  createdAt: number
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
  type?: 'overlap' | 'proximity' | 'zone'
  condition: 'enter' | 'exit'
  geometryId: string // The shape to check against
  message?: string
  enabled: boolean
  isActive?: boolean
  createdAt?: number
}

export interface AppSettings {
  apiEndpoint: string
  cacheEnabled: boolean
  syncFrequency: string
  pushNotifications: boolean
  googleMapsApiKey: string
}

// Social Report (Parecer Conclusivo do Assistente Social)
export interface SocialReport {
  id: string
  
  // Referências (cascata obrigatória)
  project_id: string
  quadra_id: string
  property_id: string
  
  // Conteúdo do parecer (HTML do editor WYSIWYG)
  parecer: string
  
  // Identificação e registro
  numero_registro?: string // Ex: "2026/001-REURB-AP"
  
  // Assinatura eletrônica
  assinatura_eletronica?: string
  
  // Informações do assistente social
  nome_assistente_social: string
  cress_assistente_social?: string // Registro CRESS
  email_assistente_social?: string
  
  // Metadados
  created_by?: string
  created_at?: string
  updated_at?: string
  
  // Status
  status: 'rascunho' | 'finalizado' | 'revisado' | 'aprovado'
  
  // Versionamento
  versao: number
  parecer_anterior_id?: string
  
  // Relacionamentos (populados via JOIN)
  project_name?: string
  quadra_name?: string
  property_name?: string
}
