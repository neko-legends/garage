// Voxel garage — three.js scene built entirely from boxes.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { Builder, rnd, rrange, tileTexture } from './voxel.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1f26);
scene.fog = new THREE.Fog(0x1b1f26, 55, 120);

// Fixed default camera (do not change): elevated 3/4 view of a garage centred at the origin, +Y up.
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(-8.6, 10, 11.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.3, 0.9, 0);
// Close-up checks: index.html?cam=px,py,pz,tx,ty,tz overrides the view (the default view stays as above).
const cam = new URLSearchParams(location.search).get('cam');
if (cam) { const v = cam.split(',').map(Number); camera.position.set(v[0], v[1], v[2]); controls.target.set(v[3], v[4], v[5]); }
controls.update();

// ---- your garage goes below this line ----

// ============================================================ palette
const C = {
  brickA: 0x6b6763, brickB: 0x5d5955, brickC: 0x787470, brickD: 0x524e4b,
  cap: 0x3b3734, capTop: 0x4a4642,
  floorA: 0x8d8883, floorB: 0x7e7974, grout: 0x5c5753,
  pad: 0x2c2926, padB: 0x353230,
  yellow: 0xd6a11c, yellowHi: 0xf2b62a, yellowDim: 0xa87c14,
  black: 0x131313, nearBlack: 0x1c1c1c, darkGrey: 0x2b2b2b,
  grey: 0x6b6764, greyLt: 0x9a9692, greyDk: 0x4a4744, greyMid: 0x807c78,
  red: 0xa32020, redDk: 0x761414, redHi: 0xc42b2b,
  white: 0xe9e7e4, carWhite: 0xefedeb, carWhiteDk: 0xd8d5d1,
  glass: 0x14171b, glassBlue: 0x1d2a33,
  wood: 0x6d4b2e, woodDk: 0x4b3220, woodLt: 0x8a6238,
  green: 0x3f5c27, greenDk: 0x2b4019, greenLt: 0x577a35,
  blue: 0x4d84ad, sky: 0x86bcdd, skyLt: 0xc8e2f2,
  steel: 0x9c9c9c, steelDk: 0x6b6b6b, steelLt: 0xc0c0c0,
  orange: 0xcf6a1a, copper: 0x9a5a2a,
};

// ============================================================ builders
const B = new Builder();   // lit geometry
const E = new Builder();   // emissive / unlit geometry

// ============================================================ room metrics
const RX0 = -5.0, RX1 = 5.0;      // garage floor x extent (10 units)
const RZ0 = -4.0, RZ1 = 4.0;      // garage floor z extent (8 units)
const WALL_H = 4.5;
const WALL_T = 0.34;
// the two walls run well past the garage floor so they fill the frame like the reference
const BW_X0 = -13, BW_X1 = 5.2;   // back wall span
const RW_Z0 = -4.2, RW_Z1 = 14;   // right wall span

// ============================================================ ground
{
  const tex = tileTexture({ size: 256, tiles: 4, base: '#8d8883', grout: '#5c5753', variance: 0.09 });
  tex.repeat.set(22.6, 9.1);
  const g = new THREE.PlaneGeometry(45.2, 18.2);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex }));
  m.position.set(-17.4, 0, 4.9);
  m.receiveShadow = true;
  scene.add(m);
}

// ============================================================ walls
function brickWall(axis, fixed, from, to, y0, y1, depth) {
  const bw = 0.54, bh = 0.27, gap = 0.024;
  let course = 0;
  for (let y = y0; y < y1 - 0.02; y += bh) {
    const off = (course % 2) * bw * 0.5;
    let n = 0;
    for (let t = from - off; t < to - 0.02; t += bw) {
      const a = Math.max(t, from), c = Math.min(t + bw, to);
      if (c - a < 0.06) { n++; continue; }
      const pick = (course * 3 + n) % 7;
      const col = pick === 0 ? C.brickC : pick === 3 ? C.brickB : pick === 5 ? C.brickD : C.brickA;
      const yy0 = y + gap * 0.5, yy1 = Math.min(y + bh - gap * 0.5, y1);
      if (axis === 'x') B.mm(a + gap * 0.5, yy0, fixed - depth, c - gap * 0.5, yy1, fixed, col, 0.10);
      else B.mm(fixed - depth, yy0, a + gap * 0.5, fixed, yy1, c - gap * 0.5, col, 0.10);
      n++;
    }
    course++;
  }
  const capH = 0.24;
  if (axis === 'x') {
    B.mm(from, y1, fixed - depth - 0.07, to, y1 + capH, fixed + 0.03, C.cap, 0.06);
    B.mm(from, y1 + capH, fixed - depth - 0.07, to, y1 + capH + 0.07, fixed + 0.03, C.capTop, 0.06);
  } else {
    B.mm(fixed - depth - 0.07, y1, from, fixed + 0.03, y1 + capH, to, C.cap, 0.06);
    B.mm(fixed - depth - 0.07, y1 + capH, from, fixed + 0.03, y1 + capH + 0.07, to, C.capTop, 0.06);
  }
}

brickWall('x', RZ0, BW_X0, BW_X1, 0, WALL_H, WALL_T);   // back wall
brickWall('z', RX1, RW_Z0, RW_Z1, 0, WALL_H, WALL_T);   // right wall

// ============================================================ pegboard + tools
const PB_X0 = -4.55, PB_X1 = -2.15, PB_Y0 = 1.95, PB_Y1 = 3.75;
{
  const zf = RZ0 + 0.02;
  B.mm(PB_X0, PB_Y0, zf, PB_X1, PB_Y1, zf + 0.05, 0x1a1714, 0.05);
  const fw = 0.10, fd = 0.10;
  B.mm(PB_X0 - fw, PB_Y0 - fw, zf, PB_X1 + fw, PB_Y0, zf + fd, C.wood, 0.08);
  B.mm(PB_X0 - fw, PB_Y1, zf, PB_X1 + fw, PB_Y1 + fw, zf + fd, C.wood, 0.08);
  B.mm(PB_X0 - fw, PB_Y0, zf, PB_X0, PB_Y1, zf + fd, C.wood, 0.08);
  B.mm(PB_X1, PB_Y0, zf, PB_X1 + fw, PB_Y1, zf + fd, C.wood, 0.08);
  for (let x = PB_X0 + 0.17; x < PB_X1 - 0.1; x += 0.17) {
    for (let y = PB_Y0 + 0.17; y < PB_Y1 - 0.1; y += 0.17) {
      B.box(x, y, zf + 0.052, 0.036, 0.036, 0.012, 0x0d0b0a, 0.0);
    }
  }

  const tz = zf + 0.08;
  const tool = (x, y, w, h, col, d = 0.05) => B.box(x, y, tz + d / 2, w, h, d, col, 0.06);

  // red double-ended wrench
  tool(-4.25, 2.95, 0.10, 0.70, C.red);
  tool(-4.25, 3.34, 0.26, 0.11, C.red);
  tool(-4.25, 2.56, 0.26, 0.11, C.red);
  tool(-4.25, 3.34, 0.11, 0.17, 0x0d0b0a, 0.03);
  tool(-4.25, 2.56, 0.11, 0.17, 0x0d0b0a, 0.03);
  // grey wrench
  tool(-3.90, 3.02, 0.09, 0.78, C.steel);
  tool(-3.90, 3.44, 0.24, 0.10, C.steel);
  tool(-3.90, 2.60, 0.24, 0.10, C.steel);
  // screwdriver
  tool(-3.56, 2.95, 0.08, 0.34, C.steel);
  tool(-3.56, 2.68, 0.14, 0.24, C.redHi);
  // hammer
  tool(-3.22, 2.72, 0.10, 0.62, C.yellow);
  tool(-3.22, 3.06, 0.32, 0.14, C.steelDk);
  tool(-3.22, 3.06, 0.11, 0.22, C.steel);
  // blue chisel
  tool(-2.88, 2.88, 0.08, 0.38, C.steel);
  tool(-2.88, 2.64, 0.12, 0.20, 0x2f5f9a);
  // red pliers
  tool(-2.56, 2.80, 0.08, 0.34, C.red);
  tool(-2.42, 2.80, 0.08, 0.34, C.red);
  tool(-2.49, 3.06, 0.22, 0.15, C.steelDk);
  // yellow level
  tool(-2.90, 2.28, 0.70, 0.11, C.yellowHi);
  B.box(-2.90, 2.28, tz + 0.06, 0.11, 0.07, 0.02, 0x2a6b3a, 0.0);
  // small yellow blocks
  tool(-3.30, 2.28, 0.11, 0.11, C.yellow);
  tool(-3.16, 2.28, 0.11, 0.11, C.yellow);
  // tape measure
  tool(-2.50, 2.30, 0.18, 0.16, C.yellowHi);
  tool(-2.50, 2.30, 0.11, 0.09, C.black, 0.03);
}

// ============================================================ workbench
const WB_X0 = -4.8, WB_X1 = -2.0, WB_Z0 = RZ0, WB_Z1 = RZ0 + 0.92;
{
  B.mm(WB_X0, 0.90, WB_Z0, WB_X1, 1.00, WB_Z1, C.greyMid, 0.05);
  B.mm(WB_X0, 1.00, WB_Z0, WB_X1, 1.03, WB_Z1 - 0.02, C.greyLt, 0.04);
  B.mm(WB_X0, 1.00, WB_Z0, WB_X1, 1.16, WB_Z0 + 0.07, C.greyDk, 0.05);
  const unit = (x0, x1) => {
    B.mm(x0, 0.0, WB_Z0, x1, 0.90, WB_Z1 - 0.07, C.greyDk, 0.05);
    for (let i = 0; i < 3; i++) {
      const y0 = 0.07 + i * 0.28;
      B.mm(x0 + 0.05, y0, WB_Z1 - 0.07, x1 - 0.05, y0 + 0.23, WB_Z1 - 0.02, C.red, 0.06);
      B.mm(x0 + 0.05, y0 + 0.23, WB_Z1 - 0.07, x1 - 0.05, y0 + 0.25, WB_Z1 - 0.02, C.redDk, 0.04);
      B.mm((x0 + x1) / 2 - 0.17, y0 + 0.13, WB_Z1 - 0.02, (x0 + x1) / 2 + 0.17, y0 + 0.17, WB_Z1 + 0.02, C.steelLt, 0.05);
    }
    B.mm(x0 + 0.04, 0, WB_Z0 + 0.04, x0 + 0.15, 0.07, WB_Z1 - 0.1, C.nearBlack, 0.05);
    B.mm(x1 - 0.15, 0, WB_Z0 + 0.04, x1 - 0.04, 0.07, WB_Z1 - 0.1, C.nearBlack, 0.05);
  };
  unit(WB_X0 + 0.05, WB_X1 - 0.05);

  // on top: red toolbox (left)
  B.mm(-4.50, 1.03, WB_Z0 + 0.18, -3.88, 1.36, WB_Z0 + 0.68, C.red, 0.06);
  B.mm(-4.50, 1.36, WB_Z0 + 0.18, -3.88, 1.42, WB_Z0 + 0.68, C.black, 0.05);
  B.mm(-4.24, 1.42, WB_Z0 + 0.33, -4.14, 1.50, WB_Z0 + 0.53, C.black, 0.05);
  B.mm(-4.48, 1.15, WB_Z0 + 0.68, -3.90, 1.21, WB_Z0 + 0.72, C.steelLt, 0.05);
  B.mm(-4.42, 1.42, WB_Z0 + 0.24, -4.04, 1.57, WB_Z0 + 0.56, C.yellowHi, 0.06);
  // black crate (right)
  B.mm(-2.72, 1.03, WB_Z0 + 0.16, -2.10, 1.30, WB_Z0 + 0.72, C.nearBlack, 0.06);
  B.mm(-2.72, 1.30, WB_Z0 + 0.16, -2.10, 1.34, WB_Z0 + 0.72, C.darkGrey, 0.05);
  // small red box
  B.mm(-2.30, 1.03, WB_Z0 + 0.22, -2.04, 1.17, WB_Z0 + 0.56, C.redDk, 0.06);
  // loose tools on the counter
  B.mm(-3.60, 1.03, WB_Z0 + 0.32, -3.16, 1.06, WB_Z0 + 0.39, C.steel, 0.05);
  B.mm(-3.60, 1.03, WB_Z0 + 0.32, -3.54, 1.10, WB_Z0 + 0.39, C.redHi, 0.05);
}

// ============================================================ cabinets
const CB_X0 = -1.25, CB_X1 = 1.05, CB_Z0 = RZ0, CB_Z1 = RZ0 + 0.66;
{
  const top = 1.62;
  B.mm(CB_X0, 0.0, CB_Z0, CB_X1, top, CB_Z1, C.grey, 0.05);
  B.mm(CB_X0 - 0.05, top, CB_Z0, CB_X1 + 0.05, top + 0.08, CB_Z1 + 0.05, C.greyLt, 0.04);
  B.mm(CB_X0 + 0.04, 0, CB_Z1 - 0.06, CB_X1 - 0.04, 0.11, CB_Z1 + 0.01, C.greyDk, 0.05);
  const dx0 = CB_X0 + 0.07, dx1 = CB_X0 + 0.66;
  for (let i = 0; i < 2; i++) {
    const y0 = 0.17 + i * 0.66;
    B.mm(dx0, y0, CB_Z1, dx1, y0 + 0.58, CB_Z1 + 0.03, C.greyMid, 0.05);
    B.mm(dx0 + 0.02, y0 + 0.02, CB_Z1 + 0.03, dx1 - 0.02, y0 + 0.56, CB_Z1 + 0.05, C.greyLt, 0.04);
    B.mm((dx0 + dx1) / 2 - 0.15, y0 + 0.26, CB_Z1 + 0.05, (dx0 + dx1) / 2 + 0.15, y0 + 0.31, CB_Z1 + 0.10, C.steelLt, 0.05);
  }
  const ex0 = CB_X0 + 0.75, ex1 = CB_X1 - 0.07;
  B.mm(ex0, 0.17, CB_Z1, ex1, 1.50, CB_Z1 + 0.03, C.greyMid, 0.05);
  B.mm(ex0 + 0.02, 0.19, CB_Z1 + 0.03, (ex0 + ex1) / 2 - 0.02, 1.48, CB_Z1 + 0.05, C.greyLt, 0.04);
  B.mm((ex0 + ex1) / 2 + 0.02, 0.19, CB_Z1 + 0.03, ex1 - 0.02, 1.48, CB_Z1 + 0.05, C.greyLt, 0.04);
  B.mm((ex0 + ex1) / 2 - 0.11, 0.78, CB_Z1 + 0.05, (ex0 + ex1) / 2 - 0.06, 1.10, CB_Z1 + 0.10, C.steelLt, 0.05);
  B.mm((ex0 + ex1) / 2 + 0.06, 0.78, CB_Z1 + 0.05, (ex0 + ex1) / 2 + 0.11, 1.10, CB_Z1 + 0.10, C.steelLt, 0.05);
  B.mm(CB_X0 + 0.11, 0.32, CB_Z1 + 0.03, CB_X0 + 0.33, 0.43, CB_Z1 + 0.05, C.greyDk, 0.05);

  // potted plant on top
  const px = -0.22, pz = CB_Z0 + 0.32;
  B.mm(px - 0.22, top + 0.08, pz - 0.22, px + 0.22, top + 0.46, pz + 0.22, C.greyMid, 0.06);
  B.mm(px - 0.24, top + 0.44, pz - 0.24, px + 0.24, top + 0.50, pz + 0.24, C.greyLt, 0.05);
  B.mm(px - 0.19, top + 0.48, pz - 0.19, px + 0.19, top + 0.54, pz + 0.19, 0x2a241c, 0.05);
  const leaf = (dx, dy, dz, s, col) => B.box(px + dx, top + 0.54 + dy, pz + dz, s, s, s, col, 0.10);
  leaf(0, 0.11, 0, 0.22, C.greenDk);
  leaf(0, 0.31, 0, 0.20, C.green);
  leaf(-0.18, 0.26, 0.07, 0.17, C.greenLt);
  leaf(0.18, 0.22, -0.07, 0.17, C.green);
  leaf(0.07, 0.48, 0.11, 0.15, C.greenLt);
  leaf(-0.11, 0.46, -0.11, 0.15, C.green);
  leaf(0.0, 0.64, 0.0, 0.13, C.greenLt);
  leaf(-0.22, 0.39, -0.02, 0.13, C.greenDk);
  leaf(0.22, 0.37, 0.02, 0.13, C.greenDk);

  // yellow/black box on top
  const bx = -0.92, bz = CB_Z0 + 0.32;
  B.mm(bx - 0.17, top + 0.08, bz - 0.17, bx + 0.17, top + 0.22, bz + 0.17, C.black, 0.05);
  B.mm(bx - 0.17, top + 0.22, bz - 0.17, bx + 0.17, top + 0.37, bz + 0.17, C.yellowHi, 0.06);
  B.mm(bx - 0.17, top + 0.37, bz - 0.17, bx + 0.17, top + 0.43, bz + 0.17, C.black, 0.05);
  B.mm(bx - 0.11, top + 0.43, bz - 0.11, bx + 0.11, top + 0.46, bz + 0.11, C.darkGrey, 0.05);
}

// ============================================================ window
const WN_X0 = 2.35, WN_X1 = 3.95, WN_Y0 = 1.95, WN_Y1 = 3.45;
{
  const zf = RZ0;
  B.mm(WN_X0, WN_Y0, zf, WN_X1, WN_Y1, zf + 0.11, 0x2a2a2c, 0.04);
  E.mm(WN_X0 + 0.11, WN_Y0 + 0.11, zf + 0.11, WN_X1 - 0.11, WN_Y1 - 0.11, zf + 0.13, C.sky, 0.0);
  E.mm(WN_X0 + 0.24, WN_Y0 + 0.70, zf + 0.13, WN_X0 + 0.78, WN_Y0 + 0.96, zf + 0.15, C.skyLt, 0.0);
  E.mm(WN_X0 + 0.56, WN_Y0 + 0.56, zf + 0.13, WN_X0 + 1.00, WN_Y0 + 0.78, zf + 0.15, C.skyLt, 0.0);
  E.mm(WN_X1 - 0.66, WN_Y0 + 0.34, zf + 0.13, WN_X1 - 0.26, WN_Y0 + 0.56, zf + 0.15, C.skyLt, 0.0);
  const fw = 0.11, fd = 0.15;
  B.mm(WN_X0 - fw, WN_Y0 - fw, zf, WN_X1 + fw, WN_Y0, zf + fd, C.white, 0.04);
  B.mm(WN_X0 - fw, WN_Y1, zf, WN_X1 + fw, WN_Y1 + fw, zf + fd, C.white, 0.04);
  B.mm(WN_X0 - fw, WN_Y0, zf, WN_X0, WN_Y1, zf + fd, C.white, 0.04);
  B.mm(WN_X1, WN_Y0, zf, WN_X1 + fw, WN_Y1, zf + fd, C.white, 0.04);
  const mx = (WN_X0 + WN_X1) / 2, my = (WN_Y0 + WN_Y1) / 2;
  B.mm(mx - 0.055, WN_Y0, zf + 0.11, mx + 0.055, WN_Y1, zf + 0.17, C.white, 0.04);
  B.mm(WN_X0, my - 0.055, zf + 0.11, WN_X1, my + 0.055, zf + 0.17, C.white, 0.04);
  B.mm(WN_X0 - 0.18, WN_Y0 - 0.18, zf, WN_X1 + 0.18, WN_Y0 - 0.02, zf + 0.26, C.greyLt, 0.04);
}

// ============================================================ bench under the window
{
  const x0 = 2.15, x1 = 4.15, z0 = RZ0, z1 = RZ0 + 0.66;
  B.mm(x0, 0.88, z0, x1, 0.96, z1, C.greyMid, 0.05);
  B.mm(x0, 0.96, z0, x1, 0.99, z1 - 0.02, C.greyLt, 0.04);
  B.mm(x0, 0, z0, x0 + 0.11, 0.88, z1, C.greyDk, 0.05);
  B.mm(x1 - 0.11, 0, z0, x1, 0.88, z1, C.greyDk, 0.05);
  B.mm(x0, 0, z0, x1, 0.88, z0 + 0.09, C.greyDk, 0.05);
  B.mm(x0 + 0.11, 0.30, z0 + 0.09, x1 - 0.11, 0.36, z1 - 0.04, C.greyDk, 0.05);
  B.mm(x0 + 0.11, 0.60, z0 + 0.09, x1 - 0.11, 0.66, z1 - 0.04, C.greyDk, 0.05);
  B.mm(x0 + 0.22, 0.36, z0 + 0.15, x0 + 0.56, 0.60, z0 + 0.47, C.orange, 0.08);
  B.mm(x0 + 0.74, 0.36, z0 + 0.17, x0 + 1.06, 0.53, z0 + 0.45, C.greyLt, 0.08);
  B.mm(x0 + 1.26, 0.36, z0 + 0.15, x0 + 1.58, 0.51, z0 + 0.47, C.redDk, 0.08);
  B.mm(x0 + 0.32, 0.66, z0 + 0.17, x0 + 0.74, 0.85, z0 + 0.49, C.greyMid, 0.08);
  B.mm(x0 + 1.16, 0.66, z0 + 0.19, x0 + 1.48, 0.83, z0 + 0.47, C.steelDk, 0.08);
  B.mm(x0 + 0.32, 0.99, z0 + 0.15, x0 + 0.70, 1.15, z0 + 0.47, C.greyLt, 0.06);
  B.mm(x0 + 1.16, 0.99, z0 + 0.17, x0 + 1.52, 1.19, z0 + 0.49, C.wood, 0.08);
}

// ============================================================ wall lamps
function wallLamp(x, y) {
  const zf = RZ0;
  B.mm(x - 0.11, y - 0.11, zf, x + 0.11, y + 0.11, zf + 0.05, C.black, 0.05);
  B.mm(x - 0.055, y - 0.055, zf + 0.05, x + 0.055, y + 0.055, zf + 0.32, C.black, 0.05);
  B.mm(x - 0.24, y + 0.02, zf + 0.26, x + 0.24, y + 0.15, zf + 0.56, C.black, 0.05);
  B.mm(x - 0.17, y + 0.15, zf + 0.30, x + 0.17, y + 0.22, zf + 0.52, C.nearBlack, 0.05);
  E.mm(x - 0.20, y - 0.02, zf + 0.28, x + 0.20, y + 0.02, zf + 0.54, 0xffc46a, 0.0);
  E.mm(x - 0.07, y - 0.07, zf + 0.36, x + 0.07, y - 0.02, zf + 0.47, 0xffe0a0, 0.0);
}
wallLamp(-3.35, 4.05);
wallLamp(-0.10, 4.05);

// ============================================================ garage door (right wall)
const GD_Z0 = -3.3, GD_Z1 = 1.7, GD_Y1 = 3.7;
{
  const xf = RX1 - WALL_T;
  B.mm(xf - 0.11, 0, GD_Z0 - 0.15, xf, GD_Y1 + 0.15, GD_Z0, C.greyDk, 0.05);
  B.mm(xf - 0.11, 0, GD_Z1, xf, GD_Y1 + 0.15, GD_Z1 + 0.15, C.greyDk, 0.05);
  B.mm(xf - 0.11, GD_Y1, GD_Z0 - 0.15, xf, GD_Y1 + 0.15, GD_Z1 + 0.15, C.greyDk, 0.05);
  const n = 8, ph = GD_Y1 / n;
  for (let i = 0; i < n; i++) {
    const y0 = i * ph, y1 = y0 + ph;
    const col = i % 2 === 0 ? 0x9a9692 : 0x87837f;
    B.mm(xf - 0.13, y0 + 0.014, GD_Z0, xf - 0.02, y1 - 0.014, GD_Z1, col, 0.05);
    B.mm(xf - 0.14, y0, GD_Z0, xf - 0.02, y0 + 0.014, GD_Z1, 0x4e4a47, 0.03);
    B.mm(xf - 0.15, y0 + 0.07, GD_Z0 + 0.11, xf - 0.13, y1 - 0.07, GD_Z1 - 0.11, 0xa8a4a0, 0.04);
  }
  const hinge = (z, y) => {
    B.mm(xf - 0.22, y - 0.10, z - 0.08, xf - 0.13, y + 0.10, z + 0.08, C.black, 0.05);
    B.mm(xf - 0.26, y - 0.055, z - 0.045, xf - 0.22, y + 0.055, z + 0.045, C.nearBlack, 0.05);
  };
  hinge(GD_Z0 + 0.24, 0.92); hinge(GD_Z0 + 0.24, 2.32);
  hinge(GD_Z1 - 0.24, 1.40); hinge(GD_Z1 - 0.24, 2.80);
  B.mm(xf - 0.24, 1.68, GD_Z1 - 0.66, xf - 0.15, 1.77, GD_Z1 - 0.33, C.black, 0.05);
  B.mm(xf - 0.17, 2.75, GD_Z0 + 0.60, xf - 0.11, 3.20, GD_Z0 + 1.25, 0x2a2a2c, 0.04);
  E.mm(xf - 0.18, 2.78, GD_Z0 + 0.63, xf - 0.16, 3.17, GD_Z0 + 1.22, 0x6f9ab5, 0.0);
}

// ============================================================ parking pad + markings
const PAD_X0 = -3.7, PAD_X1 = 2.5, PAD_Z0 = -2.8, PAD_Z1 = 2.8;
{
  const tex = tileTexture({ size: 128, tiles: 2, base: '#2c2926', grout: '#1a1816', variance: 0.16 });
  tex.repeat.set(7, 7);
  const g = new THREE.PlaneGeometry(PAD_X1 - PAD_X0, PAD_Z1 - PAD_Z0);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex }));
  m.position.set((PAD_X0 + PAD_X1) / 2, 0.075, (PAD_Z0 + PAD_Z1) / 2);
  m.receiveShadow = true;
  scene.add(m);

  // raised platform body with a bevelled lip
  B.mm(PAD_X0 - 0.10, 0, PAD_Z0 - 0.10, PAD_X1 + 0.10, 0.055, PAD_Z1 + 0.10, 0x1e1c1a, 0.05);
  B.mm(PAD_X0, 0, PAD_Z0, PAD_X1, 0.075, PAD_Z1, 0x24211f, 0.05);
  const curbH = 0.11, curbW = 0.17;
  const dash = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(len / 0.44));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const ax = x0 + (x1 - x0) * t0, az = z0 + (z1 - z0) * t0;
      const bx = x0 + (x1 - x0) * t1, bz = z0 + (z1 - z0) * t1;
      const col = i % 2 === 0 ? C.yellow : C.black;
      B.mm(Math.min(ax, bx) - curbW / 2, 0, Math.min(az, bz) - curbW / 2,
        Math.max(ax, bx) + curbW / 2, curbH, Math.max(az, bz) + curbW / 2, col, 0.06);
    }
  };
  dash(PAD_X0, PAD_Z0, PAD_X0, PAD_Z1);
  dash(PAD_X0, PAD_Z1, PAD_X1, PAD_Z1);
  // yellow wheel stop
  B.mm(1.35, 0, 1.15, 1.95, 0.17, 2.35, C.yellowHi, 0.06);
  B.mm(1.35, 0.17, 1.15, 1.95, 0.21, 2.35, C.yellow, 0.05);
  // black plate with a yellow pixel glyph, outside the pad
  B.mm(-5.15, 0, 3.55, -4.15, 0.05, 4.55, 0x141414, 0.04);
  const glyph = [[1, 0, 1], [1, 1, 1], [1, 0, 1]];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    if (!glyph[r][c]) continue;
    B.mm(-4.90 + c * 0.17, 0.05, 3.75 + r * 0.17, -4.90 + c * 0.17 + 0.13, 0.07, 3.75 + r * 0.17 + 0.13, C.yellowHi, 0.05);
  }
}

// ============================================================ props
function barrel(x, z, col, colDk) {
  const r = 0.36, h = 0.98;
  const seg = 10;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const w = 2 * r * Math.sin((a1 - a0) / 2) * 1.06;
    const cx = x + Math.cos(am) * r * 0.98, cz = z + Math.sin(am) * r * 0.98;
    B.box(cx, h / 2, cz, w, h, 0.17, col, 0.08);
    const g = B.geos[B.geos.length - 1];
    g.translate(-cx, -h / 2, -cz); g.rotateY(-am + Math.PI / 2); g.translate(cx, h / 2, cz);
  }
  for (const ry of [0.28, 0.70]) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      const w = 2 * (r + 0.03) * Math.sin((a1 - a0) / 2) * 1.06;
      const cx = x + Math.cos(am) * (r + 0.02), cz = z + Math.sin(am) * (r + 0.02);
      B.box(cx, ry, cz, w, 0.10, 0.11, colDk, 0.08);
      const g = B.geos[B.geos.length - 1];
      g.translate(-cx, -ry, -cz); g.rotateY(-am + Math.PI / 2); g.translate(cx, ry, cz);
    }
  }
  B.mm(x - r + 0.04, h - 0.07, z - r + 0.04, x + r - 0.04, h, z + r - 0.04, colDk, 0.06);
  B.mm(x - r + 0.11, h - 0.11, z - r + 0.11, x + r - 0.11, h - 0.07, z + r - 0.11, col, 0.06);
  B.mm(x - r, h - 0.11, z - r, x + r, h - 0.02, z - r + 0.07, colDk, 0.06);
  B.mm(x - r, h - 0.11, z + r - 0.07, x + r, h - 0.02, z + r, colDk, 0.06);
  B.mm(x - r, h - 0.11, z - r, x - r + 0.07, h - 0.02, z + r, colDk, 0.06);
  B.mm(x + r - 0.07, h - 0.11, z - r, x + r, h - 0.02, z + r, colDk, 0.06);
}

barrel(3.95, 2.75, 0x3f5c27, 0x2b4019);   // green
barrel(4.55, 1.85, 0x4a4744, 0x2b2b2b);   // grey

// wooden crate
{
  const x = 4.15, z = 3.75, s = 0.82, h = 0.76;
  B.mm(x - s / 2, 0, z - s / 2, x + s / 2, h, z + s / 2, C.wood, 0.10);
  for (let i = 0; i < 3; i++) {
    const y0 = 0.06 + i * 0.23;
    B.mm(x - s / 2 - 0.02, y0, z - s / 2 - 0.02, x + s / 2 + 0.02, y0 + 0.17, z - s / 2 + 0.02, C.woodLt, 0.08);
    B.mm(x - s / 2 - 0.02, y0, z + s / 2 - 0.02, x + s / 2 + 0.02, y0 + 0.17, z + s / 2 + 0.02, C.woodLt, 0.08);
    B.mm(x - s / 2 - 0.02, y0, z - s / 2, x - s / 2 + 0.02, y0 + 0.17, z + s / 2, C.woodLt, 0.08);
    B.mm(x + s / 2 - 0.02, y0, z - s / 2, x + s / 2 + 0.02, y0 + 0.17, z + s / 2, C.woodLt, 0.08);
  }
  B.mm(x - s / 2, h, z - 0.055, x + s / 2, h + 0.055, z + 0.055, C.woodDk, 0.06);
  B.mm(x - 0.055, h, z - s / 2, x + 0.055, h + 0.055, z + s / 2, C.woodDk, 0.06);
  B.mm(x - s / 2, h, z - s / 2, x + s / 2, h + 0.045, z - s / 2 + 0.07, C.woodDk, 0.06);
  B.mm(x - s / 2, h, z + s / 2 - 0.07, x + s / 2, h + 0.045, z + s / 2, C.woodDk, 0.06);
}

// stacked dark crates against the right wall, near the back
{
  const x = 4.55, z = -2.85;
  B.mm(x - 0.44, 0, z - 0.44, x + 0.44, 0.58, z + 0.44, 0x3a3733, 0.08);
  B.mm(x - 0.42, 0.58, z - 0.42, x + 0.42, 1.08, z + 0.42, 0x44403b, 0.08);
  B.mm(x - 0.36, 1.08, z - 0.36, x + 0.36, 1.48, z + 0.36, 0x35322e, 0.08);
  for (const yy of [0.10, 0.32, 0.66, 0.88, 1.16, 1.36]) {
    B.mm(x - 0.46, yy, z - 0.46, x + 0.46, yy + 0.05, z + 0.46, 0x24211e, 0.06);
  }
}

// red tool chest on the floor, left end of the back wall
{
  const x = -4.55, z = -2.35;
  B.mm(x - 0.44, 0, z - 0.32, x + 0.44, 0.76, z + 0.32, C.red, 0.06);
  B.mm(x - 0.46, 0.76, z - 0.34, x + 0.46, 0.85, z + 0.34, C.black, 0.05);
  for (let i = 0; i < 3; i++) {
    const y0 = 0.07 + i * 0.23;
    B.mm(x - 0.42, y0, z + 0.32, x + 0.42, y0 + 0.19, z + 0.35, C.redDk, 0.05);
    B.mm(x - 0.17, y0 + 0.08, z + 0.35, x + 0.17, y0 + 0.12, z + 0.38, C.steelLt, 0.05);
  }
  B.mm(x - 0.21, 0.85, z - 0.07, x + 0.21, 0.92, z + 0.07, C.black, 0.05);
}

// grey crate stack, left end of the back wall
{
  const x = -4.95, z = -1.25;
  B.mm(x - 0.38, 0, z - 0.38, x + 0.38, 0.53, z + 0.38, 0x4a4744, 0.08);
  B.mm(x - 0.34, 0.53, z - 0.34, x + 0.34, 0.97, z + 0.34, 0x565350, 0.08);
  B.mm(x - 0.28, 0.97, z - 0.28, x + 0.28, 1.29, z + 0.28, 0x403d3a, 0.08);
  for (const yy of [0.08, 0.28, 0.59, 0.78, 1.03, 1.18]) {
    B.mm(x - 0.40, yy, z - 0.40, x + 0.40, yy + 0.04, z + 0.40, 0x2e2b28, 0.06);
  }
}

// small grey block near the tool chest
B.mm(-5.15, 0, -3.15, -4.75, 0.32, -2.75, 0x3a3733, 0.08);

// ============================================================ the car
function buildCar() {
  const vs = 0.1;
  const X0 = -2.3, X1 = 2.3, Y0 = 0.0, Y1 = 1.32, Z0 = -0.98, Z1 = 0.98;
  const nx = Math.round((X1 - X0) / vs), ny = Math.round((Y1 - Y0) / vs), nz = Math.round((Z1 - Z0) / vs);
  const solid = new Uint8Array(nx * ny * nz);
  const at = (i, j, k) => (i * ny + j) * nz + k;
  const cx = i => X0 + (i + 0.5) * vs;
  const cy = j => Y0 + (j + 0.5) * vs;
  const cz = k => Z0 + (k + 0.5) * vs;

  const WHEELS = [[1.42, 0.88], [1.42, -0.88], [-1.42, 0.88], [-1.42, -0.88]];
  const WY = 0.37, WR = 0.39;

  function shape(x, y, z) {
    const az = Math.abs(z);
    if (y > 0.82) {
      const frontX = 0.84 - (y - 0.82) * 1.05;
      const rearX = -1.10 + (y - 0.82) * 0.10;
      if (x > frontX || x < rearX) return 0;
      let hw = 0.82;
      if (y > 1.05) hw = 0.70;
      if (az > hw) return 0;
      return 1;
    }
    let hw = 0.95;
    if (x > 1.62) hw = 0.95 - (x - 1.62) * 0.95;
    if (x < -1.68) hw = 0.95 - (-1.68 - x) * 0.85;
    if (az > hw) return 0;
    let top;
    if (x > 0.84) top = 0.82 - (x - 0.84) * 0.13;
    else if (x > -1.10) top = 0.82;
    else top = 0.95 - (-1.10 - x) * 0.10;
    let bot = 0.17;
    if (x > 1.98) bot = 0.17 + (x - 1.98) * 0.40;
    if (x < -1.98) bot = 0.17 + (-1.98 - x) * 0.40;
    if (y < bot || y > top) return 0;
    for (const [wx, wz] of WHEELS) {
      if (Math.sign(z) === Math.sign(wz) && Math.abs(z) > 0.50) {
        if (Math.hypot(x - wx, y - WY) < 0.45) return 0;
      }
    }
    return 1;
  }

  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    if (shape(cx(i), cy(j), cz(k))) solid[at(i, j, k)] = 1;
  }

  function colorFor(x, y, z) {
    const az = Math.abs(z);
    if (y > 0.82) {
      if (y > 1.09) return C.carWhite;
      if (az > 0.52 && x > -0.92 && x < 0.36) return C.glass;
      if (x > 0.36) return C.glass;
      if (x < -0.92) return C.glass;
      return C.carWhite;
    }
    if (y < 0.31) return C.black;
    if (az > 0.86 && y < 0.46) return C.black;
    if (x > 2.10 && y < 0.54) return C.black;
    if (x < -2.10 && y < 0.52) return C.black;
    return C.carWhite;
  }

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-155));
  m.compose(new THREE.Vector3(-0.15, 0.02, 0.20), q, new THREE.Vector3(1.20, 1.00, 1.14));
  B.setTransform(m);

  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    if (!solid[at(i, j, k)]) continue;
    let surf = false;
    for (const [di, dj, dk] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const ii = i + di, jj = j + dj, kk = k + dk;
      if (ii < 0 || ii >= nx || jj < 0 || jj >= ny || kk < 0 || kk >= nz) { surf = true; break; }
      if (!solid[at(ii, jj, kk)]) { surf = true; break; }
    }
    if (!surf) continue;
    const x = cx(i), y = cy(j), z = cz(k);
    B.box(x, y, z, vs, vs, vs, colorFor(x, y, z), 0.045);
  }

  for (const [wx, wz] of WHEELS) {
    const sgn = Math.sign(wz);
    const n = Math.ceil(WR / vs);
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const dx = i * vs, dy = j * vs;
      if (Math.hypot(dx, dy) > WR) continue;
      B.box(wx + dx, WY + dy, wz, vs, vs, 0.30, C.black, 0.10);
    }
    const rimR = 0.26;
    const nr = Math.ceil(rimR / vs);
    for (let i = -nr; i <= nr; i++) for (let j = -nr; j <= nr; j++) {
      const dx = i * vs, dy = j * vs;
      const rr = Math.hypot(dx, dy);
      if (rr > rimR) continue;
      const ang = Math.atan2(dy, dx);
      const spoke = Math.abs(((ang * 5 / Math.PI) % 2) - 1) < 0.42;
      const col = rr < 0.075 ? C.steelLt : (spoke ? C.steelLt : C.darkGrey);
      B.box(wx + dx, WY + dy, wz + sgn * 0.175, vs, vs, 0.05, col, 0.06);
    }
    B.box(wx, WY, wz + sgn * 0.13, 0.17, 0.17, 0.04, C.steelDk, 0.05);
  }

  for (const s of [1, -1]) {
    B.box(0.54, 0.92, s * 0.93, 0.17, 0.11, 0.15, C.carWhite, 0.04);
    B.box(0.46, 0.92, s * 0.87, 0.11, 0.07, 0.11, C.carWhiteDk, 0.04);
  }
  for (const s of [1, -1]) {
    B.box(2.19, 0.58, s * 0.64, 0.11, 0.11, 0.32, 0xd8dde2, 0.03);
    B.box(2.21, 0.58, s * 0.64, 0.06, 0.07, 0.26, 0xf2f6ff, 0.02);
  }
  B.box(2.25, 0.37, 0, 0.09, 0.17, 0.76, C.black, 0.04);
  for (const s of [1, -1]) B.box(-2.23, 0.64, s * 0.62, 0.09, 0.11, 0.36, 0xb02020, 0.04);
  for (let i = -2; i <= 2; i++) B.box(-2.19, 0.25, i * 0.17, 0.15, 0.11, 0.055, C.black, 0.04);
  B.box(-2.10, 0.93, 0, 0.17, 0.07, 1.66, C.carWhite, 0.04);
  for (const s of [1, -1]) {
    B.box(0.42, 0.96, s * 0.81, 0.11, 0.30, 0.07, C.carWhite, 0.03);
    B.box(-0.90, 0.96, s * 0.81, 0.11, 0.30, 0.07, C.carWhite, 0.03);
    B.box(0.32, 0.57, s * 0.985, 0.02, 0.32, 0.02, 0xb8b5b1, 0.02);
  }
  B.clearTransform();
}
buildCar();

// ============================================================ assemble
const litMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const emiMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const litMesh = B.mesh(litMat);
if (litMesh) scene.add(litMesh);
const emiMesh = E.mesh(emiMat);
if (emiMesh) { emiMesh.castShadow = false; emiMesh.receiveShadow = false; scene.add(emiMesh); }

// ============================================================ lights
scene.add(new THREE.HemisphereLight(0x8ea4bd, 0x2e2822, 0.62));

const key = new THREE.DirectionalLight(0xfff0d8, 1.55);
key.position.set(4.5, 13, 10.5);
key.target.position.set(0, 0, 0);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -13; key.shadow.camera.right = 13;
key.shadow.camera.top = 13; key.shadow.camera.bottom = -13;
key.shadow.camera.near = 1; key.shadow.camera.far = 45;
key.shadow.bias = -0.0012;
key.shadow.normalBias = 0.03;
scene.add(key);
scene.add(key.target);

// fill from the left so the right-hand wall (garage door) is readable
const fillL = new THREE.DirectionalLight(0xb8c6d8, 0.42);
fillL.position.set(-11, 7.5, 3.5);
scene.add(fillL);

// fill from the front-left, cool, to lift the back wall
const fillF = new THREE.DirectionalLight(0x9cb0c8, 0.20);
fillF.position.set(-4, 5, 12);
scene.add(fillF);

// warm lamp pools
const lampA = new THREE.PointLight(0xffb45a, 46, 15, 2);
lampA.position.set(-3.35, 3.85, RZ0 + 0.6);
scene.add(lampA);
const lampB = new THREE.PointLight(0xffb45a, 40, 14, 2);
lampB.position.set(-0.10, 3.85, RZ0 + 0.6);
scene.add(lampB);
// cool window spill
const winL = new THREE.PointLight(0x9ec8e8, 16, 11, 2);
winL.position.set(3.15, 2.6, RZ0 + 0.8);
scene.add(winL);

// ---- your garage goes above this line ----

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.__scene = scene;
