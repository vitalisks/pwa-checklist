# Moirai - Project Documentation for Agents

## 1. Project Overview
**Moirai** is a modern, responsive Progressive Web Application for managing checklists and templates. It is designed to be fast, offline-capable, and visually appealing with a glassmorphism aesthetic. The codebase follows **Feature-Sliced Design (FSD)** architecture.

## 2. Technology Stack
* **Framework**: React 19 + TypeScript 6 (`tsconfig.json` at root)
* **Build Tool**: Vite 7
* **Architecture**: Feature-Sliced Design (FSD) — `app` → `widgets` → `features` → `entities` → `shared`
* **Routing**: React Router v7 (`react-router-dom`)
* **Styling**: CSS Modules (`*.module.css`) + design tokens (`tokens.css`) + global utility classes (`global.css`) — **Tailwind is NOT used**
* **Sharing**: Firebase (Firestore) — **conditional**, build-time flag via `VITE_FIREBASE_ENABLED`
* **Storage**: IndexedDB via `StoragePort` interface + `IndexedDBAdapter` (dependency-injected through React Context)
* **Icons**: Lucide React
* **Animation**: Framer Motion
* **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
* **Image export**: `html2canvas`
* **PWA/Offline**: `vite-plugin-pwa`
* **Path Alias**: `@/` maps to `src/` (configured in `vite.config.ts`)
* **Code Analysis**: `rollup-plugin-visualizer` (via `npm run analyze`)

## 3. Directory Structure

```
src/
├── app/           # Providers, routing, data contexts
├── entities/      # template/, checklist/, photo/ — domain types + repos
├── features/      # ~15 feature slices — toggle-checklist-item, share, collaboration, export-checklist, item-editor, etc.
├── shared/        # api/ (StoragePort), config/ (schemas), i18n/ (5 locales), lib/, styles/, theme/, ui/
├── widgets/       # layout/, checklist-view/, template-editor/, settings-view/, inbox-view/, etc.
├── functions/     # Firebase Cloud Function (FCM v1)
├── firebase.json, firestore.rules, firestore.indexes.json
├── sw.js          # Service worker (injectManifest)
└── index.css, main.tsx
```

Each FSD layer (`features/*`, `entities/*`, `widgets/*`) exposes a public API via `index.ts`. Internal files are never imported directly. Agents: use `glob`/`grep` to discover specific files — the tree above is intentionally sparse.

## 4. Key Systems & Implementation Details

### 4.1. FSD Architecture & Import Rules
* **Layer dependency direction**: `app` → `widgets` → `features` → `entities` → `shared`. A layer may only import from layers below it (never upward).
* **Slice isolation**: Slices within the same layer must NOT import from each other. Each slice is self-contained with its own `index.ts` barrel.
* **Public API**: Every slice exposes only what its `index.ts` re-exports. Internal files are never imported directly by consumers.
* **Path alias**: Use `@/` for cross-layer imports (e.g. `import { useStorage } from '@/shared/api'`). Relative imports (`./`, `../`) are fine within the same slice.

### 4.2. Data Storage (IndexedDB + DI)
* **`StoragePort`** (`shared/api/storage-port.ts`): Abstract interface defining all CRUD + export/import methods.
* **`IndexedDBAdapter`** (`shared/api/indexeddb-adapter.ts`): Full IndexedDB implementation of StoragePort.
* **Dependency injection**: `StorageProvider` wraps the app with a React Context. Components and hooks access storage via `useStorage()` hook — never by importing a singleton.
* **Entity repositories** (`entities/*/api/`): Each entity has a repository class that accepts `StoragePort` via constructor injection. Instantiated in contexts using the storage from context.
* **Migration**: `migrateTemplatesFromLocalStorage(storage)` and `migrateChecklistsFromLocalStorage(storage)` accept `StoragePort` as a parameter. Called in contexts on startup.

### 4.3. Internationalization (I18n)
* Custom lightweight system in `shared/i18n/`.
* **Provider**: `<I18nProvider>` wraps the app (composed in `app/index.tsx`).
* **Hook**: `const { t, language, changeLanguage } = useTranslation();`
* **Supported Languages**: English (`en`), Estonian (`et`), Lithuanian (`lt`), Latvian (`lv`), Russian (`ru`).
* When adding a new string, update **ALL** language files (`en.ts`, `et.ts`, `lt.ts`, `lv.ts`, `ru.ts`).
* Current key count: ~160 leaf keys per language file.

### 4.4. Styling (CSS Modules + Design Tokens — NOT Tailwind)
* **Architecture**: 3-layer system — tokens → global utilities → component modules. No Tailwind, PostCSS, or CSS-in-JS.
* **Design tokens** live in `shared/styles/tokens.css` (`:root` CSS custom properties). Single source of truth for colors, radii, easings. Reference via `var(--token-name)` in any module or global file.
* **Global utilities** live in `shared/styles/global.css`: reset, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.input`, `.card`, `.card-hover`, `.card-inset`, `.section-label`, `.badge`, `.badge-success`, `.badge-warning`, `.progress-track`, `.progress-fill`, `.progress-fill-active`, `.progress-fill-done`, layout (`.flex`, `.grid`, `.gap-*`, `.p-*`, `.m-*`, etc.), typography (`.text-*`, `.font-*`, `.tracking-*`), borders (`.border-*`, `.rounded-*`), backgrounds (`.bg-*`), and misc (`.sr-only`, `.truncate`, `.animate-spin`).
* **Component-specific styles** use CSS Modules (`*.module.css`), co-located with the component. Import via `import styles from './Component.module.css'` and apply with `styles.className` (dot notation for camelCase, `styles['kebab-case']` for kebab-case).
* **Shared module styles** go in `shared/styles/` (e.g. `photo-zone.module.css` imported by ChecklistItemRow and TemplateEditor).
* **Container**: `.container` (max-width 720px) in global utilities.
* **New component rules**: If a component has dedicated CSS (not just global utilities), create a co-located `*.module.css` file and import it. Never add component-specific styles to the global CSS files.

### 4.5. Photo System

Photos are stored in IndexedDB via `PhotoRepository.save` / `get` / `delete`. Images are compressed before storage using `compressImage()` from `shared/lib/image/`.

**Photo ID conventions** (from `entities/photo/model/`):
* Template photos: `tpl_{itemId}_{uuid}` — built with `buildTemplatePhotoId(itemId, uuid)`
* Checklist photos: `cl_{itemId}_{uuid}` — built with `buildChecklistPhotoId(itemId, uuid)`
* Helpers: `isTemplatePhoto(photoId)`, `isChecklistPhoto(photoId)`

**Two distinct photo roles per checklist item:**
* **Guide photos** (`ChecklistItem.guidePhotoIds`): copied from `TemplateItem.photoIds` at checklist creation time. Read-only in the checklist view — cannot be deleted by the user.
* **User-captured photos** (`ChecklistItem.photoIds`): added by the user during checklist execution via the camera button on each item row. Can be deleted.

**Template editing**: `TemplateEditor` receives `onAddPhoto(itemId, file)` and `onDeletePhoto(itemId, photoId)` props. The caller (`routes.tsx` via `useTemplate()`) handles persistence through `PhotoRepository`.

**Checklist execution**: `ChecklistItemRow` shows a guide strip and a captures strip. `useChecklist()` provides `addChecklistPhoto(checklist, categoryId, itemId, file)` and `deleteChecklistPhoto(checklist, categoryId, itemId, photoId)`.

**Lightbox**: `PhotoLightbox` (from `features/manage-photos`) receives a flat `photoIds[]` array (guide IDs, then AI image link URLs, then capture IDs) and a `startIndex`. It receives an optional `onDelete` prop — set to `undefined` for guide photos so the delete button is hidden. External URLs (`http`/`https`) are used directly as `<img src>` instead of IndexedDB lookup; delete button is hidden for external URLs.

**AI image links** (`TemplateItem.imageLinks` / `ChecklistItem.imageLinks`): External URLs from AI-generated templates. Rendered in the photo strip between guide and capture photos with an "AI" badge. Broken links show a placeholder. Propagated from `TemplateItem` to `ChecklistItem` at checklist creation time.

**Cleanup**: Deleting a template or checklist cascades to delete all associated photos from IndexedDB (handled in `ChecklistContext` / `TemplateContext`).

### 4.6. Drag & Drop

Both `TemplateEditor` (widget) and `ChecklistView` (in edit mode) use `@dnd-kit` with `MouseSensor` (5px activation distance), `TouchSensor` (200ms delay), and `KeyboardSensor`.

The shared `DndEditor` component from `features/item-editor` encapsulates the DnD logic and is used by both `TemplateEditor` and `ChecklistView` edit mode. It provides category reorder via outer `SortableContext`, item reorder/cross-category move via per-category inner `SortableContext`, a `DragOverlay` ghost element, and a toolbar for adding categories/items.

### 4.7. Key Component Behaviours

**TemplateEditor validation**: Clicking Save with an empty title, empty category name, or empty item text sets `showValidation = true` (highlights offending fields with the `input-invalid` CSS class) and opens a `ConfirmDialog` with `variant="warning"` listing the missing fields. The save is blocked until fields are filled.

**ChecklistView inline title editing**: A pencil icon next to the checklist title opens an inline `<input>` with Save/Cancel buttons. `Enter` saves, `Escape` cancels. Calls `updateChecklistTitle(checklist, newTitle)` via `useChecklist()`.

**ChecklistView editing mode**: An "Edit" button enters an in-place editing mode using `DndEditor` with drag-and-drop category/item reordering, inline category name and item text/description editing, and photo add/delete. Saving validates empty fields (shows `ConfirmDialog` warning). The "Save as Template" button converts the checklist to a template and opens the template editor for further editing.

**ChecklistView draft mode**: When opening a new checklist via `/checklist/new` route, the view opens in editing mode as a draft (passed via `location.state.draft`). Drafts are not persisted until the explicit "Save" button is clicked. Cancel/close discards the draft. The save handler calls `persistChecklist` and navigates to `/checklist/:id`.

**ChecklistList filter tabs**: Pill buttons above the list — "All", "Unfinished" (status !== `'completed'`), "Done" (status === `'completed'`). Search and filter are combined (both applied simultaneously).

**ChecklistItemRow description clamping**: Descriptions longer than 3 lines are clamped with a "See more" toggle. Uses `useLayoutEffect` + `scrollHeight > clientHeight` to detect overflow.

### 4.8. Compatibility
* **UUID Generation**: Always use `generateUUID()` from `@/shared/lib` instead of `crypto.randomUUID()` directly to support older browsers (Safari).

## 5. Verifying Changes (lint + typecheck)
Always run both checks after making changes:

```sh
npm run lint       # ESLint — catches undeclared variables, unused vars, React hooks rules
npm run typecheck  # tsc --noEmit — catches type mismatches, missing exports, dead code
```

The `tsconfig.json` uses `strict: true` with `noUnusedLocals` and `noUnusedParameters`.
