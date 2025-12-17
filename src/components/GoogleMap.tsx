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
}

interface GoogleMapProps {
  apiKey: string
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Marker[]
  className?: string
  onMarkerClick?: (marker: Marker) => void
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
}

export function GoogleMap({
  apiKey,
  center,
  zoom = 15,
  markers = [],
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
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => setError('Falha ao carregar o Google Maps SDK.')
    document.head.appendChild(script)

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
          icon: getMarkerIcon(markerData.status),
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

  const getMarkerIcon = (status?: string) => {
    // Return colored pins based on status using Google Charts API or similar for custom pins
    // Or standard pins with different colors if available.
    // Simpler: use standard red pin for now, or use SVGs.
    // Using standard Google Maps pins, they are red.
    // We can use symbols.
    let color = 'red'
    if (status === 'synchronized') color = 'green'
    if (status === 'pending') color = 'orange'
    if (status === 'failed') color = 'red'

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
