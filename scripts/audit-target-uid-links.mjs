
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

const normalize = (value) => String(value || "").trim().toLowerCase();

const hashEmail = (email) =>
  createHash("sha256").update(normalize(email)).digest("hex");

async function main() {
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
      `uid-links-${source.name}`
    );

    try {
      const db = getFirestore(app);
      const auth = getAuth(app);

      console.log(`\n===== ${source.name} =====`);

      for (const email of emails) {
        let uid = null;
        let authFound = false;

        try {
          const user = await auth.getUserByEmail(email);
          uid = user.uid;
          authFound = true;
        } catch {}

        const [
          emailOrders,
          uidOrders,
          emailPurchases,
          emailAccounts,
          activeOrders,
          hashedAccount,
        ] = await Promise.all([
          db.collection("midtransOrders")
            .where("email", "==", email)
            .get(),

          uid
            ? db.collection("midtransOrders")
                .where("uid", "==", uid)
                .get()
            : Promise.resolve({ docs: [] }),

          db.collection("billingPurchases")
            .where("email", "==", email)
            .get(),

          db.collection("billingAccounts")
            .where("email", "==", email)
            .get(),

          db.collection("midtransActiveOrders")
            .where("email", "==", email)
            .get(),

          db.collection("billingAccounts")
            .doc(hashEmail(email))
            .get(),
        ]);

        const ordersById = new Map();

        for (const doc of [...emailOrders.docs, ...uidOrders.docs]) {
          const data = doc.data();

          ordersById.set(doc.id, {
            orderId: doc.id,
            state: data.state || null,
            planId: data.planId || null,
            amount: data.amount ?? null,
            createdAt: data.createdAt || null,
            matchedByEmail: normalize(data.email) === normalize(email),
            matchedByUid: Boolean(uid && data.uid === uid),
            hasTransactionId: Boolean(data.transactionId),
          });
        }

        const purchases = emailPurchases.docs.map((doc) => ({
          id: doc.id,
          ref: doc.data().ref || null,
          source: doc.data().source || null,
          orderStatus: doc.data().orderStatus || null,
          planId: doc.data().planId || null,
        }));

        const purchaseIds = new Set(
          purchases.flatMap((p) => [p.id, p.ref])
        );

        const orders = [...ordersById.values()].map((order) => ({
          ...order,
          linkedPurchase: purchaseIds.has(order.orderId),
        }));

        console.log(JSON.stringify({
          email,
          authFound,
          orders,
          purchases,
          billingAccount: {
            foundByEmail: !emailAccounts.empty,
            foundByHash: hashedAccount.exists,
            uidMatchesAuth: Boolean(
              uid &&
              hashedAccount.exists &&
              hashedAccount.data()?.uid === uid
            ),
          },
          activeOrderCount: activeOrders.size,
        }));
      }
    } finally {
      await app.delete();
    }
  }

  console.log("\nUID LINK AUDIT COMPLETE - READ ONLY");
}

main().catch(console.error);
