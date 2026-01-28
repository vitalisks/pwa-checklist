export interface TemplateItem {
  id: string;
  text: string;
}

export interface Category {
  id: string;
  name: string;
  items: TemplateItem[];
}

export interface Template {
  id: string;
  title: string;
  description: string;
  categories: Category[];
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  skipped?: boolean;
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
  title: string;
  categories: ChecklistCategory[];
  status: ChecklistStatus;
  createdAt: number;
  metadata: string;
}
