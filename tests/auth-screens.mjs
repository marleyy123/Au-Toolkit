import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const bundle = await build({ stdin: { loader: 'tsx', resolveDir: process.cwd(), contents: `
  import React from 'react';
  import {createRoot} from 'react-dom/client';
  import {AppLoadingScreen} from './src/features/auth/components/access/AppLoadingScreen';
  import {AccessGuard} from './src/features/auth/components/access/AccessGuard';
  import {ErrorBoundary} from './src/components/ErrorBoundary';
  const params = new URLSearchParams(location.search);
  const view = params.get('view'), language = params.get('language') || 'en', uiTheme = params.get('theme') || 'light';
  window.calls = [];
  const call = name => () => window.calls.push(name);
  function Broken() { throw new Error('Example render failure'); }
  createRoot(document.getElementById('root')).render(view === 'error'
    ? <ErrorBoundary><Broken /></ErrorBoundary>
    : view === 'guard' ? <AccessGuard email="a-very-long-email-address-for-layout-testing@example.com" status={params.get('status') || 'EXPIRED'}
        statusAccount={params.get('status') === 'INACTIVE' ? 'Inactive' : 'Expired'} purchaseDate="2026-09-01" expirationDate="2026-10-01" daysRemaining={0}
        language={language} uiTheme={uiTheme} onLogout={call('logout')} />
    : <AppLoadingScreen stage={params.get('stage') || 'CHECK_ACCESS'} language={language} uiTheme={uiTheme}
        errorMessage={params.get('failure') ? 'Access verification is temporarily unavailable.' : null}
        onRetry={call('retry')} onBackToLogin={call('login')} />);
` }, bundle: true, write: false, format: 'iife', define: { 'import.meta.env': '{}' } });
const css = await (await fetch('http://localhost:3000/src/index.css?direct')).text();
const logo = await readFile('public/favicon.svg', 'utf8');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : req.url === '/favicon.svg' ? 'image/svg+xml' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : req.url === '/favicon.svg' ? logo
    : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  const page = await browser.newPage();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    for (const params of [
      'stage=EDITOR_LOADING', 'stage=AUTH_LOADING&language=id', 'stage=CHECK_ACCESS', 'stage=LOAD_USER_DATA&theme=dark', 'stage=HYDRATE_DATA',
      'view=guard&status=EXPIRED', 'view=guard&status=INACTIVE&language=id', 'view=guard&status=ORDER_NOT_SUCCESS',
      'view=guard&status=DEVICE_MISMATCH&theme=dark', 'view=guard&status=INVALID_PURCHASE_DATA', 'view=error', 'failure=1',
    ]) {
      await page.goto(`${origin}/?${params}`);
      await page.locator('.au-auth-brand').waitFor();
      assert.equal(await page.locator('.au-auth-brand').getAttribute('aria-label'), 'AU Toolkit');
      await page.locator('.au-auth-brand img').evaluate(image => image.decode());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${params} at ${width}`);
      const heading = page.getByRole('heading').first();
      assert(await heading.isVisible());
      const content = page.locator('.au-auth-content');
      assert.equal(await content.evaluate(node => node.scrollWidth > node.clientWidth), false, 'Content fits');
      if (params.includes('view=guard')) {
        const renew = page.getByRole('link');
        assert.equal(await renew.count(), 1);
        if (params.includes('DEVICE_MISMATCH')) {
          assert.match(await renew.getAttribute('href'), /^https:\/\/wa\.me\//);
          await page.getByText('1 laptop + 1 phone', { exact: true }).waitFor();
          await page.getByRole('heading', { name: 'Account registered on another device' }).waitFor();
        } else assert.equal(await renew.getAttribute('href'), '/#pilihan-paket');
        await page.getByRole('button').click();
        assert.deepEqual(await page.evaluate(() => window.calls), ['logout']);
      }
      if (params === 'failure=1') {
        await page.getByRole('button', { name: 'Try again' }).click();
        await page.getByRole('button', { name: 'Back to sign in' }).click();
        assert.deepEqual(await page.evaluate(() => window.calls), ['retry', 'login']);
      }
      if (width !== 320 && ['stage=CHECK_ACCESS', 'view=guard&status=EXPIRED', 'stage=LOAD_USER_DATA&theme=dark'].includes(params)) {
        await page.screenshot({ path: `${process.env.TEMP}/au-auth-${params.startsWith('view') ? 'expired' : params.includes('dark') ? 'dark' : 'loading'}-${width}.png` });
      }
    }
  }
  await page.clock.install();
  await page.goto(`${origin}/?stage=CHECK_ACCESS`);
  await page.clock.fastForward(8000);
  await page.getByRole('button', { name: 'Try again' }).waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.au-loading-indicator > span').evaluate(node => getComputedStyle(node).animationName), 'none');
  console.log('PASS auth screens: loading stages, expired/inactive/pending/invalid/device states, errors, action callbacks, slow recovery, reduced motion, desktop/mobile.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
