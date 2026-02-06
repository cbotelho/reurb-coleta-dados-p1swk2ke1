import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '@/services/db'
import { api } from '@/services/api'
import {
  Project,
  Lote,
  MapKey,
  MarkerConfig,
  CustomLayer,
  MapDrawing,
  DrawingStyle,
  DrawingLayer,
  MarkerIconType,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Navigation,
  Layers,
  Search,
  Eye,
  EyeOff,
  MapPin,
  PenTool,
  MousePointer2,
  Trash,
  Undo,
  Redo,
  Download,
  Palette,
  MousePointerClick,
  MonitorPlay,
  X as XIcon,
  Plus,
  BoxSelect,
  Crosshair,
  FileJson,
  Globe,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GoogleMap, GoogleMapHandle } from '@/components/GoogleMap'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  calculateArea,
  calculateLength,
  exportToGeoJSON,
  exportToKML,
  getBoundsCoordinates,
} from '@/utils/geoUtils'
import { LayerManager } from '@/components/LayerManager'
import { ExternalDataDialog } from '@/components/ExternalDataDialog'
import { MarkerCustomizer } from '@/components/MarkerCustomizer'
import { HistoryPanel } from '@/components/Map/HistoryPanel'
import { AnalysisTools } from '@/components/Map/AnalysisTools'
import { AccessibilityControls } from '@/components/Map/AccessibilityControls'
import { CollaborationBadge } from '@/components/Map/CollaborationBadge'
import { geocodingService } from '@/services/geocoding'
import { useAuth } from '@/contexts/AuthContext'
import { useSync } from '@/contexts/SyncContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RoutingControl } from '@/components/Map/RoutingControl'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
]

const MARABAIXO_COORDS = { lat: 0.036161, lng: -51.130895 }

const DEFAULT_STYLE: DrawingStyle = {
  strokeColor: '#22c55e',
  strokeWeight: 2,
  fillColor: '#2563eb',
  fillOpacity: 0.3,
  markerIcon: 'circle',
  markerSize: 1,
}

export default function MapPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isOnline, isSyncing } = useSync()
  const mapRef = useRef<GoogleMapHandle>(null)
  const [mapReady, setMapReady] = useState(false)
  const initialFocusRef = useRef(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [activeKey, setActiveKey] = useState<MapKey | undefined>(() =>
    db.getEffectiveMapKey(),
  )
  const [markerConfigs, setMarkerConfigs] = useState<MarkerConfig[]>([])

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')

  // Map Controls
  const [mapLayer, setMapLayer] = useState<
    'street' | 'satellite' | 'terrain' | 'hybrid' | 'dark'
  >((sessionStorage.getItem('map_layer') as any) || 'street')
  const [markerMode, setMarkerMode] = useState<'status' | 'default'>('status')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    MARABAIXO_COORDS // Coordenadas padrão iniciais
  )
  const [mapZoom, setMapZoom] = useState(15)

  // Layers & Drawing
  const [customLayers, setCustomLayers] = useState<CustomLayer[]>([])
  const [drawingLayers, setDrawingLayers] = useState<DrawingLayer[]>([])
  const [activeLayerId, setActiveLayerId] = useState('default_layer')
  const [drawings, setDrawings] = useState<MapDrawing[]>([])

  // Tools
  const [drawingMode, setDrawingMode] = useState<
    'marker' | 'polygon' | 'polyline' | null
  >(null)
  const [selectionMode, setSelectionMode] = useState<'box' | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([])

  // Styling & Notes
  const [currentStyle, setCurrentStyle] = useState<DrawingStyle>(DEFAULT_STYLE)
  const [currentNote, setCurrentNote] = useState('')

  // Presentation Mode
  const [presentationMode, setPresentationMode] = useState(false)

  // Dialogs
  const [isExternalDataOpen, setIsExternalDataOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Advanced Features
  const [highContrast, setHighContrast] = useState(false)
  const [showLegend, setShowLegend] = useState(true)

  // Undo/Redo Stacks
  const [historyPast, setHistoryPast] = useState<MapDrawing[][]>([])
  const [historyFuture, setHistoryFuture] = useState<MapDrawing[][]>([])

  // Full Screen
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Routing
  const [routePointMode, setRoutePointMode] = useState<'start' | 'end' | null>(
    null,
  )
  const [directionsResult, setDirectionsResult] = useState<any>(null)

  const refreshData = useCallback(async () => {
    try {
      const [projs, allLotes] = await Promise.all([
        api.getProjects(),
        api.getAllLotes(),
      ])
      setProjects(projs)
      setLotes(allLotes)
    } catch (e) {
      console.error('Failed to fetch map data', e)
    }

    // Try to get effective key again (might have been updated by SyncContext)
    const key = db.getEffectiveMapKey()
    setActiveKey((prev) => (prev?.key === key?.key ? prev : key))

    setMarkerConfigs(db.getMarkerConfigs())
    setCustomLayers(db.getCustomLayers().sort((a, b) => a.zIndex - b.zIndex))
    setDrawingLayers(db.getDrawingLayers())

    const savedDrawings = db.getMapDrawings()
    setDrawings(savedDrawings)
  }, [])

  useEffect(() => {
    refreshData()
    // Poll for key update if missing
    const interval = setInterval(() => {
      if (!activeKey) refreshData()
    }, 2000)

    // Regular data refresh
    const dataInterval = setInterval(refreshData, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(dataInterval)
    }
  }, [refreshData, activeKey])

  useEffect(() => {
    if (selectedDrawingIds.length === 1) {
      const selected = drawings.find((d) => d.id === selectedDrawingIds[0])
      if (selected) {
        const safeStyle = {
          ...DEFAULT_STYLE,
          ...(selected.style || {}),
        }
        setCurrentStyle(safeStyle)
        setCurrentNote(selected.notes || '')
      }
    } else if (selectedDrawingIds.length === 0) {
      setCurrentStyle(DEFAULT_STYLE)
      setCurrentNote('')
    }
  }, [selectedDrawingIds, drawings])

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
    }
  }, [])

  const handleSearch = () => {
    if (!searchTerm.trim()) return

    const coordMatch = searchTerm.match(
      /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/,
    )
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1])
      const lng = parseFloat(coordMatch[3])
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter({ lat, lng })
        setMapZoom(18)
        if (mapRef.current) {
          mapRef.current.panTo(lat, lng)
        }
        toast.success(`Localizado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        return
      }
    }

    const project = projects.find((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (project && project.latitude && project.longitude) {
      const lat = parseFloat(String(project.latitude).replace(',', '.'))
      const lng = parseFloat(String(project.longitude).replace(',', '.'))
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter({ lat, lng })
        setMapZoom(16)
        if (mapRef.current) {
          mapRef.current.panTo(lat, lng)
        }
        toast.success(`Projeto localizado: ${project.name}`)
        return
      }
    }

    const lote = lotes.find((l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    if (lote && lote.latitude && lote.longitude) {
      const lat = parseFloat(String(lote.latitude).replace(',', '.'))
      const lng = parseFloat(String(lote.longitude).replace(',', '.'))
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter({ lat, lng })
        setMapZoom(19)
        if (mapRef.current) {
          mapRef.current.panTo(lat, lng)
        }
        toast.success(`Lote localizado: ${lote.name}`)
        return
      }
    }

    toast.warning('Nenhum resultado encontrado.')
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    if (projectId === 'all') {
      const points = getBoundsCoordinates(lotes, drawings, projects)
      if (points.length > 0) {
        if (mapRef.current) mapRef.current.fitBounds(points)
        toast.info('Visualizando extensão total')
      }
      return
    }

    const project = projects.find((p) => p.local_id === projectId)
    if (project) {
      // Sempre centralizar no projeto selecionado, mesmo sem lotes
      const lat = parseFloat(String(project.latitude).replace(',', '.'))
      const lng = parseFloat(String(project.longitude).replace(',', '.'))
      
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setMapCenter({ lat, lng })
        setMapZoom(17)
        if (mapRef.current) {
          mapRef.current.panTo(lat, lng)
        }
        toast.success(`Visualizando: ${project.name}`)
      } else {
        toast.warning('Projeto sem coordenadas válidas. Usando coordenadas padrão.')
        // Fallback para coordenadas padrão se o projeto não tiver coordenadas
        setMapCenter(MARABAIXO_COORDS)
        setMapZoom(15)
        if (mapRef.current) {
          mapRef.current.panTo(MARABAIXO_COORDS.lat, MARABAIXO_COORDS.lng)
        }
      }
    }
  }

  const handleLocateProject = useCallback(() => {
    if (!mapRef.current) return

    if (selectedProjectId !== 'all') {
      const project = projects.find((p) => p.local_id === selectedProjectId)
      if (
        project &&
        project.latitude &&
        project.longitude &&
        project.latitude !== '0' &&
        project.longitude !== '0'
      ) {
        const lat = parseFloat(String(project.latitude).replace(',', '.'))
        const lng = parseFloat(String(project.longitude).replace(',', '.'))
        if (!isNaN(lat) && !isNaN(lng)) {
          mapRef.current.panTo(lat, lng)
          return
        }
      }
    }

    const validProj = projects.find((p) => p.latitude && p.longitude)
    if (validProj) {
      const lat = parseFloat(String(validProj.latitude).replace(',', '.'))
      const lng = parseFloat(String(validProj.longitude).replace(',', '.'))
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.panTo(lat, lng)
        toast.info(`Centralizado em ${validProj.name}`)
        return
      }
    }

    // Fallback to coordinates
    mapRef.current.panTo(MARABAIXO_COORDS.lat, MARABAIXO_COORDS.lng)
    toast.info('Centralizado (Padrão)')
  }, [projects, selectedProjectId])

  const handleMapLoad = useCallback((_map: any) => {
    setMapReady(true)
  }, [])

  useEffect(() => {
    if (mapReady && !initialFocusRef.current && projects.length > 0) {
      setTimeout(() => {
        if (mapRef.current) {
          // Se houver um projeto selecionado que não seja "all", centralizar nele
          if (selectedProjectId !== 'all') {
            const activeProj = projects.find(
              (p) => p.local_id === selectedProjectId,
            )
            if (activeProj?.latitude && activeProj?.longitude) {
              const lat = parseFloat(
                String(activeProj.latitude).replace(',', '.'),
              )
              const lng = parseFloat(
                String(activeProj.longitude).replace(',', '.'),
              )
              if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                setMapCenter({ lat, lng })
                mapRef.current.panTo(lat, lng)
                initialFocusRef.current = true
                return
              }
            }
          }

          // Tentar centralizar no primeiro projeto com coordenadas válidas
          const validProj = projects.find((p) => {
            const lat = parseFloat(String(p.latitude || '0').replace(',', '.'))
            const lng = parseFloat(String(p.longitude || '0').replace(',', '.'))
            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
          })
          
          if (validProj) {
            const lat = parseFloat(String(validProj.latitude).replace(',', '.'))
            const lng = parseFloat(String(validProj.longitude).replace(',', '.'))
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapCenter({ lat, lng })
              mapRef.current.panTo(lat, lng)
              initialFocusRef.current = true
              return
            }
          }

          // Se nenhum projeto tiver coordenadas, manter as coordenadas padrão
          console.log('Nenhum projeto com coordenadas válidas encontrado. Usando coordenadas padrão.')
        }
      }, 500)
    }
  }, [mapReady, projects, selectedProjectId])

  const saveToHistory = (newDrawings: MapDrawing[]) => {
    setHistoryPast((prev) => [...prev, drawings])
    setHistoryFuture([])
    setDrawings(newDrawings)
    db.setMapDrawings(newDrawings)
  }

  const handleUndo = () => {
    if (historyPast.length === 0) return
    const previous = historyPast[historyPast.length - 1]
    const newPast = historyPast.slice(0, -1)

    setHistoryPast(newPast)
    setHistoryFuture((prev) => [drawings, ...prev])
    setDrawings(previous)
    db.setMapDrawings(previous)
    toast.info('Desfeito.')
  }

  const handleRedo = () => {
    if (historyFuture.length === 0) return
    const next = historyFuture[0]
    const newFuture = historyFuture.slice(1)

    setHistoryPast((prev) => [...prev, drawings])
    setHistoryFuture(newFuture)
    setDrawings(next)
    db.setMapDrawings(next)
    toast.info('Refeito.')
  }

  const handleLayerChange = (
    layer: 'street' | 'satellite' | 'terrain' | 'hybrid' | 'dark',
  ) => {
    if (!layer) return
    setMapLayer(layer)
    sessionStorage.setItem('map_layer', layer)
  }

  const getMarkerColor = (lote: Lote) => {
    const config = markerConfigs.find(
      (c) => c.id === (markerMode === 'default' ? 'default' : lote.sync_status),
    )
    return config ? config.color : '#22c55e'
  }

  const getGoogleMapType = () => {
    switch (mapLayer) {
      case 'satellite':
        return 'satellite'
      case 'terrain':
        return 'terrain'
      case 'hybrid':
        return 'hybrid'
      case 'dark':
      case 'street':
      default:
        return 'roadmap'
    }
  }

  const getMapStyles = () => {
    if (mapLayer === 'dark') return DARK_MAP_STYLE
    return highContrast ? undefined : []
  }

  const handleDrawingComplete = (newDrawingData: any) => {
    const newDrawing: MapDrawing = {
      id: crypto.randomUUID(),
      type: newDrawingData.type,
      coordinates: newDrawingData.coordinates,
      style: { ...currentStyle },
      createdAt: Date.now(),
      layerId: activeLayerId,
    }

    db.saveMapDrawing(newDrawing, user, 'create', 'Geometria criada')
    setDrawings((prev) => [...prev, newDrawing])
    setHistoryPast((prev) => [...prev, drawings])
    setHistoryFuture([])
    toast.success('Desenho salvo!')
  }

  const handleDrawingUpdate = (id: string, coordinates: any) => {
    const original = drawings.find((d) => d.id === id)
    if (!original) return

    const updated = drawings.map((d) =>
      d.id === id ? { ...d, coordinates } : d,
    )
    setDrawings(updated)
    setHistoryPast((prev) => [...prev, drawings])
    setHistoryFuture([])
    db.saveMapDrawing(
      { ...original, coordinates },
      user,
      'update',
      'Geometria movida/editada',
    )
  }

  const handleStyleChange = (newStyle: Partial<DrawingStyle>) => {
    const updatedStyle = { ...currentStyle, ...newStyle }
    setCurrentStyle(updatedStyle)

    if (selectedDrawingIds.length > 0) {
      const updatedDrawings = drawings.map((d) => {
        if (selectedDrawingIds.includes(d.id)) {
          const updated = {
            ...d,
            style: { ...(d.style || DEFAULT_STYLE), ...newStyle },
          }
          db.saveMapDrawing(updated, user, 'style_change', 'Estilo atualizado')
          return updated
        }
        return d
      })
      saveToHistory(updatedDrawings)
    }
  }

  const handleNoteChange = (note: string) => {
    setCurrentNote(note)
    if (selectedDrawingIds.length === 1) {
      const updatedDrawings = drawings.map((d) => {
        if (d.id === selectedDrawingIds[0]) {
          const updated = { ...d, notes: note }
          db.saveMapDrawing(updated, user, 'update', 'Nota atualizada')
          return updated
        }
        return d
      })
      setDrawings(updatedDrawings)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedDrawingIds.length === 0) return
    if (confirm(`Excluir ${selectedDrawingIds.length} item(ns)?`)) {
      selectedDrawingIds.forEach((id) => {
        db.deleteMapDrawing(id, user)
      })
      const newDrawings = drawings.filter(
        (d) => !selectedDrawingIds.includes(d.id),
      )
      setDrawings(newDrawings)
      setHistoryPast((prev) => [...prev, drawings])
      setHistoryFuture([])
      setSelectedDrawingIds([])
      toast.success('Itens excluídos.')
    }
  }

  const handleExportJSON = () => {
    if (drawings.length === 0 && lotes.length === 0) {
      toast.warning('Sem dados para exportar.')
      return
    }
    const geojson = exportToGeoJSON([...drawings])
    downloadFile(
      geojson,
      `map_data_${Date.now()}.geojson`,
      'application/geo+json',
    )
    toast.success('Arquivo GeoJSON exportado.')
  }

  const handleExportKML = () => {
    if (drawings.length === 0) {
      toast.warning('Sem desenhos para exportar.')
      return
    }
    const kml = exportToKML(drawings)
    downloadFile(
      kml,
      `map_data_${Date.now()}.kml`,
      'application/vnd.google-earth.kml+xml',
    )
    toast.success('Arquivo KML exportado.')
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMapClick = async (lat: number, lng: number) => {
    if (routePointMode) {
      toast.info(
        `${routePointMode === 'start' ? 'Origem' : 'Destino'}: ${lat.toFixed(5)}, ${lng.toFixed(5)} (Copie e cole na caixa)`,
      )
      setRoutePointMode(null)
      return
    }

    if (
      drawingMode ||
      selectionMode ||
      editMode ||
      activeKey?.key === undefined
    )
      return

    try {
      toast.loading('Buscando endereço...', { id: 'geocoding' })
      const address = await geocodingService.reverseGeocode(
        lat,
        lng,
        activeKey.key,
      )
      toast.dismiss('geocoding')
      if (address) {
        toast.info(address, {
          duration: 5000,
          description: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
          action: {
            label: 'Copiar',
            onClick: () => navigator.clipboard.writeText(address),
          },
        })
      } else {
        toast.info('Endereço não encontrado.')
      }
    } catch (e) {
      toast.dismiss('geocoding')
      toast.error('Erro ao buscar endereço.')
    }
  }

  const visibleDrawings = drawings.filter((d) => {
    const layer = drawingLayers.find(
      (l) => l.id === (d.layerId || 'default_layer'),
    )
    return layer ? layer.visible : true
  })

  const selectedMeasurements = () => {
    if (selectedDrawingIds.length !== 1) return null
    const selected = drawings.find((d) => d.id === selectedDrawingIds[0])
    if (!selected) return null

    if (selected.type === 'polygon') {
      return { label: 'Área', value: calculateArea(selected.coordinates) }
    }
    if (selected.type === 'polyline') {
      return {
        label: 'Comprimento',
        value: calculateLength(selected.coordinates),
      }
    }
    return null
  }

  const measurements = selectedMeasurements()

  const projectMarkers = projects
    .filter(
      (p) =>
        p.latitude &&
        p.longitude &&
        (selectedProjectId === 'all' || p.local_id === selectedProjectId),
    )
    .map((p) => ({
      lat: parseFloat(String(p.latitude).replace(',', '.')),
      lng: parseFloat(String(p.longitude).replace(',', '.')),
      title: `Projeto: ${p.name}`,
      id: p.local_id,
      color: '#7c3aed',
      icon: 'flag' as MarkerIconType,
    }))
    .filter((m) => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== 0 && m.lng !== 0)

  const loteMarkers = lotes
    .filter(
      (l) =>
        l.latitude &&
        l.longitude &&
        (selectedProjectId === 'all' ||
          projects.find((p) => p.local_id === selectedProjectId)?.local_id ===
            projects.find((p) => p.local_id === l.parent_item_id || true)
              ?.local_id),
    )
    .map((l) => ({
      lat: parseFloat(String(l.latitude).replace(',', '.')),
      lng: parseFloat(String(l.longitude).replace(',', '.')),
      title: l.name,
      status: l.sync_status,
      id: l.local_id,
      color: getMarkerColor(l),
    }))
    .filter((m) => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== 0 && m.lng !== 0)

  const allMarkers = [...projectMarkers, ...loteMarkers]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {!presentationMode && (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-lg shadow-sm border gap-4">
          <div className="flex items-center gap-2 w-full xl:w-auto">
            <Navigation className="h-6 w-6 text-blue-600 shrink-0" />

            <Select
              value={selectedProjectId}
              onValueChange={handleProjectSelect}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione um Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.local_id} value={p.local_id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-full md:w-48 flex gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <CollaborationBadge currentUser={user} />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <ToggleGroup
                type="single"
                value={
                  selectionMode
                    ? 'select'
                    : editMode
                      ? 'edit'
                      : drawingMode || ''
                }
                onValueChange={(v: any) => {
                  if (v === 'edit') {
                    setEditMode(true)
                    setDrawingMode(null)
                    setSelectionMode(null)
                    setSelectedDrawingIds([])
                  } else if (v === 'select') {
                    setEditMode(false)
                    setDrawingMode(null)
                    setSelectionMode('box')
                  } else {
                    setEditMode(false)
                    setSelectionMode(null)
                    setDrawingMode(v || null)
                    setSelectedDrawingIds([])
                  }
                }}
              >
                <ToggleGroupItem
                  value="marker"
                  title="Ponto"
                  aria-label="Ferramenta Ponto"
                >
                  <MapPin className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="polyline"
                  title="Linha"
                  aria-label="Ferramenta Linha"
                >
                  <PenTool className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="polygon"
                  title="Polígono"
                  aria-label="Ferramenta Polígono"
                >
                  <MousePointer2 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="edit"
                  title="Selecionar (Clique)"
                  aria-label="Ferramenta Seleção"
                >
                  <MousePointerClick className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="select"
                  title="Seleção em Caixa"
                  aria-label="Ferramenta Seleção Caixa"
                >
                  <BoxSelect className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={
                      selectedDrawingIds.length > 0 ? 'secondary' : 'ghost'
                    }
                    size="icon"
                    title="Estilo & Notas"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm flex items-center justify-between">
                      {selectedDrawingIds.length > 1
                        ? `${selectedDrawingIds.length} itens selecionados`
                        : 'Propriedades'}
                      {measurements && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {measurements.label}: {measurements.value}
                        </span>
                      )}
                    </h4>

                    <Tabs defaultValue="style">
                      <TabsList className="w-full">
                        <TabsTrigger value="style" className="flex-1">
                          Estilo
                        </TabsTrigger>
                        <TabsTrigger
                          value="notes"
                          className="flex-1"
                          disabled={selectedDrawingIds.length !== 1}
                        >
                          Notas
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="style" className="space-y-4">
                        {(selectedDrawingIds.length === 0 ||
                          drawings.some(
                            (d) =>
                              selectedDrawingIds.includes(d.id) &&
                              d.type === 'marker',
                          )) && (
                          <MarkerCustomizer
                            style={currentStyle}
                            onChange={handleStyleChange}
                          />
                        )}

                        <div className="border-t pt-2 mt-2">
                          <Label className="mb-2 block">
                            Preenchimento (Polígonos)
                          </Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Cor</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={currentStyle.fillColor}
                                  onChange={(e) =>
                                    handleStyleChange({
                                      fillColor: e.target.value,
                                    })
                                  }
                                  className="h-8 w-8 rounded border cursor-pointer"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Opacidade</Label>
                              <Slider
                                value={[currentStyle.fillOpacity]}
                                min={0}
                                max={1}
                                step={0.1}
                                onValueChange={(v) =>
                                  handleStyleChange({ fillOpacity: v[0] })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-2 mt-2">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <Label>Espessura Linha</Label>
                              <span>{currentStyle.strokeWeight}px</span>
                            </div>
                            <Slider
                              value={[currentStyle.strokeWeight]}
                              min={1}
                              max={10}
                              step={1}
                              onValueChange={(v) =>
                                handleStyleChange({ strokeWeight: v[0] })
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="notes" className="space-y-2">
                        <Label>Anotações</Label>
                        <Textarea
                          value={currentNote}
                          onChange={(e) => handleNoteChange(e.target.value)}
                          placeholder="Descreva este elemento..."
                          className="resize-none"
                          rows={5}
                        />
                      </TabsContent>
                    </Tabs>

                    {selectedDrawingIds.length === 1 && (
                      <div className="pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setIsHistoryOpen(true)
                          }}
                        >
                          <Clock className="h-3 w-3 mr-2" />
                          Ver Histórico de Edições
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteSelected}
                disabled={selectedDrawingIds.length === 0}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyPast.length === 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyFuture.length === 0}
              >
                <Redo className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Exportar">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileJson className="w-4 h-4 mr-2" /> Exportar GeoJSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportKML}>
                    <Globe className="w-4 h-4 mr-2" /> Exportar KML
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <AnalysisTools
              selectedDrawingIds={selectedDrawingIds}
              drawings={drawings}
              currentUser={user}
              onBufferCreated={() => {
                refreshData()
                toast.success('Camadas atualizadas')
              }}
            />

            <RoutingControl
              onCalculateRoute={setDirectionsResult}
              onClearRoute={() => setDirectionsResult(null)}
              onSetPointMode={setRoutePointMode}
              routePointMode={routePointMode}
            />

            <AccessibilityControls
              highContrast={highContrast}
              onToggleHighContrast={setHighContrast}
              showLegend={showLegend}
              onToggleLegend={setShowLegend}
              markerConfigs={markerConfigs}
            />

            <Button
              variant="outline"
              size="icon"
              onClick={handleLocateProject}
              title="Centralizar"
            >
              <Crosshair className="h-4 w-4 text-blue-600" />
            </Button>

            <Button
              variant="outline"
              className={cn(
                'gap-2',
                presentationMode && 'bg-blue-600 text-white border-blue-600',
              )}
              onClick={() => setPresentationMode(!presentationMode)}
            >
              <MonitorPlay className="h-4 w-4" /> Apresentação
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Layers className="h-4 w-4" /> Camadas
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <Tabs defaultValue="user-layers">
                  <TabsList className="w-full">
                    <TabsTrigger value="user-layers" className="flex-1">
                      Desenho
                    </TabsTrigger>
                    <TabsTrigger value="ext-layers" className="flex-1">
                      Externo
                    </TabsTrigger>
                    <TabsTrigger value="base" className="flex-1">
                      Mapa
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="user-layers">
                    <LayerManager
                      layers={drawingLayers}
                      onUpdate={() => setDrawingLayers(db.getDrawingLayers())}
                      activeLayerId={activeLayerId}
                      onSetActiveLayer={setActiveLayerId}
                    />
                  </TabsContent>

                  <TabsContent value="ext-layers" className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Dados Externos</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsExternalDataOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {customLayers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma camada externa.
                      </p>
                    ) : (
                      <ul className="space-y-1 max-h-[200px] overflow-y-auto">
                        {customLayers.map((layer) => (
                          <li
                            key={layer.id}
                            className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded"
                          >
                            <span>{layer.name}</span>
                            <div className="flex items-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  layer.visible = !layer.visible
                                  db.saveCustomLayer(layer)
                                  setCustomLayers([...customLayers])
                                }}
                              >
                                {layer.visible ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  db.deleteCustomLayer(layer.id)
                                  setCustomLayers(db.getCustomLayers())
                                }}
                              >
                                <Trash className="h-3 w-3 text-red-400" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  <TabsContent value="base" className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Tipo de Mapa</h4>
                      <ToggleGroup
                        type="single"
                        value={mapLayer}
                        onValueChange={(v: any) => v && handleLayerChange(v)}
                        className="justify-start flex-wrap"
                      >
                        <ToggleGroupItem value="street">Ruas</ToggleGroupItem>
                        <ToggleGroupItem value="satellite">
                          Satélite
                        </ToggleGroupItem>
                        <ToggleGroupItem value="terrain">
                          Relevo
                        </ToggleGroupItem>
                        <ToggleGroupItem value="hybrid">
                          Híbrido
                        </ToggleGroupItem>
                        <ToggleGroupItem value="dark">
                          Dark Mode
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {presentationMode && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="destructive"
            onClick={() => setPresentationMode(false)}
            className="shadow-lg"
          >
            <XIcon className="h-4 w-4 mr-2" /> Sair do Modo Apresentação
          </Button>
        </div>
      )}

      <Card
        ref={mapContainerRef}
        className={cn(
          'flex-1 overflow-hidden relative bg-slate-100 border-2 border-slate-200 transition-all',
          (isFullscreen || presentationMode) &&
            'rounded-none border-0 fixed inset-0 z-40 h-screen w-screen',
          highContrast && 'grayscale-[30%] contrast-125',
        )}
      >
        {activeKey ? (
          <div className="absolute inset-0 h-full w-full">
            <GoogleMap
              ref={mapRef}
              apiKey={activeKey.key}
              mapId={activeKey.mapId}
              center={mapCenter}
              zoom={mapZoom}
              mapType={getGoogleMapType()}
              markers={allMarkers}
              customLayers={customLayers}
              drawings={visibleDrawings}
              className="h-full w-full"
              onMarkerClick={(m) => {
                if (m.title?.startsWith('Projeto: ')) {
                  const pid = m.id
                  if (pid) handleProjectSelect(pid)
                } else if (
                  m.id &&
                  !drawingMode &&
                  !editMode &&
                  !selectionMode &&
                  !presentationMode
                ) {
                  navigate(`/lotes/${m.id}`)
                }
              }}
              onMapClick={handleMapClick}
              drawingMode={drawingMode}
              selectionMode={selectionMode}
              onDrawingComplete={handleDrawingComplete}
              onDrawingUpdate={handleDrawingUpdate}
              onDrawingSelect={(ids) => {
                if (editMode || selectionMode) {
                  setSelectedDrawingIds(ids)
                }
              }}
              drawingStyle={currentStyle}
              editMode={editMode || selectionMode === 'box'}
              selectedDrawingIds={selectedDrawingIds}
              presentationMode={presentationMode}
              fullscreenControl={!presentationMode}
              highContrast={highContrast}
              onMapLoad={handleMapLoad}
              directionsResult={directionsResult}
              mapStyles={getMapStyles()}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="bg-blue-50 p-4 rounded-full animate-pulse">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Carregando Mapa...</h3>
              <p className="text-muted-foreground max-w-md mt-1">
                Obtendo configurações do servidor...
              </p>
            </div>
          </div>
        )}

        {!presentationMode && showLegend && markerMode === 'status' && (
          <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg text-xs space-y-2 backdrop-blur-sm z-10 pointer-events-none">
            <div className="font-semibold mb-1">Legenda</div>
            {markerConfigs
              .filter((c) => c.id !== 'default')
              .map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />{' '}
                  {c.label}
                </div>
              ))}
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: '#7c3aed' }}
              />{' '}
              Projeto
            </div>
            {drawings.some((d) => d.type === 'polygon') && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <div className="w-3 h-3 border border-blue-600 bg-blue-600/30" />{' '}
                Área / Polígono
              </div>
            )}
          </div>
        )}

        {!presentationMode && selectionMode === 'box' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fade-in-down z-10">
            <BoxSelect className="h-4 w-4" />
            Arraste para selecionar múltiplos itens
          </div>
        )}
      </Card>

      <ExternalDataDialog
        open={isExternalDataOpen}
        onOpenChange={setIsExternalDataOpen}
        onAddLayer={(layer) => {
          db.saveCustomLayer(layer)
          setCustomLayers(db.getCustomLayers())
        }}
      />

      <HistoryPanel
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        drawingId={selectedDrawingIds[0] || null}
      />
    </div>
  )
}
