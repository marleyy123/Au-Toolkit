
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountPath = resolve(
  'gen-lang-client-0839250297-firebase-adminsdk-fbsvc-2c3bdac3e8.json'
);

const credentials = JSON.parse(
  await readFile(serviceAccountPath, 'utf8')
);

const app = initializeApp(
  { credential: cert(credentials) },
  'check-default-database'
);

const db = getFirestore(app);

console.log('Project:', credentials.project_id);
console.log('Database target: (default)');

try {
  const collections = await db.listCollections();

  console.log('\nSTATUS: DATABASE BISA DIAKSES');
  console.log('Jumlah collection:', collections.length);

  for (const collection of collections) {
    console.log('-', collection.id);
  }
} catch (error) {
  console.error('\nSTATUS: DATABASE GAGAL DIAKSES');
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
}

await app.delete();
