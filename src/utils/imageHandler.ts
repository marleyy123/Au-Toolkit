/**
 * imageHandler.ts
 * Robust local Base64 image handler and Google Drive URL normalizer.
 * Prevents HTML error injections, strips hotlink blocks, and guarantees local Base64 storage via native FileReader.
 */

import { compressAndReadAsDataURL } from './imageCompressor';
import { registerOriginalImage } from './imageRegistry';

/**
 * Converts a browser File object directly into a Base64 Data URL using native JavaScript FileReader.
 * Guarantees 100% self-contained local storage without external hotlink dependencies.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = (event.target?.result as string) || '';
      if (result) {
        registerOriginalImage(result, file);
      }
      resolve(result);
    };
    reader.onerror = (error) => {
      console.error('Native FileReader error:', error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a file using native FileReader and optimizes it to a compact Base64 Data URL.
 * Falls back to raw FileReader output if compression encounters any failure.
 */
export async function readAndOptimizeImageFile(file: File): Promise<string> {
  if (!file) return '';

  // 1. Native FileReader base64 extraction
  const rawBase64 = await fileToBase64(file);
  if (!rawBase64) return '';
  registerOriginalImage(rawBase64, file);

  // 2. Optimization to avoid localStorage quota limits
  try {
    const optimized = await compressAndReadAsDataURL(file);
    if (optimized) {
      registerOriginalImage(optimized, file);
    }
    return optimized || rawBase64;
  } catch (err) {
    console.warn('Image compression fallback to raw FileReader Base64:', err);
    return rawBase64;
  }
}

/**
 * Detects whether a string is raw HTML content rather than an image URL or Base64 string.
 * Prevents raw Google Drive error pages or HTML snippets from polluting image state.
 */
export function isHtmlSnippet(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<div') ||
    trimmed.startsWith('<script') ||
    trimmed.includes('google drive - virus scan') ||
    trimmed.includes('<body')
  );
}

/**
 * Normalizes Google Drive sharing links to direct image CDN links.
 * Google Drive /file/d/... or open?id=... links return HTML interstitial pages that break <img> tags.
 * This converts them to Google's lh3.googleusercontent.com direct thumbnail/stream endpoint.
 */
export function normalizeGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already a Data URL or invalid HTML, return as-is or sanitized
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (isHtmlSnippet(trimmed)) return '';

  // Match Google Drive file ID pattern
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]{20,})/;
  const match = trimmed.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1];
    // lh3.googleusercontent.com serves direct binary image bytes without Google Drive HTML interstitial warnings
    return `https://lh3.googleusercontent.com/d/${fileId}=s1600`;
  }

  return trimmed;
}

/**
 * Attempts to convert an external URL (such as an image link or normalized Google Drive link)
 * into a local Base64 Data URL using fetch + FileReader.
 * If the response returns HTML instead of an image, it safely rejects to avoid broken HTML rendering.
 */
export async function convertRemoteUrlToBase64(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  const normalized = normalizeGoogleDriveUrl(url);

  if (normalized.startsWith('data:image/')) {
    return normalized;
  }

  try {
    const res = await fetch(normalized, { mode: 'cors' });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('application/json')) {
      // Server returned HTML error page instead of image bytes
      console.warn('Blocked non-image response from remote URL:', contentType);
      return null;
    }

    const blob = await res.blob();
    if (blob.type.includes('html') || blob.type.includes('text')) {
      return null;
    }

    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = (reader.result as string) || null;
        resolve(result);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    // CORS restriction or network block
    return null;
  }
}
