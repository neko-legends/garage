# Task — build the garage scene in Three.js (benchmark lane: kimi-k3.1-pro)

You are the builder for one arm of a model benchmark. Work **only** inside
`/home/jun/bench/kimi-k3-garage-20261023/build`.

## What to build

A single self-contained `index.html` that renders the garage in the reference photo
(`../ref.webp`) as a **Three.js** scene:

- One file, opened directly from disk. Use an import-map CDN for three.js (same convention as
  our chess bench: `https://unpkg.com/three@0.160.0/build/three.module.js` + examples).
- Model the garage as a real 3D scene: floor slab, walls, ceiling with the two strip lights,
  the roll-up door opening, shelving along the left wall, the workbench, the car on the pad,
  and the clutter that makes it read as a garage. Boxes are fine — proportions matter more
  than polygon count.
- Match the **reference's** layout and palette, not a generic garage: check the photo, and say
  in your report which features you matched and which you could not.
- Materials should read as concrete / painted metal / rubber, with a believable light setup
  (no flat ambient-only shading, no neon).
- **URL parameter `?view=front|iso|top` must position the camera** for a screenshot:
  `front` = the reference's viewpoint, `iso` = three-quarter aerial, `top` = overhead plan.
  The benchmark screenshots those three views, so this parameter is part of the deliverable.

## Requirements that are scored

1. `index.html` exists and renders without console errors.
2. `?view=front`, `?view=iso`, `?view=top` each produce a distinct, correctly-framed camera.
3. The scene contains at least: floor, 4 walls, ceiling, 2 lights, car, workbench, shelving, ≥6 props.
4. Visual match to `ref.webp` — judged by comparing your three screenshots to the photo.
5. No external assets except the three.js CDN. No textures, no models, no images.

## Do not

- Do not modify anything outside `build/`.
- Do not use Blender or any MCP tool; this arm is pure Three.js in the browser.
- Do not ship a page that needs a build step or a local server.

## Finish

Write `build/REPORT.md` and end it with the single line `status: success|blocked|failed @ <commit>`.
Report: what you built, what you matched from the photo, what you could not, and the paths of
your three screenshots if you took them.
