export function svgKc1Long(report: Record<string, unknown>): string {
  void report;
  const w = 920;
  const h = 300;
  const z0 = -8;
  const z1 = 6;
  const y0 = -0.2;
  const y1 = 3.2;
  const sx = (z: number) => 40 + ((z - z0) / (z1 - z0)) * (w - 60);
  const sy = (y: number) => h - 40 - ((y - y0) / (y1 - y0)) * (h - 70);
  const rect = (zA: number, zB: number, yA: number, yB: number, color: string, extra = "") => {
    const x = sx(Math.min(zA, zB));
    const y = sy(Math.max(yA, yB));
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(2, sx(Math.max(zA, zB)) - x).toFixed(1)}" height="${Math.max(2, sy(Math.min(yA, yB)) - y).toFixed(1)}" fill="none" stroke="${color}" ${extra}/>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="14" y="18" fill="#e6a93c" font-size="12" font-family="monospace">KC1 LONG · diagnostic only · +Z forward right · +Y up</text>
  ${rect(-4.95, 4.55, 0.03, 0.17, "#6b7280")}
  ${rect(-1.70, 4.55, 1.445, 1.595, "#6b7280")}
  ${rect(3.31, 3.39, 0.04, 1.58, "#ca8a04")}
  ${rect(1.11, 1.19, 0.04, 1.58, "#ca8a04")}
  ${rect(-1.74, -1.66, 0.04, 1.58, "#ca8a04")}
  ${rect(2.50, 4.60, 0.30, 2.20, "#7c3aed", 'stroke-dasharray="3 2"')}
  ${rect(-1.60, 2.30, 1.56, 1.88, "#0e7490", 'stroke-dasharray="3 2"')}
  ${rect(-4.80, -1.70, 0.37, 1.19, "#b45309")}
  ${rect(-7.2, -5.6, 0.3, 1.3, "#0e7490", 'stroke-dasharray="2 2"')}
  <polyline points="${sx(4.50)},${sy(0.12)} ${sx(3.39)},${sy(0.12)} ${sx(3.39)},${sy(0.12)} ${sx(-1.66)},${sy(0.12)} ${sx(-4.90)},${sy(0.12)}" fill="none" stroke="#4d7c0f" stroke-width="2"/>
  <polyline points="${sx(2.48)},${sy(1.445)} ${sx(-1.66)},${sy(1.445)}" fill="none" stroke="#65a30d" stroke-width="2" stroke-dasharray="4 2"/>
  <text x="14" y="${h - 14}" fill="#8e999a" font-size="9" font-family="monospace">gray=keel/longeron · gold=bulkheads · violet dash=KEEP_COCKPIT · cyan dash=KEEP_DORSAL · amber=can · green=VK candidate · lime dash=DL truncated</text>
</svg>`;
}

export function svgKc1Top(report: Record<string, unknown>): string {
  void report;
  const w = 920;
  const h = 360;
  const x0 = -2.4;
  const x1 = 2.4;
  const z0 = -8;
  const z1 = 6;
  const sx = (x: number) => 40 + ((x - x0) / (x1 - x0)) * (w - 60);
  const sz = (z: number) => h - 40 - ((z - z0) / (z1 - z0)) * (h - 70);
  const rect = (xA: number, xB: number, zA: number, zB: number, color: string, extra = "") => {
    const x = sx(Math.min(xA, xB));
    const y = sz(Math.max(zA, zB));
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(2, sx(Math.max(xA, xB)) - x).toFixed(1)}" height="${Math.max(2, sz(Math.min(zA, zB)) - y).toFixed(1)}" fill="none" stroke="${color}" ${extra}/>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="14" y="18" fill="#e6a93c" font-size="12" font-family="monospace">KC1 TOP · diagnostic only · waist shown as OUTBOARD cells, not a center box</text>
  ${rect(-0.15, 0.15, -4.95, 4.55, "#6b7280")}
  ${rect(-0.12, 0.12, -1.70, 4.55, "#9ca3af")}
  ${rect(-0.75, 0.75, 3.31, 3.39, "#ca8a04")}
  ${rect(-0.75, 0.75, 1.11, 1.19, "#ca8a04")}
  ${rect(-0.75, 0.75, -1.74, -1.66, "#ca8a04")}
  ${rect(-0.68, 0.68, 2.50, 4.60, "#7c3aed", 'stroke-dasharray="3 2"')}
  ${rect(-0.20, 0.20, -1.60, 2.30, "#0e7490", 'stroke-dasharray="3 2"')}
  ${rect(-2.24, -0.81, -1.63, 1.05, "#0e7490")}
  ${rect(0.81, 2.24, -1.63, 1.05, "#0e7490")}
  ${rect(-0.50, 0.50, -7.08, -1.98, "#b45309")}
  <polyline points="${sx(-0.16)},${sz(4.5)} ${sx(-0.16)},${sz(-4.9)}" fill="none" stroke="#4d7c0f" stroke-width="2"/>
  <polyline points="${sx(0.16)},${sz(4.5)} ${sx(0.16)},${sz(-4.9)}" fill="none" stroke="#4d7c0f" stroke-width="2"/>
  <text x="14" y="${h - 14}" fill="#8e999a" font-size="9" font-family="monospace">green=VK side lanes · cyan filled=certified waist outboard · violet=KEEP_COCKPIT · amber=can corridor</text>
</svg>`;
}
