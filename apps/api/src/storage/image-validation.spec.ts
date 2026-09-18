import {
  sniffImageMime,
  validateImageUpload,
  MAX_IMAGE_BYTES,
} from './image-validation';

describe('image validation (magic bytes)', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const webp = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);

  it('sniffs jpeg/png/webp', () => {
    expect(sniffImageMime(jpeg)).toBe('image/jpeg');
    expect(sniffImageMime(png)).toBe('image/png');
    expect(sniffImageMime(webp)).toBe('image/webp');
    expect(sniffImageMime(Buffer.from([0x00, 0x01]))).toBeNull();
  });

  it('accepts matching mime + magic', () => {
    expect(validateImageUpload({ buffer: jpeg, mimeType: 'image/jpeg' })).toEqual({
      ok: true,
      mimeType: 'image/jpeg',
    });
  });

  it('rejects mime/magic mismatch', () => {
    const result = validateImageUpload({ buffer: jpeg, mimeType: 'image/png' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('MAGIC_MISMATCH');
  });

  it('rejects disallowed mime', () => {
    const result = validateImageUpload({ buffer: jpeg, mimeType: 'image/gif' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('MIME_NOT_ALLOWED');
  });

  it('rejects oversized buffers', () => {
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1, 0xff);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff;
    const result = validateImageUpload({ buffer: big, mimeType: 'image/jpeg' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('TOO_LARGE');
  });
});
