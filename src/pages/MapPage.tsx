import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { Project, Lote } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navigation, Layers, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

export default function MapPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | undefined>()

  // Map Controls
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>(
    'street',
  )
  const [markerMode, setMarkerMode] = useState<'status' | 'default'>('status')

  useEffect(() => {
    const projs = db.getProjects()
    setProjects(projs)
    if (projs.length > 0) {
      setSelectedProjectId(projs[0].local_id)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      setLotes(
        db.getAllLotes().filter((l) => {
          const quadra = db.getQuadra(l.parent_item_id)
          return quadra?.parent_item_id === selectedProjectId
        }),
      )
      setSelectedProject(db.getProject(selectedProjectId))
    }
  }, [selectedProjectId])

  const getProjectImage = (p?: Project) => {
    let query = 'city map top view'
    let color = 'blue'

    if (mapLayer === 'satellite') {
      query = 'satellite view city'
      color = 'green'
    } else if (mapLayer === 'terrain') {
      query = 'topographic map'
      color = 'orange'
    }

    if (p?.field_351 && mapLayer === 'street') return p.field_351

    return `https://img.usecurling.com/p/1200/800?q=${encodeURIComponent(query)}&color=${color}`
  }

  const getMarkerColor = (lote: Lote) => {
    if (markerMode === 'default') return 'bg-blue-500'

    switch (lote.sync_status) {
      case 'synchronized':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-orange-500'
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6 text-blue-600" />
            Mapa Interativo
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Selecione o Projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.local_id} value={p.local_id}>
                  {p.field_348}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Camadas do Mapa</h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha o estilo de visualização.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Mapa</Label>
                  <ToggleGroup
                    type="single"
                    value={mapLayer}
                    onValueChange={(v: any) => v && setMapLayer(v)}
                  >
                    <ToggleGroupItem value="street" aria-label="Ruas">
                      Ruas
                    </ToggleGroupItem>
                    <ToggleGroupItem value="satellite" aria-label="Satélite">
                      Satélite
                    </ToggleGroupItem>
                    <ToggleGroupItem value="terrain" aria-label="Terreno">
                      Terreno
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="grid gap-2">
                  <Label>Marcadores</Label>
                  <ToggleGroup
                    type="single"
                    value={markerMode}
                    onValueChange={(v: any) => v && setMarkerMode(v)}
                  >
                    <ToggleGroupItem value="status" aria-label="Por Status">
                      Por Status
                    </ToggleGroupItem>
                    <ToggleGroupItem value="default" aria-label="Padrão">
                      Padrão
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden relative bg-slate-100 border-2 border-slate-200">
        <div className="absolute inset-0 overflow-auto">
          <div className="relative min-w-[800px] min-h-[600px] w-full h-full">
            <img
              src={getProjectImage(selectedProject)}
              alt="Project Map"
              className="w-full h-full object-cover opacity-90"
            />

            {lotes.map((lote) => (
              <Link
                key={lote.local_id}
                to={`/lotes/${lote.local_id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:z-10 group"
                style={{
                  left: `${lote.coordinates?.x || 50}%`,
                  top: `${lote.coordinates?.y || 50}%`,
                }}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-150 cursor-pointer',
                    getMarkerColor(lote),
                  )}
                />

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                  {lote.field_338}
                  <br />
                  <span className="text-[10px] opacity-80">
                    {lote.sync_status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {markerMode === 'status' && (
          <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg text-xs space-y-2 backdrop-blur-sm">
            <div className="font-semibold mb-1">Legenda</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" /> Sincronizado
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" /> Pendente
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" /> Falha
            </div>
            <div className="mt-2 pt-2 border-t text-gray-500">
              Total exibido: {lotes.length}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
