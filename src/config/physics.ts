/** Verlet physics tuning. All values are world units (wu) and seconds. */
export const PHYSICS = {
  /** Fixed simulation timestep in seconds. */
  fixedDt: 1 / 120,
  /** Max simulated steps per rendered frame (spiral-of-death guard). */
  maxStepsPerFrame: 8,
  /** Gravity in wu/s^2 (positive = down). */
  gravity: 1700,
  /** Velocity damping per step (1 = none). Keeps swings lively but stable. */
  damping: 0.998,
  /** Distance-constraint relaxation iterations per step. */
  constraintIterations: 10,
  /** Rope segment rest length in wu — ropes are built from this spacing. */
  ropeSegmentLength: 26,
  /** Mass of a plain rope particle. */
  ropeParticleMass: 1,
  /** Mass of the candy particle (heavier so ropes hang taut). */
  candyMass: 6,
  /** Candy collision radius in wu. */
  candyRadius: 34,
  /** Rope stiffness 0..1 — fraction of error corrected per iteration. */
  ropeStiffness: 1,
  /**
   * Buoyancy acceleration while the candy is inside a bubble (wu/s^2, up).
   * Must exceed what is needed to also lift a severed rope tail that still
   * hangs from the candy (tail weight is shared through constraints), so it
   * is well above bare gravity.
   */
  bubbleLift: 4200,
  /** Drag factor applied to candy velocity while floating in a bubble, per step. */
  bubbleDrag: 0.97,
  /** Impulse applied by an air-cushion puff (wu/s added along its direction). */
  airPuffImpulse: 1700,
  /** Radius within which an air puff affects the candy (wu). */
  airPuffRange: 480,
  /** Air puff falloff exponent over distance (1 = linear). */
  airPuffFalloff: 1.4
} as const;
