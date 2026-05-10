import type { Checklist } from '@/shared/config';
import type { StoragePort } from '@/shared/api';

export class ChecklistRepository {
  constructor(private storage: StoragePort) {}

  async getAll(): Promise<Checklist[]> {
    return this.storage.getChecklists();
  }

  async add(checklist: Checklist): Promise<void> {
    await this.storage.addChecklist(checklist);
  }

  async update(checklist: Checklist): Promise<void> {
    await this.storage.updateChecklist(checklist);
  }

  async delete(id: string): Promise<void> {
    await this.storage.deleteChecklist(id);
  }
}
