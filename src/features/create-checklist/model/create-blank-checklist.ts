import type { Checklist } from '@/shared/config';
import { generateUUID } from '@/shared/lib';

export function createBlankChecklist(title?: string, categoryName?: string): Checklist {
  return {
    id: generateUUID(),
    title: title || '',
    status: 'active',
    createdAt: Date.now(),
    metadata: '',
    categories: [
      {
        id: generateUUID(),
        name: categoryName || 'Items',
        items: [],
      },
    ],
  };
}
