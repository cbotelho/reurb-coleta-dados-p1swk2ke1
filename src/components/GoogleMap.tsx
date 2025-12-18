import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CustomLayer, MapDrawing, DrawingStyle } from '@/types'

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
  drawingMode?: 'marker' | 'polygon' | 'polyline' | null
  onDrawingComplete?: (drawing: any) => void
  onDrawingUpdate?: (id: string, coordinates: any) => void
  onDrawingSelect?: (id: string | null) => void
  fullscreenControl?: boolean
  drawingStyle?: DrawingStyle
  editMode?: boolean
  selectedDrawingId?: string | null
}

export function GoogleMap({
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
  onDrawingComplete,
  onDrawingUpdate,
  onDrawingSelect,
  fullscreenControl = true,
  drawingStyle = {
    strokeColor: '#2563eb',
    strokeWeight: 2,
    fillColor: '#2563eb',
    fillOpacity: 0.3,
  },
  editMode = false,
  selectedDrawingId = null,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markersRef = useRef<any[]>([])
  const drawingManagerRef = useRef<any>(null)
  const drawnShapesRef = useRef<Map<string, any>>(new Map())
  const customLayerFeaturesRef = useRef<Map<string, any[]>>(new Map())

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
        fullscreenControl: fullscreenControl,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      })
      setMap(gMap)
    }
  }, [isLoaded, mapRef, map, center, zoom, mapType, fullscreenControl])

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

            if (onDrawingComplete) {
              onDrawingComplete({ type, coordinates: coords })
            }
          },
        )
        drawingManagerRef.current = dm
      }
    }
  }, [map, onDrawingComplete])

  // Update Drawing Manager Options (Style & Mode)
  useEffect(() => {
    if (drawingManagerRef.current) {
      const dm = drawingManagerRef.current
      dm.setDrawingMode(
        drawingMode
          ? window.google.maps.drawing.OverlayType[drawingMode.toUpperCase()]
          : null,
      )

      const commonOptions = {
        editable: true,
        draggable: true,
      }

      dm.setOptions({
        markerOptions: { ...commonOptions },
        polygonOptions: {
          ...commonOptions,
          fillColor: drawingStyle.fillColor,
          fillOpacity: drawingStyle.fillOpacity,
          strokeColor: drawingStyle.strokeColor,
          strokeWeight: drawingStyle.strokeWeight,
        },
        polylineOptions: {
          ...commonOptions,
          strokeColor: drawingStyle.strokeColor,
          strokeWeight: drawingStyle.strokeWeight,
        },
      })
    }
  }, [drawingMode, drawingStyle])

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
      map.setOptions({ fullscreenControl })
    }
  }, [map, center, mapType, fullscreenControl])

  // Render Drawings (Sync)
  useEffect(() => {
    if (!map || !drawings) return

    const existingIds = new Set(drawnShapesRef.current.keys())
    const currentIds = new Set(drawings.map((d) => d.id))

    // Remove deleted
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        drawnShapesRef.current.get(id).setMap(null)
        drawnShapesRef.current.delete(id)
      }
    })

    // Add or Update
    drawings.forEach((d) => {
      const isSelected = selectedDrawingId === d.id
      const isEditable = editMode && isSelected
      let shape = drawnShapesRef.current.get(d.id)

      const shapeOptions = {
        editable: isEditable,
        draggable: isEditable,
        fillColor: d.style.fillColor,
        fillOpacity: d.style.fillOpacity,
        strokeColor: d.style.strokeColor,
        strokeWeight: d.style.strokeWeight,
        clickable: true,
        zIndex: isSelected ? 100 : 1,
      }

      if (!shape) {
        // Create new shape
        if (d.type === 'marker') {
          shape = new window.google.maps.Marker({
            position: d.coordinates,
            map: map,
            ...shapeOptions,
          })
        } else if (d.type === 'polygon') {
          shape = new window.google.maps.Polygon({
            paths: d.coordinates,
            map: map,
            ...shapeOptions,
          })
        } else if (d.type === 'polyline') {
          shape = new window.google.maps.Polyline({
            path: d.coordinates,
            map: map,
            ...shapeOptions,
          })
        }

        // Event Listeners
        shape.addListener('click', () => {
          if (onDrawingSelect) onDrawingSelect(d.id)
        })

        if (d.type === 'marker') {
          shape.addListener('dragend', () => {
            const pos = shape.getPosition()
            if (onDrawingUpdate)
              onDrawingUpdate(d.id, { lat: pos.lat(), lng: pos.lng() })
          })
        } else {
          // Polygon/Polyline editing events
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

        drawnShapesRef.current.set(d.id, shape)
      } else {
        // Update existing shape options
        shape.setOptions(shapeOptions)
      }
    })
  }, [
    map,
    drawings,
    editMode,
    selectedDrawingId,
    onDrawingUpdate,
    onDrawingSelect,
  ])

  // Markers Rendering
  useEffect(() => {
    if (map) {
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []

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
        })
        if (onMarkerClick)
          marker.addListener('click', () => onMarkerClick(markerData))
        markersRef.current.push(marker)
      })
    }
  }, [map, markers, onMarkerClick])

  // Custom Layers
  useEffect(() => {
    if (map && customLayers) {
      customLayerFeaturesRef.current.forEach((features) => {
        features.forEach((f) => map.data.remove(f))
      })
      customLayerFeaturesRef.current.clear()

      const sortedLayers = [...customLayers].sort((a, b) => a.zIndex - b.zIndex)
      sortedLayers.forEach((layer) => {
        if (layer.visible && layer.data) {
          const features = map.data.addGeoJson(layer.data)
          features.forEach((f: any) => f.setProperty('layerId', layer.id))
          customLayerFeaturesRef.current.set(layer.id, features)
        }
      })

      map.data.setStyle((feature: any) => {
        const layerId = feature.getProperty('layerId')
        const color = '#' + layerId.slice(0, 6) // simple deterministic color
        return {
          fillColor: color,
          strokeColor: color,
          strokeWeight: 2,
          fillOpacity: 0.3,
          zIndex: 1,
        }
      })
    }
  }, [map, customLayers])

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

  return (
    <div ref={mapRef} className={`w-full h-full rounded-lg ${className}`} />
  )
}
