import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT_ID = 'gen-lang-client-0839250297';
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const execute = process.argv.includes('--execute');
const candidatesPath = process.argv.find((arg) => arg.endsWith('.json')) || 'firebase-auth-delete-candidates.json';

function chunk(values, size) {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    error.body = body;
    throw error;
  }
  return body;
}

async function getAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens || {};
  if (token.access_token && Number(token.expires_at || 0) > Date.now() + 60_000) {
    return token.access_token;
  }
  if (!token.refresh_token) {
    throw new Error('Firebase CLI refresh token not found. Run `firebase login` first.');
  }
  const refreshed = await fetchJson('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: token.refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  return refreshed.access_token;
}

const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
const uids = [...new Set(candidates.map((item) => item.uid).filter(Boolean))];

console.log(JSON.stringify({
  projectId: PROJECT_ID,
  candidates: candidates.length,
  uniqueUids: uids.length,
  mode: execute ? 'execute' : 'dry-run',
}, null, 2));

if (!execute) {
  console.log('Dry-run only. Re-run with --execute to delete these Firebase Auth users.');
  process.exit(0);
}

const accessToken = await getAccessToken();
await fetchJson(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:testIamPermissions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'x-goog-user-project': PROJECT_ID,
  },
  body: JSON.stringify({ permissions: ['firebaseauth.users.delete'] }),
});

let deleted = 0;
for (const ids of chunk(uids, 1000)) {
  await fetchJson(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:batchDelete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': PROJECT_ID,
    },
    body: JSON.stringify({
      localIds: ids,
      force: true,
    }),
  });
  deleted += ids.length;
}

console.log(JSON.stringify({ deleted }, null, 2));
