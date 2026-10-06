import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const context = { effects: [], writes: [], currentUser: { uid: 'BuyerUID', email: 'buyer@icloud.com' } };
globalThis.__workspaceTest = context;

async function loadModule(entryPoint, firebaseSdk = false) {
  const result = await build({
    entryPoints: [entryPoint], bundle: true, write: false, platform: 'node', format: 'cjs',
    define: { 'import.meta.env': JSON.stringify({ VITE_FIREBASE_PROJECT_ID: 'test', VITE_FIREBASE_API_KEY: 'test' }) },
    plugins: [{
      name: 'workspace-test-dependencies',
      setup(builder) {
        builder.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'mock' }));
        if (firebaseSdk) {
          builder.onResolve({ filter: /^firebase\// }, ({ path }) => ({ path, namespace: 'mock' }));
          builder.onResolve({ filter: /\/utils\/image(Manager|Compressor)$/ }, ({ path }) => ({ path, namespace: 'mock' }));
        } else {
          builder.onResolve({ filter: /\/firebase$/ }, () => ({ path: 'firebase', namespace: 'mock' }));
        }
        builder.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => {
          let contents;
          if (path === 'react') contents = `
            export const useCallback = fn => fn;
            export const useRef = current => ({ current });
            export const useEffect = fn => { globalThis.__workspaceTest.effects.push(fn); };`;
          else if (path === 'firebase') contents = `
            const c = globalThis.__workspaceTest;
            export const auth = { get currentUser() { return c.currentUser; } };
            export const isFirestoreQuotaExhausted = () => false;
            export const getStoredAuthUser = () => c.currentUser;
            export const syncFolderToFirestore = async (...args) => c.writes.push(args);
            export const deleteFolderFromFirestore = async () => {};
            export const saveUserWorkspaceToFirestore = (...args) => c.save(...args);`;
          else if (path === 'firebase/app') contents = `
            export const initializeApp = () => ({});
            export const getApps = () => [];
            export const getApp = () => ({});`;
          else if (path === 'firebase/auth') contents = `
            export const getAuth = () => ({ get currentUser() { return globalThis.__workspaceTest.currentUser; } });
            export class GoogleAuthProvider { setCustomParameters() {} }
            export const signInWithPopup = () => {};
            export const signInWithEmailAndPassword = () => {};
            export const createUserWithEmailAndPassword = () => {};
            export const sendPasswordResetEmail = () => {};
            export const updatePassword = () => {};
            export const updateProfile = () => {};
            export const deleteUser = () => {};
            export const signOut = () => {};
            export const onAuthStateChanged = () => {};`;
          else if (path === 'firebase/firestore') contents = `
            export const getFirestore = () => ({});
            export const setLogLevel = () => {};
            export const doc = (_, ...parts) => ({ path: parts.join('/'), id: parts.at(-1) });
            export const collection = doc;
            export const getDocFromServer = async () => ({ exists: () => false });
            export const getDoc = ref => globalThis.__workspaceTest.getDoc(ref);
            export const getDocs = ref => globalThis.__workspaceTest.getDocs(ref);
            export const setDoc = async () => {};
            export const deleteDoc = async () => {};
            export const onSnapshot = () => () => {};
            export const writeBatch = () => {
              const operations = [];
              return { set: (ref, data) => operations.push({ ref: ref.path, data }),
                commit: () => globalThis.__workspaceTest.commit(operations) };
            };`;
          else contents = `
            export const replaceTransientImageUrlsDeep = value => value;
            export const ensureDataUrlUnderSize = async value => value;`;
          return { contents, loader: 'js' };
        });
      },
    }],
  });
  const module = { exports: {} };
  new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
  return module.exports;
}

const storage = await loadModule('src/features/workspace/workspaceStorage.ts');
const foldersModule = await loadModule('src/features/workspace/hooks/useWorkspaceFolders.ts');
const applyModule = await loadModule('src/features/workspace/hooks/useApplyCloudWorkspaceData.ts');
const syncModule = await loadModule('src/features/workspace/hooks/useWorkspaceCloudSync.ts');
const firebaseModule = await loadModule('src/firebase.ts', true);

beforeEach(() => {
  const items = new Map();
  globalThis.localStorage = globalThis.sessionStorage = {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: key => items.delete(key),
  };
  globalThis.window = { localStorage: globalThis.localStorage };
  context.effects = [];
  context.writes = [];
  context.currentUser = { uid: 'BuyerUID', email: 'buyer@icloud.com' };
  context.getDoc = async () => ({ exists: () => true, data: () => ({ userId: 'BuyerUID' }) });
  context.getDocs = async () => ({ docs: [], empty: true, forEach: () => {} });
  firebaseModule.clearWorkspaceFingerprintCache();
});

test('adding a folder persists before React processes state updates, and rapid switching keeps both folders', async () => {
  const original = { id: 'folder-1', name: 'My character', data: { text: 'saved' }, order: 1 };
  const moduleFoldersRef = { current: { twitter: [original] } };
  const activeFolderIdsRef = { current: { twitter: original.id } };
  let currentData = { text: 'edited' };
  const handlers = foldersModule.useWorkspaceFolders({
    activeTab: 'twitter', userAccountKey: 'BuyerUID', authUserUid: 'BuyerUID',
    moduleFolders: { twitter: [original] }, activeFolderIds: { twitter: original.id },
    moduleFoldersRef, activeFolderIdsRef, hasLocalUserEditsInSessionRef: { current: false },
    setModuleFolders: () => {}, setActiveFolderIds: () => {},
    getCurrentTabFormData: () => currentData, loadTabFormData: (_, data) => { currentData = data; },
    triggerCloudWorkspaceSync: () => {}, forceCloudWorkspaceSyncNow: async () => {},
  });
  await handlers.handleAddCharacterSlot();
  const added = moduleFoldersRef.current.twitter[1];
  const persisted = JSON.parse(localStorage.getItem(storage.getModuleFoldersKey('BuyerUID', 'twitter')));
  assert.equal(persisted.length, 2);
  assert.equal(persisted[0].data.text, 'edited');
  const reopened = storage.loadAllStoredModuleFolders('BuyerUID', ['twitter']);
  assert.equal(reopened.twitter.length, 2);
  assert.equal(reopened.twitter[1].id, added.id);
  currentData = { text: 'new character' };
  handlers.handleSelectCharacter(original);
  assert.equal(moduleFoldersRef.current.twitter.length, 2);
  assert.equal(moduleFoldersRef.current.twitter[1].data.text, 'new character');
  handlers.handleSelectCharacter(added);
  assert.equal(currentData.text, 'new character');
  const previous = JSON.parse(localStorage.getItem(storage.getModuleFolderItemKey('BuyerUID', 'twitter', original.id)));
  assert.equal(previous.name, 'My character');
});

test('cloud hydration cannot overwrite pending local folders even with a newer cloud timestamp', () => {
  storage.markLocalWorkspaceUpdated('BuyerUID');
  const localFolders = { twitter: [{ id: 'local', data: { text: 'unsaved' } }] };
  const args = {
    userAccountKey: 'BuyerUID', authUser: context.currentUser,
    moduleFoldersRef: { current: localFolders }, hasLocalUserEditsInSessionRef: { current: false },
    forceCloudWorkspaceSyncNowRef: { current: () => {} },
    setModuleFolders: () => assert.fail('Local folders must not be overwritten'),
  };
  const { applyCloudWorkspaceData } = applyModule.useApplyCloudWorkspaceData(args);
  applyCloudWorkspaceData({ moduleFolders: { twitter: [] }, updatedAt: '2099-01-01' }, true);
  assert.equal(args.moduleFoldersRef.current, localFolders);
  assert.equal(localStorage.getItem(storage.getPendingCloudSyncStorageKey('BuyerUID')), 'true');
});

test('an older write finishing does not acknowledge a newer edit', async () => {
  let finish;
  context.save = () => new Promise(resolve => { finish = resolve; });
  storage.markLocalWorkspaceUpdated('BuyerUID');
  const states = [];
  let retries = 0;
  const { forceCloudWorkspaceSyncNow } = syncModule.useWorkspaceCloudSync({
    authUser: context.currentUser, userAccountKey: 'BuyerUID', isHydratedRef: { current: true },
    syncDebounceTimerRef: { current: null }, gatherCompleteWorkspacePayloadRef: { current: () => ({}) },
    triggerCloudWorkspaceSyncRef: { current: () => { retries++; } },
    forceCloudWorkspaceSyncNowRef: { current: null },
    setCloudSyncState: state => states.push(state), setLastSyncedTime: () => {},
  });
  const save = forceCloudWorkspaceSyncNow();
  storage.markLocalWorkspaceUpdated('BuyerUID');
  finish();
  await save;
  assert.equal(localStorage.getItem(storage.getPendingCloudSyncStorageKey('BuyerUID')), 'true');
  assert.equal(states.includes('synced'), false);
  assert.equal(retries, 1);
});

test('duplicate cloud saves wait for the commit and preserve the folder snapshot', async () => {
  let finish;
  const commits = [];
  context.commit = operations => {
    commits.push(operations);
    return new Promise(resolve => { finish = resolve; });
  };
  const payload = { moduleFolders: { twitter: [{ id: 'folder-1', name: 'Character', data: { text: 'original' } }] } };
  const first = firebaseModule.saveUserWorkspaceToFirestore('BuyerUID', payload);
  let acknowledged = false;
  const duplicate = firebaseModule.saveUserWorkspaceToFirestore('BuyerUID', payload).then(() => { acknowledged = true; });
  payload.moduleFolders.twitter[0].data.text = 'later edit';
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(acknowledged, false);
  assert.equal(commits[0].find(op => op.ref.includes('/folders/')).data.data.text, 'original');
  finish();
  await Promise.all([first, duplicate]);
  assert.equal(commits.length, 1);
  assert.equal(acknowledged, true);
});

test('failed cloud writes remain retryable', async () => {
  const payload = { moduleFolders: { twitter: [{ id: 'folder-1', data: { text: 'keep me' } }] } };
  context.commit = async () => { throw new Error('Write failed'); };
  await assert.rejects(firebaseModule.saveUserWorkspaceToFirestore('BuyerUID', payload), /Write failed/);
  const commits = [];
  context.commit = async operations => { commits.push(operations); };
  await firebaseModule.saveUserWorkspaceToFirestore('BuyerUID', payload);
  assert.equal(commits.length, 1);
});

test('Instagram highlights can be hidden and restored without losing their content', async () => {
  const result = await build({
    entryPoints: ['src/features/instagram/components/InstagramProfilePreview.tsx'],
    bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'],
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
  const data = { username: 'buyer', highlights: [{ id: 'one', title: 'My highlight', image: '' }], gridPosts: [] };
  const render = () => renderToStaticMarkup(React.createElement(module.exports.InstagramProfilePreview, { data }));
  assert.match(render(), /preview-highlights-container/);
  data.showHighlights = false;
  assert.doesNotMatch(render(), /preview-highlights-container/);
  assert.equal(data.highlights[0].title, 'My highlight');
  data.showHighlights = true;
  assert.match(render(), /My highlight/);
});

test('Instagram profile preview omits optional bio and empty highlights', async () => {
  const result = await build({
    entryPoints: ['src/features/instagram/components/InstagramProfilePreview.tsx'],
    bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'],
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
  const data = { username: 'buyer', bio: '', highlights: [], gridPosts: [], showHighlights: true };
  const markup = renderToStaticMarkup(React.createElement(module.exports.InstagramProfilePreview, { data }));
  assert.doesNotMatch(markup, /Bio description/);
  assert.doesNotMatch(markup, /preview-highlights-container/);
  assert.doesNotMatch(markup, /Highlight 1/);
});

test('reopening Instagram restores all saved folders from Firestore', async () => {
  const tabs = ['instagram-story', 'instagram-feed', 'instagram-profile'];
  context.getDocs = async ref => {
    const docs = ref.path.endsWith('/tabs') ? tabs.map(tab => ({
      id: tab,
      data: () => ({ tabKey: tab, folders: [
        { id: 'folder-1', name: 'Character one', data: { name: 'First' } },
        { id: 'folder-2', name: 'Character two', data: { name: 'Second' } },
      ] }),
    })) : [];
    return { docs, empty: docs.length === 0, forEach: fn => docs.forEach(fn) };
  };
  const reopened = await firebaseModule.loadUserWorkspaceFromFirestore('BuyerUID');
  assert.equal(reopened.status, 'loaded');
  for (const tab of tabs) {
    assert.equal(reopened.moduleFolders[tab].length, 2);
    assert.equal(reopened.moduleFolders[tab][1].data.name, 'Second');
  }
});

test('a failed folder read is an error rather than an empty successful workspace', async () => {
  context.getDocs = async ref => {
    if (ref.path.endsWith('/folders')) throw new Error('Folder read failed');
    return { docs: [], empty: true, forEach: () => {} };
  };
  const reopened = await firebaseModule.loadUserWorkspaceFromFirestore('BuyerUID');
  assert.equal(reopened.status, 'error');
  assert.equal(reopened.hasLoadedData, false);
  const { applyCloudWorkspaceData } = applyModule.useApplyCloudWorkspaceData({
    userAccountKey: 'BuyerUID',
    setModuleFolders: () => assert.fail('A failed read must not change local folders'),
  });
  applyCloudWorkspaceData(reopened, true);
});
