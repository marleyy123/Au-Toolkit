import { createRemoteJWKSet, jwtVerify } from 'jose';

interface Env {
  MEDIA: any;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
  MAX_FILE_BYTES: string;
}

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
]);

const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
  });
  const origin = (request.headers.get('Origin') || '').replace(/\/+$/, '');
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((v) => v.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (allowed.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
}

function json(data: unknown, status: number, headers: Headers): Response {
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { status, headers });
}

async function identity(request: Request, env: Env): Promise<string | null> {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const projectIds = (env.FIREBASE_PROJECT_ID || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  for (const projectId of projectIds) {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        algorithms: ['RS256'],
      });
      if (typeof payload.sub === 'string' && payload.sub) {
        return payload.sub;
      }
    } catch {
      // Try next project ID
    }
  }
  return null;
}

function objectKey(uid: string, value: string | null): string | null {
  if (!value || !value.startsWith(`${uid}/`) || value.length > 220) return null;
  const suffix = value.slice(uid.length + 1);
  return /^[a-f0-9-]{36}$/.test(suffix) ? value : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(request, env);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }
    if (!headers.has('Access-Control-Allow-Origin')) {
      return json({ error: 'ORIGIN_BLOCKED' }, 403, headers);
    }

    const uid = await identity(request, env);
    if (!uid) {
      return json({ error: 'AUTH_REQUIRED' }, 401, headers);
    }

    const url = new URL(request.url);

    if (url.pathname !== '/media') {
      return json({ error: 'NOT_FOUND' }, 404, headers);
    }

    // Upload media to R2
    if (request.method === 'PUT') {
      const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
      const size = Number(request.headers.get('Content-Length'));
      const maxFileBytes = Number(env.MAX_FILE_BYTES) || 15 * 1024 * 1024;

      if (!allowedTypes.has(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > maxFileBytes) {
        return json({ error: 'INVALID_MEDIA' }, 400, headers);
      }

      const key = `${uid}/${crypto.randomUUID()}`;
      try {
        await env.MEDIA.put(key, request.body, {
          httpMetadata: { contentType },
          customMetadata: { ownerUid: uid },
        });

        return json({ key, sizeBytes: size }, 201, headers);
      } catch (err) {
        await env.MEDIA.delete(key).catch(() => {});
        return json({ error: 'UPLOAD_FAILED' }, 503, headers);
      }
    }

    const key = objectKey(uid, url.searchParams.get('key'));
    if (!key) {
      return json({ error: 'INVALID_MEDIA_KEY' }, 400, headers);
    }

    // Download/stream media from R2
    if (request.method === 'GET') {
      const object = await env.MEDIA.get(key);
      if (!object || object.customMetadata?.ownerUid !== uid) {
        return json({ error: 'MEDIA_NOT_FOUND' }, 404, headers);
      }
      const responseHeaders = new Headers(headers);
      object.writeHttpMetadata(responseHeaders);
      responseHeaders.set('Cache-Control', 'private, max-age=3600');
      responseHeaders.set('ETag', object.httpEtag);
      responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
      return new Response(object.body, { headers: responseHeaders });
    }

    // Delete media from R2
    if (request.method === 'DELETE') {
      await env.MEDIA.delete(key);
      return json({ deleted: true }, 200, headers);
    }

    headers.set('Allow', 'GET, PUT, DELETE, OPTIONS');
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405, headers);
  },
};
