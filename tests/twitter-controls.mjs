import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { parse } from 'postcss';
import { chromium, webkit } from 'playwright-core';

// Both branches use the same behavior; development groups the tweet components.
const directory = existsSync('src/features/twitter/components/tweet/TwitterForm.tsx')
  ? 'src/features/twitter/components/tweet' : 'src/features/twitter/components';
const bundle = await build({ stdin: { loader: 'tsx', resolveDir: process.cwd(), contents: `
  import React, {useState, useRef, useLayoutEffect} from 'react';
  import {createRoot} from 'react-dom/client';
  import {TwitterForm} from './${directory}/TwitterForm';
  import {TwitterPreview} from './${directory}/TwitterPreview';
  import {FormQuickScroll} from './src/components/FormQuickScroll';
  import {INITIAL_TWITTER_DATA} from './src/data/defaultTemplates';
  import {registerExportContext} from './src/export/exportContext';
  import {exportPreviewToImage} from './src/utils/exportUtils';
  const mode = new URLSearchParams(location.search).get('mode');
  function App() {
    const ref = useRef(null);
    const [data, setData] = useState(() => JSON.parse(localStorage.getItem('test-twitter-data') || 'null')
      || {...INITIAL_TWITTER_DATA, content:'Short tweet for canvas test', name:'Main author', handle:'author'});
    const change = next => { setData(next); localStorage.setItem('test-twitter-data',JSON.stringify(next)); };
    useLayoutEffect(() => {
      window.state = data; window.patchData = patch => change({...data,...patch});
      window.ready = true;
      if(ref.current) {
        registerExportContext(ref.current,{previewKey:'twitter',data,fontCss:'Arial'});
        window.capture = format => exportPreviewToImage({element:ref.current,format,scale:1});
      }
    },[data]);
    if(mode==='scroll') return <>
      <style>{'@media(min-width:1024px){#customization-panel{height:500px;overflow-y:auto}}'}</style>
      <section id="customization-panel"><div style={{height:4000}}>Long customization form</div></section>
      <FormQuickScroll language="en" />
    </>;
    return <>
      <section id="customization-panel"><TwitterForm data={data} onChange={change} characters={[]}
        onSaveCharacter={()=>{}} onSelectCharacter={()=>{}} /></section>
      <div id="preview-container" style={{width:480}}><TwitterPreview data={data} onChange={change} previewRef={ref} /></div>
    </>;
  }
  createRoot(document.getElementById('root')).render(<App/>);
` }, bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' }, plugins: [{
  name: 'no-remote-auth', setup(builder) {
    builder.onLoad({filter:/[\\/]firebase\.ts$/}, () => ({contents:'export const auth={currentUser:{uid:"test"}};export const getStoredAuthUser=()=>auth.currentUser;',loader:'ts'}));
  },
}] });
const files = (await readdir('dist/assets')).filter(file => file.endsWith('.css'));
const styles = parse((await Promise.all(files.map(file => readFile('dist/assets/' + file, 'utf8')))).join('\n'));
styles.walkAtRules('import', rule => rule.remove());
const css = styles.toString();
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css
    : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>body{margin:0;font-family:Arial}#preview-container{margin-top:20px}</style><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await mkdir('tmp/twitter-controls', {recursive:true});
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  for (const engine of ['chrome', 'webkit']) {
    const browser = await (engine === 'chrome' ? chromium.launch({channel:'msedge',headless:true}) : webkit.launch({headless:true}));
    try {
      for (const width of [390,1280]) {
        const page = await browser.newPage({viewport:{width,height:900},hasTouch:true});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin);
        await page.waitForFunction(() => window.ready);
        for (const theme of ['light','dim','dark']) {
          for (const [aspectRatio, height] of [['1:1',480],['4:5',600],['9:16',480*16/9],['auto',null]]) {
            await page.evaluate(patch => window.patchData(patch), {theme,aspectRatio,replies:[]});
            await page.waitForFunction(ratio => window.state.aspectRatio === ratio, aspectRatio);
            await page.waitForTimeout(220);
            const metrics = await page.locator('#export-twitter').evaluate(el => ({width:el.offsetWidth,height:el.getBoundingClientRect().height,
              bg:getComputedStyle(el).backgroundColor,contentBg:getComputedStyle(el.firstElementChild).backgroundColor,
              contentHeight:el.firstElementChild.getBoundingClientRect().height}));
            assert.equal(metrics.width,480);
            if(height) {
              assert.ok(Math.abs(metrics.height-height)<1,`${theme} ${aspectRatio}: ${JSON.stringify(metrics)}`);
              assert.notEqual(metrics.bg,metrics.contentBg);
            } else assert.ok(Math.abs(metrics.height-metrics.contentHeight)<1,'Auto fits the whole tweet');
            for(const format of ['png','jpeg']) {
              const shot = await page.evaluate(async format => {
                const result = await window.capture(format);
                if(!result.success) throw new Error(JSON.stringify(result));
                const img = new Image();img.src=result.dataUrl;await img.decode();
                const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
                const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
                return {width:img.width,height:img.height,pixel:[...ctx.getImageData(img.width-5,img.height-5,1,1).data]};
              },format);
              assert.equal(shot.width,480);
              assert.ok(Math.abs(shot.height-metrics.height)<=1,`${format} canvas ratio matches preview`);
              if(height) {
                const expected={light:[240,242,245],dim:[30,39,50],dark:[22,24,28]}[theme];
                expected.forEach((color,index)=>assert.ok(Math.abs(shot.pixel[index]-color)<5,`${theme} ${format} contrast background`));
              }
            }
          }
        }
        await page.getByRole('button',{name:'9:16 Vertical',exact:true}).click();
        assert.equal(await page.evaluate(()=>window.state.aspectRatio),'9:16');
        await page.getByRole('button',{name:'Add Reply',exact:true}).click();
        await page.getByRole('button',{name:'Add Reply',exact:true}).click();
        await page.getByRole('checkbox',{name:'Private (Lock)',exact:true}).first().check();
        assert.equal(await page.locator('[data-twitter-reply-lock]').count(),1);
        await page.getByRole('button',{name:'Auto Fit',exact:true}).click();
        assert.equal(await page.locator('[data-twitter-thread-line]').count(),2);
        const continuity=await page.locator('[data-twitter-thread-line]').evaluateAll(nodes=>{
          const a=nodes[0].getBoundingClientRect(),b=nodes[1].getBoundingClientRect();return {bottom:a.bottom,top:b.top,x:a.x,otherX:b.x};
        });
        assert.ok(continuity.bottom>=continuity.top && Math.abs(continuity.x-continuity.otherX)<1,'Thread line connects across rows');
        await page.getByRole('button',{name:'Horizontal Line',exact:true}).click();
        assert.equal(await page.locator('[data-twitter-thread-line]').count(),0);
        assert.equal(await page.locator('[data-twitter-reply]').nth(1).evaluate(el=>getComputedStyle(el).borderTopWidth),'1px');
        await page.reload();await page.waitForFunction(()=>window.ready);
        assert.equal(await page.evaluate(()=>window.state.showReplyThreadLine),false);
        assert.equal(await page.getByRole('checkbox',{name:'Private (Lock)',exact:true}).first().isChecked(),true);
        if(engine==='chrome' && width===390) {
          await page.getByRole('group',{name:'Canvas ratio',exact:true}).locator('..').screenshot({path:'tmp/twitter-controls/ratio-form.png'});
          await page.getByRole('group',{name:'Reply divider style',exact:true}).locator('..').screenshot({path:'tmp/twitter-controls/reply-divider-form.png'});
        }
        await page.locator('#export-twitter').screenshot({path:`tmp/twitter-controls/${engine}-${width}-replies.png`});
        for(const format of ['png','jpeg'])assert.equal(await page.evaluate(async format=>(await window.capture(format)).success,format),true);
        assert.deepEqual(errors,[]);
        await page.close();
        console.log('PASS',engine,width,'Twitter ratios/themes/PNG/JPEG, contrast, connected/horizontal replies, private lock and reload');

        const scroll = await browser.newPage({viewport:{width,height:900},hasTouch:true});
        await scroll.goto(origin+'/?mode=scroll');await scroll.waitForFunction(()=>window.ready);
        const value=()=>scroll.evaluate(()=>innerWidth>=1024?document.getElementById('customization-panel').scrollTop:window.scrollY);
        const open=scroll.getByRole('button',{name:'Open scroll controls',exact:true});
        if(width===390)await open.tap();else await open.click();
        const up=scroll.getByRole('button',{name:'Scroll up',exact:true}),down=scroll.getByRole('button',{name:'Scroll down',exact:true});
        if(width===390)await down.tap();else await down.click();await scroll.waitForTimeout(1000);
        assert.ok(Math.abs(await value()-340)<3,'Single click scrolls 340px');
        if(width>=1024)assert.equal(await scroll.evaluate(()=>window.scrollY),0,'Desktop scroll stays inside form');
        await down.dblclick({delay:80});await scroll.waitForTimeout(1200);
        assert.ok(await value()>3000,'Double tap jumps to bottom');
        await up.dblclick({delay:80});await scroll.waitForTimeout(1200);
        assert.ok(await value()<3,'Double tap jumps to top');
        const arrow=await down.boundingBox();await scroll.mouse.move(arrow.x+arrow.width/2,arrow.y+arrow.height/2);
        await scroll.mouse.down();await scroll.waitForTimeout(650);await scroll.mouse.move(10,10);await scroll.mouse.up();
        const afterHold=await value();assert.ok(afterHold>200,'Hold scrolls continuously even when pointer leaves');
        await scroll.waitForTimeout(250);assert.equal(await value(),afterHold,'Release outside stops hold');
        await down.focus();await scroll.keyboard.press('Enter');await scroll.waitForTimeout(700);
        assert.ok(await value()>afterHold+300,'Keyboard activates arrow');
        if(engine==='chrome' && width===390) {
          const session=await scroll.context().newCDPSession(scroll);
          const box=await down.boundingBox();const before=await value();
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
          await scroll.waitForTimeout(650);
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          assert.ok(await value()>before+200,'A real touch hold scrolls the mobile page');
          const stopped=await value();await scroll.waitForTimeout(200);assert.equal(await value(),stopped);
          await session.detach();
        }

        await scroll.getByRole('button',{name:'Arrow size',exact:true}).click();
        await scroll.getByRole('button',{name:'Large',exact:true}).click();
        assert.equal(await down.evaluate(el=>el.offsetHeight),44);
        await scroll.getByRole('slider',{name:'Arrow size',exact:true}).fill('48');
        assert.equal(await down.evaluate(el=>el.offsetHeight),48);
        await scroll.keyboard.press('Escape');
        const grip=await scroll.getByLabel('Drag scroll controls').boundingBox();
        await scroll.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await scroll.mouse.down();
        await scroll.mouse.move(100,250,{steps:8});await scroll.mouse.up();
        const saved=await scroll.evaluate(()=>JSON.parse(localStorage.getItem('form_quick_scroll_pos')));
        assert.ok(saved.x<150 && saved.y<300,'Widget can be dragged');
        await scroll.reload();await scroll.waitForFunction(()=>window.ready);
        assert.equal(await scroll.getByRole('button',{name:'Scroll down',exact:true}).evaluate(el=>el.offsetHeight),48);
        const restored=await scroll.locator('[data-form-quick-scroll]').boundingBox();assert.ok(Math.abs(restored.x-saved.x)<1);
        await scroll.setViewportSize({width:320,height:480});
        const resized=await scroll.locator('[data-form-quick-scroll]').boundingBox();assert.ok(resized.x>=0 && resized.y>=0 && resized.x+resized.width<=320 && resized.y+resized.height<=480);
        await scroll.getByRole('button',{name:'Collapse scroll controls',exact:true}).click();
        const bubble=scroll.getByRole('button',{name:'Open scroll controls',exact:true});
        await bubble.focus();await scroll.keyboard.press('Enter');assert.equal(await scroll.getByRole('button',{name:'Scroll down',exact:true}).count(),1);
        await scroll.screenshot({path:`tmp/twitter-controls/${engine}-${width}-scroll.png`});
        await scroll.close();
        console.log('PASS',engine,width,'scroll step/double tap/hold/keyboard/drag/size/reload/viewport bounds');
      }
    } finally { await browser.close(); }
  }
} finally { await new Promise(resolve=>server.close(resolve)); }
