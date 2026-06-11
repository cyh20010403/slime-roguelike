// canvas.js - Canvas rendering manager
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let W, H;

export function initCanvas() {
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

export function getCanvas() { return canvas; }
export function getCtx() { return ctx; }
export function getWidth() { return W; }
export function getHeight() { return H; }

export function clearCanvas() {
  ctx.clearRect(0, 0, W, H);
}

export function drawCircle(x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCircleWithBorder(x, y, r, fillColor, borderColor, borderWidth = 2) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.stroke();
  ctx.restore();
}

export function drawText(text, x, y, color, size = 16, align = 'center', font = 'bold') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${font} ${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawRipple(x, y, radius, alpha) {
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Screen shake
let shakeAmount = 0;
let shakeDuration = 0;

export function triggerShake(intensity = 5, duration = 0.1) {
  shakeAmount = intensity;
  shakeDuration = duration;
}

export function updateShake(dt) {
  if (shakeDuration > 0) {
    shakeDuration -= dt;
    if (shakeDuration <= 0) shakeAmount = 0;
  }
}

export function getShakeOffset() {
  if (shakeAmount <= 0) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * shakeAmount * 2,
    y: (Math.random() - 0.5) * shakeAmount * 2,
  };
}
