import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { StorageProvider, StoredObject } from './storage.provider';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBase?: string;

  constructor(config: ConfigService) {
    const driver = (config.get<string>('STORAGE_DRIVER', 'local') ?? 'local').toLowerCase();
    this.bucket = config.get<string>('S3_BUCKET', 'flirty-greece');
    this.publicBase = config.get<string>('STORAGE_PUBLIC_BASE_URL') || undefined;

    if (driver !== 's3') {
      this.client = null;
      return;
    }

    const endpoint = config.get<string>('S3_ENDPOINT') || undefined;
    const region = config.get<string>('S3_REGION', 'eu-central-1');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required when STORAGE_DRIVER=s3');
    }

    this.client = new S3Client({
      region,
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle: true,
          }
        : {}),
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  private requireClient(): S3Client {
    if (!this.client) {
      throw new Error('S3 storage is not configured (STORAGE_DRIVER must be s3)');
    }
    return this.client;
  }

  async upload(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder?: string;
  }): Promise<StoredObject> {
    const client = this.requireClient();
    const folder = params.folder ?? 'photos';
    const ext = extname(params.originalName) || mimeToExt(params.mimeType);
    const key = `${folder}/${randomUUID()}${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType,
      }),
    );

    const url = this.publicBase
      ? `${this.publicBase.replace(/\/$/, '')}/${key}`
      : await this.getSignedUrl(key, 3600);

    return {
      key,
      url,
      mimeType: params.mimeType,
      bytes: params.buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.requireClient().send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (e) {
      this.logger.warn(`S3 delete failed for ${key}: ${(e as Error).message}`);
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.requireClient(), command, { expiresIn: expiresInSeconds });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.requireClient().send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
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
    default:
      return '.bin';
  }
}
