import { useState, useEffect, useRef } from 'react'
import { db } from '@/services/db'
import { Project, Lote, MapKey, MarkerConfig } from '@/types'
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
import { Navigation, Layers, Search, Upload, Eye, EyeOff } from 'lucide-react'
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

interface CustomLayer {
  id: string
  name: string
  data: any
  visible: boolean
}

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

  // Custom Layers
  const [customLayers, setCustomLayers] = useState<CustomLayer[]>([])

  useEffect(() => {
    setProjects(db.getProjects())
    setLotes(db.getAllLotes())
    setActiveKey(db.getActiveMapKey())
    setMarkerConfigs(db.getMarkerConfigs())

    // Initial center (use first project if available)
    const projs = db.getProjects()
    if (projs.length > 0 && projs[0].latitude && projs[0].longitude) {
      setMapCenter({
        lat: parseFloat(projs[0].latitude),
        lng: parseFloat(projs[0].longitude),
      })
    }
  }, [])

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

    // Check for coordinates
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

    // Search Project Name
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
          setCustomLayers((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              name: file.name,
              data: geoJsonData,
              visible: true,
            },
          ])
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
    setCustomLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    )
  }

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'all') return true
    return p.sync_status === statusFilter
  })

  // Filter markers based on filtered projects
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="synchronized">Sincronizados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Layers className="h-4 w-4" /> Camadas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Tipo de Mapa</h4>
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
                  </ToggleGroup>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Marcadores</h4>
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

                <div className="space-y-2 border-t pt-2">
                  <h4 className="font-medium">Camadas Personalizadas</h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {customLayers.map((layer) => (
                      <div
                        key={layer.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span
                          className="truncate max-w-[180px]"
                          title={layer.name}
                        >
                          {layer.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleLayerVisibility(layer.id)}
                        >
                          {layer.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    ))}
                    {customLayers.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma camada importada.
                      </p>
                    )}
                  </div>
                  <div className="pt-2">
                    <Label
                      htmlFor="layer-upload"
                      className="cursor-pointer flex items-center justify-center gap-2 w-full p-2 border border-dashed rounded-md hover:bg-slate-50 text-xs"
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
              </div>
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
              onMarkerClick={(m) => {
                if (m.id) navigate(`/lotes/${m.id}`)
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="bg-white p-6 rounded-full shadow-lg">
              <Navigation className="h-12 w-12 text-blue-300" />
            </div>
            <h3 className="text-xl font-semibold">
              Mapa Interativo Indisponível
            </h3>
            <p className="text-muted-foreground max-w-md">
              Para visualizar o mapa interativo, você precisa configurar uma
              Chave de API do Google Maps nas configurações.
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
