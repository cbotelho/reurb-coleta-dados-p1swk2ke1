


# Instruções para Agentes de IA — REURB Coleta

## Visão Geral e Arquitetura
**REURB Coleta** é um PWA offline-first para coleta de dados de regularização fundiária, usando React 19, Vite, TypeScript, Shadcn UI, Tailwind CSS e Supabase. Usuários trabalham offline; a sincronização ocorre quando online.

### Estrutura e Fluxos
- **Fonte de verdade:** Sempre use `src/services/db.ts` (LocalStorage) para leitura/escrita de dados na UI. Nunca acesse `api.ts` diretamente em componentes.
- **Sincronização:** O serviço `src/services/syncService.ts` faz push/pull com Supabase. Alterações locais recebem `sync_status: 'pending'` e são sincronizadas em background.
- **IDs:** Use sempre `local_id` (UUID cliente) para chaves e relacionamentos. O campo `id` (backend) é só para debug/SQL.
- **Uploads de Imagem:** Use `src/services/imageService.ts` para upload direto ao Supabase Storage; salve apenas a URL localmente.
- **Formulários:** Validação sempre com `zod` inline. Veja exemplos em [src/components/SocialReportForm.tsx](../src/components/SocialReportForm.tsx).
- **Mapeamento de campos:** Alinhe alterações entre [src/types/](../src/types/), SQL e zod. Consulte [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md).

## Convenções e Padrões
- **Componentes:** Sempre funcionais. Não use classes.
- **Estilo:** Tailwind CSS + Shadcn UI (`@/components/ui`). Ícones: `lucide-react`.
- **Datas:** Armazene como ISO string; exiba com `date-fns` e locale `pt-BR`.
- **Listas:** Use sempre `key={item.local_id}`.
- **Lint:** Use `oxlint` (`npm run lint` ou `npm run lint:fix`).
- **Testes:** Não crie arquivos de teste (`*.test.ts`, `*.spec.ts`). Não há test runner.
- **Migrações:** Não crie scripts SQL sem solicitação explícita.
- **API:** Nunca chame API direto em UI — use apenas via serviços locais.

## Workflows Essenciais
- **Instalação:** `npm install`
- **Desenvolvimento:** `npm start` ou `npm run dev`
- **Build:** `npm run build` (produção) ou `npm run build:dev`
- **Preview:** `npm run preview`
- **Lint/Format:** `npm run lint`, `npm run lint:fix`, `npm run format`

## Exemplos e Arquivos-Chave
- **Formulários complexos:** [src/components/SocialReportForm.tsx](../src/components/SocialReportForm.tsx)
- **Scripts SQL de diagnóstico:** [migration/check_*.sql](../migration/)
- **Mapeamento de campos:** [src/types/](../src/types/), [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md)

## Integrações e Dependências
- **Supabase:** Usado para sync, storage e autenticação. Não acesse Supabase diretamente fora dos serviços.
- **React Hook Form:** Para formulários, sempre com zod.
- **date-fns:** Para manipulação e exibição de datas.

## Dicas Práticas
- **Simular offline:** Execute `window.dispatchEvent(new Event('offline'))` no console.
- **Ver pendências locais:** `console.table(db.getPendingItems())`
- **Corrigir lint:** `npm run lint:fix`
- **Deploy:** Commit/push no GitHub; deploy AWS é automático.

## Documentação Complementar
- [README.md](../README.md) — stack, scripts, estrutura
- [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md) — mapeamento campos UI ↔ BD
- [CSV-IMPORT-README.md](../../CSV-IMPORT-README.md) — importação CSV

---
**Versão:** 1.4.6+ | **Status:** Produção | **Atualizado:** 29/01/2026
