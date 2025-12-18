import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Loader2 } from 'lucide-react'
import { CustomLayer, MapDrawing, DrawingStyle, MarkerIconType } from '@/types'
import {
  getGoogleIconSymbol,
  createAdvancedMarkerContent,
} from '@/utils/mapIcons'

declare global {
  interface Window {
    google: any
    initMap?: () => void
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
      mapId,
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

    // References to map objects
    const markersRef = useRef<any[]>([])
    const drawingManagerRef = useRef<any>(null)
    const drawnShapesRef = useRef<Map<string, any>>(new Map())
    const customLayerFeaturesRef = useRef<Map<string, any[]>>(new Map())
    const infoWindowRef = useRef<any>(null)
    const googleRef = useRef<any>(null)

    // Classes needed for Advanced Markers
    const AdvancedMarkerElementRef = useRef<any>(null)
    const PinElementRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      fitBounds: (points) => {
        if (!map || !googleRef.current || points.length === 0) return
        const bounds = new googleRef.current.maps.LatLngBounds()
        points.forEach((p) => bounds.extend(p))
        map.fitBounds(bounds)
      },
    }))

    // Load API using Async Pattern with ImportLibrary
    useEffect(() => {
      if (!apiKey) {
        setError('API Key não configurada.')
        return
      }

      if (window.google && window.google.maps) {
        googleRef.current = window.google
        loadLibraries().then(() => setIsLoaded(true))
        return
      }

      // Check for existing script to avoid duplicates
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]',
      )

      if (existingScript) {
        // Wait for it to load
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogle)
            googleRef.current = window.google
            loadLibraries().then(() => setIsLoaded(true))
          }
        }, 100)
        return
      }

      const script = document.createElement('script')
      // Ensure we request the necessary libraries
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=geometry,drawing,marker`
      script.async = true
      script.defer = true
      script.onerror = () => setError('Falha ao carregar o Google Maps SDK.')

      // Define callback
      window.initMap = () => {
        googleRef.current = window.google
        loadLibraries().then(() => setIsLoaded(true))
      }
      // Although loading=async often works without callback if we poll or use promises,
      // appending callback param is safer for the legacy script tag method if used mixed.
      // But standard async loading just needs us to wait for window.google
      script.onload = () => {
        // Just in case initMap isn't called automatically by some weird conflict
        if (window.google && window.google.maps) {
          googleRef.current = window.google
          loadLibraries().then(() => setIsLoaded(true))
        }
      }

      document.head.appendChild(script)

      return () => {
        // Cleanup if needed
      }
    }, [apiKey])

    const loadLibraries = async () => {
      if (!googleRef.current) return

      // Load Advanced Marker Library
      try {
        const { AdvancedMarkerElement, PinElement } =
          await googleRef.current.maps.importLibrary('marker')
        AdvancedMarkerElementRef.current = AdvancedMarkerElement
        PinElementRef.current = PinElement
      } catch (e) {
        console.warn('Advanced Markers library failed to load', e)
      }
    }

    // Init Map
    useEffect(() => {
      if (isLoaded && mapRef.current && !map && googleRef.current) {
        const mapOptions: any = {
          center: center || { lat: 0, lng: 0 },
          zoom,
          mapTypeId: mapType,
          streetViewControl: false,
          fullscreenControl: fullscreenControl && !presentationMode,
          zoomControl: !presentationMode,
          mapTypeControl: !presentationMode,
          fullscreenControlOptions: {
            position: googleRef.current.maps.ControlPosition.RIGHT_TOP,
          },
          // Map ID is required for Advanced Markers
          mapId: mapId || undefined,
        }

        const gMap = new googleRef.current.maps.Map(mapRef.current, mapOptions)
        setMap(gMap)

        infoWindowRef.current = new googleRef.current.maps.InfoWindow({
          disableAutoPan: true,
        })

        if (onMapLoad) onMapLoad(gMap)
      }
    }, [
      isLoaded,
      mapId,
      map,
      center,
      zoom,
      mapType,
      fullscreenControl,
      presentationMode,
      onMapLoad,
    ])

    // Update Map Options
    useEffect(() => {
      if (map) {
        map.setOptions({
          mapTypeId: mapType,
          fullscreenControl: fullscreenControl && !presentationMode,
          zoomControl: !presentationMode,
          mapTypeControl: !presentationMode,
          disableDefaultUI: presentationMode,
        })
        if (center) {
          // Only pan if significant difference to avoid jitters
          const c = map.getCenter()
          if (
            Math.abs(c.lat() - center.lat) > 0.0001 ||
            Math.abs(c.lng() - center.lng) > 0.0001
          ) {
            map.panTo(center)
            map.setZoom(zoom) // Enforce zoom on explicit center change from search
          }
        }
      }
    }, [map, mapType, fullscreenControl, presentationMode, center, zoom])

    // Render Markers (Using AdvancedMarkerElement if available)
    useEffect(() => {
      if (!map || !googleRef.current) return

      // Clear existing
      markersRef.current.forEach((m) => {
        if (m.map) m.map = null
      })
      markersRef.current = []

      if (presentationMode) return

      const markersToRender =
        markers.length > 2000 ? markers.slice(0, 2000) : markers

      markersToRender.forEach((markerData) => {
        let markerInstance

        // Use Advanced Marker if library loaded and Map ID present
        if (AdvancedMarkerElementRef.current && mapId) {
          const AdvancedMarkerElement = AdvancedMarkerElementRef.current
          // const PinElement = PinElementRef.current;

          // Build custom content for the marker
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
              path: googleRef.current.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: markerData.color || 'red',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 1,
            }
          }

          markerInstance = new googleRef.current.maps.Marker({
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
    }, [map, markers, mapId, onMarkerClick, presentationMode])

    // Drawing Manager (Legacy mostly, but works with Map)
    useEffect(() => {
      if (map && googleRef.current && !drawingManagerRef.current) {
        const dm = new googleRef.current.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
        })
        dm.setMap(map)

        googleRef.current.maps.event.addListener(
          dm,
          'overlaycomplete',
          (event: any) => {
            const { type, overlay } = event

            if (type === 'rectangle' && selectionMode === 'box') {
              const bounds = overlay.getBounds()
              const selectedIds: string[] = []

              drawnShapesRef.current.forEach((shape, id) => {
                let isInside = false
                // Check marker position
                if (
                  shape.position ||
                  (shape.getPosition && shape.getPosition())
                ) {
                  const pos = shape.position || shape.getPosition()
                  isInside = bounds.contains(pos)
                }
                // Check poly path
                else if (shape.getPath) {
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
    }, [map, onDrawingComplete, selectionMode, onDrawingSelect])

    // Update Drawing Mode & Styles
    useEffect(() => {
      if (drawingManagerRef.current && googleRef.current) {
        const dm = drawingManagerRef.current
        let effectiveMode = null
        if (drawingMode) {
          effectiveMode =
            googleRef.current.maps.drawing.OverlayType[
              drawingMode.toUpperCase()
            ]
        } else if (selectionMode === 'box') {
          effectiveMode = googleRef.current.maps.drawing.OverlayType.RECTANGLE
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

    // Render User Drawings (Using Legacy Markers for Editable Drawings for now, or Custom Overlay)
    // Note: AdvancedMarkerElement is not fully editable (draggable yes, but DrawingManager integration is limited)
    // So we stick to legacy for drawings to ensure "fully functional" editing.
    useEffect(() => {
      if (!map || !drawings || !googleRef.current) return

      const existingIds = new Set(drawnShapesRef.current.keys())
      const currentIds = new Set(drawings.map((d) => d.id))

      existingIds.forEach((id) => {
        if (!currentIds.has(id)) {
          const shape = drawnShapesRef.current.get(id)
          googleRef.current.maps.event.clearInstanceListeners(shape)
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
            shape = new googleRef.current.maps.Marker({
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
            shape = new googleRef.current.maps.Polygon({
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
            shape = new googleRef.current.maps.Polyline({
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
    ])

    if (error)
      return (
        <div className="flex items-center justify-center h-full bg-red-50 text-red-600 rounded-lg border border-red-200 p-4">
          <div className="text-center">
            <p className="font-semibold">Erro ao carregar mapa</p>
            <p className="text-sm">{error}</p>
          </div>
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
