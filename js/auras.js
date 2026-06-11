// auras.js - Aura / passive trigger system
import { player, heal, takeDamage } from './player.js';
import { enemies } from './enemies.js';

let auraTimers = { damage: 0, heal: 0 };

export function resetAuras() {
  auraTimers.damage = 0;
  auraTimers.heal = 0;
}

export function updateAuras(dt) {
  // Damage aura
  if (player.damageAura) {
    auraTimers.damage += dt;
    if (auraTimers.damage >= 5) {
      auraTimers.damage -= 5;
      const dmg = Math.floor(player.damageAura * player.baseAtk * (1 + player.atkMultiplier) * 0.5);
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        enemy.takeDamage(dmg);
      }
    }
  }

  // Heal aura
  if (player.healAura) {
    auraTimers.heal += dt;
    if (auraTimers.heal >= 8) {
      auraTimers.heal -= 8;
      heal(player.healAura * 3);
    }
  }

  // Apocalypse (mythic aura)
  if (player.apocalypse) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.hp -= player.apocalypse * player.baseAtk * dt;
      if (enemy.hp <= 0) {
        enemy.alive = false;
        enemy._killedByDOT = true;
      }
    }
  }
}

// Thorns: reflect damage to a random enemy
export function triggerThornAura(damageTaken) {
  if (!player.thornAura) return;
  const reflectDmg = Math.floor(damageTaken * 0.5 * player.thornAura);
  const alive = enemies.filter(e => e.alive);
  if (alive.length > 0) {
    const target = alive[Math.floor(Math.random() * alive.length)];
    target.takeDamage(reflectDmg);
  }
}

// Magnet: gold flies toward center
export function applyMagnetEffect(goldObjects, dt) {
  if (!player.magnetAura) return;
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (const g of goldObjects) {
    const dx = cx - g.x, dy = cy - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    g.x += (dx / dist) * 400 * dt;
    g.y += (dy / dist) * 400 * dt;
  }
}
