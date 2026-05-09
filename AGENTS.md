# CheckFlow - Project Documentation for Agents

## 1. Project Overview
**CheckFlow** is a modern, responsive Progressive Web Application (PWA) for managing checklists and templates. It is designed to be fast, offline-capable, and visually appealing with a glassmorphism aesthetic.

## 2. Technology Stack
*   **Framework**: React 19 + TypeScript (no `tsconfig.json` — Vite handles TS internally)
*   **Build Tool**: Vite 7
*   **Styling**: CSS Modules (`*.module.css`) + design tokens (`tokens.css`) + global utility classes (`global.css`) — **Tailwind is NOT used**
*   **Storage**: IndexedDB (Native API wrapped in `IndexedDBStorage` class)
*   **Icons**: Lucide React
*   **Animation**: Framer Motion
*   **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
*   **PWA**: `vite-plugin-pwa`

## 3. Project Structure

```
src/
├── App.tsx                 # Root component — tab routing + overlay views
├── index.css               # Entry point — imports tokens.css + global.css
├── main.tsx                # Entry point — renders <LanguageProvider><App /></LanguageProvider>
├── styles/
│   ├── tokens.css          # Design tokens — CSS custom properties (:root)
│   ├── global.css          # Reset + global utility classes (buttons, cards, inputs, layout, spacing, typography, etc.)
│   └── photo-zone.module.css   # Shared photo gallery styles (used by ChecklistItemRow + CategoryRow)
├── components/
│   ├── CategoryRow.tsx     # Editable category inside TemplateEditor
│   ├── CategoryRow.module.css   # .editor-item styles
│   ├── ChecklistItemRow.tsx# Single item row (done/skip/undo actions)
│   ├── ChecklistItemRow.module.css  # .cl-item / checked / skipped states
│   ├── ChecklistList.tsx   # Active checklist cards list
│   ├── ChecklistProgressBar.tsx  # Animated progress bar (uses global .progress-* classes)
│   ├── ChecklistView.tsx   # Full checklist view with grouped items
│   ├── ConfirmDialog.tsx   # Modal confirmation dialog
│   ├── ConfirmDialog.module.css  # overlay, dialog, title, message, actions
│   ├── HomeView.tsx        # Home tab — templates + checklists
│   ├── Layout.tsx          # App shell — header with search + bottom nav bar
│   ├── Layout.module.css   # app-shell, header, nav-bar, scroll-area styles
│   ├── PhotoLightbox.tsx   # Full-screen photo viewer with swipe
│   ├── PhotoLightbox.module.css  # overlay, nav-btn, action btn
│   ├── SettingsView.tsx    # Settings tab — language picker + clear data
│   ├── TemplateEditor.tsx  # Create/edit template form
│   ├── TemplateEditor.module.css  # .section-sticky styles
│   └── TemplateList.tsx    # Template grid with cards
├── hooks/
│   ├── useChecklists.ts    # CRUD + toggle/skip + title edit + photo CRUD for checklists
│   ├── useLanguage.tsx     # i18n context provider + hook
│   └── useTemplates.ts     # CRUD for templates + photo CRUD + triggers migration
├── i18n/
│   ├── en.ts               # English translations (~69 keys)
│   ├── es.ts               # Spanish translations (~69 keys)
│   ├── lv.ts               # Latvian translations (~69 keys)
│   ├── ru.ts               # Russian translations (~69 keys)
│   └── translations.ts     # Aggregator + types
├── services/
│   ├── migration.ts        # localStorage → IndexedDB migration on startup
│   └── storage.ts          # IndexedDB wrapper (singleton)
├── types/
│   └── index.ts            # All TypeScript interfaces
└── utils/
    ├── image.ts            # Image resize/optimization helpers
    └── uuid.ts             # UUID v4 generator with Safari polyfill
```

## 4. Key Systems & Implementation Details

### 4.1. Data Storage (IndexedDB)
*   The app uses **IndexedDB** for storage to overcome LocalStorage limits and ensure performance.
*   **`src/services/storage.ts`**: Contains the `IndexedDBStorage` class (singleton pattern).
*   **Migration**: `src/services/migration.ts` handles auto-migration from legacy LocalStorage data on startup.
*   **Operations**: All storage operations are **asynchronous**. Hooks (`useTemplates`, `useChecklists`) handle loading states.

### 4.2. Internationalization (I18n)
*   Custom lightweight system implemented in `useLanguage` hook.
*   **Supported Languages**: English (`en`), Spanish (`es`), Latvian (`lv`), Russian (`ru`).
*   **Usage**: `const { t } = useLanguage();` -> `{t('key_name')}`.
*   **Date Formatting**: Automatically adjusts `toLocaleDateString` based on selected language.
*   When adding a new string, update **ALL** language files (`en.ts`, `es.ts`, `lv.ts`, `ru.ts`).
*   Current key count: ~69 keys per language file.

### 4.3. Navigation & Routing
*   Simple tab-based navigation managed in `App.tsx` (`home`, `templates`, `settings`).
*   Overlay views: `editingTemplate` (shows `TemplateEditor`) and `viewingChecklist` (shows `ChecklistView`) replace tab content.
*   Transitions handled by `Framer Motion` `AnimatePresence` for smooth switching.

### 4.4. Styling (CSS Modules + Design Tokens — NOT Tailwind)
*   **Architecture**: 3-layer system — tokens → global utilities → component modules. No Tailwind, PostCSS, or CSS-in-JS.
*   **Design tokens** live in `src/styles/tokens.css` (`:root` CSS custom properties). Single source of truth for colors, radii, easings. Reference via `var(--token-name)` in any module or global file.
*   **Global utilities** live in `src/styles/global.css`: reset, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.input`, `.card`, `.card-hover`, `.card-inset`, `.section-label`, `.badge`, `.badge-success`, `.badge-warning`, `.progress-track`, `.progress-fill`, `.progress-fill-active`, `.progress-fill-done`, layout (`.flex`, `.grid`, `.gap-*`, `.p-*`, `.m-*`, etc.), typography (`.text-*`, `.font-*`, `.tracking-*`), borders (`.border-*`, `.rounded-*`), backgrounds (`.bg-*`), and misc (`.sr-only`, `.truncate`, `.animate-spin`).
*   **Component-specific styles** use CSS Modules (`Component.module.css`). Import via `import styles from './Component.module.css'` and apply with `styles.className` (dot notation for camelCase, `styles['kebab-case']` for kebab-case).
*   **Shared module styles** go in `src/styles/` (e.g. `photo-zone.module.css` imported by multiple components).
*   **Container**: `.container` (max-width 720px) in global utilities.
*   **New component rules**: If a component has dedicated CSS (not just global utilities), create a co-located `*.module.css` file and import it. Never add component-specific styles to the global CSS files.

### 4.5. Photo System

Photos are stored in IndexedDB via `storageService.setPhoto` / `getPhoto` / `deletePhoto`. Images are compressed before storage using `compressImage()` from `src/utils/image.ts`.

**Two distinct photo roles per checklist item:**
*   **Guide photos** (`ChecklistItem.guidePhotoIds`): copied from `TemplateItem.photoIds` at checklist creation time. Read-only in the checklist view — cannot be deleted by the user.
*   **User-captured photos** (`ChecklistItem.photoIds`): added by the user during checklist execution via the camera button on each item row. Can be deleted.

**Template editing**: `TemplateEditor` passes `onAddPhoto` / `onDeletePhoto` to `SortableCategory` → `SortableItem`. The `useTemplates` hook exposes `addTemplatePhoto(itemId, file)` (returns the new `photoId`) and `deleteTemplatePhoto(itemId, photoId)`.

**Checklist execution**: `ChecklistItemRow` shows a guide strip and a captures strip. `useChecklists` exposes `addChecklistPhoto(checklist, categoryId, itemId, file)` and `deleteChecklistPhoto(checklist, categoryId, itemId, photoId)`.

**Lightbox**: `PhotoLightbox` receives a flat `photoIds[]` array (guide IDs first, then capture IDs) and a `startIndex`. It receives an optional `onDelete` prop — set to `undefined` for guide photos so the delete button is hidden.

**Cleanup**: Deleting a template or checklist cascades to delete all associated photos from IndexedDB.

### 4.6. Drag & Drop (TemplateEditor)

`TemplateEditor` uses `@dnd-kit` with `MouseSensor` (5px activation distance), `TouchSensor` (200ms delay), and `KeyboardSensor`.

*   **Category reorder**: The outer `SortableContext` wraps category cards; dropping a category on another category reorders via `arrayMove`.
*   **Item reorder / cross-category move**: Each `SortableCategory` has its own inner `SortableContext` for items. When an item is dropped on another item, it moves to that position; when dropped on a category header, it appends to the end of that category.
*   `DragOverlay` renders a ghost element (category card or item row) during the drag.

### 4.7. Compatibility
*   **UUID Generation**: Always use `generateUUID()` from `src/utils/uuid.ts` instead of `crypto.randomUUID()` directly to support older browsers (Safari).
*   **Viewport**: Locked to `user-scalable=no` with `viewport-fit=cover` for safe-area on notch devices.
*   **Apple PWA meta**: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`.

## 5. Development Guidelines

### 5.1. Adding a New Feature
1.  **State**: Update relevant hooks (`useTemplates` or `useChecklists`) or create a new one.
2.  **Storage**: Ensure any new data types are handled in `storage.ts`.
3.  **UI**: Create components in `src/components`. Use `glass-card` utility for containers.
4.  **I18n**: Add all new text strings to **ALL** language files in `src/i18n/` (`en.ts`, `es.ts`, `lv.ts`, `ru.ts`).

### 5.2. Styling
*   **Global utilities**: Add new utility classes to `src/styles/global.css` (NOT Tailwind — all CSS is hand-written).
*   **Design tokens**: Add new design tokens to `src/styles/tokens.css`.
*   **Component CSS**: Create a co-located `*.module.css` file for any component-specific styles. Import via `import styles from './Component.module.css'`.
*   **Shared CSS Modules**: Place in `src/styles/` (e.g. `photo-zone.module.css`).
*   **Colors**: Always use CSS custom properties from `tokens.css` via `var(--token-name)`. Never hardcode color values.
*   **Global utility classes** (`.flex`, `.btn`, `.card`, `.input`, etc.) can be mixed with CSS Module classes freely: `className={\`${styles.wrapper} card\`}`.
*   `src/App.css` is **unused** legacy boilerplate — do not import it.

### 5.3. Key Component Behaviours

**TemplateEditor validation**: Clicking Save with an empty title, empty category name, or empty item text sets `showValidation = true` (highlights offending fields with the `input-invalid` CSS class) and opens a `ConfirmDialog` with `variant="warning"` listing the missing fields. The save is blocked until fields are filled.

**ChecklistView inline title editing**: A pencil icon next to the checklist title opens an inline `<input>` with Save/Cancel buttons. `Enter` saves, `Escape` cancels. Calls `updateChecklistTitle(checklist, newTitle)` on the `useChecklists` hook.

**ChecklistList filter tabs**: Pill buttons above the list — "All", "Unfinished" (status !== `'completed'`), "Done" (status === `'completed'`). Search and filter are combined (both applied simultaneously).

**ChecklistItemRow description clamping**: Descriptions longer than 3 lines are clamped with a "See more" toggle. Uses `useLayoutEffect` + `scrollHeight > clientHeight` to detect overflow.

### 5.4. Known Issues (to fix)
*   `vite.config.ts` `includeAssets` references `favicon.ico`, `apple-touch-icon.png`, `mask-icon.svg` — none of these exist in `public/`. Only `icon.svg` is present.
*   PWA manifest has only an SVG icon — no PNG fallback icons.

### 5.5. PWA
*   The app is configured as a PWA with `vite-plugin-pwa`. Service worker auto-updates (`registerType: 'autoUpdate'`).
*   No custom service worker — generated entirely at build time by `vite-plugin-pwa`.
*   No custom `workbox` configuration — uses `vite-plugin-pwa` defaults (precaching).
*   The build output is served via `npx serve dist` (script: `npm run serve`).