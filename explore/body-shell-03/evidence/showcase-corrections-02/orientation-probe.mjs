// Adapted from the independent review probe: paths/output only. Implementer recheck, not independent approval.
import { chromium } from '../../node_modules/playwright/index.mjs';
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const out = new URL('./captures/', import.meta.url).pathname;
const base = process.env.REVIEW_URL || 'http://127.0.0.1:5194';
const browser = await chromium.launch();
const results = [], errors = [];
async function pageFor(viewport, reducedMotion='no-preference', lighting='flat') {
  const context = await browser.newContext({viewport, reducedMotion, hasTouch:true});
  const page = await context.newPage();
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto(base+'/?intro=0&lighting='+lighting);
  await page.waitForFunction(()=>window.__MT1?.presentation);
  const source = await (await page.request.get(base+'/src/scene/createScene.ts')).text();
  const map=source.match(/sourceMappingURL=data:application\/json;base64,([^\s]+)/);
  if(map){const parsed=JSON.parse(Buffer.from(map[1],'base64').toString());const local=readFileSync(new URL('../../src/scene/createScene.ts',import.meta.url),'utf8');results.push({name:'served source identity',url:base,matched:parsed.sourcesContent?.includes(local),sha256:createHash('sha256').update(local).digest('hex')});}
  const engine = source.match(/import\s*\{\s*Engine\s*\}\s*from\s*["']([^"']+)["']/)[1];
  const vectors = source.match(/import\s*\{\s*Vector3\s*\}\s*from\s*["']([^"']+)["']/)[1];
  await page.evaluate(async ({engine,vectors})=>{
    const {Engine}=await import(engine); const {Matrix,Vector3}=await import(vectors);
    const scene=Engine.LastCreatedScene, camera=scene.activeCamera, render=scene.getEngine();
    const names=new Set(window.__MT1.getRenderInventory().filter(r=>r.objectClass==='physical authority'||['body-shell-concept','h1-presentation'].includes(r.family)).map(r=>r.semanticName));
    const meshes=scene.meshes.filter(m=>names.has(m.name));
    function bounds(actual=false) {
      const vp=camera.viewport.toGlobal(render.getRenderWidth(),render.getRenderHeight());
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for(const m of meshes) {
        if(!m.isEnabled()||!m.isVisible||m.visibility<=0||!m.getTotalVertices())continue;
        const positions=actual?m.getVerticesData('position'):null;
        const points=positions?Array.from({length:positions.length/3},(_,i)=>Vector3.TransformCoordinates(Vector3.FromArray(positions,i*3),m.getWorldMatrix())):m.getBoundingInfo().boundingBox.vectorsWorld;
        for(const p of points){const v=Vector3.Project(p,Matrix.Identity(),scene.getTransformMatrix(),vp);minX=Math.min(minX,v.x/vp.width);maxX=Math.max(maxX,v.x/vp.width);minY=Math.min(minY,v.y/vp.height);maxY=Math.max(maxY,v.y/vp.height);}
      }
      return {minX,maxX,minY,maxY};
    }
    const read=()=>({at:performance.now(),t:window.__MT1.getMachineT(),state:window.__MT1.presentation.getState(),radius:camera.radius,target:camera.target.asArray(),alpha:camera.alpha,beta:camera.beta,shift:camera.targetScreenOffset.asArray(),bounds:bounds(),canvas:{width:render.getRenderWidth(),height:render.getRenderHeight(),clientWidth:render.getRenderingCanvas().clientWidth,clientHeight:render.getRenderingCanvas().clientHeight}});
    window.__probe={scene,camera,read,bounds,trace:[],capture:null};
    scene.onAfterRenderObservable.add(()=>{
      const p=window.__probe;if(!p.record)return;const s=read();p.trace.push(s);
      const b=s.bounds; const overflow=Math.max(-b.minX,b.maxX-1,-b.minY,b.maxY-1);
      if(overflow>0.001&&(!p.capture||overflow>p.capture.overflow))p.capture={overflow,state:s,actual:bounds(true),png:document.querySelector('#view').toDataURL('image/png')};
    });
  },{engine:new URL(engine,base).href,vectors:new URL(vectors,base).href});
  return {context,page};
}
const frames=(page,n)=>page.evaluate(n=>new Promise(resolve=>{let count=0;const o=window.__probe.scene.onAfterRenderObservable.add(()=>{if(++count>=n){window.__probe.scene.onAfterRenderObservable.remove(o);resolve();}})}),n);
async function collect(page,name,extra={}) {
  const data=await page.evaluate(()=>({build:window.__MT1.getBuildInfo(),inspection:window.__MT1.getInspectionState(),trace:window.__probe.trace,capture:window.__probe.capture,final:window.__probe.read(),actual:window.__probe.bounds(true)}));
  if(data.capture){writeFileSync(out+name+'.png',Buffer.from(data.capture.png.split(',')[1],'base64'));delete data.capture.png;}
  await page.screenshot({path:out+name+'-page.png'});
  writeFileSync(out+name+'.json',JSON.stringify({...extra,...data},null,2));
  const clipped=data.trace.filter(s=>s.bounds.minX<-.001||s.bounds.maxX>1.001||s.bounds.minY<-.001||s.bounds.maxY>1.001);
  const summary={name,...extra,frames:data.trace.length,clipped:clipped.length,firstClipped:clipped[0],final:data.final,actual:data.actual,capture:data.capture};
  results.push(summary);console.log(JSON.stringify(summary));
}
try {
 const {page,context}=await pageFor({width:390,height:844});
 await page.locator('#machineSlider').press('End'); await frames(page,45);
 await page.evaluate(()=>{window.__probe.record=true;});
 for(let i=0;i<12;i++) {await page.setViewportSize(i%2?{width:390,height:844}:{width:844,height:390});await frames(page,6);}
 await collect(page,'isolated-orientation-cycle');await context.close();
} finally {
 writeFileSync(out+'orientation-summary.json',JSON.stringify({base,results,errors},null,2));await browser.close();
}
