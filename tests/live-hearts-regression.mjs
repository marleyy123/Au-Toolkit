import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium, webkit } from 'playwright-core';

const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React, {useRef, useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {InstagramLivePreview} from './src/features/instagram/components/live/InstagramLivePreview';
    import {MobileFloatingPreview} from './src/components/MobileFloatingPreview';
    import {INITIAL_INSTAGRAM_LIVE_DATA} from './src/data/defaultTemplates';
    function App() {
      const ref = useRef(null);
      const [enabled, setEnabled] = useState(true);
      window.stopHearts = () => setEnabled(false);
      return <>
        <div id="canonical" style={{display:'none'}}>
          <InstagramLivePreview previewRef={ref} data={{...INITIAL_INSTAGRAM_LIVE_DATA, isAutoEmojiEnabled:enabled}}/>
        </div>
        <MobileFloatingPreview sourceRef={ref} refreshKey="instagram-live" uiTheme="light" isOpen onClose={()=>{}}/>
      </>;
    }
    createRoot(document.getElementById('root')).render(<App/>);
  ` }, bundle: true, write: false, format: 'iife',
});
const assets = await readdir('dist/assets');
const css = ((await Promise.all(assets.filter(f => f.endsWith('.css')).map(f => readFile('dist/assets/' + f, 'utf8')))).join('\n')).replace(/@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/g, '');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css :
    '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  for (const engine of ['chromium', 'webkit']) {
    const browser = await (engine === 'chromium'
      ? chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'chrome', headless: true })
      : webkit.launch({ headless: true }));
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(() => document.querySelectorAll('[data-floating-preview-clone] .animate-float-up').length >= 4);
      const ages = await page.evaluate(() => [...document.querySelectorAll('[data-floating-preview-clone] .animate-float-up')]
        .map(element => Number(element.getAnimations()[0]?.currentTime)));
      assert.ok(Math.max(...ages) - Math.min(...ages) > 900, 'Hearts must keep distinct ages when the hidden preview is cloned');
      await page.waitForTimeout(2600);
      const counts = await page.evaluate(() => ({
        canonical: document.querySelectorAll('#canonical .animate-float-up').length,
        mirror: document.querySelectorAll('[data-floating-preview-clone] .animate-float-up').length,
      }));
      assert.ok(counts.canonical <= 5 && counts.mirror <= 5, 'Expired hearts must be removed even when the canonical preview is hidden');
      await page.evaluate(() => window.stopHearts());
      await page.waitForFunction(() => document.querySelectorAll('.animate-float-up').length === 0);
      console.log('PASS', engine, 'hidden preview mirror keeps heart animation ages, bounds expired hearts, and clears on disable');
    } finally { await browser.close(); }
  }
} finally { await new Promise(resolve => server.close(resolve)); }
