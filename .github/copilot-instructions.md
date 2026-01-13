# Coleta de Dados REURB - Instruções para Agente de IA

## ⚡ Contexto do Projeto & Stack
- **Core**: React 19 + TypeScript + Vite (Porta 8080) + Shadcn UI.
- **Backend**: Supabase (Auth, Database, Storage, RPCs).
- **Arquitetura**: Web app mobile **Offline-first**.
- **Linting**: Use `npm run lint` (oxlint), NÃO o ESLint padrão.

## 🏗️ Regras Críticas de Arquitetura
1.  **Hierarquia de Dados**: Cascata estrita: `Project` → `Quadra` → `Lote` (`reurb_properties`) → `Survey`.
    -   *Nunca* deixe registros órfãos. Excluir um pai cascateia para os filhos.
2.  **Fluxo de Escrita Offline-First**:
    -   **Leitura**: Tente LocalStorage primeiro, depois API se estiver online.
    -   **Escrita**: **NUNCA** grave diretamente no Supabase a partir de componentes de UI.
    -   **Fluxo Correto**: Chame `Service` → Atualize LocalStorage (`sync_status: 'pending'`) → `SyncService` envia para o Supabase.
3.  **Gerenciamento de Estado**:
    -   `AuthContext`: Perfil de usuário de `reurb_profiles` (NÃO `auth.users`). `hasPermission()` é **assíncrona** (RPC).
    -   `SyncContext`: Monitora `navigator.onLine`. Use `useSync()` para status de conectividade.

## 🛡️ Padrões de Código
-   **Services**: Localizados em `src/services/`. Abstraia todas as interações com o DB aqui.
    -   *Nota*: Alguns services são classes (`ProjectService`), outros objetos (`syncService`). Siga os padrões do arquivo.
-   **Imagens**: **NUNCA** armazene Base64 no LocalStorage (QuotaExceeded). Use `ImageService` para upload no Supabase Storage → Armazene URL.
-   **Permissões**: Verifique `reurb_profiles.grupo_acesso`. Use `await hasPermission('edit_projects')`.
-   **Componentes**: PascalCase. Use `zod` para validação.
-   **Roteamento**: `react-router-dom`.

## 🚀 Comandos Principais
-   `npm start`: Servidor Dev em http://localhost:8080
-   `npm run build`: Build de produção
-   `npm run lint`: Linting rápido com oxlint

## ⚠️ Armadilhas Comuns a Evitar
-   Gravar em `reurb_projects` diretamente em um componente genérico.
-   Assumir que `hasPermission` é síncrona.
-   Usar `5173` (porta padrão do Vite) em vez de `8080`.
-   Modificar `src/lib/supabase/client.ts` (arquivo gerado).
