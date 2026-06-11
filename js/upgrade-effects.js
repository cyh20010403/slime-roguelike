// upgrade-effects.js - Upgrade effect execution engine
import { player } from './player.js';
import { enemies, getEnemiesInRange } from './enemies.js';
import { spawnSplitProjectiles } from './projectiles.js';
import { recordPick } from './upgrades.js';

// Apply an upgrade card
export function applyUpgrade(card) {
  card.apply();
  recordPick(card.id);
}

// Trigger click-based effects after a click
export function triggerClickEffects(x, y, targetEnemies) {
  // Fire enchant: add burning DOT
  if (player.fireEnchant) {
    for (const enemy of targetEnemies) {
      if (!enemy.alive) continue;
      enemy.burnDOT = (enemy.burnDOT || 0) + player.fireEnchant * player.baseAtk * 0.5;
      enemy.burnDuration = (enemy.burnDuration || 0) + 3;
    }
  }

  // Ice touch: slow enemies
  if (player.iceTouch) {
    for (const enemy of targetEnemies) {
      if (!enemy.alive) continue;
      enemy.slowAmount = Math.max(enemy.slowAmount || 0, 0.5 * player.iceTouch);
      enemy.slowDuration = 2;
    }
  }

  // Chain lightning: jump damage
  if (player.chainLightning) {
    const jumps = 2 + player.chainLightning;
    let lastEnemy = targetEnemies[0];
    const hitSet = new Set(targetEnemies);
    for (let i = 0; i < jumps && lastEnemy; i++) {
      const nearby = enemies.filter(e => e.alive && !hitSet.has(e));
      if (nearby.length === 0) break;
      let nearest = null, minDist = Infinity;
      for (const e of nearby) {
        const dx = e.x - lastEnemy.x, dy = e.y - lastEnemy.y;
        const d = dx * dx + dy * dy;
        if (d < minDist && d < 300 * 300) { minDist = d; nearest = e; }
      }
      if (!nearest) break;
      const chainDmg = Math.floor(player.baseAtk * (1 + player.atkMultiplier) * 0.5);
      nearest.takeDamage(chainDmg);
      hitSet.add(nearest);
      lastEnemy = nearest;
    }
  }

  // Split shot
  if (player.splitShot) {
    spawnSplitProjectiles(x, y, 3 + player.splitShot, Math.floor(player.baseAtk * (1 + player.atkMultiplier) * 0.4));
  }
}

// Trigger death nova on enemy kill
export function triggerDeathNova(x, y) {
  if (!player.deathNova) return;
  const nearby = getEnemiesInRange(x, y, 120);
  const dmg = Math.floor(player.baseAtk * (1 + player.atkMultiplier) * 0.5 * player.deathNova);
  for (const e of nearby) e.takeDamage(dmg);
}

// Update DOT effects each frame
export function updateDOTEffects(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    // Burning DOT
    if (enemy.burnDOT > 0 && enemy.burnDuration > 0) {
      enemy.hp -= enemy.burnDOT * dt / 3; // 3 second burn duration
      enemy.burnDuration -= dt;
      if (enemy.burnDuration <= 0) {
        enemy.burnDOT = 0;
        enemy.burnDuration = 0;
      }
      if (enemy.hp <= 0) enemy.alive = false;
    }
    // Slow decay
    if (enemy.slowDuration > 0) {
      enemy.slowDuration -= dt;
      if (enemy.slowDuration <= 0) {
        enemy.slowAmount = 0;
        enemy.slowDuration = 0;
      }
    }
  }
}
