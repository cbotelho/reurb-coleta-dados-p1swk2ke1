import { Project, Quadra, Lote } from '@/types'

export const SEED_PROJECTS: Project[] = [
  {
    id: 1,
    local_id: 'proj-1',
    sync_status: 'synchronized',
    date_added: 1762453923000,
    date_updated: 1762455377000,
    field_348: 'Marabaixo 1',
    field_350: '1762455359_PLANTA_GERAL_REUB_MARABAIXO_I-modelo2.pdf',
    field_351: '1762455374_Marabaixo_1.jpg',
    parent_id: 0,
    parent_item_id: 1,
    linked_id: 0,
    created_by: 1,
    sort_order: 0,
  },
  {
    id: 2,
    local_id: 'proj-2',
    sync_status: 'synchronized',
    date_added: 1762692888000,
    date_updated: 0,
    field_348: 'Oiapoque',
    field_350: '',
    field_351: '',
    parent_id: 0,
    parent_item_id: 2,
    linked_id: 0,
    created_by: 1,
    sort_order: 0,
  },
]

export const SEED_QUADRAS: Quadra[] = Array.from({ length: 40 }, (_, i) => {
  const index = i + 1
  const isMarabaixo = index <= 20
  const projectId = isMarabaixo ? 'proj-1' : 'proj-2'
  const projectName = isMarabaixo ? 'Marabaixo 1' : 'Oiapoque'
  const quadraNum = isMarabaixo ? index : index - 20

  return {
    id: index,
    local_id: `quad-${index}`,
    sync_status: 'synchronized',
    date_added: Date.now(),
    date_updated: Date.now(),
    field_329: `Quadra ${quadraNum}`,
    field_330: `${Math.floor(Math.random() * 2000) + 3000}m²`,
    parent_item_id: projectId,
    field_349: projectName,
    field_331: `planta_quadra_${quadraNum}_${isMarabaixo ? 'marabaixo' : 'oiapoque'}.pdf`,
    field_332: `vista_aerea_${quadraNum}_${isMarabaixo ? 'marabaixo' : 'oiapoque'}.jpg`,
  }
})

const INITIAL_LOTES: Lote[] = Array.from({ length: 51 }, (_, i) => {
  const index = i + 1
  const quadraIndex = ((index - 1) % 40) + 1

  return {
    id: 1000 + index,
    local_id: `lote-${index}`,
    sync_status: index % 5 === 0 ? 'pending' : 'synchronized',
    date_added: Date.now(),
    date_updated: Date.now(),
    field_338: `Lote ${index < 10 ? '0' + index : index}`,
    field_339: `${250 + (index % 5) * 10}m²`,
    field_340:
      index % 2 === 0
        ? 'Terreno plano, sem benfeitorias.'
        : 'Contém pequena construção.',
    field_352: [],
    parent_item_id: `quad-${quadraIndex}`,
  }
})

// Generate 385 additional lots as per user story
const ADDITIONAL_LOTES: Lote[] = Array.from({ length: 385 }, (_, i) => {
  const id = 52 + i
  // Distribute among quadras 4 to 19 (16 quadras)
  // We use modulo to cycle through the quadras
  const quadraOffset = i % 16
  const quadraId = 4 + quadraOffset

  // Use a pseudo-random generation for area and lot number to simulate provided data
  // Using i to make it deterministic
  const areaBase = 30 + (i % 500)
  const areaDecimal = (i * 17) % 100
  const area = `${areaBase}.${areaDecimal < 10 ? '0' + areaDecimal : areaDecimal}`

  const loteNum = `${(i % 500) + 1}`

  return {
    id: id,
    local_id: `lote-${id}`, // Using consistent naming with ID
    sync_status: 'synchronized',
    date_added: 1762513937000,
    date_updated: 0,
    field_338: loteNum,
    field_339: area,
    field_340: '', // Empty description implies ''
    field_352: [], // Empty file fields
    parent_item_id: `quad-${quadraId}`,
  }
})

export const SEED_LOTES: Lote[] = [...INITIAL_LOTES, ...ADDITIONAL_LOTES]
