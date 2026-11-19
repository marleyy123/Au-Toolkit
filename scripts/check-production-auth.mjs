
import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const credentials = JSON.parse(
  await readFile("secrets/firebase-new-admin.json", "utf8")
);

const app = initializeApp({
  credential: cert(credentials),
});

try {
  const auth = getAuth(app);
  let pageToken;
  let total = 0;
  const providers = {};

  do {
    const result = await auth.listUsers(1000, pageToken);

    total += result.users.length;

    for (const user of result.users) {
      for (const provider of user.providerData) {
        providers[provider.providerId] =
          (providers[provider.providerId] || 0) + 1;
      }
    }

    pageToken = result.pageToken;
  } while (pageToken);

  console.log("\n===== NEW PRODUCTION AUTH CHECK =====");
  console.log("Project:", credentials.project_id);
  console.log("Total users:", total);
  console.log("Provider distribution:", providers);
  console.log("===== CHECK FINISHED =====");
} finally {
  await deleteApp(app);
}
