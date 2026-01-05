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
      <description><![CDATA[${item.description}]]></description>
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
        name: `Projeto: ${project.name}`,
        description: `Levantamento: ${project.description}\nID: ${project.local_id}`,
        latitude: project.latitude,
        longitude: project.longitude,
        extendedData: {
          type: 'Project',
          status: project.sync_status,
          date_added: project.date_added,
          created_by: project.created_by || '',
          local_id: project.local_id,
        },
      })
    }

    // Add lots with full attributes
    lotes.forEach((lote) => {
      if (lote.latitude && lote.longitude) {
        items.push({
          name: lote.name,
          description: `Área: ${lote.area}\nDescrição: ${lote.description || 'N/A'}\nImagens: ${lote.images.length}`,
          latitude: lote.latitude,
          longitude: lote.longitude,
          extendedData: {
            type: 'Lote',
            status: lote.sync_status,
            area: lote.area,
            quadra_id: lote.parent_item_id,
            memorial: lote.description,
            image_count: lote.images.length,
            local_id: lote.local_id,
            parent_project_id: project.local_id,
          },
        })
      }
    })

    const kml = formatKML(items)
    downloadFile(
      kml,
      `projeto_${project.name.replace(/\s+/g, '_')}_advanced.kml`,
      'application/vnd.google-earth.kml+xml',
    )
  },

  exportProjectGeoJSON: (project: Project, lotes: Lote[]) => {
    const items = []

    if (project.latitude && project.longitude) {
      items.push({
        name: `Projeto: ${project.name}`,
        description: `Levantamento: ${project.description}`,
        latitude: project.latitude,
        longitude: project.longitude,
        extendedData: {
          type: 'Project',
          status: project.sync_status,
          date_added: project.date_added,
          created_by: project.created_by,
          local_id: project.local_id,
        },
      })
    }

    lotes.forEach((lote) => {
      if (lote.latitude && lote.longitude) {
        items.push({
          name: lote.name,
          description: lote.description || '',
          latitude: lote.latitude,
          longitude: lote.longitude,
          extendedData: {
            type: 'Lote',
            status: lote.sync_status,
            area: lote.area,
            quadra_id: lote.parent_item_id,
            image_count: lote.images.length,
            local_id: lote.local_id,
            parent_project_id: project.local_id,
          },
        })
      }
    })

    const geojson = formatGeoJSON(items)
    downloadFile(
      geojson,
      `projeto_${project.name.replace(/\s+/g, '_')}_advanced.geojson`,
      'application/geo+json',
    )
  },
}
