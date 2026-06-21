import type { StoragePort } from '@/shared/api';
import type { Template } from '@/shared/config';
import { migrateCollectionFromLocalStorage, LEGACY_KEYS } from '@/shared/api/migrate';

export async function migrateTemplatesFromLocalStorage(storage: StoragePort): Promise<boolean> {
  return migrateCollectionFromLocalStorage<Template>(
    LEGACY_KEYS.TEMPLATES,
    (t) => storage.addTemplate(t),
  );
}
