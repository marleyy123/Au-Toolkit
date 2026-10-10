import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { resolveDir: process.cwd(), contents: `export { useWorkspaceCloudHydration } from './src/features/workspace/hooks/useWorkspaceCloudHydration';`, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'hydration-io', setup(builder) {
    builder.onResolve({ filter: /^(react)$|\/firebase$|workspaceStorage$|utils\/userAssets$/ }, args => ({ path: args.path, namespace: 'mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents:
      path === 'react' ? `export const useEffect = callback => { globalThis.hydration.cleanup = callback(); };` :
      path.endsWith('/firebase') ? `
        export const loadUserWorkspaceFromFirestore = async () => { globalThis.hydration.loads++; return globalThis.hydration.recovered; };
        export const subscribeUserWorkspaceFromFirestore = (uid, callback, error) => {
          globalThis.hydration.callback = callback; globalThis.hydration.error = error;
          return () => { globalThis.hydration.stopped++; };
        };
      ` : path.endsWith('userAssets') ? `export const persistUserAssets = () => {}, readPersistentUserAssets = () => ({});` : `
        export const ALL_PLATFORM_TABS = ['twitter'];
        export const getFormStorageKey = (uid, tab) => uid + ':form:' + tab;
        export const getModuleFoldersKey = (uid, tab) => uid + ':folders:' + tab;
        export const getLocalUpdateStorageKey = uid => uid + ':updated';
        export const getPendingCloudSyncStorageKey = uid => uid + ':pending';
        export const getInitialTabData = () => ({ text: '' });
        export const loadAllStoredActiveFolderIds = () => ({ twitter: 'folder-1' });
        export const loadAllStoredModuleFolders = () => ({ twitter: [{ id: 'folder-1', data: { text: 'unsaved' } }] });
      `
    }));
  } }],
});
const { useWorkspaceCloudHydration } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const values = new Map();
globalThis.localStorage = { getItem: key => values.get(key) ?? null };
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
globalThis.setTimeout = callback => { hydration.timeout = callback; return 1; };
globalThis.clearTimeout = () => {};
const ref = current => ({ current });
function start() {
  values.clear();
  globalThis.hydration = { loads: 0, stopped: 0, applied: [], syncs: 0, resets: 0, state: '', recovered: { status: 'new_user', isNewUser: true } };
  const args = {
    enabled: true, authUser: { uid: 'buyer' }, userAccountKey: 'buyer', clientSessionId: 'this-session',
    accountSyncGenerationRef: ref(0), isHydratedRef: ref(false), isApplyingCloudAssetsRef: ref(false),
    hasLocalUserEditsInSessionRef: ref(false), moduleFoldersRef: ref({}), activeFolderIdsRef: ref({}),
    forceCloudWorkspaceSyncNowRef: ref(() => { hydration.syncs++; }),
    applyCloudWorkspaceDataRef: ref((data, initial) => hydration.applied.push({ data, initial })),
    setCloudSyncState: value => { hydration.state = value; }, setIsInitialCloudLoading: () => {},
    setIsHydrated: () => {}, setAuthLifecycleStage: () => {}, setLastSyncedTime: () => {},
    setModuleFolders: () => { hydration.resets++; }, setActiveFolderIds: () => {}, loadTabFormData: () => {},
  };
  useWorkspaceCloudHydration(args);
  return args;
}
const loaded = { status: 'loaded', hasLoadedData: true, needsRecovery: false, fromCache: false, updatedAt: '2026-01-01T00:00:00.000Z' };
try {
  start();
  hydration.callback(loaded);
  assert.equal(hydration.loads, 0, 'Normal login must hydrate entirely from listeners');
  assert.equal(hydration.applied.length, 1);
  assert.equal(hydration.applied[0].initial, true);
  hydration.callback({ ...loaded, updatedBy: 'other-session' });
  assert.equal(hydration.applied[1].initial, false, 'Later remote edits must still synchronize');
  hydration.cleanup();
  hydration.callback(loaded);
  assert.equal(hydration.applied.length, 2, 'Disposed account must ignore late snapshots');
  assert.equal(hydration.stopped, 1);

  const slow = start();
  hydration.callback({ status: 'new_user', fromCache: true, needsRecovery: true });
  assert.equal(hydration.loads, 0);
  assert.equal(hydration.resets, 0, 'Cached absence must never reset local data');
  hydration.timeout();
  slow.hasLocalUserEditsInSessionRef.current = true;
  values.set('buyer:updated', String(Date.parse(loaded.updatedAt) + 1000));
  values.set('buyer:pending', 'true');
  hydration.callback(loaded);
  assert.equal(hydration.applied.length, 0, 'Late initial response must preserve newer local edits');
  assert.equal(hydration.syncs, 1);

  start();
  hydration.recovered = { ...loaded, moduleFolders: { twitter: [{ id: 'old-folder' }] } };
  hydration.callback({ ...loaded, needsRecovery: true });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(hydration.loads, 1, 'Legacy workspace must use the recovery loader');
  assert.equal(hydration.applied[0].data.moduleFolders.twitter[0].id, 'old-folder');

  const switched = start();
  hydration.callback({ ...loaded, needsRecovery: true });
  switched.accountSyncGenerationRef.current++;
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(hydration.applied.length, 0, 'Recovery from a previous account must be ignored');
  start();
  hydration.error(new Error('permission-denied'));
  assert.equal(hydration.state, 'error');
  assert.equal(hydration.syncs, 0, 'Listener errors must not initialize or save defaults');
  console.log('PASS hydration: normal login needs no separate load, realtime updates, legacy recovery, cached absence, slow connection, unsaved local edits, account switch and listener errors.');
} finally {
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
}
