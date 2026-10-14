import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDocFromServer, getDocs, collection, terminate } from 'firebase/firestore';

const projectId = 'demo-au-production-review';
const apps = [];
function client(uid, email = `${uid}@example.com`, verified = true) {
  const app = initializeApp({ projectId, apiKey: 'demo-key' }, `client-${apps.length}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8189, uid ? { mockUserToken: { sub: uid, email, email_verified: verified } } : {});
  apps.push({ app, db });
  return db;
}
async function seed(path, userEmail) {
  const result = await fetch(`http://127.0.0.1:8189/v1/projects/${projectId}/databases/(default)/documents/${path}`, {
    method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { userEmail: { stringValue: userEmail }, value: { stringValue: 'private' } } }),
  });
  assert(result.ok, await result.text());
}
const denied = operation => assert.rejects(operation, error => error.code === 'permission-denied');
try {
  const owner = client('owner');
  const stranger = client('stranger');
  const unverified = client('owner', 'owner@example.com', false);
  const anonymous = client(null);
  for (const path of ['users/owner', 'users/owner/tabs/instagram-dm', 'users/owner/folders/folder-1', 'users/owner/devices/desktop']) {
    await setDoc(doc(owner, path), { userEmail: 'owner@example.com', value: 'private' });
    assert((await getDocFromServer(doc(owner, path))).exists());
    for (const other of [stranger, unverified, anonymous]) {
      await denied(getDocFromServer(doc(other, path)));
      await denied(setDoc(doc(other, path), { value: 'overwrite' }));
    }
  }
  for (const root of ['workspaces/owner', 'workspaces/old-email-key', 'users/old-email-key']) {
    await seed(root, 'owner@example.com');
    await seed(root + '/tabs/instagram-dm', 'owner@example.com');
    assert((await getDocFromServer(doc(owner, root))).exists());
    assert.equal((await getDocs(collection(owner, root, 'tabs'))).size, 1);
    for (const other of [stranger, unverified, anonymous]) {
      await denied(getDocFromServer(doc(other, root)));
      await denied(getDocs(collection(other, root, 'tabs')));
    }
    if (root.startsWith('workspaces/')) await denied(setDoc(doc(owner, root), { value: 'legacy write' }));
  }
  await denied(getDocs(collection(owner, 'workspaces')));
  await denied(setDoc(doc(owner, 'billingAccounts/owner'), { active: true }));
  await denied(setDoc(doc(owner, 'workspaceAccess/owner'), { active: true }));
  console.log('PASS production rules emulator: UID isolation, verified email, legacy migration reads, no legacy writes, anonymous/cross-account denial, no client billing/grants.');
} finally {
  for (const { app, db } of apps) { await terminate(db); await deleteApp(app); }
}
