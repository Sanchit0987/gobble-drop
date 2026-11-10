import { PARTICLES } from "../config/visuals";
import type { Vec2 } from "../engine/vec2";

interface VfxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: "circle" | "spark" | "star";
}

/** Lightweight decorative particle system (separate from game physics). */
export class ParticleSystem {
  private particles: VfxParticle[] = [];

  burst(at: Vec2, count: number, speed: number, colors: string[], shape: VfxParticle["shape"] = "circle"): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= PARTICLES.maxAlive) return;
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      const life = PARTICLES.lifeMin + Math.random() * (PARTICLES.lifeMax - PARTICLES.lifeMin);
      this.particles.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life,
        maxLife: life,
        size: PARTICLES.sizeMin + Math.random() * (PARTICLES.sizeMax - PARTICLES.sizeMin),
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#ffffff",
        shape
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += PARTICLES.gravity * dt;
      p.vx *= PARTICLES.drag;
      p.vy *= PARTICLES.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === "star") {
        drawMiniStar(ctx, p.x, p.y, p.size);
      } else if (p.shape === "spark") {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 6, p.size, p.size / 3);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.particles = [];
  }
}

function drawMiniStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const spikes = 5;
  const outer = size;
  const inner = size * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
