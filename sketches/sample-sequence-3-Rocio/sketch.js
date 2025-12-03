import { createEngine } from "../_shared/engine.js";
const { finish } = createEngine();

const canvas = document.getElementById("wall");
const ctx = canvas.getContext("2d");

const dpr = window.devicePixelRatio || 1;
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
ctx.scale(dpr, dpr);

const brickW = 300,
  brickH = 78;
const bricks = [];
let buildIndex = 0;
const buildSpeed = 5;
let brickCounter = 0;
let numberOpacity = 1; // Track opacity of the "3"

// Only generate bricks for visible viewport
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;
const maxVisibleHeight = viewportHeight;

for (let r = 0; r < Math.ceil(viewportHeight / brickH); r++) {
  const offset = r % 2 === 0 ? 0 : -brickW / 2;
  for (
    let c = r % 2 === 0 ? 0 : -1;
    c <= Math.ceil(viewportWidth / brickW);
    c++
  ) {
    const x = c * brickW + offset;
    // Only add brick if it's within the visible viewport
    if (x + brickW > 0 && x < viewportWidth) {
      bricks.push({
        x: x,
        y: r * brickH,
        w: brickW,
        h: brickH,
        visible: false,
        vy: 0,
        // index: brickCounter++,
      });
    }
  }
}

setInterval(() => {
  if (buildIndex < bricks.length) {
    bricks[buildIndex].visible = true;
    buildIndex++;
  }
}, buildSpeed);

function isSupported(brick) {
  if (brick.y + brick.h >= maxVisibleHeight) return true;
  for (let b of bricks) {
    if (
      b.visible &&
      b !== brick &&
      b.y + b.h >= brick.y + brick.h - 1 &&
      b.y + b.h <= brick.y + brick.h + 1 &&
      brick.x < b.x + b.w &&
      brick.x + brick.w > b.x
    )
      return true;
  }
  return false;
}

function update() {
  if (buildIndex < bricks.length) return;
  bricks.forEach((brick) => {
    if (!brick.visible) return;
    if (!isSupported(brick)) brick.vy += 0.5;
    else brick.vy = 0;
    brick.y += brick.vy;

    for (let b of bricks) {
      if (
        b.visible &&
        b !== brick &&
        brick.y + brick.h > b.y &&
        brick.y < b.y + b.h &&
        brick.x < b.x + b.w &&
        brick.x + brick.w > b.x
      ) {
        brick.y = b.y - brick.h;
        brick.vy = 0;
      }
    }
  });
}

function draw() {
  const w = window.innerWidth,
    h = window.innerHeight;
  ctx.fillStyle = "#000000ff";
  ctx.fillRect(0, 0, w, h);

  // Check if all bricks are gone
  const visibleBricks = bricks.filter((b) => b.visible);
  if (buildIndex >= bricks.length && visibleBricks.length === 0) {
    // All bricks are gone, fade out the number
    if (numberOpacity > 0) {
      numberOpacity = Math.max(0, numberOpacity - 0.02);
    }
  }

  if (buildIndex >= bricks.length && numberOpacity > 0) {
    ctx.globalAlpha = numberOpacity;
    ctx.fillStyle = "white";
    ctx.font = "1400px TWK, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeText("3", w / 2, h / 2 + 80);
    ctx.fillText("3", w / 2, h / 2 + 80);
    ctx.globalAlpha = 1;
  }

  bricks
    .filter((b) => b.visible)
    .sort((a, b) => a.y - b.y)
    .forEach((brick) => {
      ctx.fillStyle = "#932730";
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);

      // // Draw brick index number
      // ctx.fillStyle = "white";
      // ctx.font = "bold 32px Arial, sans-serif";
      // ctx.textAlign = "center";
      // ctx.textBaseline = "middle";
      // ctx.fillText(brick.index, brick.x + brick.w / 2, brick.y + brick.h / 2);
    });
}

function animate() {
  update();
  draw();
  requestAnimationFrame(animate);
}

animate();

canvas.addEventListener("mousemove", (e) => {
  if (buildIndex < bricks.length) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left,
    y = e.clientY - rect.top;
  for (let brick of bricks) {
    if (
      brick.visible &&
      x >= brick.x &&
      x <= brick.x + brick.w &&
      y >= brick.y &&
      y <= brick.y + brick.h
    ) {
      brick.visible = false;
      break;
    }
  }
});
