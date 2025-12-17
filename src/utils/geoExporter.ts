import { Lote, Project } from '@/types'

const formatKML = (
  items: Array<{
    name: string
    description: string
    latitude: string
    longitude: string
    extendedData?: Record<string, string | number>
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
      ${
        item.extendedData
          ? `<ExtendedData>
        ${Object.entries(item.extendedData)
          .map(
            ([key, val]) => `<Data name="${key}"><value>${val}</value></Data>`,
          )
          .join('')}
      </ExtendedData>`
          : ''
      }
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
    extendedData?: Record<string, string | number>
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
          ...item.extendedData,
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
        extendedData: {
          type: 'Project',
          status: project.sync_status,
          date_added: project.date_added,
        },
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
          extendedData: {
            type: 'Lote',
            status: lote.sync_status,
            area: lote.field_339,
            quadra_id: lote.parent_item_id,
          },
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
        extendedData: {
          type: 'Project',
          status: project.sync_status,
          date_added: project.date_added,
        },
      })
    }

    lotes.forEach((lote) => {
      if (lote.latitude && lote.longitude) {
        items.push({
          name: lote.field_338,
          description: `Área: ${lote.field_339} | ${lote.field_340 || ''}`,
          latitude: lote.latitude,
          longitude: lote.longitude,
          extendedData: {
            type: 'Lote',
            status: lote.sync_status,
            area: lote.field_339,
            quadra_id: lote.parent_item_id,
          },
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
