// Starter: an empty three.js scene. Build the garage here (or in more modules imported from here).
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

// ---- your garage goes below this line ----
import { buildGarage } from './garage.js';
buildGarage(scene);
// ---- your garage goes above this line ----

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.__scene = scene;
