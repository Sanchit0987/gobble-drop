/** Visual tuning: palette, sizes, animation timing. Sizes in world units. */
export const PALETTE = {
  // Bright daytime sky
  skyTop: "#6ec9f2",
  skyBottom: "#cfeffc",
  sunGlow: "rgba(255, 248, 196, 0.9)",
  sunbeam: "rgba(255, 244, 180, 0.18)",
  cloud: "rgba(255, 255, 255, 0.88)",
  // Forest scenery
  canopyBack: "#a9df6e",
  canopyLight: "#7ed04f",
  canopyMid: "#49ab3e",
  canopyDark: "#2e8a35",
  canopyDeep: "#1f6b28",
  trunk: "#e0a35b",
  trunkShade: "#c07f3c",
  houseWall: "#ecd09a",
  houseShade: "#d9b172",
  houseDark: "#8a6436",
  // Letterbox bars outside the world
  letterbox: "#1d5a24",
  // Ropes and anchors
  rope: "#7a4f28",
  ropeHighlight: "#b08752",
  anchorRing: "#4a4f5e",
  anchorPin: "#8fd8f8",
  anchorTrack: "#6f7d94",
  // Swirl candy
  candyBase: "#fff3e0",
  candyBody: "#e8452c",
  candyStripe: "#ff9d2e",
  candyRim: "#b93620",
  candyShine: "rgba(255, 255, 255, 0.85)",
  // Stars
  star: "#ffd829",
  starStroke: "#ffffff",
  starGlow: "rgba(255, 232, 110, 0.5)",
  // Mechanics
  bubble: "rgba(140, 215, 255, 0.33)",
  bubbleRim: "rgba(235, 250, 255, 0.95)",
  spikeBase: "#8a5a2e",
  spikeTip: "#dfe6f2",
  spikeEdge: "#8f9bb5",
  cushionBody: "#58c9a9",
  cushionDark: "#2f9a7d",
  // Pip and his leaf perch
  pipBody: "#ff6b81",
  pipBelly: "#ffd9df",
  pipOutline: "#8f2b3d",
  pipTongue: "#e04a63",
  pipMouth: "#5a2430",
  leafBowl: "#1f5c23",
  leafBowlRim: "#2e7a30",
  hudText: "#ffffff",
  swipe: "rgba(255, 255, 255, 0.92)"
} as const;

export const VISUALS = {
  ropeWidth: 10,
  candySwirlArms: 6,
  candySwirlCurve: 0.55,
  starSpinSpeed: 1.6,
  starPulseAmount: 0.08,
  starGlowScale: 1.9,
  bubbleBobAmplitude: 6,
  bubbleBobSpeed: 1.3,
  cushionSize: 110,
  cushionPuffScale: 1.25,
  anchorRingRadius: 22,
  anchorPinRadius: 9,
  pipScale: 1.0,
  pipMouthOpenDist: 520,
  pipChewDuration: 1.1,
  pipChewRate: 14,
  pipBlinkInterval: 3.4,
  pipBlinkDuration: 0.14,
  /** Seconds for the candy to shrink into Pip's mouth after a feed. */
  eatDuration: 0.3,
  leafBowlWidth: 170,
  leafBowlDepth: 58,
  backgroundCloudCount: 5
} as const;

/** Static scenery layout in world units (1000x1400 board). Art data. */
export const SCENERY = {
  sun: { x: 140, y: 110, r: 90 },
  sunbeams: [
    { angle: 0.45, width: 0.16 },
    { angle: 0.72, width: 0.1 },
    { angle: 0.98, width: 0.14 }
  ],
  clouds: [
    { x: 420, y: 180, s: 1.0 },
    { x: 760, y: 120, s: 0.7 },
    { x: 180, y: 320, s: 0.6 },
    { x: 620, y: 330, s: 0.8 },
    { x: 900, y: 450, s: 0.55 }
  ],
  houses: [
    { x: 150, y: 520, w: 300, h: 280, roofH: 130 },
    { x: 540, y: 560, w: 260, h: 240, roofH: 110 }
  ],
  trunks: [
    { base: 790, top: 660, width: 170, lean: 70, topY: 120 },
    { base: 960, top: 860, width: 130, lean: 60, topY: 260 },
    { base: 60, top: 30, width: 100, lean: -40, topY: 380 }
  ],
  midFoliage: { x: 470, y: 640, r: 150 },
  trunkCanopies: [
    { x: 870, y: 540, r: 170 },
    { x: 700, y: 420, r: 120 },
    { x: 980, y: 700, r: 130 }
  ]
} as const;

export const PARTICLES = {
  cutBurstCount: 8,
  cutBurstSpeed: 260,
  starBurstCount: 14,
  starBurstSpeed: 380,
  bubblePopCount: 10,
  bubblePopSpeed: 300,
  feedBurstCount: 22,
  feedBurstSpeed: 420,
  shatterCount: 18,
  shatterSpeed: 460,
  puffCount: 12,
  puffSpeed: 340,
  gravity: 900,
  drag: 0.985,
  lifeMin: 0.35,
  lifeMax: 0.9,
  sizeMin: 5,
  sizeMax: 14,
  maxAlive: 400
} as const;
