// player.js - Player state management
export const player = {
  hp: 100,
  maxHp: 100,
  atk: 10,
  baseAtk: 10,
  atkMultiplier: 0,
  clickRadius: 80,
  critChance: 0.05,
  critMultiplier: 2,
  goldBonus: 0,
  gold: 0,
  kills: 0,
  clickCooldown: 0.15,
  lastClickTime: 0,
  // Upgrade flags (populated by upgrade system)
  fireEnchant: 0,
  iceTouch: 0,
  chainLightning: 0,
  splitShot: 0,
  deathNova: 0,
  babySlime: 0,
  fireSpirit: 0,
  healFairy: 0,
  goldSlime: 0,
  damageAura: 0,
  healAura: 0,
  magnetAura: false,
  timeSlow: 0,
  thornAura: 0,
  apocalypse: 0,
  phoenix: 0,
  alive: true,
};

let onGoldChange = null;
let onHpChange = null;
let onPlayerDeath = null;

export function setGoldCallback(fn) { onGoldChange = fn; }
export function setHpCallback(fn) { onHpChange = fn; }
export function setDeathCallback(fn) { onPlayerDeath = fn; }

export function addGold(amount) {
  const goldSlimeBonus = 1 + (player.goldSlime || 0) * 0.25;
  const bonus = (1 + player.goldBonus / 100) * goldSlimeBonus;
  const total = Math.floor(amount * bonus);
  player.gold += total;
  if (onGoldChange) onGoldChange(total);
  return total;
}

export function spendGold(amount) {
  if (player.gold < amount) return false;
  player.gold -= amount;
  return true;
}

export function takeDamage(amount) {
  if (!player.alive) return;
  player.hp = Math.max(0, player.hp - amount);
  if (onHpChange) onHpChange(player.hp, player.maxHp);
  if (player.hp <= 0) {
    player.alive = false;
    if (onPlayerDeath) onPlayerDeath();
  }
}

export function heal(amount) {
  player.hp = Math.min(player.maxHp, player.hp + amount);
  if (onHpChange) onHpChange(player.hp, player.maxHp);
}

export function getEffectiveAtk() {
  return Math.floor(player.baseAtk * (1 + player.atkMultiplier));
}

export function resetPlayer() {
  player.alive = true;
  player.hp = 100;
  player.maxHp = 100;
  player.atk = 10;
  player.baseAtk = 10;
  player.atkMultiplier = 0;
  player.clickRadius = 80;
  player.critChance = 0.05;
  player.critMultiplier = 2;
  player.goldBonus = 0;
  player.gold = 0;
  player.kills = 0;
  player.clickCooldown = 0.15;
  player.lastClickTime = 0;
  // Reset upgrade flags
  const flags = ['fireEnchant','iceTouch','chainLightning','splitShot','deathNova',
    'babySlime','fireSpirit','healFairy','goldSlime','damageAura','healAura',
    'magnetAura','timeSlow','thornAura','apocalypse','phoenix'];
  for (const f of flags) {
    if (typeof player[f] === 'boolean') player[f] = false;
    else player[f] = 0;
  }
}
