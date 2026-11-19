
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const targets = [
  {
    name: "PRODUCTION",
    file: "secrets/firebase-old-production-admin.json",
    projectId: "gen-lang-client-0839250297",
    databaseId:
      "ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2",
  },
  {
    name: "STAGING",
    file: "secrets/firebase-staging-admin.json",
    projectId: "au-toolkit-staging-20261005",
    databaseId: "(default)",
  },
];

async function connect(target) {
  const credentials = JSON.parse(
    await readFile(target.file, "utf8")
  );

  if (credentials.project_id !== target.projectId) {
    throw new Error(`Project mismatch: ${target.name}`);
  }

  const app = initializeApp(
    {
      credential: cert(credentials),
      projectId: target.projectId,
    },
    `workspace-diff-${target.name}`
  );

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app, target.databaseId),
  };
}

function normalize(value) {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) return value.toISOString();

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, normalize(value[key])])
    );
  }

  return value;
}

function hash(value) {
  return createHash("sha256")
    .update(JSON.stringify(normalize(value)))
    .digest("hex");
}

function getChangedFields(a, b, prefix = "") {
  const fields = new Set([
    ...Object.keys(a || {}),
    ...Object.keys(b || {}),
  ]);

  const changes = [];

  for (const field of [...fields].sort()) {
    const path = prefix ? `${prefix}.${field}` : field;
    const left = a?.[field];
    const right = b?.[field];

    if (left === undefined || right === undefined) {
      changes.push(path);
      continue;
    }

    const leftObject =
      left !== null && typeof left === "object" && !Array.isArray(left);
    const rightObject =
      right !== null && typeof right === "object" && !Array.isArray(right);

    if (leftObject && rightObject) {
      changes.push(...getChangedFields(left, right, path));
    } else if (hash(left) !== hash(right)) {
      changes.push(path);
    }
  }

  return changes;
}

async function getDocuments(db, uid, collectionName) {
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection(collectionName)
    .get();

  return new Map(
    snapshot.docs.map(doc => [doc.id, doc.data()])
  );
}

function getUpdatedAt(value) {
  const timestamp = value?.updatedAt;

  if (typeof timestamp?.toMillis === "function") {
    return timestamp.toMillis();
  }

  if (timestamp instanceof Date) return timestamp.getTime();

  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof timestamp === "number") return timestamp;

  return null;
}

async function compareCollection(prodDb, stagingDb, prodUid, stagingUid, name) {
  const [prodDocs, stagingDocs] = await Promise.all([
    getDocuments(prodDb, prodUid, name),
    getDocuments(stagingDb, stagingUid, name),
  ]);

  const prodIds = new Set(prodDocs.keys());
  const stagingIds = new Set(stagingDocs.keys());

  const commonIds = [...prodIds].filter(id => stagingIds.has(id));
  const productionOnly = [...prodIds].filter(id => !stagingIds.has(id));
  const stagingOnly = [...stagingIds].filter(id => !prodIds.has(id));

  const identical = [];
  const different = [];

  for (const id of commonIds) {
    const prodData = prodDocs.get(id);
    const stagingData = stagingDocs.get(id);

    const changedFields = getChangedFields(prodData, stagingData);

    if (changedFields.length === 0) {
      identical.push(id);
    } else {
      different.push({
        documentId: id,
        changedFieldCount: changedFields.length,
        changedFields,
        productionUpdatedAt: getUpdatedAt(prodData),
        stagingUpdatedAt: getUpdatedAt(stagingData),
      });
    }
  }

  return {
    productionCount: prodDocs.size,
    stagingCount: stagingDocs.size,
    commonCount: commonIds.length,
    identicalCount: identical.length,
    differentCount: different.length,
    productionOnlyCount: productionOnly.length,
    stagingOnlyCount: stagingOnly.length,
    productionOnlyIds: productionOnly,
    stagingOnlyIds: stagingOnly,
    differentDocuments: different,
  };
}

const production = await connect(targets[0]);
const staging = await connect(targets[1]);

try {
  const stagingUsers = [];
  let pageToken;

  do {
    const page = await staging.auth.listUsers(1000, pageToken);
    stagingUsers.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  const reports = [];

  for (const user of stagingUsers) {
    if (!user.email) continue;

    const stagingUserDoc = await staging.db
      .collection("users")
      .doc(user.uid)
      .get();

    if (!stagingUserDoc.exists) continue;

    let productionUser;

    try {
      productionUser = await production.auth.getUserByEmail(
        user.email.trim().toLowerCase()
      );
    } catch (error) {
      if (error.code === "auth/user-not-found") continue;
      throw error;
    }

    const productionUserDoc = await production.db
      .collection("users")
      .doc(productionUser.uid)
      .get();

    if (!productionUserDoc.exists) continue;

    const accountNumber = reports.length + 1;

    console.log(`Comparing workspace ${accountNumber}...`);

    const collections = {};

    for (const name of ["folders", "tabs", "devices"]) {
      collections[name] = await compareCollection(
        production.db,
        staging.db,
        productionUser.uid,
        user.uid,
        name
      );
    }

    reports.push({
      account: accountNumber,
      collections,
    });
  }

  
console.log("\n===== WORKSPACE FIELD DIFF =====");

for (const report of reports) {
  const summary = {
    account: report.account,
    collections: {},
  };

  for (const [name, data] of Object.entries(report.collections)) {
    const fieldFrequency = {};

    for (const doc of data.differentDocuments) {
      for (const field of doc.changedFields) {
        fieldFrequency[field] = (fieldFrequency[field] || 0) + 1;
      }
    }

    summary.collections[name] = {
      productionCount: data.productionCount,
      stagingCount: data.stagingCount,
      identicalCount: data.identicalCount,
      differentCount: data.differentCount,
      productionOnlyCount: data.productionOnlyCount,
      stagingOnlyCount: data.stagingOnlyCount,
      stagingOnlyIds: data.stagingOnlyIds,
      changedFieldFrequency: fieldFrequency,
      examples: data.differentDocuments.slice(0, 2).map(doc => ({
        documentId: doc.documentId,
        changedFields: doc.changedFields,
        productionUpdatedAt: doc.productionUpdatedAt,
        stagingUpdatedAt: doc.stagingUpdatedAt,
      })),
    };
  }

  console.log(JSON.stringify(summary, null, 2));
}

console.log("\nAUDIT COMPLETE - READ ONLY");

} finally {
  await Promise.all([
    deleteApp(production.app),
    deleteApp(staging.app),
  ]);
}
