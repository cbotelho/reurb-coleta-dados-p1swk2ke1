import { z } from 'zod'

export const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
  'TO',
]

export const surveySchema = z.object({
  // Geral
  form_number: z.string().max(50, 'Máximo 50 caracteres').optional(),
  survey_date: z.string().min(1, 'Data da vistoria é obrigatória'),
  city: z.string().min(1, 'Cidade é obrigatória').max(100, 'Máximo 100 caracteres').default('Macapá'),
  state: z.string().length(2, 'UF deve ter 2 caracteres').default('AP'),
  surveyor_name: z.string().optional(),
  surveyor_signature: z.string().optional(),
  assinatura_requerente: z.string().optional(),

  // Location update fields
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  // Applicant
  applicant_name: z.string().min(1, 'Nome do requerente é obrigatório').max(255, 'Máximo 255 caracteres'),
  applicant_cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .refine((v) => /^\d{11}$/.test(v.replace(/\D/g, '')), 'CPF inválido'),
  applicant_rg: z.string().max(20, 'Máximo 20 caracteres').optional(),
  applicant_civil_status: z.string().optional(),
  applicant_profession: z.string().max(100, 'Máximo 100 caracteres').optional(),
  applicant_income: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true
      const normalized = v.replace(',', '.')
      const n = Number(normalized)
      return !Number.isNaN(n) && n >= 0 && n <= 999999.99
    }, 'Renda inválida'),
  applicant_nis: z.string().max(11, 'Máximo 11 caracteres').optional(),
  spouse_name: z.string().max(255, 'Máximo 255 caracteres').optional(),
  spouse_cpf: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true
      return /^\d{11}$/.test(v.replace(/\D/g, ''))
    }, 'CPF inválido'),
  declaracao_requerente: z.boolean().default(false),

  residents_count: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Número de moradores não pode ser negativo')
    .max(50, 'Máximo 50 moradores'),
  has_children: z.boolean(),

  // Occupation & Characteristics
  occupation_time: z.string().optional(),
  acquisition_mode: z.string().optional(),
  property_use: z.string().optional(),
  construction_type: z.string().optional(),
  roof_type: z.string().optional(),
  floor_type: z.string().optional(),
  rooms_count: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Número de cômodos não pode ser negativo')
    .max(20, 'Máximo 20 cômodos'),
  conservation_state: z.string().optional(),
  fencing: z.string().optional(),

  // Infrastructure
  water_supply: z.string().optional(),
  energy_supply: z.string().optional(),
  sanitation: z.string().optional(),
  street_paving: z.string().optional(),

  observations: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  // Documentos: aceitar strings ou Date no uploadedAt e campos opcionais para evitar bloqueio de validação
  documents: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        size: z.number(),
        type: z.string(),
        data: z.string().optional(),
        url: z.string().optional(),
        uploadedAt: z.union([z.string(), z.date()]).optional(),
      }),
    )
    .optional()
    .default([]),
  
  // AI Analysis fields
  analise_ia_classificacao: z.string().optional(),
  analise_ia_parecer: z.string().optional(),
  analise_ia_proximo_passo: z.string().optional(),
  analise_ia_gerada_em: z.string().optional(),
})

export type SurveyFormValues = z.infer<typeof surveySchema>
