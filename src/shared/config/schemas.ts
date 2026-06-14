export interface TemplateItem {
  id: string;
  text: string;
  description?: string;
  photoIds?: string[];
  imageLinks?: string[];
}

export interface Category {
  id: string;
  name: string;
  items: TemplateItem[];
  unwrapped?: boolean;
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
  imageLinks?: string[];
  comments?: ChecklistComment[];
}

export interface ChecklistComment {
  id: string;
  text: string;
  createdAt: number;
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
  unwrapped?: boolean;
}

export type ChecklistStatus = 'active' | 'completed';

export interface Checklist {
  id: string;
  templateId?: string;
  templateTitle?: string;
  title: string;
  categories: ChecklistCategory[];
  status: ChecklistStatus;
  createdAt: number;
  metadata: string;
}

export interface Contact {
  deviceId: string;
  name: string;
  addedAt: number;
  lastReceivedAt?: number;
  lastSentAt?: number;
}

export interface CollaborativeItem {
  id: string;
  text: string;
  description?: string;
  checked: boolean;
  skipped?: boolean;
  photoIds?: string[];
  guidePhotoIds?: string[];
  imageLinks?: string[];
  comments?: ChecklistComment[];
  deleted?: true;
  updatedAt: number;
  updatedBy: string;
}

export interface CollaborativeCategory {
  id: string;
  name: string;
  items: CollaborativeItem[];
  deleted?: true;
  unwrapped?: boolean;
}

export interface CollaborativeChecklist {
  id: string;
  title: string;
  status: ChecklistStatus;
  categories: CollaborativeCategory[];
  ownerDeviceId: string;
  collaborators: string[];
  createdAt: number;
  templateId?: string;
  templateTitle?: string;
  metadata: string;
  updatedAt: number;
}
