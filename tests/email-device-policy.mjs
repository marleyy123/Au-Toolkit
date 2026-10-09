import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Exercise the actual device utility while replacing only Firebase I/O.
const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    export { verifyAndRegisterDevice, subscribeDeviceSlotSession } from './src/utils/deviceAuthService';
    export { auth } from './src/firebase';
  ` },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'firebase-device-policy', setup(builder) {
    builder.onResolve({ filter: /\/firebase$/ }, () => ({ path: 'firebase', namespace: 'mock' }));
    builder.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: 'firestore', namespace: 'mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents: path === 'firebase' ? `
      export const auth = { app: { options: { projectId: 'au-toolkit-staging-20261005' } } };
      export const db = {};
      export const getUserDocumentId = () => 'buyer-uid';
      export const isFirestoreQuotaExhausted = () => false;
    ` : `
      export const doc = (...args) => args.slice(1).join('/');
      export const getDoc = async () => ({});
      export const setDoc = async (ref, value) => globalThis.deviceTest.writes.push({ ref, value });
      export function onSnapshot(ref, callback) {
        globalThis.deviceTest.listeners.push(callback);
        return () => { globalThis.deviceTest.unsubscribed++; };
      }
    ` }));
  } }],
});
globalThis.deviceTest = { writes: [], listeners: [], unsubscribed: 0 };
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.window = { innerWidth: 1440, screen: { width: 1440, height: 900, colorDepth: 24 },
  devicePixelRatio: 1, localStorage };
const { auth, verifyAndRegisterDevice, subscribeDeviceSlotSession } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
let replaced = 0;
const stop = subscribeDeviceSlotSession({ uid: 'buyer-uid' }, () => { replaced++; });
assert.equal(deviceTest.listeners.length, 0, 'Staging must not listen for slot takeover or log out another device');
stop();
assert.equal(replaced, 0);
const registration = await verifyAndRegisterDevice({ uid: 'buyer-uid' });
assert.equal(registration.success, true);
assert.equal(registration.isDeviceLocked, false);
assert.equal(deviceTest.writes.length, 1, 'Device metadata can remain as non-authoritative telemetry');
auth.app.options.projectId = 'legacy-production';
const stopLegacy = subscribeDeviceSlotSession({ uid: 'buyer-uid' }, () => { replaced++; });
assert.equal(deviceTest.listeners.length, 1, 'Legacy production policy remains unchanged');
const snapshot = { exists: () => true, data: () => ({ deviceId: 'other-device-id-12345', deviceModel: 'Other laptop' }) };
deviceTest.listeners[0](snapshot);
deviceTest.listeners[0](snapshot);
assert.equal(replaced, 1);
stopLegacy();
assert.equal(deviceTest.unsubscribed, 1);
console.log('PASS email device policy: staging registration is telemetry-only, no session takeover listener, legacy production unchanged.');
