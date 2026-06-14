import type { Checklist } from '@/shared/config';
import { generateUUID } from '@/shared/lib';

export function createBlankChecklist(title?: string): Checklist {
  return {
    id: generateUUID(),
    title: title || '',
    status: 'active',
    createdAt: Date.now(),
    metadata: '',
    categories: [],
  };
}
