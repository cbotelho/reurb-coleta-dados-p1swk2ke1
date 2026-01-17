# Coleta de Dados REURB - Developer & AI Instructions

## ⚡ Stack & Context
- **Frontend**: React 19 + Vite (Rolldown) + TypeScript + PWA
- **UI**: Shadcn UI (`@/components/ui`), Tailwind CSS, Lucide Icons, TipTap (Rich Text)
- **Backend**: Supabase (Auth, Postgres, Storage) via `@supabase/supabase-js`
- **Architecture**: **Offline-First** (LocalStorage = Source of Truth)
- **Quality**: `oxlint` (Linting). **NO AUTOMATED TESTS** (Do not create *.test.ts files).

## 🏗️ Architecture: Offline-First
**Golden Rule**: The UI NEVER talks to the API directly. It ONLY talks to `db.ts`.

### Data Flow
1. **Write**: `UI` → `db.saveItem(...)` → `LocalStorage` (marked `sync_status: 'pending'`)
2. **Sync**: `SyncService` (background) → Detects pending → Pushes to `Supabase` → Updates `db.ts`
3. **Read**: `UI` → `db.getItems()` (Reads from LocalStorage)

### Key Files
- `src/services/db.ts`: **The Database**. All CRUD operations happen here.
- `src/services/syncService.ts`: Background synchronization logic.
- `src/services/api.ts`: Wraps Supabase calls. **Only used by syncService**, never by UI.
- `src/services/imageService.ts`: Exception to the rule. Directs blob uploads to Storage (requires online).

## 🔑 Core Concepts

### 1. Dual ID System
Entities (Projects, Lotes, Surveys) have two identifiers. You MUST handle both:
- **`local_id`** (UUID String): Client-generated. **Primary Key for Frontend**. Always exists. React `key`.
- **`id`** (Number/String): Server-side Postgres ID. `0` or `null` until synced.
- **Usage**: Always perform lookups/updates via `local_id`.

### 2. Feature Modules
- **Social Reports**: `src/components/SocialReportForm.tsx`. Uses `reurb_social_reports` table & TipTap editor. See `SOCIAL-REPORTS-README.md`.
- **CSV Import**: `src/components/csv-import/`. Uses Supabase RPC `can_import_csv`. See `CSV-IMPORT-README.md`.

### 3. Migrations & Database
- SQL files in `migration/` directory.
- Do NOT create migration files unless asked.
- To check DB structure, verify `migration/check_*.sql` scripts.

## 🛠️ Development Conventions

### Coding Patterns
- **Imports**: Use absolute paths: `import { db } from '@/services/db'`.
- **Validation**: Use `zod` schemas defined *inline* within component/page files.
- **Dates**: Persist as ISO strings or timestamps. Display using `date-fns` (`pt-BR`).
- **Lists**: Always iterate with `key={item.local_id}`.

### Critical Workflows
- **Linting**: Run `npm run lint` (uses Oxlint).
- **Offline Debugging**: 
  - To simulate offline: `window.dispatchEvent(new Event('offline'))` in Console.
  - Inspect Data: `console.table(db.getPendingItems())`.

### Common Pitfalls
- **Image Uploads**: `imageService.uploadImage` fails if offline. UI must handle potential errors gracefully.
- **Parent-Child Sync**: When a parent (Lote) is synced and gets a real `id`, children (Surveys) must update their `property_id` reference locally. This is handled in `syncService.ts`.

## 🚀 Commands
- `npm run dev`: Start dev server (Vite)
- `npm run build`: Build for production
- `npm run lint`: fast linting check

