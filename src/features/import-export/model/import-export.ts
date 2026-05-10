import type { StoragePort, ImportResult } from '@/shared/api';

export async function exportData(storage: StoragePort): Promise<void> {
  await storage.exportAll();
}

export async function importData(storage: StoragePort, file: File): Promise<ImportResult> {
  return storage.importMerge(file);
}

export async function clearAllData(storage: StoragePort): Promise<void> {
  await storage.clearAll();
}
