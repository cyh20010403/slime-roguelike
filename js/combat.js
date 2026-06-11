// combat.js - Damage calculation and bullet combat
import { player, addGold, takeDamage } from './player.js';
import { enemies } from './enemies.js';
import { onBossKilled } from './wave-manager.js';
import { Projectile, addProjectile } from './projectiles.js';
import { getWidth, getHeight } from './canvas.js';

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

// Calculate damage for a single bullet
export function getBulletDamage() {
  const baseAtk = player.baseAtk * (1 + player.atkMultiplier);
  const isCrit = Math.random() < player.critChance;
  const dmg = isCrit ? Math.floor(baseAtk * player.critMultiplier) : Math.floor(baseAtk);
  const variance = Math.floor(dmg * 0.1);
  const finalDmg = Math.max(1, dmg + Math.floor(Math.random() * variance * 2) - variance);
  return { damage: Math.floor(finalDmg * player.bulletDamage), isCrit };
}

// Fire bullets from center toward a direction (angle in radians)
export function fireBullets(angle) {
  const cx = getWidth() / 2;
  const cy = getHeight() / 2;
  const count = player.bulletCount;
  const spreadAngle = Math.PI / 12; // 15 degrees spread per extra bullet

  const results = [];

  for (let i = 0; i < count; i++) {
    let bulletAngle = angle;
    if (count > 1) {
      const offset = (i - (count - 1) / 2) * spreadAngle;
      bulletAngle = angle + offset;
    }

    const { damage, isCrit } = getBulletDamage();

    const proj = new Projectile(cx, cy, {
      vx: Math.cos(bulletAngle) * player.bulletSpeed,
      vy: Math.sin(bulletAngle) * player.bulletSpeed,
      speed: player.bulletSpeed,
      damage: damage,
      color: isCrit ? '#FF6B6B' : '#FFD93D',
      size: isCrit ? 8 : 5,
      life: 2.0,
      isPlayerBullet: true,
      maxPierce: player.piercing || 0,
    });

    addProjectile(proj);
    results.push({ projectile: proj, damage, isCrit });
  }

  return results;
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
