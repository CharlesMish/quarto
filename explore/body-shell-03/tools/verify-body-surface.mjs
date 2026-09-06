import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";

const shellRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(shellRoot, "../..");
const EPS = 1e-6;
const stems = ["VENTRAL_HULL", "CHINE_FWD", "CHINE_AFT", "DORSAL_DECK_FWD", "DORSAL_DECK_AFT", "PROW",
  "FWD_LIP_FWD", "FWD_LIP_AFT", "FWD_FACE", "FWD_SILL", "FWD_WEB",
  "AFT_LIP_FWD", "AFT_LIP_AFT", "AFT_FACE", "AFT_SILL", "AFT_WEB", "COLLAR_SIDE", "COLLAR_LINTEL", "COLLAR_SILL"];
const expectedNames = stems.flatMap(stem => ["PORT", "STBD"].map(hand => `BODY_${stem}_${hand}_VIS`)).sort();
const expectedGhostNames = ["CHINE_AFT", "DORSAL_DECK_AFT", "COLLAR_SIDE", "COLLAR_LINTEL", "COLLAR_SILL"]
  .flatMap(stem => ["PORT", "STBD"].map(hand => `BODY_${stem}_${hand}_VIS`)).sort();
const expectedSectionNames = expectedNames.filter(name => name.includes("_STBD_"));
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = v => Math.hypot(...v);
const key = p => p.map(v => Math.round(v / EPS)).join(",");
const close = (a, b, tolerance = EPS) => Math.abs(a - b) <= tolerance;

/** Load actual checked-in constructors. A historical ref is extracted intact
 * into a temporary directory; no fixture or working-tree source is rewritten.
 * TypeScript is only transpiled, and all Babylon imports share one real module.
 */
export async function loadBodyFixture({ ref } = {}) {
  let temporary;
  let sourceRoot = shellRoot;
  let sourceRef = "working-tree";
  if (ref) {
    sourceRef = execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: repoRoot, encoding: "utf8" }).trim();
    temporary = mkdtempSync(resolve(tmpdir(), "quarto-body-surface-source-"));
    const archive = execFileSync("git", ["archive", sourceRef, "explore/body-shell-03/src"], { cwd: repoRoot, maxBuffer: 32 * 1024 * 1024 });
    execFileSync("tar", ["-x", "-C", temporary], { input: archive });
    sourceRoot = resolve(temporary, "explore/body-shell-03");
  }
  const moduleUrls = new Map();
  const sources = {};
  const moduleUrl = path => {
    if (moduleUrls.has(path)) return moduleUrls.get(path);
    const source = readFileSync(path, "utf8");
    sources[path.slice(sourceRoot.length + 1)] = createHash("sha256").update(source).digest("hex");
    let code = path.endsWith(".json") ? `export default ${source};` : ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    code = code.replace(/((?:from|import)\s*)["']([^"']+)["']/g, (_, prefix, specifier) => {
      const url = specifier.startsWith(".")
        ? moduleUrl(resolve(dirname(path), /\.(ts|json)$/.test(specifier) ? specifier : `${specifier}.ts`))
        : import.meta.resolve(specifier.startsWith("@babylonjs/core/") ? `${specifier}.js` : specifier);
      return `${prefix}${JSON.stringify(url)}`;
    });
    const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
    moduleUrls.set(path, url);
    return url;
  };
  try {
    const [{ createBodyShellConcept }, { createPresentationPalette }, { BODY_CONCEPT_INFO }] = await Promise.all([
      import(moduleUrl(resolve(sourceRoot, "src/scene/bodyShellConcept.ts"))),
      import(moduleUrl(resolve(sourceRoot, "src/presentation/palette.ts"))),
      import(moduleUrl(resolve(sourceRoot, "src/bodyConceptInfo.ts"))),
    ]);
    const engine = new NullEngine({ renderWidth: 64, renderHeight: 64, deterministicLockstep: true, lockstepMaxSteps: 1 });
    const scene = new Scene(engine);
    const body = createBodyShellConcept(scene);
    const palette = createPresentationPalette(scene);
    return { engine, scene, body, palette, sourceRef, sources, info: BODY_CONCEPT_INFO,
      dispose() { palette.dispose(); scene.dispose(); engine.dispose(); if (temporary) rmSync(temporary, { recursive: true }); } };
  } catch (error) {
    if (temporary) rmSync(temporary, { recursive: true });
    throw error;
  }
}

function meshData(mesh) {
  const positions = mesh.getVerticesData("position") ?? [];
  const rawNormals = mesh.getVerticesData("normal") ?? [];
  const matrix = mesh.computeWorldMatrix(true).asArray();
  const points = [], normals = [];
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = positions.slice(i, i + 3);
    points.push([x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12], x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13], x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14]]);
    normals.push(rawNormals.slice(i, i + 3));
  }
  return { name: mesh.name, points, normals, indices: Array.from(mesh.getIndices() ?? []) };
}

function inspectMesh(data, fail) {
  const { name, points, normals, indices } = data;
  const edges = new Map();
  const triangles = new Set();
  const neighbors = new Map();
  let degenerates = 0, normalFailures = 0, signedVolume = 0, minimumArea = Infinity;
  for (let i = 0; i < indices.length; i += 3) {
    const ids = indices.slice(i, i + 3);
    const [a, b, c] = ids.map(id => points[id]);
    if (!a || !b || !c || ![...a, ...b, ...c].every(Number.isFinite)) { fail("INVALID_VERTEX", name, { triangle: i / 3 }); continue; }
    const n = cross(sub(b, a), sub(c, a));
    const twiceArea = length(n);
    minimumArea = Math.min(minimumArea, twiceArea / 2);
    if (twiceArea <= 1e-10) degenerates++;
    else {
      // Babylon's default left-handed front faces use (a-b) × (c-b),
      // the negative of the conventional triangle cross product used above.
      const expected = n.map(value => -value / twiceArea);
      if (ids.some(id => normals[id].length !== 3 || !close(length(normals[id]), 1, 2e-5) || dot(normals[id], expected) < 1 - 2e-5)) normalFailures++;
    }
    signedVolume += dot(a, cross(b, c)) / 6;
    const welded = [a, b, c].map(key);
    const triangleKey = [...welded].sort().join("|");
    if (triangles.has(triangleKey)) fail("DUPLICATE_TRIANGLE", name, { triangle: i / 3 });
    triangles.add(triangleKey);
    for (let j = 0; j < 3; j++) {
      const from = welded[j], to = welded[(j + 1) % 3];
      if (from === to) continue;
      const edgeKey = [from, to].sort().join("|");
      const record = edges.get(edgeKey) ?? { count: 0, balance: 0 };
      record.count++; record.balance += from < to ? 1 : -1; edges.set(edgeKey, record);
      if (!neighbors.has(from)) neighbors.set(from, new Set());
      neighbors.get(from).add(to);
    }
  }
  if (degenerates) fail("DEGENERATE_TRIANGLE", name, { count: degenerates });
  if (normalFailures) fail("NONFLAT_OR_INWARD_NORMAL", name, { count: normalFailures });
  const boundaryEdges = [...edges.values()].filter(edge => edge.count !== 2).length;
  const inconsistentEdges = [...edges.values()].filter(edge => edge.balance !== 0).length;
  if (boundaryEdges) fail("OPEN_OR_NONMANIFOLD_EDGE", name, { count: boundaryEdges });
  if (inconsistentEdges) fail("INCONSISTENT_EDGE_WINDING", name, { count: inconsistentEdges });
  if (!(signedVolume < -1e-9)) fail("NONOUTWARD_VOLUME", name, { signedVolume });
  const visited = new Set(), pending = neighbors.size ? [neighbors.keys().next().value] : [];
  while (pending.length) { const next = pending.pop(); if (visited.has(next)) continue; visited.add(next); for (const neighbor of neighbors.get(next) ?? []) pending.push(neighbor); }
  if (visited.size !== neighbors.size) fail("DISCONNECTED_SURFACE", name, { componentsRemain: neighbors.size - visited.size });
  return { name, vertices: points.length, weldedVertices: new Set(points.map(key)).size, triangles: indices.length / 3,
    minimumArea, signedVolume, boundaryEdges, inconsistentEdges, degenerates, normalFailures };
}

function surfaceContract(data, fail) {
  const byName = new Map(data.map(mesh => [mesh.name, mesh]));
  const observations = { mirroredPairs: 0, deckTopRows: [], aftSlot: [], pockets: [] };
  for (const stem of stems) {
    const port = byName.get(`BODY_${stem}_PORT_VIS`), stbd = byName.get(`BODY_${stem}_STBD_VIS`);
    if (!port || !stbd) continue;
    const mirrored = new Set(port.points.map(point => key([-point[0], point[1], point[2]])));
    const actual = new Set(stbd.points.map(key));
    if (mirrored.size !== actual.size || [...mirrored].some(point => !actual.has(point))) fail("ASYMMETRIC_GEOMETRY", stem);
    const mirroredNormals = new Set(port.normals.map(normal => key([-normal[0], normal[1], normal[2]])));
    const actualNormals = new Set(stbd.normals.map(key));
    if (mirroredNormals.size !== actualNormals.size || [...mirroredNormals].some(normal => !actualNormals.has(normal))) fail("ASYMMETRIC_NORMALS", stem);
    observations.mirroredPairs++;
  }
  // These dimensions are independent acceptance values from the existing
  // BODY-SHELL-03.1 surface and its pocket correction, not constructor exports.
  const heights = [[5.03, 1.48], [3.22, 1.84], [0.55, 2.04], [-1.88, 2.3], [-3.45, 1.76], [-5.98, 1.44]];
  const topAt = z => {
    for (let i = 0; i < heights.length - 1; i++) {
      const [z0, y0] = heights[i], [z1, y1] = heights[i + 1];
      if (z <= z0 + EPS && z >= z1 - EPS) return y0 + (y1 - y0) * (z0 - z) / (z0 - z1);
    }
    return NaN;
  };
  for (const mesh of data.filter(mesh => mesh.name.includes("DORSAL_DECK"))) {
    const rows = new Map();
    for (const [x, y, z] of mesh.points) {
      const rowKey = Math.round(z / EPS);
      const row = rows.get(rowKey) ?? { z, top: -Infinity, bottom: Infinity };
      row.top = Math.max(row.top, y); row.bottom = Math.min(row.bottom, y); rows.set(rowKey, row);
    }
    for (const row of rows.values()) {
      const expectedTop = topAt(row.z);
      if (!close(row.top, expectedTop, 2e-6)) fail("DECK_TOP_MOVED", mesh.name, { ...row, expectedTop });
      if (!close(row.top - row.bottom, 0.14, 2e-6)) fail("DECK_THICKNESS", mesh.name, row);
      observations.deckTopRows.push({ mesh: mesh.name, ...row });
    }
    if (mesh.name.includes("_AFT_")) {
      const innerX = Math.min(...mesh.points.map(point => Math.abs(point[0])));
      if (!close(innerX, 0.36)) fail("AFT_SERVICE_SLOT_CHANGED", mesh.name, { innerX });
      observations.aftSlot.push({ mesh: mesh.name, innerX });
    }
  }
  for (const stem of ["FWD", "AFT"]) {
    const expectedReach = stem === "FWD" ? 0.16 : 0.22;
    for (const hand of ["PORT", "STBD"]) {
      const meshes = data.filter(mesh => mesh.name.startsWith(`BODY_${stem}_`) && mesh.name.includes(`_${hand}_`));
      const chine = byName.get(`BODY_CHINE_AFT_${hand}_VIS`);
      const chineX = Math.max(...chine.points.map(point => Math.abs(point[0])));
      const reach = Math.max(...meshes.flatMap(mesh => mesh.points.map(point => Math.abs(point[0])))) - chineX;
      if (!close(reach, expectedReach)) fail("POCKET_REACH_CHANGED", `${stem}_${hand}`, { reach, expectedReach });
      observations.pockets.push({ stem, hand, reach });
    }
  }
  return observations;
}

// Intersect real triangles with an axis-parallel line by barycentric projection
// into the other two coordinates. This does not reuse the construction helpers.
function lineIntersections(mesh, axis, point) {
  const other = [0, 1, 2].filter(index => index !== axis);
  const result = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices.slice(i, i + 3).map(index => mesh.points[index]);
    const u = sub(b, a), v = sub(c, a), p = sub(point, a);
    const [j, k] = other;
    const determinant = u[j] * v[k] - u[k] * v[j];
    if (Math.abs(determinant) < 1e-12) continue;
    const s = (p[j] * v[k] - p[k] * v[j]) / determinant;
    const t = (u[j] * p[k] - u[k] * p[j]) / determinant;
    if (s >= -EPS && t >= -EPS && s + t <= 1 + EPS) result.push(a[axis] + s * u[axis] + t * v[axis]);
  }
  return result;
}

function seamContract(data, fail) {
  const byName = new Map(data.map(mesh => [mesh.name, mesh]));
  const records = [];
  const record = (seam, hand, point, first, second) => {
    const gap = first - second;
    records.push({ seam, hand, point, gap });
    if (!Number.isFinite(gap) || Math.abs(gap) > 2e-6) fail("BODY_JOIN_GAP", `${seam}_${hand}`, { point, gap });
  };
  for (const [hand, sign] of [["PORT", -1], ["STBD", 1]]) {
    const mesh = stem => byName.get(`BODY_${stem}_${hand}_VIS`);
    // Ordinary roof joints and the bounded forward return, including its bevel.
    for (const z of [5.01, 4.96, 4.85, 4.6, 4.2, 3.6, 2.4, 1, 0, -1.2, -1.8, -2.6, -4, -5.6]) {
      const region = z >= -1.7 ? "FWD" : "AFT";
      const point = [sign * 0.68, 0, z];
      record("DECK_CHINE", hand, point,
        Math.min(...lineIntersections(mesh(`DORSAL_DECK_${region}`), 1, point)),
        Math.max(...lineIntersections(mesh(`CHINE_${region}`), 1, point)));
    }
    // Upper and lower prow joins. The old shell left real gaps in both.
    for (const x of [0.1, 0.3]) for (const z of [4.6, 4.75, 4.9, 4.98]) {
      const point = [sign * x, 0, z];
      const prow = lineIntersections(mesh("PROW"), 1, point);
      record("PROW_DECK", hand, point,
        Math.min(...lineIntersections(mesh("DORSAL_DECK_FWD"), 1, point)), Math.max(...prow));
      record("PROW_BELLY", hand, point, Math.min(...prow),
        Math.max(...lineIntersections(mesh("VENTRAL_HULL"), 1, point)));
    }
    // The lower inward flange meets the tapered belly only in the approved
    // forward join region; above it, the side cavity remains open aft of4.95.
    for (const z of [4.6, 4.75, 4.9]) {
      const point = [0, 0.16, z];
      record("CHINE_BELLY_FLANGE", hand, point,
        Math.min(...lineIntersections(mesh("CHINE_FWD"), 0, point).map(Math.abs)),
        Math.max(...lineIntersections(mesh("VENTRAL_HULL"), 0, point).map(Math.abs)));
      const upper = lineIntersections(mesh("CHINE_FWD"), 0, [0, 0.5, z]).map(Math.abs);
      if (!close(Math.min(...upper), 0.61)) fail("FOREBODY_RETURN_EXCEEDS_BOUND", hand, { z, innerXAtHalfMeter: Math.min(...upper) });
    }
    const upperNose = [sign * 0.38, 1.34 + 0.36 * (5.03 - 4.99) / (5.03 - 3.22), 4.99];
    const lowerNose = [sign * 0.44, 0.2, 5.03];
    // First retain the independent nominal endpoint bounds. Then interpolate
    // the actual stored edge: ideal decimal points can lie just outside a thin
    // Float32 triangle and cause a boundary ray to select a farther surface.
    const actualUpper = mesh("PROW").points.find(vertex => length(sub(vertex, upperNose)) <= EPS) ?? upperNose;
    const actualLower = mesh("PROW").points.find(vertex => length(sub(vertex, lowerNose)) <= EPS) ?? lowerNose;
    for (const point of [actualUpper, actualLower]) {
      if (!mesh("CHINE_FWD").points.some(vertex => length(sub(vertex, point)) <= EPS)) fail("NOSE_EDGE_NOT_SHARED", hand, { point });
    }
    for (const fraction of [0.25, 0.5, 0.75]) {
      const point = actualLower.map((value, axis) => value + fraction * (actualUpper[axis] - value));
      record("NOSE_RETURN", hand, point,
        Math.min(...lineIntersections(mesh("CHINE_FWD"), 0, point).map(Math.abs)),
        Math.max(...lineIntersections(mesh("PROW"), 0, point).map(Math.abs)));
    }
    for (const stem of ["CHINE_FWD", "PROW"]) {
      for (const point of [upperNose, lowerNose]) {
        if (!mesh(stem).points.some(vertex => length(sub(vertex, point)) <= EPS)) fail("NOSE_JOIN_VERTEX_MISSING", `${stem}_${hand}`, { point });
      }
    }
    for (const point of mesh("CHINE_FWD").points) {
      if (Math.abs(point[0]) > 0.75 + EPS || point[2] < -1.7 - EPS || point[2] > 5.03 + EPS || point[1] < 0.08 - EPS) fail("FOREBODY_CONTOUR_EXPANDED", hand, { point });
      if (Math.abs(point[0]) < 0.61 - EPS && point[1] > 0.2 + EPS && point[2] < 4.95 - EPS) fail("FOREBODY_RETURN_EXCEEDS_BOUND", hand, { point });
    }
  }
  for (const x of [-0.3, 0, 0.3]) for (const y of [0.4, 0.7, 1.1]) {
    for (const mesh of data) {
      const hits = lineIntersections(mesh, 2, [x, y, 0]).filter(z => z > -6.1 && z < -5.7);
      if (hits.length) fail("STERN_MOUTH_CAPPED", mesh.name, { x, y, hits });
    }
  }
  return records;
}

function presentationContract(fixture, fail) {
  const { body, scene, palette } = fixture;
  const original = scene.meshes.map(mesh => ({ mesh, name: mesh.name, id: mesh.uniqueId, parent: mesh.parent, metadata: JSON.stringify(mesh.metadata), data: JSON.stringify(meshData(mesh)) }));
  const records = [];
  if (JSON.stringify([...body.propGhostMeshes].sort()) !== JSON.stringify(expectedGhostNames)) fail("PROP_GHOST_INVENTORY_CHANGED", "BODY", { actual: body.propGhostMeshes });
  if (JSON.stringify([...body.sectionMeshes].sort()) !== JSON.stringify(expectedSectionNames)) fail("BODY_SECTION_INVENTORY_CHANGED", "BODY", { actual: body.sectionMeshes });
  for (const paletteName of ["accepted", "hush-basin", "accepted"]) {
    palette.setPalette(paletteName);
    for (const enabled of [true, false]) for (const section of [false, true]) for (const ghost of [false, true]) {
      body.setEnabled(enabled); body.setSection(section); body.setPropGhost(ghost);
      let enabledCount = 0, ghostCount = 0;
      for (const item of original) {
        const { mesh } = item;
        const material = mesh.material;
        const expectedEnabled = enabled && !(section && expectedSectionNames.includes(mesh.name));
        const expectedGhost = ghost && expectedGhostNames.includes(mesh.name);
        if (mesh.isEnabled()) enabledCount++;
        if (expectedGhost) ghostCount++;
        if (mesh.isEnabled() !== expectedEnabled) fail("BODY_SECTION_VISIBILITY", mesh.name, { paletteName, enabled, section });
        if (!close(mesh.visibility, expectedGhost ? 0.12 : 1)) fail("PROP_SECTION_VISIBILITY", mesh.name, { visibility: mesh.visibility, expectedGhost });
        if (material.alpha !== 1 || material.transparencyMode !== null || material.needAlphaTesting()) fail("BODY_MATERIAL_NOT_AUTOMATIC_OPAQUE", mesh.name, { paletteName, alpha: material.alpha, transparencyMode: material.transparencyMode });
        if (material.backFaceCulling !== true) fail("BODY_BACKFACE_CULLING_DISABLED", mesh.name, { paletteName });
        const blended = Boolean(material.needAlphaBlendingForMesh(mesh));
        if (blended !== expectedGhost) fail("BODY_BLEND_CLASSIFICATION", mesh.name, { paletteName, expectedGhost, actual: blended });
        if (mesh.name !== item.name || mesh.uniqueId !== item.id || mesh.parent !== item.parent || JSON.stringify(mesh.metadata) !== item.metadata || JSON.stringify(meshData(mesh)) !== item.data) fail("PRESENTATION_MUTATED_GEOMETRY_OR_IDENTITY", mesh.name);
      }
      records.push({ palette: paletteName, enabled, section, ghost, enabledCount, ghostCount });
    }
  }
  body.setEnabled(true); body.setSection(false); body.setPropGhost(false); palette.setPalette("hush-basin");
  return records;
}

export async function verifyBodySurface(options = {}) {
  const fixture = await loadBodyFixture(options);
  const failures = [];
  const seenFailures = new Set();
  const fail = (code, mesh, detail = {}) => {
    const failure = { code, mesh, ...detail }, signature = JSON.stringify(failure);
    if (!seenFailures.has(signature)) { seenFailures.add(signature); failures.push(failure); }
  };
  try {
    const data = fixture.scene.meshes.map(meshData);
    const actualNames = data.map(mesh => mesh.name).sort();
    if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) fail("BODY_INVENTORY_CHANGED", "BODY", { actualNames });
    for (const mesh of fixture.scene.meshes) {
      if (mesh.metadata?.presentationOnly !== true || mesh.metadata?.physical !== false || mesh.metadata?.authorityRegistrationId != null) fail("BODY_AUTHORITY_METADATA", mesh.name);
    }
    const meshes = data.map(mesh => inspectMesh(mesh, fail));
    const dimensions = surfaceContract(data, fail);
    const seams = seamContract(data, fail);
    const presentation = presentationContract(fixture, fail);
    return { kind: "body-surface-verification", sourceRef: fixture.sourceRef, surfaceRevision: fixture.info.surfaceRevision ?? null,
      participatesInAuthority: false, authorityParticipation: "none", pass: failures.length === 0, meshCount: meshes.length,
      triangleCount: meshes.reduce((sum, mesh) => sum + mesh.triangles, 0), weldToleranceMeters: EPS,
      sources: fixture.sources, meshes, dimensions, seams, presentation, failures };
  } finally { fixture.dispose(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  const output = option("--output");
  if (output && existsSync(output)) throw new Error(`Refusing to overwrite existing verification evidence: ${output}`);
  const result = await verifyBodySurface({ ref: option("--ref") });
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (output) writeFileSync(output, json, { flag: "wx" });
  console.log(json);
  if (!result.pass) process.exitCode = 1;
}
