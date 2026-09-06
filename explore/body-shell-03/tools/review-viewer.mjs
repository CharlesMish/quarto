import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
function option(name, fallback) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
}
const output = option('--output');
if (!output) throw new Error('Provide --output /absolute/new/evidence-directory');
const directory = resolve(output);
await mkdir(directory, { recursive: false });
const candidateURL = option('--url', 'http://127.0.0.1:5185');
const baselineURL = option('--baseline-url');
const capturesOnly = args.includes('--captures-only');
const timingsOnly = args.includes('--timings-only');
if (capturesOnly && timingsOnly) throw new Error('Choose only one review subset');
const browser = await chromium.launch({ headless: true });
const report = {
  kind: 'presentation-viewer-review', authorityParticipation: 'none added',
  generatedAt: new Date().toISOString(), browser: browser.version(),
  note: 'Canonical pose commands use the unchanged frozen certification path. No authority or accepted-evidence writer is invoked. Timing is local browser evidence, not a device-independent performance guarantee.',
  timings: [], captures: [], layouts: [], errors: [],
};

function distribution(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return { count: values.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1], maximumMs: sorted.at(-1) };
}

async function timedViewer(url, label) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', error => report.errors.push(`${label}: ${error.message}`));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.__MT1?.getInspectionState));
  const before = await page.evaluate(() => ({ build: window.__MT1.getBuildInfo(), inspection: window.__MT1.getInspectionState() }));
  const rendering = await page.evaluate(() => {
    const canvas = document.querySelector('#view');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      canvas: { width: canvas.width, height: canvas.height },
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null,
      vendor: info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : null,
    };
  });
  const cold = await page.evaluate(() => {
    const start = performance.now();
    window.__MT1.setMachineT(0);
    return { milliseconds: performance.now() - start, inspection: window.__MT1.getInspectionState() };
  });
  const warm = [];
  for (const debug of [false, true]) {
    await page.evaluate(value => window.__MT1.setDebug(value), debug);
    const durations = await page.evaluate(async () => {
      const values = [];
      for (let i = 0; i <= 60; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        const start = performance.now();
        window.__MT1.setMachineT(i / 60);
        values.push(performance.now() - start);
      }
      return values;
    });
    warm.push({ debug, ...distribution(durations), samplesMs: durations });
  }
  await page.evaluate(() => window.__MT1.setDebug(false));
  report.timings.push({ label, before, rendering, cold, warm });
  console.log(`${label}: cold ${cold.milliseconds.toFixed(1)} ms; warm hidden-debug p95 ${warm[0].p95Ms.toFixed(2)} ms`);
  return page;
}

try {
  if (baselineURL && !capturesOnly) {
    const baseline = await timedViewer(baselineURL, 'accepted-main');
    await baseline.close();
  }
  const page = capturesOnly
    ? await browser.newPage({ viewport: { width: 1600, height: 900 } })
    : await timedViewer(candidateURL, 'viewer-01');
  if (capturesOnly) {
    page.on('pageerror', error => report.errors.push(`viewer-01: ${error.message}`));
    await page.goto(candidateURL);
    await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
    report.provenance = await page.evaluate(() => ({ build: window.__MT1.getBuildInfo(), inspection: window.__MT1.getInspectionState() }));
  }
  if (timingsOnly) {
    assert.deepEqual(report.errors, []);
    report.pass = true;
    await writeFile(join(directory, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  } else {
  const poses = [
    ['spread', 0, 'body', true], ['fold', 0.24, 'body', true],
    ['reorient', 0.6, 'body', true], ['seat', 0.86, 'driveBody', true],
    ['handover', 0.94, 'tourHandover', false], ['drive', 1, 'driveBody', true],
    ['stern', 1, 'tourSeated', false], ['released', 0.998, 'tourSeated', false],
  ];
  for (const [name, t, camera, fit] of poses) {
    await page.evaluate(({ t, camera, fit }) => {
      const api = window.__MT1;
      api.setMachineT(t);
      api.setCamera(camera);
      if (fit) api.presentation.fitCamera();
    }, { t, camera, fit });
    const before = await page.evaluate(() => ({ inspection: window.__MT1.getInspectionState(), inventory: window.__MT1.getRenderInventory() }));
    for (const palette of ['accepted', 'hush-basin']) {
      await page.evaluate(value => window.__MT1.presentation.setPalette(value), palette);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const after = await page.evaluate(() => ({ inspection: window.__MT1.getInspectionState(), inventory: window.__MT1.getRenderInventory() }));
      assert.deepEqual(after, before, `${name}: palette changed mechanism/visibility/identity/certificate`);
      const filename = `${name}-${palette}.png`;
      await page.locator('#view').screenshot({ path: join(directory, filename) });
      report.captures.push({ name, t, camera, fit, palette, filename, inventoryAndInspectionPreserved: true });
    }
  }
  await page.evaluate(() => {
    window.__MT1.setMachineT(1);
    window.__MT1.setBodyConcept(false);
    window.__MT1.setCamera('body');
    window.__MT1.presentation.fitCamera();
  });
  await page.locator('#view').screenshot({ path: join(directory, 'drive-body-off.png') });
  await page.evaluate(() => window.__MT1.setBodyConcept(true));

  for (const [width, height] of [[1600, 900], [1280, 720], [700, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => { window.__MT1.setMachineT(0); window.__MT1.setCamera('body'); window.__MT1.presentation.fitCamera(); });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await page.evaluate(() => {
      const canvas = document.querySelector('#view').getBoundingClientRect();
      const deck = document.querySelector('.control-deck').getBoundingClientRect();
      return { canvas: canvas.toJSON(), deck: deck.toJSON(), canvasHeightFraction: canvas.height / innerHeight, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.equal(layout.horizontalOverflow, false);
    assert.ok(layout.canvasHeightFraction >= 0.6, `${width}: primary layout occludes too much of the scene`);
    await page.screenshot({ path: join(directory, `layout-${width}.png`) });
    report.layouts.push({ width, height, ...layout });
  }
  assert.deepEqual(report.errors, []);
  report.pass = true;
  await writeFile(join(directory, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS: ${report.captures.length} matched palette captures and ${report.layouts.length} layouts saved to ${directory}`);
  }
} catch (error) {
  report.pass = false;
  report.failure = String(error?.stack ?? error);
  await writeFile(join(directory, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
