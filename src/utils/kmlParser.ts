/**
 * Simple KML to GeoJSON parser.
 * Handles Placemarks (Point, Polygon, LineString).
 * Note: This is a simplified client-side parser for basic KML files.
 */
export function parseKML(xmlString: string): any {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
  const placemarks = xmlDoc.getElementsByTagName('Placemark')
  const features = []

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i]
    const name =
      placemark.getElementsByTagName('name')[0]?.textContent || 'Untitled'
    const description =
      placemark.getElementsByTagName('description')[0]?.textContent || ''
    const point = placemark.getElementsByTagName('Point')[0]
    const polygon = placemark.getElementsByTagName('Polygon')[0]
    const lineString = placemark.getElementsByTagName('LineString')[0]

    let geometry = null

    if (point) {
      const coords = point
        .getElementsByTagName('coordinates')[0]
        ?.textContent?.trim()
      if (coords) {
        const [lng, lat] = coords.split(',').map((c) => parseFloat(c))
        geometry = {
          type: 'Point',
          coordinates: [lng, lat],
        }
      }
    } else if (polygon) {
      const outerBoundary = polygon.getElementsByTagName('outerBoundaryIs')[0]
      if (outerBoundary) {
        const coordsStr = outerBoundary
          .getElementsByTagName('coordinates')[0]
          ?.textContent?.trim()
        if (coordsStr) {
          const coords = coordsStr.split(/\s+/).map((pair) => {
            const [lng, lat] = pair.split(',').map((c) => parseFloat(c))
            return [lng, lat]
          })
          geometry = {
            type: 'Polygon',
            coordinates: [coords],
          }
        }
      }
    } else if (lineString) {
      const coordsStr = lineString
        .getElementsByTagName('coordinates')[0]
        ?.textContent?.trim()
      if (coordsStr) {
        const coords = coordsStr.split(/\s+/).map((pair) => {
          const [lng, lat] = pair.split(',').map((c) => parseFloat(c))
          return [lng, lat]
        })
        geometry = {
          type: 'LineString',
          coordinates: coords,
        }
      }
    }

    if (geometry) {
      features.push({
        type: 'Feature',
        properties: { name, description },
        geometry,
      })
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}
