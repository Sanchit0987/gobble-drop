/** Level JSON schema. All coordinates are world units in the 1000x1400 board. */

export interface PointData {
  x: number;
  y: number;
}

export interface RopeData {
  /** Anchor position. */
  anchor: PointData;
  /** Rope length multiplier over the straight anchor->candy distance. */
  slack?: number;
  /** Optional anchor motion: oscillates between `anchor` and `to`. */
  moving?: {
    to: PointData;
    /** Seconds for a full back-and-forth cycle. */
    period: number;
    /** Phase offset 0..1 into the cycle. */
    phase?: number;
  };
}

export interface BubbleData {
  pos: PointData;
}

export interface SpikeData {
  /** Spike strip from a to b; candy touching the strip shatters. */
  a: PointData;
  b: PointData;
}

export interface AirCushionData {
  pos: PointData;
  /** Blow direction in degrees; 0 = right, 90 = up. */
  angleDeg: number;
  /** Impulse multiplier over the configured base puff strength. Default 1. */
  power?: number;
}

export interface LevelData {
  /** Original level title shown in the HUD. */
  name: string;
  /** Candy spawn position. */
  candy: PointData;
  /** Pip's position (mouth center is derived from this). */
  pip: PointData;
  ropes: RopeData[];
  stars: PointData[];
  bubbles?: BubbleData[];
  spikes?: SpikeData[];
  airCushions?: AirCushionData[];
  /** Short hint shown at level start for new mechanics. */
  hint?: string;
}
