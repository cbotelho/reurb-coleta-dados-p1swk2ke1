# Coleta de Dados REURB - Instruções para Agente de IA

## ⚡ Contexto & Stack
- **Core**: React 19 + TypeScript + Vite (Porta 8080) + Shadcn UI + Tailwind CSS.
- **Backend**: Supabase (Auth, Database, Storage).
- **Arquitetura**: **Offline-first** PWA.
- **Linting**: Use `npm run lint` (oxlint). NÃO use eslint padrão.

## 🏗️ Arquitetura Offline-First (Crítico)
O sistema opera desconectado e sincroniza quando online. Siga estritamente este fluxo:

### 1. Camadas de Dados (`src/services/`)
- **`api.ts`**: Gateway para o Supabase. Usado para *leituras online* e *sincronização*.
- **`db.ts`**: Wrapper do `LocalStorage` para dados relacionais (`Projects`, `Quadras`, `Lotes`).
- **`offlineService.ts`**: Wrapper do `LocalForage` para dados pesados (Vistorias/Surveys, Blobs de Imagem).
- **`syncService.ts`**: Orquestrador. Move dados entre `db/offline` ↔ `api`.

### 2. Fluxo de Leitura
1.  Tente ler do **Cache Local** (`db` ou `offlineService`) primeiro para UI responsiva.
2.  Se `navigator.onLine`, chame `api` em background para atualizar o cache.

### 3. Fluxo de Escrita (MUITO IMPORTANTE)
**NUNCA** escreva diretamente no Supabase (`api.ts` ou client) de dentro de componentes de UI.
1.  **Componente**: Chama Service (ex: `saveSurvey`).
2.  **Service**: Salva no `db` ou `offlineService` com status `pending`.
3.  **SyncContext**: Detecta conectividade e chama `syncService.pushPendingItems()`.
4.  **SyncService**: Envia para `api.ts` → Supabase.

## 🛡️ Regras de Negócio & Dados
1.  **Hierarquia**: `Project` → `Quadra` → `Lote` (`reurb_properties`) → `Survey` (Vistoria).
    -   Deleções devem ser em cascata. Não deixe filhos órfãos.
2.  **Autenticação**:
    -   `AuthContext` gerencia o usuário.
    -   **ReurbProfile** (`reurb_profiles`) é a fonte da verdade para dados do usuário, NÃO `auth.users`.
    -   Cheque permissões com `user.grupo_acesso` ou validadores no service.
3.  **Imagens**:
    -   Armazenamento local temporário: `Blob` via `offlineService`.
    -   Upload: `ImageService` envia para Supabase Storage. Salve apenas a URL pública no banco.

## 🚀 Desenvolvimento & Padrões
-   **Comandos**: `npm start` (Dev @ 8080), `npm run build`.
-   **Componentes**: Use Shadcn UI (`@/components/ui`). Valide formulários com `zod`.
-   **Rotas**: `react-router-dom`.
-   **Supabase Client**: `src/lib/supabase/client.ts`. NÃO altere (gerado).

## 💡 Exemplo de Implementação de Service (Write-Flow)
```typescript
import { db } from './db';
// NÃO importe supabase aqui para operações de escrita direta

export const myEntityService = {
  async saveEntity(data: MyType) {
    // 1. Adicione metadados de sincronização
    const record = {
      ...data,
      id: data.id || crypto.randomUUID(), // ID local temporário
      sync_status: 'pending',
      updated_at: new Date().toISOString()
    };

    // 2. Salve no Banco Local (LocalStorage ou LocalForage)
    // A UI deve reagir a esta mudança local imediatamente
    await db.saveLocal('my_entities', record); 
    
    return record;
  }
}
// O SyncService (src/services/syncService.ts) pegará este item 'pending' 
// e o enviará para a API quando houver internet.
```

## ⚠️ Armadilhas Comuns
-   Esquecer de armazenar arquivos grandes no `offlineService` (LocalForage) e tentar por no LocalStorage (estoura cota).
-   Importar `supabase` diretamente em componentes de página (viola arquitetura offline).
-   Confundir `id` (UUID do Supabase) com `local_id` (ID temporário ou mapeado localmente).
