
import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const credentials = JSON.parse(
  await readFile("secrets/firebase-staging-admin.json", "utf8")
);

if (credentials.project_id !== "au-toolkit-staging-20261005") {
  throw new Error("Staging project ID mismatch");
}

const app = initializeApp(
  {
    credential: cert(credentials),
    projectId: credentials.project_id,
  },
  "staging-auth-relations-audit"
);

try {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const authUsers = [];
  let pageToken;

  do {
    const result = await auth.listUsers(1000, pageToken);
    authUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  const report = {
    projectId: credentials.project_id,
    totalAuthUsers: authUsers.length,
    linked: {
      userDocument: 0,
      workspaceAccess: 0,
      billingAccount: 0,
      folders: 0,
      tabs: 0,
      devices: 0,
    },
    noRelation: 0,
    accounts: [],
  };

  for (const user of authUsers) {
    const uid = user.uid;

    const [
      userDoc,
      workspaceDoc,
      billingSnapshot,
      foldersSnapshot,
      tabsSnapshot,
      devicesSnapshot,
    ] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("workspaceAccess").doc(uid).get(),
      db.collection("billingAccounts").where("uid", "==", uid).get(),
      db.collection("users").doc(uid).collection("folders").get(),
      db.collection("users").doc(uid).collection("tabs").get(),
      db.collection("users").doc(uid).collection("devices").get(),
    ]);

    const relation = {
      userDocument: userDoc.exists,
      workspaceAccess: workspaceDoc.exists,
      billingAccount: !billingSnapshot.empty,
      folders: foldersSnapshot.size,
      tabs: tabsSnapshot.size,
      devices: devicesSnapshot.size,
    };

    if (relation.userDocument) report.linked.userDocument++;
    if (relation.workspaceAccess) report.linked.workspaceAccess++;
    if (relation.billingAccount) report.linked.billingAccount++;
    if (relation.folders > 0) report.linked.folders++;
    if (relation.tabs > 0) report.linked.tabs++;
    if (relation.devices > 0) report.linked.devices++;

    const hasRelation =
      relation.userDocument ||
      relation.workspaceAccess ||
      relation.billingAccount ||
      relation.folders > 0 ||
      relation.tabs > 0 ||
      relation.devices > 0;

    if (!hasRelation) report.noRelation++;

    report.accounts.push({
      hasRelation,
      ...relation,
    });
  }

  console.log("\n===== STAGING AUTH RELATIONS AUDIT =====");
  console.log(JSON.stringify(report, null, 2));
  console.log("\nAUDIT COMPLETE - READ ONLY");
} finally {
  await deleteApp(app);
}
