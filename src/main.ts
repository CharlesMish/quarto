import "./style.css";
import { MT1_BUILD_INFO } from "./buildInfo";
import { createApp } from "./scene/createScene";

document.title = `${MT1_BUILD_INFO.candidateId} / Mechanical Truth Authority`;

const canvas = document.getElementById("view");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #view canvas");
}
canvas.setAttribute("aria-label", `${MT1_BUILD_INFO.candidateId} mechanical authority inspection`);

createApp(canvas);
