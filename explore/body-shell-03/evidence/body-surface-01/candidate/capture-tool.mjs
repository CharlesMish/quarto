import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// New-directory visual evidence only. No accepted evidence or authority writer
// is imported. Canonical controls retain the existing runtime certificate path.
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  return at < 0 ? fallback : args[at + 1];
};
const output = option('--output');
const sourceRoot = option('--source-root');
if (!output || !sourceRoot) throw new Error('Required: --output NEW_DIRECTORY --source-root SHELL_PACKAGE');
const directory = resolve(output);
const sourceDirectory = resolve(sourceRoot);
const url = option('--url', 'http://127.0.0.1:5195/');
const label = option('--label', 'candidate');
const baselineReport = option('--baseline-report');
await mkdir(dirname(directory), { recursive: true });
await mkdir(directory, { recursive: false });
const hash = value => createHash('sha256').update(value).digest('hex');

async function sourceHashes() {
  const result = {};
  async function walk(folder) {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(folder, entry.name);
      if (entry.isDirectory()) await walk(file);
      else result[relative(sourceDirectory, file)] = hash(await readFile(file));
    }
  }
  await walk(join(sourceDirectory, 'src'));
  return result;
}

const cameras = {
  overview: { alpha: .78, beta: 1.12, radius: 18, target: [0, 1.1, -.25] },
  nosePort: { alpha: 2.25, beta: 1.12, radius: 4.4, target: [0, .85, 4.35] },
  noseStarboard: { alpha: .9, beta: 1.12, radius: 4.4, target: [0, .85, 4.35] },
  noseLow: { alpha: 1.18, beta: 1.70, radius: 3.2, target: [0, .45, 4.45] },
  port: { alpha: Math.PI, beta: 1.27, radius: 14, target: [0, 1.1, -.35] },
  starboard: { alpha: 0, beta: 1.27, radius: 14, target: [0, 1.1, -.35] },
  top: { alpha: -Math.PI / 2, beta: .06, radius: 16, target: [0, 1.0, -.35] },
  stern: { alpha: -1.12, beta: 1.15, radius: 8.8, target: [0, 1, -4.3] },
};

const definitions = [
  { name: 'spread-overview', t: 0, camera: 'overview' },
  { name: 'spread-nose-port', t: 0, camera: 'nosePort' },
  { name: 'spread-nose-starboard', t: 0, camera: 'noseStarboard' },
  { name: 'spread-low-underside', t: 0, camera: 'noseLow' },
  { name: 'spread-port', t: 0, camera: 'port' },
  { name: 'spread-starboard', t: 0, camera: 'starboard' },
  { name: 'drive-nose-port', t: 1, camera: 'nosePort' },
  { name: 'drive-nose-starboard', t: 1, camera: 'noseStarboard' },
  { name: 'drive-port', t: 1, camera: 'port' },
  { name: 'drive-starboard', t: 1, camera: 'starboard' },
  { name: 'drive-top', t: 1, camera: 'top' },
  { name: 'handover-stern', t: .94, camera: 'stern' },
  { name: 'drive-stern', t: 1, camera: 'stern' },
  { name: 'drive-body-off', t: 1, camera: 'overview', body: false },
  { name: 'drive-body-section', t: 1, camera: 'noseStarboard', bodySection: true },
  { name: 'handover-prop-section', t: .94, camera: 'stern', propSection: true },
];

const report = {
  kind: 'body-surface-visual-review', label, url, generatedAt: new Date().toISOString(),
  authorityParticipation: 'none',
  note: 'Presentation comparison only. Initial provenance is lightweight. Intentional canonical poses use the frozen runtime certificate path. Captures establish no timing or native Godot claim.',
  sourceHashes: await sourceHashes(),
  toolSha256: hash(await readFile(fileURLToPath(import.meta.url))),
  frames: [], playback: [], orbit: [], mobile: [], errors: [],
};
await writeFile(join(directory, 'capture-tool.mjs'), await readFile(fileURLToPath(import.meta.url)));
const browser = await chromium.launch({ headless: true });
report.browser = browser.version();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(240000);
page.on('pageerror', error => report.errors.push(error.message));
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function installInspectionAccess() {
  await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(r => r.name)
      .find(name => name.includes('/@babylonjs_core_Engines_engine.js'));
    if (!url) throw new Error('Could not locate the current viewer Engine module');
    const { Engine } = await import(url);
    const scene = Engine.LastCreatedScene;
    if (!scene) throw new Error('Current viewer scene missing');
    window.__BODY_SURFACE_REVIEW = {
      scene,
      camera(settings) {
        window.__MT1.setCamera('body');
        const camera = scene.activeCamera;
        // The low view looks upward from above the existing floor. This only
        // relaxes the review camera's orbit limit; no floor/mesh is hidden.
        camera.upperBetaLimit = Math.PI - .01;
        camera.setTarget(camera.target.clone().set(...settings.target));
        camera.alpha = settings.alpha;
        camera.beta = settings.beta;
        camera.radius = settings.radius;
      },
      snapshot() {
        const api = window.__MT1;
        const camera = scene.activeCamera;
        const material = mesh => ({
          name: mesh.name, material: mesh.material?.name, alpha: mesh.material?.alpha,
          transparencyMode: mesh.material?.transparencyMode, backFaceCulling: mesh.material?.backFaceCulling,
          visibility: mesh.visibility, enabled: mesh.isEnabled(),
        });
        return {
          inspection: api.getInspectionState(),
          mechanism: api.getRenderInventory().filter(row => row.objectClass === 'physical authority'),
          body: api.getBodyConceptState(),
          bodyMaterials: scene.meshes.filter(mesh => mesh.name.startsWith('BODY_')).map(material),
          camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: camera.target.asArray() },
          lighting: { clearColor: scene.clearColor.asArray(), lights: scene.lights.map(light => ({
            name: light.name, intensity: light.intensity, diffuse: light.diffuse.asArray(), specular: light.specular.asArray(),
            position: light.position?.asArray(), direction: light.direction?.asArray(), groundColor: light.groundColor?.asArray(),
          })) },
        };
      },
    };
  });
}

async function snapshot() {
  const state = await page.evaluate(() => window.__BODY_SURFACE_REVIEW.snapshot());
  const mechanismSha256 = hash(JSON.stringify(state.mechanism));
  const selectedMechanism = state.mechanism.filter(row => /^(FL_INNER_ARMOR_0|FR_OUTER_ARMOR_0|RL_INNER_ARMOR|RR_OUTER_ARMOR|S5_CORE_PROXY|S5_RECEIVER_(PORT|TOP)|S5_LOCK_PIN_PORT)$/.test(row.semanticName));
  return { ...state, mechanism: undefined, mechanismSha256, mechanismCount: state.mechanism.length, selectedMechanism };
}

async function setPose(definition) {
  await page.evaluate(({ definition, camera }) => {
    const api = window.__MT1;
    api.setBodyConcept(definition.body !== false);
    api.setBodySection(Boolean(definition.bodySection));
    api.setPropSection(Boolean(definition.propSection));
    api.setMachineT(definition.t);
    window.__BODY_SURFACE_REVIEW.camera(camera);
  }, { definition, camera: cameras[definition.camera] });
  await settle();
}

async function gallery() {
  const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const figures = rows => rows.map(row => `<figure><img loading="lazy" src="${esc(row.filename)}" alt="${esc(row.name || row.filename)}"><figcaption>${esc(row.name || row.filename)}</figcaption></figure>`).join('');
  const style = '<style>body{margin:24px;background:#11191b;color:#d9e0d9;font:15px/1.5 system-ui}h1,h2{font-weight:550}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px 0}a{color:#8bd3c4}</style>';
  await writeFile(join(directory, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Quarto body surface review · ${esc(label)}</title>${style}<h1>Quarto body surface review · ${esc(label)}</h1><p>Actual viewer geometry. Paired cameras and lights; authority participation: none.</p><h2>Static views and explicit inspection modes</h2><div class="grid">${figures(report.frames)}</div><h2>Actual forward/reverse playback</h2><div class="grid">${figures(report.playback)}</div><h2>Orbit</h2><div class="grid">${figures(report.orbit)}</div><h2>Mobile tour</h2><div class="grid">${figures(report.mobile)}</div>`);
  if (baselineReport) {
    const prefix = relative(directory, dirname(resolve(baselineReport))).split('\\').join('/');
    const pairs = report.frames.map(row => `<h2>${esc(row.name)} · ${esc(row.palette)}</h2><div class="grid"><figure><a href="${esc(prefix)}/${esc(row.filename)}"><img loading="lazy" src="${esc(prefix)}/${esc(row.filename)}" alt="Before ${esc(row.name)}"></a><figcaption>Accepted baseline · before surface repair</figcaption></figure><figure><a href="${esc(row.filename)}"><img loading="lazy" src="${esc(row.filename)}" alt="After ${esc(row.name)}"></a><figcaption>Body surface candidate · after repair</figcaption></figure></div>`).join('');
    await writeFile(join(directory, 'comparison.html'), `<!doctype html><meta charset="utf-8"><title>Quarto body surfaces · before and after</title>${style}<h1>Quarto body surfaces · before and after</h1><p>Identical canonical poses, cameras and lighting. Physical-mechanism inventory and inspection state match in every pair. Click an image for full resolution.</p>${pairs}`);
  }
}

try {
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.__MT1?.presentation));
  report.provenance = await page.evaluate(() => ({ build: window.__MT1.getBuildInfo(), inspection: window.__MT1.getInspectionState() }));
  await installInspectionAccess();
  for (const definition of definitions) {
    await setPose(definition);
    const before = await snapshot();
    for (const palette of ['hush-basin', 'accepted']) {
      await page.evaluate(p => window.__MT1.presentation.setPalette(p), palette);
      await settle();
      const state = await snapshot();
      assert.equal(state.mechanismSha256, before.mechanismSha256, `${definition.name}: palette changed mechanism`);
      assert.deepEqual(state.inspection, before.inspection, `${definition.name}: palette changed inspection state`);
      assert.deepEqual(state.camera, before.camera);
      assert.deepEqual(state.lighting, before.lighting);
      const filename = `${definition.name}-${palette}.png`;
      await page.locator('#view').screenshot({ path: join(directory, filename) });
      report.frames.push({ ...definition, palette, filename, state });
    }
    console.log(`CAPTURE ${label} ${definition.name}`);
  }

  await setPose({ t: 0, camera: 'overview' });
  await page.evaluate(() => window.__MT1.presentation.setPalette('hush-basin'));
  await page.locator('#autoBtn').click();
  for (const [direction, stops] of [['forward', [.2, .4, .6, .8, 1]], ['reverse', [.8, .6, .4, .2, 0]]]) {
    if (direction === 'reverse') await page.locator('#reverseBtn').click();
    for (const stop of stops) {
      await page.waitForFunction(({ direction, stop }) => direction === 'forward'
        ? window.__MT1.getMachineT() >= stop : window.__MT1.getMachineT() <= stop, { direction, stop });
      const state = await snapshot();
      const filename = `play-${direction}-${Math.round(stop * 100)}.png`;
      await page.locator('#view').screenshot({ path: join(directory, filename) });
      report.playback.push({ name: `${direction} ${state.inspection.machineT.toFixed(3)}`, direction, requestedSample: stop, filename, state });
    }
  }
  assert.equal((await snapshot()).inspection.machineT, 0);
  console.log(`PASS ${label} actual forward/reverse playback reached both endpoints`);

  await setPose({ t: 1, camera: 'overview' });
  const orbitBefore = await snapshot();
  const box = await page.locator('#view').boundingBox();
  for (const [index, dx, dy] of [[0, 220, 0], [1, 0, 110], [2, -440, -50], [3, 220, -60]]) {
    const x = box.x + box.width * .5;
    const y = box.y + box.height * .5;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 16 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    const state = await snapshot();
    assert.equal(state.mechanismSha256, orbitBefore.mechanismSha256);
    assert.deepEqual(state.inspection, orbitBefore.inspection);
    const filename = `orbit-${index + 1}.png`;
    await page.locator('#view').screenshot({ path: join(directory, filename) });
    report.orbit.push({ name: `Orbit ${index + 1}`, filename, state });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  for (const step of [4, 5]) {
    await page.evaluate(step => window.__MT1.presentation.setTourStep(step), step);
    for (const expanded of [false, true]) {
      if ((await page.locator('#tourDetailsBtn').getAttribute('aria-expanded')) !== String(expanded)) await page.locator('#tourDetailsBtn').click();
      await settle();
      const layout = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        return { canvas: rect('#view'), card: rect('#tourCard'), horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(layout.horizontalOverflow, false);
      assert.ok(layout.card.bottom <= layout.canvas.y);
      const filename = `mobile-tour-${step + 1}${expanded ? '-details' : ''}.png`;
      await page.screenshot({ path: join(directory, filename) });
      report.mobile.push({ name: `Mobile tour ${step + 1}${expanded ? ', Details expanded' : ''}`, filename, expanded, layout, state: await snapshot() });
    }
  }

  assert.deepEqual(await sourceHashes(), report.sourceHashes, 'Viewer source changed during review');
  assert.deepEqual(report.errors, []);
  if (baselineReport) {
    const baseline = JSON.parse(await readFile(baselineReport, 'utf8'));
    assert.equal(baseline.pass, true);
    assert.equal(baseline.frames.length, report.frames.length);
    const comparisons = [];
    for (const row of report.frames) {
      const prior = baseline.frames.find(frame => frame.filename === row.filename);
      assert.ok(prior, row.filename);
      assert.equal(row.state.mechanismSha256, prior.state.mechanismSha256, `${row.filename}: mechanism changed against baseline`);
      assert.deepEqual(row.state.inspection, prior.state.inspection, `${row.filename}: pose changed against baseline`);
      assert.deepEqual(row.state.camera, prior.state.camera, `${row.filename}: camera changed against baseline`);
      assert.deepEqual(row.state.lighting, prior.state.lighting, `${row.filename}: lighting changed against baseline`);
      comparisons.push({ filename: row.filename, mechanismPoseCameraLightingMatch: true });
    }
    report.baselineComparison = { report: baselineReport, sourceHashes: baseline.sourceHashes, comparisons };
  }
  report.pass = true;
  await gallery();
  console.log(`PASS ${label}: ${report.frames.length} paired-palette views, ${report.playback.length} playback samples, ${report.orbit.length} orbit views and ${report.mobile.length} mobile tour views`);
} catch (error) {
  report.pass = false;
  report.failure = String(error?.stack ?? error);
  process.exitCode = 1;
} finally {
  await writeFile(join(directory, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
