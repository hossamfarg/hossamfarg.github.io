export class RoyalAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.delayNode = null;
    this.soundEnabled = true;
    this.musicEnabled = true;

    this.tempo = 82;
    this.targetTempo = 82;
    this.stepIndex = 0;
    this.barCount = 0;
    this.nextNoteTime = 0;
    this.isPlayingMusic = false;
    this.intensity = 0;
    this.timerID = null;

    this.bassScale = [73.42, 77.78, 92.50, 98.00, 110.00, 116.54, 130.81, 146.83];
    this.oudScale  = [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 523.25, 587.33, 622.25, 739.99];

    this.melodies = [
      [0, -1, 1, 2,  3, 2, 1, 0,   4, -1, 3, 2,  1, 2, 0, -1],
      [4, 4, 5, 4,   3, 2, 3, 4,   2, 1, 2, 3,   1, -1, 0, -1],
      [0, 2, 3, 4,   5, 4, 3, 2,   3, 4, 6, 4,   3, 2, 1, 0],
      [7, -1, 6, 5,  4, 3, 2, 3,   4, 2, 1, 0,   2, 1, 0, -1]
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.78;
      this.masterGain.connect(this.ctx.destination);

      this.delayNode = this.ctx.createDelay();
      this.delayNode.delayTime.value = 0.25;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.28;
      const damp = this.ctx.createBiquadFilter();
      damp.type = "lowpass";
      damp.frequency.value = 1900;

      this.delayNode.connect(damp);
      damp.connect(fb);
      fb.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  playCarriageMove() {
    if (!this.soundEnabled) return;
    this.init();
    this.playQuickNote(210, 340, 0.14, "triangle", 0.22, this.ctx.currentTime);
  }

  playBump() {
    if (!this.soundEnabled) return;
    this.init();
    this.playQuickNote(115, 52, 0.12, "sawtooth", 0.25, this.ctx.currentTime);
  }

  playBoarding() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [587.33, 739.99, 880.0].forEach((freq, idx) => this.playPluck(now + idx * 0.035, freq, 0.16, 0.14));
  }

  playDepart() {
    if (!this.soundEnabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [293.66, 369.99, 440.0, 587.33, 739.99].forEach((freq, idx) => this.playPluck(now + idx * 0.048, freq, 0.42, 0.18));
  }

  playRotate() {
    if (!this.soundEnabled) return;
    this.init();
    this.playQuickNote(350, 480, 0.085, "sine", 0.12, this.ctx.currentTime);
  }

  playQuickNote(fStart, fEnd, dur, type, vol, time) {
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(fStart, time);
      osc.frequency.exponentialRampToValueAtTime(fEnd, time + dur);
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(time); osc.stop(time + dur);
    } catch (e) {}
  }

  startMusic() {
    this.init();
    if (this.isPlayingMusic || !this.musicEnabled) return;
    this.isPlayingMusic = true;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.scheduler();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.timerID) clearTimeout(this.timerID);
  }

  setDangerLevel(dockFilled, totalDocks, yardRemaining, streak) {
    let bpm = 82;
    let level = 0;
    if (dockFilled >= 2 || streak >= 2) { bpm = 95; level = 1; }
    if (dockFilled >= 3 || streak >= 4) { bpm = 110; level = 2; }
    if (dockFilled >= totalDocks - 1)   { bpm = 128; level = 3; }
    if (yardRemaining <= 2 && yardRemaining > 0) { bpm = Math.max(bpm, 122); level = Math.max(level, 2); }
    this.intensity = level;
    this.targetTempo = Math.min(142, Math.max(78, bpm));
  }

  scheduler() {
    if (!this.isPlayingMusic) return;
    this.tempo += (this.targetTempo - this.tempo) * 0.12;
    const secondsPer16th = (60.0 / this.tempo) / 4.0;
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.stepIndex, this.nextNoteTime, secondsPer16th);
      this.nextNoteTime += secondsPer16th;
      this.stepIndex++;
      if (this.stepIndex >= 16) { this.stepIndex = 0; this.barCount = (this.barCount + 1) % 8; }
    }
    this.timerID = setTimeout(() => this.scheduler(), 25);
  }

  playStep(step, time, stepDur) {
    if (!this.musicEnabled || !this.ctx) return;
    if (step === 0 || step === 3 || step === 8) this.synthDoum(time, step === 0 ? 0.28 : 0.22);
    if (step === 4 || step === 12 || (this.intensity >= 1 && (step === 6 || step === 14))) this.synthTek(time, step === 4 || step === 12 ? 0.16 : 0.11);
    if (this.intensity >= 2 && (step === 7 || step === 11 || step === 15)) this.synthTek(time, 0.08, 420);
    if (step % 2 === 0 || this.intensity >= 3) {
      const openZill = step === 2 || step === 10;
      this.synthZill(time, openZill ? 0.09 : 0.03, openZill ? 0.055 : 0.03);
    }
    const bassPattern = [0, -1, 0, 0,  3, -1, 2, -1,  0, -1, 1, 2,  4, -1, 1, -1];
    const bDeg = bassPattern[step];
    if (bDeg !== -1 && (step % 2 === 0 || this.intensity >= 1)) {
      this.synthWarmBass(time, this.bassScale[bDeg], stepDur * 1.9, 0.16);
    }
    const motif = this.melodies[this.barCount % this.melodies.length];
    const mDeg = motif[step];
    if (mDeg !== -1 && (this.intensity >= 1 || step % 2 === 0 || step === 3 || step === 11)) {
      const freq = this.oudScale[mDeg];
      this.playPluck(time, freq, stepDur * 2.2, 0.10);
      if (this.intensity >= 2 && step % 4 === 0) this.playPluck(time + 0.015, freq * 1.5, stepDur * 1.5, 0.05);
    }
    if (step === 0 && this.barCount % 2 === 0) this.synthDronePad(time, 146.83, stepDur * 16, 0.045);
  }

  synthDoum(time, vol) {
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(145, time);
      osc.frequency.exponentialRampToValueAtTime(46, time + 0.16);
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(time); osc.stop(time + 0.19);
    } catch (e) {}
  }

  synthTek(time, vol, pitch = 310) {
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(110, time + 0.06);
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.065);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(time); osc.stop(time + 0.07);
    } catch (e) {}
  }

  synthZill(time, dur, vol) {
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(9200, time);
      filter.Q.value = 3.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      noise.connect(filter); filter.connect(g); g.connect(this.masterGain);
      noise.start(time);
    } catch (e) {}
  }

  synthWarmBass(time, freq, dur, vol) {
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(420 + this.intensity * 160, time);
      filter.frequency.exponentialRampToValueAtTime(140, time + dur);
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(filter); filter.connect(g); g.connect(this.masterGain);
      osc.start(time); osc.stop(time + dur + 0.01);
    } catch (e) {}
  }

  playPluck(time, freq, dur, vol) {
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc1.type = "triangle"; osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 1.003, time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, time);
      filter.frequency.exponentialRampToValueAtTime(600, time + dur);
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc1.connect(filter); osc2.connect(filter); filter.connect(g); g.connect(this.masterGain);
      if (this.delayNode) g.connect(this.delayNode);
      osc1.start(time); osc2.start(time);
      osc1.stop(time + dur + 0.02); osc2.stop(time + dur + 0.02);
    } catch (e) {}
  }

  synthDronePad(time, freq, dur, vol) {
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vol, time + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(time); osc.stop(time + dur);
    } catch (e) {}
  }
}
