
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.AUDIT_PROJECT_ID;
const databaseId = process.env.AUDIT_DATABASE_ID || '(default)';

const app = initializeApp({
  credential: applicationDefault(),
  projectId,
}, `field-audit-${projectId}`);

const db = getFirestore(
  app,
  databaseId === '(default)' ? undefined : databaseId
);

async function main() {
  try {
    const user = await db.collection('users')
      .doc('b2zHXy5WDoaDfjc3QkDrrQRw8kc2')
      .get();

    if (!user.exists) throw new Error('User tidak ditemukan');

    console.log('=== USERS DOCUMENT ===');
    console.dir(user.data(), { depth: 3 });

    const subcollections = await user.ref.listCollections();

    for (const sub of subcollections) {
      const snapshot = await sub.limit(1).get();

      console.log(`\n=== ${sub.id.toUpperCase()} SAMPLE ===`);

      for (const doc of snapshot.docs) {
        console.log('Document ID:', doc.id);
        console.dir(doc.data(), { depth: 3 });
      }
    }
  } finally {
    await app.delete();
  }
}


const user = await db.collection('users')
  .doc('k9rJtfOZANW48KQy3weAYtPZO443')
  .get();

const devices = await user.ref.collection('devices').limit(2).get();

console.log('=== DEVICES SAMPLE ===');

for (const doc of devices.docs) {
  console.log('Document ID:', doc.id);
  console.dir(doc.data(), { depth: 4 });
}


main().catch(console.error);
