import assert from 'node:assert/strict';
import { build } from 'esbuild';

globalThis.trafficTest = { writes: [], reads: 0, listeners: [], auth: { currentUser: { uid: 'buyer-uid', email: 'buyer@example.com' } } };
const storage = new Map();
globalThis.localStorage = globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};

const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    export { saveUserWorkspaceToFirestore, subscribeUserWorkspaceFromFirestore, clearWorkspaceFingerprintCache, loadUserWorkspaceFromFirestore } from './src/firebase';
    export { useWorkspaceFolders } from './src/features/workspace/hooks/useWorkspaceFolders';
  ` },
  bundle: true, write: false, format: 'esm', platform: 'node',
  define: { 'import.meta.env': JSON.stringify({ VITE_FIREBASE_PROJECT_ID: 'test', VITE_FIREBASE_API_KEY: 'test' }) },
  plugins: [{ name: 'workspace-io', setup(builder) {
    builder.onResolve({ filter: /^firebase\// }, args => ({ path: args.path, namespace: 'mock' }));
    builder.onResolve({ filter: /utils\/(imageManager|imageCompressor)$/ }, args => ({ path: args.path, namespace: 'mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => {
      if (path === 'firebase/app') return { contents: `export const initializeApp = () => ({}), getApps = () => [], getApp = () => ({});` };
      if (path === 'firebase/auth') return { contents: `
        export const getAuth = () => globalThis.trafficTest.auth;
        export class GoogleAuthProvider { setCustomParameters() {} }
        export const signInWithPopup = () => {}, signInWithEmailAndPassword = () => {}, createUserWithEmailAndPassword = () => {},
          sendPasswordResetEmail = () => {}, updatePassword = () => {}, updateProfile = () => {}, deleteUser = () => {},
          signOut = () => {}, onAuthStateChanged = () => () => {};
      ` };
      if (path.endsWith('imageManager')) return { contents: `export const replaceTransientImageUrlsDeep = value => value;` };
      if (path.endsWith('imageCompressor')) return { contents: `export const ensureDataUrlUnderSize = async value => value;` };
      return { contents: `
        export const getFirestore = () => ({}), setLogLevel = () => {};
        export const doc = (...args) => globalThis.trafficTest.structuredRefs
          ? { id: args.at(-1), path: args.slice(1).join('/') } : args.slice(1).join('/');
        export const collection = (...args) => args.slice(1).join('/');
        export const getDoc = async () => { globalThis.trafficTest.reads++; return { exists: () => !!globalThis.trafficTest.rootData, data: () => globalThis.trafficTest.rootData }; }, getDocFromServer = getDoc;
        export const getDocs = async ref => {
          globalThis.trafficTest.reads++;
          const docs = ref.endsWith('/tabs') ? (globalThis.trafficTest.tabDocs || []) : [];
          return { empty: !docs.length, forEach: callback => docs.forEach(callback) };
        };
        export const setDoc = async (ref, data) => globalThis.trafficTest.writes.push({ ref, data }), deleteDoc = async () => {};
        export function onSnapshot(ref, options, callback) {
          globalThis.trafficTest.listeners.push({ ref, callback }); return () => {};
        }
        export function writeBatch() {
          const ops = []; return { set: (ref, data) => ops.push({ ref, data }), commit: async () => { globalThis.trafficTest.writes.push(...ops); } };
        }
      ` };
    });
  } }],
});
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
assert.equal(trafficTest.reads, 0, 'Importing Firebase must not make a connection-probe read');

let folders = { twitter: [{ id: 'folder-1', name: 'Folder 1', order: 1, data: { text: 'hello' } }] };
const folderRef = { current: folders };
const editedRef = { current: false };
let syncs = 0;
const hook = api.useWorkspaceFolders({
  activeTab: 'twitter', userAccountKey: 'buyer-uid', moduleFolders: folders, activeFolderIds: { twitter: 'folder-1' },
  moduleFoldersRef: folderRef, activeFolderIdsRef: { current: { twitter: 'folder-1' } },
  hasLocalUserEditsInSessionRef: editedRef,
  setModuleFolders: update => { folders = update(folders); }, setActiveFolderIds: () => {},
  getCurrentTabFormData: () => ({}), loadTabFormData: () => {},
  triggerCloudWorkspaceSync: () => { syncs++; }, forceCloudWorkspaceSyncNow: async () => {},
});
hook.updateActiveFolderData('twitter', { text: 'hello' });
assert.equal(syncs, 0);
assert.equal(editedRef.current, false);
hook.updateActiveFolderData('twitter', { text: 'changed' });
assert.equal(syncs, 1);
assert.equal(folders.twitter, folderRef.current.twitter, 'React state and synchronous refs must use the same folder timestamp');
hook.updateActiveFolderData('twitter', { text: 'changed' });
assert.equal(syncs, 1, 'Repeated identical form events must not schedule another save');

const payload = (twitter, notes) => ({
  lastActiveTab: 'twitter', lastActiveCategory: 'social-feed', preferences: {}, activeFolderIds: {}, userAssets: {},
  formStates: { twitter: { text: twitter }, notes: { text: notes } },
  moduleFolders: {
    twitter: [{ id: 'folder-1', name: 'Folder 1', order: 1, data: { text: twitter } }],
    notes: [{ id: 'folder-1', name: 'Folder 1', order: 1, data: { text: notes } }],
  },
});
const first = payload('hello', 'local');
await api.saveUserWorkspaceToFirestore('buyer-uid', first);
assert.equal(trafficTest.writes.length, 5, 'Initial save: root, two tabs, two folders');
await api.saveUserWorkspaceToFirestore('buyer-uid', first);
assert.equal(trafficTest.writes.length, 5, 'Idle or unchanged save must write zero documents');
await api.saveUserWorkspaceToFirestore('buyer-uid', payload('edited', 'local'));
assert.equal(trafficTest.writes.length, 7, 'One folder edit must write only its tab and folder');

const snapshots = [];
api.subscribeUserWorkspaceFromFirestore('buyer-uid', data => snapshots.push(data));
const tabs = trafficTest.listeners.find(item => item.ref.endsWith('/tabs'));
const notesData = { tabKey: 'notes', characters: first.moduleFolders.notes, folders: first.moduleFolders.notes, formState: first.formStates.notes, folderStates: {} };
const emit = (data, fromCache = false, hasPendingWrites = false) => tabs.callback({
  metadata: { fromCache, hasPendingWrites },
  docChanges: () => [{ type: 'modified', doc: { id: 'notes', metadata: { hasPendingWrites }, data: () => data } }],
});
const remote = payload('edited', 'remote');
const remoteData = { ...notesData, characters: remote.moduleFolders.notes, folders: remote.moduleFolders.notes, formState: remote.formStates.notes };
emit(remoteData);
assert.equal(snapshots.length, 0, 'Initial hydration must wait for both root and tab snapshots');
const root = trafficTest.listeners.find(item => item.ref === 'users/buyer-uid');
root.callback({ metadata: { fromCache: false, hasPendingWrites: false }, exists: () => true, data: () => first });
assert.equal(snapshots.length, 1);
assert.equal(snapshots[0].status, 'loaded');
assert.equal(snapshots[0].fromCache, false);
assert.equal(snapshots[0].needsRecovery, false);
await api.saveUserWorkspaceToFirestore('buyer-uid', payload('next edit', 'remote'));
assert.deepEqual(trafficTest.writes.slice(7).map(item => item.ref), ['users/buyer-uid/tabs/twitter', 'users/buyer-uid/folders/twitter_folder-1'], 'Remote tab must not be echoed on the next local edit');

emit(notesData);
await api.saveUserWorkspaceToFirestore('buyer-uid', payload('next edit', 'remote'));
assert.equal(trafficTest.writes.length, 11, 'A remote change must invalidate the old whole-workspace fingerprint so restoring a value still saves');
emit(notesData, true);
emit(notesData, false, true);
await api.saveUserWorkspaceToFirestore('buyer-uid', payload('final edit', 'remote'));
assert.deepEqual(trafficTest.writes.slice(11).map(item => item.ref), ['users/buyer-uid/tabs/twitter', 'users/buyer-uid/folders/twitter_folder-1'], 'Cached or pending snapshots must not replace server-confirmed fingerprints');
emit({ ...notesData, characters: [], folders: [] });
assert.deepEqual(snapshots.at(-1).moduleFolders.notes, [], 'An authoritative empty folder list must replace legacy root folders');
trafficTest.rootData = first;
trafficTest.structuredRefs = true;
trafficTest.tabDocs = [{ id: 'notes', data: () => remoteData }];
const readsBeforeLoad = trafficTest.reads;
const restored = await api.loadUserWorkspaceFromFirestore('buyer-uid');
assert.equal(restored.status, 'loaded');
assert.equal(trafficTest.reads - readsBeforeLoad, 2, 'Explicit refresh of modern workspace must read root and tabs without reading redundant folders');
console.log('PASS workspace traffic: no boot probe, identical edits and idle saves write zero, one edit writes two documents, remote updates avoid echoes, stale cache and pending snapshots are ignored.');
