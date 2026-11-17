
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Gunakan service account yang sama dengan script audit sebelumnya.
const serviceAccountPath = resolve(
  'gen-lang-client-0839250297-firebase-adminsdk-fbsvc-2c3bdac3e8.json'
);

const DATABASE_ID =
  'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2';

const credentials = JSON.parse(
  await readFile(serviceAccountPath, 'utf8')
);

if (credentials.project_id !== 'gen-lang-client-0839250297') {
  throw new Error('Project ID tidak sesuai. Audit dibatalkan.');
}

const app = initializeApp(
  { credential: cert(credentials) },
  'firestore-inspector'
);

const db = getFirestore(app);

function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return `array${value.length ? `<${getType(value[0])}>` : ''}`;
  }
  if (value instanceof Date) return 'date';
  if (typeof value === 'object') return 'map';
  return typeof value;
}

// Hanya mengambil nama field dan tipe data.
// Tidak mencetak nilai asli pelanggan.
function inspectFields(data, depth = 0) {
  const result = {};

  for (const [key, value] of Object.entries(data)) {
    if (depth >= 2 && value && typeof value === 'object') {
      result[key] = getType(value);
      continue;
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      result[key] = inspectFields(value, depth + 1);
    } else {
      result[key] = getType(value);
    }
  }

  return result;
}

console.log('\nDATABASE:', DATABASE_ID);

const collections = await db.listCollections();

console.log('\nTOTAL COLLECTION:', collections.length);

for (const collection of collections) {
  console.log('\n================================');
  console.log('COLLECTION:', collection.id);

  try {
    const [countSnapshot, sampleSnapshot] = await Promise.all([
      collection.count().get(),
      collection.limit(3).get(),
    ]);

    console.log('DOCUMENT COUNT:', countSnapshot.data().count);
    console.log('SAMPLE DOCUMENTS:', sampleSnapshot.size);

    for (const doc of sampleSnapshot.docs) {
      console.log('\nDOCUMENT ID:', doc.id);
      console.log(
        'FIELDS:',
        JSON.stringify(inspectFields(doc.data()), null, 2)
      );
    }
  } catch (error) {
    console.error('GAGAL MEMBACA COLLECTION:', error.message);
  }
}

console.log('\nAUDIT SELESAI (READ ONLY).');

await app.delete();
