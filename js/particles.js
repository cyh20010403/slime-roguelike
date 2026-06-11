// particles.js - Particle effects manager
import { getCtx } from './canvas.js';

const particles = [];
const damageNumbers = [];
const ripples = [];

// === Particle class ===
export class Particle {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.vx = config.vx || (Math.random() - 0.5) * 200;
    this.vy = config.vy || (Math.random() - 0.5) * 200 - 100;
    this.life = config.life || 0.6;
    this.maxLife = this.life;
    this.size = config.size || 4;
    this.color = config.color || '#FFD93D';
    this.gravity = config.gravity || 200;
    this.shrink = config.shrink !== undefined ? config.shrink : true;
  }

  update(dt) {
    this.life -= dt;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    const size = this.shrink ? this.size * alpha : this.size;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get alive() { return this.life > 0; }
}

// === Preset Effects ===
export function spawnHitParticles(x, y) {
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150 - 50,
      life: 0.3, size: 2 + Math.random() * 3,
      color: '#FFD93D', gravity: 100,
    }));
  }
}

export function spawnCritParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 300,
      vy: (Math.random() - 0.5) * 300 - 150,
      life: 0.5, size: 3 + Math.random() * 5,
      color: Math.random() > 0.5 ? '#FF6B6B' : '#FFD93D',
      gravity: 50,
    }));
  }
}

export function spawnDeathParticles(x, y, color = '#A8E6CF') {
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 250,
      vy: (Math.random() - 0.5) * 250 - 120,
      life: 0.5 + Math.random() * 0.3,
      size: 3 + Math.random() * 6,
      color: color, gravity: 150,
    }));
  }
}

export function spawnGoldParticles(x, y) {
  for (let i = 0; i < 4; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 100,
      vy: -150 - Math.random() * 100,
      life: 0.6, size: 3 + Math.random() * 3,
      color: '#FFD93D', gravity: 300, shrink: false,
    }));
  }
}

export function spawnBossDeathParticles(x, y) {
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40;
    const speed = 200 + Math.random() * 300;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.5,
      size: 4 + Math.random() * 8,
      color: ['#FF6B8A', '#FFD93D', '#6BC9FF', '#A8E6CF'][Math.floor(Math.random() * 4)],
      gravity: 100,
    }));
  }
}

// === Damage Numbers ===
export function spawnDamageNumber(x, y, amount, isCrit = false) {
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 30,
    y: y,
    text: isCrit ? `${amount}!!` : `${amount}`,
    life: 0.8, maxLife: 0.8,
    color: isCrit ? '#FF6B6B' : '#FFD93D',
    size: isCrit ? 26 : 20,
  });
}

// === Click Ripples ===
export function spawnRipple(x, y) {
  ripples.push({ x, y, radius: 5, maxRadius: 80, life: 0.35, maxLife: 0.35 });
}

// === Update ===
export function updateParticles(dt) {
  for (const p of particles) p.update(dt);
  for (const d of damageNumbers) {
    d.y -= 50 * dt;
    d.life -= dt;
  }
  for (const r of ripples) {
    r.life -= dt;
    r.radius = r.maxRadius * (1 - r.life / r.maxLife);
  }

  // Cleanup
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].alive) particles.splice(i, 1);
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    if (ripples[i].life <= 0) ripples.splice(i, 1);
  }

  // Cap total particles for performance
  const MAX_PARTICLES = 300;
  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
  const MAX_NUMBERS = 50;
  if (damageNumbers.length > MAX_NUMBERS) {
    damageNumbers.splice(0, damageNumbers.length - MAX_NUMBERS);
  }
  const MAX_RIPPLES = 10;
  if (ripples.length > MAX_RIPPLES) {
    ripples.splice(0, ripples.length - MAX_RIPPLES);
  }
}

// === Render ===
export function renderParticles() {
  const ctx = getCtx();
  for (const p of particles) p.render(ctx);

  for (const d of damageNumbers) {
    const alpha = Math.max(0, d.life / d.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = d.color;
    ctx.font = `bold ${d.size}px "Segoe UI", "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 6;
    ctx.fillText(d.text, d.x, d.y);
    ctx.restore();
  }

  for (const r of ripples) {
    const alpha = r.life / r.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 3 * alpha;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function clearAllParticles() {
  particles.length = 0;
  damageNumbers.length = 0;
  ripples.length = 0;
}
