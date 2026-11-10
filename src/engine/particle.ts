import type { Vec2 } from "./vec2";

/**
 * Verlet particle: stores current and previous position; velocity is implicit
 * (pos - prev). Pinned particles ignore integration and follow their pin.
 */
export interface Particle {
  pos: Vec2;
  prev: Vec2;
  /** Inverse mass; 0 means pinned/infinite mass. */
  invMass: number;
  pinned: boolean;
}

export function createParticle(x: number, y: number, mass: number, pinned = false): Particle {
  return {
    pos: { x, y },
    prev: { x, y },
    invMass: pinned || mass <= 0 ? 0 : 1 / mass,
    pinned
  };
}

/** Integrate one fixed step with gravity and velocity damping. */
export function integrate(p: Particle, gravity: number, damping: number, dt: number): void {
  if (p.pinned || p.invMass === 0) return;
  const vx = (p.pos.x - p.prev.x) * damping;
  const vy = (p.pos.y - p.prev.y) * damping;
  p.prev.x = p.pos.x;
  p.prev.y = p.pos.y;
  p.pos.x += vx;
  p.pos.y += vy + gravity * dt * dt;
}

/** Implicit velocity in wu/s given the fixed timestep. */
export function velocityOf(p: Particle, dt: number): Vec2 {
  return { x: (p.pos.x - p.prev.x) / dt, y: (p.pos.y - p.prev.y) / dt };
}

/** Add an instantaneous velocity change (wu/s) by shifting prev. */
export function addImpulse(p: Particle, vx: number, vy: number, dt: number): void {
  if (p.pinned || p.invMass === 0) return;
  p.prev.x -= vx * dt;
  p.prev.y -= vy * dt;
}

/** Move a pinned particle (anchor) without imparting velocity spikes. */
export function movePinned(p: Particle, x: number, y: number): void {
  p.pos.x = x;
  p.pos.y = y;
  p.prev.x = x;
  p.prev.y = y;
}
