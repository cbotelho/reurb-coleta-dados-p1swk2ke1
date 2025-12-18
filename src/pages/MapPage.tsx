import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '@/services/db'
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
  DEFAULT_STYLE,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function MapPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const mapRef = useRef<GoogleMapHandle>(null)
  const [mapReady, setMapReady] = useState(false)
  const initialFocusRef = useRef(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [activeKey, setActiveKey] = useState<MapKey | undefined>()
  const [markerConfigs, setMarkerConfigs] = useState<MarkerConfig[]>([])

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')

  // Map Controls
  const [mapLayer, setMapLayer] = useState<
    'street' | 'satellite' | 'terrain' | 'hybrid'
  >((sessionStorage.getItem('map_layer') as any) || 'street')
  const [markerMode, setMarkerMode] = useState<'status' | 'default'>('status')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>()
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

  const refreshData = useCallback(() => {
    const projs = db.getProjects()
    setProjects(projs)
    setLotes(db.getAllLotes())
    setActiveKey(db.getActiveMapKey())
    setMarkerConfigs(db.getMarkerConfigs())
    setCustomLayers(db.getCustomLayers().sort((a, b) => a.zIndex - b.zIndex))
    setDrawingLayers(db.getDrawingLayers())

    const savedDrawings = db.getMapDrawings()
    setDrawings(savedDrawings)
  }, [])

  useEffect(() => {
    refreshData()
    // Poll for changes to sync collaboration
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [refreshData])

  useEffect(() => {
    // Sync style and note when SINGLE selection changes
    if (selectedDrawingIds.length === 1) {
      const selected = drawings.find((d) => d.id === selectedDrawingIds[0])
      if (selected) {
        // Robust fallback for style if undefined
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

    // Improved coordinate matching (handling spaces and commas flexibly)
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

    // Search Projects
    const project = projects.find((p) =>
      p.field_348.toLowerCase().includes(searchTerm.toLowerCase()),
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
        toast.success(`Projeto localizado: ${project.field_348}`)
        return
      }
    }

    // Search Lotes
    const lote = lotes.find((l) =>
      l.field_338.toLowerCase().includes(searchTerm.toLowerCase()),
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
        toast.success(`Lote localizado: ${lote.field_338}`)
        return
      }
    }

    toast.warning('Nenhum resultado encontrado.')
  }

  const handleLocateProject = useCallback(() => {
    if (!mapRef.current) return
    const points = getBoundsCoordinates(lotes, drawings, projects)
    if (points.length > 0) {
      mapRef.current.fitBounds(points)
      toast.info('Visualizando extensão total...')
    } else {
      toast.warning('Nenhum dado geográfico encontrado.')
    }
  }, [lotes, drawings, projects])

  const handleMapLoad = useCallback((_map: any) => {
    setMapReady(true)
  }, [])

  // Auto locate on first load
  useEffect(() => {
    if (
      mapReady &&
      !initialFocusRef.current &&
      (lotes.length > 0 || drawings.length > 0 || projects.length > 0)
    ) {
      setTimeout(() => {
        if (mapRef.current) {
          const points = getBoundsCoordinates(lotes, drawings, projects)
          if (points.length > 0) {
            mapRef.current.fitBounds(points)
          } else {
            // Default center if nothing found
            if (
              projects.length > 0 &&
              projects[0].latitude &&
              projects[0].longitude
            ) {
              setMapCenter({
                lat: parseFloat(String(projects[0].latitude).replace(',', '.')),
                lng: parseFloat(
                  String(projects[0].longitude).replace(',', '.'),
                ),
              })
            }
          }
        }
      }, 500)
      initialFocusRef.current = true
    }
  }, [mapReady, lotes, drawings, projects])

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
    layer: 'street' | 'satellite' | 'terrain' | 'hybrid',
  ) => {
    if (!layer) return
    setMapLayer(layer)
    sessionStorage.setItem('map_layer', layer)
  }

  const getMarkerColor = (lote: Lote) => {
    const config = markerConfigs.find(
      (c) => c.id === (markerMode === 'default' ? 'default' : lote.sync_status),
    )
    return config ? config.color : 'red'
  }

  const getGoogleMapType = () => {
    switch (mapLayer) {
      case 'satellite':
        return 'satellite'
      case 'terrain':
        return 'terrain'
      case 'hybrid':
        return 'hybrid'
      default:
        return 'roadmap'
    }
  }

  // Drawing Handlers
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
    // Note: History stack for Undo/Redo is client-side, DB persistence is separate
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
    // Persist to DB and Log History
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

  // Reverse Geocoding Handler
  const handleMapClick = async (lat: number, lng: number) => {
    if (
      drawingMode ||
      selectionMode ||
      editMode ||
      activeKey?.key === undefined
    )
      return

    // Simple check: Only fetch if clicking empty space (no marker clicked)
    // Actually Marker click is handled separately.
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

  // Filter drawings by layer visibility
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

  // Prepare all markers (Projects + Lotes)
  const projectMarkers = projects
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      lat: parseFloat(String(p.latitude).replace(',', '.')),
      lng: parseFloat(String(p.longitude).replace(',', '.')),
      title: `Projeto: ${p.field_348}`,
      id: p.local_id,
      color: '#7c3aed', // Purple for projects
      icon: 'flag' as MarkerIconType,
    }))
    .filter((m) => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== 0 && m.lng !== 0)

  const loteMarkers = lotes
    .filter((l) => l.latitude && l.longitude)
    .map((l) => ({
      lat: parseFloat(String(l.latitude).replace(',', '.')),
      lng: parseFloat(String(l.longitude).replace(',', '.')),
      title: l.field_338,
      status: l.sync_status,
      id: l.local_id,
      color: getMarkerColor(l),
    }))
    .filter((m) => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== 0 && m.lng !== 0)

  const allMarkers = [...projectMarkers, ...loteMarkers]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Top Controls - Hide in Presentation Mode */}
      {!presentationMode && (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-lg shadow-sm border gap-4">
          <div className="flex items-center gap-2 w-full xl:w-auto">
            <Navigation className="h-6 w-6 text-blue-600 shrink-0" />
            <div className="relative w-full md:w-64 flex gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar projeto ou Lat,Lng"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  aria-label="Buscar"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSearch}
                aria-label="Confirmar Busca"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <CollaborationBadge currentUser={user} />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            {/* Drawing Tools */}
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

              {/* Styling Panel */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={
                      selectedDrawingIds.length > 0 ? 'secondary' : 'ghost'
                    }
                    size="icon"
                    title="Estilo & Notas"
                    aria-label="Estilo e Notas"
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
                title="Excluir Seleção"
                aria-label="Excluir Seleção"
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyPast.length === 0}
                title="Desfazer"
                aria-label="Desfazer"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyFuture.length === 0}
                title="Refazer"
                aria-label="Refazer"
              >
                <Redo className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Exportar Dados"
                    aria-label="Exportar"
                  >
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
              title="Centralizar Visualização"
              aria-label="Centralizar Mapa"
              onClick={handleLocateProject}
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
                      </ToggleGroup>
                    </div>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Presentation Mode Exit Button */}
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
          highContrast && 'grayscale-[30%] contrast-125', // Tailwind filter for UI
        )}
      >
        {activeKey ? (
          <div className="absolute inset-0">
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
              onMarkerClick={(m) => {
                // If it's a project marker, maybe navigate to project?
                if (m.title?.startsWith('Projeto: ')) {
                  const pid = m.id
                  if (pid) navigate(`/projetos/${pid}`)
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
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <h3 className="text-xl font-semibold">Mapa Indisponível</h3>
            <p className="text-muted-foreground max-w-md">
              Configure uma Chave de API nas configurações.
            </p>
            <Button asChild>
              <Link to="/configuracoes">Configurar Agora</Link>
            </Button>
          </div>
        )}

        {/* Legend */}
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

        {/* Hints */}
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
