import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

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

interface CustomLayer {
  id: string
  data: any
  visible: boolean
}

interface GoogleMapProps {
  apiKey: string
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Marker[]
  customLayers?: CustomLayer[]
  className?: string
  onMarkerClick?: (marker: Marker) => void
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
}

export function GoogleMap({
  apiKey,
  center,
  zoom = 15,
  markers = [],
  customLayers = [],
  className = '',
  onMarkerClick,
  mapType = 'roadmap',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const markersRef = useRef<any[]>([])

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

    // Load script
    if (apiKey) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      script.onerror = () => setError('Falha ao carregar o Google Maps SDK.')
      document.head.appendChild(script)
    } else {
      setError('API Key não configurada.')
    }

    return () => {
      // Clean up if component unmounts before load (optional, usually we keep the script)
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
      })
      setMap(gMap)
    }
  }, [isLoaded, mapRef]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update Center & Map Type
  useEffect(() => {
    if (map) {
      if (center) {
        map.setCenter(center)
      }
      if (mapType) {
        map.setMapTypeId(mapType)
      }
    }
  }, [map, center, mapType])

  // Update Markers
  useEffect(() => {
    if (map) {
      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []

      // Add new markers
      const bounds = new window.google.maps.LatLngBounds()
      let hasValidMarker = false

      markers.forEach((markerData) => {
        const marker = new window.google.maps.Marker({
          position: { lat: markerData.lat, lng: markerData.lng },
          map: map,
          title: markerData.title,
          icon: getMarkerIcon(markerData.status, markerData.color),
        })

        if (onMarkerClick) {
          marker.addListener('click', () => onMarkerClick(markerData))
        }

        markersRef.current.push(marker)
        bounds.extend(marker.getPosition())
        hasValidMarker = true
      })

      // If no explicit center provided, fit bounds
      if (!center && hasValidMarker) {
        map.fitBounds(bounds)
      }
    }
  }, [map, markers, onMarkerClick, center])

  // Handle Custom Layers
  useEffect(() => {
    if (map && customLayers) {
      // Reset Data Layers - simplistic approach, remove all features then add visible ones
      // In prod, we'd manage by ID, but Data layer is global for the map instance usually
      // unless we instantiate multiple Data layers (which is possible).
      // For simplicity, we use map.data and clear/add.
      map.data.forEach((feature: any) => {
        map.data.remove(feature)
      })

      customLayers.forEach((layer) => {
        if (layer.visible && layer.data) {
          map.data.addGeoJson(layer.data)
        }
      })

      // Style Data Layer
      map.data.setStyle((feature: any) => {
        return {
          fillColor: 'blue',
          strokeColor: 'blue',
          strokeWeight: 2,
        }
      })
    }
  }, [map, customLayers])

  const getMarkerIcon = (status?: string, customColor?: string) => {
    let color = customColor || 'red'
    if (!customColor) {
      if (status === 'synchronized') color = 'green'
      if (status === 'pending') color = 'orange'
      if (status === 'failed') color = 'red'
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
    }
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
