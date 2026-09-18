import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { StorageProvider, StoredObject } from './storage.provider';

@Injectable()
export class StorageService implements StorageProvider {
  private readonly provider: StorageProvider;

  constructor(
    private readonly local: LocalStorageProvider,
    private readonly s3: S3StorageProvider,
    config: ConfigService,
  ) {
    const driver = (config.get<string>('STORAGE_DRIVER', 'local') ?? 'local').toLowerCase();
    this.provider = driver === 's3' ? this.s3 : this.local;
  }

  upload(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder?: string;
  }): Promise<StoredObject> {
    return this.provider.upload(params);
  }

  delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string> {
    if (this.provider.getSignedUrl) {
      return this.provider.getSignedUrl(key, expiresInSeconds);
    }
    throw new Error('Signed URLs not supported by current storage driver');
  }

  exists?(key: string): Promise<boolean> {
    if (this.provider.exists) {
      return this.provider.exists(key);
    }
    return Promise.resolve(true);
  }
}
