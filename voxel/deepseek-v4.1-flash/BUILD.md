# DeepSeek V4.1 Flash — voxel garage in three.js (pure vision, no Blender)

Built 2026-10-16, 10:54–11:11 PDT, on our four Spark servers (TensorFold, TP-4), by a pi coding agent on
`sparks/auto` with DeepSeek V4.1 Flash serving. Open `index.html` through any static web server; drag to orbit.

| | |
|---|---|
| Wall time | **16 m 39 s** (2 h cap), finished on its own |
| Tokens (Spark server counters) | 6,576,789 in (6,362,576 of them prompt-cache hits) / 92,606 out, 158 requests |
| of which the agent | 6,483,919 in / 58,015 out over 74 turns |
| of which the vision harness | 92,870 in / 34,591 out over 84 model calls (51 harness runs) |
| Tool calls | 87: bash 65, edit 15, read 4, write 3. One error (a Python one-liner the agent wrote), fixed on the next call |
| Screenshots of its own page | 18 |
| Page | 419 lines of `main.js`, zero console errors, renders in about 2.7 s in software WebGL |

**Token cross-check:** the server counted 158 requests. That is exactly 74 agent turns + 84 vision calls, so no
other traffic is mixed into the counters. pi's own per-request usage reads zero on this route (the stream returns no
usage block), so the agent's share is the server total minus the harness's own log.

## What it did
- Inventoried `ref.png` with the vision harness: 2×2 and 3×3 tile reads, then region reads of each wall, the car
  and the floor.
- Built the whole room in about 10 minutes: brick walls, tiled floor, pad with yellow markings, a white car,
  pegboard and tools, red drawer units, cabinet and plant, window, roll-up door, lamps, barrels and crates. Floor
  and walls are merged geometry; the props are individual boxes.
- Then compared its screenshots with the reference: side-by-side montages, then 200–250 % crops of the car and the
  pegboard (the zoomed check the prompt asks for).

## What it struggled with (its own notes, `NOTES.md`)
- Its vision reads were inconsistent. More than once it said the car or the door was missing when both were
  there, so it switched to tight region crops.
- The car is built from large panels, not the reference's small cubes, so its surfaces are smoother.
- The fixed camera left the garage small, so it scaled the whole room by 1.22. The floor is then about 12 × 10
  units instead of the asked-for ~10 × 8. The camera itself is untouched.

Files: `final.png` (default view), `final-close.png` (its own close-up), `NOTES.md` (its notes), `lib/` (three.js
r180, MIT, unchanged from the starter).
