# 点击挂机 Roguelike 游戏 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零构建一款完整的点击挂机 Roguelike Web 游戏

**Architecture:** Canvas 渲染战斗层 + DOM 管理 UI 层。事件驱动的游戏主循环，注册式升级效果系统，数据驱动的敌人/波次配置，Web Audio API 程序化音效。

**Tech Stack:** 原生 HTML5 + CSS3 + ES6 JavaScript，零外部依赖

---

## 依赖关系总览

```
Phase 1: Foundation (index.html, CSS, canvas.js, game-loop.js, main.js 骨架)
    ↓
Phase 2: Core Gameplay (player.js, enemies.js, combat.js, boss.js, wave-manager.js)
    ↓
Phase 3: Combat Feedback (particles.js, projectiles.js, 打击感)
    ↓
Phase 4: Upgrade System (upgrades.js, upgrade-effects.js, ui-controller 升级面板)
    ↓
Phase 5: Companions & Auras (companions.js, auras.js)
    ↓
Phase 6: Audio (audio.js)
    ↓
Phase 7: UI Polish (游戏结束、波次过渡、Boss血条、构筑栏)
    ↓
Phase 8: Integration & Balance (main.js 完整连接, balance-sim.html)
    ↓
Phase 9: Final Polish (数值调优, 视觉打磨)
```

---

## Phase 1: Foundation

### Task 1: 创建项目骨架（index.html + CSS）

**Files:**
- Create: `index.html`
- Create: `css/main.css`
- Create: `css/animations.css`

- [ ] **Step 1: 创建 index.html 完整骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>史莱姆大作战 - 点击 Roguelike</title>
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/animations.css">
</head>
<body>
  <!-- 顶部 HUD -->
  <div id="hud">
    <div class="hud-left">
      <span id="hud-hp">❤️ <strong>100</strong>/100</span>
      <span id="hud-gold">🪙 <strong>0</strong></span>
      <span id="hud-atk">⚔️ <strong>10</strong></span>
    </div>
    <div class="hud-right">
      <span id="hud-time">⏱️ 0:00</span>
      <span id="hud-kills">💀 0</span>
      <span id="hud-wave">🌊 波次 1</span>
    </div>
  </div>

  <!-- Boss 血条（默认隐藏） -->
  <div id="boss-hp-bar" class="hidden">
    <div class="boss-hp-label"><span id="boss-name">Boss</span></div>
    <div class="boss-hp-track">
      <div id="boss-hp-fill" class="boss-hp-fill"></div>
    </div>
    <span id="boss-hp-text">100%</span>
  </div>

  <!-- 战斗画布 -->
  <canvas id="game-canvas"></canvas>

  <!-- 波次提示（默认隐藏） -->
  <div id="wave-announce" class="hidden">
    <span id="wave-announce-text"></span>
  </div>

  <!-- 底部构筑栏 -->
  <div id="build-bar">
    <span class="build-label">🏆 构筑:</span>
    <div id="build-cards"></div>
    <span id="build-count" class="build-count">0 张卡</span>
  </div>

  <!-- 升级选择面板（默认隐藏） -->
  <div id="upgrade-panel" class="overlay hidden">
    <div class="upgrade-panel-content">
      <h2 id="upgrade-title">选择一个升级!</h2>
      <div id="upgrade-cards" class="upgrade-cards-row"></div>
    </div>
  </div>

  <!-- 游戏结束面板（默认隐藏） -->
  <div id="gameover-panel" class="overlay hidden">
    <div class="gameover-content">
      <h2>游戏结束</h2>
      <div id="gameover-stats"></div>
      <div id="gameover-build"></div>
      <button id="btn-restart" class="btn-primary">🔄 再来一局</button>
    </div>
  </div>

  <!-- 开始画面 -->
  <div id="start-panel" class="overlay">
    <div class="start-content">
      <h1>🟢 史莱姆大作战</h1>
      <p class="subtitle">点击挂机 Roguelike</p>
      <p id="high-score-display"></p>
      <button id="btn-start" class="btn-primary btn-large">🎮 开始游戏</button>
      <div class="start-instructions">
        <p>🖱️ 点击屏幕任意位置攻击敌人</p>
        <p>👾 击败 Boss 获得强力升级</p>
        <p>💀 存活尽可能久!</p>
      </div>
    </div>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 css/main.css**

```css
/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #FFF8E7;
  --pink: #FF6B8A;
  --gold: #FFD93D;
  --blue: #6BC9FF;
  --mint: #A8E6CF;
  --bg-dark: #1a1a2e;
  --bg-panel: #16213e;
  --text: #2d3436;
  --text-light: #dfe6e9;
  --common: #7f8c8d;
  --rare: #a29bfe;
  --legendary: #ffd93d;
  --mythic: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bc9ff, #a8e6cf);
  --font-main: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  font-family: var(--font-main);
  background: var(--bg-dark);
  color: var(--text-light);
  user-select: none;
  -webkit-user-select: none;
}

/* === Canvas === */
#game-canvas {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 1;
  cursor: crosshair;
}

/* === HUD === */
#hud {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 24px;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(6px);
  font-size: 15px;
  pointer-events: none;
}
.hud-left, .hud-right { display: flex; gap: 20px; align-items: center; }
#hud-hp { color: #ff6b6b; }
#hud-gold { color: #ffd93d; }
#hud-atk { color: #6bc9ff; }

/* === Boss HP Bar === */
#boss-hp-bar {
  position: absolute; top: 50px; left: 50%; transform: translateX(-50%);
  z-index: 10; width: 400px; text-align: center;
  pointer-events: none;
}
.boss-hp-label { font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #ff6b6b; }
.boss-hp-track {
  height: 14px; background: rgba(0,0,0,0.5);
  border-radius: 7px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);
}
.boss-hp-fill {
  height: 100%; width: 100%;
  background: linear-gradient(90deg, #ff4757, #ff6b81);
  border-radius: 7px; transition: width 0.15s ease-out;
}
#boss-hp-text { font-size: 12px; color: #ccc; }

/* === Wave Announce === */
#wave-announce {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 20; pointer-events: none;
}
#wave-announce-text {
  font-size: 48px; font-weight: bold; color: #ffd93d;
  text-shadow: 0 0 20px rgba(255,217,61,0.5), 0 4px 8px rgba(0,0,0,0.5);
}

/* === Build Bar === */
#build-bar {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; gap: 8px;
  padding: 6px 20px;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  font-size: 13px;
}
.build-label { flex-shrink: 0; color: #ffd93d; }
#build-cards { display: flex; gap: 6px; overflow-x: auto; flex: 1; }
.build-count { flex-shrink: 0; color: #aaa; font-size: 12px; }

/* === Overlays === */
.overlay {
  position: absolute; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
}
.overlay.hidden { display: none; }

/* === Start Panel === */
.start-content {
  text-align: center; padding: 40px 60px;
  background: var(--bg-panel); border-radius: 20px;
  border: 2px solid rgba(255,255,255,0.1);
  max-width: 500px;
}
.start-content h1 { font-size: 42px; margin-bottom: 4px; }
.start-content h1 { background: linear-gradient(135deg, #FF6B8A, #FFD93D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.start-content .subtitle { color: #aaa; margin-bottom: 24px; font-size: 16px; }
.start-instructions { margin-top: 20px; font-size: 14px; color: #888; line-height: 1.8; }
#high-score-display { color: #ffd93d; font-size: 14px; margin-bottom: 8px; }

/* === Upgrade Panel === */
.upgrade-panel-content {
  text-align: center; padding: 30px;
  max-width: 900px; width: 90%;
}
#upgrade-title { font-size: 28px; margin-bottom: 20px; color: #ffd93d; }
.upgrade-cards-row { display: flex; gap: 20px; justify-content: center; }

/* === Game Over Panel === */
.gameover-content {
  text-align: center; padding: 30px 50px;
  background: var(--bg-panel); border-radius: 20px;
  border: 2px solid rgba(255,255,255,0.1);
  max-width: 500px;
}
.gameover-content h2 { font-size: 36px; color: #ff6b6b; margin-bottom: 16px; }
#gameover-stats { margin-bottom: 16px; line-height: 1.8; }
#gameover-build { margin-bottom: 20px; font-size: 13px; color: #aaa; max-height: 120px; overflow-y: auto; }

/* === Buttons === */
.btn-primary {
  background: linear-gradient(135deg, #FF6B8A, #FF8E9E);
  color: #fff; border: none; padding: 12px 32px;
  font-size: 18px; border-radius: 30px; cursor: pointer;
  font-weight: bold; transition: transform 0.15s, box-shadow 0.15s;
  font-family: var(--font-main);
}
.btn-primary:hover { transform: scale(1.05); box-shadow: 0 4px 20px rgba(255,107,138,0.4); }
.btn-large { padding: 16px 48px; font-size: 22px; }

/* === Build Card Tags === */
.build-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 10px; border-radius: 12px; font-size: 12px;
  white-space: nowrap;
  background: #2d3436;
}
.build-tag.rarity-common { color: #7f8c8d; }
.build-tag.rarity-rare { color: #a29bfe; }
.build-tag.rarity-legendary { color: #ffd93d; }
.build-tag.rarity-mythic { color: #fff; background: linear-gradient(135deg, rgba(255,107,107,0.3), rgba(107,201,255,0.3)); }

/* === Utility === */
.hidden { display: none !important; }
```

- [ ] **Step 3: 创建 css/animations.css**

```css
/* 弹出动画 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeOutDown {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes scaleOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* 动画类 */
.anim-fadeInUp { animation: fadeInUp 0.3s ease-out forwards; }
.anim-fadeOutDown { animation: fadeOutDown 0.3s ease-in forwards; }
.anim-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
.anim-scaleOut { animation: scaleOut 0.2s ease-in forwards; }
.anim-pulse { animation: pulse 0.3s ease-in-out; }
.anim-shake { animation: shake 0.3s ease-in-out; }

/* 波次提示进入/退出 */
.wave-enter { animation: scaleIn 0.5s ease-out; }
.wave-exit { animation: scaleOut 0.4s ease-in forwards; }

/* 升级卡片悬停 */
.upgrade-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.upgrade-card:hover {
  transform: translateY(-8px) scale(1.03);
}
```

- [ ] **Step 4: 验证** — 在浏览器打开 index.html，确认所有 HTML 元素存在且 CSS 样式正确，无控制台错误。

---

### Task 2: Canvas 渲染管理器

**Files:**
- Create: `js/canvas.js`

- [ ] **Step 1: 创建 js/canvas.js**

```js
// canvas.js - Canvas 渲染管理器
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

// 清空画布
export function clearCanvas() {
  ctx.clearRect(0, 0, W, H);
}

// 绘制圆形（敌人、金币等）
export function drawCircle(x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 绘制带边框的圆
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

// 绘制文字
export function drawText(text, x, y, color, size = 16, align = 'center', font = 'bold') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${font} ${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 绘制点击波纹
export function drawRipple(x, y, radius, alpha) {
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// 绘制伤害数字（浮出效果由调用方控制位置）
export function drawDamageNumber(text, x, y, color = '#FFD93D', size = 20, alpha = 1) {
  drawText(text, x, y, color, size, 'center', 'bold');
  // 外发光
  ctx.save();
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 1, y + 1);
  ctx.restore();
}

// 获取 canvas 上的鼠标位置
export function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}
```

- [ ] **Step 2: 验证** — 在浏览器控制台导入 `initCanvas()` 并调用，确认 `W` 和 `H` 与窗口尺寸一致。

---

### Task 3: 游戏主循环

**Files:**
- Create: `js/game-loop.js`

- [ ] **Step 1: 创建 js/game-loop.js**

```js
// game-loop.js - 游戏主循环
let running = false;
let paused = false;
let lastTime = 0;
let deltaTime = 0; // 秒
let gameTime = 0;  // 累计游戏时间（秒）
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

export function stopLoop() {
  running = false;
}

export function pause() { paused = true; }
export function resume() { paused = false; lastTime = performance.now(); }
export function isPaused() { return paused; }
export function isRunning() { return running; }

export function getDeltaTime() { return deltaTime; }
export function getGameTime() { return gameTime; }

export function onUpdate(fn) { updateCallbacks.push(fn); }
export function onRender(fn) { renderCallbacks.push(fn); }

function tick(now) {
  if (!running) return;
  requestAnimationFrame(tick);

  if (paused) return;

  deltaTime = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
  lastTime = now;
  gameTime += deltaTime;

  // Update
  for (const fn of updateCallbacks) {
    fn(deltaTime, gameTime);
  }

  // Render
  for (const fn of renderCallbacks) {
    fn(deltaTime, gameTime);
  }
}
```

- [ ] **Step 2: 验证** — 在浏览器控制台中启动循环，注册一个打印回调，确认 `deltaTime` 在 ~0.016s (60fps) 附近。

---

### Task 4: 入口文件骨架

**Files:**
- Create: `js/main.js`

- [ ] **Step 1: 创建 js/main.js（初始骨架）**

```js
// main.js - 游戏入口
import { initCanvas, clearCanvas, getCanvas, getWidth, getHeight, getMousePos } from './canvas.js';
import { startLoop, stopLoop, pause, resume, onUpdate, onRender, getGameTime, isPaused } from './game-loop.js';

// === 启动流程 ===
const startPanel = document.getElementById('start-panel');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const highScoreDisplay = document.getElementById('high-score-display');

// 读取最高分
const HIGH_SCORE_KEY = 'slime_roguelike_high_score';
let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
if (highScore > 0) {
  highScoreDisplay.textContent = `🏆 最高存活: ${formatTime(highScore)}`;
}

btnStart.addEventListener('click', () => {
  startPanel.classList.add('hidden');
  startGame();
});

btnRestart.addEventListener('click', () => {
  document.getElementById('gameover-panel').classList.add('hidden');
  startGame();
});

function startGame() {
  initCanvas();
  startLoop();
  registerSystems();
  setupInput();
}

function gameOver() {
  stopLoop();
  const survived = Math.floor(getGameTime());
  if (survived > highScore) {
    highScore = survived;
    localStorage.setItem(HIGH_SCORE_KEY, highScore);
    highScoreDisplay.textContent = `🏆 最高存活: ${formatTime(highScore)}`;
  }
  // UI 面板稍后任务中实现
  document.getElementById('gameover-panel').classList.remove('hidden');
  document.getElementById('gameover-stats').innerHTML = `
    <p>⏱️ 存活时间: <strong>${formatTime(survived)}</strong></p>
    <p>🏆 最高纪录: <strong>${formatTime(highScore)}</strong></p>
  `;
}

function registerSystems() {
  // 占位 - 后续任务逐步注册
  onUpdate((dt, t) => { /* combat, enemies, etc */ });
  onRender((dt, t) => {
    clearCanvas();
    // render calls
  });
}

function setupInput() {
  const canvas = getCanvas();
  canvas.addEventListener('click', (e) => {
    const pos = getMousePos(e);
    // 点击战斗逻辑 - 后续任务实现
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 2: 验证** — 点击"开始游戏"按钮，start panel 消失，canvas 显示，无控制台错误。循环运行中。

---

## Phase 2: Core Gameplay

### Task 5: 玩家系统

**Files:**
- Create: `js/player.js`

- [ ] **Step 1: 创建 js/player.js**

```js
// player.js - 玩家状态管理
export const player = {
  hp: 100,
  maxHp: 100,
  atk: 10,
  baseAtk: 10,
  atkMultiplier: 1,   // 攻击力百分比加成
  clickRadius: 80,
  critChance: 0.05,
  critMultiplier: 2,
  goldBonus: 0,       // 额外金币百分比
  gold: 0,
  kills: 0,
  // 攻速（点击冷却，秒）
  clickCooldown: 0.15,
  lastClickTime: 0,
};

let onGoldChange = null;      // (amount)
let onHpChange = null;        // (current, max)
let onPlayerDeath = null;

export function setGoldCallback(fn) { onGoldChange = fn; }
export function setHpCallback(fn) { onHpChange = fn; }
export function setDeathCallback(fn) { onPlayerDeath = fn; }

export function addGold(amount) {
  const bonus = 1 + player.goldBonus / 100;
  const total = Math.floor(amount * bonus);
  player.gold += total;
  if (onGoldChange) onGoldChange(total);
  return total;
}

export function spendGold(amount) {
  if (player.gold < amount) return false;
  player.gold -= amount;
  return true;
}

export function takeDamage(amount) {
  player.hp = Math.max(0, player.hp - amount);
  if (onHpChange) onHpChange(player.hp, player.maxHp);
  if (player.hp <= 0) {
    if (onPlayerDeath) onPlayerDeath();
  }
}

export function heal(amount) {
  player.hp = Math.min(player.maxHp, player.hp + amount);
  if (onHpChange) onHpChange(player.hp, player.maxHp);
}

export function getEffectiveAtk() {
  return Math.floor(player.baseAtk * (1 + player.atkMultiplier));
}

export function resetPlayer() {
  player.hp = 100;
  player.maxHp = 100;
  player.atk = 10;
  player.baseAtk = 10;
  player.atkMultiplier = 0;
  player.clickRadius = 80;
  player.critChance = 0.05;
  player.critMultiplier = 2;
  player.goldBonus = 0;
  player.gold = 0;
  player.kills = 0;
  player.clickCooldown = 0.15;
  player.lastClickTime = 0;
}
```

- [ ] **Step 2: 验证** — 控制台中导入 player，调用 `addGold(100)` 后 `player.gold === 100`，`takeDamage(30)` 后 `player.hp === 70`。

---

### Task 6: 敌人系统 + 波次管理器

**Files:**
- Create: `js/enemies.js`
- Create: `js/wave-manager.js`

- [ ] **Step 1: 创建 js/enemies.js（敌人数据配置 + 管理）**

```js
// enemies.js - 敌人数据与管理
import { getWidth, getHeight } from './canvas.js';

// 敌人类型配置
export const ENEMY_TYPES = {
  green_slime: { name: '绿色史莱姆', hp: 10, speed: 40, lifetime: 12, damage: 5, goldMin: 5, goldMax: 10, size: 20, color: '#A8E6CF', emoji: '🟢', unlockWave: 1 },
  blue_slime:  { name: '蓝色史莱姆', hp: 25, speed: 60, lifetime: 10, damage: 8, goldMin: 10, goldMax: 15, size: 24, color: '#6BC9FF', emoji: '🔵', unlockWave: 3 },
  imp:         { name: '小恶魔',     hp: 40, speed: 90, lifetime: 8,  damage: 10, goldMin: 15, goldMax: 20, size: 18, color: '#FF6B8A', emoji: '😈', unlockWave: 6 },
  red_slime:   { name: '红色史莱姆', hp: 80, speed: 35, lifetime: 15, damage: 15, goldMin: 20, goldMax: 30, size: 30, color: '#FF4757', emoji: '🔴', unlockWave: 10 },
  shadow_imp:  { name: '暗影恶魔',   hp: 120, speed: 110, lifetime: 7, damage: 12, goldMin: 25, goldMax: 35, size: 18, color: '#6C5CE7', emoji: '👿', unlockWave: 14 },
  elite:       { name: '精英怪',     hp: 200, speed: 55, lifetime: 10, damage: 20, goldMin: 50, goldMax: 100, size: 26, color: '#FFD93D', emoji: '⭐', unlockWave: 12 },
};

// 活跃敌人数组
export const enemies = [];

// 敌人类
export class Enemy {
  constructor(typeKey, wave) {
    const type = ENEMY_TYPES[typeKey];
    this.typeKey = typeKey;
    this.name = type.name;
    this.emoji = type.emoji;
    this.maxHp = type.hp;
    this.hp = type.hp;
    this.speed = type.speed;
    this.lifetime = type.lifetime;
    this.damage = type.damage;
    this.goldMin = type.goldMin;
    this.goldMax = type.goldMax;
    this.size = type.size;
    this.color = type.color;
    this.age = 0;
    this.alive = true;
    this.isBoss = false;
    this.scale = 1; // 受击缩放

    // 从屏幕边缘随机生成
    const side = Math.floor(Math.random() * 4);
    const W = getWidth(), H = getHeight();
    const margin = this.size + 10;
    switch (side) {
      case 0: this.x = Math.random() * W; this.y = -margin; break;        // 上
      case 1: this.x = W + margin; this.y = Math.random() * H; break;     // 右
      case 2: this.x = Math.random() * W; this.y = H + margin; break;     // 下
      case 3: this.x = -margin; this.y = Math.random() * H; break;        // 左
    }
    // 向屏幕内移动的目标方向（略微随机）
    this.vx = (Math.random() - 0.5) * this.speed * 0.5;
    this.vy = (Math.random() - 0.5) * this.speed * 0.5;
    // 加一个向内的分量
    const cx = W / 2, cy = H / 2;
    const dx = cx - this.x, dy = cy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx += (dx / dist) * this.speed * 0.5;
    this.vy += (dy / dist) * this.speed * 0.5;

    // 难度缩放
    const scale = 1 + Math.floor((wave - 1) / 5) * 0.3;
    this.maxHp = Math.floor(this.maxHp * scale);
    this.hp = this.maxHp;
    this.damage = Math.floor(this.damage * scale);
    this.goldMin = Math.floor(this.goldMin * scale);
    this.goldMax = Math.floor(this.goldMax * scale);
  }

  update(dt) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // 超出屏幕太远移除
    const margin = 200;
    if (this.x < -margin || this.x > getWidth() + margin || this.y < -margin || this.y > getHeight() + margin) {
      this.alive = false;
    }
    // 受击缩放回弹
    if (this.scale < 1) {
      this.scale = Math.min(1, this.scale + dt * 10);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.scale = 0.85; // 受击缩小
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true; // killed
    }
    return false;
  }

  isExpired() {
    return this.age >= this.lifetime;
  }
}

// 在屏幕边缘生成敌人
export function spawnEnemy(typeKey, wave) {
  const enemy = new Enemy(typeKey, wave);
  enemies.push(enemy);
  return enemy;
}

// 获取范围内所有敌人
export function getEnemiesInRange(cx, cy, radius) {
  return enemies.filter(e => {
    const dx = e.x - cx, dy = e.y - cy;
    return dx * dx + dy * dy <= radius * radius && e.alive;
  });
}

// 获取最近敌人（随从用）
export function getNearestEnemy(x, y) {
  let nearest = null, minDist = Infinity;
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - x, dy = e.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) { minDist = dist; nearest = e; }
  }
  return nearest;
}

// 清理死亡敌人
export function cleanupEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].alive) enemies.splice(i, 1);
  }
}
```

- [ ] **Step 2: 创建 js/wave-manager.js**

```js
// wave-manager.js - 波次与 Boss 管理
import { spawnEnemy, enemies, ENEMY_TYPES, Enemy } from './enemies.js';
import { getWidth, getHeight } from './canvas.js';
import { onUpdate, getGameTime } from './game-loop.js';

export let currentWave = 1;
export let waveTimer = 0;
let spawnInterval = 2.0;     // 敌人生成间隔（秒）
let spawnAccum = 0;
let bossActive = false;
let bossDefeatedThisWave = false;

let onWaveChange = null;
let onBossSpawn = null;
let onBossDefeated = null;

export function setWaveCallback(fn) { onWaveChange = fn; }
export function setBossSpawnCallback(fn) { onBossSpawn = fn; }
export function setBossDefeatedCallback(fn) { onBossDefeated = fn; }

export function isBossActive() { return bossActive; }
export function getCurrentWave() { return currentWave; }

// 获取当前波次可用的敌人类型
export function getAvailableEnemyTypes() {
  return Object.entries(ENEMY_TYPES)
    .filter(([_, cfg]) => cfg.unlockWave <= currentWave)
    .map(([key]) => key);
}

// 获取 Boss 配置
export function getBossConfig() {
  const waveTier = Math.floor((currentWave - 1) / 5);
  return {
    name: `胖龙 Lv.${waveTier + 1}`,
    emoji: '🐲',
    hp: 150 + waveTier * 200,
    size: 60 + waveTier * 15,
    speed: 20,
    lifetime: 45,
    damage: 10 + waveTier * 8,
    goldMin: 80 + waveTier * 60,
    goldMax: 150 + waveTier * 100,
    color: '#FF6B8A',
  };
}

// 生成 Boss
export function spawnBoss() {
  const cfg = getBossConfig();
  const boss = new Enemy('green_slime', currentWave); // 基类，下面覆盖
  const W = getWidth(), H = getHeight();
  boss.name = cfg.name;
  boss.emoji = cfg.emoji;
  boss.maxHp = cfg.hp;
  boss.hp = cfg.hp;
  boss.size = cfg.size;
  boss.speed = cfg.speed;
  boss.lifetime = cfg.lifetime;
  boss.damage = cfg.damage;
  boss.goldMin = cfg.goldMin;
  boss.goldMax = cfg.goldMax;
  boss.color = cfg.color;
  boss.isBoss = true;
  boss.x = W / 2;
  boss.y = H / 2;
  boss.vx = (Math.random() - 0.5) * cfg.speed;
  boss.vy = (Math.random() - 0.5) * cfg.speed;

  enemies.push(boss);
  bossActive = true;
  bossDefeatedThisWave = false;

  if (onBossSpawn) onBossSpawn(boss);
  return boss;
}

export function onBossKilled(boss) {
  bossActive = false;
  bossDefeatedThisWave = true;
  if (onBossDefeated) onBossDefeated(boss);
}

export function advanceWave() {
  currentWave++;
  waveTimer = 0;
  bossActive = false;
  bossDefeatedThisWave = false;
  spawnInterval = Math.max(0.3, 2.0 - currentWave * 0.08);
  if (onWaveChange) onWaveChange(currentWave);
}

export function resetWaveManager() {
  currentWave = 1;
  waveTimer = 0;
  spawnAccum = 0;
  spawnInterval = 2.0;
  bossActive = false;
  bossDefeatedThisWave = false;
}

export function initWaveManager() {
  resetWaveManager();

  onUpdate((dt) => {
    waveTimer += dt;

    // 每 5 波，在波次开始时生成 Boss
    const isBossWave = currentWave % 5 === 0;
    if (isBossWave && !bossActive && !bossDefeatedThisWave) {
      // 只在波次开始 2 秒后生成 Boss
      if (waveTimer > 2.0) {
        spawnBoss();
      }
    }

    // 非 Boss 波或 Boss 已死：计时结束 advance
    if (!isBossWave && waveTimer > 25 + currentWave * 3) {
      advanceWave();
    } else if (isBossWave && bossDefeatedThisWave && waveTimer > 5) {
      advanceWave();
    }

    // 敌人生成
    if (!bossActive) {
      spawnAccum += dt;
      if (spawnAccum >= spawnInterval) {
        spawnAccum -= spawnInterval;
        const types = getAvailableEnemyTypes();
        if (types.length > 0) {
          const typeKey = types[Math.floor(Math.random() * types.length)];
          spawnEnemy(typeKey, currentWave);
        }
        // 偶尔多生成一个
        if (Math.random() < 0.2 + currentWave * 0.02) {
          const typeKey2 = types[Math.floor(Math.random() * types.length)];
          spawnEnemy(typeKey2, currentWave);
        }
      }
    } else {
      // Boss 期间减速生成
      spawnAccum += dt;
      if (spawnAccum >= spawnInterval * 2.5) {
        spawnAccum = 0;
        const types = getAvailableEnemyTypes();
        if (types.length > 0) {
          spawnEnemy(types[Math.floor(Math.random() * types.length)], currentWave);
        }
      }
    }
  });
}
```

- [ ] **Step 3: 验证** — 在游戏循环中注册敌人 update，console 打印敌人数量，确认随波次增长。

---

### Task 7: 战斗系统 + Boss 逻辑

**Files:**
- Create: `js/combat.js`
- Create: `js/boss.js`

- [ ] **Step 1: 创建 js/combat.js**

```js
// combat.js - 伤害计算与点击战斗
import { player, addGold, takeDamage, heal } from './player.js';
import { enemies, getEnemiesInRange, Enemy } from './enemies.js';
import { onBossKilled, getBossConfig } from './wave-manager.js';
import { getGameTime } from './game-loop.js';

// 战斗事件回调（用于粒子/音效触发）
let onHitCallbacks = [];      // (enemy, damage, isCrit, x, y)
let onKillCallbacks = [];     // (enemy, x, y)
let onGoldDropCallbacks = []; // (amount, x, y)
let onExpireCallbacks = [];   // (enemy)

export function onHit(fn) { onHitCallbacks.push(fn); }
export function onKill(fn) { onKillCallbacks.push(fn); }
export function onGoldDrop(fn) { onGoldDropCallbacks.push(fn); }
export function onExpire(fn) { onExpireCallbacks.push(fn); }

// 计算一次点击的伤害
export function calculateDamage() {
  const baseAtk = player.baseAtk * (1 + player.atkMultiplier);
  const isCrit = Math.random() < player.critChance;
  const dmg = isCrit ? Math.floor(baseAtk * player.critMultiplier) : Math.floor(baseAtk);
  // 浮动 ±10%
  const variance = Math.floor(dmg * 0.1);
  const finalDmg = dmg + Math.floor(Math.random() * variance * 2) - variance;
  return { damage: Math.max(1, finalDmg), isCrit };
}

// 处理点击
export function processClick(x, y) {
  const targets = getEnemiesInRange(x, y, player.clickRadius);
  if (targets.length === 0) return { hit: false };

  const { damage, isCrit } = calculateDamage();
  const results = [];

  for (const enemy of targets) {
    const killed = enemy.takeDamage(damage);
    for (const cb of onHitCallbacks) cb(enemy, damage, isCrit, enemy.x, enemy.y);

    if (killed) {
      // 掉落金币
      const goldAmt = Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin;
      const actualGold = addGold(goldAmt);
      for (const cb of onGoldDropCallbacks) cb(actualGold, enemy.x, enemy.y);
      for (const cb of onKillCallbacks) cb(enemy, enemy.x, enemy.y);

      player.kills++;

      // Boss 击杀
      if (enemy.isBoss) {
        onBossKilled(enemy);
      }
    }

    results.push({ enemy, damage, killed });
  }

  return { hit: true, targets: results, damage, isCrit, x, y };
}

// 更新：处理敌人超时伤害
let expireCheckAccum = 0;
export function updateCombat(dt) {
  expireCheckAccum += dt;
  if (expireCheckAccum < 0.5) return;
  expireCheckAccum = 0;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (enemy.isExpired()) {
      takeDamage(enemy.damage);
      for (const cb of onExpireCallbacks) cb(enemy);
      enemy.alive = false;
    }
  }
}
```

- [ ] **Step 2: 创建 js/boss.js**

```js
// boss.js - Boss 行为管理
import { getWidth, getHeight } from './canvas.js';

let activeBoss = null;

export function getActiveBoss() { return activeBoss; }

export function registerBoss(boss) {
  activeBoss = boss;
  updateBossHPUI(boss);
}

export function unregisterBoss() {
  activeBoss = null;
  document.getElementById('boss-hp-bar').classList.add('hidden');
}

export function updateBossHPUI(boss) {
  const bar = document.getElementById('boss-hp-bar');
  const fill = document.getElementById('boss-hp-fill');
  const name = document.getElementById('boss-name');
  const text = document.getElementById('boss-hp-text');

  if (!boss || !boss.alive) {
    bar.classList.add('hidden');
    activeBoss = null;
    return;
  }

  bar.classList.remove('hidden');
  name.textContent = boss.name + ' ' + boss.emoji;
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  fill.style.width = pct + '%';
  text.textContent = `${Math.max(0, boss.hp)} / ${boss.maxHp}`;
}

export function updateBoss(dt) {
  if (!activeBoss || !activeBoss.alive) return;

  // Boss 在屏幕内缓慢随机移动
  const W = getWidth(), H = getHeight();
  const margin = 100;
  if (activeBoss.x < margin) activeBoss.vx = Math.abs(activeBoss.vx);
  if (activeBoss.x > W - margin) activeBoss.vx = -Math.abs(activeBoss.vx);
  if (activeBoss.y < margin) activeBoss.vy = Math.abs(activeBoss.vy);
  if (activeBoss.y > H - margin) activeBoss.vy = -Math.abs(activeBoss.vy);

  updateBossHPUI(activeBoss);
}
```

- [ ] **Step 3: 验证** — 点击 canvas，console 打印 hit 信息，敌人 HP 正确减少，击杀后金币增加。

---

## Phase 3: Combat Feedback

### Task 8: 粒子特效系统

**Files:**
- Create: `js/particles.js`

- [ ] **Step 1: 创建 js/particles.js**

```js
// particles.js - 粒子特效管理
import { getCtx } from './canvas.js';

const particles = [];

export class Particle {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.vx = config.vx || (Math.random() - 0.5) * 200;
    this.vy = config.vy || (Math.random() - 0.5) * 200 - 100;
    this.life = config.life || 0.6;
    this.maxLife = this.life;
    this.size = config.size || 4;
    this.color = config.color || '#FFD93D';
    this.gravity = config.gravity || 200;
    this.shrink = config.shrink !== undefined ? config.shrink : true;
  }

  update(dt) {
    this.life -= dt;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    const size = this.shrink ? this.size * alpha : this.size;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get alive() { return this.life > 0; }
}

// 预设特效
export function spawnHitParticles(x, y) {
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150 - 50,
      life: 0.3,
      size: 2 + Math.random() * 3,
      color: '#FFD93D',
      gravity: 100,
    }));
  }
}

export function spawnCritParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 300,
      vy: (Math.random() - 0.5) * 300 - 150,
      life: 0.5,
      size: 3 + Math.random() * 5,
      color: Math.random() > 0.5 ? '#FF6B6B' : '#FFD93D',
      gravity: 50,
    }));
  }
}

export function spawnDeathParticles(x, y, color = '#A8E6CF') {
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 250,
      vy: (Math.random() - 0.5) * 250 - 120,
      life: 0.5 + Math.random() * 0.3,
      size: 3 + Math.random() * 6,
      color: color,
      gravity: 150,
    }));
  }
}

export function spawnGoldParticles(x, y) {
  for (let i = 0; i < 4; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 100,
      vy: -150 - Math.random() * 100,
      life: 0.6,
      size: 3 + Math.random() * 3,
      color: '#FFD93D',
      gravity: 300,
      shrink: false,
    }));
  }
}

export function spawnBossDeathParticles(x, y) {
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40;
    const speed = 200 + Math.random() * 300;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.5,
      size: 4 + Math.random() * 8,
      color: ['#FF6B8A', '#FFD93D', '#6BC9FF', '#A8E6CF'][Math.floor(Math.random() * 4)],
      gravity: 100,
    }));
  }
}

// 伤害数字（浮游文字）
const damageNumbers = [];
export function spawnDamageNumber(x, y, amount, isCrit = false) {
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 30,
    y: y,
    text: isCrit ? `${amount}!!` : `${amount}`,
    life: 0.8,
    maxLife: 0.8,
    color: isCrit ? '#FF6B6B' : '#FFD93D',
    size: isCrit ? 26 : 20,
  });
}

export function updateParticles(dt) {
  for (const p of particles) p.update(dt);
  for (const d of damageNumbers) {
    d.y -= 50 * dt;
    d.life -= dt;
  }

  // 清理
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].alive) particles.splice(i, 1);
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
  }
}

export function renderParticles() {
  const ctx = getCtx();
  for (const p of particles) p.render(ctx);
  for (const d of damageNumbers) {
    const alpha = Math.max(0, d.life / d.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = d.color;
    ctx.font = `bold ${d.size}px "Segoe UI", "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 阴影
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 6;
    ctx.fillText(d.text, d.x, d.y);
    ctx.restore();
  }
}

export function clearAllParticles() {
  particles.length = 0;
  damageNumbers.length = 0;
}
```

- [ ] **Step 2: 验证** — 在游戏渲染循环中调用 `renderParticles()`，点击后可见粒子爆炸效果。

---

### Task 9: 点击波纹 + 屏幕震动

**Files:**
- Modify: `js/particles.js` — 添加波纹
- Modify: `js/canvas.js` — 添加震动

- [ ] **Step 1: 在 particles.js 中添加波纹系统**

```js
// 在 particles.js 末尾追加：
const ripples = [];

export function spawnRipple(x, y) {
  ripples.push({ x, y, radius: 5, maxRadius: 80, life: 0.35, maxLife: 0.35 });
}

export function updateRipples(dt) {
  for (const r of ripples) {
    r.life -= dt;
    r.radius = r.maxRadius * (1 - r.life / r.maxLife);
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    if (ripples[i].life <= 0) ripples.splice(i, 1);
  }
}

export function renderRipples() {
  const ctx = getCtx();
  for (const r of ripples) {
    const alpha = r.life / r.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 3 * alpha;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
```

- [ ] **Step 2: 在 canvas.js 中添加屏幕震动**

```js
// 在 canvas.js 末尾追加：
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
```

- [ ] **Step 3: 验证** — 点击后可见波纹扩散，暴击时屏幕微震。

---

### Task 10: 投射物系统

**Files:**
- Create: `js/projectiles.js`

- [ ] **Step 1: 创建 js/projectiles.js**

```js
// projectiles.js - 投射物管理（分裂弹、随从弹幕等）
import { getCtx, getWidth, getHeight } from './canvas.js';
import { enemies, getNearestEnemy } from './enemies.js';

const projectiles = [];

export class Projectile {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.speed = config.speed || 300;
    this.damage = config.damage || 5;
    this.size = config.size || 6;
    this.color = config.color || '#FFD93D';
    this.life = config.life || 2;
    this.maxLife = this.life;
    this.homing = config.homing || false;
    this.homingStrength = config.homingStrength || 3;
    this.target = config.target || null;
    this.pierce = config.pierce || false;
  }

  update(dt) {
    this.life -= dt;
    if (this.homing && this.target && this.target.alive) {
      const dx = this.target.x - this.x, dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vx += (dx / dist) * this.homingStrength * dt * 60;
      this.vy += (dy / dist) * this.homingStrength * dt * 60;
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (spd > this.speed) {
        this.vx = (this.vx / spd) * this.speed;
        this.vy = (this.vy / spd) * this.speed;
      }
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    const alpha = Math.min(1, this.life / 0.2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get alive() {
    return this.life > 0 &&
      this.x > -50 && this.x < getWidth() + 50 &&
      this.y > -50 && this.y < getHeight() + 50;
  }
}

export function addProjectile(p) { projectiles.push(p); }

// 分裂弹：从点击点向四周射出
export function spawnSplitProjectiles(x, y, count = 4, damage = 5) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const nearest = getNearestEnemy(x, y);
    projectiles.push(new Projectile(x, y, {
      vx: Math.cos(angle) * 300,
      vy: Math.sin(angle) * 300,
      speed: 300,
      damage: damage,
      color: '#6BC9FF',
      size: 5,
      life: 1.5,
      target: nearest,
      homing: true,
      homingStrength: 1.5,
    }));
  }
}

export function updateProjectiles(dt) {
  for (const p of projectiles) p.update(dt);

  // 碰撞检测
  for (const p of projectiles) {
    if (!p.alive) continue;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < e.size + p.size) {
        e.takeDamage(p.damage);
        if (!p.pierce) {
          p.life = 0;
          break;
        }
      }
    }
  }

  // 清理
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (!projectiles[i].alive) projectiles.splice(i, 1);
  }
}

export function renderProjectiles() {
  const ctx = getCtx();
  for (const p of projectiles) p.render(ctx);
}

export function clearAllProjectiles() {
  projectiles.length = 0;
}
```

- [ ] **Step 2: 验证** — 调用 `spawnSplitProjectiles(x, y, 4, 10)` 确认飞弹正确生成并追踪敌人。

---

## Phase 4: Upgrade System

### Task 11: 升级卡片池与随机

**Files:**
- Create: `js/upgrades.js`

- [ ] **Step 1: 创建 js/upgrades.js**

```js
// upgrades.js - 升级卡片定义与抽取
import { player } from './player.js';

// 所有升级卡定义
export const ALL_UPGRADES = [
  // === 属性强化 ===
  { id: 'atk_up_1', name: '攻击力提升', desc: '攻击力 +25%', rarity: 'common', category: 'stat',
    apply() { player.atkMultiplier += 0.25; }, emoji: '⚔️', maxStacks: 10,
    descStack(n) { return `攻击力 +${(0.25 * n * 100).toFixed(0)}%`; } },
  { id: 'atk_up_2', name: '强力攻击', desc: '攻击力 +50%', rarity: 'rare', category: 'stat',
    apply() { player.atkMultiplier += 0.50; }, emoji: '🗡️', maxStacks: 6,
    descStack(n) { return `攻击力 +${(0.50 * n * 100).toFixed(0)}%`; } },
  { id: 'atk_up_3', name: '战神之力', desc: '攻击力 +100%', rarity: 'legendary', category: 'stat',
    apply() { player.atkMultiplier += 1.0; }, emoji: '💪', maxStacks: 4,
    descStack(n) { return `攻击力 +${(n * 100).toFixed(0)}%`; } },

  { id: 'crit_up_1', name: '精准打击', desc: '暴击率 +5%', rarity: 'common', category: 'stat',
    apply() { player.critChance += 0.05; }, emoji: '🎯', maxStacks: 10,
    descStack(n) { return `暴击率 +${(n * 5).toFixed(0)}%`; } },
  { id: 'crit_up_2', name: '致命一击', desc: '暴击率 +10%', rarity: 'rare', category: 'stat',
    apply() { player.critChance += 0.10; }, emoji: '💢', maxStacks: 6,
    descStack(n) { return `暴击率 +${(n * 10).toFixed(0)}%`; } },

  { id: 'crit_dmg_1', name: '爆伤强化', desc: '暴击伤害 +50%', rarity: 'rare', category: 'stat',
    apply() { player.critMultiplier += 0.50; }, emoji: '💥', maxStacks: 8,
    descStack(n) { return `暴击伤害 +${(n * 50).toFixed(0)}%`; } },
  { id: 'crit_dmg_2', name: '毁灭暴击', desc: '暴击伤害 +100%', rarity: 'legendary', category: 'stat',
    apply() { player.critMultiplier += 1.0; }, emoji: '🔥', maxStacks: 4,
    descStack(n) { return `暴击伤害 +${(n * 100).toFixed(0)}%`; } },

  { id: 'range_up_1', name: '范围扩大', desc: '攻击范围 +20px', rarity: 'common', category: 'stat',
    apply() { player.clickRadius += 20; }, emoji: '⭕', maxStacks: 10,
    descStack(n) { return `范围 +${n * 20}px`; } },
  { id: 'range_up_2', name: '超大范围', desc: '攻击范围 +40px', rarity: 'rare', category: 'stat',
    apply() { player.clickRadius += 40; }, emoji: '🔵', maxStacks: 6,
    descStack(n) { return `范围 +${n * 40}px`; } },

  { id: 'speed_up', name: '快速连击', desc: '点击间隔 -0.03s', rarity: 'common', category: 'stat',
    apply() { player.clickCooldown = Math.max(0.02, player.clickCooldown - 0.03); }, emoji: '⚡', maxStacks: 8,
    descStack(n) { return `点击间隔 -${(n * 0.03).toFixed(2)}s`; } },

  { id: 'gold_up_1', name: '金币加成', desc: '金币 +30%', rarity: 'common', category: 'stat',
    apply() { player.goldBonus += 30; }, emoji: '💰', maxStacks: 10,
    descStack(n) { return `金币 +${n * 30}%`; } },
  { id: 'gold_up_2', name: '富豪光环', desc: '金币 +60%', rarity: 'rare', category: 'stat',
    apply() { player.goldBonus += 60; }, emoji: '💎', maxStacks: 6,
    descStack(n) { return `金币 +${n * 60}%`; } },

  { id: 'max_hp_up', name: '生命提升', desc: '最大HP +20', rarity: 'common', category: 'stat',
    apply() { player.maxHp += 20; player.hp = Math.min(player.hp + 20, player.maxHp); }, emoji: '❤️', maxStacks: 15,
    descStack(n) { return `最大HP +${n * 20}`; } },

  // === 攻击特效 ===
  { id: 'fire_enchant', name: '火焰附魔', desc: '点击附加3秒燃烧DOT', rarity: 'rare', category: 'effect',
    apply() { player.fireEnchant = (player.fireEnchant || 0) + 1; }, emoji: '🔥', maxStacks: 5,
    descStack(n) { return `燃烧层数 +${n} (每层3秒DOT)`; } },
  { id: 'ice_touch', name: '冰冻之触', desc: '点击减速敌人50%持续2秒', rarity: 'rare', category: 'effect',
    apply() { player.iceTouch = (player.iceTouch || 0) + 1; }, emoji: '❄️', maxStacks: 3,
    descStack(n) { return `冰冻强度 x${n}`; } },
  { id: 'chain_lightning', name: '闪电链', desc: '点击伤害跳跃至3个敌人', rarity: 'rare', category: 'effect',
    apply() { player.chainLightning = (player.chainLightning || 0) + 1; }, emoji: '⚡', maxStacks: 5,
    descStack(n) { return `闪电跳跃 ${2 + n} 次`; } },
  { id: 'split_shot', name: '分裂弹', desc: '点击射出4枚飞弹', rarity: 'rare', category: 'effect',
    apply() { player.splitShot = (player.splitShot || 0) + 1; }, emoji: '💫', maxStacks: 6,
    descStack(n) { return `飞弹数 ${3 + n} 枚`; } },
  { id: 'death_nova', name: '死亡新星', desc: '敌人死亡时爆炸AOE', rarity: 'legendary', category: 'effect',
    apply() { player.deathNova = (player.deathNova || 0) + 1; }, emoji: '💥', maxStacks: 5,
    descStack(n) { return `爆炸伤害 x${n}`; } },

  // === 召唤随从 ===
  { id: 'baby_slime', name: '小史莱姆', desc: '召唤自动攻击的史莱姆', rarity: 'common', category: 'companion',
    apply() { player.babySlime = (player.babySlime || 0) + 1; }, emoji: '💧', maxStacks: 8,
    descStack(n) { return `史莱姆数量 ${n}`; } },
  { id: 'fire_spirit', name: '火焰精灵', desc: '远程火球攻击', rarity: 'rare', category: 'companion',
    apply() { player.fireSpirit = (player.fireSpirit || 0) + 1; }, emoji: '🔥', maxStacks: 5,
    descStack(n) { return `精灵数量 ${n}`; } },
  { id: 'heal_fairy', name: '治疗妖精', desc: '每10秒回复5HP', rarity: 'rare', category: 'companion',
    apply() { player.healFairy = (player.healFairy || 0) + 1; }, emoji: '🧚', maxStacks: 5,
    descStack(n) { return `每10秒回复 ${n * 5} HP`; } },
  { id: 'gold_slime', name: '金币史莱姆', desc: '击杀额外掉落金币', rarity: 'rare', category: 'companion',
    apply() { player.goldSlime = (player.goldSlime || 0) + 1; }, emoji: '🪙', maxStacks: 5,
    descStack(n) { return `额外金币 x${n}`; } },

  // === 光环 ===
  { id: 'damage_aura', name: '伤害光环', desc: '每5秒全屏伤害', rarity: 'rare', category: 'aura',
    apply() { player.damageAura = (player.damageAura || 0) + 1; }, emoji: '💢', maxStacks: 8,
    descStack(n) { return `光环伤害 x${n}`; } },
  { id: 'heal_aura', name: '回复光环', desc: '每8秒回复3HP', rarity: 'rare', category: 'aura',
    apply() { player.healAura = (player.healAura || 0) + 1; }, emoji: '💚', maxStacks: 5,
    descStack(n) { return `每8秒回复 ${n * 3} HP`; } },
  { id: 'magnet_aura', name: '磁铁光环', desc: '金币自动飞向你', rarity: 'legendary', category: 'aura',
    apply() { player.magnetAura = true; }, emoji: '🧲', maxStacks: 1,
    descStack() { return '金币自动吸附'; } },
  { id: 'time_slow', name: '时间减速', desc: '敌人存活时间+30%', rarity: 'legendary', category: 'aura',
    apply() { player.timeSlow = (player.timeSlow || 0) + 1; }, emoji: '⏳', maxStacks: 3,
    descStack(n) { return `敌人存活时间 +${n * 30}%`; } },
  { id: 'thorn_aura', name: '荆棘光环', desc: '敌人造成伤害时反弹50%', rarity: 'legendary', category: 'aura',
    apply() { player.thornAura = (player.thornAura || 0) + 1; }, emoji: '🌿', maxStacks: 3,
    descStack(n) { return `反弹 ${n * 50}% 伤害`; } },

  // === 神话 ===
  { id: 'god_click', name: '神之一击', desc: '每次点击伤害翻倍', rarity: 'mythic', category: 'stat',
    apply() { player.atkMultiplier += 2.0; }, emoji: '👑', maxStacks: 3,
    descStack(n) { return `攻击力 x${Math.pow(2, n).toFixed(0)}`; } },
  { id: 'apocalypse', name: '天启', desc: '全屏敌人每秒受到伤害', rarity: 'mythic', category: 'aura',
    apply() { player.apocalypse = (player.apocalypse || 0) + 1; }, emoji: '🌋', maxStacks: 3,
    descStack(n) { return `每秒全屏 ${n * player.baseAtk} 伤害`; } },
  { id: 'phoenix', name: '凤凰涅槃', desc: '死亡时复活一次', rarity: 'mythic', category: 'effect',
    apply() { player.phoenix = (player.phoenix || 0) + 1; }, emoji: '🐦', maxStacks: 2,
    descStack(n) { return `复活次数 +${n}`; } },
];

// 稀有度权重
const RARITY_WEIGHTS = { common: 50, rare: 30, legendary: 15, mythic: 5 };

// 玩家已选卡片计数
const pickedCards = {}; // { cardId: count }

export function getPickCount(id) { return pickedCards[id] || 0; }

export function recordPick(id) {
  pickedCards[id] = (pickedCards[id] || 0) + 1;
}

// 抽取升级卡片池
export function rollUpgradeCards(count = 3) {
  const available = ALL_UPGRADES.filter(card => {
    const picked = pickedCards[card.id] || 0;
    return picked < card.maxStacks;
  });

  const results = [];
  const pool = [...available];

  // 保证至少 1 张稀有+
  let hasRarePlus = false;

  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;

    // 加权随机
    const totalWeight = pool.reduce((sum, c) => {
      const base = RARITY_WEIGHTS[c.rarity] || 10;
      // 已选次数越多，权重越低
      const picked = (pickedCards[c.id] || 0);
      const penalty = Math.max(0.1, 1 - picked * 0.25);
      return sum + base * penalty;
    }, 0);

    let roll = Math.random() * totalWeight;
    let picked = null;
    for (const card of pool) {
      const base = RARITY_WEIGHTS[card.rarity] || 10;
      const pc = (pickedCards[card.id] || 0);
      const penalty = Math.max(0.1, 1 - pc * 0.25);
      roll -= base * penalty;
      if (roll <= 0) { picked = card; break; }
    }
    if (!picked) picked = pool[pool.length - 1];

    results.push(picked);
    pool.splice(pool.indexOf(picked), 1); // 不重复

    if (['rare', 'legendary', 'mythic'].includes(picked.rarity)) {
      hasRarePlus = true;
    }
  }

  // 如果 3 张都没有稀有+，替换最后一张
  if (!hasRarePlus && results.length > 0) {
    const rarePlus = ALL_UPGRADES.filter(c =>
      ['rare', 'legendary', 'mythic'].includes(c.rarity) &&
      (pickedCards[c.id] || 0) < c.maxStacks &&
      !results.includes(c)
    );
    if (rarePlus.length > 0) {
      results[results.length - 1] = rarePlus[Math.floor(Math.random() * rarePlus.length)];
    }
  }

  return results;
}

export function resetPickedCards() {
  for (const key of Object.keys(pickedCards)) {
    delete pickedCards[key];
  }
}
```

- [ ] **Step 2: 验证** — 在控制台中调用 `rollUpgradeCards(3)`，确认返回 3 张不同卡片，稀有度分布合理。

---

### Task 12: 升级效果引擎 + UI 升级面板

**Files:**
- Create: `js/upgrade-effects.js`
- Modify: `js/ui-controller.js`（新建）

- [ ] **Step 1: 创建 js/upgrade-effects.js**

```js
// upgrade-effects.js - 升级效果执行引擎
import { player, heal } from './player.js';
import { enemies, getEnemiesInRange, getNearestEnemy } from './enemies.js';
import { spawnSplitProjectiles } from './projectiles.js';
import { processClick } from './combat.js';
import { recordPick } from './upgrades.js';

// 应用一张升级卡的效果
export function applyUpgrade(card) {
  card.apply();
  recordPick(card.id);
  // 副作用处理（特殊卡需要额外逻辑的在这里）
  applySideEffects(card);
}

function applySideEffects(card) {
  // 大部分卡的效果在其 apply() 中直接修改 player 属性
  // 需要额外逻辑的在这里处理
  switch (card.id) {
    case 'phoenix':
      // 标记生效，实际逻辑在 combat 死亡检测中
      break;
    case 'magnet_aura':
      // 标记生效，实际逻辑在金币更新中
      break;
  }
}

// 处理攻击特效（在 combat processClick 之后调用）
export function triggerClickEffects(x, y, targetEnemies) {
  // 火焰附魔：给敌人加 DOT
  if (player.fireEnchant) {
    for (const enemy of targetEnemies) {
      if (!enemy.alive) continue;
      // 添加燃烧 DOT (3s * 层数)
      enemy.burnDOT = (enemy.burnDOT || 0) + player.fireEnchant * player.baseAtk * 0.3;
      enemy.burnDuration = (enemy.burnDuration || 0) + 3;
    }
  }

  // 冰冻之触：减速敌人
  if (player.iceTouch) {
    for (const enemy of targetEnemies) {
      if (!enemy.alive) continue;
      enemy.slowAmount = Math.max(enemy.slowAmount || 0, 0.5 * player.iceTouch);
      enemy.slowDuration = 2;
    }
  }

  // 闪电链：跳跃伤害
  if (player.chainLightning) {
    const jumps = 2 + player.chainLightning;
    let lastEnemy = targetEnemies[0];
    const hitSet = new Set(targetEnemies.map(e => e));
    for (let i = 0; i < jumps && lastEnemy; i++) {
      const nearby = enemies.filter(e => e.alive && !hitSet.has(e));
      if (nearby.length === 0) break;
      // 找最近的
      let nearest = null, minDist = Infinity;
      for (const e of nearby) {
        const dx = e.x - lastEnemy.x, dy = e.y - lastEnemy.y;
        const d = dx * dx + dy * dy;
        if (d < minDist && d < 200 * 200) { minDist = d; nearest = e; }
      }
      if (!nearest) break;
      nearest.takeDamage(player.baseAtk * (1 + player.atkMultiplier) * 0.5);
      hitSet.add(nearest);
      lastEnemy = nearest;
    }
  }

  // 分裂弹
  if (player.splitShot) {
    spawnSplitProjectiles(x, y, 3 + player.splitShot, player.baseAtk * (1 + player.atkMultiplier) * 0.4);
  }
}

// 处理死亡新星（在敌人死亡时调用）
export function triggerDeathNova(x, y) {
  if (!player.deathNova) return;
  const nearby = getEnemiesInRange(x, y, 120);
  const dmg = player.baseAtk * (1 + player.atkMultiplier) * 0.5 * player.deathNova;
  for (const e of nearby) {
    e.takeDamage(dmg);
  }
}

// 更新 DOT 效果
export function updateDOTEffects(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    // 燃烧 DOT
    if (enemy.burnDOT > 0 && enemy.burnDuration > 0) {
      enemy.hp -= enemy.burnDOT * dt / enemy.burnDuration;
      enemy.burnDuration -= dt;
      if (enemy.burnDuration <= 0) {
        enemy.burnDOT = 0;
        enemy.burnDuration = 0;
      }
      if (enemy.hp <= 0) enemy.alive = false;
    }
    // 减速
    if (enemy.slowDuration > 0) {
      enemy.slowDuration -= dt;
      if (enemy.slowDuration <= 0) {
        enemy.slowAmount = 0;
        enemy.slowDuration = 0;
      }
    }
  }
}
```

- [ ] **Step 2: 创建 js/ui-controller.js（升级面板部分）**

```js
// ui-controller.js - DOM UI 控制
import { player } from './player.js';
import { rollUpgradeCards, getPickCount } from './upgrades.js';
import { applyUpgrade } from './upgrade-effects.js';
import { pause, resume, isPaused } from './game-loop.js';

const RARITY_CLASSES = {
  common: 'rarity-common',
  rare: 'rarity-rare',
  legendary: 'rarity-legendary',
  mythic: 'rarity-mythic',
};

const RARITY_NAMES = {
  common: '⭐ 普通',
  rare: '⭐⭐ 稀有',
  legendary: '⭐⭐⭐ 传说',
  mythic: '⭐⭐⭐⭐ 神话',
};

const RARITY_BORDERS = {
  common: '#7f8c8d',
  rare: '#a29bfe',
  legendary: '#ffd93d',
  mythic: 'transparent',
};

let upgradeCallback = null; // 用户选择后回调

export function showUpgradePanel() {
  const panel = document.getElementById('upgrade-panel');
  const cardsContainer = document.getElementById('upgrade-cards');

  const cards = rollUpgradeCards(3);
  if (cards.length === 0) {
    // 无可用升级，跳过
    return;
  }

  pause();
  panel.classList.remove('hidden');
  cardsContainer.innerHTML = '';

  cards.forEach(card => {
    const picked = getPickCount(card.id);
    const cardEl = document.createElement('div');
    cardEl.className = 'upgrade-card';
    const isMythic = card.rarity === 'mythic';

    cardEl.style.cssText = `
      width: 240px; padding: 20px; border-radius: 16px;
      background: #16213e;
      border: 3px solid ${RARITY_BORDERS[card.rarity]};
      cursor: pointer; text-align: center;
      ${isMythic ? 'background: linear-gradient(135deg, rgba(255,107,107,0.2), rgba(107,201,255,0.2)); border-image: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bc9ff, #a8e6cf) 1;' : ''}
    `;

    if (['rare', 'legendary'].includes(card.rarity)) {
      cardEl.style.boxShadow = `0 0 12px ${RARITY_BORDERS[card.rarity]}40`;
    }

    cardEl.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 8px;">${card.emoji}</div>
      <div style="font-size: 11px; color: ${RARITY_BORDERS[card.rarity]}; margin-bottom: 4px;">${RARITY_NAMES[card.rarity]}</div>
      <h3 style="margin: 4px 0; color: #fff; font-size: 18px;">${card.name}</h3>
      <p style="color: #aaa; font-size: 14px; margin: 8px 0;">${card.desc}</p>
      ${picked > 0 ? `<p style="color: #888; font-size: 11px;">已选 ${picked} 次 · ${card.descStack(picked)}</p>` : '<p style="color: #555; font-size: 11px;">未选择过</p>'}
      <p style="color: #666; font-size: 10px;">最多 ${card.maxStacks} 次</p>
    `;

    cardEl.addEventListener('click', () => selectCard(card));
    cardsContainer.appendChild(cardEl);
  });

  // 添加键盘快捷键（1/2/3 选择）
  const handler = (e) => {
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      const idx = parseInt(e.key) - 1;
      if (cards[idx]) selectCard(cards[idx]);
      document.removeEventListener('keydown', handler);
    }
  };
  document.addEventListener('keydown', handler);
}

function selectCard(card) {
  applyUpgrade(card);
  document.getElementById('upgrade-panel').classList.add('hidden');
  updateBuildBar();
  resume();
}

export function updateBuildBar() {
  const container = document.getElementById('build-cards');
  const countEl = document.getElementById('build-count');
  // 从 player 的属性反向构建标签显示
  const builds = [];
  if (player.atkMultiplier > 0) builds.push({ name: 'ATK', value: `+${(player.atkMultiplier * 100).toFixed(0)}%`, rarity: 'common' });
  if (player.critChance > 0.05) builds.push({ name: '暴击', value: `${(player.critChance * 100).toFixed(0)}%`, rarity: 'rare' });
  if (player.fireEnchant) builds.push({ name: '火焰', value: `Lv${player.fireEnchant}`, rarity: 'rare' });
  if (player.babySlime) builds.push({ name: '史莱姆', value: `x${player.babySlime}`, rarity: 'common' });
  if (player.damageAura) builds.push({ name: '光环', value: `Lv${player.damageAura}`, rarity: 'rare' });
  if (player.magnetAura) builds.push({ name: '磁铁', value: '✓', rarity: 'legendary' });
  if (player.phoenix) builds.push({ name: '凤凰', value: `x${player.phoenix}`, rarity: 'mythic' });
  if (player.deathNova) builds.push({ name: '新星', value: `Lv${player.deathNova}`, rarity: 'legendary' });
  // ... 可继续添加

  container.innerHTML = builds.map(b =>
    `<span class="build-tag ${RARITY_CLASSES[b.rarity] || 'rarity-common'}">${b.name} ${b.value}</span>`
  ).join('');
  countEl.textContent = `${builds.length} 张卡`;
}

export function hideAllPanels() {
  document.getElementById('upgrade-panel').classList.add('hidden');
  document.getElementById('gameover-panel').classList.add('hidden');
  document.getElementById('boss-hp-bar').classList.add('hidden');
  document.getElementById('wave-announce').classList.add('hidden');
}
```

- [ ] **Step 3: 验证** — 手动调用 `showUpgradePanel()`，确认 3 张卡片正确显示，点击选择后面板消失。

---

## Phase 5: Companions & Auras

### Task 13: 随从系统

**Files:**
- Create: `js/companions.js`

- [ ] **Step 1: 创建 js/companions.js**

```js
// companions.js - 随从系统
import { player } from './player.js';
import { enemies, getNearestEnemy } from './enemies.js';
import { getCtx, getWidth, getHeight } from './canvas.js';
import { Projectile, addProjectile } from './projectiles.js';

const companions = [];
const COMPANION_CONFIGS = {
  babySlime: { emoji: '💧', color: '#A8E6CF', size: 14, atkInterval: 1.2, damage: 8, range: 200, type: 'melee' },
  fireSpirit: { emoji: '🔥', color: '#FF6B6B', size: 12, atkInterval: 1.8, damage: 15, range: 350, type: 'ranged' },
  healFairy: { emoji: '🧚', color: '#FFD93D', size: 10, atkInterval: 10, damage: 0, range: 0, type: 'heal' },
  goldSlime: { emoji: '🪙', color: '#FFD93D', size: 14, atkInterval: 0, damage: 0, range: 0, type: 'passive' },
};

export function initCompanions() {
  companions.length = 0;
}

export function updateCompanions(dt) {
  // 根据 player 的计数器同步随从数量
  syncCount('babySlime');
  syncCount('fireSpirit');
  syncCount('healFairy');
  syncCount('goldSlime');

  // 更新每个随从
  for (const comp of companions) {
    comp.atkTimer += dt;
    comp.x += (Math.random() - 0.5) * 30 * dt; // 微小漂移
    comp.y += (Math.random() - 0.5) * 30 * dt;

    // 保持在屏幕界限内
    const W = getWidth(), H = getHeight();
    comp.x = Math.max(50, Math.min(W - 50, comp.x));
    comp.y = Math.max(100, Math.min(H - 60, comp.y));

    // 攻击逻辑
    if (comp.atkTimer >= comp.config.atkInterval && comp.config.type !== 'passive') {
      comp.atkTimer = 0;
      const target = getNearestEnemy(comp.x, comp.y);
      if (target) {
        const dx = target.x - comp.x, dy = target.y - comp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= comp.config.range) {
          if (comp.config.type === 'melee') {
            target.takeDamage(comp.config.damage + player.baseAtk * 0.3);
          } else if (comp.config.type === 'ranged') {
            addProjectile(new Projectile(comp.x, comp.y, {
              vx: (dx / dist) * 350,
              vy: (dy / dist) * 350,
              speed: 350,
              damage: comp.config.damage + player.baseAtk * 0.3,
              color: comp.config.color,
              size: 5,
              life: 1.0,
            }));
          } else if (comp.config.type === 'heal') {
            // 治疗妖精：回复 HP
            import('./player.js').then(m => m.heal(5 * (player.healFairy || 0)));
          }
        }
      }
    }
  }
}

function syncCount(typeKey) {
  const count = player[typeKey] || 0;
  const config = COMPANION_CONFIGS[typeKey];
  if (!config) return;

  const existing = companions.filter(c => c.typeKey === typeKey);
  while (existing.length < count) {
    const comp = {
      typeKey,
      config,
      x: Math.random() * (getWidth() - 100) + 50,
      y: Math.random() * (getHeight() - 200) + 150,
      atkTimer: Math.random() * config.atkInterval,
    };
    companions.push(comp);
    existing.push(comp);
  }
  while (existing.length > count) {
    const toRemove = existing.pop();
    const idx = companions.indexOf(toRemove);
    if (idx >= 0) companions.splice(idx, 1);
  }
}

export function renderCompanions() {
  const ctx = getCtx();
  for (const comp of companions) {
    ctx.save();
    ctx.font = `${comp.config.size * 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(comp.config.emoji, comp.x, comp.y);
    // 光环圈
    ctx.strokeStyle = comp.config.color + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(comp.x, comp.y, comp.config.size + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
```

- [ ] **Step 2: 验证** — 设置 `player.babySlime = 2` 后可见 2 只史莱姆随从在屏幕上跟随并攻击敌人。

---

### Task 14: 光环系统

**Files:**
- Create: `js/auras.js`

- [ ] **Step 1: 创建 js/auras.js**

```js
// auras.js - 光环/被动触发系统
import { player, heal, takeDamage } from './player.js';
import { enemies } from './enemies.js';

let auraTimers = {
  damage: 0,
  heal: 0,
};

export function resetAuras() {
  auraTimers.damage = 0;
  auraTimers.heal = 0;
}

export function updateAuras(dt) {
  // 伤害光环
  if (player.damageAura) {
    auraTimers.damage += dt;
    const interval = 5; // 每5秒
    if (auraTimers.damage >= interval) {
      auraTimers.damage -= interval;
      const dmg = player.damageAura * player.baseAtk * (1 + player.atkMultiplier) * 0.5;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        enemy.takeDamage(dmg);
      }
    }
  }

  // 回复光环
  if (player.healAura) {
    auraTimers.heal += dt;
    const interval = 8;
    if (auraTimers.heal >= interval) {
      auraTimers.heal -= interval;
      heal(player.healAura * 3);
    }
  }

  // 天启（神话光环）
  if (player.apocalypse) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.hp -= player.apocalypse * player.baseAtk * dt;
      if (enemy.hp <= 0) enemy.alive = false;
    }
  }
}

// 荆棘光环（在玩家受伤时调用）
export function triggerThornAura(damageTaken) {
  if (!player.thornAura) return;
  const reflectDmg = damageTaken * 0.5 * player.thornAura;
  // 随机选择一个敌人反弹
  const alive = enemies.filter(e => e.alive);
  if (alive.length > 0) {
    const target = alive[Math.floor(Math.random() * alive.length)];
    target.takeDamage(reflectDmg);
  }
}

// 磁铁光环：金币吸附
export function applyMagnetEffect(goldObjects, dt) {
  if (!player.magnetAura) return;
  // goldObjects: [{x, y, amount}]
  // 向屏幕中心吸附
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (const g of goldObjects) {
    const dx = cx - g.x, dy = cy - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    g.x += (dx / dist) * 400 * dt;
    g.y += (dy / dist) * 400 * dt;
  }
}
```

- [ ] **Step 2: 验证** — 设置 `player.damageAura = 3` 并启动游戏循环，每 5 秒全屏敌人扣血。

---

## Phase 6: Audio

### Task 15: 音效系统

**Files:**
- Create: `js/audio.js`

- [ ] **Step 1: 创建 js/audio.js**

```js
// audio.js - Web Audio API 程序化音效
let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let initialized = false;

function ensureContext() {
  if (!initialized) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.7;
    sfxGain.connect(masterGain);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.3;
    musicGain.connect(masterGain);

    initialized = true;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// 播放音调
function playTone(freq, duration, type = 'sine', gainNode = sfxGain, freqEnd = null) {
  ensureContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(gainNode);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

// 播放噪声
function playNoise(duration, gainNode = sfxGain) {
  ensureContext();
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(gain);
  gain.connect(gainNode);
  source.start();
}

// === 音效 API ===
export function sfxHit()       { playTone(80, 0.05, 'sine'); }        // 点击命中
export function sfxCrit()      { playTone(200, 0.08, 'sine'); playTone(400, 0.06, 'triangle'); } // 暴击
export function sfxKill()      { playTone(400, 0.1, 'triangle', sfxGain, 200); } // 击杀
export function sfxBossHit()   { playTone(60, 0.08, 'sine'); }         // Boss 命中
export function sfxBossKill()  { playNoise(0.3); playTone(60, 0.4, 'sine'); }  // Boss 击杀
export function sfxGold()      { playTone(800, 0.08, 'sine', sfxGain, 1200); } // 金币
export function sfxUpgrade()   { // C-E-G 和弦
  playTone(523, 0.15, 'sine'); playTone(659, 0.15, 'sine'); playTone(784, 0.15, 'sine');
  setTimeout(() => { playTone(523, 0.15, 'sine'); playTone(659, 0.15, 'sine'); playTone(784, 0.15, 'sine'); }, 200);
}
export function sfxWaveStart() { playTone(300, 0.3, 'sawtooth', sfxGain, 500); } // 波次提示
export function sfxBossWarn()  { // Boss 警告
  playTone(150, 0.15, 'square');
  setTimeout(() => playTone(150, 0.15, 'square'), 250);
  setTimeout(() => playTone(150, 0.15, 'square'), 500);
}
export function sfxHurt()      { playTone(300, 0.2, 'sine', sfxGain, 150); } // 玩家受伤
export function sfxGameOver()  { // 下行旋律
  playTone(400, 0.25, 'triangle'); setTimeout(() => playTone(350, 0.25, 'triangle'), 250);
  setTimeout(() => playTone(300, 0.25, 'triangle'), 500); setTimeout(() => playTone(250, 0.4, 'triangle'), 750);
}
export function sfxHeartbeat() { playTone(50, 0.1, 'sine'); } // 心跳

// BGM
let bgmInterval = null;
export function startBGM() {
  ensureContext();
  stopBGM();
  // 简单的循环旋律
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047]; // C5 大调
  let idx = 0;
  bgmInterval = setInterval(() => {
    playTone(notes[idx % notes.length], 0.2, 'triangle', musicGain);
    idx++;
  }, 500);
}

export function stopBGM() {
  if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
}

export function startBossBGM() {
  stopBGM();
  // Boss 战 BGM：更快节奏 + 低音
  const notes = [196, 220, 247, 262, 294, 330, 349, 392]; // G3-G4
  let idx = 0;
  bgmInterval = setInterval(() => {
    playTone(notes[idx % notes.length], 0.15, 'sawtooth', musicGain);
    idx++;
  }, 300);
}

export function setMasterVolume(v) { if (masterGain) masterGain.gain.value = v; }
export function setSFXVolume(v) { if (sfxGain) sfxGain.gain.value = v; }
export function setMusicVolume(v) { if (musicGain) musicGain.gain.value = v; }
```

- [ ] **Step 2: 验证** — 在控制台中调用 `sfxHit()` 确认能听到音效。

---

## Phase 7: UI Polish

### Task 16: HUD 更新 & 波次提示

**Files:**
- Modify: `js/ui-controller.js` — 添加 HUD 更新和波次提示

- [ ] **Step 1: 扩展 ui-controller.js — HUD 更新**

```js
// 在 ui-controller.js 中追加：
export function updateHUD() {
  document.getElementById('hud-hp').innerHTML = `❤️ <strong>${player.hp}</strong>/${player.maxHp}`;
  document.getElementById('hud-gold').innerHTML = `🪙 <strong>${player.gold}</strong>`;
  const effAtk = Math.floor(player.baseAtk * (1 + player.atkMultiplier));
  document.getElementById('hud-atk').innerHTML = `⚔️ <strong>${effAtk}</strong>`;

  const t = Math.floor(window._gameTime || 0);
  const m = Math.floor(t / 60), s = (t % 60).toString().padStart(2, '0');
  document.getElementById('hud-time').textContent = `⏱️ ${m}:${s}`;
  document.getElementById('hud-kills').textContent = `💀 ${player.kills}`;
}

export function showWaveAnnounce(text, duration = 2) {
  const el = document.getElementById('wave-announce');
  const textEl = document.getElementById('wave-announce-text');
  textEl.textContent = text;
  el.classList.remove('hidden');
  el.classList.add('wave-enter');
  setTimeout(() => {
    el.classList.add('wave-exit');
    setTimeout(() => el.classList.add('hidden'), 400);
  }, duration * 1000);
}

// 暴露游戏时间供 HUD 使用
export function setGameTimeForHUD(t) { window._gameTime = t; }
```

- [ ] **Step 2: 验证** — 游戏运行时 HUD 数值实时更新。

---

### Task 17: 游戏结束面板完善

**Files:**
- Modify: `js/ui-controller.js` — 添加 showGameOver

- [ ] **Step 1: 扩展 ui-controller.js — 游戏结束**

```js
// 在 ui-controller.js 中追加：
export function showGameOver(survived, kills, gold) {
  const panel = document.getElementById('gameover-panel');
  panel.classList.remove('hidden');

  const m = Math.floor(survived / 60), s = (survived % 60).toString().padStart(2, '0');
  document.getElementById('gameover-stats').innerHTML = `
    <p>⏱️ 存活时间: <strong>${m}:${s}</strong></p>
    <p>💀 击杀敌人: <strong>${kills}</strong></p>
    <p>🪙 获得金币: <strong>${gold}</strong></p>
    <p>🌊 到达波次: <strong>${window._currentWave || 1}</strong></p>
    <p>⚔️ 最终攻击力: <strong>${Math.floor(player.baseAtk * (1 + player.atkMultiplier))}</strong></p>
  `;

  // 构筑回顾
  const builds = getBuildSummary();
  document.getElementById('gameover-build').innerHTML = `
    <p>🏆 本局构筑:</p>
    ${builds.map(b => `<span class="build-tag ${b.cls}">${b.name} ${b.value}</span>`).join(' ')}
  `;
}

function getBuildSummary() {
  const builds = [];
  if (player.atkMultiplier > 0) builds.push({ name: 'ATK', value: `+${(player.atkMultiplier * 100).toFixed(0)}%`, cls: 'rarity-common' });
  if (player.critChance > 0.05) builds.push({ name: '暴击率', value: `${(player.critChance * 100).toFixed(0)}%`, cls: 'rarity-rare' });
  if (player.fireEnchant) builds.push({ name: '火焰', value: `${player.fireEnchant}层`, cls: 'rarity-rare' });
  if (player.iceTouch) builds.push({ name: '冰冻', value: `${player.iceTouch}层`, cls: 'rarity-rare' });
  if (player.chainLightning) builds.push({ name: '闪电链', value: `${player.chainLightning}层`, cls: 'rarity-rare' });
  if (player.splitShot) builds.push({ name: '分裂弹', value: `${player.splitShot}层`, cls: 'rarity-rare' });
  if (player.deathNova) builds.push({ name: '死亡新星', value: `${player.deathNova}层`, cls: 'rarity-legendary' });
  if (player.babySlime) builds.push({ name: '史莱姆', value: `x${player.babySlime}`, cls: 'rarity-common' });
  if (player.fireSpirit) builds.push({ name: '火精灵', value: `x${player.fireSpirit}`, cls: 'rarity-rare' });
  if (player.goldSlime) builds.push({ name: '金币史莱姆', value: `x${player.goldSlime}`, cls: 'rarity-rare' });
  if (player.healFairy) builds.push({ name: '治疗妖精', value: `x${player.healFairy}`, cls: 'rarity-rare' });
  if (player.damageAura) builds.push({ name: '伤害光环', value: `${player.damageAura}层`, cls: 'rarity-rare' });
  if (player.healAura) builds.push({ name: '回复光环', value: `${player.healAura}层`, cls: 'rarity-rare' });
  if (player.magnetAura) builds.push({ name: '磁铁', value: '✓', cls: 'rarity-legendary' });
  if (player.thornAura) builds.push({ name: '荆棘', value: `${player.thornAura}层`, cls: 'rarity-legendary' });
  if (player.apocalypse) builds.push({ name: '天启', value: `${player.apocalypse}层`, cls: 'rarity-mythic' });
  if (player.phoenix) builds.push({ name: '凤凰', value: `x${player.phoenix}`, cls: 'rarity-mythic' });
  return builds;
}

export { getBuildSummary };
```

- [ ] **Step 2: 验证** — 触发 game over，确认面板显示完整统计和构筑回顾。

---

## Phase 8: Integration & Balance

### Task 18: main.js 完整集成

**Files:**
- Modify: `js/main.js` — 连接所有系统

- [ ] **Step 1: 重写 js/main.js — 完整集成**

```js
// main.js - 完整游戏入口
import { initCanvas, clearCanvas, getCanvas, getMousePos, triggerShake, updateShake, getShakeOffset } from './canvas.js';
import { startLoop, stopLoop, pause, resume, onUpdate, onRender, getGameTime, isPaused } from './game-loop.js';
import { player, resetPlayer, setGoldCallback, setHpCallback, setDeathCallback, addGold } from './player.js';
import { enemies, cleanupEnemies, Enemy } from './enemies.js';
import { processClick, updateCombat, onHit, onKill, onGoldDrop, onExpire } from './combat.js';
import { initWaveManager, resetWaveManager, advanceWave, getCurrentWave, setWaveCallback, setBossSpawnCallback, setBossDefeatedCallback } from './wave-manager.js';
import { registerBoss, unregisterBoss, updateBoss, updateBossHPUI } from './boss.js';
import { spawnHitParticles, spawnCritParticles, spawnDeathParticles, spawnGoldParticles, spawnBossDeathParticles, spawnDamageNumber, spawnRipple, updateParticles, renderParticles, updateRipples, renderRipples, clearAllParticles } from './particles.js';
import { updateProjectiles, renderProjectiles, clearAllProjectiles } from './projectiles.js';
import { triggerClickEffects, triggerDeathNova, updateDOTEffects } from './upgrade-effects.js';
import { resetPickedCards } from './upgrades.js';
import { initCompanions, updateCompanions, renderCompanions } from './companions.js';
import { resetAuras, updateAuras, triggerThornAura } from './auras.js';
import { showUpgradePanel, updateHUD, showWaveAnnounce, showGameOver, updateBuildBar, hideAllPanels, setGameTimeForHUD } from './ui-controller.js';
import { sfxHit, sfxCrit, sfxKill, sfxBossHit, sfxBossKill, sfxGold, sfxUpgrade, sfxWaveStart, sfxBossWarn, sfxHurt, sfxGameOver, sfxHeartbeat, startBGM, stopBGM, startBossBGM } from './audio.js';

// UI 元素
const startPanel = document.getElementById('start-panel');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const highScoreDisplay = document.getElementById('high-score-display');

const HIGH_SCORE_KEY = 'slime_roguelike_high_score';
let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
if (highScore > 0) {
  highScoreDisplay.textContent = `🏆 最高存活: ${formatTime(highScore)}`;
}

btnStart.addEventListener('click', () => {
  startPanel.classList.add('hidden');
  startBGM();
  startGame();
});

btnRestart.addEventListener('click', () => {
  document.getElementById('gameover-panel').classList.add('hidden');
  startBGM();
  startGame();
});

function startGame() {
  resetPlayer();
  resetWaveManager();
  resetPickedCards();
  clearAllParticles();
  clearAllProjectiles();
  enemies.length = 0;
  resetAuras();
  initCompanions();
  hideAllPanels();
  updateBuildBar();

  registerSystems();
  registerCallbacks();
  setupInput();
  initCanvas();
  initWaveManager();
  updateHUD();
  updateBuildBar();

  if (!window._loopStarted) {
    startLoop();
    window._loopStarted = true;
  } else {
    resume();
  }
}

function registerSystems() {
  // 更新系统（清除之前注册的回调，重新注册）
  // 这里简单处理：通过 onUpdate/onRender 在每次 startGame 重新注册
  // 实际项目中应将回调 ID 化

  // 这些调用幂等，多次调用只注册一次回调
  // 为简化，这里用标记防止重复注册
  if (window._systemsRegistered) return;
  window._systemsRegistered = true;

  onUpdate((dt) => {
    setGameTimeForHUD(getGameTime());
    updateShake(dt);
    updateCombat(dt);
    updateDOTEffects(dt);
    updateAuras(dt);
    updateCompanions(dt);

    // 更新敌人
    for (const enemy of enemies) enemy.update(dt);

    // 金币磁铁
    // (金币对象在 goldDrops 数组中处理)

    updateParticles(dt);
    updateRipples(dt);
    updateProjectiles(dt);
    updateBoss(dt);

    // Boss HP UI
    const activeBoss = enemies.find(e => e.isBoss && e.alive);
    if (activeBoss) updateBossHPUI(activeBoss);

    // 清理死亡敌人
    cleanupEnemies();

    // 更新 HUD
    updateHUD();

    // HP 过低心跳
    if (player.hp > 0 && player.hp < player.maxHp * 0.25 && Math.random() < dt * 1.2) {
      sfxHeartbeat();
    }
  });

  onRender(() => {
    const shake = getShakeOffset();
    clearCanvas();
    const ctx = document.getElementById('game-canvas').getContext('2d');
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 渲染敌人
    renderEnemies();
    // 渲染投射物
    renderProjectiles();
    // 渲染粒子
    renderParticles();
    renderRipples();
    // 渲染随从
    renderCompanions();
    // 渲染金币掉落
    renderGoldDrops();

    ctx.restore();
  });
}

// 金币掉落对象
const goldDrops = [];

function renderEnemies() {
  const ctx = document.getElementById('game-canvas').getContext('2d');
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.scale(enemy.scale, enemy.scale);

    // 阴影
    ctx.shadowColor = enemy.color + '40';
    ctx.shadowBlur = 12;

    // 身体
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
    ctx.fill();

    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-enemy.size * 0.25, -enemy.size * 0.25, enemy.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.font = `${enemy.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.emoji, 0, 0);

    // Boss 光环
    if (enemy.isBoss) {
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // 血条（Boss 在 DOM 中显示，普通怪头顶小血条）
    if (!enemy.isBoss && enemy.hp < enemy.maxHp) {
      const barW = enemy.size * 2;
      const barH = 4;
      const barY = enemy.y - enemy.size - 10;
      const pct = enemy.hp / enemy.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(enemy.x - barW / 2, barY, barW, barH);
      ctx.fillStyle = pct > 0.5 ? '#A8E6CF' : pct > 0.25 ? '#FFD93D' : '#FF6B6B';
      ctx.fillRect(enemy.x - barW / 2, barY, barW * pct, barH);
    }

    // 生存时间指示器（头顶秒表圈）
    const timePct = enemy.age / enemy.lifetime;
    if (timePct > 0.5) {
      const arcY = enemy.y - enemy.size - 16;
      ctx.strokeStyle = timePct > 0.8 ? '#FF6B6B' : '#FFD93D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, arcY, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timePct);
      ctx.stroke();
    }
  }
}

function renderGoldDrops() {
  const ctx = document.getElementById('game-canvas').getContext('2d');
  for (const g of goldDrops) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, g.life / 0.3);
    ctx.fillStyle = '#FFD93D';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💰 ' + g.amount, g.x, g.y);
    ctx.restore();
  }
}

function registerCallbacks() {
  setGoldCallback((amount) => { /* 金币变化由 HUD 更新处理 */ });
  setHpCallback((hp, max) => {
    updateHUD();
    if (hp <= 0) return; // 死亡时由 onPlayerDeath 处理
  });

  setDeathCallback(() => {
    sfxGameOver();
    stopBGM();
    const survived = Math.floor(getGameTime());
    if (survived > highScore) {
      highScore = survived;
      localStorage.setItem(HIGH_SCORE_KEY, highScore);
    }
    setTimeout(() => {
      showGameOver(survived, player.kills, player.gold);
    }, 800);
  });

  setWaveCallback((wave) => {
    document.getElementById('hud-wave').textContent = `🌊 波次 ${wave}`;
    const isBossWave = wave % 5 === 0;
    if (isBossWave) {
      sfxBossWarn();
      showWaveAnnounce('⚠️ BOSS 来袭!', 1.5);
    } else {
      sfxWaveStart();
      showWaveAnnounce(`第 ${wave} 波`, 1.5);
    }
    updateBuildBar();
  });

  setBossSpawnCallback((boss) => {
    registerBoss(boss);
    startBossBGM();
  });

  setBossDefeatedCallback((boss) => {
    sfxBossKill();
    spawnBossDeathParticles(boss.x, boss.y);
    unregisterBoss();
    stopBGM();
    startBGM();
    // 弹出升级面板
    setTimeout(() => showUpgradePanel(), 600);
  });

  onHit((enemy, damage, isCrit, x, y) => {
    if (isCrit) {
      sfxCrit();
      spawnCritParticles(x, y);
      triggerShake(8, 0.12);
    } else {
      sfxHit();
      spawnHitParticles(x, y);
      triggerShake(3, 0.06);
    }
    spawnDamageNumber(x, y, damage, isCrit);
  });

  onKill((enemy, x, y) => {
    sfxKill();
    spawnDeathParticles(x, y, enemy.color);
    // 死亡新星
    triggerDeathNova(x, y);
    // 金币掉落
    goldDrops.push({ x, y, amount: Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin, life: 3, vy: -150 });
    sfxGold();
    spawnGoldParticles(x, y);
  });

  onGoldDrop((amount, x, y) => {
    updateHUD();
  });

  onExpire((enemy) => {
    sfxHurt();
    triggerThornAura(enemy.damage);
  });
}

function setupInput() {
  const canvas = getCanvas();
  canvas.addEventListener('click', (e) => {
    if (isPaused()) return;
    const pos = getMousePos(e);
    const now = performance.now() / 1000;
    if (now - player.lastClickTime < player.clickCooldown) return;
    player.lastClickTime = now;

    const result = processClick(pos.x, pos.y);
    if (result.hit) {
      spawnRipple(pos.x, pos.y);
      triggerClickEffects(pos.x, pos.y, result.targets.map(r => r.enemy));
    }
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 初始化
initCanvas();
```

- [ ] **Step 2: 验证** — 完整游戏流程可玩：开始 → 点击战斗 → Boss → 升级 → 死亡结算 → 再玩。

---

### Task 19: 数值平衡模拟器

**Files:**
- Create: `tools/balance-sim.html`

- [ ] **Step 1: 创建 tools/balance-sim.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>数值平衡模拟器</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #dfe6e9; padding: 20px; }
  h1 { color: #FFD93D; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th, td { border: 1px solid #333; padding: 8px 12px; text-align: center; }
  th { background: #16213e; color: #FFD93D; }
  .section { background: #16213e; border-radius: 12px; padding: 16px; margin: 16px 0; }
  input, button { padding: 8px 16px; border-radius: 8px; border: none; margin: 4px; }
  input { background: #2d3436; color: #fff; width: 80px; }
  button { background: #FF6B8A; color: #fff; cursor: pointer; font-weight: bold; }
  button:hover { background: #FF8E9E; }
  .result { color: #FFD93D; font-size: 18px; }
  .warn { color: #FF6B6B; }
  .good { color: #A8E6CF; }
</style>
</head>
<body>
<h1>📊 数值平衡模拟器</h1>

<div class="section">
  <h3>玩家参数</h3>
  <label>ATK: <input id="sim-atk" type="number" value="10"></label>
  <label>暴击率: <input id="sim-crit" type="number" value="0.05" step="0.01"></label>
  <label>暴击倍率: <input id="sim-critMult" type="number" value="2" step="0.5"></label>
  <label>攻速(秒): <input id="sim-speed" type="number" value="0.15" step="0.01"></label>
  <label>范围(px): <input id="sim-range" type="number" value="80"></label>
  <label>波次: <input id="sim-wave" type="number" value="5"></label>
  <button onclick="simulate()">▶ 模拟</button>
</div>

<div class="section" id="results">
  <h3>模拟结果</h3>
  <p>点击"模拟"开始...</p>
</div>

<script>
function simulate() {
  const atk = parseFloat(document.getElementById('sim-atk').value);
  const crit = parseFloat(document.getElementById('sim-crit').value);
  const critMult = parseFloat(document.getElementById('sim-critMult').value);
  const atkSpeed = parseFloat(document.getElementById('sim-speed').value);
  const range = parseInt(document.getElementById('sim-range').value);
  const wave = parseInt(document.getElementById('sim-wave').value);

  const scale = 1 + Math.floor((wave - 1) / 5) * 0.3;
  const enemyTypes = [];
  if (wave >= 1) enemyTypes.push({ name: '绿史莱姆', hp: 10 * scale, count: 8, speed: 40, lifetime: 12, dmg: 5 * scale });
  if (wave >= 3) enemyTypes.push({ name: '蓝史莱姆', hp: 25 * scale, count: 5, speed: 60, lifetime: 10, dmg: 8 * scale });
  if (wave >= 6) enemyTypes.push({ name: '小恶魔', hp: 40 * scale, count: 6, speed: 90, lifetime: 8, dmg: 10 * scale });
  if (wave >= 10) enemyTypes.push({ name: '红史莱姆', hp: 80 * scale, count: 3, speed: 35, lifetime: 15, dmg: 15 * scale });
  if (wave >= 14) enemyTypes.push({ name: '暗影恶魔', hp: 120 * scale, count: 4, speed: 110, lifetime: 7, dmg: 12 * scale });

  const waveDuration = 25 + wave * 3;
  const totalClicks = Math.floor(waveDuration / atkSpeed);
  const avgDmg = atk * (1 + crit * (critMult - 1));

  let html = `<p class="result">平均每次伤害: ${avgDmg.toFixed(1)} | 本波次可点击: ${totalClicks} 次</p>`;
  html += '<table><tr><th>敌人</th><th>HP</th><th>需要点击次数</th><th>生成数量</th><th>总需点击</th><th>判断</th></tr>';

  let totalClicksNeeded = 0;
  for (const et of enemyTypes) {
    const clicksNeeded = Math.ceil(et.hp / avgDmg);
    const totalNeeded = clicksNeeded * et.count;
    totalClicksNeeded += totalNeeded;
    const status = clicksNeeded <= 3 ? 'good' : clicksNeeded <= 6 ? '' : 'warn';
    const cssClass = status === 'good' ? 'good' : status === 'warn' ? 'warn' : '';
    html += `<tr>
      <td>${et.name}</td><td>${et.hp}</td><td>${clicksNeeded}</td><td>${et.count}</td><td>${totalNeeded}</td>
      <td class="${cssClass}">${clicksNeeded <= 3 ? '✅ 轻松' : clicksNeeded <= 6 ? '⚠️ 适中' : '❌ 困难'}</td>
    </tr>`;
  }
  html += '</table>';

  // Boss 模拟
  const bossHp = (150 + (Math.floor((wave - 1) / 5)) * 200) * (wave % 5 === 0 ? 1 : 0);
  if (bossHp > 0 && wave % 5 === 0) {
    const bossClicksNeeded = Math.ceil(bossHp / avgDmg);
    html += `<p>🐲 Boss HP: ${bossHp} | 需要点击: ${bossClicksNeeded} 次 | ${bossClicksNeeded <= totalClicks * 0.5 ? '<span class="good">✅ 可击败</span>' : '<span class="warn">❌ 几乎不可能</span>'}</p>`;
  }

  const remainingClicks = totalClicks - totalClicksNeeded;
  html += `<p>总需点击: ${totalClicksNeeded} | 可用点击: ${totalClicks} | 余量: ${remainingClicks} (${(remainingClicks/totalClicks*100).toFixed(0)}%)</p>`;

  document.getElementById('results').innerHTML = '<h3>模拟结果</h3>' + html;
}
</script>
</body>
</html>
```

- [ ] **Step 2: 验证** — 在浏览器打开 balance-sim.html，调整参数观察数值变化。

---

## Phase 9: Final Polish

### Task 20: 最终打磨 — 性能优化 & 视觉微调

- [ ] **Step 1: 性能优化**
  - 限制最大敌人数为 80
  - 粒子/投射物超过 200 时清理最旧的
  - 确保 60fps

- [ ] **Step 2: 视觉微调**
  - 敌人出生时缩放动画（从小到大）
  - 金币收集时飞向 HUD 金币数的动画
  - 升级卡片选中时短暂的闪光动画

- [ ] **Step 3: 最终验证**
  - 完整运行游戏 5+ 局
  - 验证所有升级卡正常工作
  - 确认平衡曲线合理
  - 修复发现的任何 bug

---

## 总结

总计 **20 个任务**，覆盖从项目骨架到最终打磨的完整流程。

**关键里程碑:**
- Phase 1-2 (Task 1-7): 可点击战斗的最小可玩版本
- Phase 3 (Task 8-10): 打击感完成
- Phase 4 (Task 11-12): 构筑系统核心
- Phase 5-6 (Task 13-15): 随从、光环、音效
- Phase 7 (Task 16-17): UI 完整
- Phase 8 (Task 18-19): 集成与平衡
- Phase 9 (Task 20): 最终打磨
