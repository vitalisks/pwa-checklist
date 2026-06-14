import type { Checklist, CollaborativeChecklist, CollaborativeCategory, CollaborativeItem } from '@/shared/config';

function toCollaborativeItem(
  item: { id: string; text: string; description?: string; checked: boolean; skipped?: boolean; photoIds?: string[]; guidePhotoIds?: string[]; imageLinks?: string[] },
  updatedBy: string,
  updatedAt?: number,
): CollaborativeItem {
  return {
    id: item.id,
    text: item.text,
    description: item.description,
    checked: item.checked,
    skipped: item.skipped,
    photoIds: item.photoIds,
    guidePhotoIds: item.guidePhotoIds,
    imageLinks: item.imageLinks,
    updatedAt: updatedAt ?? Date.now(),
    updatedBy,
  };
}

export function toCollaborativeChecklist(
  checklist: Checklist,
  ownerDeviceId: string,
  collaborators: string[],
): CollaborativeChecklist {
  return {
    id: checklist.id,
    title: checklist.title,
    status: checklist.status,
    categories: checklist.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.items.map((item) => toCollaborativeItem(item, ownerDeviceId)),
      unwrapped: cat.unwrapped,
    })),
    ownerDeviceId,
    collaborators,
    createdAt: checklist.createdAt,
    templateId: checklist.templateId,
    templateTitle: checklist.templateTitle,
    metadata: checklist.metadata,
    updatedAt: Date.now(),
  };
}

export function toChecklist(collab: CollaborativeChecklist): Checklist {
  return {
    id: collab.id,
    title: collab.title,
    status: collab.status,
    categories: collab.categories
      .filter((cat) => !cat.deleted)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        unwrapped: cat.unwrapped,
        items: cat.items
          .filter((item) => !item.deleted)
          .map((item) => ({
            id: item.id,
            text: item.text,
            description: item.description,
            checked: item.checked,
            skipped: item.skipped,
            photoIds: item.photoIds,
            guidePhotoIds: item.guidePhotoIds,
            imageLinks: item.imageLinks,
          })),
      })),
    createdAt: collab.createdAt,
    templateId: collab.templateId,
    templateTitle: collab.templateTitle,
    metadata: collab.metadata,
  };
}

function mergeItem(local: CollaborativeItem, remote: CollaborativeItem): CollaborativeItem {
  if (remote.deleted || remote.updatedAt > local.updatedAt) {
    return remote;
  }
  return local;
}

function mergeCategory(local: CollaborativeCategory, remote: CollaborativeCategory): CollaborativeCategory {
  const mergedItems = [...local.items];
  let maxItemUpdatedAt = local.items.reduce((max, i) => Math.max(max, i.updatedAt), 0);

  if (remote.deleted) {
    return { ...remote, items: mergedItems };
  }

  for (const remoteItem of remote.items) {
    const idx = mergedItems.findIndex((i) => i.id === remoteItem.id);
    if (idx !== -1) {
      mergedItems[idx] = mergeItem(mergedItems[idx], remoteItem);
      maxItemUpdatedAt = Math.max(maxItemUpdatedAt, mergedItems[idx].updatedAt);
    } else {
      mergedItems.push(remoteItem);
      maxItemUpdatedAt = Math.max(maxItemUpdatedAt, remoteItem.updatedAt);
    }
  }
  return {
    ...local,
    name: remote.name,
    unwrapped: remote.unwrapped,
    items: mergedItems,
  };
}

export function mergeChecklists(
  local: CollaborativeChecklist,
  remote: CollaborativeChecklist,
): CollaborativeChecklist {
  const mergedCategories = [...local.categories];
  for (const remoteCat of remote.categories) {
    const idx = mergedCategories.findIndex((c) => c.id === remoteCat.id);
    if (idx !== -1) {
      mergedCategories[idx] = mergeCategory(mergedCategories[idx], remoteCat);
    } else {
      mergedCategories.push(remoteCat);
    }
  }
  return {
    ...local,
    title: remote.updatedAt > local.updatedAt ? remote.title : local.title,
    status: remote.updatedAt > local.updatedAt ? remote.status : local.status,
    categories: mergedCategories,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}

type EditableFields = Pick<CollaborativeItem, 'checked' | 'skipped' | 'text' | 'description' | 'photoIds' | 'guidePhotoIds' | 'imageLinks' | 'deleted'>;

export function applyLocalEdit(
  collab: CollaborativeChecklist,
  categoryId: string,
  itemId: string,
  updates: Partial<EditableFields>,
  updatedBy: string,
): CollaborativeChecklist {
  const now = Date.now();
  return {
    ...collab,
    categories: collab.categories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map((item) =>
              item.id === itemId
                ? { ...item, ...updates, updatedAt: now, updatedBy }
                : item,
            ),
          }
        : cat,
    ),
    updatedAt: now,
  };
}

export function applyLocalDeleteCategory(
  collab: CollaborativeChecklist,
  categoryId: string,
  updatedBy: string,
): CollaborativeChecklist {
  const now = Date.now();
  return {
    ...collab,
    categories: collab.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, deleted: true as const, name: cat.name, items: cat.items.map((i) => ({ ...i, deleted: true as const, updatedAt: now, updatedBy })) } : cat,
    ),
    updatedAt: now,
  };
}

export function applyLocalCategoryEdit(
  collab: CollaborativeChecklist,
  categoryId: string,
  updates: Partial<Pick<CollaborativeCategory, 'name'>>,
): CollaborativeChecklist {
  const now = Date.now();
  return {
    ...collab,
    categories: collab.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, ...updates } : cat,
    ),
    updatedAt: now,
  };
}

export function applyLocalAddItem(
  collab: CollaborativeChecklist,
  categoryId: string,
  item: CollaborativeItem,
): CollaborativeChecklist {
  return {
    ...collab,
    categories: collab.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, items: [...cat.items, item] } : cat,
    ),
    updatedAt: Date.now(),
  };
}
