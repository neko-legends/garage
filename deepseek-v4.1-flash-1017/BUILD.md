# DeepSeek V4.1 Flash 1017 — build record

Model: `sparks/auto` → DeepSeek's official 1017 checkpoint of V4.1 Flash (EXL3, 2.9 bits per weight) on our own four
Spark servers (TensorFold, TP-4, the same engine, image and settings as the 2026-10-16 DeepSeek runs), driven by a pi
worker. Eyes: the same vision harness, pointed at the same model.

Run solo on 2026-10-17 with the byte-identical builder prompt, the same `ref.png`, the same tools (Blender 5.2 over
MCP, its own fresh empty Blender instance; the vision harness; bash/read/write/edit), the same 2 h 30 min cap and the
same setup as the Nemotron solo rerun and the GLM run, including pi's `images.blockImages` (it sees only through the
harness).

| | |
|---|---|
| Start → end (PDT) | 11:38:08.03 → 12:12:51.69 |
| Wall time | **34 min 44 s**, finished (exit 0, report) |
| Spark server counters (delta) | 17,431,569 prompt (17,152,688 prompt-cache hits) / 261,141 generated, 144 requests |
| of which the agent | 17,390,029 in / 245,339 out over 106 turns |
| of which the vision harness | 30 invocations → 38 model calls, 41,540 + 15,802 tokens |
| Tool calls | 116: bash 53, mcp 33, write 25, read 3, edit 2 |
| MCP tool calls / errors | 32 × `execute_blender_code` (+1 connect) / **1** |
| Other tool errors | 0 |
| Built through | MCP throughout (`build.py` plus small patch scripts in its own folder, run in the live Blender) |
| Scene | one merged `Garage` mesh (6,408 vertices, 9,612 triangles, 45 materials), 1 orthographic camera, 10 lights |

**Token cross-check:** the server counted 144 requests, exactly 106 agent turns + 38 vision calls, so nothing else
was mixed in, and the agent's share is the server total minus the harness's own log. pi's own usage reads zero on this
route (the stream carries no usage block).

**One turn ran out of output budget.** About 4 minutes in, one turn reasoned for 8 minutes and stopped at pi's
output cap without a tool call. The worker wrapper resumed the same session once (its standard auto-continue), and
the build went on. Both the lost turn and the resume count in the totals above.

## What it did
- Inventoried `ref.png` with the harness (a whole-image description, 2×2 tiles, then five region crops and car and
  pad questions), then measured the reference numerically inside Blender's Python. Gradient-orientation histograms
  of the floor grid gave the camera's elevation (32°) and azimuth (49°), and the wall corner position fixed its target.
- Wrote one procedural, re-runnable `build.py` (bmesh boxes, one mesh, materials by slot): brick walls in running
  bond, pegboard with tools, workbench with red drawers, cabinets, plant, window, cubby shelf, sectional door,
  sconces, the pad with dashed yellow markings, barrels, crate, mat and toolboxes. The car is built from 0.17 m
  slices driven by height and width profiles.
- Matched exposure with a small auto-tune pass (render vs reference brightness percentiles), then iterated
  side-by-side comparisons and 200–250 % crops of the car, bench and door.

## What it struggled with (its own notes, confirmed by the render)
- Its vision gave contradictory room geometry (one wall vs two, the corner at x≈600 vs x≈1170), so it stopped asking
  vision for geometry and measured pixels instead.
- Exposure: the first render was about twice too bright, the second about twice too dark, until the auto-tune.
- The first car read as a pickup; the profile rebuild fixed the silhouette, but the roofline is still visibly stepped.
- The sconce area is brighter than the reference's, and the barrels sit further left than in the reference.
