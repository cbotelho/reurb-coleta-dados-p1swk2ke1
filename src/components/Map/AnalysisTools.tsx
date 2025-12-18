import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Calculator,
  Circle,
  Layers,
  MousePointer2,
  Minimize2,
} from 'lucide-react'
import { MapDrawing, User } from '@/types'
import { createPointBuffer, approximateOverlapArea } from '@/utils/geoAnalysis'
import { db } from '@/services/db'
import { toast } from 'sonner'

interface AnalysisToolsProps {
  selectedDrawingIds: string[]
  drawings: MapDrawing[]
  currentUser: User | null
  onBufferCreated: () => void
}

export function AnalysisTools({
  selectedDrawingIds,
  drawings,
  currentUser,
  onBufferCreated,
}: AnalysisToolsProps) {
  const [bufferDistance, setBufferDistance] = useState('50')

  const handleCreateBuffer = () => {
    if (selectedDrawingIds.length !== 1) {
      toast.error('Selecione exatamente 1 item para criar buffer.')
      return
    }

    const drawing = drawings.find((d) => d.id === selectedDrawingIds[0])
    if (!drawing) return

    let center
    if (drawing.type === 'marker') {
      center = drawing.coordinates
    } else if (
      Array.isArray(drawing.coordinates) &&
      drawing.coordinates.length > 0
    ) {
      // Use first point as approximation for polygon center in simplified version
      center = drawing.coordinates[0]
    }

    if (!center) {
      toast.error('Geometria inválida para buffer.')
      return
    }

    const radius = parseFloat(bufferDistance)
    const bufferCoords = createPointBuffer(center, radius)

    const bufferDrawing: MapDrawing = {
      id: crypto.randomUUID(),
      type: 'polygon',
      coordinates: bufferCoords,
      style: {
        fillColor: '#f59e0b',
        fillOpacity: 0.3,
        strokeColor: '#d97706',
        strokeWeight: 2,
        markerIcon: 'circle',
        markerSize: 1,
      },
      createdAt: Date.now(),
      notes: `Buffer de ${radius}m para ${drawing.notes || 'item'}`,
      layerId: 'default_layer',
    }

    db.saveMapDrawing(
      bufferDrawing,
      currentUser,
      'create',
      `Buffer de ${radius}m criado`,
    )
    toast.success('Zona de buffer criada!')
    onBufferCreated()
  }

  const handleOverlapAnalysis = () => {
    if (selectedDrawingIds.length !== 2) {
      toast.error(
        'Selecione exatamente 2 polígonos para analisar sobreposição.',
      )
      return
    }

    const d1 = drawings.find((d) => d.id === selectedDrawingIds[0])
    const d2 = drawings.find((d) => d.id === selectedDrawingIds[1])

    if (
      !d1 ||
      !d2 ||
      d1.type === 'marker' ||
      d2.type === 'marker' ||
      !Array.isArray(d1.coordinates) ||
      !Array.isArray(d2.coordinates)
    ) {
      toast.error('Apenas polígonos podem ser analisados.')
      return
    }

    const area = approximateOverlapArea(d1.coordinates, d2.coordinates)

    if (area > 0) {
      toast.success(`Sobreposição detectada! Área aprox: ${area.toFixed(2)} m²`)
    } else {
      toast.info('Nenhuma sobreposição detectada.')
    }
  }

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calculator className="h-4 w-4" /> Análise
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="end">
          <div className="space-y-4">
            <h4 className="font-medium border-b pb-2">Ferramentas Geo</h4>

            <div className="space-y-2">
              <Label className="text-xs">Buffer (Zona de Proximidade)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={bufferDistance}
                  onChange={(e) => setBufferDistance(e.target.value)}
                  placeholder="Metros"
                  className="h-8"
                />
                <Button size="sm" onClick={handleCreateBuffer}>
                  <Circle className="h-3 w-3 mr-1" /> Criar
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs">Interseção</Label>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleOverlapAnalysis}
              >
                <Layers className="h-3 w-3 mr-2" /> Analisar Sobreposição
              </Button>
              <p className="text-[10px] text-muted-foreground">
                Selecione 2 polígonos (Shift+Click)
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
