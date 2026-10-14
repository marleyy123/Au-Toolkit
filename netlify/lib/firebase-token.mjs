import { createRemoteJWKSet, jwtVerify } from 'jose';

const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const productionProjectId = 'gen-lang-client-0839250297';

export function firebaseTokenOptions(projectId) {
  return { issuer: `https://securetoken.google.com/${projectId}`, audience: projectId, algorithms: ['RS256'] };
}

export function createFirebaseTokenVerifier({ env = process.env, verify = jwtVerify, keySet = keys } = {}) {
  return async authorization => {
    if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) {
      throw Object.assign(new Error('AUTH_REQUIRED'), { reason: 'AUTH_REQUIRED' });
    }
    const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || productionProjectId;
    if (env.FIREBASE_PROJECT_ID && env.VITE_FIREBASE_PROJECT_ID && env.FIREBASE_PROJECT_ID !== env.VITE_FIREBASE_PROJECT_ID) {
      throw Object.assign(new Error('FIREBASE_PROJECT_MISMATCH'), { reason: 'AUTH_CONFIG_ERROR' });
    }
    try {
      const { payload } = await verify(authorization.slice(7).trim(), keySet, firebaseTokenOptions(projectId));
      if (!payload.sub || !payload.email || !Number.isFinite(payload.exp) || !Number.isFinite(payload.iat) || payload.iat > Date.now() / 1000) throw new Error('Invalid identity');
      if (payload.email_verified !== true) throw Object.assign(new Error('EMAIL_NOT_VERIFIED'), { reason: 'EMAIL_NOT_VERIFIED' });
      return { uid: payload.sub, email: String(payload.email).trim().toLowerCase(), emailVerified: true };
    } catch (error) {
      throw Object.assign(new Error(error.reason === 'EMAIL_NOT_VERIFIED' ? error.reason : 'INVALID_FIREBASE_TOKEN'), {
        reason: error.reason === 'EMAIL_NOT_VERIFIED' ? error.reason : 'INVALID_FIREBASE_TOKEN',
      });
    }
  };
}

export const verifyFirebaseAuthorization = createFirebaseTokenVerifier();
