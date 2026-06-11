// main.js - Game entry point
import { initCanvas, clearCanvas, getCanvas, getCtx, getWidth, getHeight, getMousePos, updateShake, getShakeOffset, triggerShake } from './canvas.js';
import { startLoop, stopLoop, onUpdate, onRender, getGameTime, isPaused, clearCallbacks, resume } from './game-loop.js';
import { player, resetPlayer, addGold, setGoldCallback, setHpCallback, setDeathCallback, getEffectiveAtk } from './player.js';
import { enemies, cleanupEnemies } from './enemies.js';
import { processClick, updateCombat, onHit, onKill, onGoldDrop, onExpire, clearCombatCallbacks } from './combat.js';
import { initWaveManager, resetWaveManager, getCurrentWave, setWaveCallback, setBossSpawnCallback, setBossDefeatedCallback } from './wave-manager.js';
import { registerBoss, unregisterBoss, updateBoss, updateBossHPUI } from './boss.js';
import { spawnHitParticles, spawnCritParticles, spawnDeathParticles, spawnGoldParticles, spawnBossDeathParticles, spawnDamageNumber, spawnRipple, updateParticles, renderParticles, clearAllParticles } from './particles.js';
import { updateProjectiles, renderProjectiles, clearAllProjectiles } from './projectiles.js';

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
  startGame();
});

btnRestart.addEventListener('click', () => {
  document.getElementById('gameover-panel').classList.add('hidden');
  startGame();
});

function startGame() {
  resetPlayer();
  resetWaveManager();
  enemies.length = 0;
  clearAllParticles();
  clearAllProjectiles();
  clearCallbacks();
  clearCombatCallbacks();
  hideAllPanels();

  registerSystems();
  registerCallbacks();
  setupInput();
  initCanvas();
  initWaveManager();
  updateHUD();

  startLoop();
}

function hideAllPanels() {
  document.getElementById('upgrade-panel').classList.add('hidden');
  document.getElementById('gameover-panel').classList.add('hidden');
  document.getElementById('boss-hp-bar').classList.add('hidden');
  document.getElementById('wave-announce').classList.add('hidden');
}

function registerSystems() {
  onUpdate((dt) => {
    window._gameTime = getGameTime();
    updateShake(dt);
    updateCombat(dt);
    for (const enemy of enemies) enemy.update(dt);
    updateBoss(dt);
    updateParticles(dt);
    updateProjectiles(dt);
    const activeBoss = enemies.find(e => e.isBoss && e.alive);
    if (activeBoss) updateBossHPUI(activeBoss);
    cleanupEnemies();
    updateHUD();
  });

  onRender(() => {
    const shake = getShakeOffset();
    clearCanvas();
    const ctx = getCtx();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    renderEnemies();
    renderProjectiles();
    renderParticles();
    ctx.restore();
  });
}

function renderEnemies() {
  const ctx = getCtx();
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.scale(enemy.scale || 1, enemy.scale || 1);

    // Shadow
    ctx.shadowColor = enemy.color + '40';
    ctx.shadowBlur = 12;

    // Body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-enemy.size * 0.25, -enemy.size * 0.25, enemy.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.font = `${enemy.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.emoji, 0, 0);

    // Boss glow
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

    // Health bar for non-boss
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

    // Lifetime indicator
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

function registerCallbacks() {
  setDeathCallback(() => {
    stopLoop();
    const survived = Math.floor(getGameTime());
    if (survived > highScore) {
      highScore = survived;
      localStorage.setItem(HIGH_SCORE_KEY, highScore);
    }
    setTimeout(() => {
      showGameOver(survived);
    }, 800);
  });

  setWaveCallback((wave) => {
    document.getElementById('hud-wave').textContent = `🌊 波次 ${wave}`;
    const isBossWave = wave % 5 === 0;
    if (isBossWave) {
      showWaveAnnounce('⚠️ BOSS 来袭!', 1.5);
    } else {
      showWaveAnnounce(`第 ${wave} 波`, 1.5);
    }
  });

  setBossSpawnCallback((boss) => { registerBoss(boss); });
  setBossDefeatedCallback((boss) => {
    unregisterBoss();
    setTimeout(() => {
      // Upgrade panel will be implemented in later batch
      // For now, just show wave announcement
    }, 600);
  });

  onHit((enemy, damage, isCrit, x, y) => {
    if (isCrit) {
      spawnCritParticles(x, y);
      triggerShake(8, 0.12);
    } else {
      spawnHitParticles(x, y);
      triggerShake(3, 0.06);
    }
    spawnDamageNumber(x, y, damage, isCrit);
  });

  onKill((enemy, x, y) => {
    spawnDeathParticles(x, y, enemy.color);
    spawnGoldParticles(x, y);
    if (enemy.isBoss) {
      spawnBossDeathParticles(x, y);
    }
  });

  onExpire((enemy) => {
    // Hurt feedback in later batch
  });
}

let clickHandler = null;

function setupInput() {
  const canvas = getCanvas();
  if (clickHandler) {
    canvas.removeEventListener('click', clickHandler);
  }
  clickHandler = (e) => {
    if (!player.alive || isPaused()) return;
    const pos = getMousePos(e);
    const now = performance.now() / 1000;
    if (now - player.lastClickTime < player.clickCooldown) return;
    player.lastClickTime = now;
    const result = processClick(pos.x, pos.y);
    if (result.hit) {
      spawnRipple(pos.x, pos.y);
    }
  };
  canvas.addEventListener('click', clickHandler);
}

function updateHUD() {
  document.getElementById('hud-hp').innerHTML = `❤️ <strong>${player.hp}</strong>/${player.maxHp}`;
  document.getElementById('hud-gold').innerHTML = `🪙 <strong>${player.gold}</strong>`;
  document.getElementById('hud-atk').innerHTML = `⚔️ <strong>${getEffectiveAtk()}</strong>`;
  const t = Math.floor(window._gameTime || 0);
  const m = Math.floor(t / 60), s = (t % 60).toString().padStart(2, '0');
  document.getElementById('hud-time').textContent = `⏱️ ${m}:${s}`;
  document.getElementById('hud-kills').textContent = `💀 ${player.kills}`;
}

let waveAnnounceTimer1 = null;
let waveAnnounceTimer2 = null;

function showWaveAnnounce(text, duration = 2) {
  if (waveAnnounceTimer1) clearTimeout(waveAnnounceTimer1);
  if (waveAnnounceTimer2) clearTimeout(waveAnnounceTimer2);
  const el = document.getElementById('wave-announce');
  const textEl = document.getElementById('wave-announce-text');
  textEl.textContent = text;
  el.classList.remove('hidden');
  el.classList.add('wave-enter');
  waveAnnounceTimer1 = setTimeout(() => {
    el.classList.add('wave-exit');
    waveAnnounceTimer2 = setTimeout(() => el.classList.add('hidden'), 400);
  }, duration * 1000);
}

function showGameOver(survived) {
  const panel = document.getElementById('gameover-panel');
  panel.classList.remove('hidden');
  const m = Math.floor(survived / 60), s = (survived % 60).toString().padStart(2, '0');
  document.getElementById('gameover-stats').innerHTML = `
    <p>⏱️ 存活时间: <strong>${m}:${s}</strong></p>
    <p>💀 击杀敌人: <strong>${player.kills}</strong></p>
    <p>🪙 获得金币: <strong>${player.gold}</strong></p>
    <p>🌊 到达波次: <strong>${getCurrentWave()}</strong></p>
    <p>⚔️ 最终攻击力: <strong>${getEffectiveAtk()}</strong></p>
  `;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
