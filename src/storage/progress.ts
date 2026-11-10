import { GAMEPLAY } from "../config/gameplay";

/** Persistent per-level progress: best star rating (0 = not completed). */
export interface Progress {
  /** ratings[i] is the best rating for level i+1; 0 means locked-progress not done. */
  ratings: number[];
}

const STORAGE_KEY = "gobble-drop/progress/v1";

/** Minimal storage interface so tests can inject a fake. */
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function emptyProgress(): Progress {
  return { ratings: new Array<number>(GAMEPLAY.levelCount).fill(0) };
}

export function loadProgress(storage: KVStorage): Progress {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as Progress).ratings)
    ) {
      return emptyProgress();
    }
    const ratings = (parsed as Progress).ratings
      .slice(0, GAMEPLAY.levelCount)
      .map((r) => (typeof r === "number" && r >= 0 && r <= GAMEPLAY.starsPerLevel ? Math.floor(r) : 0));
    while (ratings.length < GAMEPLAY.levelCount) ratings.push(0);
    return { ratings };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage: KVStorage, progress: Progress): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage may be unavailable (private mode); play on without saving.
  }
}

/** Record a completion; keeps the best rating. Returns the updated progress. */
export function recordCompletion(progress: Progress, levelIndex: number, rating: number): Progress {
  const ratings = progress.ratings.slice();
  const clamped = Math.max(GAMEPLAY.minRating, Math.min(GAMEPLAY.starsPerLevel, rating));
  if (clamped > (ratings[levelIndex] ?? 0)) ratings[levelIndex] = clamped;
  return { ratings };
}

/** A level is unlocked when it is first or the previous level is completed. */
export function isUnlocked(progress: Progress, levelIndex: number): boolean {
  if (levelIndex === 0) return true;
  return (progress.ratings[levelIndex - 1] ?? 0) > 0;
}

/** Total stars across all levels. */
export function totalStars(progress: Progress): number {
  return progress.ratings.reduce((sum, r) => sum + r, 0);
}
