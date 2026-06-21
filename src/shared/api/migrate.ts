const LEGACY_KEYS = {
  TEMPLATES: 'checklist_templates',
  CHECKLISTS: 'active_checklists',
  MIGRATED: 'indexeddb_migrated',
} as const;

export async function migrateCollectionFromLocalStorage<T>(
  legacyKey: string,
  saveFn: (item: T) => Promise<void>,
): Promise<boolean> {
  if (localStorage.getItem(LEGACY_KEYS.MIGRATED) === 'true') return false;

  const data = localStorage.getItem(legacyKey);
  if (!data) return false;

  try {
    const items: T[] = JSON.parse(data);
    for (const item of items) {
      await saveFn(item);
    }
    localStorage.setItem(LEGACY_KEYS.MIGRATED, 'true');
    localStorage.removeItem(legacyKey);
    return true;
  } catch (error) {
    console.error(`Failed to migrate from localStorage key "${legacyKey}":`, error);
    return false;
  }
}

export { LEGACY_KEYS };
