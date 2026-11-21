
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";

const sources = [
  {
    name: "STAGING",
    file: "secrets/firebase-staging-admin.json",
    project: "au-toolkit-staging-20261005",
    database: "(default)",
  },
  {
    name: "PRODUCTION",
    file: "secrets/firebase-new-admin.json",
    project: "au-toolkit-production",
    database: "(default)",
  },
];

const emails = [
  "rnaurasalwa@gmail.com",
  "esagbrnmh@gmail.com",
  "ismirahmawati10@gmail.com",
  "kalamenepi@gmail.com",
  "serlinda602@gmail.com",
  "habibahmufidah5@gmail.com",
  "fanirevianita284@gmail.com",
  "demistyrose@gmail.com",
  "azifahss18@gmail.com",
  "teehsysy@gmail.com",
  "nazwahfitrinurhakim9@gmail.com",
  "cleverse12@gmail.com",
  "onlycha2005@gmail.com",
  "finailatulizzah11@gmail.com",
  "miratiarayulainisaleh@gmail.com",
  "salfahsaa@gmail.com",
];

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const accountId = (email) =>
  createHash("sha256").update(normalize(email)).digest("hex");

for (const source of sources) {
  const credentials = JSON.parse(
    readFileSync(source.file, "utf8")
  );

  if (credentials.project_id !== source.project) {
    throw new Error(`Project mismatch: ${source.name}`);
  }

  const app = initializeApp(
    {
      credential: cert(credentials),
      projectId: credentials.project_id,
    },
    `cross-audit-${source.name}`
  );

  try {
    const db = getFirestore(app, source.database);
    const snapshot = await db.collection("billingAccounts").get();

    console.log(`\n===== ${source.name} =====`);
    console.log("Total accounts:", snapshot.size);

    for (const email of emails) {
      const expectedId = accountId(email);
      const exact = snapshot.docs.find(
        (doc) => doc.id === expectedId
      );

      const candidates = snapshot.docs.filter((doc) => {
        const data = doc.data();

        return Object.entries(data).some(([key, value]) => {
          if (!/email|buyer/i.test(key)) return false;
          if (typeof value !== "string") return false;

          return normalize(value) === normalize(email);
        });
      });

      const account = exact?.data();

      console.log(JSON.stringify({
        email,
        exactDocumentFound: Boolean(exact),
        alternateMatchCount: candidates.length,
        alternateDocumentIds: candidates
          .filter((doc) => doc.id !== expectedId)
          .map((doc) => doc.id),
        statusAccount: account?.statusAccount ?? null,
        purchaseDate: account?.purchaseDate ?? null,
        expirationDate: account?.expirationDate ?? null,
        hasUid: Boolean(account?.uid),
        revision: account?.revision ?? null,
      }));
    }
  } finally {
    await app.delete();
  }
}

console.log("\nCROSS PROJECT AUDIT COMPLETE - READ ONLY");

