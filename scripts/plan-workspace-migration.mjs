
import { readFile } from "node:fs/promises";
import {
  cert,
  initializeApp,
  deleteApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const CONFIG = [
  {
    name: "STAGING",
    file: "secrets/firebase-staging-admin.json",
    database: "(default)",
  },
  {
    name: "NEW_PRODUCTION",
    file: "secrets/firebase-new-admin.json",
    database: "(default)",
  },
];

const apps = [];

async function connect(config) {
  const credentials = JSON.parse(
    await readFile(config.file, "utf8")
  );

  const app = initializeApp(
    { credential: cert(credentials) },
    `workspace-plan-${config.name.toLowerCase()}`
  );

  apps.push(app);

  return {
    name: config.name,
    db: getFirestore(app, config.database),
  };
}

try {
  const results = [];

  for (const config of CONFIG) {
    const { name, db } = await connect(config);

    const users = await db.collection("users").get();

    let folders = 0;
    let tabs = 0;
    let devices = 0;

    for (const user of users.docs) {
      const uid = user.id;

      const [folderDocs, tabDocs, deviceDocs] =
        await Promise.all([
          db.collection("users").doc(uid).collection("folders").get(),
          db.collection("users").doc(uid).collection("tabs").get(),
          db.collection("users").doc(uid).collection("devices").get(),
        ]);

      folders += folderDocs.size;
      tabs += tabDocs.size;
      devices += deviceDocs.size;
    }

    results.push({
      environment: name,
      users: users.size,
      folders,
      tabs,
      devices,
    });
  }

  console.log("\n===== WORKSPACE MIGRATION PLAN =====");
  console.table(results);
  console.log("\nREAD ONLY — NO DATA MODIFIED");
} finally {
  await Promise.all(apps.map(deleteApp));
}
