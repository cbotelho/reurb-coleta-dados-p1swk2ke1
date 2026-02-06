



# Instruções para Agentes de IA — REURB Coleta

## Visão Geral e Arquitetura
**REURB Coleta** é um PWA offline-first para coleta de dados de regularização fundiária.

- **Stack:** React 19, Vite, TypeScript, Shadcn UI, Tailwind CSS, Supabase.
- **Offline-first:** Toda leitura/escrita de dados pela UI deve passar por [`src/services/db.ts`](../src/services/db.ts) (LocalStorage/LocalForage). Nunca acesse `api.ts` diretamente em componentes ou formulários.
- **Fluxo de Dados:** UI → `db.ts` (status 'pending') → `syncService.ts` (background sync) → `api.ts` → Supabase.
- **IDs:** Use sempre `local_id` (UUID gerado no cliente) para chaves e relacionamentos. O campo `id` (integer) do Supabase é apenas referência e debug.
- **Mapeamento Supabase:** O banco usa nomes técnicos/legados (ex: `field_348` para `name`). Veja mapeadores em [`src/services/api.ts`](../src/services/api.ts).
- **Payload Clean-up:** Antes de enviar para Supabase, remova campos internos (`sync_status`, `local_id`, `is_dirty`) no `syncService.ts`.
- **Imagens:** Use [`src/services/imageService.ts`](../src/services/imageService.ts) para uploads. Salve apenas a URL localmente.

## Convenções e Padrões
- **Componentes:** 100% Funcionais com Hooks. Não use Classes.
- **Estilo:** Tailwind CSS + Shadcn UI ([`src/components/ui`](../src/components/ui)). Ícones: `lucide-react`.
- **Formulários:** Use `react-hook-form` + validação `zod` inline. Exemplo: [`src/components/SocialReportForm.tsx`](../src/components/SocialReportForm.tsx).
- **Datas:** ISO string; exiba com `date-fns` (locale pt-BR).
- **Tipagem:** Schemas em [`src/types/index.ts`](../src/types/index.ts), alinhados com [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md).
- **PDF:** Use `jsPDF` + `html2canvas` para relatórios. Veja [`src/components/ReportPDFGenerator.tsx`](../src/components/ReportPDFGenerator.tsx).

## Workflows Essenciais
- **Dev:** `npm start` ou `npm run dev` (porta 5173).
- **Build:** `npm run build` (produção).
- **Lint/Format:** `npm run lint:fix` (oxlint) e `npm run format` (prettier).
- **Testes:** Não há test runner; validação é manual ou via lint.
 
## Dicas Práticas
- **Depuração Local:** Use `console.table(db.getPendingItems())` para pendências.
- **Cota de Memória:** `db.ts` limpa logs/vistorias sincronizadas se o `localStorage` exceder o limite.
- **Simular Offline:** `window.dispatchEvent(new Event('offline'))` no console.
- **Deploy:** Automático via AWS após push no GitHub.

## Documentação Complementar
- [README.md](../README.md) — stack, scripts, estrutura
- [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md) — mapeamento campos UI ↔ BD
- [CSV-IMPORT-README.md](../../CSV-IMPORT-README.md) — importação CSV

---
**Versão:** 1.5.1 | **Status:** Produção | **Atualizado:** 04/02/2026
