import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// New-directory visual evidence only. No accepted evidence or authority writer
// is imported. Canonical controls retain the existing runtime certificate path.
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  return at < 0 ? fallback : args[at + 1];
};
if (option('--sheets-from')) {
  if (!option('--baseline-report')) throw new Error('--sheets-from requires --baseline-report');
  await contactSheets(resolve(option('--sheets-from')), resolve(option('--baseline-report')));
  process.exit(0);
}
if (option('--validate-from')) {
  if (!option('--baseline-report')) throw new Error('--validate-from requires --baseline-report');
  await validateSavedReview(resolve(option('--validate-from')), resolve(option('--baseline-report')));
  process.exit(0);
}
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
  // Normalize optional Babylon properties before comparison with JSON evidence;
  // JSON omits undefined light fields such as a hemisphere's absent position.
  return JSON.parse(JSON.stringify({ ...state, mechanism: undefined, mechanismSha256, mechanismCount: state.mechanism.length, selectedMechanism }));
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
    const pairs = report.frames.map(row => `<h2>${esc(row.name)} · ${esc(row.palette)}</h2><div class="grid"><figure><a href="${esc(prefix)}/${esc(row.filename)}"><img loading="lazy" src="${esc(prefix)}/${esc(row.filename)}" alt="Before ${esc(row.name)}"></a><figcaption>Prior viewer 3780e02 · before surface repair</figcaption></figure><figure><a href="${esc(row.filename)}"><img loading="lazy" src="${esc(row.filename)}" alt="After ${esc(row.name)}"></a><figcaption>Body surface candidate · after repair</figcaption></figure></div>`).join('');
    await writeFile(join(directory, 'comparison.html'), `<!doctype html><meta charset="utf-8"><title>Quarto body surfaces · before and after</title>${style}<h1>Quarto body surfaces · before and after</h1><p>Identical canonical poses, cameras and lighting. Physical-mechanism inventory and inspection state match in every pair. Click an image for full resolution.</p>${pairs}`);
  }
}

async function contactSheets(reviewPath, baselinePath) {
  const current = JSON.parse(await readFile(reviewPath, 'utf8'));
  const prior = JSON.parse(await readFile(baselinePath, 'utf8'));
  assert.equal(current.pass, true);
  assert.equal(prior.pass, true);
  const outputDirectory = dirname(reviewPath);
  const priorDirectory = dirname(baselinePath);
  const prefix = relative(outputDirectory, priorDirectory).split('\\').join('/');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const choices = [
    ['forebody-contact-sheet', 'Forebody surface repair', [
      ['spread-nose-port-hush-basin.png', 'SPREAD · nose from port · Hush Basin'],
      ['spread-nose-starboard-hush-basin.png', 'SPREAD · nose from starboard · Hush Basin'],
      ['spread-low-underside-hush-basin.png', 'SPREAD · low underside · Hush Basin'],
      ['drive-nose-port-accepted.png', 'DRIVE · nose from port · accepted palette'],
    ]],
    ['inspection-contact-sheet', 'Openings and explicit inspection modes', [
      ['drive-top-hush-basin.png', 'DRIVE · top and intentional service opening'],
      ['drive-stern-hush-basin.png', 'DRIVE · open stern'],
      ['drive-body-off-hush-basin.png', 'DRIVE · BODY OFF'],
      ['drive-body-section-hush-basin.png', 'DRIVE · BODY SECTION'],
      ['handover-prop-section-hush-basin.png', 'Handover · PROP SECTION'],
    ]],
  ];
  const sheetBrowser = await chromium.launch({ headless: true });
  const sheetPage = await sheetBrowser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  const sheets = [];
  sheetPage.on('pageerror', error => errors.push(error.message));
  try {
    for (const [stem, title, rows] of choices) {
      for (const [filename] of rows) {
        assert.ok(current.frames.find(frame => frame.filename === filename));
        assert.ok(prior.frames.find(frame => frame.filename === filename));
      }
      const html = `<!doctype html><meta charset="utf-8"><title>${escape(title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#11191b;color:#d9e0d9;font:15px/1.45 system-ui}.sheet{width:1200px;padding:20px}h1{font-size:24px;margin:0 0 4px;font-weight:550}p{font-size:12px;color:#9eb2ad;margin:0 0 16px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}h2{font-size:14px;font-weight:500;margin:15px 0 6px}img{display:block;width:100%;height:auto}.labels{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;color:#a0cfc4;padding-bottom:3px}</style><main class="sheet"><h1>${escape(title)}</h1><p>Quarto · matching poses, cameras and lighting · authority participation: none</p><div class="labels"><span>Prior viewer 3780e02 · before</span><span>Body surface candidate · after</span></div>${rows.map(([filename, caption]) => `<h2>${escape(caption)}</h2><div class="row"><img src="${escape(prefix)}/${escape(filename)}" alt="Before"><img src="${escape(filename)}" alt="After"></div>`).join('')}</main>`;
      const htmlPath = join(outputDirectory, `${stem}.html`);
      await writeFile(htmlPath, html, { flag: 'wx' });
      await sheetPage.goto(pathToFileURL(htmlPath).href);
      await sheetPage.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
      const filename = `${stem}.png`;
      await sheetPage.locator('.sheet').screenshot({ path: join(outputDirectory, filename) });
      sheets.push({ filename, rows, sha256: createHash('sha256').update(await readFile(join(outputDirectory, filename))).digest('hex') });
    }
    assert.deepEqual(errors, []);
    await writeFile(join(outputDirectory, 'contact-sheets.json'), JSON.stringify({
      currentReviewSha256: createHash('sha256').update(await readFile(reviewPath)).digest('hex'),
      priorReviewSha256: createHash('sha256').update(await readFile(baselinePath)).digest('hex'),
      toolSha256: createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),
      method: 'Browser rendering of unedited original review images in a labeled comparison layout.',
      sheets, errors,
    }, null, 2) + '\n', { flag: 'wx' });
    console.log(`PASS ${sheets.length} contact sheets`);
  } finally {
    await sheetBrowser.close();
  }
}

async function validateSavedReview(reviewPath, baselinePath) {
  const rawCurrent = await readFile(reviewPath);
  const rawPrior = await readFile(baselinePath);
  const current = JSON.parse(rawCurrent);
  const prior = JSON.parse(rawPrior);
  const digest = value => createHash('sha256').update(value).digest('hex');
  assert.equal(prior.pass, true);
  // This recovery mode addresses the recorded live-object/JSON undefined-key
  // mismatch only. It must not hide another capture or runtime failure.
  if (!current.pass) {
    assert.match(current.failure, /lighting changed against baseline/);
    assert.match(current.failure, /undefined/);
  }
  assert.deepEqual(current.errors, []);
  assert.equal(current.frames.length, prior.frames.length);
  assert.equal(current.frames.length, 32);
  assert.equal(current.playback.length, 10);
  assert.equal(current.orbit.length, 4);
  assert.equal(current.mobile.length, 4);
  const comparisons = [];
  for (const row of current.frames) {
    const before = prior.frames.find(frame => frame.filename === row.filename);
    assert.ok(before, row.filename);
    assert.equal(row.state.mechanismSha256, before.state.mechanismSha256, row.filename);
    assert.equal(row.state.mechanismCount, before.state.mechanismCount, row.filename);
    for (const key of ['inspection', 'camera', 'lighting', 'selectedMechanism']) assert.deepEqual(row.state[key], before.state[key], `${row.filename}: ${key}`);
    comparisons.push({ filename: row.filename, mechanismPoseCameraLightingMatch: true,
      mechanismSha256: row.state.mechanismSha256,
      inspectionSha256: digest(JSON.stringify(row.state.inspection)),
      cameraSha256: digest(JSON.stringify(row.state.camera)),
      lightingSha256: digest(JSON.stringify(row.state.lighting)),
    });
  }
  for (const [path, before] of Object.entries(prior.sourceHashes)) {
    if (/^src\/(machine|design|math|verify)\//.test(path) || ['src/scene/primitives.ts', 'src/scene/materials.ts'].includes(path)) {
      assert.equal(current.sourceHashes[path], before, `Frozen/shared source changed: ${path}`);
    }
  }
  const imageHashes = {};
  for (const row of [...current.frames, ...current.playback, ...current.orbit, ...current.mobile]) {
    imageHashes[row.filename] = digest(await readFile(join(dirname(reviewPath), row.filename)));
  }
  const validated = {
    ...current, pass: true, failure: undefined,
    recovery: {
      originalReport: reviewPath, originalReportSha256: digest(rawCurrent),
      originalFailure: current.failure,
      reason: 'Saved-state JSON normalization removes undefined-only property differences; every saved paired mechanism, pose, camera and numeric light value matches. No image or runtime state was changed or rerendered.',
      toolSha256: digest(await readFile(fileURLToPath(import.meta.url))),
    },
    imageHashes,
    baselineComparison: { report: baselinePath, reportSha256: digest(rawPrior), sourceHashes: prior.sourceHashes, comparisons },
  };
  const validatedPath = join(dirname(reviewPath), 'review-validated.json');
  await writeFile(validatedPath, JSON.stringify(validated, null, 2) + '\n', { flag: 'wx' });
  const prefix = relative(dirname(reviewPath), dirname(baselinePath)).split('\\').join('/');
  const pairs = current.frames.map(row => `<h2>${row.name} · ${row.palette}</h2><div class="pair"><figure><a href="${prefix}/${row.filename}"><img loading="lazy" src="${prefix}/${row.filename}" alt="Before"></a><figcaption>Prior viewer 3780e02 · before surface repair</figcaption></figure><figure><a href="${row.filename}"><img loading="lazy" src="${row.filename}" alt="After"></a><figcaption>Body surface candidate · after repair</figcaption></figure></div>`).join('');
  await writeFile(join(dirname(reviewPath), 'comparison.html'), `<!doctype html><meta charset="utf-8"><title>Quarto body surface comparison</title><style>body{margin:24px;background:#11191b;color:#d9e0d9;font:15px/1.5 system-ui}h1,h2{font-weight:550}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px 0}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>Quarto body surfaces · before and after</h1><p>Matching canonical poses, cameras and lighting. Mechanism inventory and inspection state are preserved. Authority participation: none.</p>${pairs}`, { flag: 'wx' });
  console.log(`PASS ${comparisons.length} saved-state comparisons; ${validatedPath}`);
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
