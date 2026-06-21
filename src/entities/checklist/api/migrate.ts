import type { StoragePort } from '@/shared/api';
import type { Checklist } from '@/shared/config';
import { migrateCollectionFromLocalStorage, LEGACY_KEYS } from '@/shared/api/migrate';

export async function migrateChecklistsFromLocalStorage(storage: StoragePort): Promise<boolean> {
  return migrateCollectionFromLocalStorage<Checklist>(
    LEGACY_KEYS.CHECKLISTS,
    (c) => storage.addChecklist(c),
  );
}
