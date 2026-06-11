// combat.js - Damage calculation and click combat
import { player, addGold, takeDamage, getEffectiveAtk } from './player.js';
import { enemies, getEnemiesInRange } from './enemies.js';
import { onBossKilled } from './wave-manager.js';

let onHitCallbacks = [];
let onKillCallbacks = [];
let onGoldDropCallbacks = [];
let onExpireCallbacks = [];

export function onHit(fn) { onHitCallbacks.push(fn); }
export function onKill(fn) { onKillCallbacks.push(fn); }
export function onGoldDrop(fn) { onGoldDropCallbacks.push(fn); }
export function onExpire(fn) { onExpireCallbacks.push(fn); }

export function clearCombatCallbacks() {
  onHitCallbacks.length = 0;
  onKillCallbacks.length = 0;
  onGoldDropCallbacks.length = 0;
  onExpireCallbacks.length = 0;
}

export function calculateDamage() {
  const baseAtk = getEffectiveAtk();
  const isCrit = Math.random() < player.critChance;
  const dmg = isCrit ? Math.floor(baseAtk * player.critMultiplier) : Math.floor(baseAtk);
  const variance = Math.floor(dmg * 0.1);
  const finalDmg = dmg + Math.floor(Math.random() * variance * 2) - variance;
  return { damage: Math.max(1, finalDmg), isCrit };
}

export function processClick(x, y) {
  const targets = getEnemiesInRange(x, y, player.clickRadius);
  if (targets.length === 0) return { hit: false };

  const { damage, isCrit } = calculateDamage();
  const results = [];

  for (const enemy of targets) {
    const killed = enemy.takeDamage(damage);
    for (const cb of onHitCallbacks) cb(enemy, damage, isCrit, enemy.x, enemy.y);

    if (killed) {
      const goldAmt = Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1)) + enemy.goldMin;
      const actualGold = addGold(goldAmt);
      for (const cb of onGoldDropCallbacks) cb(actualGold, enemy.x, enemy.y);
      for (const cb of onKillCallbacks) cb(enemy, enemy.x, enemy.y);
      player.kills++;
      if (enemy.isBoss) onBossKilled(enemy);
    }
    results.push({ enemy, damage, killed });
  }
  return { hit: true, targets: results, damage, isCrit, x, y };
}

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
