# Moirai Interface Design System

## Direction
Dark glassmorphism aesthetic — warm dark backgrounds (`--surface-2: #1f1f1d`) with subtle green accent (`--accent: #5bbd7e`). Feels like a premium notebook in dim light. Warm, calm, technical.

## Depth Strategy
**Borders-only** — no shadows. Surfaces separated by `1px` borders using opacity tokens:
- `--border-subtle` (4% white/black) for card-inset
- `--border-default` (8%) for cards
- `--border-hover` (14%) for interactive hover states

## Spacing Base
`4px` unit. Components use `8px` gap (`.gap-2`), cards use `12px` padding, card-inset uses `8px 10px`.

## Notification / Inbox Pattern
Used in `IncomingSharesList` — notification bar for incoming shared items.

**Structure:**
- Header row: accent-colored icon + label + count badge (`.badge.badge-success`) + rotating chevron
- Expandable body: Framer Motion `AnimatePresence` with height+opacity transition
- Items: staggered entrance (`.card-inset` with `i * 0.04` delay)
- Processing state: spinner on accept button (`animate-spin` + inline border style)

**Item card layout:**
- Type badge (`.badge-success` for templates, `.badge-warning` for checklists)
- Title (`.text-xs.font-medium.truncate`)
- Metadata (`.text-2xs.text-tertiary` — sender name · relative time)
- Actions: accept (`.btn-icon` with `Check` icon, accent color) + dismiss (`.btn-icon-danger` with `X` icon)

**Relative time helper:**
```tsx
function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
```

## Contact / Sharing Patterns

**Contact card layout (in `ContactsList`):**
- Avatar icon (`.text-secondary`)
- Name (`.text-xs.font-medium.truncate` with hover pencil reveal)
- Inline edit: click name → input + Check/X buttons (Enter saves, Escape cancels)
- Actions: send (`.btn-icon` with `Send`) + delete (`.btn-icon-danger` with `Trash2`)

**Add Contact Dialog:**
- Name field (`.input.text-sm`) auto-focused
- Code textarea (`.input.text-xs.font-mono`) for base64 contact code
- Submit disabled until both fields filled
- Error text (`.text-xs.text-danger`)

**My Code Card:**
- Device name input + read-only code preview + copy/share buttons
- Code format: base64 JSON (`m1_` prefix)

## Key Component Patterns

- **Dialog overlay**: `.fixed.inset-0.z-50.bg-black/60` backdrop, `.card.w-full.max-w-sm` centered
- **Row actions**: `.flex.gap-1.shrink-0.pt-1` for button groups in card items
- **Processing state**: `disabled` attribute + spinner replacement on action button
