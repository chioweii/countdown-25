import { createEngine } from "../_shared/engine.js";
import { Spring } from "../_shared/spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

let svg;
async function preload() {
  svg = await loadSvg("./assets-02/slider.svg");
  run(update);
}

preload();

let isDragging = false;
const topY = 300;
const bottomY = 1200;
let zipperPosY = topY;
let zipperHandleWidth = 80;
let zipperHandleHeight = 220;
let dragOffsetY = 0;
let centerX, centerY;
let zipperRange, openDistance;

// press f to finish
window.addEventListener("keypress", (e) => {
  if (e.key === "f") {
    finish();
  }
});

function update() {
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;

  const isOver =
    input.getX() >= centerX - zipperHandleWidth / 2 &&
    input.getX() <= centerX + zipperHandleWidth / 2 &&
    input.getY() >= zipperPosY - zipperHandleHeight / 2 &&
    input.getY() <= zipperPosY + zipperHandleHeight / 2;

  if (input.isPressed()) {
    if (isOver && !isDragging) {
      isDragging = true;
      dragOffsetY = input.getY() - zipperPosY;
    }
  } else {
    isDragging = false;
  }

  if (isDragging) {
    zipperPosY = input.getY() - dragOffsetY;
  }

  zipperPosY = math.clamp(zipperPosY, topY, bottomY);
  zipperRange = bottomY - topY;
  openDistance = zipperPosY - topY;

  // Check if zipper is fully down
  if (zipperPosY === bottomY) {
    finish();
  }

  // bg
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.fill();

  // clipping
  ctx.save();
  {
    // prepare clipping mask
    ctx.beginPath();
    drawCurve();
    ctx.clip();

    // draw clipped content

    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 100, 100, 0, 0, Math.PI * 2);
    ctx.fillStyle = "green";
    ctx.fill();
  }
  ctx.restore();

  // draw stroke

  ctx.beginPath();
  drawCurve();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.stroke();

  // zipper
  ctx.beginPath();
  // ctx.rect(
  //   centerX - zipperHandleWidth / 2,
  //   zipperPosY - zipperHandleHeight / 2,
  //   zipperHandleWidth,
  //   zipperHandleHeight
  // );
  const offsetX = math.mapClamped(openDistance, 0, 100, 0, 100);
  ctx.drawImage(
    svg,
    centerX + offsetX - zipperHandleWidth / 2,
    topY / 2 - zipperHandleHeight / 2,
    zipperHandleWidth,
    zipperHandleHeight
  );
  ctx.drawImage(
    svg,
    centerX - zipperHandleWidth / 2,
    zipperPosY - zipperHandleHeight / 2,
    zipperHandleWidth,
    zipperHandleHeight
  );
  ctx.fillStyle = "white";
  ctx.fill();
}

function drawCurve() {
  const controlX = math.mapClamped(openDistance, 0, zipperRange, 0, 100);
  ctx.moveTo(centerX, topY);
  ctx.bezierCurveTo(
    centerX - controlX,
    math.lerp(topY, zipperPosY, 0.25),
    centerX - controlX,
    math.lerp(topY, zipperPosY, 0.75),
    centerX,
    zipperPosY
  );
  ctx.lineTo(centerX, bottomY);
  ctx.lineTo(centerX, zipperPosY);
  ctx.bezierCurveTo(
    centerX + controlX,
    math.lerp(topY, zipperPosY, 0.75),
    centerX + controlX,
    math.lerp(topY, zipperPosY, 0.25),
    centerX,
    topY
  );
}

async function loadSvg(path) {
  return new Promise((resolve, reject) => {
    const svg = document.createElement("img");
    svg.src = path;
    svg.addEventListener("load", (e) => {
      resolve(svg);
      console.log("loaded" + path);
    });
  });
}
