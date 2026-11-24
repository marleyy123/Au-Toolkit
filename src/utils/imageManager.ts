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
const CLOUD_MEDIA_PREFIX = 'au-cloud-media://';
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
  cloudRef?: string;
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

    const storageKeys = ['au_auth_user', 'au_account_user', 'au_firebase_auth_user'];
    for (const key of storageKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      const parsed = JSON.parse(stored);
      if (typeof parsed?.uid === 'string' && parsed.uid.trim()) return parsed.uid.trim();
    }
  } catch {
    // Ignore malformed or unavailable auth payloads and fall back to an empty uid.
  }
  return '';
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

function parseCloudMediaReference(ref: string): { uid: string; key: string } | null {
  if (!ref.startsWith(CLOUD_MEDIA_PREFIX)) return null;
  const raw = ref.slice(CLOUD_MEDIA_PREFIX.length);
  const slashIndex = raw.indexOf('/');
  if (slashIndex <= 0) return null;
  try {
    const uid = decodeURIComponent(raw.slice(0, slashIndex));
    const key = decodeURIComponent(raw.slice(slashIndex + 1));
    if (!uid || !key || !key.startsWith(`${uid}/`)) return null;
    return { uid, key };
  } catch {
    return null;
  }
}

const cloudMediaEndpoint = () => String(import.meta.env.VITE_CLOUDFLARE_MEDIA_URL || '').replace(/\/$/, '');

// Cache the module import only (never the uid), so we don't re-import per element.
let firebaseModulePromise: Promise<typeof import('../firebase')> | null = null;
const loadFirebase = () => (firebaseModulePromise ??= import('../firebase'));

async function cloudMediaRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const endpoint = cloudMediaEndpoint();
  if (!endpoint) throw new Error('CLOUD_MEDIA_NOT_CONFIGURED');
  const { auth } = await loadFirebase();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${endpoint}${path}`, { ...init, headers });
}

async function uploadCloudMediaBlob(uid: string, blob: Blob): Promise<string> {
  const { auth } = await loadFirebase();
  if (auth.authStateReady) {
    try {
      await auth.authStateReady();
    } catch {}
  }
  const currentUid = auth.currentUser?.uid;
  if (!currentUid || currentUid !== uid) throw new Error('AUTH_REQUIRED');

  let contentType = (blob.type || '').split(';')[0].trim().toLowerCase();
  const allowed = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/webm',
  ]);
  if (!allowed.has(contentType)) {
    contentType = 'image/jpeg';
  }

  const response = await cloudMediaRequest('/media', {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'MEDIA_UPLOAD_FAILED');
  const key = String(result.key || '');
  if (!key.startsWith(`${uid}/`)) throw new Error('MEDIA_UPLOAD_FAILED');
  return `${CLOUD_MEDIA_PREFIX}${encodeURIComponent(uid)}/${encodeURIComponent(key)}`;
}

export function getCachedCloudMediaUsage(): { usedBytes: number; quotaBytes: number } | null {
  return null;
}

/** Converts a Base64 Data URL to a native browser Blob */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const match = parts[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn('Failed to convert dataUrl to Blob:', err);
    return null;
  }
}

/** Uploads a Base64 Data URL directly to Cloudflare R2 and returns an au-cloud-media reference */
export async function uploadDataUrlToCloudMedia(uid: string, dataUrl: string): Promise<string> {
  const cleanUid = String(uid || '').trim();
  if (!cleanUid) {
    throw new Error('FIREBASE_UID_REQUIRED');
  }
  const blob = dataUrlToBlob(dataUrl);
  if (!blob || blob.size <= 0) {
    throw new Error('INVALID_DATA_URL_BLOB');
  }
  if (!cloudMediaEndpoint()) {
    throw new Error('CLOUD_MEDIA_NOT_CONFIGURED');
  }
  return uploadCloudMediaBlob(cleanUid, blob);
}

/** Uploads a final cropped Blob to cloud media and returns a stable reference. */
export async function persistLocalImageBlob(
  uid: string,
  blob: Blob,
  _context: string
): Promise<string> {
  const cleanUid = String(uid || '').trim();

  if (!cleanUid) {
    throw new Error('FIREBASE_UID_REQUIRED');
  }

  if (!(blob instanceof Blob) || blob.size <= 0) {
    throw new Error('INVALID_MEDIA_BLOB');
  }

  if (!cloudMediaEndpoint()) {
    throw new Error('CLOUD_MEDIA_NOT_CONFIGURED');
  }

  return uploadCloudMediaBlob(cleanUid, blob);
}

/** Migrate one browser-local file to R2 while leaving the source intact for rollback. */
export async function migrateLocalImageReference(ref: string, uid = currentStoredUid()): Promise<string> {
  if (!ref.startsWith(LOCAL_MEDIA_PREFIX)) return ref;

  if (!cloudMediaEndpoint()) {
    throw new Error('CLOUD_MEDIA_NOT_CONFIGURED');
  }
  const database = await openLocalMediaDatabase();
  let record: LocalMediaRecord | undefined;
  try {
    record = await new Promise<LocalMediaRecord | undefined>((resolve, reject) => {
      const request = database.transaction(LOCAL_MEDIA_STORE, 'readonly').objectStore(LOCAL_MEDIA_STORE).get(ref);
      request.onsuccess = () => resolve(request.result as LocalMediaRecord | undefined);
      request.onerror = () => reject(request.error || new Error('Unable to read the local image for migration.'));
    });
  } finally { database.close(); }
  if (!record) throw new Error('LOCAL_MEDIA_UNAVAILABLE');
  if (record.cloudRef?.startsWith(CLOUD_MEDIA_PREFIX)) return record.cloudRef;
  const blob = record.blob instanceof Blob ? record.blob
    : record.bytes instanceof ArrayBuffer ? new Blob([record.bytes], { type: record.mimeType }) : null;
  if (!blob) throw new Error('LOCAL_MEDIA_UNAVAILABLE');

  const uploadUid = (uid && uid.trim()) || record.uid || currentStoredUid();
  if (!uploadUid) throw new Error('LOCAL_MEDIA_OWNER_MISMATCH');

  const cloudRef = await uploadCloudMediaBlob(uploadUid, blob);
  record.cloudRef = cloudRef;
  const writeDatabase = await openLocalMediaDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = writeDatabase.transaction(LOCAL_MEDIA_STORE, 'readwrite');
      transaction.objectStore(LOCAL_MEDIA_STORE).put(record!);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to save the media migration record.'));
    });
  } finally { writeDatabase.close(); }
  return cloudRef;
}

/** Automatically uplinks any local image format (Base64 data:image or au-local-media://) to Cloudflare R2 */
export async function migrateAnyMediaReference(ref: string, uid = currentStoredUid()): Promise<string> {
  if (!ref || typeof ref !== 'string') return ref;
  const trimmed = ref.trim();

  // Already persistent in Cloudflare R2 or stable external URL
  if (trimmed.startsWith(CLOUD_MEDIA_PREFIX) || (trimmed.startsWith('https://') && !trimmed.includes('localhost'))) {
    return trimmed;
  }

  const effectiveUid = (uid && uid.trim()) || currentStoredUid();
  if (!effectiveUid) return trimmed;

  // Base64 Data URL
  if (trimmed.startsWith('data:image/')) {
    try {
      return await uploadDataUrlToCloudMedia(effectiveUid, trimmed);
    } catch (err) {
      console.warn('Auto-uplink data URL to R2 notice:', err);
      return trimmed;
    }
  }

  // Local IndexedDB media reference
  if (trimmed.startsWith(LOCAL_MEDIA_PREFIX)) {
    try {
      return await migrateLocalImageReference(trimmed, effectiveUid);
    } catch (err) {
      console.warn('Auto-uplink local media reference to R2 notice:', err);
      return trimmed;
    }
  }

  return trimmed;
}

/** Recursively migrates any Base64 or local media references within an object to R2 */
export async function deepMigrateAndReplaceMedia(
  value: any,
  uid: string,
  cache = new Map<string, string>()
): Promise<{ data: any; hasChanged: boolean }> {
  let hasChanged = false;

  async function traverse(node: any): Promise<any> {
    if (typeof node === 'string') {
      const trimmed = node.trim();
      if (trimmed.startsWith('data:image/') || trimmed.startsWith(LOCAL_MEDIA_PREFIX)) {
        if (!cache.has(trimmed)) {
          const migrated = await migrateAnyMediaReference(trimmed, uid);
          cache.set(trimmed, migrated);
        }
        const result = cache.get(trimmed) || trimmed;
        if (result !== trimmed && result.startsWith(CLOUD_MEDIA_PREFIX)) {
          hasChanged = true;
          if (trimmed.startsWith('data:image/')) {
            bindPersistentImageObjectUrl(result, trimmed);
          }
          return result;
        }
      }
      return node;
    }

    if (Array.isArray(node)) {
      const arrResult: any[] = [];
      for (const item of node) {
        arrResult.push(await traverse(item));
      }
      return arrResult;
    }

    if (node && typeof node === 'object') {
      const objResult: Record<string, any> = {};
      for (const [k, v] of Object.entries(node)) {
        objResult[k] = await traverse(v);
      }
      return objResult;
    }

    return node;
  }

  const data = await traverse(value);
  return { data, hasChanged };
}

export function bindPersistentImageObjectUrl(ref: string, objectUrl: string): void {
  if ((parseLocalMediaReference(ref) || parseCloudMediaReference(ref)) && isBlobUrl(objectUrl)) {
    persistentObjectUrlCache.set(ref, objectUrl);
  }
}

const unresolvableMediaCache = new Set<string>();
// De-duplicates concurrent resolves of the same ref (one fetch per ref).
const inflightResolves = new Map<string, Promise<string>>();

export function resolveLocalImageReference(ref: string, uid = currentStoredUid()): Promise<string> {
  if (unresolvableMediaCache.has(ref)) return Promise.resolve('');
  const cachedUrl = persistentObjectUrlCache.get(ref);
  if (cachedUrl) return Promise.resolve(cachedUrl);

  const existing = inflightResolves.get(ref);
  if (existing) return existing;

  const promise = resolveLocalImageReferenceInternal(ref, uid).finally(() => {
    inflightResolves.delete(ref);
  });
  inflightResolves.set(ref, promise);
  return promise;
}

async function resolveLocalImageReferenceInternal(ref: string, uid: string): Promise<string> {
  const cloud = parseCloudMediaReference(ref);
  if (cloud) {
    const { auth } = await loadFirebase();
    await auth.authStateReady();

    const activeUid = auth.currentUser?.uid;
    const effectiveUid = activeUid || uid || currentStoredUid();
    if (!effectiveUid) return '';

    const cached = persistentObjectUrlCache.get(ref);
    if (cached) return cached;

    let response: Response;
    try {
      response = await cloudMediaRequest(`/media?key=${encodeURIComponent(cloud.key)}`);
    } catch (error) {
      // Transient (no auth yet, offline, ...): do NOT cache, it is retried later.
      console.warn('[CLOUD MEDIA REQUEST ERROR]', error);
      return '';
    }

    if (!response.ok) {
      console.warn('[CLOUD MEDIA RESPONSE ERROR]', response.status);
      // Only definitive answers are cached. 401/5xx/429 may succeed on a retry.
      if (response.status === 404 || response.status === 403 || response.status === 410) {
        unresolvableMediaCache.add(ref);
      }
      return '';
    }
    const objectUrl = createSafeObjectURL(await response.blob());
    if (objectUrl) persistentObjectUrlCache.set(ref, objectUrl);
    return objectUrl;
  }

  if (!uid) return ''; // transient: auth not ready yet
  const parsed = parseLocalMediaReference(ref);
  if (!parsed || parsed.uid !== uid) {
    unresolvableMediaCache.add(ref);
    return '';
  }
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
    if (!record || record.uid !== uid) {
      unresolvableMediaCache.add(ref);
      return '';
    }
    const blob = record.blob instanceof Blob ? record.blob
      : record.bytes instanceof ArrayBuffer ? new Blob([record.bytes], { type: record.mimeType }) : null;
    if (!blob) {
      unresolvableMediaCache.add(ref);
      return '';
    }
    const objectUrl = createSafeObjectURL(blob);
    if (objectUrl) persistentObjectUrlCache.set(ref, objectUrl);
    return objectUrl;
  } catch {
    unresolvableMediaCache.add(ref);
    return '';
  } finally {
    database.close();
  }
}

export async function deleteLocalImageReference(ref: string, uid = currentStoredUid()): Promise<void> {
  const cloud = parseCloudMediaReference(ref);
  if (cloud) {
    if (!uid || cloud.uid !== uid) return;
    const response = await cloudMediaRequest(`/media?key=${encodeURIComponent(cloud.key)}`, { method: 'DELETE' });
    const usage = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(usage.error || 'MEDIA_DELETE_FAILED');
    const objectUrl = persistentObjectUrlCache.get(ref);
    if (objectUrl) revokeSafeObjectURL(objectUrl);
    persistentObjectUrlCache.delete(ref);
    return;
  }
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

/* ==========================================================================
   DOM RESOLVER
   - never rewrites an identical attribute value (no MutationObserver loop)
   - transient failures (no auth yet, 401, offline) are NOT cached; they are
     retried after login, when the network returns, and right before export
   ========================================================================== */

const MEDIA_REF_PATTERN = /au-(?:local|cloud)-media:\/\/[^)'"\s]+/g;
const isMediaRef = (value: string) =>
  value.startsWith(LOCAL_MEDIA_PREFIX) || value.startsWith(CLOUD_MEDIA_PREFIX);

const FAILED_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';

const MEDIA_SELECTOR =
  'img[src^="au-local-media://"], source[src^="au-local-media://"], img[src^="au-cloud-media://"], source[src^="au-cloud-media://"], [style*="au-local-media://"], [style*="au-cloud-media://"]';

let authRetryHooked = false;

async function resolveElementLocalMedia(element: Element): Promise<void> {
  // 1. Synchronous checks first: no media reference -> exit immediately.
  const isMediaTag =
    element instanceof HTMLImageElement || element instanceof HTMLSourceElement;
  const currentSrc = isMediaTag ? element.getAttribute('src') || '' : '';
  const storedRef = isMediaTag ? element.getAttribute('data-au-local-media-ref') || '' : '';
  const style = element.getAttribute('style') || '';
  const styleRefs = style.match(MEDIA_REF_PATTERN) || [];

  // If src is still a reference use it; if it is already blob:, use the stored ref.
  const imageRef = isMediaTag ? (isMediaRef(currentSrc) ? currentSrc : storedRef) : '';
  const hasImageRef = isMediaRef(imageRef);

  if (!hasImageRef && styleRefs.length === 0) return;

  // Definitive failure already handled (placeholder in place).
  if (hasImageRef && styleRefs.length === 0 && unresolvableMediaCache.has(imageRef)) return;

  // Already resolved (src is the cached blob) and nothing in style.
  if (
    hasImageRef &&
    styleRefs.length === 0 &&
    currentSrc.startsWith('blob:') &&
    persistentObjectUrlCache.get(storedRef) === currentSrc
  ) {
    return;
  }

  // 2. Only now wait for auth.
  const { auth } = await loadFirebase();

  if (!authRetryHooked) {
    authRetryHooked = true;
    let firstCall = true;
    auth.onAuthStateChanged((user) => {
      if (firstCall) { firstCall = false; return; } // initial callback = current state
      if (user) void ensureMediaResolved(document);
    });
    window.addEventListener('online', () => void ensureMediaResolved(document));
  }

  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) return; // transient: retried by the auth listener / ensureMediaResolved

  // 3. <img> / <source>
  if (hasImageRef) {
    if (element.getAttribute('data-au-local-media-ref') !== imageRef) {
      element.setAttribute('data-au-local-media-ref', imageRef);
      element.removeAttribute('data-au-media-failed');
    }

    const objectUrl = await resolveLocalImageReference(imageRef, uid);

    if (!objectUrl) {
      // Only a definitive failure gets the placeholder. The browser can never load
      // au-*-media:// itself (ERR_UNKNOWN_URL_SCHEME), so leaving it would block export.
      if (unresolvableMediaCache.has(imageRef)) {
        if (element.getAttribute('data-au-media-failed') !== 'true') {
          element.setAttribute('data-au-media-failed', 'true');
        }
        if (isMediaRef(element.getAttribute('src') || '')) {
          element.setAttribute('src', FAILED_PLACEHOLDER);
        }
      }
      return;
    }

    if (!element.isConnected) return;

    const latestSrc = element.getAttribute('src') || '';
    const boundRef = element.getAttribute('data-au-local-media-ref') || '';

    if (boundRef === imageRef || latestSrc === imageRef || latestSrc.startsWith('blob:')) {
      // Never rewrite the same value: setAttribute always triggers the MutationObserver.
      if (latestSrc !== objectUrl) element.setAttribute('src', objectUrl);
    }
  }

  // 4. References inside the style attribute (background-image etc.)
  if (styleRefs.length > 0) {
    let resolvedStyle = style;
    for (const ref of styleRefs) {
      const objectUrl = await resolveLocalImageReference(ref, uid);
      if (objectUrl) resolvedStyle = resolvedStyle.split(ref).join(objectUrl);
    }
    if (
      resolvedStyle !== style &&
      element.isConnected &&
      element.getAttribute('style') === style
    ) {
      element.setAttribute('style', resolvedStyle);
    }
  }
}

function collectMediaElements(root: ParentNode): Element[] {
  const elements: Element[] = [];
  if (root instanceof Element) elements.push(root);
  elements.push(...Array.from(root.querySelectorAll(MEDIA_SELECTOR)));
  return elements;
}

function scanLocalMedia(root: ParentNode): void {
  collectMediaElements(root).forEach((element) => void resolveElementLocalMedia(element));
}

/**
 * Retries every unresolved au-local/au-cloud media element under `root` and waits
 * for it. Call this right before export/copy so a stale failure can never block it.
 */
export async function ensureMediaResolved(
  root: ParentNode = document,
  timeoutMs = 15000
): Promise<void> {
  const work = Promise.all(
    collectMediaElements(root).map((element) => resolveElementLocalMedia(element).catch(() => {}))
  );
  await Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
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
  if (url.startsWith(LOCAL_MEDIA_PREFIX) || url.startsWith(CLOUD_MEDIA_PREFIX)) return url;
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
  maxDiameter = 800
): Promise<string> {
  const diameter = Math.min(maxDiameter, sourceCanvas.width, sourceCanvas.height);
  const circleCanvas = document.createElement('canvas');
  circleCanvas.width = diameter;
  circleCanvas.height = diameter;

  const ctx = circleCanvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return canvasToDataUrlAsync(sourceCanvas, 'image/webp', 0.88);
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

  try {
    const webpUrl = await canvasToDataUrlAsync(circleCanvas, 'image/webp', 0.88);
    if (webpUrl && webpUrl.startsWith('data:image/webp')) return webpUrl;
  } catch {}

  return canvasToDataUrlAsync(circleCanvas, 'image/png', 0.88);
}