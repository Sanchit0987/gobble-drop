import { App } from "./game/app";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
const uiRoot = document.getElementById("ui-root");

if (!canvas || !uiRoot) {
  throw new Error("Gobble Drop: missing #game-canvas or #ui-root in index.html");
}

new App(canvas, uiRoot).start();
