import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const credentialPath = "secrets/firebase-staging-admin.json";

const credentials = JSON.parse(await readFile(credentialPath, "utf8"));

if (credentials.project_id !== "au-toolkit-staging-20261005") {
  throw new Error("Credential bukan milik Firebase Staging.");
}

const app = initializeApp(
  {
    credential: cert(credentials),
    projectId: credentials.project_id,
  },
  "transaction-audit",
);

const db = getFirestore(app);

function countBy(items, selector) {
  const result = {};

  for (const item of items) {
    const value = selector(item) ?? "(kosong)";
    result[String(value)] = (result[String(value)] || 0) + 1;
  }

  return result;
}

function countByPair(items, first, second) {
  const result = {};

  for (const item of items) {
    const key = `${first(item) ?? "(kosong)"} | ${second(item) ?? "(kosong)"}`;
    result[key] = (result[key] || 0) + 1;
  }

  return result;
}

function orderPrefix(orderId = "") {
  if (orderId.startsWith("au_live_")) return "LIVE";
  if (orderId.startsWith("au_sb_")) return "SANDBOX";
  return "OTHER / UNKNOWN";
}

async function getDocs(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs;
}

console.log("Auditing transaction data...");

const [orders, purchases, accounts, activeOrders, limits] = await Promise.all([
  getDocs("midtransOrders"),
  getDocs("billingPurchases"),
  getDocs("billingAccounts"),
  getDocs("midtransActiveOrders"),
  getDocs("midtransLimits"),
]);

const orderData = orders.map((doc) => doc.data());
const purchaseData = purchases.map((doc) => doc.data());
const accountData = accounts.map((doc) => doc.data());

const report = {
  projectId: credentials.project_id,
  database: "(default)",

  midtransOrders: {
    prefixAndState: countByPair(
      orderData,
      (d) => orderPrefix(d.orderId),
      (d) => d.state,
    ),
    total: orders.length,
    prefix: countBy(orderData, (d) => orderPrefix(d.orderId)),
    state: countBy(orderData, (d) => d.state),
    status: countBy(orderData, (d) => d.status),
    planId: countBy(orderData, (d) => d.planId),
    transactionIdPresent: {
      yes: orderData.filter((d) => Boolean(d.transactionId)).length,
      no: orderData.filter((d) => !d.transactionId).length,
    },
  },

  billingPurchases: {
    total: purchases.length,
    source: countBy(purchaseData, (d) => d.source),
    orderStatus: countBy(purchaseData, (d) => d.orderStatus),
    planId: countBy(purchaseData, (d) => d.planId),
    currency: countBy(purchaseData, (d) => d.currency),
    reportPending: countBy(purchaseData, (d) => d.reportPending),
    sourceAndPlan: countByPair(
      purchaseData,
      (d) => d.source,
      (d) => d.planId,
    ),
  },

  billingAccounts: {
    total: accounts.length,
    statusAccount: countBy(accountData, (d) => d.statusAccount),
    planId: countBy(accountData, (d) => d.planId),
    uidPresent: {
      yes: accountData.filter((d) => Boolean(d.uid)).length,
      no: accountData.filter((d) => !d.uid).length,
    },
  },

  midtransActiveOrders: {
    total: activeOrders.length,
  },

  midtransLimits: {
    total: limits.length,
  },
};

console.log("\n===== TRANSACTION AUDIT =====");
console.log(JSON.stringify(report, null, 2));
console.log("\nAUDIT COMPLETE - READ ONLY");
