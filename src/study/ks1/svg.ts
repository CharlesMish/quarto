function n(v: number | undefined | null): string {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(3) : "—";
}

type Box = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
type Station = {
  name: string;
  selected: string;
  selectedBundle?: string;
  gapUnderPlate?: number;
  plate?: Box;
  keel?: Box;
  edgeBypass?: { envelopePort: Box; envelopeStbd: Box; motionPort?: { status: string; minSep: number | null }; motionStbd?: { status: string; minSep: number | null } };
  boundedSleeve?: { envelope: Box; motion?: { status: string; minSep: number | null } };
  surfaceHandoff?: { envelope?: Box; cls?: string } | null;
  completeDogleg?: {
    closure?: string;
    port?: { outboundFore?: { envelope?: Box }; inboundAft?: { envelope?: Box } };
    stbd?: { outboundFore?: { envelope?: Box }; inboundAft?: { envelope?: Box } };
  };
};

function rectZY(
  sx: (z: number) => number,
  sy: (y: number) => number,
  za: number,
  zb: number,
  ya: number,
  yb: number,
  color: string,
  extra = "",
): string {
  const x = sx(Math.min(za, zb));
  const y = sy(Math.max(ya, yb));
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(2, sx(Math.max(za, zb)) - x).toFixed(1)}" height="${Math.max(2, sy(Math.min(ya, yb)) - y).toFixed(1)}" fill="none" stroke="${color}" ${extra}/>`;
}

function rectXZ(
  sx: (x: number) => number,
  sz: (z: number) => number,
  xa: number,
  xb: number,
  za: number,
  zb: number,
  color: string,
  extra = "",
): string {
  const x = sx(Math.min(xa, xb));
  const y = sz(Math.max(za, zb));
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(2, sx(Math.max(xa, xb)) - x).toFixed(1)}" height="${Math.max(2, sz(Math.min(za, zb)) - y).toFixed(1)}" fill="none" stroke="${color}" ${extra}/>`;
}

export function svgKs1Long(report: Record<string, unknown>): string {
  const keel = report.keel as Box;
  const stations = (report.stations as Station[]) ?? [];
  const w = 920;
  const h = 300;
  const z0 = -8;
  const z1 = 6;
  const y0 = -0.15;
  const y1 = 2.4;
  const sx = (z: number) => 40 + ((z - z0) / (z1 - z0)) * (w - 60);
  const sy = (y: number) => h - 36 - ((y - y0) / (y1 - y0)) * (h - 60);
  const sleeves = stations
    .map((s) => s.boundedSleeve?.envelope)
    .filter((b): b is Box => Boolean(b))
    .map((b) => rectZY(sx, sy, b.minZ, b.maxZ, b.minY, b.maxY, "#22c55e", 'stroke-width="2"'))
    .join("\n  ");
  const handoff = stations
    .map((s) => s.surfaceHandoff?.envelope)
    .filter((b): b is Box => Boolean(b))
    .map((b) => rectZY(sx, sy, b.minZ, b.maxZ, b.minY, b.maxY, "#a3e635", 'stroke-dasharray="3 2"'))
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="14" y="18" fill="#e6a93c" font-size="12" font-family="monospace">KS1 LONG · study-only · nonphysical · unregistered · outside authority</text>
  ${rectZY(sx, sy, keel.minZ, keel.maxZ, keel.minY, keel.maxY, "#6b7280")}
  ${rectZY(sx, sy, 3.31, 3.39, 0.04, 1.58, "#ca8a04")}
  ${rectZY(sx, sy, 1.11, 1.19, 0.04, 1.58, "#ca8a04")}
  ${rectZY(sx, sy, -1.74, -1.66, 0.04, 1.58, "#ca8a04")}
  ${rectZY(sx, sy, 2.5, 4.6, 0.3, 2.2, "#7c3aed", 'stroke-dasharray="3 2"')}
  ${rectZY(sx, sy, -1.6, 2.3, 1.56, 1.88, "#0e7490", 'stroke-dasharray="3 2"')}
  ${rectZY(sx, sy, -7.08, -1.98, 0.37, 1.19, "#b45309")}
  <line x1="${sx(keel.minZ)}" y1="${sy(keel.maxY)}" x2="${sx(keel.maxZ)}" y2="${sy(keel.maxY)}" stroke="#4d7c0f" stroke-width="2"/>
  ${sleeves}
  ${handoff}
  <text x="14" y="${h - 12}" fill="#8e999a" font-size="9" font-family="monospace">gray=keel · gold=plates · violet=KEEP_COCKPIT · cyan=KEEP_DORSAL · amber=can · green=sleeve candidates · lime dash=Z-1.70 face handoff</text>
</svg>`;
}

export function svgKs1Top(report: Record<string, unknown>): string {
  const stations = (report.stations as Station[]) ?? [];
  const w = 920;
  const h = 360;
  const x0 = -2.2;
  const x1 = 2.2;
  const z0 = -8;
  const z1 = 6;
  const sx = (x: number) => 40 + ((x - x0) / (x1 - x0)) * (w - 60);
  const sz = (z: number) => h - 36 - ((z - z0) / (z1 - z0)) * (h - 60);
  const bypass = stations
    .flatMap((s) => [s.edgeBypass?.envelopePort, s.edgeBypass?.envelopeStbd])
    .filter((b): b is Box => Boolean(b))
    .map((b) => rectXZ(sx, sz, b.minX, b.maxX, b.minZ, b.maxZ, "#4d7c0f"))
    .join("\n  ");
  const doglegs = stations
    .flatMap((s) => [
      s.completeDogleg?.port?.outboundFore?.envelope,
      s.completeDogleg?.port?.inboundAft?.envelope,
      s.completeDogleg?.stbd?.outboundFore?.envelope,
      s.completeDogleg?.stbd?.inboundAft?.envelope,
    ])
    .filter((b): b is Box => Boolean(b))
    .map((b) => rectXZ(sx, sz, b.minX, b.maxX, b.minZ, b.maxZ, "#f59e0b", 'stroke-dasharray="2 2"'))
    .join("\n  ");
  const sleeves = stations
    .map((s) => s.boundedSleeve?.envelope)
    .filter((b): b is Box => Boolean(b))
    .map((b) => rectXZ(sx, sz, b.minX, b.maxX, b.minZ, b.maxZ, "#22c55e", 'stroke-width="2"'))
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="14" y="18" fill="#e6a93c" font-size="12" font-family="monospace">KS1 TOP · study-only · waist as OUTBOARD cells · no body rights</text>
  ${rectXZ(sx, sz, -0.15, 0.15, -4.95, 4.55, "#6b7280")}
  ${rectXZ(sx, sz, -0.75, 0.75, 3.31, 3.39, "#ca8a04")}
  ${rectXZ(sx, sz, -0.75, 0.75, 1.11, 1.19, "#ca8a04")}
  ${rectXZ(sx, sz, -0.75, 0.75, -1.74, -1.66, "#ca8a04")}
  ${rectXZ(sx, sz, -0.68, 0.68, 2.5, 4.6, "#7c3aed", 'stroke-dasharray="3 2"')}
  ${rectXZ(sx, sz, -2.24, -0.81, -1.63, 1.05, "#0e7490")}
  ${rectXZ(sx, sz, 0.81, 2.24, -1.63, 1.05, "#0e7490")}
  ${bypass}
  ${doglegs}
  ${sleeves}
  <text x="14" y="${h - 12}" fill="#8e999a" font-size="9" font-family="monospace">green=edge wrap · amber dash=dogleg approach/return · bright green=sleeve · cyan=waist outboard · gold=plates</text>
</svg>`;
}

export function svgKs1Stations(report: Record<string, unknown>): string {
  const stations = (report.stations as Station[]) ?? [];
  const w = 920;
  const h = 420;
  const panels = stations
    .map((s, i) => {
      const x = 16 + i * 300;
      const bp = s.edgeBypass;
      const sl = s.boundedSleeve;
      const ho = s.surfaceHandoff;
      return `<g>
    <text x="${x}" y="48" fill="#e6a93c" font-size="12" font-family="monospace">${s.name}</text>
    <text x="${x}" y="68" fill="#d7d9d2" font-size="11" font-family="monospace">selected ${s.selectedBundle ?? s.selected}</text>
    <text x="${x}" y="88" fill="#8e999a" font-size="10" font-family="monospace">plate minY ${n(s.plate?.minY)} · keel minY ${n(s.keel?.minY)}</text>
    <text x="${x}" y="108" fill="#8e999a" font-size="10" font-family="monospace">gap-under-plate ${n(s.gapUnderPlate)} m (occupied keel)</text>
    <text x="${x}" y="128" fill="#86efac" font-size="10" font-family="monospace">bypass P ${bp?.motionPort?.status ?? "—"} sep ${n(bp?.motionPort?.minSep)}</text>
    <text x="${x}" y="148" fill="#86efac" font-size="10" font-family="monospace">bypass S ${bp?.motionStbd?.status ?? "—"} sep ${n(bp?.motionStbd?.minSep)}</text>
    <text x="${x}" y="168" fill="#4ade80" font-size="10" font-family="monospace">sleeve ${sl?.motion?.status ?? "—"} sep ${n(sl?.motion?.minSep)}</text>
    <text x="${x}" y="188" fill="#a3e635" font-size="10" font-family="monospace">handoff ${ho?.cls ?? "n/a"}</text>
    <text x="${x}" y="208" fill="#f59e0b" font-size="10" font-family="monospace">dogleg ${s.completeDogleg?.closure ?? "—"}</text>
    <text x="${x}" y="228" fill="#8e999a" font-size="9" font-family="monospace">study-only envelope · not a cut</text>
  </g>`;
    })
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="16" y="22" fill="#e6a93c" font-size="12" font-family="monospace">KS1 STATIONS · diagnostic only · BODY-SHELL-03.1 may be ghosted for orientation only</text>
  ${panels}
  <text x="16" y="${h - 16}" fill="#8e999a" font-size="9" font-family="monospace">minSep is OBB/AABB feasibility screening vs moving physical solids. Not an authority certificate.</text>
</svg>`;
}
