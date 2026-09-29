import chromium from '@sparticuz/chromium-min';
import { chromium as playwrightChromium } from 'playwright-core';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_PROJECT_ID = 'gen-lang-client-0839250297';
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);
const INTERNAL_MEDIA_PREFIX = 'https://au-toolkit-export.local/media/';
const CHROMIUM_VERSION = '153.0.0';

function getChromiumPackUrl() {
  const architecture = process.arch === 'arm64' ? 'arm64' : 'x64';
  return `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.${architecture}.tar`;
}
const ALLOWED_PREVIEWS = new Set([
  'twitter',
  'instagram-feed',
  'instagram-story',
  'instagram-story-reply',
  'instagram-story-viewers',
  'instagram-profile',
  'instagram-live',
  'instagram-notes',
  'instagram-activity',
  'instagram-dm',
  'instagram-dm-inbox',
  'instagram-feed-comments',
  'whatsapp-chat',
  'whatsapp-call',
  'whatsapp-status',
  'whatsapp-viewers',
  'tiktok-profile',
  'tiktok-feed-live',
  'tiktok-fyp',
  'ios-lockscreen',
  'line-chat',
  'notes',
  'push-notification',
  'spotify-card',
]);

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function verifyFirebaseToken(authorization) {
  if (!authorization?.startsWith('Bearer ')) throw new Error('AUTH_REQUIRED');
  const token = authorization.slice('Bearer '.length).trim();
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer: FIREBASE_ISSUER,
    audience: FIREBASE_PROJECT_ID,
    algorithms: ['RS256'],
  });
  const uid = String(payload.user_id || payload.sub || '');
  const email = String(payload.email || '').trim().toLowerCase();
  if (!uid || !email) throw new Error('INVALID_FIREBASE_TOKEN');
  return { uid, email };
}

function validatePayload(payload) {
  if (!payload || payload.version !== 1) throw new Error('INVALID_EXPORT_PAYLOAD');
  if (!ALLOWED_PREVIEWS.has(payload.previewKey)) throw new Error('INVALID_PREVIEW_KEY');
  const width = Number(payload.canonicalWidth);
  const height = Number(payload.canonicalHeight);
  const scale = Number(payload.scale);
  if (!Number.isInteger(width) || width < 100 || width > 1200) throw new Error('INVALID_CANONICAL_WIDTH');
  if (!Number.isInteger(height) || height < 100 || height > 2400) throw new Error('INVALID_CANONICAL_HEIGHT');
  if (![1, 2, 3].includes(scale)) throw new Error('INVALID_EXPORT_SCALE');
  if (!['png', 'jpeg'].includes(payload.format)) throw new Error('INVALID_EXPORT_FORMAT');
  if (String(payload.fontCss || '').length > 1200) throw new Error('INVALID_FONT_STACK');
  const expected = {
    '1:1': [380, 380],
    '4:5': [380, 475],
    '9:16': [380, 676],
  }[payload.ratio];
  if (expected && (width !== expected[0] || height !== expected[1])) {
    throw new Error('RATIO_GEOMETRY_MISMATCH');
  }
  return { width, height, scale };
}

async function verifyBuyerEntitlement(origin, authorization, user, device) {
  const response = await fetch(`${origin}/api/verify-buyer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      Origin: origin,
    },
    body: JSON.stringify({
      action: 'validateAccess',
      email: user.email,
      deviceType: device?.deviceType,
      deviceId: device?.deviceId,
      deviceLabel: device?.deviceLabel,
    }),
    redirect: 'follow',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !(body?.accessGranted === true || body?.allowed === true || body?.isValid === true)) {
    const error = new Error('BUYER_ACCESS_REQUIRED');
    error.status = response.status;
    error.details = body?.reason || body?.status || body?.error || body?.message || `HTTP_${response.status}`;
    throw error;
  }
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Origin': new URL(request.url).origin,
        Vary: 'Origin',
      },
    });
  }
  if (request.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });

  const requestOrigin = String(request.headers.get('origin') || '').replace(/\/$/, '');
  const siteOrigin = new URL(request.url).origin;
  if (!requestOrigin || requestOrigin !== siteOrigin) {
    return json(403, { error: 'ORIGIN_NOT_ALLOWED' });
  }

  const authorization = request.headers.get('authorization') || '';
  let user;
  try {
    user = await verifyFirebaseToken(authorization);
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : 'INVALID_FIREBASE_TOKEN' });
  }

  let payload;
  const media = new Map();
  try {
    const form = await request.formData();
    payload = JSON.parse(String(form.get('payload') || ''));
    validatePayload(payload);
    const mediaFiles = form.getAll('media');
    for (const entry of mediaFiles) {
      if (!(entry instanceof File)) continue;
      if (!entry.name.startsWith('media-') || entry.size <= 0) throw new Error('INVALID_MEDIA_FILE');
      if (entry.size > 4_000_000) throw new Error('MEDIA_FILE_TOO_LARGE');
      media.set(entry.name, {
        bytes: Buffer.from(await entry.arrayBuffer()),
        type: entry.type || 'application/octet-stream',
      });
    }
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : 'INVALID_EXPORT_PAYLOAD' });
  }

  try {
    await verifyBuyerEntitlement(siteOrigin, authorization, user, payload.device);
  } catch (error) {
    const upstreamStatus = Number(error?.status || 0);
    const infrastructureFailure = upstreamStatus >= 500 || upstreamStatus === 0;
    console.error('[export-render] Buyer verification failed:', {
      upstreamStatus: upstreamStatus || null,
      reason: error?.details || (error instanceof Error ? error.message : 'ACCESS_DENIED'),
    });
    return json(infrastructureFailure ? 502 : 403, {
      error: infrastructureFailure ? 'BUYER_VERIFICATION_UNAVAILABLE' : 'BUYER_ACCESS_REQUIRED',
      upstreamStatus: upstreamStatus || null,
      reason: error?.details || (error instanceof Error ? error.message : 'ACCESS_DENIED'),
    });
  }

  const { width, height, scale } = validatePayload(payload);
  let browser;
  let stage = 'chromium-pack';
  const chromiumPackUrl = getChromiumPackUrl();
  const failedResources = [];
  try {
    chromium.setGraphicsMode = false;
    const executablePath = await chromium.executablePath(chromiumPackUrl);

    stage = 'chromium-launch';
    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    stage = 'browser-context';
    const browserContext = await browser.newContext({
      viewport: {
        width,
        height,
      },
      deviceScaleFactor: scale,
      isMobile: false,
      hasTouch: false,
    });
    const page = await browserContext.newPage();
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedResources.push({ status: response.status(), url: response.url() });
      }
    });
    await page.route(`${INTERNAL_MEDIA_PREFIX}**`, async (route) => {
      const url = route.request().url();
      if (!url.startsWith(INTERNAL_MEDIA_PREFIX)) {
        await route.continue();
        return;
      }
      const id = decodeURIComponent(url.slice(INTERNAL_MEDIA_PREFIX.length));
      const asset = media.get(id);
      if (!asset) {
        await route.fulfill({ status: 404, body: 'Missing export media' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: asset.type,
        body: asset.bytes,
        headers: { 'Cache-Control': 'no-store' },
      });
    });

    await page.addInitScript((privatePayload) => {
      Object.defineProperty(window, '__AU_EXPORT_PAYLOAD__', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: privatePayload,
      });
    }, payload);

    const renderUrl = `${siteOrigin}/__export-render`;
    stage = 'render-navigation';
    const navigationResponse = await page.goto(renderUrl, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });
    if (!navigationResponse || !navigationResponse.ok()) {
      throw new Error(`RENDER_NAVIGATION_FAILED: ${navigationResponse?.status() || 'NO_RESPONSE'} ${renderUrl}`);
    }

    stage = 'preview-readiness';
    await page.waitForFunction(() => Boolean(window.__AU_EXPORT_READY__), undefined, { timeout: 25_000 });
    const ready = await page.evaluate(() => window.__AU_EXPORT_READY__);
    if (!ready?.ready) throw new Error(ready?.error || 'EXPORT_RENDER_NOT_READY');
    if (ready.width !== width || ready.height !== height) throw new Error('RENDER_GEOMETRY_MISMATCH');

    const target = page.locator('#au-export-render-target');
    if (await target.count() !== 1) throw new Error('EXPORT_TARGET_NOT_FOUND');
    const screenshotOptions = payload.format === 'jpeg'
      ? { type: 'jpeg', quality: Math.round(payload.quality * 100), omitBackground: false }
      : { type: 'png', omitBackground: false };
    stage = 'screenshot';
    const screenshot = await target.screenshot(screenshotOptions);
    const contentType = payload.format === 'jpeg' ? 'image/jpeg' : 'image/png';

    return new Response(screenshot, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="AU-Toolkit-${payload.previewKey}-${scale}x.${payload.format === 'jpeg' ? 'jpg' : 'png'}"`,
        'X-AU-Canonical-Width': String(width),
        'X-AU-Canonical-Height': String(height),
        'X-AU-Export-Scale': String(scale),
        'X-AU-Renderer': 'native-chromium-screenshot',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const details = {
      stage,
      message,
      ...(stage === 'chromium-pack' ? { url: chromiumPackUrl, architecture: process.arch } : {}),
      ...(failedResources.length > 0 ? { failedResources: failedResources.slice(0, 10) } : {}),
    };
    console.error('[export-render] Native screenshot failed:', details);
    return json(500, {
      error: 'NATIVE_SCREENSHOT_FAILED',
      ...details,
    });
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
