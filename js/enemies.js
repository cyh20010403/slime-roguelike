// enemies.js - Enemy data and management
import { getWidth, getHeight } from './canvas.js';

export const ENEMY_TYPES = {
  green_slime: { name: '绿色史莱姆', hp: 10, speed: 40, lifetime: 12, damage: 5, goldMin: 5, goldMax: 10, size: 20, color: '#A8E6CF', emoji: '🟢', unlockWave: 1 },
  blue_slime:  { name: '蓝色史莱姆', hp: 25, speed: 60, lifetime: 10, damage: 8, goldMin: 10, goldMax: 15, size: 24, color: '#6BC9FF', emoji: '🔵', unlockWave: 3 },
  imp:         { name: '小恶魔',     hp: 40, speed: 90, lifetime: 8,  damage: 10, goldMin: 15, goldMax: 20, size: 18, color: '#FF6B8A', emoji: '😈', unlockWave: 6 },
  red_slime:   { name: '红色史莱姆', hp: 80, speed: 35, lifetime: 15, damage: 15, goldMin: 20, goldMax: 30, size: 30, color: '#FF4757', emoji: '🔴', unlockWave: 10 },
  shadow_imp:  { name: '暗影恶魔',   hp: 120, speed: 110, lifetime: 7, damage: 12, goldMin: 25, goldMax: 35, size: 18, color: '#6C5CE7', emoji: '👿', unlockWave: 14 },
  elite:       { name: '精英怪',     hp: 200, speed: 55, lifetime: 10, damage: 20, goldMin: 50, goldMax: 100, size: 26, color: '#FFD93D', emoji: '⭐', unlockWave: 12 },
};

export const enemies = [];

export class Enemy {
  constructor(typeKey, wave) {
    const type = ENEMY_TYPES[typeKey];
    this.typeKey = typeKey;
    this.name = type.name;
    this.emoji = type.emoji;
    this.maxHp = type.hp;
    this.hp = type.hp;
    this.speed = type.speed;
    this.lifetime = type.lifetime;
    this.damage = type.damage;
    this.goldMin = type.goldMin;
    this.goldMax = type.goldMax;
    this.size = type.size;
    this.color = type.color;
    this.age = 0;
    this.alive = true;
    this.isBoss = false;
    this.scale = 1;
    this.burnDOT = 0;
    this.burnDuration = 0;
    this.slowAmount = 0;
    this.slowDuration = 0;

    // Spawn from screen edge
    const side = Math.floor(Math.random() * 4);
    const W = getWidth(), H = getHeight();
    const margin = this.size + 10;
    switch (side) {
      case 0: this.x = Math.random() * W; this.y = -margin; break;
      case 1: this.x = W + margin; this.y = Math.random() * H; break;
      case 2: this.x = Math.random() * W; this.y = H + margin; break;
      case 3: this.x = -margin; this.y = Math.random() * H; break;
    }

    // Move toward center with random offset
    this.vx = (Math.random() - 0.5) * this.speed * 0.5;
    this.vy = (Math.random() - 0.5) * this.speed * 0.5;
    const cx = W / 2, cy = H / 2;
    const dx = cx - this.x, dy = cy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx += (dx / dist) * this.speed * 0.5;
    this.vy += (dy / dist) * this.speed * 0.5;

    // Difficulty scaling
    const scale = 1 + Math.floor((wave - 1) / 5) * 0.3;
    this.maxHp = Math.floor(this.maxHp * scale);
    this.hp = this.maxHp;
    this.damage = Math.floor(this.damage * scale);
    this.goldMin = Math.floor(this.goldMin * scale);
    this.goldMax = Math.floor(this.goldMax * scale);
  }

  update(dt) {
    this.age += dt;
    const speedMult = this.slowAmount > 0 ? (1 - Math.min(0.9, this.slowAmount)) : 1;
    this.x += this.vx * dt * speedMult;
    this.y += this.vy * dt * speedMult;

    const margin = 200;
    if (this.x < -margin || this.x > getWidth() + margin || this.y < -margin || this.y > getHeight() + margin) {
      this.alive = false;
    }
    if (this.scale < 1) {
      this.scale = Math.min(1, this.scale + dt * 10);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.scale = 0.85;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  isExpired() { return this.age >= this.lifetime; }
}

export function spawnEnemy(typeKey, wave) {
  const enemy = new Enemy(typeKey, wave);
  enemies.push(enemy);
  return enemy;
}

export function getEnemiesInRange(cx, cy, radius) {
  return enemies.filter(e => {
    const dx = e.x - cx, dy = e.y - cy;
    return dx * dx + dy * dy <= radius * radius && e.alive;
  });
}

export function getNearestEnemy(x, y) {
  let nearest = null, minDist = Infinity;
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - x, dy = e.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) { minDist = dist; nearest = e; }
  }
  return nearest;
}

export function cleanupEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].alive) enemies.splice(i, 1);
  }
}
