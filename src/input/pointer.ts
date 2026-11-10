import { GAMEPLAY } from "../config/gameplay";
import { dist, type Vec2 } from "../engine/vec2";

export interface SwipeSegment {
  from: Vec2;
  to: Vec2;
}

export interface PointerCallbacks {
  /** Continuous swipe segments in world space while dragging. */
  onSwipeSegment(seg: SwipeSegment): void;
  /** Short press-release with little travel, in world space. */
  onTap(at: Vec2): void;
  /** Any gesture start (used to unlock audio). */
  onGestureStart(): void;
}

/** Converts a client-space point to world space (renderer provides this). */
export type ToWorld = (clientX: number, clientY: number) => Vec2;

/**
 * Unified mouse + touch input on the canvas. Tracks each active pointer and
 * emits world-space swipe segments as it moves, plus taps on quick releases.
 */
export class PointerInput {
  private active = new Map<number, { last: Vec2; start: Vec2; travelled: number }>();
  private detachFns: (() => void)[] = [];

  constructor(
    private readonly el: HTMLElement,
    private readonly toWorld: ToWorld,
    private readonly cb: PointerCallbacks
  ) {}

  attach(): void {
    const down = (e: PointerEvent) => {
      this.el.setPointerCapture?.(e.pointerId);
      const p = this.toWorld(e.clientX, e.clientY);
      this.active.set(e.pointerId, { last: p, start: p, travelled: 0 });
      this.cb.onGestureStart();
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      const state = this.active.get(e.pointerId);
      if (!state) return;
      const p = this.toWorld(e.clientX, e.clientY);
      const d = dist(state.last, p);
      if (d >= GAMEPLAY.swipeMinSegment) {
        this.cb.onSwipeSegment({ from: { ...state.last }, to: { ...p } });
        state.travelled += d;
        state.last = p;
      }
      e.preventDefault();
    };
    const up = (e: PointerEvent) => {
      const state = this.active.get(e.pointerId);
      this.active.delete(e.pointerId);
      if (!state) return;
      const p = this.toWorld(e.clientX, e.clientY);
      if (state.travelled + dist(state.last, p) <= GAMEPLAY.tapMaxTravel) {
        this.cb.onTap(p);
      }
      e.preventDefault();
    };
    const cancel = (e: PointerEvent) => {
      this.active.delete(e.pointerId);
    };

    this.el.addEventListener("pointerdown", down);
    this.el.addEventListener("pointermove", move);
    this.el.addEventListener("pointerup", up);
    this.el.addEventListener("pointercancel", cancel);
    this.detachFns = [
      () => this.el.removeEventListener("pointerdown", down),
      () => this.el.removeEventListener("pointermove", move),
      () => this.el.removeEventListener("pointerup", up),
      () => this.el.removeEventListener("pointercancel", cancel)
    ];
  }

  detach(): void {
    for (const fn of this.detachFns) fn();
    this.detachFns = [];
    this.active.clear();
  }
}
