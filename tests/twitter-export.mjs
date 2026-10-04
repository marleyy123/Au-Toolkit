import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const bundle = await build({stdin: {
  contents: `import React, {useRef, useLayoutEffect} from 'react';
    import {createRoot} from 'react-dom/client';
    import {TwitterPreview} from './src/features/twitter/components/TwitterPreview';
    import {INITIAL_TWITTER_DATA} from './src/data/defaultTemplates';
    import {registerExportContext} from './src/export/exportContext';
    import {exportPreviewToImage} from './src/utils/exportUtils';
    const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 1800;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ed163c'; ctx.fillRect(0, 0, 1800, 1800);
    const avatar = canvas.toDataURL();
    ctx.fillStyle = '#008878'; ctx.fillRect(0, 0, 1800, 1800);
    const data = {...INITIAL_TWITTER_DATA, name: 'Export Test', handle: 'twitter_export', avatar,
      content: 'The entire tweet must remain visible, not only the profile picture.', mediaImages: [canvas.toDataURL()]};
    function App() {
      const ref = useRef(null);
      useLayoutEffect(() => {
        registerExportContext(ref.current, {previewKey: 'twitter', data, fontCss: 'Arial'});
        window.capture = options => exportPreviewToImage({element: ref.current, ...options});
        window.ready = true;
      }, []);
      return <div style={{transform: 'scale(0.75)', transformOrigin: 'top left'}}><TwitterPreview data={data} previewRef={ref}/></div>;
    }
    createRoot(document.getElementById('root')).render(<App/>);`,
  resolveDir: process.cwd(), loader: 'tsx',
}, bundle: true, write: false, format: 'iife'});
const assets = await readdir('dist/assets');
const css = (await readFile(`dist/assets/${assets.find(file => file.endsWith('.css'))}`, 'utf8')).replace(/@import[^;]+;/g, '');
const server = createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>:root{--selected-global-font:Arial}</style><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const width of [1440, 390]) {
    for (const mode of ['normal', 'interrupted-css', 'runtime-css']) {
      const interruptedCss = mode === 'interrupted-css';
      const page = await browser.newPage({viewport: {width, height: 900}});
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.waitForFunction(() => window.ready);
      await page.evaluate(() => document.fonts.ready);
      if (mode === 'runtime-css') {
        await page.evaluate(() => {
          const link = document.querySelector('link[rel="stylesheet"]');
          const rules = Array.from(link.sheet.cssRules, rule => rule.cssText);
          const style = document.createElement('style'); document.head.appendChild(style);
          for (const rule of rules) style.sheet.insertRule(rule, style.sheet.cssRules.length);
          link.remove();
        });
      }
      if (interruptedCss) await page.route('**/style.css', route => route.abort());
      for (const format of ['png', 'jpeg']) {
        const shot = await page.evaluate(async format => {
          const root = document.getElementById('export-twitter');
          const originalAvatar = root.querySelector('img').getBoundingClientRect();
          const result = await window.capture({format, scale: format === 'png' ? 1 : 3});
          const image = new Image(); image.src = result.dataUrl; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = result.height / (format === 'png' ? 1 : 3);
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let avatarPixels = 0, mediaPixels = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > 180 && pixels[i + 1] < 70 && pixels[i + 2] < 100) avatarPixels++;
            if (pixels[i] < 30 && pixels[i + 1] > 100 && pixels[i + 1] < 160 && pixels[i + 2] > 80 && pixels[i + 2] < 150) mediaPixels++;
          }
          return {avatarPixels, mediaPixels, width: canvas.width, height: canvas.height,
            dataUrl: result.dataUrl, liveAvatarWidth: originalAvatar.width, afterAvatarWidth: root.querySelector('img').getBoundingClientRect().width};
        }, format);
        await writeFile(`dist/twitter-${width}-${mode}.${format === 'png' ? 'png' : 'jpg'}`, Buffer.from(shot.dataUrl.split(',')[1], 'base64'));
        assert(shot.avatarPixels > 500 && shot.avatarPixels < 2500, `Avatar must stay small: ${JSON.stringify({...shot, dataUrl: undefined})}`);
        assert(shot.mediaPixels > 10000, 'Tweet media must remain visible');
        assert(shot.height < 1500, 'Styles must prevent intrinsic avatar height from expanding the tweet');
        assert.equal(shot.afterAvatarWidth, shot.liveAvatarWidth, 'Export must not change live preview');
        console.log(`PASS Chrome Twitter ${width}px ${format} ${mode}: full tweet, small avatar, zoom-independent export`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
