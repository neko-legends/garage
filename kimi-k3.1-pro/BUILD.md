# Kimi K3.1 Pro — three.js garage (2026-10-23)

A third brief, run after the voxel and Blender tests. **Not scored by the referee and not comparable to the /180
totals**: this arm built one self-contained `index.html` (three.js from a CDN, no textures, no models, no Blender, no
voxelising) and was asked for three fixed cameras instead of being free to choose its own view.

| | |
|---|---|
| Model | `kimi-coding/k3.1-pro` (Kimi's subscription lane, via pi) |
| Brief | `TASK.md` in this folder, verbatim |
| Wall time | **9 m 12 s** (systemd unit clock: "Consumed 13 min 4.014 s CPU time over 9 min 12.076 s wall clock time") |
| Tool calls | 27 — 12 bash, 9 read, 3 write, 3 edit |
| Tokens | 39,423 in / 20,585 out |
| Turns | 24 assistant messages, 27 tool results |
| Self-inspection | 6 screenshots viewed by the builder before it declared done |
| Screenshots | `front.png`, `iso.png`, `top.png` (1536×864, software WebGL) |
| Deliverable | `index.html`, 17,940 bytes, one file |

## What it built

A cutaway garage diorama — the reference is a cutaway too, so this is the faithful choice, not an invention — with
a tiled floor, brick/cinder-block walls, a sectional roll-up door and blue window, a faceted **white** coupe angled
diagonally on a black hazard-striped pad, a left-wall workbench and pegboard with red drawer cabinets, a back-wall
cabinet with plant and radio, two warm wall sconces, two ceiling strip fixtures (built, hidden in these three
views), and clutter: barrels, crate, tyres, tool case, bottles, drain.

Its own summary of the match is in `REPORT.md`, unedited.

## Verification done here, not by the builder

- Screenshots re-taken by the orchestrator with its own harness (`shoot.mjs`, 1536×864), not taken on the builder's
  word — the builder had deleted its own check images before finishing.
- `?view=front|iso|top` produce three distinct images (three distinct file hashes).
- **Console errors: 6**, all the same warning: `THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN`.
  The builder's own filtered check reported none. Located: two malformed hull geometries inside the car group
  (`white wedge sports car`) — 26 NaN floats, and one of the two has a position array whose length is not a multiple
  of 3 (20 floats). The scene still renders; the car reads correctly in all three views. This is the difference
  between "produced" and "finished": it shipped, and one geometry is quietly broken.
- Structural match checked against the reference on four literal questions (two walls visible; no ceiling in this
  view; car angled ~45° to the walls, nose to the front-left; tiled floor). **All four agree** — the composition is
  the reference's own framing, not a stylised reinterpretation. Car colour: white in both.
- Colour-histogram overlap with the reference (8³ RGB bins, the voxel test's metric): front 0.444, iso 0.402, top 0.457
  — against 0.760 (DeepSeek previous), 0.489 (DeepSeek 1017), 0.534 (Nemotron) recomputed the same way. Read this as
  a rough colour-distribution signal only: in the voxel test the same metric ranks the highest-scoring build lowest,
  so it is not a fidelity score.

## Caveats

- One build, one run, no referee. The verdict that it reads as *that* garage is an orchestrator judgement from the
  three screenshots, not a scored comparison.
- The brief was written for this arm alone; it is shorter than the voxel and Blender prompt files, so wall time is
  not a like-for-like speed comparison either.
- The vision route used for the checks above is `skills/vision-analysis/scripts/analyze.sh`. `eva_analyze_image` was
  not usable on 2026-10-23: asked to read a plain red 600×400 image with white "HELLO 1234" text it answered "white
  background, the quick brown fox…", and it resolved the "auto" image slot to a DeepSeek text model. Every visual
  claim in this file comes from `analyze.sh`, and it read a control image correctly before being used.

## Reproduce

```bash
cd /home/jun/bench/kimi-k3-garage-20261023     # staged box: ref.webp, TASK.md, shoot.mjs
node shoot.mjs build shots                     # 1536×864, prints console errors
```
