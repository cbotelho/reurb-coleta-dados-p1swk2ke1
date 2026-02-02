


# Instruções para Agentes de IA — REURB Coleta

## Visão Geral e Arquitetura
**REURB Coleta** é um PWA offline-first para coleta de dados de regularização fundiária.
- **Stack:** React 19, Vite, TypeScript, Shadcn UI, Tailwind CSS, Supabase.
- **Offline-first:** Todo dado lido ou escrito pela UI deve passar por `src/services/db.ts` (LocalStorage/LocalForage). Nunca acesse `api.ts` diretamente em componentes de visualização ou formulários.
- **Fluxo de Dados:** UI -> `db.ts` (status 'pending') -> `syncService.ts` (background sync) -> `api.ts` -> Supabase.

### IDs e Relacionamentos
- **Primary Key:** Use sempre `local_id` (UUID gerado no cliente) para chaves e relacionamentos (ex: `survey.property_id` aponta para `lote.local_id`).
- **Backend ID:** O campo `id` (integer) vindo do Supabase é apenas para referência do banco e debug. Mapeie-o para `local_id` se necessário no `api.ts`.

### Sincronização e Supabase
- **Mapeamento:** O banco (Supabase) usa nomes de colunas técnicos ou legados (ex: `field_348` para `name`). Consulte `src/services/api.ts` para os mapeadores (`mapProject`, `mapLote`, etc.).
- **Payload Clean-up:** Antes de enviar para o Supabase no `syncService.ts`, remova campos internos que não existem no banco (`sync_status`, `local_id`, `is_dirty`) para evitar Erros 400.
- **Storage:** Use `src/services/imageService.ts` para uploads ao Supabase Storage. Salve apenas a URL resultante localmente.

## Convenções e Padrões
- **Componentes:** 100% Funcionais com Hooks. Proibido o uso de Classes.
- **Estilo:** Tailwind CSS + Shadcn UI (`@/components/ui`). Ícones: `lucide-react`.
- **Formulários:** Gerenciados com `react-hook-form` e validação `zod` inline. Exemplo: `src/components/SocialReportForm.tsx`.
- **Datas:** Armazenadas como ISO string; exibidas com `date-fns` (locale `pt-BR`).
- **Tipagem:** Defina schemas em `src/types/index.ts` e alinhe com [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md).
- **PDF:** Use `jsPDF` e `html2canvas` para geração de relatórios. Veja `src/components/ReportPDFGenerator.tsx`.

## Workflows Essenciais
- **Dev:** `npm start` ou `npm run dev` (porta 5173).
- **Build:** `npm run build` (produção).
- **Qualidade:** `npm run lint:fix` (oxlint) e `npm run format` (prettier).
- **Testes:** Não há test runner configurado. Validação é manual ou via lint.

## Dicas Práticas
- **Depuração Local:** Verifique pendências com `console.table(db.getPendingItems())`.
- **Cota de Memória:** `db.ts` possui lógica para limpar logs e vistorias sincronizadas se o `localStorage` exceder o limite.
- **Simular Offline:** `window.dispatchEvent(new Event('offline'))` no console.
- **Deploy:** Automático via AWS após push para o GitHub.

## Documentação Complementar
- [README.md](../README.md) — stack, scripts, estrutura
- [FORMULARIOS-MAPEAMENTO-COMPLETO.md](../../FORMULARIOS-MAPEAMENTO-COMPLETO.md) — mapeamento campos UI ↔ BD
- [CSV-IMPORT-README.md](../../CSV-IMPORT-README.md) — importação CSV

---
**Versão:** 1.5.0 | **Status:** Produção | **Atualizado:** 02/02/2026
