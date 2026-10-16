# garage
threejs image to voxel 3d bench

![Race timelapse: DeepSeek V4.1 Flash (left) vs Nemotron 3.5 Super VL (right), race clock](timelapse/side-by-side.gif)

*Race timelapse, both builders started together (2026-10-16, 01:59 PDT). DeepSeek finished at 23:01. Nemotron crashed at
22:54. MP4: [`timelapse/side-by-side.mp4`](timelapse/side-by-side.mp4). Nemotron's solo rerun next to DeepSeek, each on
its own clock: [`timelapse/side-by-side-rerun.gif`](timelapse/side-by-side-rerun.gif).*

## The bake-off

Two vision-capable models each built the garage in `ref.webp` as a voxel-style Blender scene:

- **DeepSeek V4.1 Flash**, served by Venice
- **Nemotron 3.5 Super VL**, NVIDIA's 120B-A12B NVFP4 model on our own Spark servers

Each builder was a coding agent (a pi worker) with the same tools: a Blender MCP server, the same vision harness, and
bash/read/write/edit. The harness was pointed at the builder's **own** model, so each one saw the reference with its own
eyes. Venice lists DeepSeek V4.1 Flash with `supportsVision: true`, and an image probe through the harness answered
correctly, so no substitute vision model was involved.

Both builders also got:
- the identical prompt and reference;
- a 2 h 30 min cap;
- a fresh, empty, headless Blender each, on its own port. Isolation was proven before the start: a test object created by
  each builder through its own MCP config was visible only in its own Blender.

They ran **at the same time**, as Jun asked, so we'd know who finishes first. This doubles as a tool-use benchmark, so
tool calls are recorded too.

| Reference | DeepSeek V4.1 Flash | Nemotron 3.5 Super VL (solo rerun) |
|---|---|---|
| ![ref](ref.webp) | ![DeepSeek](deepseek-v4.1-flash/render-34.png) | ![Nemotron](nemotron-3.5-super-vl/render-34.png) |

Each builder's own 3/4 render is shown. Front and top views, the `.blend`, the GLB and a build record are in
[`deepseek-v4.1-flash/`](deepseek-v4.1-flash/BUILD.md) and [`nemotron-3.5-super-vl/`](nemotron-3.5-super-vl/BUILD.md).
Nemotron's crashed race build is in [`nemotron-3.5-super-vl/race-attempt/`](nemotron-3.5-super-vl/race-attempt/).

## Results

| Model | Run | Wall time | Tokens in | Tokens out | Tool calls | MCP calls / errors | Other tool errors | Vision harness | Finished? |
|---|---|---|---|---|---|---|---|---|---|
| DeepSeek V4.1 Flash | race | **23 m 01 s** | 12.43 M (12.30 M cached) | 125.4 k | 87 | 25 / 2 | 1 | 18 runs, 22 model calls | **yes, the race's only finisher** |
| Nemotron 3.5 Super VL | race | 22 m 54 s | 7.50 M (7.29 M cached) | 99.0 k | 66 | 5 / 4 | 4 | 0 (looked in the wrong folder) | **no, crashed** (server rejected a 9-image request; the limit is 8) |
| Nemotron 3.5 Super VL | solo rerun¹ | **15 m 54 s** | 7.29 M (7.09 M cached) | 57.4 k | 76 | 21 / 8 | 3 | 14 runs, 40 model calls | yes |

- **Tokens** are pi's per-request usage. "In" includes cache reads. Vision-harness tokens are separate: DeepSeek
  40.4 k in / 12.5 k out, Nemotron rerun 72.4 k / 9.3 k. For the rerun, the Spark server's own token counters moved by
  exactly pi + harness (+7.37 M prompt, +66.7 k generated), which cross-checks the numbers.
- **Wall time** is the builder's process lifetime, from its start to its exit.
- **¹ The rerun.** Nemotron's race run died because pi kept pasting its renders into the chat context and hit the
  server's 8-image-per-request limit. The rerun is the same task, alone, after the race, with **one labelled change**:
  pi's `images.blockImages` was on, so Nemotron could see images only through the vision harness. That is how DeepSeek
  worked all along, because pi treats DeepSeek V4.1 Flash as text-only. It is not a race result.
- **Time cap and memory.** Neither builder came near the 2.5 h cap. Free memory stayed above 12.8 GB throughout,
  logged every 2 minutes.

### Tool use, in short
- **DeepSeek** stayed on the Blender MCP the whole time: it wrote a `build.py` and executed it through
  `execute_blender_code`, with 2 errors, each fixed on the next call. It used the vision harness for an inventory, then
  for zoomed crops of single regions. It also solved its camera against 8 landmarks measured off the reference.
- **Nemotron, race:** it looked for the vision harness in the wrong folder, decided the harness didn't exist, and looked
  at renders by pasting them into its context instead. After 4 MCP errors in a row it abandoned the MCP and ran its own
  headless Blender subprocess (10 times). The 9th pasted image crashed it.
- **Nemotron, rerun:** MCP throughout, with 8 errors, mostly Blender 5.2 API drift. It used the vision harness 14 times,
  but its own vision misread voxel objects (the car as a "bed") and called small crops "completely black", so it avoided
  crops.

## Zoomed referee pass

This follows the `zoomed-referee-pass` method and Kai's recreation rubric. Six regions of `ref.webp` were cropped and
compared, at 2× zoom, with the same regions of each builder's 3/4 render. Each region was scored 0–5 on six dimensions:
elements, counts, layout, colour, style and detail at zoom.

- **Judge:** a neutral third model, GPT-6 Astra, which is neither contestant.
- **Blinding:** each pair was judged twice, with the reference shown first in one run and second in the other (seed
  20261016). Where the two runs disagreed, the lower score was kept.
- **Files:** the crop boxes are in [`referee/regions.json`](referee/regions.json) and the raw verdicts in
  [`referee/results.jsonl`](referee/results.jsonl).

| Region (each /30) | DeepSeek | Nemotron (rerun) |
|---|---|---|
| Pegboard + workbench | **15** | 4 |
| Cabinet, plant, lamps | **17** | 5 |
| Window + roll-up door | 7 | **8** |
| Car on its pad | **15** | 8 |
| Barrels + crate | **11** | 9 |
| Lower-left props + mat | **14** | 10 |
| **Total (/180)** | **79** | **44** |

Under Kai's pass rule, **neither garage counts as "recreated"**: every region still has missing elements or wrong counts.

**Judgement.** DeepSeek V4.1 Flash built the better garage, and it isn't close. It matched the reference's camera,
palette and layout: brick walls, a pegboard with readable tools, red drawer units, the cabinet with its plant, two warm
lamps, a striped parking pad, barrels and a crate. It won five of the six zoomed regions. Its weak spots are real:
- the car reads as a blocky wedge or pickup rather than the sleek coupe;
- the window renders as an opaque panel and the roll-up door as a hinged door;
- the lighting is flatter than the reference.

Nemotron 3.5 Super VL was faster and cheaper once it got going: its solo rerun took 15 m 54 s on 7.3 M / 57 k tokens,
against DeepSeek's 23 m 01 s on 12.4 M / 125 k. But it lost the actual race by crashing at 22 m 54 s. Its finished rerun
names most of the right objects, yet delivers a pale, low-contrast, near-frontal view: checkerboard walls instead of
brick, a car whose wheels stand up off the body, a pegboard that can't be seen from its own 3/4 camera, and no visible
lamps. On this task DeepSeek's vision was the more useful pair of eyes. It drove targeted crop checks that changed the
build. Nemotron's own reads mislabelled voxel objects, so it relied on coordinates instead of looking.

## Combined scene
[`combined/`](combined/) has a Blender scene and renders with both garages side by side on one ground plane, with
floating labels. It also has a small three.js viewer, [`combined/index.html`](combined/index.html), which loads both GLBs
side by side with the same labels. Serve the repo over http (e.g. `npx serve .`) and open `/combined/`; there's a
screenshot in `combined/viewer-screenshot.png`.

![combined](combined/combined-34.png)

## Timelapse
The orchestrator, not the builders, snapshotted each scene every 10 minutes from t=0 (the empty scene) plus a final frame.
It rendered a copy of each scene from one fixed camera in Workbench, so the builders' time and tokens stayed clean.
- Frames: `timelapse/<model>/frame-NNN-<minutes>m.png`.
- GIFs: one per model, plus the side-by-side ones.
- [`timelapse/NOTES.md`](timelapse/NOTES.md) covers the details, including why Nemotron's race frames at 10 and 20 min
  show only its MCP scene.
