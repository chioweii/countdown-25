import { createEngine } from "../_shared/engine.js";
import { Spring } from "../_shared/spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

let svg;
let topSvg;
let openSvg; // added: you were loading this later
let zipperSound; // sound for zipper sliding

//load svg images
async function preload() {
  svg = await loadSvg("./assets-02/slider.svg");
  topSvg = await loadSvg("./assets-02/zipper-fly.svg");
  run(update);
  openSvg = await loadSvg("./assets-02/zipper-fly-open-.svg");

  // load zipper sound
  // make sure "./assets-02/zipper-sound.mp3" exists or change this path
  zipperSound = new Audio("./assets-02/zipper-sound.mp3");
  zipperSound.loop = true; // continuous while dragging
}

preload();

let isDragging = false;
let isTopSvgDragging = false;
let topSvgOffsetX = 0;
let topSvgDragOffsetX = 0;
const topY = 300;
const bottomY = 1200;
let zipperPosY = topY;
let zipperHandleWidth = 80;
let zipperHandleHeight = 220;
let dragOffsetY = 0;
let centerX, centerY;
let zipperRange, openDistance;
const topImageWidth = 250;
const topImageHeight = 1100;

// ============ TRANSITIONS ============
let transitionTime = 0;
const transitionDuration = 2.5; // duration in seconds
let transitionActive = true;

// ============ FINAL STATE FLAG ============
let showOnlyNumberOne = false; // when true: only black bg + big "1" are drawn

// ============ NUMBER ZOOM / FADE TRANSITION ============
let numberTransitionActive = false;
let numberTransitionTime = 0;
const numberTransitionDuration = 1.5; // seconds
const initialFontSize = 990;
const finalFontSize = 2799;
let pendingNumberTransition = false; // Flag to start transition on next frame

// ============ NUMBER FADE OUT ============
const oneFadeDuration = 1000; // ms
let oneFadeStart = null;
let oneOpacity = 1;
let numberFadeActive = false;

// ============ SOUND HELPERS ============
function playZipperSound() {
  if (!zipperSound) return;
  if (zipperSound.paused) {
    // reset to start and play
    zipperSound.currentTime = 0;
    zipperSound.play().catch(() => {
      // ignore play() errors (browser autoplay policies etc.)
    });
  }
}

function stopZipperSound() {
  if (!zipperSound) return;
  zipperSound.pause();
  zipperSound.currentTime = 0;
}
// =======================================

// TRANSITION 1: Slide in from left to right

function transitionSlideInFromLeft() {
  if (transitionTime < transitionDuration) {
    transitionTime += 0.016; // approximate frame time (~60fps)
    const progress = transitionTime / transitionDuration;
    const slideAmount = math.lerp(-canvas.width - 400, 0, progress); // Start even further left
    return slideAmount;
  } else {
    transitionActive = false;
    return 0;
  }
}

// ============ END TRANSITIONS ============
window.addEventListener("keypress", (e) => {
  if (e.key === "f") {
    finish();
  }
});

function update() {
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;

  // Check if we should start the pending transition
  if (pendingNumberTransition && !input.isPressed()) {
    numberTransitionActive = true;
    numberTransitionTime = 0;
    pendingNumberTransition = false;
  }

  // ============ APPLY TRANSITIONS ============
  let slideOffsetX = 0;
  if (transitionActive) {
    slideOffsetX = transitionSlideInFromLeft();
  }
  // ============ END TRANSITION APPLICATION ============

  // ============ FINAL STATE: ONLY BLACK BG + BIG "1" ============
  if (showOnlyNumberOne) {
    // make sure sound is stopped in final state
    stopZipperSound();

    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fill();

    // Handle fade-out if active
    if (numberFadeActive) {
      const currentTime = Date.now();
      const elapsed = currentTime - oneFadeStart;
      oneOpacity = Math.max(0, 1 - elapsed / oneFadeDuration);

      if (oneOpacity <= 0) {
        numberFadeActive = false;
        finish(); // End the sketch
      }
    }

    // Draw the "1" at final size with fade opacity
    ctx.globalAlpha = oneOpacity;
    ctx.font = finalFontSize + "px TWK";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1", canvas.width / 2, canvas.height / 2 + 150);
    ctx.globalAlpha = 1; // Reset alpha

    // Start fade-out if clicked and not already fading
    if (input.isPressed() && !numberFadeActive) {
      numberFadeActive = true;
      oneFadeStart = Date.now();
    }

    return; // skip all other drawing / input logic
  }
  // ============ END FINAL STATE BLOCK ============

  // ============ NUMBER ZOOM / BLUE FADE TRANSITION ============
  if (numberTransitionActive) {
    numberTransitionTime += 0.016; // approx frame time
    let t = numberTransitionTime / numberTransitionDuration;
    t = math.clamp(t, 0, 1);

    const fadeAlpha = 1 - t; // 1 -> 0
    const fontSize = math.lerp(initialFontSize, finalFontSize, t);

    // make sure sound is stopped during this transition
    stopZipperSound();

    // Black background
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fill();

    // Fade out the whole blue scene / zipper / etc.
    drawScene(slideOffsetX, fadeAlpha);

    // Draw growing "1" on top (full alpha, not clipped)
    ctx.font = fontSize + "px TWK";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1", canvas.width / 2, canvas.height / 2 + 150); //one centered vertically

    // When transition is done, go to final static state
    if (t >= 1) {
      numberTransitionActive = false;
      showOnlyNumberOne = true;
    }

    return; // don't process input or normal drawing while animating
  }
  // ============ END NUMBER ZOOM / BLUE FADE TRANSITION ============

  const isOver =
    input.getX() >= centerX - zipperHandleWidth / 2 &&
    input.getX() <= centerX + zipperHandleWidth / 2 &&
    input.getY() >= zipperPosY - zipperHandleHeight / 2 &&
    input.getY() <= zipperPosY + zipperHandleHeight / 2;

  // Check if clicking on topSvg
  const isOverTopSvg =
    input.getX() >= centerX + topSvgOffsetX - topImageWidth / 2 &&
    input.getX() <= centerX + topSvgOffsetX + topImageWidth / 2 &&
    input.getY() >= topY - topImageHeight / 2 + 537 &&
    input.getY() <= topY - topImageHeight / 2 + 537 + topImageHeight;

  // ============ HITBOX FOR NUMBER "1" ============
  ctx.save();
  ctx.font = initialFontSize + "px TWK";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const numberText = "1";
  const metrics = ctx.measureText(numberText);
  const oneWidth = metrics.width;
  const oneHeight = initialFontSize; // approximate height using font size

  const oneCenterX = centerX - 20; // same offset as when drawing the "1"
  const oneCenterY = centerY - 210;

  const oneX = oneCenterX - oneWidth / 2;
  const oneY = oneCenterY - oneHeight / 2;

  ctx.restore();

  const isOverNumberOne =
    input.getX() >= oneX &&
    input.getX() <= oneX + oneWidth &&
    input.getY() >= oneY &&
    input.getY() <= oneY + oneHeight;
  // ============ END HITBOX FOR "1" ============

  if (input.isPressed()) {
    // If zipper is fully down and user clicks on "1", start smooth transitions
    if (
      zipperPosY === bottomY &&
      isOverNumberOne &&
      !isDragging &&
      !isTopSvgDragging &&
      !numberTransitionActive &&
      !showOnlyNumberOne &&
      !pendingNumberTransition
    ) {
      pendingNumberTransition = true;
      stopZipperSound(); // just in case
    }

    if (isOverTopSvg && !isDragging && !isTopSvgDragging) {
      isTopSvgDragging = true;
      topSvgDragOffsetX = input.getX() - (centerX + topSvgOffsetX);
    }

    if (isOver && !isDragging && !isTopSvgDragging) {
      isDragging = true;
      dragOffsetY = input.getY() - zipperPosY;

      // start zipper sound when slider starts moving
      playZipperSound();
    }
  } else {
    // mouse / touch released -> stop dragging and sound
    if (isDragging) {
      stopZipperSound();
    }

    isDragging = false;
    isTopSvgDragging = false;
  }

  if (isDragging) {
    zipperPosY = input.getY() - dragOffsetY;
  }

  // Stop dragging if mouse is released creates a ratio
  if (isTopSvgDragging) {
    topSvgOffsetX = input.getX() - topSvgDragOffsetX - centerX;
    topSvgOffsetX = math.clamp(topSvgOffsetX, 0, 230);
  }

  zipperPosY = math.clamp(zipperPosY, topY, bottomY);
  zipperRange = bottomY - topY;
  openDistance = zipperPosY - topY;

  // Check if zipper is fully down
  // if (zipperPosY === bottomY) {
  //   finish();
  // }

  // Initial black background (before transition)
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fill();

  // Draw the full scene (blue, zipper, etc) at full alpha
  drawScene(slideOffsetX, 1);
}

// Draws the blue background, zipper, clipping, stroke, etc.
// `alpha` controls how transparent the whole scene is.
function drawScene(slideOffsetX, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(slideOffsetX, 0);

  // bg
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#446eb1";
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
    ctx.fillStyle = "black";
    ctx.fill();

    // ctx.beginPath();
    // ctx.ellipse(centerX, centerY, 100, 100, 0, 0, Math.PI * 2);
    // ctx.fillStyle = "green";
    // ctx.fill();

    ctx.font = initialFontSize + "px TWK";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("1", centerX - 20, centerY - 210);
  }
  ctx.restore();

  // draw stroke

  ctx.beginPath();
  drawCurve();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.stroke();

  // horizontal line on top
  ctx.beginPath();
  ctx.moveTo(0, topY); // Start at left edge of canvas
  ctx.lineTo(canvas.width, topY); // Draw to right edge of canvas
  ctx.strokeStyle = "black"; // Line color
  ctx.lineWidth = 4; // Line thickness (same as zipper stroke)
  ctx.stroke();

  // zipper
  const ellipseWidth = 80; // Horizontal radius
  const ellipseHeight = 80; // Vertical radius (makes it oval-shaped)
  const offsetX = math.mapClamped(openDistance, 0, 100, 0, 100);

  // vertical line at center - moves with the curve
  ctx.beginPath();
  ctx.moveTo(centerX - 113 + offsetX, 0); // Start far left, moves toward center with offsetX
  ctx.lineTo(centerX - 113 + offsetX, topY); // Draw to horizontal line
  ctx.strokeStyle = "black"; // Line color
  ctx.lineWidth = 4; // Line thickness (same as zipper stroke)
  ctx.stroke();

  // rectangle
  ctx.beginPath();
  ctx.rect(centerX - 1050, topY - 300, 100, 330);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.fillStyle = "#446eb1";
  ctx.fill();
  ctx.stroke();

  // rectangle
  ctx.beginPath();
  ctx.rect(centerX + 950, topY - 300, 100, 330);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.fillStyle = "#446eb1";
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(
    centerX + offsetX,
    topY / 2,
    ellipseWidth,
    ellipseHeight,
    0,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "white";
  ctx.fill();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Clip the slider to only show area below the horizontal line
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    centerX - zipperHandleWidth / 2,
    topY,
    zipperHandleWidth,
    canvas.height - topY
  );
  ctx.clip();

  ctx.drawImage(
    svg,
    centerX - zipperHandleWidth / 2,
    zipperPosY - zipperHandleHeight / 2,
    zipperHandleWidth,
    zipperHandleHeight
  );

  ctx.restore();

  // top image fly
  ctx.drawImage(
    topSvg,
    centerX + topSvgOffsetX - topImageWidth / 2, // Center horizontally on the zipper line with offset
    topY - topImageHeight / 2 + 537.5, // Position at the top of the zipper curve
    topImageWidth,
    topImageHeight
  );

  ctx.restore(); // Restore from transition translate + alpha
}

function drawCurve() {
  const controlX = math.mapClamped(openDistance, 0, zipperRange, 0, 300);
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
