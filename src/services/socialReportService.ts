import { supabase } from '@/lib/supabase/client'
import type { SocialReport } from '@/types'

export const socialReportService = {
  /**
   * Busca todos os pareceres (com filtros opcionais)
   */
  async getAll(filters?: {
    project_id?: string
    quadra_id?: string
    property_id?: string
    status?: string
  }): Promise<SocialReport[]> {
    try {
      let query = supabase
        .from('reurb_social_reports')
        .select(`
          *,
          reurb_projects!inner(name),
          reurb_quadras!inner(name),
          reurb_properties!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters?.quadra_id) {
        query = query.eq('quadra_id', filters.quadra_id)
      }
      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error

      // Mapear relacionamentos
      return (data || []).map((report: any) => ({
        ...report,
        project_name: report.reurb_projects?.name,
        quadra_name: report.reurb_quadras?.name,
        property_name: report.reurb_properties?.name,
      }))
    } catch (error) {
      console.error('Erro ao buscar pareceres:', error)
      throw error
    }
  },

  /**
   * Busca parecer por ID
   */
  async getById(id: string): Promise<SocialReport | null> {
    try {
      const { data, error } = await supabase
        .from('reurb_social_reports')
        .select(`
          *,
          reurb_projects!inner(name),
          reurb_quadras!inner(name),
          reurb_properties!inner(name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) return null

      return {
        ...data,
        project_name: data.reurb_projects?.name,
        quadra_name: data.reurb_quadras?.name,
        property_name: data.reurb_properties?.name,
      }
    } catch (error) {
      console.error('Erro ao buscar parecer:', error)
      return null
    }
  },

  /**
   * Busca parecer de um lote específico (mais recente)
   */
  async getByPropertyId(propertyId: string): Promise<SocialReport | null> {
    try {
      const { data, error } = await supabase
        .from('reurb_social_reports')
        .select(`
          *,
          reurb_projects!inner(name),
          reurb_quadras!inner(name),
          reurb_properties!inner(name)
        `)
        .eq('property_id', propertyId)
        .order('versao', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (!data) return null

      return {
        ...data,
        project_name: data.reurb_projects?.name,
        quadra_name: data.reurb_quadras?.name,
        property_name: data.reurb_properties?.name,
      }
    } catch (error) {
      console.error('Erro ao buscar parecer do lote:', error)
      return null
    }
  },

  /**
   * Gera número de registro automático
   */
  async generateReportNumber(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_report_number')

      if (error) throw error

      return data as string
    } catch (error) {
      console.error('Erro ao gerar número de registro:', error)
      // Fallback: gerar manualmente
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 1000)
      return `${year}/${String(random).padStart(3, '0')}-REURB-AP`
    }
  },

  /**
   * Cria novo parecer
   */
  async create(
    report: Omit<SocialReport, 'id' | 'created_at' | 'updated_at' | 'versao'>,
  ): Promise<SocialReport> {
    try {
      // Gerar número de registro se não fornecido
      if (!report.numero_registro) {
        report.numero_registro = await this.generateReportNumber()
      }

      // LIMPEZA DE DADOS: Garantir que UUIDs vazios sejam nulos ou removidos
      const cleanData: any = {
        ...report,
        // Converter strings vazias para null para campos UUID e EMAIL (evita erro de sintaxe)
        property_id: report.property_id || null,
        quadra_id: report.quadra_id || null,
        project_id: report.project_id || null,
        email_assistente_social: report.email_assistente_social || null,
        versao: 1,
        status: report.status || 'rascunho',
      }

      // Remover chaves nulas para deixar o banco usar DEFAULT (se houver) ou gravar NULL
      Object.keys(cleanData).forEach((key) => {
        if (cleanData[key] === null) {
          delete cleanData[key]
        }
      })

      const { data, error } = await supabase
        .from('reurb_social_reports')
        .insert(cleanData)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao criar parecer:', error)
      throw error
    }
  },

  /**
   * Atualiza parecer existente
   */
  async update(
    id: string,
    updates: Partial<SocialReport>,
  ): Promise<SocialReport> {
    try {
      const cleanUpdates: any = { ...updates }
      
      // Limpeza similar para updates
      if (typeof cleanUpdates.property_id !== 'undefined') cleanUpdates.property_id = cleanUpdates.property_id || null
      if (typeof cleanUpdates.quadra_id !== 'undefined') cleanUpdates.quadra_id = cleanUpdates.quadra_id || null
      if (typeof cleanUpdates.project_id !== 'undefined') cleanUpdates.project_id = cleanUpdates.project_id || null
      if (typeof cleanUpdates.email_assistente_social !== 'undefined') cleanUpdates.email_assistente_social = cleanUpdates.email_assistente_social || null

      // Remover nulos se desejar que não sejam enviados (mas em update, enviar null pode ser intencional para limpar o campo)
      // Nesse caso, o problema é "", então converter "" para null é o correto.
      // Se o campo for obrigatório, null vai dar erro, mas "" dá erro de sintaxe.
      
      const { data, error } = await supabase
        .from('reurb_social_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao atualizar parecer:', error)
      throw error
    }
  },

  /**
   * Cria nova versão do parecer (versionamento)
   */
  async createVersion(
    originalId: string,
    updates: Partial<SocialReport>,
  ): Promise<SocialReport> {
    try {
      // Buscar parecer original
      const original = await this.getById(originalId)
      if (!original) throw new Error('Parecer original não encontrado')

      // Criar nova versão
      const { data, error } = await supabase
        .from('reurb_social_reports')
        .insert({
          ...original,
          ...updates,
          id: undefined, // Gerar novo UUID
          versao: original.versao + 1,
          parecer_anterior_id: originalId,
          created_at: undefined, // Nova data de criação
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao criar versão do parecer:', error)
      throw error
    }
  },

  /**
   * Deleta parecer
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reurb_social_reports')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar parecer:', error)
      throw error
    }
  },

  /**
   * Busca histórico de versões de um parecer
   */
  async getVersionHistory(reportId: string): Promise<SocialReport[]> {
    try {
      // Buscar o parecer atual
      const current = await this.getById(reportId)
      if (!current) return []

      const versions: SocialReport[] = [current]
      let previousId = current.parecer_anterior_id

      // Buscar versões anteriores recursivamente
      while (previousId) {
        const previous = await this.getById(previousId)
        if (!previous) break

        versions.push(previous)
        previousId = previous.parecer_anterior_id
      }

      return versions.sort((a, b) => b.versao - a.versao)
    } catch (error) {
      console.error('Erro ao buscar histórico de versões:', error)
      return []
    }
  },

  /**
   * Exporta parecer para PDF
   */
  async exportToPDF(reportId: string): Promise<void> {
    try {
      const report = await this.getById(reportId)
      if (!report) throw new Error('Parecer não encontrado')

      // Criar HTML do documento
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Parecer ${report.numero_registro}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .header { margin-bottom: 30px; }
            .info-line { margin: 5px 0; }
            .parecer-content { margin: 30px 0; line-height: 1.6; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            .signature { margin-top: 80px; text-align: center; }
            .signature-line { display: inline-block; border-top: 1px solid #000; padding-top: 5px; min-width: 300px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PARECER CONCLUSIVO - ASSISTÊNCIA SOCIAL</h1>
            <div class="info-line"><strong>Número de Registro:</strong> ${report.numero_registro || 'N/A'}</div>
            <div class="info-line"><strong>Projeto:</strong> ${report.project_name || ''}</div>
            <div class="info-line"><strong>Quadra:</strong> ${report.quadra_name || ''}</div>
            <div class="info-line"><strong>Lote:</strong> ${report.property_name || ''}</div>
            <div class="info-line"><strong>Data:</strong> ${new Date(report.created_at || '').toLocaleDateString('pt-BR')}</div>
          </div>
          
          <div class="parecer-content">
            ${report.parecer}
          </div>
          
          <div class="signature">
            <div class="signature-line">
              <strong>${report.nome_assistente_social}</strong><br>
              ${report.cress_assistente_social ? `CRESS: ${report.cress_assistente_social}` : 'Assistente Social'}
            </div>
          </div>
          
          <div class="footer">
            Documento gerado em ${new Date().toLocaleString('pt-BR')}<br>
            ${report.assinatura_eletronica ? `Assinatura eletrônica: ${report.assinatura_eletronica}` : ''}
          </div>
        </body>
        </html>
      `

      // Abrir janela de impressão
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      throw error
    }
  },
}
