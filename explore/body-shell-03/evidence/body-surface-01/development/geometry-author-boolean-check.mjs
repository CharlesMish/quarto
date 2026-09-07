import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root = '/home/cmish/MECHA/MT1/explore/body-shell-03';
const ts = (await import(pathToFileURL(`${root}/node_modules/typescript/lib/typescript.js`).href)).default;
const cache = new Map();
async function load(file) {
  if(cache.has(file)) return cache.get(file);
  let js=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const imports=[...js.matchAll(/from\s+["']([^"']+)["']/g)];
  for(const m of imports){const spec=m[1]; const url=spec.startsWith('.') ? await load(path.resolve(path.dirname(file),`${spec}.ts`)) : pathToFileURL(path.resolve(root,'node_modules',`${spec}.js`)).href;js=js.replace(m[0],`from ${JSON.stringify(url)}`);}
  const url=`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;cache.set(file,url);return url;
}
const {createBodyShellConcept}=await import(await load(`${root}/src/scene/bodyShellConcept.ts`));
const {NullEngine}=await import(pathToFileURL(`${root}/node_modules/@babylonjs/core/Engines/nullEngine.js`).href);
const {Scene}=await import(pathToFileURL(`${root}/node_modules/@babylonjs/core/scene.js`).href);
const engine=new NullEngine();const scene=new Scene(engine);const body=createBodyShellConcept(scene);
const sub=(a,b)=>a.map((n,i)=>n-b[i]);const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
const report=[];for(const name of body.meshes){const m=scene.getMeshByName(name),p=m.getVerticesData('position'),n=m.getVerticesData('normal'),idx=m.getIndices();const points=[];for(let i=0;i<p.length;i+=3)points.push(p.slice(i,i+3));const keys=points.map(v=>v.map(x=>Math.round(x*1e9)).join(','));const edges=new Map();let volume=0,degenerate=0,badNormals=0;for(let i=0;i<idx.length;i+=3){const ids=idx.slice(i,i+3),[a,b,c]=ids.map(j=>points[j]);const normal=cross(sub(a,b),sub(c,b)),length=Math.hypot(...normal);if(length<1e-10)degenerate++;else for(const j of ids){const actual=n.slice(j*3,j*3+3);if(dot(actual,normal)/length<.99999)badNormals++;}volume+=dot(a,cross(b,c))/6;for(let j=0;j<3;j++){const u=keys[ids[j]],v=keys[ids[(j+1)%3]],key=[u,v].sort().join('|');const e=edges.get(key)??[];e.push([u,v]);edges.set(key,e);}}
 const badEdges=[...edges.values()].filter(e=>e.length!==2||e[0][0]!==e[1][1]||e[0][1]!==e[1][0]).length;report.push({name,triangles:idx.length/3,degenerate,badNormals,badEdges,volume,alpha:m.material.alpha,blend:m.material.needAlphaBlendingForMesh(m)});}
const errors=report.filter(r=>r.degenerate||r.badNormals||r.badEdges||r.volume>=0||r.alpha!==1||r.blend);body.setPropGhost(true);const ghostErrors=body.meshes.filter(name=>scene.getMeshByName(name).material.needAlphaBlendingForMesh(scene.getMeshByName(name))!==body.propGhostMeshes.includes(name));body.setPropGhost(false);
console.log(JSON.stringify({meshCount:body.meshes.length,errors,ghostErrors,report},null,2));scene.dispose();engine.dispose();if(errors.length||ghostErrors.length||body.meshes.length!==38)process.exitCode=1;
