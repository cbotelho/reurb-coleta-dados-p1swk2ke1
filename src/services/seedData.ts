import { Project, Quadra, Lote } from '@/types'

export const SEED_PROJECTS: Project[] = [
  {
    id: 1,
    local_id: 'proj-1',
    sync_status: 'synchronized',
    date_added: 1762453923000,
    date_updated: 1762455377000,
    name: 'Marabaixo 1',
    field_348: 'Marabaixo 1',
    description: 'Projeto de regularização fundiária do bairro Marabaixo 1.',
    image_url:
      'https://img.usecurling.com/p/800/400?q=satellite%20map%200.036161%20-51.130895&color=green',
    field_350: '1762455359_PLANTA_GERAL_REUB_MARABAIXO_I-modelo2.pdf',
    field_351: '1762455374_Marabaixo_1.jpg',
    latitude: '0.036161',
    longitude: '-51.130895',
    parent_id: 0,
    parent_item_id: 1,
    linked_id: 0,
    created_by: 1,
    sort_order: 0,
    auto_update_map: true,
  },
  {
    id: 2,
    local_id: 'proj-2',
    sync_status: 'synchronized',
    date_added: 1762692888000,
    date_updated: 0,
    name: 'Oiapoque',
    field_348: 'Oiapoque',
    description: 'Levantamento inicial da área urbana de Oiapoque.',
    image_url:
      'https://img.usecurling.com/p/800/400?q=satellite%20map%203.8427%20-51.8344&color=green',
    field_350: '',
    field_351: '',
    latitude: '3.8427',
    longitude: '-51.8344',
    parent_id: 0,
    parent_item_id: 2,
    linked_id: 0,
    created_by: 1,
    sort_order: 0,
    auto_update_map: false,
  },
]

// Data for Marabaixo 1 Quadras
const MARABAIXO_QUADRAS_DATA = [
  { name: 'Quadra 91', area: '21054.45m²' },
  { name: 'Quadra 92', area: '6006.47m²' },
  { name: 'Quadra 93', area: '5823.89m²' },
  { name: 'Quadra 94', area: '45389.41m²' },
  { name: 'Quadra 112', area: '10235.8m²' },
  { name: 'Quadra 113', area: '10378.73m²' },
  { name: 'Quadra 114', area: '10108.42m²' },
  { name: 'Quadra 115', area: '10135.37m²' },
  { name: 'Quadra 116', area: '10104.01m²' },
  { name: 'Quadra 117', area: '10142.43m²' },
  { name: 'Quadra 118', area: '10200.6m²' },
  { name: 'Quadra 119', area: '10266.78m²' },
  { name: 'Quadra 120', area: '10124.91m²' },
  { name: 'Quadra 121', area: '10084.97m²' },
  { name: 'Quadra 122', area: '10168.35m²' },
  { name: 'Quadra 123', area: '10327.71m²' },
  { name: 'Quadra 124', area: '8792.41m²' },
  { name: 'Quadra 125', area: '1461.72m²' },
  { name: 'Quadra 125A', area: '1247.3m²' },
]

export const SEED_QUADRAS: Quadra[] = Array.from({ length: 40 }, (_, i) => {
  const index = i + 1
  const isMarabaixo = index <= 20
  const projectId = isMarabaixo ? 'proj-1' : 'proj-2'
  const projectName = isMarabaixo ? 'Marabaixo 1' : 'Oiapoque'

  let name = ''
  let area = ''

  if (isMarabaixo) {
    if (index <= 19) {
      const data = MARABAIXO_QUADRAS_DATA[index - 1]
      name = data.name
      area = data.area
    } else {
      // Placeholder for index 20 to maintain structure
      name = 'Quadra 20 (Extra)'
      area = '3000m²'
    }
  } else {
    // Oiapoque quadras
    const quadraNum = index - 20
    name = `Quadra ${quadraNum}`
    area = `${Math.floor(Math.random() * 2000) + 3000}m²`
  }

  return {
    id: index,
    local_id: `quad-${index}`,
    sync_status: 'synchronized',
    date_added: Date.now(),
    date_updated: Date.now(),
    name: name,
    area: area,
    field_329: name,
    field_330: area,
    parent_item_id: projectId,
    field_349: projectName,
    field_331: `planta_quadra_${index}_${isMarabaixo ? 'marabaixo' : 'oiapoque'}.pdf`,
    field_332: `vista_aerea_${index}_${isMarabaixo ? 'marabaixo' : 'oiapoque'}.jpg`,
  }
})

const generateLoteCoords = (
  projectLat: number,
  projectLng: number,
  index: number,
) => {
  const offsetLat = ((Math.floor(index / 10) - 5) * 0.0005).toFixed(6)
  const offsetLng = (((index % 10) - 5) * 0.0005).toFixed(6)
  return {
    latitude: (projectLat + parseFloat(offsetLat)).toString(),
    longitude: (projectLng + parseFloat(offsetLng)).toString(),
  }
}

const INITIAL_LOTES: Lote[] = Array.from({ length: 51 }, (_, i) => {
  const index = i + 1
  const quadraIndex = ((index - 1) % 40) + 1
  const isMarabaixo = quadraIndex <= 20
  const baseLat = isMarabaixo ? 0.036161 : 3.8427
  const baseLng = isMarabaixo ? -51.130895 : -51.8344
  const coords = generateLoteCoords(baseLat, baseLng, i)
  const name = `Lote ${index < 10 ? '0' + index : index}`
  const area = `${250 + (index % 5) * 10}m²`

  return {
    id: 1000 + index,
    local_id: `lote-${index}`,
    sync_status: index % 5 === 0 ? 'pending' : 'synchronized',
    date_added: Date.now(),
    date_updated: Date.now(),
    name: name,
    area: area,
    description: '',
    images: [],
    field_338: name,
    field_339: area,
    field_340:
      index % 2 === 0
        ? 'Terreno plano, sem benfeitorias.'
        : 'Contém pequena construção.',
    field_352: [],
    parent_item_id: `quad-${quadraIndex}`,
    latitude: coords.latitude,
    longitude: coords.longitude,
  }
})

const ADDITIONAL_LOTES: Lote[] = Array.from({ length: 385 }, (_, i) => {
  const id = 52 + i
  const quadraOffset = i % 16
  const quadraId = 4 + quadraOffset

  const areaBase = 30 + (i % 500)
  const areaDecimal = (i * 17) % 100
  const area = `${areaBase}.${areaDecimal < 10 ? '0' + areaDecimal : areaDecimal}m²`

  const loteNum = `${(i % 500) + 1}`

  const isMarabaixo = quadraId <= 20
  const baseLat = isMarabaixo ? 0.036161 : 3.8427
  const baseLng = isMarabaixo ? -51.130895 : -51.8344
  const coords = generateLoteCoords(baseLat, baseLng, i + 100)

  return {
    id: id,
    local_id: `lote-${id}`,
    sync_status: 'synchronized',
    date_added: 1762513937000,
    date_updated: 0,
    name: loteNum,
    area: area,
    description: '',
    images: [],
    field_338: loteNum,
    field_339: area,
    field_340: '',
    field_352: [],
    parent_item_id: `quad-${quadraId}`,
    latitude: coords.latitude,
    longitude: coords.longitude,
  }
})

const NEW_LOTES_186: Lote[] = Array.from({ length: 186 }, (_, i) => {
  const id = 526 + i
  const quadraId = (i % 40) + 1
  const loteNum = `Lote ${(i % 100) + 1}`
  const area = `250.00m²`

  const isMarabaixo = quadraId <= 20
  const baseLat = isMarabaixo ? 0.036161 : 3.8427
  const baseLng = isMarabaixo ? -51.130895 : -51.8344
  const coords = generateLoteCoords(baseLat, baseLng, i + 500)

  return {
    id: id,
    local_id: `lote-${id}`,
    sync_status: 'synchronized',
    date_added: 1735689600000,
    date_updated: 0,
    created_by: 0,
    deleted: 1,
    status: '',
    name: loteNum,
    area: area,
    description: '',
    images: [],
    field_338: loteNum,
    field_339: area,
    field_340: '',
    field_352: [],
    parent_item_id: `quad-${quadraId}`,
    latitude: coords.latitude,
    longitude: coords.longitude,
  }
})

export const SEED_LOTES: Lote[] = [
  ...INITIAL_LOTES,
  ...ADDITIONAL_LOTES,
  ...NEW_LOTES_186,
]
