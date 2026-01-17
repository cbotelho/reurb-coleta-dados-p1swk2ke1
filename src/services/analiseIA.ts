/**
 * Service de Análise Jurídica com IA - SisReub Insight
 * Lei 13.465/2017 - REURB-S (Social) vs REURB-E (Específico)
 * 
 * Este service prepara os dados da vistoria e chama a API de IA
 * para gerar análise jurídica automática conforme Art. 13 da Lei.
 */

import { Survey } from '@/types'

export interface AnaliseIARequest {
  contexto: string
  dados_vistoria: {
    renda_familiar?: number
    moradores: number
    possui_nis: boolean
    area_imovel?: string
    infraestrutura: string[]
    vulnerabilidade_observada?: string
    tempo_ocupacao?: string
    modo_aquisicao?: string
    uso_imovel?: string
  }
}

export interface AnaliseIAResponse {
  classificacao: 'REURB-S' | 'REURB-E'
  parecer_tecnico: string
  proximo_passo: string
  gerada_em: string
}

class AnaliseIAService {
  /**
   * Prepara os dados da vistoria para envio à IA
   */
  private prepararDadosVistoria(survey: Partial<Survey>): AnaliseIARequest {
    // Extrair infraestrutura disponível
    const infraestrutura: string[] = []
    if (survey.water_supply && survey.water_supply !== 'Não há') infraestrutura.push('água')
    if (survey.energy_supply && survey.energy_supply !== 'Não há') infraestrutura.push('energia')
    if (survey.sanitation && survey.sanitation !== 'Não há') infraestrutura.push('esgoto')
    if (survey.street_paving && survey.street_paving !== 'Não pavimentada') infraestrutura.push('pavimentação')

    return {
      contexto: 'Análise de REURB Lei 13.465/2017',
      dados_vistoria: {
        renda_familiar: survey.applicant_income ? parseFloat(survey.applicant_income) : undefined,
        moradores: survey.residents_count || 0,
        possui_nis: Boolean(survey.applicant_nis),
        area_imovel: survey.construction_type || undefined,
        infraestrutura,
        tempo_ocupacao: survey.occupation_time,
        modo_aquisicao: survey.acquisition_mode,
        uso_imovel: survey.property_use,
        vulnerabilidade_observada: survey.has_children ? 'Presença de crianças' : undefined,
      },
    }
  }

  /**
   * Gera análise jurídica usando IA (ou lógica de fallback)
   * 
   * TODO: Integrar com Supabase Edge Function ou API externa de IA
   * Para agora, usa lógica baseada em regras como fallback
   */
  async gerarAnalise(survey: Partial<Survey>): Promise<AnaliseIAResponse> {
    const dados = this.prepararDadosVistoria(survey)

    // TODO: Chamar API de IA aqui
    // const response = await fetch('/api/analise-reurb', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(dados),
    // })
    // return await response.json()

    // FALLBACK: Lógica baseada em regras enquanto IA não está integrada
    return this.analisePorRegras(dados, survey)
  }

  /**
   * Análise por regras (fallback até IA estar integrada)
   */
  private analisePorRegras(dados: AnaliseIARequest, survey: Partial<Survey>): AnaliseIAResponse {
    const { renda_familiar, moradores, possui_nis, infraestrutura } = dados.dados_vistoria
    
    // Calcular renda per capita
    const rendaPerCapita = renda_familiar && moradores > 0 
      ? renda_familiar / moradores 
      : 0

    // Atualizado conforme solicitação do usuário (17/01/2026)
    const salarioMinimo = 1621.00 
    const limiteReurbS = salarioMinimo * 5 // Lei da ReUrb cita até 5 salários para isenção/REURB-S

    // Critérios REURB-S (Art. 13, I, Lei 13.465/2017)
    const criteriosReurbS = [
      renda_familiar !== undefined && renda_familiar <= limiteReurbS,
      possui_nis,
      rendaPerCapita < salarioMinimo,
      infraestrutura.length < 3, // Baixa infraestrutura
    ]

    const pontuacaoReurbS = criteriosReurbS.filter(Boolean).length
    const classificacao = pontuacaoReurbS >= 2 ? 'REURB-S' : 'REURB-E'

    // Gerar parecer técnico
    let parecer = ''
    if (classificacao === 'REURB-S') {
      parecer = `Enquadramento fundamentado no Art. 13, I, da Lei 13.465/2017. `
      
      if (renda_familiar && renda_familiar <= limiteReurbS) {
        parecer += `A renda familiar de R$ ${renda_familiar.toFixed(2)} está dentro do limite legal de 5 salários mínimos (R$ ${limiteReurbS.toFixed(2)}). `
      }
      
      if (possui_nis) {
        parecer += `A presença de NIS ativo evidencia vulnerabilidade socioeconômica. `
      }
      
      if (rendaPerCapita > 0 && rendaPerCapita < salarioMinimo) {
        parecer += `A renda per capita de R$ ${rendaPerCapita.toFixed(2)} (${moradores} moradores) caracteriza baixa renda. `
      }
      
      if (infraestrutura.length < 3) {
        parecer += `A infraestrutura local (${infraestrutura.join(', ') || 'precária'}) evidencia vulnerabilidade territorial. `
      }
      
      parecer += `Configurado o interesse social necessário para a regularização fundiária gratuita.`
    } else {
      parecer = `Enquadramento no Art. 13, II, da Lei 13.465/2017 (REURB-E). `
      
      if (renda_familiar && renda_familiar > limiteReurbS) {
        parecer += `A renda familiar de R$ ${renda_familiar.toFixed(2)} excede o limite legal de 5 salários mínimos. `
      }
      
      parecer += `Os critérios socioeconômicos não atendem aos requisitos de gratuidade previstos para REURB-S. O interessado deve arcar com os custos do processo de regularização fundiária.`
    }

    // Próximo passo
    let proximoPasso = ''
    if (classificacao === 'REURB-S') {
      proximoPasso = `Proceder com a abertura do processo administrativo de REURB-S. Recomendar visita da assistência social para validar a composição familiar e a vulnerabilidade relatada, além da emissão de certidões de busca de bens imóveis no nome do requerente.`
    } else {
      proximoPasso = `Orientar o requerente quanto às custas do processo de REURB-E e proceder com a abertura do processo administrativo. Solicitar comprovantes de renda, certidões de busca de bens imóveis e demais documentações necessárias.`
    }

    return {
      classificacao,
      parecer_tecnico: parecer,
      proximo_passo: proximoPasso,
      gerada_em: new Date().toISOString(),
    }
  }
}

export const analiseIAService = new AnaliseIAService()
