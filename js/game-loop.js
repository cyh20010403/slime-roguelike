// game-loop.js - Main game loop
let running = false;
let paused = false;
let lastTime = 0;
let deltaTime = 0;
let gameTime = 0;
let updateCallbacks = [];
let renderCallbacks = [];

export function startLoop() {
  if (running) return;
  running = true;
  paused = false;
  lastTime = performance.now();
  gameTime = 0;
  requestAnimationFrame(tick);
}

export function stopLoop() { running = false; }
export function pause() { paused = true; }
export function resume() { paused = false; lastTime = performance.now(); }
export function isPaused() { return paused; }
export function isRunning() { return running; }
export function getDeltaTime() { return deltaTime; }
export function getGameTime() { return gameTime; }
export function onUpdate(fn) { updateCallbacks.push(fn); }
export function onRender(fn) { renderCallbacks.push(fn); }

export function clearCallbacks() {
  updateCallbacks.length = 0;
  renderCallbacks.length = 0;
}

function tick(now) {
  if (!running) return;
  requestAnimationFrame(tick);
  if (paused) return;
  deltaTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  gameTime += deltaTime;
  for (const fn of updateCallbacks) fn(deltaTime, gameTime);
  for (const fn of renderCallbacks) fn(deltaTime, gameTime);
}
