import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

// Exercise real hydration/login hooks with deferred cloud responses. Previously
// these responses could replace ACCESS_EXPIRED with READY after access denial.
const bundle = await build({
  stdin: { loader: 'tsx', resolveDir: process.cwd(), contents: `
    import React, { useEffect, useRef, useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { useWorkspaceCloudHydration } from './src/features/workspace/hooks/useWorkspaceCloudHydration';
    import { useAuthGateActions } from './src/features/auth/hooks/useAuthGateActions';
    import { AccessGuard } from './src/features/auth/components/AccessGuard';
    const user = { uid: 'test-user', email: 'buyer@example.com' };
    const noop = () => {};
    function Harness() {
      const [stage, setStage] = useState(window.requireAccess ? 'CHECK_ACCESS' : 'LOAD_USER_DATA');
      const [authenticated, setAuthenticated] = useState(true);
      const [entitlement, setEntitlement] = useState(null);
      const generation = useRef(0), hydrated = useRef(false), applying = useRef(false);
      const localEdits = useRef(Boolean(window.existingLocal));
      const folders = useRef({}), activeFolders = useRef({});
      const forceSync = useRef(noop), applyCloud = useRef(noop);
      useWorkspaceCloudHydration({
        enabled: !window.requireAccess || (authenticated && ['LOAD_USER_DATA', 'HYDRATE_DATA', 'READY'].includes(stage)),
        authUser: user, userAccountKey: user.uid, clientSessionId: 'session',
        accountSyncGenerationRef: generation, isHydratedRef: hydrated,
        isApplyingCloudAssetsRef: applying, hasLocalUserEditsInSessionRef: localEdits,
        moduleFoldersRef: folders, activeFolderIdsRef: activeFolders,
        forceCloudWorkspaceSyncNowRef: forceSync, applyCloudWorkspaceDataRef: applyCloud,
        setCloudSyncState: noop, setIsInitialCloudLoading: noop, setIsHydrated: noop,
        setAuthLifecycleStage: setStage, setLastSyncedTime: noop,
        setModuleFolders: noop, setActiveFolderIds: noop, loadTabFormData: noop,
      });
      const gate = useAuthGateActions({
        authUser: user, authLifecycleStage: stage, applyCloudWorkspaceDataRef: applyCloud,
        isHydratedRef: hydrated, setAccessCode: noop, setIsAuthenticated: setAuthenticated,
        setLogoutReason: noop, setAuthUser: noop, setBuyerEntitlement: setEntitlement,
        setAuthLifecycleStage: setStage, setIsHydrated: noop, setIsInitialCloudLoading: noop,
        setLoadingErrorMessage: noop, revalidateEntitlement: noop,
      });
      useEffect(() => {
        window.deny = () => gate.handleAccessExpired(user.email, {
          isRegisteredBuyer: true, isValid: false, status: 'EXPIRED', statusAccount: 'Expired',
          email: user.email, purchaseDate: '2026-10-10', expirationDate: '2026-10-09', daysRemaining: 0,
        });
        window.retryCloud = gate.handleContextAwareRetry;
        window.setStage = setStage;
      });
      return <><output data-testid="stage">{stage}</output>
        <output data-testid="authenticated">{String(authenticated)}</output>
        {stage === 'READY' ? <div data-testid="editor">Editor</div> :
          stage === 'ACCESS_EXPIRED' ? <AccessGuard {...entitlement} onLogout={noop} language="id" /> : <div>Loading</div>}
      </>;
    }
    createRoot(document.getElementById('root')).render(<Harness />);
  ` },
  bundle: true, write: false, format: 'iife',
  plugins: [{ name: 'deferred-cloud', setup(builder) {
    builder.onResolve({ filter: /\/firebase$/ }, () => ({ path: 'firebase', namespace: 'mock' }));
    builder.onResolve({ filter: /deviceAuthService$/ }, () => ({ path: 'device', namespace: 'mock' }));
    builder.onResolve({ filter: /userAssets$/ }, () => ({ path: 'assets', namespace: 'mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents: path === 'firebase' ? `
      export const auth = { currentUser: { uid: 'test-user' } };
      export const getStoredAuthUser = () => auth.currentUser;
      export const setStoredAuthUser = () => {};
      export function loadUserWorkspaceFromFirestore() {
        window.cloudRequests ||= [];
        return new Promise((resolve, reject) => window.cloudRequests.push({resolve, reject}));
      }
      export const subscribeUserWorkspaceFromFirestore = () => () => {};
    ` : path === 'device' ? `export const verifyAndRegisterDevice = async () => {};` : `
      export const persistUserAssets = () => {};
      export const readPersistentUserAssets = () => ({});
    ` }));
  } }],
});
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const artifacts = await mkdtemp(join(tmpdir(), 'au-access-race-'));
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const scenario of ['loaded', 'new_user', 'new_user_local', 'error', 'retry', 'timer']) {
      const page = await browser.newPage({ viewport });
      await page.addInitScript(local => { window.existingLocal = local; }, scenario === 'new_user_local');
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(() => window.cloudRequests?.length === 1 && typeof window.deny === 'function');
      if (scenario === 'retry') {
        await page.evaluate(() => window.retryCloud());
        await page.waitForFunction(() => window.cloudRequests.length === 2);
      }
      await page.evaluate(() => {
        window.editorReopened = false;
        new MutationObserver(() => {
          if (document.querySelector('[data-testid="editor"]')) window.editorReopened = true;
        }).observe(document.getElementById('root'), { childList: true, subtree: true });
        window.deny();
      });
      await page.waitForFunction(() => document.querySelector('[data-testid="stage"]').textContent === 'ACCESS_EXPIRED');
      assert.equal(await page.getByTestId('authenticated').innerText(), 'false');
      if (scenario === 'timer') {
        await page.waitForTimeout(6500);
      } else {
        await page.evaluate(kind => {
          for (const request of window.cloudRequests) {
            if (kind === 'error') request.reject(new Error('Late cloud failure'));
            else request.resolve(kind.startsWith('new_user') ? { isNewUser: true, status: 'new_user' } : { hasLoadedData: true, status: 'loaded' });
          }
        }, scenario);
        await page.waitForTimeout(150);
      }
      assert.equal(await page.getByTestId('stage').innerText(), 'ACCESS_EXPIRED', `${scenario}: denial remains authoritative`);
      assert.equal(await page.getByTestId('editor').count(), 0);
      assert.equal(await page.evaluate(() => window.editorReopened), false);
      assert.deepEqual(errors, []);
      if (scenario === 'loaded') await page.screenshot({ path: join(artifacts, `expired-${viewport.width}.png`), fullPage: true });
      await page.close();
    }
    const activePage = await browser.newPage({ viewport });
    await activePage.goto(`http://127.0.0.1:${server.address().port}`);
    await activePage.waitForFunction(() => window.cloudRequests?.length === 1);
    await activePage.evaluate(() => window.cloudRequests[0].resolve({ hasLoadedData: true, status: 'loaded' }));
    await activePage.waitForFunction(() => document.querySelector('[data-testid="editor"]'));
    await activePage.close();
    const gatedPage = await browser.newPage({ viewport });
    await gatedPage.addInitScript(() => { window.requireAccess = true; });
    await gatedPage.goto(`http://127.0.0.1:${server.address().port}`);
    await gatedPage.waitForFunction(() => typeof window.setStage === 'function');
    assert.equal(await gatedPage.evaluate(() => window.cloudRequests?.length || 0), 0);
    await gatedPage.evaluate(() => window.setStage('LOAD_USER_DATA'));
    await gatedPage.waitForFunction(() => window.cloudRequests?.length === 1);
    await gatedPage.evaluate(() => window.deny());
    await gatedPage.waitForFunction(() => document.querySelector('[data-testid="stage"]').textContent === 'ACCESS_EXPIRED');
    await gatedPage.evaluate(() => window.cloudRequests[0].resolve({ hasLoadedData: true, status: 'loaded' }));
    await gatedPage.waitForTimeout(150);
    assert.equal(await gatedPage.getByTestId('editor').count(), 0);
    await gatedPage.close();
  }
  console.log('PASS access/hydration race: denied access survives late cloud success, failure, new-user branches, retries and safety timers; valid loading still reaches READY on desktop/mobile.');
  console.log(`Screenshots: ${artifacts}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
