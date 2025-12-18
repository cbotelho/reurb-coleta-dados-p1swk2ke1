import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Loader2 } from 'lucide-react'
import { CustomLayer, MapDrawing, DrawingStyle, MarkerIconType } from '@/types'
import { getGoogleIconSymbol } from '@/utils/mapIcons'

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
}

export interface GoogleMapHandle {
  fitBounds: (points: { lat: number; lng: number }[]) => void
}

interface GoogleMapProps {
  apiKey: string
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Marker[]
  customLayers?: CustomLayer[]
  drawings?: MapDrawing[]
  className?: string
  onMarkerClick?: (marker: Marker) => void
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

export const GoogleMap = forwardRef<GoogleMapHandle, GoogleMapProps>(
  (
    {
      apiKey,
      center,
      zoom = 15,
      markers = [],
      customLayers = [],
      drawings = [],
      className = '',
      onMarkerClick,
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
      onMapLoad,
    },
    ref,
  ) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<any>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const markersRef = useRef<any[]>([])
    const drawingManagerRef = useRef<any>(null)
    const drawnShapesRef = useRef<Map<string, any>>(new Map())
    const customLayerFeaturesRef = useRef<Map<string, any[]>>(new Map())
    const infoWindowRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      fitBounds: (points) => {
        if (!map || !window.google || points.length === 0) return
        const bounds = new window.google.maps.LatLngBounds()
        points.forEach((p) => bounds.extend(p))
        map.fitBounds(bounds)
      },
    }))

    // Load API
    useEffect(() => {
      if (window.google && window.google.maps) {
        setIsLoaded(true)
        return
      }
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]',
      )
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true))
        return
      }
      if (apiKey) {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,drawing`
        script.async = true
        script.defer = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () => setError('Falha ao carregar o Google Maps SDK.')
        document.head.appendChild(script)
      } else {
        setError('API Key não configurada.')
      }
    }, [apiKey])

    // Init Map
    useEffect(() => {
      if (isLoaded && mapRef.current && !map) {
        const gMap = new window.google.maps.Map(mapRef.current, {
          center: center || { lat: 0, lng: 0 },
          zoom,
          mapTypeId: mapType,
          streetViewControl: false,
          fullscreenControl: fullscreenControl && !presentationMode,
          zoomControl: !presentationMode,
          mapTypeControl: !presentationMode,
          fullscreenControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP,
          },
          styles: presentationMode
            ? [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
                {
                  featureType: 'transit',
                  stylers: [{ visibility: 'off' }],
                },
              ]
            : [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
              ],
        })
        setMap(gMap)
        infoWindowRef.current = new window.google.maps.InfoWindow({
          disableAutoPan: true,
        })
        if (onMapLoad) onMapLoad(gMap)
      }
    }, [
      isLoaded,
      mapRef,
      map,
      center,
      zoom,
      mapType,
      fullscreenControl,
      presentationMode,
      onMapLoad,
    ])

    // Drawing Manager
    useEffect(() => {
      if (map && window.google) {
        if (!drawingManagerRef.current) {
          const dm = new window.google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: false,
          })
          dm.setMap(map)

          window.google.maps.event.addListener(
            dm,
            'overlaycomplete',
            (event: any) => {
              const { type, overlay } = event

              // Handle Selection Box
              if (type === 'rectangle' && selectionMode === 'box') {
                const bounds = overlay.getBounds()

                // Find intersections
                const selectedIds: string[] = []

                drawnShapesRef.current.forEach((shape, id) => {
                  let isInside = false

                  if (shape.getPosition) {
                    // Marker
                    isInside = bounds.contains(shape.getPosition())
                  } else if (shape.getPath) {
                    // Polyline / Polygon
                    // Check if any point is inside
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
                overlay.setMap(null) // Remove selection box
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

              overlay.setMap(null) // Remove and let React render it

              if (onDrawingComplete && !selectionMode) {
                onDrawingComplete({ type, coordinates: coords })
              }
            },
          )
          drawingManagerRef.current = dm
        }
      }
    }, [map, onDrawingComplete, selectionMode, onDrawingSelect])

    // Update Drawing Manager Options (Style & Mode)
    useEffect(() => {
      if (drawingManagerRef.current) {
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
    }, [drawingMode, drawingStyle, selectionMode])

    // Update Map Properties
    useEffect(() => {
      if (map) {
        if (
          center &&
          (Math.abs(map.getCenter().lat() - center.lat) > 0.0001 ||
            Math.abs(map.getCenter().lng() - center.lng) > 0.0001)
        ) {
          map.panTo(center)
        }
        if (mapType) map.setMapTypeId(mapType)
        map.setOptions({
          fullscreenControl: fullscreenControl && !presentationMode,
          zoomControl: !presentationMode,
          mapTypeControl: !presentationMode,
          disableDefaultUI: presentationMode,
        })
      }
    }, [map, center, mapType, fullscreenControl, presentationMode])

    // Render Drawings (Sync)
    useEffect(() => {
      if (!map || !drawings) return

      const existingIds = new Set(drawnShapesRef.current.keys())
      const currentIds = new Set(drawings.map((d) => d.id))

      // Remove deleted
      existingIds.forEach((id) => {
        if (!currentIds.has(id)) {
          const shape = drawnShapesRef.current.get(id)
          window.google.maps.event.clearInstanceListeners(shape)
          shape.setMap(null)
          drawnShapesRef.current.delete(id)
        }
      })

      // Add or Update
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

          if (!presentationMode) {
            shape.addListener('click', () => {
              if (onDrawingSelect) {
                onDrawingSelect([d.id])
              }
            })

            if (d.type !== 'marker') {
              shape.addListener('mouseover', (e: any) => {
                if (d.notes) {
                  infoWindowRef.current.setContent(
                    `<div style="padding: 5px; font-size: 12px; color: #000;">${d.notes}</div>`,
                  )
                  infoWindowRef.current.setPosition(e.latLng)
                  infoWindowRef.current.open(map)
                }
              })
              shape.addListener('mouseout', () => {
                infoWindowRef.current.close()
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

          drawnShapesRef.current.set(d.id, shape)
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

          shape.set('notes', d.notes)
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
    ])

    // Markers Rendering
    useEffect(() => {
      if (map) {
        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []

        if (presentationMode) return

        const markersToRender =
          markers.length > 2000 ? markers.slice(0, 2000) : markers

        markersToRender.forEach((markerData) => {
          const marker = new window.google.maps.Marker({
            position: { lat: markerData.lat, lng: markerData.lng },
            map: map,
            title: markerData.title,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: markerData.color || 'red',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 1,
            },
            optimized: true,
            clickable: !presentationMode,
          })
          if (onMarkerClick && !presentationMode)
            marker.addListener('click', () => onMarkerClick(markerData))
          markersRef.current.push(marker)
        })
      }
    }, [map, markers, onMarkerClick, presentationMode])

    // Custom Layers
    useEffect(() => {
      if (map && customLayers) {
        customLayerFeaturesRef.current.forEach((features) => {
          features.forEach((f) => map.data.remove(f))
        })
        customLayerFeaturesRef.current.clear()

        const sortedLayers = [...customLayers].sort(
          (a, b) => a.zIndex - b.zIndex,
        )
        sortedLayers.forEach((layer) => {
          if (layer.visible && layer.data) {
            const features = map.data.addGeoJson(layer.data)
            features.forEach((f: any) => f.setProperty('layerId', layer.id))
            customLayerFeaturesRef.current.set(layer.id, features)
          }
        })

        map.data.setStyle((feature: any) => {
          const layerId = feature.getProperty('layerId')
          const layer = customLayers.find((l) => l.id === layerId)
          const color = '#' + (layerId || '000000').slice(0, 6)

          return {
            fillColor: color,
            strokeColor: color,
            strokeWeight: 1,
            fillOpacity: 0.3,
            zIndex: layer ? layer.zIndex : 1,
            visible: layer ? layer.visible : true,
            clickable: !presentationMode,
          }
        })
      }
    }, [map, customLayers, presentationMode])

    if (error)
      return (
        <div className="flex items-center justify-center h-full bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error}
        </div>
      )
    if (!isLoaded)
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg border">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )

    return <div ref={mapRef} className={className} />
  },
)

GoogleMap.displayName = 'GoogleMap'
