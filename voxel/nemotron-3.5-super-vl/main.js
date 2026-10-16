// Starter: an empty three.js scene. Build the garage here (or in more modules imported from it).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20242b);

// Fixed default camera (do not change): elevated 3/4 view of a garage centred at the origin, +Y up.
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(-8.6, 10, 11.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.3, 0.9, 0);
// Close-up checks: index.html?cam=px,py,pz,tx,ty,tz overrides the view (the default view stays as above).
const cam = new URLSearchParams(location.search).get('cam');
if (cam) { const v = cam.split(',').map(Number); camera.position.set(v[0], v[1], v[2]); controls.target.set(v[3], v[4], v[5]); }
controls.update();

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------- palette ----------
const WALL=0x9aa3a8, WALLD=0x8c9297, FLOOR=0xdfe3e6, BLACK=0x1a1a1a,
  YELLOW=0xf3d54a, RED=0xc23b2f, DARKRED=0x8f2e24, BROWN=0x6b5240, DBROWN=0x3d2e22,
  WHITE=0xf0f2f4, GREY=0x9aa3a8, DGREY=0x474d53, SILVER=0xb9c1c8, GREEN=0x5d7a5d,
  GLASS=0x9fb6d4, YLIGHT=0xfff3b0, SKYBLUE=0x9fc7e8;

function mat(color,o={}){ return new THREE.MeshStandardMaterial(Object.assign({color},o)); }
function emat(color){ return new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:1.2}); }

function box(w,h,d,color,x,y,z,rx,ry,rz,o={}){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), o.emissive?emat(color):mat(color));
  m.position.set(x,y,z); if(rx||ry||rz) m.rotation.set(rx,ry,rz);
  m.castShadow=o.cast!==false; m.receiveShadow=o.receive!==false;
  scene.add(m); return m;
}
function cyl(r,h,color,x,y,z,rx,ry,rz,o={}){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16), o.emissive?emat(color):mat(color));
  m.position.set(x,y,z); if(rx||ry||rz) m.rotation.set(rx,ry,rz);
  m.castShadow=o.cast!==false; m.receiveShadow=o.receive!==false;
  scene.add(m); return m;
}
function group(){ const g=new THREE.Group(); scene.add(g); return g; }

// ---------- floor (10x8 tiles, top at y=0) ----------
const tileGeo=new THREE.BoxGeometry(1,0.1,1);
const floorTiles=new THREE.InstancedMesh(tileGeo, mat(FLOOR), 80);
floorTiles.castShadow=false; floorTiles.receiveShadow=true;
const mm=new THREE.Matrix4(); let k=0;
for(let z=-3.5; z<=3.5; z+=1){
  for(let x=-4.5; x<=4.5; x+=1){
    mm.setPosition(x,-0.05,z);
    floorTiles.setMatrixAt(k, mm); k++;
  }
}
floorTiles.instanceMatrix.needsUpdate=true;
scene.add(floorTiles);

// ---------- walls (0.5m cinder blocks, height 4) ----------
const BS=0.5, THICK=0.3, H=8;
function buildWall(axis, fixed, a0, a1, skipRanges){
  const nAlong=Math.round((a1-a0)/BS);
  const geo=new THREE.BoxGeometry(BS,BS,BS);
  const inst=new THREE.InstancedMesh(geo, mat(WALL), nAlong*H);
  inst.castShadow=true; inst.receiveShadow=true;
  const m=new THREE.Matrix4(); let i=0;
  const off = fixed>0 ? fixed+THICK/2 : fixed-THICK/2;
  for(let iy=0; iy<H; iy++){
    const y=iy*BS+BS/2;
    for(let ia=0; ia<nAlong; ia++){
      const a=a0+ia*BS+BS/2;
      let skip=false;
      if(skipRanges) for(const sr of skipRanges) if(a>=sr[0]&&a<=sr[1]){skip=true;break;}
      if(skip) continue;
      m.identity();
      if(axis==='z') m.setPosition(a, y, off);
      else m.setPosition(off, y, a);
      inst.setMatrixAt(i, m); i++;
    }
  }
  inst.count=i;
  inst.instanceMatrix.needsUpdate=true;
  scene.add(inst);
  return inst;
}

// Back wall: Z=-4, X in [-5,5]. Skip window region (window mounted on it).
buildWall('z', -4, -5, 5, [[2.2,3.6]]);
// Right wall: X=5, Z in [-4,4]. Skip garage door region.
buildWall('x', 5, -4, 4, [[-2.4,2.4]]);

// ---------- lighting ----------
const amb = new THREE.AmbientLight(0xffffff, 0.5); scene.add(amb);
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 11, 6); dir.castShadow=true;
dir.shadow.mapSize.set(1024,1024);
dir.shadow.camera.left=-13; dir.shadow.camera.right=13; dir.shadow.camera.top=11; dir.shadow.camera.bottom=-11; dir.shadow.camera.near=0.5; dir.shadow.camera.far=40;
dir.shadow.camera.updateProjectionMatrix();
scene.add(dir);
const dir2 = new THREE.DirectionalLight(0xffe8b0, 0.5);
dir2.position.set(-6, 8, -6); scene.add(dir2);
const fill = new THREE.PointLight(0xffe8b0, 2.5, 12);
fill.position.set(0, 5, -2); scene.add(fill);

// wall sconces (warm lamps) on back wall
function sconce(x,y){
  box(0.35,0.5,0.12,BLACK, x, y, -3.9);
  box(0.55,0.2,0.16,YLIGHT, x, y, -3.9, 0,0,0, {emissive:true});
  const lt=new THREE.PointLight(YLIGHT, 6, 9); lt.position.set(x,y,-3.9); scene.add(lt);
}
sconce(-3.0, 3.1);
sconce(2.7, 3.1);

// ---------- window on back wall (right portion, left of garage door) ----------
box(1.5,1.1,0.2,BLACK, 2.9, 2.75, -3.9); // frame
box(0.7,0.5,SKYBLUE, 2.55, 2.75, -3.85);
box(0.7,0.5,SKYBLUE, 3.25, 2.75, -3.85);
box(0.7,0.5,SKYBLUE, 2.55, 3.25, -3.85);
box(0.7,0.5,SKYBLUE, 3.25, 3.25, -3.85);
// blue sky behind window
box(1.7,1.3,0.06,SKYBLUE, 2.9, 2.75, -4.16);
// shelf below window
box(1.7,0.12,0.9,GREY, 2.9, 1.5, -3.75);
box(1.7,0.35,0.1,BLACK, 2.9, 1.35, -3.9);

// ---------- garage door on right wall ----------
box(0.1,3.2,4.8,0xc8ccd0, 4.9, 1.6, 0); // door panel (distinct from wall)
for(let y=0.35; y<=2.9; y+=0.75){
  box(0.1,0.18,4.7,0x7a7f84, 4.9, y, 0); // horizontal panels
}
box(0.1,0.2,0.15,BLACK, 4.9, 0.3, 1.8); // latch

// ---------- pegboard on back wall (left portion) ----------
box(3.4,2.5,0.18,DBROWN, -2.5, 2.25, -3.9); // pegboard
function tool(x,y,z,color,ry,sx,sy,sz){ box(sx,sy,sz,color, x,y,z, 0,ry,0); }
tool(-4.05, 3.1, -3.92, RED, 0, 0.2,0.5,0.12);   // red hammer
tool(-3.5, 3.1, -3.92, SILVER, 0, 0.18,0.45,0.1); // wrench
tool(-2.95, 3.1, -3.92, RED, 0, 0.12,0.5,0.08);  // red screwdriver
tool(-2.4, 3.1, -3.92, YELLOW, 0, 0.2,0.5,0.12); // yellow hammer
tool(-1.85, 3.1, -3.92, GLASS, 0, 0.12,0.5,0.08); // blue screwdriver
tool(-1.3, 3.1, -3.92, RED, 0, 0.16,0.3,0.14);  // red pliers
tool(-0.75, 3.1, -3.92, SILVER, 0, 0.16,0.3,0.14); // silver pliers

// ---------- workbench below pegboard ----------
box(3.4,0.1,1.1,DGREY, -2.5, 0.85, -3.0); // top
box(3.4,1.4,1.0,GREY, -2.5, 0.15, -3.0); // body
box(0.9,0.7,0.9,RED, -3.85, 0.5, -3.0);
box(0.9,0.7,0.9,RED, -2.85, 0.5, -3.0);
box(0.9,0.7,0.9,RED, -1.85, 0.5, -3.0);
box(0.08,0.7,0.08,SILVER, -3.45, 0.5, -3.0);
box(0.08,0.7,0.08,SILVER, -2.45, 0.5, -3.0);
box(0.08,0.7,0.08,SILVER, -1.45, 0.5, -3.0);

// ---------- cabinets against back wall (right portion) ----------
box(1.5,1.5,1.0,GREY, 1.1, 0.75, -3.7);
box(1.5,0.12,1.05,DGREY, 1.1, 1.52, -3.7);
box(0.7,0.65,0.1,RED, 0.75, 1.05, -3.66);
box(0.7,0.65,0.1,RED, 1.45, 1.05, -3.66);
box(0.06,0.65,0.06,SILVER, 1.1, 1.05, -3.66);
box(0.4,0.4,0.4,BLACK, 1.1, 1.75, -3.3); // toolbox on cabinet
box(0.3,0.5,0.3,GREEN, 1.1, 1.95, -3.05); // plant

// ---------- car (voxel sports car) ----------
const carG=new THREE.Group();
const carX=0.7, carZ=-0.8, carRot=-0.6;
const chassis=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.5,1.7), mat(WHITE));
chassis.position.set(0,0.3,0); chassis.castShadow=true; chassis.receiveShadow=true; carG.add(chassis);
const hood=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.45,1.5), mat(WHITE));
hood.position.set(1.75,0.15,0); hood.rotation.x=0.3; hood.castShadow=true; hood.receiveShadow=true; carG.add(hood);
const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.55,1.25), mat(WHITE));
cabin.position.set(-0.95,0.7,0); cabin.castShadow=true; cabin.receiveShadow=true; carG.add(cabin);
const roof=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.3,1.05), mat(WHITE));
roof.position.set(-0.95,1.05,0); roof.castShadow=true; roof.receiveShadow=true; carG.add(roof);
const windshield=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.5,1.2), mat(0x2a2a2a));
windshield.position.set(0.2,0.5,0); windshield.rotation.x=0.4; windshield.castShadow=true; windshield.receiveShadow=true; carG.add(windshield);
const swL=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.35,0.95), mat(0x2a2a2a));
swL.position.set(1.7,0.5,0); swL.castShadow=true; swL.receiveShadow=true; carG.add(swL);
const swR=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.35,0.95), mat(0x2a2a2a));
swR.position.set(-1.7,0.5,0); swR.castShadow=true; swR.receiveShadow=true; carG.add(swR);
function wheel(x,z){
  const w=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.7,16), mat(BLACK));
  w.position.set(x,0.3,z); w.rotation.z=Math.PI/2; w.castShadow=true; w.receiveShadow=true; carG.add(w);
  const r=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.72,16), mat(0xf0f0f0));
  r.position.set(x,0.3,z); r.rotation.z=Math.PI/2; carG.add(r);
}
wheel(1.35, 0.9); wheel(1.35,-0.9); wheel(-1.35,0.9); wheel(-1.35,-0.9);
box(0.3,0.16,0.5,RED, 0.55,0.48,0.95); // red detail side
box(0.4,0.25,0.8,BLACK, 2.55,0.18,0); // front bumper
carG.position.set(carX,0,carZ); carG.rotation.y=carRot;
scene.add(carG);

// ---------- parking pad (black mat under car) ----------
box(5.6,0.06,4.6,BLACK, 0.7, 0.03, -0.8);
for(let z=-2.9; z<=1.3; z+=0.5){
  const c=(Math.floor((z+2.9)/0.5)%2===0)?YELLOW:BLACK;
  box(0.3,0.07,0.45,c, 0.7-2.6, 0.05, z);
  box(0.3,0.07,0.45,c, 0.7+2.6, 0.05, z);
}
box(0.1,0.07,3.4,YELLOW, 0.7, 0.05, -0.8); // solid yellow line

// ---------- toolbox on floor (left of workbench) ----------
box(0.7,0.4,0.5,RED, -4.6, 0.2, -3.4);
box(0.7,0.06,0.5,BLACK, -4.6, 0.41, -3.4);

// ---------- stacked blocks (far left) ----------
for(let iy=0; iy<4; iy++) box(0.6,0.6,0.6,WALLD, -4.9, 0.3+iy*0.6, -3.9);

// ---------- barrels & crate (right side) ----------
function barrel(x,z,color){
  cyl(0.32,0.7,color, x,0.35,z);
  box(0.68,0.12,0.68,BLACK, x,0.7,z);
}
barrel(3.6, 2.2, GREEN);
barrel(4.2, 1.6, GREY);
box(0.7,0.7,0.7,BROWN, 4.6, 0.35, 2.4);
box(0.7,0.05,0.7,BROWN, 4.6, 0.7, 2.4);
box(0.7,0.05,0.7,BROWN, 4.6, 0.0, 2.4);

// ---------- black mat with yellow logo (bottom-left) ----------
box(1.6,0.05,1.6,BLACK, -4.2, 0.025, 3.4);
box(0.35,0.06,0.35,YELLOW, -4.2, 0.06, 3.4);

// ---------- render loop ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.__scene = scene;
