# Garage benchmark report

Built `index.html`: a direct-from-disk Three.js cutaway garage with jointed concrete floor and cinder-block walls, a sectional roll-up door and blue window, a faceted white coupe on a dark service pad, left-wall workbench/tool board and red drawer cabinets, rear storage, two warm wall sconces plus two ceiling strip fixtures, and garage clutter (plant, radio, barrels, crate, tires, tool case, bottles and drain).

## Reference match

Matched the gray block/tile palette, white wedge car on a yellow-marked dark pad, left workbench and hanging tools, red storage drawers, rear cabinet with plant/radio, blue window, right-hand roll-up door, warm wall lights, and green/gray barrels with wooden crate. The roof/front/right wall are opened as a dollhouse cutaway so the screenshot cameras can see inside.

Could not reproduce every small tool, the exact car body surfacing, or every hazard-stripe/detail placement. The ceiling panel and strip fixtures exist but are hidden in the three cutaway views; the two photo-visible warm sconces provide the visible wall-light match.

## Views and verification

- `?view=front`: reference-like elevated three-quarter view.
- `?view=iso`: higher three-quarter aerial view.
- `?view=top`: orthographic overhead plan.
- No build step, server, textures, models, images, or external assets other than the Three.js CDN.
- The handoff named no acceptance command, so the acceptance command is the direct-file Chromium three-view loop recorded in the worker report.

Wall time so far: approximately 10 minutes. The first browser attempt timed out; adding software WebGL and a browser screenshot timeout resolved it. Initial custom car-hull shading was too dark, so explicit white body panels were added.

Final acceptance: all three direct-file Chromium screenshots returned exit code 0, produced valid 1536×864 PNGs, had three distinct hashes, and emitted no page JavaScript errors in the filtered browser logs.

check: direct-file Chromium loop for `front`, `iso`, and `top` → `front: PASS`, `iso: PASS`, `top: PASS`, `camera outputs: PASS (3 distinct PNG hashes)`, `deliverables: PASS (index.html and REPORT.md only)`

status: success @ none
