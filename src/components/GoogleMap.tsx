/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  memo,
} from 'react'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { CustomLayer, MapDrawing, DrawingStyle, MarkerIconType } from '@/types'
import {
  getGoogleIconSymbol,
  createAdvancedMarkerContent,
} from '@/utils/mapIcons'
import { loadGoogleMapsApi } from '@/utils/googleMapsLoader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    google: any
  }
}

interface Marker {
  lat: number
  lng: number
  title?: string
  status?: string
  id?: string
  color?: string
  icon?: MarkerIconType
}

export interface GoogleMapHandle {
  fitBounds: (points: { lat: number; lng: number }[]) => void
  panTo: (lat: number, lng: number) => void
  getMap: () => any
}

interface GoogleMapProps {
  apiKey: string
  mapId?: string
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Marker[]
  customLayers?: CustomLayer[]
  drawings?: MapDrawing[]
  className?: string
  onMarkerClick?: (marker: Marker) => void
  onMapClick?: (lat: number, lng: number) => void
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  drawingMode?: 'marker' | 'polygon' | 'polyline' | 'rectangle' | null
  selectionMode?: 'box' | null
  onDrawingComplete?: (drawing: any) => void
  onDrawingUpdate?: (id: string, coordinates: any) => void
  onDrawingSelect?: (ids: string[]) => void
  fullscreenControl?: boolean
  drawingStyle?: DrawingStyle
  editMode?: boolean
  selectedDrawingIds?: string[]
  presentationMode?: boolean
  highContrast?: boolean
  onMapLoad?: (map: any) => void
  directionsResult?: any
  mapStyles?: any[]
}

const DEFAULT_STYLE: DrawingStyle = {
  strokeColor: '#2563eb',
  strokeWeight: 2,
  fillColor: '#2563eb',
  fillOpacity: 0.3,
  markerIcon: 'circle',
  markerSize: 1,
}

const HIGH_CONTRAST_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
]

// Componente Interno Principal
const GoogleMapInner = forwardRef<GoogleMapHandle, GoogleMapProps>(
  (
    {
      apiKey,
      mapId,
      center,
      zoom = 15,
      markers = [],
      drawings = [],
      customLayers = [],
      className = '',
      onMarkerClick,
      onMapClick,
      mapType = 'roadmap',
      drawingMode = null,
      selectionMode = null,
      onDrawingComplete,
      onDrawingUpdate,
      onDrawingSelect,
      fullscreenControl = true,
      drawingStyle = DEFAULT_STYLE,
      editMode = false,
      selectedDrawingIds = [],
      presentationMode = false,
      highContrast = false,
      onMapLoad,
      directionsResult,
      mapStyles,
    },
    ref,
  ) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<any>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Referências persistentes para evitar recriação desnecessária
    const markersRef = useRef<any[]>([])
    const drawingManagerRef = useRef<any>(null)
    const drawnShapesRef = useRef<Map<string, any>>(new Map())
    const customLayersRef = useRef<Map<string, any>>(new Map())
    const infoWindowRef = useRef<any>(null)
    const directionsRendererRef = useRef<any>(null)

    // Refs de Biblioteca
    const MapClassRef = useRef<any>(null)
    const ControlPositionRef = useRef<any>(null)
    const AdvancedMarkerElementRef = useRef<any>(null)
    const DrawingManagerRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      fitBounds: (points) => {
        if (!map || !window.google?.maps || points.length === 0) return
        const bounds = new window.google.maps.LatLngBounds()
        points.forEach((p) => bounds.extend(p))
        map.fitBounds(bounds)
      },
      panTo: (lat, lng) => {
        if (!map) return
        map.panTo({ lat, lng })
      },
      getMap: () => map,
    }))

    // 1. Inicialização Única da API
    useEffect(() => {
      if (!apiKey) {
        setError('API Key não configurada.')
        setIsLoading(false)
        return
      }

      let isMounted = true
      const init = async () => {
        try {
          setIsLoading(true)
          await loadGoogleMapsApi(apiKey)

          // Pooling reduzido para não travar a main thread
          let attempts = 0
          while (!window.google?.maps?.importLibrary && attempts < 30) {
            await new Promise((r) => setTimeout(r, 200))
            attempts++
          }

          if (!window.google?.maps?.importLibrary) throw new Error('Google Maps Timeout')

          const [mapsLib, markerLib, drawingLib] = await Promise.all([
            window.google.maps.importLibrary('maps'),
            window.google.maps.importLibrary('marker'),
            window.google.maps.importLibrary('drawing'),
          ])

          if (!isMounted) return

          MapClassRef.current = mapsLib.Map
          ControlPositionRef.current = mapsLib.ControlPosition
          AdvancedMarkerElementRef.current = markerLib.AdvancedMarkerElement
          DrawingManagerRef.current = drawingLib.DrawingManager

          setIsLoaded(true)
          setIsLoading(false)
        } catch (e) {
          console.error('Failed to load Google Maps', e)
          if (isMounted) {
            setError('Falha ao inicializar o Google Maps.')
            setIsLoading(false)
          }
        }
      }

      init()
      return () => { isMounted = false }
    }, [apiKey])

    // 2. Instância do Mapa
    useEffect(() => {
      if (isLoaded && mapRef.current && !map && MapClassRef.current) {
        const gMap = new MapClassRef.current(mapRef.current, {
          center: center || { lat: 0, lng: 0 },
          zoom,
          mapTypeId: mapType,
          mapId: mapId || undefined,
          styles: mapStyles || (highContrast ? HIGH_CONTRAST_STYLE : []),
          disableDefaultUI: presentationMode,
        })

        setMap(gMap)
        infoWindowRef.current = new window.google.maps.InfoWindow({ disableAutoPan: true })
        if (onMapLoad) onMapLoad(gMap)
      }
    }, [isLoaded]) // Somente na carga inicial

    // 3. Atualização de Marcadores OTIMIZADA
    useEffect(() => {
      if (!map || !isLoaded) return

      // Usar um timeout pequeno para não bloquear a renderização da UI
      const timer = setTimeout(() => {
        markersRef.current.forEach(m => { m.map = null })
        markersRef.current = []

        const limit = presentationMode ? 500 : 2000
        markers.slice(0, limit).forEach((markerData) => {
          const markerInstance = new window.google.maps.Marker({
            position: { lat: markerData.lat, lng: markerData.lng },
            map: map,
            icon: getGoogleIconSymbol(markerData.icon || 'circle', markerData.color || 'red', 1),
            optimized: true, // Crucial para performance
          })

          if (onMarkerClick) {
            markerInstance.addListener('click', () => onMarkerClick(markerData))
          }
          markersRef.current.push(markerInstance)
        })
      }, 100)

      return () => clearTimeout(timer)
    }, [map, markers, isLoaded, presentationMode]) // Marcadores agora são tratados de forma isolada

    // 4. PanTo Inteligente (Evita Loops)
    useEffect(() => {
      if (map && center) {
        const currentCenter = map.getCenter()
        if (currentCenter) {
          const deltaLat = Math.abs(currentCenter.lat() - center.lat)
          const deltaLng = Math.abs(currentCenter.lng() - center.lng)
          if (deltaLat > 0.0001 || deltaLng > 0.0001) {
            map.panTo(center)
          }
        }
      }
    }, [center]) // Removido 'map' da dependência para evitar disparos duplos

    if (error) return (
      <div className={cn("flex items-center justify-center h-full min-h-[300px] bg-red-50 text-red-600 p-4", className)}>
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Recarregar</Button>
        </div>
      </div>
    )

    if (isLoading) return (
      <div className={cn("flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-50", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )

    return <div ref={mapRef} className={className} style={{ minHeight: '300px' }} />
  }
)

// Exporta com React.memo para evitar re-renderizações inúteis vindas do Pai
export const GoogleMap = memo(GoogleMapInner)