/** Gameplay rules tuning. World units (wu) and seconds unless noted. */
export const GAMEPLAY = {
  /** Total levels shipped; level select renders this many slots. */
  levelCount: 15,
  /** Stars placed per level. */
  starsPerLevel: 3,
  /** Radius of a collectible star's pickup circle (wu). */
  starRadius: 46,
  /** Radius around Pip's mouth that counts as a feed (wu). */
  mouthRadius: 64,
  /** Radius of a bubble (wu); also its pickup/trap radius. */
  bubbleRadius: 58,
  /** Tap radius for popping bubbles and firing cushions (wu). */
  tapRadius: 72,
  /** Max distance between pointer-down and -up for a gesture to count as a tap (wu). */
  tapMaxTravel: 26,
  /** Spike strip half-thickness for collision (wu). */
  spikeHalfThickness: 18,
  /** Air cushion cooldown between puffs (s). */
  airCushionCooldown: 0.9,
  /** Delay after feeding before the win overlay shows (s) — covers the full
   *  eat animation: gulp + chew + a beat of Pip's happy smile. */
  winDelay: 1.8,
  /** Delay after losing before the fail overlay shows (s). */
  loseDelay: 0.7,
  /** Minimum star rating for completing a level even with 0 stars collected. */
  minRating: 1,
  /** Swipe sampling: minimum pointer travel (wu) before a new cut segment is tested. */
  swipeMinSegment: 6,
  /** How long a swipe trail segment stays visible (s). */
  swipeTrailLife: 0.18
} as const;
