import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '@/services/db'
import {
  Project,
  Lote,
  MapKey,
  MarkerConfig,
  CustomLayer,
  MapDrawing,
} from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Navigation,
  Layers,
  Search,
  Upload,
  Eye,
  EyeOff,
  MapPin,
  PenTool,
  MousePointer2,
  Trash,
  Undo,
  Save,
  ArrowUp,
  ArrowDown,
  Bell,
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
import { GoogleMap } from '@/components/GoogleMap'
import { parseKML } from '@/utils/kmlParser'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MapPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [activeKey, setActiveKey] = useState<MapKey | undefined>()
  const [markerConfigs, setMarkerConfigs] = useState<MarkerConfig[]>([])

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Map Controls
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>(
    (sessionStorage.getItem('map_layer') as any) || 'street',
  )
  const [markerMode, setMarkerMode] = useState<'status' | 'default'>('status')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>()
  const [mapZoom, setMapZoom] = useState(15)

  // Advanced Layers & Drawing
  const [customLayers, setCustomLayers] = useState<CustomLayer[]>([])
  const [drawings, setDrawings] = useState<MapDrawing[]>([])
  const [drawingMode, setDrawingMode] = useState<
    'marker' | 'polygon' | 'polyline' | null
  >(null)

  // Undo/Redo Stacks (Simplified: only track last added drawing for undo)
  // Real implementation would track full history
  const [history, setHistory] = useState<MapDrawing[]>([])

  const refreshData = useCallback(() => {
    const projs = db.getProjects()
    setProjects(projs)
    setLotes(db.getAllLotes())
    setActiveKey(db.getActiveMapKey())
    setMarkerConfigs(db.getMarkerConfigs())
    setCustomLayers(db.getCustomLayers().sort((a, b) => a.zIndex - b.zIndex))
    setDrawings(db.getMapDrawings())

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

  const handleLayerChange = (layer: 'street' | 'satellite' | 'terrain') => {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      let geoJsonData = null

      try {
        if (file.name.endsWith('.kml')) {
          geoJsonData = parseKML(text)
        } else if (
          file.name.endsWith('.json') ||
          file.name.endsWith('.geojson')
        ) {
          geoJsonData = JSON.parse(text)
        }

        if (geoJsonData) {
          const newLayer: CustomLayer = {
            id: Date.now().toString(),
            name: file.name,
            data: geoJsonData,
            visible: true,
            zIndex: customLayers.length + 1,
          }
          db.saveCustomLayer(newLayer)
          setCustomLayers((prev) =>
            [...prev, newLayer].sort((a, b) => a.zIndex - b.zIndex),
          )
          toast.success('Camada importada com sucesso!')
        } else {
          toast.error('Formato não suportado.')
        }
      } catch (err) {
        console.error(err)
        toast.error('Erro ao processar arquivo.')
      }
    }
    reader.readAsText(file)
  }

  const toggleLayerVisibility = (id: string) => {
    const layer = customLayers.find((l) => l.id === id)
    if (layer) {
      layer.visible = !layer.visible
      db.saveCustomLayer(layer)
      setCustomLayers((prev) => prev.map((l) => (l.id === id ? layer : l)))
    }
  }

  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    const index = customLayers.findIndex((l) => l.id === id)
    if (index === -1) return
    if (direction === 'up' && index < customLayers.length - 1) {
      // Swap with next
      const layerA = customLayers[index]
      const layerB = customLayers[index + 1]
      layerA.zIndex = index + 2 // crude
      layerB.zIndex = index + 1
      db.saveCustomLayer(layerA)
      db.saveCustomLayer(layerB)
    } else if (direction === 'down' && index > 0) {
      const layerA = customLayers[index]
      const layerB = customLayers[index - 1]
      layerA.zIndex = index
      layerB.zIndex = index + 1
      db.saveCustomLayer(layerA)
      db.saveCustomLayer(layerB)
    }
    setCustomLayers(db.getCustomLayers().sort((a, b) => a.zIndex - b.zIndex))
  }

  const deleteLayer = (id: string) => {
    db.deleteCustomLayer(id)
    setCustomLayers((prev) => prev.filter((l) => l.id !== id))
  }

  // Drawing Handlers
  const handleDrawingComplete = (newDrawingData: any) => {
    const newDrawing: MapDrawing = {
      id: crypto.randomUUID(),
      type: newDrawingData.type,
      coordinates: newDrawingData.coordinates,
      createdAt: Date.now(),
    }
    db.saveMapDrawing(newDrawing)
    setDrawings((prev) => [...prev, newDrawing])
    setHistory((prev) => [...prev, newDrawing]) // For simplified undo
    setDrawingMode(null) // Exit drawing mode
    toast.success('Desenho salvo!')
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const last = history[history.length - 1]
    db.deleteMapDrawing(last.id)
    setDrawings((prev) => prev.filter((d) => d.id !== last.id))
    setHistory((prev) => prev.slice(0, -1))
    toast.info('Desfeito.')
  }

  const handleDeleteAllDrawings = () => {
    if (confirm('Limpar todos os desenhos?')) {
      drawings.forEach((d) => db.deleteMapDrawing(d.id))
      setDrawings([])
      setHistory([])
    }
  }

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'all') return true
    return p.sync_status === statusFilter
  })
  const filteredProjectIds = filteredProjects.map((p) => p.local_id)
  const displayLotes = lotes.filter((l) => {
    const quadra = db.getQuadra(l.parent_item_id)
    return quadra && filteredProjectIds.includes(quadra.parent_item_id)
  })

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
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <ToggleGroup
              type="single"
              value={drawingMode || ''}
              onValueChange={(v: any) => setDrawingMode(v || null)}
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
            </ToggleGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Desfazer"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteAllDrawings}
              title="Limpar Desenhos"
            >
              <Trash className="h-4 w-4 text-red-500" />
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
                    Opções
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="layers" className="space-y-4">
                  <div className="space-y-2 mt-2">
                    <h4 className="font-medium text-sm">
                      Camadas Personalizadas
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {customLayers
                        .slice()
                        .reverse()
                        .map(
                          (
                            layer, // Show top zIndex first
                          ) => (
                            <div
                              key={layer.id}
                              className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded"
                            >
                              <div className="flex items-center gap-2 truncate max-w-[120px]">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() =>
                                    handleReorderLayer(layer.id, 'up')
                                  }
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() =>
                                    handleReorderLayer(layer.id, 'down')
                                  }
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <span className="truncate" title={layer.name}>
                                  {layer.name}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    toggleLayerVisibility(layer.id)
                                  }
                                >
                                  {layer.visible ? (
                                    <Eye className="h-3 w-3" />
                                  ) : (
                                    <EyeOff className="h-3 w-3 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => deleteLayer(layer.id)}
                                >
                                  <Trash className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ),
                        )}
                      {customLayers.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Nenhuma camada.
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <Label
                        htmlFor="layer-upload"
                        className="cursor-pointer flex items-center justify-center gap-2 w-full p-2 border border-dashed rounded-md hover:bg-slate-50 text-xs text-blue-600"
                      >
                        <Upload className="h-3 w-3" /> Importar KML/GeoJSON
                      </Label>
                      <input
                        id="layer-upload"
                        type="file"
                        accept=".kml,.json,.geojson"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Tipo de Mapa</h4>
                    <ToggleGroup
                      type="single"
                      value={mapLayer}
                      onValueChange={handleLayerChange}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="street">Ruas</ToggleGroupItem>
                      <ToggleGroupItem value="satellite">
                        Satélite
                      </ToggleGroupItem>
                      <ToggleGroupItem value="terrain">Relevo</ToggleGroupItem>
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

      <Card className="flex-1 overflow-hidden relative bg-slate-100 border-2 border-slate-200">
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
                if (m.id) navigate(`/lotes/${m.id}`)
              }}
              drawingMode={drawingMode}
              onDrawingComplete={handleDrawingComplete}
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

        {markerMode === 'status' && (
          <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg text-xs space-y-2 backdrop-blur-sm z-10">
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
            <div className="mt-2 pt-2 border-t text-gray-500">
              Total exibido: {displayLotes.length}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
