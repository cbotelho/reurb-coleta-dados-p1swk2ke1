# REURB Coleta de Dados - Instruções para Agentes de IA

## 🎯 Visão Geral do Projeto

Sistema de coleta de dados para **REURB** (Regularização Fundiária Urbana - Lei 13.465/2017) desenvolvido em **React 19 + TypeScript + Supabase** com **Vite** como build tool. Aplicação mobile-first (porta 8080) para coleta de dados em campo com sincronização **offline-first** (LocalStorage → Supabase). Próximas versões: agentes de IA para análise/classificação de REURB-E/S (Lei 13.465/2017).

## 🏗️ Arquitetura Principal

### Hierarquia de Dados
```
reurb_projects → reurb_quadras → reurb_properties (lotes)
                                       ↓ relacionados
                              reurb_surveys, reurb_owners, reurb_contracts
```
**CRÍTICO**: Respeitar cascata - lotes pertencem a quadras, quadras a projetos.

### Contextos Globais

**AuthContext** - `useAuth()`: `{ user, isAuthenticated, hasPermission(), signIn(), signOut() }`
- `hasPermission()` é **assíncrona** (RPC Supabase)
- Localização: `src/contexts/AuthContext.tsx`

**SyncContext** - `useSync()`: `{ isOnline, isSyncing, stats, triggerSync(), refreshStats() }`
- Monitora `navigator.onLine`, carrega Google Maps API key em `reurb_app_config`
- Localização: `src/contexts/SyncContext.tsx`

## 🔒 Permissões (RBAC)

Via `reurb_profiles.grupo_acesso`:
- `Administrador` / `Administradores` - acesso total
- `gestor` - projetos
- `tecnico` - coleta de dados
- `analista` - análise
- `cidadão` - visualização

```typescript
const { user, hasPermission } = useAuth()

// Síncrona (admin check)
if (user?.grupo_acesso === 'Administrador') { }

// Assíncrona (RPC)
if (await hasPermission('edit_projects')) { }

// Com usePermissions()
const { isAdmin, hasAnyPermission } = usePermissions()
```

## 🔄 Fluxo Offline-First (CRÍTICO)

```
db.ts (LocalStorage) → sync_status='pending'
     ↓ syncService.pushPendingItems()
api.ts (Supabase) → sync_status='synchronized'
```

```typescript
// ❌ ERRADO: salva direto no Supabase
await supabase.from('reurb_projects').insert(data)

// ✅ CORRETO
db.saveProject(data)  // sync_status='pending'
await syncService.pushPendingItems()
```

## 📝 Comandos

```bash
npm start               # localhost:8080
npm run build           # produção
npm run lint            # oxlint
npm run format          # prettier
```

## 🎨 Convenções

- **Componentes**: PascalCase (`SurveyForm.tsx`)
- **Services**: camelCase (`api.ts`, `syncService.ts`)
- **Migrations**: timestamp + descritivo (`20260105180000_create_reurb_schema.sql`)
- **Tipos**: `src/types/` (index.ts, reurb.types.ts, csv-import.types.ts)
- **Supabase Client**: Importar `@/lib/supabase/client` - **NÃO modificar** (gerado automaticamente)

## 🔧 Serviços

```
db.ts (LocalStorage)
  ↓
syncService.ts (orquestra)
  ↓
api.ts (Supabase RPC/queries)
```

- `projectService.ts`, `quadraService.ts` - CRUD + caching
- `csvImportService.ts` - importação dinâmica
- `userService.ts`, `geocoding.ts`, `report.ts`

## 🖼️ Componentes UI

- **SurveyForm.tsx** - ~1924 linhas, ~60 campos, Zod validation, 4 tabs
- **GoogleMap.tsx** - Google Maps (chave em `reurb_app_config`)
- **CSVImporter** - mapeamento dinâmico de colunas CSV → DB
- **BottomNav.tsx**, **SyncIndicator.tsx**, **Layout.tsx**

## 🪝 Padrões de Hooks

```typescript
const { user, isAuthenticated, hasPermission, signIn, signOut } = useAuth()
const { isAdmin, hasAnyPermission, hasAllPermissions } = usePermissions()
const { isOnline, isSyncing, stats, triggerSync } = useSync()
const { toast } = useToast()
const form = useForm<Schema>({ resolver: zodResolver(schema) })
```

## 📊 CSV Import

- Mapeamento dinâmico de colunas
- RPC functions: `can_import_csv()`, `get_table_columns()`
- Referência: [CSV-IMPORT-README.md](CSV-IMPORT-README.md)

## 🔨 Fluxos de Feature

### Adicionar campo a Lote/Survey
1. Tipo em `src/types/index.ts`
2. Migration em `supabase/migrations/` (timestamp)
3. Atualizar `db.ts` (salvar/carregar)
4. Atualizar `api.ts` (mapeamento)
5. UI em `LoteForm.tsx` ou `SurveyForm.tsx`
6. **Survey**: Atualizar [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md)

## ⚠️ Erros Comuns

1. **NÃO** salve em Supabase direto - quebra offline-first
2. **NÃO** esqueça `await` em `hasPermission()`
3. **NÃO** edite surveys sem [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md)
4. **NÃO** remova campos legados (`field_348`, `field_350`) - seed data
5. **NÃO** use `supabase.from()` em páginas - use services
6. **NÃO** ignore `sync_status` em UI
7. **NÃO** modifique `src/lib/supabase/client.ts` - é gerado automaticamente

## 📚 Documentação

- [README.md](README.md) - stack, Node 18+
- [FORMULARIOS-MAPEAMENTO-COMPLETO.md](FORMULARIOS-MAPEAMENTO-COMPLETO.md) - mapeamento 1:1 BD ↔ UI
- [CSV-IMPORT-README.md](CSV-IMPORT-README.md)
- [CSV-EXAMPLES.md](CSV-EXAMPLES.md)
- `analyze_*.sql`, `check_*.sql`, `debug_*.sql` - diagnóstico

---

**Versão**: 1.4.4+ | **Status**: Produção pronta | **Próximas**: Agentes IA para REURB E/S
