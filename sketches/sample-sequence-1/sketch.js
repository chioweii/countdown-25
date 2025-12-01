import { createEngine } from "../_shared/engine.js";
import { Spring } from "../_shared/spring.js";

const canvas = document.getElementById("wall");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const brickW = 300;
const brickH = 78;

const bricks = [];

const rows = Math.ceil(canvas.height / brickH);
const cols = Math.ceil(canvas.width / brickW);

for (let r = 0; r < rows; r++) {
  const offset = r % 2 === 0 ? 0 : -brickW / 2;
  const startCol = r % 2 === 0 ? 0 : -1;

  for (let c = startCol; c <= cols; c++) {
    let x = c * brickW + offset;
    let y = r * brickH;

    bricks.push({ x, y, w: brickW, h: brickH });
  }
}

ctx.fillStyle = "#932730";
bricks.forEach((brick) => {
  ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
});

ctx.strokeStyle = "black";
ctx.lineWidth = 2;

bricks.forEach((brick) => {
  ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
});

ctx.fillStyle = "black";
ctx.font = "900px helvetica";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("3", canvas.width / 2, canvas.height / 2 + 30);
