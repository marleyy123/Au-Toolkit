
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";

const sources = [
  {
    name: "STAGING",
    file: "secrets/firebase-staging-admin.json",
    project: "au-toolkit-staging-20261005",
  },
  {
    name: "PRODUCTION",
    file: "secrets/firebase-new-admin.json",
    project: "au-toolkit-production",
  },
];

const emails = [
  "rnaurasalwa@gmail.com",
  "esagbrnmh@gmail.com",
  "ismirahmawati10@gmail.com",
  "kalamenepi@gmail.com",
  "serlinda602@gmail.com",
  "habibahmufidah5@gmail.com",
  "fanirevianita284@gmail.com",
  "demistyrose@gmail.com",
  "azifahss18@gmail.com",
  "teehsysy@gmail.com",
  "nazwahfitrinurhakim9@gmail.com",
  "cleverse12@gmail.com",
  "onlycha2005@gmail.com",
  "finailatulizzah11@gmail.com",
  "miratiarayulainisaleh@gmail.com",
  "salfahsaa@gmail.com",
];

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const hashEmail = (email) =>
  createHash("sha256")
    .update(normalize(email))
    .digest("hex");

const safeDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return String(value);
};

for (const source of sources) {
  const credentials = JSON.parse(
    readFileSync(source.file, "utf8")
  );

  if (credentials.project_id !== source.project) {
    throw new Error(`Project mismatch: ${source.name}`);
  }

  const app = initializeApp(
    {
      credential: cert(credentials),
      projectId: credentials.project_id,
    },
    `target-transactions-${source.name}`
  );

  try {
    const db = getFirestore(app);

    const [ordersSnap, purchasesSnap, accountsSnap] =
      await Promise.all([
        db.collection("midtransOrders").get(),
        db.collection("billingPurchases").get(),
        db.collection("billingAccounts").get(),
      ]);

    const orders = ordersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const purchases = purchasesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const accountIds = new Set(
      accountsSnap.docs.map((doc) => doc.id)
    );

    console.log(`\n===== ${source.name} =====`);

    for (const email of emails) {
      const normalizedEmail = normalize(email);
      const expectedAccountId = hashEmail(email);

      const matchingOrders = orders
        .filter((order) =>
          normalize(order.email) === normalizedEmail
        )
        .map((order) => {
          const orderId = order.orderId || order.id;

          const linkedPurchases = purchases.filter(
            (purchase) =>
              purchase.id === orderId ||
              purchase.ref === orderId
          );

          return {
            orderId,
            state: order.state || null,
            planId: order.planId || null,
            amount: order.amount ?? null,
            createdAt: safeDate(order.createdAt),
            transactionIdPresent: Boolean(order.transactionId),
            linkedPurchases: linkedPurchases.map((purchase) => ({
              id: purchase.id,
              source: purchase.source || null,
              orderStatus: purchase.orderStatus || null,
              planId: purchase.planId || null,
              purchasedAt: safeDate(purchase.purchasedAt),
            })),
          };
        });

      const matchingPurchases = purchases
        .filter((purchase) =>
          normalize(purchase.email) === normalizedEmail
        )
        .map((purchase) => ({
          id: purchase.id,
          ref: purchase.ref || null,
          source: purchase.source || null,
          orderStatus: purchase.orderStatus || null,
          planId: purchase.planId || null,
          purchasedAt: safeDate(purchase.purchasedAt),
        }));

      console.log(JSON.stringify({
        email,
        billingAccountFound: accountIds.has(expectedAccountId),
        matchingOrders,
        matchingPurchases,
      }));
    }
  } finally {
    await app.delete();
  }
}

console.log("\nTARGET TRANSACTION AUDIT COMPLETE - READ ONLY");
