import { RoyalAudio } from "./audio.js";
import { PALETTE, getLevelData, buildSolvablePassengerQueue } from "./levels.js";
import { RoyalRenderer } from "./renderer.js";

const audio = new RoyalAudio();

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.wrap = document.getElementById("canvas-wrap");
    this.renderer = new RoyalRenderer(this.ctx);

    this.gridCols = 7; this.gridRows = 7;
    this.carriages = []; this.departingCarriages = [];
    this.queue = []; this.dockSlots = 5; this.maxDockSlots = 6; this.dock = [];

    this.levelIndex = 0; this.autoCarousel = false; this.autoCarouselTimer = 0;
    this.queueOffset = 0; this.pulsePhase = 0;

    this.boosters = { shuffle: 3, vip: 2, slot: 1 };
    this.streak = 0; this.particles = []; this.floatingTexts = [];

    this.initLayout(); this.bindEvents(); this.loadLevel(0);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  initLayout() {
    const rect = this.wrap.getBoundingClientRect();
    this.width = rect.width || 420; this.height = rect.height || 660;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.stationH = Math.min(112, Math.max(92, this.height * 0.175));
    this.dockH = Math.min(88, Math.max(76, this.height * 0.135));
    this.yardY = this.stationH + this.dockH + 10;
    this.yardH = this.height - this.yardY - 10;

    const pad = 16;
    this.cellSize = Math.floor(Math.min((this.width - pad * 2) / this.gridCols, (this.yardH - pad * 2) / this.gridRows));
    this.yardX = Math.floor((this.width - this.cellSize * this.gridCols) / 2);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.initLayout());
    const unlockAudio = () => {
      audio.init();
      if (audio.musicEnabled && !audio.isPlayingMusic) audio.startMusic();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    this.canvas.addEventListener("pointerdown", (e) => {
      unlockAudio();
      const rect = this.canvas.getBoundingClientRect();
      this.handleClick(e.clientX - rect.left, e.clientY - rect.top);
    });

    document.getElementById("btn-music").onclick = () => {
      audio.init();
      audio.musicEnabled = !audio.musicEnabled;
      document.getElementById("music-lbl").innerText = audio.musicEnabled ? "On" : "Off";
      document.getElementById("btn-music").classList.toggle("active", audio.musicEnabled);
      if (audio.musicEnabled) audio.startMusic(); else audio.stopMusic();
    };

    document.getElementById("btn-sound").onclick = (e) => {
      audio.soundEnabled = !audio.soundEnabled;
      e.currentTarget.innerText = audio.soundEnabled ? "🔊" : "🔇";
    };

    document.getElementById("btn-restart").onclick = () => this.restartLevel();
    document.getElementById("btn-rotate-queue").onclick = () => this.rotatePassengerQueue();
    window.addEventListener("keydown", (e) => { if (e.key === "r" || e.key === "R") this.rotatePassengerQueue(); });

    const autoBtn = document.getElementById("btn-auto-carousel");
    autoBtn.onclick = () => {
      this.autoCarousel = !this.autoCarousel;
      autoBtn.innerText = this.autoCarousel ? "🎠 Auto: ON" : "🎠 Auto: OFF";
      autoBtn.classList.toggle("toggled", this.autoCarousel);
    };

    document.getElementById("btn-shuffle").onclick = () => this.useShuffle();
    document.getElementById("btn-vip").onclick = () => this.useVipPull();
    document.getElementById("btn-slot").onclick = () => this.useExtraSlot();

    document.getElementById("btn-next-level").onclick = () => {
      document.getElementById("modal-win").classList.remove("show");
      this.loadLevel(this.levelIndex + 1);
    };
    document.getElementById("btn-retry-lose").onclick = () => {
      document.getElementById("modal-lose").classList.remove("show");
      this.restartLevel();
    };
    document.getElementById("btn-free-bay").onclick = () => {
      document.getElementById("modal-lose").classList.remove("show");
      this.useExtraSlot(true);
    };
  }

  loadLevel(idx) {
    this.levelIndex = idx;
    const lvl = getLevelData(idx);
    document.getElementById("stage-indicator").innerText = lvl.stage;
    document.getElementById("level-title-text").innerText = lvl.name;
    this.gridCols = lvl.grid; this.gridRows = lvl.grid;
    this.initLayout();
    this.dock = []; this.departingCarriages = []; this.dockSlots = 5; this.streak = 0;
    this.carriages = lvl.carriages.map(c => ({ ...c, occupancy: 0, bumpOffset: 0 }));
    this.queue = buildSolvablePassengerQueue(this.carriages, this.gridCols);
    this.updateBoosterUI();
    audio.setDangerLevel(this.dock.length, this.dockSlots, this.carriages.length, this.streak);
  }

  restartLevel() { this.loadLevel(this.levelIndex); }

  rotatePassengerQueue() {
    if (this.queue.length <= 1) return;
    audio.playRotate();
    this.queueOffset = 1.0;
    this.queue.push(this.queue.shift());
    this.addFloatingText("Queue Cycled ↻", this.width / 2, this.stationH * 0.5, "#ffe885");
    this.checkBoardingProcess();
  }

  handleClick(px, py) {
    if (py < this.stationH) { this.rotatePassengerQueue(); return; }
    if (px < this.yardX || px > this.yardX + this.cellSize * this.gridCols || py < this.yardY || py > this.yardY + this.cellSize * this.gridRows) return;
    const c = Math.floor((px - this.yardX) / this.cellSize);
    const r = Math.floor((py - this.yardY) / this.cellSize);
    const hit = this.carriages.find(car => {
      const isH = car.dir === "LEFT" || car.dir === "RIGHT";
      return isH ? (r === car.r && c >= car.c && c < car.c + car.length) : (c === car.c && r >= car.r && r < car.r + car.length);
    });
    if (hit) this.tryDispatchCarriage(hit);
  }

  tryDispatchCarriage(car) {
    if (this.dock.length + this.departingCarriages.length >= this.dockSlots) {
      audio.playBump();
      this.addFloatingText("Holding Bays Full!", this.width / 2, this.stationH + this.dockH - 10, "#ff4757");
      return;
    }
    const blocker = this.getBlockingCarriage(car);
    if (blocker) {
      audio.playBump();
      car.bumpOffset = (car.dir === "UP" || car.dir === "LEFT") ? -9 : 9;
      blocker.flashTimer = 1.0;
      setTimeout(() => { car.bumpOffset = 0; }, 110);
      return;
    }
    audio.playCarriageMove();
    const idx = this.carriages.indexOf(car);
    if (idx > -1) {
      this.carriages.splice(idx, 1);
      const isH = car.dir === "LEFT" || car.dir === "RIGHT";
      this.departingCarriages.push({
        car,
        px: this.yardX + car.c * this.cellSize,
        py: this.yardY + car.r * this.cellSize,
        vx: car.dir === "LEFT" ? -19 : (car.dir === "RIGHT" ? 19 : 0),
        vy: car.dir === "UP"   ? -19 : (car.dir === "DOWN"  ? 19 : 0),
        isH
      });
    }
  }

  getBlockingCarriage(car) {
    const yard = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(null));
    this.carriages.forEach(c => {
      const isH = c.dir === "LEFT" || c.dir === "RIGHT";
      for (let i = 0; i < c.length; i++) yard[isH ? c.r : c.r + i][isH ? c.c + i : c.c] = c;
    });
    if (car.dir === "UP") { for (let r = car.r - 1; r >= 0; r--) if (yard[r][car.c] && yard[r][car.c].id !== car.id) return yard[r][car.c]; }
    else if (car.dir === "DOWN") { for (let r = car.r + car.length; r < this.gridRows; r++) if (yard[r][car.c] && yard[r][car.c].id !== car.id) return yard[r][car.c]; }
    else if (car.dir === "LEFT") { for (let c = car.c - 1; c >= 0; c--) if (yard[car.r][c] && yard[car.r][c].id !== car.id) return yard[car.r][c]; }
    else if (car.dir === "RIGHT") { for (let c = car.c + car.length; c < this.gridCols; c++) if (yard[car.r][c] && yard[car.r][c].id !== car.id) return yard[car.r][c]; }
    return null;
  }

  checkBoardingProcess() {
    while (this.queue.length > 0) {
      const matchCar = this.dock.find(c => c.color === this.queue[0] && c.occupancy < c.cap);
      if (matchCar) {
        this.queue.shift(); this.queueOffset = 1.0;
        matchCar.occupancy++;
        audio.playBoarding();
        this.createSparks(65, this.stationH * 0.78, PALETTE[matchCar.color].hi);
        if (matchCar.occupancy >= matchCar.cap) {
          audio.playDepart();
          const slotIdx = this.dock.indexOf(matchCar);
          const slotW = (this.width - 24) / this.maxDockSlots;
          this.createSparks(12 + slotIdx * slotW + slotW / 2, this.stationH + 45, "#ffe885", 24);
          this.dock.splice(slotIdx, 1);
          this.streak++;
          this.addFloatingText("CHARIOT DEPARTED! 👑", this.width / 2, this.stationH + 25, "#ffe885");
        }
      } else break;
    }
    audio.setDangerLevel(this.dock.length, this.dockSlots, this.carriages.length, this.streak);
    if (this.carriages.length === 0 && this.departingCarriages.length === 0 && this.dock.length === 0 && this.queue.length === 0) {
      setTimeout(() => document.getElementById("modal-win").classList.add("show"), 350);
      return;
    }
    if (this.dock.length >= this.dockSlots && this.departingCarriages.length === 0) {
      const canBoard = this.queue.length > 0 && this.dock.some(c => c.color === this.queue[0] && c.occupancy < c.cap);
      if (!canBoard) setTimeout(() => document.getElementById("modal-lose").classList.add("show"), 450);
    }
  }

  useShuffle() {
    if (this.boosters.shuffle <= 0 || this.carriages.length === 0) return;
    this.boosters.shuffle--; this.updateBoosterUI(); audio.playRotate();
    this.carriages.forEach(c => {
      if (c.dir === "UP") c.dir = "DOWN"; else if (c.dir === "DOWN") c.dir = "UP";
      else if (c.dir === "LEFT") c.dir = "RIGHT"; else if (c.dir === "RIGHT") c.dir = "LEFT";
    });
    this.addFloatingText("DIRECTIONS FLIPPED! 🔀", this.width / 2, this.yardY + 36, "#ffe885");
  }

  useVipPull() {
    if (this.boosters.vip <= 0 || this.dock.length === 0) return;
    this.boosters.vip--; this.updateBoosterUI();
    const targetCar = this.dock[0];
    if (targetCar) {
      const needed = targetCar.cap - targetCar.occupancy; let pulled = 0;
      for (let i = this.queue.length - 1; i >= 0 && pulled < needed; i--) {
        if (this.queue[i] === targetCar.color) { this.queue.splice(i, 1); pulled++; }
      }
      targetCar.occupancy += pulled; audio.playDepart();
      if (targetCar.occupancy >= targetCar.cap) {
        this.dock.shift();
        this.addFloatingText("VIP CHARIOT CLEARED! ✨", this.width / 2, this.stationH + 30, "#ffe885");
      }
    }
    this.checkBoardingProcess();
  }

  useExtraSlot(free = false) {
    if (!free && this.boosters.slot <= 0) return;
    if (this.dockSlots >= this.maxDockSlots) return;
    if (!free) this.boosters.slot--;
    this.dockSlots++; this.updateBoosterUI(); audio.playBoarding();
    this.addFloatingText("+1 ROYAL BAY UNLOCKED!", this.width / 2, this.stationH + 30, "#68e89e");
  }

  updateBoosterUI() {
    document.getElementById("count-shuffle").innerText = `${this.boosters.shuffle} left`;
    document.getElementById("count-vip").innerText = `${this.boosters.vip} left`;
    document.getElementById("count-slot").innerText = `${this.boosters.slot} left`;
  }

  createSparks(x, y, color = "#ffe885", count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.0, size: 2 + Math.random() * 2.5, color: Math.random() > 0.35 ? color : "#ffffff" });
    }
  }

  addFloatingText(str, x, y, color) { this.floatingTexts.push({ str, x, y, life: 1.0, color }); }

  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.pulsePhase += 0.07;
    if (this.autoCarousel) {
      this.autoCarouselTimer += 16.6;
      if (this.autoCarouselTimer > 2400) { this.autoCarouselTimer = 0; this.rotatePassengerQueue(); }
    }
    this.queueOffset *= 0.84;
    for (let i = this.departingCarriages.length - 1; i >= 0; i--) {
      const d = this.departingCarriages[i]; d.px += d.vx; d.py += d.vy;
      this.createSparks(d.px + this.cellSize / 2, d.py + this.cellSize / 2, PALETTE[d.car.color].trim, 1);
      const outOfYard = d.px < this.yardX - this.cellSize * 2 || d.px > this.yardX + this.gridCols * this.cellSize + this.cellSize || d.py < this.yardY - this.cellSize * 2 || d.py > this.yardY + this.gridRows * this.cellSize + this.cellSize;
      if (outOfYard) { this.departingCarriages.splice(i, 1); this.dock.push(d.car); this.checkBoardingProcess(); }
    }
    this.renderer.renderStation(this);
    this.renderer.renderDock(this, audio.tempo);
    this.renderer.renderYard(this);
    this.renderer.renderFX(this);
    requestAnimationFrame(this.loop);
  }
}

window.addEventListener("DOMContentLoaded", () => new Game());
