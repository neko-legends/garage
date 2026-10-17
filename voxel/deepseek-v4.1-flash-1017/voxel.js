// Small voxel/box building helpers: everything is merged into a couple of
// big BufferGeometries so the scene stays cheap in software WebGL.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';

// deterministic pseudo-random so screenshots are reproducible
let _seed = 20261017;
export function rnd() {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
export function rrange(a, b) { return a + (b - a) * rnd(); }

export class Builder {
  constructor() {
    this.geos = [];
    this.m = null;      // optional transform matrix applied to every box
    this.count = 0;
  }
  setTransform(m) { this.m = m; return this; }
  clearTransform() { this.m = null; return this; }

  // centre + size
  box(cx, cy, cz, w, h, d, color, jit = 0.05) {
    if (w <= 0 || h <= 0 || d <= 0) return this;
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(cx, cy, cz);
    if (this.m) g.applyMatrix4(this.m);
    const c = new THREE.Color(color);
    if (jit) {
      const f = 1 + (rnd() - 0.5) * jit;
      c.multiplyScalar(f);
    }
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    this.geos.push(g);
    this.count++;
    return this;
  }

  // min/max corners
  mm(x0, y0, z0, x1, y1, z1, color, jit = 0.05) {
    return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2,
      Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color, jit);
  }

  // cube of side s centred at (x,y,z)
  vox(x, y, z, s, color, jit = 0.05) { return this.box(x, y, z, s, s, s, color, jit); }

  mesh(material) {
    if (!this.geos.length) return null;
    const g = mergeGeometries(this.geos, false);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}

// ---------------------------------------------------------------- textures
export function tileTexture({ size = 256, tiles = 4, base = '#8b8681', grout = '#5f5a56', variance = 0.10 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, size, size);
  const tp = size / tiles;
  const b = new THREE.Color(base);
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const f = 1 + (rnd() - 0.5) * variance * 2;
      const col = b.clone().multiplyScalar(f);
      ctx.fillStyle = '#' + col.getHexString();
      ctx.fillRect(x * tp + 1.5, y * tp + 1.5, tp - 3, tp - 3);
      // faint speckle
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let s = 0; s < 6; s++) {
        ctx.fillRect(x * tp + 2 + rnd() * (tp - 6), y * tp + 2 + rnd() * (tp - 6), 2, 2);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function noiseTexture({ size = 128, base = '#6e6862', variance = 0.12 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const b = new THREE.Color(base);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const f = 1 + (rnd() - 0.5) * variance * 2;
    img.data[i * 4] = Math.min(255, b.r * 255 * f);
    img.data[i * 4 + 1] = Math.min(255, b.g * 255 * f);
    img.data[i * 4 + 2] = Math.min(255, b.b * 255 * f);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
