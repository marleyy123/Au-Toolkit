
import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const SOURCE = {
  name: "OLD_STAGING",
  file: "secrets/firebase-staging-admin.json",
  projectId: "au-toolkit-staging-20261005",
};

const TARGET = {
  name: "NEW_PRODUCTION",
  file: "secrets/firebase-new-admin.json",
  projectId: "au-toolkit-production",
};

const ROOT_COLLECTIONS = [
  "billingAccounts",
  "billingAdminAudit",
  "billingPurchases",
  "midtransLimits",
  "midtransOrders",
  "midtransActiveOrders",
  "workspaceAccess",
  "users",
];

const USER_SUBCOLLECTIONS = [
  "folders",
  "tabs",
  "devices",
];

const BATCH_SIZE = 400;
const APPLY = process.argv.includes("--apply");

const MARKER_PATH =
  "__migrationMetadata/staging-to-production-v1";

let sourceApp;
let targetApp;

function log(message) {
  console.log(`[MIGRATION] ${message}`);
}

async function initializeFirebase(config) {
  const raw = await readFile(config.file, "utf8");
  const serviceAccount = JSON.parse(raw);

  if (serviceAccount.project_id !== config.projectId) {
    throw new Error(
      `Project ID credential ${config.name} tidak sesuai.`,
    );
  }

  const app = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: config.projectId,
    },
    `migration-${config.name}`,
  );

  return {
    app,
    db: getFirestore(app),
  };
}

async function readSourceData(db) {
  const documents = [];
  const expectedCounts = new Map();

  async function collectCollection(collectionPath) {
    log(`Membaca ${collectionPath}...`);

    const snapshot = await db
      .collection(collectionPath)
      .get();

    expectedCounts.set(collectionPath, snapshot.size);

    for (const doc of snapshot.docs) {
      documents.push({
        path: doc.ref.path,
        data: doc.data(),
      });
    }

    log(`${collectionPath}: ${snapshot.size} dokumen`);
    return snapshot.docs;
  }

  for (const collectionName of ROOT_COLLECTIONS) {
    const rootDocs = await collectCollection(collectionName);

    if (collectionName !== "users") continue;

    for (const userDoc of rootDocs) {
      for (const subcollection of USER_SUBCOLLECTIONS) {
        const path =
          `users/${userDoc.id}/${subcollection}`;

        await collectCollection(path);
      }
    }
  }

  return {
    documents,
    expectedCounts,
  };
}

async function checkDestination(db) {
  const markerRef = db.doc(MARKER_PATH);
  const markerSnapshot = await markerRef.get();

  if (markerSnapshot.exists) {
    const marker = markerSnapshot.data();

    if (
      marker.sourceProject !== SOURCE.projectId ||
      marker.targetProject !== TARGET.projectId
    ) {
      throw new Error(
        "Migration marker ditemukan, tetapi project tidak cocok.",
      );
    }

    if (marker.status === "completed") {
      log("Migrasi sebelumnya sudah selesai. Tidak ada perubahan.");
      return { canContinue: false, markerRef };
    }

    log(
      `Melanjutkan migrasi sebelumnya (status: ${marker.status}).`,
    );

    return { canContinue: true, markerRef };
  }

  const collections = await db.listCollections();

  const unexpected = collections
    .map((collection) => collection.id)
    .filter((name) => name !== "__migrationMetadata");

  if (unexpected.length > 0) {
    throw new Error(
      `Database tujuan tidak kosong. Koleksi ditemukan: ${unexpected.join(", ")}`,
    );
  }

  await markerRef.set({
    sourceProject: SOURCE.projectId,
    targetProject: TARGET.projectId,
    status: "in_progress",
    startedAt: new Date(),
    updatedAt: new Date(),
  });

  return { canContinue: true, markerRef };
}

async function writeDocuments(db, documents) {
  let batch = db.batch();
  let operations = 0;
  let completed = 0;

  for (const document of documents) {
    batch.set(
      db.doc(document.path),
      document.data,
    );

    operations++;
    completed++;

    if (operations >= BATCH_SIZE) {
      await batch.commit();

      log(`Berhasil menulis ${completed}/${documents.length}`);
      batch = db.batch();
      operations = 0;
    }
  }

  if (operations > 0) {
    await batch.commit();
  }

  log(`Total dokumen ditulis: ${completed}`);
}

async function validateDestination(db, expectedCounts) {
  log("Memvalidasi jumlah dokumen tujuan...");

  let valid = true;

  for (const [collectionPath, expected] of expectedCounts) {
    const snapshot = await db
      .collection(collectionPath)
      .get();

    const actual = snapshot.size;
    const status = actual === expected ? "OK" : "MISMATCH";

    console.log(
      `[VALIDATION] ${status} | ${collectionPath} | ` +
      `sumber=${expected} tujuan=${actual}`,
    );

    if (actual !== expected) {
      valid = false;
    }
  }

  if (!valid) {
    throw new Error(
      "Validasi jumlah dokumen gagal. Jangan lakukan cutover.",
    );
  }

  log("Validasi jumlah dokumen berhasil.");
}

async function main() {
  log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  log(`Sumber: ${SOURCE.projectId}`);
  log(`Tujuan: ${TARGET.projectId}`);

  const source = await initializeFirebase(SOURCE);
  sourceApp = source.app;

  const target = await initializeFirebase(TARGET);
  targetApp = target.app;

  const { documents, expectedCounts } =
    await readSourceData(source.db);

  console.log("\n===== RINGKASAN DATA =====");

  for (const [path, count] of expectedCounts) {
    console.log(`${path}: ${count}`);
  }

  console.log(`TOTAL: ${documents.length} dokumen`);

  if (!APPLY) {
    log("DRY RUN selesai. Tidak ada data yang ditulis.");
    log("Periksa ringkasan, lalu jalankan dengan --apply.");
    return;
  }

  const { canContinue, markerRef } =
    await checkDestination(target.db);

  if (!canContinue) return;

  try {
    await writeDocuments(target.db, documents);

    await validateDestination(
      target.db,
      expectedCounts,
    );

    await markerRef.set(
      {
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
        totalDocuments: documents.length,
      },
      { merge: true },
    );

    log("MIGRASI STAGING BERHASIL.");
  } catch (error) {
    await markerRef.set(
      {
        status: "failed",
        updatedAt: new Date(),
        lastError: String(error.message || error),
      },
      { merge: true },
    );

    throw error;
  }
}

try {
  await main();
} catch (error) {
  console.error("\nMIGRATION FAILED");
  console.error(error);
  process.exitCode = 1;
} finally {
  if (sourceApp) await deleteApp(sourceApp);
  if (targetApp) await deleteApp(targetApp);
}
