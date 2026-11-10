import { GAMEPLAY } from "../config/gameplay";
import { PALETTE, PARTICLES } from "../config/visuals";
import { LEVELS } from "./levels";
import { Simulation } from "./simulation";
import { Renderer } from "../render/renderer";
import { ParticleSystem } from "../render/particles";
import {
  drawBackground,
  drawRopes,
  drawAnchorTracks,
  drawCandy,
  drawStars,
  drawBubbles,
  drawSpikes,
  drawCushions,
  drawSwipeTrail,
  type TrailSegment
} from "../render/draw-world";
import {
  createPipState,
  drawPip,
  drawPipPerch,
  startEat,
  isGulping,
  gulpCandyPose,
  updatePip
} from "../render/character";
import { PointerInput } from "../input/pointer";
import { Sfx } from "../audio/sfx";
import { Screens } from "../ui/screens";
import {
  loadProgress,
  saveProgress,
  recordCompletion,
  type Progress
} from "../storage/progress";

type AppState = "menu" | "levelSelect" | "playing" | "paused" | "won" | "lost";

/** Owns the state machine, the render loop, and glue between modules. */
export class App {
  private readonly renderer: Renderer;
  private readonly screens: Screens;
  private readonly sfx = new Sfx();
  private readonly vfx = new ParticleSystem();
  private pointer: PointerInput;

  private state: AppState = "menu";
  private progress: Progress;
  private levelIndex = 0;
  private sim: Simulation | null = null;
  private pip = createPipState();
  private trail: TrailSegment[] = [];
  private hud: { setStars(n: number): void } | null = null;
  private endTimer = 0;
  private loseReason: "spikes" | "escape" = "escape";
  private lastTime = 0;
  private time = 0;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.renderer = new Renderer(canvas);
    this.progress = loadProgress(window.localStorage);
    this.screens = new Screens(uiRoot, {
      onPlay: () => this.startLevel(this.firstIncompleteLevel()),
      onSelectLevel: (i) => this.startLevel(i),
      onBackToMenu: () => this.toMenu(),
      onResume: () => this.resume(),
      onRestart: () => this.startLevel(this.levelIndex),
      onNextLevel: () => this.startLevel(this.levelIndex + 1),
      onLevelSelect: () => this.toLevelSelect()
    });
    this.pointer = new PointerInput(canvas, this.renderer.toWorld, {
      onSwipeSegment: (seg) => {
        if (this.state !== "playing" || !this.sim) return;
        this.trail.push({ from: seg.from, to: seg.to, age: 0 });
        this.sim.cut(seg.from, seg.to);
      },
      onTap: (at) => {
        if (this.state !== "playing" || !this.sim) return;
        this.sim.tap(at);
      },
      onGestureStart: () => this.sfx.unlock()
    });
  }

  start(): void {
    this.renderer.resize();
    window.addEventListener("resize", () => this.renderer.resize());
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.state === "playing") this.pause();
        else if (this.state === "paused") this.resume();
      }
    });
    this.pointer.attach();
    this.toMenu();
    requestAnimationFrame((t) => this.frame(t));
  }

  private firstIncompleteLevel(): number {
    const idx = this.progress.ratings.findIndex((r) => r === 0);
    return idx === -1 ? 0 : Math.min(idx, LEVELS.length - 1);
  }

  private toMenu(): void {
    this.state = "menu";
    this.sim = null;
    this.screens.mainMenu(this.progress);
  }

  private toLevelSelect(): void {
    this.state = "levelSelect";
    this.sim = null;
    this.screens.levelSelect(this.progress);
  }

  private startLevel(index: number): void {
    const level = LEVELS[index];
    if (!level) {
      this.toMenu();
      return;
    }
    this.levelIndex = index;
    this.sim = new Simulation(level);
    this.pip = createPipState();
    this.vfx.clear();
    this.trail = [];
    this.endTimer = 0;
    this.state = "playing";
    this.sfx.click();
    this.hud = this.screens.hud(
      index,
      level.name,
      level.hint,
      () => this.pause(),
      () => this.startLevel(this.levelIndex)
    );
  }

  private pause(): void {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.screens.pause();
  }

  private resume(): void {
    if (this.state !== "paused" || !this.sim) return;
    this.state = "playing";
    const level = LEVELS[this.levelIndex]!;
    this.hud = this.screens.hud(
      this.levelIndex,
      level.name,
      undefined,
      () => this.pause(),
      () => this.startLevel(this.levelIndex)
    );
    this.hud.setStars(this.sim.starCount);
  }

  private frame(timestamp: number): void {
    const dt = Math.min(0.1, this.lastTime === 0 ? 0 : (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    this.time += dt;

    if (this.sim && (this.state === "playing" || this.state === "won" || this.state === "lost")) {
      if (this.state === "playing") this.sim.update(dt);
      this.consumeEvents();
      this.updateEndFlow(dt);
      updatePip(
        this.pip,
        this.sim.mouth,
        this.sim.status === "playing" ? this.sim.candy.pos : null,
        dt
      );
    }

    this.vfx.update(dt);
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const seg = this.trail[i]!;
      seg.age += dt;
      if (seg.age > GAMEPLAY.swipeTrailLife) this.trail.splice(i, 1);
    }

    this.draw();
    requestAnimationFrame((t) => this.frame(t));
  }

  private consumeEvents(): void {
    if (!this.sim) return;
    for (const ev of this.sim.drainEvents()) {
      switch (ev.type) {
        case "cut":
          this.sfx.cut();
          this.vfx.burst(ev.at, PARTICLES.cutBurstCount, PARTICLES.cutBurstSpeed, [PALETTE.rope, PALETTE.ropeHighlight], "spark");
          break;
        case "star":
          this.sfx.star();
          this.vfx.burst(ev.at, PARTICLES.starBurstCount, PARTICLES.starBurstSpeed, [PALETTE.star, "#ffffff"], "star");
          this.hud?.setStars(this.sim.starCount);
          break;
        case "bubbleEnter":
          this.sfx.bubbleEnter();
          break;
        case "bubblePop":
          this.sfx.bubblePop();
          this.vfx.burst(ev.at, PARTICLES.bubblePopCount, PARTICLES.bubblePopSpeed, [PALETTE.bubbleRim], "circle");
          break;
        case "puff":
          this.sfx.puff();
          this.vfx.burst(ev.at, PARTICLES.puffCount, PARTICLES.puffSpeed, ["#ffffff", PALETTE.cushionBody], "circle");
          break;
        case "feed":
          this.sfx.feed();
          // Gulp: candy shrinks into the mouth, then Pip chews and smiles.
          startEat(this.pip, this.sim.candy.pos);
          this.vfx.burst(ev.at, PARTICLES.feedBurstCount, PARTICLES.feedBurstSpeed, [PALETTE.candyBody, PALETTE.star, "#ffffff"], "star");
          break;
        case "shatter":
          this.sfx.shatter();
          this.loseReason = "spikes";
          this.vfx.burst(ev.at, PARTICLES.shatterCount, PARTICLES.shatterSpeed, [PALETTE.candyBody, PALETTE.candyStripe], "spark");
          break;
        case "escape":
          this.sfx.escape();
          this.loseReason = "escape";
          break;
      }
    }
  }

  private updateEndFlow(dt: number): void {
    if (!this.sim || this.state !== "playing") return;
    if (this.sim.status === "playing") return;
    this.endTimer += dt;
    const delay = this.sim.status === "won" ? GAMEPLAY.winDelay : GAMEPLAY.loseDelay;
    if (this.endTimer < delay) return;
    if (this.sim.status === "won") {
      const rating = Math.max(GAMEPLAY.minRating, this.sim.starCount);
      this.progress = recordCompletion(this.progress, this.levelIndex, rating);
      saveProgress(window.localStorage, this.progress);
      this.state = "won";
      this.screens.win(rating, this.levelIndex);
    } else {
      this.state = "lost";
      this.screens.lose(this.loseReason);
    }
  }

  private draw(): void {
    const ctx = this.renderer.ctx;
    this.renderer.beginScreen();
    ctx.fillStyle = PALETTE.letterbox;
    ctx.fillRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);

    this.renderer.beginWorld();
    drawBackground(ctx, this.time);

    if (this.sim) {
      drawAnchorTracks(ctx, this.sim);
      drawSpikes(ctx, this.sim);
      drawCushions(ctx, this.sim, this.time);
      drawPipPerch(ctx, this.sim.level.pip);
      drawPip(ctx, this.sim.level.pip, this.pip);
      drawStars(ctx, this.sim, this.time);
      drawRopes(ctx, this.sim);
      drawBubbles(ctx, this.sim, this.time);
      this.drawCandyLayer(ctx);
      drawSwipeTrail(ctx, this.trail);
    }

    this.vfx.draw(ctx);
  }

  /** Candy rendering across states: normal, gulping into Pip, or gone. */
  private drawCandyLayer(ctx: CanvasRenderingContext2D): void {
    if (!this.sim) return;
    if (this.sim.status === "lost" || this.state === "lost") return;
    if (this.sim.status === "won") {
      // Eat animation: shrink toward the mouth, then nothing (Pip chews).
      const pose = gulpCandyPose(this.pip, this.sim.mouth);
      if (pose && isGulping(this.pip)) {
        drawCandy(ctx, pose.pos, this.time, pose.scale);
      }
      return;
    }
    drawCandy(ctx, this.sim.candy.pos, this.time);
  }
}
