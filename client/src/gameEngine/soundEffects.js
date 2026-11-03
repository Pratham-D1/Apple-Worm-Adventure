// ==========================================
// Apple Worm Adventure - Sound Effects (Web Audio API)
// ==========================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;

    // Load sound preference from localStorage
    try {
      const savedMute = localStorage.getItem('awa_muted');
      if (savedMute !== null) {
        this.isMuted = JSON.parse(savedMute);
      }
    } catch {
      this.isMuted = false;
    }
  }

  // Lazy initialize AudioContext on user gesture
  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('awa_muted', JSON.stringify(this.isMuted));
    } catch {
      // ignore storage errors
    }
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  // Play a synthesized tone
  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay restriction fallback
    }
  }

  // Worm Step Sound (Soft pop)
  playMove() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  // Apple Crunch Sound (Crisp ascending tone)
  playAppleEat() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(440, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.07);
      gain2.gain.setValueAtTime(0.15, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.2);
    } catch (e) {}
  }

  // Victory Fanfare (Celebratory melody)
  playVictory() {
    if (this.isMuted) return;
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },    // C5
      { f: 659.25, d: 0.12, t: 0.12 }, // E5
      { f: 783.99, d: 0.15, t: 0.24 }, // G5
      { f: 1046.5, d: 0.35, t: 0.38 }  // C6
    ];

    notes.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.f, 'triangle', note.d, 0.2);
      }, note.t * 1000);
    });
  }

  // Blocked / Invalid Move Sound (Low bump)
  playBlocked() {
    this.playTone(110, 'sawtooth', 0.09, 0.1);
  }

  // Portal Locked Sound (Chime warning)
  playPortalLocked() {
    this.playTone(330, 'sine', 0.15, 0.12);
  }

  // Undo Sound (Reverse pitch drop)
  playUndo() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // Failure Sound (Sad descending tones)
  playFailure() {
    if (this.isMuted) return;
    const notes = [
      { f: 330, d: 0.15, t: 0 },
      { f: 293.66, d: 0.15, t: 0.15 },
      { f: 220, d: 0.3, t: 0.3 }
    ];

    notes.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.f, 'sawtooth', note.d, 0.12);
      }, note.t * 1000);
    });
  }
}

export const sounds = new SoundManager();

