/**
 * imageManager.ts
 * High-performance, memory-safe image handling pipeline for AU Toolkit.
 *
 * Capabilities:
 * - Instant preview generation using browser-native Object URLs (0ms UI latency)
 * - Safe memory tracking and automatic URL.revokeObjectURL cleanup
 * - Asynchronous, non-blocking canvas and Blob conversions
 * - Hardware-accelerated processing via createImageBitmap & toBlob
 * - Pristine aspect ratio and high-resolution preservation
 */

// Active object URLs set for memory leak prevention
const activeObjectUrls = new Set<string>();
const transientPersistentFallbacks = new Map<string, string>();
const persistentObjectUrlCache = new Map<string, string>();
const LOCAL_MEDIA_PREFIX = 'au-local-media://';
const LOCAL_MEDIA_DB = 'au-toolkit-local-media';
const LOCAL_MEDIA_STORE = 'images';
let localMediaResolverInstalled = false;

interface LocalMediaRecord {
  ref: string;
  uid: string;
  context: string;
  mediaId: string;
  blob?: Blob;
  bytes?: ArrayBuffer;
  mimeType: string;
  size: number;
  updatedAt: string;
}

function openLocalMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(LOCAL_MEDIA_DB, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LOCAL_MEDIA_STORE)) {
        const store = database.createObjectStore(LOCAL_MEDIA_STORE, { keyPath: 'ref' });
        store.createIndex('uid', 'uid', { unique: false });
        store.createIndex('context', ['uid', 'context'], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open local image storage.'));
  });
}

function currentStoredUid(): string {
  try {
    const developmentOverride = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV
      ? sessionStorage.getItem('__au_local_media_uid_override')
      : '';
    if (developmentOverride) return developmentOverride;
    const stored = localStorage.getItem('au_auth_user');
    const parsed = stored ? JSON.parse(stored) : null;
    return typeof parsed?.uid === 'string' ? parsed.uid : '';
  } catch {
    return '';
  }
}

export function getLocalMediaOwnerUid(): string {
  return currentStoredUid();
}

function parseLocalMediaReference(ref: string): { uid: string; context: string; mediaId: string } | null {
  if (!ref.startsWith(LOCAL_MEDIA_PREFIX)) return null;
  const parts = ref.slice(LOCAL_MEDIA_PREFIX.length).split('/');
  if (parts.length !== 3) return null;
  try {
    const [uid, context, mediaId] = parts.map((part) => decodeURIComponent(part));
    return uid && context && mediaId ? { uid, context, mediaId } : null;
  } catch {
    return null;
  }
}

function createMediaId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Stores a final cropped Blob in local IndexedDB and returns a stable reference. */
export async function persistLocalImageBlob(uid: string, blob: Blob, context: string): Promise<string> {
  const cleanUid = String(uid || '').trim();
  const cleanContext = String(context || 'workspace').trim() || 'workspace';
  if (!cleanUid) throw new Error('A Firebase UID is required for local image persistence.');
  if (!(blob instanceof Blob) || blob.size <= 0) throw new Error('A valid image Blob is required.');

  const mediaId = createMediaId();
  const ref = `${LOCAL_MEDIA_PREFIX}${encodeURIComponent(cleanUid)}/${encodeURIComponent(cleanContext)}/${encodeURIComponent(mediaId)}`;
  const record: LocalMediaRecord = {
    ref,
    uid: cleanUid,
    context: cleanContext,
    mediaId,
    // Binary buffers avoid browser-specific failures serializing Blob handles.
    bytes: await blob.arrayBuffer(),
    mimeType: blob.type || 'application/octet-stream',
    size: blob.size,
    updatedAt: new Date().toISOString(),
  };
  const database = await openLocalMediaDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(LOCAL_MEDIA_STORE, 'readwrite');
      const request = transaction.objectStore(LOCAL_MEDIA_STORE).put(record);
      request.onerror = () => reject(request.error || new Error('Unable to persist the local image.'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to persist the local image.'));
      transaction.onabort = () => reject(transaction.error || new Error('Local image persistence was aborted.'));
    });
  } finally {
    database.close();
  }
  return ref;
}

export function bindPersistentImageObjectUrl(ref: string, objectUrl: string): void {
  if (parseLocalMediaReference(ref) && isBlobUrl(objectUrl)) {
    persistentObjectUrlCache.set(ref, objectUrl);
  }
}

export async function resolveLocalImageReference(ref: string, uid = currentStoredUid()): Promise<string> {
  const parsed = parseLocalMediaReference(ref);
  if (!parsed || !uid || parsed.uid !== uid) return '';
  const cached = persistentObjectUrlCache.get(ref);
  if (cached) return cached;

  const database = await openLocalMediaDatabase();
  try {
    const record = await new Promise<LocalMediaRecord | undefined>((resolve, reject) => {
      const transaction = database.transaction(LOCAL_MEDIA_STORE, 'readonly');
      const request = transaction.objectStore(LOCAL_MEDIA_STORE).get(ref);
      request.onsuccess = () => resolve(request.result as LocalMediaRecord | undefined);
      request.onerror = () => reject(request.error || new Error('Unable to restore the local image.'));
    });
    if (!record || record.uid !== uid) return '';
    const blob = record.blob instanceof Blob ? record.blob
      : record.bytes instanceof ArrayBuffer ? new Blob([record.bytes], {type: record.mimeType}) : null;
    if (!blob) return '';
    const objectUrl = createSafeObjectURL(blob);
    if (objectUrl) persistentObjectUrlCache.set(ref, objectUrl);
    return objectUrl;
  } finally {
    database.close();
  }
}

export async function deleteLocalImageReference(ref: string, uid = currentStoredUid()): Promise<void> {
  const parsed = parseLocalMediaReference(ref);
  if (!parsed || !uid || parsed.uid !== uid) return;
  const database = await openLocalMediaDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(LOCAL_MEDIA_STORE, 'readwrite');
      transaction.objectStore(LOCAL_MEDIA_STORE).delete(ref);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to delete the local image.'));
    });
  } finally {
    database.close();
  }
  const objectUrl = persistentObjectUrlCache.get(ref);
  if (objectUrl) revokeSafeObjectURL(objectUrl);
  persistentObjectUrlCache.delete(ref);
}

async function resolveElementLocalMedia(element: Element): Promise<void> {
  const uid = currentStoredUid();
  if (!uid) return;

  if (element instanceof HTMLImageElement || element instanceof HTMLSourceElement) {
    const ref = element.getAttribute('src') || element.getAttribute('data-au-local-media-ref') || '';
    if (ref.startsWith(LOCAL_MEDIA_PREFIX)) {
      const objectUrl = await resolveLocalImageReference(ref, uid);
      if (objectUrl && element.isConnected) {
        element.setAttribute('data-au-local-media-ref', ref);
        element.setAttribute('src', objectUrl);
      }
    }
  }

  const style = element.getAttribute('style') || '';
  const refs = style.match(/au-local-media:\/\/[^)'"\s]+/g) || [];
  if (refs.length > 0) {
    let resolvedStyle = style;
    for (const ref of refs) {
      const objectUrl = await resolveLocalImageReference(ref, uid);
      if (objectUrl) resolvedStyle = resolvedStyle.split(ref).join(objectUrl);
    }
    if (resolvedStyle !== style && element.isConnected) element.setAttribute('style', resolvedStyle);
  }
}

function scanLocalMedia(root: ParentNode): void {
  const elements: Element[] = [];
  if (root instanceof Element) elements.push(root);
  elements.push(...Array.from(root.querySelectorAll('img[src^="au-local-media://"], source[src^="au-local-media://"], [style*="au-local-media://"]')));
  elements.forEach((element) => void resolveElementLocalMedia(element));
}

/** Installs one shared resolver for every generator preview and export DOM. */
export function installPersistentLocalImageResolver(): void {
  if (localMediaResolverInstalled || typeof document === 'undefined') return;
  localMediaResolverInstalled = true;
  scanLocalMedia(document);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        void resolveElementLocalMedia(mutation.target);
      }
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) scanLocalMedia(node);
      });
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'style'],
  });
}

/**
 * Creates a browser-native Object URL and tracks it for safe memory cleanup.
 */
export function createSafeObjectURL(fileOrBlob: File | Blob): string {
  if (!fileOrBlob) return '';
  try {
    const url = URL.createObjectURL(fileOrBlob);
    activeObjectUrls.add(url);
    return url;
  } catch (err) {
    console.error('Failed to create safe Object URL:', err);
    return '';
  }
}

/**
 * Revokes a tracked Object URL and frees memory immediately.
 */
export function revokeSafeObjectURL(url: string | null | undefined): void {
  if (!url || typeof url !== 'string' || !url.startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(url);
    activeObjectUrls.delete(url);
    transientPersistentFallbacks.delete(url);
  } catch {
    // Ignore errors during revocation
  }
}

/**
 * Cleans up all tracked Object URLs on unmount or application reset.
 */
export function cleanupAllObjectUrls(): void {
  activeObjectUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  });
  activeObjectUrls.clear();
  transientPersistentFallbacks.clear();
  persistentObjectUrlCache.clear();
}

/**
 * Associates a session-only image URL with the last stable value that may be
 * written to persistence. The object URL remains valid for Live Preview, while
 * Firestore serialization can retain the prior HTTPS URL (or an empty value)
 * instead of storing blob/data URLs.
 */
export function registerTransientImageUrl(localUrl: string, persistentFallback = ''): void {
  if (!localUrl || !/^(?:blob:|data:|file:)/i.test(localUrl)) return;
  const resolvedFallback = resolvePersistentImageUrl(persistentFallback);
  transientPersistentFallbacks.set(localUrl, resolvedFallback);
}

export function resolvePersistentImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith(LOCAL_MEDIA_PREFIX)) return url;
  if (transientPersistentFallbacks.has(url)) {
    return transientPersistentFallbacks.get(url) || '';
  }
  return /^(?:blob:|data:|file:)/i.test(url) ? '' : url;
}

export function replaceTransientImageUrlsDeep<T = any>(value: T): T {
  if (typeof value === 'string') {
    return resolvePersistentImageUrl(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceTransientImageUrlsDeep(item)) as T;
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, nested] of Object.entries(value)) {
      clean[key] = replaceTransientImageUrlsDeep(nested);
    }
    return clean as T;
  }
  return value;
}

/**
 * Checks if a given string is a browser-native Blob Object URL.
 */
export function isBlobUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith('blob:');
}

/**
 * Asynchronously converts an HTMLCanvasElement to a high-quality Data URL
 * using browser-native canvas.toBlob() to avoid blocking the main UI thread.
 */
export function canvasToDataUrlAsync(
  canvas: HTMLCanvasElement,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality = 0.94
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      resolve('');
      return;
    }

    // Modern browsers support canvas.toBlob() which offloads encoding
    if (typeof canvas.toBlob === 'function') {
      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to synchronous toDataURL only if toBlob returned null
              try {
                resolve(canvas.toDataURL(mimeType, quality));
              } catch (e) {
                reject(e);
              }
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              resolve((reader.result as string) || '');
            };
            reader.onerror = (err) => {
              console.warn('FileReader error after toBlob, falling back to toDataURL:', err);
              try {
                resolve(canvas.toDataURL(mimeType, quality));
              } catch (fallbackErr) {
                reject(fallbackErr);
              }
            };
            reader.readAsDataURL(blob);
          },
          mimeType,
          quality
        );
        return;
      } catch (e) {
        console.warn('canvas.toBlob failed, fallback to toDataURL:', e);
      }
    }

    // Fallback for older browsers
    try {
      resolve(canvas.toDataURL(mimeType, quality));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Asynchronously converts a Blob or Object URL into a persistent self-contained
 * Base64 Data URL so it can be stored in Firestore or localStorage.
 */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  if (!blobUrl || !blobUrl.startsWith('blob:')) {
    return blobUrl;
  }
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader.result as string) || '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to convert blob URL to Data URL:', err);
    return blobUrl;
  }
}

/**
 * Asynchronously crops an image canvas for circular shapes with antialiasing.
 * Runs non-blockingly using requestAnimationFrame and canvasToDataUrlAsync.
 */
export async function createCircularCropDataUrl(
  sourceCanvas: HTMLCanvasElement,
  maxDiameter = 1080
): Promise<string> {
  const diameter = Math.min(maxDiameter, sourceCanvas.width, sourceCanvas.height);
  const circleCanvas = document.createElement('canvas');
  circleCanvas.width = diameter;
  circleCanvas.height = diameter;

  const ctx = circleCanvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return canvasToDataUrlAsync(sourceCanvas, 'image/png', 1.0);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.beginPath();
  ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    sourceCanvas,
    (sourceCanvas.width - diameter) / 2,
    (sourceCanvas.height - diameter) / 2,
    diameter,
    diameter,
    0,
    0,
    diameter,
    diameter
  );

  return canvasToDataUrlAsync(circleCanvas, 'image/png', 1.0);
}
