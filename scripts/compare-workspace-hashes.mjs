import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const targets = [
  {
    name: "STAGING",
    file: "secrets/firebase-staging-admin.json",
  },
  {
    name: "NEW_PRODUCTION",
    file: "secrets/firebase-new-admin.json",
  },
];

const apps = [];

async function connect(target) {
  const credentials = JSON.parse(await readFile(target.file, "utf8"));

  const app = initializeApp(
    { credential: cert(credentials) },
    `hash-${target.name.toLowerCase()}`,
  );

  apps.push(app);

  return getFirestore(app);
}

function hash(data) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

async function collect(db) {
  const result = new Map();
  const users = await db.collection("users").get();

  for (const user of users.docs) {
    const prefix = `users/${user.id}`;

    result.set(prefix, hash(user.data()));

    for (const collection of ["folders", "tabs", "devices"]) {
      const docs = await db
        .collection("users")
        .doc(user.id)
        .collection(collection)
        .get();

      for (const doc of docs.docs) {
        result.set(`${prefix}/${collection}/${doc.id}`, hash(doc.data()));
      }
    }
  }

  return result;
}

try {
  const [staging, production] = await Promise.all(targets.map(connect));

  const [a, b] = await Promise.all([collect(staging), collect(production)]);

  const keys = new Set([...a.keys(), ...b.keys()]);

  const missingProduction = [];
  const missingStaging = [];
  const different = [];

  for (const key of keys) {
    if (!b.has(key)) missingProduction.push(key);
    else if (!a.has(key)) missingStaging.push(key);
    else if (a.get(key) !== b.get(key)) different.push(key);
  }

  console.log("\n===== WORKSPACE HASH COMPARISON =====");
  console.log("Staging documents:", a.size);
  console.log("Production documents:", b.size);
  console.log("Missing in Production:", missingProduction.length);
  console.log("Missing in Staging:", missingStaging.length);
  console.log("Different documents:", different.length);
  console.log("READ ONLY — NO DATA MODIFIED");
} finally {
  await Promise.all(apps.map(deleteApp));
}
