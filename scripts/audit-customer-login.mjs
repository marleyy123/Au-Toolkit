
import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../secrets/firebase-new-admin.json" with { type: "json" };

const PROJECT_ID = "au-toolkit-production";

const emails = [
  "rnaurasalwa@gmail.com",
  "esagbrnmh@gmail.com",
  "ismirahmawati10@gmail.com",
  "kalamenepi@gmail.com",
  "serlinda602@gmail.com",
  "habibahmufidah5@gmail.com",
  "demistyrose@gmail.com",
  "azifahss18@gmail.com",
  "teehsysy@gmail.com",
  "nazwahfitrinurhakim9@gmail.com",
  "cleverse12@gmail.com",
  "onlycha2005@gmail.com",
  "salfahsaa@gmail.com",
  "yuliaannisa27@gmail.com",
  "ohohyull0@gmail.com",
  "leeunarose@gmail.com",
  "gholizhahkamara0312@gmail.com",
  "zdnmks1405@gmail.com",
  "winniesulastri@gmail.com",
  "zihanaprilia19@gmail.com",
];

if (serviceAccount.project_id !== PROJECT_ID) {
  throw new Error(`Wrong project: ${serviceAccount.project_id}`);
}

const app = getApps()[0] ?? initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth(app);
const db = getFirestore(app);

const normalizeEmail = (email) => email.trim().toLowerCase();

const accountId = (email) =>
  createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");

const formatDate = (value) => {
  if (!value) return "-";

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const uniqueEmails = [
  ...new Set(emails.map(normalizeEmail)),
];

const results = [];

console.log(`Project: ${PROJECT_ID}`);
console.log(`Total entries: ${emails.length}`);
console.log(`Unique emails: ${uniqueEmails.length}`);
console.log("\nAuditing customers...\n");

for (const email of uniqueEmails) {
  try {
    let user = null;

    try {
      user = await auth.getUserByEmail(email);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }

    if (!user) {
      results.push({
        email,
        auth: "NOT FOUND",
        verified: "-",
        uidMatch: "-",
        account: "UNKNOWN",
        subscription: "-",
        workspace: "-",
        diagnosis: "FIREBASE_AUTH_USER_MISSING",
      });
      continue;
    }

    const accountRef = db
      .collection("billingAccounts")
      .doc(accountId(email));

    const accountSnap = await accountRef.get();
    const account = accountSnap.exists
      ? accountSnap.data()
      : null;

    const uidMatch = account?.uid
      ? account.uid === user.uid
      : false;

    let workspace = null;

    if (user.uid) {
      const workspaceSnap = await db
        .collection("workspaceAccess")
        .doc(user.uid)
        .get();

      workspace = workspaceSnap.exists
        ? workspaceSnap.data()
        : null;
    }

    const now = Date.now();
    const expiry = account?.expirationDate
      ? Date.parse(account.expirationDate)
      : NaN;

    const subscription =
      account?.statusAccount === "Active" &&
      Number.isFinite(expiry) &&
      expiry > now
        ? "ACTIVE"
        : account?.statusAccount === "Inactive"
          ? "INACTIVE"
          : Number.isFinite(expiry) && expiry <= now
            ? "EXPIRED"
            : "CHECK REQUIRED";

    let diagnosis = "CHECK LOGIN FLOW";

    if (!user.emailVerified) {
      diagnosis = "EMAIL_NOT_VERIFIED";
    } else if (!account) {
      diagnosis = "BILLING_ACCOUNT_MISSING";
    } else if (account.uid && !uidMatch) {
      diagnosis = "ACCOUNT_UID_MISMATCH";
    } else if (!account.uid) {
      diagnosis = "ACCOUNT_UID_MISSING";
    } else if (subscription !== "ACTIVE") {
      diagnosis = `SUBSCRIPTION_${subscription}`;
    } else if (!workspace) {
      diagnosis = "WORKSPACE_ACCESS_MISSING";
    } else if (workspace.active !== true) {
      diagnosis = "WORKSPACE_INACTIVE";
    } else if (
      typeof workspace.expiresAtMs === "number" &&
      workspace.expiresAtMs <= now
    ) {
      diagnosis = "WORKSPACE_EXPIRED";
    } else {
      diagnosis = "BASIC_ACCESS_CHECK_PASSED";
    }

    results.push({
      email,
      auth: "FOUND",
      verified: user.emailVerified ? "YES" : "NO",
      uidMatch: account?.uid
        ? uidMatch ? "YES" : "NO"
        : "NO UID",
      account: account ? "FOUND" : "MISSING",
      subscription,
      workspace: workspace
        ? workspace.active === true ? "ACTIVE" : "INACTIVE"
        : "MISSING",
      diagnosis,
      uid: user.uid,
      purchaseDate: formatDate(account?.purchaseDate),
      expirationDate: formatDate(account?.expirationDate),
      workspaceExpiry: workspace?.expiresAtMs ?? "-",
    });
  } catch (error) {
    results.push({
      email,
      diagnosis: `ERROR: ${error.message}`,
    });
  }
}

console.table(results);

console.log("\n========== DIAGNOSIS SUMMARY ==========");

const counts = {};

for (const result of results) {
  counts[result.diagnosis] =
    (counts[result.diagnosis] || 0) + 1;
}

console.table(
  Object.entries(counts).map(([diagnosis, total]) => ({
    diagnosis,
    total,
  }))
);

console.log("=======================================");
console.log("READ ONLY: No customer data was modified.");
