// wave-manager.js - Wave and Boss management
import { spawnEnemy, enemies, ENEMY_TYPES, Enemy } from './enemies.js';
import { getWidth, getHeight } from './canvas.js';
import { onUpdate } from './game-loop.js';

export let currentWave = 1;
export let waveTimer = 0;
let spawnInterval = 2.0;
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

export function getAvailableEnemyTypes() {
  return Object.entries(ENEMY_TYPES)
    .filter(([_, cfg]) => cfg.unlockWave <= currentWave)
    .map(([key]) => key);
}

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

export function spawnBoss() {
  const cfg = getBossConfig();
  const boss = new Enemy('green_slime', currentWave);
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
    const isBossWave = currentWave % 5 === 0;
    if (isBossWave && !bossActive && !bossDefeatedThisWave && waveTimer > 2.0) {
      spawnBoss();
    }
    if (!isBossWave && waveTimer > 25 + currentWave * 3) {
      advanceWave();
    } else if (isBossWave && bossDefeatedThisWave && waveTimer > 5) {
      advanceWave();
    }

    // Enemy spawning
    if (!bossActive) {
      spawnAccum += dt;
      const actualInterval = spawnInterval / (1 + currentWave * 0.05);
      if (spawnAccum >= actualInterval) {
        spawnAccum -= actualInterval;
        const types = getAvailableEnemyTypes();
        if (types.length > 0) {
          const typeKey = types[Math.floor(Math.random() * types.length)];
          spawnEnemy(typeKey, currentWave);
        }
        if (Math.random() < 0.2 + currentWave * 0.02) {
          const typeKey2 = types[Math.floor(Math.random() * types.length)];
          if (typeKey2) spawnEnemy(typeKey2, currentWave);
        }
      }
    } else {
      spawnAccum += dt;
      if (spawnAccum >= spawnInterval * 2.5) {
        spawnAccum = 0;
        const types = getAvailableEnemyTypes();
        if (types.length > 0) {
          spawnEnemy(types[Math.floor(Math.random() * types.length)], currentWave);
        }
      }
    }

    // Cap enemies (skip bosses)
    if (enemies.length > 80) {
      for (let i = enemies.length - 1; i >= 0 && enemies.length > 80; i--) {
        if (!enemies[i].isBoss) enemies.splice(i, 1);
      }
    }
  });
}
