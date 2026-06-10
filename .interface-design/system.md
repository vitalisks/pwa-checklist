# Moirai — Interface Design System

## Direction & Feel
Warm, earthy checklist/template PWA. Dark mode evokes a dimly lit workshop or evening desk — near-black canvas with warm olive undertones (`#121210`), parchment-warm text. Light mode is a warm parchment (`#f4f1ea`), like morning light on paper. Green accent (`#5bbd7e`) for completion and action, like a growing leaf.

## Theme Architecture
- **CSS custom properties** in `:root` (dark) + `[data-theme="light"]` (light)
- **React Context** (`ThemeContext`) manages toggle, persists to `localStorage('moirai-theme')`
- Defaults to `prefers-color-scheme` → fallback dark
- ThemeProvider is outermost wrapper in `app/index.tsx`
- Dynamic `meta[name="theme-color"]` updated via JS in ThemeContext
- `color-scheme: dark/light` set on `<html>` for native control adaptation

## Token Naming Convention
- `--canvas` — base page background
- `--surface-0` through `--surface-3` — elevation layers (higher number = higher)
- `--border-subtle`, `--border-default`, `--border-hover`, `--border-focus`
- `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`
- `--accent`, `--accent-hover`, `--accent-subtle`

## Depth Strategy
Borders-only. No shadows for surface elevation. `shadow-lg` utility exists only for modal/lightbox overlays (always on dark background). Surface separation via border + background tint.

## Border Radius Scale
- `--radius-sm: 6px` — inputs, buttons, small cards
- `--radius-md: 10px` — cards, dialogs
- `--radius-lg: 14px` — large containers

## Spacing Base
4px grid. Utility classes: `gap-{1,1.5,2,2.5,3,4,6}`, `p-{1,2,3,4,6}`, `px-{2,3,4}`, `py-{1,1.5,2,3,4,6,8}`, `mt-{1,2,3}`, `mb-{0.5,1,1.5,2,3,4}`, `space-y-{1,1.5,2,3,4,6}`.

## Typography
- Font: Inter system stack
- Scale: `--font-size-base: 1rem`, `--font-size-sm: 0.875rem`, `--font-size-xs: 0.75rem`
- Utilities: `.text-{xs,sm,base,lg,xl,2xl,2xs}`
- Weight utilities: `.font-{normal,medium,semibold,bold}`
- Tracking utilities: `.tracking-{tight,wide,wider}`

## Safari Zoom Prevention
All visible inputs use `.input` class (global.css) which has `font-size: 1rem` with selector `input.input, textarea.input` (specificity 0,1,1) to override any `.text-*` utility classes.

## Key Component Patterns

### Cards
- `.card` — `background: var(--surface-2)`, `border: 1px solid var(--border-default)`, rounded-md
- `.card-hover` — lifts to `--surface-3` on hover
- `.card-inset` — lower elevation `--surface-1` with subtle border

### Buttons
- `.btn` base — inline-flex, gap 6px, padding 8px 14px, rounded-sm
- `.btn-primary` — accent-subtle bg, accent text, accent border
- `.btn-ghost` — transparent, secondary text
- `.btn-soft` — surface-1 bg, default border
- `.btn-danger` — danger-subtle bg, danger text
- `.btn-icon` — 32x32, tertiary text

### Theme Toggle
Settings View: pill button pair with `Sun`/`Moon` icons. Active theme uses `btn-primary`, inactive uses `btn-ghost`.

### Photo Badges (dark-mode-aware)
- `.guide-badge` — accent bg, `#fff` text (was `var(--canvas)` — broken in light mode)
- `.ai-badge` — text-tertiary bg, `#fff` text (was `var(--text-muted)` — invisible in light mode)
