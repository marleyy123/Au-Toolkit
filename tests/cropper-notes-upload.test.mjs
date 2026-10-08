import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium, webkit } from 'playwright-core';

const bundle = await build({ stdin: { contents: `
  import React,{useState,useLayoutEffect} from 'react';
  import {createRoot} from 'react-dom/client';
  import {ImageUploader} from './src/components/FormControls';
  import {NotesForm} from './src/features/notes/components/NotesForm';
  import {INITIAL_NOTES_DATA} from './src/data/defaultTemplates';
  import {persistLocalImageBlob,resolveLocalImageReference} from './src/utils/imageManager';
  localStorage.setItem('au_auth_user',JSON.stringify({uid:'test-user'}));
  window.saveLocal=async src=>persistLocalImageBlob('test-user',await (await fetch(src)).blob(),'test');
  window.resolveLocal=ref=>resolveLocalImageReference(ref,'test-user');
  function App(){
    const [avatar,setAvatar]=useState('');
    const [notes,setNotes]=useState({...INITIAL_NOTES_DATA,images:[],imageUrl:''});
    useLayoutEffect(()=>{window.avatar=avatar;window.notes=notes;window.setAvatar=setAvatar;},[avatar,notes]);
    return <><section id="avatar"><ImageUploader label="Profile Photo" value={avatar} onChange={setAvatar}/></section>
      <section id="notes"><NotesForm data={notes} onChange={setNotes}/></section></>;
  }
  createRoot(document.getElementById('root')).render(<App/>);
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', outfile: 'bundle.js', plugins: [{
  name: 'controlled-compression', setup(builder) {
    builder.onLoad({ filter: /[\\/]firebase\.ts$/ }, () => ({ contents: 'export const auth={currentUser:{uid:"test-user"}};export const getStoredAuthUser=()=>auth.currentUser;', loader: 'ts' }));
    builder.onLoad({ filter: /imageCompressor\.ts$/ }, () => ({ contents: `
      export const compressAndReadAsDataURL=()=>new Promise(resolve=>{(window.finishCompression ||= []).push(value=>resolve(value||window.testImage))});
      export const ensureDataUrlUnderSize=value=>value;
    `, loader: 'ts' }));
  },
}] });
const assets = await readdir('dist/assets');
const css = (await readFile('dist/assets/' + assets.find(f => f.endsWith('.css')), 'utf8')).replace(/@import[^;]+;/g, '')
  + bundle.outputFiles.filter(f => f.path.endsWith('.css')).map(f => f.text).join('\n');
const js = bundle.outputFiles.find(f => f.path.endsWith('.js')).text;
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? js : req.url === '/style.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  for (const engine of ['chrome', 'webkit']) {
    const browser = await (engine === 'chrome' ? chromium.launch({ channel: 'chrome', headless: true }) : webkit.launch({ headless: true }));
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(() => window.setAvatar);
      const image = await page.evaluate(() => {
        const c = document.createElement('canvas'); c.width = 160; c.height = 120;
        const ctx = c.getContext('2d'); ctx.fillStyle = '#20b070'; ctx.fillRect(0, 0, 160, 120);
        return window.testImage = c.toDataURL();
      });
      const ref = await page.evaluate(src => window.saveLocal(src), image);
      await page.reload();
      await page.waitForFunction(() => window.setAvatar);
      await page.evaluate(ref => window.setAvatar(ref), ref);
      // No global DOM image resolver is installed: crop must resolve IndexedDB itself.
      await page.locator('#avatar img').locator('..').click();
      const apply = page.getByRole('button', { name: 'Apply / Crop', exact: true });
      await apply.waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Apply / Crop') && !b.disabled));
      assert.ok(await page.locator('.cropper-container').count());
      await page.screenshot({ path: `dist/cropper-local-${engine}.png` });
      await apply.click();
      await page.waitForFunction(old => window.avatar.startsWith('au-local-media://') && window.avatar !== old, ref);
      const pixels = await page.evaluate(async () => {
        const img = new Image(); img.src = await window.resolveLocal(window.avatar); await img.decode();
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
        return { width: img.width, height: img.height, pixel: [...ctx.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1).data] };
      });
      assert.ok(pixels.width > 0 && pixels.height > 0 && pixels.pixel[1] > pixels.pixel[0] && pixels.pixel[3] === 255, 'Cropped image is nonblank');
      assert.equal(await page.getByRole('button', { name: 'Apply / Crop', exact: true }).count(), 0);

      await page.evaluate(() => window.setAvatar('au-local-media://test-user/missing/no-such-image'));
      await page.locator('#avatar img').locator('..').click();
      await page.getByRole('alert').waitFor();
      assert.equal(await apply.isDisabled(), true);
      assert.equal(await page.evaluate(() => window.avatar), 'au-local-media://test-user/missing/no-such-image');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.locator('#avatar input[type=file]').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
      await page.getByRole('alert').waitFor();
      assert.equal(await apply.isDisabled(), true);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      const file = { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(image.split(',')[1], 'base64') };
      await page.locator('#avatar input[type=file]').setInputFiles(file);
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Apply / Crop') && !b.disabled));
      await apply.click();
      await page.waitForFunction(() => window.avatar.startsWith('au-local-media://') && !window.avatar.includes('missing'));

      await page.evaluate(src => { window.testImage = src; }, image);
      const notesFile = page.locator('#notes input[type=file]').first();
      await notesFile.setInputFiles(file);
      await page.waitForFunction(() => window.finishCompression?.length === 1 && window.notes.images.length === 1);
      await page.locator('#notes textarea').first().fill('Edited while compression is running');
      await notesFile.setInputFiles({ ...file, name: 'second.png' });
      await page.waitForFunction(() => window.finishCompression.length === 2 && window.notes.images.length === 2);
      await page.evaluate(() => { window.finishCompression[1](); window.finishCompression[0](); });
      await page.waitForFunction(() => window.notes.images.length === 2 && window.notes.images.every(img => img.url.startsWith('data:image/')));
      assert.equal(await page.evaluate(() => window.notes.bodyText), 'Edited while compression is running');
      console.log('PASS', engine, 'local crop after reload, missing/corrupt image recovery, Notes delayed uploads preserve images and text');
    } finally { await browser.close(); }
  }
} finally { await new Promise(resolve => server.close(resolve)); }
