# REURB Coleta de Dados - Instruções para Agentes de IA

## 🎯 Visão Geral do Projeto

Sistema de coleta de dados para **REURB** (Regularização Fundiária Urbana - Lei 13.465/2017) desenvolvido em **React 19 + TypeScript + Supabase** com **Vite** como build tool. Aplicação mobile-first (porta 8080) para coleta de dados em campo com sincronização **offline-first** (LocalStorage → Supabase). Próximas versões: agentes de IA para análise/classificação de REURB-E/S (Lei 13.465/2017).

**Stack**: React 19, TypeScript, Vite, Shadcn UI, Tailwind CSS, React Hook Form, Zod, Supabase, Google Maps API

## 🏗️ Arquitetura Principal

### Hierarquia de Dados (Cascata Obrigatória)
```
reurb_projects (projetos)
    ↓ (project_id)
reurb_quadras (quadras/blocos)
    ↓ (quadra_id)
reurb_properties (lotes/propriedades)
    ↓ (property_id)
reurb_surveys (vistorias/formulários)
reurb_owners (proprietários)
reurb_contracts (contratos)
```
**CRÍTICO**: Sempre respeitar essa cascata. Lotes pertencem a quadras, quadras a projetos. Deletar um projeto cascateia para quadras e lotes.

### Contextos Globais

**AuthContext** (`src/contexts/AuthContext.tsx`) - `useAuth()`
```typescript
{
  user: User | null,              // Usuário atual (de reurb_profiles)
  isAuthenticated: boolean,       // Status de login
  hasPermission: (perm: string) => Promise<boolean>, // 🚨 ASSÍNCRONA - chama RPC
  signIn: (email, pass) => Promise<{error}>,
  signOut: () => Promise<void>
}
```
- `hasPermission()` é **assíncrona** porque chama RPC no Supabase
- Sempre use `await hasPermission('edit_projects')`
- Perfil carregado de `reurb_profiles` (não `auth.users`)

**SyncContext** (`src/contexts/SyncContext.tsx`) - `useSync()`
```typescript
{
  isOnline: boolean,              // Status de conectividade (navigator.onLine)
  isSyncing: boolean,             // Se está sincronizando agora
  stats: { pending, synced, failed },
  triggerSync: () => Promise<void>,
  refreshStats: () => void
}
```
- Monitora `navigator.onLine` em tempo real
- Carrega Google Maps API key de `reurb_app_config` no Supabase

## 🔒 Permissões (RBAC)

Baseado em `reurb_profiles.grupo_acesso` (não `auth.users`):
- **`Administrador`** / **`Administradores`** - acesso total (bypass de RLS)
- **`gestor`** - gerenciamento de projetos
- **`tecnico`** / **`Vistoriador`** - coleta de dados em campo
- **`analista`** / **`Analista`** - análise de dados
- **`cidadão`** / **`Externo`** - apenas visualização

```typescript
// ✅ Padrão correto para verificar permissões
const { user, hasPermission } = useAuth()
const { isAdmin, hasAnyPermission, hasAllPermissions } = usePermissions()

// Síncronas (apenas admin check)
if (user?.grupo_acesso === 'Administrador') { /* admin only */ }
if (isAdmin) { /* admin only */ }

// Assíncronas (RPC no Supabase)
if (await hasPermission('edit_projects')) { /* pode editar */ }
if (await hasAnyPermission(['edit_projects', 'manage_users'])) { /* tem alguma */ }
if (await hasAllPermissions(['edit_projects', 'view_reports'])) { /* tem todas */ }
```

**RPC Functions** (`supabase/migrations/*_implement_rbac_security.sql`):
- `can_import_csv()` - verifica se usuário pode importar CSV
- `get_table_columns(table_name)` - retorna colunas de uma tabela
- `has_permission(permission_name)` - verifica permissão específica

## 🔄 Fluxo Offline-First (CRÍTICO - NUNCA VIOLAR)

```
╔════════════════════════════════════════════════════════╗
║  db.ts (LocalStorage)                                   ║
║    ↓ salva com sync_status='pending'                    ║
║  syncService.ts (orquestra sincronização)               ║
║    ↓ pushPendingItems()                                 ║
║  api.ts (Supabase)                                      ║
║    ↓ atualiza sync_status='synchronized'                ║
╚════════════════════════════════════════════════════════╝
```

```typescript
// ❌ ERRADO: Salva direto no Supabase - quebra offline-first
await supabase.from('reurb_projects').insert(data)

// ✅ CORRETO: Camada LocalStorage primeiro
db.saveProject(data)                      // salva local com sync_status='pending'
await syncService.pushPendingItems()       // sincroniza quando online

// ✅ CORRETO: Leitura com fallback
const projects = db.getProjects()          // busca local primeiro
if (navigator.onLine) {
  await api.getProjects()                  // atualiza do Supabase se online
}
```

**Importante**: Services (`projectService.ts`, `quadraService.ts`) abstraem essa lógica. Use-os nas páginas/componentes.

## 📝 Comandos Principais

```bash
npm start           # Dev server em http://localhost:8080 (não 5173!)
npm run build       # Build produção (minificado)
npm run build:dev   # Build dev (com sourcemaps)
npm run lint        # oxlint (não ESLint!)
npm run lint:fix    # corrige automaticamente
npm run format      # Prettier
npm run preview     # Testa build local
```

**Nota**: Usa `oxlint` (não ESLint padrão) e `rolldown-vite` (fork do Vite).

## 🎨 Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (`SurveyForm.tsx`, `GoogleMap.tsx`)
- **Services**: camelCase (`api.ts`, `syncService.ts`, `projectService.ts`)
- **Hooks**: `use` prefix (`useAuth()`, `usePermissions()`, `useSync()`)
- **Types**: PascalCase (`Project`, `Quadra`, `Lote`, `Survey`)
- **Migrations**: timestamp + descritivo (`20260105180000_create_reurb_schema.sql`)

### Organização de Imports
```typescript
// 1. React/libs externos
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

// 2. Contextos/hooks
import { useAuth } from '@/contexts/AuthContext'
import { useSync } from '@/contexts/SyncContext'

// 3. Services
import { db } from '@/services/db'
import { syncService } from '@/services/syncService'

// 4. Types
import { Project, Lote, Survey } from '@/types'

// 5. Componentes
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
```

### Tipos
- Centralizados em `src/types/` (não espalhar tipos inline)
- `index.ts` - tipos principais (Project, Quadra, Lote, Survey, User)
- `reurb.types.ts` - tipos específicos REURB
- `csv-import.types.ts` - tipos do sistema de importação

## 🔧 Serviços (Camada de Abstração)

```
╔════════════════════════════════════════════════════════╗
║ Páginas/Componentes                                     ║
║    ↓ usam services (não db/api direto)                  ║
║ projectService.ts, quadraService.ts                     ║
║    ↓ abstraem lógica + caching                          ║
║ db.ts (LocalStorage) ←→ api.ts (Supabase)              ║
║         ↑ orquestrado por                               ║
║ syncService.ts                                          ║
╚════════════════════════════════════════════════════════╝
```

**Serviços disponíveis**:
- `projectService.ts` - CRUD projetos + caching
- `quadraService.ts` - CRUD quadras + caching
- `csvImportService.ts` - importação dinâmica de CSV
- `userService.ts` - gerenciamento de usuários/perfis
- `geocoding.ts` - conversão endereço ↔ coordenadas
- `report.ts` - geração de relatórios
- `documentService.ts` - upload/gerenciamento de documentos
- **`imageService.ts`** - 🆕 upload de imagens para Supabase Storage (compressão automática)
- `analiseIA.ts` - análise de REURB-E/S via IA (futuro)
- `notification.ts` - notificações push/email

**seedData.ts**: Dados de seed para desenvolvimento (projetos, quadras, lotes exemplo)

## 🖼️ Componentes UI Principais

### SurveyForm.tsx (~1924 linhas)
- **60+ campos** divididos em **4 tabs**:
  1. Dados Gerais (número, data, cidade/estado)
  2. Requerente (nome, CPF, RG, estado civil, profissão, renda, NIS, cônjuge)
  3. Características (tempo ocupação, modo aquisição, uso, tipo construção, quartos, infraestrutura)
  4. Documentos + Observações + Assinaturas
- **Zod validation** com `react-hook-form`
- **Referência obrigatória**: [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md) - mapeamento 1:1 BD ↔ UI
- **Campos de IA** (futuros): `analise_ia_classificacao`, `analise_ia_parecer`, `analise_ia_proximo_passo`

### PhotoCapture
- Upload direto para **Supabase Storage** (`reurb-images` bucket)
- **Compressão automática** de imagens (max 1200x1200px, 80% quality)
- Armazena apenas **URLs** no LocalStorage (não base64!)
- Modo offline com URLs temporárias (blob:)
- Fix do erro `setState() during render`
- Uso: `<PhotoCapture initialPhotos={[]} onPhotosChange={fn} propertyId="lote-id" />`
- **CRÍTICO**: Sempre passar `propertyId` para organizar uploads

### CSVImporter
- Mapeamento dinâmico de colunas CSV → campos do banco
- 4 passos: Upload → Mapeamento → Importação → Resultado
- RPC `can_import_csv()`, `get_table_columns()`
- Docs: [CSV-IMPORT-README.md](CSV-IMPORT-README.md), [CSV-EXAMPLES.md](CSV-EXAMPLES.md)

### Layout & Navegação
- `Layout.tsx` - estrutura base da aplicação
- `BottomNav.tsx` - navegação bottom bar (mobile-first)
- `SyncIndicator.tsx` - indicador visual de status de sincronização
- `Header.tsx` - cabeçalho com menu e perfil

## 🪝 Padrões de Hooks

```typescript
// Auth & Permissions
const { user, isAuthenticated, hasPermission, signIn, signOut } = useAuth()
const { isAdmin, hasAnyPermission, hasAllPermissions } = usePermissions()

// Sync & Network
const { isOnline, isSyncing, stats, triggerSync } = useSync()

// UI
const { toast } = useToast()   // sonner toast notifications
const form = useForm<Schema>({ resolver: zodResolver(schema) })

// React básicos
const [state, setState] = useState<T>(initial)
const [loading, setLoading] = useState(false)
useEffect(() => { /* side effect */ }, [deps])
```

## 🔨 Fluxos de Desenvolvimento

### Adicionar Campo em Lote/Survey
1. **Tipo**: Adicionar em `src/types/index.ts` (interface `Lote` ou `Survey`)
2. **Migration**: Criar em `supabase/migrations/` (formato: `YYYYMMDDHHMMSS_description.sql`)
   ```sql
   ALTER TABLE reurb_properties ADD COLUMN novo_campo VARCHAR(100);
   ALTER TABLE reurb_surveys ADD COLUMN novo_campo_survey TEXT;
   ```
3. **db.ts**: Atualizar `saveLote()` / `loadLote()` ou `saveSurvey()` / `getSurveys()`
4. **api.ts**: Atualizar `mapLote()` ou `mapSurvey()` (mapeamento Supabase → tipo local)
5. **UI**: Adicionar campo em `LoteForm.tsx` ou `SurveyForm.tsx`
6. **[OBRIGATÓRIO para Survey]**: Documentar em [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md)

### Criar Nova Migration
```bash
# Nomenclatura: YYYYMMDDHHMMSS_description.sql
# Exemplo: 20260111150000_add_email_to_surveys.sql
```
```sql
-- Template migration
BEGIN;

-- Suas alterações aqui
ALTER TABLE reurb_surveys ADD COLUMN email VARCHAR(100);

-- Atualizar RLS policies se necessário
CREATE POLICY "Users can read own surveys"
  ON reurb_surveys FOR SELECT
  USING (auth.uid() IN (SELECT id FROM reurb_profiles WHERE situacao = 'ativo'));

COMMIT;
```

### Importar CSV
1. Verificar permissão: `await hasPermission('edit_projects')` ou `isAdmin`
2. Usar `<CSVImporter targetTable="reurb_properties" onComplete={...} />`
3. Sistema mapeia colunas automaticamente via `get_table_columns()`
4. Importação com upsert (evita duplicatas)

## ⚠️ Erros Comuns (Evite!)

1. **❌ Salvar direto no Supabase** → Quebra offline-first
   ```typescript
   // ❌ NUNCA faça isso em páginas/componentes
   await supabase.from('reurb_projects').insert(data)
   
   // ✅ Use services ou db.ts
   db.saveProject(data)
   await syncService.pushPendingItems()
   ```

2. **❌ Esquecer `await` em `hasPermission()`** → Sempre retorna Promise
   ```typescript
   // ❌ ERRADO - hasPermission retorna Promise, não boolean
   if (hasPermission('edit_projects')) { }
   
   // ✅ CORRETO
   if (await hasPermission('edit_projects')) { }
   ```

3. **❌ Editar SurveyForm sem documentar** → Campos ficam sem mapeamento
   - **SEMPRE** atualizar [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md) ao mexer em surveys

4. **❌ Remover campos legados** (`field_348`, `field_350`, etc.) → Seed data usa
   - Campos `field_*` são mantidos para compatibilidade com dados antigos

5. **❌ Usar `supabase.from()` em páginas** → Ignorar camada de services
   ```typescript
   // ❌ EVITAR
   const { data } = await supabase.from('reurb_projects').select('*')
   
   // ✅ PREFERIR
   const projects = await projectService.getAll()
   ```

6. **❌ Ignorar `sync_status` na UI** → Não mostra itens pendentes
   - Sempre renderizar badge/indicador para itens com `sync_status='pending'` ou `'failed'`

7. **❌ Modificar `src/lib/supabase/client.ts`** →

9. **❌ Salvar imagens como base64 no LocalStorage** → Excede cota (QuotaExceededError)
   ```typescript
   // ❌ NUNCA armazene base64 de imagens
   lote.images = ['data:image/jpeg;base64,/9j/4AAQ...'] // ERRADO!
   
   // ✅ Use imageService para upload
   const urls = await imageService.uploadImages(files, loteId)
- [IMAGE-UPLOAD-FIX.md](IMAGE-UPLOAD-FIX.md) - 🆕 Solução para QuotaExceededError em uploads
   lote.images = urls // URLs do Supabase Storage
   ```
   - Ver [IMAGE-UPLOAD-FIX.md](IMAGE-UPLOAD-FIX.md) para detalhes É gerado automaticamente
   - Comentário no topo: `// AVOID UPDATING THIS FILE DIRECTLY`

8. **❌ Usar porta 5173 (padrão Vite)** → Configurado para 8080
   - Sempre `npm start` → `http://localhost:8080`

## 📚 Documentação de Referência

### Documentos Principais
- [README.md](README.md) - Setup, stack, Node 18+
- [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md) - **ESSENCIAL** - mapeamento 1:1 BD ↔ UI
- [CSV-IMPORT-README.md](CSV-IMPORT-README.md) - Sistema de importação CSV
- [CSV-EXAMPLES.md](CSV-EXAMPLES.md) - Exemplos de CSV válidos
- [IMAGE-UPLOAD-FIX.md](IMAGE-UPLOAD-FIX.md) - Solução para QuotaExceededError em uploads
- [COORDINATES-FIX.md](COORDINATES-FIX.md) - 🆕 Fix de latitude/longitude não salvando

### Scripts SQL de Diagnóstico (root)
- `analyze_*.sql` - Análise de estrutura/dados
- `20260111120000_create_storage_bucket_images.sql` - 🆕 Bucket de imagens no Storage
- `check_*.sql` - Verificação de integridade
- `debug_*.sql` - Debug de RLS/permissões
- `fix_*.sql` - Correções de dados
- `populate_*.sql` - População de dados de teste

### Migrations (supabase/migrations/)
- `20260105180000_create_reurb_schema.sql` - Schema base
- `20260105183000_create_profiles.sql` - Tabela de perfis
- `20260106030000_create_surveys_schema.sql` - Schema de vistorias
- `20260108160000_implement_rbac_security.sql` - RBAC + RLS
- `20260108220000_add_csv_import_functions.sql` - Funções de importação
- `20260109150000_add_analise_ia_to_surveys.sql` - Campos de análise IA (futuros)

## 🚀 Próximas Funcionalidades

- **Agentes de IA** para análise/classificação de REURB-E vs REURB-S (Lei 13.465/2017)
- Campos já no schema: `analise_ia_classificacao`, `analise_ia_parecer`, `analise_ia_proximo_passo`
- Service preparado: `analiseIA.ts`

---

**Versão**: 1.4.4+ | **Status**: Produção pronta | **Build Tool**: Vite (rolldown-vite) | **Lint**: oxlint
