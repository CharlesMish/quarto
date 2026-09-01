export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smooth01(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function stage(transformT: number, start: number, end: number): number {
  if (end <= start) return transformT >= end ? 1 : 0;
  return smooth01((transformT - start) / (end - start));
}

export function mix(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function deg(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
