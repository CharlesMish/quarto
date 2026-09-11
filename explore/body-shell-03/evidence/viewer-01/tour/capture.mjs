import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = '/home/cmish/MECHA/MT1';
const out = '/tmp/quarto-viewer-final-tour';
const require = createRequire(`${root}/package.json`);
const { chromium } = require('playwright');
const paths = [
  'src/presentation/palette.ts', 'src/presentation/viewerState.ts', 'src/presentation/fitCamera.ts',
  'src/scene/createScene.ts', 'src/ui/createUI.ts', 'src/style.css',
];
const sourceHashes = {};
for (const path of paths) sourceHashes[path] = createHash('sha256').update(await fs.readFile(`${root}/explore/body-shell-03/${path}`)).digest('hex');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const cases = [];
try {
  await page.goto('http://127.0.0.1:5195/');
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  const provenance = await page.evaluate(() => ({ build: window.__MT1.getBuildInfo(), state: window.__MT1.getInspectionState() }));
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);
    for (const [name, step] of [['handover', 4], ['seated', 5]]) {
      await page.evaluate(step => window.__MT1.presentation.setTourStep(step), step);
      for (const expanded of viewport.width < 800 ? [false, true] : [false]) {
        if (viewport.width < 800 && (await page.locator('#tourDetailsBtn').getAttribute('aria-expanded')) !== String(expanded)) {
          await page.locator('#tourDetailsBtn').click();
        }
        await page.waitForTimeout(350);
        const observation = await page.evaluate(async () => {
          const url = performance.getEntriesByType('resource').map(r => r.name).find(name => name.includes('/@babylonjs_core_Engines_engine.js'));
          if (!url) throw new Error('Current engine module missing');
          const { Engine } = await import(url);
          const camera = Engine.LastCreatedScene.activeCamera;
          const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
          const canvas = document.getElementById('view');
          const card = document.getElementById('tourCard');
          const controls = [...document.querySelectorAll('.control-deck button, .control-deck select, .tour-navigation button')].filter(element => element.getClientRects().length > 0).map(element => {
            const r = element.getBoundingClientRect();
            const point = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            return { id: element.id || element.textContent.trim(), disabled: Boolean(element.disabled), inViewport: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, hit: element === point || element.contains(point) };
          });
          return { camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: camera.target.asArray() }, canvas: rect(canvas), card: rect(card), controls, body: window.__MT1.getBodyConceptState().enabled, presentation: window.__MT1.presentation.getState(), inspection: window.__MT1.getInspectionState(), detailsExpanded: document.getElementById('tourDetailsBtn').getAttribute('aria-expanded'), horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
        });
        if (!observation.body) throw new Error('BODY ON unexpectedly changed');
        if (viewport.width < 800 && observation.detailsExpanded !== String(expanded)) throw new Error('Details disclosure did not reach requested state');
        if (observation.horizontalOverflow) throw new Error('Horizontal page overflow');
        if (viewport.width < 800 && observation.card.bottom > observation.canvas.y) throw new Error('Mobile tour card overlaps the viewport');
        if (observation.controls.some(c => !c.disabled && (!c.inViewport || !c.hit))) throw new Error('A visible enabled control is inaccessible');
        const image = `tour-${name}-${viewport.width}${expanded ? '-details' : ''}.png`;
        await page.screenshot({ path: `${out}/${image}` });
        cases.push({ viewport, name, step, expanded, observation, image });
        console.log(`PASS ${image}`);
      }
    }
  }
  for (const path of paths) {
    const after = createHash('sha256').update(await fs.readFile(`${root}/explore/body-shell-03/${path}`)).digest('hex');
    if (after !== sourceHashes[path]) throw new Error(`Source changed during capture: ${path}`);
  }
  await fs.writeFile(`${out}/review.json`, JSON.stringify({ sourceHashes, provenance, cases, errors, authorityParticipation: 'none', scope: 'Actual integrated tour cameras and UI; no camera, lighting or visibility overrides.' }, null, 2) + '\n');
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
