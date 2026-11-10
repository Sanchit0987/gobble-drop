import { GAMEPLAY } from "../config/gameplay";
import { LEVELS } from "../game/levels";
import { isUnlocked, totalStars, type Progress } from "../storage/progress";

/** DOM screen builder. The app swaps screens inside #ui-root. */
export interface ScreenCallbacks {
  onPlay(): void;
  onSelectLevel(index: number): void;
  onBackToMenu(): void;
  onResume(): void;
  onRestart(): void;
  onNextLevel(): void;
  onLevelSelect(): void;
}

export class Screens {
  constructor(
    private readonly root: HTMLElement,
    private readonly cb: ScreenCallbacks
  ) {}

  clear(): void {
    this.root.innerHTML = "";
    this.root.classList.remove("blocking");
  }

  private show(el: HTMLElement, blocking: boolean): void {
    this.clear();
    if (blocking) this.root.classList.add("blocking");
    this.root.appendChild(el);
  }

  mainMenu(progress: Progress): void {
    const el = div("screen menu");
    el.innerHTML = `
      <h1 class="title">Gobble<span class="accent">Drop</span></h1>
      <p class="tagline">Feed Pip the hungry critter!</p>
      <div class="star-total">★ ${totalStars(progress)} / ${GAMEPLAY.levelCount * GAMEPLAY.starsPerLevel}</div>
    `;
    el.appendChild(button("Play", "primary", () => this.cb.onPlay()));
    el.appendChild(button("Level Select", "secondary", () => this.cb.onLevelSelect()));
    this.show(el, true);
  }

  /**
   * Adventure-map level select: a winding dotted trail over a leafy map,
   * with a round node per level, star pips, and locks on unreached levels.
   */
  levelSelect(progress: Progress): void {
    const el = div("screen level-map");
    el.innerHTML = `<h2>Adventure Map</h2>`;

    const mapW = 460;
    const rowH = 110;
    const margin = 70;
    const rows = Math.ceil(LEVELS.length / 3);
    const mapH = rows * rowH + margin;

    // Serpentine node positions: 3 per row, alternating direction.
    const nodes = LEVELS.map((_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = row % 2 === 0 ? col : 2 - col;
      return {
        x: margin + (x * (mapW - margin * 2)) / 2,
        y: mapH - margin - row * rowH + (col === 1 ? -14 : 0)
      };
    });

    const path = nodes
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = nodes[i - 1]!;
        const mx = (prev.x + p.x) / 2;
        const my = (prev.y + p.y) / 2 + (i % 2 === 0 ? 18 : -18);
        return `Q ${mx} ${my} ${p.x} ${p.y}`;
      })
      .join(" ");

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${mapW} ${mapH}`);
    svg.classList.add("map-svg");

    // Decorative leafy patches
    for (let i = 0; i < 7; i++) {
      const blob = document.createElementNS(svgNS, "ellipse");
      blob.setAttribute("cx", String(((i * 173) % (mapW - 80)) + 40));
      blob.setAttribute("cy", String(((i * 311) % (mapH - 120)) + 60));
      blob.setAttribute("rx", String(46 + ((i * 29) % 30)));
      blob.setAttribute("ry", String(30 + ((i * 17) % 22)));
      blob.setAttribute("class", "map-blob");
      svg.appendChild(blob);
    }

    // Dotted trail
    const trail = document.createElementNS(svgNS, "path");
    trail.setAttribute("d", path);
    trail.setAttribute("class", "map-trail");
    svg.appendChild(trail);

    const board = div("map-board");
    board.style.aspectRatio = `${mapW} / ${mapH}`;
    board.appendChild(svg);

    LEVELS.forEach((level, i) => {
      const unlocked = isUnlocked(progress, i);
      const rating = progress.ratings[i] ?? 0;
      const node = document.createElement("button");
      node.className = `map-node ${unlocked ? "" : "locked"} ${rating > 0 ? "done" : ""}`;
      node.disabled = !unlocked;
      node.style.left = `${(nodes[i]!.x / mapW) * 100}%`;
      node.style.top = `${(nodes[i]!.y / mapH) * 100}%`;
      const pips = `<span class="pips">${"★".repeat(rating)}${"☆".repeat(
        GAMEPLAY.starsPerLevel - rating
      )}</span>`;
      node.innerHTML = unlocked
        ? `<span class="num">${i + 1}</span>${pips}`
        : `<span class="num lock">🔒</span>`;
      node.title = unlocked ? level.name : "Locked";
      node.addEventListener("click", () => this.cb.onSelectLevel(i));
      board.appendChild(node);
    });

    el.appendChild(board);
    el.appendChild(button("Back", "secondary", () => this.cb.onBackToMenu()));
    this.show(el, true);
  }

  pause(): void {
    const el = div("screen overlay");
    el.innerHTML = `<h2>Paused</h2>`;
    el.appendChild(button("Resume", "primary", () => this.cb.onResume()));
    el.appendChild(button("Restart", "secondary", () => this.cb.onRestart()));
    el.appendChild(button("Level Select", "secondary", () => this.cb.onLevelSelect()));
    this.show(el, true);
  }

  win(rating: number, levelIndex: number): void {
    const el = div("screen overlay");
    const stars = "★".repeat(rating) + "☆".repeat(GAMEPLAY.starsPerLevel - rating);
    const last = levelIndex >= GAMEPLAY.levelCount - 1;
    el.innerHTML = `
      <h2>Yum!</h2>
      <div class="rating">${stars}</div>
      <p>${last ? "Pip is stuffed — you finished every level!" : "Pip wants more!"}</p>
    `;
    if (!last) el.appendChild(button("Next Level", "primary", () => this.cb.onNextLevel()));
    el.appendChild(button("Replay", "secondary", () => this.cb.onRestart()));
    el.appendChild(button("Level Select", "secondary", () => this.cb.onLevelSelect()));
    this.show(el, true);
  }

  lose(reason: "spikes" | "escape"): void {
    const el = div("screen overlay");
    el.innerHTML = `
      <h2>${reason === "spikes" ? "Crunch!" : "Whoops!"}</h2>
      <p>${reason === "spikes" ? "The candy shattered on the spikes." : "The candy got away. Pip is still hungry!"}</p>
    `;
    el.appendChild(button("Try Again", "primary", () => this.cb.onRestart()));
    el.appendChild(button("Level Select", "secondary", () => this.cb.onLevelSelect()));
    this.show(el, true);
  }

  /** Non-blocking in-game HUD with pause/restart buttons and star counter. */
  hud(levelIndex: number, levelName: string, hint: string | undefined, onPause: () => void, onRestart: () => void): {
    setStars(n: number): void;
  } {
    const el = div("hud");
    const starsEl = div("hud-stars");
    starsEl.textContent = "☆☆☆";
    const title = div("hud-title");
    title.textContent = `${levelIndex + 1}. ${levelName}`;
    const buttons = div("hud-buttons");
    const pauseBtn = button("⏸", "hud-btn", onPause);
    const restartBtn = button("↻", "hud-btn", onRestart);
    buttons.append(pauseBtn, restartBtn);
    el.append(title, starsEl, buttons);
    if (hint) {
      const hintEl = div("hud-hint");
      hintEl.textContent = hint;
      el.appendChild(hintEl);
      setTimeout(() => hintEl.classList.add("fade"), 3500);
    }
    this.show(el, false);
    return {
      setStars(n: number): void {
        starsEl.textContent = "★".repeat(n) + "☆".repeat(GAMEPLAY.starsPerLevel - n);
      }
    };
  }
}

function div(className: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = className;
  return el;
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const el = document.createElement("button");
  el.className = `btn ${className}`;
  el.textContent = label;
  el.addEventListener("click", onClick);
  return el;
}
