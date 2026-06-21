import type { Checklist } from '@/shared/config';

export function computeProgress(checklist: Checklist): number {
  const total = checklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const processed = checklist.categories.reduce(
    (acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length,
    0
  );
  return total > 0 ? Math.round((processed / total) * 100) : 0;
}
