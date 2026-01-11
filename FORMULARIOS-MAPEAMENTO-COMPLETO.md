# 📋 MAPEAMENTO COMPLETO DE FORMULÁRIOS - REURB COLETA DE DADOS

## 🎯 OBJETIVO
Garantir 100% de paridade entre estrutura do banco de dados e interfaces de formulários (Inclusão/Edição).

---

## 📊 TABELA DE-para: CAMPO BANCO → COMPONENTE FORMULÁRIO

### 🏠 **TABELA: reurb_properties (Lotes)**

| Campo do Banco | Tipo SQL | Componente | Nome Input | Validação | Obrigatório |
|----------------|----------|------------|------------|-----------|-------------|
| id | UUID/TEXT | Hidden | id | - | Não (auto) |
| name | VARCHAR(255) | Input Text | name | Required, Max 255 | ✅ Sim |
| address | TEXT | Textarea | address | Max 1000 | Não |
| area | DECIMAL(10,2) | Input Number | area | Required, Min 0 | ✅ Sim |
| description | TEXT | Textarea | description | Max 2000 | Não |
| images | JSON | PhotoCapture | images | Max 10 fotos | Não |
| latitude | DECIMAL(10,8) | Input Text | latitude | Pattern: ^-?\d+\.\d+$ | Não |
| longitude | DECIMAL(11,8) | Input Text | longitude | Pattern: ^-?\d+\.\d+$ | Não |
| quadra_id | UUID | Select | quadra_id | Required | ✅ Sim |
| status | VARCHAR(50) | Select | status | Enum | Não |
| created_at | TIMESTAMP | Hidden/Readonly | created_at | - | Não (auto) |
| updated_at | TIMESTAMP | Hidden/Readonly | updated_at | - | Não (auto) |

---

### 📋 **TABELA: reurb_surveys (Vistorias)**

| Campo do Banco | Tipo SQL | Componente | Nome Input | Validação | Obrigatório |
|----------------|----------|------------|------------|-----------|-------------|
| id | UUID/TEXT | Hidden | id | - | Não (auto) |
| property_id | UUID | Hidden | property_id | Required | ✅ Sim |
| form_number | VARCHAR(50) | Input Text | form_number | Max 50 | Não |
| survey_date | DATE | Input Date | survey_date | Required | ✅ Sim |
| city | VARCHAR(100) | Input Text | city | Required, Max 100 | ✅ Sim |
| state | VARCHAR(2) | Select | state | Required, Enum UF | ✅ Sim |

#### 👤 **REQUERENTE**
| Campo | Tipo | Componente | Validação | Obrigatório |
|--------|------|------------|-----------|-------------|
| applicant_name | VARCHAR(255) | Input Text | Required, Max 255 | ✅ Sim |
| applicant_cpf | VARCHAR(11) | Input Text | CPF Pattern | ✅ Sim |
| applicant_rg | VARCHAR(20) | Input Text | Max 20 | Não |
| applicant_civil_status | VARCHAR(50) | Select | Enum | Não |
| applicant_profession | VARCHAR(100) | Input Text | Max 100 | Não |
| applicant_income | DECIMAL(10,2) | Input Number | Min 0 | Não |
| applicant_nis | VARCHAR(11) | Input Text | Max 11 | Não |
| spouse_name | VARCHAR(255) | Input Text | Max 255 | Não |
| spouse_cpf | VARCHAR(11) | Input Text | CPF Pattern | Não |

#### 🏠 **DOMICÍLIO**
| Campo | Tipo | Componente | Validação | Obrigatório |
|--------|------|------------|-----------|-------------|
| residents_count | INTEGER | Input Number | Min 0, Max 50 | ✅ Sim |
| has_children | BOOLEAN | Checkbox | - | ✅ Sim |

#### 🏗️ **CARACTERÍSTICAS**
| Campo | Tipo | Componente | Validação | Obrigatório |
|--------|------|------------|-----------|-------------|
| occupation_time | VARCHAR(50) | Select | Enum | Não |
| acquisition_mode | VARCHAR(50) | Select | Enum | Não |
| property_use | VARCHAR(50) | Select | Enum | Não |
| construction_type | VARCHAR(50) | Select | Enum | Não |
| roof_type | VARCHAR(50) | Select | Enum | Não |
| floor_type | VARCHAR(50) | Select | Enum | Não |
| rooms_count | INTEGER | Input Number | Min 0, Max 20 | ✅ Sim |
| conservation_state | VARCHAR(50) | Select | Enum | Não |
| fencing | VARCHAR(50) | Select | Enum | Não |

#### 🔧 **INFRAESTRUTURA**
| Campo | Tipo | Componente | Validação | Obrigatório |
|--------|------|------------|-----------|-------------|
| water_supply | VARCHAR(50) | Select | Enum | Não |
| energy_supply | VARCHAR(50) | Select | Enum | Não |
| sanitation | VARCHAR(50) | Select | Enum | Não |
| street_paving | VARCHAR(50) | Select | Enum | Não |

#### � **DOCUMENTOS**
| Campo | Tipo | Componente | Validação | Obrigatório |
|--------|------|------------|-----------|-------------|
| documents | JSONB | DocumentUpload | Max 20 arquivos, 10MB cada | Não |

#### �📝 **OBSERVAÇÕES**
| Campo | Tipo | Componente | Validação | Obrigatório |
|--------|------|------------|-----------|-------------|
| observations | TEXT | Textarea | Max 2000 | Não |
| surveyor_name | VARCHAR(255) | Input Text | Max 255 | Não |

---

## 🎨 **ESTRUTURA DOS FORMULÁRIOS (BASEADO NAS IMAGENS)**

### 📄 **ABA 1: DADOS GERAIS**
```
┌─────────────────────────────────────────┐
│ 📋 DADOS GERAIS                          │
├─────────────────────────────────────────┤
│ Número do Formulário: [____________]     │
│ Data da Vistoria: [__/__/____]          │
│ Município: [Macapá ▼]                  │
│ UF: [AP ▼]                             │
│ Vistoriador: [____________]            │
└─────────────────────────────────────────┘
```

### 👤 **ABA 2: REQUERENTE**
```
┌─────────────────────────────────────────┐
│ 👤 DADOS DO REQUERENTE                   │
├─────────────────────────────────────────┤
│ Nome: [________________________] *      │
│ CPF: [___.___.___-__] *                │
│ RG: [__________]                       │
│ Estado Civil: [Solteiro ▼]             │
│ Profissão: [________________]          │
│ Renda: R$ [_________]                  │
│ NIS: [___________]                     │
│                                         │
│ 🧑‍🤝‍🧑 CÔNJUGE (se houver)              │
│ Nome: [________________________]      │
│ CPF: [___.___.___-__]                  │
└─────────────────────────────────────────┘
```

### 🏠 **ABA 3: DOMICÍLIO**
```
┌─────────────────────────────────────────┐
│ 🏠 DOMICÍLIO                            │
├─────────────────────────────────────────┤
│ Nº Moradores: [__] *                   │
│ Possui Filhos: ☐ Sim ☐ Não *           │
│                                         │
│ 📍 ENDEREÇO (se diferente)             │
│ Endereço: [________________________]   │
│ Latitude: [___._______]                │
│ Longitude: [___.________]              │
└─────────────────────────────────────────┘
```

### 🏗️ **ABA 4: CARACTERÍSTICAS DO IMÓVEL**
```
┌─────────────────────────────────────────┐
│ 🏗️ CARACTERÍSTICAS                      │
├─────────────────────────────────────────┤
│ Tempo de Ocupação: [Mais de 5 anos ▼]   │
│ Modo de Aquisição: [Doação ▼]           │
│ Uso do Imóvel: [Residencial ▼]          │
│ Tipo de Construção: [Alvenaria ▼]       │
│ Tipo de Telhado: [Telha ▼]              │
│ Tipo de Piso: [Cerâmica ▼]              │
│ Nº de Cômodos: [__] *                  │
│ Estado de Conservação: [Bom ▼]          │
│ Cercamento: [Madeira ▼]                 │
└─────────────────────────────────────────┘
```

### 🔧 **ABA 5: INFRAESTRUTURA**
```
┌─────────────────────────────────────────┐
│ 🔧 INFRAESTRUTURA                       │
├─────────────────────────────────────────┤
│ Abastecimento de Água: [Rede pública ▼] │
│ Energia Elétrica: [Rede pública ▼]      │
│ Saneamento: [Fossa séptica ▼]           │
│ Pavimentação: [Terra ▼]                 │
└─────────────────────────────────────────┘
```

### � **ABA 6: DOCUMENTOS**
```
┌─────────────────────────────────────────┐
│ 📎 DOCUMENTOS DA VISTORIA               │
├─────────────────────────────────────────┤
│ Anexe documentos relevantes para a      │
│ vistoria (RG, CPF, comprovantes, etc.)  │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 📤 Clique ou arraste documentos  │   │
│ │    Máximo 20 arquivos, 10MB cada │   │
│ │    PDF, Imagens, Word, Excel     │   │
│ └───────────────────────────────────┘   │
│                                         │
│ 📄 documento1.pdf (2.3 MB)     [x]      │
│ 🖼️ foto_rg.jpg (1.1 MB)       [x]      │
└─────────────────────────────────────────┘
```

### 📝 **ABA 7: OBSERVAÇÕES**
```
┌─────────────────────────────────────────┐
│ 📝 OBSERVAÇÕES                          │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │ [Textarea para observações...]      │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔍 **VALIDAÇÕES ESPECÍFICAS**

### 📋 **CPF**
```typescript
const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{5}$/
const cpfValidation = (value: string) => {
  // Validação de CPF completo
  return cpfPattern.test(value) && isValidCPF(value)
}
```

### 📍 **Coordenadas**
```typescript
const latPattern = /^-?\d{1,3}\.\d{1,8}$/
const lngPattern = /^-?\d{1,4}\.\d{1,8}$/
```

### 💰 **Renda**
```typescript
const incomeValidation = (value: number) => {
  return value >= 0 && value <= 999999.99
}
```

### 📊 **Contadores**
```typescript
const residentsValidation = (value: number) => {
  return value >= 0 && value <= 50
}
const roomsValidation = (value: number) => {
  return value >= 0 && value <= 20
}
```

---

## 🎯 **ESTRUTURA DE COMPONENTES**

### 📄 **Formulário de Lote (LoteForm.tsx)**
```typescript
interface LoteFormProps {
  loteId?: string
  quadraId?: string
  mode?: 'create' | 'edit'
}

const LoteFormSchema = z.object({
  id: z.string().optional(), // Hidden em edição
  name: z.string().min(1, 'Nome obrigatório').max(255),
  address: z.string().max(1000).optional(),
  area: z.string().min(1, 'Área obrigatória'),
  description: z.string().max(2000).optional(),
  latitude: z.string().regex(latPattern).optional(),
  longitude: z.string().regex(lngPattern).optional(),
  quadra_id: z.string().min(1, 'Quadra obrigatória'),
  status: z.enum(['not_surveyed', 'surveyed', 'regularized']).optional(),
  images: z.array(z.string()).max(10).optional(),
})
```

### 📋 **Formulário de Vistoria (SurveyForm.tsx)**
```typescript
interface SurveyFormProps {
  propertyId: string
  surveyId?: string
  mode?: 'create' | 'edit'
}

const SurveyFormSchema = z.object({
  // Dados Gerais
  id: z.string().optional(),
  property_id: z.string(),
  form_number: z.string().max(50).optional(),
  survey_date: z.string().min(1, 'Data obrigatória'),
  city: z.string().min(1, 'Cidade obrigatória').max(100),
  state: z.string().min(2, 'UF obrigatório').max(2),
  surveyor_name: z.string().max(255).optional(),
  
  // Requerente
  applicant_name: z.string().min(1, 'Nome obrigatório').max(255),
  applicant_cpf: z.string().regex(cpfPattern, 'CPF inválido'),
  applicant_rg: z.string().max(20).optional(),
  applicant_civil_status: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo']).optional(),
  applicant_profession: z.string().max(100).optional(),
  applicant_income: z.number().min(0).max(999999.99).optional(),
  applicant_nis: z.string().max(11).optional(),
  spouse_name: z.string().max(255).optional(),
  spouse_cpf: z.string().regex(cpfPattern).optional(),
  
  // Domicílio
  residents_count: z.number().min(0).max(50),
  has_children: z.boolean(),
  
  // Características
  occupation_time: z.enum(['menos_1_ano', '1_5_anos', 'mais_5_anos']).optional(),
  acquisition_mode: z.enum(['compra', 'doacao', 'heranca', 'posse']).optional(),
  property_use: z.enum(['residencial', 'comercial', 'misto']).optional(),
  construction_type: z.enum(['alvenaria', 'madeira', 'misto']).optional(),
  roof_type: z.enum(['telha', 'zinco', 'fibra', 'laje']).optional(),
  floor_type: z.enum(['ceramica', 'cimento', 'madeira', 'terra']).optional(),
  rooms_count: z.number().min(0).max(20),
  conservation_state: z.enum(['otimo', 'bom', 'regular', 'ruim']).optional(),
  fencing: z.enum(['alvenaria', 'madeira', 'metal', 'arame']).optional(),
  
  // Infraestrutura
  water_supply: z.enum(['rede_publica', 'poco', 'cisterna', 'rio']).optional(),
  energy_supply: z.enum(['rede_publica', 'gerador', 'painel_solar', 'nenhuma']).optional(),
  sanitation: z.enum(['rede_publica', 'fossa_septica', 'fossa_negra', 'a_ceu_aberto']).optional(),
  street_paving: z.enum(['asfalto', 'paralelepipedo', 'terra', 'cascalho']).optional(),
  
  // Observações
  observations: z.string().max(2000).optional(),
})
```

---

## 🔄 **FLUXO DE DADOS**

### 📝 **Criação**
1. Formulário vazio com defaults
2. Validação em tempo real
3. Submit → API → Banco
4. Feedback de sucesso/erro

### ✏️ **Edição**
1. Carregar dados existentes (pre-fill)
2. Campo ID como hidden
3. Campos auditativos como readonly
4. Submit → API → Banco (UPDATE)
5. Feedback de sucesso/erro

---

## 🎨 **ESTRUTURA VISUAL DAS ABAS**

```typescript
const tabs = [
  { id: 'general', label: 'Dados Gerais', icon: FileText },
  { id: 'applicant', label: 'Requerente', icon: User },
  { id: 'household', label: 'Domicílio', icon: Home },
  { id: 'property', label: 'Imóvel', icon: Building },
  { id: 'infrastructure', label: 'Infraestrutura', icon: Zap },
  { id: 'observations', label: 'Observações', icon: MessageSquare },
]
```

### 📝 **ABA 7: OBSERVAÇÕES E ANÁLISE JURÍDICA**

```
┌────────────────────────────────────────────────────────────┐
│ 📝 OBSERVAÇÕES DO VISTORIADOR │ 🤖 ANÁLISE JURÍDICA IA    │
├────────────────────────────────┼──────────────────────────┤
│                                │                          │
│ [Textarea de observações       │ 🟣 ANÁLISE JURÍDICA      │
│  livres sobre a vistoria       │    SisReub Insight       │
│  e condições do imóvel]        │                          │
│                                │ CLASSIFICAÇÃO SUGERIDA:  │
│                                │ [REURB-S / REURB-E]      │
│                                │                          │
│                                │ PARECER TÉCNICO:         │
│                                │ [Fundamentação legal     │
│                                │  Art. 13, Lei 13.465]    │
│                                │                          │
│                                │ PRÓXIMO PASSO:           │
│                                │ [Ações administrativas]  │
│                                │                          │
│                                │ [🔄 Regenerar Análise]   │
└────────────────────────────────┴──────────────────────────┘
```

#### 📄 **Campos:**

| Campo do Banco | Tipo SQL | Componente | Obrigatório |
|---|---|---|---|
| observations | TEXT(2000) | Textarea | Não |
| analise_ia_classificacao | VARCHAR(20) | Input Text (Read-only/Edit) | Não |
| analise_ia_parecer | TEXT | Textarea (Edit) | Não |
| analise_ia_proximo_passo | TEXT | Textarea (Edit) | Não |
| analise_ia_gerada_em | TIMESTAMP | Display | Não |

**Funcionalidade:**
- Coluna 1: Observações livres do vistoriador
- Coluna 2 (Mobile: full width): Card roxo com análise automática gerada por IA
- Botão "Gerar Análise Inteligente" dispara `analiseIAService.gerarAnalise()`
- Análise classifica entre **REURB-S** (Lei 13.465/2017 - Interesse Social) ou **REURB-E** (Interesse Específico)
- Campos editáveis após geração para validação jurídica manual
- Display da data/hora de geração

**Integração IA:**
- Service: `src/services/analiseIA.ts`
- Prepara dados: renda, moradores, NIS, infraestrutura
- Cálculo automático: renda per capita vs. limites REURB-S
- Fallback: Lógica de regras enquanto IA externa não está integrada
- TODO: Integração futura com Supabase Edge Function ou API de IA externa

---

## ✅ **CHECKLIST FINAL**

### 📋 **Para Cada Formulário:**
- [ ] Todos os campos do banco mapeados
- [ ] Tipos de dados corretos
- [ ] Validações implementadas
- [ ] Campos obrigatórios marcados
- [ ] Campos auditativos protegidos
- [ ] Nomes dos inputs idênticos às colunas
- [ ] Mensagens de erro claras
- [ ] Feedback visual de sucesso/erro
- [ ] Testes de validação
- [ ] Responsividade mobile

### 🔒 **Segurança:**
- [ ] Sanitização de inputs
- [ ] Validação server-side
- [ ] Proteção contra XSS
- [ ] Rate limiting
- [ ] Logs de auditoria

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Implementar schemas Zod completos**
2. **Criar componentes reutilizáveis**
3. **Implementar validações customizadas**
4. **Adicionar máscaras de input**
5. **Criar testes automatizados**
6. **Implementar feedback visual**
7. **Otimizar performance**
8. **Documentar API endpoints**
9. **Integrar com API de IA externa** (OpenAI, Claude, etc.)
10. **Configurar Supabase Edge Function para análise em tempo real**
**📌 NOTA:** Este documento serve como guia completo para garantir 100% de paridade entre banco e formulários. Todos os campos devem seguir exatamente esta especificação.
