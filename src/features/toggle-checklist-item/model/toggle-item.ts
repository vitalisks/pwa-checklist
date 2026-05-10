import type { Checklist, ChecklistCategory, ChecklistItem } from '@/shared/config';

export function toggleChecklistItem(
  checklist: Checklist,
  categoryId: string,
  itemId: string,
  field: 'checked' | 'skipped',
): Checklist {
  const totalItems = checklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const newCategories: ChecklistCategory[] = checklist.categories.map(cat => {
    if (cat.id === categoryId) {
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id === itemId) {
            const newItem: ChecklistItem = { ...item };
            if (field === 'checked') {
              newItem.checked = !item.checked;
              if (newItem.checked) newItem.skipped = false;
            } else {
              newItem.skipped = !item.skipped;
              if (newItem.skipped) newItem.checked = false;
            }
            return newItem;
          }
          return item;
        }),
      };
    }
    return cat;
  });

  const newProcessedCount = newCategories.reduce(
    (acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length,
    0,
  );

  return {
    ...checklist,
    categories: newCategories,
    status: newProcessedCount === totalItems ? 'completed' : 'active',
  };
}
