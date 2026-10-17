# GLM-5.3-Flash (FP4) — voxel garage in three.js (pure vision, no Blender)

Built 2026-10-17, 03:23–04:46 PDT, on our four Spark servers (vLLM, tensor-parallel over 4, NVIDIA's
GLM-5.3-Flash-FP4 checkpoint), by a pi coding agent on `sparks/auto` with GLM-5.3-Flash serving. Same prompt
(byte-identical), starter, tools, forced snapshot camera and 2 h cap as the DeepSeek and Nemotron runs of 2026-10-16.
Open `index.html` through any static web server; drag to orbit.

| | |
|---|---|
| Wall time | **82 m 31 s** (2 h cap), finished on its own |
| Tokens (Spark server counters, whole window) | 14,626,738 in (14,336,643 of them prompt-cache hits) / 290,019 out, 224 requests |
| of which the vision harness | 169,226 in / 43,769 out over 76 model calls (55 harness runs) |
| of which the agent | about 14.46 M in / 0.246 M out over 81 turns (server total minus harness; see below) |
| Tool calls | 81: bash 62, edit 12, write 4, read 3. Three errors (Python one-liners the agent wrote), each fixed on the next call |
| Screenshots of its own page | 11 |
| Page | `main.js` (starter + 2 lines) and `garage.js` (596 lines), zero console errors |

**Token cross-check:** the server counted 224 requests; the builder accounts for 157 of them (81 agent turns + 76
vision calls). The other 67 came from other jobs that used the same server between minutes 10 and 40 of the run
(short API-parity and greedy-token probes, a few vision probes); they were small, so they are well under 1 % of the
token totals above. pi's own per-request usage reads zero on this route (the stream carries no usage block), so the
agent's share is the server total minus the harness's own log, which slightly over-counts it by those probes.

## What it did
- Spent the first ~35 minutes inventorying `ref.png` with the vision harness (tile reads plus ~15 region and zoom
  questions) and fitting the room numerically: it wrote a small camera-inverse script to place the walls, corner and
  pad from measured pixel anchors. The model reasons at length before every step, so turns are slow.
- Wrote the whole scene (`garage.js`, ~590 lines) in one go at about 36 minutes and hooked it into `main.js` at about
  45 minutes (so the 40-minute snapshot is still the empty page), then iterated 10 screenshot comparisons against the
  reference, with zoomed crops of the car, door, window, wheels and pad edges.

## What it struggled with (its own notes, `NOTES.md`)
- Vision crops of the reference read as "entirely black" at first. Crops made with `magick -crop` keep a page offset,
  and the harness then crops relative to the virtual canvas; it worked around this by re-encoding crops as JPEG.
- Vision bounding boxes for the same object moved by 60–100 px between questions, and some "missing object" claims
  were false (window panes and door hardware were initially hidden inside the wall boxes).
- The car's wheels and spokes are its weakest part.

Files: `final.png` (default view), `final-close.png` (its own close-up), `NOTES.md` (its notes), `garage.js` (the
scene), `lib/` (three.js r180, MIT, unchanged from the starter).
