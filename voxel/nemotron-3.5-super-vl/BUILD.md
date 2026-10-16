# Nemotron 3.5 Super VL — voxel garage in three.js (pure vision, no Blender)

Built 2026-10-16, 11:18–11:42 PDT, on our four Spark servers (TensorFold, TP-4), by a pi coding agent on
`sparks/auto` with Nemotron 3.5 Super VL (120B-A12B, NVFP4) serving. Open `index.html` through any static web
server; drag to orbit.

| | |
|---|---|
| Wall time | **23 m 31 s** (2 h cap), finished on its own |
| Tokens (Spark server counters) | 6,730,788 in (6,468,042 of them prompt-cache hits) / 114,521 out |
| of which the agent (pi usage) | 6,632,440 in (6,467,657 cache reads) / 100,579 out over 57 turns |
| of which the vision harness | 98,348 in / 13,942 out over 55 model calls (25 harness runs) |
| Tool calls | 60: bash 36, edit 14, read 6, write 4. Five errors, all malformed `edit` calls (missing fields, or text that didn't match), each retried |
| Screenshots of its own page | 18 |
| Page | 234 lines of `main.js`, zero console errors |

**Token cross-check:** pi's usage plus the harness log equals the server's counters to the token, both in
(6,632,440 + 98,348 = 6,730,788) and out (100,579 + 13,942 = 114,521).

## What it did
- Read `ref.png` with the vision harness, then built it in one large write: tiled floor and cinder-block walls as
  InstancedMesh, pegboard and tools, workbench with three red drawers, window, roll-up door, two lamps, car, pad,
  barrels, crate, mat.
- Checked the result with close-up screenshots (`--cam`) of the car, the door, the pegboard and the window, more
  than whole-frame reads.

## What it struggled with
- **The long black bar across the picture is a bug.** Four window-pane calls pass three size arguments where
  `box()` takes four (`box(0.7,0.5,SKYBLUE, …)`). The colour constant became the depth: a pane about 10 million
  units long, coloured by the x position. Its own vision read described "a thick long black beam crossing
  diagonally", and the builder listed that as a risk. It didn't trace it back to the code, so the window panes are
  missing too.
- Its first version had the pegboard, window, lamps and door hidden inside the walls (same depth as the wall
  blocks), and the door the same grey as the wall. It found both through close-ups and fixed them.
- Its early cars read as "abstract blocks", so it redesigned the car (lower chassis, sloped hood, cabin, rims).
  In the final view the car is still hard to read.
- Five of its 14 `edit` calls were malformed.

Files: `final.png` (default view), `final-close.png` (its own close-up), `NOTES.md` (its notes), `lib/` (three.js
r180, MIT, unchanged from the starter).
