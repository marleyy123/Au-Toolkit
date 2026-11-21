
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const credentials = JSON.parse(
  readFileSync("secrets/firebase-new-admin.json", "utf8")
);

if (credentials.project_id !== "au-toolkit-production") {
  throw new Error("WRONG_FIREBASE_PROJECT");
}

const app = initializeApp({
  credential: cert(credentials),
  projectId: "au-toolkit-production",
});

try {
  const id = "au_live_001c7caee0414cb49ba4f26569c9211c";

  const snap = await getFirestore(app)
    .collection("midtransOrders")
    .doc(id)
    .get();

  if (!snap.exists) {
    console.log("ORDER NOT FOUND");
  } else {
    const d = snap.data();

    console.log({
      orderId: d.orderId,
      email: d.email,
      planId: d.planId,
      accessDays: d.accessDays,
      amount: d.amount,
      state: d.state,
      status: d.status,
      transactionId: d.transactionId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      settlementTime: d.settlementTime,
      statusTokenExists: Boolean(d.statusTokenHash),
    });
  }
} finally {
  await app.delete();
}
