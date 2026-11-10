import { createParticle, type Particle } from "./particle";
import { createConstraint, type DistanceConstraint } from "./constraint";
import { dist, type Vec2 } from "./vec2";
import { PHYSICS } from "../config/physics";

/**
 * A rope: a pinned anchor particle, a chain of free particles, and the shared
 * candy particle at the end (or a free tail once cut). Constraints link them.
 */
export interface Rope {
  /** First particle — the pinned anchor. */
  anchor: Particle;
  /** All particles including anchor and the end particle. */
  particles: Particle[];
  /** Live constraints; cutting removes one, splitting the rope. */
  constraints: DistanceConstraint[];
  /** True once at least one constraint was cut. */
  severed: boolean;
}

/**
 * Build a rope from anchor to the end particle (usually the candy).
 * Segment count derives from distance and the configured rest length,
 * with slack making the rope a bit longer than the straight line.
 */
export function createRope(anchorPos: Vec2, end: Particle, slack = 1.0): Rope {
  const straight = dist(anchorPos, end.pos);
  const totalLength = straight * slack;
  const segments = Math.max(2, Math.round(totalLength / PHYSICS.ropeSegmentLength));
  const restLength = totalLength / segments;

  const anchor = createParticle(anchorPos.x, anchorPos.y, 0, true);
  const particles: Particle[] = [anchor];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = anchorPos.x + (end.pos.x - anchorPos.x) * t;
    const y = anchorPos.y + (end.pos.y - anchorPos.y) * t;
    particles.push(createParticle(x, y, PHYSICS.ropeParticleMass));
  }
  particles.push(end);

  const constraints: DistanceConstraint[] = [];
  for (let i = 0; i < particles.length - 1; i++) {
    const a = particles[i]!;
    const b = particles[i + 1]!;
    constraints.push(createConstraint(a, b, restLength, PHYSICS.ropeStiffness));
  }
  return { anchor, particles, constraints, severed: false };
}

/** Remove one constraint from the rope (a cut). Returns true if removed. */
export function cutConstraint(rope: Rope, constraint: DistanceConstraint): boolean {
  const idx = rope.constraints.indexOf(constraint);
  if (idx === -1) return false;
  rope.constraints.splice(idx, 1);
  rope.severed = true;
  return true;
}

/** True while the rope still connects its anchor to the given particle. */
export function connectsTo(rope: Rope, target: Particle): boolean {
  // Walk constraints from the anchor; rope constraints form a chain.
  const linked = new Set<Particle>([rope.anchor]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of rope.constraints) {
      if (linked.has(c.a) && !linked.has(c.b)) {
        linked.add(c.b);
        grew = true;
      } else if (linked.has(c.b) && !linked.has(c.a)) {
        linked.add(c.a);
        grew = true;
      }
    }
  }
  return linked.has(target);
}
