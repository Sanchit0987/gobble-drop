import { describe, it, expect } from "vitest";
import { createParticle } from "../src/engine/particle";
import { createRope, connectsTo } from "../src/engine/rope";
import { cutRopesWithSegment } from "../src/game/cutting";
import { PHYSICS } from "../src/config/physics";

function makeHangingRope(anchorX: number) {
  const candy = createParticle(anchorX, 400, PHYSICS.candyMass);
  const rope = createRope({ x: anchorX, y: 0 }, candy);
  return { rope, candy };
}

describe("cutRopesWithSegment", () => {
  it("severs a rope crossed by a horizontal swipe", () => {
    const { rope, candy } = makeHangingRope(100);
    const results = cutRopesWithSegment([rope], { x: 50, y: 200 }, { x: 150, y: 200 });
    expect(results.length).toBeGreaterThan(0);
    expect(connectsTo(rope, candy)).toBe(false);
  });

  it("reports the cut midpoint near the swipe line", () => {
    const { rope } = makeHangingRope(100);
    const results = cutRopesWithSegment([rope], { x: 50, y: 200 }, { x: 150, y: 200 });
    expect(results[0]!.at.x).toBeCloseTo(100, 0);
    expect(Math.abs(results[0]!.at.y - 200)).toBeLessThan(PHYSICS.ropeSegmentLength);
  });

  it("misses when the swipe does not touch the rope", () => {
    const { rope, candy } = makeHangingRope(100);
    const results = cutRopesWithSegment([rope], { x: 200, y: 200 }, { x: 300, y: 200 });
    expect(results).toHaveLength(0);
    expect(connectsTo(rope, candy)).toBe(true);
  });

  it("one swipe can sever multiple ropes", () => {
    const a = makeHangingRope(100);
    const b = makeHangingRope(200);
    const results = cutRopesWithSegment([a.rope, b.rope], { x: 50, y: 200 }, { x: 250, y: 200 });
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(connectsTo(a.rope, a.candy)).toBe(false);
    expect(connectsTo(b.rope, b.candy)).toBe(false);
  });

  it("a vertical swipe along the rope axis does not duplicate cuts per constraint", () => {
    const { rope } = makeHangingRope(100);
    const before = rope.constraints.length;
    const results = cutRopesWithSegment([rope], { x: 100, y: 150 }, { x: 100, y: 260 });
    // Every intersected constraint is cut exactly once.
    expect(rope.constraints.length).toBe(before - results.length);
    const unique = new Set(results.map((r) => r.constraint));
    expect(unique.size).toBe(results.length);
  });
});
