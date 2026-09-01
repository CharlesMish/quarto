/** Four XZ panels around a rectangular Y-axis hole. */
export function panelsAroundYBore(
  xMin: number,
  xMax: number,
  zMin: number,
  zMax: number,
  holeX: number,
  holeZ: number,
  holeHx: number,
  holeHz: number,
): Array<{ size: [number, number]; pos: [number, number] }> {
  const hx0 = holeX - holeHx;
  const hx1 = holeX + holeHx;
  const hz0 = holeZ - holeHz;
  const hz1 = holeZ + holeHz;
  const out: Array<{ size: [number, number]; pos: [number, number] }> = [];
  const add = (a0: number, a1: number, b0: number, b1: number): void => {
    const w = a1 - a0;
    const d = b1 - b0;
    if (w > 1e-4 && d > 1e-4) out.push({ size: [w, d], pos: [(a0 + a1) / 2, (b0 + b1) / 2] });
  };
  add(xMin, hx0, zMin, zMax);
  add(hx1, xMax, zMin, zMax);
  add(hx0, hx1, zMin, hz0);
  add(hx0, hx1, hz1, zMax);
  return out;
}
