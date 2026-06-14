import type { Contact } from '@/shared/config';
import type { StoragePort } from '@/shared/api';

export class ContactRepository {
  constructor(private storage: StoragePort) {}

  async getAll(): Promise<Contact[]> {
    return this.storage.getContacts();
  }

  async add(contact: Contact): Promise<void> {
    return this.storage.addContact(contact);
  }

  async update(contact: Contact): Promise<void> {
    return this.storage.updateContact(contact);
  }

  async delete(deviceId: string): Promise<void> {
    return this.storage.deleteContact(deviceId);
  }

  async clear(): Promise<void> {
    return this.storage.clearContacts();
  }
}
