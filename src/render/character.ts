import { PALETTE, VISUALS } from "../config/visuals";
import type { Vec2 } from "../engine/vec2";
import { dist } from "../engine/vec2";

/**
 * Pip — an original hungry coral critter sitting in a leafy bowl, drawn fully
 * procedurally. His mouth tracks the candy; eating is a three-phase animation:
 * gulp (candy shrinks into the mouth), chew (jaw bounces), then a happy smile.
 */
export interface PipState {
  /** 0 closed .. 1 wide open (tracking the candy). */
  mouthOpen: number;
  /** Eat animation: candy shrink-into-mouth phase, counts down. */
  gulpTimer: number;
  /** Chew phase, counts down after the gulp completes. */
  chewTimer: number;
  /** True once the whole eat animation has started (smile when done). */
  fed: boolean;
  /** Where the candy was when the feed triggered (gulp start point). */
  gulpFrom: Vec2 | null;
  blinkTimer: number;
  time: number;
}

export function createPipState(): PipState {
  return {
    mouthOpen: 0,
    gulpTimer: 0,
    chewTimer: 0,
    fed: false,
    gulpFrom: null,
    blinkTimer: 0,
    time: 0
  };
}

export function updatePip(state: PipState, pipPos: Vec2, candyPos: Vec2 | null, dt: number): void {
  state.time += dt;
  state.blinkTimer = state.time % VISUALS.pipBlinkInterval;

  if (state.gulpTimer > 0) {
    state.gulpTimer = Math.max(0, state.gulpTimer - dt);
    // Jaw stays wide during the gulp, snaps shut as it finishes.
    state.mouthOpen = state.gulpTimer > 0 ? 1 : 0;
    if (state.gulpTimer === 0) state.chewTimer = VISUALS.pipChewDuration;
    return;
  }
  if (state.chewTimer > 0) {
    state.chewTimer = Math.max(0, state.chewTimer - dt);
    return;
  }
  const target =
    candyPos === null
      ? state.fed
        ? 0
        : 0.05
      : Math.max(0, Math.min(1, 1 - dist(pipPos, candyPos) / VISUALS.pipMouthOpenDist));
  state.mouthOpen += (target - state.mouthOpen) * Math.min(1, dt * 10);
}

/** Begin the eat animation from the candy's current position. */
export function startEat(state: PipState, candyAt: Vec2): void {
  state.gulpTimer = VISUALS.eatDuration;
  state.gulpFrom = { ...candyAt };
  state.fed = true;
}

/** True while the gulp phase should render the shrinking candy. */
export function isGulping(state: PipState): boolean {
  return state.gulpTimer > 0;
}

/** Candy position/scale during the gulp (lerp toward mouth, shrink to 0). */
export function gulpCandyPose(
  state: PipState,
  mouth: Vec2
): { pos: Vec2; scale: number } | null {
  if (!state.gulpFrom || state.gulpTimer <= 0) return null;
  const t = 1 - state.gulpTimer / VISUALS.eatDuration; // 0 -> 1
  const ease = t * t * (3 - 2 * t);
  return {
    pos: {
      x: state.gulpFrom.x + (mouth.x - state.gulpFrom.x) * ease,
      y: state.gulpFrom.y + (mouth.y - state.gulpFrom.y) * ease
    },
    scale: 1 - ease
  };
}

const BODY_R = 110;

export function drawPip(ctx: CanvasRenderingContext2D, pos: Vec2, s: PipState): void {
  const scale = VISUALS.pipScale;
  const chewing = s.chewTimer > 0;
  const chewPhase = chewing
    ? Math.abs(Math.sin((VISUALS.pipChewDuration - s.chewTimer) * VISUALS.pipChewRate))
    : 0;
  // Body squashes a little with each chew; gentle breathing otherwise.
  const squash = chewing ? 1 + chewPhase * 0.06 : 1 + Math.sin(s.time * 2.2) * 0.015;
  const mouth = s.gulpTimer > 0 ? 1 : chewing ? chewPhase * 0.25 : s.mouthOpen;
  const happy = s.fed && !chewing && s.gulpTimer === 0;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.scale(scale / squash, scale * squash);

  // Ears
  ctx.fillStyle = PALETTE.pipBody;
  ctx.strokeStyle = PALETTE.pipOutline;
  ctx.lineWidth = 6;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * BODY_R * 0.62, -BODY_R * 0.82, 30, 48, side * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, BODY_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly patch
  ctx.fillStyle = PALETTE.pipBelly;
  ctx.beginPath();
  ctx.ellipse(0, BODY_R * 0.42, BODY_R * 0.55, BODY_R * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks puff while chewing
  if (chewing) {
    ctx.fillStyle = PALETTE.pipBelly;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        side * BODY_R * 0.62,
        BODY_R * 0.18,
        26 + chewPhase * 10,
        22 + chewPhase * 8,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // Eyes — blink, squeeze happily when fed/chewing
  const blinking = s.blinkTimer < VISUALS.pipBlinkDuration;
  for (const side of [-1, 1]) {
    const ex = side * BODY_R * 0.38;
    const ey = -BODY_R * 0.3;
    if (blinking || chewing || happy) {
      // Closed happy arc
      ctx.strokeStyle = PALETTE.pipOutline;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(ex, ey + 6, 18, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = PALETTE.pipOutline;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 24, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2b2b3a";
      ctx.beginPath();
      ctx.arc(ex, ey + 6 - mouth * 8, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex + 4, ey - 2 - mouth * 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Mouth
  const mouthY = BODY_R * 0.25;
  if (happy) {
    // Content smile
    ctx.strokeStyle = PALETTE.pipOutline;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, mouthY - 8, 36, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else {
    const openH = 10 + mouth * 78;
    ctx.fillStyle = PALETTE.pipMouth;
    ctx.strokeStyle = PALETTE.pipOutline;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, mouthY, 32 + mouth * 30, openH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tongue
    ctx.fillStyle = PALETTE.pipTongue;
    ctx.beginPath();
    ctx.ellipse(0, mouthY + openH * 0.45, 22 + mouth * 16, openH * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Leafy bowl Pip sits in, drawn behind him. */
export function drawPipPerch(ctx: CanvasRenderingContext2D, pos: Vec2): void {
  const w = VISUALS.leafBowlWidth;
  const d = VISUALS.leafBowlDepth;
  const y = pos.y + 78;
  ctx.fillStyle = PALETTE.leafBowl;
  ctx.beginPath();
  ctx.ellipse(pos.x, y, w, d, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = PALETTE.leafBowlRim;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(pos.x, y, w, d * 0.5, 0, Math.PI, 0);
  ctx.stroke();
  // Leaf tips along the rim
  ctx.fillStyle = PALETTE.leafBowlRim;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const lx = pos.x - w + t * w * 2;
    const ly = y - d * 0.5 * Math.sin(Math.PI * t) - 4;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 16, 9, (t - 0.5) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
