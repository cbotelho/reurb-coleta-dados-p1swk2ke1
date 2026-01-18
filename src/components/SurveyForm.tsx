import { z } from 'zod'

export const UF_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export const surveySchema = z.object({
  form_number: z.string().default(''),
  survey_date: z.string().min(1, 'Data obrigatória'),
  city: z.string().min(1, 'Cidade obrigatória').default('Macapá'),
  state: z.string().length(2).default('AP'),
  surveyor_name: z.string().default(''),
  surveyor_signature: z.string().default(''),
  assinatura_requerente: z.string().default(''),
  address: z.string().default(''),
  latitude: z.string().default(''),
  longitude: z.string().default(''),

  // Dados do Requerente
  applicant_name: z.string().min(1, 'Nome obrigatório').default(''),
  applicant_cpf: z.string().min(1, 'CPF obrigatório').default(''),
  applicant_rg: z.string().default(''),
  applicant_civil_status: z.string().default(''),
  applicant_profession: z.string().default(''),
  applicant_income: z.string().default(''),
  applicant_nis: z.string().default(''),
  spouse_name: z.string().default(''),
  spouse_cpf: z.string().default(''),
  declaracao_requerente: z.boolean().default(false),

  // Campos Numéricos (Coerce garante que "1" vire 1)
  residents_count: z.coerce.number().min(0).default(0),
  rooms_count: z.coerce.number().min(0).default(0),
  has_children: z.boolean().default(false),

  // Selects e Textos
  occupation_time: z.string().default(''),
  acquisition_mode: z.string().default(''),
  property_use: z.string().default(''),
  construction_type: z.string().default(''),
  roof_type: z.string().default(''),
  floor_type: z.string().default(''),
  conservation_state: z.string().default(''),
  fencing: z.string().default(''),
  water_supply: z.string().default(''),
  energy_supply: z.string().default(''),
  sanitation: z.string().default(''),
  street_paving: z.string().default(''),
  observations: z.string().default(''),
  documents: z.array(z.any()).default([]),
  
  // IA
  analise_ia_classificacao: z.string().default(''),
  analise_ia_parecer: z.string().default(''),
  analise_ia_proximo_passo: z.string().default(''),
  analise_ia_gerada_em: z.string().default(''),
})

export type SurveyFormValues = z.infer<typeof surveySchema>