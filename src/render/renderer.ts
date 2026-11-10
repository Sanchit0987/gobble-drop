import { WORLD } from "../config/world";
import type { Vec2 } from "../engine/vec2";

/**
 * Responsive canvas renderer: letterboxes the fixed logical world into
 * whatever CSS size the canvas gets, honoring devicePixelRatio (capped).
 */
export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  /** Match the canvas backing store to its CSS size and recompute the fit. */
  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, WORLD.maxDevicePixelRatio);
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    const pxW = Math.max(1, Math.round(cssW * dpr));
    const pxH = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== pxW || this.canvas.height !== pxH) {
      this.canvas.width = pxW;
      this.canvas.height = pxH;
    }
    this.scale = Math.min(pxW / WORLD.width, pxH / WORLD.height);
    this.offsetX = (pxW - WORLD.width * this.scale) / 2;
    this.offsetY = (pxH - WORLD.height * this.scale) / 2;
  }

  /** Apply the world transform; draw calls then use world units. */
  beginWorld(): void {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }

  /** Reset to raw pixels (for letterbox bars etc.). */
  beginScreen(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** Convert a client (CSS px) point to world units. */
  toWorld = (clientX: number, clientY: number): Vec2 => {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, WORLD.maxDevicePixelRatio);
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    return {
      x: (px - this.offsetX) / this.scale,
      y: (py - this.offsetY) / this.scale
    };
  };
}
