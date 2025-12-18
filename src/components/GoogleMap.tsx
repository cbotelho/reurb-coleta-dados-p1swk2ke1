/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { CustomLayer, MapDrawing, DrawingStyle, MarkerIconType } from '@/types'
import {
  getGoogleIconSymbol,
  createAdvancedMarkerContent,
} from '@/utils/mapIcons'
import { loadGoogleMapsApi } from '@/utils/googleMapsLoader'
import { Button } from './ui/button'

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
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  // ... (rest of high contrast style can be added here or imported)
]

export const GoogleMap = forwardRef<GoogleMapHandle, GoogleMapProps>(
  (
    {
      apiKey,
      mapId,
      center,
      zoom = 15,
      markers = [],
      drawings = [],
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
    },
    ref,
  ) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<any>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // References to map objects
    const markersRef = useRef<any[]>([])
    const drawingManagerRef = useRef<any>(null)
    const drawnShapesRef = useRef<Map<string, any>>(new Map())
    const infoWindowRef = useRef<any>(null)

    // Library References
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
        map.setZoom(18)
      },
    }))

    useEffect(() => {
      if (!apiKey) {
        setError('API Key não configurada.')
        return
      }

      let isMounted = true

      const init = async () => {
        try {
          loadGoogleMapsApi(apiKey)

          // Use importLibrary to safely load modules
          const [mapsLib, markerLib, drawingLib] = await Promise.all([
            window.google.maps.importLibrary('maps'),
            window.google.maps.importLibrary('marker'),
            window.google.maps.importLibrary('drawing'),
            window.google.maps.importLibrary('geometry'), // Ensure geometry is loaded
          ])

          if (!isMounted) return

          MapClassRef.current = mapsLib.Map
          ControlPositionRef.current = mapsLib.ControlPosition
          AdvancedMarkerElementRef.current = markerLib.AdvancedMarkerElement
          DrawingManagerRef.current = drawingLib.DrawingManager

          setIsLoaded(true)
        } catch (e) {
          console.error('Failed to load Google Maps libraries', e)
          if (isMounted) setError('Falha ao inicializar o Google Maps.')
        }
      }

      init()

      return () => {
        isMounted = false
      }
    }, [apiKey])

    // Init Map Instance
    useEffect(() => {
      if (
        isLoaded &&
        mapRef.current &&
        !map &&
        MapClassRef.current &&
        ControlPositionRef.current
      ) {
        try {
          const mapOptions: any = {
            center: center || { lat: 0, lng: 0 },
            zoom,
            mapTypeId: mapType,
            streetViewControl: false,
            fullscreenControl: fullscreenControl && !presentationMode,
            zoomControl: !presentationMode,
            mapTypeControl: !presentationMode,
            styles: highContrast ? HIGH_CONTRAST_STYLE : [],
            fullscreenControlOptions: {
              position: ControlPositionRef.current.RIGHT_TOP,
            },
            mapId: mapId || undefined,
          }

          const gMap = new MapClassRef.current(mapRef.current, mapOptions)
          setMap(gMap)

          infoWindowRef.current = new window.google.maps.InfoWindow({
            disableAutoPan: true,
          })

          if (onMapLoad) onMapLoad(gMap)
        } catch (err) {
          console.error('Error creating map instance:', err)
          setError('Erro ao renderizar o mapa.')
        }
      }
    }, [
      isLoaded,
      mapId,
      map,
      mapType,
      fullscreenControl,
      presentationMode,
      highContrast,
      onMapLoad,
      center,
      zoom,
    ])

    // Handle Map Click
    useEffect(() => {
      if (!map || !onMapClick) return

      const listener = map.addListener('click', (e: any) => {
        onMapClick(e.latLng.lat(), e.latLng.lng())
      })

      return () => {
        if (window.google?.maps?.event) {
          window.google.maps.event.removeListener(listener)
        }
      }
    }, [map, onMapClick])

    // Update Map Options
    useEffect(() => {
      if (map) {
        map.setOptions({
          mapTypeId: mapType,
          fullscreenControl: fullscreenControl && !presentationMode,
          zoomControl: !presentationMode,
          mapTypeControl: !presentationMode,
          disableDefaultUI: presentationMode,
          styles: highContrast ? HIGH_CONTRAST_STYLE : [],
        })
        if (center) {
          const c = map.getCenter()
          if (
            !c ||
            Math.abs(c.lat() - center.lat) > 0.0001 ||
            Math.abs(c.lng() - center.lng) > 0.0001
          ) {
            map.panTo(center)
          }
        }
      }
    }, [
      map,
      mapType,
      fullscreenControl,
      presentationMode,
      center,
      zoom,
      highContrast,
    ])

    // Render Markers
    useEffect(() => {
      if (!map || !isLoaded) return

      // Clear existing markers
      markersRef.current.forEach((m) => {
        if (m.map) m.map = null
      })
      markersRef.current = []

      if (presentationMode) return

      const markersToRender =
        markers.length > 2000 ? markers.slice(0, 2000) : markers

      markersToRender.forEach((markerData) => {
        let markerInstance

        // Use Advanced Marker if available and Map ID is present
        if (AdvancedMarkerElementRef.current && mapId) {
          const AdvancedMarkerElement = AdvancedMarkerElementRef.current
          const content = createAdvancedMarkerContent(
            markerData.icon,
            markerData.color || 'red',
            1.2,
          )

          markerInstance = new AdvancedMarkerElement({
            map,
            position: { lat: markerData.lat, lng: markerData.lng },
            title: markerData.title,
            content: content,
          })

          if (onMarkerClick) {
            markerInstance.addListener('click', () => onMarkerClick(markerData))
          }
        } else {
          // Fallback to legacy Marker
          let iconSymbol
          if (markerData.icon) {
            iconSymbol = getGoogleIconSymbol(
              markerData.icon,
              markerData.color || 'red',
              1.2,
            )
          } else {
            iconSymbol = {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: markerData.color || 'red',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 1,
            }
          }

          markerInstance = new window.google.maps.Marker({
            position: { lat: markerData.lat, lng: markerData.lng },
            map: map,
            title: markerData.title,
            icon: iconSymbol,
            optimized: true,
            clickable: !presentationMode,
          })

          if (onMarkerClick) {
            markerInstance.addListener('click', () => onMarkerClick(markerData))
          }
        }

        markersRef.current.push(markerInstance)
      })
    }, [map, markers, mapId, onMarkerClick, presentationMode, isLoaded])

    // Drawing Manager
    useEffect(() => {
      if (
        map &&
        DrawingManagerRef.current &&
        !drawingManagerRef.current &&
        isLoaded
      ) {
        const dm = new DrawingManagerRef.current({
          drawingMode: null,
          drawingControl: false,
        })
        dm.setMap(map)

        window.google.maps.event.addListener(
          dm,
          'overlaycomplete',
          (event: any) => {
            const { type, overlay } = event

            if (type === 'rectangle' && selectionMode === 'box') {
              const bounds = overlay.getBounds()
              const selectedIds: string[] = []

              drawnShapesRef.current.forEach((shape, id) => {
                let isInside = false
                if (
                  shape.position ||
                  (shape.getPosition && shape.getPosition())
                ) {
                  const pos = shape.position || shape.getPosition()
                  isInside = bounds.contains(pos)
                } else if (shape.getPath) {
                  const path = shape.getPath()
                  for (let i = 0; i < path.getLength(); i++) {
                    if (bounds.contains(path.getAt(i))) {
                      isInside = true
                      break
                    }
                  }
                }
                if (isInside) selectedIds.push(id)
              })

              if (onDrawingSelect) onDrawingSelect(selectedIds)
              overlay.setMap(null)
              return
            }

            let coords: any
            if (type === 'marker') {
              const pos = overlay.getPosition()
              coords = { lat: pos.lat(), lng: pos.lng() }
            } else if (type === 'polygon' || type === 'polyline') {
              const path = overlay.getPath()
              coords = path.getArray().map((p: any) => ({
                lat: p.lat(),
                lng: p.lng(),
              }))
            }

            overlay.setMap(null)
            if (onDrawingComplete && !selectionMode) {
              onDrawingComplete({ type, coordinates: coords })
            }
          },
        )
        drawingManagerRef.current = dm
      }
    }, [map, onDrawingComplete, selectionMode, onDrawingSelect, isLoaded])

    // Update Drawing Mode & Styles
    useEffect(() => {
      if (drawingManagerRef.current && isLoaded) {
        const dm = drawingManagerRef.current
        let effectiveMode = null
        if (drawingMode) {
          effectiveMode =
            window.google.maps.drawing.OverlayType[drawingMode.toUpperCase()]
        } else if (selectionMode === 'box') {
          effectiveMode = window.google.maps.drawing.OverlayType.RECTANGLE
        }
        dm.setDrawingMode(effectiveMode)

        const commonOptions = {
          editable: true,
          draggable: true,
        }

        const safeStyle: DrawingStyle = {
          strokeColor: drawingStyle?.strokeColor || DEFAULT_STYLE.strokeColor,
          strokeWeight:
            drawingStyle?.strokeWeight || DEFAULT_STYLE.strokeWeight,
          fillColor: drawingStyle?.fillColor || DEFAULT_STYLE.fillColor,
          fillOpacity: drawingStyle?.fillOpacity ?? DEFAULT_STYLE.fillOpacity,
          markerIcon: drawingStyle?.markerIcon || DEFAULT_STYLE.markerIcon,
          markerSize: drawingStyle?.markerSize || DEFAULT_STYLE.markerSize,
        }

        const selectionOptions = {
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          strokeColor: '#3b82f6',
          strokeWeight: 1,
          clickable: false,
          editable: false,
          draggable: false,
        }

        dm.setOptions({
          markerOptions: {
            ...commonOptions,
            icon: getGoogleIconSymbol(
              safeStyle.markerIcon,
              safeStyle.fillColor,
              safeStyle.markerSize,
            ),
          },
          polygonOptions: {
            ...commonOptions,
            fillColor: safeStyle.fillColor,
            fillOpacity: safeStyle.fillOpacity,
            strokeColor: safeStyle.strokeColor,
            strokeWeight: safeStyle.strokeWeight,
          },
          polylineOptions: {
            ...commonOptions,
            strokeColor: safeStyle.strokeColor,
            strokeWeight: safeStyle.strokeWeight,
          },
          rectangleOptions: selectionMode === 'box' ? selectionOptions : {},
        })
      }
    }, [drawingMode, drawingStyle, selectionMode, isLoaded])

    // Render User Drawings
    useEffect(() => {
      if (!map || !drawings || !isLoaded) return

      const existingIds = new Set(drawnShapesRef.current.keys())
      const currentIds = new Set(drawings.map((d) => d.id))

      existingIds.forEach((id) => {
        if (!currentIds.has(id)) {
          const shape = drawnShapesRef.current.get(id)
          window.google.maps.event.clearInstanceListeners(shape)
          shape.setMap(null)
          drawnShapesRef.current.delete(id)
        }
      })

      drawings.forEach((d) => {
        if (!d) return
        const style = d.style || {}
        const safeStyle: DrawingStyle = {
          strokeColor: style.strokeColor || DEFAULT_STYLE.strokeColor,
          strokeWeight: style.strokeWeight || DEFAULT_STYLE.strokeWeight,
          fillColor: style.fillColor || DEFAULT_STYLE.fillColor,
          fillOpacity: style.fillOpacity ?? DEFAULT_STYLE.fillOpacity,
          markerIcon:
            (style.markerIcon as MarkerIconType) || DEFAULT_STYLE.markerIcon,
          markerSize: style.markerSize || DEFAULT_STYLE.markerSize,
        }

        const isSelected = selectedDrawingIds.includes(d.id)
        const isEditable = (editMode || isSelected) && !presentationMode
        let shape = drawnShapesRef.current.get(d.id)

        const baseOptions = {
          editable: isEditable,
          draggable: isEditable,
          clickable: !presentationMode,
          zIndex: isSelected ? 100 : 1,
          title: d.notes || '',
        }
        const strokeColor = isSelected ? '#ef4444' : safeStyle.strokeColor

        if (!shape) {
          if (d.type === 'marker') {
            shape = new window.google.maps.Marker({
              position: d.coordinates,
              map: map,
              ...baseOptions,
              icon: getGoogleIconSymbol(
                safeStyle.markerIcon,
                safeStyle.fillColor,
                safeStyle.markerSize,
              ),
            })
          } else if (d.type === 'polygon') {
            shape = new window.google.maps.Polygon({
              paths: d.coordinates,
              map: map,
              ...baseOptions,
              fillColor: safeStyle.fillColor,
              fillOpacity: safeStyle.fillOpacity,
              strokeColor: strokeColor,
              strokeWeight: isSelected
                ? (safeStyle.strokeWeight || 2) + 2
                : safeStyle.strokeWeight,
            })
          } else if (d.type === 'polyline') {
            shape = new window.google.maps.Polyline({
              path: d.coordinates,
              map: map,
              ...baseOptions,
              strokeColor: strokeColor,
              strokeWeight: isSelected
                ? (safeStyle.strokeWeight || 2) + 2
                : safeStyle.strokeWeight,
            })
          }

          if (!presentationMode && shape) {
            shape.addListener('click', () => {
              if (onDrawingSelect) onDrawingSelect([d.id])
            })
            if (d.type !== 'marker') {
              shape.addListener('mouseover', (e: any) => {
                if (d.notes && infoWindowRef.current) {
                  infoWindowRef.current.setContent(
                    `<div style="padding: 5px; font-size: 12px; color: #000;">${d.notes}</div>`,
                  )
                  infoWindowRef.current.setPosition(e.latLng)
                  infoWindowRef.current.open(map)
                }
              })
              shape.addListener('mouseout', () => {
                if (infoWindowRef.current) infoWindowRef.current.close()
              })
            }

            if (d.type === 'marker') {
              shape.addListener('dragend', () => {
                const pos = shape.getPosition()
                if (onDrawingUpdate)
                  onDrawingUpdate(d.id, { lat: pos.lat(), lng: pos.lng() })
              })
            } else {
              const updatePath = () => {
                const path = shape.getPath()
                const coords = path
                  .getArray()
                  .map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
                if (onDrawingUpdate) onDrawingUpdate(d.id, coords)
              }
              shape.addListener('dragend', updatePath)
              shape.getPath().addListener('set_at', updatePath)
              shape.getPath().addListener('insert_at', updatePath)
              shape.getPath().addListener('remove_at', updatePath)
            }
          }
          if (shape) drawnShapesRef.current.set(d.id, shape)
        } else {
          if (d.type === 'marker') {
            shape.setOptions({
              ...baseOptions,
              icon: getGoogleIconSymbol(
                safeStyle.markerIcon,
                safeStyle.fillColor,
                safeStyle.markerSize,
              ),
            })
            shape.setPosition(d.coordinates)
            shape.setTitle(d.notes || '')
          } else {
            shape.setOptions({
              ...baseOptions,
              fillColor: safeStyle.fillColor,
              fillOpacity: safeStyle.fillOpacity,
              strokeColor: strokeColor,
              strokeWeight: isSelected
                ? (safeStyle.strokeWeight || 2) + 2
                : safeStyle.strokeWeight,
            })
          }
        }
      })
    }, [
      map,
      drawings,
      editMode,
      selectedDrawingIds,
      onDrawingUpdate,
      onDrawingSelect,
      presentationMode,
      isLoaded,
    ])

    if (error)
      return (
        <div className="flex items-center justify-center h-full min-h-[300px] bg-red-50 text-red-600 rounded-lg border border-red-200 p-4">
          <div className="text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-red-500" />
            <p className="font-semibold">Erro ao carregar mapa</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-red-200 hover:bg-red-100 text-red-700"
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </Button>
          </div>
        </div>
      )
    if (!isLoaded)
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-50 rounded-lg border">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-slate-500">Inicializando Google Maps...</p>
        </div>
      )

    return <div ref={mapRef} className={className} />
  },
)

GoogleMap.displayName = 'GoogleMap'
