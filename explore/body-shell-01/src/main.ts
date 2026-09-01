import "./style.css";
import { BODY_CONCEPT_INFO } from "./bodyConceptInfo";
import { createApp } from "./scene/createScene";

document.title = `${BODY_CONCEPT_INFO.conceptId} / ${BODY_CONCEPT_INFO.status}`;

const canvas = document.getElementById("view");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #view canvas");
}
canvas.setAttribute("aria-label", `${BODY_CONCEPT_INFO.conceptId} non-authoritative body-form exploration`);

createApp(canvas);
