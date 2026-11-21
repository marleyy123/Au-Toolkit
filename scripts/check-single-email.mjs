import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const serviceAccount = JSON.parse(readFileSync("./secrets/firebase-new-admin.json", "utf8"));
const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.argv[2] || "zaraadays.collabs@gmail.com";
const normalizedEmail = email.trim().toLowerCase();
const hash = createHash("sha256").update(normalizedEmail).digest("hex");

console.log("=== CHECK CUSTOMER ===");
console.log("EMAIL:", normalizedEmail);
console.log("ACCOUNT ID (SHA256):", hash);

let authUid = null;
try {
  const authUser = await auth.getUserByEmail(normalizedEmail);
  authUid = authUser.uid;
  console.log("\n[AUTH] FOUND:", {
    uid: authUser.uid,
    email: authUser.email,
    verified: authUser.emailVerified,
    disabled: authUser.disabled,
    lastSignInTime: authUser.metadata.lastSignInTime,
    creationTime: authUser.metadata.creationTime,
  });
} catch (e) {
  console.log("\n[AUTH] NOT FOUND:", e.message);
}

const accountSnap = await db.collection("billingAccounts").doc(hash).get();
if (accountSnap.exists) {
  console.log("\n[BILLING ACCOUNT] FOUND:", accountSnap.data());
} else {
  console.log("\n[BILLING ACCOUNT] MISSING");
}

const purchasesSnap = await db.collection("billingPurchases").where("email", "==", normalizedEmail).get();
console.log(`\n[BILLING PURCHASES] Count: ${purchasesSnap.size}`);
purchasesSnap.forEach((p) => console.log(" - Purchase:", p.id, p.data()));

const ordersSnap = await db.collection("midtransOrders").where("email", "==", normalizedEmail).get();
console.log(`\n[MIDTRANS ORDERS] Count: ${ordersSnap.size}`);
ordersSnap.forEach((o) => console.log(" - Order:", o.id, o.data()));

if (authUid) {
  const wsSnap = await db.collection("workspaceAccess").doc(authUid).get();
  if (wsSnap.exists) {
    console.log("\n[WORKSPACE ACCESS (by UID)] FOUND:", wsSnap.data());
  } else {
    console.log("\n[WORKSPACE ACCESS (by UID)] MISSING");
  }
}

// Check workspaceAccess by email
const wsEmailSnap = await db.collection("workspaceAccess").where("email", "==", normalizedEmail).get();
console.log(`\n[WORKSPACE ACCESS (by Email)] Count: ${wsEmailSnap.size}`);
wsEmailSnap.forEach((w) => console.log(" - Doc ID:", w.id, w.data()));
