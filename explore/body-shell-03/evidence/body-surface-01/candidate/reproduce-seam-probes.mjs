import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Ray } from '@babylonjs/core/Culling/ray.js';
import { loadBodyFixture } from '../../../tools/verify-body-surface.mjs';

// Reproduce the retained body-only probe without opening a browser, building
// mechanism authority, changing source, or overwriting the original evidence.
const evidenceUrl = new URL('./seam-inspection.json', import.meta.url);
const evidence = JSON.parse(await readFile(evidenceUrl, 'utf8'));
const fixture = await loadBodyFixture();
try {
  assert.deepEqual(fixture.sources, evidence.sources, 'Probe source binding changed');
  for (const mesh of fixture.scene.meshes) mesh.computeWorldMatrix(true);
  const upperSeam = name => {
    const mesh = fixture.scene.getMeshByName(name);
    assert.ok(mesh, name);
    const positions = mesh.getVerticesData('position');
    const normals = mesh.getVerticesData('normal');
    const unique = new Map();
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i] === 0 && normals[i + 1] > .5) {
        const point = Array.from(positions.slice(i, i + 3));
        unique.set(JSON.stringify(point), point);
      }
    }
    return [...unique.values()].sort((a, b) => a[2] - b[2] || a[1] - b[1]);
  };
  const port = upperSeam('BODY_DORSAL_DECK_FWD_PORT_VIS');
  const starboard = upperSeam('BODY_DORSAL_DECK_FWD_STBD_VIS');
  assert.deepEqual(port, starboard, 'Roof centerline coordinates differ');
  assert.deepEqual(port, evidence.roofSeamVertices);
  const probe = (origin, direction) => {
    const ray = new Ray(Vector3.FromArray(origin), Vector3.FromArray(direction), 20);
    return fixture.scene.meshes.map(mesh => ({ mesh, hit: ray.intersectsMesh(mesh, false) }))
      .filter(row => row.hit.hit)
      .sort((a, b) => a.hit.distance - b.hit.distance)
      // The original diagnostic retained the nearest two surface hits.
      .slice(0, 2)
      .map(({ mesh, hit }) => ({ mesh: mesh.name, distance: hit.distance, point: hit.pickedPoint.asArray() }));
  };
  const roofProbes = [4.8, 4.2, 3.6, 2, 0, -1.2].flatMap(z => [-.00001, 0, .00001]
    .map(x => ({ x, z, hits: probe([x, 3, z], [0, -1, 0]) })));
  const lowerNoseProbes = [.43, .45, .5, .6, .7].flatMap(x => [.13, .19, .205]
    .map(y => ({ x, y, hits: probe([x, y, 6], [0, 0, -1]) })));
  assert.deepEqual(roofProbes, evidence.roofProbes, 'Roof probes differ from retained evidence');
  assert.deepEqual(lowerNoseProbes, evidence.lowerNoseProbes, 'Lower nose probes differ from retained evidence');
  assert.ok(roofProbes.every(row => row.hits[0]?.mesh.startsWith('BODY_DORSAL_DECK_FWD_')));
  assert.ok(lowerNoseProbes.every(row => row.hits[0]?.mesh.startsWith('BODY_')));
  console.log(JSON.stringify({ pass: true, authorityParticipation: 'none',
    scope: 'Exact reproduction of retained source-only geometry probes; no GPU diagnosis or universal enclosure proof.',
    evidence: fileURLToPath(evidenceUrl),
    evidenceSha256: createHash('sha256').update(await readFile(evidenceUrl)).digest('hex'),
    roofSeamVerticesExact: true, roofProbeCount: roofProbes.length, lowerNoseProbeCount: lowerNoseProbes.length,
  }, null, 2));
} finally {
  fixture.dispose();
}
