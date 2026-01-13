# Coleta de Dados REURB - Instruções para Agente de IA

## ⚡ Stack Tecnológica & Contexto
- **Frontend**: React 19 + Vite + TypeScript.
- **UI**: Shadcn UI + Tailwind CSS.
- **Backend/BaaS**: Supabase (Auth, Database, Storage).
- **Linter**: `oxlint` (Use `npm run lint`). **NÃO** use eslint padrão.
- **Tipo de App**: PWA Offline-First para coleta de dados em campo.

## 🏗️ Arquitetura Offline-First
O sistema deve operar 100% funcional sem internet. A sincronização ocorre quando a conexão é restabelecida.

### 1. Camadas de Dados (`src/services/`)
- **`api.ts`**: Cliente HTTP para o Supabase. Usado apenas para *sincronização* (envio) ou *leitura online*.
- **`db.ts`**: Gerenciador do `LocalStorage`. É a **fonte da verdade** para a UI offline. Armazena Projetos, Quadras, Lotes e Vistorias (`reurb_surveys`).
- **`syncService.ts`**: Serviço principal de sincronização. Lê itens com status `pending` do `db.ts` e envia via `api.ts`.
- **`offlineService.ts`** & **`syncManager.ts`**: (Experimental) Uso de `LocalForage` para persistência de dados pesados e blobs que não cabem no LocalStorage. Cuidado ao usar, pois o fluxo principal atual é via `db.ts`.

### 2. Fluxo de Leitura (Read-Flow)
*   **Primário**: A UI deve ler do `db.ts` (`db.getProjects()`, `db.getLotes()`, etc.) para garantir funcionamento offline.
*   **Background**: Se houver conexão, o `syncService.pullBaseData()` busca atualizações do servidor e atualiza o `db.ts`.

### 3. Fluxo de Escrita (Write-Flow)
**MUITO IMPORTANTE**: NUNCA escreva diretamente no Supabase a partir de componentes React.
1.  **Ação do Usuário**: Componente chama um método do Service (ex: `saveSurvey`).
2.  **Persistência Local**: O Service salva no `db.ts` gerando um ID temporário (`crypto.randomUUID`) e marcando `sync_status: 'pending'`.
3.  **UI Feedback**: A interface atualiza imediatamente refletindo o estado local.
4.  **Sync**: O `SyncContext` detecta a mudança e, se online, invoca `syncService.pushPendingItems()`.
5.  **Confirmação**: Após sucesso na API, o registro local é atualizado para `sync_status: 'synchronized'`.

## 🛡️ Regras de Negócio & Modelagem
1.  **Hierarquia**: `Project` -> `Quadra` -> `Lote` (`reurb_properties`) -> `Survey` (`reurb_surveys`).
2.  **Identificadores**:
    -   `local_id`: UUID gerado no cliente para novos itens offline.
    -   `id`: ID do banco de dados (pode ser numérico ou UUID dependendo da tabela legada).
    -   Ao sincronizar, o backend deve ser idempotente ou retornar o ID final para atualização local.
3.  **Contextos**:
    -   `AuthContext`: Gerencia sessão e perfil (`reurb_profiles`). Use `useAuth()` para acesso.
    -   `SyncContext`: Controla estado de rede e gatilhos de sincronização. Use `useSync()` para forçar sync.

## 🚀 Padrões de Desenvolvimento
-   **Linting**: Sempre execute `npm run lint` antes de considerar uma tarefa concluída.
-   **Componentes**: Novos componentes visuais devem seguir o padrão Shadcn UI em `@/components/ui`.
-   **Validação**: Use `zod` para validar formulários de vistorias antes de salvar no `db.ts`.
-   **Datas**: Armazene datas como `string` (ISO) ou `number` (timestamp) no `db.ts` para facilitar serialização JSON.

## 📂 Arquivos Chave (Ponto de Partida)
-   `src/services/db.ts`: Lógica central do banco offline (CRUD Local e LocalStorage wrapper).
-   `src/services/api.ts`: Mapeamento de entidades para o Supabase.
-   `src/contexts/SyncContext.tsx`: Orquestrador da sincronização React-State.
-   `src/types/index.ts`: Definições de tipos centrais (Project, Lote, Survey).

## ⚠️ Armadilhas Comuns
-   **Importar `supabase` na UI**: Proibido. Use os services.
-   **Upload de Imagens**: Atualmente `imageService.ts` faz upload direto (online-only). Suporte offline completo para imagens é complexo devido aos limites do LocalStorage; use com cautela.
-   **Confusão de IDs**: Sempre trate IDs como `string` no frontend quando possível. O backend pode usar `int` para tabelas antigas, faça o cast apenas na fronteira (`api.ts`).

