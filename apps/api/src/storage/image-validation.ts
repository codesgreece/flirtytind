export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

/** Detect image type from magic bytes. Returns null if unrecognized. */
export function sniffImageMime(buffer: Buffer): AllowedImageMime | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export type ImageValidationError =
  | 'MISSING'
  | 'TOO_LARGE'
  | 'MIME_NOT_ALLOWED'
  | 'MAGIC_MISMATCH'
  | 'UNRECOGNIZED';

export function validateImageUpload(params: {
  buffer?: Buffer | null;
  mimeType?: string | null;
  maxBytes?: number;
}): { ok: true; mimeType: AllowedImageMime } | { ok: false; error: ImageValidationError } {
  const { buffer, mimeType } = params;
  const maxBytes = params.maxBytes ?? MAX_IMAGE_BYTES;

  if (!buffer || buffer.length === 0) {
    return { ok: false, error: 'MISSING' };
  }
  if (buffer.length > maxBytes) {
    return { ok: false, error: 'TOO_LARGE' };
  }

  const declared = (mimeType ?? '').toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(declared as AllowedImageMime)) {
    return { ok: false, error: 'MIME_NOT_ALLOWED' };
  }

  const sniffed = sniffImageMime(buffer);
  if (!sniffed) {
    return { ok: false, error: 'UNRECOGNIZED' };
  }
  if (sniffed !== declared) {
    return { ok: false, error: 'MAGIC_MISMATCH' };
  }

  return { ok: true, mimeType: sniffed };
}
