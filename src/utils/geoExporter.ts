import { Lote, Project } from '@/types'

const formatKML = (
  items: Array<{
    name: string
    description: string
    latitude: string
    longitude: string
  }>,
) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    ${items
      .map(
        (item) => `
    <Placemark>
      <name>${item.name}</name>
      <description>${item.description}</description>
      <Point>
        <coordinates>${item.longitude},${item.latitude},0</coordinates>
      </Point>
    </Placemark>`,
      )
      .join('')}
  </Document>
</kml>`
}

const formatGeoJSON = (
  items: Array<{
    name: string
    description: string
    latitude: string
    longitude: string
  }>,
) => {
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: items.map((item) => ({
        type: 'Feature',
        properties: {
          name: item.name,
          description: item.description,
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)],
        },
      })),
    },
    null,
    2,
  )
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const geoExporter = {
  exportProjectKML: (project: Project, lotes: Lote[]) => {
    const items = []

    // Add project center if available
    if (project.latitude && project.longitude) {
      items.push({
        name: `Projeto: ${project.field_348}`,
        description: `ID: ${project.local_id}`,
        latitude: project.latitude,
        longitude: project.longitude,
      })
    }

    // Add lots
    lotes.forEach((lote) => {
      if (lote.latitude && lote.longitude) {
        items.push({
          name: lote.field_338,
          description: `Área: ${lote.field_339} | ${lote.field_340 || ''}`,
          latitude: lote.latitude,
          longitude: lote.longitude,
        })
      }
    })

    const kml = formatKML(items)
    downloadFile(
      kml,
      `projeto_${project.field_348}.kml`,
      'application/vnd.google-earth.kml+xml',
    )
  },

  exportProjectGeoJSON: (project: Project, lotes: Lote[]) => {
    const items = []

    if (project.latitude && project.longitude) {
      items.push({
        name: `Projeto: ${project.field_348}`,
        description: `ID: ${project.local_id}`,
        latitude: project.latitude,
        longitude: project.longitude,
      })
    }

    lotes.forEach((lote) => {
      if (lote.latitude && lote.longitude) {
        items.push({
          name: lote.field_338,
          description: `Área: ${lote.field_339} | ${lote.field_340 || ''}`,
          latitude: lote.latitude,
          longitude: lote.longitude,
        })
      }
    })

    const geojson = formatGeoJSON(items)
    downloadFile(
      geojson,
      `projeto_${project.field_348}.geojson`,
      'application/geo+json',
    )
  },
}
