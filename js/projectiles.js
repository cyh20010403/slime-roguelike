// projectiles.js - Projectile management (split shot, companion bullets, etc.)
import { getCtx, getWidth, getHeight } from './canvas.js';
import { enemies, getNearestEnemy } from './enemies.js';
import { player } from './player.js';

const projectiles = [];
const MAX_PROJECTILES = 100;

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
    this.isPlayerBullet = config.isPlayerBullet || false;
    this.maxPierce = config.maxPierce || 0;
    this.enemiesHit = 0;
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

export function spawnSplitProjectiles(x, y, count = 4, damage = 5) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const nearest = getNearestEnemy(x, y);
    projectiles.push(new Projectile(x, y, {
      vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300,
      speed: 300, damage: damage, color: '#6BC9FF', size: 5,
      life: 1.5, target: nearest, homing: true, homingStrength: 1.5,
    }));
  }
}

export function updateProjectiles(dt) {
  for (const p of projectiles) p.update(dt);

  // Collision detection
  for (const p of projectiles) {
    if (!p.alive) continue;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < e.size + p.size) {
        e.takeDamage(p.damage);
        // Mark killed enemies for processing in main.js
        if (!e.alive) {
          e._killedByProjectile = true;
        }
        // Explosive rounds - splash damage
        if (p.isPlayerBullet && player.explosive) {
          const splashRange = 30 + player.explosive * 30;
          for (const ne of enemies) {
            if (ne.alive && ne !== e) {
              const nex = p.x - ne.x, ney = p.y - ne.y;
              if (nex * nex + ney * ney <= splashRange * splashRange) {
                ne.takeDamage(Math.floor(p.damage * 0.5));
                if (!ne.alive) {
                  ne._killedByProjectile = true;
                }
              }
            }
          }
        }
        // Piercing logic for player bullets
        if (p.isPlayerBullet) {
          p.enemiesHit++;
          if (p.enemiesHit > p.maxPierce) {
            p.life = 0;
            break;
          }
        } else if (!p.pierce) {
          p.life = 0;
          break;
        }
      }
    }
  }

  // Cleanup
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (!projectiles[i].alive) projectiles.splice(i, 1);
  }
  if (projectiles.length > MAX_PROJECTILES) {
    projectiles.splice(0, projectiles.length - MAX_PROJECTILES);
  }
}

export function renderProjectiles() {
  const ctx = getCtx();
  for (const p of projectiles) p.render(ctx);
}

export function clearAllProjectiles() {
  projectiles.length = 0;
}
