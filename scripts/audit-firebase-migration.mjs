
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SOURCES = [
  {
    name: 'OLD_PRODUCTION',
    credential: 'secrets/firebase-old-production-admin.json',
    expectedProject: 'gen-lang-client-0839250297',
    database: 'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2',
  },
  {
    name: 'OLD_STAGING',
    credential: 'secrets/firebase-staging-admin.json',
    expectedProject: 'au-toolkit-staging-20261005',
    database: '(default)',
  },
  {
    name: 'NEW_PRODUCTION',
    credential: 'secrets/firebase-new-admin.json',
    expectedProject: 'au-toolkit-production',
    database: '(default)',
  },
];

const GROUPS = [
  'folders',
  'tabs',
  'devices',
];

const SENSITIVE_FIELDS = /email|token|secret|password|phone|useragent|authorization|privatekey/i;

function fieldType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value?.toDate) return 'timestamp';
  if (value instanceof Date) return 'date';
  if (typeof value === 'object') return 'map';
  return typeof value;
}

function safeFields(docs) {
  const fields = {};

  for (const doc of docs) {
    for (const [key, value] of Object.entries(doc.data())) {
      if (SENSITIVE_FIELDS.test(key)) continue;
      fields[key] ??= new Set();
      fields[key].add(fieldType(value));
    }
  }

  return Object.fromEntries(
    Object.entries(fields).map(([key, types]) => [
      key,
      [...types],
    ])
  );
}

async function countCollection(collection) {
  const result = await collection.count().get();
  return result.data().count;
}

async function auditSource(source) {
  const credentials = JSON.parse(
    readFileSync(source.credential, 'utf8')
  );

  if (credentials.project_id !== source.expectedProject) {
    throw new Error(
      `${source.name}: Project ID tidak sesuai.`
    );
  }

  const app = initializeApp({
    credential: cert(credentials),
    projectId: credentials.project_id,
  }, `audit-${source.name}`);

  try {
    const db = getFirestore(
      app,
      source.database
    );

    const collections = await db.listCollections();
    const root = {};

    for (const collection of collections) {
      root[collection.id] = {
        documents: await countCollection(collection),
      };

      const samples = await collection.limit(3).get();

      root[collection.id].sampleFields =
        safeFields(samples.docs);
    }

    const nested = {};

    for (const name of GROUPS) {
      const collection = db.collectionGroup(name);

      nested[name] = {
        documents: await countCollection(collection),
      };

      const samples = await collection.limit(3).get();

      nested[name].sampleFields =
        safeFields(samples.docs);
    }

    return {
      source: source.name,
      projectId: credentials.project_id,
      database: source.database,
      root,
      nested,
    };
  } finally {
    await app.delete();
  }
}

async function main() {
  const report = [];

  for (const source of SOURCES) {
    console.log(`Auditing ${source.name}...`);
    report.push(await auditSource(source));
  }

  console.log('\n===== FIREBASE MIGRATION AUDIT =====');
  console.log(JSON.stringify(report, null, 2));
  console.log('\nAUDIT COMPLETE - READ ONLY');
}

main().catch(error => {
  console.error('\nAUDIT FAILED:', error.message);
  process.exitCode = 1;
});
