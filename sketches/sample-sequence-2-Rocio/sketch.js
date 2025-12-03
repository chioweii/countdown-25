import { createEngine } from "../_shared/engine.js";
import { Spring } from "../_shared/spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

// this is my scratch surface dimensions
var scratchWidth = 830;
var scratchHeight = 490;

//so here im creating another canvas to do my scratch effect
var scratchCanvas = document.createElement("canvas");
var scratchCtx = scratchCanvas.getContext("2d");

scratchCanvas.width = scratchWidth;
scratchCanvas.height = scratchHeight;

//here i create the scratch surface with a gradient
function initScratchSurface() {
  const gradient = scratchCtx.createLinearGradient(0, 0, 0, 0 + scratchHeight);
  gradient.addColorStop(0, "#aeaeaeff");
  gradient.addColorStop(0.25, "#ffffff");
  gradient.addColorStop(0.5, "#d2d2d2ff");
  gradient.addColorStop(0.75, "#ffffff");
  gradient.addColorStop(1, "#d2d2d2ff");

  scratchCtx.fillStyle = gradient;
  scratchCtx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
}

const checkRectX = 600;
const checkRectY = 100;
const checkRectWidth = 200;
const checkRectHeight = 300;

// fade-out animation variables
var fadeOutStartTime = null;
var fadeOutDuration = 1; // fade-out duration in seconds
var thresholdReached = false;

// track previous mouse position for smooth lines
var prevMouseX = 0;
var prevMouseY = 0;

// slide-in animation variables
var animationStartTime = Date.now() / 1000;
var animationDuration = 1; // duration of slide-in in seconds

// pixel check optimization
var frameCounter = 0;
var checkFrequency = 5; // only check pixels every 5 frames
var lastScratchProgress = 0;

//and here im loading my image
var img = new Image();
var imgLoaded = false;

// ticket position & size
var x = 0;
var y = 0;
var imageWidth = 0;
var imageHeight = 0;

img.onload = function () {
  imgLoaded = true;
  imageWidth = img.naturalWidth; //here i get the natural width and height of the image
  imageHeight = img.naturalHeight;

  var scale = 9; //this is what i use to scale the image
  imageWidth *= scale;
  imageHeight *= scale;

  x = (canvas.width - imageWidth) / 2; //and this is what i use to center the image
  y = (canvas.height - imageHeight) / 2;
  initScratchSurface();
};

img.src = "./assets-ticket/ticket.svg";

run(update);

function update(dt) {
  // number position
  var numberX = canvas.width / 2;
  var numberY = canvas.height / 2 + 350;
  var scratchX = canvas.width / 2 - scratchWidth / 2;
  var scratchY = canvas.height / 2 - scratchHeight / 2 + 285;

  //here i check if the mouse is pressed to create the scratch effect

  //   scratchCtx.save();
  //   scratchCtx.beginPath();
  //   scratchCtx.rect(checkRectX, checkRectY, checkRectWidth, checkRectHeight);
  //   scratchCtx.fillStyle = "red";
  //   scratchCtx.fill();
  //   scratchCtx.restore();

  if (input.isPressed()) {
    // Initialize position on first press
    if (prevMouseX === 0 && prevMouseY === 0) {
      prevMouseX = input.getX();
      prevMouseY = input.getY();
    }

    scratchCtx.globalCompositeOperation = "destination-out";
    scratchCtx.beginPath();
    scratchCtx.moveTo(prevMouseX - scratchX, prevMouseY - scratchY);
    scratchCtx.lineTo(input.getX() - scratchX, input.getY() - scratchY);
    scratchCtx.strokeStyle = "rgba(0,0,0,1)";
    scratchCtx.lineWidth = 20;
    scratchCtx.lineCap = "round";
    scratchCtx.lineJoin = "round";
    scratchCtx.stroke();
    scratchCtx.globalCompositeOperation = "source-over";

    // Update previous mouse position
    prevMouseX = input.getX();
    prevMouseY = input.getY();
  } else {
    // Reset position when mouse is released
    prevMouseX = 0;
    prevMouseY = 0;
  }

  // Only check pixels every 5 frames to improve performance
  frameCounter++;
  let scratchProgress = lastScratchProgress;

  if (frameCounter >= checkFrequency) {
    frameCounter = 0;
    const scratchPixels = scratchCtx.getImageData(
      checkRectX,
      checkRectY,
      checkRectWidth,
      checkRectHeight
    );
    const data = scratchPixels.data;

    let activePixelCount = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 128) {
        activePixelCount++;
      }
    }
    const totalPixelCount = data.length / 4;
    scratchProgress = 1 - activePixelCount / totalPixelCount;
    lastScratchProgress = scratchProgress;
  }

  // Check if threshold is reached and start fade-out animation
  if (scratchProgress > 0.5 && !thresholdReached) {
    thresholdReached = true;
    fadeOutStartTime = Date.now() / 1000; // convert to seconds
  }

  // Reset threshold if scratch progress goes back below 0.5
  if (scratchProgress <= 0.5 && thresholdReached) {
    thresholdReached = false;
    fadeOutStartTime = null;
  }

  // Calculate fade-out opacity based on elapsed time since threshold
  let fadeOutOpacity = 1;
  if (thresholdReached && fadeOutStartTime !== null) {
    const elapsedTime = Date.now() / 1000 - fadeOutStartTime;
    fadeOutOpacity = Math.max(0, 1 - elapsedTime / fadeOutDuration);
  }

  // Calculate slide-in animation progress (0 to 1)
  const currentTime = Date.now() / 1000;
  const slideInElapsed = currentTime - animationStartTime;
  const slideInProgress = Math.min(1, slideInElapsed / animationDuration);

  // Calculate vertical offset from top (slides down from -height to 0)
  const slideInOffset = (1 - slideInProgress) * canvas.height;

  // draw the output
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(0, slideInOffset);

  if (imgLoaded) {
    ctx.globalAlpha = fadeOutOpacity;
    ctx.drawImage(img, x, y, imageWidth, imageHeight);
    ctx.globalAlpha = 1;
  }

  //this is my number 2
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const originalX = canvas.width / 2 + 268; // original position of the number (x)
  const originalY = canvas.height / 2 + 289; // original position of the number (y)

  ctx.fillStyle = "#fff";
  ctx.font = "200px TWK, Arial, sans-serif";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Smooth scale from 1 to 9 as fadeOutOpacity goes from 1 to 0
  const scale = 1 + (1 - fadeOutOpacity) * 8;

  // Interpolate position from original to center as it scales
  const currentX = originalX + (centerX - originalX) * (1 - fadeOutOpacity);
  const currentY = originalY + (centerY - originalY) * (1 - fadeOutOpacity);

  ctx.save();
  ctx.translate(currentX, currentY);
  ctx.scale(scale, scale);
  ctx.fillText("2", 0, 0);
  ctx.strokeText("2", 0, 0);
  ctx.restore();

  ctx.globalAlpha = fadeOutOpacity;
  ctx.drawImage(scratchCanvas, scratchX, scratchY);
  ctx.globalAlpha = 1;

  ctx.restore();
}
