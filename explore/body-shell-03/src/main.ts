import "./style.css";
import { BODY_CONCEPT_INFO } from "./bodyConceptInfo";
import { createApp } from "./scene/createScene";

document.title = "Quarto / Mechanism viewer";

const canvas = document.getElementById("view");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #view canvas");
}
canvas.setAttribute("aria-label", `Quarto inspectable transformation · ${BODY_CONCEPT_INFO.conceptId}`);

createApp(canvas);
