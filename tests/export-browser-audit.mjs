import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium, webkit} from 'playwright-core';

const cases = {
  twitter: 'TWITTER', 'instagram-feed': 'INSTAGRAM_FEED', 'instagram-story': 'INSTAGRAM_STORY',
  'instagram-profile': 'INSTAGRAM_PROFILE', 'instagram-live': 'INSTAGRAM_LIVE', 'instagram-notes': 'INSTAGRAM_NOTES',
  'instagram-activity': 'INSTAGRAM_ACTIVITY', 'instagram-dm': 'INSTAGRAM_DM', 'instagram-dm-inbox': 'INSTAGRAM_DM_INBOX',
  'instagram-feed-comments': 'INSTAGRAM_FEED_COMMENTS', 'instagram-story-viewers': 'INSTAGRAM_STORY_VIEWERS',
  'whatsapp-chat': 'WHATSAPP_CHAT', 'whatsapp-call': 'WHATSAPP_CALL', 'whatsapp-status': 'WHATSAPP_STATUS',
  'whatsapp-viewers': 'WHATSAPP_VIEWERS', 'tiktok-profile': 'TIKTOK_PROFILE', 'tiktok-feed-live': 'TIKTOK_FEED_LIVE',
  'tiktok-fyp': 'TIKTOK_FYP', 'ios-lockscreen': 'IOS_LOCKSCREEN', 'line-chat': 'LINE_CHAT', notes: 'NOTES',
  'push-notification': 'PUSH_NOTIFICATION', 'spotify-card': 'SPOTIFY',
};
const bundle = await build({stdin: {contents: `
  import React, {useRef, useLayoutEffect} from 'react';
  import {createRoot} from 'react-dom/client';
  import {PreviewRegistry} from './src/export/PreviewRegistry';
  import * as defaults from './src/data/defaultTemplates';
  import {exportPreviewToImage} from './src/utils/exportUtils';
  const key = new URLSearchParams(location.search).get('key');
  const cases = ${JSON.stringify(cases)};
  const c = document.createElement('canvas'); c.width = c.height = 1800;
  c.getContext('2d').fillStyle = '#ed163c'; c.getContext('2d').fillRect(0,0,1800,1800);
  const avatar = c.toDataURL();
  c.getContext('2d').fillStyle = '#008878'; c.getContext('2d').fillRect(0,0,1800,1800);
  const media = c.toDataURL();
  function sanitize(value, field = '') {
    if (typeof value === 'string' && /^https?:/.test(value)) return /avatar/i.test(field) ? avatar : media;
    if (Array.isArray(value)) return value.map(v => sanitize(v, field));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,sanitize(v,k)]));
    return value;
  }
  const data = {...sanitize(defaults['INITIAL_' + cases[key] + '_DATA']), avatar, contactAvatar: avatar,
    username: 'audit_user', name: 'Audit User', contactName: 'Audit User', emojis: [], theme: 'light'};
  if (key === 'instagram-story') data.backgroundImage = media;
  if (key.endsWith('-chat') || key === 'instagram-dm') {
    data.messages = [{id:'1',type:'text',sender:'incoming',text:'A complete message must remain visible.',time:'12:30'},
      {id:'2',type:'text',sender:'outgoing',text:'The layout must retain its original size.',time:'12:31',status:'read'}];
  }
  function App() {
    const ref = useRef(null);
    useLayoutEffect(() => {window.capture = options => exportPreviewToImage({element: ref.current,...options});
      window.geometry = () => ({width:ref.current.offsetWidth,height:ref.current.offsetHeight}); window.ready = true;},[]);
    return <div style={{transform:'scale(.65)',transformOrigin:'top left'}}><PreviewRegistry previewKey={key} data={data} previewRef={ref} fontCss="Arial"/></div>;
  }
  createRoot(document.getElementById('root')).render(<App/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife'});
const assets = await readdir('dist/assets');
const css = (await readFile('dist/assets/'+assets.find(f => f.endsWith('.css')),'utf8')).replace(/@import[^;]+;/g,'');
const server = createServer((req,res) => {
  res.setHeader('Content-Type',req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(r => server.listen(0,'127.0.0.1',r));
try {
  for (const engine of ['chrome','webkit']) {
    const browser = await (engine === 'chrome' ? chromium.launch({channel:'chrome',headless:true}) : webkit.launch({headless:true}));
    try {
      for (const key of process.argv.length > 2 ? process.argv.slice(2) : Object.keys(cases)) {
        const page = await browser.newPage({viewport:{width:390,height:844}});
        await page.goto(`http://127.0.0.1:${server.address().port}/?key=${key}`);
        await page.waitForFunction(() => window.ready);
        await page.evaluate(() => document.fonts.ready);
        if (key === 'whatsapp-chat') {
          assert((await page.locator('#preview-target').textContent()).includes('The layout must retain its original size.'), 'WhatsApp must not insert line breaks into words');
        }
        await page.route('**/style.css',route => route.abort());
        for (const format of ['png','jpeg']) {
          const shot = await page.evaluate(async format => {
            const before = window.geometry();
            const r = await window.capture({format,scale:1});
            if (!r.success) throw new Error(JSON.stringify(r));
            const image = new Image(); image.src=r.dataUrl; await image.decode();
            const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
            const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
            const p=ctx.getImageData(0,0,c.width,c.height).data;
            let red=0,nonWhite=0;
            for(let i=0;i<p.length;i+=4) {
              if(p[i]>180 && p[i+1]<70 && p[i+2]<100) red++;
              if(p[i+3]>0 && (p[i]<240||p[i+1]<240||p[i+2]<240)) nonWhite++;
            }
            return {before,after:window.geometry(),width:r.width,height:r.height,red,nonWhite,dataUrl:r.dataUrl};
          },format);
          assert.deepEqual(shot.after,shot.before,key+' changed live geometry');
          assert(shot.width>=300 && shot.width<=1000,key+' invalid width');
          assert(shot.height>100 && shot.height<2500,key+' invalid height');
          assert(shot.nonWhite>100,key+' blank export');
          assert(shot.red<50000,key+' oversized avatar');
          if (['twitter','instagram-profile','instagram-story','whatsapp-chat','instagram-dm'].includes(key)) {
            await writeFile(`dist/audit-${engine}-${key}.${format==='png'?'png':'jpg'}`,Buffer.from(shot.dataUrl.split(',')[1],'base64'));
          }
          console.log('PASS',engine,key,format,shot.width+'x'+shot.height);
        }
        await page.close();
      }
    } finally {await browser.close();}
  }
} finally {await new Promise(r=>server.close(r));}
