/**
 * Image Registry for AU Toolkit
 * Stores and resolves original, high-resolution image sources (File, Blob, uncompressed Data URL)
 * so that exports render at true 1x, 2x (HD), and 3x (4K) using the original camera/upload assets
 * instead of preview-downscaled thumbnails.
 */

interface OriginalAsset {
  source: File | Blob | string;
  dataUrlPromise?: Promise<string>;
  timestamp: number;
}

// In-memory registry mapping preview URLs / hashes / paths to pristine original sources
const registry = new Map<string, OriginalAsset>();

/**
 * Register an original asset associated with a preview URL, instant object URL, or data URL
 */
export function registerOriginalImage(
  key: string,
  originalSource: File | Blob | string
): void {
  if (!key || !originalSource) return;
  const normalizedKey = key.trim();
  if (!normalizedKey) return;

  registry.set(normalizedKey, {
    source: originalSource,
    timestamp: Date.now(),
  });

  // If the key is an Object URL, also index by its pathname
  if (normalizedKey.startsWith('blob:')) {
    try {
      const parsed = new URL(normalizedKey);
      registry.set(parsed.pathname, {
        source: originalSource,
        timestamp: Date.now(),
      });
    } catch {}
  }
}

/**
 * Check if an original asset exists for a given URL or data URL
 */
export function getOriginalImage(key: string): OriginalAsset | undefined {
  if (!key) return undefined;
  const normalizedKey = key.trim();
  if (registry.has(normalizedKey)) {
    return registry.get(normalizedKey);
  }

  if (normalizedKey.startsWith('blob:')) {
    try {
      const parsed = new URL(normalizedKey);
      if (registry.has(parsed.pathname)) {
        return registry.get(parsed.pathname);
      }
    } catch {}
  }

  return undefined;
}

/**
 * Convert any File or Blob to a full-resolution base64 Data URL
 */
export async function blobToDataUrl(blob: Blob | File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Resolves the highest-resolution Data URL available for a given image src.
 * If the source is registered as a File or Blob, it reads the original uncompressed bytes.
 * Otherwise returns the input source.
 */
export async function resolveHighestResolutionSource(src: string): Promise<string> {
  if (!src) return src;
  const asset = getOriginalImage(src);
  if (!asset) return src;

  if (typeof asset.source === 'string') {
    return asset.source;
  }

  const rawSource = asset.source as any;
  if (typeof Blob !== 'undefined' && rawSource instanceof Blob) {
    if (!asset.dataUrlPromise) {
      asset.dataUrlPromise = blobToDataUrl(rawSource);
    }
    try {
      const fullRes = await asset.dataUrlPromise;
      return fullRes || src;
    } catch {
      return src;
    }
  }

  return src;
}

/**
 * Clear older cache entries if memory footprint grows
 */
export function pruneOldAssets(maxAgeMs = 1000 * 60 * 60): void {
  const now = Date.now();
  for (const [key, asset] of registry.entries()) {
    if (now - asset.timestamp > maxAgeMs) {
      registry.delete(key);
    }
  }
}
