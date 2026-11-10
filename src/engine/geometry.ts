import type { Vec2 } from "./vec2";

/**
 * Segment/segment intersection test (proper crossing, inclusive of touches).
 * Used for swipe-vs-rope cutting and candy-vs-spike sweep tests.
 */
export function segmentsIntersect(p1: Vec2, p2: Vec2, q1: Vec2, q2: Vec2): boolean {
  const d1 = cross(q2, q1, p1);
  const d2 = cross(q2, q1, p2);
  const d3 = cross(p2, p1, q1);
  const d4 = cross(p2, p1, q2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  if (d1 === 0 && onSegment(q2, q1, p1)) return true;
  if (d2 === 0 && onSegment(q2, q1, p2)) return true;
  if (d3 === 0 && onSegment(p2, p1, q1)) return true;
  if (d4 === 0 && onSegment(p2, p1, q2)) return true;
  return false;
}

function cross(a: Vec2, b: Vec2, c: Vec2): number {
  return (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
}

function onSegment(a: Vec2, b: Vec2, c: Vec2): boolean {
  return (
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y)
  );
}

/** Shortest distance from point p to segment [a, b]. */
export function pointSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

/** True when a moving circle (from -> to, radius r) hits segment [a, b]. */
export function sweptCircleHitsSegment(
  from: Vec2,
  to: Vec2,
  r: number,
  a: Vec2,
  b: Vec2
): boolean {
  if (segmentsIntersect(from, to, a, b)) return true;
  if (pointSegmentDistance(from, a, b) <= r) return true;
  if (pointSegmentDistance(to, a, b) <= r) return true;
  // Segment endpoints near the travel path also count.
  if (pointSegmentDistance(a, from, to) <= r) return true;
  if (pointSegmentDistance(b, from, to) <= r) return true;
  return false;
}
