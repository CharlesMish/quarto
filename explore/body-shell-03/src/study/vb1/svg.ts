export function svgCgTrace(traces: Record<string, Array<{ machineT: number; y_vert: number; z_long: number }>>): string {
  const W = 920;
  const H = 420;
  const pad = 48;
  const colors: Record<string, string> = { NOMINAL: "#222", HEAVY_DRIVE_MOVING: "#b33", HEAVY_COCKPIT: "#26a" };
  const series = Object.entries(traces);
  const zs = series.flatMap(([, r]) => r.map((p) => p.z_long));
  const ys = series.flatMap(([, r]) => r.map((p) => p.y_vert));
  const z0 = Math.min(...zs) - 0.2;
  const z1 = Math.max(...zs) + 0.2;
  const y0 = Math.min(...ys) - 0.1;
  const y1 = Math.max(...ys) + 0.1;
  const xOf = (t: number) => pad + (t / 1) * (W / 2 - pad * 1.5);
  const zOf = (z: number) => H - pad - ((z - z0) / (z1 - z0)) * (H - pad * 2);
  const yOf = (y: number) => H - pad - ((y - y0) / (y1 - y0)) * (H - pad * 2);
  const x2 = (t: number) => W / 2 + pad / 2 + (t / 1) * (W / 2 - pad * 1.5);
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 4}" y="22" text-anchor="middle" font-size="13">z_long(CG) vs machineT</text>`;
  d += `<text x="${(3 * W) / 4}" y="22" text-anchor="middle" font-size="13">y_vert(CG) vs machineT</text>`;
  for (const [name, row] of series) {
    const pz = row.map((p, i) => `${i ? "L" : "M"}${xOf(p.machineT).toFixed(1)},${zOf(p.z_long).toFixed(1)}`).join(" ");
    const py = row.map((p, i) => `${i ? "L" : "M"}${x2(p.machineT).toFixed(1)},${yOf(p.y_vert).toFixed(1)}`).join(" ");
    d += `<path d="${pz}" fill="none" stroke="${colors[name] ?? "#000"}" stroke-width="1.6"/>`;
    d += `<path d="${py}" fill="none" stroke="${colors[name] ?? "#000"}" stroke-width="1.6"/>`;
  }
  let ly = 40;
  for (const [name, col] of Object.entries(colors)) {
    d += `<rect x="16" y="${ly}" width="10" height="10" fill="${col}"/><text x="30" y="${ly + 9}" font-size="11">${name}</text>`;
    ly += 16;
  }
  d += `<text x="${W / 4}" y="${H - 12}" text-anchor="middle" font-size="10">machineT 0→1</text>`;
  d += `<text x="${(3 * W) / 4}" y="${H - 12}" text-anchor="middle" font-size="10">machineT 0→1</text>`;
  d += `</svg>`;
  return d;
}

export function svgTopMap(input: {
  leaves: Array<{ id: string; x: number; z: number }>;
  families: Array<{ id: string; x: number; z: number }>;
  planform: { front: { x: number; z: number }; rear: { x: number; z: number }; combined: { x: number; z: number } };
  cg: { x: number; z: number };
}): string {
  const W = 720;
  const H = 520;
  const xs = [...input.leaves, ...input.families, input.cg, input.planform.front, input.planform.rear].map((p) => p.x);
  const zs = [...input.leaves, ...input.families, input.cg, input.planform.front, input.planform.rear].map((p) => p.z);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minZ = Math.min(...zs) - 1;
  const maxZ = Math.max(...zs) + 1;
  const sx = (x: number) => 40 + ((x - minX) / (maxX - minX)) * (W - 80);
  const sz = (z: number) => 40 + ((maxZ - z) / (maxZ - minZ)) * (H - 80);
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="13">VB1 SPREAD top — +Z up on page, +X right</text>`;
  d += `<line x1="${sx(0)}" y1="40" x2="${sx(0)}" y2="${H - 40}" stroke="#888" stroke-dasharray="4 3"/>`;
  for (const p of input.leaves) {
    d += `<circle cx="${sx(p.x)}" cy="${sz(p.z)}" r="5" fill="#6a4"/><text x="${sx(p.x) + 6}" y="${sz(p.z) - 6}" font-size="9">${p.id}</text>`;
  }
  for (const p of input.families) {
    d += `<rect x="${sx(p.x) - 4}" y="${sz(p.z) - 4}" width="8" height="8" fill="#444"/><text x="${sx(p.x) + 6}" y="${sz(p.z) + 12}" font-size="9">${p.id}</text>`;
  }
  d += `<circle cx="${sx(input.planform.front.x)}" cy="${sz(input.planform.front.z)}" r="6" fill="none" stroke="#26a" stroke-width="2"/>`;
  d += `<circle cx="${sx(input.planform.rear.x)}" cy="${sz(input.planform.rear.z)}" r="6" fill="none" stroke="#b33" stroke-width="2"/>`;
  d += `<circle cx="${sx(input.planform.combined.x)}" cy="${sz(input.planform.combined.z)}" r="6" fill="none" stroke="#a80" stroke-width="2"/>`;
  d += `<circle cx="${sx(input.cg.x)}" cy="${sz(input.cg.z)}" r="7" fill="#000"/>`;
  d += `<text x="16" y="${H - 16}" font-size="10">black=nominal CG · blue=front area · red=rear area · gold=combined area · dashed=thrust centerline x_lat=0</text>`;
  d += `</svg>`;
  return d;
}

export function svgSideMap(input: {
  cgs: Array<{ label: string; y: number; z: number }>;
  thrustY: number;
  cockpit: { cy: number; cz: number; hy: number; hz: number };
  driveStowed: { y: number; z: number };
  driveDeployed: { y: number; z: number };
}): string {
  const W = 760;
  const H = 360;
  const zs = [...input.cgs.map((c) => c.z), input.cockpit.cz, input.driveStowed.z, input.driveDeployed.z];
  const ys = [...input.cgs.map((c) => c.y), input.thrustY, input.cockpit.cy, input.driveStowed.y];
  const minZ = Math.min(...zs) - 1.2;
  const maxZ = Math.max(...zs) + 1.2;
  const minY = Math.min(0, ...ys) - 0.3;
  const maxY = Math.max(3, ...ys) + 0.3;
  const sx = (z: number) => 40 + ((z - minZ) / (maxZ - minZ)) * (W - 80);
  const sy = (y: number) => H - 30 - ((y - minY) / (maxY - minY)) * (H - 60);
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="16" text-anchor="middle" font-size="13">VB1 side — +Z forward right, +Y up</text>`;
  d += `<line x1="40" y1="${sy(input.thrustY)}" x2="${W - 40}" y2="${sy(input.thrustY)}" stroke="#c44" stroke-dasharray="6 3"/>`;
  const cx = sx(input.cockpit.cz);
  const cy = sy(input.cockpit.cy);
  const hx = ((input.cockpit.hz * 2) / (maxZ - minZ)) * (W - 80);
  const hy = ((input.cockpit.hy * 2) / (maxY - minY)) * (H - 60);
  d += `<rect x="${cx - hx / 2}" y="${cy - hy / 2}" width="${hx}" height="${hy}" fill="none" stroke="#26a"/>`;
  d += `<circle cx="${sx(input.driveStowed.z)}" cy="${sy(input.driveStowed.y)}" r="5" fill="#888"/>`;
  d += `<circle cx="${sx(input.driveDeployed.z)}" cy="${sy(input.driveDeployed.y)}" r="5" fill="#000"/>`;
  const cols = ["#000", "#666", "#b33"];
  input.cgs.forEach((c, i) => {
    d += `<circle cx="${sx(c.z)}" cy="${sy(c.y)}" r="6" fill="${cols[i] ?? "#000"}"/><text x="${sx(c.z) + 8}" y="${sy(c.y) - 8}" font-size="10">${c.label}</text>`;
  });
  d += `<text x="16" y="${H - 10}" font-size="10">dashed red = thrust y_vert · blue box = KEEP_COCKPIT · grey=drive stowed · black square-dot=drive deployed</text>`;
  d += `</svg>`;
  return d;
}
