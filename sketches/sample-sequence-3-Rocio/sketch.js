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

for (let r = 0; r < Math.ceil(canvas.height / brickH); r++) {
  const offset = r % 2 === 0 ? 0 : -brickW / 2;
  for (
    let c = r % 2 === 0 ? 0 : -1;
    c <= Math.ceil(canvas.width / brickW);
    c++
  ) {
    bricks.push({
      x: c * brickW + offset,
      y: r * brickH,
      w: brickW,
      h: brickH,
      visible: false,
      vy: 0,
    });
  }
}

setInterval(() => {
  if (buildIndex < bricks.length) {
    bricks[buildIndex].visible = true;
    buildIndex++;
  }
}, buildSpeed);

function isSupported(brick) {
  if (brick.y + brick.h >= canvas.height) return true;
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
  ctx.fillStyle = "#4599ffff";
  ctx.fillRect(0, 0, w, h);

  if (buildIndex >= bricks.length) {
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 7;
    ctx.font = "1400px TWK, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("3", w / 2, h / 2 + 80);
    ctx.fillText("3", w / 2, h / 2 + 80);
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
