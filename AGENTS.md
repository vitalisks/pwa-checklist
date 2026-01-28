# CheckFlow - Project Documentation for Agents

## 1. Project Overview
**CheckFlow** is a modern, responsive Progressive Web Application (PWA) for managing checklists and templates. It is designed to be fast, offline-capable, and visually appealing with a glassmorphism aesthetic.

## 2. Technology Stack
*   **Framework**: React 18 + TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS (Utility-first) + Custom CSS for glass effects
*   **Storage**: IndexedDB (Native API wrapped in `IndexedDBStorage` class)
*   **Icons**: Lucide React
*   **Animation**: Framer Motion
*   **PWA**: `vite-plugin-pwa`


## 4. Key Systems & Implementation Details

### 4.1. Data Storage (IndexedDB)
*   The app uses **IndexedDB** for storage to overcome LocalStorage limits and ensure performance.
*   **`src/services/storage.ts`**: Contains the `IndexedDBStorage` class.
*   **Migration**: `src/services/migration.ts` handles auto-migration from legacy LocalStorage data on startup.
*   **Operations**: All storage operations are **asynchronous**. Hooks (`useTemplates`, `useChecklists`) handle loading states.

### 4.2. Internationalization (I18n)
*   Custom lightweight system implemented in `useLanguage` hook.
*   **Supported Languages**: English (`en`), Latvian (`lv`), Russian (`ru`).
*   **Usage**: `const { t } = useLanguage();` -> `{t('key_name')}`.
*   **Date Formatting**: Automatically adjusts `toLocaleDateString` based on selected language.

### 4.3. Navigation & Routing
*   Simple tab-based navigation managed in `App.tsx` (`home`, `templates`, `settings`).
*   Transitions handled by `Framer Motion` for smooth switching.

### 4.4. Compatibility
*   **UUID Generation**: Always use `generateUUID()` from `src/utils/uuid.ts` instead of `crypto.randomUUID()` directly to support older browsers (Safari).

## 5. Development Guidelines

### 5.1. Adding a New Feature
1.  **State**: Update relevant hooks (`useTemplates` or `useChecklists`) or creating a new one.
2.  **Storage**: Ensure any new data types are handled in `storage.ts`.
3.  **UI**: Create components in `src/components`. Use `glass-card` utility for containers.
4.  **I18n**: Add all new text strings to **ALL** language files in `src/i18n/`.

### 5.2. Styling
*   Use **Tailwind CSS** classes.
*   **Colors**: Use semantic colors defined in `base.css` (via Tailwind config where applicable) or utility classes like `text-accent-color`, `text-success-color`.
*   **Glassmorphism**: Use `glass-card` class for panels to maintain visual consistency.

### 5.3. PWA
*   The app is configured as a PWA. Changes to static assets or entry points usually trigger a Service Worker rebuild.
*   Ensure critical assets are included in `vite.config.ts` PWA configuration.
