import type { StoragePort } from '@/shared/api';
import type { Template } from '@/shared/config';

const LEGACY_KEYS = {
  TEMPLATES: 'checklist_templates',
  MIGRATED: 'indexeddb_migrated',
};

export async function migrateTemplatesFromLocalStorage(storage: StoragePort): Promise<boolean> {
  if (localStorage.getItem(LEGACY_KEYS.MIGRATED) === 'true') return false;

  const data = localStorage.getItem(LEGACY_KEYS.TEMPLATES);
  if (!data) return false;

  try {
    const templates: Template[] = JSON.parse(data);
    for (const template of templates) {
      await storage.addTemplate(template);
    }
    localStorage.setItem(LEGACY_KEYS.MIGRATED, 'true');
    localStorage.removeItem(LEGACY_KEYS.TEMPLATES);
    console.log(`Migrated ${templates.length} templates to IndexedDB`);
    return true;
  } catch (error) {
    console.error('Failed to migrate templates from localStorage:', error);
    return false;
  }
}
