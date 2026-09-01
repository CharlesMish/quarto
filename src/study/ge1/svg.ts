function n(v: number): string {
  return Number.isFinite(v) ? v.toFixed(3) : "—";
}

export function svgGe1Side(report: Record<string, unknown>): string {
  const floor = report.floor as { datumY: number };
  const spread = (report.livePoses as { spread: { whole: { minZ: number; maxZ: number; minY: number; maxY: number } } }).spread;
  const drive = (report.livePoses as { drive: { whole: { minZ: number; maxZ: number; minY: number; maxY: number } } }).drive;
  const swept = report.sweptMinima as { frozenMovingE2: { minY: number }; frozenWholeE4: { minY: number } };
  const w = 760;
  const h = 280;
  const z0 = -8;
  const z1 = 6;
  const y0 = -0.4;
  const y1 = 3.4;
  const sx = (z: number) => 40 + ((z - z0) / (z1 - z0)) * (w - 80);
  const sy = (y: number) => h - 40 - ((y - y0) / (y1 - y0)) * (h - 70);
  const rect = (minZ: number, maxZ: number, minY: number, maxY: number, color: string, extra = "") => {
    const x = sx(minZ);
    const y = sy(maxY);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(sx(maxZ) - x).toFixed(1)}" height="${(sy(minY) - y).toFixed(1)}" fill="none" stroke="${color}" ${extra}/>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="16" y="22" fill="#e6a93c" font-size="12" font-family="monospace">GE1 SIDE · +Z forward right · +Y up · floor y=${floor.datumY}</text>
  <line x1="${sx(z0)}" y1="${sy(0)}" x2="${sx(z1)}" y2="${sy(0)}" stroke="#81c8c6" stroke-width="2"/>
  <text x="${sx(z1) - 70}" y="${sy(0) - 6}" fill="#81c8c6" font-size="10" font-family="monospace">FLOOR y=0</text>
  ${rect(spread.whole.minZ, spread.whole.maxZ, spread.whole.minY, spread.whole.maxY, "#8e999a", 'stroke-dasharray="4 3"')}
  ${rect(drive.whole.minZ, drive.whole.maxZ, drive.whole.minY, drive.whole.maxY, "#e6a93c")}
  <line x1="${sx(z0)}" y1="${sy(swept.frozenMovingE2.minY)}" x2="${sx(z1)}" y2="${sy(swept.frozenMovingE2.minY)}" stroke="#c45" stroke-dasharray="2 2"/>
  <text x="16" y="${h - 18}" fill="#8e999a" font-size="10" font-family="monospace">gray dashed=SPREAD whole · amber=DRIVE whole · red dashed=E2 moving minY ${n(swept.frozenMovingE2.minY)}</text>
</svg>`;
}

export function svgGe1Top(report: Record<string, unknown>): string {
  const spread = (report.livePoses as { spread: { whole: { minX: number; maxX: number; minZ: number; maxZ: number } } }).spread;
  const drive = (report.livePoses as { drive: { whole: { minX: number; maxX: number; minZ: number; maxZ: number } } }).drive;
  const w = 760;
  const h = 360;
  const x0 = -7.2;
  const x1 = 7.2;
  const z0 = -8;
  const z1 = 6;
  const sx = (x: number) => 40 + ((x - x0) / (x1 - x0)) * (w - 80);
  const sz = (z: number) => h - 40 - ((z - z0) / (z1 - z0)) * (h - 70);
  const rect = (minX: number, maxX: number, minZ: number, maxZ: number, color: string, extra = "") => {
    const x = sx(minX);
    const y = sz(maxZ);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(sx(maxX) - x).toFixed(1)}" height="${(sz(minZ) - y).toFixed(1)}" fill="none" stroke="${color}" ${extra}/>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0e1214"/>
  <text x="16" y="22" fill="#e6a93c" font-size="12" font-family="monospace">GE1 TOP · +X stbd right · +Z forward up</text>
  ${rect(spread.whole.minX, spread.whole.maxX, spread.whole.minZ, spread.whole.maxZ, "#8e999a", 'stroke-dasharray="4 3"')}
  ${rect(drive.whole.minX, drive.whole.maxX, drive.whole.minZ, drive.whole.maxZ, "#e6a93c")}
  <text x="16" y="${h - 18}" fill="#8e999a" font-size="10" font-family="monospace">gray dashed=SPREAD W ${n(spread.whole.maxX - spread.whole.minX)} · amber=DRIVE W ${n(drive.whole.maxX - drive.whole.minX)} · sketch 3.0–3.6 is not a target</text>
</svg>`;
}
