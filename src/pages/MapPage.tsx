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
  Bell,
  Maximize,
  Minimize,
  Palette,
  MousePointerClick,
  Save,
  Redo,
  Download,
  Upload,
  Locate,
  Info,
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
import { GoogleMap } from '@/components/GoogleMap'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  calculateArea,
  calculateLength,
  exportToGeoJSON,
  importFromGeoJSON,
} from '@/utils/geoUtils'

const DEFAULT_STYLE: DrawingStyle = {
  strokeColor: '#2563eb',
  strokeWeight: 2,
  fillColor: '#2563eb',
  fillOpacity: 0.3,
}

export default function MapPage() {
  const navigate = useNavigate()
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

  // Advanced Layers & Drawing
  const [customLayers, setCustomLayers] = useState<CustomLayer[]>([])
  const [drawings, setDrawings] = useState<MapDrawing[]>([])
  const [drawingMode, setDrawingMode] = useState<
    'marker' | 'polygon' | 'polyline' | null
  >(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null,
  )

  // Styling & Notes
  const [currentStyle, setCurrentStyle] = useState<DrawingStyle>(DEFAULT_STYLE)
  const [currentNote, setCurrentNote] = useState('')

  // Undo/Redo Stacks
  const [historyPast, setHistoryPast] = useState<MapDrawing[][]>([])
  const [historyFuture, setHistoryFuture] = useState<MapDrawing[][]>([])

  // Full Screen
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshData = useCallback(() => {
    const projs = db.getProjects()
    setProjects(projs)
    setLotes(db.getAllLotes())
    setActiveKey(db.getActiveMapKey())
    setMarkerConfigs(db.getMarkerConfigs())
    setCustomLayers(db.getCustomLayers().sort((a, b) => a.zIndex - b.zIndex))

    const savedDrawings = db.getMapDrawings()
    setDrawings(savedDrawings)

    // Initial center
    setMapCenter((prev) => {
      if (prev) return prev
      if (projs.length > 0 && projs[0].latitude && projs[0].longitude) {
        return {
          lat: parseFloat(projs[0].latitude),
          lng: parseFloat(projs[0].longitude),
        }
      }
      return prev
    })
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    // Sync style and note when selection changes
    if (selectedDrawingId) {
      const selected = drawings.find((d) => d.id === selectedDrawingId)
      if (selected) {
        setCurrentStyle(selected.style)
        setCurrentNote(selected.notes || '')
      }
    } else {
      setCurrentStyle(DEFAULT_STYLE)
      setCurrentNote('')
    }
  }, [selectedDrawingId, drawings])

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
    }
  }, [])

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

  const handleSearch = () => {
    if (!searchTerm) return
    const coordMatch = searchTerm.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/)
    if (coordMatch) {
      setMapCenter({
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[3]),
      })
      setMapZoom(18)
      toast.success('Movendo para coordenadas.')
      return
    }
    const project = projects.find((p) =>
      p.field_348.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    if (project && project.latitude && project.longitude) {
      setMapCenter({
        lat: parseFloat(project.latitude),
        lng: parseFloat(project.longitude),
      })
      setMapZoom(17)
      toast.success(`Projeto encontrado: ${project.field_348}`)
    } else {
      toast.error('Projeto não encontrado ou sem coordenadas.')
    }
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo navegador.')
      return
    }
    toast.info('Obtendo localização...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setMapZoom(18)
        toast.success('Localização atual encontrada.')
      },
      (error) => {
        console.error(error)
        toast.error('Erro ao obter localização. Verifique permissões.')
      },
    )
  }

  // Drawing Handlers
  const handleDrawingComplete = (newDrawingData: any) => {
    const newDrawing: MapDrawing = {
      id: crypto.randomUUID(),
      type: newDrawingData.type,
      coordinates: newDrawingData.coordinates,
      style: { ...currentStyle },
      createdAt: Date.now(),
    }
    const newDrawings = [...drawings, newDrawing]
    saveToHistory(newDrawings)
    setDrawingMode(null)
    toast.success('Desenho salvo!')
  }

  const handleDrawingUpdate = (id: string, coordinates: any) => {
    const updated = drawings.map((d) =>
      d.id === id ? { ...d, coordinates } : d,
    )
    // Only save to history if actually changed (drag end)
    // For real-time updates this might be too frequent, so db save is OK but history maybe debounced?
    // For simplicity, we update drawings state but maybe push to history only on selection change or explicit "finish"?
    // The GoogleMap component calls this on 'dragend', so it's a discrete event.
    saveToHistory(updated)
  }

  const handleStyleChange = (newStyle: Partial<DrawingStyle>) => {
    const updatedStyle = { ...currentStyle, ...newStyle }
    setCurrentStyle(updatedStyle)

    if (selectedDrawingId) {
      const updatedDrawings = drawings.map((d) =>
        d.id === selectedDrawingId ? { ...d, style: updatedStyle } : d,
      )
      saveToHistory(updatedDrawings)
    }
  }

  const handleNoteChange = (note: string) => {
    setCurrentNote(note)
    if (selectedDrawingId) {
      // Debounce or just update on blur?
      // Updating state directly
      const updatedDrawings = drawings.map((d) =>
        d.id === selectedDrawingId ? { ...d, notes: note } : d,
      )
      // Avoid flooding history for every keystroke.
      // We just update current state and DB, but don't push to history stack for every char.
      // We'll update the 'drawings' state directly without saveToHistory here
      setDrawings(updatedDrawings)
      db.setMapDrawings(updatedDrawings)
    }
  }

  // Create a history entry when note editing is done (e.g. onBlur) if needed,
  // but for now simple state update is fine.

  const handleExport = () => {
    if (drawings.length === 0) {
      toast.warning('Sem desenhos para exportar.')
      return
    }
    const geojson = exportToGeoJSON(drawings)
    const blob = new Blob([geojson], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `map_drawings_${Date.now()}.geojson`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Arquivo GeoJSON exportado.')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const imported = importFromGeoJSON(content)
        if (imported.length > 0) {
          const newDrawings = [...drawings, ...imported]
          saveToHistory(newDrawings)
          toast.success(`${imported.length} geometrias importadas.`)
        } else {
          toast.warning('Nenhuma geometria válida encontrada.')
        }
      } catch (err) {
        toast.error('Erro ao importar GeoJSON.')
      }
    }
    reader.readAsText(file)
    // Reset input
    e.target.value = ''
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        )
      })
    } else {
      document.exitFullscreen()
    }
  }

  const displayLotes = lotes.filter((l) => {
    // Basic filter logic
    return true
  })

  // Measurements Calculation
  const getSelectedMeasurements = () => {
    const selected = drawings.find((d) => d.id === selectedDrawingId)
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

  const measurements = getSelectedMeasurements()

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-lg shadow-sm border gap-4">
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <Navigation className="h-6 w-6 text-blue-600 shrink-0" />
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar projeto ou Lat,Lng"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLocateMe}
            title="Minha Localização"
          >
            <Locate className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <ToggleGroup
              type="single"
              value={editMode ? 'edit' : drawingMode || ''}
              onValueChange={(v: any) => {
                if (v === 'edit') {
                  setEditMode(true)
                  setDrawingMode(null)
                  setSelectedDrawingId(null)
                } else {
                  setEditMode(false)
                  setDrawingMode(v || null)
                  setSelectedDrawingId(null)
                }
              }}
            >
              <ToggleGroupItem value="marker" title="Ponto">
                <MapPin className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="polyline" title="Linha">
                <PenTool className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="polygon" title="Polígono">
                <MousePointer2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="edit" title="Modo Edição">
                <MousePointerClick className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Styling Panel */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedDrawingId ? 'secondary' : 'ghost'}
                  size="icon"
                  title="Estilo & Notas"
                  disabled={!drawingMode && !selectedDrawingId}
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm flex items-center justify-between">
                    Propriedades
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
                      <TabsTrigger value="notes" className="flex-1">
                        Notas
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="style" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Linha</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={currentStyle.strokeColor}
                              onChange={(e) =>
                                handleStyleChange({
                                  strokeColor: e.target.value,
                                })
                              }
                              className="h-8 w-8 rounded border cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Fundo</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={currentStyle.fillColor}
                              onChange={(e) =>
                                handleStyleChange({ fillColor: e.target.value })
                              }
                              className="h-8 w-8 rounded border cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <Label>Espessura</Label>
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

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <Label>Opacidade</Label>
                          <span>
                            {Math.round(currentStyle.fillOpacity * 100)}%
                          </span>
                        </div>
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
                      <p className="text-xs text-muted-foreground">
                        Notas aparecem ao passar o mouse sobre o elemento no
                        mapa.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              title="Desfazer"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              title="Refazer"
            >
              <Redo className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm('Limpar todos os desenhos?')) {
                  saveToHistory([])
                }
              }}
              title="Limpar Desenhos"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              title="Exportar GeoJSON"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Importar GeoJSON"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".geojson,.json"
              onChange={handleImport}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullScreen}
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/geo-alerts')}
          >
            <Bell className="h-4 w-4" /> Alertas
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Layers className="h-4 w-4" /> Camadas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <Tabs defaultValue="layers">
                <TabsList className="w-full">
                  <TabsTrigger value="layers" className="flex-1">
                    Gerenciar
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1">
                    Visualização
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="layers" className="space-y-4">
                  <div className="space-y-2 mt-2">
                    <h4 className="font-medium text-sm">
                      Camadas Personalizadas
                    </h4>
                    {customLayers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma camada.
                      </p>
                    ) : (
                      <ul className="space-y-1 max-h-[200px] overflow-y-auto">
                        {customLayers.map((layer) => (
                          <li
                            key={layer.id}
                            className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded"
                          >
                            <span>{layer.name}</span>
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
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
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
                      <ToggleGroupItem value="terrain">Relevo</ToggleGroupItem>
                      <ToggleGroupItem value="hybrid">Híbrido</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Marcadores de Lotes</h4>
                    <ToggleGroup
                      type="single"
                      value={markerMode}
                      onValueChange={(v: any) => v && setMarkerMode(v)}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="status">Status</ToggleGroupItem>
                      <ToggleGroupItem value="default">Padrão</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card
        ref={mapContainerRef}
        className={cn(
          'flex-1 overflow-hidden relative bg-slate-100 border-2 border-slate-200',
          isFullscreen && 'rounded-none border-0',
        )}
      >
        {activeKey ? (
          <div className="absolute inset-0">
            <GoogleMap
              apiKey={activeKey.key}
              center={mapCenter}
              zoom={mapZoom}
              mapType={getGoogleMapType()}
              markers={displayLotes
                .filter((l) => l.latitude && l.longitude)
                .map((l) => ({
                  lat: parseFloat(l.latitude!),
                  lng: parseFloat(l.longitude!),
                  title: l.field_338,
                  status: l.sync_status,
                  id: l.local_id,
                  color: getMarkerColor(l),
                }))}
              customLayers={customLayers}
              drawings={drawings}
              onMarkerClick={(m) => {
                if (m.id && !drawingMode && !editMode)
                  navigate(`/lotes/${m.id}`)
              }}
              drawingMode={drawingMode}
              onDrawingComplete={handleDrawingComplete}
              onDrawingUpdate={handleDrawingUpdate}
              onDrawingSelect={(id) => {
                if (editMode) {
                  setSelectedDrawingId(id)
                }
              }}
              drawingStyle={currentStyle}
              editMode={editMode}
              selectedDrawingId={selectedDrawingId}
              fullscreenControl={false}
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
        {markerMode === 'status' && (
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
          </div>
        )}

        {/* Help Tip */}
        {editMode && !selectedDrawingId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2 animate-fade-in-down z-10">
            <Info className="h-4 w-4" />
            Clique em um desenho para editar
          </div>
        )}
      </Card>
    </div>
  )
}
