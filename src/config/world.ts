/** Fixed logical world the game simulates in; the renderer letterboxes it. */
export const WORLD = {
  /** Logical width in world units (portrait board). */
  width: 1000,
  /** Logical height in world units. */
  height: 1400,
  /** Margin outside the world before the candy counts as escaped. */
  escapeMargin: 160,
  /** Maximum device pixel ratio honored to cap fill cost on 3x phones. */
  maxDevicePixelRatio: 2
} as const;
