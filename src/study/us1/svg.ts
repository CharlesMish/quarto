const COLORS: Record<string, string> = {
  OCCUPIED_STRUCTURE: "#6b7280",
  OCCUPIED_MECHANISM: "#b45309",
  MUST_REMAIN_CLEAR: "#0e7490",
  SERVICE_INTERFACE: "#ca8a04",
  ROUTING_CANDIDATE: "#4d7c0f",
  UNCLAIMED_BUT_PROTECTED: "#7c3aed",
  UNKNOWN: "#9ca3af",
};

export function svgUs1Long(report: Record<string, unknown>): string {
  const regions = report.regions as Array<{ id: string; name: string; cls: string; box: { cz: number; hz: number; cy: number; hy: number } }>;
  const w = 900;
  const h = 320;
  const z0 = -8;
  const z1 = 6;
  const y0 = -0.2;
  const y1 = 3.2;
  const sx = (z: number) => 50 + ((z - z0) / (z1 - z0)) * (w - 70);
  const sy = (y: number) => h - 50 - ((y - y0) / (y1 - y0)) * (h - 80);
  const bars = regions
    .filter((r) => r.id !== "drive-waist" && r.id !== "root-stations")
    .map((r) => {
      const x = sx(r.box.cz - r.box.hz);
      const y = sy(r.box.cy + r.box.hy);
      const ww = Math.max(3, sx(r.box.cz + r.box.hz) - x);
      const hh = Math.max(4, sy(r.box.cy - r.box.hy) - y);
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" fill="${COLORS[r.cls]}" fill-opacity="0.35" stroke="${COLORS[r.cls]}"/>`;
    })
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="16" y="20" fill="#e6a93c" font-size="12" font-family="monospace">US1 LONGITUDINAL SECTION · +Z forward right · +Y up · diagnostic only</text>
  <line x1="${sx(-8)}" y1="${sy(0)}" x2="${sx(6)}" y2="${sy(0)}" stroke="#81c8c6" stroke-width="1"/>
  ${bars}
  <text x="16" y="${h - 16}" fill="#8e999a" font-size="9" font-family="monospace">gray=structure · amber=mechanism · cyan=must remain clear · gold=interface · green=routing candidate · violet=unclaimed protected</text>
</svg>`;
}

export function svgUs1Top(report: Record<string, unknown>): string {
  const regions = report.regions as Array<{ id: string; cls: string; box: { cx: number; hx: number; cz: number; hz: number } }>;
  const w = 900;
  const h = 380;
  const x0 = -2.6;
  const x1 = 2.6;
  const z0 = -8;
  const z1 = 6;
  const sx = (x: number) => 50 + ((x - x0) / (x1 - x0)) * (w - 70);
  const sz = (z: number) => h - 50 - ((z - z0) / (z1 - z0)) * (h - 80);
  const bars = regions
    .filter((r) => r.id !== "root-stations")
    .map((r) => {
      const x = sx(r.box.cx - r.box.hx);
      const y = sz(r.box.cz + r.box.hz);
      const ww = Math.max(3, sx(r.box.cx + r.box.hx) - x);
      const hh = Math.max(4, sz(r.box.cz - r.box.hz) - y);
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" fill="${COLORS[r.cls]}" fill-opacity="0.28" stroke="${COLORS[r.cls]}"/>`;
    })
    .join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="16" y="20" fill="#e6a93c" font-size="12" font-family="monospace">US1 TOP · centerline zoning · +X stbd right · +Z forward up · diagnostic only</text>
  <line x1="${sx(0)}" y1="${sz(-8)}" x2="${sx(0)}" y2="${sz(6)}" stroke="#81c8c6" stroke-dasharray="3 3"/>
  ${bars}
  <text x="16" y="${h - 16}" fill="#8e999a" font-size="9" font-family="monospace">waist shown as protected empty (cyan). Book flanks are outside this spine map.</text>
</svg>`;
}
