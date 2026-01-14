# Coleta de Dados REURB - Instruções para Developer/AI

## ⚡ Stack & Contexto
- **Frontend**: React 19 + Vite + TypeScript + PWA (Offline-First)
- **UI**: Shadcn UI (`@/components/ui`), Tailwind CSS, Ícones Lucide React
- **Backend**: Supabase (Auth, Postgres, Storage) via `@supabase/supabase-js`
- **Formulários**: `react-hook-form` + `zod` (validação inline em pages/components)
- **Lint**: `oxlint` (`npm run lint`). **Sem testes** - não crie suites de testes
- **Build**: `npm run build` (produção) ou `npm run build:dev` (desenvolvimento)

## 🏗️ Arquitetura Offline-First (LocalStorage = Source of Truth)

### Camada de Dados (`src/services/`)
```
UI/Pages → db.ts (LocalStorage) ⟷ syncService.ts ⟷ api.ts (Supabase)
                                         ↓
                                   SyncContext
```

**Regras Fundamentais**:
1. **`db.ts`**: SEMPRE leia/escreva aqui. Toda persistência vai para `localStorage` primeiro
2. **`api.ts`**: Usado APENAS por `syncService.ts` e carga inicial. UI nunca acessa diretamente
3. **`syncService.ts`**: Orquestra push/pull entre local e servidor
4. **`imageService.ts`**: Exceção - upload direto de blobs para Supabase Storage (tamanho)

### Fluxo de Escrita (Exemplo: Salvar Lote)
```typescript
// 1. Usuário submete formulário (LoteFormUpdated.tsx)
const onSubmit = (data) => {
  const newLote = { 
    ...data, 
    local_id: crypto.randomUUID(), // ← Cliente gera UUID
    sync_status: 'pending'         // ← Marca para sync
  }
  
  // 2. Salva no LocalStorage (db.ts)
  db.saveLote(newLote)
  
  // 3. UI atualiza imediatamente (Optimistic Update)
  setLotes([...lotes, newLote])
  
  // 4. SyncContext detecta conexão online
  // → syncService.pushPendingItems()
  // → api.saveLote(newLote)
  // → db.updateLote({ ...newLote, sync_status: 'synchronized' })
}
```

### Sistema de IDs Duais (`src/types/index.ts`)
Todas entidades possuem **dois IDs**:
- **`local_id`**: UUID string gerado no cliente. SEMPRE presente. Use como `key` no React
- **`id`**: ID do servidor. `number` (Projetos/Lotes) ou `string` (Survey). Pode ser `0` se não sincronizado

**Validação antes de operações**:
```typescript
const item = lotes.find(l => l.local_id === selectedId)
if (!item) return // ← Sempre valide existência

// Para keys React
{lotes.map(lote => <Card key={lote.local_id}>{lote.name}</Card>)}
```

## 🔄 Contextos Globais (`src/contexts/`)

### AuthContext
- Controla sessão Supabase + perfil local via `db.ts`
- Expõe: `user`, `profile`, `isAuthenticated`, `login()`, `logout()`
- RLS (Row Level Security) no Supabase valida permissões por grupo

### SyncContext
- Monitora `navigator.onLine` e dispara sync automático
- API: `triggerSync(fullDownload?)`, `refreshStats()`, `isOnline`, `isSyncing`
- Carrega config do servidor (ex: Google Maps API Key) via `api.getAppConfig()`

## 📁 Estrutura de Rotas (`src/App.tsx`)
```
/login (PublicRoute) → Redirect se autenticado
/ (PrivateRoute + Layout) → Dashboard, Projetos, Lotes, etc.
```

**Padrão de Guards**:
```tsx
// PrivateRoute valida AuthContext.isAuthenticated
<Route element={<PrivateRoute><Layout /></PrivateRoute>}>
  <Route path="/" element={<Dashboard />} />
</Route>
```

## 🎨 Convenções de Código

### Imports Absolutos
```typescript
import { db } from '@/services/db'         // ✅ Sempre use @/
import { Button } from '@/components/ui/button'
import { Lote } from '@/types'

// ❌ Nunca use imports relativos fora de escopo local
import { db } from '../../../services/db'
```

### Validação Zod (Inline em Pages)
```typescript
// Defina schemas no topo do componente
const loteSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  area: z.string().regex(/^\d+(\.\d+)?$/, 'Área inválida'),
  latitude: z.string().optional(),
})

const form = useForm({
  resolver: zodResolver(loteSchema),
  defaultValues: { name: '', area: '' }
})
```

### Formatação de Datas (date-fns)
```typescript
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Persistir como timestamp ou ISO
db.saveLote({ ...lote, date_added: Date.now() })

// Exibir formatado
<span>{format(lote.date_added, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
```

## 🚨 Armadilhas Críticas

### Upload de Imagens
- **`imageService.uploadImage()`** requer conexão online (blob → Supabase Storage)
- Retorna URL pública que é salva em `Lote.images[]` no `db.ts`
- Offline: preview local via FileReader, mas upload falha silenciosamente

### Sync de Relações (Parent → Child)
```typescript
// syncService.ts faz push de Lotes ANTES de Surveys
// Se local_id do Lote muda após sync, atualiza FKs dos Surveys filhos
for (const lote of pendingLotes) {
  const saved = await api.saveLote(lote)
  if (lote.local_id !== saved.local_id) {
    // Corrige surveys órfãos
    db.getSurveys()
      .filter(s => s.property_id === lote.local_id)
      .forEach(s => db.saveSurvey({ ...s, property_id: saved.local_id }))
  }
}
```

### Migration SQL (`/migration/`)
- 100+ scripts de diagnóstico/correção do Supabase
- Evite criar novos schemas manualmente - use Supabase Dashboard
- Para popular dados, edite `src/services/seedData.ts` e use `db.ts`

## 📋 Comandos Essenciais
```bash
npm start              # Dev server (localhost:8080)
npm run build          # Build produção (minify + sem sourcemap)
npm run build:dev      # Build dev (com sourcemap)
npm run lint           # Valida com oxlint
npm run preview        # Testa build local

# ❌ Não há testes - `npm test` retorna exit 0 sempre
```

## 🔍 Debugging Offline
```typescript
// Forçar modo offline (DevTools Console)
window.dispatchEvent(new Event('offline'))

// Inspecionar localStorage
console.table(JSON.parse(localStorage.getItem('reurb_lotes')))

// Ver pendências de sync
console.log(db.getPendingItems()) // { lotes: [], surveys: [] }
```

