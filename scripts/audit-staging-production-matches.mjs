
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
  },
  {
    name: "STAGING",
    file: "secrets/firebase-staging-admin.json",
    projectId: "au-toolkit-staging-20261005",
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
    { credential: cert(credentials), projectId: target.projectId },
    `match-audit-${target.name}`
  );

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(
      app,
      target.name === "PRODUCTION"
        ? "ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2"
        : "(default)"
    ),
  };
}

async function inspect(db, uid, email) {
  const [user, access, billing, folders, tabs, devices] =
    await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("workspaceAccess").doc(uid).get(),
      db.collection("billingAccounts")
        .doc(createHash("sha256")
          .update(email)
          .digest("hex"))
        .get(),
      db.collection("users").doc(uid).collection("folders").count().get(),
      db.collection("users").doc(uid).collection("tabs").count().get(),
      db.collection("users").doc(uid).collection("devices").count().get(),
    ]);

  return {
    userDocument: user.exists,
    workspaceAccess: access.exists,
    billingAccount: billing.exists,
    folders: folders.data().count,
    tabs: tabs.data().count,
    devices: devices.data().count,
  };
}

const production = await connect(targets[0]);
const staging = await connect(targets[1]);

try {
  const results = [];
  let pageToken;

  do {
    const page = await staging.auth.listUsers(1000, pageToken);

    for (const [index, user] of page.users.entries()) {
      const email = user.email?.trim().toLowerCase();

      if (!email) continue;

      let productionUser = null;

      try {
        productionUser = await production.auth.getUserByEmail(email);
      } catch (error) {
        if (error.code !== "auth/user-not-found") throw error;
      }

      const stagingData = await inspect(
        staging.db, user.uid, email
      );

      const productionData = productionUser
        ? await inspect(production.db, productionUser.uid, email)
        : null;

      results.push({
        stagingAccount: results.length + 1,
        productionMatch: Boolean(productionUser),
        sameUid: productionUser
          ? user.uid === productionUser.uid
          : null,
        stagingData,
        productionData,
      });
    }

    pageToken = page.pageToken;
  } while (pageToken);

  console.log("\n===== STAGING / PRODUCTION MATCH AUDIT =====");
  console.log(JSON.stringify({
    totalStagingAccounts: results.length,
    matchedProduction: results.filter(x => x.productionMatch).length,
    uniqueToStaging: results.filter(x => !x.productionMatch).length,
    accounts: results,
  }, null, 2));

  console.log("\nAUDIT COMPLETE - READ ONLY");
} finally {
  await Promise.all([
    deleteApp(production.app),
    deleteApp(staging.app),
  ]);
}
