
const ALLOWED_EVENTS = new Set([
  "IOS_REDIRECT_STARTED",
  "REDIRECT_RESULT_RECEIVED",
  "REDIRECT_RESULT_EMPTY",
  "CREDENTIAL_TRANSFER_STARTED",
  "CREDENTIAL_TRANSFER_SUCCESS",
  "CREDENTIAL_TRANSFER_FAILED",
  "ENTITLEMENT_REVALIDATION",
  "AUTH_STATE_CHANGED",
  "REDIRECT_PROCESSING_FAILED",
  "REDIRECT_HANDLER_STARTED",
]);

const allowedOrigins = () =>
  String(process.env.IOS_AUTH_DEBUG_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

const rateLimits = new Map();

function respond(res, status, message) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ success: status < 400, message }));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (process.env.IOS_AUTH_DEBUG_ENABLED !== "true") {
    return respond(res, 404, "DEBUG_DISABLED");
  }

  const origin = String(req.headers.origin || "").replace(/\/$/, "");

  if (!origin || !allowedOrigins().includes(origin)) {
    return respond(res, 403, "ORIGIN_NOT_ALLOWED");
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return respond(res, 405, "METHOD_NOT_ALLOWED");
  }

  const ip = String(req.headers["x-forwarded-for"] || "unknown")
    .split(",")[0]
    .trim();

  const now = Date.now();
  const previous = rateLimits.get(ip);

  if (previous && now - previous.start < 60_000 && previous.count >= 30) {
    return respond(res, 429, "RATE_LIMITED");
  }

  if (!previous || now - previous.start >= 60_000) {
    rateLimits.set(ip, { start: now, count: 1 });
  } else {
    previous.count += 1;
  }

  let body;

  try {
    body =
      typeof req.body === "string" || Buffer.isBuffer(req.body)
        ? JSON.parse(String(req.body))
        : req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid body");
    }

    if (JSON.stringify(body).length > 4096) {
      return respond(res, 413, "PAYLOAD_TOO_LARGE");
    }
  } catch {
    return respond(res, 400, "INVALID_BODY");
  }

  const event = String(body.event || "");

  if (!ALLOWED_EVENTS.has(event)) {
    return respond(res, 400, "INVALID_EVENT");
  }

  // Only allow non-sensitive diagnostic fields.
  const log = {
    timestamp: new Date().toISOString(),
    event,
    session: String(body.session || "").slice(0, 40),
    stage: String(body.stage || "").slice(0, 60),
    authApp: String(body.authApp || "").slice(0, 60),
    authDomain: String(body.authDomain || "").slice(0, 120),
    errorCode: String(body.errorCode || "").slice(0, 100),
    redirectFlag: body.redirectFlag === true,
    hasUser: body.hasUser === true,
  };

  console.log("[IOS_AUTH_DEBUG]", JSON.stringify(log));

  return respond(res, 200, "LOG_RECORDED");
}
