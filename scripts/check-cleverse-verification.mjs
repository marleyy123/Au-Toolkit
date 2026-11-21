
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "../secrets/firebase-new-admin.json" with { type: "json" };

const expectedProject = "au-toolkit-production";
const email = "cleverse12@gmail.com";

if (serviceAccount.project_id !== expectedProject) {
  throw new Error(`Wrong Firebase project: ${serviceAccount.project_id}`);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert(serviceAccount),
  });

const user = await getAuth(app).getUserByEmail(email);

console.log({
  email: user.email,
  uid: user.uid,
  emailVerified: user.emailVerified,
  status: user.emailVerified
    ? "VERIFIED - Link sudah dikonfirmasi"
    : "NOT VERIFIED - Belum dikonfirmasi",
});
