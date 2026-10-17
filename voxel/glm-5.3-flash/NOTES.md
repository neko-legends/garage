# Voxel garage — build notes

## What was built
A three.js scene (`garage.js`, imported from `main.js`) recreating `ref.png`: an open-topped
voxel garage diorama seen from an elevated front-left 3/4 view.

**Room**: two cinderblock walls (far wall at z=-5, right wall at x=6.89, 6.3 units tall plus a
darker cap course) meeting at a corner that projects to the upper-center of the default view,
matching the reference. Light gray mottled tile floor (canvas texture, 1-unit tiles), dark base
slab underneath, no ceiling, void background.

**Parking pad**: ~11x6.5 dark charcoal pad with a raised dark border, slightly rotated (0.07 rad)
with the car. Dashed yellow markings inset along the north/east/west edges; a solid yellow curb
segment along the south (front) edge — matching the reference's dashed/solid mix.

**Car**: white voxel wedge supercar, ~8.9 x 3.55 units, nose pointing -X (screen lower-left),
slight rotation toward the viewer. Stepped hood wedge down to a low tapered nose, raked black
glasshouse (stepped slabs) with white pillars and a narrower white roof, black side skirts /
splitter / diffuser / front intake, silver headlight slits, red taillight strip, four chunky
black wheels with silver spoke crosses protruding past inset wheel-arch body sections.

**Props**: pegboard with 7 chunky tools (red/silver wrenches, red & blue screwdrivers, hammer
with orange handle, two red pliers) plus yellow blocks; workbench with gray top over three red
drawer cabinets with silver handles; red/black machine + yellow block + black/red toolbox on
top; gray engine-block stack; red floor toolbox with black lid and silver latches; small dark
stool and anvil-ish block; black hazard mat with yellow pixel glyph (canvas texture); L-shaped
gray corner cabinet with drawer/door details, potted voxel plant and a black/orange toolbox on
top; dark shelf unit with cubbies and small items under a 4-pane blue-glass window with sill;
5-panel sectional garage door with dark jambs, lintel and black hardware; green and gray ribbed
barrels plus a wooden crate south of the pad; two black wall lamps with warm glow.

**Lighting**: hemisphere + warm key directional (1024px shadow map) + cool blue fill from the
window side + two warm point lights at the lamp fixtures.

**Performance**: all boxes are merged per material via `BufferGeometryUtils.mergeGeometries`
(~25 draw calls for props); walls/floor are textured boxes. Renders interactively in software
WebGL; the screenshot tool completes with zero console errors.

## What I checked with vision (./tools/vision)
- Inventoried `ref.png` with tile reads (2x2, 3x3) and ~15 region/zoom queries: room structure
  (two walls, open top, cap course), garage door (paneled, right wall), window (4 panes, blue
  glass, shelf below), pegboard tool list and colors, workbench + red drawers, corner cabinet +
  plant + toolbox, barrels/crate, mat, lamps (two, warm), pad markings (dashed yellow + solid
  front curb), car (white wedge, black glass, silver-spoke wheels, ~2.5:1 length:width).
- Derived the room geometry numerically: wrote a throwaway projection script (camera inverse)
  to fit wall positions to measured pixel anchors (corner seam, wall-base exits, door bottom,
  pegboard extent, pad/car bounding boxes). This moved the corner from image-x 765 to ~890 and
  resolved earlier contradictions.
- Iterated 10 screenshot comparisons (v1–v10) against the ref, plus zoomed crops of the car,
  door, window, wheels and pad edges on both images.
- Verified final render: zero console errors; object inventory confirmed by vision (car bbox,
  bench, block stack, window glass, door panels, barrels/crate).

## What I struggled with
- **Vision spatial estimates are noisy**: bounding boxes for the same object differed by up to
  60–100 px between queries, and several "missing object" claims were false (objects existed
  but were embedded inside wall boxes or too small to read). Trust had to be rationed; numeric
  projection math + tight zoom crops were more reliable than side-by-side comparisons.
- **Wall-embedded geometry**: window panes and door hardware were initially positioned inside
  the wall box volume (wall spans x 6.89–7.49) and were invisible; fixed by protruding them
  in front of the wall face.
- **The car** was the hardest object. It went through four rebuilds: (1) boxy van, (2) slab with
  hidden glass (glass boxes inside body slabs), (3) raft/barge with invisible wheels (spokes
  protruding along the wrong axis — X instead of the wheel-face normal Z), (4) current wedge
  with inset wheel sections and proud spokes. It still reads more "blocky approximation" than
  the reference's sculpted supercar; the wheels remain the weakest detail.
- **Scale discovery**: the reference car/pad are much larger relative to the room than the
  first build assumed (~9-unit car on an ~11-unit pad); the numeric fit fixed this.

## Known gaps vs the reference
- Car wheels/spokes and nose taper are simplified; the greenhouse rake is stepped rather than
  smooth.
- Wall lamps are simpler than the reference's angled-hood fixtures.
- Floor tile mottling is more uniform than the reference's varied stone tiles.
- Minor clutter density is lower than the reference in places.
