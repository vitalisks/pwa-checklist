import type { Checklist, Template, TemplateItem } from '@/shared/config';
import { generateUUID } from '@/shared/lib';

export function checklistToTemplate(checklist: Checklist): Template {
  return {
    id: generateUUID(),
    title: checklist.title || 'Untitled Template',
    description: checklist.metadata,
    categories: checklist.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.items.map((item) => {
        const templateItem: TemplateItem = {
          id: item.id,
          text: item.text,
          description: item.description,
          imageLinks: item.imageLinks,
          photoIds: [
            ...(item.guidePhotoIds || []),
            ...(item.photoIds || []),
          ],
        };
        return templateItem;
      }),
    })),
    updatedAt: Date.now(),
  };
}
