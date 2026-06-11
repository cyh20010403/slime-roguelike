// boss.js - Boss behavior and HP UI
import { getWidth, getHeight } from './canvas.js';

let activeBoss = null;

const bossBar = document.getElementById('boss-hp-bar');
const bossFill = document.getElementById('boss-hp-fill');
const bossName = document.getElementById('boss-name');
const bossText = document.getElementById('boss-hp-text');

export function getActiveBoss() { return activeBoss; }

export function registerBoss(boss) {
  activeBoss = boss;
  updateBossHPUI(boss);
}

export function unregisterBoss() {
  activeBoss = null;
  bossBar.classList.add('hidden');
}

export function updateBossHPUI(boss) {
  if (!boss || !boss.alive) {
    bossBar.classList.add('hidden');
    activeBoss = null;
    return;
  }

  bossBar.classList.remove('hidden');
  bossName.textContent = boss.name + ' ' + boss.emoji;
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  bossFill.style.width = pct + '%';
  bossText.textContent = `${Math.max(0, boss.hp)} / ${boss.maxHp}`;
}

export function updateBoss(dt) {
  if (!activeBoss || !activeBoss.alive) return;
  const W = getWidth(), H = getHeight();
  const margin = 100;
  if (activeBoss.x < margin) activeBoss.vx = Math.abs(activeBoss.vx);
  if (activeBoss.x > W - margin) activeBoss.vx = -Math.abs(activeBoss.vx);
  if (activeBoss.y < margin) activeBoss.vy = Math.abs(activeBoss.vy);
  if (activeBoss.y > H - margin) activeBoss.vy = -Math.abs(activeBoss.vy);
  updateBossHPUI(activeBoss);
}
