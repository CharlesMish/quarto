import "./style.css";
import { createApp } from "./scene/createScene";

document.title = "Quarto / Mechanism viewer";

const canvas = document.getElementById("view");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #view canvas");
}
// The concept/provenance identity stays in Details & help; the canvas label
// describes what a visitor is looking at.
canvas.setAttribute("aria-label", "Quarto transforming machine, interactive 3D view");

createApp(canvas);
