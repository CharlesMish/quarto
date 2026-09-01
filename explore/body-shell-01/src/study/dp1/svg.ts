import type { PackagingResult } from "./packaging";
import { canAtDriveT, type StationSet } from "./stations";

function zx(z: number, z0: number, z1: number, x0: number, x1: number): number {
  return x0 + ((z - z0) / (z1 - z0)) * (x1 - x0);
}

export function svgLongitudinal(s: StationSet, p: PackagingResult): string {
  const W = 820;
  const H = 280;
  const z0 = s.CAN_DEPLOYED_AFT_FACE - 0.4;
  const z1 = s.BAY_FORWARD_STATION + 0.5;
  const x = (z: number) => zx(z, z0, z1, 40, W - 30);
  const yBay = 90;
  const yCan = 150;
  const yCore = 210;
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="13">DP1 longitudinal stations — +Z forward (right)</text>`;
  d += `<rect x="${x(s.BAY_AFT_HOOP)}" y="${yBay}" width="${x(s.BAY_FORWARD_STATION) - x(s.BAY_AFT_HOOP)}" height="18" fill="none" stroke="#444"/>`;
  d += `<text x="${x((s.BAY_AFT_HOOP + s.BAY_FORWARD_STATION) / 2)}" y="${yBay - 6}" text-anchor="middle" font-size="10">bay</text>`;
  d += `<line x1="${x(s.BAY_AFT_STATION)}" y1="40" x2="${x(s.BAY_AFT_STATION)}" y2="250" stroke="#888" stroke-dasharray="3 2"/>`;
  d += `<text x="${x(s.BAY_AFT_STATION)}" y="38" font-size="9" text-anchor="middle">aft posts ${s.BAY_AFT_STATION.toFixed(2)}</text>`;
  d += `<rect x="${x(s.CAN_STOWED_AFT_FACE)}" y="${yCan}" width="${x(s.CAN_STOWED_FORWARD_FACE) - x(s.CAN_STOWED_AFT_FACE)}" height="14" fill="#ccc" stroke="#222"/>`;
  d += `<text x="${x(s.CAN_STOWED_CENTER)}" y="${yCan - 4}" text-anchor="middle" font-size="10">stowed can</text>`;
  d += `<rect x="${x(s.CAN_DEPLOYED_AFT_FACE)}" y="${yCan + 18}" width="${x(s.CAN_DEPLOYED_FORWARD_FACE) - x(s.CAN_DEPLOYED_AFT_FACE)}" height="14" fill="none" stroke="#b33"/>`;
  d += `<text x="${x(s.CAN_DEPLOYED_CENTER)}" y="${yCan + 46}" text-anchor="middle" font-size="10" fill="#b33">deployed can</text>`;
  d += `<rect x="${x(p.recommendedCoreBand.zAft)}" y="${yCore}" width="${x(p.recommendedCoreBand.zFwd) - x(p.recommendedCoreBand.zAft)}" height="14" fill="#26a"/>`;
  d += `<text x="${x((p.recommendedCoreBand.zAft + p.recommendedCoreBand.zFwd) / 2)}" y="${yCore - 4}" text-anchor="middle" font-size="10">fixed core</text>`;
  d += `<line x1="${x(p.handoverStation)}" y1="40" x2="${x(p.handoverStation)}" y2="250" stroke="#a80"/>`;
  d += `<text x="${x(p.handoverStation) + 4}" y="54" font-size="9">handover ${p.handoverStation.toFixed(3)}</text>`;
  d += `</svg>`;
  return d;
}

export function svgCrossSection(s: StationSet, p: PackagingResult): string {
  const W = 420;
  const H = 360;
  const sx = 180;
  const sy = 80;
  const k = 180;
  const rect = (cx: number, cy: number, w: number, h: number, stroke: string, fill = "none") =>
    `<rect x="${sx + (cx - w / 2) * k}" y="${sy + (1.4 - (cy + h / 2)) * k}" width="${w * k}" height="${h * k}" fill="${fill}" stroke="${stroke}"/>`;
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="13">DP1 section — looking forward</text>`;
  d += rect(0, (s.bay.yBot + s.bay.yTop) / 2, s.bay.xHalf * 2, s.bay.yTop - s.bay.yBot, "#888");
  d += rect(s.axis.x_lat, s.axis.y_vert, s.outerCan.w, s.outerCan.h, "#222", "#ddd");
  d += rect(s.axis.x_lat, s.axis.y_vert, p.innerPassage.w, p.innerPassage.h, "#26a");
  d += rect(s.axis.x_lat, s.axis.y_vert, p.recommendedCoreSection.w, p.recommendedCoreSection.h, "#26a", "#9cf");
  for (const x of s.rails.xs) {
    d += rect(x, s.rails.y, s.rails.section, s.rails.section, "#b33");
    d += rect(x, s.rails.y, s.rails.shoe, s.rails.shoe, "#b33");
  }
  d += `<text x="16" y="${H - 28}" font-size="10">grey=bay · dark=outer can · blue=inner passage · fill=core · red=rails/shoes</text>`;
  d += `</svg>`;
  return d;
}

export function svgLoadPath(s: StationSet, p: PackagingResult): string {
  const W = 640;
  const H = 300;
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="13">DP1 load paths (conceptual)</text>`;
  const boxes = [
    [40, 50, 120, 36, "fixed core"],
    [200, 50, 140, 36, "core mounts"],
    [380, 50, 200, 36, "bay / keel / BH z=-1.70"],
    [40, 140, 140, 36, "thrust can"],
    [210, 140, 150, 36, "lugs + register"],
    [390, 140, 160, 36, "handover frame"],
    [390, 200, 160, 36, "verified transitive path"],
    [40, 220, 160, 36, "rails (guides only)"],
  ];
  for (const [x, y, w, h, t] of boxes) {
    d += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#222"/>`;
    d += `<text x="${Number(x) + Number(w) / 2}" y="${Number(y) + 22}" text-anchor="middle" font-size="11">${t}</text>`;
  }
  d += `<path d="M160 68 H200 M340 68 H380 M180 158 H210 M360 158 H390 M470 176 V200" fill="none" stroke="#26a" stroke-width="1.6"/>`;
  d += `<text x="250" y="264" font-size="9">AFT_POST_PAIR → BAY_WALL_PORT/STBD → BULKHEAD_Z-1p70 → VENTRAL_KEEL</text>`;
  d += `<text x="16" y="${H - 12}" font-size="10">blue = operating/reaction path · rails are not on the operating axial path · mouth z=${p.handoverStation.toFixed(3)} aft-posts z=${s.BAY_AFT_STATION.toFixed(2)}</text>`;
  d += `</svg>`;
  return d;
}

export function svgMotion(s: StationSet, p: PackagingResult): string {
  const W = 780;
  const H = 320;
  const z0 = s.CAN_DEPLOYED_AFT_FACE - 0.3;
  const z1 = s.BAY_FORWARD_STATION + 0.3;
  const x = (z: number) => zx(z, z0, z1, 20, W - 20);
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="16" text-anchor="middle" font-size="13">DP1 motion — stowed / mid / deployed unlocked / captured</text>`;
  const rows: Array<[string, number]> = [
    ["stowed", 0],
    ["mid-stroke", 0.5],
    ["deployed unlocked", 0.97],
    ["deployed captured", 1],
  ];
  rows.forEach(([label, t], i) => {
    const y = 40 + i * 68;
    const can = canAtDriveT(s, t);
    d += `<text x="8" y="${y + 12}" font-size="10">${label}</text>`;
    d += `<rect x="${x(s.BAY_AFT_STATION)}" y="${y}" width="${x(s.BAY_FORWARD_STATION) - x(s.BAY_AFT_STATION)}" height="10" fill="none" stroke="#aaa"/>`;
    d += `<rect x="${x(can.aft)}" y="${y + 16}" width="${x(can.forward) - x(can.aft)}" height="12" fill="#ddd" stroke="#222"/>`;
    d += `<rect x="${x(p.recommendedCoreBand.zAft)}" y="${y + 32}" width="${x(p.recommendedCoreBand.zFwd) - x(p.recommendedCoreBand.zAft)}" height="10" fill="#26a"/>`;
    if (t >= 0.99) d += `<circle cx="${x(p.handoverStation)}" cy="${y + 22}" r="5" fill="#a80"/>`;
  });
  d += `</svg>`;
  return d;
}

export function svgHandover(s: StationSet, flow: {
  FLOW_SPIGOT_ROOT: number;
  FLOW_SPIGOT_AFT_TIP: number;
  CAN_RECEIVER_FORWARD_FACE: number;
  CAN_RECEIVER_AFT_EXTENT: number;
  CORE_BULK_AFT_FACE: number;
  coreToCanMouthGap: number;
  flowInsertion: number;
  selectedSpigotLength: number;
  receiverDepth: number;
}): string {
  const W = 820;
  const H = 240;
  const z0 = s.BAY_AFT_STATION - 0.15;
  const z1 = flow.CORE_BULK_AFT_FACE + 0.35;
  const x = (z: number) => zx(z, z0, z1, 40, W - 30);
  let d = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  d += `<rect width="${W}" height="${H}" fill="#f7f7f4"/>`;
  d += `<text x="${W / 2}" y="16" text-anchor="middle" font-size="13">DP1A handover region — +Z forward (right)</text>`;
  d += `<line x1="${x(s.BAY_AFT_STATION)}" y1="28" x2="${x(s.BAY_AFT_STATION)}" y2="200" stroke="#888" stroke-dasharray="3 2"/>`;
  d += `<text x="${x(s.BAY_AFT_STATION)}" y="26" font-size="9" text-anchor="middle">AFT_POST_PAIR ${s.BAY_AFT_STATION.toFixed(3)}</text>`;
  d += `<line x1="${x(flow.CAN_RECEIVER_FORWARD_FACE)}" y1="28" x2="${x(flow.CAN_RECEIVER_FORWARD_FACE)}" y2="200" stroke="#a80"/>`;
  d += `<text x="${x(flow.CAN_RECEIVER_FORWARD_FACE) + 4}" y="40" font-size="9">can mouth ${flow.CAN_RECEIVER_FORWARD_FACE.toFixed(3)}</text>`;
  d += `<rect x="${x(flow.CAN_RECEIVER_AFT_EXTENT)}" y="70" width="${x(flow.CAN_RECEIVER_FORWARD_FACE) - x(flow.CAN_RECEIVER_AFT_EXTENT)}" height="22" fill="#fcc" stroke="#b33"/>`;
  d += `<text x="${x((flow.CAN_RECEIVER_AFT_EXTENT + flow.CAN_RECEIVER_FORWARD_FACE) / 2)}" y="85" text-anchor="middle" font-size="9">receiver ${flow.receiverDepth.toFixed(2)} m</text>`;
  d += `<rect x="${x(flow.FLOW_SPIGOT_AFT_TIP)}" y="100" width="${x(flow.FLOW_SPIGOT_ROOT) - x(flow.FLOW_SPIGOT_AFT_TIP)}" height="16" fill="#9cf" stroke="#26a"/>`;
  d += `<text x="${x((flow.FLOW_SPIGOT_AFT_TIP + flow.FLOW_SPIGOT_ROOT) / 2)}" y="112" text-anchor="middle" font-size="9">spigot ${flow.selectedSpigotLength.toFixed(2)} m</text>`;
  d += `<rect x="${x(flow.CORE_BULK_AFT_FACE)}" y="130" width="${x(flow.CORE_BULK_AFT_FACE + 0.28) - x(flow.CORE_BULK_AFT_FACE)}" height="16" fill="#26a"/>`;
  d += `<text x="${x(flow.CORE_BULK_AFT_FACE) + 4}" y="142" font-size="9" fill="#fff">core bulk ${flow.CORE_BULK_AFT_FACE.toFixed(3)}</text>`;
  d += `<text x="16" y="${H - 28}" font-size="10">bridge gap ${flow.coreToCanMouthGap.toFixed(3)} m · actual insertion ${flow.flowInsertion.toFixed(3)} m (interval overlap, not bay engagement)</text>`;
  d += `<text x="16" y="${H - 12}" font-size="10">red=can receiver · cyan=spigot · solid=core bulk · dashed=AFT_POST_PAIR · amber=can mouth</text>`;
  d += `</svg>`;
  return d;
}
