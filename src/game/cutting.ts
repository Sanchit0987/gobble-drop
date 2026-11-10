import { segmentsIntersect } from "../engine/geometry";
import type { Rope } from "../engine/rope";
import { cutConstraint } from "../engine/rope";
import type { DistanceConstraint } from "../engine/constraint";
import type { Vec2 } from "../engine/vec2";

export interface CutResult {
  rope: Rope;
  constraint: DistanceConstraint;
  /** Midpoint of the cut segment — where to spawn particles/sound. */
  at: Vec2;
}

/**
 * Test a swipe segment against every rope constraint and sever all hits.
 * Returns one result per severed constraint (a swipe can cut several ropes).
 */
export function cutRopesWithSegment(ropes: Rope[], from: Vec2, to: Vec2): CutResult[] {
  const results: CutResult[] = [];
  for (const rope of ropes) {
    // Collect first, then cut, so we never mutate while iterating.
    const hits: DistanceConstraint[] = [];
    for (const c of rope.constraints) {
      if (segmentsIntersect(from, to, c.a.pos, c.b.pos)) hits.push(c);
    }
    for (const c of hits) {
      if (cutConstraint(rope, c)) {
        results.push({
          rope,
          constraint: c,
          at: { x: (c.a.pos.x + c.b.pos.x) / 2, y: (c.a.pos.y + c.b.pos.y) / 2 }
        });
      }
    }
  }
  return results;
}
