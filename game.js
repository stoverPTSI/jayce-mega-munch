// ============================================================================
// JAYCE'S SNACK STORE MEGA MUNCH! (Hole.io / Katamari Style 2.5D Web Game)
// Built specifically for Jayce & Grandpa!
// Features Roaming Rival Dinosaurs that eat snacks, grow, and can eat Jayce
// (or be eaten by Jayce when he grows bigger than them!)
// ============================================================================

(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const hud = document.getElementById('hud');
  const edibleGuide = document.getElementById('edible-guide');
  const edibleIconsEl = document.getElementById('edible-icons');
  const grandpaBanner = document.getElementById('grandpa-banner');
  const grandpaText = document.getElementById('grandpa-text');
  const levelupToast = document.getElementById('levelup-toast');
  const levelupSubtitle = document.getElementById('levelup-subtitle');
  const respawnToast = document.getElementById('respawn-toast');
  const respawnTitle = document.getElementById('respawn-title');
  const respawnSubtitle = document.getElementById('respawn-subtitle');
  const startScreen = document.getElementById('start-screen');
  const endScreen = document.getElementById('end-screen');

  const sizeTierBadge = document.getElementById('size-tier-badge');
  const growthBarFill = document.getElementById('growth-bar-fill');
  const growthBarText = document.getElementById('growth-bar-text');
  const livesValue = document.getElementById('lives-value');
  const timerBox = document.getElementById('timer-box');
  const timerValue = document.getElementById('timer-value');
  const scoreValue = document.getElementById('score-value');
  const lbList = document.getElementById('lb-list');

  // Load Jayce's Pixar Cartoon Portrait image
  const jaycePortraitImg = new Image();
  jaycePortraitImg.src = 'assets/jayce_cartoon.png';

  // Sound Synthesizer (Web Audio API)
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    chomp(pitchScale = 1) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = Math.max(130, Math.min(520, 340 * pitchScale));
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.55, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.13);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    }
    roar() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(85, now + 0.25);
      osc.frequency.linearRampToValueAtTime(55, now + 0.55);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    }
    turbo() {
      if (!this.enabled || !this.ctx) return;
      const freqs = [330, 440, 587.33, 659.25, 880];
      freqs.forEach((f, idx) => {
        const now = this.ctx.currentTime + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, now + 0.09);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      });
    }
    levelUp() {
      if (!this.enabled || !this.ctx) return;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      });
    }
    victory() {
      if (!this.enabled || !this.ctx) return;
      const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      });
    }
  }

  const sfx = new SoundFX();

  // Item Catalog: Personalized with Jayce's favorites!
  const ITEM_TYPES = [
    // Tier 1: Jayce's Favorite Snacks (edible from start, radius >= 22)
    {
      id: 'cookie',
      name: 'Choc Chip Cookie',
      emoji: '🍪',
      tier: 1,
      minRadius: 22,
      objRadius: 14,
      points: 15,
      growth: 0.8,
      isFavorite: true
    },
    {
      id: 'pbcup',
      name: 'Peanut Butter Cup',
      emoji: '🥜',
      tier: 1,
      minRadius: 22,
      objRadius: 14,
      points: 15,
      growth: 0.8,
      isFavorite: true
    },
    {
      id: 'sausage',
      name: 'Breakfast Sausage',
      emoji: '🌭',
      tier: 1,
      minRadius: 22,
      objRadius: 15,
      points: 18,
      growth: 0.85,
      isFavorite: true
    },
    {
      id: 'greeneggs',
      name: 'Dr. Seuss Green Eggs',
      emoji: '🍳',
      tier: 1,
      minRadius: 22,
      objRadius: 16,
      points: 20,
      growth: 0.9,
      isFavorite: true
    },
    {
      id: 'turbotreat',
      name: 'Blue Lightning Turbo Treat',
      emoji: '⚡',
      tier: 1,
      minRadius: 22,
      objRadius: 18,
      points: 35,
      growth: 1.1,
      isFavorite: true,
      isTurbo: true
    },

    // Tier 2: Toys & Baby Dinosaurs (minRadius >= 36)
    {
      id: 'babydino',
      name: 'Baby Dinosaur Toy',
      emoji: '🦖',
      tier: 2,
      minRadius: 36,
      objRadius: 24,
      points: 40,
      growth: 1.4,
      isFavorite: true
    },
    {
      id: 'toycar',
      name: 'Blue Race Car',
      emoji: '🚙',
      tier: 2,
      minRadius: 36,
      objRadius: 23,
      points: 35,
      growth: 1.25,
      isFavorite: false
    },
    {
      id: 'cookiejar',
      name: 'Mega Treat Jar',
      emoji: '🫙',
      tier: 2,
      minRadius: 42,
      objRadius: 26,
      points: 50,
      growth: 1.55,
      isFavorite: true
    },

    // Tier 3: Park & Yard Stuff (minRadius >= 55)
    {
      id: 'picnic',
      name: 'Snack Picnic Table',
      emoji: '🧺',
      tier: 3,
      minRadius: 55,
      objRadius: 36,
      points: 90,
      growth: 2.35,
      isFavorite: true
    },
    {
      id: 'tree',
      name: 'Park Tree',
      emoji: '🌳',
      tier: 3,
      minRadius: 60,
      objRadius: 38,
      points: 85,
      growth: 2.2,
      isFavorite: false
    },

    // Tier 4: Big Dinosaurs & Trucks (minRadius >= 82)
    {
      id: 'giantdino',
      name: 'Park Dino Statue',
      emoji: '🦕',
      tier: 4,
      minRadius: 82,
      objRadius: 56,
      points: 200,
      growth: 4.1,
      isFavorite: true
    },
    {
      id: 'truck',
      name: 'Blue Cookie Truck',
      emoji: '🚚',
      tier: 4,
      minRadius: 88,
      objRadius: 58,
      points: 220,
      growth: 4.3,
      isFavorite: true
    },

    // Tier 5: Neighborhood Buildings (minRadius >= 118)
    {
      id: 'house',
      name: 'Town House & Bakery',
      emoji: '🏠',
      tier: 5,
      minRadius: 118,
      objRadius: 82,
      points: 450,
      growth: 7.5,
      isFavorite: false
    },

    // Tier 6: THE SNACK STORE BOSS! (minRadius >= 155)
    {
      id: 'snackstore',
      name: 'THE SNACK STORE',
      emoji: '🏪',
      tier: 6,
      minRadius: 155,
      objRadius: 115,
      points: 2500,
      growth: 20.0,
      isFavorite: true
    }
  ];

  const TIER_INFO = [
    { tier: 1, minR: 22, title: 'Level 1: Treat Taster', unlockMsg: 'Gobble Cookies, PB Cups, Sausages & Green Eggs!' },
    { tier: 2, minR: 36, title: 'Level 2: Toy & Dino Muncher', unlockMsg: 'Jayce can now eat Toy Cars, Jars & Smaller Rivals!' },
    { tier: 3, minR: 55, title: 'Level 3: Park Chomper', unlockMsg: 'Jayce can now eat Picnic Tables & Trees!' },
    { tier: 4, minR: 82, title: 'Level 4: Giant Truck Gobbler', unlockMsg: 'Jayce can now eat Cookie Trucks & Big Dinosaurs!' },
    { tier: 5, minR: 118, title: 'Level 5: Town Titan', unlockMsg: 'Jayce is HUGE! He can eat Houses & Bakeries!' },
    { tier: 6, minR: 155, title: 'Level 6: SNACK STORE BOSS!', unlockMsg: 'GO TO THE SNACK STORE! Jayce is big enough to eat it!' }
  ];

  const GRANDPA_QUOTES = [
    '"Watch out for bigger dinosaurs with RED rings, Jayce! Eat snacks to outgrow them!"',
    '"When a dinosaur has a GREEN ring, you\'re bigger—chase it and gobble it up!"',
    '"Let\'s walk to the Snack Store, Jayce! Look at all those chocolate chip cookies!"',
    '"Ooh, Peanut Butter Cups and Green Eggs! Just like Dr. Seuss, Jayce!"',
    '"Save some breakfast sausage links for our walk to the Snack Store!"',
    '"Way to go, buddy! Blue looks awesome on you!"'
  ];

  // Game State
  let selectedOutfit = 'champion';
  let selectedMode = 'snackwalk';
  let gameState = 'menu';

  const WORLD_SIZE = 3200;
  let camera = { x: 0, y: 0, zoom: 1 };

  let player = null;
  let rivals = [];
  let worldObjects = [];
  let particles = [];
  let floatingTexts = [];
  let snackStoreObj = null;
  let grandpaNPC = { x: 0, y: -1020, wavePhase: 0 };

  let timeLeft = 120;
  let lastFrameTime = performance.now();
  let grandpaTimer = 0;

  // Input state
  const keys = {};
  let pointerActive = false;
  let pointerScreen = { x: 0, y: 0 };
  let joystickOrigin = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Setup Outfit & Mode buttons
  document.querySelectorAll('#outfit-choices .choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#outfit-choices .choice-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedOutfit = btn.dataset.outfit;
    });
  });

  document.querySelectorAll('#mode-choices .choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-choices .choice-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
    });
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    sfx.init();
    startGame();
  });

  document.getElementById('btn-play-again').addEventListener('click', () => {
    sfx.init();
    startGame();
  });

  document.getElementById('btn-change-mode').addEventListener('click', () => {
    endScreen.classList.add('hidden');
    respawnToast.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameState = 'menu';
  });

  document.getElementById('btn-sound').addEventListener('click', (e) => {
    sfx.init();
    sfx.enabled = !sfx.enabled;
    e.currentTarget.textContent = sfx.enabled ? '🔊' : '🔇';
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    gameState = 'menu';
    hud.classList.add('hidden');
    edibleGuide.classList.add('hidden');
    grandpaBanner.classList.add('hidden');
    respawnToast.classList.add('hidden');
    startScreen.classList.remove('hidden');
  });

  // Keyboard & Pointer Input
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener('pointerdown', e => {
    sfx.init();
    pointerActive = true;
    pointerScreen.x = e.clientX;
    pointerScreen.y = e.clientY;
    joystickOrigin = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointermove', e => {
    if (!pointerActive) return;
    pointerScreen.x = e.clientX;
    pointerScreen.y = e.clientY;
  });

  window.addEventListener('pointerup', () => {
    pointerActive = false;
    joystickOrigin = null;
  });

  // Start Game & Spawn Roaming Rival Dinosaurs in ALL modes!
  function startGame() {
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    respawnToast.classList.add('hidden');
    hud.classList.remove('hidden');
    edibleGuide.classList.remove('hidden');

    player = {
      name: 'JAYCE',
      x: 0,
      y: 780,
      vx: 0,
      vy: 0,
      dirX: 0,
      dirY: -1,
      radius: 26, // Starts at 26 (~1.2m)
      tier: 1,
      score: 0,
      itemsEaten: 0,
      favoriteTreatsEaten: 0,
      dinosEaten: 0,
      lives: 3,
      strikes: 0,
      eatenCounts: {},
      chompTimer: 0,
      walkCycle: 0,
      outfit: selectedOutfit,
      isPlayer: true,
      deadTimer: 0,
      shieldTimer: 3.0, // Brief spawn shield at start
      turboTimer: 0
    };

    // Spawn 4 Roaming Rival Dinosaurs that eat snacks, grow, and can eat Jayce (or be eaten by Jayce!)
    const rivalConfigs = [
      {
        name: 'Spike Stego 🦎',
        dinoKind: 'stego',
        bodyColor: '#fb8c00',
        bellyColor: '#ffe0b2',
        spikeColor: '#ef5350',
        x: -420,
        y: 560,
        startRadius: 23 // Starts slightly smaller than Jayce — Jayce can eat him early!
      },
      {
        name: 'Chomper Trike 🦕',
        dinoKind: 'triceratops',
        bodyColor: '#00897b',
        bellyColor: '#b2dfdb',
        spikeColor: '#fff176',
        x: 420,
        y: 520,
        startRadius: 28 // Starts roughly even with Jayce — race to eat snacks first!
      },
      {
        name: 'Rexy T-Rex 🦖',
        dinoKind: 'trex',
        bodyColor: '#43a047',
        bellyColor: '#c8e6c9',
        spikeColor: '#ffca28',
        x: -360,
        y: -40,
        startRadius: 36 // Starts BIGGER than Jayce — dangerous until Jayce grows!
      },
      {
        name: 'Mega Bronto 🦕',
        dinoKind: 'brachio',
        bodyColor: '#8e24aa',
        bellyColor: '#e1bee7',
        spikeColor: '#ffd54f',
        x: 380,
        y: -450,
        startRadius: 50 // Big boss dinosaur patrolling near the north plaza!
      }
    ];

    rivals = rivalConfigs.map(cfg => ({
      name: cfg.name,
      dinoKind: cfg.dinoKind,
      bodyColor: cfg.bodyColor,
      bellyColor: cfg.bellyColor,
      spikeColor: cfg.spikeColor,
      color: cfg.bodyColor,
      x: cfg.x,
      y: cfg.y,
      spawnX: cfg.x,
      spawnY: cfg.y,
      vx: 0,
      vy: 0,
      dirX: 0,
      dirY: 1,
      radius: cfg.startRadius,
      baseStartRadius: cfg.startRadius,
      tier: 1,
      score: Math.round((cfg.startRadius - 20) * 15),
      walkCycle: Math.random() * 10,
      chompTimer: 0,
      deadTimer: 0,
      stateLabel: '',
      isPlayer: false
    }));

    timeLeft = selectedMode === 'rush' ? 120 : 0;
    timerBox.style.display = selectedMode === 'rush' ? 'flex' : 'none';
    document.getElementById('leaderboard').style.display = 'block';

    worldObjects = [];
    particles = [];
    floatingTexts = [];

    spawnWorldObjects();
    updateHUD();
    updateEdibleGuide();
    showGrandpaCheer(GRANDPA_QUOTES[0]);

    camera.x = player.x;
    camera.y = player.y;
    camera.zoom = 1.02;

    gameState = 'playing';
    lastFrameTime = performance.now();
  }

  function spawnWorldObjects() {
    // 1. Place THE SNACK STORE at the north end of the Blue Footprints Path!
    const snackStoreType = ITEM_TYPES.find(t => t.id === 'snackstore');
    snackStoreObj = createWorldObject(snackStoreType, 0, -1180);
    worldObjects.push(snackStoreObj);

    grandpaNPC = { x: -165, y: -1040, wavePhase: 0 };

    // 2. Trail of Jayce's favorite treats along the "Walk to the Snack Store" path
    const favTier1 = ITEM_TYPES.filter(t => t.tier === 1);
    for (let py = 650; py >= -850; py -= 85) {
      const tType = favTier1[Math.floor(Math.random() * favTier1.length)];
      const offsetX = Math.sin(py * 0.01) * 90 + (Math.random() - 0.5) * 60;
      worldObjects.push(createWorldObject(tType, offsetX, py));
    }

    // 3. Clusters across the town
    const countsById = {
      cookie: selectedMode === 'dinofrenzy' ? 70 : 55,
      pbcup: selectedMode === 'dinofrenzy' ? 70 : 55,
      sausage: selectedMode === 'dinofrenzy' ? 60 : 45,
      greeneggs: selectedMode === 'dinofrenzy' ? 60 : 45,
      turbotreat: 22,
      babydino: selectedMode === 'dinofrenzy' ? 45 : 30,
      toycar: 26,
      cookiejar: 24,
      picnic: 20,
      tree: 24,
      giantdino: selectedMode === 'dinofrenzy' ? 22 : 14,
      truck: 12,
      house: 14
    };

    ITEM_TYPES.forEach(type => {
      if (type.id === 'snackstore') return;
      const count = countsById[type.id] || 20;
      for (let i = 0; i < count; i++) {
        let x, y, tries = 0;
        do {
          x = (Math.random() - 0.5) * (WORLD_SIZE - 360);
          y = (Math.random() - 0.5) * (WORLD_SIZE - 360);
          tries++;
        } while (
          tries < 20 &&
          (Math.hypot(x - 0, y - (-1180)) < 260 ||
           (type.tier >= 3 && Math.hypot(x - player.x, y - player.y) < 280))
        );
        worldObjects.push(createWorldObject(type, x, y));
      }
    });

    // Extra ring of Tier 1 treats right around Jayce's starting spot
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const tType = favTier1[Math.floor(Math.random() * favTier1.length)];
      const dist = 80 + Math.random() * 50;
      worldObjects.push(createWorldObject(tType, player.x + Math.cos(a) * dist, player.y + Math.sin(a) * dist));
    }
  }

  function createWorldObject(type, x, y) {
    const dinoSubtypes = ['trex', 'triceratops', 'brachio', 'stego'];
    const houseColors = ['#42a5f5', '#ff7043', '#ab47bc', '#26a69a', '#ffa726'];
    return {
      type,
      x,
      y,
      baseX: x,
      baseY: y,
      radius: type.objRadius * (0.92 + Math.random() * 0.16),
      variant: Math.floor(Math.random() * 4),
      dinoKind: dinoSubtypes[Math.floor(Math.random() * dinoSubtypes.length)],
      color: houseColors[Math.floor(Math.random() * houseColors.length)],
      wobble: Math.random() * Math.PI * 2,
      beingSucked: false,
      suckProgress: 0,
      suckTarget: null,
      eaten: false
    };
  }

  function showGrandpaCheer(msg) {
    grandpaText.textContent = msg;
    grandpaBanner.classList.remove('hidden');
    clearTimeout(grandpaBanner._hideTimer);
    grandpaBanner._hideTimer = setTimeout(() => {
      grandpaBanner.classList.add('hidden');
    }, 4800);
  }

  function showLevelUp(tierObj) {
    sfx.levelUp();
    levelupSubtitle.textContent = tierObj.unlockMsg;
    levelupToast.classList.remove('hidden');
    clearTimeout(levelupToast._timer);
    levelupToast._timer = setTimeout(() => {
      levelupToast.classList.add('hidden');
    }, 3400);
    updateEdibleGuide();
  }

  function updateEdibleGuide() {
    edibleIconsEl.innerHTML = '';
    const seenTiers = new Set();
    ITEM_TYPES.forEach(item => {
      if (player.radius >= item.minRadius) {
        const chip = document.createElement('div');
        chip.className = 'edible-chip';
        chip.innerHTML = `${item.emoji} <span>${item.name}</span>`;
        edibleIconsEl.appendChild(chip);
      } else if (!seenTiers.has(item.tier) && seenTiers.size < 1) {
        seenTiers.add(item.tier);
        const chip = document.createElement('div');
        chip.className = 'edible-chip next-up';
        chip.innerHTML = `🔒 ${item.emoji} <span>Next: ${item.name}</span>`;
        edibleIconsEl.appendChild(chip);
      }
    });
  }

  function getTierForRadius(r) {
    let current = TIER_INFO[0];
    for (const t of TIER_INFO) {
      if (r >= t.minR) current = t;
    }
    return current;
  }

  function updateHUD() {
    const tierObj = getTierForRadius(player.radius);
    sizeTierBadge.textContent = tierObj.title;

    const nextTier = TIER_INFO.find(t => t.minR > player.radius);
    const prevMin = tierObj.minR;
    let pct = 100;
    if (nextTier) {
      pct = Math.min(100, Math.max(8, ((player.radius - prevMin) / (nextTier.minR - prevMin)) * 100));
    }
    growthBarFill.style.width = `${pct}%`;
    const meters = (player.radius / 22).toFixed(1);
    growthBarText.textContent = nextTier
      ? `Size: ${meters}m • Next Size-Up: ${Math.round(pct)}%`
      : `Size: ${meters}m • MAX MEGA SIZE! Eat the Snack Store!`;

    scoreValue.textContent = player.score.toLocaleString();
    if (livesValue) {
      const hearts = '❤️'.repeat(Math.max(0, player.lives)) + '🖤'.repeat(Math.max(0, 3 - player.lives));
      livesValue.textContent = hearts;
    }

    if (selectedMode === 'rush') {
      const mins = Math.floor(Math.max(0, timeLeft) / 60);
      const secs = Math.floor(Math.max(0, timeLeft) % 60);
      timerValue.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Live Munch Leaderboard showing Jayce & Rival Dinosaurs ranked by Size!
    const allContestants = [player, ...rivals].sort((a, b) => b.radius - a.radius);
    lbList.innerHTML = allContestants
      .map((c, idx) => {
        const mSize = (c.radius / 22).toFixed(1) + 'm';
        const dangerTag = !c.isPlayer
          ? (c.radius > player.radius * 1.06 ? '⚠️' : (player.radius > c.radius * 1.06 ? '😋' : '⚖️'))
          : '💙';
        return `<div class="lb-row ${c.isPlayer ? 'is-jayce' : ''}">
          <span>#${idx + 1} ${dangerTag} ${c.name}</span>
          <span>${mSize}</span>
        </div>`;
      })
      .join('');
  }

  // Main Update Loop
  function update(dt) {
    if (gameState !== 'playing') return;

    // Timer in rush mode
    if (selectedMode === 'rush') {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        endGame('TIME UP! GREAT MUNCHING, JAYCE!');
        return;
      }
    }

    // Grandpa periodic encouragement
    grandpaTimer += dt;
    if (grandpaTimer > 15) {
      grandpaTimer = 0;
      const quote = GRANDPA_QUOTES[Math.floor(Math.random() * GRANDPA_QUOTES.length)];
      showGrandpaCheer(quote);
    }

    // Handle Player Respawn Countdown if eaten by a bigger Dinosaur!
    if (player.deadTimer > 0) {
      player.deadTimer -= dt;
      const secs = Math.ceil(Math.max(1, player.deadTimer));
      respawnSubtitle.textContent = `Keeping full size! Back in ${secs}... (${player.lives} ${player.lives === 1 ? 'life' : 'lives'} left)`;
      if (player.deadTimer <= 0) {
        player.deadTimer = 0;
        respawnToast.classList.add('hidden');
        // Respawn Jayce at a safe spot away from bigger dinos with a 5.0s invincibility shield!
        let bestX = 0, bestY = 750, maxMinDist = -1;
        for (let attempt = 0; attempt < 15; attempt++) {
          const cx = (Math.random() - 0.5) * 1400;
          const cy = (Math.random() - 0.5) * 1400;
          let nearestThreat = Infinity;
          for (const r of rivals) {
            if (r.deadTimer <= 0 && r.radius > player.radius) {
              nearestThreat = Math.min(nearestThreat, Math.hypot(cx - r.x, cy - r.y));
            }
          }
          if (nearestThreat > maxMinDist) {
            maxMinDist = nearestThreat;
            bestX = cx;
            bestY = cy;
          }
        }
        player.x = bestX;
        player.y = bestY;
        player.shieldTimer = 5.0;
        showGrandpaCheer(`"You're back at full size, Jayce! Careful—${player.lives} ${player.lives === 1 ? 'life' : 'lives'} left!"`);
      }
    } else {
      if (player.shieldTimer > 0) {
        player.shieldTimer = Math.max(0, player.shieldTimer - dt);
      }
      if (player.turboTimer > 0) {
        player.turboTimer = Math.max(0, player.turboTimer - dt);
        // Spawn lightning speed trail particles while moving in Turbo Mode!
        if (Math.hypot(player.vx, player.vy) > 25 && Math.random() < 0.75) {
          particles.push({
            x: player.x - player.dirX * player.radius * 0.6 + (Math.random() - 0.5) * 18,
            y: player.y - player.dirY * player.radius * 0.6 + (Math.random() - 0.5) * 18,
            vx: -player.dirX * 60 + (Math.random() - 0.5) * 40,
            vy: -player.dirY * 60 + (Math.random() - 0.5) * 40,
            r: 5 + Math.random() * 5,
            color: Math.random() < 0.5 ? '#ffea00' : '#00e5ff',
            life: 0.32
          });
        }
      }

      // Player Steering
      let moveX = 0;
      let moveY = 0;
      if (keys['arrowup'] || keys['w']) moveY -= 1;
      if (keys['arrowdown'] || keys['s']) moveY += 1;
      if (keys['arrowleft'] || keys['a']) moveX -= 1;
      if (keys['arrowright'] || keys['d']) moveX += 1;

      if (pointerActive) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const dx = pointerScreen.x - cx;
        const dy = pointerScreen.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > 12) {
          const strength = Math.min(1, dist / 110);
          moveX = (dx / dist) * strength;
          moveY = (dy / dist) * strength;
        }
      } else if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        moveX /= len;
        moveY /= len;
      }

      const turboMult = player.turboTimer > 0 ? 1.75 : 1.0;
      const baseSpeed = (250 + (player.radius - 26) * 1.45) * turboMult;
      player.vx = moveX * baseSpeed;
      player.vy = moveY * baseSpeed;

      player.x += player.vx * dt;
      player.y += player.vy * dt;

      const halfW = WORLD_SIZE / 2 - 60;
      player.x = Math.max(-halfW, Math.min(halfW, player.x));
      player.y = Math.max(-halfW, Math.min(halfW, player.y));

      if (Math.hypot(player.vx, player.vy) > 15) {
        const spd = Math.hypot(player.vx, player.vy);
        player.dirX = player.vx / spd;
        player.dirY = player.vy / spd;
        player.walkCycle += dt * (player.turboTimer > 0 ? 18 : 11);
      }

      if (player.chompTimer > 0) player.chompTimer -= dt;
    }

    // Update Roaming Rival Dinosaurs
    const halfW = WORLD_SIZE / 2 - 80;
    rivals.forEach(rival => {
      if (rival.deadTimer > 0) {
        rival.deadTimer -= dt;
        if (rival.deadTimer <= 0) {
          // Respawn Rival Dinosaur at a random edge/corner
          rival.deadTimer = 0;
          const ang = Math.random() * Math.PI * 2;
          rival.x = Math.cos(ang) * 900;
          rival.y = Math.sin(ang) * 900;
          // Respawn scaled reasonably relative to current game phase
          rival.radius = Math.max(rival.baseStartRadius, player.radius * (0.75 + Math.random() * 0.45));
        }
        return;
      }

      let targetX = null;
      let targetY = null;
      rival.stateLabel = '🍪 Hunting Snacks';

      const distToJayce = Math.hypot(player.x - rival.x, player.y - rival.y);
      const canEatJayce =
        player.deadTimer <= 0 &&
        player.shieldTimer <= 0 &&
        rival.radius > player.radius * 1.06;
      const jayceCanEatRival =
        player.deadTimer <= 0 &&
        player.radius > rival.radius * 1.06;

      // 1. If Jayce is bigger and close, the Dinosaur PANICS and runs away!
      if (jayceCanEatRival && distToJayce < 360 + player.radius) {
        targetX = rival.x - (player.x - rival.x);
        targetY = rival.y - (player.y - rival.y);
        rival.stateLabel = '😱 RUN FROM JAYCE!';
      }
      // 2. If this Dinosaur is BIGGER than Jayce and within hunting range, it CHASES JAYCE!
      else if (canEatJayce && distToJayce < 420 + rival.radius) {
        targetX = player.x;
        targetY = player.y;
        rival.stateLabel = '🦖 CHASING JAYCE!';
      }
      // 3. Otherwise, find the nearest edible snack/object (or smaller rival dino) to eat and grow!
      else {
        let bestDist = Infinity;
        for (const obj of worldObjects) {
          if (obj.eaten || obj.beingSucked || obj.type.id === 'snackstore') continue;
          if (rival.radius >= obj.type.minRadius) {
            const d = Math.hypot(obj.x - rival.x, obj.y - rival.y);
            if (d < bestDist) {
              bestDist = d;
              targetX = obj.x;
              targetY = obj.y;
            }
          }
        }
      }

      if (targetX !== null && targetY !== null) {
        const dx = targetX - rival.x;
        const dy = targetY - rival.y;
        const d = Math.hypot(dx, dy) || 1;
        // Slightly slower than Jayce when chasing so Jayce has a fair chance to dodge/escape!
        const speedFactor = rival.stateLabel.includes('CHASING') ? 0.86 : 0.92;
        const rSpeed = (205 + (rival.radius - 25) * 1.2) * speedFactor;
        rival.vx = (dx / d) * rSpeed;
        rival.vy = (dy / d) * rSpeed;
        rival.dirX = dx / d;
        rival.dirY = dy / d;
        rival.x = Math.max(-halfW, Math.min(halfW, rival.x + rival.vx * dt));
        rival.y = Math.max(-halfW, Math.min(halfW, rival.y + rival.vy * dt));
        rival.walkCycle += dt * 9.5;
      }

      if (rival.chompTimer > 0) rival.chompTimer -= dt;
    });

    // Check Hole.io Mutual Character Eating (Jayce vs Dinosaurs, and Dinosaurs vs Dinosaurs!)
    checkMuncherCollisions();

    // Check suction & eating of World Objects for Jayce and Rival Dinosaurs
    const activeMunchers = [
      ...(player.deadTimer <= 0 ? [player] : []),
      ...rivals.filter(r => r.deadTimer <= 0)
    ];

    for (const obj of worldObjects) {
      if (obj.eaten) continue;
      obj.wobble += dt * 3.2;

      if (obj.beingSucked && obj.suckTarget) {
        obj.suckProgress += dt * 4.5;
        const target = obj.suckTarget;
        const angle = obj.suckProgress * 8;
        const pull = Math.max(0, 1 - obj.suckProgress);
        obj.x = target.x + (obj.x - target.x) * 0.78 + Math.cos(angle) * 4 * pull;
        obj.y = target.y + (obj.y - target.y) * 0.78 + Math.sin(angle) * 4 * pull;

        if (obj.suckProgress >= 1) {
          obj.eaten = true;
          onObjectEaten(target, obj);
        }
        continue;
      }

      for (const m of activeMunchers) {
        if (!m.isPlayer && (obj.type.id === 'snackstore' || obj.type.isTurbo)) continue; // Only Jayce eats Turbo Treats & Snack Store!
        if (m.radius >= obj.type.minRadius) {
          const dist = Math.hypot(obj.x - m.x, obj.y - m.y);
          const turboRangeBoost = (m.isPlayer && m.turboTimer > 0) ? 1.38 : 1.0;
          const suckRange = (m.radius * 1.18 + obj.radius * 0.45) * turboRangeBoost;
          if (dist < suckRange) {
            obj.beingSucked = true;
            obj.suckTarget = m;
            obj.suckProgress = 0;
            m.chompTimer = 0.32;
            break;
          }
        }
      }
    }

    // Respawn small Tier 1 & Tier 2 snacks periodically so Jayce & Dinos always have food
    const activeTier1 = worldObjects.filter(o => !o.eaten && o.type.tier === 1).length;
    if (activeTier1 < 85) {
      const favTier1 = ITEM_TYPES.filter(t => t.tier === 1);
      const tType = favTier1[Math.floor(Math.random() * favTier1.length)];
      const rx = (Math.random() - 0.5) * (WORLD_SIZE - 400);
      const ry = (Math.random() - 0.5) * (WORLD_SIZE - 400);
      worldObjects.push(createWorldObject(tType, rx, ry));
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 42 * dt;
      ft.life -= dt;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Smooth camera follow & dynamic zoom out as Jayce grows
    const targetZoom = Math.max(0.35, Math.min(1.05, 36 / (player.radius + 9)));
    camera.zoom += (targetZoom - camera.zoom) * Math.min(1, dt * 4);
    camera.x += (player.x - camera.x) * Math.min(1, dt * 8);
    camera.y += (player.y - camera.y) * Math.min(1, dt * 8);

    grandpaNPC.wavePhase += dt * 5;
    updateHUD();
  }

  // Mutual Eating between Jayce and Rival Dinosaurs (plus Dino vs Dino)
  function checkMuncherCollisions() {
    if (player.deadTimer <= 0) {
      for (const rival of rivals) {
        if (rival.deadTimer > 0) continue;
        const dist = Math.hypot(rival.x - player.x, rival.y - player.y);

        // Case A: Jayce is bigger than the Rival Dinosaur -> JAYCE EATS THE DINOSAUR!
        if (player.radius > rival.radius * 1.06) {
          if (dist < player.radius * 0.95 + rival.radius * 0.35) {
            onJayceAteRivalDino(rival);
          }
        }
        // Case B: Rival Dinosaur is bigger than Jayce (and Jayce has no shield) -> DINOSAUR EATS JAYCE!
        else if (rival.radius > player.radius * 1.06 && player.shieldTimer <= 0) {
          if (dist < rival.radius * 0.9 + player.radius * 0.3) {
            onRivalDinoAteJayce(rival);
            break;
          }
        }
      }
    }

    // Case C: Bigger Rival Dinosaur eats a smaller Rival Dinosaur!
    for (let i = 0; i < rivals.length; i++) {
      const rA = rivals[i];
      if (rA.deadTimer > 0) continue;
      for (let j = i + 1; j < rivals.length; j++) {
        const rB = rivals[j];
        if (rB.deadTimer > 0) continue;
        const dist = Math.hypot(rA.x - rB.x, rA.y - rB.y);
        if (rA.radius > rB.radius * 1.1 && dist < rA.radius * 0.9) {
          rA.radius += 2.2;
          rA.score += 120;
          rA.chompTimer = 0.4;
          rB.deadTimer = 4.5;
        } else if (rB.radius > rA.radius * 1.1 && dist < rB.radius * 0.9) {
          rB.radius += 2.2;
          rB.score += 120;
          rB.chompTimer = 0.4;
          rA.deadTimer = 4.5;
        }
      }
    }
  }

  function onJayceAteRivalDino(rival) {
    sfx.levelUp();
    sfx.chomp(0.7);
    player.chompTimer = 0.45;

    const oldTier = getTierForRadius(player.radius).tier;
    player.radius += Math.max(3.2, rival.radius * 0.14);
    player.score += 250;
    player.itemsEaten++;
    player.favoriteTreatsEaten++;
    player.dinosEaten = (player.dinosEaten || 0) + 1;
    player.eatenCounts['babydino'] = (player.eatenCounts['babydino'] || 0) + 1;

    // Celebration burst
    const burstColors = ['#00e676', '#ffca28', '#00e5ff', '#ffffff'];
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 150;
      particles.push({
        x: rival.x,
        y: rival.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 6 + Math.random() * 6,
        color: burstColors[i % burstColors.length],
        life: 0.65 + Math.random() * 0.3
      });
    }

    floatingTexts.push({
      x: rival.x,
      y: rival.y - player.radius,
      text: `🦖 CHOMPED ${rival.name.toUpperCase()}! +250 YUM!`,
      color: '#00e676',
      life: 1.5
    });

    showGrandpaCheer(`"WHOA JAYCE!! You outgrew ${rival.name} and gobbled him right up!"`);

    rival.deadTimer = 5.0; // Rival respawns in 5 seconds

    const newTierObj = getTierForRadius(player.radius);
    if (newTierObj.tier > oldTier) {
      player.tier = newTierObj.tier;
      showLevelUp(newTierObj);
    }
  }

  function onRivalDinoAteJayce(rival) {
    sfx.roar();
    rival.chompTimer = 0.5;
    rival.radius += 1.5;
    rival.score += 150;

    // Burst of stars/crumbs where Jayce got chomped
    const burstColors = ['#ff5252', '#ffca28', '#00b0ff', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 140;
      particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 5 + Math.random() * 6,
        color: burstColors[i % burstColors.length],
        life: 0.6 + Math.random() * 0.3
      });
    }

    // Jayce keeps 100% of his size! Track strikes (3 strikes and game resets)
    player.strikes = (player.strikes || 0) + 1;
    player.lives = Math.max(0, 3 - player.strikes);
    pointerActive = false;
    joystickOrigin = null;
    updateHUD();

    if (player.lives <= 0) {
      // 3rd time eaten -> 3 Strikes & You're Out! Reset game after brief toast
      player.deadTimer = 999;
      respawnTitle.textContent = `🦖 STRIKE 3 — YOU'RE OUT!`;
      respawnSubtitle.textContent = `Chomped 3 times! Resetting game...`;
      respawnToast.classList.remove('hidden');
      setTimeout(() => {
        respawnToast.classList.add('hidden');
        endGame(`3 Strikes & You're Out! ${rival.name} got Jayce for the 3rd time!`, true);
      }, 2200);
      return;
    }

    player.deadTimer = 3.0;
    respawnTitle.textContent = `🦖 STRIKE ${player.strikes} OF 3! CHOMPED BY ${rival.name.toUpperCase()}!`;
    respawnSubtitle.textContent = `Keeping full size! Back in 3... (${player.lives} ${player.lives === 1 ? 'life' : 'lives'} left)`;
    respawnToast.classList.remove('hidden');

    showGrandpaCheer(`"Strike ${player.strikes}! Don't worry Jayce, you kept all your size—${player.lives} ${player.lives === 1 ? 'life' : 'lives'} left!"`);
    updateEdibleGuide();
  }

  function onObjectEaten(muncher, obj) {
    const mult = selectedMode === 'dinofrenzy' ? 1.75 : 1.18;
    const oldTier = getTierForRadius(muncher.radius).tier;

    // Rival dinosaurs grow steadily too!
    const sizeDamp = Math.max(0.38, 32 / (muncher.radius + 6));
    const rivalFactor = muncher.isPlayer ? 1.0 : 0.72;
    muncher.radius += obj.type.growth * mult * sizeDamp * rivalFactor;
    muncher.score += obj.type.points;

    if (muncher.isPlayer) {
      player.itemsEaten++;
      if (obj.type.isFavorite) player.favoriteTreatsEaten++;
      player.eatenCounts[obj.type.id] = (player.eatenCounts[obj.type.id] || 0) + 1;

      if (obj.type.isTurbo) {
        player.turboTimer = 6.5;
        sfx.turbo();
        floatingTexts.push({
          x: player.x,
          y: player.y - player.radius * 1.25,
          text: `⚡ TURBO MODE ACTIVATED! ⚡`,
          color: '#ffea00',
          life: 1.45
        });
        showGrandpaCheer('"⚡ TURBO TREAT! Look at Jayce zoom—faster than a Velociraptor!"');
      } else {
        sfx.chomp(28 / player.radius);
      }

      const burstColors = ['#00e5ff', '#ffca28', '#66bb6a', '#ff7043', '#ffffff'];
      for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 110;
        particles.push({
          x: obj.x,
          y: obj.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 4 + Math.random() * 5,
          color: burstColors[i % burstColors.length],
          life: 0.45 + Math.random() * 0.25
        });
      }

      floatingTexts.push({
        x: player.x + (Math.random() - 0.5) * 30,
        y: player.y - player.radius * 0.8,
        text: `${obj.type.emoji} +${obj.type.points} YUM!`,
        color: obj.type.isFavorite ? '#ffca28' : '#00e5ff',
        life: 1.05
      });

      const newTierObj = getTierForRadius(player.radius);
      if (newTierObj.tier > oldTier) {
        player.tier = newTierObj.tier;
        showLevelUp(newTierObj);
      }

      if (obj.type.id === 'snackstore') {
        sfx.victory();
        setTimeout(() => {
          endGame('JAYCE GOBBLED UP THE ENTIRE SNACK STORE!');
        }, 650);
      }
    }
  }

  function endGame(subtitleText, isThreeStrikeOut = false) {
    gameState = 'ended';
    if (isThreeStrikeOut) {
      sfx.roar();
    } else {
      sfx.victory();
    }
    hud.classList.add('hidden');
    edibleGuide.classList.add('hidden');
    grandpaBanner.classList.add('hidden');
    respawnToast.classList.add('hidden');
    endScreen.classList.remove('hidden');

    document.getElementById('victory-emoji').textContent = isThreeStrikeOut ? '🦖' : '🏆';
    document.getElementById('victory-title').textContent = isThreeStrikeOut
      ? '3 STRIKES — GAME OVER!'
      : 'MEGA MUNCH CHAMPION!';
    document.getElementById('victory-subtitle').textContent = subtitleText;
    document.getElementById('stat-score').textContent = player.score.toLocaleString();
    document.getElementById('stat-eaten').textContent = player.itemsEaten;
    document.getElementById('stat-size').textContent = `${(player.radius / 22).toFixed(1)}m`;
    document.getElementById('stat-treats').textContent = player.favoriteTreatsEaten;

    const breakdownEl = document.getElementById('eaten-breakdown');
    breakdownEl.innerHTML = '';
    ITEM_TYPES.forEach(t => {
      const cnt = player.eatenCounts[t.id] || 0;
      if (cnt > 0) {
        const pill = document.createElement('div');
        pill.className = 'edible-chip';
        pill.style.background = '#e3f2fd';
        pill.style.color = '#0d47a1';
        pill.style.border = '2px solid #90caf9';
        pill.innerHTML = `${t.emoji} <strong>${cnt}x</strong> ${t.name}`;
        breakdownEl.appendChild(pill);
      }
    });
  }

  // ============================================================================
  // RENDERING (2.5D Cartoon World + Cartoon Jayce + Roaming Rival Dinosaurs)
  // ============================================================================

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#a5d6a7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    drawWorldGround();

    const renderList = [];

    for (const obj of worldObjects) {
      if (!obj.eaten) {
        renderList.push({ kind: 'object', y: obj.y, obj });
      }
    }

    renderList.push({ kind: 'grandpa', y: grandpaNPC.y });

    if (player && player.deadTimer <= 0) {
      renderList.push({ kind: 'muncher', y: player.y, muncher: player });
    }
    for (const r of rivals) {
      if (r.deadTimer <= 0) {
        renderList.push({ kind: 'muncher', y: r.y, muncher: r });
      }
    }

    renderList.sort((a, b) => a.y - b.y);

    for (const item of renderList) {
      if (item.kind === 'object') {
        drawWorldObject(item.obj);
      } else if (item.kind === 'grandpa') {
        drawGrandpa(grandpaNPC);
      } else if (item.kind === 'muncher') {
        if (item.muncher.isPlayer) {
          drawCartoonJayce(item.muncher);
        } else {
          drawRivalDinoMuncher(item.muncher);
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life * 1.5);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw floating texts
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = '900 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0d47a1';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Draw Compass Arrow around Jayce pointing to THE SNACK STORE
    if (player && player.deadTimer <= 0 && snackStoreObj && !snackStoreObj.eaten) {
      drawSnackStoreCompass();
    }

    ctx.restore();

    if (pointerActive && gameState === 'playing' && player && player.deadTimer <= 0) {
      drawTouchJoystick();
    }
  }

  function drawWorldGround() {
    const half = WORLD_SIZE / 2;
    const tileSize = 160;
    for (let x = -half; x < half; x += tileSize) {
      for (let y = -half; y < half; y += tileSize) {
        const isAlt = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) & 1) === 0;
        ctx.fillStyle = isAlt ? '#b9f6ca' : '#a5d6a7';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Town Roads
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(-130, -1250, 260, 2150);
    ctx.fillRect(-1250, -350, 2500, 180);
    ctx.fillRect(-1250, 420, 2500, 180);

    // Blue dashed path lines
    ctx.strokeStyle = '#1e88e5';
    ctx.lineWidth = 8;
    ctx.setLineDash([28, 22]);
    ctx.beginPath();
    ctx.moveTo(0, 820);
    ctx.lineTo(0, -1020);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plaza around the Snack Store
    ctx.fillStyle = '#bbdefb';
    ctx.strokeStyle = '#1e88e5';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(-340, -1420, 680, 460, 36);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 18;
    ctx.strokeRect(-half, -half, WORLD_SIZE, WORLD_SIZE);
  }

  function drawCartoonJayce(p) {
    const r = p.radius;
    const scale = r / 30;
    const bob = Math.sin(p.walkCycle) * 3.5 * scale;
    const isChomping = p.chompTimer > 0;

    ctx.save();
    ctx.translate(p.x, p.y);

    // 1. BLUE HOLE.IO MUNCH VORTEX RING ON THE GROUND
    const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.05;
    const ringGrad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 1.15 * pulse);
    ringGrad.addColorStop(0, 'rgba(13, 71, 161, 0.85)');
    ringGrad.addColorStop(0.65, 'rgba(0, 176, 255, 0.55)');
    ringGrad.addColorStop(0.92, 'rgba(0, 229, 255, 0.9)');
    ringGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.ellipse(0, 6 * scale, r * 1.15 * pulse, r * 0.88 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(0, 6 * scale);
    ctx.scale(1, 0.76);
    ctx.rotate(performance.now() * 0.0025);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.setLineDash([12 * scale, 10 * scale]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. CAPE OR DINO TAIL
    if (p.outfit === 'superblue') {
      const capeWave = Math.sin(performance.now() * 0.01 + p.walkCycle) * 5 * scale;
      ctx.fillStyle = '#00b0ff';
      ctx.strokeStyle = '#0d47a1';
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(-12 * scale, -18 * scale + bob);
      ctx.lineTo(12 * scale, -18 * scale + bob);
      ctx.lineTo(22 * scale + capeWave, 10 * scale + bob);
      ctx.lineTo(-22 * scale + capeWave, 10 * scale + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.outfit === 'dino') {
      const tailWag = Math.sin(p.walkCycle * 1.2) * 7 * scale;
      ctx.fillStyle = '#1e88e5';
      ctx.strokeStyle = '#0d47a1';
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -4 * scale + bob);
      ctx.quadraticCurveTo(26 * scale, 4 * scale + tailWag, 34 * scale, -8 * scale + tailWag);
      ctx.quadraticCurveTo(22 * scale, -14 * scale + tailWag, 0, -12 * scale + bob);
      ctx.fill();
      ctx.stroke();
    }

    // 3. RUNNING LEGS & BLUE SNEAKERS
    const legSwing = Math.sin(p.walkCycle) * 7 * scale;
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.roundRect(-11 * scale, -4 * scale + legSwing * 0.4, 8 * scale, 11 * scale, 4 * scale);
    ctx.roundRect(3 * scale, -4 * scale - legSwing * 0.4, 8 * scale, 11 * scale, 4 * scale);
    ctx.fill();

    ctx.fillStyle = '#00b0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.ellipse(-7 * scale, 8 * scale + legSwing * 0.5, 6.5 * scale, 4.2 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(7 * scale, 8 * scale - legSwing * 0.5, 6.5 * scale, 4.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. TORSO / T-SHIRT
    ctx.save();
    ctx.translate(0, bob);

    if (p.outfit === 'champion') {
      ctx.fillStyle = '#cfd8dc';
      ctx.strokeStyle = '#546e7a';
    } else if (p.outfit === 'superblue') {
      ctx.fillStyle = '#1565c0';
      ctx.strokeStyle = '#0d47a1';
    } else {
      ctx.fillStyle = '#1e88e5';
      ctx.strokeStyle = '#0d47a1';
    }
    ctx.lineWidth = 2.4 * scale;

    ctx.beginPath();
    ctx.roundRect(-15 * scale, -25 * scale, 30 * scale, 24 * scale, 8 * scale);
    ctx.fill();
    ctx.stroke();

    const armSwing = Math.cos(p.walkCycle) * 5 * scale;
    ctx.fillStyle = p.outfit === 'champion' ? '#cfd8dc' : '#1e88e5';
    ctx.beginPath();
    ctx.roundRect(-22 * scale, -23 * scale + armSwing, 8 * scale, 12 * scale, 4 * scale);
    ctx.roundRect(14 * scale, -23 * scale - armSwing, 8 * scale, 12 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();

    // Sleeve badge
    ctx.fillStyle = '#0d47a1';
    ctx.beginPath();
    ctx.arc(-18 * scale, -16 * scale + armSwing, 2.3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(-17.3 * scale, -16 * scale + armSwing, 1.1 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Hands
    ctx.fillStyle = '#ffccb3';
    ctx.beginPath();
    ctx.arc(-18 * scale, -9 * scale + armSwing, 4.2 * scale, 0, Math.PI * 2);
    ctx.arc(18 * scale, -9 * scale - armSwing, 4.2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Chest Emblem
    ctx.fillStyle = p.outfit === 'superblue' ? '#ffca28' : '#26899e';
    ctx.beginPath();
    ctx.roundRect(-9.5 * scale, -21 * scale, 19 * scale, 15 * scale, 3 * scale);
    ctx.fill();

    ctx.fillStyle = p.outfit === 'superblue' ? '#0d47a1' : '#ffffff';
    ctx.font = `900 ${Math.round(11 * scale)}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('J', 0, -13.2 * scale);

    // 5. JAYCE'S CARTOON HEAD
    const headY = -41 * scale;
    const headR = 20.5 * scale;

    if (p.outfit === 'dino') {
      ctx.fillStyle = '#ffca28';
      ctx.strokeStyle = '#f57f17';
      ctx.lineWidth = 1.8 * scale;
      for (let a = -0.9; a <= 0.9; a += 0.45) {
        const sx = Math.sin(a) * (headR + 3 * scale);
        const sy = headY - Math.cos(a) * (headR + 3 * scale);
        ctx.beginPath();
        ctx.arc(sx, sy, 4.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Ears
    ctx.fillStyle = '#ffbfa0';
    ctx.strokeStyle = '#d98c6c';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.ellipse(-headR + 1 * scale, headY + 2 * scale, 4.2 * scale, 6 * scale, -0.15, 0, Math.PI * 2);
    ctx.ellipse(headR - 1 * scale, headY + 2 * scale, 4.2 * scale, 6 * scale, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Face
    const skinGrad = ctx.createRadialGradient(-4 * scale, headY - 5 * scale, 2 * scale, 0, headY, headR);
    skinGrad.addColorStop(0, '#ffe0cc');
    skinGrad.addColorStop(1, '#ffc4a3');
    ctx.fillStyle = skinGrad;
    ctx.strokeStyle = '#c97b5b';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(255, 105, 120, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-11.5 * scale, headY + 4.5 * scale, 5.2 * scale, 3.4 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(11.5 * scale, headY + 4.5 * scale, 5.2 * scale, 3.4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const lookX = p.dirX * 1.8 * scale;
    const lookY = p.dirY * 1.4 * scale;
    [-7.2 * scale, 7.2 * scale].forEach(ex => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.ellipse(ex, headY - 1.5 * scale, 4.6 * scale, 5.1 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6d4c2b';
      ctx.beginPath();
      ctx.arc(ex + lookX, headY - 1.5 * scale + lookY, 2.9 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1b1109';
      ctx.beginPath();
      ctx.arc(ex + lookX, headY - 1.5 * scale + lookY, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + lookX - 1 * scale, headY - 2.8 * scale + lookY, 1.1 * scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // Eyebrows
    ctx.strokeStyle = '#9c7338';
    ctx.lineWidth = 2.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11 * scale, headY - 8 * scale);
    ctx.quadraticCurveTo(-7 * scale, headY - 10 * scale, -3.5 * scale, headY - 8.2 * scale);
    ctx.moveTo(3.5 * scale, headY - 8.2 * scale);
    ctx.quadraticCurveTo(7 * scale, headY - 10 * scale, 11 * scale, headY - 8 * scale);
    ctx.stroke();

    // Nose
    ctx.fillStyle = '#f29c79';
    ctx.beginPath();
    ctx.ellipse(0, headY + 2.2 * scale, 2.6 * scale, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile or Chomp mouth
    const mouthY = headY + 7.5 * scale;
    if (isChomping) {
      ctx.fillStyle = '#880e4f';
      ctx.strokeStyle = '#b71c1c';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.ellipse(0, mouthY + 2 * scale, 10.5 * scale, 7.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-7.5 * scale, mouthY - 4.5 * scale, 15 * scale, 4 * scale, 1.5 * scale);
      ctx.fill();
    } else {
      ctx.fillStyle = '#880e4f';
      ctx.strokeStyle = '#b95b46';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.arc(0, mouthY - 1 * scale, 9.2 * scale, 0.12, Math.PI - 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.rect(-7.2 * scale, mouthY - 0.5 * scale, 14.4 * scale, 3.6 * scale);
      ctx.fill();
    }

    // 6. SANDY-BLONDE HAIR
    const hairGrad = ctx.createLinearGradient(0, headY - headR - 6 * scale, 0, headY - 4 * scale);
    hairGrad.addColorStop(0, '#d4a857');
    hairGrad.addColorStop(0.55, '#b8893c');
    hairGrad.addColorStop(1, '#966b28');

    ctx.fillStyle = hairGrad;
    ctx.strokeStyle = '#75511b';
    ctx.lineWidth = 1.8 * scale;

    ctx.beginPath();
    ctx.moveTo(-headR + 1 * scale, headY - 3 * scale);
    ctx.quadraticCurveTo(-headR - 1 * scale, headY - headR + 1 * scale, -6 * scale, headY - headR - 3 * scale);
    ctx.quadraticCurveTo(4 * scale, headY - headR - 5 * scale, headR - 1 * scale, headY - 3 * scale);
    ctx.lineTo(13 * scale, headY - 9 * scale);
    ctx.lineTo(9 * scale, headY - 5.5 * scale);
    ctx.lineTo(5 * scale, headY - 10.5 * scale);
    ctx.lineTo(1 * scale, headY - 5.5 * scale);
    ctx.lineTo(-4 * scale, headY - 10.5 * scale);
    ctx.lineTo(-8 * scale, headY - 6 * scale);
    ctx.lineTo(-13 * scale, headY - 9.5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // End bob

    // Optional Blue Shield Bubble when respawning!
    if (p.shieldTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
      ctx.fillStyle = 'rgba(0, 176, 255, 0.22)';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(0, -24 * scale, 36 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 7. NAME & SIZE BADGE ABOVE JAYCE
    ctx.font = `900 ${Math.max(13, Math.round(11 * Math.sqrt(scale)))}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    const labelY = -68 * scale + bob;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0d47a1';
    const labelText = p.turboTimer > 0
      ? `⚡ TURBO JAYCE (${Math.ceil(p.turboTimer)}s) ⚡`
      : p.shieldTimer > 0
        ? `🛡️ JAYCE (${(r / 22).toFixed(1)}m)`
        : `💙 JAYCE (${(r / 22).toFixed(1)}m)`;
    ctx.strokeText(labelText, 0, labelY);
    ctx.fillStyle = '#ffca28';
    ctx.fillText(labelText, 0, labelY);

    ctx.restore();
  }

  // ============================================================================
  // ROAMING RIVAL DINOSAUR RENDERER (Full Animated 2.5D Dinosaur + Danger/Edible Ring!)
  // ============================================================================
  function drawRivalDinoMuncher(m) {
    const r = m.radius;
    const scale = r / 30;
    const bob = Math.abs(Math.sin(m.walkCycle)) * 4 * scale;
    const facingLeft = m.dirX <= 0;

    // Threat status compared to Jayce
    const isBiggerThanJayce = player && m.radius > player.radius * 1.06;
    const isSmallerThanJayce = player && player.radius > m.radius * 1.06;

    ctx.save();
    ctx.translate(m.x, m.y);

    // 1. HOLE.IO VORTEX RING UNDER THE DINOSAUR
    // Glows RED if this dinosaur can eat Jayce, GREEN if Jayce can eat this dinosaur!
    const pulse = 1 + Math.sin(performance.now() * 0.009) * 0.06;
    let ringColorInner, ringColorEdge, badgeColor, statusTag;
    if (isBiggerThanJayce) {
      ringColorInner = 'rgba(183, 28, 28, 0.78)';
      ringColorEdge = '#ff1744';
      badgeColor = '#ff5252';
      statusTag = '⚠️ BIGGER! WATCH OUT!';
    } else if (isSmallerThanJayce) {
      ringColorInner = 'rgba(27, 94, 32, 0.72)';
      ringColorEdge = '#00e676';
      badgeColor = '#00e676';
      statusTag = '😋 SMALLER! EAT ME!';
    } else {
      ringColorInner = 'rgba(245, 127, 23, 0.72)';
      ringColorEdge = '#ffca28';
      badgeColor = '#ffca28';
      statusTag = '⚖️ EVEN SIZE';
    }

    const ringGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.12 * pulse);
    ringGrad.addColorStop(0, ringColorInner);
    ringGrad.addColorStop(0.88, ringColorEdge);
    ringGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.ellipse(0, 5 * scale, r * 1.12 * pulse, r * 0.84 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dashed vortex border
    ctx.save();
    ctx.translate(0, 5 * scale);
    ctx.scale(1, 0.75);
    ctx.rotate(-performance.now() * 0.0022);
    ctx.strokeStyle = ringColorEdge;
    ctx.lineWidth = Math.max(2.5, 3.2 * scale);
    ctx.setLineDash([14 * scale, 10 * scale]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. ANIMATED 2.5D CARTOON DINOSAUR BODY
    ctx.save();
    if (!facingLeft) ctx.scale(-1, 1); // Mirror horizontally when walking right
    ctx.translate(0, -bob);

    const legSwing = Math.sin(m.walkCycle) * 6 * scale;

    // Swinging Dino Tail
    const tailWag = Math.cos(m.walkCycle) * 5 * scale;
    ctx.fillStyle = m.bodyColor;
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(6 * scale, -8 * scale);
    ctx.quadraticCurveTo(32 * scale, 4 * scale + tailWag, 38 * scale, -12 * scale + tailWag);
    ctx.quadraticCurveTo(24 * scale, -18 * scale + tailWag, 6 * scale, -18 * scale);
    ctx.fill();
    ctx.stroke();

    // Walking Dino Legs & Claws
    ctx.fillStyle = m.bodyColor;
    ctx.beginPath();
    ctx.roundRect(-12 * scale, -6 * scale + legSwing * 0.5, 9 * scale, 13 * scale, 4 * scale);
    ctx.roundRect(4 * scale, -6 * scale - legSwing * 0.5, 9 * scale, 13 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();

    // Plump Dinosaur Torso
    ctx.fillStyle = m.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -16 * scale, 20 * scale, 17 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly Patch
    ctx.fillStyle = m.bellyColor;
    ctx.beginPath();
    ctx.ellipse(-4 * scale, -15 * scale, 12 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Back Spikes / Plates
    ctx.fillStyle = m.spikeColor;
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.arc((10 + s * 5) * scale, (-30 + s * 6) * scale, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Dinosaur Head & Snapping Jaws
    const headY = -36 * scale;
    ctx.fillStyle = m.bodyColor;
    ctx.beginPath();
    ctx.ellipse(-8 * scale, headY, 17 * scale, 12.5 * scale, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Triceratops Frill & Horns if triceratops
    if (m.dinoKind === 'triceratops') {
      ctx.fillStyle = m.spikeColor;
      ctx.beginPath();
      ctx.moveTo(-22 * scale, headY - 2 * scale);
      ctx.lineTo(-32 * scale, headY - 10 * scale);
      ctx.lineTo(-19 * scale, headY - 7 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Expressive Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-11 * scale, headY - 3 * scale, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isBiggerThanJayce ? '#d50000' : '#1b1109';
    ctx.beginPath();
    ctx.arc(-12.2 * scale, headY - 3 * scale, 2.3 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Sharp White Dino Teeth (snapping open when chomping or chasing!)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let t = 0; t < 4; t++) {
      const tx = (-21 + t * 4) * scale;
      ctx.moveTo(tx, headY + 4 * scale);
      ctx.lineTo(tx + 2 * scale, headY + 9 * scale);
      ctx.lineTo(tx + 4 * scale, headY + 4 * scale);
    }
    ctx.fill();

    ctx.restore(); // End flip & bob

    // 3. OVERHEAD NAME, SIZE & THREAT BADGE
    const fontPx = Math.max(12, Math.round(10.5 * Math.sqrt(scale)));
    ctx.font = `900 ${fontPx}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    const labelY = -58 * scale - bob;

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    const titleStr = `${m.name} (${(r / 22).toFixed(1)}m)`;
    ctx.strokeText(titleStr, 0, labelY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(titleStr, 0, labelY);

    ctx.font = `900 ${Math.max(11, fontPx - 1)}px "Trebuchet MS", sans-serif`;
    ctx.strokeText(statusTag, 0, labelY - fontPx - 3);
    ctx.fillStyle = badgeColor;
    ctx.fillText(statusTag, 0, labelY - fontPx - 3);

    ctx.restore();
  }

  function drawGrandpa(g) {
    ctx.save();
    ctx.translate(g.x, g.y);

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1565c0';
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-16, -26, 32, 32, 10);
    ctx.fill();
    ctx.stroke();

    const wave = Math.sin(g.wavePhase) * 8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, -18);
    ctx.lineTo(26 + wave * 0.5, -68);
    ctx.stroke();

    ctx.fillStyle = '#00b0ff';
    ctx.beginPath();
    ctx.ellipse(26 + wave * 0.5, -82, 14, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd1b3';
    ctx.beginPath();
    ctx.arc(0, -42, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.arc(0, -46, 17, Math.PI, 0);
    ctx.fill();

    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2;
    ctx.strokeRect(-11, -46, 9, 7);
    ctx.strokeRect(2, -46, 9, 7);

    ctx.beginPath();
    ctx.arc(0, -37, 7, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.font = '900 14px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 4;
    ctx.strokeText('👴 GRANDPA', 0, -68);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('👴 GRANDPA', 0, -68);

    ctx.restore();
  }

  function drawWorldObject(obj) {
    const canEat = player && player.radius >= obj.type.minRadius;
    const distToPlayer = player ? Math.hypot(obj.x - player.x, obj.y - player.y) : 9999;
    const isNearPlayer = canEat && distToPlayer < player.radius * 2.1 + obj.radius;

    ctx.save();
    ctx.translate(obj.x, obj.y);

    if (obj.beingSucked) {
      const shrink = Math.max(0.15, 1 - obj.suckProgress * 0.85);
      ctx.scale(shrink, shrink);
      ctx.rotate(obj.suckProgress * 6);
    } else if (isNearPlayer) {
      ctx.rotate(Math.sin(obj.wobble * 3) * 0.08);
    }

    const r = obj.radius;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.35, r * 0.95, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (canEat && isNearPlayer) {
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.25, r * 1.12, r * 0.78, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    switch (obj.type.id) {
      case 'cookie': {
        ctx.fillStyle = '#d7994c';
        ctx.strokeStyle = '#8d5524';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#3e2723';
        const chips = [[-0.4, -0.3], [0.35, -0.35], [0, 0.05], [-0.35, 0.35], [0.4, 0.3], [-0.05, -0.5]];
        chips.forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx * r, cy * r, r * 0.17, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'pbcup': {
        ctx.fillStyle = '#4e342e';
        ctx.strokeStyle = '#271917';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const spikes = 14;
        for (let i = 0; i < spikes * 2; i++) {
          const rad = i % 2 === 0 ? r * 1.05 : r * 0.9;
          const a = (i / (spikes * 2)) * Math.PI * 2;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f5b041';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'sausage': {
        ctx.save();
        ctx.rotate(-0.35);
        ctx.fillStyle = '#8d4024';
        ctx.strokeStyle = '#4e2010';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-r * 0.95, -r * 0.55, r * 1.9, r * 0.52, r * 0.26);
        ctx.roundRect(-r * 0.85, r * 0.05, r * 1.9, r * 0.52, r * 0.26);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#3e1608';
        ctx.lineWidth = 2;
        [-0.4, 0, 0.4].forEach(gx => {
          ctx.beginPath();
          ctx.moveTo(gx * r, -r * 0.48);
          ctx.lineTo((gx + 0.12) * r, -r * 0.12);
          ctx.moveTo(gx * r, r * 0.12);
          ctx.lineTo((gx + 0.12) * r, r * 0.48);
          ctx.stroke();
        });
        ctx.restore();
        break;
      }

      case 'greeneggs': {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1e88e5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#b9f6ca';
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(-r * 0.28, -r * 0.15, r * 0.46, r * 0.38, -0.2, 0, Math.PI * 2);
        ctx.ellipse(r * 0.3, r * 0.2, r * 0.44, r * 0.36, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00c853';
        ctx.beginPath();
        ctx.arc(-r * 0.28, -r * 0.15, r * 0.2, 0, Math.PI * 2);
        ctx.arc(r * 0.3, r * 0.2, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'turbotreat': {
        // Pulsing Electric-Blue & Gold Lightning Turbo Cookie!
        const glowPulse = 1 + Math.sin(performance.now() * 0.01) * 0.15;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 234, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.45 * glowPulse, 0, Math.PI * 2);
        ctx.fill();

        // Frosted electric blue star-cookie base
        ctx.fillStyle = '#00e5ff';
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Golden lightning bolt emblem in center
        ctx.font = `900 ${Math.round(r * 1.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
        ctx.restore();
        break;
      }

      case 'babydino':
      case 'giantdino': {
        const isGiant = obj.type.id === 'giantdino';
        const dinoColors = {
          trex: { body: '#43a047', belly: '#c8e6c9', spikes: '#ffca28' },
          triceratops: { body: '#1e88e5', belly: '#bbdefb', spikes: '#fff176' },
          brachio: { body: '#8e24aa', belly: '#e1bee7', spikes: '#ffd54f' },
          stego: { body: '#fb8c00', belly: '#ffe0b2', spikes: '#ef5350' }
        };
        const pal = dinoColors[obj.dinoKind] || dinoColors.trex;

        ctx.fillStyle = pal.body;
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = isGiant ? 3.5 : 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 1.15, r * 0.2, r * 1.35, -r * 0.3);
        ctx.quadraticCurveTo(r * 0.85, -r * 0.45, 0, -r * 0.25);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.body;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.15, r * 0.78, r * 0.68, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.belly;
        ctx.beginPath();
        ctx.ellipse(-r * 0.12, -r * 0.1, r * 0.46, r * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();

        const headY = isGiant ? -r * 0.95 : -r * 0.78;
        ctx.fillStyle = pal.body;
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, headY, r * 0.62, r * 0.46, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.spikes;
        for (let s = 0; s < 3; s++) {
          ctx.beginPath();
          ctx.arc(r * (0.35 + s * 0.22), headY + r * (0.2 + s * 0.26), r * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.38, headY - r * 0.1, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-r * 0.41, headY - r * 0.1, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'toycar':
      case 'truck': {
        const isTruck = obj.type.id === 'truck';
        ctx.fillStyle = isTruck ? '#1565c0' : '#00b0ff';
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 2.8;

        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(-r * 0.55, r * 0.32, r * 0.26, 0, Math.PI * 2);
        ctx.arc(r * 0.55, r * 0.32, r * 0.26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isTruck ? '#1e88e5' : '#00b0ff';
        ctx.beginPath();
        ctx.roundRect(-r * 0.95, -r * 0.55, r * 1.9, r * 0.85, r * 0.22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e1f5fe';
        ctx.beginPath();
        ctx.roundRect(-r * 0.75, -r * 0.42, r * 0.55, r * 0.42, 4);
        ctx.fill();

        if (isTruck) {
          ctx.fillStyle = '#ffca28';
          ctx.font = `900 ${Math.round(r * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🍪', r * 0.28, -r * 0.1);
        }
        break;
      }

      case 'cookiejar': {
        ctx.fillStyle = 'rgba(225, 245, 254, 0.9)';
        ctx.strokeStyle = '#0288d1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-r * 0.75, -r * 0.85, r * 1.5, r * 1.55, r * 0.3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.roundRect(-r * 0.62, -r * 1.1, r * 1.24, r * 0.3, 6);
        ctx.fill();

        ctx.font = `${Math.round(r * 0.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍪', 0, -r * 0.05);
        break;
      }

      case 'picnic': {
        ctx.fillStyle = '#8d6e63';
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-r * 0.95, -r * 0.55, r * 1.9, r * 0.9, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#29b6f6';
        ctx.fillRect(-r * 0.85, -r * 0.48, r * 1.7, r * 0.55);

        ctx.font = `${Math.round(r * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🍪🥜🍳', 0, -r * 0.12);
        break;
      }

      case 'tree': {
        ctx.fillStyle = '#795548';
        ctx.fillRect(-r * 0.22, -r * 0.2, r * 0.44, r * 0.65);

        ctx.fillStyle = '#43a047';
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -r * 0.55, r * 0.72, 0, Math.PI * 2);
        ctx.arc(-r * 0.45, -r * 0.25, r * 0.52, 0, Math.PI * 2);
        ctx.arc(r * 0.45, -r * 0.25, r * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'house': {
        ctx.fillStyle = '#fff8e1';
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-r * 0.85, -r * 0.65, r * 1.7, r * 1.15, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.moveTo(-r * 1.02, -r * 0.6);
        ctx.lineTo(0, -r * 1.32);
        ctx.lineTo(r * 1.02, -r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e88e5';
        ctx.fillRect(-r * 0.22, -r * 0.08, r * 0.44, r * 0.58);
        ctx.fillStyle = '#bbdefb';
        ctx.fillRect(-r * 0.68, -r * 0.42, r * 0.34, r * 0.34);
        ctx.fillRect(r * 0.34, -r * 0.42, r * 0.34, r * 0.34);
        break;
      }

      case 'snackstore': {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(-r * 1.15, -r * 0.85, r * 2.3, r * 1.35, 16);
        ctx.fill();
        ctx.stroke();

        const stripes = 8;
        const stripeW = (r * 2.36) / stripes;
        for (let i = 0; i < stripes; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#1e88e5' : '#ffca28';
          ctx.beginPath();
          ctx.roundRect(-r * 1.18 + i * stripeW, -r * 0.92, stripeW, r * 0.34, 8);
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#0d47a1';
        ctx.strokeStyle = '#ffca28';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(-r * 1.05, -r * 1.48, r * 2.1, r * 0.52, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffca28';
        ctx.font = `900 ${Math.round(r * 0.22)}px "Trebuchet MS", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍪 JAYCE & GRANDPA\'S 🥜', 0, -r * 1.31);
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('★ SNACK STORE ★', 0, -r * 1.09);

        ctx.fillStyle = '#e1f5fe';
        ctx.fillRect(-r * 0.95, -r * 0.42, r * 0.65, r * 0.62);
        ctx.fillRect(r * 0.3, -r * 0.42, r * 0.65, r * 0.62);

        ctx.fillStyle = '#1565c0';
        ctx.fillRect(-r * 0.22, -r * 0.38, r * 0.44, r * 0.88);

        ctx.font = `${Math.round(r * 0.34)}px sans-serif`;
        ctx.fillText('🍪🌭', -r * 0.62, -r * 0.1);
        ctx.fillText('🥜🍳', r * 0.62, -r * 0.1);

        const canEatStore = player && player.radius >= obj.type.minRadius;
        ctx.font = '900 18px "Trebuchet MS", sans-serif';
        ctx.fillStyle = canEatStore ? '#00c853' : '#ff6f00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        const msg = canEatStore
          ? '✨ MUNCH THE SNACK STORE NOW! ✨'
          : `Grow to ${(obj.type.minRadius / 22).toFixed(1)}m to Munch the Snack Store!`;
        ctx.strokeText(msg, 0, r * 0.72);
        ctx.fillText(msg, 0, r * 0.72);
        break;
      }
    }

    ctx.restore();
  }

  function drawSnackStoreCompass() {
    const dx = snackStoreObj.x - player.x;
    const dy = snackStoreObj.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 280) return;

    const ang = Math.atan2(dy, dx);
    const orbitR = player.radius * 1.55 + 28;
    const ax = player.x + Math.cos(ang) * orbitR;
    const ay = player.y + Math.sin(ang) * orbitR;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);

    const ready = player.radius >= snackStoreObj.type.minRadius;
    ctx.fillStyle = ready ? '#00e676' : '#ffca28';
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -11);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawTouchJoystick() {
    if (!joystickOrigin) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillStyle = 'rgba(30, 136, 229, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(joystickOrigin.x, joystickOrigin.y, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(pointerScreen.x, pointerScreen.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (gameState === 'playing') {
      update(dt);
    }
    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
