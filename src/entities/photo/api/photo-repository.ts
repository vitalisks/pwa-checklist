import type { ChecklistPhoto } from '@/shared/config';
import type { StoragePort } from '@/shared/api';

export class PhotoRepository {
  constructor(private storage: StoragePort) {}

  async get(itemId: string): Promise<ChecklistPhoto | undefined> {
    return this.storage.getPhoto(itemId);
  }

  async getByPrefix(prefix: string): Promise<ChecklistPhoto[]> {
    return this.storage.getPhotosByPrefix(prefix);
  }

  async save(photo: ChecklistPhoto): Promise<void> {
    await this.storage.setPhoto(photo);
  }

  async delete(itemId: string): Promise<void> {
    await this.storage.deletePhoto(itemId);
  }

  async getAll(): Promise<ChecklistPhoto[]> {
    return this.storage.getAllPhotos();
  }
}
