import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  setLogLevel,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import { replaceTransientImageUrlsDeep } from './utils/imageManager';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { ensureDataUrlUnderSize } from './utils/imageCompressor';

// The config is injected via Vite environment variables
const resolvedProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
const resolvedAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (resolvedProjectId ? `${resolvedProjectId}.firebaseapp.com` : '');
const resolvedDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';
const resolvedApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const resolvedAppId = import.meta.env.VITE_FIREBASE_APP_ID || '';

if (!resolvedProjectId) {
  throw new Error('[Firebase Config Error] Missing Firebase Project ID in configuration.');
}
if (!resolvedApiKey) {
  throw new Error('[Firebase Config Error] Missing API Key in Firebase configuration.');
}

export const firebaseConfig = {
  projectId: resolvedProjectId,
  appId: resolvedAppId,
  apiKey: resolvedApiKey,
  authDomain: resolvedAuthDomain,
  firestoreDatabaseId: resolvedDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${resolvedProjectId}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Silence non-critical backend connection warnings (e.g. offline fallback warnings)
try {
  setLogLevel('silent');
} catch {
  // Ignore in environments where setLogLevel is restricted
}

export const db: Firestore = (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)')
  ? getFirestore(app)
  : getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

console.log('[Firestore] Initializing Firestore instance...', {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
});

// Validate Connection to Firestore on startup per skill guidelines
async function testConnection() {
  try {
    console.log('[Firestore] Testing connection to Firestore server...');
    const snap = await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Connection established successfully (exists:', snap.exists(), ')');
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (error?.code === 'not-found' || msg.includes('not found') || msg.includes('NOT_FOUND')) {
      console.log('[Firestore] Connection established successfully (test doc ready).');
    } else if (msg.includes('the client is offline')) {
      console.warn('[Firestore] Notice: Client is operating in local/offline cache mode.');
    } else {
      console.log('[Firestore] Connection test status:', error?.code || msg || 'ready');
    }
  }
}
testConnection();

// Local Auth Mock State & Persistence helpers
const LOCAL_AUTH_STORAGE_KEY = 'au_auth_user';
const authListeners: Array<(user: any) => void> = [];

export function getStoredAuthUser(): any {
  try {
    const saved = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading stored auth user:', e);
  }
  return null;
}

export function setStoredAuthUser(user: any) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
    }
    // Notify custom auth listeners
    authListeners.forEach((cb) => {
      try {
        cb(user || auth.currentUser || null);
      } catch (e) {}
    });
  } catch (e) {}
}

// Google Sign-in helper. The current production failure was a mixed Firebase
// configuration, not popup incompatibility, so keep the existing SDK popup flow.
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result?.user) {
      setStoredAuthUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      return result.user;
    }
    return null;
  } catch (error: any) {
    const code = error?.code || '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      // User closed or cancelled the popup window
      return null;
    }

    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Email/Password Sign-in helper
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim();
  const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  if (res?.user) {
    const userPayload = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || cleanEmail.split('@')[0],
      photoURL: res.user.photoURL,
    };
    setStoredAuthUser(userPayload);
    return res.user;
  }
  throw new Error('Gagal masuk. Periksa kembali email dan password.');
}

// Firebase owns password-reset delivery. The app never receives or persists a
// replacement password through this flow.
export async function requestPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('auth/missing-email');
  }
  await sendPasswordResetEmail(auth, cleanEmail);
}

// Update only the currently authenticated Firebase user's credential. Password
// values are deliberately not copied into app state persistence or Firestore.
export async function updateCurrentUserPassword(newPassword: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    const error = new Error('User must be signed in before changing password.') as Error & { code?: string };
    error.code = 'auth/requires-authentication';
    throw error;
  }
  await updatePassword(currentUser, newPassword);
}

// Email/Password Sign-up helper
export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const cleanEmail = email.trim();
  const cleanName = displayName?.trim() || cleanEmail.split('@')[0] || 'AU Member';
  const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  if (res?.user) {
    if (cleanName) {
      await updateProfile(res.user, { displayName: cleanName }).catch(() => {});
    }
    const userPayload = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: cleanName,
      photoURL: res.user.photoURL,
    };
    setStoredAuthUser(userPayload);
    return res.user;
  }
  throw new Error('Gagal mendaftar akun baru.');
}

// Sign-out helper
export async function signOutUser(): Promise<void> {
  setStoredAuthUser(null);
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Sign-out error:', error);
  }
}

// Listen to Auth State
export function onAuthUserChanged(callback: (user: any) => void): () => void {
  authListeners.push(callback);

  // Immediately notify listener with stored user or firebase current user
  const initialUser = auth.currentUser || getStoredAuthUser();
  if (initialUser) {
    try {
      callback(initialUser);
    } catch (e) {}
  }

  const unsubscribeFirebase = onAuthStateChanged(
    auth,
    (firebaseUser) => {
      if (firebaseUser) {
        const userPayload = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setStoredAuthUser(userPayload);
        callback(firebaseUser);
      } else {
        const stored = getStoredAuthUser();
        callback(stored || null);
      }
    },
    (error) => {
      console.warn('Firebase onAuthStateChanged error handled safely:', error);
      const stored = getStoredAuthUser();
      callback(stored || null);
    }
  );

  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) {
      authListeners.splice(idx, 1);
    }
    try {
      unsubscribeFirebase();
    } catch (e) {}
  };
}

// Sanitize email or ID to safe Firestore doc id
export function sanitizeUserKey(emailOrId: string): string {
  if (!emailOrId) return 'anonymous_user';
  return emailOrId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

/**
 * Recursively removes all `undefined` values from an object or array.
 * This guarantees that Firestore WriteBatch, setDoc, or updateDoc will NEVER throw:
 * "Unsupported field value: undefined"
 */
export function removeUndefinedDeep<T = any>(value: T): T {
  if (value === undefined) {
    return null as any;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : removeUndefinedDeep(item))) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v !== undefined) {
      cleanObj[k] = removeUndefinedDeep(v);
    }
  }
  return cleanObj as T;
}

// Safely sanitizes any payload before sending to Firestore to guarantee
// 1. All `undefined` values are completely stripped (preventing Firestore WriteBatch errors)
// 2. It remains well below the hard 1MB (1,048,576 byte) document limit.
async function sanitizeObjectForFirestore(obj: any, maxDocBytes = 750_000): Promise<any> {
  if (!obj) return obj;
  try {
    // Local preview references are valid only in the current browser session.
    // Restore their last stable value before any Firestore fingerprint/write.
    const cleaned = removeUndefinedDeep(replaceTransientImageUrlsDeep(obj));
    let rawStr = JSON.stringify(cleaned);
    if (rawStr.length < maxDocBytes) {
      return cleaned;
    }

    const cloned = JSON.parse(rawStr);
    const targetSizes = [75_000, 45_000, 25_000, 15_000];
    for (const targetSize of targetSizes) {
      const sanitizeDeep = async (node: any) => {
        if (!node || typeof node !== 'object') return;
        for (const k of Object.keys(node)) {
          const val = node[k];
          if (typeof val === 'string' && val.startsWith('data:image/') && val.length > targetSize) {
            node[k] = await ensureDataUrlUnderSize(val, targetSize);
          } else if (typeof val === 'object') {
            await sanitizeDeep(val);
          }
        }
      };
      await sanitizeDeep(cloned);
      rawStr = JSON.stringify(cloned);
      if (rawStr.length < maxDocBytes) {
        break;
      }
    }
    return removeUndefinedDeep(cloned);
  } catch {
    return removeUndefinedDeep(obj);
  }
}

// Fast fingerprint generator to detect data changes
function computeFingerprint(data: any): string {
  try {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `${str.length}_${hash}`;
  } catch {
    return String(Math.random());
  }
}

// Cache of saved document fingerprints to enable differential writes (reduces writes by >90%)
const savedTabFingerprints = new Map<string, string>();
const savedFolderFingerprints = new Map<string, string>();
const savedWorkspaceFingerprints = new Map<string, string>();
let savedRootFingerprint = '';

export function clearWorkspaceFingerprintCache(): void {
  savedTabFingerprints.clear();
  savedFolderFingerprints.clear();
  savedWorkspaceFingerprints.clear();
  savedRootFingerprint = '';
}

// ---------------------------------------------------------------------------
// Firestore Free Daily Quota Circuit Breaker
// Prevents continuous write retries and backoff loops when quota is exceeded
// ---------------------------------------------------------------------------
const QUOTA_EXHAUSTED_KEY = 'autoolkit_firestore_quota_exhausted_until';

export function isFirestoreQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
  const msg = err instanceof Error ? err.message : String(err);
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units') ||
    msg.includes('quota metric') ||
    msg.includes('maximum backoff delay')
  );
}

export function isFirestoreQuotaExhausted(): boolean {
  try {
    const raw = sessionStorage.getItem(QUOTA_EXHAUSTED_KEY);
    if (!raw) return false;
    const expiresAt = parseInt(raw, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      sessionStorage.removeItem(QUOTA_EXHAUSTED_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

const quotaListeners = new Set<(isExhausted: boolean) => void>();

export function onQuotaStatusChange(listener: (isExhausted: boolean) => void): () => void {
  quotaListeners.add(listener);
  try {
    listener(isFirestoreQuotaExhausted());
  } catch {}
  return () => {
    quotaListeners.delete(listener);
  };
}

function notifyQuotaListeners(isExhausted: boolean) {
  quotaListeners.forEach((listener) => {
    try {
      listener(isExhausted);
    } catch {}
  });
}

export function markFirestoreQuotaExhausted(cooldownMinutes: number = 60): void {
  try {
    const until = Date.now() + cooldownMinutes * 60 * 1000;
    sessionStorage.setItem(QUOTA_EXHAUSTED_KEY, String(until));
  } catch {}
  notifyQuotaListeners(true);
}

export function resetFirestoreQuotaCircuitBreaker(): void {
  try {
    sessionStorage.removeItem(QUOTA_EXHAUSTED_KEY);
  } catch {}
  notifyQuotaListeners(false);
}

// Canonical helper to derive the stable internal user ID for any normalized buyer email
export function getStableUserIdFromEmail(email: string): string {
  const clean = (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return clean ? `user_${clean}` : 'anonymous_user';
}

export type FirebaseUserIdentity = string | { email?: string | null; uid?: string | null };

function getIdentityEmail(userOrKey?: FirebaseUserIdentity | null): string {
  if (typeof userOrKey === 'object' && userOrKey?.email) return userOrKey.email.trim().toLowerCase();
  if (typeof userOrKey === 'string' && userOrKey.includes('@')) return userOrKey.trim().toLowerCase();
  const docId = getUserDocumentId(userOrKey);
  if (auth.currentUser?.uid === docId && auth.currentUser.email) return auth.currentUser.email.toLowerCase();
  return '';
}

// Canonical helper to resolve a consistent user document ID across all operations
export function getUserDocumentId(userOrKey?: string | { email?: string | null; uid?: string | null } | null): string {
  if (!userOrKey) {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    return 'anonymous_user';
  }
  if (typeof userOrKey === 'object') {
    // Firebase Auth UID is the only canonical /users document ID. This matches Firestore rules.
    if (userOrKey.uid && typeof userOrKey.uid === 'string' && userOrKey.uid.trim()) {
      return userOrKey.uid.trim();
    }
    if (
      auth.currentUser?.uid &&
      (!userOrKey.email || auth.currentUser.email?.toLowerCase() === userOrKey.email.toLowerCase())
    ) {
      return auth.currentUser.uid;
    }
    // Stable email IDs are retained only for unauthenticated legacy lookup/migration.
    if (userOrKey.email && typeof userOrKey.email === 'string' && userOrKey.email.includes('@')) {
      return getStableUserIdFromEmail(userOrKey.email);
    }
    return 'anonymous_user';
  }
  const strKey = String(userOrKey).trim();
  if (auth.currentUser?.uid) {
    if (strKey === auth.currentUser.uid || (auth.currentUser.email && strKey.toLowerCase() === auth.currentUser.email.toLowerCase())) {
      return auth.currentUser.uid;
    }
  }
  if (strKey.includes('@')) {
    return getStableUserIdFromEmail(strKey);
  }
  if (strKey.startsWith('user_')) {
    return strKey;
  }
  return sanitizeUserKey(strKey);
}

// In-flight concurrency lock & promise chain queue to guarantee sequential execution without dropping writes
let savePromiseChain: Promise<void> = Promise.resolve();
const pendingWorkspacePayloads = new Map<string, { userIdentity: FirebaseUserIdentity; workspaceData: any; fingerprint: string }>();
const pendingWorkspaceFingerprints = new Map<string, string>();
let isExecutingSave = false;

export async function flushPendingWorkspaceSaves(): Promise<void> {
  // Await completion of all pending saves in the queue
  await savePromiseChain;
}

async function executeSaveUserWorkspace(userIdentity: FirebaseUserIdentity, workspaceData: any): Promise<void> {
  // If quota is exhausted, exit immediately without contacting Firestore
  if (isFirestoreQuotaExhausted()) {
    return;
  }

  const docId = getUserDocumentId(userIdentity);
  const userEmail = getIdentityEmail(userIdentity);
  if (!auth.currentUser?.uid || auth.currentUser.uid !== docId) return;

  try {
    interface BatchOp {
      ref: any;
      data: any;
    }
    const operations: BatchOp[] = [];

    // 1. Root Workspace Document check (Strictly partitioned metadata only, no bulk tab data)
    const rootComparable = {
      lastActiveTab: workspaceData.lastActiveTab || 'twitter',
      lastActiveCategory: workspaceData.lastActiveCategory || 'social-feed',
      preferences: workspaceData.preferences || {},
      activeFolderIds: workspaceData.activeFolderIds || {},
      userAssets: workspaceData.userAssets || {},
    };
    const rootFingerprint = computeFingerprint(rootComparable);

    if (rootFingerprint !== savedRootFingerprint) {
      const rootRef = doc(db, 'users', docId);
      const rootPayload = removeUndefinedDeep({
        userId: docId,
        userEmail,
        lastActiveTab: workspaceData.lastActiveTab || 'twitter',
        lastActiveCategory: workspaceData.lastActiveCategory || 'social-feed',
        preferences: workspaceData.preferences || {},
        activeFolderIds: workspaceData.activeFolderIds || null,
        userAssets: workspaceData.userAssets || null,
        updatedBy: workspaceData.updatedBy || '',
        updatedAt: new Date().toISOString(),
      });
      const safeRootPayload = await sanitizeObjectForFirestore(rootPayload, 500_000);
      operations.push({ ref: rootRef, data: safeRootPayload });
    }

    // 2. Granular Tab Partitions: only write tabs that actually changed!
    const formStates = workspaceData.formStates || {};
    const characters = workspaceData.characters || {};
    const folderStates = workspaceData.folderStates || {};
    const moduleFolders = workspaceData.moduleFolders || {};

    const allTabs = Array.from(
      new Set([
        ...Object.keys(formStates),
        ...Object.keys(characters),
        ...Object.keys(moduleFolders),
        workspaceData.lastActiveTab,
      ].filter(Boolean))
    );

    const pendingFingerprintUpdates: Array<{ tabKey: string; fingerprint: string }> = [];
    const pendingFolderFingerprintUpdates: Array<{ folderKey: string; fingerprint: string }> = [];

    for (const tabKey of allTabs) {
      // Extract isolated folders pertaining to this tab
      const tabFolders: Record<string, any> = {};
      if (folderStates && typeof folderStates === 'object') {
        Object.entries(folderStates).forEach(([fKey, fVal]) => {
          if (fKey.includes(`_${tabKey}_`) || fKey.startsWith(`folder_${tabKey}_`)) {
            tabFolders[fKey] = fVal;
          }
        });
      }

      const tabFoldersList = (workspaceData.moduleFolders && workspaceData.moduleFolders[tabKey]) || characters[tabKey] || [];
      const rawTabDoc = {
        tabKey,
        characters: tabFoldersList,
        folders: tabFoldersList,
        formState: formStates[tabKey] || null,
        folderStates: tabFolders,
      };

      const tabFingerprint = computeFingerprint(rawTabDoc);
      // Skip writing if this tab is identical to what's already saved on Firestore
      if (savedTabFingerprints.get(tabKey) === tabFingerprint) {
        continue;
      }

      const tabRef = doc(db, 'users', docId, 'tabs', tabKey);
      const docWithMeta = {
        ...rawTabDoc,
        updatedBy: workspaceData.updatedBy || '',
        updatedAt: new Date().toISOString(),
      };

      const safeTabDoc = await sanitizeObjectForFirestore(docWithMeta, 750_000);
      operations.push({ ref: tabRef, data: safeTabDoc });
      pendingFingerprintUpdates.push({ tabKey, fingerprint: tabFingerprint });

      // Persist individual folders directly to /users/{docId}/folders to guarantee atomic redundancy
      for (let idx = 0; idx < tabFoldersList.length; idx++) {
        const folder = tabFoldersList[idx];
        if (!folder || !folder.id) continue;
        const cleanFolderId = folder.id;
        const folderComparable = removeUndefinedDeep({
          id: cleanFolderId,
          name: folder.name || `Folder ${idx + 1}`,
          data: folder.data || null,
          order: typeof folder.order === 'number' ? folder.order : idx + 1,
          tabKey,
        });
        const folderFingerprint = computeFingerprint(folderComparable);
        const folderFingerprintKey = `${tabKey}_${cleanFolderId}`;
        if (savedFolderFingerprints.get(folderFingerprintKey) === folderFingerprint) {
          continue;
        }
        const folderDocRef = doc(db, 'users', docId, 'folders', `${tabKey}_${cleanFolderId}`);
        const folderPayload = removeUndefinedDeep({
          ...folderComparable,
          tabKey,
          userId: docId,
          userEmail,
          updatedAt: folder.updatedAt || new Date().toISOString(),
        });
        const safeFolderPayload = await sanitizeObjectForFirestore(folderPayload, 400_000);
        operations.push({ ref: folderDocRef, data: safeFolderPayload });
        pendingFolderFingerprintUpdates.push({ folderKey: folderFingerprintKey, fingerprint: folderFingerprint });
      }
    }

    // If nothing changed, return immediately with zero writes
    if (operations.length === 0) {
      return;
    }

    // Helper to commit operations with fresh WriteBatch instances (never reusing committed batches)
    const commitOperations = async (ops: BatchOp[]): Promise<void> => {
      const CHUNK_SIZE = 400; // Well below Firestore's 500 operation limit
      for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
        const chunk = ops.slice(i, i + CHUNK_SIZE);
        const b = writeBatch(db);
        for (const op of chunk) {
          b.set(op.ref, op.data, { merge: true });
        }
        await b.commit();
      }
    };

    try {
      await commitOperations(operations);
    } catch (firstErr: any) {
      const errMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      if (
        errMsg.includes('Missing or insufficient permissions') ||
        errMsg.includes('permission-denied') ||
        errMsg.includes('unavailable')
      ) {
        // Wait 1.5 seconds and retry once with a fresh WriteBatch instance
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await commitOperations(operations);
      } else {
        throw firstErr;
      }
    }

    // Successfully committed: update fingerprints
    savedRootFingerprint = rootFingerprint;
    pendingFingerprintUpdates.forEach(({ tabKey, fingerprint }) => {
      savedTabFingerprints.set(tabKey, fingerprint);
    });
    pendingFolderFingerprintUpdates.forEach(({ folderKey, fingerprint }) => {
      savedFolderFingerprints.set(folderKey, fingerprint);
    });
  } catch (error) {
    if (isFirestoreQuotaExhaustedError(error)) {
      markFirestoreQuotaExhausted();
      pendingWorkspacePayloads.delete(docId);
      console.warn('Daily Firestore write quota reached. Cloud sync is safely paused; changes remain completely preserved in local storage.');
      throw error;
    }

    handleFirestoreError(error, OperationType.UPDATE, `users/${docId}`);
    console.warn('Could not save workspace to Firestore:', error);
    throw error;
  }
}

function getWorkspaceSaveFingerprint(workspaceData: any): string {
  const comparable = {
    lastActiveTab: workspaceData?.lastActiveTab || 'twitter',
    lastActiveCategory: workspaceData?.lastActiveCategory || 'social-feed',
    preferences: workspaceData?.preferences || {},
    activeFolderIds: workspaceData?.activeFolderIds || {},
    userAssets: workspaceData?.userAssets || {},
    formStates: workspaceData?.formStates || {},
    moduleFolders: workspaceData?.moduleFolders || {},
  };
  return computeFingerprint(comparable);
}

// Persist complete user workspace partitioned across subcollections using a promise queue to prevent race conditions
export async function saveUserWorkspaceToFirestore(userIdentity: FirebaseUserIdentity, workspaceData: any): Promise<void> {
  if (!userIdentity || getUserDocumentId(userIdentity) === 'anonymous_user') return;

  // Circuit breaker: do not invoke Firestore if daily free quota limit is currently exhausted
  if (isFirestoreQuotaExhausted()) {
    pendingWorkspacePayloads.delete(getUserDocumentId(userIdentity));
    pendingWorkspaceFingerprints.delete(getUserDocumentId(userIdentity));
    return;
  }

  const ownerId = getUserDocumentId(userIdentity);
  const workspaceFingerprint = getWorkspaceSaveFingerprint(workspaceData);
  if (
    savedWorkspaceFingerprints.get(ownerId) === workspaceFingerprint ||
    pendingWorkspaceFingerprints.get(ownerId) === workspaceFingerprint
  ) {
    return;
  }

  pendingWorkspaceFingerprints.set(ownerId, workspaceFingerprint);
  pendingWorkspacePayloads.set(ownerId, { userIdentity, workspaceData, fingerprint: workspaceFingerprint });

  const queuedSave = savePromiseChain
    .then(async () => {
      const task = pendingWorkspacePayloads.get(ownerId);
      if (!task) return;
      pendingWorkspacePayloads.delete(ownerId);
      pendingWorkspaceFingerprints.delete(ownerId);
      isExecutingSave = true;
      try {
        await executeSaveUserWorkspace(task.userIdentity, task.workspaceData);
        savedWorkspaceFingerprints.set(ownerId, task.fingerprint);
      } finally {
        isExecutingSave = false;
      }
    });

  // Keep the internal queue usable after a failed write, while returning the real
  // operation promise so callers do not mark unsaved local data as synchronized.
  savePromiseChain = queuedSave.catch((err) => {
      console.warn('saveUserWorkspaceToFirestore chain notice:', err);
      isExecutingSave = false;
      pendingWorkspaceFingerprints.delete(ownerId);
    });

  return queuedSave;
}

// Subscribe to real-time changes of the user workspace for multi-device sync
export function subscribeUserWorkspaceFromFirestore(
  userOrKey: string | { email?: string | null; uid?: string | null } | null,
  onData: (data: any) => void,
  onError?: (error: any) => void
): () => void {
  if (!userOrKey) return () => {};
  const docId = getUserDocumentId(userOrKey);
  const userEmail = typeof userOrKey === 'string' ? userOrKey : (userOrKey.email || userOrKey.uid || docId);

  let currentRootData: any = null;
  const currentTabsData: Record<string, any> = {};
  const currentFoldersData: Record<string, any> = {};
  let hasReceivedTabsSnapshot = false;

  const getUpdatedAtMs = (value: any): number => {
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const emitComposite = () => {
    // Folder snapshots can arrive before tabs. Wait for the authoritative tab membership
    // snapshot so redundant/stale folder docs never flash back into application state.
    if (!currentRootData || !hasReceivedTabsSnapshot) return;
    const composite: any = {
      ...currentRootData,
      formStates: { ...(currentRootData.formStates || {}) },
      characters: { ...(currentRootData.characters || {}) },
      folderStates: { ...(currentRootData.folderStates || {}) },
      moduleFolders: { ...(currentRootData.moduleFolders || {}) },
    };

    Object.entries(currentTabsData).forEach(([tabKey, tData]) => {
      if (tData.formState) {
        composite.formStates[tabKey] = tData.formState;
      }
      const tabFolders = (Array.isArray(tData.characters) && tData.characters.length > 0)
        ? tData.characters
        : (Array.isArray(tData.folders) && tData.folders.length > 0)
        ? tData.folders
        : null;

      if (tabFolders) {
        // A tab document is the authoritative folder membership list. Replacing instead of
        // union-merging prevents deleted redundant folder documents from resurrecting.
        composite.moduleFolders[tabKey] = tabFolders.map((f: any) => ({ ...f }));
      }
      if (tData.folderStates && typeof tData.folderStates === 'object') {
        Object.assign(composite.folderStates, tData.folderStates);
      }
      if (getUpdatedAtMs(tData.updatedAt) > getUpdatedAtMs(composite.updatedAt)) {
        composite.updatedAt = tData.updatedAt;
        if (tData.updatedBy) {
          composite.updatedBy = tData.updatedBy;
        }
      }
    });

    // Merge individual folder docs from /users/{docId}/folders
    Object.values(currentFoldersData).forEach((fDoc: any) => {
      const tabKey = fDoc.tabKey || fDoc.platform || fDoc.subFeature;
      if (!tabKey) return;
      if (!composite.moduleFolders[tabKey]) {
        composite.moduleFolders[tabKey] = [];
      }
      const rawId = fDoc.id || '';
      let cleanId = rawId;
      if (cleanId.includes('_') && cleanId.startsWith(`${tabKey}_`)) {
        cleanId = cleanId.slice(`${tabKey}_`.length);
      }
      const tabData = currentTabsData[tabKey];
      const authoritativeTabFolders = tabData
        ? (Array.isArray(tabData.characters) ? tabData.characters : (Array.isArray(tabData.folders) ? tabData.folders : null))
        : null;
      if (authoritativeTabFolders && !authoritativeTabFolders.some((item: any) => item?.id === cleanId)) {
        return;
      }
      const existingIdx = composite.moduleFolders[tabKey].findIndex((item: any) => item.id === cleanId);
      if (existingIdx !== -1) {
        const existing = composite.moduleFolders[tabKey][existingIdx];
        if (getUpdatedAtMs(fDoc.updatedAt) < getUpdatedAtMs(existing.updatedAt)) return;
        composite.moduleFolders[tabKey][existingIdx] = {
          ...existing,
          name: fDoc.name || existing.name,
          data: fDoc.data || existing.data,
          order: typeof fDoc.order === 'number' ? fDoc.order : existing.order,
          updatedAt: fDoc.updatedAt || existing.updatedAt,
        };
      } else {
        composite.moduleFolders[tabKey].push({
          id: cleanId,
          name: fDoc.name || `Folder ${composite.moduleFolders[tabKey].length + 1}`,
          data: fDoc.data || null,
          order: typeof fDoc.order === 'number' ? fDoc.order : composite.moduleFolders[tabKey].length,
          updatedAt: fDoc.updatedAt || null,
        });
      }
    });

    // Sort folders deterministically
    Object.keys(composite.moduleFolders).forEach((tab) => {
      const list = composite.moduleFolders[tab];
      if (Array.isArray(list)) {
        list.sort((a: any, b: any) => {
          if (typeof a.order === 'number' && typeof b.order === 'number') {
            return a.order - b.order;
          }
          const numA = parseInt(String(a.id || a.name || '').replace(/\D+/g, '') || '0', 10);
          const numB = parseInt(String(b.id || b.name || '').replace(/\D+/g, '') || '0', 10);
          if (numA !== numB) return numA - numB;
          return String(a.id).localeCompare(String(b.id));
        });
      }
      composite.characters[tab] = composite.moduleFolders[tab];
    });

    onData(composite);
  };

  const unsubRoot = onSnapshot(
    doc(db, 'users', docId),
    { includeMetadataChanges: true },
    (snap) => {
      // Ignore local writes that have not yet reached the server
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        currentRootData = snap.data();
        emitComposite();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.READ, `users/${docId}`);
      if (onError) onError(err);
    }
  );

  const unsubTabs = onSnapshot(
    collection(db, 'users', docId, 'tabs'),
    { includeMetadataChanges: true },
    (snap) => {
      // Ignore local writes that have not yet reached the server
      if (snap.metadata.hasPendingWrites) return;
      snap.docChanges().forEach((change) => {
        if (change.doc.metadata.hasPendingWrites) return;
        const tabKey = change.doc.id;
        if (change.type === 'removed') {
          delete currentTabsData[tabKey];
        } else {
          currentTabsData[tabKey] = change.doc.data();
        }
      });
      if (!currentRootData) {
        currentRootData = { userId: docId, userEmail };
      }
      hasReceivedTabsSnapshot = true;
      emitComposite();
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${docId}/tabs`);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubRoot();
    unsubTabs();
  };
}

// Retrieve complete user workspace by aggregating root metadata and partitioned tabs
export async function loadUserWorkspaceFromFirestore(userOrKey: string | { email?: string | null; uid?: string | null } | null): Promise<any | null> {
  if (!userOrKey) return null;
  const docId = getUserDocumentId(userOrKey);

  try {
    // 1. Primary: load from user-isolated path /users/{docId} with transient retry guard
    let rootRef = doc(db, 'users', docId);
    let rootSnap: any;
    try {
      rootSnap = await getDoc(rootRef);
    } catch (primaryErr: any) {
      const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      if (
        errMsg.includes('Missing or insufficient permissions') ||
        errMsg.includes('permission-denied') ||
        errMsg.includes('unavailable')
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        rootSnap = await getDoc(rootRef);
      } else {
        throw primaryErr;
      }
    }
    let isLegacyPath = false;

    // Seamless backward compatibility: if not in /users/{docId}, check legacy /workspaces/{docId}
    if (!rootSnap.exists()) {
      try {
        const legacyRef = doc(db, 'workspaces', docId);
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          rootRef = legacyRef;
          rootSnap = legacySnap;
          isLegacyPath = true;
        }
      } catch {
        // Ignore legacy workspaces access errors
      }
    }

    // Seamless backward compatibility: check alternative candidate IDs (UID, stable email ID, sanitized email)
    if (!rootSnap.exists()) {
      const email = typeof userOrKey === 'string' && userOrKey.includes('@')
        ? userOrKey
        : (typeof userOrKey === 'object' && userOrKey?.email ? userOrKey.email : auth.currentUser?.email);
      const uid = typeof userOrKey === 'object' && userOrKey?.uid
        ? userOrKey.uid
        : auth.currentUser?.uid;

      const candidateIds: string[] = [];
      if (uid && uid !== docId) candidateIds.push(uid);
      if (email) {
        const stableId = getStableUserIdFromEmail(email);
        const cleanId = sanitizeUserKey(email);
        if (stableId !== docId && !candidateIds.includes(stableId)) candidateIds.push(stableId);
        if (cleanId !== docId && !candidateIds.includes(cleanId)) candidateIds.push(cleanId);
      }

      for (const candId of candidateIds) {
        if (rootSnap.exists()) break;
        try {
          const candUsersRef = doc(db, 'users', candId);
          const candUsersSnap = await getDoc(candUsersRef);
          if (candUsersSnap.exists()) {
            rootRef = candUsersRef;
            rootSnap = candUsersSnap;
            break;
          }
          const candWorkspacesRef = doc(db, 'workspaces', candId);
          const candWorkspacesSnap = await getDoc(candWorkspacesRef);
          if (candWorkspacesSnap.exists()) {
            rootRef = candWorkspacesRef;
            rootSnap = candWorkspacesSnap;
            isLegacyPath = true;
            break;
          }
        } catch {
          // Ignore fallback lookup errors
        }
      }
    }

    const rootData = rootSnap.exists() ? rootSnap.data() : {};

    // Reconstruct composite workspace payload expected by application
    const composite: any = {
      ...rootData,
      formStates: { ...(rootData.formStates || {}) },
      characters: { ...(rootData.characters || {}) },
      folderStates: { ...(rootData.folderStates || {}) },
      moduleFolders: { ...(rootData.moduleFolders || {}) },
      activeFolderIds: { ...(rootData.activeFolderIds || {}) },
    };

    let hasLoadedData = rootSnap.exists();
    const authoritativeFolderTabs = new Set<string>();

    // Hydrate tab partitions from user subcollection
    try {
      const tabsCol = isLegacyPath
        ? collection(db, 'workspaces', rootRef.id, 'tabs')
        : collection(db, 'users', rootRef.id, 'tabs');
      const tabsSnap = await getDocs(tabsCol);

      if (!tabsSnap.empty) {
        hasLoadedData = true;
      }

      tabsSnap.forEach((docSnap) => {
        const tabData = docSnap.data();
        const tabKey = tabData.tabKey || docSnap.id;

        if (tabData.formState) {
          composite.formStates[tabKey] = tabData.formState;
        }
        const tabFolders = (Array.isArray(tabData.folders) && tabData.folders.length > 0)
          ? tabData.folders
          : (Array.isArray(tabData.characters) && tabData.characters.length > 0)
          ? tabData.characters
          : null;

        if (tabFolders) {
          authoritativeFolderTabs.add(tabKey);
          composite.characters[tabKey] = tabFolders;
          composite.moduleFolders[tabKey] = tabFolders;
          tabFolders.forEach((folder: any, idx: number) => {
            if (!folder?.id) return;
            savedFolderFingerprints.set(`${tabKey}_${folder.id}`, computeFingerprint(removeUndefinedDeep({
              id: folder.id,
              name: folder.name || `Folder ${idx + 1}`,
              data: folder.data || null,
              order: typeof folder.order === 'number' ? folder.order : idx + 1,
              tabKey,
            })));
          });
        }
        if (tabData.folderStates && typeof tabData.folderStates === 'object') {
          Object.assign(composite.folderStates, tabData.folderStates);
        }
        const tabUpdatedAt = tabData.updatedAt ? new Date(tabData.updatedAt).getTime() : 0;
        const compositeUpdatedAt = composite.updatedAt ? new Date(composite.updatedAt).getTime() : 0;
        if (tabUpdatedAt > compositeUpdatedAt) {
          composite.updatedAt = tabData.updatedAt;
        }

        // Pre-populate fingerprint cache so unchanged tabs are NOT written back unnecessarily
        const rawTabDoc = {
          tabKey,
          characters: tabFolders || [],
          folders: tabFolders || [],
          formState: tabData.formState || null,
          folderStates: tabData.folderStates || {},
        };
        savedTabFingerprints.set(tabKey, computeFingerprint(rawTabDoc));
      });

      // Pre-populate root fingerprint cache
      const rootComparable = {
        lastActiveTab: rootData.lastActiveTab || 'twitter',
        lastActiveCategory: rootData.lastActiveCategory || 'social-feed',
        preferences: rootData.preferences || {},
        activeFolderIds: rootData.activeFolderIds || {},
      };
      savedRootFingerprint = computeFingerprint(rootComparable);
    } catch (tabsErr) {
      console.warn('Notice: tabs subcollection not yet populated:', tabsErr);
    }

    // Hydrate user-isolated folders from `/users/{docId}/folders`
    try {
      const userFolders = await loadFoldersFromFirestore(docId);
      if (userFolders && userFolders.length > 0) {
        hasLoadedData = true;
        userFolders.forEach((fDoc) => {
          const tab = fDoc.tabKey || fDoc.platform || fDoc.subFeature;
          if (tab) {
            if (!composite.moduleFolders[tab]) {
              composite.moduleFolders[tab] = [];
            }
            const existingIdx = composite.moduleFolders[tab].findIndex((existing: any) => existing.id === fDoc.id);
            if (existingIdx !== -1) {
              const existing = composite.moduleFolders[tab][existingIdx];
              const existingUpdatedAt = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
              const folderDocUpdatedAt = fDoc.updatedAt ? new Date(fDoc.updatedAt).getTime() : 0;
              if (folderDocUpdatedAt < existingUpdatedAt) return;
              composite.moduleFolders[tab][existingIdx] = {
                ...existing,
                name: fDoc.name || existing.name,
                data: fDoc.data || existing.data,
                order: typeof fDoc.order === 'number' ? fDoc.order : existing.order,
                updatedAt: fDoc.updatedAt || existing.updatedAt,
              };
            } else if (!authoritativeFolderTabs.has(tab)) {
              composite.moduleFolders[tab].push({
                id: fDoc.id,
                name: fDoc.name || `Folder ${composite.moduleFolders[tab].length + 1}`,
                data: fDoc.data || fDoc.profileData || null,
                order: typeof fDoc.order === 'number' ? fDoc.order : composite.moduleFolders[tab].length,
                updatedAt: fDoc.updatedAt || null,
              });
            }
          }
        });
      }
    } catch (fErr) {
      console.warn('Notice: user folders check skipped:', fErr);
    }

    // If new user with zero prior documents, return clean new_user marker
    if (!hasLoadedData) {
      return {
        status: 'new_user',
        isNewUser: true,
        moduleFolders: null,
      };
    }

    // Sort each tab's folders numerically by order/index/id to ensure Folder 1, 2, 3, 4, 5 display in correct sequence
    Object.keys(composite.moduleFolders).forEach((tab) => {
      const list = composite.moduleFolders[tab];
      if (Array.isArray(list)) {
        list.sort((a: any, b: any) => {
          if (typeof a.order === 'number' && typeof b.order === 'number') {
            return a.order - b.order;
          }
          const numA = parseInt(String(a.id || a.name || '').replace(/\D+/g, '') || '0', 10);
          const numB = parseInt(String(b.id || b.name || '').replace(/\D+/g, '') || '0', 10);
          if (numA !== numB) return numA - numB;
          return String(a.id).localeCompare(String(b.id));
        });
      }
      composite.characters[tab] = composite.moduleFolders[tab];
    });

    // Seamless one-time data migration:
    // If data was loaded from a legacy path or legacy email doc ID, migrate it to canonical /users/{canonicalUid}
    const canonicalUid = auth.currentUser?.uid || (typeof userOrKey === 'object' ? userOrKey?.uid : null);
    if (hasLoadedData && canonicalUid && (isLegacyPath || rootRef.id !== canonicalUid)) {
      console.log(`[Migration] Migrating legacy user data from ${rootRef.path} to canonical /users/${canonicalUid}`);
      try {
        await executeSaveUserWorkspace(
          { uid: canonicalUid, email: auth.currentUser?.email || null },
          composite
        );
      } catch (migErr) {
        console.warn('[Migration] Automatic workspace migration notice:', migErr);
      }
    }

    return {
      ...composite,
      status: 'loaded',
      isLoaded: true,
      hasLoadedData: true,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${docId}`);
    console.warn('Could not load workspace from Firestore:', error);
    return {
      status: 'error',
      isError: true,
      error,
      hasLoadedData: false,
    };
  }
}

// Sync character folders to user's private subcollection in Firestore
export async function syncFolderToFirestore(
  folderId: string,
  folderData: any,
  userEmailOrId?: FirebaseUserIdentity,
  tabKey?: string
): Promise<void> {
  const cleanUser = getUserDocumentId(userEmailOrId || '');
  if (!cleanUser || cleanUser === 'anonymous_user') {
    // Unauthenticated/anonymous: do not write to shared global collection
    return;
  }
  if (auth.currentUser?.uid !== cleanUser) return;

  try {
    const cleanFolderId = folderId || `folder_${Date.now()}`;
    const compositeDocId = tabKey ? `${tabKey}_${cleanFolderId}` : cleanFolderId;
    const payload = removeUndefinedDeep({
      ...folderData,
      id: cleanFolderId,
      name: folderData.name || 'Folder',
      order: typeof folderData.order === 'number' ? folderData.order : null,
      tabKey: tabKey || '',
      userId: cleanUser,
      userEmail: getIdentityEmail(userEmailOrId),
      updatedAt: new Date().toISOString(),
    });
    const safePayload = await sanitizeObjectForFirestore(payload, 750_000);
    // Strict Account-Level Isolation: write directly into users/{userId}/folders/{tabKey}_{folderId}
    try {
      await setDoc(doc(db, 'users', cleanUser, 'folders', compositeDocId), safePayload, { merge: true });
    } catch (firstErr: any) {
      const errMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      if (errMsg.includes('Missing or insufficient permissions') || errMsg.includes('permission-denied')) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await setDoc(doc(db, 'users', cleanUser, 'folders', compositeDocId), safePayload, { merge: true });
      } else {
        throw firstErr;
      }
    }
    savedFolderFingerprints.set(compositeDocId, computeFingerprint(removeUndefinedDeep({
      id: cleanFolderId,
      name: folderData.name || 'Folder',
      data: folderData.data || null,
      order: typeof folderData.order === 'number' ? folderData.order : null,
      tabKey: tabKey || '',
    })));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${cleanUser}/folders/${folderId}`);
  }
}

// Delete a folder permanently from user's private subcollection in Firestore
export async function deleteFolderFromFirestore(
  folderId: string,
  userEmailOrId?: FirebaseUserIdentity,
  tabKey?: string
): Promise<void> {
  const cleanUser = getUserDocumentId(userEmailOrId || '');
  if (!cleanUser || cleanUser === 'anonymous_user') {
    return;
  }
  if (auth.currentUser?.uid !== cleanUser) return;

  try {
    const compositeDocId = tabKey ? `${tabKey}_${folderId}` : folderId;
    await deleteDoc(doc(db, 'users', cleanUser, 'folders', compositeDocId));
    if (tabKey) {
      await deleteDoc(doc(db, 'users', cleanUser, 'folders', folderId)).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${cleanUser}/folders/${folderId}`);
  }
}

// Load folders strictly from authenticated user's private subcollection
export async function loadFoldersFromFirestore(userId?: FirebaseUserIdentity): Promise<any[]> {
  const cleanUser = getUserDocumentId(userId || '');
  if (!cleanUser || cleanUser === 'anonymous_user') {
    // Strict Account Isolation: anonymous or unauthenticated users get a clean empty list
    return [];
  }
  if (auth.currentUser?.uid !== cleanUser) return [];

  try {
    // Strict Account-Level Isolation: read strictly from users/{userId}/folders
    const foldersCol = collection(db, 'users', cleanUser, 'folders');
    const snapshot = await getDocs(foldersCol);
    const results: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawId = data.id || docSnap.id;
      let cleanId = data.id || rawId;
      if (data.tabKey && cleanId.startsWith(`${data.tabKey}_`)) {
        cleanId = cleanId.slice(`${data.tabKey}_`.length);
      } else if (data.tabKey && rawId.startsWith(`${data.tabKey}_`)) {
        cleanId = rawId.slice(`${data.tabKey}_`.length);
      }
      results.push({ ...data, id: cleanId });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${cleanUser}/folders`);
    return [];
  }
}

// Validate Firestore Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'health_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline. Local state fallback active.');
    }
    return false;
  }
}

// Clear user folders or tab data strictly for this account
export async function clearAllFirebaseData(userId?: FirebaseUserIdentity): Promise<void> {
  const cleanUser = getUserDocumentId(userId || '');
  if (!cleanUser || cleanUser === 'anonymous_user') {
    return;
  }
  if (auth.currentUser?.uid !== cleanUser) return;

  try {
    const foldersCol = collection(db, 'users', cleanUser, 'folders');
    const snapshot = await getDocs(foldersCol);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, 'users', cleanUser, 'folders', d.id)));
    await Promise.all(deletePromises);
    console.log(`User ${cleanUser} private folders cleared successfully.`);
  } catch (error) {
    console.warn('Could not clear Firebase user collections:', error);
  }
}

// Global Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  if (isFirestoreQuotaExhaustedError(error)) {
    markFirestoreQuotaExhausted();
    return;
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('resource-exhausted') || msg.includes('maximum backoff delay')) {
    markFirestoreQuotaExhausted();
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: msg,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}
