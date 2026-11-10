import { describe, it, expect } from "vitest";
import { createParticle, integrate, velocityOf, addImpulse, movePinned } from "../src/engine/particle";
import { createConstraint, relax } from "../src/engine/constraint";
import { createRope, connectsTo, cutConstraint } from "../src/engine/rope";
import { PHYSICS } from "../src/config/physics";

const DT = PHYSICS.fixedDt;

describe("Verlet particle", () => {
  it("falls under gravity", () => {
    const p = createParticle(0, 0, 1);
    for (let i = 0; i < 60; i++) integrate(p, PHYSICS.gravity, 1, DT);
    expect(p.pos.y).toBeGreaterThan(0);
    expect(p.pos.x).toBe(0);
  });

  it("pinned particles never move under integration", () => {
    const p = createParticle(10, 20, 0, true);
    for (let i = 0; i < 60; i++) integrate(p, PHYSICS.gravity, 1, DT);
    expect(p.pos).toEqual({ x: 10, y: 20 });
  });

  it("velocity is implicit from position history", () => {
    const p = createParticle(0, 0, 1);
    integrate(p, PHYSICS.gravity, 1, DT);
    const v = velocityOf(p, DT);
    expect(v.y).toBeCloseTo(PHYSICS.gravity * DT, 3);
  });

  it("impulses add velocity", () => {
    const p = createParticle(0, 0, 1);
    addImpulse(p, 100, -50, DT);
    const v = velocityOf(p, DT);
    expect(v.x).toBeCloseTo(100, 5);
    expect(v.y).toBeCloseTo(-50, 5);
  });

  it("movePinned relocates without inducing velocity", () => {
    const p = createParticle(0, 0, 0, true);
    movePinned(p, 50, 60);
    expect(p.pos).toEqual({ x: 50, y: 60 });
    expect(velocityOf(p, DT)).toEqual({ x: 0, y: 0 });
  });

  it("damping slows motion", () => {
    const damped = createParticle(0, 0, 1);
    const free = createParticle(0, 0, 1);
    addImpulse(damped, 500, 0, DT);
    addImpulse(free, 500, 0, DT);
    for (let i = 0; i < 120; i++) {
      integrate(damped, 0, 0.95, DT);
      integrate(free, 0, 1, DT);
    }
    expect(Math.abs(velocityOf(damped, DT).x)).toBeLessThan(Math.abs(velocityOf(free, DT).x));
  });
});

describe("Distance constraint", () => {
  it("restores rest length between two free particles", () => {
    const a = createParticle(0, 0, 1);
    const b = createParticle(100, 0, 1);
    const c = createConstraint(a, b, 50, 1);
    for (let i = 0; i < 20; i++) relax(c);
    const len = Math.hypot(b.pos.x - a.pos.x, b.pos.y - a.pos.y);
    expect(len).toBeCloseTo(50, 1);
  });

  it("only moves the free particle when the other is pinned", () => {
    const a = createParticle(0, 0, 0, true);
    const b = createParticle(100, 0, 1);
    const c = createConstraint(a, b, 60, 1);
    for (let i = 0; i < 20; i++) relax(c);
    expect(a.pos).toEqual({ x: 0, y: 0 });
    expect(Math.hypot(b.pos.x, b.pos.y)).toBeCloseTo(60, 1);
  });
});

describe("Rope", () => {
  it("builds a chain from anchor to candy with correct connectivity", () => {
    const candy = createParticle(0, 400, PHYSICS.candyMass);
    const rope = createRope({ x: 0, y: 0 }, candy);
    expect(rope.particles[0]!.pinned).toBe(true);
    expect(rope.particles[rope.particles.length - 1]).toBe(candy);
    expect(rope.constraints.length).toBe(rope.particles.length - 1);
    expect(connectsTo(rope, candy)).toBe(true);
  });

  it("hangs taut under gravity near its rest length", () => {
    const candy = createParticle(0, 300, PHYSICS.candyMass);
    const rope = createRope({ x: 0, y: 0 }, candy);
    const restTotal = rope.constraints.reduce((s, c) => s + c.restLength, 0);
    for (let i = 0; i < 600; i++) {
      for (const p of rope.particles) integrate(p, PHYSICS.gravity, PHYSICS.damping, DT);
      for (let k = 0; k < PHYSICS.constraintIterations; k++) {
        for (const c of rope.constraints) relax(c);
      }
    }
    // Candy should hang below the anchor around the rope's length.
    expect(candy.pos.y).toBeGreaterThan(restTotal * 0.85);
    expect(candy.pos.y).toBeLessThan(restTotal * 1.25);
    expect(Math.abs(candy.pos.x)).toBeLessThan(10);
  });

  it("cutting disconnects the candy and lets it fall", () => {
    const candy = createParticle(0, 300, PHYSICS.candyMass);
    const rope = createRope({ x: 0, y: 0 }, candy);
    const mid = rope.constraints[Math.floor(rope.constraints.length / 2)]!;
    expect(cutConstraint(rope, mid)).toBe(true);
    expect(rope.severed).toBe(true);
    expect(connectsTo(rope, candy)).toBe(false);

    const yBefore = candy.pos.y;
    for (let i = 0; i < 240; i++) {
      for (const p of rope.particles) integrate(p, PHYSICS.gravity, PHYSICS.damping, DT);
      for (let k = 0; k < PHYSICS.constraintIterations; k++) {
        for (const c of rope.constraints) relax(c);
      }
    }
    expect(candy.pos.y).toBeGreaterThan(yBefore + 100);
  });

  it("cutConstraint is idempotent per constraint", () => {
    const candy = createParticle(0, 200, PHYSICS.candyMass);
    const rope = createRope({ x: 0, y: 0 }, candy);
    const target = rope.constraints[0]!;
    expect(cutConstraint(rope, target)).toBe(true);
    expect(cutConstraint(rope, target)).toBe(false);
  });
});
