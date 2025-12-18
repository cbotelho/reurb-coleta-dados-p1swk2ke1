import { MapDrawing } from '@/types'

// Simple buffer implementation for Points
// Returns a new Polygon-like drawing representing a circle
export function createPointBuffer(
  center: { lat: number; lng: number },
  radiusMeters: number,
  points: number = 64,
): { lat: number; lng: number }[] {
  const km = radiusMeters / 1000
  const kx = Math.cos((Math.PI * center.lat) / 180) * 111.32
  const ky = 110.574

  const coordinates: { lat: number; lng: number }[] = []

  for (let i = 0; i < points; i++) {
    const theta = (Math.PI * 2 * i) / points
    const dx = Math.cos(theta) * km
    const dy = Math.sin(theta) * km

    coordinates.push({
      lat: center.lat + dy / ky,
      lng: center.lng + dx / kx,
    })
  }
  // Close the loop
  coordinates.push(coordinates[0])

  return coordinates
}

// Check bounding box overlap
export function checkBoundingBoxOverlap(
  poly1: { lat: number; lng: number }[],
  poly2: { lat: number; lng: number }[],
): boolean {
  const getBounds = (coords: { lat: number; lng: number }[]) => {
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity
    coords.forEach((c) => {
      minLat = Math.min(minLat, c.lat)
      maxLat = Math.max(maxLat, c.lat)
      minLng = Math.min(minLng, c.lng)
      maxLng = Math.max(maxLng, c.lng)
    })
    return { minLat, maxLat, minLng, maxLng }
  }

  const b1 = getBounds(poly1)
  const b2 = getBounds(poly2)

  return !(
    b1.maxLat < b2.minLat ||
    b1.minLat > b2.maxLat ||
    b1.maxLng < b2.minLng ||
    b1.minLng > b2.maxLng
  )
}

// Approximate intersection area for overlapping bounding boxes (Mock for demonstration)
// A real polygon intersection requires complex libraries like Turf.js or JSTS
export function approximateOverlapArea(
  poly1: { lat: number; lng: number }[],
  poly2: { lat: number; lng: number }[],
): number {
  if (!checkBoundingBoxOverlap(poly1, poly2)) return 0

  // Very rough approximation based on bounding box intersection
  const getBounds = (coords: { lat: number; lng: number }[]) => {
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity
    coords.forEach((c) => {
      minLat = Math.min(minLat, c.lat)
      maxLat = Math.max(maxLat, c.lat)
      minLng = Math.min(minLng, c.lng)
      maxLng = Math.max(maxLng, c.lng)
    })
    return { minLat, maxLat, minLng, maxLng }
  }

  const b1 = getBounds(poly1)
  const b2 = getBounds(poly2)

  const intersectMinLat = Math.max(b1.minLat, b2.minLat)
  const intersectMaxLat = Math.min(b1.maxLat, b2.maxLat)
  const intersectMinLng = Math.max(b1.minLng, b2.minLng)
  const intersectMaxLng = Math.min(b1.maxLng, b2.maxLng)

  const latDiff = intersectMaxLat - intersectMinLat
  const lngDiff = intersectMaxLng - intersectMinLng

  // Convert approx degrees to meters (very rough, at equator)
  const heightM = latDiff * 111320
  const widthM = lngDiff * 111320 * Math.cos((intersectMinLat * Math.PI) / 180)

  // Assuming polygons cover about 50% of their bounding box
  return Math.abs(heightM * widthM) * 0.5
}
