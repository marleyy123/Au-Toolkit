import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const bundle = await build({
  stdin: {
    contents: `import React, {useRef, useLayoutEffect} from 'react';
      import {createRoot} from 'react-dom/client';
      import {WhatsAppChatPreview} from './src/features/whatsapp/components/WhatsAppChatPreview';
      import {LineChatPreview} from './src/features/line/components/LineChatPreview';
      import {InstagramDMPreview} from './src/features/instagram/components/InstagramDMPreview';
      import {INITIAL_WHATSAPP_CHAT_DATA, INITIAL_LINE_CHAT_DATA, INITIAL_INSTAGRAM_DM_DATA} from './src/data/defaultTemplates';
      import {registerExportContext} from './src/export/exportContext';
      import {exportPreviewToImage} from './src/utils/exportUtils';
      const key = new URLSearchParams(location.search).get('chat');
      const presets = {whatsapp: INITIAL_WHATSAPP_CHAT_DATA, line: INITIAL_LINE_CHAT_DATA, instagram: INITIAL_INSTAGRAM_DM_DATA};
      const components = {whatsapp: WhatsAppChatPreview, line: LineChatPreview, instagram: InstagramDMPreview};
      const avatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#008878"/></svg>');
      const data = {...presets[key], contactName: 'Scroll Test', name: 'Scroll Test', username: 'scrolltest',
        contactAvatar: avatar, avatar, aspectRatio: '4:5', showProfileCard: false,
        messages: Array.from({length: 45}, (_, i) => ({id: String(i), type: 'text',
          sender: i % 2 ? 'outgoing' : 'incoming', text: 'Message ' + String(i).padStart(2, '0') + ' - visible viewport test', time: '12:30', status: 'read'}))};
      if (key === 'whatsapp' && new URLSearchParams(location.search).has('group')) {
        data.isGroupChat = true;
        data.contactAvatar = avatar;
        const compact = new URLSearchParams(location.search).has('compact');
        data.bubbleWidthPercent = compact ? 50 : 94;
        data.messageFontSize = compact ? 11 : 15;
        data.messages = [
          {id: 'photo', sender: 'incoming', type: 'image', imageUrl: avatar, photoWidth: new URLSearchParams(location.search).has('photo-small') ? 140 : undefined, caption: 'Photo caption with enough words to wrap across several lines', senderName: 'Karun', time: '12:30'},
          {id: 'text', sender: 'incoming', type: 'text', text: 'Same person after the photo', time: '12:30'},
          {id: 'more', sender: 'incoming', type: 'text', senderName: 'Karun', text: 'One more message', time: '12:31'},
          {id: 'other', sender: 'incoming', type: 'text', senderName: 'Maya', text: 'Different person', time: '12:32'},
        ];
        if (new URLSearchParams(location.search).has('sender-always')) data.messages[1].showSenderName = true;
        if (new URLSearchParams(location.search).has('sender-hidden')) data.messages[0].showSenderName = false;
      }
      function App() {
        const ref = useRef(null);
        useLayoutEffect(() => {
          registerExportContext(ref.current, {previewKey: key === 'instagram' ? 'instagram-dm' : key === 'line' ? 'line-chat' : 'whatsapp-chat', data, fontCss: 'sans-serif'});
          window.capture = options => exportPreviewToImage({element: ref.current, ...options});
          window.ready = true;
        }, []);
        const Preview = components[key];
        return <Preview previewRef={ref} data={data}/>;
      }
      createRoot(document.getElementById('root')).render(<App/>);`,
    resolveDir: process.cwd(), loader: 'tsx',
  }, bundle: true, write: false, format: 'iife',
});
const assets = await readdir('dist/assets');
const css = await readFile(`dist/assets/${assets.find((file) => file.endsWith('.css'))}`, 'utf8');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel: 'msedge', headless: true});
try {
  for (const width of [1440, 390]) {
    for (const chat of ['whatsapp', 'line', 'instagram']) {
      const page = await browser.newPage({viewport: {width, height: 900}});
      await page.goto(`http://127.0.0.1:${server.address().port}/?chat=${chat}`);
      await page.waitForFunction(() => window.ready);
      const results = await page.evaluate(async () => {
        const root = document.getElementById('preview-target');
        const feed = root.querySelector('[data-chat-scroll]');
        if (feed.scrollHeight <= feed.clientHeight) throw new Error('Test chat must overflow');
        const height = root.offsetHeight;
        const headerHeight = feed.getBoundingClientRect().top - root.getBoundingClientRect().top;
        const shots = [];
        const decode = async (dataUrl) => {
          const image = new Image(); image.src = dataUrl; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = 380; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, 380, height);
          return ctx.getImageData(0, 0, 380, height).data;
        };
        for (const fraction of [0, 0.5, 1]) {
          feed.scrollTop = (feed.scrollHeight - feed.clientHeight) * fraction;
          const scroll = feed.scrollTop;
          const result = await window.capture({scale: 1, format: 'png'});
          if (feed.scrollTop !== scroll) throw new Error('Export moved live chat');
          if (result.width !== 380 || result.height !== height) throw new Error('Export changed phone geometry');
          shots.push(result.dataUrl);
        }
        const pixels = await Promise.all(shots.map(decode));
        const headerEnd = Math.floor(headerHeight) * 380 * 4;
        let headerChanges = 0, chatChanges = 0;
        for (let i = 0; i < pixels[0].length; i += 4) {
          const changed = Math.abs(pixels[0][i] - pixels[2][i]) + Math.abs(pixels[0][i + 1] - pixels[2][i + 1]) + Math.abs(pixels[0][i + 2] - pixels[2][i + 2]) > 15;
          if (changed && i < headerEnd) headerChanges++;
          else if (changed) chatChanges++;
        }
        const jpeg = await window.capture({scale: 2, format: 'jpeg'});
        const highRes = await window.capture({scale: 3, format: 'png'});
        return {shots, height, headerChanges, chatChanges, jpeg: [jpeg.width, jpeg.height], highRes: [highRes.width, highRes.height]};
      });
      assert.equal(results.headerChanges, 0, `${chat}: header must remain fixed`);
      assert(results.chatChanges > 1000, `${chat}: exported chat must change after scrolling`);
      assert.notEqual(results.shots[1], results.shots[2], 'Middle and bottom must export different messages');
      assert.deepEqual(results.jpeg, [760, results.height * 2]);
      assert.deepEqual(results.highRes, [1140, results.height * 3]);
      await writeFile(`dist/chat-${chat}-${width}-export.png`, Buffer.from(results.shots[2].split(',')[1], 'base64'));
      await page.locator('#preview-target').screenshot({path: `dist/chat-${chat}-${width}-preview.png`});
      console.log(`PASS ${chat} ${width}px: top/middle/bottom scroll, fixed header, PNG 1x/3x and JPG 2x`);
      await page.close();
    }
  }
  for (const width of [1440, 390]) {
    for (const mode of ['normal', 'compact', 'photo-small', 'sender-always', 'sender-hidden']) {
    const compact = mode === 'compact';
    const page = await browser.newPage({viewport: {width, height: 900}});
    await page.goto(`http://127.0.0.1:${server.address().port}/?chat=whatsapp&group=true&${mode}=true`);
    await page.waitForFunction(() => window.ready);
    const result = await page.evaluate(async () => {
      const root = document.getElementById('preview-target');
      const labels = Array.from(root.querySelectorAll('div, span')).filter(node => node.children.length === 0);
      const text = labels.find(node => node.textContent === 'Same person after the photo');
      const caption = labels.find(node => node.textContent.includes('Photo caption with enough'));
      const timestamp = caption.parentElement.parentElement.querySelector('span.tracking-tight');
      const captionBoxes = Array.from(caption.getClientRects());
      const timestampBox = timestamp.getBoundingClientRect();
      const overlapsTimestamp = captionBoxes.some(captionBox => captionBox.left < timestampBox.right &&
        captionBox.right > timestampBox.left &&
        captionBox.top < timestampBox.bottom &&
        captionBox.bottom > timestampBox.top);
      const shot = await window.capture({scale: 1, format: 'png'});
      const photo = root.querySelector('img[alt="attachment"]');
      const image = new Image(); image.src = shot.dataUrl; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      const row = context.getImageData(0, 110, image.width, 1).data;
      let exportedPhotoWidth = 0;
      for (let i = 0; i < row.length; i += 4) {
        if (row[i] < 5 && Math.abs(row[i + 1] - 136) < 5 && Math.abs(row[i + 2] - 120) < 5) exportedPhotoWidth++;
      }
      return {karun: labels.filter(node => node.textContent === 'Karun').length,
        maya: labels.filter(node => node.textContent === 'Maya').length, image: shot.dataUrl,
        fontSize: getComputedStyle(text).fontSize, overlapsTimestamp,
        avatarLoaded: root.querySelector('img').naturalWidth > 0,
        photoWidth: photo.getBoundingClientRect().width, exportedPhotoWidth,
        textWidth: text.getBoundingClientRect().width};
    });
    assert.equal(result.karun, mode === 'sender-always' ? 2 : mode === 'sender-hidden' ? 0 : 1, 'Sender display override must preserve grouping');
    assert.equal(result.maya, 1, 'A new participant should show their name');
    assert.equal(result.fontSize, compact ? '11px' : '15px');
    assert.equal(result.overlapsTimestamp, false, 'Caption must not overlap timestamp');
    assert.equal(result.avatarLoaded, true, 'Profile avatar must load for a named contact');
    if (compact) assert(result.textWidth < 190, 'Compact bubble must constrain text width');
    if (mode === 'photo-small') {
      assert.equal(result.photoWidth, 140, 'Photo slider must resize the photo independently');
      assert.equal(result.exportedPhotoWidth, 140, 'Export must preserve the selected photo width');
    }
    await writeFile(`dist/whatsapp-group-${width}-${mode}-export.png`, Buffer.from(result.image.split(',')[1], 'base64'));
    await page.locator('#preview-target').screenshot({path: `dist/whatsapp-group-${width}-${mode}-preview.png`});
    console.log(`PASS WhatsApp group ${width}px ${mode}: sender grouping, text/photo sizing, caption spacing, profile avatar, PNG export`);
    await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
