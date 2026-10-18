import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium, webkit} from 'playwright-core';

const bundle = await build({stdin:{contents:`
  import React,{useState,useRef,useLayoutEffect} from 'react';
  import {createRoot} from 'react-dom/client';
  import {InstagramProfileForm} from './src/features/instagram/components/InstagramProfileForm';
  import {InstagramProfilePreview} from './src/features/instagram/components/InstagramProfilePreview';
  import {INITIAL_INSTAGRAM_PROFILE_DATA} from './src/data/defaultTemplates';
  import {PreparedImageDialog} from './src/features/editor/components/PreparedImageDialog';
  import {resolveLocalImageReference,installPersistentLocalImageResolver} from './src/utils/imageManager';
  import {usePreviewExport} from './src/features/editor/hooks/usePreviewExport';
  import {registerExportContext} from './src/export/exportContext';
  localStorage.setItem('au_auth_user',JSON.stringify({uid:'test-user'}));
  installPersistentLocalImageResolver();
  window.restoreImage=ref=>resolveLocalImageReference(ref,'test-user');
  function App() {
    const [data,setData]=useState({...INITIAL_INSTAGRAM_PROFILE_DATA,username:'old_user',name:'Old name'});
    const [file,setFile]=useState(null); const ref=useRef(null);
    const exports=usePreviewExport({activeTab:'instagram-profile',language:'id',previewRef:ref,getCurrentTabFormData:()=>data,updateActiveFolderData:()=>{}});
    useLayoutEffect(()=>{window.state=data;window.loadProfile=setData;window.png=exports.handleDownload;window.jpg=exports.handleDownloadJpg;
      window.prepared=exports.preparedImage?.name;registerExportContext(ref.current,{previewKey:'instagram-profile',data,fontCss:'Arial'});},[data,exports.preparedImage]);
    return <><InstagramProfileForm data={data} onChange={setData}/><InstagramProfilePreview data={data} previewRef={ref}/>
      <PreparedImageDialog file={file||exports.preparedImage} language="id" onClose={()=>{setFile(null);exports.closePreparedImage();}}/></>;
  }
  createRoot(document.getElementById('root')).render(<App/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},plugins:[{
  name:'controlled-upload-delays',setup(build) {
    build.onLoad({filter:/[\\/]firebase\.ts$/},()=>({contents:'export const auth={currentUser:{uid:"test-user"}}; export const getStoredAuthUser=()=>auth.currentUser;',loader:'ts'}));
    build.onLoad({filter:/imageManager\.ts$/},async ({path})=>({contents:(await readFile(path,'utf8')).replace('const cleanUid = String(uid', 'await new Promise<void>(resolve => { (window as any).finishPersist = resolve; ((window as any).persistTasks ||= []).push(resolve); });\n  const cleanUid = String(uid'),loader:'ts'}));
    build.onLoad({filter:/imageCompressor\.ts$/},()=>({contents:`export const compressAndReadAsDataURL=()=>new Promise(resolve=>{(window.finishCompression ||= []).push(()=>resolve(window.testImage))}); export const ensureDataUrlUnderSize=v=>v;`,loader:'ts'}));
  },
}]});
const assets=await readdir('dist/assets');
const css=(await Promise.all(assets.filter(f=>f.endsWith('.css')).map(f=>readFile('dist/assets/'+f,'utf8')))).join('\n').replace(/@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/g,'');
const server=createServer((req,res)=>{
  res.setHeader('Content-Type',req.url==='/bundle.js'?'application/javascript':req.url==='/style.css'?'text/css':'text/html');
  res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:req.url==='/style.css'?css:'<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try {
  for(const engine of ['chrome','webkit']) {
    const browser=await (engine==='chrome'?chromium.launch({channel:'chrome',headless:true}):webkit.launch({headless:true}));
    try {
      const page=await browser.newPage({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(()=>window.state);
      const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=32;c.getContext('2d').fillRect(0,0,32,32);return window.testImage=c.toDataURL();});
      const file={name:'photo.png',mimeType:'image/png',buffer:Buffer.from(image.split(',')[1],'base64')};
      await page.locator('#input-grid-multiple-files').setInputFiles([file,{...file,name:'photo2.png'}]);
      await page.waitForFunction(()=>window.finishCompression?.length===2);
      await page.getByPlaceholder('username',{exact:true}).fill('new_user');
      await page.getByPlaceholder('Name',{exact:true}).fill('New name');
      await page.evaluate(()=>window.finishCompression.forEach(f=>f()));
      await page.waitForFunction(()=>window.persistTasks?.length===2);
      await page.evaluate(()=>window.persistTasks.forEach(f=>f()));
      await page.waitForFunction(()=>window.state.gridPosts.length===2 && window.state.gridPosts.every(p=>p.image.startsWith('au-local-media://')));
      await page.waitForFunction(()=>[...document.querySelectorAll('#preview-post-grid img')].every(img=>img.complete && img.naturalWidth>0));
      assert.equal(await page.locator('#preview-username').textContent(),'new_user');
      assert.equal(await page.locator('#preview-name').textContent(),'New name');
      await page.locator('input[type=file]').first().setInputFiles(file);
      await page.waitForFunction(()=>document.querySelector('.cropper-container'));
      await page.getByRole('button',{name:'Apply / Crop',exact:true}).click();
      await page.waitForFunction(()=>window.persistTasks?.length===3);
      await page.getByPlaceholder('username',{exact:true}).fill('final_user');
      await page.getByPlaceholder('Name',{exact:true}).fill('Final name');
      await page.evaluate(()=>window.finishPersist());
      await page.waitForFunction(()=>window.state.avatar.startsWith('au-local-media://'));
      await page.waitForFunction(()=>document.querySelector('#preview-avatar-img')?.naturalWidth>0);
      assert.equal(await page.locator('#preview-username').textContent(),'final_user');
      assert.equal(await page.locator('#preview-name').textContent(),'Final name');
      assert.equal(await page.evaluate(()=>window.state.gridPosts.length),2);
      const editedPostId=await page.evaluate(()=>window.state.gridPosts[0].id);
      await page.getByText('Post #1',{exact:true}).locator('xpath=../../..').locator('input[type=file]').setInputFiles(file);
      await page.waitForFunction(()=>document.querySelector('.cropper-container'));
      await page.getByRole('button',{name:'Apply / Crop',exact:true}).click();
      await page.waitForFunction(()=>window.persistTasks?.length===4);
      await page.getByText('Pin',{exact:true}).first().locator('..').getByRole('checkbox').check();
      await page.getByRole('button',{name:'Add Post',exact:true}).click();
      await page.evaluate(()=>window.finishPersist());
      await page.waitForFunction(id=>window.state.gridPosts.find(p=>p.id===id)?.image.startsWith('au-local-media://'),editedPostId);
      assert.equal(await page.evaluate(id=>window.state.gridPosts.find(p=>p.id===id).isPinned,editedPostId),true);
      assert.equal(await page.evaluate(()=>window.state.gridPosts.length),3);
      await page.waitForFunction(()=>document.querySelector('#preview-grid-img-1')?.naturalWidth>0);
      const persistentRef=await page.evaluate(()=>window.state.avatar);
      // An asynchronous local-media read must not overwrite a newer image.
      const resolvedRace=await page.evaluate(async ref=>{
        const img=document.createElement('img');
        const replace=new MutationObserver(()=>{replace.disconnect();img.src=window.testImage;});
        replace.observe(document.body,{childList:true});
        img.src=ref;document.body.append(img);
        await new Promise(resolve=>setTimeout(resolve,100));
        const kept=img.getAttribute('src')===window.testImage;
        img.remove();return kept;
      },persistentRef);
      assert.equal(resolvedRace,true,'Local media resolution must preserve a newer upload');
      for(const width of [390,1280]) {
        await page.setViewportSize({width,height:900});
        const centers=await page.evaluate(()=>['posts','followers','following'].map(stat=>{
          const box=document.querySelector('#preview-stat-'+stat).getBoundingClientRect();
          const count=document.querySelector('#preview-'+stat+'-count');
          const range=document.createRange();range.selectNodeContents(count);
          const text=range.getBoundingClientRect();
          return {center:box.x+box.width/2,textCenter:text.x+text.width/2,align:getComputedStyle(count).textAlign,display:getComputedStyle(count.parentElement.parentElement).display};
        }));
        centers.forEach(({center,textCenter})=>assert(Math.abs(center-textCenter)<1,'Statistic count must be centered above its label: '+JSON.stringify(centers)));
        assert(Math.abs((centers[1].center-centers[0].center)-(centers[2].center-centers[1].center))<1,'Statistics must be evenly spaced');
      }
      await page.setViewportSize({width:390,height:844});
      await page.locator('#export-ig-profile').screenshot({path:`dist/instagram-profile-${engine}.png`});
      await page.evaluate(()=>{
        Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
        Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.shared=data.files[0].name;window.shareActivated=navigator.userActivation.isActive;}});
      });
      await page.evaluate(()=>window.png());
      await page.waitForFunction(()=>window.prepared?.endsWith('.png'));
      await page.getByRole('button',{name:'Simpan / Bagikan',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.shared),'AU-Toolkit-instagram-profile-1x.png');
      assert.equal(await page.evaluate(()=>window.shareActivated),true);
      const bounds=await page.locator('dialog').boundingBox();
      assert(bounds.x>=0 && bounds.x+bounds.width<=390,'Save dialog must fit the phone');
      await page.screenshot({path:`dist/prepared-image-${engine}.png`});
      await page.getByRole('button',{name:'Tutup',exact:true}).click();
      assert.equal(await page.locator('dialog').count(),0);
      await page.evaluate(()=>window.jpg());
      await page.waitForFunction(()=>window.prepared?.endsWith('.jpg'));
      await page.getByRole('button',{name:'Simpan / Bagikan',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.shared),'AU-Toolkit-instagram-profile-1x.jpg');
      await page.getByRole('button',{name:'Tutup',exact:true}).click();
      const savedProfile=await page.evaluate(()=>window.state);
      await page.reload();
      await page.waitForFunction(()=>window.state);
      await page.evaluate(data=>window.loadProfile(data),savedProfile);
      await page.waitForFunction(()=>['#preview-avatar-img','#preview-grid-img-1','#preview-grid-img-2'].every(selector=>document.querySelector(selector)?.naturalWidth>0));
      const restored=await page.evaluate(async ref=>{
        const url=await window.restoreImage(ref);const image=new Image();image.src=url;await image.decode();
        return {width:image.width,height:image.height};
      },persistentRef);
      assert(restored.width>0 && restored.width===restored.height,'Cropped avatar must restore as a readable square image');
      console.log('PASS',engine,'bulk upload, real avatar crop, readable previews, centered statistics, stale image protection, reload and native share');
    } finally {await browser.close();}
  }
} finally {await new Promise(r=>server.close(r));}
