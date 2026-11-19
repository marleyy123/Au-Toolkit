
import {
  readFile,
  writeFile,
  mkdir,
  rename,
} from "node:fs/promises";

import {
  cert,
  initializeApp,
  deleteApp,
} from "firebase-admin/app";

import {
  getFirestore,
  FieldPath,
} from "firebase-admin/firestore";

// ============================================
// CONFIGURATION
// ============================================

const SOURCE = {
  name: "OLD_PRODUCTION",
  file: "secrets/firebase-old-production-admin.json",
  projectId: "gen-lang-client-0839250297",
  databaseId:
    "ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2",
};

const TARGET = {
  name: "NEW_PRODUCTION",
  file: "secrets/firebase-new-admin.json",
  projectId: "au-toolkit-production",
};

const SUBCOLLECTIONS = ["folders", "tabs", "devices"];

const PAGE_SIZE = 50;
const DELAY_MS = 300;

// Batas dokumen sumber yang diproses per eksekusi.
const MAX_SOURCE_READS_PER_RUN = 7000;

let sourceReadsThisRun = 0;

const APPLY = process.argv.includes("--apply");

const REPORT_DIR = "migration-reports";

const CHECKPOINT_FILE =
  `${REPORT_DIR}/old-production-checkpoint.json`;

const CONFLICT_FILE =
  `${REPORT_DIR}/old-production-conflicts.json`;

const MARKER_PATH =
  "__migrationMetadata/old-production-to-new-production-v1";

let sourceApp;
let targetApp;

const stats = {
  users: { read: 0, written: 0, skipped: 0 },
  folders: { read: 0, written: 0, skipped: 0 },
  tabs: { read: 0, written: 0, skipped: 0 },
  devices: { read: 0, written: 0, skipped: 0 },
};

const conflicts = new Map();

let checkpoint = {
  sourceProject: SOURCE.projectId,
  sourceDatabase: SOURCE.databaseId,
  targetProject: TARGET.projectId,
  collections: {},
  userIds: [],
  userIdsLastDocumentId: null,
  userIdsComplete: false,
};

// ============================================
// HELPERS
// ============================================

function log(message) {
  console.log(`[MIGRATION] ${message}`);
}

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function remainingReads() {
  return Math.max(
    0,
    MAX_SOURCE_READS_PER_RUN - sourceReadsThisRun
  );
}

function getPageSize() {
  return Math.min(PAGE_SIZE, remainingReads());
}

async function initializeFirebase(config, appName, databaseId) {
  const raw = await readFile(config.file, "utf8");
  const credentials = JSON.parse(raw);

  if (credentials.project_id !== config.projectId) {
    throw new Error(
      `${config.name}: Project ID credential tidak sesuai.`
    );
  }

  const app = initializeApp(
    {
      credential: cert(credentials),
      projectId: config.projectId,
    },
    appName
  );

  return {
    app,
    db: databaseId
      ? getFirestore(app, databaseId)
      : getFirestore(app),
  };
}


async function saveCheckpoint() {
  await mkdir(REPORT_DIR, { recursive: true });

  const tempFile = `${CHECKPOINT_FILE}.tmp`;

  await writeFile(
    tempFile,
    JSON.stringify(checkpoint, null, 2),
    "utf8"
  );

  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await rename(tempFile, CHECKPOINT_FILE);
      return;
    } catch (error) {
      const retryable = ["EPERM", "EBUSY", "EACCES"].includes(
        error.code
      );

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = Math.min(attempt * 500, 3000);

      log(
        `Checkpoint terkunci. Percobaan ${attempt}/${maxAttempts}, ` +
        `menunggu ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}


async function loadCheckpoint() {
  try {
    const raw = await readFile(CHECKPOINT_FILE, "utf8");
    const saved = JSON.parse(raw);

    if (
      saved.sourceProject !== SOURCE.projectId ||
      saved.sourceDatabase !== SOURCE.databaseId ||
      saved.targetProject !== TARGET.projectId
    ) {
      throw new Error(
        "Checkpoint tidak cocok dengan konfigurasi migrasi."
      );
    }

    checkpoint = {
      ...checkpoint,
      ...saved,
      collections: saved.collections || {},
      userIds: saved.userIds || [],
    };

    for (const name of Object.keys(stats)) {
      const savedStats = checkpoint.statistics?.[name];

      if (savedStats) {
        stats[name] = { ...savedStats };
      }
    }

    for (const item of checkpoint.conflicts || []) {
      conflicts.set(item.path, item);
    }

    log("Checkpoint berhasil dimuat.");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    log("Checkpoint belum tersedia. Memulai pemeriksaan awal.");
  }
}

async function saveProgress() {
  checkpoint.statistics = stats;
  checkpoint.conflicts = [...conflicts.values()];

  await saveCheckpoint();
}

async function commitBatch(batch) {
  // Tidak melakukan retry otomatis pada commit yang timeout.
  // Jika hasil commit tidak pasti, checkpoint tidak maju.
  await batch.commit();
}

async function pauseMigration(markerRef, reason) {
  await saveProgress();

  await markerRef.set(
    {
      status: "in_progress",
      updatedAt: new Date(),
      lastSessionSourceReads: sourceReadsThisRun,
      pauseReason: reason,
    },
    { merge: true }
  );

  log("============================================");
  log("MIGRASI DIJEDA DENGAN AMAN");
  log(`Alasan: ${reason}`);
  log(`Source reads sesi ini: ${sourceReadsThisRun}`);
  log(`Batas sesi: ${MAX_SOURCE_READS_PER_RUN}`);
  log("Checkpoint berhasil disimpan.");
  log("Jalankan kembali script untuk melanjutkan.");
  log("============================================");
}

// ============================================
// COLLECTION MIGRATION
// ============================================

async function migrateCollection(
  sourceCollection,
  targetCollection,
  collectionName
) {
  const collectionPath = sourceCollection.path;

  const state = checkpoint.collections[collectionPath] || {
    lastDocumentId: null,
    completed: false,
  };

  if (state.completed) {
    return true;
  }

  log(`Mulai: ${collectionPath}`);

  while (true) {
    const pageSize = getPageSize();

    if (pageSize <= 0) {
      log(`Batas pembacaan tercapai: ${collectionPath}`);
      return false;
    }

    let query = sourceCollection
      .orderBy(FieldPath.documentId())
      .limit(pageSize);

    if (state.lastDocumentId) {
      query = query.startAfter(state.lastDocumentId);
    }

    const snapshot = await query.get();

    sourceReadsThisRun += snapshot.size;

    if (snapshot.empty) {
      state.completed = true;
      checkpoint.collections[collectionPath] = state;

      await saveProgress();

      log(`Selesai: ${collectionPath}`);
      return true;
    }

    const targetRefs = snapshot.docs.map((doc) =>
      targetCollection.doc(doc.id)
    );

    // Pemeriksaan dokumen tujuan agar tidak menimpa data.
    const targetSnapshots =
      await targetCollection.firestore.getAll(...targetRefs);

    const existingIds = new Set(
      targetSnapshots
        .filter((doc) => doc.exists)
        .map((doc) => doc.id)
    );

    const batch = targetCollection.firestore.batch();

    let writtenThisPage = 0;
    let skippedThisPage = 0;

    for (const sourceDoc of snapshot.docs) {
      const targetRef = targetCollection.doc(sourceDoc.id);

      if (existingIds.has(sourceDoc.id)) {
        skippedThisPage++;

        conflicts.set(sourceDoc.ref.path, {
          collection: collectionName,
          path: sourceDoc.ref.path,
          reason: "TARGET_DOCUMENT_ALREADY_EXISTS",
        });

        continue;
      }

      batch.set(targetRef, sourceDoc.data());
      writtenThisPage++;
    }

    if (writtenThisPage > 0) {
      await commitBatch(batch);
    }

    // Statistik diperbarui setelah commit berhasil.
    stats[collectionName].read += snapshot.docs.length;
    stats[collectionName].written += writtenThisPage;
    stats[collectionName].skipped += skippedThisPage;

    // Checkpoint maju setelah halaman berhasil diproses.
    state.lastDocumentId =
      snapshot.docs[snapshot.docs.length - 1].id;

    checkpoint.collections[collectionPath] = state;

    await saveProgress();

    log(
      `${collectionPath}: ` +
      `halaman dibaca ${snapshot.docs.length}, ` +
      `ditulis ${writtenThisPage}, ` +
      `dilewati ${skippedThisPage}, ` +
      `total source reads sesi ${sourceReadsThisRun}/${MAX_SOURCE_READS_PER_RUN}`
    );

    await delay();
  }
}

// ============================================
// USER ID INVENTORY
// ============================================

async function collectUserIds(sourceUsers) {
  if (checkpoint.userIdsComplete) {
    log(
      `UID inventory sudah tersedia: ${checkpoint.userIds.length} akun.`
    );

    return checkpoint.userIds;
  }

  log("Mengumpulkan daftar UID sumber.");

  while (true) {
    const pageSize = getPageSize();

    if (pageSize <= 0) {
      log("Batas pembacaan tercapai saat mengumpulkan UID.");
      return null;
    }

    let query = sourceUsers
      .orderBy(FieldPath.documentId())
      .limit(pageSize);

    if (checkpoint.userIdsLastDocumentId) {
      query = query.startAfter(
        checkpoint.userIdsLastDocumentId
      );
    }

    const snapshot = await query.get();

    sourceReadsThisRun += snapshot.size;

    if (snapshot.empty) {
      checkpoint.userIdsComplete = true;
      await saveProgress();
      break;
    }

    for (const userDoc of snapshot.docs) {
      checkpoint.userIds.push(userDoc.id);
    }

    checkpoint.userIdsLastDocumentId =
      snapshot.docs[snapshot.docs.length - 1].id;

    await saveProgress();

    log(
      `UID terkumpul ${checkpoint.userIds.length}, ` +
      `source reads sesi ${sourceReadsThisRun}/${MAX_SOURCE_READS_PER_RUN}`
    );

    await delay();
  }

  log(`Total UID sumber: ${checkpoint.userIds.length}`);

  return checkpoint.userIds;
}

// ============================================
// MAIN
// ============================================

async function main() {
  log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  log(`Sumber: ${SOURCE.projectId}`);
  log(`Database sumber: ${SOURCE.databaseId}`);
  log(`Tujuan: ${TARGET.projectId} (default)`);
  log(`Batas source reads sesi: ${MAX_SOURCE_READS_PER_RUN}`);

  await loadCheckpoint();

  const source = await initializeFirebase(
    SOURCE,
    "old-production-migration-source",
    SOURCE.databaseId
  );

  sourceApp = source.app;

  const target = await initializeFirebase(
    TARGET,
    "old-production-migration-target"
  );

  targetApp = target.app;

  const markerRef = target.db.doc(MARKER_PATH);
  const markerSnapshot = await markerRef.get();

  if (markerSnapshot.exists) {
    const marker = markerSnapshot.data();

    if (
      marker.sourceProject !== SOURCE.projectId ||
      marker.targetProject !== TARGET.projectId
    ) {
      throw new Error("Migration marker tidak cocok.");
    }

    if (marker.status === "completed") {
      log("Migrasi sebelumnya sudah selesai.");
      return;
    }

    log(`Status marker: ${marker.status}`);
  }

  const sourceUsers = source.db.collection("users");
  const targetUsers = target.db.collection("users");

  if (!APPLY) {
    log("DRY RUN: tidak ada dokumen yang ditulis.");

    const count = await sourceUsers.count().get();

    console.log("Jumlah users:", count.data().count);

    console.log(
      "Checkpoint tersedia:",
      Object.keys(checkpoint.collections).length,
      "collection"
    );

    return;
  }

  await markerRef.set(
    {
      sourceProject: SOURCE.projectId,
      sourceDatabase: SOURCE.databaseId,
      targetProject: TARGET.projectId,
      status: "in_progress",
      updatedAt: new Date(),
    },
    { merge: true }
  );

  // 1. Root users
  const usersCompleted = await migrateCollection(
    sourceUsers,
    targetUsers,
    "users"
  );

  if (!usersCompleted) {
    await pauseMigration(
      markerRef,
      "SOURCE_READ_LIMIT_REACHED"
    );
    return;
  }

  // 2. UID inventory
  const userIds = await collectUserIds(sourceUsers);

  if (userIds === null) {
    await pauseMigration(
      markerRef,
      "SOURCE_READ_LIMIT_REACHED_DURING_UID_INVENTORY"
    );
    return;
  }

  // 3. Nested collections
  log(`Memproses ${userIds.length} akun.`);

  for (let i = 0; i < userIds.length; i++) {
    const uid = userIds[i];

    for (const subcollection of SUBCOLLECTIONS) {
      const sourceSubcollection = sourceUsers
        .doc(uid)
        .collection(subcollection);

      const targetSubcollection = targetUsers
        .doc(uid)
        .collection(subcollection);

      const completed = await migrateCollection(
        sourceSubcollection,
        targetSubcollection,
        subcollection
      );

      if (!completed) {
        await pauseMigration(
          markerRef,
          "SOURCE_READ_LIMIT_REACHED"
        );
        return;
      }
    }

    if ((i + 1) % 50 === 0 || i + 1 === userIds.length) {
      log(`Progres akun: ${i + 1}/${userIds.length}`);
    }
  }

  // ============================================
  // FINAL REPORT
  // ============================================

  await mkdir(REPORT_DIR, { recursive: true });

  await writeFile(
    CONFLICT_FILE,
    JSON.stringify([...conflicts.values()], null, 2),
    "utf8"
  );

  const hasConflicts = conflicts.size > 0;

  await markerRef.set(
    {
      status: hasConflicts ? "needs_review" : "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
      statistics: stats,
      conflictCount: conflicts.size,
      conflictReport: CONFLICT_FILE,
      lastSessionSourceReads: sourceReadsThisRun,
    },
    { merge: true }
  );

  console.log("\n===== MIGRATION SUMMARY =====");
  console.log(JSON.stringify(stats, null, 2));
  console.log("TOTAL CONFLICTS:", conflicts.size);
  console.log("SOURCE READS THIS SESSION:", sourceReadsThisRun);
  console.log("CONFLICT REPORT:", CONFLICT_FILE);
  console.log("CHECKPOINT:", CHECKPOINT_FILE);

  if (hasConflicts) {
    log(
      "Migrasi selesai, tetapi dokumen yang sudah ada " +
      "perlu diperiksa sebelum dinyatakan bersih."
    );
  } else {
    log("MIGRASI FIRESTORE BERHASIL.");
  }
}

// ============================================
// EXECUTION
// ============================================

try {
  await main();
} catch (error) {
  console.error("\nMIGRATION FAILED");
  console.error(error);

  console.error(
    "Checkpoint terakhir tetap disimpan. Jangan hapus file checkpoint."
  );

  process.exitCode = 1;
} finally {
  if (sourceApp) {
    await deleteApp(sourceApp);
  }

  if (targetApp) {
    await deleteApp(targetApp);
  }
}
