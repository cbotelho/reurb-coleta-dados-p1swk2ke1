import { db } from './db'
import { api } from './api'

export const syncService = {
  // Sync Projects, Quadras, and Lotes (Base Data)
  async pullBaseData() {
    if (!navigator.onLine) return { projects: 0, quadras: 0, lotes: 0 }

    let pCount = 0,
      qCount = 0,
      lCount = 0

    try {
      // 1. Projects
      const projects = await api.getProjects()
      pCount = projects.length

      // 2. Quadras (for each project)
      // To avoid flooding, we could do this sequentially or batched
      for (const p of projects) {
        const quadras = await api.getQuadras(p.local_id)
        qCount += quadras.length
      }

      // 3. Lotes (All)
      // API supports fetching all with limit, let's try fetching all
      const lotes = await api.getAllLotes()
      lCount = lotes.length

      return { projects: pCount, quadras: qCount, lotes: lCount }
    } catch (e) {
      console.error('Pull failed', e)
      throw e
    }
  },

  async pushPendingItems() {
    if (!navigator.onLine) return { successCount: 0, failCount: 0 }

    const pending = db.getPendingItems()
    let successCount = 0
    let failCount = 0

    // 1. Push Lotes First (Parents of surveys)
    for (const lote of pending.lotes) {
      try {
        const saved = await api.saveLote(lote)

        // If local ID was temporary (generatedUUID not matching remote format),
        // we might need to handle ID swap if backend generated a new one.
        // Current api.saveLote updates local db with new ID/status if successful.

        // However, if we swap ID, we must update child surveys that reference this lote!
        if (lote.local_id !== saved.local_id) {
          const childSurveys = db
            .getSurveys()
            .filter((s) => s.property_id === lote.local_id)
          childSurveys.forEach((s) => {
            db.saveSurvey({ ...s, property_id: saved.local_id })
          })
          // Delete old local lote if ID changed
          db.deleteLote(lote.local_id)
        }
        successCount++
      } catch (e) {
        console.error('Failed to sync lote', lote.name, e)
        db.updateLoteStatus(lote.local_id, 'failed')
        failCount++
      }
    }

    // 2. Push Surveys
    // Refresh pending after potential ID updates
    const currentPendingSurveys = db.getPendingItems().surveys

    for (const survey of currentPendingSurveys) {
      try {
        await api.saveSurvey(survey)
        // api.saveSurvey updates DB status on success
        successCount++
      } catch (e) {
        console.error('Failed to sync survey', survey.id, e)
        db.updateSurveyStatus(survey.id, 'failed')
        failCount++
      }
    }

    // 3. Push Projects/Quadras if any pending (mostly read-only for this user story, but good to have)
    // Skipped for brevity as per user story focusing on Surveys/Lotes.

    return { successCount, failCount }
  },
}
