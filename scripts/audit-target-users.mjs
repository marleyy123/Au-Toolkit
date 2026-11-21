
import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "au-toolkit-production";
const CREDENTIAL_PATH = "secrets/firebase-new-admin.json";

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

// ID mengikuti helper pada firebase.ts
function getStableId(email) {
  const clean = email.trim().toLowerCase()
    .replace(/[^a-z0-9]/g, "_");

  return `user_${clean}`;
}

function getSanitizedId(email) {
  return email.trim().toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_");
}

async function main() {
  const credentials = JSON.parse(
    await readFile(CREDENTIAL_PATH, "utf8")
  );

  if (credentials.project_id !== PROJECT_ID) {
    throw new Error(
      `Project mismatch: ${credentials.project_id}`
    );
  }

  const app = initializeApp({
    credential: cert(credentials),
    projectId: PROJECT_ID,
  }, "target-user-audit");

  try {
    const auth = getAuth(app);

    // Database ID (default), sesuai konfigurasi Netlify.
    const db = getFirestore(app);

    const results = [];

    for (const email of emails) {
      console.log(`Checking ${email}...`);

      const result = {
        email,
        auth: null,
        firestore: [],
      };

      let user;

      try {
        user = await auth.getUserByEmail(email);

        result.auth = {
          found: true,
          uid: user.uid,
          disabled: user.disabled,
          emailVerified: user.emailVerified,
          createdAt: user.metadata.creationTime,
          lastSignInAt: user.metadata.lastSignInTime || null,
        };
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          result.auth = { found: false };
        } else {
          result.auth = {
            found: null,
            error: error.message,
          };
        }
      }

      const uid = user?.uid;

      const candidates = [
        ...(uid ? [{ collection: "users", id: uid }] : []),
        { collection: "users", id: getStableId(email) },
        { collection: "users", id: getSanitizedId(email) },

        ...(uid ? [{ collection: "workspaces", id: uid }] : []),
        { collection: "workspaces", id: getStableId(email) },
        { collection: "workspaces", id: getSanitizedId(email) },
      ];

      // Hindari memeriksa path yang sama dua kali.
      const checked = new Set();

      for (const candidate of candidates) {
        const path = `${candidate.collection}/${candidate.id}`;

        if (checked.has(path)) continue;
        checked.add(path);

        try {
          const doc = await db.doc(path).get();

          if (!doc.exists) continue;

          const data = doc.data();

          const [tabs, folders] = await Promise.all([
            db.collection(`${path}/tabs`).limit(1).get(),
            db.collection(`${path}/folders`).limit(1).get(),
          ]);

          result.firestore.push({
            path,
            found: true,
            userId: data.userId ?? null,
            userEmail: data.userEmail ?? null,
            tabsExists: !tabs.empty,
            foldersExists: !folders.empty,
          });
        } catch (error) {
          result.firestore.push({
            path,
            error: error.message,
          });
        }
      }

      results.push(result);
    }

    console.log("\n========== TARGET USER AUDIT ==========");
    console.log(JSON.stringify(results, null, 2));

    console.log("\n========== SUMMARY ==========");

    const authFound = results.filter(
      r => r.auth?.found === true
    ).length;

    const authMissing = results.filter(
      r => r.auth?.found === false
    ).length;

    const firestoreFound = results.filter(
      r => r.firestore.length > 0
    ).length;

    const firestoreMissing = results.filter(
      r => r.firestore.length === 0
    ).length;

    console.log({
      uniqueEmails: results.length,
      authFound,
      authMissing,
      firestoreFound,
      firestoreMissing,
    });

    console.log("\nAUDIT COMPLETE - READ ONLY");
  } finally {
    await deleteApp(app);
  }
}

main().catch(error => {
  console.error("AUDIT FAILED:", error);
  process.exitCode = 1;
});
