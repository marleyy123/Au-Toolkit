
import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const targets = [
  {
    name: "OLD_PRODUCTION",
    file: "secrets/firebase-old-production-admin.json",
    expectedProject: "gen-lang-client-0839250297",
  },
  {
    name: "OLD_STAGING",
    file: "secrets/firebase-staging-admin.json",
    expectedProject: "au-toolkit-staging-20261005",
  },
  {
    name: "NEW_PRODUCTION",
    file: "secrets/firebase-new-admin.json",
    expectedProject: "au-toolkit-production",
  },
];

async function audit(target) {
  const credentials = JSON.parse(
    await readFile(target.file, "utf8"),
  );

  if (credentials.project_id !== target.expectedProject) {
    throw new Error(
      `Project mismatch pada ${target.name}: ${credentials.project_id}`,
    );
  }

  const app = initializeApp(
    {
      credential: cert(credentials),
      projectId: credentials.project_id,
    },
    `auth-audit-${target.name}`,
  );

  try {
    const auth = getAuth(app);

    const report = {
      projectId: credentials.project_id,
      totalUsers: 0,
      disabled: 0,
      enabled: 0,
      emailVerified: 0,
      emailNotVerified: 0,
      withoutEmail: 0,
      providers: {},
      roleClaims: {},
      usersWithoutRoleClaim: 0,
    };

    let pageToken;

    do {
      const result = await auth.listUsers(1000, pageToken);

      for (const user of result.users) {
        report.totalUsers++;

        if (user.disabled) report.disabled++;
        else report.enabled++;

        if (user.email) {
          if (user.emailVerified) report.emailVerified++;
          else report.emailNotVerified++;
        } else {
          report.withoutEmail++;
        }

        const providerIds = new Set(
          user.providerData.map((provider) => provider.providerId),
        );

        if (providerIds.size === 0) {
          report.providers["no-provider"] =
            (report.providers["no-provider"] || 0) + 1;
        }

        for (const provider of providerIds) {
          report.providers[provider] =
            (report.providers[provider] || 0) + 1;
        }

        const role = user.customClaims?.role;

        if (typeof role === "string" && role.trim()) {
          report.roleClaims[role] =
            (report.roleClaims[role] || 0) + 1;
        } else {
          report.usersWithoutRoleClaim++;
        }
      }

      pageToken = result.pageToken;
    } while (pageToken);

    return {
      name: target.name,
      ...report,
    };
  } finally {
    await deleteApp(app);
  }
}

const results = [];

for (const target of targets) {
  console.log(`Auditing ${target.name}...`);
  results.push(await audit(target));
}

console.log("\n===== FIREBASE AUTH AUDIT =====");
console.log(JSON.stringify(results, null, 2));
console.log("\nAUDIT COMPLETE - READ ONLY");
