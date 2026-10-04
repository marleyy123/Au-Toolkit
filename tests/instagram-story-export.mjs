import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const bundle = await build({
  stdin: {
    contents: `import React, {useRef, useLayoutEffect} from 'react';
      import {createRoot} from 'react-dom/client';
      import {InstagramStoryPreview} from './src/features/instagram/components/InstagramStoryPreview';
      import {INITIAL_INSTAGRAM_STORY_DATA} from './src/data/defaultTemplates';
      import {registerExportContext} from './src/export/exportContext';
      import {exportPreviewToImage} from './src/utils/exportUtils';
      const params = new URLSearchParams(location.search);
      const username = params.get('long') === 'true' ? 'dewiayuwandira13_very_long_username' : 'dewiayuwandira13';
      const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="380" height="676"><rect width="380" height="676" fill="#123456"/></svg>');
      const data = {...INITIAL_INSTAGRAM_STORY_DATA, username, mediaImage: image,
        verified: 'ig-blue', isCloseFriends: true, musicTitle: 'Song', musicArtist: 'Artist',
        isStoryReplyMode: params.get('reply') === 'true', showQuickReactions: false, showKeyboard: false};
      function App() {
        const ref = useRef(null);
        useLayoutEffect(() => {
          registerExportContext(ref.current, {previewKey: 'instagram-story', data, fontCss: 'Arial'});
          window.capture = options => exportPreviewToImage({element: ref.current, ...options});
          window.username = username;
          window.ready = true;
        }, []);
        return <InstagramStoryPreview previewRef={ref} data={data}/>;
      }
      createRoot(document.getElementById('root')).render(<App/>);`,
    resolveDir: process.cwd(), loader: 'tsx',
  }, bundle: true, write: false, format: 'iife',
});
const assets = await readdir('dist/assets');
const css = (await readFile(`dist/assets/${assets.find(file => file.endsWith('.css'))}`, 'utf8'))
  .replace(/@import[^;]+;/g, '');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>:root{--selected-global-font:Arial}</style><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel: 'msedge', headless: true});
try {
  for (const width of [1440, 390]) {
    for (const reply of [false, true]) {
      for (const long of [false, true]) {
        const page = await browser.newPage({viewport: {width, height: 900}});
        await page.goto(`http://127.0.0.1:${server.address().port}/?reply=${reply}&long=${long}`);
        await page.waitForFunction(() => window.ready);
        const result = await page.evaluate(async () => {
          const root = document.querySelector('#export-ig-story, #preview-target');
          const label = Array.from(root.querySelectorAll('span')).find(node => node.textContent === window.username);
          if (!label) throw new Error('Username missing from preview');
          label.style.setProperty('color', 'rgb(240, 30, 90)', 'important');
          const rootRect = root.getBoundingClientRect();
          const rect = label.getBoundingClientRect();
          const headerButtons = Array.from(root.querySelectorAll('button')).filter(node => node.getBoundingClientRect().top - rootRect.top < 100);
          const overflow = headerButtons.some(node => node.getBoundingClientRect().right > rootRect.right);
          const overlap = headerButtons.some(node => rect.right > node.getBoundingClientRect().left);
          const shots = [];
          for (const format of ['png', 'jpeg']) {
            const shot = await window.capture({scale: format === 'png' ? 1 : 3, format});
            const image = new Image(); image.src = shot.dataUrl; await image.decode();
            const canvas = document.createElement('canvas'); canvas.width = 380; canvas.height = root.offsetHeight;
            const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const pixels = ctx.getImageData(0, 0, 380, Math.ceil(rect.bottom - rootRect.top + 5)).data;
            let usernamePixels = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i] > 150 && pixels[i + 1] < 100 && pixels[i + 2] > 45 && pixels[i + 2] < 150) usernamePixels++;
            }
            shots.push({format, usernamePixels, dataUrl: shot.dataUrl});
          }
          return {overflow, overlap, shots};
        });
        for (const shot of result.shots) {
          await writeFile(`dist/story-${width}-${reply}-${long}.${shot.format === 'png' ? 'png' : 'jpg'}`, Buffer.from(shot.dataUrl.split(',')[1], 'base64'));
          assert(shot.usernamePixels > 30, `Username missing in ${shot.format}: ${width}px reply=${reply} long=${long}`);
        }
        await page.locator('#export-ig-story, #preview-target').screenshot({path: `dist/story-${width}-${reply}-${long}-preview.png`});
        assert.equal(result.overflow, false, `Username overlaps header controls: ${width}px reply=${reply} long=${long}`);
        assert.equal(result.overlap, false, `Username extends into header buttons: ${width}px reply=${reply} long=${long}`);
        console.log(`PASS Story ${width}px reply=${reply} long=${long}: username pixels in PNG 1x/JPG 3x`);
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
