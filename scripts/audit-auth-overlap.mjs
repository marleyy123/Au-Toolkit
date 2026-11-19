
import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const targets = [
  {
    name: "PRODUCTION",
    file: "secrets/firebase-old-production-admin.json",
  },
  {
    name: "STAGING",
    file: "secrets/firebase-staging-admin.json",
  },
];

async function loadUsers(target) {
  const credentials = JSON.parse(await readFile(target.file, "utf8"));
  const app = initializeApp(
    { credential: cert(credentials) },
    `overlap-${target.name}`,
  );

  try {
    const users = new Map();
    let pageToken;

    do {
      const result = await getAuth(app).listUsers(1000, pageToken);

      for (const user of result.users) {
        users.set(user.uid, {
          email: user.email?.trim().toLowerCase() || null,
        });
      }

      pageToken = result.pageToken;
    } while (pageToken);

    return users;
  } finally {
    await deleteApp(app);
  }
}

const production = await loadUsers(targets[0]);
const staging = await loadUsers(targets[1]);

let sameUid = 0;
let sameEmailDifferentUid = 0;
let stagingOnly = 0;

for (const [uid, user] of staging) {
  const productionUser = production.get(uid);

  if (productionUser) {
    sameUid++;
  } else {
    stagingOnly++;

    if (
      user.email &&
      [...production.values()].some(
        (item) => item.email === user.email,
      )
    ) {
      sameEmailDifferentUid++;
    }
  }
}

console.log("===== AUTH OVERLAP AUDIT =====");
console.log(JSON.stringify({
  productionUsers: production.size,
  stagingUsers: staging.size,
  sameUid,
  stagingOnly,
  sameEmailDifferentUid,
  uniqueStagingAccounts: stagingOnly - sameEmailDifferentUid,
}, null, 2));
