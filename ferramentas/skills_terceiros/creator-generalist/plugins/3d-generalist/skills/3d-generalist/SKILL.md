---
name: 3d-generalist
description: "'Full-pipeline 3D generalist studio for content creators: source and kitbash scanned CC0/CC BY assets (Poly Haven, ambientCG, Sketchfab, BlenderKit), build or rig characters (HumanGen, Mixamo, Quaternius UAL, low-poly), dress worlds and perspective cutaways, animate expressive character acting with grounded foot/hand IK and slapstick timing, light and shoot with eye-tracked cameras, Depth of Field and 180-degree motion blur, sync narration and foley to ±0.05 s, and pass automated anti-slop QA gates across Blender, Three.js and 67js. Use when asked to create 3D Shorts, explainers, storytelling animations, cutaway builds, 3D worlds, or character animations (\"3d generalist\", \"3D shorts\", \"cutaway 3D\").'"
license: MIT
---

# 3D Generalist

Act as a complete 3D creative studio for content creators. Turn a story, an engineering premise, a historical case or an
everyday problem into human-crafted, anti-slop 3D content across **Blender**, **Three.js** and **67js**: vertical Shorts,
cutaway build films, 3D storytelling videos, interactive scenes and hero renders.

Paths use `{{WORK_DIR}}` for the project folder and `{{SKILL_DIR}}` for this skill's folder.

## Choose the mode and load only the references it needs

| Mode | What it makes | Read first |
|---|---|---|
| `cutaway` | A 60 s 3D perspective cutaway Short where one simple thing is built piece by piece through problem-and-fix rounds | `references/shorts-storytelling.md`, `references/worlds-and-cutaways.md`, `references/acting-and-motion.md`, `references/qa-and-gates.md` |
| `story` | A character-driven 3D storytelling Short or scene (kitbashed set, expressive face/head acting, slapstick beats, tracked camera) | `references/assets-and-kitbash.md`, `references/characters-and-rigs.md`, `references/acting-and-motion.md`, `references/camera-and-lighting.md` |
| `world` | A rich 3D environment or diorama with period details, scanned PBR materials, grass, water, fire and ambient life | `references/assets-and-kitbash.md`, `references/worlds-and-cutaways.md`, `references/camera-and-lighting.md`; shown as render, then clay model, then render: `references/clay-reveal.md` |
| `character` | A rigged 3D character (realistic worker, HumanGen or retro low-poly from a 2D reference) with retargeted clips, foot grounding and arm IK | `references/characters-and-rigs.md`, `references/acting-and-motion.md`, `../model-characters/SKILL.md` (when modeling from 2D art) |
| `asset` | A hero 3D model, kitbashed prop or reference-matched PBR material exported to GLB | `references/assets-and-kitbash.md` |

For any step done in Blender (geometry nodes, shaders, rigging, weight paint, NLA, bpy), load the `use-3d-software` skill for the exact nodes and current 5.x names. For the edit, captions, grade and export in any editor (Resolve, CapCut, Premiere, Kdenlive, FFmpeg), load `edit-video`.
Craft skills for single steps: `animate-characters` (keys, timing, cycles, acting in 2D and 3D), `rig-characters` (bones, weights, IK/FK, face rigs, engine export), `sculpt-models` (organic forms, creatures, rocks, terrain, retopo and bake), `draw-and-paint-art` (turnarounds, style frames, painted textures) and `paint-stylized-backgrounds` (backdrops, paint-over, parallax).
**Before building a look, pick the technique, not brute force:** `references/technique-atlas.md` maps a symptom (flat, CG, boxy, stiff, muddy) to the named pro technique, its numbers and its recipe; depth maths in `references/depth-parallax-and-atmosphere.md`. Machine paths (Krita, OpenToonz, Blender): `local.md` next to this file when it exists.

**Before step 1, run the intent brief** (`references/intent-brief.md`): fill purpose, format, subject, look and constraints from the request, ask only about what is missing (at most 4 questions, options with a recommended default), write `brief.md`, show a cheap preview before the first expensive step, and check the result against the brief before delivery. A piece that misses the user's goal is a failed piece.

## Order of work for every 3D video

Do these steps in order. Do not start a step before the one above it is written down.

1. **Story script (`script.md`):** write the hook (0 to 3 s, picture already moving), the middle rounds (5 to 7 pairs of
   `But <visible failure> -> So <one fix built in place>`, each opening a new question), a flip where the problem helps,
   a final stress test, and the closer. List verified factual sources at the top. See `references/shorts-storytelling.md`.
2. **Voice and visual scripts:** split `script.md` into exact spoken lines and a per-beat visual table (sourced 3D models,
   character actions, 3D leader-line part labels, camera framing and SFX cues).
3. **Source and kitbash assets first:** pull real CC0 / CC BY scans and models (Poly Haven, ambientCG, Sketchfab,
   BlenderKit, Quaternius) before modelling anything from primitives. Fit every mesh on its real vertex bounds
   (`Box3.setFromObject(model, true)`), scale the world to the character, and record credits in `CREDITS.md`. See
   `references/assets-and-kitbash.md`.
4. **Build the world and cutaway:** stage one continuous set with a real place and period, dressed across foreground,
   midground and background with moving ambient life (trees swaying, birds, water caustics, passing vehicles). Use an
   object-driven shader or double-sided section plane for cutaways. See `references/worlds-and-cutaways.md`.
5. **Animate character acting and physics:** drive the character by baked specs or pose-to-pose IK. Lead turns with the
   head (`looks` 4 to 6 frames ahead), stagger joint stops so all bones never freeze on one frame, add anticipation and
   slapstick reaction beats on failures, and bake rigid-body physics (Rapier / Blender) so every frame is a pure
   function of time `f(t)`. See `references/acting-and-motion.md`.
6. **Camera, lighting and finish pass:** keep under 1 hard cut per 10 s on cutaway builds, space camera keys at least
   5 to 8 frames apart, keep a soft fill light tracking the character's spine inside dark interiors, lock Depth of Field
   on the active subject, and finish with 6-subframe 180-degree shutter motion blur, bloom, vignette and grain. See
   `references/camera-and-lighting.md`.
   Drawn 2D effects on a 3D shot (explosions, smoke, impacts, speed lines, smears): `references/hybrid-2d-3d-fx.md`.
7. **Voice, captions and foley:** generate steady narration, trim tail silences over 0.12 s, align one-word centred
   captions within ±0.05 s of spoken audio, and layer soft real SFX for every visible event at -14 LUFS.
8. **Run the QA gate before any preview:** run all 10 gates in `references/qa-and-gates.md`.
   `scripts/check_contact_and_slip.mjs` covers teleport, speed, flight, foot slip and contact gap only. Grip, clearance,
   exits, chips and caption sync need the project's own checks. Inspect contact sheets (`scripts/contact-sheet.sh`), and fix every
   flag before showing the user. See `references/qa-and-gates.md`.

## Hard anti-slop rules

- **Nothing floats, ever:** every foot, knee, stone, prop and structure sits within 1 to 2 cm of the real mesh surface
  under it, with visible support in day or night shots.
- **No event without a visible cause:** doors, levers, buckets, fires and blocks move only when a hand or physical force
  touches them. Hands sit within 3 cm of the gripped surface with low, natural elbows.
- **No teleporting or foot skating:** characters walk every move at stride speed (under 1.8 m/s) through real openings,
  pivot on the balls of the feet, and end walks at walls or seats with feet together.
- **Detail by the cheapest method that reads:** model only what the camera reads as a silhouette. Gravel, grass
  fields, brick, tiles, dirt and far crowds come from a scanned PBR set, displacement, scattered instances or
  alpha cards, never thousands of modelled pieces. Ladder and examples:
  `references/assets-and-kitbash.md`, "Detail ladder".
- **Nothing boxy, nothing repeated:** bevel edges, break silhouettes, jitter every copy (scale, rotation, tint),
  hide texture tiling, stagger and vary every group motion. Rules:
  `references/assets-and-kitbash.md`, "Variation and imperfection".
- **Clean enters and exits:** nothing pops on or vanishes in 1 frame. Every prop, flow arrow and 3D leader-line label
  animates in and animates out the way it came, and everything from an old beat leaves when the beat ends.
