import type { Particle } from "./particle";

/** Distance constraint between two particles; the building block of ropes. */
export interface DistanceConstraint {
  a: Particle;
  b: Particle;
  restLength: number;
  /** 0..1 fraction of positional error corrected per relaxation pass. */
  stiffness: number;
}

export function createConstraint(
  a: Particle,
  b: Particle,
  restLength: number,
  stiffness: number
): DistanceConstraint {
  return { a, b, restLength, stiffness };
}

/** One relaxation pass: move both endpoints toward the rest length. */
export function relax(c: DistanceConstraint): void {
  const dx = c.b.pos.x - c.a.pos.x;
  const dy = c.b.pos.y - c.a.pos.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const wA = c.a.invMass;
  const wB = c.b.invMass;
  const wSum = wA + wB;
  if (wSum === 0) return;
  const diff = ((len - c.restLength) / len) * c.stiffness;
  const cx = dx * diff;
  const cy = dy * diff;
  c.a.pos.x += cx * (wA / wSum);
  c.a.pos.y += cy * (wA / wSum);
  c.b.pos.x -= cx * (wB / wSum);
  c.b.pos.y -= cy * (wB / wSum);
}
