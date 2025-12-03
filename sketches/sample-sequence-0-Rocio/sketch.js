import { createEngine } from "../_shared/engine.js";
import { createSpringSettings, Spring } from "../_shared/spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;
run(update);

// ==================== FOLLOWING EYES ====================

// Eye configuration
const eyeRadius = 320; // Radius of white circle
const pupilRadius = 180; // Radius of blue pupil
const strokeWidth = 13; // Stroke width
const eyeGap = 480; // Gap between eyes (increased from 150)
const totalEyeWidth = eyeRadius * 2 * 2 + eyeGap;

// Calculate positions
const eyeY = canvas.height / 2 - 300;
const eye1X = (canvas.width - totalEyeWidth) / 2 + eyeRadius;
const eye2X = eye1X + eyeRadius * 2 + eyeGap;

// Load teeth images - all states
const teethImages = {
  intact: new Image(),
  broken05: new Image(),
  broken06: new Image(),
  broken07: new Image(),
  broken08: new Image(),
};

teethImages.intact.src = "assets-0/TEETH.svg";
teethImages.broken05.src = "assets-0/TEETH-BROKEN-05.svg";
teethImages.broken06.src = "assets-0/TEETH-BROKEN-06.svg";
teethImages.broken07.src = "assets-0/TEETH-BROKEN-07.svg";
teethImages.broken08.src = "assets-0/TEETH-BROKEN-08.svg";

// Teeth state tracking (0 = none/disappeared, 1 = broken-05, 2 = broken-06, 3 = broken-07, 4 = broken-08)
let teethStateTop = 1; // Start with BROKEN-05 (top)
let teethStateBottom = 1; // Start with BROKEN-05 (bottom)
let colorTransitionStart = null; // Track when color transition begins
const colorTransitionDuration = 1000; // 1 second transition
let eyesFadeStart = null; // Track when eyes start fading
const eyesFadeDuration = 1000; // 1 second fade
let ceroFadeStart = null; // Track when cero starts fading
const ceroFadeDuration = 1000; // 1 second fade
const teethStateImages = [
  null,
  teethImages.broken05,
  teethImages.broken06,
  teethImages.broken07,
  teethImages.broken08,
];
const teethWidth = 250;
const teethHeight = 500;
const teethXTop = () => canvas.width / 2 - teethWidth / 2;
const teethYTop = () => canvas.height / 2 - 800;
const teethXBottom = () => canvas.width / 2 - teethWidth / 2;
const teethYBottom = () => canvas.height / 2 + 300;

// Check if click is within top teeth area
function isClickInTeethTop(mouseX, mouseY) {
  const x = teethXTop();
  const y = teethYTop();
  return (
    mouseX >= x &&
    mouseX <= x + teethWidth &&
    mouseY >= y &&
    mouseY <= y + teethHeight
  );
}

// Check if click is within bottom teeth area
function isClickInTeethBottom(mouseX, mouseY) {
  const x = teethXBottom();
  const y = teethYBottom();
  return (
    mouseX >= x &&
    mouseX <= x + teethWidth &&
    mouseY >= y &&
    mouseY <= y + teethHeight
  );
}

// Interpolate between two colors
function interpolateColor(color1, color2, progress) {
  // Parse hex colors
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const a1 = parseInt(color1.slice(7, 9) || "ff", 16) / 255;

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  const a2 = parseInt(color2.slice(7, 9) || "ff", 16) / 255;

  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);
  const a = a1 + (a2 - a1) * progress;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Blinking animation
let blinkStartTime = 0;
let blinkInterval = 3000; // Blink every 3 seconds
let blinkDuration = 150; // Blink lasts 150ms

function getBlinkAmount() {
  const now = Date.now();
  const timeSinceBlink = (now - blinkStartTime) % blinkInterval;

  if (timeSinceBlink < blinkDuration) {
    // During blink: 0 to 1 to 0
    const progress = timeSinceBlink / (blinkDuration / 2);
    if (progress < 1) {
      return progress; // 0 to 1
    } else {
      return 2 - progress; // 1 to 0
    }
  }
  return 0; // Not blinking
}

// Draw eye
function drawEye(centerX, centerY) {
  // Get canvas position relative to screen
  const rect = canvas.getBoundingClientRect();

  // Get mouse position from engine input (already in canvas coordinates)
  const mouseCanvasX = input.getX();
  const mouseCanvasY = input.getY();

  console.log("Mouse:", mouseCanvasX, mouseCanvasY, "Eye:", centerX, centerY);

  // Calculate angle from eye center to mouse
  const angle = Math.atan2(mouseCanvasY - centerY, mouseCanvasX - centerX);

  // Calculate pupil position (constrained within eye)
  const maxDistance = eyeRadius - pupilRadius;
  const pupilX = centerX + Math.cos(angle) * maxDistance;
  const pupilY = centerY + Math.sin(angle) * maxDistance;

  // Get blink amount (0 = open, 1 = fully closed)
  const blinkAmount = getBlinkAmount();
  const eyelidHeight = eyeRadius * 2 * blinkAmount;

  // Calculate eye opacity based on color transition completion
  let eyeOpacity = 1;
  if (colorTransitionStart !== null) {
    const elapsed = Date.now() - colorTransitionStart;
    const fadeProgress = Math.min(elapsed / colorTransitionDuration, 1);
    eyeOpacity = 1 - fadeProgress;
  }

  // Save context state for opacity
  ctx.save();
  ctx.globalAlpha = eyeOpacity;

  // Draw white eye
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(centerX, centerY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw black stroke
  ctx.strokeStyle = "black";
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, eyeRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Only draw pupil if not blinking (or partially blinking)
  if (blinkAmount < 0.8) {
    // Draw blue pupil
    ctx.fillStyle = "#446eb1";
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw pupil stroke
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw eyelid (black bar closing from top and bottom)
  if (blinkAmount > 0) {
    ctx.fillStyle = "black";
    const lidHeight = eyelidHeight / 2;
    // Top eyelid
    ctx.fillRect(
      centerX - eyeRadius,
      centerY - eyeRadius,
      eyeRadius * 2,
      lidHeight
    );
    // Bottom eyelid
    ctx.fillRect(
      centerX - eyeRadius,
      centerY + eyeRadius - lidHeight,
      eyeRadius * 2,
      lidHeight
    );
  }

  // Restore context state
  ctx.restore();
}

// Update function
function update() {
  // Check for click on teeth areas
  if (input.isDown()) {
    const mouseX = input.getX();
    const mouseY = input.getY();

    // If everything is faded out, clicking anywhere will trigger cero fade
    const bothTeethGone = teethStateTop >= 5 && teethStateBottom >= 5;
    const eyesFaded =
      colorTransitionStart !== null &&
      Date.now() - colorTransitionStart >= colorTransitionDuration;

    if (bothTeethGone && eyesFaded && ceroFadeStart === null) {
      ceroFadeStart = Date.now();
    }

    if (isClickInTeethTop(mouseX, mouseY)) {
      // Progress top teeth to next state
      if (teethStateTop < 5) {
        teethStateTop += 1;
      }
    }

    if (isClickInTeethBottom(mouseX, mouseY)) {
      // Progress bottom teeth to next state
      if (teethStateBottom < 5) {
        teethStateBottom += 1;
      }
    }
  }

  // Black background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw both eyes
  drawEye(eye1X, eyeY);
  drawEye(eye2X, eyeY);

  // Draw number 0 with TWK font
  // Smooth color transition when both teeth disappear
  const bothTeethGone = teethStateTop >= 5 && teethStateBottom >= 5;

  if (bothTeethGone && colorTransitionStart === null) {
    colorTransitionStart = Date.now();
  }

  let textColor = "#fdabd4ff"; // Default pink
  let ceroOpacity = 1;

  if (bothTeethGone && colorTransitionStart !== null) {
    const elapsed = Date.now() - colorTransitionStart;
    const progress = Math.min(elapsed / colorTransitionDuration, 1);
    textColor = interpolateColor("#fdabd4ff", "#ffffffff", progress);

    // If cero fade has started, fade the opacity
    if (ceroFadeStart !== null) {
      const fadeElapsed = Date.now() - ceroFadeStart;
      const fadeProgress = Math.min(fadeElapsed / ceroFadeDuration, 1);
      ceroOpacity = 1 - fadeProgress;
    }
  }

  ctx.save();
  ctx.globalAlpha = ceroOpacity;
  ctx.fillStyle = textColor;
  ctx.font = "400 2799px 'TWK'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("0", canvas.width / 2, canvas.height / 2 + 150);
  ctx.restore();

  // Draw teeth (top) - only if state is valid (1-4)
  if (teethStateTop > 0 && teethStateTop < 5) {
    const teethImg = teethStateImages[teethStateTop];
    if (teethImg && teethImg.complete) {
      ctx.drawImage(
        teethImg,
        teethXTop(),
        teethYTop(),
        teethWidth,
        teethHeight
      );
    }
  }

  // Draw teeth (bottom - flipped vertically)
  if (teethStateBottom > 0 && teethStateBottom < 5) {
    const teethImg = teethStateImages[teethStateBottom];
    if (teethImg && teethImg.complete) {
      const x = teethXBottom();
      const y = teethYBottom();

      // Save context state
      ctx.save();

      // Translate to center of teeth, flip vertically, translate back
      ctx.translate(x + teethWidth / 2, y + teethHeight / 2);
      ctx.scale(1, -1);
      ctx.translate(-(x + teethWidth / 2), -(y + teethHeight / 2));

      ctx.drawImage(teethImg, x, y, teethWidth, teethHeight);

      // Restore context state
      ctx.restore();
    }
  }
}
