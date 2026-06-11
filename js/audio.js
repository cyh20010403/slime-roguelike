// audio.js - Web Audio API procedural sound effects
let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let initialized = false;

function ensureContext() {
  if (!initialized) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.25;
    musicGain.connect(masterGain);
    initialized = true;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type = 'sine', freqEnd = null) {
  ensureContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration) {
  ensureContext();
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(gain);
  gain.connect(sfxGain);
  source.start();
}

// === Sound effect API ===
export function sfxHit() { playTone(80, 0.05, 'sine'); }
export function sfxCrit() { playTone(200, 0.08, 'sine'); playTone(400, 0.06, 'triangle'); }
export function sfxKill() { playTone(400, 0.1, 'triangle', 200); }
export function sfxBossHit() { playTone(60, 0.08, 'sine'); }
export function sfxBossKill() { playNoise(0.3); playTone(60, 0.4, 'sine'); }
export function sfxGold() { playTone(800, 0.08, 'sine', 1200); }
export function sfxUpgrade() {
  playTone(523, 0.15, 'sine'); playTone(659, 0.15, 'sine'); playTone(784, 0.15, 'sine');
  setTimeout(() => { playTone(523, 0.15, 'sine'); playTone(659, 0.15, 'sine'); playTone(784, 0.15, 'sine'); }, 200);
}
export function sfxWaveStart() { playTone(300, 0.3, 'sawtooth', 500); }
export function sfxBossWarn() {
  playTone(150, 0.15, 'square');
  setTimeout(() => playTone(150, 0.15, 'square'), 250);
  setTimeout(() => playTone(150, 0.15, 'square'), 500);
}
export function sfxHurt() { playTone(300, 0.2, 'sine', 150); }
export function sfxGameOver() {
  playTone(400, 0.25, 'triangle'); setTimeout(() => playTone(350, 0.25, 'triangle'), 250);
  setTimeout(() => playTone(300, 0.25, 'triangle'), 500); setTimeout(() => playTone(250, 0.4, 'triangle'), 750);
}
export function sfxHeartbeat() { playTone(50, 0.1, 'sine'); }

// BGM
let bgmInterval = null;
export function startBGM() {
  ensureContext(); stopBGM();
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
  let idx = 0;
  bgmInterval = setInterval(() => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(notes[idx % notes.length], audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(musicGain);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
    idx++;
  }, 500);
}
export function stopBGM() { if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } }
export function startBossBGM() {
  stopBGM();
  const notes = [196, 220, 247, 262, 294, 330, 349, 392];
  let idx = 0;
  bgmInterval = setInterval(() => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(notes[idx % notes.length], audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain); gain.connect(musicGain);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
    idx++;
  }, 300);
}
