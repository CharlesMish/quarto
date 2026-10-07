// Matched isolated-browser evidence; writes only the new correction evidence directory.
import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const out=resolve(process.env.EVIDENCE_DIR ?? 'evidence/showcase-corrections-01');
const urls={base:process.env.BASE_URL ?? 'http://127.0.0.1:5193',candidate:process.env.CANDIDATE_URL ?? 'http://127.0.0.1:5194'};
const views=[['desktop',{width:1280,height:720}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]];
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const data={reviewedBase:'87b544b82f6d537208f14ed3235a55180d968e4c',candidateParent:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  sourceFiles:{},browser:browser.version(),method:'Installed default Playwright Chromium; isolated contexts; no owner profile or executable/launch overrides. Touch is emulated, not physical-phone evidence.',urls,framing:[],intro:[],takeover:[],appearance:[]};
for(const path of ['scene/createScene.ts','presentation/frameVehicle.ts','presentation/palette.ts','presentation/lighting.ts'])data.sourceFiles[path]=createHash('sha256').update(await readFile('src/'+path)).digest('hex');
async function open(kind,viewport,query='?intro=0&lighting=flat',touch=false){
 const ctx=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(touch){const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});}
 await page.goto(urls[kind]+'/'+query);await page.waitForFunction(()=>Boolean(window.__MT1?.presentation));
 const src=await(await page.request.get(new URL('/src/scene/createScene.ts',page.url()).href)).text();
 const module=name=>new URL(src.match(new RegExp('import\\s*\\{\\s*'+name+'\\s*\\}\\s*from\\s*["\']([^"\']+)'))[1],page.url()).href;
 return {ctx,page,errors,modules:{engineUrl:module('Engine'),vectorsUrl:module('Vector3')}};
}
async function frames(p){await p.evaluate(async()=>{for(let n=0;n<3;n++)await new Promise(r=>requestAnimationFrame(r));});}
async function read(p,modules){return p.evaluate(async({engineUrl,vectorsUrl})=>{
 const{Engine}=await import(engineUrl);const{Vector3}=await import(vectorsUrl);
 const scene=Engine.LastCreatedScene,camera=scene.activeCamera,engine=scene.getEngine();
 const names=new Set(window.__MT1.getRenderInventory().filter(r=>r.objectClass==='physical authority'||r.family==='body-shell-concept'||r.family==='h1-presentation').map(r=>r.semanticName));
 const vp=camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight());
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const mesh of scene.meshes){if(!names.has(mesh.name)||!mesh.isEnabled()||!mesh.isVisible||mesh.visibility<=0||!mesh.getTotalVertices())continue;
  mesh.computeWorldMatrix(true);const vertices=mesh.getVerticesData('position');if(!vertices)continue;
  for(let i=0;i<vertices.length;i+=3){const q=Vector3.Project(Vector3.FromArray(vertices,i),mesh.getWorldMatrix(),scene.getTransformMatrix(),vp);
   minX=Math.min(minX,q.x/vp.width);maxX=Math.max(maxX,q.x/vp.width);minY=Math.min(minY,q.y/vp.height);maxY=Math.max(maxY,q.y/vp.height);}
 }
 return {t:window.__MT1.getMachineT(),state:window.__MT1.presentation.getState(),inspection:window.__MT1.getInspectionState(),bounds:{minX,maxX,minY,maxY},
  camera:{alpha:camera.alpha,beta:camera.beta,radius:camera.radius,target:camera.target.asArray(),pan:camera.panningSensibility,pinch:camera.pinchPrecision,wheel:camera.wheelPrecision},
  renderer:engine.getGlInfo().renderer,canvas:document.querySelector('#view').getBoundingClientRect().toJSON()};
},modules);}
async function save(){await writeFile(out+'/browser-comparison.json',JSON.stringify(data,null,2)+'\n');}
try{
 for(const[name,viewport]of views)for(const kind of ['base','candidate']){
  const{ctx,page,modules,errors}=await open(kind,viewport);await frames(page);
  const load=await read(page,modules);await page.screenshot({path:out+`/${kind}-${name}-load.png`});
  await page.locator('#fitBtn').click();await frames(page);const fit=await read(page,modules);
  // Reload to retain composed endpoint guidance on original PR13 as well.
  await page.reload();await page.waitForFunction(()=>Boolean(window.__MT1?.presentation));
  await page.locator('#machineSlider').press('End');await page.waitForTimeout(1200);
  const drive=await read(page,modules);await page.screenshot({path:out+`/${kind}-${name}-drive.png`});
  await page.locator('#machineSlider').fill('0.12');await frames(page);
  const unfolding=await read(page,modules);await page.screenshot({path:out+`/${kind}-${name}-unfolding.png`});
  data.framing.push({kind,name,load,fit,drive,unfolding,errors});await ctx.close();await save();console.log('framing',kind,name,unfolding.bounds);
 }
 for(const[name,viewport]of views)for(const kind of ['base','candidate']){
  const{ctx,page,modules,errors}=await open(kind,viewport,'?intro=1&lighting=flat');
  await page.waitForFunction(()=>window.__MT1.presentation.getState().direction<0&&window.__MT1.getMachineT()<0.13&&window.__MT1.getMachineT()>0.02,undefined,{timeout:45000});
  await page.keyboard.press('Space');await frames(page);
  const sample=await read(page,modules);await page.screenshot({path:out+`/${kind}-${name}-intro-return.png`});
  data.intro.push({kind,name,sample,errors});await ctx.close();await save();console.log('intro',kind,name,sample.bounds);
 }
 for(const kind of ['base','candidate'])for(const input of ['wheel','touch','key','space']){
  const{ctx,page,modules,errors}=await open(kind,{width:390,height:844},'?intro=1&lighting=flat',input==='touch');
  await page.waitForFunction(()=>window.__MT1.getMachineT()>0.2);
  const before=await read(page,modules),box=await page.locator('#view').boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
  if(input==='wheel'){await page.mouse.move(x,y);await page.mouse.wheel(0,40);}
  else if(input==='touch'){const cdp=await ctx.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+24,y,id:0}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else await page.keyboard.press(input==='space'?'Space':'a');
  const after=await read(page,modules);await page.waitForTimeout(600);const later=await read(page,modules);
  data.takeover.push({kind,input,before,after,later,errors});await ctx.close();await save();console.log('takeover',kind,input,after.t,later.t,later.state.automatic);
 }
 for(const kind of ['base','candidate'])for(const tier of ['flat','lite','studio']){
  const{ctx,page,modules,errors}=await open(kind,{width:960,height:600},`?intro=0&lighting=${tier}`);
  for(const palette of ['hush-basin','accepted'])for(const study of [false,true]){
   await page.evaluate(({palette,study})=>{window.__MT1.presentation.setPose(1);window.__MT1.setCamera('driveBody');window.__MT1.presentation.setPalette(palette);window.__MT1.setBodySection(study);},{palette,study});await frames(page);
   const sample=await page.evaluate(async({engineUrl})=>{const{Engine}=await import(engineUrl);const scene=Engine.LastCreatedScene;
    const materials=scene.materials.filter(m=>/_joint$|_rail$|_folio$/.test(m.name)||['matMech','matRail','matVane'].includes(m.name)).map(m=>({name:m.name,diffuse:m.diffuseColor.asArray(),emissive:m.emissiveColor.asArray(),specular:m.specularColor.asArray()}));
    return {lighting:window.__MT1.presentation.getLighting(),materials,lights:scene.lights.map(l=>({name:l.name,intensity:l.intensity,enabled:l.isEnabled()}))};},modules);
   data.appearance.push({kind,tier,palette,requestedStudy:study,...sample,errors});
   if(palette==='hush-basin'&&!study)await page.screenshot({path:out+`/${kind}-${tier}-matched-drive.png`});
  }
  await ctx.close();await save();
 }
 console.log('Matched evidence complete');
}finally{await save();await browser.close();}
