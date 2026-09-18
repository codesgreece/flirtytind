import { Injectable } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { StorageProvider, StoredObject } from './storage.provider';

@Injectable()
export class StorageService implements StorageProvider {
  constructor(private readonly local: LocalStorageProvider) {}

  upload(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder?: string;
  }): Promise<StoredObject> {
    return this.local.upload(params);
  }

  delete(key: string): Promise<void> {
    return this.local.delete(key);
  }
}
