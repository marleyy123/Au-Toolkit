
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const file = "secrets/firebase-new-admin.json";
const credentials = JSON.parse(readFileSync(file, "utf8"));

if (credentials.project_id !== "au-toolkit-production") {
  throw new Error("Project mismatch!");
}

const app = initializeApp({
  credential: cert(credentials),
  projectId: credentials.project_id,
}, "production-schema-audit");

const db = getFirestore(app);

const collections = [
  "midtransOrders",
  "billingPurchases",
  "billingAccounts",
  "midtransActiveOrders",
  "workspaceAccess",
  "users",
];

function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value?.toDate instanceof Function) return "timestamp";
  if (value instanceof Object) return "object";
  return typeof value;
}

async function main() {
  for (const name of collections) {
    const snap = await db.collection(name).limit(5).get();

    console.log(`\n===== ${name} =====`);
    console.log(`Sample documents: ${snap.size}`);

    for (const doc of snap.docs) {
      const data = doc.data();

      const fields = Object.entries(data).map(([key, value]) => ({
        field: key,
        type: describe(value),
        nestedFields:
          value && typeof value === "object" && !Array.isArray(value)
            ? Object.keys(value)
            : undefined,
      }));

      console.log(JSON.stringify({
        documentIdLength: doc.id.length,
        fields,
      }));
    }
  }

  await app.delete();
}

main().catch(async (error) => {
  console.error(error.message);
  await app.delete();
  process.exit(1);
});
