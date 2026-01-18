import { db } from './db'
import { api } from './api'

export const syncService = {
  async pullBaseData() {
    if (!navigator.onLine) return { projects: 0, quadras: 0, lotes: 0 }
    let pCount = 0, qCount = 0, lCount = 0

    try {
      const projects = await api.getProjects()
      pCount = projects.length
      for (const p of projects) {
        const quadras = await api.getQuadras(p.local_id)
        qCount += quadras.length
      }
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

    // Buscamos itens pendentes ou que falharam para tentar novamente
    const pending = db.getPendingItems()
    let successCount = 0
    let failCount = 0

    // 1. Sincronizar Lotes
    for (const lote of pending.lotes) {
      try {
        const { sync_status, ...lotePayload } = lote as any;
        const saved = await api.saveLote(lotePayload);

        if (lote.local_id !== saved.local_id) {
          const childSurveys = db.getSurveys().filter((s) => s.property_id === lote.local_id)
          childSurveys.forEach((s) => {
            db.saveSurvey({ ...s, property_id: saved.local_id })
          })
          db.deleteLote(lote.local_id)
        }
        successCount++
      } catch (e) {
        console.error('Failed to sync lote', lote.name, e)
        db.updateLoteStatus(lote.local_id, 'failed')
        failCount++
      }
    }

    // 2. Sincronizar Surveys (Vistorias)
    const currentPendingSurveys = db.getPendingItems().surveys

    for (const survey of currentPendingSurveys) {
      try {
        // CURA DO ERRO 400: Removemos TUDO que não é coluna do banco
        // Usamos desestruturação para separar o que o Supabase não conhece
        const { sync_status, local_id, is_dirty, ...payload } = survey as any;

        // Se o seu api.saveSurvey já usa .upsert() no Supabase, isso resolve o 406
        await api.saveSurvey(payload);
        
        db.updateSurveyStatus(survey.id, 'synchronized');
        successCount++
      } catch (e) {
        console.error('Failed to sync survey', survey.id, e)
        db.updateSurveyStatus(survey.id, 'failed')
        failCount++
      }
    }

    return { successCount, failCount }
  },
}