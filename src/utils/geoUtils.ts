import { MapDrawing, DrawingStyle, Lote, Project } from '@/types'

export const DEFAULT_STYLE: DrawingStyle = {
  strokeColor: '#2563eb',
  strokeWeight: 2,
  fillColor: '#2563eb',
  fillOpacity: 0.3,
  markerIcon: 'circle',
  markerSize: 1,
}

export function calculateArea(
  coordinates: { lat: number; lng: number }[],
): string {
  if (
    typeof window === 'undefined' ||
    !window.google?.maps?.geometry?.spherical
  )
    return '0 m²'
  const path = coordinates.map(
    (c) => new window.google.maps.LatLng(c.lat, c.lng),
  )
  const area = window.google.maps.geometry.spherical.computeArea(path)
  if (area > 10000) {
    return `${(area / 10000).toFixed(2)} ha`
  }
  return `${area.toFixed(2)} m²`
}

export function calculateLength(
  coordinates: { lat: number; lng: number }[],
): string {
  if (
    typeof window === 'undefined' ||
    !window.google?.maps?.geometry?.spherical
  )
    return '0 m'
  const path = coordinates.map(
    (c) => new window.google.maps.LatLng(c.lat, c.lng),
  )
  const length = window.google.maps.geometry.spherical.computeLength(path)
  if (length > 1000) {
    return `${(length / 1000).toFixed(2)} km`
  }
  return `${length.toFixed(2)} m`
}

export function exportToGeoJSON(drawings: MapDrawing[]): string {
  const features = drawings.map((d) => {
    let geometry: any
    if (d.type === 'marker') {
      geometry = {
        type: 'Point',
        coordinates: [d.coordinates.lng, d.coordinates.lat],
      }
    } else if (d.type === 'polyline') {
      geometry = {
        type: 'LineString',
        coordinates: d.coordinates.map((c: any) => [c.lng, c.lat]),
      }
    } else if (d.type === 'polygon') {
      const coords = d.coordinates.map((c: any) => [c.lng, c.lat])
      // Close polygon if needed
      if (
        coords.length > 0 &&
        (coords[0][0] !== coords[coords.length - 1][0] ||
          coords[0][1] !== coords[coords.length - 1][1])
      ) {
        coords.push(coords[0])
      }
      geometry = {
        type: 'Polygon',
        coordinates: [coords],
      }
    }

    return {
      type: 'Feature',
      id: d.id,
      properties: {
        notes: d.notes,
        style: d.style,
        layerId: d.layerId,
        createdAt: d.createdAt,
      },
      geometry,
    }
  })

  return JSON.stringify({ type: 'FeatureCollection', features }, null, 2)
}

export function exportToKML(drawings: MapDrawing[]): string {
  const convertColor = (hex: string, opacity: number = 1) => {
    if (!hex) return 'ff000000'
    let cleanHex = hex.replace('#', '')
    if (cleanHex.length === 3)
      cleanHex = cleanHex
        .split('')
        .map((c) => c + c)
        .join('')
    // KML uses AABBGGRR
    const r = cleanHex.substring(0, 2)
    const g = cleanHex.substring(2, 4)
    const b = cleanHex.substring(4, 6)
    const a = Math.floor(opacity * 255)
      .toString(16)
      .padStart(2, '0')
    return `${a}${b}${g}${r}`
  }

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Mapa REURB</name>`

  drawings.forEach((d) => {
    const style = d.style || DEFAULT_STYLE
    const strokeColor = convertColor(
      style.strokeColor || DEFAULT_STYLE.strokeColor,
      1,
    )
    const fillColor = convertColor(
      style.fillColor || DEFAULT_STYLE.fillColor,
      style.fillOpacity ?? DEFAULT_STYLE.fillOpacity,
    )
    const width = style.strokeWeight || DEFAULT_STYLE.strokeWeight

    let placemark = `
    <Placemark>
      <name>${d.notes || 'Sem título'}</name>
      <Style>
        <LineStyle>
          <color>${strokeColor}</color>
          <width>${width}</width>
        </LineStyle>
        <PolyStyle>
          <color>${fillColor}</color>
        </PolyStyle>
        ${d.type === 'marker' ? `<IconStyle><scale>${style.markerSize || 1}</scale></IconStyle>` : ''}
      </Style>`

    if (d.type === 'marker') {
      placemark += `
      <Point>
        <coordinates>${d.coordinates.lng},${d.coordinates.lat},0</coordinates>
      </Point>`
    } else if (d.type === 'polyline') {
      const coords = d.coordinates
        .map((c: any) => `${c.lng},${c.lat},0`)
        .join(' ')
      placemark += `
      <LineString>
        <coordinates>${coords}</coordinates>
      </LineString>`
    } else if (d.type === 'polygon') {
      const coords = d.coordinates
        .map((c: any) => `${c.lng},${c.lat},0`)
        .join(' ')
      // Ensure closure
      const first = d.coordinates[0]
      const last = d.coordinates[d.coordinates.length - 1]
      let closedCoords = coords
      if (
        d.coordinates.length > 0 &&
        (first.lat !== last.lat || first.lng !== last.lng)
      ) {
        closedCoords += ` ${first.lng},${first.lat},0`
      }

      placemark += `
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${closedCoords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>`
    }

    placemark += `
    </Placemark>`
    kml += placemark
  })

  kml += `
  </Document>
</kml>`

  return kml
}

export function importFromGeoJSON(json: string): MapDrawing[] {
  try {
    const parsed = JSON.parse(json)
    if (
      parsed.type !== 'FeatureCollection' ||
      !Array.isArray(parsed.features)
    ) {
      throw new Error('Formato GeoJSON inválido')
    }

    const drawings: MapDrawing[] = []

    parsed.features.forEach((f: any) => {
      const { geometry, properties, id } = f
      if (!geometry) return

      let type: 'marker' | 'polyline' | 'polygon' | undefined
      let coordinates: any

      if (geometry.type === 'Point') {
        type = 'marker'
        coordinates = {
          lat: geometry.coordinates[1],
          lng: geometry.coordinates[0],
        }
      } else if (geometry.type === 'LineString') {
        type = 'polyline'
        coordinates = geometry.coordinates.map((c: any) => ({
          lat: c[1],
          lng: c[0],
        }))
      } else if (geometry.type === 'Polygon') {
        type = 'polygon'
        // Handle first ring (exterior)
        coordinates = geometry.coordinates[0].map((c: any) => ({
          lat: c[1],
          lng: c[0],
        }))
        // Remove closing point if dup
        if (
          coordinates.length > 1 &&
          coordinates[0].lat === coordinates[coordinates.length - 1].lat &&
          coordinates[0].lng === coordinates[coordinates.length - 1].lng
        ) {
          coordinates.pop()
        }
      }

      if (type && coordinates) {
        // Robust style merging
        const importedStyle = properties?.style || {}
        const style: DrawingStyle = {
          strokeColor: importedStyle.strokeColor || DEFAULT_STYLE.strokeColor,
          strokeWeight:
            importedStyle.strokeWeight || DEFAULT_STYLE.strokeWeight,
          fillColor: importedStyle.fillColor || DEFAULT_STYLE.fillColor,
          fillOpacity: importedStyle.fillOpacity ?? DEFAULT_STYLE.fillOpacity,
          markerIcon: importedStyle.markerIcon || DEFAULT_STYLE.markerIcon,
          markerSize: importedStyle.markerSize || DEFAULT_STYLE.markerSize,
        }

        drawings.push({
          id: id || crypto.randomUUID(),
          type,
          coordinates,
          style,
          createdAt: properties?.createdAt || Date.now(),
          notes: properties?.notes,
          layerId: properties?.layerId || 'default_layer',
        })
      }
    })
    return drawings
  } catch (e) {
    console.error(e)
    throw e
  }
}

export function getBoundsCoordinates(
  lotes: Lote[],
  drawings: MapDrawing[],
  projects?: Project[],
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = []

  const parseCoord = (val: string | number | undefined) => {
    if (!val) return NaN
    const str = String(val).replace(',', '.')
    return parseFloat(str)
  }

  // Add Lotes Coordinates
  lotes.forEach((l) => {
    if (l.latitude && l.longitude) {
      const lat = parseCoord(l.latitude)
      const lng = parseCoord(l.longitude)
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        points.push({ lat, lng })
      }
    }
  })

  // Add Drawings Coordinates
  drawings.forEach((d) => {
    if (d.type === 'marker') {
      points.push(d.coordinates)
    } else if (Array.isArray(d.coordinates)) {
      d.coordinates.forEach((c: any) => points.push(c))
    }
  })

  // Add Project Coordinates (Crucial for User Story)
  if (projects) {
    projects.forEach((p) => {
      if (p.latitude && p.longitude) {
        const lat = parseCoord(p.latitude)
        const lng = parseCoord(p.longitude)
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          points.push({ lat, lng })
        }
      }
    })
  }

  return points
}
