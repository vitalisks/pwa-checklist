# CLAUDE.md

This project uses [AGENTS.md](./AGENTS.md) as the single source of truth for project documentation.

When working on this codebase, read **AGENTS.md** first — it contains:

- **Architecture**: Feature-Sliced Design (FSD) layer rules and import direction (`app` → `widgets` → `features` → `entities` → `shared`)
- **Project structure**: Full directory tree with every file annotated
- **Storage pattern**: `StoragePort` interface + `IndexedDBAdapter` + React Context DI (never import storage adapters directly — use `useStorage()`)
- **Data orchestration**: `useAppData` hook in `app/model/` replaces all old hooks
- **Routing**: `app/ui/routes.tsx` manages tab navigation + overlay views
- **Styling rules**: CSS Modules + design tokens — **no Tailwind**
- **I18n**: All 4 language files must be updated when adding strings
- **Photo system**: ID conventions, guide vs capture roles, cascade deletion
- **Development guidelines**: How to add features, entities, widgets; key component behaviours; known issues

## Quick Reference

| Concern | Location |
|---|---|
| App entry | `src/app/index.tsx` (providers + routes) |
| Data hook | `src/app/model/use-app-data.ts` |
| Routing | `src/app/ui/routes.tsx` |
| Domain types | `src/shared/config/schemas.ts` |
| Storage interface | `src/shared/api/storage-port.ts` |
| Storage DI | `src/shared/api/storage-context.tsx` |
| i18n | `src/shared/i18n/` |
| Design tokens | `src/shared/styles/tokens.css` |
| Global CSS | `src/shared/styles/global.css` |

## Key Rules

1. **Never import upward** — a layer may only import from layers below it
2. **Never cross-import slices** — slices in the same layer must not import from each other
3. **Use `@/` path alias** for cross-layer imports; relative imports within the same slice
4. **Never import `IndexedDBAdapter` directly** — always use `useStorage()` from React Context
5. **Types go in `shared/config/schemas.ts`** — entities re-export them, but never define them
6. **No Tailwind** — use CSS Modules for component styles, global utilities from `global.css`, tokens via `var(--token-name)`
7. **Update all 4 language files** (`en.ts`, `es.ts`, `lv.ts`, `ru.ts`) when adding i18n strings
8. **Use `generateUUID()`** from `@/shared/lib` — never `crypto.randomUUID()` directly (Safari compat)
9. **No `tsconfig.json`** — Vite handles TypeScript internally; path alias configured in `vite.config.ts`
