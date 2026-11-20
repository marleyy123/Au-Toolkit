import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { midtransPlans } from "./midtrans-plans.js";
export { midtransPlans } from "./midtrans-plans.js";
import {
  accessView,
  createAccessStore,
  getStagingDb,
  ALLOWED_PROJECT_IDS,
  parseServiceAccount,
  normalizeEmail,
} from "./staging-access-store.js";

export const usesMidtrans = (env) =>
  ALLOWED_PROJECT_IDS.includes(
    env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID,
  );

export function midtransConfig(env) {
  const credentials = parseServiceAccount(env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
  const isLocalMock =
    env.MIDTRANS_LOCAL_TEST === "true" ||
    env.NODE_ENV !== "production" ||
    env.FIREBASE_ADMIN_SERVICE_ACCOUNT === "test-only";
  const projectId =
    credentials?.project_id ||
    env.VITE_FIREBASE_PROJECT_ID ||
    env.FIREBASE_PROJECT_ID ||
    "au-toolkit-production";
  const allowTestProject =
    env.MIDTRANS_TEST_PROJECT_ID && projectId === env.MIDTRANS_TEST_PROJECT_ID;
  if (!credentials || !credentials.project_id) {
    if (!isLocalMock) throw new Error("FIREBASE_ADMIN_CONFIG_REQUIRED");
  }
  if (!ALLOWED_PROJECT_IDS.includes(projectId) && !allowTestProject)
    throw new Error("SANDBOX_REQUIRED");
  const rawMode =
    env.MIDTRANS_IS_PRODUCTION ?? env.VITE_MIDTRANS_IS_PRODUCTION ?? "false";
  if (!["true", "false"].includes(String(rawMode)))
    throw new Error("MIDTRANS_MODE_REQUIRED");

  const isProduction = String(rawMode) === "true";
  const isNetlify = env.NETLIFY === "true" || env.NETLIFY === "1";

  if (isProduction && projectId !== "au-toolkit-production")
    throw new Error("SANDBOX_REQUIRED");

  if (isNetlify && !isProduction && env.ALLOW_SANDBOX_TEST !== "true")
    throw new Error("MIDTRANS_PRODUCTION_REQUIRED");

  if (isNetlify && projectId !== "au-toolkit-production")
    throw new Error("PRODUCTION_FIREBASE_PROJECT_REQUIRED");

  if (
    isNetlify &&
    credentials?.project_id &&
    credentials.project_id !== "au-toolkit-production"
  ) {
    throw new Error("PRODUCTION_FIREBASE_PROJECT_REQUIRED");
  }

  const clean = (val) =>
    String(val || "")
      .trim()
      .replace(/^['"]|['"]$/g, "");
  const serverKey = clean(
    env.MIDTRANS_SERVER_KEY || env.VITE_MIDTRANS_SERVER_KEY,
  );
  const clientKey = clean(
    env.MIDTRANS_CLIENT_KEY || env.VITE_MIDTRANS_CLIENT_KEY,
  );
  const serverKeyPattern = isProduction
    ? /^Mid-server-[A-Za-z0-9.~_-]+$/
    : /^(?:SB-)?Mid-server-[A-Za-z0-9.~_-]+$/;

  const clientKeyPattern = isProduction
    ? /^Mid-client-[A-Za-z0-9.~_-]+$/
    : /^(?:SB-)?Mid-client-[A-Za-z0-9.~_-]+$/;

  if (!serverKeyPattern.test(serverKey) || !clientKeyPattern.test(clientKey)) {
    throw new Error(isProduction ? "MIDTRANS_KEYS_INVALID" : "SANDBOX_KEYS_REQUIRED");
  }
  if (env.ACCESS_BACKEND && env.ACCESS_BACKEND !== "firestore")
    throw new Error("FIRESTORE_ACCESS_REQUIRED");
  return { serverKey, clientKey, production: isProduction };
}

export function paymentCountry(req, env) {
  const headerCountry =
    req.headers?.["x-country"] ||
    req.headers?.["x-nf-country"] ||
    req.headers?.["x-vercel-ip-country"] ||
    req.headers?.["cf-ipcountry"];
  const value =
    env.VERCEL === "1" || env.NETLIFY === "true" || process.env.NETLIFY
      ? headerCountry
      : env.NODE_ENV !== "production" && env.MIDTRANS_LOCAL_TEST === "true"
        ? env.LANDING_DEV_COUNTRY || "ID"
        : headerCountry || "ID";
  const country = typeof value === "string" ? value.trim().toUpperCase() : "ID";
  if (!/^[A-Z]{2}$/.test(country) || ["XX", "ZZ"].includes(country))
    return "ID";
  return country;
}

const digest = (value) => createHash("sha256").update(value).digest("hex");
function validMidtransSignature(body, serverKey) {
  const signatureKey = String(body?.signature_key || "")
    .trim()
    .toLowerCase();

  if (
    !signatureKey ||
    !body?.order_id ||
    body?.status_code == null ||
    body?.gross_amount == null ||
    !serverKey
  ) {
    return false;
  }

  const expectedSignature = createHash("sha512")
    .update(
      `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`,
    )
    .digest("hex");

  const actualBuffer = Buffer.from(signatureKey, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
const lockIdForEmail = (email) => digest(normalizeEmail(email));
const terminalStates = new Set([
  "cancel",
  "cancelled",
  "deny",
  "expire",
  "failure",
  "refund",
  "partial_refund",
]);
const unresolvedOrderStates = new Set([
  "create_unknown",
  "reconciliation_required",
]);

function isPaidStatus(data) {
  if (!data || typeof data !== "object") return false;
  const status = String(data.transaction_status || "");
  const fraud = String(data.fraud_status || "");
  return (
    (status === "settlement" && (!fraud || fraud === "accept")) ||
    (status === "capture" && fraud === "accept")
  );
}

function isTerminalStatus(data) {
  if (!data || typeof data !== "object") return false;
  const status = String(data.transaction_status || "");
  return terminalStates.has(status) || status === "deny";
}

function isUnresolvedOrderState(state) {
  return unresolvedOrderStates.has(
    String(state || "")
      .trim()
      .toLowerCase(),
  );
}

function createUnknownOrderResponse(order, config) {
  return {
    success: true,
    status: "unknown",
    code: "PAYMENT_STATUS_UNKNOWN",
    message:
      "Payment status is being verified. Please wait before creating a new payment.",
    orderId: order.orderId,
    statusToken: order.statusToken || order.tokenHash,
    snapToken: order.snapToken || null,
    clientKey: config.clientKey,
    production: config.production,
    amount: order.amount,
    planId: order.planId,
    accessDays: order.accessDays,
    reconciliationRequired: true,
  };
}

function isValidOrderForMode(orderId, production) {
  const pattern = production
    ? /^au_live_[a-f0-9]{32}$/
    : /^au_sb_[a-f0-9]{32}$/;

  return typeof orderId === "string" && pattern.test(orderId);
}

function parseBody(req) {
  const raw =
    typeof req.body === "string" || Buffer.isBuffer(req.body)
      ? String(req.body)
      : JSON.stringify(req.body);
  if (!raw || Buffer.byteLength(raw) > 16384)
    throw new Error("INVALID_REQUEST");
  const body = JSON.parse(raw);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("INVALID_REQUEST");
  return body;
}

export function createMidtransHandler({
  env = process.env,
  fetchImpl = fetch,
  now = () => Date.now(),
  getDb = () => getStagingDb(env),
  getStore = (db) => createAccessStore(db, now),
  webhook = false,
} = {}) {
  const ACTIVE_ORDER_COLLECTION = "midtransActiveOrders";

  const provider = async (config, path, payload) => {
    const response = await fetchImpl(path, {
      method: payload ? "POST" : "GET",
      signal: AbortSignal.timeout(12000),
      headers: {
        Authorization:
          "Basic " + Buffer.from(config.serverKey + ":").toString("base64"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    let data = {};
    let rawText = "";
    if (typeof response.text === "function") {
      rawText = await response.text().catch(() => "");
      try {
        data = JSON.parse(rawText);
      } catch {}
    } else if (typeof response.json === "function") {
      data = await response.json().catch(() => ({}));
      try {
        rawText = JSON.stringify(data);
      } catch {}
    }
    if (response.status === 401 || String(data.status_code) === "401") {
      console.error("[MIDTRANS_AUTH_ERROR_DETAIL]", {
        status: response.status,
        rawText,
        data,
        path,
        isProduction: config.production,
        serverKeyPrefix: config.serverKey ? config.serverKey.substring(0, 15) + "..." : "empty",
      });
      const envName = String(
        env.MIDTRANS_IS_PRODUCTION ||
          env.VITE_MIDTRANS_IS_PRODUCTION ||
          "false",
      );
      throw new Error(
        envName === "true" ? "MIDTRANS_AUTH_FAILED" : "SANDBOX_AUTH_FAILED",
      );
    }
    if (response.status === 404 || String(data.status_code) === "404")
      return null;
    if (!response.ok) throw new Error("PAYMENT_PROVIDER_ERROR");
    return data;
  };

  async function releaseLock(db, email, orderId = null) {
    if (!email) return;
    const lockRef = db
      .collection(ACTIVE_ORDER_COLLECTION)
      .doc(lockIdForEmail(email));
    await db.runTransaction(async (tx) => {
      const current = await tx.get(lockRef);
      if (!current.exists) return;
      const data = current.data();
      if (orderId && data.orderId && data.orderId !== orderId) return;
      tx.delete(lockRef);
    });
  }

  async function getProviderStatus(order, config) {
    if (!isValidOrderForMode(order?.orderId, config.production)) {
      throw new Error("MIDTRANS_ORDER_MODE_MISMATCH");
    }

    const apiBase = config.production
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";
    const snapBase = config.production
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";

    let data = await provider(config, `${apiBase}/v2/${order.orderId}/status`);

    if (!data && order.snapToken) {
      data = await provider(
        config,
        `${snapBase}/snap/v1/transactions/${order.snapToken}/status`,
      );
    }

    return data;
  }

  async function retainCreateUnknown(
    db,
    lockRef,
    orderId,
    email,
    planId,
    reservationId,
    error,
  ) {
    const lastError = /timeout|network|abort/i.test(
      String(error?.message || error || ""),
    )
      ? "TIMEOUT"
      : "PAYMENT_PROVIDER_ERROR";
    const updatedAt = new Date(now()).toISOString();
    await db.runTransaction(async (tx) => {
      const current = await tx.get(lockRef);
      if (!current.exists) return;
      const currentData = current.data();
      if (
        currentData.reservationId &&
        currentData.reservationId !== reservationId
      )
        return;
      tx.set(lockRef, {
        ...(currentData || {}),
        email,
        reservationId,
        orderId,
        planId,
        state: "create_unknown",
        leaseUntil: now() + 86400000,
        lastError,
        lastErrorAt: updatedAt,
        updatedAt,
      });
    });
    await db
      .collection("midtransOrders")
      .doc(orderId)
      .update({
        state: "create_unknown",
        reconciliationRequired: true,
        lastError,
        lastErrorAt: updatedAt,
        updatedAt,
      })
      .catch(() => {});
  }

  async function syncPurchaseToSheets(orderRef, saved, env) {
    const sheetScriptUrl = String(env.GOOGLE_SHEETS_SCRIPT_URL || "").trim();
    const sheetSecret = String(env.APPS_SCRIPT_SHARED_SECRET || "").trim();
    if (!sheetScriptUrl || !sheetSecret) return { synced: true, skipped: true };
    const snapshot = await orderRef.get();
    const current = snapshot.exists ? snapshot.data() : {};
    const syncState = current.sheetSync || {
      status: "pending",
      attempts: 0,
      lastAttemptAt: null,
    };
    const attempts = Number(syncState.attempts || 0);
    if (syncState.status === "synced" || attempts >= 3)
      return { synced: syncState.status === "synced", skipped: true };
    const response = await fetchImpl(sheetScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        action: "mirrorFirestorePurchase",
        serverSecret: sheetSecret,
        purchase: saved.purchase,
        account: saved.account,
      }),
    });
    let report = null;
    try {
      report = await response.json();
    } catch {}
    const ok = !!(response.ok && report && report.success === true);
    await orderRef.update({
      sheetSync: {
        status: ok ? "synced" : "failed",
        attempts: attempts + 1,
        lastAttemptAt: new Date(now()).toISOString(),
        purchaseRef: saved.purchase?.ref || null,
        lastError: ok
          ? null
          : report && typeof report.reason === "string"
            ? report.reason
            : "SHEET_REPORT_FAILED",
      },
      updatedAt: new Date(now()).toISOString(),
    });
    return {
      synced: ok,
      lastError: ok
        ? null
        : report && report.reason
          ? report.reason
          : "SHEET_REPORT_FAILED",
    };
  }

  async function markOrderPaid(db, order, data, store, config, orderRef) {
    const purchaseAt =
      typeof data.settlement_time === "string" &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data.settlement_time)
        ? new Date(
            data.settlement_time.replace(" ", "T") + "+07:00",
          ).toISOString()
        : typeof data.transaction_time === "string" &&
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(data.transaction_time)
          ? new Date(
              data.transaction_time.replace(" ", "T") + "+07:00",
            ).toISOString()
          : order.createdAt;

    const saved = await store.ingest(
      {
        ref: order.orderId,
        email: order.email,
        name: "",
        productId: "midtrans-" + order.planId,
        planId: order.planId,
        accessDays: order.accessDays,
        amount: order.amount,
        currency: "IDR",
        quantity: 1,
        purchasedAt: purchaseAt,
        source: order.orderId.startsWith("au_live_")
          ? "midtrans-production"
          : "midtrans-sandbox",
      },
      null,
      {
        reactivateInactive: true,
      },
    );

    await orderRef.update({
      state: "paid",
      transactionId: data.transaction_id || order.transactionId,
      transactionTime: data.transaction_time || null,
      settlementTime: data.settlement_time || null,
      purchasedAt: purchaseAt,
      updatedAt: new Date(now()).toISOString(),
    });
    await db.runTransaction(async (tx) => {
      const lockRef = db
        .collection(ACTIVE_ORDER_COLLECTION)
        .doc(lockIdForEmail(order.email));
      const current = await tx.get(lockRef);
      if (!current.exists) return;
      const currentData = current.data();
      if (currentData.orderId && currentData.orderId !== order.orderId) return;
      tx.set(lockRef, {
        ...currentData,
        email: order.email,
        orderId: order.orderId,
        planId: order.planId,
        state: "paid",
        updatedAt: new Date(now()).toISOString(),
      });
    });

    const sync = await syncPurchaseToSheets(orderRef, saved, env);
    const access = accessView(saved.account, now());
    return {
      status: "paid",
      accessActivated: access.accessGranted,
      reason: access.reason,
      sync,
    };
  }

  return async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    const reply = (code, data) => {
      res.statusCode = code;
      res.end(JSON.stringify(data));
    };
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return reply(405, { success: false, reason: "METHOD_NOT_ALLOWED" });
    }

    let config;
    try {
      config = midtransConfig(env);
    } catch (error) {
      return reply(503, { success: false, reason: error.message });
    }

    let body;
    try {
      body = parseBody(req);
    } catch {
      return reply(400, { success: false, reason: "INVALID_REQUEST" });
    }

    if (!webhook && req.headers.origin) {
      const allowed = String(env.ALLOWED_ORIGINS || env.APP_URL || "")
        .split(",")
        .map((v) => v.trim());
      const host = String(req.headers.host || "");
      if (
        (env.VERCEL === "1" || env.NETLIFY === "true" || process.env.NETLIFY) &&
        /^[a-zA-Z0-9.-]+(?::\d+)?$/.test(host)
      )
        allowed.push("https://" + host);
      if (
        env.NODE_ENV !== "production" &&
        env.MIDTRANS_LOCAL_TEST === "true" &&
        /^(localhost|127\.0\.0\.1)(?::\d+)?$/.test(host)
      )
        allowed.push("http://" + host);
      if (!allowed.includes(req.headers.origin))
        return reply(403, { success: false, reason: "ORIGIN_BLOCKED" });
    }

    if (
      webhook &&
      (!isValidOrderForMode(body.order_id, config.production) ||
        !validMidtransSignature(body, config.serverKey))
    ) {
      return reply(401, { success: false, reason: "INVALID_SIGNATURE" });
    }

    if (
      !webhook &&
      body.action === "create" &&
      env.AU_MAINTENANCE_MODE === "true"
    ) {
      return reply(503, {
        success: false,
        reason: "MAINTENANCE_MODE",
        message:
          "Pembelian sementara dinonaktifkan karena pemeliharaan sistem.",
      });
    }

    try {
      const db = getDb();
      const orders = db.collection("midtransOrders");
      const activeOrders = db.collection(ACTIVE_ORDER_COLLECTION);

      if (!webhook && body.action === "create") {
        const email = normalizeEmail(body.email);
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return reply(400, { success: false, reason: "EMAIL_REQUIRED" });
        const country = paymentCountry(req, env);
        const explicitCountry =
          typeof req.headers?.["x-vercel-ip-country"] === "string"
            ? req.headers["x-vercel-ip-country"].trim().toUpperCase()
            : "";
        if (
          explicitCountry &&
          (!/^[A-Z]{2}$/.test(explicitCountry) ||
            ["XX", "ZZ"].includes(explicitCountry))
        ) {
          return reply(503, { success: false, reason: "REGION_UNAVAILABLE" });
        }
        const plan = midtransPlans(country, env).find(
          (p) => p.id === body.planId && p.available,
        );
        if (!plan)
          return reply(400, { success: false, reason: "PLAN_UNAVAILABLE" });

        const lockRef = activeOrders.doc(lockIdForEmail(email));
        const lockSnapshot = await lockRef.get();
        let existingLock = lockSnapshot.exists ? lockSnapshot.data() : null;

        // Order lama yang sudah paid tidak boleh menghalangi checkout baru.
        if (existingLock?.orderId && existingLock.state === "paid") {
          await releaseLock(db, email, existingLock.orderId);
          existingLock = null;
        }
        if (existingLock && existingLock.orderId) {
          const orderRef = orders.doc(existingLock.orderId);
          const currentOrder = (await orderRef.get()).exists
            ? (await orderRef.get()).data()
            : null;
          if (currentOrder) {
            if (!isValidOrderForMode(currentOrder.orderId, config.production)) {
              return reply(409, {
                success: false,
                reason: "LEGACY_SANDBOX_ORDER_UNSUPPORTED",
                existingOrderId: currentOrder.orderId,
              });
            }
            if (currentOrder.planId !== plan.id) {
              return reply(409, {
                success: false,
                reason: "ACTIVE_ORDER_EXISTS",
                existingOrderId: currentOrder.orderId,
                existingPlanId: currentOrder.planId,
                amount: currentOrder.amount,
                accessDays: currentOrder.accessDays,
              });
            }
            if (isUnresolvedOrderState(currentOrder.state)) {
              return reply(
                202,
                createUnknownOrderResponse(currentOrder, config),
              );
            }
            if (
              ["created", "reserved", "pending", "active"].includes(
                String(currentOrder.state || "pending"),
              )
            ) {
              if (currentOrder.snapToken) {
                return reply(200, {
                  success: true,
                  orderId: currentOrder.orderId,
                  statusToken: currentOrder.statusToken || currentOrder.tokenHash,
                  snapToken: currentOrder.snapToken,
                  clientKey: config.clientKey,
                  production: config.production,
                  amount: currentOrder.amount,
                  planId: currentOrder.planId,
                  accessDays: currentOrder.accessDays,
                  reused: true,
                  status: currentOrder.state || "pending",
                });
              } else {
                await releaseLock(db, email, existingLock.orderId);
                existingLock = null;
              }
            }
          }
        }

        const lockState = String(existingLock?.state || "");
        const leaseUntil = Number(existingLock?.leaseUntil || 0);

        if (
          existingLock &&
          ["reserved", "created"].includes(lockState) &&
          leaseUntil > now()
        ) {
          return reply(429, {
            success: false,
            reason: "CHECKOUT_LOCK_HELD",
          });
        }

        // Bersihkan reservasi lama yang sudah kedaluwarsa.
        if (existingLock && leaseUntil <= now()) {
          await db.runTransaction(async (tx) => {
            const current = await tx.get(lockRef);

            if (!current.exists) return;

            const data = current.data();

            if (Number(data.leaseUntil || 0) <= now() || !data.orderId) {
              tx.delete(lockRef);
            }
          });

          existingLock = null;
        }

        // Lock tanpa orderId hanya menahan bila leaseUntil masih aktif
        if (existingLock && !existingLock.orderId) {
          if (leaseUntil > now()) {
            return reply(429, {
              success: false,
              reason: "CHECKOUT_LOCK_HELD",
            });
          }
          await releaseLock(db, email);
          existingLock = null;
        }

        if (existingLock && existingLock.orderId) {
          const orderRef = orders.doc(existingLock.orderId);
          const currentOrder = (await orderRef.get()).exists
            ? (await orderRef.get()).data()
            : null;
          if (!currentOrder) {
            await releaseLock(db, email, existingLock.orderId);
            existingLock = null;
          } else {
            if (!isValidOrderForMode(currentOrder.orderId, config.production)) {
              return reply(409, {
                success: false,
                reason: "LEGACY_SANDBOX_ORDER_UNSUPPORTED",
                existingOrderId: currentOrder.orderId,
              });
            }
            if (currentOrder.planId !== plan.id) {
              return reply(409, {
                success: false,
                reason: "ACTIVE_ORDER_EXISTS",
                existingOrderId: currentOrder.orderId,
                existingPlanId: currentOrder.planId,
                amount: currentOrder.amount,
                accessDays: currentOrder.accessDays,
              });
            }
            if (
              ["created", "reserved", "pending", "active"].includes(
                String(currentOrder.state || "pending"),
              )
            ) {
              return reply(200, {
                success: true,
                orderId: currentOrder.orderId,
                statusToken: currentOrder.statusToken || currentOrder.tokenHash,
                snapToken: currentOrder.snapToken,
                clientKey: config.clientKey,
                production: config.production,
                amount: currentOrder.amount,
                planId: currentOrder.planId,
                accessDays: currentOrder.accessDays,
                reused: true,
                status: currentOrder.state || "pending",
              });
            }
            const providerStatus = await getProviderStatus(
              currentOrder,
              config,
            );
            if (!providerStatus)
              return reply(200, {
                success: true,
                orderId: currentOrder.orderId,
                statusToken: currentOrder.statusToken || currentOrder.tokenHash,
                snapToken: currentOrder.snapToken,
                clientKey: config.clientKey,
                production: config.production,
                amount: currentOrder.amount,
                planId: currentOrder.planId,
                accessDays: currentOrder.accessDays,
                reused: true,
                status: currentOrder.state || "pending",
              });
            if (isPaidStatus(providerStatus)) {
              const result = await markOrderPaid(
                db,
                currentOrder,
                providerStatus,
                getStore(db),
                config,
                orderRef,
              );
              return reply(200, { success: true, status: "paid", ...result });
            }
            if (isTerminalStatus(providerStatus)) {
              await orderRef.update({
                state: String(providerStatus.transaction_status || "cancel"),
                updatedAt: new Date(now()).toISOString(),
              });
              await releaseLock(db, email, existingLock.orderId);
              existingLock = null;
            } else {
              return reply(200, {
                success: true,
                orderId: currentOrder.orderId,
                statusToken: currentOrder.statusToken || currentOrder.tokenHash,
                snapToken: currentOrder.snapToken,
                clientKey: config.clientKey,
                production: config.production,
                amount: currentOrder.amount,
                planId: currentOrder.planId,
                accessDays: currentOrder.accessDays,
                reused: true,
                status: "pending",
              });
            }
          }
        }

        const ip = String(
          env.VERCEL === "1" || env.NETLIFY === "true" || process.env.NETLIFY
            ? req.headers["client-ip"] ||
                req.headers["x-forwarded-for"] ||
                req.headers["x-vercel-forwarded-for"] ||
                "unknown"
            : req.socket?.remoteAddress || "local",
        )
          .split(",")[0]
          .trim();
        const limits = [
          db.collection("midtransLimits").doc("email_" + digest(email)),
          db.collection("midtransLimits").doc("ip_" + digest(ip)),
        ];
        await db.runTransaction(async (tx) => {
          const snapshots = await Promise.all(limits.map((ref) => tx.get(ref)));

          console.log("[CHECKOUT RATE LIMIT DEBUG]", {
            email,
            ip,
            limits: snapshots.map((s) => ({
              id: s.id,
              exists: s.exists,
              nextAt: s.exists ? s.data().nextAt : null,
              remainingMs: s.exists ? s.data().nextAt - now() : 0,
            })),
          });

          const blockedLimits = snapshots
            .filter((s) => s.exists && s.data().nextAt > now())
            .map((s) => ({
              id: s.id,
              remainingMs: s.data().nextAt - now(),
            }));

          if (blockedLimits.length) {
            console.error("[CHECKOUT_BLOCKED]", blockedLimits);
            throw new Error(
              "CHECKOUT_RATE_LIMIT:" + JSON.stringify(blockedLimits),
            );
          }
          limits.forEach((ref, i) =>
            tx.set(ref, {
              nextAt: now() + (i === 0 ? 30000 : 10000),
              expiresAt: new Date(now() + 86400000),
            }),
          );
        });

        const reservationId = randomUUID();
        const reservation = await db.runTransaction(async (tx) => {
          const current = await tx.get(lockRef);
          const currentData = current.exists ? current.data() : null;
          if (currentData && currentData.orderId)
            return { blocked: true, lock: currentData };
          if (
            currentData &&
            currentData.leaseUntil &&
            currentData.leaseUntil > now()
          )
            return { blocked: true, lock: currentData };
          tx.set(lockRef, {
            email,
            reservationId,
            orderId: null,
            planId: plan.id,
            state: "reserved",
            leaseUntil: now() + 60000,
            createdAt: new Date(now()).toISOString(),
            updatedAt: new Date(now()).toISOString(),
          });
          return { blocked: false, reservationId };
        });

        if (reservation.blocked) {
          const lockData = reservation.lock || {};
          if (lockData.orderId) {
            const pendingOrder = (
              await orders.doc(lockData.orderId).get()
            ).data();
            if (pendingOrder) {
              if (
                !isValidOrderForMode(pendingOrder.orderId, config.production)
              ) {
                return reply(409, {
                  success: false,
                  reason: "LEGACY_SANDBOX_ORDER_UNSUPPORTED",
                  existingOrderId: pendingOrder.orderId,
                });
              }
              if (pendingOrder.planId === plan.id) {
                if (isUnresolvedOrderState(pendingOrder.state))
                  return reply(
                    202,
                    createUnknownOrderResponse(pendingOrder, config),
                  );
                return reply(200, {
                  success: true,
                  orderId: pendingOrder.orderId,
                  statusToken:
                    pendingOrder.statusToken || pendingOrder.tokenHash,
                  snapToken: pendingOrder.snapToken,
                  clientKey: config.clientKey,
                  production: config.production,
                  amount: pendingOrder.amount,
                  planId: pendingOrder.planId,
                  accessDays: pendingOrder.accessDays,
                  reused: true,
                  status: pendingOrder.state || "pending",
                });
              }
              return reply(409, {
                success: false,
                reason: "ACTIVE_ORDER_EXISTS",
                existingOrderId: pendingOrder.orderId,
                existingPlanId: pendingOrder.planId,
                amount: pendingOrder.amount,
                accessDays: pendingOrder.accessDays,
              });
            }
          }
          return reply(429, {
            success: false,
            reason: "CHECKOUT_RESERVATION_HELD",
          });
        }

        const orderId =
          (config.production ? "au_live_" : "au_sb_") +
          randomUUID().replaceAll("-", "");
        const token = randomBytes(32).toString("hex");
        const order = {
          orderId,
          email,
          planId: plan.id,
          amount: plan.amount,
          country,
          accessDays: plan.accessDays,
          createdAt: new Date(now()).toISOString(),
          updatedAt: new Date(now()).toISOString(),
          statusToken: token,
          tokenHash: digest(token),
          state: "created",
          reservationId,
          ...(typeof body.uid === "string" && body.uid.trim()
            ? { uid: body.uid.trim() }
            : {}),
        };

        await orders.doc(orderId).set(order);
        try {
          const data = await provider(
            config,
            `${config.production ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com"}/snap/v1/transactions`,
            {
              transaction_details: {
                order_id: orderId,
                gross_amount: plan.amount,
              },
              item_details: [
                {
                  id: "au-" + plan.id,
                  price: plan.amount,
                  quantity: 1,
                  name: plan.title,
                },
              ],
              customer_details: { email },
              credit_card: { secure: true },
              expiry: { unit: "hours", duration: 24 },
            },
          );
          if (typeof data?.token !== "string" || !data.token)
            throw new Error("PAYMENT_PROVIDER_ERROR");
          await orders.doc(orderId).update({
            snapToken: data.token,
            state: "pending",
            updatedAt: new Date(now()).toISOString(),
          });
          await db.runTransaction(async (tx) => {
            const current = await tx.get(lockRef);
            if (
              current.exists &&
              current.data().reservationId === reservationId
            ) {
              tx.set(lockRef, {
                email,
                reservationId,
                orderId,
                planId: plan.id,
                state: "active",
                leaseUntil: now() + 86400000,
                createdAt: order.createdAt,
                updatedAt: new Date(now()).toISOString(),
              });
            }
          });
          return reply(200, {
            success: true,
            orderId,
            statusToken: token,
            snapToken: data.token,
            clientKey: config.clientKey,
            production: config.production,
            amount: plan.amount,
            planId: plan.id,
            accessDays: plan.accessDays,
          });
        } catch (error) {
          const message = String(error?.message || error || "");
          const isAmbiguousCreateFailure =
            /timeout|network|abort|fetch/i.test(message) ||
            error?.name === "AbortError";
          if (!isAmbiguousCreateFailure) {
            await releaseLock(db, email, orderId);
            await orders.doc(orderId).update({
              state: "failed",
              updatedAt: new Date(now()).toISOString(),
              error: message,
            }).catch(() => {});
            throw error;
          }
          await retainCreateUnknown(
            db,
            lockRef,
            orderId,
            email,
            plan.id,
            reservationId,
            error,
          );
          return reply(
            202,
            createUnknownOrderResponse(
              {
                ...order,
                state: "create_unknown",
                reconciliationRequired: true,
              },
              config,
            ),
          );
        }
      }

      const orderId = webhook ? body.order_id : body.orderId;
      if (
        (!webhook && body.action !== "status" && body.action !== "cancel") ||
        !isValidOrderForMode(orderId, config.production)
      )
        return reply(400, { success: false, reason: "INVALID_ORDER" });
      const ref = orders.doc(orderId);
      const snapshot = await ref.get();
      const order = snapshot.exists ? snapshot.data() : null;
      if (!order)
        return reply(404, { success: false, reason: "ORDER_NOT_FOUND" });
      if (
        !webhook &&
        (typeof body.statusToken !== "string" ||
          body.statusToken.length !== 64 ||
          digest(body.statusToken) !== order.tokenHash)
      )
        return reply(404, { success: false, reason: "ORDER_NOT_FOUND" });

      if (body.action === "cancel") {
        if (isUnresolvedOrderState(order.state)) {
          const providerStatus = await getProviderStatus(order, config);
          if (!providerStatus)
            return reply(202, createUnknownOrderResponse(order, config));
          if (isPaidStatus(providerStatus)) {
            const result = await markOrderPaid(
              db,
              order,
              providerStatus,
              getStore(db),
              config,
              ref,
            );
            return reply(200, { success: true, status: "paid", ...result });
          }
          if (isTerminalStatus(providerStatus)) {
            await ref.update({
              state: String(providerStatus.transaction_status || "cancel"),
              updatedAt: new Date(now()).toISOString(),
            });
            await releaseLock(db, order.email, order.orderId);
            return reply(200, {
              success: true,
              status: String(providerStatus.transaction_status || "cancel"),
              cancelled: true,
              accessActivated: false,
            });
          }
          return reply(202, createUnknownOrderResponse(order, config));
        }

        const providerStatus = await getProviderStatus(order, config);
        if (!providerStatus) {
          await ref.update({
            state: "cancel",
            updatedAt: new Date(now()).toISOString(),
          });
          await releaseLock(db, order.email, order.orderId);
          return reply(200, {
            success: true,
            status: "cancel",
            cancelled: true,
            accessActivated: false,
          });
        }
        if (isPaidStatus(providerStatus)) {
          const result = await markOrderPaid(
            db,
            order,
            providerStatus,
            getStore(db),
            config,
            ref,
          );
          return reply(200, { success: true, status: "paid", ...result });
        }
        if (isTerminalStatus(providerStatus)) {
          await ref.update({
            state: String(providerStatus.transaction_status || "cancel"),
            updatedAt: new Date(now()).toISOString(),
          });
          await releaseLock(db, order.email, order.orderId);
          return reply(200, {
            success: true,
            status: String(providerStatus.transaction_status || "cancel"),
            cancelled: true,
            accessActivated: false,
          });
        }

        let cancelRequest = null;
        try {
          cancelRequest = await provider(
            config,
            `${config.production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"}/v2/${order.orderId}/cancel`,
            { cancellation_reason: "user_cancelled" },
          );
        } catch (e) {
          console.warn("[MIDTRANS_CANCEL_WARN]", e?.message);
        }

        const refreshed = await getProviderStatus(order, config);

        if (refreshed && isPaidStatus(refreshed)) {
          const result = await markOrderPaid(
            db,
            order,
            refreshed,
            getStore(db),
            config,
            ref,
          );
          return reply(200, { success: true, status: "paid", ...result });
        }

        const finalStatus = String(
          cancelRequest?.transaction_status ||
            (isTerminalStatus(refreshed) ? refreshed?.transaction_status : "cancel"),
        );
        await ref.update({
          state: finalStatus,
          updatedAt: new Date(now()).toISOString(),
        });
        await releaseLock(db, order.email, order.orderId);
        return reply(200, {
          success: true,
          status: finalStatus,
          cancelled: true,
          accessActivated: false,
        });
      }

      if (order.state === "paid") {
        const access = accessView(
          await getStore(db).getAccount(order.email),
          now(),
        );
        const current = (await ref.get()).data();
        const syncState = current.sheetSync || {
          status: "pending",
          attempts: 0,
          lastAttemptAt: null,
        };
        if (
          syncState.status !== "synced" &&
          Number(syncState.attempts || 0) < 3
        ) {
          const retry = await syncPurchaseToSheets(
            ref,
            {
              purchase: { ref: order.orderId, email: order.email },
              account: await getStore(db).getAccount(order.email),
            },
            env,
          );
          if (retry && retry.synced === true)
            return reply(200, {
              success: true,
              status: "paid",
              accessActivated: access.accessGranted,
              reason: access.reason,
              sheetSync: "synced",
            });
        }
        return reply(200, {
          success: true,
          status: "paid",
          accessActivated: access.accessGranted,
          reason: access.reason,
        });
      }

      const data = await getProviderStatus(order, config);
      if (
        order.state === "create_unknown" ||
        order.state === "reconciliation_required"
      ) {
        if (!data) return reply(202, createUnknownOrderResponse(order, config));
        if (isPaidStatus(data)) {
          if (
            !data.transaction_id ||
            !["200"].includes(String(data.status_code))
          )
            throw new Error("PAYMENT_VERIFICATION_FAILED");
          const result = await markOrderPaid(
            db,
            order,
            data,
            getStore(db),
            config,
            ref,
          );
          return reply(200, { success: true, status: "paid", ...result });
        }
        if (isTerminalStatus(data)) {
          await ref.update({
            state: String(data.transaction_status || "cancel"),
            updatedAt: new Date(now()).toISOString(),
          });
          await releaseLock(db, order.email, order.orderId);
          return reply(200, {
            success: true,
            status: String(data.transaction_status || "cancel"),
            accessActivated: false,
            cancelled: true,
          });
        }
        return reply(202, createUnknownOrderResponse(order, config));
      }
      if (!data)
        return reply(200, {
          success: true,
          status: "pending",
          accessActivated: false,
        });

      const rawGross = Number(data.gross_amount);
      const originalAmount = Number(
        data.extra_info?.gross_amount_info?.original_amount ??
          data.metadata?.extra_info?.gross_amount_info?.original_amount ??
          rawGross,
      );
      const matchesAmount =
        rawGross === order.amount || originalAmount === order.amount;
      if (
        data.order_id !== orderId ||
        !matchesAmount ||
        data.currency !== "IDR"
      )
        throw new Error("PAYMENT_VERIFICATION_FAILED");

      if (isPaidStatus(data)) {
        if (!data.transaction_id || !["200"].includes(String(data.status_code)))
          throw new Error("PAYMENT_VERIFICATION_FAILED");
        const result = await markOrderPaid(
          db,
          order,
          data,
          getStore(db),
          config,
          ref,
        );
        return reply(200, { success: true, status: "paid", ...result });
      }

      const status = [
        "deny",
        "cancel",
        "expire",
        "failure",
        "refund",
        "partial_refund",
      ].includes(String(data.transaction_status || ""))
        ? String(data.transaction_status)
        : "pending";
      await ref.update({
        state: status,
        updatedAt: new Date(now()).toISOString(),
      });
      if (
        [
          "deny",
          "cancel",
          "expire",
          "failure",
          "refund",
          "partial_refund",
        ].includes(status)
      ) {
        await releaseLock(db, order.email, order.orderId);
      }
      return reply(200, { success: true, status, accessActivated: false });
    } catch (error) {
      console.error("[MIDTRANS_CHECKOUT_ERROR]", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        status: error?.status,
        cause: error?.cause?.message,
        stack: error?.stack,
      });

      const isRateLimit = String(error?.message || "").startsWith("CHECKOUT_RATE_LIMIT");
      const reason = isRateLimit
        ? "CHECKOUT_RATE_LIMIT"
        : [
            "REGION_UNAVAILABLE",
            "PAYMENT_VERIFICATION_FAILED",
            "PAYMENT_PROVIDER_ERROR",
            "MIDTRANS_AUTH_FAILED",
            "SANDBOX_AUTH_FAILED",
            "MIDTRANS_PRODUCTION_REQUIRED",
            "PRODUCTION_FIREBASE_PROJECT_REQUIRED",
            "LEGACY_SANDBOX_ORDER_UNSUPPORTED",
            "MIDTRANS_ORDER_MODE_MISMATCH",
            "FIREBASE_ADMIN_CONFIG_REQUIRED",
            "STAGING_CONFIG_REQUIRED",
            "SANDBOX_REQUIRED",
            "SANDBOX_KEYS_REQUIRED",
            "FIRESTORE_ACCESS_REQUIRED",
            "ACTIVE_ORDER_EXISTS",
            "CANCEL_PENDING",
          ].includes(error.message)
            ? error.message
            : "PAYMENT_SERVICE_UNAVAILABLE";

      const code =
        reason === "CHECKOUT_RATE_LIMIT"
          ? 429
          : reason === "ACTIVE_ORDER_EXISTS" ||
              reason === "CANCEL_PENDING" ||
              reason === "LEGACY_SANDBOX_ORDER_UNSUPPORTED"
            ? 409
            : reason === "SANDBOX_AUTH_FAILED"
              ? 401
              : 503;

      return reply(code, { success: false, reason });
    }
  };
}
