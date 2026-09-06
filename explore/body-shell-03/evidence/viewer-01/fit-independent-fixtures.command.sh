#!/usr/bin/env bash
# Original independent Fit review command, executed from:
# /home/cmish/MECHA/MT1/explore/body-shell-03
# Recorded environment: Node.js v25.2.1, Babylon.js v8.56.2 (NullEngine).
# This archive preserves the original WSL paths and output location. Run from
# the recorded package directory, or adapt those paths for a fresh review.
# The reviewed fitCamera.ts SHA-256 was:
# 25c060f4884504588e7c7b3ba3c1ea3194aa88189d723bf5fc64f5de050fbf27
node --input-type=module <<'JS'
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {Vector3,Matrix} from '@babylonjs/core/Maths/math.vector.js';
const source=readFileSync('src/presentation/fitCamera.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace('"@babylonjs/core/Maths/math.vector"','"file:///home/cmish/MECHA/MT1/explore/body-shell-03/node_modules/@babylonjs/core/Maths/math.vector.js"');
const {fitVisibleVehicle}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const cases=[];
for(const aspect of [.4,.67,1,1.78,2.45,4])for(const [alpha,beta] of [[.78,1.14],[-1.42,1.18],[Math.PI,.05],[0,1.53]])for(const center of [[0,0,0],[30,-12,40]]){
 const width=1600,height=Math.round(width/aspect),engine=new NullEngine({renderWidth:width,renderHeight:height,textureSize:512,deterministicLockstep:false,lockstepMaxSteps:4});const scene=new Scene(engine);
 const camera=new ArcRotateCamera('fixture',1.42,1.18,4.8,new Vector3(0,.82,-5.65),scene);camera.minZ=.005;camera.getViewMatrix(true);
 const box=MeshBuilder.CreateBox('box',{width:13.32,height:3.2,depth:8.4},scene);box.position.set(...center);box.rotation.set(.4,-.3,.8);box.computeWorldMatrix(true);
 const smaller=MeshBuilder.CreateBox('offset',{width:1,height:2,depth:3},scene);smaller.position.set(center[0]+7,center[1]+3,center[2]-3);smaller.computeWorldMatrix(true);
 camera.setTarget(new Vector3(0,1.05,.1));camera.alpha=alpha;camera.beta=beta;camera.radius=16.8;
 fitVisibleVehicle(camera,[box,smaller],width/height);camera.getViewMatrix(true);camera.getProjectionMatrix(true);
 const transform=camera.getTransformationMatrix(),viewport=camera.viewport.toGlobal(width,height);let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const mesh of [box,smaller])for(const point of mesh.getBoundingInfo().boundingBox.vectorsWorld){const p=Vector3.Project(point,Matrix.Identity(),transform,viewport);minX=Math.min(minX,p.x/width);maxX=Math.max(maxX,p.x/width);minY=Math.min(minY,p.y/height);maxY=Math.max(maxY,p.y/height);}
 cases.push({aspect:width/height,alpha,beta,center,radius:camera.radius,minX,maxX,minY,maxY,angleDelta:Math.max(Math.abs(alpha-camera.alpha),Math.abs(beta-camera.beta)),pass:minX>=0&&minY>=0&&maxX<=1&&maxY<=1});scene.dispose();engine.dispose();
}
const result={tests:cases.length,failures:cases.filter(x=>!x.pass),maxAngleDelta:Math.max(...cases.map(x=>x.angleDelta)),minX:Math.min(...cases.map(x=>x.minX)),maxX:Math.max(...cases.map(x=>x.maxX)),minY:Math.min(...cases.map(x=>x.minY)),maxY:Math.max(...cases.map(x=>x.maxY)),cases};writeFileSync('/tmp/quarto-fit-independent-fixtures.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,cases:undefined}));
JS
