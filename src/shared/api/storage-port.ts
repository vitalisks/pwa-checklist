import type {
  Template,
  Checklist,
  ChecklistPhoto,
} from '@/shared/config';

export interface ImportResult {
  added: { templates: number; checklists: number; photos: number };
  skipped: number;
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

  clearAll(): Promise<void>;
  exportAll(): Promise<void>;
  importMerge(file: File): Promise<ImportResult>;
}
