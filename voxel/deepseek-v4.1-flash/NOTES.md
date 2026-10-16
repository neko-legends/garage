# Voxel garage — build notes

## What I built
A three.js voxel-styled corner garage matching `ref.png`: two brick walls meeting at the
back corner, a tiled floor, a black parking pad with yellow hazard markings, and a white
low-slung sports car parked diagonally on it. Around the room: a framed pegboard with
tools, a workbench with red drawer cabinets, a tall cabinet with a plant, a 4-pane blue
window, a slatted roll-up garage door with hinges/handle, two warm wall lamps, hanging
lights, stacked crates, toolboxes, a rolling cart, tires, barrels, wooden crates, a
checkered mat, and a yellow/black curb.

Everything is boxes / cylinders / InstancedMesh-free merged geometry. No external assets,
no textures — all colour comes from `MeshLambertMaterial`. The floor and walls are merged
geometry; the rest are individual boxes.

## How I worked
- Inventoried `ref.png` with `./tools/vision` (2x2 and 3x3 tile reads, plus targeted
  region reads for the left wall, right wall, car, and floor).
- Built the scene, then iterated with `./tools/shot` + `./tools/vision` side-by-side
  montages (`magick ref.png shot.png +append`) and region crops.
- Ran a zoomed referee pass (200–250% crops of car and pegboard) to fix fine detail.

## What I checked with vision
- Car profile: confirmed it reads as a low, raked sports car (not a van/SUV) after
  lowering the body and raking the windshield.
- Garage door: confirmed light slats, dark gaps, hinges and handle read correctly.
- Window: confirmed 4-pane blue glass with white frame.
- Pegboard/tools, workbench, cabinets, mat, barrels/crates: region-checked.
- Final default view and close-up: no console errors, renders in ~2.7 s.

## What I struggled with
- The vision model is inconsistent (it repeatedly claimed the car/door were "missing"
  when they were present), so I verified with tight region crops rather than trusting
  whole-frame verdicts.
- Matching the reference's fine voxel granularity: the ref builds the car from many small
  cubes; mine uses larger panels, so the surface is smoother than the ref.
- Framing: the fixed camera left the garage small, so I scaled the root group 1.22x to
  fill the frame while keeping the floor top at y=0 and the garage centred.
