# Gobble Drop

**Play it live: [gobble-drop.vercel.app](https://gobble-drop.vercel.app)**

Feed Pip! An original browser physics puzzler: a golden honeydrop swings on
ropes — swipe to cut them, ride bubbles, dodge spikes, fire air cushions, and
time moving anchors to drop the candy into Pip's mouth. Collect up to 3 stars
per level across 15 handcrafted levels.

All art is procedural canvas drawing and all audio is synthesized in the
browser. No external assets, no copyrighted material.

## Run

```sh
npm ci
npm run dev     # http://localhost:5181
npm test        # physics / cutting / level / progress tests
npm run build   # typecheck + production bundle
```

Node 22.12+ required (this workspace bundles Node at `../tools/node/bin`).

## How to play

- **Swipe** (mouse drag or touch) across a rope to cut it.
- **Tap** a bubble to pop it; tap an air cushion to fire a puff of air.
- Get the honeydrop into **Pip's mouth** to win. If it flies off screen or
  touches spikes, you lose.
- Grab the 3 stars on the way for a better rating (1–3 stars). Progress and
  ratings are saved in your browser (localStorage).

Pause with the ⏸ button or `Esc`; restart anytime with ↻.

## Structure

See [AGENTS.md](AGENTS.md) for the module map, tuning-value rules, and how to
add levels. Levels are data-driven JSON in `src/game/levels/`.
