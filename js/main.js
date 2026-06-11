// main.js - Game entry point
import { initCanvas, clearCanvas, getCanvas, getCtx, getWidth, getHeight, updateShake, getShakeOffset, triggerShake } from './canvas.js';
import { startLoop, stopLoop, onUpdate, onRender, getGameTime, isPaused, clearCallbacks, resume, pause } from './game-loop.js';
import { player, resetPlayer, addGold, setGoldCallback, setHpCallback, setDeathCallback, getEffectiveAtk } from './player.js';
import { enemies, cleanupEnemies } from './enemies.js';
import { fireBullets, getBulletDamage, updateCombat, onHit, onKill, onGoldDrop, onExpire, clearCombatCallbacks } from './combat.js';
import { initWaveManager, resetWaveManager, getCurrentWave, setWaveCallback, setBossSpawnCallback, setBossDefeatedCallback, onBossKilled } from './wave-manager.js';
import { registerBoss, unregisterBoss, updateBoss, updateBossHPUI } from './boss.js';
import { spawnHitParticles, spawnCritParticles, spawnDeathParticles, spawnGoldParticles, spawnBossDeathParticles, spawnDamageNumber, spawnMuzzleFlash, updateParticles, renderParticles, clearAllParticles } from './particles.js';
import { updateProjectiles, renderProjectiles, clearAllProjectiles } from './projectiles.js';
import { applyUpgrade, triggerDeathNova, updateDOTEffects } from './upgrade-effects.js';
import { rollUpgradeCards, resetPickedCards, getPickCount } from './upgrades.js';
import { initCompanions, updateCompanions, renderCompanions } from './companions.js';
import { resetAuras, updateAuras, triggerThornAura } from './auras.js';
import { sfxHit, sfxCrit, sfxKill, sfxBossHit, sfxBossKill, sfxGold, sfxUpgrade, sfxWaveStart, sfxBossWarn, sfxHurt, sfxGameOver, sfxHeartbeat, startBGM, stopBGM, startBossBGM } from './audio.js';

const startPanel = document.getElementById('start-panel');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const highScoreDisplay = document.getElementById('high-score-display');

const HIGH_SCORE_KEY = 'slime_roguelike_high_score';
let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
if (highScore > 0) {
  highScoreDisplay.textContent = `🏆 最高存活: ${formatTime(highScore)}`;
}

// Mouse tracking
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseDown = false;
let aimAngle = 0;

// Firing state
let fireTimer = 0;
let fireInterval = 0.125; // 1 / 8 (default fireRate)

const goldDrops = [];

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
  resetPickedCards();
  resetWaveManager();
  enemies.length = 0;
  clearAllParticles();
  clearAllProjectiles();
  goldDrops.length = 0;
  resetAuras();
  initCompanions();
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
  if (waveAnnounceTimer1) clearTimeout(waveAnnounceTimer1);
  if (waveAnnounceTimer2) clearTimeout(waveAnnounceTimer2);
  waveAnnounceTimer1 = null;
  waveAnnounceTimer2 = null;
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
    updateDOTEffects(dt);
    updateAuras(dt);
    updateCompanions(dt);

    // Update aim angle and fire bullets
    const cx = getWidth() / 2;
    const cy = getHeight() / 2;
    aimAngle = Math.atan2(mouseY - cy, mouseX - cx);

    if (mouseDown && player.alive && !isPaused()) {
      fireInterval = 1 / player.fireRate;
      fireTimer += dt;
      while (fireTimer >= fireInterval) {
        fireTimer -= fireInterval;
        const results = fireBullets(aimAngle);
        // Muzzle flash and gunshot sounds
        if (results.length > 0) {
          for (const r of results) {
            if (r.isCrit) {
              sfxCrit();
              triggerShake(2, 0.05);
            } else {
              sfxHit();
            }
          }
          spawnMuzzleFlash(cx, cy, aimAngle);
        }
      }
    } else if (!mouseDown) {
      fireTimer = 0;
    }

    // Low HP heartbeat
    if (player.alive && player.hp > 0 && player.hp < player.maxHp * 0.25) {
      if (!window._heartbeatTimer) window._heartbeatTimer = 0;
      window._heartbeatTimer += dt;
      if (window._heartbeatTimer >= 1.5) {
        window._heartbeatTimer -= 1.5;
        sfxHeartbeat();
      }
    } else {
      window._heartbeatTimer = 0;
    }

    // Update gold drops
    for (const g of goldDrops) {
      g.life -= dt;
      g.vy += 300 * dt; // gravity
      g.y += g.vy * dt;
      // Magnet aura: pull toward center
      if (player.magnetAura && g.life < 2) {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        const dx = cx - g.x, dy = cy - g.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        g.x += (dx / dist) * 500 * dt;
        g.y += (dy / dist) * 500 * dt;
      }
      // Auto-collect after 1.5 seconds or when reaching center
      if (g.life <= 1.5 || (player.magnetAura && g.life < 2)) {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        const dx = cx - g.x, dy = cy - g.y;
        if (Math.sqrt(dx*dx + dy*dy) < 60 || g.life <= 0) {
          player.gold += g.amount;
          g.life = 0;
        }
      }
    }
    // Cleanup expired gold drops
    for (let i = goldDrops.length - 1; i >= 0; i--) {
      if (goldDrops[i].life <= 0) goldDrops.splice(i, 1);
    }

    // Process DOT-triggered kills
    for (const enemy of enemies) {
      if (!enemy._killedByDOT) continue;
      enemy._killedByDOT = false;
      sfxKill(); sfxGold();
      spawnDeathParticles(enemy.x, enemy.y, enemy.color);
      spawnGoldParticles(enemy.x, enemy.y);
      triggerDeathNova(enemy.x, enemy.y);
      addGold(Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin);
      player.kills++;
      if (enemy.isBoss) {
        spawnBossDeathParticles(enemy.x, enemy.y);
        onBossKilled(enemy);
      }
    }

    // Process projectile kills
    for (const enemy of enemies) {
      if (!enemy._killedByProjectile) continue;
      enemy._killedByProjectile = false;
      const goldAmt = Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin;
      addGold(goldAmt);
      player.kills++;
      sfxKill(); sfxGold();
      spawnDeathParticles(enemy.x, enemy.y, enemy.color);
      spawnGoldParticles(enemy.x, enemy.y);
      triggerDeathNova(enemy.x, enemy.y);
      goldDrops.push({
        x: enemy.x + (Math.random() - 0.5) * 20,
        y: enemy.y,
        amount: goldAmt,
        life: 3,
        vy: -80 - Math.random() * 80,
      });
      if (enemy.isBoss) {
        spawnBossDeathParticles(enemy.x, enemy.y);
        onBossKilled(enemy);
      }
    }

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
    renderGun();
    renderEnemies();
    renderProjectiles();
    renderParticles();
    renderGoldDrops();
    renderCompanions();
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

function renderGun() {
  const cx = getWidth() / 2;
  const cy = getHeight() / 2;

  // Apply slight recoil when firing
  let recoilOffset = 0;
  if (mouseDown && fireTimer < 0.03) {
    recoilOffset = -5 * (1 - fireTimer / 0.03);
  }

  const gunLen = 50 + recoilOffset;
  const gunWidth = 14;

  const ctx = getCtx();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(aimAngle);

  // Gun shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(4, -gunWidth / 2 + 4, gunLen, gunWidth);

  // Gun barrel (main body)
  ctx.fillStyle = '#5D5C61';
  ctx.fillRect(0, -gunWidth / 2, gunLen, gunWidth);

  // Gun barrel highlight
  ctx.fillStyle = '#7B7A80';
  ctx.fillRect(0, -gunWidth / 2, gunLen, gunWidth * 0.4);

  // Gun grip
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(-10, -gunWidth * 0.7, 18, gunWidth * 1.4);

  // Muzzle
  ctx.fillStyle = '#333';
  ctx.fillRect(gunLen - 4, -gunWidth / 2 + 2, 6, gunWidth - 4);

  ctx.restore();

  // Crosshair at mouse position
  if (player.alive && !isPaused()) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    const chSize = 10;
    ctx.beginPath();
    ctx.moveTo(mouseX - chSize, mouseY);
    ctx.lineTo(mouseX + chSize, mouseY);
    ctx.moveTo(mouseX, mouseY - chSize);
    ctx.lineTo(mouseX, mouseY + chSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, chSize * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function renderGoldDrops() {
  const ctx = getCtx();
  for (const g of goldDrops) {
    const alpha = Math.min(1, g.life / 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD93D';
    ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💰' + g.amount, g.x, g.y);
    ctx.restore();
  }
}

function registerCallbacks() {
  setDeathCallback(() => {
    if (player.phoenix > 0) {
      player.alive = true;
      player.hp = player.maxHp;
      player.phoenix--;
      updateHUD();
      updateBuildBar();
      showWaveAnnounce('🔥 凤凰涅槃!', 1.5);
      return;
    }
    stopLoop();
    sfxGameOver();
    stopBGM();
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
      sfxBossWarn();
      showWaveAnnounce('⚠️ BOSS 来袭!', 1.5);
    } else {
      sfxWaveStart();
      showWaveAnnounce(`第 ${wave} 波`, 1.5);
    }
  });

  setBossSpawnCallback((boss) => {
    registerBoss(boss);
    startBossBGM();
  });
  setBossDefeatedCallback((boss) => {
    unregisterBoss();
    sfxBossKill();
    stopBGM();
    startBGM();
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
    goldDrops.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y,
      amount: Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin,
      life: 3,
      vy: -80 - Math.random() * 80,
    });
    sfxKill();
    sfxGold();
    spawnDeathParticles(x, y, enemy.color);
    spawnGoldParticles(x, y);
    triggerDeathNova(x, y);
    if (enemy.isBoss) {
      spawnBossDeathParticles(x, y);
    }
  });

  onExpire((enemy) => {
    sfxHurt();
    triggerThornAura(enemy.damage);
  });
}

let inputSetup = false;
let upgradeKeyHandler = null;

function setupInput() {
  if (inputSetup) return;
  inputSetup = true;
  const canvas = getCanvas();

  // Track mouse position
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  // Start/stop firing
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouseDown = true;
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      mouseDown = false;
      fireTimer = 0;
    }
  });

  canvas.addEventListener('mouseleave', () => {
    mouseDown = false;
  });

  canvas.addEventListener('mouseenter', (e) => {
    if (e.buttons === 1) {
      mouseDown = true;
    }
  });
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

// === Rarity display helpers ===
const RARITY_CLASSES = {
  common: 'rarity-common', rare: 'rarity-rare',
  legendary: 'rarity-legendary', mythic: 'rarity-mythic',
};
const RARITY_NAMES = {
  common: '⭐ 普通', rare: '⭐⭐ 稀有',
  legendary: '⭐⭐⭐ 传说', mythic: '⭐⭐⭐⭐ 神话',
};
const RARITY_COLORS = {
  common: '#7f8c8d', rare: '#a29bfe',
  legendary: '#ffd93d', mythic: '#fff',
};

function showUpgradePanel() {
  const cards = rollUpgradeCards(3);
  if (cards.length === 0) return;

  pause();
  const panel = document.getElementById('upgrade-panel');
  const container = document.getElementById('upgrade-cards');
  panel.classList.remove('hidden');
  container.innerHTML = '';

  cards.forEach((card, idx) => {
    const picked = getPickCount(card.id);
    const isMythic = card.rarity === 'mythic';
    const borderColor = RARITY_COLORS[card.rarity];

    const cardEl = document.createElement('div');
    cardEl.className = 'upgrade-card';
    let bgStyle = 'background: #16213e;';
    if (isMythic) {
      bgStyle = 'background: linear-gradient(135deg, rgba(255,107,107,0.2), rgba(107,201,255,0.2));';
    }
    let shadowStyle = '';
    if (['rare', 'legendary'].includes(card.rarity)) {
      shadowStyle = `box-shadow: 0 0 12px ${borderColor}40;`;
    }
    const borderStyle = isMythic
      ? 'border: 3px solid transparent; border-image: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bc9ff, #a8e6cf) 1;'
      : `border: 3px solid ${borderColor};`;

    cardEl.style.cssText = `
      width: 240px; padding: 20px; border-radius: 16px;
      cursor: pointer; text-align: center; ${bgStyle} ${shadowStyle} ${borderStyle}
    `;

    cardEl.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 8px;">${card.emoji}</div>
      <div style="font-size: 11px; color: ${borderColor}; margin-bottom: 4px;">${RARITY_NAMES[card.rarity]}</div>
      <h3 style="margin: 4px 0; color: #fff; font-size: 18px;">${card.name}</h3>
      <p style="color: #aaa; font-size: 14px; margin: 8px 0;">${card.desc}</p>
      ${picked > 0 ? `<p style="color: #888; font-size: 11px;">已选 ${picked} 次</p>` : '<p style="color: #555; font-size: 11px;">未选择过</p>'}
      <p style="color: #666; font-size: 10px;">最多 ${card.maxStacks} 次</p>
      <p style="color: #FFD93D; font-size: 11px; margin-top: 4px;">按 ${idx + 1} 选择</p>
    `;

    cardEl.addEventListener('click', () => selectUpgradeCard(card));
    container.appendChild(cardEl);
  });

  // Keyboard shortcuts
  if (upgradeKeyHandler) {
    document.removeEventListener('keydown', upgradeKeyHandler);
  }
  upgradeKeyHandler = (e) => {
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      const idx = parseInt(e.key, 10) - 1;
      if (cards[idx]) selectUpgradeCard(cards[idx]);
      document.removeEventListener('keydown', upgradeKeyHandler);
      upgradeKeyHandler = null;
    }
  };
  document.addEventListener('keydown', upgradeKeyHandler);
}

function selectUpgradeCard(card) {
  if (upgradeKeyHandler) {
    document.removeEventListener('keydown', upgradeKeyHandler);
    upgradeKeyHandler = null;
  }
  applyUpgrade(card);
  sfxUpgrade();
  document.getElementById('upgrade-panel').classList.add('hidden');
  updateBuildBar();
  resume();
}

function updateBuildBar() {
  const container = document.getElementById('build-cards');
  const countEl = document.getElementById('build-count');
  const builds = [];
  if (player.atkMultiplier > 0) builds.push({ n: 'ATK', v: `+${(player.atkMultiplier*100).toFixed(0)}%`, r: 'common' });
  if (player.fireRate !== 8) builds.push({ n: '射速', v: `${player.fireRate.toFixed(0)}/s`, r: 'common' });
  if (player.bulletCount > 1) builds.push({ n: '弹数', v: `x${player.bulletCount}`, r: 'rare' });
  if (player.bulletDamage > 1) builds.push({ n: '弹伤', v: `x${player.bulletDamage.toFixed(1)}`, r: 'common' });
  if (player.bulletSpeed !== 600) builds.push({ n: '弹速', v: `${player.bulletSpeed.toFixed(0)}`, r: 'common' });
  if (player.piercing) builds.push({ n: '穿透', v: `x${player.piercing}`, r: 'legendary' });
  if (player.explosive) builds.push({ n: '爆炸', v: `Lv${player.explosive}`, r: 'legendary' });
  if (player.critChance > 0.05) builds.push({ n: '暴击', v: `${(player.critChance*100).toFixed(0)}%`, r: 'rare' });
  if (player.fireEnchant) builds.push({ n: '火焰', v: `Lv${player.fireEnchant}`, r: 'rare' });
  if (player.iceTouch) builds.push({ n: '冰冻', v: `Lv${player.iceTouch}`, r: 'rare' });
  if (player.chainLightning) builds.push({ n: '闪电链', v: `Lv${player.chainLightning}`, r: 'rare' });
  if (player.splitShot) builds.push({ n: '分裂弹', v: `Lv${player.splitShot}`, r: 'rare' });
  if (player.deathNova) builds.push({ n: '新星', v: `Lv${player.deathNova}`, r: 'legendary' });
  if (player.babySlime) builds.push({ n: '史莱姆', v: `x${player.babySlime}`, r: 'common' });
  if (player.fireSpirit) builds.push({ n: '火精灵', v: `x${player.fireSpirit}`, r: 'rare' });
  if (player.goldSlime) builds.push({ n: '金币宠', v: `x${player.goldSlime}`, r: 'rare' });
  if (player.healFairy) builds.push({ n: '治疗', v: `x${player.healFairy}`, r: 'rare' });
  if (player.damageAura) builds.push({ n: '伤害光环', v: `Lv${player.damageAura}`, r: 'rare' });
  if (player.healAura) builds.push({ n: '回复光环', v: `Lv${player.healAura}`, r: 'rare' });
  if (player.magnetAura) builds.push({ n: '磁铁', v: '✓', r: 'legendary' });
  if (player.thornAura) builds.push({ n: '荆棘', v: `Lv${player.thornAura}`, r: 'legendary' });
  if (player.apocalypse) builds.push({ n: '天启', v: `Lv${player.apocalypse}`, r: 'mythic' });
  if (player.phoenix) builds.push({ n: '凤凰', v: `x${player.phoenix}`, r: 'mythic' });

  container.innerHTML = builds.map(b =>
    `<span class="build-tag ${RARITY_CLASSES[b.r] || 'rarity-common'}">${b.n} ${b.v}</span>`
  ).join('');
  countEl.textContent = `${builds.length} 张卡`;
}

function showGameOver(survived) {
  updateBuildBar();
  const panel = document.getElementById('gameover-panel');
  panel.classList.remove('hidden');
  const m = Math.floor(survived / 60), s = (survived % 60).toString().padStart(2, '0');
  const buildContainer = document.getElementById('build-cards');
  const buildHTML = buildContainer ? buildContainer.innerHTML : '';
  document.getElementById('gameover-stats').innerHTML = `
    <p>⏱️ 存活时间: <strong>${m}:${s}</strong></p>
    <p>💀 击杀敌人: <strong>${player.kills}</strong></p>
    <p>🪙 获得金币: <strong>${player.gold}</strong></p>
    <p>🌊 到达波次: <strong>${getCurrentWave()}</strong></p>
    <p>⚔️ 最终攻击力: <strong>${getEffectiveAtk()}</strong></p>
  `;
  const buildSummary = document.getElementById('gameover-build');
  if (buildSummary && buildHTML) {
    buildSummary.innerHTML = `<h3>🏆 最终构筑</h3><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">${buildHTML}</div>`;
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
