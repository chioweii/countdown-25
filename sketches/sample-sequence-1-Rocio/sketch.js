import { createEngine } from "../_shared/engine.js";
import { Spring } from "../_shared/spring.js";

const svg = document.getElementById("zipperSVG");
const leftFlap = document.getElementById("leftFlap");
const rightFlap = document.getElementById("rightFlap");
const zipLine = document.getElementById("zipLine");
const zipperCursor = document.getElementById("zipperCursor");

const SVG_WIDTH = 300;
const SVG_HEIGHT = 600;
const MID_X = SVG_WIDTH / 2;

// Top line
const topLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
topLine.setAttribute("x1", "-10000");
topLine.setAttribute("y1", "0");
topLine.setAttribute("x2", "10000");
topLine.setAttribute("y2", "0");
topLine.setAttribute("stroke", "#000");
topLine.setAttribute("stroke-width", "3");
svg.appendChild(topLine);

// Slider clip
const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
const clipPath = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "clipPath"
);
clipPath.id = "sliderClip";

const clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
clipRect.setAttribute("x", "-10000");
clipRect.setAttribute("y", "0");
clipRect.setAttribute("width", "20000");
clipRect.setAttribute("height", "10000");

clipPath.appendChild(clipRect);
defs.appendChild(clipPath);
svg.insertBefore(defs, svg.firstChild);

zipperCursor.setAttribute("clip-path", "url(#sliderClip)");
svg.appendChild(zipperCursor);

let isDragging = false;
let sliderProgress = 0;

function drawZipper(progress) {
  const sliderY = progress * SVG_HEIGHT;
  const maxGap = 50;
  const gap = maxGap * progress;
  const control = 120 * progress;

  const leftPath = `
    M ${MID_X - gap} 0
    C ${MID_X - gap - control} ${sliderY * 0.25},
      ${MID_X - gap - control} ${sliderY * 0.75},
      ${MID_X} ${sliderY}
    L ${MID_X} ${SVG_HEIGHT}
    L -100 ${SVG_HEIGHT}
    L -100 0
    Z`;

  const rightPath = `
    M ${MID_X + gap} 0
    C ${MID_X + gap + control} ${sliderY * 0.25},
      ${MID_X + gap + control} ${sliderY * 0.75},
      ${MID_X} ${sliderY}
    L ${MID_X} ${SVG_HEIGHT}
    L 400 ${SVG_HEIGHT}
    L 400 0
    Z`;

  leftFlap.setAttribute("d", leftPath);
  rightFlap.setAttribute("d", rightPath);

  const linePath = `
    M ${MID_X - gap} 0
    C ${MID_X - gap - control} ${sliderY * 0.25},
      ${MID_X - gap - control} ${sliderY * 0.75},
      ${MID_X} ${sliderY}
    M ${MID_X + gap} 0
    C ${MID_X + gap + control} ${sliderY * 0.25},
      ${MID_X + gap + control} ${sliderY * 0.75},
      ${MID_X} ${sliderY}
    L ${MID_X} ${SVG_HEIGHT}`;

  zipLine.setAttribute("d", linePath);
  zipLine.setAttribute("fill", "none");

  zipperCursor.setAttribute("y", sliderY - 33);
  zipperCursor.setAttribute("x", MID_X - 25);
}

drawZipper(0);

// Events
svg.addEventListener("mousedown", (e) => {
  if (e.target === zipperCursor) isDragging = true;
});

svg.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const rect = svg.getBoundingClientRect();
  const y = e.clientY - rect.top;

  sliderProgress = Math.max(0, Math.min(1, y / rect.height));
  drawZipper(sliderProgress);
});

svg.addEventListener("mouseup", () => (isDragging = false));
svg.addEventListener("mouseleave", () => (isDragging = false));
