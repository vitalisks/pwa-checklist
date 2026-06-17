import type {
  Template,
  Checklist,
  ChecklistPhoto,
  Contact,
} from '@/shared/config';

export interface ImportResult {
  added: { templates: number; checklists: number; photos: number };
  skipped: number;
}

export interface MetaEntry {
  id: string;
  value: unknown;
}

export interface StoragePort {
  getTemplates(): Promise<Template[]>;
  addTemplate(template: Template): Promise<void>;
  updateTemplate(template: Template): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  clearTemplates(): Promise<void>;

  getChecklists(): Promise<Checklist[]>;
  addChecklist(checklist: Checklist): Promise<void>;
  updateChecklist(checklist: Checklist): Promise<void>;
  deleteChecklist(id: string): Promise<void>;
  clearChecklists(): Promise<void>;

  getPhoto(itemId: string): Promise<ChecklistPhoto | undefined>;
  getPhotosByPrefix(prefix: string): Promise<ChecklistPhoto[]>;
  setPhoto(photo: ChecklistPhoto): Promise<void>;
  deletePhoto(itemId: string): Promise<void>;
  clearPhotos(): Promise<void>;
  getAllPhotos(): Promise<ChecklistPhoto[]>;

  getContacts(): Promise<Contact[]>;
  addContact(contact: Contact): Promise<void>;
  updateContact(contact: Contact): Promise<void>;
  deleteContact(deviceId: string): Promise<void>;
  clearContacts(): Promise<void>;

  getMeta<T>(key: string): Promise<T | undefined>;
  setMeta(key: string, value: unknown): Promise<void>;
  deleteMeta(key: string): Promise<void>;

  clearAll(): Promise<void>;
  exportAll(): Promise<void>;
  importMerge(file: File): Promise<ImportResult>;
}
