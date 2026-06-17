import type { Template, Checklist, ChecklistPhoto, Contact } from '@/shared/config';
import { DB_NAME, DB_VERSION, STORES } from '@/shared/config';
import type { StoragePort, ImportResult, MetaEntry } from './storage-port';

export class IndexedDBAdapter implements StoragePort {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
          db.createObjectStore(STORES.TEMPLATES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.CHECKLISTS)) {
          db.createObjectStore(STORES.CHECKLISTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
          db.createObjectStore(STORES.PHOTOS, { keyPath: 'itemId' });
        }
        if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
          db.createObjectStore(STORES.CONTACTS, { keyPath: 'deviceId' });
        }
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    await this.initPromise;
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || undefined);
      request.onerror = () => reject(request.error);
    });
  }

  private async add<T>(storeName: string, item: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTemplates(): Promise<Template[]> {
    return this.getAll<Template>(STORES.TEMPLATES);
  }

  async addTemplate(template: Template): Promise<void> {
    return this.add(STORES.TEMPLATES, template);
  }

  async updateTemplate(template: Template): Promise<void> {
    return this.put(STORES.TEMPLATES, template);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.delete(STORES.TEMPLATES, id);
  }

  async clearTemplates(): Promise<void> {
    return this.clear(STORES.TEMPLATES);
  }

  async getChecklists(): Promise<Checklist[]> {
    return this.getAll<Checklist>(STORES.CHECKLISTS);
  }

  async addChecklist(checklist: Checklist): Promise<void> {
    return this.add(STORES.CHECKLISTS, checklist);
  }

  async updateChecklist(checklist: Checklist): Promise<void> {
    return this.put(STORES.CHECKLISTS, checklist);
  }

  async deleteChecklist(id: string): Promise<void> {
    return this.delete(STORES.CHECKLISTS, id);
  }

  async clearChecklists(): Promise<void> {
    return this.clear(STORES.CHECKLISTS);
  }

  async getPhoto(itemId: string): Promise<ChecklistPhoto | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.PHOTOS, 'readonly');
      const store = transaction.objectStore(STORES.PHOTOS);
      const request = store.get(itemId);
      request.onsuccess = () => resolve(request.result || undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getPhotosByPrefix(prefix: string): Promise<ChecklistPhoto[]> {
    const all = await this.getAll<ChecklistPhoto>(STORES.PHOTOS);
    return all.filter(p => p.itemId.startsWith(prefix));
  }

  async setPhoto(photo: ChecklistPhoto): Promise<void> {
    return this.put(STORES.PHOTOS, photo);
  }

  async deletePhoto(itemId: string): Promise<void> {
    return this.delete(STORES.PHOTOS, itemId);
  }

  async clearPhotos(): Promise<void> {
    return this.clear(STORES.PHOTOS);
  }

  async getAllPhotos(): Promise<ChecklistPhoto[]> {
    return this.getAll<ChecklistPhoto>(STORES.PHOTOS);
  }

  async getContacts(): Promise<Contact[]> {
    return this.getAll<Contact>(STORES.CONTACTS);
  }

  async addContact(contact: Contact): Promise<void> {
    return this.add(STORES.CONTACTS, contact);
  }

  async updateContact(contact: Contact): Promise<void> {
    return this.put(STORES.CONTACTS, contact);
  }

  async deleteContact(deviceId: string): Promise<void> {
    return this.delete(STORES.CONTACTS, deviceId);
  }

  async clearContacts(): Promise<void> {
    return this.clear(STORES.CONTACTS);
  }

  async getMeta<T>(key: string): Promise<T | undefined> {
    const entry = await this.getById<MetaEntry>(STORES.META, key);
    return entry?.value as T | undefined;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    return this.put(STORES.META, { id: key, value } as MetaEntry);
  }

  async deleteMeta(key: string): Promise<void> {
    return this.delete(STORES.META, key);
  }

  async clearAll(): Promise<void> {
    await this.clearTemplates();
    await this.clearChecklists();
    await this.clearPhotos();
    await this.clearContacts();
    await this.clear(STORES.META);
  }

  async exportAll(): Promise<void> {
    const [templates, checklists, photos] = await Promise.all([
      this.getTemplates(),
      this.getChecklists(),
      this.getAllPhotos(),
    ]);
    const payload = JSON.stringify({ version: 1, exportedAt: Date.now(), templates, checklists, photos });
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moirai-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importMerge(file: File): Promise<ImportResult> {
    const text = await file.text();
    let data: { version: number; templates: Template[]; checklists: Checklist[]; photos: ChecklistPhoto[] };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid backup file');
    }
    if (
      typeof data.version !== 'number' ||
      !Array.isArray(data.templates) ||
      !Array.isArray(data.checklists) ||
      !Array.isArray(data.photos)
    ) {
      throw new Error('Invalid backup file');
    }

    const [existingTemplates, existingChecklists, existingPhotos] = await Promise.all([
      this.getTemplates(),
      this.getChecklists(),
      this.getAllPhotos(),
    ]);
    const templateIds = new Set(existingTemplates.map(t => t.id));
    const checklistIds = new Set(existingChecklists.map(c => c.id));
    const photoIds = new Set(existingPhotos.map(p => p.itemId));

    const result: ImportResult = { added: { templates: 0, checklists: 0, photos: 0 }, skipped: 0 };

    for (const template of data.templates) {
      if (templateIds.has(template.id)) { result.skipped++; continue; }
      await this.addTemplate(template);
      result.added.templates++;
    }
    for (const checklist of data.checklists) {
      if (checklistIds.has(checklist.id)) { result.skipped++; continue; }
      await this.addChecklist(checklist);
      result.added.checklists++;
    }
    for (const photo of data.photos) {
      if (photoIds.has(photo.itemId)) { result.skipped++; continue; }
      await this.setPhoto(photo);
      result.added.photos++;
    }
    return result;
  }
}
