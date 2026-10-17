// Voxel garage — built from boxes, merged per material for speed.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';

// ---------------------------------------------------------------- helpers
function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}

// Merges boxes sharing one material.
class Merger {
  constructor(material) { this.material = material; this.geos = []; }
  add(geo, mtx) {
    const g = geo.clone();
    if (mtx) g.applyMatrix4(mtx);
    this.geos.push(g);
  }
  box(w, h, d, x, y, z, ry = 0, rz = 0, rx = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Matrix4()
      .makeRotationFromEuler(new THREE.Euler(rx, ry, rz))
      .setPosition(x, y, z);
    this.add(g, m);
  }
  mesh() {
    if (!this.geos.length) return null;
    const merged = mergeGeometries(this.geos, false);
    this.geos.length = 0;
    const mesh = new THREE.Mesh(merged, this.material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }
}

const M = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });

// ---------------------------------------------------------------- textures
// Cinderblock wall: tile = 4 x 2 units (two rows, running bond), block 2x1.
function wallTexture(base) {
  function shade(hex, amt) {
    const r = Math.max(0, Math.min(255, (hex >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((hex >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (hex & 255) + amt));
    return `rgb(${r},${g},${b})`;
  }
  return makeCanvas(128, 64, (ctx) => {
    ctx.fillStyle = shade(base, -26); ctx.fillRect(0, 0, 128, 64); // mortar
    const bw = 64, bh = 32;
    const shades = [0, -6, 5, -3, 7, -5, 2, -7];
    let k = 0;
    for (let row = 0; row < 2; row++) {
      const off = row % 2 === 0 ? 0 : -bw / 2;
      for (let i = -1; i < 3; i++) {
        const x = off + i * bw, y = row * bh;
        const s = shades[(k++) % shades.length];
        ctx.fillStyle = shade(base, s);
        ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
        ctx.fillStyle = shade(base, s + 6);
        ctx.fillRect(x + 1.5, y + 1.5, bw - 3, 2);
        ctx.fillStyle = shade(base, s - 7);
        ctx.fillRect(x + 1.5, y + bh - 3.5, bw - 3, 2);
      }
    }
  });
}

// Floor: 2x2 units, four 1x1 tiles mottled.
function floorTexture() {
  const cols = [0xa8a4a6, 0x98949a, 0x8d898d, 0xa19da0, 0x939094, 0xaeaaad, 0x88848a, 0x9c989c];
  return makeCanvas(128, 128, (ctx) => {
    const t = 64;
    for (let iy = 0; iy < 2; iy++) for (let ix = 0; ix < 2; ix++) {
      const c = cols[(iy * 2 + ix * 3) % cols.length];
      ctx.fillStyle = '#' + c.toString(16).padStart(6, '0');
      ctx.fillRect(ix * t, iy * t, t, t);
      for (let s = 0; s < 26; s++) {
        const v = (Math.random() * 30 - 15) | 0;
        ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 190})`;
        ctx.fillRect(ix * t + Math.random() * t, iy * t + Math.random() * t, 3, 3);
      }
      ctx.strokeStyle = 'rgba(55,53,56,0.75)'; ctx.lineWidth = 3;
      ctx.strokeRect(ix * t + 1, iy * t + 1, t - 2, t - 2);
    }
  });
}

// Hazard mat: black with yellow pixel glyph.
function matTexture() {
  return makeCanvas(64, 48, (ctx) => {
    ctx.fillStyle = '#141312'; ctx.fillRect(0, 0, 64, 48);
    ctx.fillStyle = '#d69a16';
    const px = (x, y, w = 4, h = 4) => ctx.fillRect(x * 4, y * 4, w, h);
    px(6, 5); px(7, 5); px(6, 6); px(7, 6);
    px(5, 7, 8, 4);
    px(7, 11, 4, 8);
    px(5, 19, 8, 4);
    px(6, 23); px(7, 23); px(6, 24); px(7, 24);
    px(12, 13, 4, 6);
    px(16, 15, 6, 4);
  });
}

// ---------------------------------------------------------------- palette
const P = {
  wall: 0xa9a7a9, wallCap: 0x878385,
  pad: 0x2e2c2e, padBorder: 0x1c1b1c, yellow: 0xd8a018,
  white: 0xe8e6e2, black: 0x171616, darkGray: 0x4a4648, midGray: 0x6e6a6c,
  lightGray: 0xc9c5c7, red: 0xb03030, darkRed: 0x7c1f1f,
  wood: 0x8e6d5d, woodDark: 0x5e4535, woodLight: 0xae9867,
  green: 0x4a7c3f, greenDark: 0x33582b,
  silver: 0xc0c0c4, orange: 0xd69a17,
};

// ---------------------------------------------------------------- build
export function buildGarage(scene) {
  const g = new THREE.Group();
  scene.add(g);

  // room dimensions (inner faces) — fitted to the default camera view
  const X0 = -9.7, X1 = 6.89;   // right wall inner face at x = X1
  const Z0 = -5.0, Z1 = 9.7;    // far wall inner face at z = Z0
  const WH = 6.3;               // wall height
  const WT = 0.6;               // wall thickness

  // ---------- floor ----------
  const ftex = floorTexture();
  ftex.wrapS = ftex.wrapT = THREE.RepeatWrapping;
  ftex.repeat.set((X1 - X0 + 2) / 2, (Z1 - Z0 + 2) / 2);
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(X1 - X0 + 1.6, 0.5, Z1 - Z0 + 1.6),
    new THREE.MeshLambertMaterial({ map: ftex })
  );
  floor.position.set((X0 + X1) / 2 - 0.3, -0.25, (Z0 + Z1) / 2 + 0.3);
  floor.receiveShadow = true;
  g.add(floor);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(X1 - X0 + 2.2, 0.5, Z1 - Z0 + 2.2),
    M(0x353234)
  );
  base.position.set((X0 + X1) / 2 - 0.3, -0.55, (Z0 + Z1) / 2 + 0.3);
  g.add(base);

  // ---------- walls ----------
  const wtex = wallTexture(P.wall);
  wtex.wrapS = wtex.wrapT = THREE.RepeatWrapping;
  const farLen = X1 - X0 + WT;
  const wtexFar = wtex.clone(); wtexFar.needsUpdate = true;
  wtexFar.wrapS = wtexFar.wrapT = THREE.RepeatWrapping;
  wtexFar.repeat.set(farLen / 4, WH / 2);
  const farWall = new THREE.Mesh(new THREE.BoxGeometry(farLen, WH, WT), new THREE.MeshLambertMaterial({ map: wtexFar }));
  farWall.position.set((X0 - WT + X1) / 2, WH / 2, Z0 - WT / 2);
  farWall.castShadow = true; farWall.receiveShadow = true;
  g.add(farWall);

  const rightLen = Z1 - Z0 + WT;
  const wtexRight = wtex.clone(); wtexRight.needsUpdate = true;
  wtexRight.wrapS = wtexRight.wrapT = THREE.RepeatWrapping;
  wtexRight.repeat.set(rightLen / 4, WH / 2);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(WT, WH, rightLen), new THREE.MeshLambertMaterial({ map: wtexRight }));
  rightWall.position.set(X1 + WT / 2, WH / 2, (Z0 - WT + Z1) / 2);
  rightWall.castShadow = true; rightWall.receiveShadow = true;
  g.add(rightWall);

  const capM = M(P.wallCap);
  const capFar = new THREE.Mesh(new THREE.BoxGeometry(farLen + 0.3, 0.45, WT + 0.3), capM);
  capFar.position.set(farWall.position.x, WH + 0.225, Z0 - WT / 2);
  capFar.castShadow = true; g.add(capFar);
  const capRight = new THREE.Mesh(new THREE.BoxGeometry(WT + 0.3, 0.45, rightLen + 0.3), capM);
  capRight.position.set(X1 + WT / 2, WH + 0.225, rightWall.position.z);
  capRight.castShadow = true; g.add(capRight);

  // ---------- parking pad (slightly rotated with the car) ----------
  const padRot = 0.07;
  const padW = 11.0, padD = 6.5;
  const pcx = -0.2, pcz = 2.65;
  const pad = new Merger(M(P.pad));
  const cosR = Math.cos(padRot), sinR = Math.sin(padRot);
  const pbox = (w, h, d, lx, ly, lz, mm = pad) => {
    const wx = pcx + lx * cosR + lz * sinR;
    const wz = pcz - lx * sinR + lz * cosR;
    mm.box(w, h, d, wx, ly, wz, padRot);
  };
  pbox(padW, 0.12, padD, 0, 0.06, 0);                       // surface
  pbox(padW + 0.3, 0.22, 0.3, 0, 0.11, -padD / 2 - 0.15);   // north border
  pbox(padW + 0.3, 0.22, 0.3, 0, 0.11, padD / 2 + 0.15);    // south border
  pbox(0.3, 0.22, padD, -padW / 2 - 0.15, 0.11, 0);         // west border
  pbox(0.3, 0.22, padD, padW / 2 + 0.15, 0.11, 0);          // east border
  g.add(pad.mesh());

  // yellow dashes on N, E, W edges; solid yellow curb on S edge
  const yel = new Merger(M(P.yellow));
  const dash = (lx, lz, alongX) => {
    if (alongX) pbox(0.55, 0.09, 0.3, lx, 0.15, lz, yel);
    else pbox(0.3, 0.09, 0.55, lx, 0.15, lz, yel);
  };
  // dashes inset on the pad surface, just inside the border
  for (let lx = -padW / 2 + 0.9; lx < padW / 2 - 0.5; lx += 1.1) dash(lx, -padD / 2 + 0.35, true);
  for (let lz = -padD / 2 + 0.9; lz < padD / 2 - 0.5; lz += 1.1) { dash(padW / 2 - 0.35, lz, false); dash(-padW / 2 + 0.35, lz, false); }
  const segs = Math.ceil((padW + 0.3) / 1.05);
  for (let i = 0; i < segs; i++) {
    const w = Math.min(1.05, padW + 0.3 - i * 1.05);
    pbox(w, 0.16, 0.36, -padW / 2 - 0.15 + i * 1.05 + w / 2, 0.22, padD / 2 + 0.15, yel);
  }
  g.add(yel.mesh());

  // ---------- garage door (right wall) ----------
  const door = new Merger(M(0xd2ced0));
  const dz0 = 3.2, dz1 = 7.7, dh = 4.85;
  const panels = 5, ph = dh / panels;
  for (let i = 0; i < panels; i++) {
    door.box(0.14, ph - 0.1, dz1 - dz0 - 0.5, X1 - 0.02, ph * i + ph / 2, (dz0 + dz1) / 2 + 0.25);
  }
  const seam = new Merger(M(0x6e6a6c));
  for (let i = 1; i < panels; i++) seam.box(0.18, 0.14, dz1 - dz0 - 0.5, X1 - 0.04, ph * i, (dz0 + dz1) / 2 + 0.25);
  for (let i = 0; i < panels; i++) seam.box(0.16, 0.08, dz1 - dz0 - 0.9, X1 - 0.05, ph * i + ph / 2, (dz0 + dz1) / 2 + 0.25);
  g.add(seam.mesh());
  const hw = new Merger(M(P.black));
  hw.box(0.12, 0.3, 0.5, X1 - 0.04, 3.5, dz0 + 0.9);
  hw.box(0.12, 0.3, 0.5, X1 - 0.04, 1.8, dz0 + 0.9);
  hw.box(0.12, 0.3, 0.5, X1 - 0.04, 3.5, dz1 - 1.0);
  hw.box(0.12, 0.3, 0.5, X1 - 0.04, 1.3, dz1 - 1.0);
  hw.box(0.1, 0.14, 0.3, X1 - 0.05, 2.6, (dz0 + dz1) / 2);
  g.add(hw.mesh());
  g.add(door.mesh());
  const jamb = new Merger(M(0x555154));
  jamb.box(WT + 0.2, dh + 0.3, 0.35, X1 + 0.2, (dh + 0.3) / 2, dz0 - 0.18);
  jamb.box(WT + 0.2, dh + 0.3, 0.35, X1 + 0.2, (dh + 0.3) / 2, dz1 + 0.18);
  jamb.box(WT + 0.2, 0.85, dz1 - dz0 + 0.7, X1 + 0.2, dh + 0.42, (dz0 + dz1) / 2);
  g.add(jamb.mesh());

  // ---------- window (right wall) ----------
  const win = new Merger(M(0xbab6b8));
  const wz0 = 0.0, wz1 = 2.2, wy0 = 2.5, wy1 = 4.8;
  const wcz = (wz0 + wz1) / 2, wcy = (wy0 + wy1) / 2;
  const ww = wz1 - wz0, whh = wy1 - wy0;
  win.box(0.18, whh + 0.3, 0.22, X1 - 0.02, wcy, wz0 + 0.02);
  win.box(0.18, whh + 0.3, 0.22, X1 - 0.02, wcy, wz1 - 0.02);
  win.box(0.18, 0.22, ww, X1 - 0.02, wy0 + 0.02, wcz);
  win.box(0.18, 0.22, ww, X1 - 0.02, wy1 - 0.02, wcz);
  win.box(0.14, 0.14, ww - 0.2, X1 - 0.03, wcy, wcz);
  win.box(0.14, whh - 0.2, 0.14, X1 - 0.03, wcy, wcz);
  g.add(win.mesh());
  const glass = new Merger(M(0x4a90c8, { emissive: 0x5f9fd8, emissiveIntensity: 0.9 }));
  glass.box(0.08, whh / 2 - 0.16, ww / 2 - 0.16, X1 - 0.06, wcy + whh / 4, wcz - ww / 4);
  glass.box(0.08, whh / 2 - 0.16, ww / 2 - 0.16, X1 - 0.06, wcy + whh / 4, wcz + ww / 4);
  glass.box(0.08, whh / 2 - 0.16, ww / 2 - 0.16, X1 - 0.06, wcy - whh / 4, wcz - ww / 4);
  glass.box(0.08, whh / 2 - 0.16, ww / 2 - 0.16, X1 - 0.06, wcy - whh / 4, wcz + ww / 4);
  g.add(glass.mesh());
  const sill = new Merger(M(0xbab6b8));
  sill.box(0.5, 0.18, ww + 0.5, X1 + 0.1, wy0 - 0.16, wcz);
  g.add(sill.mesh());

  // ---------- shelf under window ----------
  const shelf = new Merger(M(0x3a3739));
  const sz0 = -2.6, sz1 = 0.7, sh = 1.7, sd = 0.8;
  const scz = (sz0 + sz1) / 2;
  shelf.box(sd, 0.12, sz1 - sz0, X1 - sd / 2, sh - 0.06, scz);
  shelf.box(sd, 0.12, sz1 - sz0, X1 - sd / 2, 0.06, scz);
  shelf.box(sd, sh, 0.1, X1 - sd / 2, sh / 2, sz0 + 0.05);
  shelf.box(0.1, sh, sz1 - sz0, X1 - 0.05, sh / 2, scz);
  shelf.box(sd, sh, 0.12, X1 - sd / 2, sh / 2, sz0);
  shelf.box(sd, sh, 0.12, X1 - sd / 2, sh / 2, sz1);
  shelf.box(sd, sh * 0.55, 0.1, X1 - sd / 2, sh * 0.35, scz - 1.0);
  shelf.box(sd, sh * 0.55, 0.1, X1 - sd / 2, sh * 0.35, scz + 0.5);
  g.add(shelf.mesh());
  // small items on the shelf
  const shIt = new Merger(M(P.orange));
  shIt.box(0.3, 0.22, 0.3, X1 - 0.45, 0.28, sz0 + 0.55);
  const shIt2 = new Merger(M(P.red));
  shIt2.box(0.34, 0.26, 0.3, X1 - 0.45, 0.3, scz + 0.05);
  const shIt3 = new Merger(M(0x2c2a2c));
  shIt3.box(0.3, 0.34, 0.28, X1 - 0.45, 0.34, sz1 - 0.45);
  g.add(shIt.mesh()); g.add(shIt2.mesh()); g.add(shIt3.mesh());

  // ---------- corner cabinet (L-shaped, wraps the corner) ----------
  const cab = new Merger(M(0x8a8688));
  const ch = 2.0, cd = 1.2;
  cab.box(X1 - 3.0, ch, cd, (3.0 + X1) / 2, ch / 2, Z0 + cd / 2);            // far-wall part
  cab.box(cd, ch, -3.8 - Z0 - cd + cd, X1 - cd / 2, ch / 2, (Z0 + -3.8) / 2); // right-wall part
  g.add(cab.mesh());
  const cdet = new Merger(M(P.silver));
  const cseam = new Merger(M(0x5a5658));
  const cabX0 = 3.0;
  const nSec = 3, secW = (X1 - cabX0) / nSec;
  for (let s = 0; s < nSec; s++) {
    const sx = cabX0 + secW * (s + 0.5);
    if (s === 0) {
      cdet.box(0.5, 0.09, 0.06, sx, 0.7, Z0 + cd + 0.01);
      cdet.box(0.5, 0.09, 0.06, sx, 1.4, Z0 + cd + 0.01);
      cseam.box(secW - 0.1, 0.05, 0.04, sx, 1.05, Z0 + cd + 0.01);
    } else {
      cdet.box(0.06, 0.09, 0.5, sx - 0.18, 1.05, Z0 + cd + 0.01);
      cseam.box(0.05, ch - 0.3, 0.05, sx, ch / 2, Z0 + cd + 0.01);
    }
  }
  g.add(cdet.mesh()); g.add(cseam.mesh());
  const feet = new Merger(M(0x555154));
  feet.box(0.2, 0.18, 0.2, cabX0 + 0.3, 0.09, Z0 + cd - 0.15);
  feet.box(0.2, 0.18, 0.2, X1 - 0.35, 0.09, Z0 + cd - 0.15);
  feet.box(0.2, 0.18, 0.2, X1 - 0.35, 0.09, -3.6);
  g.add(feet.mesh());

  // plant on cabinet
  const plant = new Merger(M(P.green));
  const pot = new Merger(M(0x9a9496));
  pot.box(0.55, 0.4, 0.55, 4.6, ch + 0.2, Z0 + 0.62);
  const trunk = new Merger(M(P.woodDark));
  trunk.box(0.14, 0.5, 0.14, 4.6, ch + 0.62, Z0 + 0.62);
  const leafSpots = [[0, 0.95, 0], [0.22, 0.82, 0.1], [-0.2, 0.85, -0.08], [0.05, 1.15, 0.12], [-0.12, 1.1, -0.14], [0.18, 1.05, -0.15], [-0.2, 0.98, 0.16]];
  for (const [dx, dy, dz] of leafSpots) plant.box(0.34, 0.3, 0.34, 4.6 + dx, ch + dy, Z0 + 0.62 + dz);
  g.add(pot.mesh()); g.add(trunk.mesh()); g.add(plant.mesh());
  // small black/orange toolbox on cabinet
  const tbox = new Merger(M(P.black));
  tbox.box(0.55, 0.3, 0.32, 3.5, ch + 0.15, Z0 + 0.6);
  const tband = new Merger(M(P.orange));
  tband.box(0.57, 0.1, 0.34, 3.5, ch + 0.15, Z0 + 0.6);
  g.add(tbox.mesh()); g.add(tband.mesh());

  // ---------- pegboard (far wall) ----------
  const pb = new Merger(M(P.wood));
  const pbx0 = -4.6, pbx1 = 0.6, pby0 = 1.5, pby1 = 3.9;
  pb.box(pbx1 - pbx0 + 0.3, pby1 - pby0 + 0.3, 0.12, (pbx0 + pbx1) / 2, (pby0 + pby1) / 2, Z0 + 0.06);
  g.add(pb.mesh());
  const pbBoard = new Merger(M(0x1c1a1b));
  pbBoard.box(pbx1 - pbx0, pby1 - pby0, 0.06, (pbx0 + pbx1) / 2, (pby0 + pby1) / 2, Z0 + 0.14);
  g.add(pbBoard.mesh());

  // tools on pegboard
  const tools = new Merger(M(P.silver));
  const tRed = new Merger(M(P.red));
  const tBlue = new Merger(M(0x3b6ea5));
  const tOrange = new Merger(M(P.orange));
  const tYellow = new Merger(M(P.yellow));
  const tz = Z0 + 0.24;
  const tmid = (pby0 + pby1) / 2 + 0.25; // ~2.95
  // 1. red wrench (big, open-end)
  tools.box(0.12, 0.85, 0.08, -4.15, tmid, tz);
  tRed.box(0.3, 0.2, 0.08, -4.15, tmid + 0.47, tz);
  tRed.box(0.3, 0.2, 0.08, -4.15, tmid - 0.45, tz);
  // 2. silver wrench
  tools.box(0.12, 0.8, 0.08, -3.62, tmid, tz);
  tools.box(0.28, 0.19, 0.08, -3.62, tmid + 0.43, tz);
  tools.box(0.28, 0.19, 0.08, -3.62, tmid - 0.41, tz);
  // 3. red-handled screwdriver
  tools.box(0.09, 0.62, 0.08, -3.15, tmid - 0.05, tz);
  tRed.box(0.17, 0.36, 0.11, -3.15, tmid + 0.39, tz);
  // 4. hammer (gray head, orange handle)
  tools.box(0.1, 0.68, 0.08, -2.68, tmid - 0.05, tz);
  tOrange.box(0.11, 0.4, 0.11, -2.68, tmid + 0.35, tz);
  tools.box(0.42, 0.2, 0.12, -2.68, tmid + 0.57, tz);
  // 5. blue screwdriver
  tools.box(0.09, 0.62, 0.08, -2.25, tmid - 0.05, tz);
  tBlue.box(0.17, 0.36, 0.11, -2.25, tmid + 0.39, tz);
  // 6. red pliers
  tRed.box(0.13, 0.36, 0.09, -1.8, tmid - 0.28, tz);
  tools.box(0.09, 0.48, 0.08, -1.89, tmid + 0.17, tz);
  tools.box(0.09, 0.48, 0.08, -1.71, tmid + 0.17, tz);
  // 7. red pliers 2
  tRed.box(0.13, 0.36, 0.09, -1.35, tmid - 0.28, tz);
  tools.box(0.09, 0.48, 0.08, -1.44, tmid + 0.17, tz);
  tools.box(0.09, 0.48, 0.08, -1.26, tmid + 0.17, tz);
  // yellow blocks bottom
  tYellow.box(0.26, 0.2, 0.1, -1.9, pby0 + 0.28, tz);
  tYellow.box(0.26, 0.2, 0.1, -1.52, pby0 + 0.28, tz);
  tYellow.box(0.26, 0.2, 0.1, -1.14, pby0 + 0.28, tz);
  tools.box(0.24, 0.17, 0.1, -2.68, pby0 + 0.28, tz);
  g.add(tools.mesh()); g.add(tRed.mesh()); g.add(tBlue.mesh());
  g.add(tOrange.mesh()); g.add(tYellow.mesh());

  // ---------- workbench (far wall, under pegboard) ----------
  const bench = new Merger(M(0x777377));
  const bx0 = -6.3, bx1 = -0.3, bd = 1.5, bh = 1.25;
  bench.box(bx1 - bx0, 0.16, bd, (bx0 + bx1) / 2, bh, Z0 + bd / 2);
  g.add(bench.mesh());
  const cabR = new Merger(M(P.red));
  const handles = new Merger(M(P.silver));
  const cseam2 = new Merger(M(0x5a1616));
  const units = [[bx0 + 0.15, 1.7], [bx0 + 2.1, 1.7], [bx0 + 4.05, 1.55]];
  for (const [ux, uw] of units) {
    cabR.box(uw, bh - 0.2, bd - 0.15, ux + uw / 2, (bh - 0.2) / 2, Z0 + bd / 2);
    for (let i = 0; i < 3; i++) {
      handles.box(uw * 0.55, 0.09, 0.08, ux + uw / 2, 0.38 + i * 0.34, Z0 + bd - 0.05);
      if (i > 0) cseam2.box(uw - 0.06, 0.05, 0.05, ux + uw / 2, 0.21 + i * 0.34, Z0 + bd - 0.04);
    }
  }
  g.add(cabR.mesh()); g.add(handles.mesh()); g.add(cseam2.mesh());
  // items on bench
  const bm = new Merger(M(P.black));
  bm.box(0.55, 0.42, 0.45, bx0 + 0.55, bh + 0.21, Z0 + 0.75);
  const bmr = new Merger(M(P.red));
  bmr.box(0.57, 0.16, 0.47, bx0 + 0.55, bh + 0.13, Z0 + 0.75);
  g.add(bm.mesh()); g.add(bmr.mesh());
  const by = new Merger(M(P.yellow));
  by.box(0.3, 0.22, 0.3, bx0 + 1.35, bh + 0.11, Z0 + 0.7);
  g.add(by.mesh());
  const bt = new Merger(M(P.black));
  bt.box(0.7, 0.34, 0.42, bx1 - 0.6, bh + 0.17, Z0 + 0.75);
  const btr = new Merger(M(P.red));
  btr.box(0.72, 0.12, 0.44, bx1 - 0.6, bh + 0.1, Z0 + 0.75);
  g.add(bt.mesh()); g.add(btr.mesh());

  // ---------- engine blocks stack (left of bench, against far wall) ----------
  const eng = new Merger(M(0x8a8688));
  const engD = new Merger(M(0x5f5b5d));
  const ex = -6.95, ez = Z0 + 0.65;
  eng.box(1.35, 0.55, 1.3, ex, 0.28, ez);
  engD.box(0.9, 0.3, 0.06, ex, 0.22, ez + 0.66);
  eng.box(1.2, 0.5, 1.2, ex + 0.08, 0.8, ez - 0.04);
  engD.box(0.8, 0.26, 0.06, ex + 0.08, 0.74, ez + 0.56);
  eng.box(1.05, 0.45, 1.1, ex - 0.05, 1.27, ez + 0.03);
  g.add(eng.mesh()); g.add(engD.mesh());

  // ---------- floor props (left area) ----------
  const rtb = new Merger(M(P.red));
  rtb.box(1.35, 0.55, 0.8, -6.7, 0.28, -1.95);
  const rtl = new Merger(M(P.black));
  rtl.box(1.4, 0.22, 0.85, -6.7, 0.66, -1.95);
  rtl.box(0.5, 0.1, 0.12, -6.7, 0.8, -1.95);
  const rts = new Merger(M(P.silver));
  rts.box(0.12, 0.14, 0.05, -7.05, 0.45, -1.54);
  rts.box(0.12, 0.14, 0.05, -6.35, 0.45, -1.54);
  g.add(rtb.mesh()); g.add(rtl.mesh()); g.add(rts.mesh());
  const stl = new Merger(M(0x2c2a2c));
  stl.box(0.7, 0.45, 0.6, -7.6, 0.23, -1.25);
  stl.box(0.4, 0.2, 0.06, -7.6, 0.28, -0.94);
  g.add(stl.mesh());
  const anv = new Merger(M(0x3a383a));
  anv.box(0.55, 0.3, 0.45, -7.45, 0.15, -2.15);
  anv.box(0.3, 0.22, 0.3, -7.45, 0.4, -2.15);
  g.add(anv.mesh());
 // small scattered blocks near the mat
  const scb = new Merger(M(0x6e6868));
  scb.box(0.3, 0.2, 0.3, -7.9, 0.1, -0.6);
  scb.box(0.24, 0.16, 0.24, -5.9, 0.08, -1.1);
  g.add(scb.mesh());
  const matM = new THREE.MeshLambertMaterial({ map: matTexture() });
  const mat = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 1.4), matM);
  mat.position.set(-6.85, 0.03, -0.7);
  mat.receiveShadow = true;
  g.add(mat);

  // ---------- barrels + crate (right area, south of the pad) ----------
  function barrel(mm, mmDark, x, z, w, h) {
    mm.box(w, h, w, x, h / 2, z);
    mmDark.box(w + 0.16, 0.14, w + 0.16, x, h * 0.22, z);
    mmDark.box(w + 0.16, 0.14, w + 0.16, x, h * 0.5, z);
    mmDark.box(w + 0.16, 0.14, w + 0.16, x, h * 0.78, z);
    mmDark.box(w + 0.22, 0.16, w + 0.22, x, h - 0.06, z);
    mmDark.box(w - 0.15, 0.08, w - 0.15, x, h + 0.04, z);
  }
  const gb = new Merger(M(P.green));
  const gbd = new Merger(M(P.greenDark));
  barrel(gb, gbd, 4.95, 6.85, 0.95, 1.5);
  g.add(gb.mesh()); g.add(gbd.mesh());
  const grb = new Merger(M(0x6e6868));
  const grbd = new Merger(M(0x4e4a4c));
  barrel(grb, grbd, 2.9, 6.95, 1.05, 1.15);
  g.add(grb.mesh()); g.add(grbd.mesh());
  const cr = new Merger(M(P.wood));
  const crD = new Merger(M(P.woodDark));
  const crL = new Merger(M(P.woodLight));
  cr.box(1.15, 1.0, 1.15, 2.7, 0.5, 7.95);
  crD.box(0.85, 0.5, 0.06, 2.7, 0.42, 7.95 + 0.58);
  crD.box(0.06, 0.5, 0.85, 2.7 + 0.58, 0.42, 7.95);
  crL.box(1.2, 0.08, 1.2, 2.7, 1.02, 7.95);
  g.add(cr.mesh()); g.add(crD.mesh()); g.add(crL.mesh());

  // ---------- wall lamps ----------
  function lamp(x, y, z, ry) {
    const lm = new Merger(M(P.black));
    lm.box(0.55, 0.16, 0.4, x, y + 0.28, z, ry);
    const hood = new THREE.BoxGeometry(0.7, 0.3, 0.5);
    hood.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.5, ry, 0)).setPosition(x, y, z));
    lm.add(hood);
    g.add(lm.mesh());
    const glow = new Merger(M(0xffe9b0, { emissive: 0xffc966, emissiveIntensity: 1.2 }));
    glow.box(0.5, 0.08, 0.38, x - Math.sin(ry) * 0.1, y - 0.18, z - Math.cos(ry) * 0.1, ry);
    g.add(glow.mesh());
    const pl = new THREE.PointLight(0xffc966, 18, 11, 1.8);
    pl.position.set(x, y - 0.3, z);
    g.add(pl);
  }
  lamp(0.1, 4.6, Z0 + 0.35, 0);          // far wall, above pegboard right end
  lamp(4.8, 4.3, Z0 + 0.35, 0);          // far wall, near corner above cabinet

  // ---------- the car ----------
  const car = new THREE.Group();
  car.position.set(-0.1, 0, 2.2);
  car.rotation.y = 0.07;
  g.add(car);
  const L = 8.9, W = 3.55;
  const cw = new Merger(M(P.white));
  const cb = new Merger(M(P.black));
  const cg = new Merger(M(0x0e0e10));
  const cs = new Merger(M(P.silver));
  const cr2 = new Merger(M(P.darkRed));
  const slab = (x0, x1, y0, y1, w, mm = cw, zc = 0) => mm.box(x1 - x0, y1 - y0, w, (x0 + x1) / 2, (y0 + y1) / 2, zc);
  // ---- side view profile (nose at -X). Wheel sections have inset body. ----
  const FX = -L / 2 + 1.55, RX = L / 2 - 1.6;   // wheel centers
  // base band full length
  slab(-L / 2, L / 2, 0.28, 0.54, W);
  // wheel sections: body inset so wheels read
  slab(-L / 2, FX - 0.72, 0.54, 0.58, W * 0.8);
  slab(FX - 0.72, FX + 0.72, 0.54, 0.58, W * 0.64);
  slab(FX + 0.72, RX - 0.75, 0.54, 0.58, W);
  slab(RX - 0.75, RX + 0.75, 0.54, 0.58, W * 0.64);
  slab(RX + 0.75, L / 2, 0.54, 0.58, W * 0.88);
  // nose wedge: low tapered tip rising in steps
  slab(-L / 2 + 0.1, -L / 2 + 0.7, 0.58, 0.64, W * 0.52);
  slab(-L / 2 + 0.7, -L / 2 + 1.4, 0.58, 0.74, W * 0.64);
  slab(-L / 2 + 1.4, -L / 2 + 2.2, 0.58, 0.88, W * 0.76);
  slab(-L / 2 + 2.2, -L / 2 + 3.05, 0.58, 1.0, W * 0.88);
  // fender shoulders (low beltline)
  slab(FX + 0.72, RX - 0.75, 0.58, 0.94, W);
  slab(-L / 2 + 3.05, FX + 0.72, 0.58, 0.94, W * 0.9);
  slab(RX - 0.75, L / 2 - 0.3, 0.58, 0.96, W * 0.9);
  // ---- greenhouse: raked black glass, tapering cabin ----
  slab(-L / 2 + 3.05, -L / 2 + 3.45, 0.94, 1.12, W * 0.76, cg);
  slab(-L / 2 + 3.45, -L / 2 + 3.85, 0.94, 1.3, W * 0.7, cg);
  slab(-L / 2 + 3.85, -L / 2 + 4.25, 0.94, 1.48, W * 0.66, cg);
  slab(-L / 2 + 4.25, -L / 2 + 5.45, 0.94, 1.58, W * 0.64, cg);
  slab(-L / 2 + 5.45, -L / 2 + 6.05, 0.94, 1.32, W * 0.62, cg);
  slab(-L / 2 + 6.05, -L / 2 + 6.55, 0.94, 1.12, W * 0.56, cg);
  // white pillars connecting glass to roof
  cw.box(0.2, 0.5, 0.2, -L / 2 + 4.0, 1.36, W * 0.29);
  cw.box(0.2, 0.5, 0.2, -L / 2 + 4.0, 1.36, -W * 0.29);
  cw.box(0.22, 0.42, 0.2, -L / 2 + 5.8, 1.3, W * 0.27);
  cw.box(0.22, 0.42, 0.2, -L / 2 + 5.8, 1.3, -W * 0.27);
  // white roof, narrower than the glass
  slab(-L / 2 + 3.9, -L / 2 + 5.75, 1.58, 1.72, W * 0.48);
  // rear deck + tail
  slab(-L / 2 + 6.55, L / 2 - 0.3, 0.58, 1.0, W * 0.88);
  slab(L / 2 - 0.3, L / 2, 0.58, 0.86, W * 0.84);
  // black bumper band wrapping the nose
  cb.box(0.3, 0.2, W * 0.8, -L / 2 + 0.12, 0.42, 0);
  cb.box(0.14, 0.22, W * 0.66, -L / 2 + 0.02, 0.58, 0);
  // splitter / skirts / diffuser
  cb.box(0.5, 0.16, W * 0.82, -L / 2 + 0.22, 0.22, 0);
  cb.box(L * 0.82, 0.14, W + 0.02, 0, 0.26, 0);
  cb.box(0.45, 0.16, W * 0.76, L / 2 - 0.2, 0.22, 0);
  // headlights: angled slits on the fenders
  cs.box(0.14, 0.14, 0.56, -L / 2 - 0.02, 0.52, W * 0.24);
  cs.box(0.14, 0.14, 0.56, -L / 2 - 0.02, 0.52, -W * 0.24);
  cs.box(0.4, 0.1, 0.14, -L / 2 + 0.5, 0.66, W * 0.33);
  cs.box(0.4, 0.1, 0.14, -L / 2 + 0.5, 0.66, -W * 0.33);
  // taillights + rear panel
  cr2.box(0.1, 0.14, W * 0.56, L / 2 - 0.03, 0.74, 0);
  cb.box(0.09, 0.24, W * 0.72, L / 2 - 0.01, 0.5, 0);
  // black side intake before the rear wheel
  cb.box(0.7, 0.16, 0.08, RX - 1.15, 0.72, W / 2 - 0.02);
  cb.box(0.7, 0.16, 0.08, RX - 1.15, 0.72, -W / 2 + 0.02);
  // wheels: protrude past the inset body, silver spokes on the outer face
  const wr = 0.46, wt = 0.42;
  const wheelPos = [[FX, W / 2 + 0.04], [FX, -W / 2 - 0.04], [RX, W / 2 + 0.04], [RX, -W / 2 - 0.04]];
  for (const [wx, wz] of wheelPos) {
    const s = wz > 0 ? 1 : -1;
    cb.box(wt, wr * 2, wr * 2, wx, wr, wz);
    // spoke cross on the outer face (protruding in Z)
    cs.box(0.52, 0.2, 0.16, wx, wr, wz + s * 0.27);
    cs.box(0.2, 0.52, 0.16, wx, wr, wz + s * 0.27);
    cs.box(0.36, 0.36, 0.16, wx, wr, wz + s * 0.27);
    cb.box(0.18, 0.18, 0.12, wx, wr, wz + s * 0.32);
    // arch trim bridging body to wheel
    cb.box(1.3, 0.16, 0.22, wx, wr * 2 + 0.08, wz + s * 0.02);
    cb.box(0.16, 0.44, 0.22, wx - 0.6, wr + 0.36, wz + s * 0.02);
    cb.box(0.16, 0.44, 0.22, wx + 0.6, wr + 0.36, wz + s * 0.02);
  }
  car.add(cw.mesh(), cb.mesh(), cg.mesh(), cs.mesh(), cr2.mesh());

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(0xcfd4dc, 0x44424a, 0.85);
  g.add(hemi);
  const key = new THREE.DirectionalLight(0xfff2e0, 1.0);
  key.position.set(-6, 12, 7);
  key.target.position.set(0, 0, 1);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -14; key.shadow.camera.right = 12;
  key.shadow.camera.top = 12; key.shadow.camera.bottom = -8;
  key.shadow.camera.far = 45;
  key.shadow.bias = -0.002;
  g.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xbcd6ff, 0.4);
  fill.position.set(8, 6, 2);
  g.add(fill);

  return g;
}
