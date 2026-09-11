import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';
const out = resolve(process.argv[2]);
const url = process.argv[3] || 'http://127.0.0.1:5197/';
mkdirSync(out, {recursive:false});
const hashes={};
function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory())walk(path);else hashes[relative(process.cwd(),path)]=createHash('sha256').update(readFileSync(path)).digest('hex');}}
walk(resolve('src'));
const report={authorityParticipation:'none',url,sourceHashes:hashes,frames:[],errors:[]};
const browser=await chromium.launch({headless:true});
try {
const page=await browser.newPage({viewport:{width:1440,height:960}});
page.setDefaultTimeout(240000);
page.on('pageerror',e=>report.errors.push(e.message));
await page.goto(url);
await page.waitForFunction(()=>Boolean(window.__MT1?.getInspectionState));
report.provenance=await page.evaluate(()=>({build:window.__MT1.getBuildInfo(),inspection:window.__MT1.getInspectionState()}));
for(const palette of ['accepted','hush-basin']) for(const pose of [0,1]) for(const camera of ['body','fo1FwdRoot','fo1AftRoot','tourHandover']) {
await page.evaluate(({palette,pose,camera})=>{const a=window.__MT1;a.presentation.setPalette(palette);a.setMachineT(pose);a.setCamera(camera);},{palette,pose,camera});
await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const filename=`${palette}-${pose}-${camera}.png`;
await page.screenshot({path:join(out,filename)});
report.frames.push({filename,palette,pose,camera,state:await page.evaluate(()=>({inspection:window.__MT1.getInspectionState(),body:window.__MT1.getBodyConceptState()}))});
}
report.pass=report.errors.length===0;
writeFileSync(join(out,'review.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(join(out,'index.html'),'<!doctype html><meta charset="utf-8"><title>Quarto reconciliation review</title><style>body{background:#182020;color:#ddd;font:16px system-ui}img{width:100%}figure{max-width:1100px}</style><h1>Quarto reconciliation review</h1>'+report.frames.map(f=>`<figure><img src="${f.filename}"><figcaption>${f.filename}</figcaption></figure>`).join(''));
if(!report.pass)throw Error(JSON.stringify(report.errors));
} finally {await browser.close();}
