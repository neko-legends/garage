# Nemotron 3.5 Super VL — build record

Model: `sparks/auto` → NVIDIA Nemotron 3.5 Super VL (120B-A12B, NVFP4) on our own Spark servers, driven by a pi worker.
Eyes: the same vision harness, pointed at Nemotron itself.

There are **two Nemotron builds**:

1. **The race (crashed).** It ran simultaneously with DeepSeek and died at 22 min 54 s, 7 s before DeepSeek finished. Its
   files are in [`race-attempt/`](race-attempt/).
2. **A solo rerun (finished).** This is the garage in this folder. It used the same prompt, reference, tools, empty
   Blender scene and time cap, with **one labelled change**: pi's `images.blockImages` was on, so images were never
   pasted into the model's chat context. Nemotron could still see everything through `./tools/vision` (the vision
   harness), which is exactly how DeepSeek saw: pi treats DeepSeek V4.1 Flash as text-only, so it never had in-context
   images either. Run alone, after the race.

| | Race attempt | Solo rerun |
|---|---|---|
| Start → end (PDT) | 01:59:34.55 → 02:22:28.47 | 02:26:56.43 → 02:42:50.04 |
| Wall time | 22 min 54 s, **crashed** (exit 1) | **15 min 54 s**, finished (exit 0, report) |
| Tokens in / out (pi usage) | 7.50 M (203,932 + 7,291,877 cache-read) / 98,991 | 7.29 M (208,158 + 7,085,658 cache-read) / 57,410 |
| Spark server counters (delta) | +7.67 M prompt / +152 k generated (whole race window) | +7.37 M prompt / +66.7 k generated (= pi + vision exactly) |
| Vision harness | 0 calls (see below) | 14 invocations → 40 model calls, 72,395 + 9,281 tokens |
| Tool calls | 66: bash 33, read 14, mcp 7, write 6, edit 6 | 76: bash 29, mcp 24, write 11, edit 10, read 2 |
| MCP tool calls / errors | 5 / **4** | 21 (20 × `execute_blender_code`, 1 × `get_objects_summary`) / **8** |
| Other tool errors | 4 | 3 |
| Built through | MCP for ~10 min, then its own headless Blender subprocess (10 runs of `blender -b --python build.py`) | MCP throughout |

## What happened in the race
- It looked for the vision harness at the wrong path (the parent directory rather than its own `./tools/`), concluded it
  was missing (its own listing showed it was there), and never used it. Instead it looked at its renders by `read`ing the
  PNGs straight into its context (Nemotron accepts images in pi).
- After 4 MCP errors in a row (one malformed tool-call JSON, three Python tracebacks) it stopped using the Blender MCP and
  wrote and ran a `build.py` in its own headless Blender subprocess. That is allowed by the prompt, but it is a
  tool-usage finding.
- At 22 min 54 s pi sent a request with **9 images** in the context. The Spark server rejects more than 8 images per
  request (`HTTP 400: 9 images in one request: at most 8`), and the worker died.
- Result: a grey blockout with the 3/4 camera behind a wall (see `race-attempt/`).

## What it struggled with in the rerun (its own notes, confirmed by the renders)
- Blender 5.2 API drift (`use_ssr` no longer exists, a missing default world, bmesh face indexing), which accounts for
  most of the 8 MCP errors. Failed stages left duplicate objects that it later found and removed.
- Its own vision misread voxel objects (car → "bed", workbench → "nightstand") and called small crops "completely black",
  so it avoided crops and leaned on tiled reads plus object positions queried from Blender.
- Result: the right inventory (car on a striped mat, pegboard and bench, cabinets, window, door, barrels, crate, mats,
  lamps), but a pale, low-contrast, near-frontal room. The car's wheels stand up off the body, and the walls are a grey
  checker rather than brick.
