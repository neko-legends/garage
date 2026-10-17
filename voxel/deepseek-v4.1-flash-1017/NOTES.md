# Voxel garage — build notes

## What I built

A three.js scene of a voxel-styled garage, built entirely from boxes (no models, no
downloaded assets, no network). Everything is merged into **two** draw calls:

- `voxel.js` — a small `Builder` that accumulates `BoxGeometry` instances with per-vertex
  colours and merges them with `BufferGeometryUtils.mergeGeometries`. Two builders are used:
  `B` (lit, `MeshLambertMaterial`) and `E` (unlit/emissive, `MeshBasicMaterial` for the lamp
  glow and the window sky).
- `main.js` — the scene: ground, two brick walls, pegboard + tools, workbench, cabinets,
  window, bench, wall lamps, garage door, parking platform with hazard curb, barrels, crate,
  crate stacks, tool chests, and the car.

### Layout (world units, floor top at y = 0, +Y up)

- Garage floor 10 × 8 (x −5…5, z −4…4), centred on the origin.
- Back wall at z = −4, right wall at x = +5, both 4.5 units tall, built from real brick
  boxes in running bond with a darker cap course. Both walls run well past the garage floor
  (back wall x −13…5.2, right wall z −4.2…14) so they reach the frame edges like the
  reference.
- Back wall, left → right: pegboard with 8 tools (red/grey wrenches, screwdriver, hammer,
  chisel, two pliers, level, tape measure) over a workbench with a continuous red three-drawer
  run; grey cabinet with drawers + doors, a potted plant and a yellow/black box on top; a
  four-pane window with a blue sky and blocky clouds; a low bench with open shelves under it.
  Two black wall sconces with warm glowing undersides.
- Right wall: an 8-panel sectional garage door with black hinges, a handle and a small
  window, in a dark frame.
- Floor: a raised dark parking platform with a bevelled lip, a black curb with alternating
  yellow hazard dashes along its −X and +Z edges, a yellow wheel stop, and a black plate with
  a yellow pixel glyph outside the platform.
- Props: green + grey ribbed barrels, a slatted wooden crate, a stack of dark crates against
  the right wall, a red tool chest and a grey crate stack at the left end of the back wall.
- The car: a voxel sports car generated from a 0.1-unit occupancy grid (a shape function for
  the wedge body + greenhouse, wheel arches cut out, then only surface voxels are emitted).
  Black glass greenhouse with white roof and pillars, black lower fascia / skirts / bumpers,
  red taillights, white headlights, black grille, lip spoiler, diffuser fins, mirrors, and
  four voxel wheels with light multi-spoke rims. Rotated −155° so it reads as a 3/4 view
  pointing to the bottom-left, like the reference.

### Lighting

Hemisphere fill + a warm key directional with a 1024² shadow map + a cool fill from the left
(so the garage door on the right wall is readable) + two warm point lights at the sconces +
a cool point light spilling from the window. ACES tone mapping.

## What I checked with vision

- Inventoried `ref.png` with a 2×2 and a 3×3 tile read, then asked targeted region questions
  for the pegboard/workbench, the cabinets/window/bench, the garage door, the car, the floor
  markings and the barrels/crate.
- Measured the reference's wall silhouette numerically: scanned each image column for the
  first non-background pixel. The reference's wall top edge runs (0,161) → (480,2) on the
  left and (1088,10) → (1504,151) on the right. I then solved for the wall height and
  positions that reproduce that silhouette with the fixed camera, which is how the wall
  height (4.5) and the wall extents were chosen.
- Iterated 8 screenshots, comparing each against the reference side by side (composited with
  `magick +append`) and asking for the biggest differences. Fixes driven by that loop:
  - the ground plane was too small, so its far edge showed as a false "wall top" — replaced
    with a bounded slab that ends at the walls;
  - the garage door was buried inside the right wall's brick volume (the wall's inner face is
    at `RX1 − WALL_T`, not `RX1`) — moved it out;
  - the car was pointing straight at the camera, so it read as a stubby van — rotated it to
    −155°;
  - the car's wheels were hidden inside the body shell — widened the track and pushed the
    rims proud of the bodywork;
  - the workbench was two separate stations — merged into one continuous run;
  - the parking mat was too large and flat — shrunk and raised it into a platform;
  - lighting was flat and too bright — dropped the hemisphere light, raised the key and the
    lamp point lights, darkened the brick palette.

## What I struggled with

- **The reference camera is not the fixed camera.** I fitted the reference's wall silhouette
  against the fixed camera analytically and no room size reproduces it exactly: the reference's
  wall/floor junction sits around y ≈ 700 while the fixed camera can only push it to ≈ 580 at
  the frame edges, and the reference's wall-top slopes (±0.33) are steeper than this camera
  produces (±0.19 / +0.27). The reference was clearly rendered with a closer, more symmetric
  camera. I matched the wall-top silhouette as closely as the fixed camera allows and accepted
  that my floor occupies more of the frame than the reference's.
- **Reading the reference through a vision model.** The model was confident and wrong about
  the room's geometry more than once (it claimed the back wall's floor line was horizontal and
  that the garage door was on the back wall). Pixel-level scans of the reference were much
  more reliable than asking about geometry, so I switched to measuring.
- **Voxel budget vs. software WebGL.** The car alone is ~3.5k surface voxels. Emitting only
  surface voxels (checking the 6 neighbours) kept the whole scene at a few thousand boxes and
  the page renders in ~2 s headless, well inside the 5 s budget.
- **Time.** I spent too long on the camera/geometry fit and had little left for detail passes
  on the pegboard tools and the garage door mechanism, which are still simpler than the
  reference's.
