import type { StoragePort } from '@/shared/api';
import type { Checklist } from '@/shared/config';

const LEGACY_KEYS = {
  CHECKLISTS: 'active_checklists',
  MIGRATED: 'indexeddb_migrated',
};

export async function migrateChecklistsFromLocalStorage(storage: StoragePort): Promise<boolean> {
  if (localStorage.getItem(LEGACY_KEYS.MIGRATED) === 'true') return false;

  const data = localStorage.getItem(LEGACY_KEYS.CHECKLISTS);
  if (!data) return false;

  try {
    const checklists: Checklist[] = JSON.parse(data);
    for (const checklist of checklists) {
      await storage.addChecklist(checklist);
    }
    localStorage.setItem(LEGACY_KEYS.MIGRATED, 'true');
    localStorage.removeItem(LEGACY_KEYS.CHECKLISTS);
    console.log(`Migrated ${checklists.length} checklists to IndexedDB`);
    return true;
  } catch (error) {
    console.error('Failed to migrate checklists from localStorage:', error);
    return false;
  }
}
