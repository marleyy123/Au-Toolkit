
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { normalizeEmail } from "../lib/staging-access-store.js";

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
  "transaction-link-audit",
);

const db = getFirestore(app);

const hashEmail = (email) =>
  createHash("sha256").update(normalizeEmail(email)).digest("hex");

const [orderSnapshot, purchaseSnapshot, accountSnapshot] =
  await Promise.all([
    db.collection("midtransOrders").get(),
    db.collection("billingPurchases").get(),
    db.collection("billingAccounts").get(),
  ]);

const orders = orderSnapshot.docs.map((doc) => ({
  id: doc.id,
  data: doc.data(),
}));

const purchases = purchaseSnapshot.docs.map((doc) => ({
  id: doc.id,
  data: doc.data(),
}));

const accounts = accountSnapshot.docs.map((doc) => ({
  id: doc.id,
  data: doc.data(),
}));

function prefixOf(orderId = "") {
  if (orderId.startsWith("au_live_")) return "LIVE";
  if (orderId.startsWith("au_sb_")) return "SANDBOX";
  return "UNKNOWN";
}

function expectedSource(order) {
  const prefix = prefixOf(order.orderId);
  if (prefix === "LIVE") return "midtrans-production";
  if (prefix === "SANDBOX") return "midtrans-sandbox";
  return null;
}

function findPurchases(orderId) {
  return purchases.filter(
    (purchase) =>
      purchase.id === orderId ||
      purchase.data.ref === orderId,
  );
}

const accountIds = new Set(accounts.map((account) => account.id));

const orderResults = orders.map((order) => {
  const matches = findPurchases(order.data.orderId || order.id);
  const expected = expectedSource(order.data);

  const accountId = order.data.email
    ? hashEmail(order.data.email)
    : null;

  return {
    order,
    matches,
    expectedSource: expected,
    accountFound: accountId ? accountIds.has(accountId) : false,
  };
});

const paidOrders = orderResults.filter(
  (item) => item.order.data.state === "paid",
);

const pendingOrders = orderResults.filter(
  (item) => item.order.data.state === "pending",
);

const paidWithPurchase = paidOrders.filter(
  (item) => item.matches.length > 0,
);

const paidWithoutPurchase = paidOrders.filter(
  (item) => item.matches.length === 0,
);

const sourceMatched = paidWithPurchase.filter((item) =>
  item.matches.some(
    (purchase) => purchase.data.source === item.expectedSource,
  ),
);

const sourceMismatched = paidWithPurchase.filter(
  (item) =>
    !item.matches.some(
      (purchase) => purchase.data.source === item.expectedSource,
    ),
);

const purchasesLinkedToOrder = purchases.filter((purchase) =>
  orders.some(
    (order) =>
      order.id === purchase.id ||
      order.id === purchase.data.ref ||
      order.data.orderId === purchase.data.ref,
  ),
);

const purchasesWithAccount = purchases.filter((purchase) => {
  const email = purchase.data.email;
  return email && accountIds.has(hashEmail(email));
});

const accountsLinkedToPurchase = accounts.filter((account) =>
  purchases.some(
    (purchase) =>
      purchase.data.email &&
      hashEmail(purchase.data.email) === account.id,
  ),
);

const report = {
  projectId: credentials.project_id,
  database: "(default)",

  paidOrderLinks: {
    total: paidOrders.length,
    withPurchase: paidWithPurchase.length,
    withoutPurchase: paidWithoutPurchase.length,
    withBillingAccount: paidOrders.filter(
      (item) => item.accountFound,
    ).length,
    withoutBillingAccount: paidOrders.filter(
      (item) => !item.accountFound,
    ).length,
    purchaseSourceMatchesOrderMode: sourceMatched.length,
    purchaseSourceMismatches: sourceMismatched.length,
  },

  pendingOrderLinks: {
    total: pendingOrders.length,
    unexpectedlyHasPurchase: pendingOrders.filter(
      (item) => item.matches.length > 0,
    ).length,
  },

  duplicatePurchaseMatches: {
    ordersWithMultiplePurchases: orderResults.filter(
      (item) => item.matches.length > 1,
    ).length,
  },

  purchaseLinks: {
    total: purchases.length,
    linkedToMidtransOrder: purchasesLinkedToOrder.length,
    notLinkedToMidtransOrder: purchases.length -
      purchasesLinkedToOrder.length,
    linkedToBillingAccount: purchasesWithAccount.length,
    withoutBillingAccount: purchases.length -
      purchasesWithAccount.length,
  },

  billingAccountLinks: {
    total: accounts.length,
    linkedToPurchase: accountsLinkedToPurchase.length,
    withoutPurchase: accounts.length -
      accountsLinkedToPurchase.length,
  },
};

console.log("\n===== TRANSACTION LINK AUDIT =====");
console.log(JSON.stringify(report, null, 2));
console.log("\nAUDIT COMPLETE - READ ONLY");
