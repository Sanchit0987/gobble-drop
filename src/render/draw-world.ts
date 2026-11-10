import { PALETTE, VISUALS } from "../config/visuals";
import { PHYSICS } from "../config/physics";
import { GAMEPLAY } from "../config/gameplay";
import type { Simulation } from "../game/simulation";
import type { Vec2 } from "../engine/vec2";
import { drawScenery } from "./scenery";

/** Background delegate (kept as the module's public name for the app). */
export function drawBackground(ctx: CanvasRenderingContext2D, time: number): void {
  drawScenery(ctx, time);
}

export function drawRopes(ctx: CanvasRenderingContext2D, sim: Simulation): void {
  ctx.lineCap = "round";
  for (const rope of sim.ropes) {
    for (const c of rope.constraints) {
      ctx.strokeStyle = PALETTE.rope;
      ctx.lineWidth = VISUALS.ropeWidth;
      ctx.beginPath();
      ctx.moveTo(c.a.pos.x, c.a.pos.y);
      ctx.lineTo(c.b.pos.x, c.b.pos.y);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.ropeHighlight;
      ctx.lineWidth = VISUALS.ropeWidth * 0.35;
      ctx.beginPath();
      ctx.moveTo(c.a.pos.x, c.a.pos.y);
      ctx.lineTo(c.b.pos.x, c.b.pos.y);
      ctx.stroke();
    }
    drawAnchor(ctx, rope.anchor.pos);
  }
}

/** Ring-style anchor pin, like a hook plate screwed into the canopy. */
function drawAnchor(ctx: CanvasRenderingContext2D, pos: Vec2): void {
  const R = VISUALS.anchorRingRadius;
  ctx.strokeStyle = PALETTE.anchorRing;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.anchorPin;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, VISUALS.anchorPinRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.anchorRing;
  ctx.lineWidth = 3;
  ctx.stroke();
}

/** Track line for moving anchors so the motion reads as intentional. */
export function drawAnchorTracks(ctx: CanvasRenderingContext2D, sim: Simulation): void {
  ctx.strokeStyle = PALETTE.anchorTrack;
  ctx.lineWidth = 6;
  ctx.setLineDash([16, 13]);
  for (const m of sim.movingAnchors) {
    ctx.beginPath();
    ctx.moveTo(m.from.x, m.from.y);
    ctx.lineTo(m.to.x, m.to.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // End caps
  ctx.fillStyle = PALETTE.anchorTrack;
  for (const m of sim.movingAnchors) {
    for (const p of [m.from, m.to]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Swirl lollipop candy: red disc with a spiral of orange arms and a creamy
 * rim, slowly rotating. `scale` supports the eat/shrink animation.
 */
export function drawCandy(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  time: number,
  scale = 1
): void {
  if (scale <= 0) return;
  const r = PHYSICS.candyRadius * scale;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(time * 0.8);

  // Rim
  ctx.fillStyle = PALETTE.candyRim;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // Base disc
  ctx.fillStyle = PALETTE.candyBase;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  // Red body
  ctx.fillStyle = PALETTE.candyBody;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.fill();

  // Spiral arms
  ctx.strokeStyle = PALETTE.candyStripe;
  ctx.lineCap = "round";
  const arms = VISUALS.candySwirlArms;
  for (let a = 0; a < arms; a++) {
    const start = (a / arms) * Math.PI * 2;
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.12) {
      const ang = start + t * Math.PI * 2 * VISUALS.candySwirlCurve;
      const rr = r * 0.12 + t * r * 0.66;
      const px = Math.cos(ang) * rr;
      const py = Math.sin(ang) * rr;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Center dot
  ctx.fillStyle = PALETTE.candyStripe;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Fixed-angle shine (not rotating with the swirl)
  ctx.fillStyle = PALETTE.candyShine;
  ctx.beginPath();
  ctx.ellipse(
    pos.x - r * 0.38,
    pos.y - r * 0.42,
    r * 0.2,
    r * 0.11,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawStars(ctx: CanvasRenderingContext2D, sim: Simulation, time: number): void {
  for (const star of sim.stars) {
    if (star.collected) continue;
    const pulse = 1 + Math.sin(time * VISUALS.starSpinSpeed * 2) * VISUALS.starPulseAmount;
    const r = GAMEPLAY.starRadius * 0.9 * pulse;
    // Soft glow halo
    const glow = ctx.createRadialGradient(
      star.pos.x,
      star.pos.y,
      r * 0.3,
      star.pos.x,
      star.pos.y,
      r * VISUALS.starGlowScale
    );
    glow.addColorStop(0, PALETTE.starGlow);
    glow.addColorStop(1, "rgba(255,232,110,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(star.pos.x, star.pos.y, r * VISUALS.starGlowScale, 0, Math.PI * 2);
    ctx.fill();
    drawStarShape(ctx, star.pos, r, time * VISUALS.starSpinSpeed);
  }
}

function drawStarShape(ctx: CanvasRenderingContext2D, pos: Vec2, r: number, rot: number): void {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(Math.sin(rot) * 0.25);
  ctx.fillStyle = PALETTE.star;
  ctx.strokeStyle = PALETTE.starStroke;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBubbles(ctx: CanvasRenderingContext2D, sim: Simulation, time: number): void {
  for (const b of sim.bubbles) {
    if (b.state === "popped") continue;
    const bob = b.state === "idle" ? Math.sin(time * VISUALS.bubbleBobSpeed) * VISUALS.bubbleBobAmplitude : 0;
    const r = GAMEPLAY.bubbleRadius;
    ctx.fillStyle = PALETTE.bubble;
    ctx.strokeStyle = PALETTE.bubbleRim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y + bob, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Shine
    ctx.strokeStyle = PALETTE.bubbleRim;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(b.pos.x - r * 0.35, b.pos.y + bob - r * 0.35, r * 0.4, Math.PI * 0.9, Math.PI * 1.5);
    ctx.stroke();
  }
}

/** Wooden board with bright metal spikes on both sides. */
export function drawSpikes(ctx: CanvasRenderingContext2D, sim: Simulation): void {
  for (const s of sim.spikes) {
    const dx = s.b.x - s.a.x;
    const dy = s.b.y - s.a.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const spikeW = 34;
    const spikeH = 42;
    const count = Math.max(1, Math.floor(len / spikeW));
    // Wooden base strip
    ctx.strokeStyle = PALETTE.spikeBase;
    ctx.lineWidth = GAMEPLAY.spikeHalfThickness * 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.a.x, s.a.y);
    ctx.lineTo(s.b.x, s.b.y);
    ctx.stroke();
    // Metal teeth on both sides
    for (let i = 0; i < count; i++) {
      const t0 = (i + 0.1) / count;
      const t1 = (i + 0.9) / count;
      const tm = (i + 0.5) / count;
      for (const side of [1, -1]) {
        const tipX = s.a.x + dx * tm + nx * spikeH * side;
        const tipY = s.a.y + dy * tm + ny * spikeH * side;
        ctx.fillStyle = PALETTE.spikeTip;
        ctx.strokeStyle = PALETTE.spikeEdge;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(s.a.x + dx * t0, s.a.y + dy * t0);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(s.a.x + dx * t1, s.a.y + dy * t1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

export function drawCushions(ctx: CanvasRenderingContext2D, sim: Simulation, time: number): void {
  for (const c of sim.cushions) {
    const s = VISUALS.cushionSize;
    const firing = c.cooldown > GAMEPLAY.airCushionCooldown * 0.7;
    const squash = firing ? VISUALS.cushionPuffScale : 1 + Math.sin(time * 2.4) * 0.04;
    ctx.save();
    ctx.translate(c.pos.x, c.pos.y);
    ctx.rotate(Math.atan2(-c.dir.y, c.dir.x) * -1);
    // Bellows body
    ctx.fillStyle = PALETTE.cushionBody;
    ctx.strokeStyle = PALETTE.cushionDark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, (s / 2) * squash, (s / 2.4) / squash, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Nozzle pointing along +x (rotated above)
    ctx.fillStyle = PALETTE.cushionDark;
    ctx.beginPath();
    ctx.moveTo(s * 0.42, -s * 0.14);
    ctx.lineTo(s * 0.62, 0);
    ctx.lineTo(s * 0.42, s * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Fading swipe trail segments. */
export interface TrailSegment {
  from: Vec2;
  to: Vec2;
  age: number;
}

export function drawSwipeTrail(ctx: CanvasRenderingContext2D, trail: TrailSegment[]): void {
  ctx.lineCap = "round";
  for (const seg of trail) {
    const alpha = Math.max(0, 1 - seg.age / GAMEPLAY.swipeTrailLife);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PALETTE.swipe;
    ctx.lineWidth = 8 * alpha + 2;
    ctx.beginPath();
    ctx.moveTo(seg.from.x, seg.from.y);
    ctx.lineTo(seg.to.x, seg.to.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
