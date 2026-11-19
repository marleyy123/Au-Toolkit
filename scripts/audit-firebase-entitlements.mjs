
import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const credentials = JSON.parse(
  await readFile("secrets/firebase-staging-admin.json", "utf8"),
);

if (credentials.project_id !== "au-toolkit-staging-20261005") {
  throw new Error("Credential bukan milik Firebase Staging.");
}

const app = initializeApp(
  {
    credential: cert(credentials),
    projectId: credentials.project_id,
  },
  "entitlement-audit",
);

const db = getFirestore(app);

const [accountsSnapshot, purchasesSnapshot] = await Promise.all([
  db.collection("billingAccounts").get(),
  db.collection("billingPurchases").get(),
]);

const accounts = accountsSnapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

const purchases = purchasesSnapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

const now = Date.now();

function parseDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function classifyAccount(account) {
  const expiry = parseDate(account.expirationDate);

  if (!expiry) return "INVALID_OR_MISSING_EXPIRY";
  if (expiry <= now) return "EXPIRED";
  if (account.statusAccount !== "Active") return "INACTIVE";
  return "ACTIVE";
}

function classifyPurchase(purchase) {
  if (purchase.source === "midtrans-sandbox") return "SANDBOX";
  if (purchase.source === "midtrans-production") return "LIVE";
  if (purchase.source === "lynk") return "LYNK";
  if (purchase.source === "staging-import") return "STAGING_IMPORT";
  return "UNKNOWN_SOURCE";
}

function countBy(items, selector) {
  const result = {};

  for (const item of items) {
    const value = String(selector(item) ?? "(kosong)");
    result[value] = (result[value] || 0) + 1;
  }

  return result;
}

function validDateCount(items, field) {
  return {
    valid: items.filter((item) => parseDate(item[field]) !== null).length,
    invalidOrMissing: items.filter(
      (item) => parseDate(item[field]) === null,
    ).length,
  };
}

const purchaseSources = countBy(purchases, classifyPurchase);
const accountStates = countBy(accounts, classifyAccount);

const accountExpiry = {
  active: 0,
  expired: 0,
  invalidOrMissing: 0,
};

for (const account of accounts) {
  const classification = classifyAccount(account);

  if (classification === "ACTIVE") accountExpiry.active++;
  else if (classification === "EXPIRED") accountExpiry.expired++;
  else accountExpiry.invalidOrMissing++;
}

const accountByPlan = countBy(accounts, (a) => a.planId);
const accountByRevision = countBy(accounts, (a) => a.revision);
const purchaseByPlan = countBy(purchases, (p) => p.planId);

const sandboxPurchases = purchases.filter(
  (p) => p.source === "midtrans-sandbox",
);

const report = {
  projectId: credentials.project_id,
  database: "(default)",
  auditTime: new Date(now).toISOString(),

  billingAccounts: {
    total: accounts.length,
    statusAccount: countBy(accounts, (a) => a.statusAccount),
    entitlementClassification: accountStates,
    expirySummary: accountExpiry,
    planId: accountByPlan,
    revision: accountByRevision,
    purchasedAt: validDateCount(accounts, "purchasedAt"),
    expirationDate: validDateCount(accounts, "expirationDate"),
    accessDays: countBy(accounts, (a) => a.accessDays),
    uidPresent: {
      yes: accounts.filter((a) => Boolean(a.uid)).length,
      no: accounts.filter((a) => !a.uid).length,
    },
  },

  billingPurchases: {
    total: purchases.length,
    source: purchaseSources,
    planId: purchaseByPlan,
    purchasedAt: validDateCount(purchases, "purchasedAt"),
    createdAt: validDateCount(purchases, "createdAt"),
    accessDays: countBy(purchases, (p) => p.accessDays),
    reportPending: countBy(purchases, (p) => p.reportPending),
  },

  sandboxPurchaseReview: {
    total: sandboxPurchases.length,
    orderStatus: countBy(sandboxPurchases, (p) => p.orderStatus),
    planId: countBy(sandboxPurchases, (p) => p.planId),
    accessDays: countBy(sandboxPurchases, (p) => p.accessDays),
  },
};

console.log("\n===== ENTITLEMENT AUDIT =====");
console.log(JSON.stringify(report, null, 2));
console.log("\nAUDIT COMPLETE - READ ONLY");
