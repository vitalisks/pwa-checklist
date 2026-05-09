export interface TemplateItem {
  id: string;
  text: string;
  description?: string;
  photoIds?: string[];
}

export interface Category {
  id: string;
  name: string;
  items: TemplateItem[];
}

export interface GeneratedFrom {
  idea: string;
  promptVersion: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  categories: Category[];
  updatedAt: number;
  generatedFrom?: GeneratedFrom;
}

export interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  checked: boolean;
  skipped?: boolean;
  photoIds?: string[];
  guidePhotoIds?: string[];
}

export interface ChecklistPhoto {
  itemId: string;
  dataUrl: string;
  updatedAt: number;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export type ChecklistStatus = 'active' | 'completed';

export interface Checklist {
  id: string;
  templateId: string;
  templateTitle?: string;
  title: string;
  categories: ChecklistCategory[];
  status: ChecklistStatus;
  createdAt: number;
  metadata: string;
}