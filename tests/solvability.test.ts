import { describe, it, expect } from "vitest";
import { Simulation } from "../src/game/simulation";
import { LEVELS } from "../src/game/levels";
import { PHYSICS } from "../src/config/physics";

/**
 * Every shipped level must be winnable. Each strategy below encodes a known
 * human-playable solution (cut timings, bubble pops, cushion taps) and is run
 * headlessly through the real simulation. If a level edit breaks its solution,
 * this suite fails.
 */

const DT = PHYSICS.fixedDt;
const MAX_SECONDS = 40;

type Strategy = (sim: Simulation) => void;

const cutAll = (sim: Simulation, y: number): void => sim.cut({ x: 0, y }, { x: 1000, y });
const holding = (sim: Simulation): boolean => sim.bubbles.some((b) => b.state === "holding");

function solve(levelIndex: number, strategy: Strategy): Simulation {
  const sim = new Simulation(LEVELS[levelIndex]!);
  let first = true;
  for (let i = 0; i < MAX_SECONDS / DT && sim.status === "playing"; i++) {
    if (first) {
      first = false;
    }
    strategy(sim);
    sim.step(DT);
  }
  return sim;
}

/** Proven solutions, one per level (0-indexed). */
const SOLUTIONS: Strategy[] = [
  // L1 First Bite: cut immediately, straight drop.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 250);
  },
  // L2 Swing Shot: cut while swinging right past x=470.
  (s) => {
    if (s.candyTethered && s.candy.pos.x > 470 && s.candyVelocity.x > 200) cutAll(s, 300);
  },
  // L3 Two Lines: one swipe cuts both ropes after settling.
  (s) => {
    if (s.candyTethered && s.elapsed > 0.5) cutAll(s, 300);
  },
  // L4 Bubble Up: cut below, ride bubble, pop near Pip.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 870);
    if (holding(s) && s.candy.pos.y < 470) s.tap({ ...s.candy.pos });
  },
  // L5 Swing and Soar: fling right into the bubble, pop beside Pip.
  (s) => {
    if (s.candyTethered && s.candyVelocity.x > 150 && s.candy.pos.x > 300) cutAll(s, 320);
    if (holding(s) && s.candy.pos.y < 360) s.tap({ ...s.candy.pos });
  },
  // L6 Pop Drop: cut, get caught by the bubble, pop it to drop into Pip.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 260);
    if (holding(s) && s.candy.pos.y > 500) s.tap({ ...s.candy.pos });
  },
  // L7 Sharp Welcome: straight drop left of the spikes.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 260);
  },
  // L8 Needle Gap: cut while the swing passes the gap.
  (s) => {
    if (s.candyTethered && s.candy.pos.x > 440 && s.candy.pos.x < 500) cutAll(s, 300);
  },
  // L9 Thorn Garden: bubble straight up, pop above Pip.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 800);
    if (holding(s) && s.candy.pos.y < 430) s.tap({ ...s.candy.pos });
  },
  // L10 Gust Works: cut, then puff right as the candy falls past the cushion.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 280);
    if (s.candy.pos.y > 450 && s.cushions[0]!.cooldown === 0) s.tap({ x: 160, y: 600 });
  },
  // L11 Updraft: cut, fall, updraft puff lobs it back up into Pip.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 500);
    if (s.candy.pos.y > 1100 && s.cushions[0]!.cooldown === 0) s.tap({ x: 500, y: 1230 });
  },
  // L12 Crosswind Canyon: cut, puff right, second puff across the pit.
  (s) => {
    if (s.elapsed === 0) cutAll(s, 380);
    if (s.candy.pos.y > 750 && s.candy.pos.x < 350 && s.cushions[0]!.cooldown === 0)
      s.tap({ x: 110, y: 900 });
    if (s.candy.pos.x > 350 && s.candy.pos.y > 1050 && s.cushions[1]!.cooldown === 0)
      s.tap({ x: 470, y: 1190 });
  },
  // L13 Pendulum Post: cut while the anchor sweeps right near x=690.
  (s) => {
    const ax = s.ropes[0]!.anchor.pos.x;
    const tag = s as unknown as { _probePrevAx?: number };
    if (
      s.candyTethered &&
      tag._probePrevAx !== undefined &&
      Math.abs(ax - 690) < 8 &&
      ax > tag._probePrevAx &&
      s.elapsed > 0.5
    ) {
      cutAll(s, 320);
    }
    tag._probePrevAx = ax;
  },
  // L14 Ferry Service: ride across, cut when the anchor reaches x~510.
  (s) => {
    if (s.candyTethered && Math.abs(s.ropes[0]!.anchor.pos.x - 510) < 10 && s.elapsed > 0.5)
      cutAll(s, 330);
  },
  // L15 Grand Gobble: cut both ropes as the anchors converge (t > 2s).
  (s) => {
    if (s.candyTethered && s.elapsed > 2.0) cutAll(s, 300);
  }
];

describe("level solvability", () => {
  it.each(LEVELS.map((level, i) => [i + 1, level.name] as const))(
    "level %i (%s) is winnable with its scripted solution",
    (n) => {
      const sim = solve(n - 1, SOLUTIONS[n - 1]!);
      expect(sim.status).toBe("won");
    }
  );

  it("star-friendly levels award all three stars on the scripted path", () => {
    // These solutions are tuned to sweep all stars; keep them honest.
    const fullStarLevels = [0, 2, 3, 5, 6, 8, 9, 11];
    for (const idx of fullStarLevels) {
      const sim = solve(idx, SOLUTIONS[idx]!);
      expect(sim.status).toBe("won");
      expect(sim.starCount).toBe(3);
    }
  });
});
