import { createHash } from "node:crypto";
import {
  getStagingDb,
  normalizeEmail
} from "./lib/staging-access-store.js";

const email = normalizeEmail("hendrianyudha877@gmail.com");

const oldUid = "SnAWwSGXUNVhVJwKSpjkLHRhs8P2";
const currentUid = "LtkzHctL0Ohr02ER16VLBNcQkof2";

const db = await getStagingDb();

const accountId = createHash("sha256")
  .update(email)
  .digest("hex");

const accountRef = db.collection("billingAccounts").doc(accountId);
const oldWorkspaceRef = db.collection("workspaceAccess").doc(oldUid);
const newWorkspaceRef = db.collection("workspaceAccess").doc(currentUid);

await db.runTransaction(async (tx) => {
  const accountSnap = await tx.get(accountRef);
  const oldWorkspaceSnap = await tx.get(oldWorkspaceRef);
  const newWorkspaceSnap = await tx.get(newWorkspaceRef);

  if (!accountSnap.exists) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const account = accountSnap.data();

  if (normalizeEmail(account.email) !== email) {
    throw new Error("ACCOUNT_EMAIL_MISMATCH");
  }

  if (account.uid !== currentUid) {
    throw new Error("CURRENT_UID_MISMATCH");
  }

  if (!oldWorkspaceSnap.exists) {
    throw new Error("OLD_WORKSPACE_NOT_FOUND");
  }

  if (normalizeEmail(oldWorkspaceSnap.data().email) !== email) {
    throw new Error("WORKSPACE_EMAIL_MISMATCH");
  }

  if (newWorkspaceSnap.exists) {
    throw new Error("NEW_WORKSPACE_ALREADY_EXISTS");
  }

  tx.update(accountRef, { uid: oldUid });
});

console.log("UID_RESTORED_SUCCESSFULLY");
console.log({
  email,
  previousUid: currentUid,
  restoredUid: oldUid
});
