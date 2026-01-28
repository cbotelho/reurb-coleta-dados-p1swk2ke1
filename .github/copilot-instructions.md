
# Instruções para Agentes de IA — REURB Coleta

## Visão Geral
**REURB Coleta** é um PWA offline-first para coleta de dados de regularização fundiária. Usuários trabalham offline; a sincronização ocorre quando online. O projeto utiliza React 19, Vite, TypeScript, Shadcn UI, Tailwind CSS e Supabase.

## Arquitetura e Fluxos Essenciais
- **Offline-First:** O arquivo `src/services/db.ts` (LocalStorage) é a fonte de verdade para a UI. Nunca acesse `api.ts` diretamente em componentes — use sempre o serviço local.
- **Sincronização:** O `src/services/syncService.ts` gerencia o push/pull de dados com Supabase. Mudanças locais são marcadas com `sync_status: 'pending'` e sincronizadas em background.
- **IDs Duplos:** Entidades usam `local_id` (UUID gerado no cliente, sempre preferido para chaves e relacionamentos) e `id` (do backend, só para debug/SQL).
- **Uploads de Imagem:** `src/services/imageService.ts` faz upload direto para o storage do Supabase (salva apenas a URL localmente).

## Convenções e Padrões do Projeto
- **Componentes:** Sempre funcionais, validando formulários com schemas `zod` inline.
- **Estilo:** Tailwind CSS + Shadcn UI (`@/components/ui`). Ícones via `lucide-react`.
- **Datas:** Sempre ISO string no storage; exibição com `date-fns` e locale `pt-BR`.
- **Listas:** Sempre use `key={item.local_id}`.
- **Lint:** Use `oxlint` (`npm run lint` ou `npm run lint:fix`).
- **Não crie testes** (`*.test.ts`, `*.spec.ts`) — não há test runner.
- **Não crie migrações** sem solicitação explícita.
- **Nunca chame API direto em UI** — use apenas via serviços locais.

## Workflows de Desenvolvimento
- **Instalação:** `npm install`
- **Desenvolvimento:** `npm start` ou `npm run dev`
- **Build:** `npm run build` (produção) ou `npm run build:dev`
- **Preview:** `npm run preview`
- **Lint/Format:** `npm run lint`, `npm run lint:fix`, `npm run format`

## Exemplos de Fluxos e Arquivos-Chave
- **Formulários complexos:** Veja `src/components/SocialReportForm.tsx`.
- **Scripts SQL:** Use `migration/check_*.sql` para validação e diagnóstico.
- **Mapeamento de campos:** Sempre alinhe alterações de schema entre TypeScript (`src/types/`) e SQL/zod.

## Dicas de Debug e Operação
- **Simular offline:** `window.dispatchEvent(new Event('offline'))` no console.
- **Ver pendências:** `console.table(db.getPendingItems())`.
- **Corrigir lint:** `npm run lint:fix`
- **Deploy:** Commit/push no GitHub; deploy AWS é automático.

## Documentação Complementar
- [README.md](../README.md) — stack, scripts, estrutura
- [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md) — mapeamento campos UI ↔ BD
- [CSV-IMPORT-README.md](../../CSV-IMPORT-README.md) — importação CSV

---
**Versão:** 1.4.6+ | **Status:** Produção | **Atualizado:** 28/01/2026
