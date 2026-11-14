import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium, webkit } from 'playwright-core';

const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
  import React,{useState,useEffect} from 'react';
  import {createRoot} from 'react-dom/client';
  import {NotesForm} from './src/features/notes/components/notes/NotesForm';
  import {NotesPreview} from './src/features/notes/components/notes/NotesPreview';
  import {INITIAL_NOTES_DATA} from './src/data/defaultTemplates';
  import {ThemeContext} from './src/context/ThemeContext';
  import {LanguageContext} from './src/context/LanguageContext';
  import {installPersistentLocalImageResolver} from './src/utils/imageManager';
  localStorage.setItem('au_auth_user',JSON.stringify({uid:'notes-test'}));
  installPersistentLocalImageResolver();
  function App(){
    const [data,setData]=useState(()=>JSON.parse(localStorage.getItem('notes-fixture')||'null')||{...INITIAL_NOTES_DATA,images:[],imageUrl:''});
    window.data=data;window.editText=()=>setData(old=>({...old,bodyText:'Edited during upload'}));
    useEffect(()=>{localStorage.setItem('notes-fixture',JSON.stringify(data));},[data]);
    return <ThemeContext.Provider value={{isDark:false}}><LanguageContext.Provider value={{language:'en',isId:false,t:key=>key}}>
      <NotesForm data={data} onChange={setData}/><NotesPreview data={data}/>
    </LanguageContext.Provider></ThemeContext.Provider>;
  }createRoot(document.getElementById('root')).render(<App/>);
` }, bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' }, plugins: [{ name: 'upload-fixture', setup(builder) {
  builder.onLoad({ filter: /[\\/]firebase\.ts$/ }, () => ({ contents: 'export const auth={currentUser:null};export const getStoredAuthUser=()=>null;', loader: 'ts' }));
  // Control completion order while exercising real file inputs, React state and IndexedDB.
  builder.onLoad({ filter: /[\\/]imageCompressor\.ts$/ }, () => ({ contents: `
    window.jobs=[];
    export const compressImageFile=file=>new Promise(resolve=>window.jobs.push(()=>resolve(file)));
    export const compressAndReadAsDataURL=async()=>'';
  `, loader: 'ts' }));
} }] });
const server = createServer((req,res)=>{
  res.setHeader('content-type',req.url==='/app.js'?'text/javascript':'text/html');
  res.end(req.url==='/app.js'?bundle.outputFiles[0].text:'<div id="root"></div><script src="/app.js"></script>');
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
try {
  for (const engine of ['edge','webkit']) {
    const browser = await (engine==='edge'?chromium.launch({channel:'msedge',headless:true}):webkit.launch());
    try {
      const page=await browser.newPage();
      await page.route('https://**/*',route=>route.abort());
      await page.goto('http://127.0.0.1:'+server.address().port);
      const buffer=Buffer.from(await page.evaluate(()=>{
        const canvas=document.createElement('canvas');canvas.width=80;canvas.height=60;
        canvas.getContext('2d').fillRect(0,0,80,60);return canvas.toDataURL().split(',')[1];
      }),'base64');
      const file={name:'photo.png',mimeType:'image/png',buffer};
      const input=page.locator('input[type=file]').nth(0);
      const replace=page.locator('input[type=file]').nth(1);
      const finish=async index=>{await page.waitForFunction(i=>!!window.jobs[i],index);await page.evaluate(i=>window.jobs[i](),index);};
      await input.setInputFiles(file);
      await page.waitForFunction(()=>window.data.images.length===1);
      await page.evaluate(()=>window.editText());
      await input.setInputFiles(file);
      await finish(1);await finish(0);
      await page.waitForFunction(()=>window.data.images.length===2&&window.data.images.every(img=>img.url.startsWith('au-local-media://')));
      assert.equal(await page.evaluate(()=>window.data.bodyText),'Edited during upload');
      await page.reload();
      await page.waitForFunction(()=>[...document.querySelectorAll('img[alt="Notes attachment"]')].length===2&&[...document.querySelectorAll('img[alt="Notes attachment"]')].every(img=>img.complete&&img.naturalWidth===80));
      await replace.setInputFiles(file);
      await replace.setInputFiles({...file,name:'replacement.png'});
      await finish(1);await finish(0);
      await page.waitForFunction(()=>window.data.images.every(img=>img.url.startsWith('au-local-media://')));
      await page.getByTitle('Crop Image',{exact:true}).click();
      await page.getByRole('button',{name:'Apply / Crop',exact:true}).click();
      await finish(2);
      await page.waitForFunction(()=>window.data.images.every(img=>img.url.startsWith('au-local-media://')));
      const saved=await page.evaluate(()=>window.data.images.map(img=>img.url));
      await replace.setInputFiles(file);
      await page.getByTitle('Delete Image',{exact:true}).click();
      await finish(3);
      await page.waitForFunction(()=>window.data.images.length===1);
      assert(saved.includes(await page.evaluate(()=>window.data.images[0].url)));
      await page.reload();
      await page.waitForFunction(()=>window.data.images.length===1&&document.querySelector('img[alt="Notes attachment"]')?.naturalWidth===80);
      console.log('PASS '+engine+': upload, concurrent additions, text edits, replacement race, crop, delete during upload, reload with real IndexedDB');
    } finally { await browser.close(); }
  }
} finally { await new Promise(done=>server.close(done)); }
