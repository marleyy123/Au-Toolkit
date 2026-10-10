import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDocFromServer, terminate } from 'firebase/firestore';

const projectId = 'demo-au-toolkit-review';
const base = `http://127.0.0.1:8188/v1/projects/${projectId}/databases/(default)/documents`;
async function grant(uid, fields) {
  const response = await fetch(`${base}/workspaceAccess/${uid}`, { method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { email: { stringValue: fields.email }, active: { booleanValue: fields.active },
      expiresAtMs: { integerValue: String(fields.expiresAtMs) } } }) });
  assert(response.ok, await response.text());
}
const apps = [];
function client(uid, email = `${uid}@example.com`, verified = true) {
  const app = initializeApp({ projectId, apiKey: 'demo-key' }, `${uid}-${apps.length}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8188, { mockUserToken: { sub: uid, email, email_verified: verified } });
  apps.push({ app, db });
  return db;
}
const denied = operation => assert.rejects(operation, error => error.code === 'permission-denied');
try {
  const active = client('active');
  await grant('active', { email: 'active@example.com', active: true, expiresAtMs: Date.now() + 3600000 });
  for (const path of ['users/active', 'users/active/tabs/twitter', 'users/active/folders/folder-1', 'users/active/devices/desktop']) {
    await setDoc(doc(active, path), { value: 'preserved' });
    assert.equal((await getDocFromServer(doc(active, path))).data().value, 'preserved');
  }
  await denied(setDoc(doc(active, 'workspaceAccess/active'), { active: true }));
  await denied(setDoc(doc(active, 'billingAccounts/fake'), { statusAccount: 'Active' }));
  await denied(setDoc(doc(active, 'users/other/tabs/twitter'), { value: 'not mine' }));
  await grant('active', { email: 'active@example.com', active: false, expiresAtMs: Date.now() + 3600000 });
  await denied(setDoc(doc(active, 'users/active/tabs/twitter'), { value: 'blocked' }));
  await grant('active', { email: 'active@example.com', active: true, expiresAtMs: Date.now() - 1 });
  await denied(setDoc(doc(active, 'users/active/tabs/twitter'), { value: 'expired' }));
  await grant('active', { email: 'active@example.com', active: true, expiresAtMs: Date.now() + 3600000 });
  assert.equal((await getDocFromServer(doc(active, 'users/active/tabs/twitter'))).data().value, 'preserved');
  await denied(setDoc(doc(client('unregistered'), 'users/unregistered'), { value: 'no purchase' }));
  await denied(setDoc(doc(client('active', 'wrong@example.com'), 'users/active'), { value: 'wrong email' }));
  await denied(setDoc(doc(client('active', 'active@example.com', false), 'users/active'), { value: 'unverified' }));
  console.log('PASS real emulator rules: active access, immediate block/expiry, preserved data, owner/email verification, no client-written grants or billing.');
} finally {
  for (const { app, db } of apps) { await terminate(db); await deleteApp(app); }
}
