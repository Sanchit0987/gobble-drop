import { describe, it, expect } from "vitest";
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  recordCompletion,
  isUnlocked,
  totalStars,
  type KVStorage
} from "../src/storage/progress";
import { GAMEPLAY } from "../src/config/gameplay";

function fakeStorage(initial: Record<string, string> = {}): KVStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => {
      data[k] = v;
    }
  };
}

describe("progress storage", () => {
  it("starts empty with every level unrated", () => {
    const p = emptyProgress();
    expect(p.ratings).toHaveLength(GAMEPLAY.levelCount);
    expect(p.ratings.every((r) => r === 0)).toBe(true);
  });

  it("round-trips through storage", () => {
    const storage = fakeStorage();
    let p = emptyProgress();
    p = recordCompletion(p, 0, 3);
    p = recordCompletion(p, 1, 2);
    saveProgress(storage, p);
    const loaded = loadProgress(storage);
    expect(loaded.ratings[0]).toBe(3);
    expect(loaded.ratings[1]).toBe(2);
  });

  it("keeps the best rating per level", () => {
    let p = emptyProgress();
    p = recordCompletion(p, 2, 3);
    p = recordCompletion(p, 2, 1);
    expect(p.ratings[2]).toBe(3);
  });

  it("clamps ratings to the valid range and guarantees the minimum", () => {
    let p = emptyProgress();
    p = recordCompletion(p, 0, 0);
    expect(p.ratings[0]).toBe(GAMEPLAY.minRating);
    p = recordCompletion(p, 1, 99);
    expect(p.ratings[1]).toBe(GAMEPLAY.starsPerLevel);
  });

  it("unlocks level 1 always and later levels on completion", () => {
    let p = emptyProgress();
    expect(isUnlocked(p, 0)).toBe(true);
    expect(isUnlocked(p, 1)).toBe(false);
    p = recordCompletion(p, 0, 1);
    expect(isUnlocked(p, 1)).toBe(true);
    expect(isUnlocked(p, 2)).toBe(false);
  });

  it("survives corrupted storage data", () => {
    const storage = fakeStorage({ "gobble-drop/progress/v1": "not json {{" });
    const p = loadProgress(storage);
    expect(p.ratings.every((r) => r === 0)).toBe(true);

    const weird = fakeStorage({
      "gobble-drop/progress/v1": JSON.stringify({ ratings: [7, -2, "x", 2] })
    });
    const q = loadProgress(weird);
    expect(q.ratings[0]).toBe(0); // 7 out of range
    expect(q.ratings[1]).toBe(0);
    expect(q.ratings[2]).toBe(0);
    expect(q.ratings[3]).toBe(2);
    expect(q.ratings).toHaveLength(GAMEPLAY.levelCount);
  });

  it("totals stars across levels", () => {
    let p = emptyProgress();
    p = recordCompletion(p, 0, 3);
    p = recordCompletion(p, 1, 2);
    expect(totalStars(p)).toBe(5);
  });
});
