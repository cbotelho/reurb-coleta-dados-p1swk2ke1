import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { CustomLayer, MapDrawing, DrawingStyle } from '@/types'
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
  selectionMode = null,
  onDrawingComplete,
  onDrawingUpdate,
  onDrawingSelect,
  fullscreenControl = true,
  drawingStyle = {
    strokeColor: '#2563eb',
    strokeWeight: 2,
    fillColor: '#2563eb',
    fillOpacity: 0.3,
    markerIcon: 'circle',
    markerSize: 1,
  },
  editMode = false,
  selectedDrawingIds = [],
  presentationMode = false,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markersRef = useRef<any[]>([])
  const drawingManagerRef = useRef<any>(null)
  const drawnShapesRef = useRef<Map<string, any>>(new Map())
  const customLayerFeaturesRef = useRef<Map<string, any[]>>(new Map())
  const infoWindowRef = useRef<any>(null)

  // Selection Rect
  const selectionRectRef = useRef<any>(null)

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
              // Presentation mode: Simplified style
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

      // Box selection style
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
            drawingStyle.markerIcon,
            drawingStyle.fillColor,
            drawingStyle.markerSize,
          ),
        },
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

      // If selected, maybe highlight stroke?
      const strokeColor = isSelected ? '#ef4444' : d.style.strokeColor

      if (!shape) {
        // Create new shape
        if (d.type === 'marker') {
          shape = new window.google.maps.Marker({
            position: d.coordinates,
            map: map,
            ...baseOptions,
            icon: getGoogleIconSymbol(
              d.style.markerIcon || 'circle',
              d.style.fillColor,
              d.style.markerSize || 1,
            ),
          })
        } else if (d.type === 'polygon') {
          shape = new window.google.maps.Polygon({
            paths: d.coordinates,
            map: map,
            ...baseOptions,
            fillColor: d.style.fillColor,
            fillOpacity: d.style.fillOpacity,
            strokeColor: strokeColor,
            strokeWeight: isSelected
              ? (d.style.strokeWeight || 2) + 2
              : d.style.strokeWeight,
          })
        } else if (d.type === 'polyline') {
          shape = new window.google.maps.Polyline({
            path: d.coordinates,
            map: map,
            ...baseOptions,
            strokeColor: strokeColor,
            strokeWeight: isSelected
              ? (d.style.strokeWeight || 2) + 2
              : d.style.strokeWeight,
          })
        }

        // Event Listeners
        if (!presentationMode) {
          shape.addListener('click', (e: any) => {
            // Handle multi-select with shift/ctrl if needed, or just simple toggle
            // For now, simpler: just select this one or add to selection if implemented upstream
            // But we pass list of IDs.
            // If ctrl key pressed (event.domEvent not always avail here easily w/o extending wrapper)
            // Let's assume onDrawingSelect handles replacement.
            if (onDrawingSelect) {
              // Check if we are toggling
              // Native maps click event doesn't pass keyboard modifiers easily in 3.x without accessing .va or similar internal
              // We'll rely on simple selection for click.
              onDrawingSelect([d.id])
            }
          })

          // Hover effects for notes
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

          // Drag Events
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
        // Update existing shape options
        if (d.type === 'marker') {
          shape.setOptions({
            ...baseOptions,
            icon: getGoogleIconSymbol(
              d.style.markerIcon || 'circle',
              d.style.fillColor,
              d.style.markerSize || 1,
            ),
          })
          shape.setPosition(d.coordinates)
          shape.setTitle(d.notes || '')
        } else {
          shape.setOptions({
            ...baseOptions,
            fillColor: d.style.fillColor,
            fillOpacity: d.style.fillOpacity,
            strokeColor: strokeColor,
            strokeWeight: isSelected
              ? (d.style.strokeWeight || 2) + 2
              : d.style.strokeWeight,
          })
          // Update paths if changed externally (rare in this app, usually sync)
          if (d.type === 'polygon') {
            // shape.setPaths(d.coordinates) // Expensive re-render, do only if needed
          }
        }

        // Update freshness of notes for hover
        // (Similar to previous logic, simplified here)
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

      if (presentationMode) return // Hide operational markers in presentation? Or maybe show them but prettier?
      // Requirement: "highlight key geographical features for storytelling" -> user drawings.
      // Operational markers (lotes) might distract, or be vital. Let's keep them but maybe optional.
      // For now, keep them.

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
        // We could store style in CustomLayer too, for now generate deterministic color
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
}
