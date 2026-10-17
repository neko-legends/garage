# GLM-5.3-Flash (FP4) — build record

Model: `sparks/auto` → GLM-5.3-Flash on our own four Spark servers (vLLM, tensor-parallel over 4, NVIDIA's
GLM-5.3-Flash-FP4 checkpoint), driven by a pi worker. Eyes: the same vision harness, pointed at GLM itself.

Run solo on 2026-10-17 with the byte-identical builder prompt, the same `ref.png`, the same tools (Blender 5.2 over
MCP, its own fresh empty Blender instance; the vision harness; bash/read/write/edit), the same 2 h 30 min cap and the
same setup as the Nemotron solo rerun, including pi's `images.blockImages` (it sees only through the harness).

| | |
|---|---|
| Start → end (PDT) | 05:00:43.33 → 05:48:32.03 |
| Wall time | **47 min 49 s**, finished (exit 0, report) |
| Spark server counters (delta) | 17,546,472 prompt (17,355,456 prompt-cache hits) / 152,983 generated, 149 requests |
| of which the agent | 17,471,140 in / 133,904 out over 115 turns |
| of which the vision harness | 30 invocations → 34 model calls, 75,332 + 19,079 tokens |
| Tool calls | 114: bash 60, mcp 44, edit 6, write 3, read 1 |
| MCP tool calls / errors | 43 × `execute_blender_code` (+1 connect) / **1** |
| Other tool errors | 1 |
| Built through | MCP throughout (a helper module `gb_lib.py` in its own folder, imported into the live Blender) |

**Token cross-check:** the server counted 149 requests, exactly 115 agent turns + 34 vision calls, so nothing else
was mixed in, and the agent's share is the server total minus the harness's own log. pi's own usage reads zero on this
route (the stream carries no usage block).

## What it did
- Inventoried `ref.png` with the harness (2×2 tiles plus four targeted questions), then wrote one helper module
  that turns box lists into one merged mesh per material, and built the room stage by stage through MCP: walls with
  running-bond bricks, window and door with real openings, pegboard with 8 tools, workbench with red drawers,
  cabinet, plant, lamps, the pad with yellow markings, the car, barrels, crate, mat, blocks and toolboxes.
- Result: 66 objects, ~11k triangles, three cameras and four lights.

## What it struggled with (its own notes, confirmed by the renders)
- Its own vision reads of fine detail were unreliable (the car has "no wheels" three times, a crop "entirely black"),
  so it cross-checked load-bearing claims by sampling render pixels at projected object positions.
- It first wrote hex colours as linear RGB, so everything rendered too bright; fixed by decoding sRGB.
- The first 3/4 camera sat outside the left wall. The car took four iterations and is still chunkier than the
  reference's smooth wedge.
