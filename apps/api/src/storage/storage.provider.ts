export type StoredObject = {
  key: string;
  url: string;
  mimeType: string;
  bytes: number;
};

export interface StorageProvider {
  upload(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder?: string;
  }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>;
  exists?(key: string): Promise<boolean>;
}
