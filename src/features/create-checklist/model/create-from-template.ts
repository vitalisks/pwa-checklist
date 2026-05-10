import type { Template, Checklist } from '@/shared/config';
import { generateUUID } from '@/shared/lib';

export function createChecklistFromTemplate(template: Template): Checklist {
  return {
    id: generateUUID(),
    templateId: template.id,
    templateTitle: template.title,
    title: '',
    status: 'active',
    createdAt: Date.now(),
    metadata: template.description,
    categories: template.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.items.map((i) => ({
        id: i.id,
        text: i.text,
        description: i.description || '',
        checked: false,
        skipped: false,
        photoIds: [],
        guidePhotoIds: i.photoIds || [],
        imageLinks: i.imageLinks,
      })),
    })),
  };
}
