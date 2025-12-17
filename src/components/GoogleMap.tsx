import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CustomLayer, MapDrawing } from '@/types'

// Define Window interface to include google
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
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs to track map objects and avoid aggressive re-rendering
  const markersRef = useRef<any[]>([])
  const drawingManagerRef = useRef<any>(null)
  const drawnShapesRef = useRef<any[]>([])
  const customLayerFeaturesRef = useRef<Map<string, any[]>>(new Map())

  useEffect(() => {
    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // Check if script is being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]',
    )
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true))
      return
    }

    // Load script with drawing library
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

  // Initialize Map
  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const gMap = new window.google.maps.Map(mapRef.current, {
        center: center || { lat: 0, lng: 0 },
        zoom,
        mapTypeId: mapType,
        streetViewControl: false,
        fullscreenControl: true,
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
  }, [isLoaded, mapRef]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize Drawing Manager
  useEffect(() => {
    if (map && window.google) {
      if (!drawingManagerRef.current) {
        const dm = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          markerOptions: { draggable: true },
          polygonOptions: {
            editable: true,
            draggable: true,
            fillColor: '#2563eb',
            strokeColor: '#2563eb',
          },
          polylineOptions: {
            editable: true,
            draggable: true,
            strokeColor: '#2563eb',
          },
        })
        dm.setMap(map)

        window.google.maps.event.addListener(
          dm,
          'overlaycomplete',
          (event: any) => {
            if (onDrawingComplete) {
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

              // Remove from map as it will be re-added via props
              overlay.setMap(null)

              onDrawingComplete({
                type,
                coordinates: coords,
              })
            }
          },
        )

        drawingManagerRef.current = dm
      }
    }
  }, [map, onDrawingComplete])

  // Update Drawing Mode
  useEffect(() => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(
        drawingMode
          ? window.google.maps.drawing.OverlayType[drawingMode.toUpperCase()]
          : null,
      )
    }
  }, [drawingMode])

  // Update Center & Map Type
  useEffect(() => {
    if (map) {
      if (center) {
        // Only pan if distance is significant to avoid jitter
        const current = map.getCenter()
        if (
          !current ||
          Math.abs(current.lat() - center.lat) > 0.0001 ||
          Math.abs(current.lng() - center.lng) > 0.0001
        ) {
          map.panTo(center)
        }
      }
      if (mapType) {
        map.setMapTypeId(mapType)
      }
    }
  }, [map, center, mapType])

  // Efficient Marker Updates
  useEffect(() => {
    if (map) {
      // Basic optimization: Clear all only if count differs significantly or force refresh needed.
      // For simplicity in this iteration, we clear but using a batch operation approach.
      // Ideally we would diff, but 'markers' prop changes usually imply a filter/search change.

      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []

      const bounds = new window.google.maps.LatLngBounds()
      let hasValidMarker = false

      // Limit rendered markers for performance if too many
      const markersToRender =
        markers.length > 2000 ? markers.slice(0, 2000) : markers

      markersToRender.forEach((markerData) => {
        const marker = new window.google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: map,
          title: markerData.title,
          icon: getMarkerIcon(markerData.status, markerData.color),
          optimized: true, // Use canvas rendering
        })

        if (onMarkerClick) {
          marker.addListener('click', () => onMarkerClick(markerData))
        }

        markersRef.current.push(marker)
        bounds.extend(marker.getPosition())
        hasValidMarker = true
      })
    }
  }, [map, markers, onMarkerClick])

  // Handle Custom Layers
  useEffect(() => {
    if (map && customLayers) {
      // Clear existing custom layers
      customLayerFeaturesRef.current.forEach((features) => {
        features.forEach((f) => map.data.remove(f))
      })
      customLayerFeaturesRef.current.clear()

      // Sort by zIndex
      const sortedLayers = [...customLayers].sort((a, b) => a.zIndex - b.zIndex)

      sortedLayers.forEach((layer) => {
        if (layer.visible && layer.data) {
          const features = map.data.addGeoJson(layer.data)

          // Tag features with layer ID for styling
          features.forEach((f: any) => f.setProperty('layerId', layer.id))

          customLayerFeaturesRef.current.set(layer.id, features)
        }
      })

      // Global Style Function
      map.data.setStyle((feature: any) => {
        const layerId = feature.getProperty('layerId')
        // We could lookup layer specific color here if we had it in CustomLayer
        // For now, generate a stable color based on ID string
        const color = stringToColor(layerId || 'default')

        return {
          fillColor: color,
          strokeColor: color,
          strokeWeight: 2,
          fillOpacity: 0.3,
          zIndex: 1, // Default zIndex for data layer
        }
      })
    }
  }, [map, customLayers])

  // Render Saved Drawings
  useEffect(() => {
    if (map && drawings) {
      // Clear existing drawings
      drawnShapesRef.current.forEach((shape) => shape.setMap(null))
      drawnShapesRef.current = []

      drawings.forEach((drawing) => {
        let shape: any

        if (drawing.type === 'marker') {
          shape = new window.google.maps.Marker({
            position: drawing.coordinates,
            map: map,
            draggable: false, // Saved drawings are static in view mode
          })
        } else if (drawing.type === 'polygon') {
          shape = new window.google.maps.Polygon({
            paths: drawing.coordinates,
            map: map,
            editable: false,
            fillColor: '#2563eb',
            fillOpacity: 0.3,
            strokeColor: '#2563eb',
            strokeWeight: 2,
          })
        } else if (drawing.type === 'polyline') {
          shape = new window.google.maps.Polyline({
            path: drawing.coordinates,
            map: map,
            editable: false,
            strokeColor: '#2563eb',
            strokeWeight: 2,
          })
        }

        if (shape) {
          drawnShapesRef.current.push(shape)
        }
      })
    }
  }, [map, drawings])

  const getMarkerIcon = (status?: string, customColor?: string) => {
    let color = customColor || 'red'
    if (!customColor) {
      if (status === 'synchronized') color = 'green'
      if (status === 'pending') color = 'orange'
      if (status === 'failed') color = 'red'
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 1,
    }
  }

  // Helper to generate consistent colors
  const stringToColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    let color = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      color += ('00' + value.toString(16)).substr(-2)
    }
    return color
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 text-red-600 rounded-lg border border-red-200">
        <p>{error}</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div ref={mapRef} className={`w-full h-full rounded-lg ${className}`} />
  )
}
