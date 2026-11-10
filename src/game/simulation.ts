import { PHYSICS } from "../config/physics";
import { GAMEPLAY } from "../config/gameplay";
import { WORLD } from "../config/world";
import { createParticle, integrate, velocityOf, addImpulse, movePinned, type Particle } from "../engine/particle";
import { relax } from "../engine/constraint";
import { createRope, connectsTo, type Rope } from "../engine/rope";
import { cutRopesWithSegment } from "./cutting";
import { sweptCircleHitsSegment } from "../engine/geometry";
import { dist, type Vec2 } from "../engine/vec2";
import type { LevelData } from "./types";

export type SimEventType =
  | "cut"
  | "star"
  | "bubbleEnter"
  | "bubblePop"
  | "puff"
  | "feed"
  | "shatter"
  | "escape";

export interface SimEvent {
  type: SimEventType;
  at: Vec2;
}

export interface StarState {
  pos: Vec2;
  collected: boolean;
}

export interface BubbleState {
  pos: Vec2;
  /** "idle" floats in place; "holding" carries the candy; "popped" is gone. */
  state: "idle" | "holding" | "popped";
}

export interface CushionState {
  pos: Vec2;
  /** Unit blow direction. */
  dir: Vec2;
  angleDeg: number;
  cooldown: number;
  /** Impulse multiplier from level data. */
  power: number;
}

export interface MovingAnchorState {
  rope: Rope;
  from: Vec2;
  to: Vec2;
  period: number;
  phase: number;
}

export type SimStatus = "playing" | "won" | "lost";

/** Headless game simulation for one level. Rendering/audio consume `events`. */
export class Simulation {
  readonly level: LevelData;
  readonly candy: Particle;
  readonly ropes: Rope[] = [];
  readonly stars: StarState[];
  readonly bubbles: BubbleState[];
  readonly spikes: { a: Vec2; b: Vec2 }[];
  readonly cushions: CushionState[];
  readonly movingAnchors: MovingAnchorState[] = [];
  readonly mouth: Vec2;

  status: SimStatus = "playing";
  elapsed = 0;
  events: SimEvent[] = [];

  /** Bubble currently holding the candy, if any. */
  private holdingBubble: BubbleState | null = null;

  constructor(level: LevelData) {
    this.level = level;
    this.candy = createParticle(level.candy.x, level.candy.y, PHYSICS.candyMass);
    this.mouth = { x: level.pip.x, y: level.pip.y };

    for (const ropeData of level.ropes) {
      const rope = createRope(ropeData.anchor, this.candy, ropeData.slack ?? 1.0);
      this.ropes.push(rope);
      if (ropeData.moving) {
        this.movingAnchors.push({
          rope,
          from: { ...ropeData.anchor },
          to: { ...ropeData.moving.to },
          period: ropeData.moving.period,
          phase: ropeData.moving.phase ?? 0
        });
      }
    }

    this.stars = level.stars.map((pos) => ({ pos: { ...pos }, collected: false }));
    this.bubbles = (level.bubbles ?? []).map((b) => ({ pos: { ...b.pos }, state: "idle" as const }));
    this.spikes = (level.spikes ?? []).map((s) => ({ a: { ...s.a }, b: { ...s.b } }));
    this.cushions = (level.airCushions ?? []).map((c) => {
      const rad = (c.angleDeg * Math.PI) / 180;
      return {
        pos: { ...c.pos },
        dir: { x: Math.cos(rad), y: -Math.sin(rad) },
        angleDeg: c.angleDeg,
        cooldown: 0,
        power: c.power ?? 1
      };
    });
  }

  /** Number of collected stars. */
  get starCount(): number {
    return this.stars.filter((s) => s.collected).length;
  }

  /** Candy velocity in wu/s. */
  get candyVelocity(): Vec2 {
    return velocityOf(this.candy, PHYSICS.fixedDt);
  }

  /** True while at least one rope still holds the candy. */
  get candyTethered(): boolean {
    return this.ropes.some((r) => connectsTo(r, this.candy));
  }

  /** Advance real time; runs as many fixed steps as fit (capped). */
  update(dtSeconds: number): void {
    if (this.status !== "playing") return;
    const steps = Math.min(
      PHYSICS.maxStepsPerFrame,
      Math.max(1, Math.round(dtSeconds / PHYSICS.fixedDt))
    );
    for (let i = 0; i < steps && this.status === "playing"; i++) {
      this.step(PHYSICS.fixedDt);
    }
  }

  /** One fixed physics step. */
  step(dt: number): void {
    this.elapsed += dt;
    const prevCandy = { ...this.candy.pos };

    this.updateMovingAnchors();

    // Integrate all rope particles plus the candy exactly once.
    const seen = new Set<Particle>();
    for (const rope of this.ropes) {
      for (const p of rope.particles) {
        if (seen.has(p)) continue;
        seen.add(p);
        integrate(p, PHYSICS.gravity, PHYSICS.damping, dt);
      }
    }
    if (!seen.has(this.candy)) {
      integrate(this.candy, PHYSICS.gravity, PHYSICS.damping, dt);
    }

    // Bubble buoyancy counteracts gravity and lifts the candy; drag caps
    // the rise speed so floating feels soft rather than ballistic.
    if (this.holdingBubble) {
      const v = this.candyVelocity;
      addImpulse(this.candy, 0, -(PHYSICS.gravity + PHYSICS.bubbleLift) * dt, dt);
      addImpulse(
        this.candy,
        v.x * (PHYSICS.bubbleDrag - 1),
        v.y * (PHYSICS.bubbleDrag - 1),
        dt
      );
      this.holdingBubble.pos = { ...this.candy.pos };
    }

    for (let i = 0; i < PHYSICS.constraintIterations; i++) {
      for (const rope of this.ropes) {
        for (const c of rope.constraints) relax(c);
      }
    }

    for (const c of this.cushions) {
      c.cooldown = Math.max(0, c.cooldown - dt);
    }

    this.collectStars();
    this.catchBubbles();
    this.checkSpikes(prevCandy);
    this.checkFeed();
    this.checkEscape();
  }

  /** Swipe from->to: cut ropes and report what was severed. */
  cut(from: Vec2, to: Vec2): void {
    if (this.status !== "playing") return;
    const results = cutRopesWithSegment(this.ropes, from, to);
    for (const r of results) {
      this.events.push({ type: "cut", at: r.at });
    }
  }

  /** Tap: pop a held/idle bubble under the finger, or fire an air cushion. */
  tap(at: Vec2): void {
    if (this.status !== "playing") return;
    // Pop the bubble carrying the candy.
    if (this.holdingBubble && dist(at, this.holdingBubble.pos) <= GAMEPLAY.bubbleRadius + GAMEPLAY.tapRadius) {
      this.holdingBubble.state = "popped";
      this.events.push({ type: "bubblePop", at: { ...this.holdingBubble.pos } });
      this.holdingBubble = null;
      return;
    }
    // Fire the nearest cushion within tap range.
    for (const c of this.cushions) {
      if (dist(at, c.pos) <= GAMEPLAY.tapRadius + GAMEPLAY.tapMaxTravel && c.cooldown === 0) {
        this.firePuff(c);
        return;
      }
    }
  }

  private firePuff(c: CushionState): void {
    c.cooldown = GAMEPLAY.airCushionCooldown;
    this.events.push({ type: "puff", at: { ...c.pos } });
    const d = dist(this.candy.pos, c.pos);
    if (d > PHYSICS.airPuffRange) return;
    const falloff = Math.pow(1 - d / PHYSICS.airPuffRange, PHYSICS.airPuffFalloff);
    const impulse = PHYSICS.airPuffImpulse * falloff * c.power;
    addImpulse(this.candy, c.dir.x * impulse, c.dir.y * impulse, PHYSICS.fixedDt);
  }

  private updateMovingAnchors(): void {
    for (const m of this.movingAnchors) {
      const t = this.elapsed / m.period + m.phase;
      // Smooth 0..1..0 oscillation.
      const s = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
      movePinned(m.rope.anchor, m.from.x + (m.to.x - m.from.x) * s, m.from.y + (m.to.y - m.from.y) * s);
    }
  }

  private collectStars(): void {
    for (const star of this.stars) {
      if (star.collected) continue;
      if (dist(this.candy.pos, star.pos) <= GAMEPLAY.starRadius + PHYSICS.candyRadius) {
        star.collected = true;
        this.events.push({ type: "star", at: { ...star.pos } });
      }
    }
  }

  private catchBubbles(): void {
    if (this.holdingBubble) return;
    for (const b of this.bubbles) {
      if (b.state !== "idle") continue;
      if (dist(this.candy.pos, b.pos) <= GAMEPLAY.bubbleRadius) {
        b.state = "holding";
        this.holdingBubble = b;
        this.events.push({ type: "bubbleEnter", at: { ...b.pos } });
        return;
      }
    }
  }

  private checkSpikes(prevCandy: Vec2): void {
    for (const s of this.spikes) {
      const hitR = PHYSICS.candyRadius + GAMEPLAY.spikeHalfThickness;
      if (sweptCircleHitsSegment(prevCandy, this.candy.pos, hitR, s.a, s.b)) {
        this.status = "lost";
        this.events.push({ type: "shatter", at: { ...this.candy.pos } });
        return;
      }
    }
  }

  private checkFeed(): void {
    if (this.status !== "playing") return;
    if (dist(this.candy.pos, this.mouth) <= GAMEPLAY.mouthRadius) {
      this.status = "won";
      this.events.push({ type: "feed", at: { ...this.mouth } });
    }
  }

  private checkEscape(): void {
    if (this.status !== "playing") return;
    const m = WORLD.escapeMargin;
    const { x, y } = this.candy.pos;
    if (x < -m || x > WORLD.width + m || y > WORLD.height + m || y < -m * 2) {
      this.status = "lost";
      this.events.push({ type: "escape", at: { ...this.candy.pos } });
    }
  }

  /** Drain queued events (app consumes them for sound/particles). */
  drainEvents(): SimEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }
}
