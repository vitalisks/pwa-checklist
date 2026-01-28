import { Template, Checklist } from '../types';

const DB_NAME = 'CheckFlowDB';
const DB_VERSION = 1;
const STORES = {
    TEMPLATES: 'templates',
    CHECKLISTS: 'checklists',
};

class IndexedDBStorage {
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

                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
                    db.createObjectStore(STORES.TEMPLATES, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.CHECKLISTS)) {
                    db.createObjectStore(STORES.CHECKLISTS, { keyPath: 'id' });
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

    // Templates
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

    // Checklists
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

    async clearAll(): Promise<void> {
        await this.clearTemplates();
        await this.clearChecklists();
    }
}

// Export singleton instance
export const storageService = new IndexedDBStorage();
