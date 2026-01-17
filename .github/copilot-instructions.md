# Instruções GitHub Copilot - REURB Coleta

## 🧠 Contexto do Projeto
Você está trabalhando no **REURB Coleta**, um PWA de coleta de dados para regularização fundiária.
- **Stack**: React 19, Vite, TypeScript, Shadcn UI, Tailwind CSS, Supabase.
- **Natureza**: **PWA Offline-First**. Usuários trabalham offline em áreas remotas; dados sincronizam quando online.

## 🏗️ Arquitetura & Regras de Ouro

### 1. Fluxo de Dados Offline-First (ESTRITO)
- **Fonte de Verdade**: O `db.ts` (LocalStorage) no cliente é a FONTE PRINCIPAL para a UI.
- **Leitura**: Componentes `useQuery` / `useEffect` -> `db.getItems()`. NUNCA chame `api.ts` diretamente de componentes UI.
- **Escrita**: Componentes -> `db.saveItem()` -> (Sync em background) -> `api.ts` -> Supabase.
- **Exceção**: `imageService.ts` faz upload de blobs direto para o Storage do Supabase (exige conexão), salvando apenas a URL no banco local.

### 2. Sistema Duplo de IDs
Entidades (Projetos, Lotes, Vistorias) usam dois identificadores:
- **`local_id`** (UUID String): Gerado no cliente, persistente, usado como `key` no React e para buscas/relacionamentos locais. **Sempre prefira este.**
- **`id`** (Integer/String): ID gerado no Postgres. Fica `0` ou `null` até sincronizar. Usado só para debug/SQL backend.

### 3. Mecanismo de Sincronização
- Controlado por `src/services/syncService.ts`.
- Mudanças são marcadas com `sync_status: 'pending'` em `db.ts`.
- O sync envia pendências ao Supabase e atualiza o registro local com a confirmação do servidor.

## 🛠️ Convenções de Desenvolvimento

### Padrões de Código
- **Linter**: Use `oxlint`. Rode `npm run lint` ou `npm run lint:fix` com frequência.
- **Componentes**: Sempre funcionais, com schemas `zod` definidos *inline* para validação de formulários.
- **Estilo**: Tailwind CSS + Shadcn UI (`@/components/ui`). Use `lucide-react` para ícones.
- **Datas**: Salve como string ISO. Exiba usando `date-fns` com locale `pt-BR`.
- **Listas**: Sempre itere usando `key={item.local_id}`.

### "Não Faça"
- **NÃO CRIE TESTES**: Não crie arquivos `*.test.ts` ou `*.spec.ts`. Não há test runner.
- **NÃO CHAME API DIRETO**: Componentes UI não devem importar de `api.ts`.
- **NÃO CRIE MIGRAÇÕES**: Não crie arquivos SQL em `migration/` sem solicitação explícita.

## 📂 Mapa de Arquivos-Chave
- `src/services/db.ts`: Lógica do banco local (cliente).
- `src/services/syncService.ts`: Lógica de sincronização (push/pull).
- `src/services/api.ts`: Wrapper da API Supabase (usado SOMENTE pelo syncService).
- `src/services/imageService.ts`: Uploads diretos para o storage.
- `src/components/SocialReportForm.tsx`: Exemplo de formulário complexo + TipTap.
- `migration/`: Scripts SQL. Veja `check_*.sql` para validação da estrutura do banco.

## 🐛 Debug & Operações
- **Simular Offline**: Rode `window.dispatchEvent(new Event('offline'))` no console do navegador.
- **Inspecionar Estado**: `console.table(db.getPendingItems())`.
- **Corrigir Lint**: `npm run lint:fix`.
- **Banco de Dados**: Ao alterar schemas, atualize tanto a `interface` Typescript quanto o schema `zod`.
