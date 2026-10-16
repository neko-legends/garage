# Voxel Garage — Build Notes

## What I built
A three.js (r180) voxel/blocky garage scene in `main.js`, recreating `ref.png` (an elevated 3/4 view of a voxel garage) using only boxes, InstancedMesh, merged-style instancing, canvas-free materials, and lights. No external models, textures, or network assets.

### Scene layout (world units, +Y up, floor top at y=0, garage centred at origin)
- **Floor**: 10 (X) × 8 (Z) light-grey tiled floor, 1×1 tiles.
- **Back wall (Z = -4)**: 0.5 m cinder blocks, 4 high. Holds:
  - Pegboard (dark brown) on the left portion with 7 hanging voxel tools (hammer, wrench, screwdriver, pliers in red/silver/yellow/blue).
  - Workbench below the pegboard with grey top/body and 3 red drawers with silver handles.
  - Window (4 panes, light-blue glass, black frame) on the right portion, with a blue sky panel behind it and a grey shelf below.
  - Two warm wall sconces (point lights) above the pegboard and window.
- **Right wall (X = 5)**: cinder blocks with a large light-grey garage door featuring darker horizontal panels and a black latch.
- **Car**: white voxel sports car (chassis, sloped hood, cabin, roof, black windshield/side windows, 4 black wheels with white rims, red side detail, black front bumper), angled toward the viewer, sitting on the black parking mat.
- **Parking pad**: black mat under the car with yellow/black diagonal hazard stripes along the edges and a solid yellow line.
- **Props**: red/black toolbox on the floor left of the workbench; stack of 4 grey blocks far left; grey cabinet with red drawers, toolbox and plant against the back wall; green and grey barrels plus a brown crate on the right; black mat with yellow logo in the bottom-left corner.

### Lighting
Ambient + a warm directional light (shadow-casting) + a fill point light + two warm sconce point lights. `renderer.shadowMap.enabled` with `PCFSoftShadowMap`.

### Files
- `index.html` — unchanged (importmap to local `lib/`).
- `main.js` — the garage build between the marked lines; default camera left untouched.
- `out/final.png` — default view screenshot.
- `out/final-close.png` — close-up of the car (side/front).
- `lib/` — three.js r180 + OrbitControls + BufferGeometryUtils (unchanged).

## What I checked with `./tools/vision`
- **Default view (`out/final.png`)**: tiled 3×2 read confirmed the two-wall corner garage, the car on the central black mat with yellow markers, the back wall (window + shelf), the right wall (door), and the right-side barrels/crate. Lighting is even and nothing is lost in shadow.
- **Car close-up**: confirmed it reads as a white sports car with black windows and white-rimmed wheels.
- **Pegboard close-up**: confirmed the dark brown pegboard is mounted on the back wall (left portion) with the workbench below.
- **Garage door close-up**: confirmed a large light-grey door with darker horizontal panels, distinct from the wall.

## What I struggled with
- **Wall-mounted objects were occluded**: the pegboard, window frame, sconces and door were initially placed *behind* the wall's front face (the wall blocks span to the floor edge, so anything at the same Z was hidden by the wall). Fixed by shifting all wall-mounted objects ~0.1–0.2 units toward the camera so they sit in front of the wall surface.
- **Door blended into the wall**: the door panel used the same grey as the wall, making it invisible. Fixed by giving the door a distinctly lighter grey with darker horizontal panels.
- **Vision tool noise**: the `./tools/vision` read is inconsistent on small voxel details (individual tools, rim colours), so I verified the hero elements (car, door, pegboard, window) with dedicated close-up camera angles rather than relying on full-frame reads.
- **Car readability**: early car designs were read as "abstract blocks"; redesigning with a lower chassis, sloped hood, distinct cabin/roof, visible wheels with white rims, and facing the camera made it read as a car.

## Risks / remaining
- Individual pegboard tools are small and may not resolve clearly at the default view distance; they are present as voxel boxes on the board.
- The scene is lit for the default camera; close-up angles (`?cam=...`) are available for inspection but the default view is the canonical one.
- Software WebGL performance: uses InstancedMesh for floor tiles and wall blocks (~450 instances total) to keep the render well under 5 s.
