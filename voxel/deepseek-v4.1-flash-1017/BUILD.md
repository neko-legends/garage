# DeepSeek V4.1 Flash 1017 — voxel garage in three.js (pure vision, no Blender)

Built 2026-10-17, 11:07–11:34 PDT, on our four Spark servers (TensorFold, TP-4, the same engine, image and settings as
the 2026-10-16 DeepSeek run), by a pi coding agent on `sparks/auto` with DeepSeek's official 1017 checkpoint of
V4.1 Flash serving (EXL3, 2.9 bits per weight). Same prompt (byte-identical), starter, tools, forced snapshot camera
and 2 h cap as the DeepSeek, Nemotron and GLM runs. Open `index.html` through any static web server; drag to orbit.

| | |
|---|---|
| Wall time | **26 m 51 s** (2 h cap), finished on its own |
| Tokens (Spark server counters) | 9,343,526 in (9,084,976 of them prompt-cache hits) / 159,782 out, 113 requests |
| of which the agent | 9,299,841 in / 142,218 out over 74 turns |
| of which the vision harness | 43,685 in / 17,564 out over 39 model calls (26 harness runs) |
| Tool calls | 73: bash 67, write 5, read 1. Two errors (Python one-liners importing modules that are not installed), each worked around on the next call |
| Screenshots of its own page | 13 |
| Page | `main.js` (633 lines) and `voxel.js` (110 lines), zero console errors, renders in about 2.1 s in software WebGL |

**Token cross-check:** the server counted 113 requests. That is exactly 74 agent turns + 39 vision calls, so no
other traffic is mixed into the counters. pi's own per-request usage reads zero on this route (the stream returns no
usage block), so the agent's share is the server total minus the harness's own log.

## What it did
- Inventoried `ref.png` with the vision harness (2×2 and 3×3 tile reads, then region questions for the pegboard,
  cabinets and window, door, car, floor markings and barrels).
- Measured the reference's wall silhouette with a pixel scan and solved for the wall height and extents that best
  reproduce it under the fixed camera.
- Wrote a small box-merging helper (`voxel.js`: per-vertex colours, two merged meshes, one lit and one emissive) and
  the whole scene in `main.js`. The car is generated from a 0.1-unit occupancy grid, keeping only surface voxels.
  The 10-minute snapshot is still a blank page; the 20-minute one already shows the whole room.
- Then iterated 8 side-by-side screenshot comparisons. Fixes from that loop: the garage door was buried inside the
  right wall, the car pointed straight at the camera (rotated to a 3/4 view), the wheels were hidden in the body,
  the bench was split in two, the pad was too large, and the lighting was flat.

## What it struggled with (its own notes, `NOTES.md`)
- The reference was rendered with a closer camera than the fixed one, so no room size reproduces its silhouette;
  it matched the wall tops and accepted a larger floor share.
- The vision model was confidently wrong about the room's geometry more than once (it put the garage door on the
  back wall), so it switched to measuring pixels.
- It spent most of its time on the camera fit, so the pegboard tools and the door are simpler than the reference.

Files: `final.png` (default view), `final-close.png` (its own close-up), `NOTES.md` (its notes), `voxel.js` and
`main.js` (the scene), `lib/` (three.js r180, MIT, unchanged from the starter).
