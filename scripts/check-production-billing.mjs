import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const credentials = JSON.parse(
  await readFile("secrets/firebase-new-admin.json", "utf8")
);

const app = initializeApp({
  credential: cert(credentials),
});

const db = getFirestore(app);

const collections = [
  "billingAccounts",
  "billingPurchases",
  "workspaceAccess",
];

const statusFields = [
  "status",
  "paymentStatus",
  "transactionStatus",
  "accessStatus",
  "statusAccount",
  "orderStatus",
  "active",
  "isActive",
  "source",
];

try {
  console.log("\n===== NEW PRODUCTION BILLING CHECK =====");
  console.log("Project:", credentials.project_id);

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const fieldNames = new Set();
    const distributions = {};

    for (const document of snapshot.docs) {
      const data = document.data();

      Object.keys(data).forEach((key) => fieldNames.add(key));

      for (const field of statusFields) {
        if (data[field] === undefined || data[field] === null) continue;

        const value = String(data[field]);
        distributions[field] ??= {};
        distributions[field][value] =
          (distributions[field][value] || 0) + 1;
      }
    }

    console.log(`\n[${collectionName}]`);
    console.log("Documents:", snapshot.size);
    console.log("Fields:", [...fieldNames].sort());
    console.log("Status distributions:", distributions);
  }

  console.log("\n===== CHECK FINISHED =====");
} finally {
  await deleteApp(app);
}
