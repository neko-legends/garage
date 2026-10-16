# DeepSeek V4.1 Flash — build record

| | |
|---|---|
| Model | `venice/deepseek-v4-1-flash` (Venice), driven by a pi worker |
| Eyes | the same vision harness, pointed at DeepSeek V4.1 Flash itself (pi treats this model as text-only, so `./tools/vision` was its only way to see images) |
| Start → finish | 2026-10-16 01:59:34.17 → 02:22:35.02 PDT (systemd unit times; simultaneous race with Nemotron) |
| Wall time | **23 min 01 s** (cap 2 h 30 min). The only finisher of the race: Nemotron crashed 7 s earlier. Exit 0 with a report |
| Tokens (pi usage) | **12.43 M in** (136,914 uncached + 12,295,936 cache-read) / **125,361 out** |
| Vision harness | 18 invocations → 22 model calls, 40,376 prompt + 12,529 completion tokens (not included in the line above) |
| Tool calls | **87**: bash 46, mcp 26 (25 × `execute_blender_code` + 1 connect), write 9, edit 4, read 2 |
| MCP errors | **2** (Python tracebacks from `execute_blender_code`, both fixed on the next call) |
| Other tool errors | 1 (an `edit` whose old text did not match) |
| Scene | 1,158 boxes baked into 30 objects / 30 materials, 10.2 × 8.5 m room, camera + 5 lights |

## How it worked
It wrote `build.py` (boxes collected per material, baked to one mesh per material with bmesh) and ran it inside the live
Blender through MCP (`exec(open(...).read())`). It also re-ran it after every fix. It spent its vision budget well: a
tiled inventory of the reference, then targeted crops (wall layout, cabinet height, lower-left props, car). For the
camera it went further than eyeballing and solved a pinhole fit against 8 landmarks measured off the reference. Then it
used that camera inverted to place props where they land in the reference.

## What it struggled with (its own notes, confirmed by the renders)
- **The car**: right mass, orientation and colours, but at render scale it reads as a blocky wedge more than a coupe;
  its own vision called it "a machine" and "a pickup" on separate passes.
- **The roll-up door** sits ~40 px lower than in the reference (one fitted camera could not match the back wall and a
  floor-reaching door at once).
- **Lighting** is brighter and flatter than the reference's warm lamp pools.
- Vision localisation was noisy (the same lamp reported at two different x ranges), so it cross-checked positions
  against pixel measurements with ImageMagick.
