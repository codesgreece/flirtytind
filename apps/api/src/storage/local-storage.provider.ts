import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { StorageProvider, StoredObject } from './storage.provider';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;
  private readonly publicBase: string;

  constructor(config: ConfigService) {
    this.root = join(process.cwd(), config.get<string>('STORAGE_LOCAL_DIR', './uploads'));
    this.publicBase = config.get<string>('STORAGE_PUBLIC_BASE_URL', 'http://localhost:3001/uploads');
  }

  async ensureRoot() {
    await fs.mkdir(this.root, { recursive: true });
  }

  async upload(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder?: string;
  }): Promise<StoredObject> {
    await this.ensureRoot();
    const folder = params.folder ?? 'photos';
    const dir = join(this.root, folder);
    await fs.mkdir(dir, { recursive: true });
    const ext = extname(params.originalName) || mimeToExt(params.mimeType);
    const key = `${folder}/${randomUUID()}${ext}`;
    const fullPath = join(this.root, key);
    await fs.writeFile(fullPath, params.buffer);
    return {
      key,
      url: `${this.publicBase.replace(/\/$/, '')}/${key}`,
      mimeType: params.mimeType,
      bytes: params.buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.root, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // ignore missing
    }
  }
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.bin';
  }
}
