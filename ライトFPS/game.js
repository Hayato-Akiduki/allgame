/**
 * CYBER ARENA // 3D FPS Survival
 * Built with Three.js + Web Audio API Synthesizer
 */

// ==================== SOUND SYNTHESIZER (Web Audio API) ====================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.bgmFilter = null;
    this.bgmVolume = 0.7;
    this.bgmMuted = false;
    this.bgmPlaying = false;
    this.bgmStep = 0;
    this.nextNoteTime = 0;
    this.bgmTimer = null;
    this.bpm = 136;
    this.intenseMode = true; // true during combat, false during shop/intermission

    // Music track; the synthesized loop below is only the fallback if it can't be played
    this.trackUrl = 'assets/kinetic_breach.mp3';
    this.track = null;        // HTMLAudioElement
    this.trackRouted = false; // true when the track goes through bgmFilter/bgmGain
    this.trackFailed = false;
    this.synthPlaying = false;
  }

  // The track is mastered much louder than the synth voices, so it gets its own scale
  getBgmGainTarget() {
    if (this.bgmMuted) return 0;
    return this.bgmVolume * (this.trackFailed ? 0.42 : 0.55);
  }

  ensureTrack() {
    if (this.track || this.trackFailed) return;
    const audio = new Audio(this.trackUrl);
    audio.loop = true;
    audio.preload = 'auto';
    audio.addEventListener('error', () => this.fallbackToSynth());
    this.track = audio;

    // Over http(s) route through Web Audio so the shop low-pass filter applies.
    // From file:// the element would be treated as cross-origin and output silence, so play it directly.
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      try {
        this.ctx.createMediaElementSource(audio).connect(this.bgmFilter);
        this.trackRouted = true;
      } catch (err) {
        this.trackRouted = false;
      }
    }
    this.applyTrackVolume();
  }

  applyTrackVolume() {
    // Routed tracks are controlled by bgmGain; direct playback uses the element volume
    if (this.track) this.track.volume = this.trackRouted ? 1 : Math.min(1, this.getBgmGainTarget());
  }

  fallbackToSynth() {
    if (this.trackFailed) return;
    this.trackFailed = true;
    if (this.track) this.track.pause();
    this.track = null;
    this.setBgmVolume(this.bgmVolume);
    this.setBgmIntensity(this.intenseMode);
    if (this.bgmPlaying) this.startSynth();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master filter & gain for BGM
      this.bgmFilter = this.ctx.createBiquadFilter();
      this.bgmFilter.type = 'lowpass';
      this.bgmFilter.frequency.value = 3200;

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.getBgmGainTarget();

      this.bgmFilter.connect(this.bgmGain);
      this.bgmGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setBgmVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.getBgmGainTarget(), this.ctx.currentTime, 0.05);
    }
    this.applyTrackVolume();
  }

  toggleBgmMute() {
    this.bgmMuted = !this.bgmMuted;
    this.setBgmVolume(this.bgmVolume);
    return !this.bgmMuted;
  }

  setBgmIntensity(intense) {
    this.intenseMode = intense;
    if (this.bgmFilter && this.ctx) {
      // Mellow low-pass filter during intermission/shop, full brightness during combat
      // (fully open for the music track, which is already mixed)
      const cutoff = intense ? (this.trackFailed ? 3600 : 20000) : 850;
      this.bgmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.25);
    }
  }

  startBGM() {
    this.init();
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;

    this.ensureTrack();
    if (this.track) {
      this.track.currentTime = 0;
      const playing = this.track.play();
      // Only an unplayable source means "use the synth"; AbortError (paused right away) is harmless
      if (playing && typeof playing.catch === 'function') {
        playing.catch(err => { if (err && err.name === 'NotSupportedError') this.fallbackToSynth(); });
      }
    } else {
      this.startSynth();
    }
  }

  startSynth() {
    if (this.synthPlaying) return;
    this.synthPlaying = true;
    this.bgmStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduleBGM();
  }

  stopBGM() {
    this.bgmPlaying = false;
    this.synthPlaying = false;
    if (this.track) this.track.pause();
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleBGM() {
    if (!this.synthPlaying || !this.ctx) return;
    const secondsPer16th = (60 / this.bpm) / 4;

    // Timers are throttled in background tabs; skip missed notes instead of playing them all at once
    if (this.nextNoteTime < this.ctx.currentTime) {
      const missed = Math.ceil((this.ctx.currentTime - this.nextNoteTime) / secondsPer16th);
      this.bgmStep = (this.bgmStep + missed) % 64;
      this.nextNoteTime += missed * secondsPer16th;
    }

    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.playBgmStep(this.bgmStep, this.nextNoteTime, secondsPer16th);
      this.nextNoteTime += secondsPer16th;
      this.bgmStep = (this.bgmStep + 1) % 64; // 4-bar loop (64 sixteenth notes)
    }

    this.bgmTimer = setTimeout(() => this.scheduleBGM(), 25);
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  playBgmStep(step, time, stepDur) {
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Root progression in E minor: E -> C -> D -> B
    const bassRoots = [40, 36, 38, 35]; // E2, C2, D2, B1
    const root = bassRoots[bar];

    // 1. Driving 16th-note Cyberpunk Rolling Bass
    const octaveShift = (stepInBar % 2 === 1) ? 12 : 0;
    const bassNote = root + octaveShift;
    this.triggerBass(this.midiToFreq(bassNote), time, stepDur * 0.85);

    // 2. Drums (Kick on 0, 4, 8, 12; Snare on 4, 12; Hi-hat on offbeats)
    if (stepInBar % 4 === 0) {
      this.triggerKick(time);
    }
    if (this.intenseMode) {
      if (stepInBar === 4 || stepInBar === 12) {
        this.triggerSnare(time);
      }
      if (stepInBar % 2 === 1) {
        this.triggerHat(time, stepInBar === 3 || stepInBar === 11 ? 0.09 : 0.04);
      }
    }

    // 3. Cyberpunk Synth Lead / Arpeggio
    const arpPatterns = [
      [64, 67, 71, 74, 71, 67, 64, 67], // Em7
      [60, 64, 67, 71, 67, 64, 60, 64], // Cmaj7
      [62, 66, 69, 74, 69, 66, 62, 66], // D
      [59, 63, 66, 71, 66, 63, 71, 75]  // B7
    ];

    if (stepInBar % 2 === 0) {
      const arpNote = arpPatterns[bar][(stepInBar / 2) % 8];
      this.triggerArp(this.midiToFreq(arpNote), time, stepDur * 1.6);
    }
  }

  triggerBass(freq, time, dur) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, time);
    filter.frequency.exponentialRampToValueAtTime(160, time + dur);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmFilter);

    osc.start(time);
    osc.stop(time + dur);
  }

  triggerKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, time);
    osc.frequency.exponentialRampToValueAtTime(34, time + 0.13);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.bgmFilter);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  triggerSnare(time) {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.26, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmFilter);
    noise.start(time);
  }

  triggerHat(time, dur) {
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.11, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmFilter);
    noise.start(time);
  }

  triggerArp(freq, time, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.bgmFilter);
    osc.start(time);
    osc.stop(time + dur);
  }

  playShoot(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Noise burst for gunshot punch
    const bufferSize = this.ctx.sampleRate * (type === 'sniper' ? 0.25 : 0.12);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(type === 'shotgun' ? 600 : type === 'sniper' ? 1200 : 900, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(type === 'AR' ? 0.22 : 0.38, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'sniper' ? 0.24 : 0.11));

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // Laser / Sci-fi punch oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (type === 'AR') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'shotgun') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'sniper') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.26);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'launcher') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.32);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  }

  playExplosion() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = 0.55;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.14));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(65, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 0.45);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.45);
  }

  playHit(isHeadshot) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isHeadshot ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isHeadshot ? 1350 : 620, now);
    if (isHeadshot) {
      osc.frequency.setValueAtTime(1850, now + 0.04);
    }
    gain.gain.setValueAtTime(isHeadshot ? 0.28 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeadshot ? 0.14 : 0.07));
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isHeadshot ? 0.14 : 0.07));
  }

  playKill() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playReload() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.setValueAtTime(420, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playJumpPad() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playHurt() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.18);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playBuy() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(990, now + 0.07);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

const sfx = new SoundFX();

// ==================== WEAPON CONFIGURATIONS ====================
const BASE_WEAPONS = [
  {
    id: 'AR',
    name: 'PULSE AR-55',
    damage: 24,
    headshotMult: 2.0,
    fireRate: 0.105, // seconds between shots
    magSize: 32,
    reloadTime: 1.4,
    pellets: 1,
    spread: 0.014,
    adsSpread: 0.003,
    adsFov: 52,
    auto: true,
    color: 0x00f0ff,
    recoilPitch: 0.012
  },
  {
    id: 'shotgun',
    name: 'TITAN SG-8',
    damage: 18,
    headshotMult: 1.75,
    fireRate: 0.68,
    magSize: 8,
    reloadTime: 1.9,
    pellets: 8,
    spread: 0.075,
    adsSpread: 0.045,
    adsFov: 60,
    auto: false,
    color: 0xff9900,
    recoilPitch: 0.045
  },
  {
    id: 'sniper',
    name: 'VALKYRIE SR-99',
    damage: 115,
    headshotMult: 2.5,
    fireRate: 0.95,
    magSize: 6,
    reloadTime: 2.1,
    pellets: 1,
    spread: 0.035,
    adsSpread: 0.0002,
    adsFov: 24,
    auto: false,
    color: 0xff0055,
    recoilPitch: 0.055,
    scoped: true
  },
  {
    id: 'launcher',
    name: 'PLASMA RL-4',
    damage: 155,
    headshotMult: 1.3,
    fireRate: 0.9,
    magSize: 2,
    reloadTime: 2.2,
    pellets: 1,
    spread: 0.005,
    adsSpread: 0.001,
    adsFov: 58,
    auto: false,
    color: 0x00ff88,
    recoilPitch: 0.06,
    explosive: true,
    blastRadius: 8.5
  }
];

// ==================== SAVED SCORES ====================
// localStorage can throw (blocked site data, some private modes), so every access is guarded
const STORAGE_KEYS = { best: 'cyber_arena_best_score', records: 'cyber_arena_records', settings: 'cyber_arena_settings' };
const MAX_RECORDS = 5;

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (err) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (err) { /* scores just won't persist */ }
}

function loadRecords() {
  try {
    const list = JSON.parse(storageGet(STORAGE_KEYS.records) || '[]');
    return Array.isArray(list) ? list.filter(r => r && Number.isFinite(r.score)).slice(0, MAX_RECORDS) : [];
  } catch (err) {
    return [];
  }
}

// Inserts this run into the top list; returns its rank index, or -1 if it didn't place
function saveRecord(entry) {
  const records = loadRecords();
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  const top = records.slice(0, MAX_RECORDS);
  storageSet(STORAGE_KEYS.records, JSON.stringify(top));
  return top.indexOf(entry);
}

// ==================== MAIN GAME STATE ====================
const ARENA_HALF = 55; // 110x110 arena

const game = {
  running: false,
  paused: false,
  inShop: false,
  gameOver: false,
  sensitivity: 1.0,

  // Wave & Score
  wave: 1,
  enemiesRemainingToSpawn: 0,
  spawnTimer: 0,
  intermission: false,
  intermissionTimer: 0,
  score: 0,
  bestScore: Math.max(
    parseInt(storageGet(STORAGE_KEYS.best) || '0', 10) || 0,
    (loadRecords()[0] || { score: 0 }).score
  ),
  runStartBest: 0, // best score before this run, to detect a new record at game over
  credits: 100,
  totalKills: 0,
  headshotKills: 0,
  comboCount: 0,
  comboTimer: 0,
  comboMaxTime: 4.5,
  shakeIntensity: 0,

  // Player stats & upgrades
  player: {
    pos: new THREE.Vector3(0, 2.2, 22),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    recoilOffset: 0,
    radius: 0.85,
    eyeHeight: 2.2,
    currentEyeHeight: 2.2,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    grenadeCooldown: 0,
    grenadeMaxCooldown: 7.0,
    onGround: false,
    isSprinting: false,
    isSliding: false,
    slideTimer: 0,
    slideDir: new THREE.Vector3(),
    isAds: false,
    currentWeaponIdx: 0,
    weapons: [],
    fireCooldown: 0,
    isReloading: false,
    reloadTimer: 0,
    // Upgrade multipliers
    dmgMult: 1.0,
    fireRateMult: 1.0,
    reloadSpeedMult: 1.0,
    moveSpeedMult: 1.0,
    magCapMult: 1.0,
    hpRegenLevel: 0,
    reviveTokens: 0,
    invulnTimer: 0,
    reviveBlastPending: false,
    sprintExhausted: false
  },

  upgrades: {
    dmg: { level: 0, max: 8, baseCost: 120, costStep: 90, name: '高出力バレル (攻撃力 +15%)', desc: '全武器＆グレネードの威力を15%増加させます' },
    firerate: { level: 0, max: 5, baseCost: 140, costStep: 110, name: '高速トリガー＆装填 (連射・リロード +12%)', desc: '連射速度・リロード・グレネード冷却を12%向上させます' },
    maxhp: { level: 0, max: 6, baseCost: 100, costStep: 80, name: 'ナノアーマー増設 (最大HP +30 & 回復)', desc: '最大HPを+30増やし、その場でHPを50回復します' },
    speed: { level: 0, max: 4, baseCost: 110, costStep: 90, name: 'オーバードライブ脚部 (移動速度 +8%)', desc: '歩行・ダッシュ・スライディング速度を強化します' },
    regen: { level: 0, max: 4, baseCost: 160, costStep: 130, name: 'オートリペア回路 (HP自動回復)', desc: '戦闘中も毎秒少しずつHPが自動回復します' },
    heal: { level: 0, max: 999, baseCost: 75, costStep: 0, name: '緊急メディキット (HP全回復)', desc: '即座にHPを100%まで完全回復します' },
    // Endless credit sinks for the late game
    overclock: { level: 0, max: 999, baseCost: 300, costMult: 1.4, showLevel: true, name: 'オーバークロック (攻撃力 +4% / 上限なし)', desc: '全武器＆グレネードの威力を+4%。何度でも購入できますが、購入ごとに価格が1.4倍になります' },
    revive: { level: 0, max: 999, baseCost: 1500, costStep: 1000, name: '復活チップ (エクストラライフ)', desc: '死亡時にHP50%でその場で復活し、周囲の敵を吹き飛ばします（所持上限1個・購入ごとに値上がり）' },
    contract: { level: 0, max: 999, name: 'ハイリスク契約', desc: '' }
  },

  // High-risk contract: deposit is paid up front, returned x2.5 on clearing the contracted wave
  contract: {
    pending: false, // bought, applies to the next wave that starts
    active: false,  // the current wave is under contract
    deposit: 0,
    elitesToSpawn: 0
  }
};

const CONTRACT_PAYOUT_MULT = 2.5;
const ELITE = { hpMult: 2.2, speedMult: 1.15, damageMult: 1.4, rewardMult: 3, color: 0xffc400 };

function getContractDeposit() {
  return 200 + game.wave * 40;
}

function getContractEliteCount(waveNum) {
  return 3 + Math.floor(waveNum / 3);
}

// ==================== THREE.JS SCENE SETUP ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050814);
scene.fog = new THREE.FogExp2(0x050814, 0.0085);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 250);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = 'game-canvas';
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x405580, 0.85);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x99ddff, 0.9);
dirLight.position.set(35, 65, 25);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 10;
dirLight.shadow.camera.far = 160;
const d = 65;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// Point lights for cyberpunk vibe
const neonLight1 = new THREE.PointLight(0x00f0ff, 1.5, 45);
neonLight1.position.set(0, 12, 0);
scene.add(neonLight1);

// ==================== ARENA GEOMETRY & OBSTACLES ====================
const obstacles = []; // { minX, maxX, minZ, maxZ, maxY, mesh }
const shootableMeshes = []; // Walls + floor for raycast obstruction
const jumpPads = []; // { x, z, radius }
const pickups = []; // { mesh, type, x, z, bobPhase }

function createGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.25;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.moveTo(128, 0); ctx.lineTo(128, 256);
  ctx.moveTo(0, 128); ctx.lineTo(256, 128);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 28);
  return tex;
}

function buildArena() {
  // Floor
  const floorGeo = new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2);
  const floorMat = new THREE.MeshStandardMaterial({
    map: createGridTexture(),
    roughness: 0.6,
    metalness: 0.3
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  shootableMeshes.push(floor);

  // Outer Perimeter Walls
  const wallHeight = 12;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x10182c,
    roughness: 0.4,
    metalness: 0.5
  });
  const neonTrimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const wallConfigs = [
    { x: 0, z: -ARENA_HALF, w: ARENA_HALF * 2, d: 2 },
    { x: 0, z: ARENA_HALF, w: ARENA_HALF * 2, d: 2 },
    { x: -ARENA_HALF, z: 0, w: 2, d: ARENA_HALF * 2 },
    { x: ARENA_HALF, z: 0, w: 2, d: ARENA_HALF * 2 }
  ];

  wallConfigs.forEach(cfg => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, wallHeight, cfg.d), wallMat);
    mesh.position.set(cfg.x, wallHeight / 2, cfg.z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    shootableMeshes.push(mesh);

    // Neon trim strip along wall
    const strip = new THREE.Mesh(new THREE.BoxGeometry(cfg.w * 0.99, 0.25, cfg.d * 1.05), neonTrimMat);
    strip.position.set(cfg.x, 2.5, cfg.z);
    scene.add(strip);
  });

  // Interior Obstacles, Platforms & Cover Blocks
  const blockMat = new THREE.MeshStandardMaterial({
    color: 0x18243c,
    roughness: 0.35,
    metalness: 0.45
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });

  function addBlock(x, z, w, h, d, neonColor = 0x00f0ff) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, blockMat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    shootableMeshes.push(mesh);

    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, neonColor === 0x00f0ff ? edgeMat : new THREE.LineBasicMaterial({ color: neonColor, transparent: true, opacity: 0.6 }));
    mesh.add(line);

    obstacles.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      maxY: h,
      mesh
    });
  }

  // Central Cyber Tower / Platform (can jump onto it via jump pads!)
  addBlock(0, 0, 12, 3.2, 12, 0x00f0ff);
  addBlock(0, 0, 3.5, 9, 3.5, 0xff0055);

  // 4 Symmetric Pillars / Sniper Perches
  const pillarCoords = [
    [-22, -22], [22, -22], [-22, 22], [22, 22]
  ];
  pillarCoords.forEach(([px, pz]) => {
    addBlock(px, pz, 7, 4.0, 7, 0x00f0ff);
  });

  // Cover walls & tactical barriers
  addBlock(0, -26, 14, 3.0, 2.5, 0xff0055);
  addBlock(0, 26, 14, 3.0, 2.5, 0xff0055);
  addBlock(-26, 0, 2.5, 3.0, 14, 0xff0055);
  addBlock(26, 0, 2.5, 3.0, 14, 0xff0055);

  // Outer corner bunkers
  addBlock(-38, -14, 4, 4.5, 8);
  addBlock(38, -14, 4, 4.5, 8);
  addBlock(-38, 14, 4, 4.5, 8);
  addBlock(38, 14, 4, 4.5, 8);
  addBlock(-14, -38, 8, 4.5, 4);
  addBlock(14, -38, 8, 4.5, 4);
  addBlock(-14, 38, 8, 4.5, 4);
  addBlock(14, 38, 8, 4.5, 4);

  // Jump Pads (Launch player high into the air!)
  const padCoords = [
    [-12, 0], [12, 0], [0, -12], [0, 12],
    [-34, -34], [34, -34], [-34, 34], [34, 34]
  ];
  const padGeo = new THREE.CylinderGeometry(1.8, 2.1, 0.3, 24);
  const padMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
  const padRingGeo = new THREE.RingGeometry(1.9, 2.4, 24);
  const padRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });

  padCoords.forEach(([jx, jz]) => {
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(jx, 0.15, jz);
    scene.add(pad);

    const ring = new THREE.Mesh(padRingGeo, padRingMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(jx, 0.05, jz);
    scene.add(ring);

    jumpPads.push({ x: jx, z: jz, radius: 2.1, ring });
  });

  // Distant decorative cyber towers outside arena
  const bgTowerMat = new THREE.MeshBasicMaterial({ color: 0x091022, wireframe: true });
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 90 + (i % 3) * 20;
    const h = 35 + (i % 4) * 18;
    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, h, 12), bgTowerMat);
    tMesh.position.set(Math.cos(angle) * dist, h / 2 - 5, Math.sin(angle) * dist);
    scene.add(tMesh);
  }
}

buildArena();

// ==================== FIRST-PERSON 3D WEAPON VIEWMODEL ====================
const weaponGroup = new THREE.Group();
camera.add(weaponGroup);

const weaponMeshes = [];
let muzzleFlashMesh = null;
let muzzleLight = null;

function buildViewModels() {
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.32, metalness: 0.82 });
  const gunMetal = new THREE.MeshStandardMaterial({ color: 0x2c374b, roughness: 0.25, metalness: 0.88 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x0e1218, roughness: 0.75, metalness: 0.2 });

  BASE_WEAPONS.forEach((w, idx) => {
    const grp = new THREE.Group();
    const accentMat = new THREE.MeshBasicMaterial({ color: w.color });
    const glassMat = new THREE.MeshBasicMaterial({ color: w.color, transparent: true, opacity: 0.38, side: THREE.DoubleSide });

    if (w.id === 'AR') {
      // Upper & Lower Receiver
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.085, 0.46), gunMetal);
      upper.position.set(0, 0.03, -0.08);
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.065, 0.34), darkMetal);
      lower.position.set(0, -0.03, -0.04);

      // Handguard & Barrel Shroud
      const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.082, 0.34), darkMetal);
      shroud.position.set(0, 0.025, -0.42);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 14), gunMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.025, -0.62);
      const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.08, 12), darkMetal);
      muzzleBrake.rotation.x = Math.PI / 2;
      muzzleBrake.position.set(0, 0.025, -0.78);

      // Pistol Grip, Angled Magazine & Tactical Stock
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.075), gripMat);
      grip.rotation.x = 0.28;
      grip.position.set(0, -0.11, 0.06);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.19, 0.085), darkMetal);
      mag.rotation.x = -0.22;
      mag.position.set(0, -0.13, -0.16);
      const magGlow = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.14, 0.02), accentMat);
      magGlow.rotation.x = -0.22;
      magGlow.position.set(0, -0.13, -0.16);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.22), gripMat);
      stock.position.set(0, 0.01, 0.22);

      // Top Rail & Holographic Sight
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.018, 0.52), darkMetal);
      rail.position.set(0, 0.078, -0.16);
      const holoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.065, 0.09), gunMetal);
      holoFrame.position.set(0, 0.115, -0.05);
      const holoLens = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.045), glassMat);
      holoLens.position.set(0, 0.118, -0.05);

      // Neon Energy Strips & Side Vents
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.018, 0.54), accentMat);
      strip.position.set(0, 0.032, -0.22);

      grp.add(upper, lower, shroud, barrel, muzzleBrake, grip, mag, magGlow, stock, rail, holoFrame, holoLens, strip);
    } else if (w.id === 'shotgun') {
      // Heavy Receiver & Stock
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.13, 0.44), gunMetal);
      receiver.position.set(0, 0.02, -0.04);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.08), gripMat);
      grip.rotation.x = 0.32;
      grip.position.set(0, -0.10, 0.12);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.22), darkMetal);
      stock.position.set(0, 0.0, 0.26);

      // Twin Heavy Barrels (Main + Underbarrel Mag Tube)
      const topBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.62, 16), darkMetal);
      topBarrel.rotation.x = Math.PI / 2;
      topBarrel.position.set(0, 0.05, -0.52);
      const underTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.56, 16), gunMetal);
      underTube.rotation.x = Math.PI / 2;
      underTube.position.set(0, -0.01, -0.49);

      // Ribbed Pump Forend & Heat Shield
      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.28, 12), gripMat);
      pump.rotation.x = Math.PI / 2;
      pump.position.set(0, -0.01, -0.42);
      const pumpGlow = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.24), accentMat);
      pumpGlow.position.set(0, -0.01, -0.42);

      // Side Shell Holders (Glowing Orange Slug Shells)
      for (let s = 0; s < 4; s++) {
        const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.055, 8), accentMat);
        shell.position.set(0.068, 0.025, -0.14 + s * 0.06);
        grp.add(shell);
      }

      // Rear & Front Iron Sights
      const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.02), accentMat);
      frontSight.position.set(0, 0.095, -0.78);

      grp.add(receiver, grip, stock, topBarrel, underTube, pump, pumpGlow, frontSight);
    } else if (w.id === 'sniper') {
      // Precision Chassis & Cheek-rest Stock
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.56), gunMetal);
      chassis.position.set(0, 0.015, -0.08);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.12, 0.28), darkMetal);
      stock.position.set(0, 0.01, 0.28);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.14, 0.07), gripMat);
      grip.rotation.x = 0.25;
      grip.position.set(0, -0.11, 0.08);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.14, 0.12), darkMetal);
      mag.position.set(0, -0.10, -0.12);

      // Long Fluted Bull Barrel & Muzzle Brake
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.85, 16), darkMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.68);
      const brake = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.05, 0.11), gunMetal);
      brake.position.set(0, 0.03, -1.10);

      // High-Magnification Scope with Mount Rings & Glowing Lenses
      const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.03), darkMetal);
      mount1.position.set(0, 0.09, -0.02);
      const mount2 = mount1.clone();
      mount2.position.set(0, 0.09, -0.22);

      const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.38, 16), gunMetal);
      scopeTube.rotation.x = Math.PI / 2;
      scopeTube.position.set(0, 0.125, -0.12);
      const scopeBellFront = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.032, 0.09, 16), darkMetal);
      scopeBellFront.rotation.x = Math.PI / 2;
      scopeBellFront.position.set(0, 0.125, -0.33);
      const scopeLens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), glassMat);
      scopeLens.position.set(0, 0.125, 0.071);

      // Railgun Energy Capacitors along Barrel
      const coreStrip = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.024, 0.68), accentMat);
      coreStrip.position.set(0, 0.03, -0.24);

      grp.add(chassis, stock, grip, mag, barrel, brake, mount1, mount2, scopeTube, scopeBellFront, scopeLens, coreStrip);
    } else if (w.id === 'launcher') {
      // Heavy Cylindrical Launch Tube & Flared Vent
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.82, 20), gunMetal);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0.035, -0.24);

      const frontCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.088, 0.12, 20), darkMetal);
      frontCollar.rotation.x = Math.PI / 2;
      frontCollar.position.set(0, 0.035, -0.64);

      const rearCone = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.075, 0.14, 20), darkMetal);
      rearCone.rotation.x = Math.PI / 2;
      rearCone.position.set(0, 0.035, 0.21);

      // Glowing Plasma Energy Canister Underneath
      const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.32, 14), accentMat);
      canister.rotation.x = Math.PI / 2;
      canister.position.set(0, -0.065, -0.28);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.15, 0.08), gripMat);
      grip.rotation.x = 0.22;
      grip.position.set(0, -0.11, -0.02);

      // Glowing Cooling Rings & Side Targeting Module
      for (let r = 0; r < 3; r++) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.035, 20), accentMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 0.035, -0.50 + r * 0.16);
        grp.add(ring);
      }

      const sideSight = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.14), darkMetal);
      sideSight.position.set(-0.095, 0.06, -0.22);
      const sideLens = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), glassMat);
      sideLens.position.set(-0.095, 0.06, -0.148);

      grp.add(tube, frontCollar, rearCone, canister, grip, sideSight, sideLens);
    }

    grp.visible = idx === 0;
    weaponGroup.add(grp);
    weaponMeshes.push(grp);
  });

  // Multi-layered Starburst Muzzle Flash
  muzzleFlashMesh = new THREE.Group();
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffbb, transparent: true, opacity: 0.92 });
  const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.36, 8), flashMat);
  cone1.rotation.x = Math.PI / 2;
  const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 6), flashMat);
  cone2.rotation.x = Math.PI / 2;
  cone2.rotation.z = Math.PI / 6;
  muzzleFlashMesh.add(cone1, cone2);
  muzzleFlashMesh.position.set(0, 0.03, -0.92);
  muzzleFlashMesh.visible = false;
  weaponGroup.add(muzzleFlashMesh);

  muzzleLight = new THREE.PointLight(0x00f0ff, 0, 10);
  muzzleLight.position.set(0, 0.1, -0.8);
  weaponGroup.add(muzzleLight);

  weaponGroup.position.set(0.28, -0.24, -0.45);
}

buildViewModels();

// ==================== ENEMIES, PROJECTILES & PARTICLES ====================
const enemies = [];
const enemyProjectiles = [];
const particles = [];
const tracers = [];
const grenades = [];
const shockwaves = [];

// Free GPU buffers of a removed object (geometry + materials of the whole subtree)
function disposeObject3D(root) {
  root.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
}

function removeAndDispose(obj) {
  scene.remove(obj);
  disposeObject3D(obj);
}

// Particles are spawned in large numbers, so they share one geometry and a per-color material
const PARTICLE_GEO = new THREE.BoxGeometry(0.14, 0.14, 0.14);
const particleMatCache = new Map();
function getParticleMaterial(color) {
  let mat = particleMatCache.get(color);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({ color });
    particleMatCache.set(color, mat);
  }
  return mat;
}

const ENEMY_TYPES = {
  grunt: {
    name: 'STALKER BOT',
    hp: 65,
    speed: 9.0,
    damage: 12,
    score: 100,
    credits: 25,
    color: 0x00f0ff,
    headColor: 0xffdd00,
    scale: 1.0,
    ranged: false
  },
  runner: {
    name: 'BLITZ DRONE',
    hp: 40,
    speed: 14.5,
    damage: 9,
    score: 130,
    credits: 30,
    color: 0xff0055,
    headColor: 0xffffff,
    scale: 0.88,
    ranged: false
  },
  shooter: {
    name: 'PLASMA GUNNER',
    hp: 90,
    speed: 6.5,
    damage: 14,
    score: 180,
    credits: 42,
    color: 0xaa00ff,
    headColor: 0x00ff88,
    scale: 1.05,
    ranged: true
  },
  tank: {
    name: 'GOLIATH MECH',
    hp: 260,
    speed: 5.2,
    damage: 25,
    score: 350,
    credits: 85,
    color: 0xff6600,
    headColor: 0xff0055,
    scale: 1.5,
    ranged: true
  },
  boss: {
    name: 'OMEGA TITAN',
    hp: 1100,
    speed: 4.8,
    damage: 32,
    score: 1500,
    credits: 350,
    color: 0xff0055,
    headColor: 0xffdd00,
    scale: 2.3,
    ranged: true,
    isBoss: true
  }
};

// Shared emissive map for enemy skins: white circuit traces on black, tinted per enemy by
// the material's emissive color. Its offset scrolls each frame so data appears to flow upward.
function createCircuitTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  // Deterministic pseudo-random so the pattern is the same every load
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  // Faint grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }

  // Traces: right-angle walks on a 16px grid, ending in round pads
  const step = 16;
  for (let t = 0; t < 22; t++) {
    let x = Math.floor(rand() * 16) * step;
    let y = Math.floor(rand() * 16) * step;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 + rand() * 0.45})`;
    ctx.lineWidth = rand() < 0.3 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 2 + Math.floor(rand() * 4);
    for (let k = 0; k < segs; k++) {
      const len = (1 + Math.floor(rand() * 4)) * step;
      if (rand() < 0.5) x += rand() < 0.5 ? len : -len;
      else y += rand() < 0.5 ? len : -len;
      x = Math.max(0, Math.min(size, x));
      y = Math.max(0, Math.min(size, y));
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // A few chip blocks
  for (let c = 0; c < 4; c++) {
    const cx = Math.floor(rand() * 12) * step + 8;
    const cy = Math.floor(rand() * 12) * step + 8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, 40, 28);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(cx + 6, cy + 6, 28, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const ENEMY_CIRCUIT_TEX = createCircuitTexture();

function spawnEnemy(forceType = null, isElite = false) {
  let typeKey = forceType;
  if (!typeKey) {
    const r = Math.random();
    typeKey = 'grunt';
    if (game.wave >= 4 && r < 0.16) {
      typeKey = 'tank';
    } else if (game.wave >= 3 && r < 0.42) {
      typeKey = 'shooter';
    } else if (game.wave >= 2 && r < 0.68) {
      typeKey = 'runner';
    }
  }

  const cfg = ENEMY_TYPES[typeKey];
  const waveHpScale = 1 + (game.wave - 1) * 0.16;
  const maxHp = Math.round(cfg.hp * waveHpScale * (isElite ? ELITE.hpMult : 1));
  const bodyColor = isElite ? ELITE.color : cfg.color;

  // Pick spawn point near arena perimeter away from player
  let sx = 0, sz = 0;
  for (let attempt = 0; attempt < 10; attempt++) {
    const side = Math.floor(Math.random() * 4);
    const offset = (Math.random() * 2 - 1) * (ARENA_HALF - 6);
    if (side === 0) { sx = offset; sz = -(ARENA_HALF - 5); }
    else if (side === 1) { sx = offset; sz = (ARENA_HALF - 5); }
    else if (side === 2) { sx = -(ARENA_HALF - 5); sz = offset; }
    else { sx = (ARENA_HALF - 5); sz = offset; }

    if (Math.hypot(sx - game.player.pos.x, sz - game.player.pos.z) > 22) break;
  }

  const group = new THREE.Group();
  const s = cfg.scale * (isElite ? 1.15 : 1);
  const hitMeshes = [];

  // Electronic style: dark box with glowing circuit traces, neon outline and LED eyes.
  // Types differ by color and silhouette (box proportions, floating cube for the drone).
  const baseGlow = isElite ? 1.6 : 1.1;
  const shellMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColor).lerp(new THREE.Color(0x05070f), 0.82),
    emissive: bodyColor,
    emissiveMap: ENEMY_CIRCUIT_TEX,
    emissiveIntensity: baseGlow,
    roughness: 0.3,
    metalness: 0.6
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(bodyColor).lerp(new THREE.Color(0xffffff), 0.25) });
  const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).lerp(new THREE.Color(bodyColor), 0.15) });

  // Squash/hop animation moves this inner group; the outer group keeps position + facing
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  function addPart(geo, mat, x, y, z, isHead = false) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    bodyGroup.add(m);
    hitMeshes.push({ mesh: m, isHead });
    return m;
  }

  // Two glowing LED eyes flat on the front (+z) face of a box; faceZ is that face, w its width
  function addEyes(ey, w, faceZ) {
    [-1, 1].forEach(side => {
      const eye = addPart(new THREE.SphereGeometry(w * 0.11, 16, 12), eyeMat, side * w * 0.22, ey, faceZ, true);
      eye.scale.set(0.8, 1.25, 0.25);
    });
  }

  // A box split into a body part (lower) and a head part (upper, critical) that line up seamlessly
  function addBox(w, h, d, baseY, headFrac) {
    const headH = h * headFrac;
    const bodyH = h - headH;
    addPart(new THREE.BoxGeometry(w, bodyH, d), shellMat, 0, baseY + bodyH / 2, 0, false);
    addPart(new THREE.BoxGeometry(w, headH, d), shellMat, 0, baseY + bodyH + headH / 2, 0, true);
    addEyes(baseY + bodyH + headH * 0.5, w, d / 2);

    // Neon outline of the whole box (decoration only, not a hit target)
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w * 1.01, h * 1.01, d * 1.01)), edgeMat);
    outline.position.y = baseY + h / 2;
    bodyGroup.add(outline);
  }

  // width, height, depth (before scale); types differ by color and silhouette
  const SHAPES = {
    grunt: { w: 1.0, h: 2.2, d: 0.9 },
    shooter: { w: 0.82, h: 2.45, d: 0.78 },
    tank: { w: 1.45, h: 1.9, d: 1.25 },
    boss: { w: 1.2, h: 2.1, d: 1.05 }
  };
  const hovers = typeKey === 'runner';

  if (hovers) {
    // Small floating cube: upper half is the critical spot
    const size = 1.0 * s;
    addBox(size, size, size, 0.95 * s, 0.5);
  } else {
    const shape = SHAPES[typeKey] || SHAPES.grunt;
    addBox(shape.w * s, shape.h * s, shape.d * s, 0, 0.4);
  }

  // Floating Health Bar above enemy
  const hpBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4 * s, 0.16),
    new THREE.MeshBasicMaterial({ color: 0x220011, side: THREE.DoubleSide })
  );
  hpBg.position.y = 3.05 * s;
  const hpFg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36 * s, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide })
  );
  hpFg.position.z = 0.01;
  hpBg.add(hpFg);
  group.add(hpBg);

  group.position.set(sx, 0, sz);
  scene.add(group);

  const enemyObj = {
    typeKey,
    name: isElite ? `★ELITE ${cfg.name}` : cfg.name,
    isElite,
    group,
    hitMeshes: hitMeshes.map(h => h.mesh),
    bodyGroup,
    hovers,
    shellMat,
    baseGlow,
    walkPhase: Math.random() * Math.PI * 2,
    hpBg,
    hpFg,
    hp: maxHp,
    maxHp,
    speed: cfg.speed * (1 + (game.wave - 1) * 0.03) * (isElite ? ELITE.speedMult : 1),
    damage: Math.round(cfg.damage * (isElite ? ELITE.damageMult : 1)),
    score: cfg.score * (isElite ? ELITE.rewardMult : 1),
    credits: cfg.credits * (isElite ? ELITE.rewardMult : 1),
    color: bodyColor,
    radius: 0.75 * s,
    ranged: cfg.ranged,
    isBoss: !!cfg.isBoss,
    attackCooldown: 1.0 + Math.random() * 1.5,
    avoidOb: null,
    avoidCorner: -1,
    strafeDir: Math.random() < 0.5 ? 1 : -1,
    strafeTimer: 1.5
  };

  // Tag every part of the enemy for raycasting (Head vs Body)
  hitMeshes.forEach(({ mesh, isHead }) => {
    mesh.userData = { enemy: enemyObj, isHead };
  });

  enemies.push(enemyObj);
  if (enemyObj.isBoss) {
    updateBossHUD();
  }
}

function triggerExplosion(centerPos, radius, baseDmg, color = 0xff6600) {
  sfx.playExplosion();
  spawnHitParticles(centerPos, color, 28);
  spawnHitParticles(centerPos, 0xffdd00, 14);

  // Camera shake proportional to proximity
  const distToPlayer = centerPos.distanceTo(game.player.pos);
  if (distToPlayer < 45) {
    const shake = Math.max(0.08, (1 - distToPlayer / 45) * 0.45);
    game.shakeIntensity = Math.min(0.6, game.shakeIntensity + shake);
  }

  // Expanding 3D shockwave ring
  const ringGeo = new THREE.RingGeometry(0.4, 1.0, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(centerPos.x, Math.max(0.2, centerPos.y), centerPos.z);
  scene.add(ringMesh);
  shockwaves.push({ mesh: ringMesh, mat: ringMat, maxRadius: radius, life: 0.35, maxLife: 0.35 });

  // Damage enemies within blast radius (snapshot array in case enemies die)
  const snapshot = [...enemies];
  for (const e of snapshot) {
    const ePos = e.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const d = ePos.distanceTo(centerPos);
    if (d <= radius) {
      const falloff = 1 - (d / radius) * 0.55;
      const dmg = Math.round(baseDmg * game.player.dmgMult * falloff);
      // Knockback away from blast
      const pushDir = e.group.position.clone().sub(centerPos);
      pushDir.y = 0;
      if (pushDir.lengthSq() > 0.001) {
        pushDir.normalize();
        e.group.position.addScaledVector(pushDir, (1 - d / radius) * 3.2);
      }
      damageEnemy(e, dmg, false, ePos);
    }
  }
}

function throwGrenade() {
  const p = game.player;
  if (p.grenadeCooldown > 0) return;

  p.grenadeCooldown = p.grenadeMaxCooldown / p.reloadSpeedMult;
  sfx.playJumpPad();

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  );
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(p.pitch, p.yaw, 0, 'YXZ'));
  mesh.position.copy(p.pos).addScaledVector(forward, 1.0);
  const vel = forward.multiplyScalar(25).add(new THREE.Vector3(0, 6.5, 0));
  scene.add(mesh);
  grenades.push({ mesh, vel, timer: 1.35 });
}

function createBulletTracer(startPos, endPos, color) {
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const geo = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  tracers.push({ line, mat, life: 0.09, maxLife: 0.09 });
}

function spawnHitParticles(pos, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(PARTICLE_GEO, getParticleMaterial(color));
    mesh.position.copy(pos);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      Math.random() * 9 + 2,
      (Math.random() - 0.5) * 12
    );
    scene.add(mesh);
    particles.push({ mesh, vel, life: 0.45 + Math.random() * 0.25 });
  }
}

function spawnHealthPickup(x, z) {
  const grp = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: false })
  );
  const ring = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
  );
  grp.add(box, ring);
  grp.position.set(x, 1.0, z);
  scene.add(grp);
  pickups.push({ mesh: grp, x, z, bobPhase: Math.random() * Math.PI * 2 });
}

// ==================== INPUT HANDLING ====================
const keys = {};
let mouseDownLeft = false;
let mouseDownRight = false;

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  if (!game.running || game.gameOver) return;

  // Toggle BGM Mute [M]
  if (e.code === 'KeyM') {
    const isOn = sfx.toggleBgmMute();
    showAnnouncement(isOn ? '🎵 BGM: ON' : '🔇 BGM: OFF');
    saveSettings();
    return;
  }

  // Pause menu is open: only the resume button should act (shop / next wave would stack on top of it)
  if (game.paused) return;

  // Toggle Shop [B]
  if (e.code === 'KeyB') {
    toggleShop();
    return;
  }

  // Close Shop [ESC]
  if (e.code === 'Escape' && game.inShop) {
    closeShop();
    return;
  }

  // Force start next wave during intermission [N]
  if (e.code === 'KeyN' && game.intermission) {
    if (game.inShop) closeShop();
    startWave(game.wave + 1);
    return;
  }

  if (game.inShop) return;

  // Weapon Switch [1, 2, 3, 4]
  if (e.code === 'Digit1') switchWeapon(0);
  if (e.code === 'Digit2') switchWeapon(1);
  if (e.code === 'Digit3') switchWeapon(2);
  if (e.code === 'Digit4') switchWeapon(3);

  // Throw Plasma Grenade [G or Q]
  if (e.code === 'KeyG' || e.code === 'KeyQ') {
    throwGrenade();
  }

  // Reload [R]
  if (e.code === 'KeyR') startReload();

  // Slide Trigger [C] (Ctrl is not used: Ctrl+W would close the browser tab)
  if (e.code === 'KeyC' && !game.player.isSliding && game.player.onGround) {
    tryStartSlide();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// keyup never arrives for keys released while the window is unfocused (Alt+Tab etc.)
window.addEventListener('blur', () => {
  for (const code in keys) keys[code] = false;
  mouseDownLeft = false;
  mouseDownRight = false;
});

window.addEventListener('mousedown', (e) => {
  if (!game.running || game.paused || game.inShop || game.gameOver) return;
  if (document.pointerLockElement !== renderer.domElement) {
    requestLock();
    return;
  }
  if (e.button === 0) {
    mouseDownLeft = true;
    tryShoot();
  } else if (e.button === 2) {
    mouseDownRight = true;
    setAds(true);
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDownLeft = false;
  if (e.button === 2) {
    mouseDownRight = false;
    setAds(false);
  }
});

window.addEventListener('wheel', (e) => {
  if (!game.running || game.paused || game.inShop || game.gameOver) return;
  const dir = e.deltaY > 0 ? 1 : -1;
  const next = (game.player.currentWeaponIdx + dir + BASE_WEAPONS.length) % BASE_WEAPONS.length;
  switchWeapon(next);
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  if (!game.running || game.paused || game.inShop || game.gameOver) return;

  const adsSensFactor = game.player.isAds ? 0.5 : 1.0;
  const sens = 0.0022 * game.sensitivity * adsSensFactor;

  game.player.yaw -= e.movementX * sens;
  game.player.pitch -= e.movementY * sens;
  const maxPitch = Math.PI / 2 - 0.05;
  game.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, game.player.pitch));
});

function requestLock() {
  // Newer Chrome returns a Promise that rejects on failure; the failure itself is handled by 'pointerlockerror'
  const result = renderer.domElement.requestPointerLock();
  if (result && typeof result.catch === 'function') result.catch(() => {});
}

function showPauseMenu() {
  if (!game.running || game.inShop || game.gameOver) return;
  game.paused = true;
  document.getElementById('start-btn').textContent = 'RESUME MISSION (クリックで再開)';
  document.getElementById('quit-btn').classList.remove('hidden');
  document.getElementById('menu-overlay').classList.remove('hidden');
}

// Re-locking can be refused (e.g. right after leaving the shop); pause instead of running without mouse control
document.addEventListener('pointerlockerror', () => {
  showPauseMenu();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== renderer.domElement) {
    mouseDownLeft = false;
    mouseDownRight = false;
    setAds(false);
    showPauseMenu();
  } else {
    game.paused = false;
    document.getElementById('menu-overlay').classList.add('hidden');
  }
});

// ==================== PLAYER ACTIONS & COMBAT ====================
function initWeapons() {
  game.player.weapons = BASE_WEAPONS.map(w => {
    const maxMag = Math.round(w.magSize * game.player.magCapMult);
    return {
      ...w,
      ammo: maxMag,
      maxAmmo: maxMag
    };
  });
}

function getCurrentWeapon() {
  return game.player.weapons[game.player.currentWeaponIdx];
}

function switchWeapon(idx) {
  if (idx === game.player.currentWeaponIdx) return;
  game.player.currentWeaponIdx = idx;
  game.player.isReloading = false;
  document.getElementById('reload-bar-wrap').classList.add('hidden');
  setAds(false);

  weaponMeshes.forEach((m, i) => {
    m.visible = i === idx;
  });

  document.querySelectorAll('.w-slot').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });

  updateWeaponHUD();
}

function setAds(active) {
  game.player.isAds = active;
  const w = getCurrentWeapon();
  const scopeOverlay = document.getElementById('scope-overlay');
  const crosshair = document.getElementById('crosshair');

  if (active && w && w.scoped) {
    scopeOverlay.classList.remove('hidden');
    crosshair.classList.add('hidden');
    weaponGroup.visible = false;
  } else {
    scopeOverlay.classList.add('hidden');
    crosshair.classList.remove('hidden');
    weaponGroup.visible = true;
  }
}

function startReload() {
  const w = getCurrentWeapon();
  if (game.player.isReloading || w.ammo >= w.maxAmmo) return;

  setAds(false);
  game.player.isReloading = true;
  game.player.reloadTimer = w.reloadTime / game.player.reloadSpeedMult;
  sfx.playReload();
  document.getElementById('reload-bar-wrap').classList.remove('hidden');
}

function tryStartSlide() {
  const p = game.player;
  if (p.stamina < 20) return;

  // Compute movement input direction
  const forward = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
  const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
  const moveDir = new THREE.Vector3();
  if (keys['KeyW']) moveDir.add(forward);
  if (keys['KeyS']) moveDir.sub(forward);
  if (keys['KeyD']) moveDir.add(right);
  if (keys['KeyA']) moveDir.sub(right);

  if (moveDir.lengthSq() < 0.01) {
    moveDir.copy(forward);
  } else {
    moveDir.normalize();
  }

  p.isSliding = true;
  p.slideTimer = 0.65;
  p.slideDir.copy(moveDir);
  p.stamina = Math.max(0, p.stamina - 22);
}

const raycaster = new THREE.Raycaster();

function tryShoot() {
  const p = game.player;
  const w = getCurrentWeapon();
  if (p.isReloading || p.fireCooldown > 0) return;

  if (w.ammo <= 0) {
    startReload();
    return;
  }

  w.ammo--;
  p.fireCooldown = w.fireRate / p.fireRateMult;
  sfx.playShoot(w.id);

  // Recoil & Muzzle Flash
  p.recoilOffset = Math.min(0.14, p.recoilOffset + w.recoilPitch);
  weaponGroup.position.z = -0.34;
  muzzleFlashMesh.visible = !p.isAds;
  muzzleLight.color.setHex(w.color);
  muzzleLight.intensity = 3.0;
  setTimeout(() => {
    muzzleFlashMesh.visible = false;
    muzzleLight.intensity = 0;
  }, 45);

  // Collect all raycast targets (all enemy parts + arena walls)
  const enemyTargets = [];
  enemies.forEach(e => {
    enemyTargets.push(...e.hitMeshes);
  });
  const allTargets = [...enemyTargets, ...shootableMeshes];

  // Muzzle world position for tracer start
  const tracerStart = new THREE.Vector3(0.22, -0.15, -0.8);
  tracerStart.applyMatrix4(camera.matrixWorld);

  const spread = p.isAds ? w.adsSpread : w.spread;

  for (let i = 0; i < w.pellets; i++) {
    const rx = (Math.random() - 0.5) * spread * 2;
    const ry = (Math.random() - 0.5) * spread * 2;

    raycaster.setFromCamera(new THREE.Vector2(rx, ry), camera);
    const hits = raycaster.intersectObjects(allTargets, false);

    let endPoint = new THREE.Vector3();
    raycaster.ray.at(120, endPoint);

    // Ignore enemies already killed by an earlier pellet of this same shot
    const hit = hits.find(h => !(h.object.userData.enemy && h.object.userData.enemy.hp <= 0));

    if (hit) {
      endPoint.copy(hit.point);

      const uData = hit.object.userData;
      if (w.explosive) {
        triggerExplosion(hit.point, w.blastRadius, w.damage, w.color);
      } else if (uData && uData.enemy) {
        const enemy = uData.enemy;
        const isHead = uData.isHead;
        const dmg = Math.round(w.damage * p.dmgMult * (isHead ? w.headshotMult : 1.0));
        damageEnemy(enemy, dmg, isHead, hit.point);
      } else {
        // Wall spark
        spawnHitParticles(hit.point, w.color, 3);
      }
    }

    createBulletTracer(tracerStart, endPoint, w.color);
  }

  updateWeaponHUD();
  if (w.ammo === 0) {
    startReload();
  }
}

let hitmarkerTimeout = null;

function damageEnemy(enemy, dmg, isHeadshot, hitPoint) {
  if (enemy.hp <= 0) return;

  enemy.hp -= dmg;
  sfx.playHit(isHeadshot);
  spawnHitParticles(hitPoint, isHeadshot ? 0xffdd00 : enemy.color, isHeadshot ? 12 : 6);
  spawnFloatingDamage(hitPoint, dmg, isHeadshot);

  // Update Enemy Health Bar
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  enemy.hpFg.scale.x = Math.max(0.001, ratio);
  if (enemy.isBoss) {
    updateBossHUD();
  }

  // Hitmarker UI
  const hm = document.getElementById('hitmarker');
  hm.classList.remove('hidden');
  hm.classList.toggle('headshot', isHeadshot);
  if (hitmarkerTimeout) clearTimeout(hitmarkerTimeout);
  hitmarkerTimeout = setTimeout(() => hm.classList.add('hidden'), 130);

  if (enemy.hp <= 0) {
    killEnemy(enemy, isHeadshot);
  }
}

function getComboMult() {
  return Math.min(3.0, 1.0 + Math.floor(game.comboCount / 2) * 0.25);
}

function killEnemy(enemy, isHeadshot) {
  sfx.playKill();
  const idx = enemies.indexOf(enemy);
  if (idx !== -1) enemies.splice(idx, 1);

  const deathPos = enemy.group.position.clone().add(new THREE.Vector3(0, 1.4, 0));
  spawnHitParticles(deathPos, enemy.color, enemy.isBoss ? 55 : 22);
  removeAndDispose(enemy.group);

  if (enemy.isBoss) {
    updateBossHUD();
  }

  // Chance to drop a health pickup (guaranteed on Boss)
  if (enemy.isBoss || Math.random() < 0.22) {
    spawnHealthPickup(enemy.group.position.x, enemy.group.position.z);
  }

  // Combo streak update
  game.comboCount++;
  game.comboTimer = game.comboMaxTime;
  const comboMult = getComboMult();

  // Rewards
  const hsBonus = isHeadshot ? 1.5 : 1.0;
  const gainedScore = Math.round(enemy.score * hsBonus * comboMult);
  const gainedCredits = Math.round(enemy.credits * hsBonus * (1 + (comboMult - 1) * 0.5));

  game.score += gainedScore;
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    storageSet(STORAGE_KEYS.best, String(game.bestScore));
  }
  game.credits += gainedCredits;
  game.totalKills++;
  if (isHeadshot) game.headshotKills++;

  addKillFeed(enemy.name, isHeadshot, gainedCredits, comboMult);
  updateTopHUD();

  // Check if wave cleared
  if (enemies.length === 0 && game.enemiesRemainingToSpawn <= 0 && !game.intermission) {
    onWaveCleared();
  }
}

function spawnFloatingDamage(worldPos, dmg, isCrit) {
  const projected = worldPos.clone().project(camera);
  if (projected.z > 1) return;

  const x = (projected.x * 0.5 + 0.5) * window.innerWidth + (Math.random() - 0.5) * 28;
  const y = (-(projected.y * 0.5) + 0.5) * window.innerHeight + (Math.random() - 0.5) * 24;

  const el = document.createElement('div');
  el.className = 'dmg-num' + (isCrit ? ' crit' : '');
  el.textContent = isCrit ? `CRITICAL ${dmg}!` : dmg;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  const container = document.getElementById('damage-numbers');
  container.appendChild(el);
  setTimeout(() => el.remove(), 750);
}

function addKillFeed(enemyName, isHs, credits, comboMult = 1.0) {
  const feed = document.getElementById('kill-feed');
  const item = document.createElement('div');
  item.className = 'kill-item' + (isHs ? ' hs' : '');
  const comboTag = comboMult > 1.0 ? ` [x${comboMult.toFixed(2)}]` : '';
  item.textContent = `${isHs ? '🎯 HEADSHOT! ' : '撃破: '}${enemyName}${comboTag} (+¥${credits})`;
  feed.appendChild(item);
  setTimeout(() => item.remove(), 3200);
}

function updateBossHUD() {
  const boss = enemies.find(e => e.isBoss);
  const container = document.getElementById('boss-bar-container');
  if (!boss) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  document.getElementById('boss-name').textContent = `⚠️ ${boss.name} // HP ${Math.max(0, boss.hp)} / ${boss.maxHp}`;
  const pct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  document.getElementById('boss-hp-fill').style.width = `${pct}%`;
}

// ==================== WAVE MANAGEMENT ====================
function startWave(waveNum) {
  game.wave = waveNum;
  game.intermission = false;
  document.getElementById('shop-prompt').classList.add('hidden');
  sfx.setBgmIntensity(true);

  const totalWaveEnemies = 6 + waveNum * 4;
  game.enemiesRemainingToSpawn = totalWaveEnemies;
  game.spawnTimer = 0.5;

  const c = game.contract;
  if (c.pending) {
    c.pending = false;
    c.active = true;
    c.elitesToSpawn = Math.min(getContractEliteCount(waveNum), totalWaveEnemies);
  }
  const contractTag = c.active ? ' // ⚠️ CONTRACT ACTIVE' : '';

  // Spawn OMEGA TITAN Boss every 5th wave (or mini-boss on wave 3+)
  if (waveNum % 5 === 0) {
    spawnEnemy('boss');
    showAnnouncement(`⚠️ WAVE ${waveNum} // BOSS APPROACHING!${contractTag}`);
  } else {
    showAnnouncement(`WAVE ${waveNum} // START!${contractTag}`);
  }
  updateTopHUD();
  updateStatusTags();
}

function onWaveCleared() {
  game.intermission = true;
  game.intermissionTimer = 14.0;
  sfx.setBgmIntensity(false);
  const waveBonus = 60 + game.wave * 25;
  game.credits += waveBonus;

  let contractText = '';
  const c = game.contract;
  if (c.active) {
    const payout = Math.round(c.deposit * CONTRACT_PAYOUT_MULT);
    game.credits += payout;
    contractText = ` // CONTRACT COMPLETE +¥${payout.toLocaleString()}`;
    c.active = false;
    c.deposit = 0;
    c.elitesToSpawn = 0;
  }

  // Refill ammo on wave clear
  game.player.weapons.forEach(w => { w.ammo = w.maxAmmo; });
  updateWeaponHUD();
  updateTopHUD();
  updateStatusTags();

  showAnnouncement(`WAVE ${game.wave} CLEARED! (+¥${waveBonus})${contractText}`);
  document.getElementById('shop-prompt').classList.remove('hidden');
}

let announceTimeout = null;
function showAnnouncement(text) {
  const el = document.getElementById('announcement');
  el.textContent = text;
  el.classList.add('show');
  if (announceTimeout) clearTimeout(announceTimeout);
  announceTimeout = setTimeout(() => el.classList.remove('show'), 2600);
}

// ==================== PLAYER DAMAGE & HEALING ====================
function takePlayerDamage(amount) {
  if (game.gameOver || game.player.invulnTimer > 0) return;
  game.player.hp = Math.max(0, game.player.hp - amount);
  sfx.playHurt();
  game.shakeIntensity = Math.min(0.45, game.shakeIntensity + 0.16);

  const overlay = document.getElementById('damage-overlay');
  overlay.style.opacity = '1';
  setTimeout(() => { overlay.style.opacity = '0'; }, 180);

  updateHealthHUD();

  if (game.player.hp <= 0) {
    if (game.player.reviveTokens > 0) {
      revivePlayer();
    } else {
      triggerGameOver();
    }
  }
}

function revivePlayer() {
  const p = game.player;
  p.reviveTokens--;
  p.hp = Math.ceil(p.maxHp * 0.5);
  p.invulnTimer = 2.5;
  // Blast runs at the start of next frame: we may be inside the enemy/projectile update loops here
  p.reviveBlastPending = true;

  healPlayer(0);
  showAnnouncement('💠 REVIVE CHIP ACTIVATED! 💠');
  updateStatusTags();
}

function healPlayer(amount) {
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + amount);
  const overlay = document.getElementById('heal-overlay');
  overlay.style.opacity = '1';
  setTimeout(() => { overlay.style.opacity = '0'; }, 240);
  updateHealthHUD();
}

function triggerGameOver() {
  game.gameOver = true;
  sfx.stopBGM();
  document.exitPointerLock();

  document.getElementById('final-wave').textContent = game.wave;
  document.getElementById('final-score').textContent = game.score.toLocaleString();
  document.getElementById('final-kills').textContent = game.totalKills;
  const hsRate = game.totalKills > 0 ? Math.round((game.headshotKills / game.totalKills) * 100) : 0;
  document.getElementById('final-hs').textContent = `${hsRate}%`;

  const rank = recordCurrentRun();
  const isNewBest = game.score > game.runStartBest;
  const badge = document.getElementById('gameover-record-badge');
  if (isNewBest) {
    badge.textContent = '🏆 NEW HIGH SCORE!';
    badge.className = 'record-badge new';
  } else {
    const bestText = `ハイスコア ${game.bestScore.toLocaleString()}`;
    badge.textContent = rank >= 0 ? `今回の順位 #${rank + 1}  //  ${bestText}` : bestText;
    badge.className = 'record-badge';
  }
  renderRecords(document.getElementById('gameover-records'), rank);
  renderRecords(document.getElementById('menu-records'), -1);

  document.getElementById('gameover-overlay').classList.remove('hidden');
}

// Saves the current run to the high-score list; returns its rank index, or -1
function recordCurrentRun() {
  if (game.score <= 0) return -1;
  const hsRate = game.totalKills > 0 ? Math.round((game.headshotKills / game.totalKills) * 100) : 0;
  const d = new Date();
  return saveRecord({
    score: game.score,
    wave: game.wave,
    kills: game.totalKills,
    hs: hsRate,
    date: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  });
}

function renderRecords(listEl, highlightIdx) {
  const records = loadRecords();
  listEl.innerHTML = '';
  if (records.length === 0) {
    const li = document.createElement('li');
    li.className = 'records-empty';
    li.textContent = 'まだ記録がありません';
    listEl.appendChild(li);
    return;
  }
  records.forEach((r, i) => {
    const li = document.createElement('li');
    if (i === highlightIdx) li.classList.add('current');
    const cells = [
      ['rec-rank', `#${i + 1}`],
      ['rec-score', r.score.toLocaleString()],
      ['rec-meta', `WAVE ${r.wave} / ${r.kills} KILLS`],
      ['rec-date', r.date || '']
    ];
    cells.forEach(([cls, text]) => {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = text;
      li.appendChild(span);
    });
    listEl.appendChild(li);
  });
}

// ==================== COLLISION RESOLUTION ====================
function resolveHorizontalCollisions(pos, radius, currentY) {
  // Arena perimeter bounds
  const limit = ARENA_HALF - 1.2 - radius;
  pos.x = Math.max(-limit, Math.min(limit, pos.x));
  pos.z = Math.max(-limit, Math.min(limit, pos.z));

  // Interior obstacles
  const feetY = currentY - game.player.eyeHeight;
  for (const ob of obstacles) {
    // Only collide horizontally if player's feet are below the top of the obstacle
    if (feetY < ob.maxY - 0.25) {
      const closestX = Math.max(ob.minX, Math.min(pos.x, ob.maxX));
      const closestZ = Math.max(ob.minZ, Math.min(pos.z, ob.maxZ));
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        } else {
          pos.x += radius;
        }
      }
    }
  }
}

function getGroundHeightAt(x, z, feetY) {
  let highest = 0;
  for (const ob of obstacles) {
    if (x >= ob.minX - 0.3 && x <= ob.maxX + 0.3 && z >= ob.minZ - 0.3 && z <= ob.maxZ + 0.3) {
      if (feetY >= ob.maxY - 0.55 && ob.maxY > highest) {
        highest = ob.maxY;
      }
    }
  }
  return highest;
}

// ==================== UPDATE LOOP ====================
function updatePlayer(dt) {
  const p = game.player;

  // Automatic fire if holding mouse button with Assault Rifle
  if (p.fireCooldown > 0) p.fireCooldown -= dt;
  if (mouseDownLeft && getCurrentWeapon().auto && p.fireCooldown <= 0 && !p.isReloading) {
    tryShoot();
  }

  // Grenade cooldown & HUD
  if (p.grenadeCooldown > 0) {
    p.grenadeCooldown = Math.max(0, p.grenadeCooldown - dt);
  }
  const gMax = p.grenadeMaxCooldown / p.reloadSpeedMult;
  const gPct = Math.round(((gMax - p.grenadeCooldown) / gMax) * 100);
  document.getElementById('grenade-bar').style.width = `${gPct}%`;
  document.getElementById('grenade-text').textContent = p.grenadeCooldown <= 0 ? 'READY [G/Q]' : `${p.grenadeCooldown.toFixed(1)}s`;

  // Combo timer decay
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) {
      game.comboCount = 0;
      game.comboTimer = 0;
    }
  }
  const comboMult = getComboMult();
  document.getElementById('combo-val').textContent = `x${comboMult.toFixed(2)}`;
  document.getElementById('combo-bar').style.width = `${(game.comboTimer / game.comboMaxTime) * 100}%`;

  // Reloading timer
  if (p.isReloading) {
    const w = getCurrentWeapon();
    p.reloadTimer -= dt;
    const totalTime = w.reloadTime / p.reloadSpeedMult;
    const pct = Math.min(100, Math.max(0, ((totalTime - p.reloadTimer) / totalTime) * 100));
    document.getElementById('reload-bar').style.width = `${pct}%`;

    if (p.reloadTimer <= 0) {
      p.isReloading = false;
      w.ammo = w.maxAmmo;
      document.getElementById('reload-bar-wrap').classList.add('hidden');
      updateWeaponHUD();
    }
  }

  // Revive shockwave: clear incoming plasma and blast nearby enemies away
  if (p.reviveBlastPending) {
    p.reviveBlastPending = false;
    enemyProjectiles.forEach(pr => removeAndDispose(pr.mesh));
    enemyProjectiles.length = 0;
    const blastPos = new THREE.Vector3(p.pos.x, p.pos.y - p.currentEyeHeight + 1.0, p.pos.z);
    triggerExplosion(blastPos, 12, 250, 0x00ff88);
  }

  // Post-revive invulnerability
  if (p.invulnTimer > 0) {
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.invulnTimer === 0) updateStatusTags();
  }

  // Passive HP regeneration upgrade
  if (p.hpRegenLevel > 0 && p.hp < p.maxHp) {
    p.hp = Math.min(p.maxHp, p.hp + p.hpRegenLevel * 2.2 * dt);
    updateHealthHUD();
  }

  // Movement Input
  const forward = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
  const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
  const moveInput = new THREE.Vector3();
  if (keys['KeyW']) moveInput.add(forward);
  if (keys['KeyS']) moveInput.sub(forward);
  if (keys['KeyD']) moveInput.add(right);
  if (keys['KeyA']) moveInput.sub(right);
  if (moveInput.lengthSq() > 0) moveInput.normalize();

  // Sprinting & Sliding logic
  const wantsSprint = keys['ShiftLeft'] || keys['ShiftRight'];
  // Once stamina runs out, sprint stays off until it recovers to 25%, instead of toggling every frame
  if (p.stamina <= 0) p.sprintExhausted = true;
  else if (p.sprintExhausted && p.stamina >= p.maxStamina * 0.25) p.sprintExhausted = false;
  p.isSprinting = wantsSprint && moveInput.lengthSq() > 0 && !p.isSliding && !p.isAds && !p.sprintExhausted;

  let moveSpeed = 12.5 * p.moveSpeedMult;
  let stateLabel = 'WALKING';

  if (p.isSliding) {
    p.slideTimer -= dt;
    moveSpeed = 24.5 * p.moveSpeedMult;
    p.vel.x = p.slideDir.x * moveSpeed;
    p.vel.z = p.slideDir.z * moveSpeed;
    stateLabel = '⚡ SLIDING';
    if (p.slideTimer <= 0) p.isSliding = false;
  } else {
    if (p.isSprinting) {
      moveSpeed *= 1.52;
      p.stamina = Math.max(0, p.stamina - 22 * dt);
      stateLabel = '🏃 SPRINTING';
    } else {
      p.stamina = Math.min(p.maxStamina, p.stamina + 26 * dt);
      if (p.isAds) {
        moveSpeed *= 0.65;
        stateLabel = '🎯 AIMING (ADS)';
      }
    }
    p.vel.x = moveInput.x * moveSpeed;
    p.vel.z = moveInput.z * moveSpeed;
  }

  if (!p.onGround) {
    stateLabel = '🚀 AIRBORNE';
  }
  document.getElementById('move-state').textContent = stateLabel;
  document.getElementById('speed-lines').style.opacity = (p.isSliding || p.isSprinting) ? '1' : '0';

  // Jump
  if (keys['Space'] && p.onGround) {
    p.vel.y = 13.5;
    p.onGround = false;
    p.isSliding = false;
  }

  // Gravity
  p.vel.y -= 30.0 * dt;

  // Apply Horizontal Movement
  p.pos.x += p.vel.x * dt;
  p.pos.z += p.vel.z * dt;
  resolveHorizontalCollisions(p.pos, p.radius, p.pos.y);

  // Apply Vertical Movement
  p.pos.y += p.vel.y * dt;
  const targetEyeH = p.isSliding ? 1.15 : p.eyeHeight;
  p.currentEyeHeight += (targetEyeH - p.currentEyeHeight) * Math.min(1, dt * 14);

  const feetY = p.pos.y - p.currentEyeHeight;
  const groundH = getGroundHeightAt(p.pos.x, p.pos.z, feetY);

  if (feetY <= groundH) {
    p.pos.y = groundH + p.currentEyeHeight;
    p.vel.y = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }

  // Jump Pads check
  for (const pad of jumpPads) {
    pad.ring.rotation.z += dt * 2.5;
    const dist = Math.hypot(p.pos.x - pad.x, p.pos.z - pad.z);
    // vel.y <= 0: don't relaunch (and replay the sound) on the frames right after a launch
    if (dist < pad.radius && p.pos.y - p.currentEyeHeight < 1.2 && p.vel.y <= 0) {
      p.vel.y = 23.5;
      p.onGround = false;
      sfx.playJumpPad();
    }
  }

  // Health Pickups check
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    pk.bobPhase += dt * 3.5;
    pk.mesh.position.y = 1.0 + Math.sin(pk.bobPhase) * 0.25;
    pk.mesh.rotation.y += dt * 2.2;

    if (Math.hypot(p.pos.x - pk.x, p.pos.z - pk.z) < 2.0) {
      if (p.hp < p.maxHp) {
        healPlayer(35);
        sfx.playBuy();
        removeAndDispose(pk.mesh);
        pickups.splice(i, 1);
      }
    }
  }

  // Smooth Camera FOV & Recoil Recovery
  p.recoilOffset = Math.max(0, p.recoilOffset - dt * 0.28);
  const w = getCurrentWeapon();
  const targetFov = p.isAds ? w.adsFov : (p.isSliding ? 88 : (p.isSprinting ? 82 : 75));
  camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 14);
  camera.updateProjectionMatrix();

  // Screen Shake decay
  let shakeX = 0, shakeY = 0;
  if (game.shakeIntensity > 0) {
    shakeX = (Math.random() - 0.5) * game.shakeIntensity;
    shakeY = (Math.random() - 0.5) * game.shakeIntensity;
    game.shakeIntensity = Math.max(0, game.shakeIntensity - dt * 1.4);
  }

  // Update Camera Transform
  camera.position.set(p.pos.x + shakeX, p.pos.y + shakeY, p.pos.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = p.yaw;
  camera.rotation.x = p.pitch + p.recoilOffset;

  // Viewmodel Bobbing & ADS positioning
  const targetWx = p.isAds ? 0 : 0.28;
  const targetWy = p.isAds ? -0.155 : -0.24;
  const bob = (moveInput.lengthSq() > 0 && p.onGround && !p.isSliding)
    ? Math.sin(performance.now() * (p.isSprinting ? 0.015 : 0.01)) * 0.015
    : 0;

  weaponGroup.position.x += (targetWx - weaponGroup.position.x) * Math.min(1, dt * 14);
  weaponGroup.position.y += (targetWy + bob - weaponGroup.position.y) * Math.min(1, dt * 14);
  weaponGroup.position.z += (-0.45 - weaponGroup.position.z) * Math.min(1, dt * 14);

  // Update Stamina Bar
  const stamPct = Math.round((p.stamina / p.maxStamina) * 100);
  document.getElementById('stamina-bar').style.width = `${stamPct}%`;
  document.getElementById('stamina-text').textContent = `${stamPct}%`;
}

// ==================== ENEMY OBSTACLE AVOIDANCE ====================
// Obstacles are axis-aligned boxes, so instead of full pathfinding an enemy whose straight line
// to the player is blocked walks to the cheapest reachable corner of that box, then the next one.

// 2D segment (a -> b) vs box test. Returns the entry parameter t in [0, 1], or -1 when it misses.
function segmentHitsBox(ax, az, bx, bz, minX, maxX, minZ, maxZ) {
  let tMin = 0, tMax = 1;
  const axes = [[ax, bx - ax, minX, maxX], [az, bz - az, minZ, maxZ]];
  for (const [start, delta, lo, hi] of axes) {
    if (Math.abs(delta) < 1e-6) {
      if (start < lo || start > hi) return -1;
    } else {
      let t1 = (lo - start) / delta;
      let t2 = (hi - start) / delta;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return -1;
    }
  }
  return tMin;
}

// 3D version for line of sight: obstacles span from the floor (y = 0) up to maxY
function segmentHitsBox3D(a, b, ob) {
  let tMin = 0, tMax = 1;
  const axes = [[a.x, b.x - a.x, ob.minX, ob.maxX], [a.y, b.y - a.y, 0, ob.maxY], [a.z, b.z - a.z, ob.minZ, ob.maxZ]];
  for (const [start, delta, lo, hi] of axes) {
    if (Math.abs(delta) < 1e-6) {
      if (start < lo || start > hi) return false;
    } else {
      let t1 = (lo - start) / delta;
      let t2 = (hi - start) / delta;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

function hasLineOfSight(a, b) {
  return !obstacles.some(ob => segmentHitsBox3D(a, b, ob));
}

const AVOID_CLEARANCE = 0.1;      // extra gap when testing if the straight line is blocked
const AVOID_CORNER_OFFSET = 0.7;  // how far outside the box corner waypoints sit
const AVOID_REACHED_DIST = 0.6;

function getAvoidCorners(ob, radius) {
  const m = radius + AVOID_CORNER_OFFSET;
  return [
    [ob.minX - m, ob.minZ - m],
    [ob.maxX + m, ob.minZ - m],
    [ob.maxX + m, ob.maxZ + m],
    [ob.minX - m, ob.maxZ + m]
  ];
}

function pickAvoidCorner(ob, corners, x, z, tx, tz, excludeIdx) {
  let best = -1, bestCost = Infinity;
  corners.forEach(([cx, cz], idx) => {
    if (idx === excludeIdx) return;
    // Corners on the far side would mean walking through the box itself
    if (segmentHitsBox(x, z, cx, cz, ob.minX, ob.maxX, ob.minZ, ob.maxZ) >= 0) return;
    const cost = Math.hypot(cx - x, cz - z) + Math.hypot(tx - cx, tz - cz);
    if (cost < bestCost) {
      bestCost = cost;
      best = idx;
    }
  });
  return best;
}

function getEnemyMoveDir(e, tx, tz, dirX, dirZ) {
  const pos = e.group.position;
  const ex = e.radius + AVOID_CLEARANCE;

  // Nearest obstacle crossing the straight line to the player
  let blocker = null, blockerT = Infinity;
  for (const ob of obstacles) {
    // Player standing on top of this obstacle: nothing to route around
    if (tx > ob.minX - ex && tx < ob.maxX + ex && tz > ob.minZ - ex && tz < ob.maxZ + ex) continue;
    const t = segmentHitsBox(pos.x, pos.z, tx, tz, ob.minX - ex, ob.maxX + ex, ob.minZ - ex, ob.maxZ + ex);
    if (t >= 0 && t < blockerT) {
      blockerT = t;
      blocker = ob;
    }
  }

  if (!blocker) {
    e.avoidOb = null;
    return [dirX, dirZ];
  }

  const corners = getAvoidCorners(blocker, e.radius);
  // Keep the chosen corner while the same obstacle blocks, so enemies don't jitter between sides
  if (e.avoidOb !== blocker) {
    e.avoidOb = blocker;
    e.avoidCorner = pickAvoidCorner(blocker, corners, pos.x, pos.z, tx, tz, -1);
  } else if (e.avoidCorner >= 0) {
    const [cx, cz] = corners[e.avoidCorner];
    if (Math.hypot(cx - pos.x, cz - pos.z) < AVOID_REACHED_DIST) {
      // Reached this corner but still blocked: continue to the next corner around the box
      e.avoidCorner = pickAvoidCorner(blocker, corners, pos.x, pos.z, tx, tz, e.avoidCorner);
    } else if (segmentHitsBox(pos.x, pos.z, cx, cz, blocker.minX, blocker.maxX, blocker.minZ, blocker.maxZ) >= 0) {
      // Knocked to the other side (e.g. by an explosion): the corner is now behind the box
      e.avoidCorner = pickAvoidCorner(blocker, corners, pos.x, pos.z, tx, tz, -1);
    }
  } else {
    e.avoidCorner = pickAvoidCorner(blocker, corners, pos.x, pos.z, tx, tz, -1);
  }

  if (e.avoidCorner < 0) return [dirX, dirZ];
  const [cx, cz] = corners[e.avoidCorner];
  const len = Math.hypot(cx - pos.x, cz - pos.z) || 1;
  return [(cx - pos.x) / len, (cz - pos.z) / len];
}

function updateEnemiesAndProjectiles(dt) {
  const p = game.player;

  // Wave Spawner
  if (!game.intermission && game.enemiesRemainingToSpawn > 0) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0 && enemies.length < 18) {
      // Spread contracted elites across the wave; probability reaches 1 so all of them always appear
      const c = game.contract;
      const spawnElite = c.active && c.elitesToSpawn > 0 &&
        Math.random() < c.elitesToSpawn / game.enemiesRemainingToSpawn;
      if (spawnElite) c.elitesToSpawn--;
      spawnEnemy(null, spawnElite);
      game.enemiesRemainingToSpawn--;
      game.spawnTimer = Math.max(0.45, 1.6 - game.wave * 0.08);
      updateTopHUD();
    }
  } else if (game.intermission) {
    game.intermissionTimer -= dt;
    document.getElementById('intermission-timer').textContent = `NEXT WAVE IN: ${Math.max(0, game.intermissionTimer).toFixed(1)}s`;
    if (game.intermissionTimer <= 0) {
      if (game.inShop) closeShop();
      startWave(game.wave + 1);
    }
  }

  // Update Enemies
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const pos = e.group.position;
    const dx = p.pos.x - pos.x;
    const dz = p.pos.z - pos.z;
    const dist = Math.hypot(dx, dz);

    // Face player
    e.group.rotation.y = Math.atan2(dx, dz);
    e.hpBg.lookAt(camera.position);

    e.strafeTimer -= dt;
    if (e.strafeTimer <= 0) {
      e.strafeDir *= -1;
      e.strafeTimer = 1.2 + Math.random() * 1.5;
    }

    const dirX = dx / (dist || 1);
    const dirZ = dz / (dist || 1);

    // Ranged enemies only shoot with a clear line; without one they move in to find an angle
    const muzzlePos = new THREE.Vector3(pos.x, e.isBoss ? 2.8 : 1.6, pos.z);
    const aimPos = new THREE.Vector3(p.pos.x, p.pos.y - 0.4, p.pos.z);
    const hasLos = !e.ranged || hasLineOfSight(muzzlePos, aimPos);

    // Move toward player (ranged enemies keep moderate distance and strafe)
    if (!e.ranged || dist > 18 || !hasLos) {
      // Head for a corner of the blocking obstacle instead of pushing straight into it
      const [moveX, moveZ] = getEnemyMoveDir(e, p.pos.x, p.pos.z, dirX, dirZ);
      pos.x += moveX * e.speed * dt;
      pos.z += moveZ * e.speed * dt;
    } else if (e.ranged && dist < 11) {
      pos.x -= dirX * e.speed * 0.6 * dt;
      pos.z -= dirZ * e.speed * dt * 0.6;
    } else {
      // Strafe sideways
      pos.x += -dirZ * e.strafeDir * e.speed * 0.7 * dt;
      pos.z += dirX * e.strafeDir * e.speed * 0.7 * dt;
    }

    // Animate: walkers hop with a squash & stretch, the drone bobs in the air
    e.walkPhase += dt * e.speed * 1.15;
    e.shellMat.emissiveIntensity = e.baseGlow * (0.8 + 0.25 * Math.sin(e.walkPhase * 0.6));
    if (e.hovers) {
      pos.y = Math.sin(e.walkPhase * 0.7) * 0.18;
    } else {
      const hop = Math.abs(Math.sin(e.walkPhase * 0.5));
      const squash = 1 - hop; // 1 right at landing
      e.bodyGroup.position.y = hop * 0.22;
      e.bodyGroup.scale.set(1 + squash * 0.07, 1 - squash * 0.1, 1 + squash * 0.07);
    }

    // Separate overlapping enemies so they don't stack into one mesh
    for (let j = i + 1; j < enemies.length; j++) {
      const other = enemies[j];
      const ox = pos.x - other.group.position.x;
      const oz = pos.z - other.group.position.z;
      const minSep = e.radius + other.radius;
      const dSq = ox * ox + oz * oz;
      if (dSq < minSep * minSep && dSq > 0.0001) {
        const dSep = Math.sqrt(dSq);
        const push = (minSep - dSep) * 0.5;
        pos.x += (ox / dSep) * push;
        pos.z += (oz / dSep) * push;
        other.group.position.x -= (ox / dSep) * push;
        other.group.position.z -= (oz / dSep) * push;
      }
    }

    resolveHorizontalCollisions(pos, e.radius, 2.0);

    // Enemy Attacks
    e.attackCooldown -= dt;
    if (dist < 2.5 + (e.isBoss ? 1.2 : 0) && e.attackCooldown <= 0) {
      takePlayerDamage(e.damage);
      e.attackCooldown = 1.1;
    } else if (e.ranged && dist < 44 && hasLos && e.attackCooldown <= 0) {
      e.attackCooldown = e.isBoss ? 1.55 : (2.1 + Math.random() * 0.8);
      const targetPos = aimPos.clone();
      spawnEnemyProjectile(muzzlePos, targetPos, e.damage, e.color);
      // Boss fires 3-way plasma spread
      if (e.isBoss) {
        const leftTarget = targetPos.clone().add(new THREE.Vector3(-3.0, 0, -3.0));
        const rightTarget = targetPos.clone().add(new THREE.Vector3(3.0, 0, 3.0));
        spawnEnemyProjectile(muzzlePos.clone(), leftTarget, e.damage * 0.75, 0xffdd00);
        spawnEnemyProjectile(muzzlePos.clone(), rightTarget, e.damage * 0.75, 0xffdd00);
      }
    }
  }

  // Update Thrown Plasma Grenades
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    g.vel.y -= 28.0 * dt;
    const prevPos = g.mesh.position.clone();
    g.mesh.position.addScaledVector(g.vel, dt);
    bounceGrenadeOffWalls(g, prevPos);
    if (g.mesh.position.y < 0.25) {
      g.mesh.position.y = 0.25;
      g.vel.y = Math.abs(g.vel.y) * 0.45;
      g.vel.x *= 0.7;
      g.vel.z *= 0.7;
    }
    g.timer -= dt;
    // Detonate early if hitting an enemy directly or when timer expires
    let hitEnemy = false;
    for (const e of enemies) {
      if (Math.hypot(e.group.position.x - g.mesh.position.x, e.group.position.z - g.mesh.position.z) < e.radius + 0.6 && g.mesh.position.y < 2.8) {
        hitEnemy = true;
        break;
      }
    }
    if (hitEnemy || g.timer <= 0) {
      const blastPos = g.mesh.position.clone();
      removeAndDispose(g.mesh);
      grenades.splice(i, 1);
      triggerExplosion(blastPos, 11.0, 190, 0xffaa00);
    }
  }

  // Update Expanding 3D Shockwave Rings
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.life -= dt;
    const progress = 1 - Math.max(0, sw.life / sw.maxLife);
    const currentScale = 1 + progress * sw.maxRadius;
    sw.mesh.scale.set(currentScale, currentScale, 1);
    sw.mat.opacity = (1 - progress) * 0.85;
    if (sw.life <= 0) {
      removeAndDispose(sw.mesh);
      shockwaves.splice(i, 1);
    }
  }

  // Update Enemy Plasma Projectiles
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const proj = enemyProjectiles[i];
    proj.mesh.position.addScaledVector(proj.vel, dt);
    proj.life -= dt;

    // Check hit on player
    if (proj.mesh.position.distanceTo(p.pos) < 1.15) {
      takePlayerDamage(proj.damage);
      removeAndDispose(proj.mesh);
      enemyProjectiles.splice(i, 1);
      continue;
    }

    // Check hit on obstacles or expire
    let hitWall = false;
    for (const ob of obstacles) {
      const mp = proj.mesh.position;
      if (mp.x >= ob.minX && mp.x <= ob.maxX && mp.z >= ob.minZ && mp.z <= ob.maxZ && mp.y <= ob.maxY) {
        hitWall = true;
        break;
      }
    }

    if (hitWall || proj.life <= 0) {
      removeAndDispose(proj.mesh);
      enemyProjectiles.splice(i, 1);
    }
  }

  // Update Bullet Tracers
  for (let i = tracers.length - 1; i >= 0; i--) {
    const t = tracers[i];
    t.life -= dt;
    t.mat.opacity = Math.max(0, t.life / t.maxLife);
    if (t.life <= 0) {
      removeAndDispose(t.line);
      tracers.splice(i, 1);
    }
  }

  // Update Hit Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.vel.y -= 24 * dt;
    pt.mesh.position.addScaledVector(pt.vel, dt);
    pt.mesh.rotation.x += dt * 6;
    pt.mesh.rotation.y += dt * 6;
    pt.life -= dt;
    if (pt.life <= 0) {
      scene.remove(pt.mesh);
      particles.splice(i, 1);
    }
  }
}

const GRENADE_RADIUS = 0.24;

function bounceGrenadeOffWalls(g, prevPos) {
  const pos = g.mesh.position;
  const r = GRENADE_RADIUS;

  // Arena perimeter walls
  const limit = ARENA_HALF - 1.0 - r;
  if (Math.abs(pos.x) > limit) {
    pos.x = Math.sign(pos.x) * limit;
    g.vel.x *= -0.5;
  }
  if (Math.abs(pos.z) > limit) {
    pos.z = Math.sign(pos.z) * limit;
    g.vel.z *= -0.5;
  }

  // Interior obstacles (axis-aligned boxes standing on the floor)
  for (const ob of obstacles) {
    const inside = pos.x > ob.minX - r && pos.x < ob.maxX + r &&
      pos.z > ob.minZ - r && pos.z < ob.maxZ + r &&
      pos.y < ob.maxY + r;
    if (!inside) continue;

    if (prevPos.y >= ob.maxY + r) {
      // Came from above: bounce on the top face
      pos.y = ob.maxY + r;
      g.vel.y = Math.abs(g.vel.y) * 0.45;
      g.vel.x *= 0.7;
      g.vel.z *= 0.7;
    } else {
      // Side hit: step back and reflect the axis that crossed the face
      const wasOutsideX = prevPos.x <= ob.minX - r || prevPos.x >= ob.maxX + r;
      const wasOutsideZ = prevPos.z <= ob.minZ - r || prevPos.z >= ob.maxZ + r;
      pos.x = prevPos.x;
      pos.z = prevPos.z;
      if (wasOutsideX) g.vel.x *= -0.5;
      if (wasOutsideZ) g.vel.z *= -0.5;
      if (!wasOutsideX && !wasOutsideZ) {
        g.vel.x *= -0.5;
        g.vel.z *= -0.5;
      }
    }
  }
}

function spawnEnemyProjectile(start, target, damage, color) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  mesh.position.copy(start);
  const dir = target.sub(start).normalize();
  const speed = 26;
  scene.add(mesh);
  enemyProjectiles.push({
    mesh,
    vel: dir.multiplyScalar(speed),
    damage,
    life: 3.5
  });
}

// ==================== MINIMAP / RADAR RENDERING ====================
const radarCanvas = document.getElementById('minimap');
const radarCtx = radarCanvas.getContext('2d');

function drawMinimap() {
  const w = radarCanvas.width;
  const h = radarCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = 1.35; // world units to radar pixels

  radarCtx.clearRect(0, 0, w, h);

  // Radar Rings
  radarCtx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  radarCtx.lineWidth = 1;
  [26, 52, 76].forEach(r => {
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, r, 0, Math.PI * 2);
    radarCtx.stroke();
  });

  // Crosshair lines
  radarCtx.beginPath();
  radarCtx.moveTo(cx, 0); radarCtx.lineTo(cx, h);
  radarCtx.moveTo(0, cy); radarCtx.lineTo(w, cy);
  radarCtx.stroke();

  const p = game.player;
  const cosYaw = Math.cos(p.yaw);
  const sinYaw = Math.sin(p.yaw);

  function worldToRadar(wx, wz) {
    const dx = wx - p.pos.x;
    const dz = wz - p.pos.z;
    // Rotate relative to player yaw so forward is always UP on radar
    const rx = dx * cosYaw - dz * sinYaw;
    const rz = dx * sinYaw + dz * cosYaw;
    return [cx + rx * scale, cy + rz * scale];
  }

  // Draw Pickups (Green dots)
  radarCtx.fillStyle = '#00ff88';
  for (const pk of pickups) {
    const [rx, rz] = worldToRadar(pk.x, pk.z);
    if (Math.hypot(rx - cx, rz - cy) < cx - 4) {
      radarCtx.beginPath();
      radarCtx.arc(rx, rz, 3, 0, Math.PI * 2);
      radarCtx.fill();
    }
  }

  // Draw Enemies (Red / Orange / Boss Magenta dots)
  for (const e of enemies) {
    const [rx, rz] = worldToRadar(e.group.position.x, e.group.position.z);
    const dist = Math.hypot(rx - cx, rz - cy);
    const clampedX = dist > cx - 6 ? cx + ((rx - cx) / dist) * (cx - 6) : rx;
    const clampedY = dist > cy - 6 ? cy + ((rz - cy) / dist) * (cy - 6) : rz;

    radarCtx.fillStyle = e.isBoss ? '#ffdd00' : (e.isElite ? '#ffc400' : (e.typeKey === 'tank' ? '#ff9900' : '#ff0055'));
    radarCtx.beginPath();
    radarCtx.arc(clampedX, clampedY, e.isBoss ? 6.5 : (e.typeKey === 'tank' ? 5 : 3.5), 0, Math.PI * 2);
    radarCtx.fill();
  }

  // Draw Player Center Arrow
  radarCtx.fillStyle = '#00f0ff';
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy - 6);
  radarCtx.lineTo(cx - 5, cy + 5);
  radarCtx.lineTo(cx + 5, cy + 5);
  radarCtx.closePath();
  radarCtx.fill();
}

// ==================== HUD & SHOP UI ====================
function updateTopHUD() {
  document.getElementById('wave-num').textContent = game.wave;
  document.getElementById('enemies-left').textContent = enemies.length + game.enemiesRemainingToSpawn;
  document.getElementById('score-val').textContent = game.score.toLocaleString();
  document.getElementById('best-score-val').textContent = game.bestScore.toLocaleString();
  document.getElementById('credits-val').textContent = `¥${game.credits.toLocaleString()}`;
}

function updateHealthHUD() {
  const p = game.player;
  const hpPct = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
  const bar = document.getElementById('hp-bar');
  bar.style.width = `${hpPct}%`;
  bar.classList.toggle('low', hpPct <= 30);
  document.getElementById('hp-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
}

function updateStatusTags() {
  const p = game.player;
  const c = game.contract;
  const revive = document.getElementById('revive-tag');
  revive.classList.toggle('hidden', p.reviveTokens <= 0 && p.invulnTimer <= 0);
  revive.textContent = p.invulnTimer > 0 ? '💠 INVULNERABLE' : `💠 REVIVE x${p.reviveTokens}`;

  const contract = document.getElementById('contract-tag');
  contract.classList.toggle('hidden', !c.pending && !c.active);
  contract.textContent = c.active ? '⚠️ CONTRACT ACTIVE' : '⚠️ CONTRACT: NEXT WAVE';
}

function updateWeaponHUD() {
  const w = getCurrentWeapon();
  if (!w) return;
  document.getElementById('weapon-name').textContent = w.name;
  document.getElementById('ammo-current').textContent = w.ammo;
  document.getElementById('ammo-max').textContent = w.maxAmmo;
}

function getUpgradeCost(key) {
  const u = game.upgrades[key];
  if (key === 'contract') return getContractDeposit();
  if (u.costMult) return Math.round(u.baseCost * Math.pow(u.costMult, u.level));
  return u.baseCost + u.level * u.costStep;
}

function getShopItemState(key) {
  const u = game.upgrades[key];
  const p = game.player;
  const cost = getUpgradeCost(key);
  const isMax = u.level >= u.max;
  let blocked = false;
  let label = isMax ? 'MAX' : `¥${cost.toLocaleString()}`;
  let desc = u.desc;
  let levelText = u.max < 100 ? `LEVEL: ${u.level} / ${u.max}` : (u.showLevel ? `LEVEL: ${u.level}` : '');
  let extraClass = '';

  if (key === 'heal') {
    blocked = p.hp >= p.maxHp;
  } else if (key === 'revive') {
    blocked = p.reviveTokens >= 1;
    if (blocked) label = '所持中';
    levelText = `所持: ${p.reviveTokens} / 1`;
  } else if (key === 'contract') {
    extraClass = ' risk';
    const nextWave = game.wave + 1;
    const payout = Math.round(cost * CONTRACT_PAYOUT_MULT);
    desc = `次のウェーブ（WAVE ${nextWave}）にエリート敵が${getContractEliteCount(nextWave)}体出現（HP${ELITE.hpMult}倍・攻撃${ELITE.damageMult}倍）。` +
      `ウェーブをクリアすると保証金の${CONTRACT_PAYOUT_MULT}倍（¥${payout.toLocaleString()}）を獲得、エリート撃破報酬は${ELITE.rewardMult}倍。死亡すると保証金は戻りません`;
    blocked = game.contract.pending || game.contract.active;
    if (game.contract.pending) label = '契約済み';
    else if (game.contract.active) label = '契約遂行中';
    levelText = '';
  }

  const canBuy = !isMax && !blocked && game.credits >= cost;
  return { u, cost, canBuy, label, desc, levelText, extraClass };
}

function renderShop() {
  document.getElementById('shop-credits').textContent = `¥${game.credits.toLocaleString()}`;
  const container = document.getElementById('shop-items');
  container.innerHTML = '';

  Object.keys(game.upgrades).forEach(key => {
    const { u, canBuy, label, desc, levelText, extraClass } = getShopItemState(key);

    const div = document.createElement('div');
    div.className = 'shop-item' + extraClass;
    div.innerHTML = `
      <div class="shop-item-info">
        <h4>${u.name}</h4>
        <p>${desc}</p>
        ${levelText ? `<span class="shop-item-lvl">${levelText}</span>` : ''}
      </div>
      <button class="buy-btn" ${canBuy ? '' : 'disabled'} data-upgrade="${key}">
        ${label}
      </button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      buyUpgrade(btn.dataset.upgrade);
    });
  });
}

function recomputeDamageMult() {
  const up = game.upgrades;
  game.player.dmgMult = (1 + up.dmg.level * 0.15) * (1 + up.overclock.level * 0.04);
}

function buyUpgrade(key) {
  const u = game.upgrades[key];
  const { cost, canBuy } = getShopItemState(key);
  if (!canBuy) return;

  game.credits -= cost;
  u.level++;
  sfx.playBuy();

  const p = game.player;
  if (key === 'dmg' || key === 'overclock') {
    recomputeDamageMult();
  } else if (key === 'revive') {
    p.reviveTokens++;
  } else if (key === 'contract') {
    game.contract.pending = true;
    game.contract.deposit = cost;
  } else if (key === 'firerate') {
    p.fireRateMult = 1 + u.level * 0.12;
    p.reloadSpeedMult = 1 + u.level * 0.12;
  } else if (key === 'maxhp') {
    p.maxHp += 30;
    healPlayer(50);
  } else if (key === 'speed') {
    p.moveSpeedMult = 1 + u.level * 0.08;
  } else if (key === 'regen') {
    p.hpRegenLevel = u.level;
  } else if (key === 'heal') {
    healPlayer(p.maxHp);
  }

  updateTopHUD();
  updateHealthHUD();
  updateStatusTags();
  renderShop();
}

function toggleShop() {
  if (game.inShop) {
    closeShop();
  } else {
    openShop();
  }
}

function openShop() {
  game.inShop = true;
  setAds(false);
  sfx.setBgmIntensity(false);
  document.exitPointerLock();
  renderShop();
  document.getElementById('shop-overlay').classList.remove('hidden');
}

function closeShop() {
  game.inShop = false;
  sfx.setBgmIntensity(!game.intermission);
  document.getElementById('shop-overlay').classList.add('hidden');
  requestLock();
}

// ==================== GAME INITIALIZATION & MENUS ====================
function clearArenaObjects() {
  enemies.forEach(e => removeAndDispose(e.group));
  enemies.length = 0;
  enemyProjectiles.forEach(pr => removeAndDispose(pr.mesh));
  enemyProjectiles.length = 0;
  pickups.forEach(pk => removeAndDispose(pk.mesh));
  pickups.length = 0;
  grenades.forEach(g => removeAndDispose(g.mesh));
  grenades.length = 0;
  shockwaves.forEach(sw => removeAndDispose(sw.mesh));
  shockwaves.length = 0;
  tracers.forEach(t => removeAndDispose(t.line));
  tracers.length = 0;
  particles.forEach(pt => scene.remove(pt.mesh)); // shared geometry/materials: no dispose
  particles.length = 0;
}

// Leave the current run from the pause menu; the score still counts for the high-score list
function quitToTitle() {
  recordCurrentRun();
  sfx.stopBGM();
  clearArenaObjects();

  game.running = false;
  game.paused = false;
  game.inShop = false;
  game.intermission = false;
  game.enemiesRemainingToSpawn = 0;
  updateBossHUD();

  document.getElementById('hud').classList.add('hidden');
  document.getElementById('shop-prompt').classList.add('hidden');
  document.getElementById('quit-btn').classList.add('hidden');
  document.getElementById('start-btn').textContent = 'MISSION START (クリックで出撃)';
  document.getElementById('menu-overlay').classList.remove('hidden');
  renderRecords(document.getElementById('menu-records'), -1);
}

function resetAndStartGame() {
  sfx.init();
  sfx.startBGM();
  sfx.setBgmIntensity(true);

  clearArenaObjects();
  document.getElementById('quit-btn').classList.add('hidden');

  // Reset stats
  game.wave = 1;
  game.score = 0;
  game.credits = 100;
  game.totalKills = 0;
  game.headshotKills = 0;
  game.comboCount = 0;
  game.comboTimer = 0;
  game.shakeIntensity = 0;
  game.gameOver = false;
  game.runStartBest = game.bestScore;
  game.inShop = false;
  game.paused = false;
  game.running = true;

  Object.values(game.upgrades).forEach(u => { u.level = 0; });

  const p = game.player;
  p.pos.set(0, 2.2, 22);
  p.vel.set(0, 0, 0);
  p.yaw = 0;
  p.pitch = 0;
  p.maxHp = 100;
  p.hp = 100;
  p.stamina = 100;
  p.grenadeCooldown = 0;
  p.dmgMult = 1.0;
  p.fireRateMult = 1.0;
  p.reloadSpeedMult = 1.0;
  p.moveSpeedMult = 1.0;
  p.magCapMult = 1.0;
  p.hpRegenLevel = 0;
  p.reviveTokens = 0;
  p.invulnTimer = 0;
  p.reviveBlastPending = false;
  p.isReloading = false;
  p.reloadTimer = 0;
  p.fireCooldown = 0;
  p.recoilOffset = 0;
  p.isSliding = false;
  p.slideTimer = 0;
  p.isSprinting = false;
  p.sprintExhausted = false;
  p.onGround = false;
  p.currentEyeHeight = p.eyeHeight;
  mouseDownLeft = false;
  mouseDownRight = false;
  setAds(false);
  camera.fov = 75;
  camera.updateProjectionMatrix();
  weaponGroup.position.set(0.28, -0.24, -0.45);
  document.getElementById('reload-bar-wrap').classList.add('hidden');
  document.getElementById('reload-bar').style.width = '0%';

  Object.assign(game.contract, { pending: false, active: false, deposit: 0, elitesToSpawn: 0 });
  updateStatusTags();

  initWeapons();
  switchWeapon(0);
  updateHealthHUD();
  updateWeaponHUD();
  updateBossHUD();

  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('menu-overlay').classList.add('hidden');
  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('shop-overlay').classList.add('hidden');

  startWave(1);
  requestLock();
}

document.getElementById('start-btn').addEventListener('click', () => {
  if (!game.running) {
    resetAndStartGame();
  } else {
    requestLock();
  }
});

document.getElementById('quit-btn').addEventListener('click', () => {
  quitToTitle();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  resetAndStartGame();
});

document.getElementById('resume-from-shop-btn').addEventListener('click', () => {
  closeShop();
});

document.getElementById('next-wave-shop-btn').addEventListener('click', () => {
  closeShop();
  if (game.intermission) {
    startWave(game.wave + 1);
  }
});

const sensSlider = document.getElementById('sens-slider');
const bgmSlider = document.getElementById('bgm-slider');

function applySensitivity(val) {
  game.sensitivity = val;
  sensSlider.value = String(val);
  document.getElementById('sens-val').textContent = val.toFixed(1);
}

function applyBgmVolume(percent) {
  bgmSlider.value = String(percent);
  document.getElementById('bgm-val').textContent = `${percent}%`;
  sfx.setBgmVolume(percent / 100);
}

function saveSettings() {
  storageSet(STORAGE_KEYS.settings, JSON.stringify({
    sensitivity: game.sensitivity,
    bgmVolume: parseInt(bgmSlider.value, 10),
    bgmMuted: sfx.bgmMuted
  }));
}

function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(storageGet(STORAGE_KEYS.settings) || '{}') || {};
  } catch (err) {
    saved = {};
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  if (Number.isFinite(saved.sensitivity)) applySensitivity(clamp(saved.sensitivity, 0.2, 2.5));
  if (Number.isFinite(saved.bgmVolume)) applyBgmVolume(clamp(Math.round(saved.bgmVolume), 0, 100));
  if (typeof saved.bgmMuted === 'boolean') sfx.bgmMuted = saved.bgmMuted;
}

sensSlider.addEventListener('input', (e) => {
  applySensitivity(parseFloat(e.target.value));
  saveSettings();
});

bgmSlider.addEventListener('input', (e) => {
  applyBgmVolume(parseInt(e.target.value, 10));
  saveSettings();
});

loadSettings();

renderRecords(document.getElementById('menu-records'), -1);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== MAIN ANIMATION LOOP ====================
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (game.running && !game.paused && !game.inShop && !game.gameOver) {
    updatePlayer(dt);
    updateEnemiesAndProjectiles(dt);
    drawMinimap();
    // Circuit traces on enemy skins flow upward
    ENEMY_CIRCUIT_TEX.offset.y = (ENEMY_CIRCUIT_TEX.offset.y - dt * 0.25) % 1;
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
