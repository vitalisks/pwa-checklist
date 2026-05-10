import type { Template } from '@/shared/config';
import type { StoragePort } from '@/shared/api';

export class TemplateRepository {
  constructor(private storage: StoragePort) {}

  async getAll(): Promise<Template[]> {
    return this.storage.getTemplates();
  }

  async save(template: Template): Promise<void> {
    const existing = await this.storage.getTemplates();
    const found = existing.find(t => t.id === template.id);
    if (found) {
      await this.storage.updateTemplate(template);
    } else {
      await this.storage.addTemplate(template);
    }
  }

  async delete(id: string): Promise<void> {
    await this.storage.deleteTemplate(id);
  }
}
