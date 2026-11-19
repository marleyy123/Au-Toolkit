import { readFile } from 'node:fs/promises';
import { cert, initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const targets = [
  {
    name: 'STAGING',
    file: 'secrets/firebase-staging-admin.json',
    projectId: 'au-toolkit-staging-20261005',
  },
  {
    name: 'NEW_PRODUCTION',
    file: 'secrets/firebase-new-admin.json',
    projectId: 'au-toolkit-production',
  },
];

for (const target of targets) {
  let app;

  try {
    console.log(`\n[TESTING] ${target.name}`);

    const credentials = JSON.parse(
      await readFile(target.file, 'utf8')
    );

    app = initializeApp({
      credential: cert(credentials),
      projectId: target.projectId,
    }, `routing-test-${target.name}`);

    await getFirestore(app).listCollections();

    console.log(`[OK] ${target.name}`);
  } catch (error) {
    console.error(`[FAILED] ${target.name}:`, error.message);
    process.exitCode = 1;
  } finally {
    if (app) await deleteApp(app);
  }
}

console.log('\n[FINISHED]');