/**
 * Check + Add Firebase Auth authorized domains via Admin SDK
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import admin from 'firebase-admin';

// Load .env
const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');

// Parse service account
let serviceAccount;
try {
  const raw = envContent.match(/FIREBASE_ADMIN_SERVICE_ACCOUNT='([\s\S]+?)'\s*$/m)?.[1];
  serviceAccount = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse service account:', e.message);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId });

// Use Firebase Auth management API via service account token
const tokenRes = await admin.app().options.credential.getAccessToken();
const accessToken = tokenRes.access_token;

console.log(`Project: ${projectId}`);
console.log('Fetching authorized domains...\n');

// Get current config
const configRes = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
);

const config = await configRes.json();

if (config.error) {
  console.error('Error fetching config:', JSON.stringify(config.error, null, 2));
  
  // Fallback: check via REST API
  console.log('\nTrying REST API fallback...');
  const apiKey = getEnv('VITE_FIREBASE_API_KEY');
  const r2 = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`);
  const d2 = await r2.json();
  if (d2.authorizedDomains) {
    console.log('=== AUTHORIZED DOMAINS (via REST) ===');
    d2.authorizedDomains.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
  } else {
    console.log('REST response:', JSON.stringify(d2, null, 2).substring(0, 500));
  }
  process.exit(0);
}

const domains = config.authorizedDomains || [];
console.log('=== AUTHORIZED DOMAINS ===');
domains.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
