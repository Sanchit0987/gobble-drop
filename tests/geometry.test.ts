import { describe, it, expect } from "vitest";
import { segmentsIntersect, pointSegmentDistance, sweptCircleHitsSegment } from "../src/engine/geometry";

describe("segmentsIntersect", () => {
  it("detects a clean crossing", () => {
    expect(
      segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })
    ).toBe(true);
  });

  it("rejects parallel non-touching segments", () => {
    expect(
      segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })
    ).toBe(false);
  });

  it("rejects segments that would only cross if extended", () => {
    expect(
      segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 10, y: 0 }, { x: 10, y: 10 })
    ).toBe(false);
  });

  it("accepts an endpoint touch", () => {
    expect(
      segmentsIntersect({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 5, y: 5 }, { x: 10, y: 0 })
    ).toBe(true);
  });
});

describe("pointSegmentDistance", () => {
  it("measures perpendicular distance inside the span", () => {
    expect(pointSegmentDistance({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(3);
  });

  it("clamps to the nearest endpoint outside the span", () => {
    expect(pointSegmentDistance({ x: -4, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5);
  });

  it("handles degenerate zero-length segments", () => {
    expect(pointSegmentDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5);
  });
});

describe("sweptCircleHitsSegment", () => {
  it("hits when the travel path crosses the segment", () => {
    expect(
      sweptCircleHitsSegment({ x: 5, y: -10 }, { x: 5, y: 10 }, 1, { x: 0, y: 0 }, { x: 10, y: 0 })
    ).toBe(true);
  });

  it("hits when resting within radius of the segment", () => {
    expect(
      sweptCircleHitsSegment({ x: 5, y: 4 }, { x: 5, y: 3 }, 5, { x: 0, y: 0 }, { x: 10, y: 0 })
    ).toBe(true);
  });

  it("misses when clearly far away", () => {
    expect(
      sweptCircleHitsSegment({ x: 5, y: 100 }, { x: 5, y: 90 }, 5, { x: 0, y: 0 }, { x: 10, y: 0 })
    ).toBe(false);
  });

  it("catches fast tunneling through the segment in one step", () => {
    expect(
      sweptCircleHitsSegment({ x: 5, y: -200 }, { x: 5, y: 200 }, 2, { x: 0, y: 0 }, { x: 10, y: 0 })
    ).toBe(true);
  });
});
