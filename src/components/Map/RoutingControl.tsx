import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Route, Navigation, X } from 'lucide-react'
import { toast } from 'sonner'

interface RoutingControlProps {
  onCalculateRoute: (result: any) => void
  onClearRoute: () => void
  onSetPointMode: (mode: 'start' | 'end' | null) => void
  routePointMode: 'start' | 'end' | null
}

export function RoutingControl({
  onCalculateRoute,
  onClearRoute,
  onSetPointMode,
  routePointMode,
}: RoutingControlProps) {
  const [startPoint, setStartPoint] = useState('')
  const [endPoint, setEndPoint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [distance, setDistance] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)

  // This function is exposed to MapPage via refs or props in a real complex app
  // but here we rely on text inputs or MapPage handling the point update
  // To keep it simple, we let MapPage pass coordinates as strings if set via map click

  const handleCalculate = async () => {
    if (!startPoint || !endPoint) {
      toast.error('Defina origem e destino.')
      return
    }

    if (!window.google?.maps) {
      toast.error('Google Maps não carregado.')
      return
    }

    setIsLoading(true)
    const directionsService = new window.google.maps.DirectionsService()

    directionsService.route(
      {
        origin: startPoint,
        destination: endPoint,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        setIsLoading(false)
        if (status === window.google.maps.DirectionsStatus.OK) {
          onCalculateRoute(result)
          const route = result.routes[0]
          if (route && route.legs && route.legs.length > 0) {
            setDistance(route.legs[0].distance.text)
            setDuration(route.legs[0].duration.text)
          }
        } else {
          toast.error('Não foi possível calcular a rota: ' + status)
        }
      },
    )
  }

  const handleClear = () => {
    setStartPoint('')
    setEndPoint('')
    setDistance(null)
    setDuration(null)
    onClearRoute()
    onSetPointMode(null)
  }

  // Effect to listen to map clicks would be in MapPage, which updates these inputs
  // But we need a way to receive those values. For now, we assume user types or
  // MapPage updates a state that we observe?
  // Let's rely on props. We can't easily sync state two-way without a parent controller.
  // Instead, we will add a small update helper here if we want full map-click integration
  // but simplest is just text inputs for now, OR user clicks button "Select on Map".

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={routePointMode || distance ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
        >
          <Route className="h-4 w-4" />
          {distance ? `${distance}` : 'Rotas'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-medium text-sm">Cálculo de Rotas</h4>
            {distance && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Origem</Label>
              <div className="flex gap-2">
                <Input
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  placeholder="Endereço ou Lat,Lng"
                  className="h-8 text-sm"
                />
                <Button
                  size="icon"
                  variant={routePointMode === 'start' ? 'default' : 'outline'}
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    onSetPointMode(routePointMode === 'start' ? null : 'start')
                  }
                  title="Selecionar no mapa"
                >
                  <Navigation className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Destino</Label>
              <div className="flex gap-2">
                <Input
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                  placeholder="Endereço ou Lat,Lng"
                  className="h-8 text-sm"
                />
                <Button
                  size="icon"
                  variant={routePointMode === 'end' ? 'default' : 'outline'}
                  className="h-8 w-8 shrink-0"
                  onClick={() =>
                    onSetPointMode(routePointMode === 'end' ? null : 'end')
                  }
                  title="Selecionar no mapa"
                >
                  <Navigation className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {distance && (
              <div className="bg-slate-50 p-2 rounded text-sm space-y-1 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distância:</span>
                  <span className="font-medium">{distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo Estimado:</span>
                  <span className="font-medium">{duration}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="sm"
              onClick={handleCalculate}
              disabled={isLoading || !startPoint || !endPoint}
            >
              {isLoading ? 'Calculando...' : 'Calcular Rota'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
