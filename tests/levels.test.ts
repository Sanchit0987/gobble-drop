import { describe, it, expect } from "vitest";
import { LEVELS } from "../src/game/levels";
import { GAMEPLAY } from "../src/config/gameplay";
import { WORLD } from "../src/config/world";
import type { LevelData, PointData } from "../src/game/types";

function inBoard(p: PointData): boolean {
  return p.x >= 0 && p.x <= WORLD.width && p.y >= 0 && p.y <= WORLD.height;
}

describe("Level data", () => {
  it(`ships exactly ${GAMEPLAY.levelCount} levels`, () => {
    expect(LEVELS).toHaveLength(GAMEPLAY.levelCount);
  });

  it.each(LEVELS.map((level, i) => [i + 1, level] as const))(
    "level %i is structurally valid",
    (_n, level: LevelData) => {
      expect(level.name.length).toBeGreaterThan(0);
      expect(inBoard(level.candy)).toBe(true);
      expect(inBoard(level.pip)).toBe(true);
      expect(level.ropes.length).toBeGreaterThan(0);
      expect(level.stars).toHaveLength(GAMEPLAY.starsPerLevel);
      for (const rope of level.ropes) {
        expect(inBoard(rope.anchor)).toBe(true);
        if (rope.moving) {
          expect(inBoard(rope.moving.to)).toBe(true);
          expect(rope.moving.period).toBeGreaterThan(0);
        }
      }
      for (const star of level.stars) expect(inBoard(star)).toBe(true);
      for (const bubble of level.bubbles ?? []) expect(inBoard(bubble.pos)).toBe(true);
      for (const spike of level.spikes ?? []) {
        expect(inBoard(spike.a)).toBe(true);
        expect(inBoard(spike.b)).toBe(true);
      }
      for (const cushion of level.airCushions ?? []) expect(inBoard(cushion.pos)).toBe(true);
    }
  );

  it("introduces mechanics gradually in the designed order", () => {
    const firstWith = (pred: (l: LevelData) => boolean): number =>
      LEVELS.findIndex(pred);

    const firstBubble = firstWith((l) => (l.bubbles ?? []).length > 0);
    const firstSpike = firstWith((l) => (l.spikes ?? []).length > 0);
    const firstCushion = firstWith((l) => (l.airCushions ?? []).length > 0);
    const firstMoving = firstWith((l) => l.ropes.some((r) => r.moving !== undefined));

    expect(firstBubble).toBe(3); // level 4
    expect(firstSpike).toBe(6); // level 7
    expect(firstCushion).toBe(9); // level 10
    expect(firstMoving).toBe(12); // level 13

    // No mechanic appears before its introduction level.
    LEVELS.forEach((l, i) => {
      if (i < firstBubble) expect(l.bubbles ?? []).toHaveLength(0);
      if (i < firstSpike) expect(l.spikes ?? []).toHaveLength(0);
      if (i < firstCushion) expect(l.airCushions ?? []).toHaveLength(0);
      if (i < firstMoving) expect(l.ropes.every((r) => !r.moving)).toBe(true);
    });
  });

  it("keeps Pip's mouth away from spikes", () => {
    for (const level of LEVELS) {
      for (const s of level.spikes ?? []) {
        const d = Math.min(
          Math.hypot(level.pip.x - s.a.x, level.pip.y - s.a.y),
          Math.hypot(level.pip.x - s.b.x, level.pip.y - s.b.y)
        );
        expect(d).toBeGreaterThan(GAMEPLAY.mouthRadius);
      }
    }
  });
});
