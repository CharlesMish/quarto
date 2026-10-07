import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { SSAO2RenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import "@babylonjs/core/Rendering/geometryBufferRendererSceneComponent";
import { Scene } from "@babylonjs/core/scene";

// Register every shader these effects use synchronously, for the same reason
// materials.ts registers the default shaders: a lazy module that has not
// registered yet can send Babylon to its external .fx fallback, which Vite
// answers with index.html.
import "@babylonjs/core/Shaders/shadowMap.vertex";
import "@babylonjs/core/Shaders/shadowMap.fragment";
import "@babylonjs/core/Shaders/depthBoxBlur.fragment";
import "@babylonjs/core/Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow";
import "@babylonjs/core/Shaders/geometry.vertex";
import "@babylonjs/core/Shaders/geometry.fragment";
import "@babylonjs/core/Shaders/postprocess.vertex";
import "@babylonjs/core/Shaders/ssao2.fragment";
import "@babylonjs/core/Shaders/ssaoCombine.fragment";
import "@babylonjs/core/Shaders/pass.fragment";

/**
 * Presentation lighting for the public viewer. Appearance only: no mesh,
 * material color, pose, authority or certificate is changed, and nothing
 * here participates in fit, clearance or evidence. Studio and lite rebalance
 * the existing fill and sun intensities (not their directions).
 *
 * - studio: soft PCF sun shadows, screen-space ambient occlusion, rim light.
 * - lite:   sun shadows and rim light, no ambient occlusion (phones, WebGL1).
 * - flat:   the original viewer lighting and box-line grid. Used on software
 *           renderers, and on request (`?lighting=flat`) for comparison and
 *           for reproducing historical evidence. `?lighting=studio|lite`
 *           forces a tier.
 *
 * Study views (diagnostics, sections, lock focus, prop ghost) always fall
 * back to flat lighting so diagnostic colors and ghosted parts read exactly
 * as they did before.
 */
export type LightingTier = "studio" | "lite" | "flat";

export interface LightingState {
  tier: LightingTier;
  studyView: boolean;
  shadows: boolean;
  ambientOcclusion: boolean;
}

export interface PresentationLighting {
  readonly floor: Mesh;
  setStudyView(on: boolean): void;
  getState(): LightingState;
  dispose(): void;
}

export interface LightingOptions {
  scene: Scene;
  engine: Engine;
  camera: ArcRotateCamera;
  sun: DirectionalLight;
  hemi: HemisphericLight;
  floor: Mesh;
  tier: LightingTier;
  /** Meshes that cast and receive presentation shadows. */
  casters: readonly AbstractMesh[];
}

const FLOOR_SIZE = 120; // metres; even so 1 m tiles land on integer coordinates

export function chooseLightingTier(engine: Engine): LightingTier {
  const requested = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("lighting");
  if (requested === "studio" || requested === "lite" || requested === "flat") return requested;
  // Software rasterizers (SwiftShader, llvmpipe, WARP) have no GPU to spend:
  // keep the original lighting there. This also keeps headless test and
  // evidence runs on the historical look unless a tier is requested.
  const renderer = engine.getGlInfo?.().renderer ?? "";
  if (/swiftshader|llvmpipe|softpipe|microsoft basic render|warp/i.test(renderer)) return "flat";
  if (engine.webGLVersion < 2 || !SSAO2RenderingPipeline.IsSupported) return "lite";
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const narrow = typeof screen !== "undefined" && Math.min(screen.width, screen.height) < 700;
  return coarse || narrow ? "lite" : "studio";
}

/**
 * Build the stage floor where the original floor was built, so scene mesh
 * order is unchanged. The flat tier uses the original builder verbatim.
 */
export function createStageFloor(
  scene: Scene, engine: Engine, tier: LightingTier, floorColor: Color3, gridColor: Color3, createLegacyFloor: () => Mesh,
): Mesh {
  return tier === "flat" ? createLegacyFloor() : createGridFloor(scene, engine, floorColor, gridColor);
}

export function createPresentationLighting(options: LightingOptions): PresentationLighting {
  const { scene, engine, camera, sun, hemi, casters, floor, tier } = options;

  if (tier === "flat") {
    return {
      floor,
      setStudyView: () => undefined,
      getState: () => ({ tier, studyView: false, shadows: false, ambientOcclusion: false }),
      dispose: () => undefined,
    };
  }

  // Fog fades only the stage floor into the background, so the square edge
  // and far grid disappear. The machine never receives fog.
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogColor = new Color3(scene.clearColor.r, scene.clearColor.g, scene.clearColor.b);
  for (const mesh of scene.meshes) if (mesh !== floor) mesh.applyFog = false;
  const onNewMesh = scene.onNewMeshAddedObservable.add((mesh) => { if (mesh !== floor) mesh.applyFog = false; });
  const followFog = scene.onBeforeRenderObservable.add(() => {
    scene.fogStart = camera.radius + 6;
    scene.fogEnd = camera.radius + 46;
  });

  // Sun shadows. The sun keeps its original direction.
  const webgl2 = engine.webGLVersion >= 2;
  const shadows = new ShadowGenerator(tier === "studio" ? 2048 : 1024, sun);
  if (webgl2) {
    shadows.usePercentageCloserFiltering = true;
    shadows.filteringQuality = tier === "studio" ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_MEDIUM;
  } else {
    shadows.usePoissonSampling = true;
  }
  shadows.bias = 0.0015;
  shadows.normalBias = 0.012;
  sun.autoCalcShadowZBounds = true;
  sun.shadowEnabled = true;
  for (const mesh of casters) {
    shadows.addShadowCaster(mesh, false);
    mesh.receiveShadows = true;
  }
  floor.receiveShadows = true;

  // A cool, low rim from aft-above separates the dark hull from the dark
  // background. No shadows; decorative only.
  const rim = new DirectionalLight("presentationRim", new Vector3(0.45, -0.55, 1).normalize(), scene);
  rim.intensity = 0.32;
  rim.diffuse = new Color3(0.62, 0.8, 0.86);
  rim.specular = new Color3(0.2, 0.26, 0.28);

  // Ambient occlusion reads the creases between folios, roots and carrier.
  let ssao: SSAO2RenderingPipeline | null = null;
  if (tier === "studio") {
    // Created detached; apply() owns attachment so it is never attached twice.
    ssao = new SSAO2RenderingPipeline("presentationSsao", scene, { ssaoRatio: 0.75, blurRatio: 1 }, undefined, true);
    ssao.radius = 0.9;
    ssao.totalStrength = 1.1;
    ssao.base = 0.12;
    ssao.samples = 16;
    ssao.maxZ = 90;
    ssao.minZAspect = 0.4;
    ssao.expensiveBlur = true;
    ssao.textureSamples = 4; // keep MSAA once the scene renders through post-processes
    const gbuffer = scene.geometryBufferRenderer;
    if (gbuffer) gbuffer.renderTransparentMeshes = false;
  }

  let studyView = false;
  let ssaoAttached = false;
  // Showcase balance: a little less flat fill and a little more key separates
  // the hull's top from its sides. Directions are unchanged, and study views
  // return to the original intensities with the rest of the flat look.
  const original = { hemi: hemi.intensity, sun: sun.intensity };
  const apply = (): void => {
    sun.shadowEnabled = !studyView;
    rim.setEnabled(!studyView);
    hemi.intensity = studyView ? original.hemi : original.hemi * 0.85;
    sun.intensity = studyView ? original.sun : original.sun * 1.15;
    const wantSsao = Boolean(ssao) && !studyView;
    if (ssao && wantSsao !== ssaoAttached) {
      const manager = scene.postProcessRenderPipelineManager;
      if (wantSsao) manager.attachCamerasToRenderPipeline(ssao.name, camera);
      else manager.detachCamerasFromRenderPipeline(ssao.name, camera);
      ssaoAttached = wantSsao;
    }
  };
  apply();

  return {
    floor,
    setStudyView(on: boolean) {
      if (studyView === on) return;
      studyView = on;
      apply();
    },
    getState: () => ({ tier, studyView, shadows: !studyView, ambientOcclusion: Boolean(ssao) && !studyView }),
    dispose() {
      scene.onNewMeshAddedObservable.remove(onNewMesh);
      scene.onBeforeRenderObservable.remove(followFog);
      ssao?.dispose();
      shadows.dispose();
      rim.dispose();
      hemi.intensity = original.hemi;
      sun.intensity = original.sun;
    },
  };
}

function createGridFloor(scene: Scene, engine: Engine, floorColor: Color3, gridColor: Color3): Mesh {
  const floor = MeshBuilder.CreateGround("floor", { width: FLOOR_SIZE, height: FLOOR_SIZE }, scene);
  floor.position.y = 0;
  floor.isPickable = true;

  // One 1 m tile: base color with a 2 cm line split across two edges so the
  // tiles join seamlessly. Mipmaps plus anisotropy keep distant lines smooth
  // instead of the shimmering box grid.
  const size = 512;
  const texture = new DynamicTexture("stageGridTile", { width: size, height: size }, scene, true, Texture.TRILINEAR_SAMPLINGMODE);
  const context = texture.getContext();
  // StandardMaterial uses these colors as authored (no linear conversion), so
  // the tile carries the original floor and grid colors unchanged.
  const css = (c: Color3) => c.toHexString();
  context.fillStyle = css(floorColor);
  context.fillRect(0, 0, size, size);
  const half = Math.max(1, Math.round((0.02 * size) / 2));
  context.fillStyle = css(gridColor);
  context.fillRect(0, 0, size, half);
  context.fillRect(0, size - half, size, half);
  context.fillRect(0, 0, half, size);
  context.fillRect(size - half, 0, half, size);
  texture.update(false);
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  texture.uScale = FLOOR_SIZE;
  texture.vScale = FLOOR_SIZE;
  texture.anisotropicFilteringLevel = Math.min(16, engine.getCaps().maxAnisotropy || 1);

  const material = new StandardMaterial("matStageFloor", scene);
  material.diffuseTexture = texture;
  material.diffuseColor = Color3.White();
  material.specularColor = floorColor.scale(0.18);
  floor.material = material;
  return floor;
}
