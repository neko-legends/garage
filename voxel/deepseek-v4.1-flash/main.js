// Voxel garage in three.js — built from ./ref.png
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20242b);
scene.fog = new THREE.Fog(0x20242b, 30, 70);

// Fixed default camera (do not change)
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(-8.6, 10, 11.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.3, 0.9, 0);
const cam = new URLSearchParams(location.search).get('cam');
if (cam) { const v = cam.split(',').map(Number); camera.position.set(v[0], v[1], v[2]); controls.target.set(v[3], v[4], v[5]); }
controls.update();

// ---- your garage goes below this line ----

// ---------- palette ----------
const C = {
  wall: 0x9c968f, wallB: 0x8b857e, wallC: 0xa8a29a,
  floor: 0xb8b3ac, floorB: 0xaaa49d, floorC: 0xc2bdb6,
  pad: 0x2b2b2e, padEdge: 0x1c1c1e,
  yellow: 0xf4b41a, white: 0xf3f1ef, offwhite: 0xdedbd8,
  black: 0x1b1b1d, dark: 0x2e2e30, gray: 0x8e8e8e, grayD: 0x6a6a6a,
  red: 0xc0392b, redD: 0x8e2a20, green: 0x4a7c3f, greenD: 0x35592d,
  brown: 0x8b5a2b, brownD: 0x6b4520, wood: 0x6b4a2f,
  blue: 0x9ec9e8, blueD: 0x6fa8cf, steel: 0xb9bcc0,
  lamp: 0xffcf7a, plant: 0x3f7a2e, pot: 0x555555,
};

const root = new THREE.Group();
root.scale.setScalar(1.22);
scene.add(root);

// ---------- helpers ----------
const matCache = new Map();
function mat(color, emissive) {
  const key = color + '|' + (emissive || 0);
  if (!matCache.has(key)) {
    const m = new THREE.MeshLambertMaterial({ color });
    if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 1; }
    matCache.set(key, m);
  }
  return matCache.get(key);
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, color, x, y, z, parent, rotY, emissive) {
  const m = new THREE.Mesh(boxGeo, mat(color, emissive));
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  if (rotY) m.rotation.y = rotY;
  m.castShadow = true; m.receiveShadow = true;
  (parent || root).add(m);
  return m;
}

// ---------- lighting ----------
scene.add(new THREE.HemisphereLight(0xbfc6d0, 0x3a3630, 0.75));
const amb = new THREE.AmbientLight(0xffffff, 0.28);
scene.add(amb);
const sun = new THREE.DirectionalLight(0xfff2dd, 0.85);
sun.position.set(-9, 14, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 45;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xcfd8e6, 0.55);
fill.position.set(8, 8, -6);
scene.add(fill);

// ---------- floor ----------
const FW = 10, FD = 8; // floor X x Z
const floorTiles = [];
for (let ix = 0; ix < FW; ix++) {
  for (let iz = 0; iz < FD; iz++) {
    const g = new THREE.BoxGeometry(0.98, 0.2, 0.98);
    g.translate(-FW / 2 + 0.5 + ix, -0.1, -FD / 2 + 0.5 + iz);
    floorTiles.push(g);
  }
}
const floorMesh = new THREE.Mesh(mergeGeometries(floorTiles), mat(C.floor));
floorMesh.receiveShadow = true;
root.add(floorMesh);
// subtle tile variation overlay
for (let ix = 0; ix < FW; ix++) for (let iz = 0; iz < FD; iz++) {
  if ((ix + iz) % 2 === 0) continue;
  box(0.9, 0.02, 0.9, C.floorB, -FW / 2 + 0.5 + ix, 0.005, -FD / 2 + 0.5 + iz);
}

// ---------- walls (flat brick) ----------
const WALL_H = 5.0;
function brickWall(axis, fixed, from, to, colorA, colorB) {
  const len = to - from;
  // solid wall slab
  if (axis === 'z') box(len, WALL_H, 0.3, colorA, (from + to) / 2, WALL_H / 2, fixed);
  else box(0.3, WALL_H, len, colorA, fixed, WALL_H / 2, (from + to) / 2);
  // mortar lines (recessed dark) + brick colour variation (flush)
  const rows = Math.round(WALL_H / 0.5);
  for (let r = 0; r < rows; r++) {
    const y = 0.25 + r * 0.5;
    const off = (r % 2) * 0.5;
    // horizontal mortar
    if (axis === 'z') box(len, 0.04, 0.32, C.grayD, (from + to) / 2, y + 0.25, fixed);
    else box(0.32, 0.04, len, C.grayD, fixed, y + 0.25, (from + to) / 2);
    // vertical mortar + variation
    for (let x = from - 0.5; x < to; x += 1) {
      if (axis === 'z') box(0.04, 0.46, 0.32, C.grayD, x + off, y, fixed);
      else box(0.32, 0.46, 0.04, C.grayD, fixed, y, x + off);
      if ((r * 7 + Math.round(x * 2)) % 3 === 0) {
        if (axis === 'z') box(0.9, 0.42, 0.31, colorB, x + off + 0.5, y, fixed);
        else box(0.31, 0.42, 0.9, colorB, fixed, y, x + off + 0.5);
      }
    }
  }
}
// left wall at z = -FD/2, right wall at x = +FW/2
brickWall('z', -FD / 2 - 0.15, -FW / 2, FW / 2, C.wall, C.wallB);
brickWall('x', FW / 2 + 0.15, -FD / 2, FD / 2, C.wall, C.wallB);
// top trim
box(FW + 0.6, 0.3, 0.4, C.grayD, 0, WALL_H + 0.15, -FD / 2 - 0.15);
box(0.4, 0.3, FD + 0.6, C.grayD, FW / 2 + 0.15, WALL_H + 0.15, 0);

// ---------- parking pad ----------
const pad = new THREE.Group();
pad.position.set(0.4, 0, 0.4);
pad.rotation.y = -0.5;
root.add(pad);
box(5.4, 0.14, 4.6, C.pad, 0, 0.07, 0, pad);
box(5.7, 0.1, 4.9, C.padEdge, 0, 0.05, 0, pad);
// yellow markings: dashes along left/bottom, solid stripe right
for (let i = -2; i <= 2; i++) {
  box(0.5, 0.16, 0.16, C.yellow, -2.5, 0.08, i * 0.9, pad);
  box(0.16, 0.16, 0.5, C.yellow, i * 0.9, 0.08, 2.15, pad);
}
box(0.18, 0.16, 4.2, C.yellow, 2.5, 0.08, 0, pad);
box(0.18, 0.16, 1.4, C.yellow, -2.5, 0.08, -1.6, pad);

// ---------- car ----------
const car = new THREE.Group();
car.position.set(0.4, 0.14, 0.4);
car.rotation.y = Math.PI / 4; // front toward lower-left
root.add(car);
function cbox(w, h, d, color, x, y, z, rotY, rotX) {
  const m = box(w, h, d, color, x, y, z, car, rotY);
  if (rotX) m.rotation.x = rotX;
  return m;
}
// lower body (wide, low sports-car profile)
cbox(2.4, 0.36, 5.4, C.white, 0, 0.36, 0);
cbox(2.5, 0.26, 4.6, C.white, 0, 0.18, 0);
// black sills / lower fascia
cbox(2.52, 0.16, 5.0, C.black, 0, 0.09, 0);
cbox(2.4, 0.26, 0.6, C.black, 0, 0.26, -2.6);
// hood / nose (low, long)
cbox(2.1, 0.16, 1.9, C.white, 0, 0.56, -1.9);
cbox(1.9, 0.14, 0.6, C.white, 0, 0.52, -2.5);
// cabin (set back, low, tapered)
cbox(1.8, 0.34, 1.8, C.white, 0, 0.72, 0.5);
// roof (narrower)
cbox(1.6, 0.1, 1.4, C.offwhite, 0, 0.92, 0.55);
// strongly sloped windshield + rear glass
cbox(1.85, 0.62, 0.1, C.black, 0, 0.74, -0.5, 0, -0.95);
cbox(1.85, 0.56, 0.1, C.black, 0, 0.74, 1.5, 0, 0.85);
// side windows
cbox(0.12, 0.3, 1.3, C.black, 0.9, 0.76, 0.5);
cbox(0.12, 0.3, 1.3, C.black, -0.9, 0.76, 0.5);
// pillars
cbox(0.14, 0.34, 0.14, C.white, 0.9, 0.72, 0.5);
cbox(0.14, 0.34, 0.14, C.white, -0.9, 0.72, 0.5);
// wheels
function wheel(x, z) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12), mat(C.black));
  w.rotation.z = Math.PI / 2;
  w.position.set(x, 0.38, z);
  w.castShadow = true;
  car.add(w);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 8), mat(C.steel));
  hub.rotation.z = Math.PI / 2;
  hub.position.set(x, 0.38, z);
  car.add(hub);
  // spokes
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    box(0.12, 0.12, 0.12, C.steel, x, 0.38 + Math.sin(a) * 0.2, z + Math.cos(a) * 0.2, car);
  }
  // wheel arch
  box(0.3, 0.5, 0.9, C.black, x > 0 ? x - 0.05 : x + 0.05, 0.5, z, car);
}
wheel(1.2, -1.7); wheel(-1.2, -1.7); wheel(1.2, 1.7); wheel(-1.2, 1.7);
// headlights
cbox(0.6, 0.12, 0.12, C.offwhite, 0.75, 0.52, -2.7);
cbox(0.6, 0.12, 0.12, C.offwhite, -0.75, 0.52, -2.7);
// taillights
box(0.7, 0.16, 0.14, C.red, 0.75, 0.52, 2.72, car, 0, 0x8e1a10);
box(0.7, 0.16, 0.14, C.red, -0.75, 0.52, 2.72, car, 0, 0x8e1a10);
// mirrors
cbox(0.24, 0.1, 0.16, C.white, 1.2, 0.8, -0.4);
cbox(0.24, 0.1, 0.16, C.white, -1.2, 0.8, -0.4);

// ---------- left wall: pegboard + tools + workbench + cabinets ----------
const peg = new THREE.Group();
peg.position.set(-2.0, 0, -FD / 2 + 0.02);
root.add(peg);
box(3.4, 1.9, 0.1, 0x4a3520, 0, 2.0, 0, peg);          // dark wood frame
box(3.2, 1.7, 0.12, 0x2f2f2f, 0, 2.0, 0.02, peg);       // dark charcoal board
// tools on board
const toolY = 2.0;
function wrench(x, color) {
  box(0.1, 0.5, 0.1, color, x, toolY + 0.1, 0.1, peg);
  box(0.1, 0.16, 0.1, C.gray, x - 0.1, toolY + 0.4, 0.1, peg);
  box(0.1, 0.16, 0.1, C.gray, x + 0.1, toolY + 0.4, 0.1, peg);
  box(0.1, 0.16, 0.1, C.gray, x - 0.1, toolY - 0.2, 0.1, peg);
  box(0.1, 0.16, 0.1, C.gray, x + 0.1, toolY - 0.2, 0.1, peg);
}
wrench(-1.35, C.red);
wrench(-0.95, C.steel);
// screwdrivers with silver shafts
box(0.1, 0.3, 0.1, C.steel, -0.55, toolY + 0.2, 0.1, peg);
box(0.1, 0.2, 0.1, C.red, -0.55, toolY - 0.05, 0.1, peg);
box(0.1, 0.3, 0.1, C.steel, -0.2, toolY + 0.2, 0.1, peg);
box(0.1, 0.2, 0.1, C.blue, -0.2, toolY - 0.05, 0.1, peg);
// hammer
box(0.1, 0.4, 0.1, C.yellow, 0.2, toolY + 0.1, 0.1, peg);
box(0.26, 0.14, 0.1, C.steel, 0.2, toolY + 0.35, 0.1, peg);
// pliers
box(0.1, 0.4, 0.1, C.red, 0.6, toolY + 0.1, 0.1, peg);
box(0.1, 0.4, 0.1, C.red, 0.9, toolY + 0.1, 0.1, peg);
box(0.1, 0.4, 0.1, C.red, 1.2, toolY + 0.1, 0.1, peg);
box(0.16, 0.14, 0.1, C.gray, 0.6, toolY + 0.35, 0.1, peg);
box(0.16, 0.14, 0.1, C.gray, 0.9, toolY + 0.35, 0.1, peg);
box(0.16, 0.14, 0.1, C.gray, 1.2, toolY + 0.35, 0.1, peg);
// small yellow blocks
box(0.3, 0.12, 0.1, C.yellow, -1.0, toolY - 0.6, 0.1, peg);
box(0.3, 0.12, 0.1, C.yellow, 0.6, toolY - 0.6, 0.1, peg);
box(0.2, 0.2, 0.1, C.gray, 1.4, toolY - 0.5, 0.1, peg);

// workbench under pegboard (tiled top)
box(3.6, 0.14, 0.75, C.gray, -2.0, 0.9, -FD / 2 + 0.42);
for (let i = 0; i < 6; i++) box(0.5, 0.02, 0.7, C.grayD, -3.5 + i * 0.6, 0.98, -FD / 2 + 0.42);
box(0.14, 0.8, 0.65, C.grayD, -3.6, 0.45, -FD / 2 + 0.42);
box(0.14, 0.8, 0.65, C.grayD, -0.4, 0.45, -FD / 2 + 0.42);
// cabinets under bench
box(1.5, 0.7, 0.6, C.redD, -2.8, 0.35, -FD / 2 + 0.35);
box(1.5, 0.7, 0.6, C.redD, -1.2, 0.35, -FD / 2 + 0.35);
for (let i = 0; i < 3; i++) {
  box(1.2, 0.06, 0.06, C.gray, -2.8, 0.2 + i * 0.2, -FD / 2 + 0.66);
  box(1.2, 0.06, 0.06, C.gray, -1.2, 0.2 + i * 0.2, -FD / 2 + 0.66);
}
// dark toolbox with red drawer on bench
box(0.8, 0.4, 0.45, C.dark, -2.7, 1.15, -FD / 2 + 0.42);
box(0.8, 0.14, 0.45, C.red, -2.7, 1.4, -FD / 2 + 0.42);
box(0.2, 0.1, 0.1, C.steel, -2.7, 1.5, -FD / 2 + 0.42);
// vise on bench
box(0.3, 0.3, 0.3, C.grayD, -1.9, 1.1, -FD / 2 + 0.42);
box(0.4, 0.12, 0.2, C.steel, -1.9, 1.3, -FD / 2 + 0.42);
box(0.1, 0.2, 0.1, C.grayD, -1.9, 1.4, -FD / 2 + 0.42);
// tall cabinet on left wall
box(1.0, 2.2, 0.6, C.gray, -4.3, 1.1, -FD / 2 + 0.35);
box(0.9, 0.06, 0.06, C.grayD, -4.3, 0.6, -FD / 2 + 0.66);
box(0.9, 0.06, 0.06, C.grayD, -4.3, 1.2, -FD / 2 + 0.66);
box(0.9, 0.06, 0.06, C.grayD, -4.3, 1.8, -FD / 2 + 0.66);
// plant on cabinet
box(0.4, 0.3, 0.4, C.pot, -4.3, 2.35, -FD / 2 + 0.35);
box(0.5, 0.4, 0.5, C.plant, -4.3, 2.7, -FD / 2 + 0.35);
box(0.3, 0.3, 0.3, C.plant, -4.3, 3.0, -FD / 2 + 0.35);

// ---------- right wall: window + garage door ----------
// window near corner (larger, 4-pane, white frame)
box(1.6, 1.7, 0.14, C.white, FW / 2 - 0.02, 2.4, -3.3);
box(1.5, 1.6, 0.16, 0x9ad0f0, FW / 2 - 0.06, 2.4, -3.3, null, 0, 0x9ad0f0);
box(0.1, 1.6, 0.18, C.white, FW / 2 - 0.07, 2.4, -3.3);
box(1.5, 0.1, 0.18, C.white, FW / 2 - 0.07, 2.4, -3.3);
// counter under window
box(1.8, 0.9, 0.6, C.grayD, FW / 2 - 0.35, 0.45, -3.3);
box(1.8, 0.1, 0.65, C.gray, FW / 2 - 0.35, 0.95, -3.3);
box(0.8, 0.5, 0.5, C.gray, FW / 2 - 0.35, 0.25, -3.3);
// garage door
const door = new THREE.Group();
door.position.set(FW / 2 - 0.05, 0, 0.6);
root.add(door);
box(0.16, 3.4, 4.0, 0x5a5a5a, 0, 1.7, 0, door);       // frame
for (let i = 0; i < 7; i++) {
  box(0.2, 0.4, 3.7, 0xc4c0ba, -0.03, 0.3 + i * 0.46, 0, door);
  box(0.24, 0.08, 3.7, 0x4a4a4a, -0.04, 0.5 + i * 0.46, 0, door);
}
box(0.24, 0.12, 0.34, C.black, -0.12, 1.1, -1.5, door);   // hinges
box(0.24, 0.12, 0.34, C.black, -0.12, 2.2, -1.5, door);
box(0.24, 0.12, 0.34, C.black, -0.12, 1.1, 1.5, door);
box(0.24, 0.12, 0.34, C.black, -0.12, 2.2, 1.5, door);
box(0.24, 0.34, 0.24, C.black, -0.12, 0.7, 1.6, door);    // handle
const doorLight = new THREE.PointLight(0xffe0b0, 0.5, 8, 2);
doorLight.position.set(FW / 2 - 1.2, 2.6, 0.6);
root.add(doorLight);
// plant on floor right corner
box(0.5, 0.4, 0.5, C.pot, FW / 2 - 0.5, 0.2, -FD / 2 + 0.5);
box(0.6, 0.5, 0.6, C.plant, FW / 2 - 0.5, 0.65, -FD / 2 + 0.5);
box(0.4, 0.4, 0.4, C.plant, FW / 2 - 0.5, 1.0, -FD / 2 + 0.5);

// ---------- wall lamps ----------
function lamp(x, y, z, rotY) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = rotY;
  root.add(g);
  box(0.3, 0.3, 0.2, C.black, 0, 0, 0, g);
  box(0.5, 0.16, 0.3, C.black, 0, -0.2, 0.1, g);
  box(0.4, 0.1, 0.24, C.lamp, 0, -0.3, 0.12, g, 0, 0xffb347);
  const pl = new THREE.PointLight(0xffb347, 1.3, 9, 2);
  pl.position.set(0, -0.4, 0.3);
  g.add(pl);
}
lamp(-3.0, 3.4, -FD / 2 + 0.2, 0);
lamp(FW / 2 - 0.2, 3.4, -1.6, -Math.PI / 2);

// ---------- floor props ----------
// left: stacked gray crates (stepped pile)
box(0.8, 0.8, 0.8, C.grayD, -4.4, 0.4, -2.6);
box(0.7, 0.7, 0.7, C.gray, -4.4, 1.15, -2.6);
box(0.6, 0.6, 0.6, C.grayD, -4.4, 1.8, -2.6);
box(0.5, 0.5, 0.5, C.gray, -4.4, 2.35, -2.6);
// red toolbox on floor
box(0.9, 0.5, 0.5, C.red, -3.6, 0.25, -1.6);
box(0.9, 0.14, 0.5, C.black, -3.6, 0.57, -1.6);
box(0.3, 0.1, 0.1, C.gray, -3.6, 0.68, -1.6);
// small gray blocks
box(0.4, 0.4, 0.4, C.grayD, -4.0, 0.2, -1.0);
box(0.3, 0.3, 0.3, C.gray, -4.0, 0.55, -1.0);
// black mat with yellow pattern
box(1.6, 0.06, 1.6, C.black, -3.4, 0.03, 1.6);
for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
  if ((i + j) % 2 === 0) box(0.3, 0.08, 0.3, C.yellow, -3.9 + i * 0.35, 0.04, 1.1 + j * 0.35);
}
// yellow curb along pad right
box(0.3, 0.3, 3.6, C.yellow, 3.0, 0.15, 0.4);
for (let i = 0; i < 6; i++) box(0.32, 0.32, 0.3, C.black, 3.0, 0.16, -1.3 + i * 0.6);

// right: barrels + crates
function barrel(x, z, color) {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 12), mat(color));
  b.position.set(x, 0.5, z); b.castShadow = true; root.add(b);
  const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12), mat(C.grayD));
  r1.position.set(x, 0.75, z); root.add(r1);
  const r2 = r1.clone(); r2.position.y = 0.3; root.add(r2);
}
barrel(4.2, 2.6, C.green);
barrel(3.6, 3.0, C.grayD);
// brown crates
box(0.9, 0.9, 0.9, C.brown, 4.2, 0.45, 3.4);
box(0.9, 0.9, 0.9, C.brownD, 4.2, 1.35, 3.4);
box(0.9, 0.1, 0.9, C.brownD, 4.2, 0.9, 3.4);
// crate cross-braces
box(0.9, 0.1, 0.1, C.brownD, 4.2, 0.45, 2.95);
box(0.9, 0.1, 0.1, C.brownD, 4.2, 0.45, 3.85);

// ---------- extra clutter ----------
// red rolling cart near workbench
box(0.9, 0.1, 0.6, C.red, -1.0, 0.85, -2.2);
box(0.9, 0.1, 0.6, C.red, -1.0, 0.5, -2.2);
box(0.1, 0.8, 0.1, C.redD, -1.35, 0.4, -2.2);
box(0.1, 0.8, 0.1, C.redD, -0.65, 0.4, -2.2);
box(0.1, 0.8, 0.1, C.redD, -1.35, 0.4, -1.9);
box(0.1, 0.8, 0.1, C.redD, -0.65, 0.4, -1.9);
// stack of tires
function tire(x, y, z) {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 12), mat(C.black));
  t.position.set(x, y, z); t.castShadow = true; root.add(t);
}
tire(4.3, 0.12, 1.4); tire(4.3, 0.36, 1.4); tire(4.3, 0.6, 1.4);
// oil cans on bench
box(0.2, 0.3, 0.2, C.greenD, -1.6, 1.1, -FD / 2 + 0.42);
box(0.2, 0.3, 0.2, C.dark, -1.3, 1.1, -FD / 2 + 0.42);
// wall shelf on left wall
box(2.0, 0.1, 0.4, C.grayD, -3.0, 3.2, -FD / 2 + 0.25);
box(0.1, 0.3, 0.4, C.grayD, -4.0, 3.05, -FD / 2 + 0.25);
box(0.1, 0.3, 0.4, C.grayD, -2.0, 3.05, -FD / 2 + 0.25);
box(0.3, 0.3, 0.3, C.brown, -3.4, 3.4, -FD / 2 + 0.25);
box(0.3, 0.3, 0.3, C.gray, -2.6, 3.4, -FD / 2 + 0.25);
// stool
box(0.4, 0.1, 0.4, C.gray, -0.2, 0.5, -2.4);
box(0.1, 0.5, 0.1, C.grayD, -0.35, 0.25, -2.4);
box(0.1, 0.5, 0.1, C.grayD, -0.05, 0.25, -2.4);
box(0.1, 0.5, 0.1, C.grayD, -0.2, 0.25, -2.55);
box(0.1, 0.5, 0.1, C.grayD, -0.2, 0.25, -2.25);

// ---------- ceiling beam + hanging lights ----------
box(FW + 0.6, 0.3, 0.3, C.grayD, 0, WALL_H - 0.1, -FD / 2 + 0.2);
box(0.3, 0.3, FD + 0.6, C.grayD, FW / 2 - 0.2, WALL_H - 0.1, 0);
function hangLight(x, z) {
  box(0.06, 0.5, 0.06, C.black, x, WALL_H - 0.4, z);
  box(0.5, 0.14, 0.5, C.black, x, WALL_H - 0.7, z);
  box(0.4, 0.1, 0.4, C.lamp, x, WALL_H - 0.8, z, null, 0, 0xffcf7a);
  const pl = new THREE.PointLight(0xffc978, 0.9, 10, 2);
  pl.position.set(x, WALL_H - 0.9, z);
  root.add(pl);
}
hangLight(-1.5, -1.0);
hangLight(1.5, 1.5);

// ---- your garage goes above this line ----

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.__scene = scene;
