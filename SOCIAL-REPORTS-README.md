# Sistema de Pareceres do Assistente Social - Documentação

## 📋 Visão Geral

Sistema completo para criação, edição e gerenciamento de **Pareceres Conclusivos** elaborados por assistentes sociais para cada lote do REURB.

## 🗂️ Estrutura do Banco de Dados

### Tabela: `reurb_social_reports`

```sql
CREATE TABLE reurb_social_reports (
    id UUID PRIMARY KEY,
    
    -- Referências (cascata obrigatória)
    project_id UUID NOT NULL REFERENCES reurb_projects(id),
    quadra_id UUID NOT NULL REFERENCES reurb_quadras(id),
    property_id UUID NOT NULL REFERENCES reurb_properties(id),
    
    -- Conteúdo do parecer (HTML do editor WYSIWYG)
    parecer TEXT NOT NULL,
    
    -- Identificação e registro
    numero_registro VARCHAR(50) UNIQUE, -- Ex: "2026/001-REURB-AP"
    
    -- Assinatura eletrônica (hash ou URL)
    assinatura_eletronica TEXT,
    
    -- Informações do assistente social
    nome_assistente_social VARCHAR(255) NOT NULL,
    cress_assistente_social VARCHAR(50),
    email_assistente_social VARCHAR(255),
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status do parecer
    status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, finalizado, revisado, aprovado
    
    -- Versionamento
    versao INTEGER DEFAULT 1,
    parecer_anterior_id UUID REFERENCES reurb_social_reports(id)
);
```

## 🔒 Permissões (RLS)

- **Visualização**: Todos os usuários autenticados
- **Criação/Edição**: Apenas **Administradores** e **Assistentes Sociais**
- **Exclusão**: Apenas **Administradores**

## 🎨 Componentes

### 1. RichTextEditor (`src/components/RichTextEditor.tsx`)

Editor WYSIWYG baseado em **TipTap** (React 19 compatível).

**Recursos**:
- **Formatação**: Negrito, itálico, sublinhado
- **Listas**: Com marcadores e numeradas
- **Alinhamento**: Esquerda, centro, direita, justificado
- **Links**: Inserir URLs
- **Histórico**: Desfazer/Refazer
- **Modo leitura**: Readonly para visualização

**Uso**:
```tsx
<RichTextEditor
  content={html}
  onChange={(newHtml) => setHtml(newHtml)}
  placeholder="Digite o parecer..."
  readOnly={false}
/>
```

### 2. SocialReportForm (`src/components/SocialReportForm.tsx`)

Formulário completo para criar/editar pareceres.

**Props**:
```typescript
{
  open: boolean
  onClose: () => void
  propertyId: string
  quadraId: string
  projectId: string
  existingReport?: SocialReport | null
  onSuccess?: () => void
  // Contextuais
  propertyName?: string
  quadraName?: string
  projectName?: string
}
```

**Campos**:
- Nome completo do assistente social **(obrigatório)**
- CRESS (registro profissional)
- E-mail
- **Parecer** (HTML via editor WYSIWYG, mínimo 50 caracteres)
- Status (rascunho/finalizado/revisado/aprovado)
- Assinatura eletrônica (hash ou código)

**Validação**: Zod schema com regras de negócio

### 3. SocialReports (`src/pages/SocialReports.tsx`)

Página de listagem e gerenciamento.

**Funcionalidades**:
- ✅ Listagem com filtros (busca + status)
- ✅ Criar novo parecer
- ✅ Editar parecer existente
- ✅ Exportar para PDF
- ✅ Excluir parecer (apenas admins)
- ✅ Badges de status coloridos
- ✅ Filtros por projeto/quadra/lote via URL query params

**Acesso**: `/pareceres`

## 🛠️ Service: socialReportService

### Métodos Principais

#### `getAll(filters?)`
Busca todos os pareceres com filtros opcionais:
```typescript
const reports = await socialReportService.getAll({
  project_id: 'uuid',
  quadra_id: 'uuid',
  property_id: 'uuid',
  status: 'finalizado'
})
```

#### `getById(id)`
Busca parecer específico por ID:
```typescript
const report = await socialReportService.getById('uuid')
```

#### `getByPropertyId(propertyId)`
Busca parecer mais recente de um lote:
```typescript
const report = await socialReportService.getByPropertyId('property-uuid')
```

#### `create(data)`
Cria novo parecer (gera número de registro automaticamente):
```typescript
const report = await socialReportService.create({
  project_id: 'uuid',
  quadra_id: 'uuid',
  property_id: 'uuid',
  parecer: '<p>Conteúdo HTML</p>',
  nome_assistente_social: 'Maria Silva',
  cress_assistente_social: 'CRESS 1234/AP',
  status: 'rascunho'
})
```

#### `update(id, updates)`
Atualiza parecer existente:
```typescript
await socialReportService.update('uuid', {
  status: 'finalizado',
  parecer: '<p>Novo conteúdo</p>'
})
```

#### `createVersion(originalId, updates)`
Cria nova versão do parecer (histórico):
```typescript
const newVersion = await socialReportService.createVersion('uuid', {
  parecer: '<p>Versão revisada</p>',
  status: 'revisado'
})
```

#### `exportToPDF(reportId)`
Gera PDF do parecer via window.print():
```typescript
await socialReportService.exportToPDF('uuid')
```

#### `getVersionHistory(reportId)`
Retorna histórico de versões:
```typescript
const versions = await socialReportService.getVersionHistory('uuid')
// Retorna array ordenado por versão decrescente
```

## 📊 Tipos TypeScript

```typescript
interface SocialReport {
  id: string
  project_id: string
  quadra_id: string
  property_id: string
  parecer: string // HTML
  numero_registro?: string // 2026/001-REURB-AP
  assinatura_eletronica?: string
  nome_assistente_social: string
  cress_assistente_social?: string
  email_assistente_social?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  status: 'rascunho' | 'finalizado' | 'revisado' | 'aprovado'
  versao: number
  parecer_anterior_id?: string
  // Relacionamentos (populados via JOIN)
  project_name?: string
  quadra_name?: string
  property_name?: string
}
```

## 🔢 Geração Automática de Números

A função PostgreSQL `generate_report_number()` gera números no formato:

```
YYYY/NNN-REURB-AP

Exemplos:
2026/001-REURB-AP
2026/002-REURB-AP
2027/001-REURB-AP (reset anual)
```

**Uso no service**: Chamado automaticamente no `create()` se não fornecido manualmente.

## 📄 Exportação de PDF

O método `exportToPDF()` gera um documento HTML formatado e abre em nova janela para impressão/salvamento.

**Conteúdo do PDF**:
- Cabeçalho com título "PARECER CONCLUSIVO - ASSISTÊNCIA SOCIAL"
- Número de registro, projeto, quadra, lote, data
- Conteúdo do parecer (HTML preservado)
- Assinatura do assistente social com nome e CRESS
- Rodapé com data de geração e hash de assinatura eletrônica

**Observação**: Para PDFs mais avançados (marcas d'água, assinatura digital), integrar biblioteca como `jsPDF` ou `pdfmake`.

## 🔄 Versionamento

Cada edição pode criar nova versão mantendo histórico:

```typescript
// Criar versão revisada
const revisedReport = await socialReportService.createVersion(originalId, {
  parecer: '<p>Conteúdo revisado</p>',
  status: 'revisado'
})

// Buscar histórico
const versions = await socialReportService.getVersionHistory(reportId)
// versions[0] = versão mais recente
// versions[n] = versão mais antiga
```

**Esquema**:
```
Versão 1 (rascunho)
   ↓ (parecer_anterior_id)
Versão 2 (finalizado)
   ↓
Versão 3 (revisado)
```

## 🚀 Como Usar

### 1. Executar Migration no Supabase

No **SQL Editor** do Supabase Dashboard, execute:
```sql
-- Copiar conteúdo de: supabase/migrations/20260111200000_create_social_reports.sql
```

**Ou use o script de teste**:
```sql
-- test_social_reports_migration.sql
```

### 2. Acessar Página de Pareceres

Navegue para: `http://localhost:8080/pareceres`

### 3. Criar Novo Parecer

1. Clique em **"Novo Parecer"**
2. Selecione **Projeto → Quadra → Lote** (ou informe IDs via props)
3. Preencha informações do assistente social
4. Digite o parecer usando o editor WYSIWYG
5. Escolha o status
6. Clique em **"Salvar Parecer"**

### 4. Editar Parecer Existente

1. Na listagem, clique no ícone de **edição** (lápis)
2. Modifique os campos desejados
3. Salvar atualiza o mesmo registro (ou use `createVersion()` para novo histórico)

### 5. Exportar PDF

1. Na listagem, clique em **"PDF"**
2. Nova janela abre com documento formatado
3. Use **Ctrl+P** (ou Cmd+P no Mac) para salvar como PDF

### 6. Filtrar Pareceres

- **Busca**: Digite número de registro, nome do assistente social ou lote
- **Status**: Selecione no dropdown (rascunho/finalizado/revisado/aprovado)
- **URL params**: `?property_id=uuid&quadra_id=uuid&project_id=uuid`

## 🔐 Controle de Acesso

### Verificação no Frontend

```typescript
const { user } = useAuth()
const canEdit = user?.grupo_acesso === 'Administrador' || 
                user?.grupo_acesso === 'Administradores' ||
                user?.grupo_acesso === 'Assistente Social'
```

### RLS no Backend

- **SELECT**: `auth.role() = 'authenticated'`
- **INSERT/UPDATE**: `grupo_acesso IN ('Administrador', 'Administradores', 'Assistente Social')`
- **DELETE**: `grupo_acesso IN ('Administrador', 'Administradores')`

## 📦 Dependências

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-underline": "^2.x",
  "@tiptap/extension-text-align": "^2.x",
  "@tiptap/extension-link": "^2.x"
}
```

**Instalação**:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-link
```

## 🐛 Troubleshooting

### Erro: "Não foi possível salvar parecer"

**Causa**: RLS bloqueando insert/update.  
**Solução**: Verificar se usuário tem grupo_acesso correto (`Assistente Social` ou `Administrador`).

### Editor não aparece

**Causa**: TipTap não inicializado.  
**Solução**: Verificar logs do console. Garantir que `useEditor` retornou editor válido.

### PDF não gera

**Causa**: Pop-up bloqueado pelo navegador.  
**Solução**: Permitir pop-ups para o domínio da aplicação.

### Número de registro duplicado

**Causa**: Geração manual com número já existente.  
**Solução**: Deixar campo vazio para geração automática via RPC.

## 📚 Próximas Melhorias

- [ ] **Assinatura digital**: Integrar com certificado ICP-Brasil
- [ ] **PDF avançado**: Usar jsPDF com marcas d'água e QR code
- [ ] **Notificações**: Enviar email ao finalizar parecer
- [ ] **Aprovação**: Workflow com múltiplos níveis (técnico → gestor → aprovação final)
- [ ] **Templates**: Modelos pré-definidos de pareceres
- [ ] **Anexos**: Upload de documentos complementares
- [ ] **Comparação de versões**: Diff visual entre versões
- [ ] **Sincronização offline**: LocalStorage → Supabase (seguir padrão offline-first)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do console do navegador
2. Consultar [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md)
3. Checar RLS policies no Supabase Dashboard

---

**Versão**: 0.0.126  
**Data**: Janeiro 2026  
**Autor**: Sistema REURB - Amapá Terras
