// companions.js - Companion system (auto-attacking pets)
import { player, heal } from './player.js';
import { getNearestEnemy } from './enemies.js';
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
  syncCount('babySlime');
  syncCount('fireSpirit');
  syncCount('healFairy');
  syncCount('goldSlime');

  for (const comp of companions) {
    comp.atkTimer += dt;
    comp.x += (Math.random() - 0.5) * 30 * dt;
    comp.y += (Math.random() - 0.5) * 30 * dt;

    const W = getWidth(), H = getHeight();
    comp.x = Math.max(50, Math.min(W - 50, comp.x));
    comp.y = Math.max(100, Math.min(H - 60, comp.y));

    if (comp.atkTimer >= comp.config.atkInterval && comp.config.type !== 'passive') {
      comp.atkTimer = 0;
      const target = getNearestEnemy(comp.x, comp.y);
      if (!target) continue;
      const dx = target.x - comp.x, dy = target.y - comp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > comp.config.range) continue;

      if (comp.config.type === 'melee') {
        target.takeDamage(comp.config.damage + Math.floor(player.baseAtk * 0.3));
      } else if (comp.config.type === 'ranged') {
        addProjectile(new Projectile(comp.x, comp.y, {
          vx: (dx / dist) * 350, vy: (dy / dist) * 350,
          speed: 350, damage: comp.config.damage + Math.floor(player.baseAtk * 0.3),
          color: comp.config.color, size: 5, life: 1.5,
        }));
      } else if (comp.config.type === 'heal') {
        heal(5 * (player.healFairy || 1));
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
      typeKey, config,
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
    ctx.strokeStyle = comp.config.color + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(comp.x, comp.y, comp.config.size + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
