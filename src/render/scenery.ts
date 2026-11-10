import { PALETTE, SCENERY, VISUALS } from "../config/visuals";
import { WORLD } from "../config/world";

/**
 * Bright forest backdrop: sun with beams, puffy clouds, layered leafy canopy
 * framing the board, tree trunks, and little treehouses. Pure procedural art.
 */
export function drawScenery(ctx: CanvasRenderingContext2D, time: number): void {
  drawSky(ctx);
  drawSun(ctx, time);
  drawClouds(ctx, time);
  drawBackCanopy(ctx);
  drawTreehouses(ctx);
  drawTrunks(ctx);
  drawFrontCanopy(ctx, time);
}

function drawSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.65, PALETTE.skyBottom);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
}

function drawSun(ctx: CanvasRenderingContext2D, time: number): void {
  const { x, y, r } = SCENERY.sun;
  // Halo
  const halo = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.4);
  halo.addColorStop(0, PALETTE.sunGlow);
  halo.addColorStop(1, "rgba(255,248,196,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Sunbeams slanting down-right
  for (const beam of SCENERY.sunbeams) {
    const a = beam.angle + Math.sin(time * 0.3) * 0.01;
    ctx.fillStyle = PALETTE.sunbeam;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const len = WORLD.height * 1.2;
    const hw = len * beam.width * 0.5;
    ctx.lineTo(len, -hw);
    ctx.lineTo(len, hw);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Core
  ctx.fillStyle = "#fff6c8";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = PALETTE.cloud;
  SCENERY.clouds.forEach((c, i) => {
    const drift = Math.sin(time * 0.15 + i * 2.1) * 14;
    puffyCloud(ctx, c.x + drift, c.y, 60 * c.s);
  });
}

function puffyCloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x - r * 1.1, y + r * 0.25, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x + r * 1.1, y + r * 0.25, r * 0.75, 0, Math.PI * 2);
  ctx.arc(x - r * 0.4, y - r * 0.5, r * 0.65, 0, Math.PI * 2);
  ctx.arc(x + r * 0.5, y - r * 0.45, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Soft distant canopy band behind everything at the bottom. */
function drawBackCanopy(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.canopyBack;
  blobBand(ctx, WORLD.height - 320, 90, 7);
  ctx.fillStyle = PALETTE.canopyLight;
  blobBand(ctx, WORLD.height - 240, 110, 6);
}

function blobBand(ctx: CanvasRenderingContext2D, baseY: number, r: number, count: number): void {
  ctx.beginPath();
  ctx.moveTo(0, WORLD.height);
  ctx.lineTo(0, baseY);
  for (let i = 0; i <= count; i++) {
    const x = (i / count) * WORLD.width;
    const rr = r * (0.8 + ((i * 37) % 10) / 25);
    ctx.arc(x, baseY, rr, Math.PI, 0, false);
  }
  ctx.lineTo(WORLD.width, WORLD.height);
  ctx.closePath();
  ctx.fill();
}

function drawTreehouses(ctx: CanvasRenderingContext2D): void {
  for (const h of SCENERY.houses) {
    // Wall
    ctx.fillStyle = PALETTE.houseWall;
    ctx.fillRect(h.x, h.y, h.w, h.h);
    // Side shade
    ctx.fillStyle = PALETTE.houseShade;
    ctx.fillRect(h.x + h.w * 0.72, h.y, h.w * 0.28, h.h);
    // Plank lines
    ctx.strokeStyle = PALETTE.houseDark;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.35;
    for (let i = 1; i < 4; i++) {
      const py = h.y + (h.h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(h.x, py);
      ctx.lineTo(h.x + h.w, py);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Roof (leafy mound)
    ctx.fillStyle = PALETTE.canopyMid;
    ctx.beginPath();
    ctx.moveTo(h.x - 26, h.y + 8);
    ctx.quadraticCurveTo(h.x + h.w * 0.5, h.y - h.roofH, h.x + h.w + 26, h.y + 8);
    ctx.closePath();
    ctx.fill();
    // Round window
    const wx = h.x + h.w * 0.38;
    const wy = h.y + h.h * 0.42;
    const wr = Math.min(h.w, h.h) * 0.16;
    ctx.fillStyle = PALETTE.houseDark;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.skyBottom;
    ctx.beginPath();
    ctx.arc(wx, wy, wr * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.houseDark;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wx - wr * 0.7, wy);
    ctx.lineTo(wx + wr * 0.7, wy);
    ctx.moveTo(wx, wy - wr * 0.7);
    ctx.lineTo(wx, wy + wr * 0.7);
    ctx.stroke();
  }
}

function drawTrunks(ctx: CanvasRenderingContext2D): void {
  for (const t of SCENERY.trunks) {
    ctx.fillStyle = PALETTE.trunk;
    ctx.beginPath();
    ctx.moveTo(t.base - t.width / 2, WORLD.height);
    ctx.quadraticCurveTo(
      t.base - t.width * 0.3,
      (WORLD.height + t.topY) / 2,
      t.top - t.width * 0.28,
      t.topY
    );
    ctx.lineTo(t.top + t.width * 0.28, t.topY);
    ctx.quadraticCurveTo(
      t.base + t.width * 0.45 + t.lean * 0.2,
      (WORLD.height + t.topY) / 2,
      t.base + t.width / 2,
      WORLD.height
    );
    ctx.closePath();
    ctx.fill();
    // Shaded edge
    ctx.fillStyle = PALETTE.trunkShade;
    ctx.beginPath();
    ctx.moveTo(t.base + t.width * 0.2, WORLD.height);
    ctx.quadraticCurveTo(
      t.base + t.width * 0.3 + t.lean * 0.2,
      (WORLD.height + t.topY) / 2,
      t.top + t.width * 0.12,
      t.topY
    );
    ctx.lineTo(t.top + t.width * 0.28, t.topY);
    ctx.quadraticCurveTo(
      t.base + t.width * 0.45 + t.lean * 0.2,
      (WORLD.height + t.topY) / 2,
      t.base + t.width / 2,
      WORLD.height
    );
    ctx.closePath();
    ctx.fill();
  }
}

/** Leafy clusters framing the edges and corners in front of trunks. */
function drawFrontCanopy(ctx: CanvasRenderingContext2D, time: number): void {
  const sway = Math.sin(time * 0.6) * 5;

  // Top edge garland
  leafCluster(ctx, 0, -40, 180, PALETTE.canopyDark, sway);
  leafCluster(ctx, 260, -70, 150, PALETTE.canopyMid, -sway);
  leafCluster(ctx, 520, -50, 170, PALETTE.canopyDark, sway);
  leafCluster(ctx, 800, -80, 190, PALETTE.canopyMid, -sway);
  leafCluster(ctx, 1000, -30, 160, PALETTE.canopyDeep, sway);

  // Side clusters
  leafCluster(ctx, -60, 300, 150, PALETTE.canopyDeep, sway * 0.6);
  leafCluster(ctx, 1050, 360, 170, PALETTE.canopyDark, -sway * 0.6);
  leafCluster(ctx, -70, 760, 160, PALETTE.canopyMid, sway * 0.5);
  leafCluster(ctx, 1060, 900, 180, PALETTE.canopyDeep, -sway * 0.5);

  // Canopies sitting on trunks
  for (const c of SCENERY.trunkCanopies) {
    leafCluster(ctx, c.x, c.y, c.r, PALETTE.canopyMid, sway * 0.4);
    leafCluster(ctx, c.x - c.r * 0.4, c.y - c.r * 0.35, c.r * 0.7, PALETTE.canopyLight, sway * 0.3);
  }
  // Mid foliage mound near center-left houses
  const m = SCENERY.midFoliage;
  leafCluster(ctx, m.x, m.y, m.r, PALETTE.canopyDark, sway * 0.4);
  leafCluster(ctx, m.x + 60, m.y - 40, m.r * 0.6, PALETTE.canopyMid, -sway * 0.3);

  // Bottom foreground band
  ctx.fillStyle = PALETTE.canopyDeep;
  blobBand(ctx, WORLD.height - 90, 80, 8);
  ctx.fillStyle = PALETTE.canopyDark;
  blobBand(ctx, WORLD.height - 35, 60, 9);
}

function leafCluster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  sway: number
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + sway, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.7 + sway, y + r * 0.3, r * 0.65, 0, Math.PI * 2);
  ctx.arc(x - r * 0.7 + sway, y + r * 0.32, r * 0.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.2 + sway, y + r * 0.55, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

/** Letterbox bar color used by the app outside the world rect. */
export const LETTERBOX_COLOR = PALETTE.letterbox;

/** Mild vignette of hanging leaves re-usable on menus. */
export function drawMenuBackdrop(ctx: CanvasRenderingContext2D, time: number): void {
  drawScenery(ctx, time);
}

export const CLOUD_COUNT = VISUALS.backgroundCloudCount;
