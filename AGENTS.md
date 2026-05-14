# CheckFlow - Project Documentation for Agents

## 1. Project Overview
**CheckFlow** is a modern, responsive Progressive Web Application (PWA) for managing checklists and templates. It is designed to be fast, offline-capable, and visually appealing with a glassmorphism aesthetic. The codebase follows **Feature-Sliced Design (FSD)** architecture.

## 2. Technology Stack
* **Framework**: React 19 + TypeScript (no `tsconfig.json` — Vite handles TS internally)
* **Build Tool**: Vite 7
* **Architecture**: Feature-Sliced Design (FSD) — `app` → `widgets` → `features` → `entities` → `shared`
* **Styling**: CSS Modules (`*.module.css`) + design tokens (`tokens.css`) + global utility classes (`global.css`) — **Tailwind is NOT used**
* **Storage**: IndexedDB via `StoragePort` interface + `IndexedDBAdapter` (dependency-injected through React Context)
* **Icons**: Lucide React
* **Animation**: Framer Motion
* **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
* **PWA**: `vite-plugin-pwa`
* **Path Alias**: `@/` maps to `src/` (configured in `vite.config.ts`)

## 3. Project Structure

```
src/
├── index.css                     # Entry point — imports shared/styles/tokens.css + global.css
├── main.tsx                      # Entry point — renders <App /> from ./app
├── assets/
│   └── react.svg
│
├── app/                          # Application layer — initialization, providers, routing
│   ├── index.tsx                 # Composes StorageProvider + LanguageProvider + AppRoutes
│   ├── model/
│   │   └── use-app-data.ts       # Central data orchestration hook (replaces old useTemplates + useChecklists)
│   └── ui/
│       └── routes.tsx            # View routing + tab state + overlay management
│
├── entities/                     # Business entities — domain types + repository classes
│   ├── template/
│   │   ├── index.ts
│   │   ├── api/
│   │   │   ├── index.ts
│   │   │   ├── template-repository.ts   # TemplateRepository(storage: StoragePort)
│   │   │   └── migrate.ts              # migrateTemplatesFromLocalStorage(storage)
│   │   └── model/
│   │       └── index.ts                 # Re-exports Template, Category, TemplateItem, GeneratedFrom + validateTemplate
│   ├── checklist/
│   │   ├── index.ts
│   │   ├── api/
│   │   │   ├── index.ts
│   │   │   ├── checklist-repository.ts  # ChecklistRepository(storage: StoragePort)
│   │   │   └── migrate.ts              # migrateChecklistsFromLocalStorage(storage)
│   │   └── model/
│   │       └── index.ts                 # Re-exports Checklist, ChecklistItem, ChecklistCategory, ChecklistStatus
│   └── photo/
│       ├── index.ts
│       ├── api/
│       │   ├── index.ts
│       │   └── photo-repository.ts      # PhotoRepository(storage: StoragePort)
│       └── model/
│           └── index.ts                 # Re-exports ChecklistPhoto, PHOTO_ID_PREFIXES, buildTemplatePhotoId, buildChecklistPhotoId
│
├── features/                    # User-facing features — slices with model/api/ui segments
│   ├── toggle-checklist-item/
│   │   ├── index.ts             # Exports toggleChecklistItem (pure) + ChecklistItemRow (UI)
│   │   ├── model/
│   │   │   ├── index.ts
│   │   │   └── toggle-item.ts  # Pure function: toggles checked/skipped + auto-completes
│   │   └── ui/
│   │       ├── ChecklistItemRow.tsx
│   │       └── ChecklistItemRow.module.css
│ ├── edit-template/
│ │ ├── index.ts # Exports useEditingState, EditingStateProvider, EditingState type
│ │ └── model/
│ │ ├── index.ts
│ │ └── editing-context.tsx # EditingStateProvider + useEditingState() — idle/creating/editing
│   ├── create-checklist/
│   │   ├── index.ts             # Exports createChecklistFromTemplate (pure)
│   │   └── model/
│   │       ├── index.ts
│   │       └── create-from-template.ts  # Maps Template → Checklist
│   ├── manage-photos/
│   │   ├── index.ts             # Exports PhotoLightbox
│   │   └── ui/
│   │       ├── PhotoLightbox.tsx
│   │       └── PhotoLightbox.module.css
│   ├── import-export/
│   │   ├── index.ts             # Exports exportData, importData, clearAllData
│   │   └── model/
│   │       ├── index.ts
│   │       └── import-export.ts # Delegates to StoragePort methods
│   ├── idea-flow/
│   │   ├── index.ts             # Exports useIdeaFlow, IdeaFlowView, generatePrompt, parseResponse
│   │   ├── api/
│   │   │   ├── index.ts
│   │   │   └── idea-service.ts  # LLM prompt generation + JSON response parser
│   │   ├── config/
│   │   │   └── index.ts         # PROMPT_VERSION constant
│   │   ├── model/
│   │   │   ├── index.ts
│   │   │   └── use-idea-flow.ts # Voice input + clipboard paste + parse state machine
│   │   └── ui/
│   │       └── IdeaFlowView.tsx
│   └── inline-title-edit/
│       ├── index.ts             # Exports InlineTitleEdit component
│       └── ui/
│           └── InlineTitleEdit.tsx  # Inline editable title with pencil/save/cancel
│
├── shared/                      # Shared infrastructure — no business logic
│   ├── index.ts                 # Barrel: re-exports all shared segments
│   ├── speech.d.ts              # Ambient declarations for Web Speech API
│   ├── api/
│   │   ├── index.ts
│   │   ├── storage-port.ts      # StoragePort interface (all CRUD + export/import methods)
│   │   ├── indexeddb-adapter.ts # Full IndexedDB implementation of StoragePort
│   │   └── storage-context.tsx  # StorageProvider + useStorage() hook
│   ├── config/
│   │   ├── index.ts
│   │   ├── db.ts                # DB_NAME, DB_VERSION, STORES constants
│   │   └── schemas.ts           # All domain types (Template, Checklist, ChecklistPhoto, etc.)
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── context.tsx          # LanguageProvider + useLanguage hook
│   │   ├── translations.ts      # Aggregator + TranslationKeys type
│   │   ├── en.ts                # English (~69 keys)
│   │   ├── es.ts                # Spanish (~69 keys)
│   │   ├── lv.ts                # Latvian (~69 keys)
│   │   └── ru.ts                # Russian (~69 keys)
│   ├── lib/
│   │   ├── index.ts
│   │   ├── image/
│   │   │   ├── index.ts
│   │   │   └── compressImage.ts # Image resize/optimization
│   │   └── uuid/
│   │       ├── index.ts
│   │       └── generateUUID.ts  # UUID v4 with Safari polyfill
│   ├── styles/
│   │   ├── index.ts
│   │   ├── tokens.css           # Design tokens — CSS custom properties (:root)
│   │   ├── global.css           # Reset + global utility classes
│   │   └── photo-zone.module.css # Shared photo gallery styles
│   └── ui/
│       ├── index.ts
│       └── confirm-dialog/
│           ├── index.ts
│           ├── ConfirmDialog.tsx
│           └── ConfirmDialog.module.css
│
└── widgets/                     # Compositional widgets — combine features + entities for UI blocks
    ├── layout/
    │   ├── index.ts
    │   └── ui/
    │       ├── Layout.tsx       # App shell — header with search + bottom nav
    │       └── Layout.module.css
    ├── checklist-view/
    │   ├── index.ts
    │   └── ui/
    │       └── ChecklistView.tsx # Full checklist view (groups items, progress, lightbox, delete)
    ├── checklist-list/
    │   ├── index.ts
    │   └── ui/
    │       └── ChecklistList.tsx # Filtered checklist cards list
    ├── home-view/
    │   ├── index.ts
    │   └── ui/
    │       └── HomeView.tsx     # Home tab — templates + checklists composition
    ├── progress-bar/
    │   ├── index.ts
    │   └── ui/
    │       └── ChecklistProgressBar.tsx
    ├── settings-view/
    │   ├── index.ts
    │   └── ui/
    │       └── SettingsView.tsx # Language picker + import/export + clear data
    ├── template-editor/
    │   ├── index.ts
    │   └── ui/
    │       └── TemplateEditor.tsx # Create/edit template with DnD + photo management
    └── template-list/
        ├── index.ts
        └── ui/
            └── TemplateList.tsx  # Template grid with cards
```

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
* **Entity repositories** (`entities/*/api/`): Each entity has a repository class that accepts `StoragePort` via constructor injection. Instantiated in `useAppData` using the storage from context.
* **Migration**: `migrateTemplatesFromLocalStorage(storage)` and `migrateChecklistsFromLocalStorage(storage)` accept `StoragePort` as a parameter. Called in `useAppData` on startup.

### 4.3. Data Orchestration (`useAppData`)
* Located at `app/model/use-app-data.ts`.
* Replaces the old `useTemplates` and `useChecklists` hooks.
* Instantiates all three entity repositories using `useStorage()`.
* Composes feature pure functions (`toggleChecklistItem`, `createChecklistFromTemplate`, `exportData`, etc.) with repository persistence.
* Manages React state for `templates[]` and `checklists[]`.
* Handles photo CRUD (add/delete with `PhotoRepository`, updating entity state).
* Handles cascade deletion of photos when templates/checklists are deleted.
* Exposes a flat API consumed by `routes.tsx`.

### 4.4. Internationalization (I18n)
* Custom lightweight system in `shared/i18n/`.
* **Provider**: `<LanguageProvider>` wraps the app (composed in `app/index.tsx`).
* **Hook**: `const { t, language, setLanguage } = useLanguage();`
* **Supported Languages**: English (`en`), Spanish (`es`), Latvian (`lv`), Russian (`ru`).
* **Date Formatting**: Automatically adjusts `toLocaleDateString` based on selected language.
* When adding a new string, update **ALL** language files (`en.ts`, `es.ts`, `lv.ts`, `ru.ts`).
* Current key count: ~69 keys per language file.

### 4.5. Navigation & Routing
* Navigation state lives in `NavigationContext` (`app/model/navigation-context.tsx`): `activeTab`, `searchQuery`, `viewingChecklistId`, `isIdeaFlowOpen` + actions (`switchTab`, `openChecklist`, `closeChecklist`, `createAndOpenChecklist`, `openIdeaFlow`, `closeIdeaFlow`).
* Editing state lives in `EditingStateContext` (`features/edit-template/model/editing-context.tsx`): `idle`/`creating`/`editing` modes + `startEditing`, `cancelEditing`, `finishEditing`.
* Data contexts: `TemplateContext` (`app/model/template-context.tsx`) and `ChecklistContext` (`app/model/checklist-context.tsx`) split the old `useAppData` responsibilities.
* `app/ui/routes.tsx` consumes `useNavigation()`, `useEditingState()`, `useTemplate()`, `useChecklist()` to compose views.
* Overlay views: `editingTemplate` (→ `TemplateEditor`), `viewingChecklist` (→ `ChecklistView`), `isIdeaFlowOpen` (→ `IdeaFlowView`) replace tab content.
* Transitions handled by `Framer Motion` `AnimatePresence` for smooth switching.

### 4.6. Styling (CSS Modules + Design Tokens — NOT Tailwind)
* **Architecture**: 3-layer system — tokens → global utilities → component modules. No Tailwind, PostCSS, or CSS-in-JS.
* **Design tokens** live in `shared/styles/tokens.css` (`:root` CSS custom properties). Single source of truth for colors, radii, easings. Reference via `var(--token-name)` in any module or global file.
* **Global utilities** live in `shared/styles/global.css`: reset, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.input`, `.card`, `.card-hover`, `.card-inset`, `.section-label`, `.badge`, `.badge-success`, `.badge-warning`, `.progress-track`, `.progress-fill`, `.progress-fill-active`, `.progress-fill-done`, layout (`.flex`, `.grid`, `.gap-*`, `.p-*`, `.m-*`, etc.), typography (`.text-*`, `.font-*`, `.tracking-*`), borders (`.border-*`, `.rounded-*`), backgrounds (`.bg-*`), and misc (`.sr-only`, `.truncate`, `.animate-spin`).
* **Component-specific styles** use CSS Modules (`*.module.css`), co-located with the component. Import via `import styles from './Component.module.css'` and apply with `styles.className` (dot notation for camelCase, `styles['kebab-case']` for kebab-case).
* **Shared module styles** go in `shared/styles/` (e.g. `photo-zone.module.css` imported by ChecklistItemRow and TemplateEditor).
* **Container**: `.container` (max-width 720px) in global utilities.
* **New component rules**: If a component has dedicated CSS (not just global utilities), create a co-located `*.module.css` file and import it. Never add component-specific styles to the global CSS files.

### 4.7. Photo System

Photos are stored in IndexedDB via `PhotoRepository.save` / `get` / `delete`. Images are compressed before storage using `compressImage()` from `shared/lib/image/`.

**Photo ID conventions** (from `entities/photo/model/`):
* Template photos: `tpl_{itemId}_{uuid}` — built with `buildTemplatePhotoId(itemId, uuid)`
* Checklist photos: `cl_{itemId}_{uuid}` — built with `buildChecklistPhotoId(itemId, uuid)`
* Helpers: `isTemplatePhoto(photoId)`, `isChecklistPhoto(photoId)`

**Two distinct photo roles per checklist item:**
* **Guide photos** (`ChecklistItem.guidePhotoIds`): copied from `TemplateItem.photoIds` at checklist creation time. Read-only in the checklist view — cannot be deleted by the user.
* **User-captured photos** (`ChecklistItem.photoIds`): added by the user during checklist execution via the camera button on each item row. Can be deleted.

**Template editing**: `TemplateEditor` receives `onAddPhoto(itemId, file)` and `onDeletePhoto(itemId, photoId)` props. The caller (`routes.tsx` via `useAppData`) handles persistence through `PhotoRepository`.

**Checklist execution**: `ChecklistItemRow` shows a guide strip and a captures strip. `useAppData` provides `addChecklistPhoto(checklist, categoryId, itemId, file)` and `deleteChecklistPhoto(checklist, categoryId, itemId, photoId)`.

**Lightbox**: `PhotoLightbox` (from `features/manage-photos`) receives a flat `photoIds[]` array (guide IDs, then AI image link URLs, then capture IDs) and a `startIndex`. It receives an optional `onDelete` prop — set to `undefined` for guide photos so the delete button is hidden. External URLs (`http`/`https`) are used directly as `<img src>` instead of IndexedDB lookup; delete button is hidden for external URLs.

**AI image links** (`TemplateItem.imageLinks` / `ChecklistItem.imageLinks`): External URLs from AI-generated templates. Rendered in the photo strip between guide and capture photos with an "AI" badge. Broken links show a placeholder. Propagated from `TemplateItem` to `ChecklistItem` at checklist creation time.

**Cleanup**: Deleting a template or checklist cascades to delete all associated photos from IndexedDB (handled in `useAppData`).

### 4.8. Drag & Drop (TemplateEditor)

`TemplateEditor` (widget) uses `@dnd-kit` with `MouseSensor` (5px activation distance), `TouchSensor` (200ms delay), and `KeyboardSensor`.

* **Category reorder**: The outer `SortableContext` wraps category cards; dropping a category on another category reorders via `arrayMove`.
* **Item reorder / cross-category move**: Each `SortableCategory` has its own inner `SortableContext` for items. When an item is dropped on another item, it moves to that position; when dropped on a category header, it appends to the end of that category.
* `DragOverlay` renders a ghost element (category card or item row) during the drag.
* SortableCategory and SortableItem are inline sub-components within TemplateEditor.tsx.

### 4.9. Compatibility
* **UUID Generation**: Always use `generateUUID()` from `@/shared/lib` instead of `crypto.randomUUID()` directly to support older browsers (Safari).
* **Viewport**: Locked to `user-scalable=no` with `viewport-fit=cover` for safe-area on notch devices.
* **Apple PWA meta**: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`.
* **Speech API**: Ambient types in `shared/speech.d.ts` cover `SpeechRecognition` + `webkitSpeechRecognition` constructors.

## 5. Development Guidelines

### 5.1. Adding a New Feature
1. **Create a feature slice** in `src/features/{feature-name}/` with `model/`, `ui/`, and/or `api/` segments as needed.
2. **Add a barrel `index.ts`** that re-exports the public API of the slice.
3. **Storage**: If the feature needs persistence, use `useStorage()` to get the `StoragePort`, then use entity repositories. Never import storage adapters directly.
4. **UI**: Import shared UI primitives from `@/shared/ui`, global CSS utilities from `@/shared/styles`, and other features/entities via `@/` path alias.
5. **I18n**: Add all new text strings to **ALL** language files in `shared/i18n/` (`en.ts`, `es.ts`, `lv.ts`, `ru.ts`).
6. **Wire into app**: If the feature needs app-level orchestration, add it to `useAppData` or `routes.tsx` in the `app/` layer.

### 5.2. Adding a New Entity
1. **Define types** in `shared/config/schemas.ts` (not in entities — to avoid shared→entities circular imports).
2. **Re-export types** from `entities/{name}/model/index.ts` for convenient consumption by features/widgets.
3. **Create repository** in `entities/{name}/api/` — accepts `StoragePort` via constructor.
4. **Add barrel** `entities/{name}/index.ts` re-exporting types + repository.

### 5.3. Adding a New Widget
1. **Create** `src/widgets/{widget-name}/ui/WidgetName.tsx` + co-located `*.module.css` if needed.
2. **Add barrel** `widgets/{widget-name}/index.ts` re-exporting the component.
3. **Compose**: Widgets import from `features/`, `entities/`, and `shared/` only — never from `app/` or other widgets.
4. **Wire**: Import the widget in `app/ui/routes.tsx` and connect it to data from `useAppData`.

### 5.4. Styling
* **Global utilities**: Add new utility classes to `shared/styles/global.css` (NOT Tailwind — all CSS is hand-written).
* **Design tokens**: Add new design tokens to `shared/styles/tokens.css`.
* **Component CSS**: Create a co-located `*.module.css` file for any component-specific styles. Import via `import styles from './Component.module.css'`.
* **Shared CSS Modules**: Place in `shared/styles/` (e.g. `photo-zone.module.css`).
* **Colors**: Always use CSS custom properties from `tokens.css` via `var(--token-name)`. Never hardcode color values.
* **Global utility classes** (`.flex`, `.btn`, `.card`, `.input`, etc.) can be mixed with CSS Module classes freely: `` className={`${styles.wrapper} card`} ``.

### 5.5. Key Component Behaviours

**TemplateEditor validation**: Clicking Save with an empty title, empty category name, or empty item text sets `showValidation = true` (highlights offending fields with the `input-invalid` CSS class) and opens a `ConfirmDialog` with `variant="warning"` listing the missing fields. The save is blocked until fields are filled.

**ChecklistView inline title editing**: A pencil icon next to the checklist title opens an inline `<input>` with Save/Cancel buttons. `Enter` saves, `Escape` cancels. Calls `updateChecklistTitle(checklist, newTitle)` via `useAppData`.

**ChecklistList filter tabs**: Pill buttons above the list — "All", "Unfinished" (status !== `'completed'`), "Done" (status === `'completed'`). Search and filter are combined (both applied simultaneously).

**ChecklistItemRow description clamping**: Descriptions longer than 3 lines are clamped with a "See more" toggle. Uses `useLayoutEffect` + `scrollHeight > clientHeight` to detect overflow.

### 5.6. Known Issues (to fix)
* `vite.config.ts` `includeAssets` references `favicon.ico`, `apple-touch-icon.png`, `mask-icon.svg` — none of these exist in `public/`. Only `icon.svg` is present.
* PWA manifest has only an SVG icon — no PNG fallback icons.
* Some empty directories exist from the migration: `entities/checklist/ui/`, `entities/template/ui/`, `features/inline-title-edit/model/`, `features/manage-photos/lib/`, `widgets/template-editor/lib/` — can be removed.

### 5.7. PWA
* The app is configured as a PWA with `vite-plugin-pwa`. Service worker auto-updates (`registerType: 'autoUpdate'`).
* No custom service worker — generated entirely at build time by `vite-plugin-pwa`.
* No custom `workbox` configuration — uses `vite-plugin-pwa` defaults (precaching).
* The build output is served via `npx serve dist` (script: `npm run serve`).
