import { readFile, writeFile } from "node:fs/promises";
import {
  cert,
  initializeApp,
  deleteApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const SOURCE_FILE = "secrets/firebase-old-production-admin.json";
const TARGET_FILE = "secrets/firebase-new-admin.json";

const sourceCredentials = JSON.parse(
  await readFile(SOURCE_FILE, "utf8")
);

const targetCredentials = JSON.parse(
  await readFile(TARGET_FILE, "utf8")
);

if (sourceCredentials.project_id === targetCredentials.project_id) {
  throw new Error("SOURCE_AND_TARGET_MUST_DIFFER");
}

const sourceApp = initializeApp(
  { credential: cert(sourceCredentials) },
  "auth-migration-source"
);

const targetApp = initializeApp(
  { credential: cert(targetCredentials) },
  "auth-migration-target"
);

try {
  const sourceAuth = getAuth(sourceApp);
  const targetAuth = getAuth(targetApp);

  // Hanya pemeriksaan koneksi dan jumlah akun.
  // Belum melakukan ekspor atau impor.
  let pageToken;
  let total = 0;

  do {
    const result = await sourceAuth.listUsers(1000, pageToken);
    total += result.users.length;
    pageToken = result.pageToken;
  } while (pageToken);

  const targetUsers = await targetAuth.listUsers(1);

  console.log("SOURCE:", sourceCredentials.project_id);
  console.log("SOURCE USERS:", total);
  console.log("TARGET:", targetCredentials.project_id);
  console.log("TARGET USERS:", targetUsers.users.length);
  console.log("MIGRATION STATUS: PRECHECK ONLY");
} finally {
  await Promise.all([
    deleteApp(sourceApp),
    deleteApp(targetApp),
  ]);
}