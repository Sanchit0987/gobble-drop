# AGENTS.md — Gobble Drop

Guidance for agents and contributors working in this folder.

## What this is

Gobble Drop is an original, complete browser puzzle game inspired by rope-cutting
physics puzzlers. A golden honeydrop candy hangs from Verlet ropes; the player
swipes to cut ropes and uses bubbles, air cushions, spikes, and moving anchors to
deliver the candy into the mouth of **Pip**, a hungry coral-colored critter.
All art is drawn procedurally on canvas and all sound is synthesized with the Web
Audio API. There are no external or copyrighted assets, names, or trademarks.

## Stack

- Vite + strict TypeScript, HTML5 canvas 2D, Vitest for tests.
- No runtime dependencies. No frameworks. No asset files.
- Dev server runs on strict port **5181** (`npm run dev`).

## Commands

```sh
npm ci            # install (Node 22.12+; workspace bundles Node at ../tools/node/bin)
npm run dev       # dev server at http://localhost:5181
npm run build     # typecheck (tsc) + production build
npm test          # vitest run (physics, cutting, geometry, levels, progress)
```

## Hard rules

1. **No magic numbers.** Every tuning value (physics constants, radii, speeds,
   timings, colors, volumes) lives in `src/config/`. Level coordinates live in
   level JSON files — they are data, not tuning.
2. **Small modules.** Keep files focused and under ~250 lines. Split before you
   exceed that.
3. **Tests are required** for physics (`engine/`), cutting, geometry, level
   schema validity, and progress storage. Run `npm test` and `npm run build`
   before claiming completion.
4. **No copyrighted assets or names.** Everything is procedural/original.
   Do not reference other games' trademarks in game-facing text.
5. **Data-driven levels.** Levels are JSON in `src/game/levels/` validated by
   `tests/levels.test.ts`. Mechanics are introduced gradually:
   ropes (1–3), bubbles (4), spikes (7), air cushions (10), moving anchors (13).

## File map

```
src/config/      world, physics, gameplay, visuals, audio tuning
src/engine/      vec2, particle (Verlet), constraint, rope, geometry — pure, tested
src/game/        types, simulation, cutting, levels/ (15 JSON + index)
src/input/       pointer (mouse + touch → world-space swipes and taps)
src/render/      renderer (responsive letterbox), draw-world, character, particles
src/audio/       sfx (Web Audio synthesis)
src/storage/     progress (localStorage, injectable storage for tests)
src/ui/          DOM screens (menu, level select, overlays) + HUD
src/main.ts      bootstrap; src/game/app.ts owns the state machine + loop
tests/           vitest suites
```

## Design pillars

- World space is a fixed 1000×1400 portrait board, letterboxed to fit any
  screen; input is converted to world coordinates by the renderer.
- Physics is fixed-timestep Verlet (positions + previous positions), distance
  constraints relaxed iteratively. The candy is a heavier particle shared as the
  last particle of each attached rope.
- Cutting = segment/segment intersection between the swipe path and each rope
  constraint; the hit constraint is removed, splitting the rope.
- Simulation emits typed events (`cut`, `star`, `bubble`, `pop`, `puff`,
  `feed`, `shatter`, `escape`) consumed by the app for sound + particles, which
  keeps the sim headless and testable.

## Adding a level

1. Create `src/game/levels/levelNN.json` following `src/game/types.ts`.
2. Register it in `src/game/levels/index.ts` (ordered array).
3. Keep the mechanic-introduction order intact or update `tests/levels.test.ts`
   deliberately.
4. Place stars on or near the natural solution path; the win is the mouth
   (radius in `src/config/gameplay.ts`), the rating is `max(1, stars collected)`.
