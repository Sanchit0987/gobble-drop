import { describe, it, expect } from "vitest";
import { Simulation } from "../src/game/simulation";
import { PHYSICS } from "../src/config/physics";
import { GAMEPLAY } from "../src/config/gameplay";
import type { LevelData } from "../src/game/types";

const DT = PHYSICS.fixedDt;

function runSteps(sim: Simulation, steps: number): void {
  for (let i = 0; i < steps && sim.status === "playing"; i++) sim.step(DT);
}

function baseLevel(overrides: Partial<LevelData> = {}): LevelData {
  return {
    name: "Test",
    candy: { x: 500, y: 300 },
    pip: { x: 500, y: 1100 },
    ropes: [{ anchor: { x: 500, y: 100 } }],
    stars: [
      { x: 500, y: 500 },
      { x: 500, y: 700 },
      { x: 500, y: 900 }
    ],
    ...overrides
  };
}

describe("Simulation core flow", () => {
  it("candy stays tethered until cut", () => {
    const sim = new Simulation(baseLevel());
    runSteps(sim, 240);
    expect(sim.candyTethered).toBe(true);
    expect(sim.status).toBe("playing");
  });

  it("cut -> fall -> collect stars -> feed Pip wins with 3 stars", () => {
    const sim = new Simulation(baseLevel());
    sim.cut({ x: 400, y: 200 }, { x: 600, y: 200 });
    expect(sim.candyTethered).toBe(false);
    runSteps(sim, 2400);
    expect(sim.status).toBe("won");
    expect(sim.starCount).toBe(GAMEPLAY.starsPerLevel);
    const types = sim.events.map((e) => e.type);
    expect(types).toContain("feed");
  });

  it("candy leaving the world loses with an escape event", () => {
    const sim = new Simulation(
      baseLevel({ pip: { x: 100, y: 200 }, stars: [], candy: { x: 900, y: 1200 } })
    );
    // Rope runs diagonally from (500,100) to (900,1200); cross it mid-span.
    sim.cut({ x: 500, y: 650 }, { x: 1000, y: 650 });
    runSteps(sim, 2400);
    expect(sim.status).toBe("lost");
    expect(sim.events.map((e) => e.type)).toContain("escape");
  });

  it("spikes shatter the candy", () => {
    const sim = new Simulation(
      baseLevel({
        pip: { x: 100, y: 1300 },
        stars: [],
        spikes: [{ a: { x: 300, y: 800 }, b: { x: 700, y: 800 } }]
      })
    );
    sim.cut({ x: 400, y: 200 }, { x: 600, y: 200 });
    runSteps(sim, 2400);
    expect(sim.status).toBe("lost");
    expect(sim.events.map((e) => e.type)).toContain("shatter");
  });
});

describe("Bubbles", () => {
  it("catches the falling candy and lifts it", () => {
    const sim = new Simulation(
      baseLevel({
        pip: { x: 100, y: 1300 },
        stars: [],
        bubbles: [{ pos: { x: 500, y: 700 } }]
      })
    );
    sim.cut({ x: 400, y: 200 }, { x: 600, y: 200 });
    for (let i = 0; i < 2400 && !sim.events.some((e) => e.type === "bubbleEnter"); i++) {
      sim.step(DT);
    }
    expect(sim.events.map((e) => e.type)).toContain("bubbleEnter");
    const yAfterCatch = sim.candy.pos.y;
    // The candy dips briefly on capture (it keeps momentum), then buoyancy
    // wins; after ~2.5s it must be clearly above the catch height.
    runSteps(sim, 300);
    expect(sim.candy.pos.y).toBeLessThan(yAfterCatch);
  });

  it("floating off the top of the world loses (escape)", () => {
    const sim = new Simulation(
      baseLevel({
        pip: { x: 100, y: 1300 },
        stars: [],
        bubbles: [{ pos: { x: 500, y: 700 } }]
      })
    );
    sim.cut({ x: 400, y: 200 }, { x: 600, y: 200 });
    runSteps(sim, 4800);
    expect(sim.status).toBe("lost");
    expect(sim.events.map((e) => e.type)).toContain("escape");
  });

  it("tapping the held bubble pops it and drops the candy", () => {
    const sim = new Simulation(
      baseLevel({
        pip: { x: 100, y: 1300 },
        stars: [],
        bubbles: [{ pos: { x: 500, y: 700 } }]
      })
    );
    sim.cut({ x: 400, y: 200 }, { x: 600, y: 200 });
    // Step until the bubble catches the candy, then a short settle.
    for (let i = 0; i < 2400 && !sim.events.some((e) => e.type === "bubbleEnter"); i++) {
      sim.step(DT);
    }
    runSteps(sim, 30);
    sim.tap({ ...sim.candy.pos });
    expect(sim.events.map((e) => e.type)).toContain("bubblePop");
    const yAtPop = sim.candy.pos.y;
    runSteps(sim, 240);
    expect(sim.candy.pos.y).toBeGreaterThan(yAtPop);
  });
});

describe("Air cushions", () => {
  it("a puff pushes the candy along the cushion direction", () => {
    const sim = new Simulation(
      baseLevel({
        pip: { x: 100, y: 1300 },
        stars: [],
        ropes: [{ anchor: { x: 500, y: 100 } }],
        airCushions: [{ pos: { x: 300, y: 420 }, angleDeg: 0 }]
      })
    );
    runSteps(sim, 120);
    const xBefore = sim.candy.pos.x;
    sim.tap({ x: 300, y: 420 });
    expect(sim.events.map((e) => e.type)).toContain("puff");
    runSteps(sim, 120);
    expect(sim.candy.pos.x).toBeGreaterThan(xBefore);
  });

  it("cushions respect their cooldown", () => {
    const sim = new Simulation(
      baseLevel({ stars: [], airCushions: [{ pos: { x: 300, y: 420 }, angleDeg: 0 }] })
    );
    sim.tap({ x: 300, y: 420 });
    sim.tap({ x: 300, y: 420 });
    const puffs = sim.events.filter((e) => e.type === "puff");
    expect(puffs).toHaveLength(1);
  });
});

describe("Moving anchors", () => {
  it("oscillates the anchor between its endpoints", () => {
    const sim = new Simulation(
      baseLevel({
        stars: [],
        ropes: [
          {
            anchor: { x: 200, y: 100 },
            moving: { to: { x: 800, y: 100 }, period: 2 }
          }
        ]
      })
    );
    const anchor = sim.ropes[0]!.anchor;
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < Math.round(2 / DT); i++) {
      sim.step(DT);
      minX = Math.min(minX, anchor.pos.x);
      maxX = Math.max(maxX, anchor.pos.x);
    }
    expect(minX).toBeLessThan(260);
    expect(maxX).toBeGreaterThan(740);
  });
});

describe("Star collection", () => {
  it("collects only stars within reach and counts them once", () => {
    const sim = new Simulation(
      baseLevel({
        pip: { x: 100, y: 1300 },
        stars: [
          { x: 500, y: 600 },
          { x: 50, y: 50 }
        ]
      })
    );
    sim.cut({ x: 400, y: 200 }, { x: 600, y: 200 });
    runSteps(sim, 1200);
    expect(sim.starCount).toBe(1);
    const starEvents = sim.events.filter((e) => e.type === "star");
    expect(starEvents).toHaveLength(1);
  });
});
