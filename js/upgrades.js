// upgrades.js - Upgrade card definitions and rolling
import { player } from './player.js';

export const ALL_UPGRADES = [
  // === Stat Upgrades ===
  { id: 'atk_up_1', name: '攻击力提升', desc: '攻击力 +25%', rarity: 'common', category: 'stat',
    apply() { player.atkMultiplier += 0.25; }, emoji: '⚔️', maxStacks: 10,
    descStack(n) { return `攻击力 +${(0.25 * n * 100).toFixed(0)}%`; } },
  { id: 'atk_up_2', name: '强力攻击', desc: '攻击力 +50%', rarity: 'rare', category: 'stat',
    apply() { player.atkMultiplier += 0.50; }, emoji: '🗡️', maxStacks: 6,
    descStack(n) { return `攻击力 +${(0.50 * n * 100).toFixed(0)}%`; } },
  { id: 'atk_up_3', name: '战神之力', desc: '攻击力 +100%', rarity: 'legendary', category: 'stat',
    apply() { player.atkMultiplier += 1.0; }, emoji: '💪', maxStacks: 4,
    descStack(n) { return `攻击力 +${(n * 100).toFixed(0)}%`; } },

  { id: 'crit_up_1', name: '精准打击', desc: '暴击率 +5%', rarity: 'common', category: 'stat',
    apply() { player.critChance += 0.05; }, emoji: '🎯', maxStacks: 10 },
  { id: 'crit_up_2', name: '致命一击', desc: '暴击率 +10%', rarity: 'rare', category: 'stat',
    apply() { player.critChance += 0.10; }, emoji: '💢', maxStacks: 6 },

  { id: 'crit_dmg_1', name: '爆伤强化', desc: '暴击伤害 +50%', rarity: 'rare', category: 'stat',
    apply() { player.critMultiplier += 0.50; }, emoji: '💥', maxStacks: 8 },
  { id: 'crit_dmg_2', name: '毁灭暴击', desc: '暴击伤害 +100%', rarity: 'legendary', category: 'stat',
    apply() { player.critMultiplier += 1.0; }, emoji: '🔥', maxStacks: 4 },

  { id: 'range_up_1', name: '范围扩大', desc: '攻击范围 +20px', rarity: 'common', category: 'stat',
    apply() { player.clickRadius += 20; }, emoji: '⭕', maxStacks: 10 },
  { id: 'range_up_2', name: '超大范围', desc: '攻击范围 +40px', rarity: 'rare', category: 'stat',
    apply() { player.clickRadius += 40; }, emoji: '🔵', maxStacks: 6 },

  { id: 'speed_up', name: '快速连击', desc: '点击间隔 -0.02s', rarity: 'common', category: 'stat',
    apply() { player.clickCooldown = Math.max(0.02, player.clickCooldown - 0.02); }, emoji: '⚡', maxStacks: 8 },

  { id: 'gold_up_1', name: '金币加成', desc: '金币 +30%', rarity: 'common', category: 'stat',
    apply() { player.goldBonus += 30; }, emoji: '💰', maxStacks: 10 },
  { id: 'gold_up_2', name: '富豪光环', desc: '金币 +60%', rarity: 'rare', category: 'stat',
    apply() { player.goldBonus += 60; }, emoji: '💎', maxStacks: 6 },

  { id: 'max_hp_up', name: '生命提升', desc: '最大HP +20', rarity: 'common', category: 'stat',
    apply() { player.maxHp += 20; player.hp = Math.min(player.hp + 20, player.maxHp); }, emoji: '❤️', maxStacks: 15 },

  // === Attack Effects ===
  { id: 'fire_enchant', name: '火焰附魔', desc: '点击附加3秒燃烧DOT', rarity: 'rare', category: 'effect',
    apply() { player.fireEnchant = (player.fireEnchant || 0) + 1; }, emoji: '🔥', maxStacks: 5 },
  { id: 'ice_touch', name: '冰冻之触', desc: '点击减速敌人50%持续2秒', rarity: 'rare', category: 'effect',
    apply() { player.iceTouch = (player.iceTouch || 0) + 1; }, emoji: '❄️', maxStacks: 3 },
  { id: 'chain_lightning', name: '闪电链', desc: '点击伤害跳跃至附近敌人', rarity: 'rare', category: 'effect',
    apply() { player.chainLightning = (player.chainLightning || 0) + 1; }, emoji: '⚡', maxStacks: 5 },
  { id: 'split_shot', name: '分裂弹', desc: '点击射出追踪飞弹', rarity: 'rare', category: 'effect',
    apply() { player.splitShot = (player.splitShot || 0) + 1; }, emoji: '💫', maxStacks: 6 },
  { id: 'death_nova', name: '死亡新星', desc: '敌人死亡时爆炸AOE', rarity: 'legendary', category: 'effect',
    apply() { player.deathNova = (player.deathNova || 0) + 1; }, emoji: '💥', maxStacks: 5 },

  // === Companions ===
  { id: 'baby_slime', name: '小史莱姆', desc: '召唤自动攻击的史莱姆', rarity: 'common', category: 'companion',
    apply() { player.babySlime = (player.babySlime || 0) + 1; }, emoji: '💧', maxStacks: 8 },
  { id: 'fire_spirit', name: '火焰精灵', desc: '远程火球攻击', rarity: 'rare', category: 'companion',
    apply() { player.fireSpirit = (player.fireSpirit || 0) + 1; }, emoji: '🔥', maxStacks: 5 },
  { id: 'heal_fairy', name: '治疗妖精', desc: '每10秒回复5HP', rarity: 'rare', category: 'companion',
    apply() { player.healFairy = (player.healFairy || 0) + 1; }, emoji: '🧚', maxStacks: 5 },
  { id: 'gold_slime', name: '金币史莱姆', desc: '击杀额外掉落金币', rarity: 'rare', category: 'companion',
    apply() { player.goldSlime = (player.goldSlime || 0) + 1; }, emoji: '🪙', maxStacks: 5 },

  // === Auras ===
  { id: 'damage_aura', name: '伤害光环', desc: '每5秒全屏伤害', rarity: 'rare', category: 'aura',
    apply() { player.damageAura = (player.damageAura || 0) + 1; }, emoji: '💢', maxStacks: 8 },
  { id: 'heal_aura', name: '回复光环', desc: '每8秒回复3HP', rarity: 'rare', category: 'aura',
    apply() { player.healAura = (player.healAura || 0) + 1; }, emoji: '💚', maxStacks: 5 },
  { id: 'magnet_aura', name: '磁铁光环', desc: '金币自动飞向你', rarity: 'legendary', category: 'aura',
    apply() { player.magnetAura = true; }, emoji: '🧲', maxStacks: 1 },
  { id: 'time_slow', name: '时间减速', desc: '敌人存活时间+30%', rarity: 'legendary', category: 'aura',
    apply() { player.timeSlow = (player.timeSlow || 0) + 1; }, emoji: '⏳', maxStacks: 3 },
  { id: 'thorn_aura', name: '荆棘光环', desc: '敌人受伤时反弹50%', rarity: 'legendary', category: 'aura',
    apply() { player.thornAura = (player.thornAura || 0) + 1; }, emoji: '🌿', maxStacks: 3 },

  // === Mythic ===
  { id: 'god_click', name: '神之一击', desc: '每次点击伤害翻倍', rarity: 'mythic', category: 'stat',
    apply() { player.atkMultiplier += 2.0; }, emoji: '👑', maxStacks: 3 },
  { id: 'apocalypse', name: '天启', desc: '全屏敌人每秒受到伤害', rarity: 'mythic', category: 'aura',
    apply() { player.apocalypse = (player.apocalypse || 0) + 1; }, emoji: '🌋', maxStacks: 3 },
  { id: 'phoenix', name: '凤凰涅槃', desc: '死亡时复活一次', rarity: 'mythic', category: 'effect',
    apply() { player.phoenix = (player.phoenix || 0) + 1; }, emoji: '🐦', maxStacks: 2 },
];

// Rarity weights
const RARITY_WEIGHTS = { common: 50, rare: 30, legendary: 15, mythic: 5 };

// Player's picked card counts
const pickedCards = {};

export function getPickCount(id) { return pickedCards[id] || 0; }

export function recordPick(id) {
  pickedCards[id] = (pickedCards[id] || 0) + 1;
}

// Roll upgrade cards
export function rollUpgradeCards(count = 3) {
  const available = ALL_UPGRADES.filter(card => {
    const picked = pickedCards[card.id] || 0;
    return picked < card.maxStacks;
  });

  if (available.length === 0) return [];

  const results = [];
  const pool = [...available];
  let hasRarePlus = false;

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, c) => {
      const base = RARITY_WEIGHTS[c.rarity] || 10;
      const picked = (pickedCards[c.id] || 0);
      const penalty = Math.max(0.1, 1 - picked * 0.25);
      return sum + base * penalty;
    }, 0);

    let roll = Math.random() * totalWeight;
    let picked = null;
    for (const card of pool) {
      const base = RARITY_WEIGHTS[card.rarity] || 10;
      const pc = (pickedCards[card.id] || 0);
      const penalty = Math.max(0.1, 1 - pc * 0.25);
      roll -= base * penalty;
      if (roll <= 0) { picked = card; break; }
    }
    if (!picked) picked = pool[pool.length - 1];

    results.push(picked);
    pool.splice(pool.indexOf(picked), 1);

    if (['rare', 'legendary', 'mythic'].includes(picked.rarity)) {
      hasRarePlus = true;
    }
  }

  // Ensure at least 1 rare+
  if (!hasRarePlus && results.length > 0) {
    const rarePlus = available.filter(c =>
      ['rare', 'legendary', 'mythic'].includes(c.rarity) &&
      (pickedCards[c.id] || 0) < c.maxStacks &&
      !results.includes(c)
    );
    if (rarePlus.length > 0) {
      results[results.length - 1] = rarePlus[Math.floor(Math.random() * rarePlus.length)];
    }
  }

  return results;
}

export function resetPickedCards() {
  for (const key of Object.keys(pickedCards)) delete pickedCards[key];
}
