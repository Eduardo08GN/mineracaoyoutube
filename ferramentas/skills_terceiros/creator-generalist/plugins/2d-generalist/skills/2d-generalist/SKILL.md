---
name: 2d-generalist
description: "Design, animate, texture, and composite Vox, Johnny Harris, and WSJ style editorial explainer motion graphics across 2D, 2.5D, and 3D using installed free tools (Blender, DaVinci Resolve Fusion, Remotion + Three.js/SVG, FFmpeg) or optional open-source GIS/vector tools. Use when asked to \"create a Vox style video\", \"Vox map or chart animation\", \"2D/3D editorial motion graphics\", \"newspaper highlight and torn paper collage\", \"2d generalist\", or \"2D motion graphics\"."
license: MIT
---

# 2D Generalist

Use this skill to design, animate, texture, and composite editorial motion graphics in the style of **Vox** (*Atlas*, *By Design*, *Earworm*, *Missing Chapter*) and **Flat Pack FX** across **2D, 2.5D, and 3D** using tools already installed on the user's machine (or recommending free tools when missing).

Before building a look, pick the named technique instead of brute force: the 3D skill's `references/technique-atlas.md` (symptom to technique, numbers, recipe across 2D, 3D, editing and sound) and `references/depth-parallax-and-atmosphere.md` (parallax speeds, haze maths for layers). Machine paths (Krita, OpenToonz): `local.md` next to this file when it exists.

## Mode Routing

| Mode | Scope (2D / 2.5D / 3D) | Primary Reference |
| --- | --- | --- |
| `script` | Title, hook, explainer structure, voice pace, beat table, captions | [`references/explainer-script.md`](references/explainer-script.md) |
| `qa` | Render gate on the preview and final: measured checks plus contact sheet | [`references/qa-and-gates.md`](references/qa-and-gates.md) |
| `audit` | Check installed free 2D/3D tools vs optional downloads | [`references/2d-3d-toolchain-matrix.md`](references/2d-3d-toolchain-matrix.md) |
| `design` | Visual hierarchy, asymmetric scale, Blueprint Aesthetic, palettes | [`references/vox-psychology-and-design.md`](references/vox-psychology-and-design.md) |
| `map` | 2D vector/satellite maps, 2.5D embossed/extruded layers, 3D terrain and GeoJSON routes (convert KML with `ogr2ogr`) | [`references/maps-and-geodata-2d-3d.md`](references/maps-and-geodata-2d-3d.md) |
| `chart-timeline` | Pre-drawn ruler timelines, 2D/3D bar/line graphs, dot-matrix repeaters, waveforms | [`references/charts-timelines-and-data.md`](references/charts-timelines-and-data.md) |
| `vox-now` | The current Vox explainer look, measured: footage-led, 60-75% empty frames, still holds, hard cuts every 1.5-3 s, 3 inks, lemon line-box highlight. Read first when asked to "look like Vox" | [`references/vox-modern-measured.md`](references/vox-modern-measured.md) |
| `photos` | Find real photos, scans, cut-outs and documents online, pick from a numbered sheet, rework into the piece's look, credits | [`references/real-images.md`](references/real-images.md) |
| `archival-collage` | Dual highlighters, newspaper push, 2.5D parallax; torn borders, flicker and slide projector as stylised options (not seen in measured Vox) | [`references/archival-collage-and-camera.md`](references/archival-collage-and-camera.md); highlighters and torn borders in [`references/vox-psychology-and-design.md`](references/vox-psychology-and-design.md) §3 and §6 |
| `thumbnail` | Vector thumbnails in Inkscape, brand logos as sticker outlines with soft shadows | [`references/inkscape-thumbnails-and-logos.md`](references/inkscape-thumbnails-and-logos.md) |
| `texture-look` | Grain, paper, halftone, dither, CRT, VHS, colour misregistration, engraving, boil, flat shading, stacked shadows and glows, colour split | [`references/textures-retro-and-shading.md`](references/textures-retro-and-shading.md) |
| `fx-type` | Goo, smoke, fire, liquid, rain, loops, infinite zoom, kaleidoscopes, mattes, transitions, kinetic type, graphics into footage | [`references/2d-fx-type-and-compositing.md`](references/2d-fx-type-and-compositing.md); drawn FX blended into 3D shots: the 3D skill's `references/hybrid-2d-3d-fx.md` |

**Before step 1, run the intent brief** (`references/intent-brief.md`): fill purpose, format, subject, look and constraints from the request, ask only about what is missing (at most 4 questions, options with a recommended default), write `brief.md`, show a cheap preview before the first expensive step, and check the result against the brief before delivery. A piece that misses the user's goal is a failed piece.

## End-to-End Workflow

0. **Script and beats (`script`)**
   - Write `script.md` (sources at the top) and `beats.md` per `references/explainer-script.md` before any frame.
1. **Audit Toolchain (`audit`)**
   - Run `uv run --no-project python scripts/check_vox_toolchain.py` to detect installed 2D/3D tools (**Blender**, **DaVinci Resolve / Fusion**, **Remotion + Three.js/SVG**, **FFmpeg**) and list 1-line free install commands (`winget`) for any missing optional tools (**QGIS**, **Inkscape**, **Krita**).
2. **Establish Hierarchy & Surface (`design`)**
   - Apply **Asymmetric Scale Tension** (one dominant anchor, generous off-white `#F4F1EA` or blueprint slate `#1B222C` negative space, connecting path). Perform the *Look-Away / Look-Back Test* before animating.
   - Build the **3 Pillars of Visual Authority**: **Surface** (warm paper fibers + static grain), **Ink** (`Multiply` / `Color Burn` bleed + luma matte + roughen edges + `0.5–1.5px` softness), and **Life** (`Posterize Time` at `8–12 fps` for graphical elements or `2–4 fps` background texture boil; a `texture-look` or `fx-type` recipe may set its own rate, and camera moves are never posterized).
3. **Generate Procedural Assets (`scripts/generate_vox_assets.py`)**
   - Run `uv run --no-project python scripts/generate_vox_assets.py` to generate SVG filter definitions (dual-pass torn paper borders, ink bleed, crossed 45° halftone luma mattes, paper grain) and proportional ruler timeline layouts.
4. **Build Scene in Chosen 2D / 2.5D / 3D Engine (`map`, `chart-timeline`, `archival-collage`)**
   - **Code / Web 2D & 3D:** Remotion + SVG filters (`<feTurbulence>` + `<feDisplacementMap>`) + Three.js / React Three Fiber (`35mm` camera, DOF, Z-planes).
   - **Node Compositor 2D & 2.5D:** DaVinci Resolve Fusion (`FastNoise` + `Displace`, `sRender` repeaters, `Paint` trim strokes, `ImagePlane3D` + `Camera3D`).
   - **Full 3D & 2D-in-3D:** Blender 5.2 (Grease Pencil strokes with `Noise`/`Build` modifiers, Geometry Nodes proportional timelines/bar charts, 3D displaced terrain maps, Cycles/EEVEE `35mm` Depth of Field + Compositor lens/grain pass).
5. **Apply Finishing Pass & Validate (`scripts/validate_vox_recipe.py`)**
   - Add subtle 35mm Depth of Field (or feathered adjustment-layer focus mask), radial Chromatic Aberration, Vignette, static grain, a light unsharp pass and Posterize Time cadence.
   - Run `uv run --no-project python scripts/validate_vox_recipe.py --spec <recipe.json>` to verify compliance with all Vox visual laws.

For any step done in Blender (geometry nodes, shaders, rigging, weight paint, NLA, bpy), load the `use-3d-software` skill for the exact nodes and current 5.x names. For the edit, captions, retime, transitions, grade and export in any editor (Resolve, CapCut, Premiere, Kdenlive, FFmpeg), load `edit-video`. For SFX, music and the mix, load `design-sound`: every visible stroke, pop and wipe gets its own sound at its frame.
Craft skills for single steps: `draw-and-paint-art` (drawing, figures, painting in Krita), `paint-stylized-backgrounds` (backgrounds, paint-over, parallax, moving foliage and water), `animate-characters` (character motion, frame by frame, cut-out) and `rig-characters` (cut-out puppets).

6. **Render gate before any preview (`qa`)**
   - Run `uv run --no-project --with numpy python scripts/check_render.py <preview.mp4>` and look at its contact sheet
     per `references/qa-and-gates.md`. Send the 540p preview with sound only when both pass; full render after approval.

## Core Vox Visual Laws (Non-Negotiable)

- **Real Pictures, Never Redrawn:** every real-world thing on screen (vehicle, person, place, product, document, logo) is a real photo or scan found online with `scripts/fetch_images.py`, never redrawn from SVG shapes. Measured Vox (2018-2026) shows archival photos as plain black-and-white scans; `scripts/rework_image.py` duotone, halftone and torn edges are a stylised option, not the Vox look. Draw only arrows, rulers, charts and ideas with no picture, and name the search when nothing was found ([`references/real-images.md`](references/real-images.md)).
- **Flat Paper, Real Documents:** graphic cards are flat near-white with no grain (measured `#F9F9F6`, `#F9F8EB`, `#F1ECE6`; grey bed `#D1D1D1`); pure white only for real web pages and documents. Dark maps use deep desaturated slate or navy.
- **Print Borders, Not Torn:** a cut-out photo gets a thin straight white print border of a few pixels, a 2-8 degree tilt and a faint shadow. No torn edge was seen in six measured Vox videos; the two-pass torn border in `vox-psychology-and-design.md` §3 is a stylised option only.
- **No Added Halftone:** halftone appears only inside scanned newspaper photos, as part of the source. Do not lay a halftone or duotone over photos for a Vox look (§4 of `vox-psychology-and-design.md` is a stylised option).
- **Pre-Drawn Ruler Timeline Law:** Never space unequal time intervals evenly. Draw an evenly spaced ruler/tick scale first, then place events at their true proportional coordinates so clusters and gaps tell the story.
- **Dual Highlighter Law:**
  - *Digital/Screen Text:* Clean `#FFE600` stroke (the one exception to No Stiff Repeats wobble), `Multiply` blend mode, stroke height **shorter than letter cap-height** (~75–85%), non-highlighted text dimmed to `~30%` opacity.
  - *Archival/Book Page:* 3-pass roughened edges (horizontal marker streaks + border + rough edge) + `Bulge` turbulent displacement, placed in 3D space with a `35mm` camera and shallow Depth of Field tracking the line.
- **No Stiff Repeats:** hand-made wobble on every shape (2 to 4 fps boil, Roughen Edges, slight rotation), no two
  neighbouring elements with the same size, angle and timing: stagger entrances by 2 to 6 frames, vary scale
  ±10%, and hide any repeating pattern with a large-scale noise or paper variation.
- **Camera Speed Graph:** All 2D/3D camera pans and zooms must use a `35mm` focal length equivalent, Null controller parenting, and a **Continuous Bezier** bell-curve speed graph (slow ease-in -> fast snap -> slow settle), never linear keyframes. An infinite zoom is the one exception: exponential scale, so the zoom speed looks constant.

## Scripts & References

- Toolchain audit: [`scripts/check_vox_toolchain.py`](scripts/check_vox_toolchain.py)
- Asset & SVG filter generator: [`scripts/generate_vox_assets.py`](scripts/generate_vox_assets.py)
- Recipe validator: [`scripts/validate_vox_recipe.py`](scripts/validate_vox_recipe.py)
- Unit tests: [`scripts/test_vox_skill.py`](scripts/test_vox_skill.py)
