import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface DetectedFileType {
  mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  ext: '.jpg' | '.png' | '.webp' | '.pdf';
}

export interface StoredAttachmentRecord {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: DetectedFileType['mime'];
  sizeBytes: number;
}

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ATTACHMENT_COUNT = 5;

export function inspectMagicBytes(buffer: Buffer): DetectedFileType | null {
  if (buffer.length < 4) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: '.png' };
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }

  // PDF: %PDF-
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { mime: 'application/pdf', ext: '.pdf' };
  }

  return null;
}

export function isDeclaredMimeCompatible(
  declaredMime: string | undefined,
  detectedMime: DetectedFileType['mime']
): boolean {
  if (!declaredMime || declaredMime === 'application/octet-stream') {
    return true;
  }
  const normalized = declaredMime.trim().toLowerCase();
  if (normalized === detectedMime) {
    return true;
  }
  if (normalized === 'image/jpg' && detectedMime === 'image/jpeg') {
    return true;
  }
  return false;
}

export function sanitizeDisplayFilename(rawName: string): string {
  const base = path.basename(rawName || 'priloha').replace(/[\r\n\0]/g, '_').trim();
  return base.slice(0, 180) || 'priloha';
}

export function resolveSafeUploadPath(uploadDir: string, storedName: string): string | null {
  const root = path.resolve(uploadDir);
  const safeBase = path.basename(storedName);
  if (!safeBase || safeBase !== storedName) {
    return null;
  }
  const resolved = path.resolve(root, safeBase);
  if (!resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

export function saveValidatedAttachment(
  uploadDir: string,
  buffer: Buffer,
  originalName: string,
  detected: DetectedFileType
): StoredAttachmentRecord {
  const root = path.resolve(uploadDir);
  fs.mkdirSync(root, { recursive: true });

  const id = `att-${crypto.randomUUID()}`;
  const storedName = `${crypto.randomUUID()}${detected.ext}`;
  const targetPath = resolveSafeUploadPath(root, storedName);
  if (!targetPath) {
    throw new Error('Failed to resolve safe attachment storage path.');
  }

  fs.writeFileSync(targetPath, buffer, { mode: 0o600 });

  return {
    id,
    originalName: sanitizeDisplayFilename(originalName),
    storedName,
    mimeType: detected.mime,
    sizeBytes: buffer.length,
  };
}

export function removeStoredAttachmentFile(uploadDir: string, storedName: string): void {
  const targetPath = resolveSafeUploadPath(uploadDir, storedName);
  if (!targetPath) return;
  try {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  } catch (err) {
    console.warn('[uploads] Failed to delete attachment file:', err);
  }
}
