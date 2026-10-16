# Timelapse notes

- Frames are taken by the orchestrator, not the builders. A copy of each builder's live Blender scene is saved and
  rendered in a separate Blender with one fixed orthographic camera (the same camera for every builder) in Workbench at
  960×540. The camera never enters the builder's own scene.
- Clock: `t+` is elapsed time since that builder's start. The two race builders started 0.49 s apart, so in
  `side-by-side.gif` both are on the race clock.
- **Nemotron race frames 1–2 (10 and 20 min)** show its live MCP scene only. At ~10 min Nemotron switched to running its
  own headless Blender subprocess and saving `out/garage.blend`, so its MCP scene stopped changing. From 02:22 on, the
  snapshotter uses whichever of the MCP scene or the builder's saved `.blend` changed since the previous frame (logged
  per frame). Nemotron's final race frame (23 min) is its saved `.blend`.
- The race ended at 23 min for both: DeepSeek finished (23:02), and Nemotron crashed at 22:55 (see the README).
  `nemotron-3.5-super-vl-rerun/` is Nemotron's labelled solo rerun.
