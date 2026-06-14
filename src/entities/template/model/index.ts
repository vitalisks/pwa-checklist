import type { Template, Category, TemplateItem, GeneratedFrom } from '@/shared/config';

export type { Template, Category, TemplateItem, GeneratedFrom };

export interface TemplateValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export function validateTemplate(template: Partial<Template>): TemplateValidationResult {
  const missingFields: string[] = [];
  if (!template.title?.trim()) missingFields.push('title');
  for (const cat of template.categories ?? []) {
    if (!cat.name?.trim()) missingFields.push(`category "${cat.name || 'unnamed'}"`);
    for (const item of cat.items) {
      if (!item.text?.trim()) missingFields.push(`item in "${cat.name || 'unnamed'}"`);
    }
  }
  return { isValid: missingFields.length === 0, missingFields };
}
