import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium,webkit} from 'playwright-core';

const bundle=await build({stdin:{contents:`
  import React,{useState,useRef,useLayoutEffect} from 'react';
  import {createRoot} from 'react-dom/client';
  import {WhatsAppChatForm} from './src/features/whatsapp/components/WhatsAppChatForm';
  import {InstagramProfileForm} from './src/features/instagram/components/InstagramProfileForm';
  import {InstagramStoryReplyForm} from './src/features/instagram/components/InstagramStoryReplyForm';
  import {PreviewRegistry} from './src/export/PreviewRegistry';
  import {MobileFloatingPreview} from './src/components/MobileFloatingPreview';
  import {INITIAL_WHATSAPP_CHAT_DATA,INITIAL_INSTAGRAM_PROFILE_DATA,INITIAL_INSTAGRAM_STORY_REPLY_DATA} from './src/data/defaultTemplates';
  import {useTabFormDataRegistry} from './src/features/workspace/hooks/useTabFormDataRegistry';
  import {exportPreviewToImage} from './src/utils/exportUtils';
  const key=new URLSearchParams(location.search).get('key');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  canvas.getContext('2d').fillRect(0,0,32,32);const avatar=canvas.toDataURL();
  function App(){
    const ref=useRef(null);
    const [data,setData]=useState(key==='whatsapp-chat'?{...INITIAL_WHATSAPP_CHAT_DATA,contactName:'old',contactAvatar:avatar,
      messages:[{id:'one',type:'text',sender:'incoming',text:'Old text',time:'12:30'}]}:
      key==='instagram-story-reply'?{...INITIAL_INSTAGRAM_STORY_REPLY_DATA,username:'reply_old',avatarUrl:avatar,emojis:[]}:
      {...INITIAL_INSTAGRAM_PROFILE_DATA,username:'old',name:'Old name',avatar});
    const registry=useTabFormDataRegistry({activeTab:key,whatsAppChatData:data,instagramProfileData:data,instagramStoryReplyData:data,instagramStoryData:{username:'wrong_story'}});
    useLayoutEffect(()=>{window.state=data;window.capture=()=>exportPreviewToImage({element:ref.current,scale:1});},[data]);
    const Form=key==='whatsapp-chat'?WhatsAppChatForm:key==='instagram-story-reply'?InstagramStoryReplyForm:InstagramProfileForm;
    return <><Form data={data} onChange={setData} characters={[]} onSaveCharacter={()=>{}} onSelectCharacter={()=>{}}/>
      <div id="canonical" style={{display:'none'}}><PreviewRegistry previewKey={key} data={registry.currentPreviewData} previewRef={ref} fontCss="Arial"/></div>
      <MobileFloatingPreview sourceRef={ref} refreshKey={key} uiTheme="light" isOpen={true} onClose={()=>{}}/></>;
  }
  createRoot(document.getElementById('root')).render(<App/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},plugins:[{
  name:'no-auth-network',setup(build){
    build.onLoad({filter:/[\\/]firebase\.ts$/},()=>({contents:'export const auth={currentUser:{uid:"test"}};export const getStoredAuthUser=()=>auth.currentUser;',loader:'ts'}));
  },
}]});
const assets=await readdir('dist/assets');
const css=(await readFile('dist/assets/'+assets.find(f=>f.endsWith('.css')),'utf8')).replace(/@import[^;]+;/g,'');
const server=createServer((req,res)=>{
  res.setHeader('Content-Type',req.url==='/bundle.js'?'application/javascript':req.url==='/style.css'?'text/css':'text/html');
  res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:req.url==='/style.css'?css:'<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{
  for(const engine of ['chrome','webkit']){
    const browser=await(engine==='chrome'?chromium.launch({channel:'chrome',headless:true}):webkit.launch({headless:true}));
    try{
      for(const key of ['whatsapp-chat','instagram-profile','instagram-story-reply']){
        const page=await browser.newPage({viewport:{width:390,height:844}});
        await page.goto('http://127.0.0.1:'+server.address().port+'/?key='+key);
        await page.waitForFunction(()=>window.state);
        if(key==='whatsapp-chat'){
          await page.getByPlaceholder('Name',{exact:true}).fill('loml');
          await page.getByPlaceholder(/Pesan masuk \(kiri\)|Received message \(left\)/).fill('hii good apakabar?');
          await page.waitForFunction(()=>document.querySelector('[data-floating-preview-clone]')?.textContent.includes('hii good apakabar?'));
          assert.equal(await page.evaluate(()=>window.state.messages[0].text),'hii good apakabar?');
        }else if(key==='instagram-story-reply'){
          await page.getByPlaceholder('ramadhniap_', {exact:true}).fill('reply_updated');
          await page.waitForFunction(()=>document.querySelector('[data-floating-preview-clone]')?.textContent.includes('reply_updated'));
          assert(!(await page.locator('[data-floating-preview-clone]').textContent()).includes('wrong_story'));
        }else{
          await page.getByPlaceholder('username',{exact:true}).fill('_07ayyden');
          await page.getByPlaceholder('Name',{exact:true}).fill('J');
          await page.waitForFunction(()=>document.querySelector('[data-floating-preview-clone] #preview-username')?.textContent==='_07ayyden');
          assert.equal(await page.locator('[data-floating-preview-clone] #preview-name').textContent(),'J');
        }
        const result=await page.evaluate(async()=>{const r=await window.capture();return {success:r.success,width:r.width,height:r.height};});
        assert.equal(result.success,true);assert.equal(result.width,380);assert(result.height>300);
        await page.screenshot({path:'dist/sync-'+engine+'-'+key+'.png'});
        console.log('PASS',engine,key,'input updates hidden canonical preview and visible floating mirror; export works');
        await page.close();
      }
    }finally{await browser.close();}
  }
}finally{await new Promise(r=>server.close(r));}
