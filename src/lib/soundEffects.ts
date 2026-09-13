/**
 * Sound Effects Utility
 * Web Audio API synthesized chimes for RPG leveling, project completion, task checks, and daily bonuses.
 * Pure code synthesis ensures zero asset load delays, zero broken links, and reliable playback across all browsers.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      localStorage.removeItem('solo_audio_muted');
    } catch {
      // Ignore storage errors
    }
    this.muted = false;
  }

  private getContext(): AudioContext | null {
    if (this.muted) return null;

    try {
      if (!this.ctx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('solo_audio_muted', String(muted));
    } catch {
      // Ignore storage errors
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Plays the signature Level-Up chime:
   * Ascending crystalline arpeggio (C5 -> E5 -> G5 -> B5 -> C6 -> E6) paired with a deep resonant sub-bass surge.
   */
  public playLevelUp(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Warm Resonant Sub-Bass Surge
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(75, now);
      bassOsc.frequency.exponentialRampToValueAtTime(150, now + 0.35);
      bassOsc.frequency.exponentialRampToValueAtTime(38, now + 1.1);
      bassGain.gain.setValueAtTime(0.28, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 1.3);

      // 2. Ascending Crystal Octave Arpeggio
      const notes = [
        523.25, // C5
        659.25, // E5
        783.99, // G5
        987.77, // B5
        1046.50, // C6
        1318.51, // E6
        1567.98  // G6
      ];

      notes.forEach((freq, idx) => {
        const noteStart = now + 0.06 + idx * 0.075;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.9);
      });

      // 3. Shimmering High Harmonic Halo
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(2093.00, now + 0.45); // C7
      shimmerGain.gain.setValueAtTime(0.001, now + 0.45);
      shimmerGain.gain.linearRampToValueAtTime(0.09, now + 0.55);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(now + 0.45);
      shimmerOsc.stop(now + 1.45);
    } catch {
      // Gracefully ignore audio execution errors
    }
  }

  /**
   * Plays the Grand Project/Quest Completion Fanfare:
   * Triumphant harmonic major chord fanfare with reverberant resolution for 100% completion.
   */
  public playProjectComplete(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Low Grounding Brass Tone
      const rootOsc = ctx.createOscillator();
      const rootGain = ctx.createGain();
      rootOsc.type = 'triangle';
      rootOsc.frequency.setValueAtTime(130.81, now); // C3
      rootGain.gain.setValueAtTime(0.25, now);
      rootGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      rootOsc.connect(rootGain);
      rootGain.connect(ctx.destination);
      rootOsc.start(now);
      rootOsc.stop(now + 1.85);

      // 2. Majestic Ascending Chords (Phase 1: G-C-E, Phase 2: High C-E-G Fanfare)
      const chord1 = [261.63, 329.63, 392.00]; // C4 major
      const chord2 = [523.25, 659.25, 783.99, 1046.50]; // C5 major triumphant

      // First chord burst
      chord1.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.05);
        gain.gain.setValueAtTime(0.001, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.05);
        osc.stop(now + 0.75);
      });

      // Triumphant climax chord
      chord2.forEach((freq, i) => {
        const startTime = now + 0.28 + i * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.6);
      });
    } catch {
      // Gracefully ignore audio execution errors
    }
  }

  /**
   * Plays a crisp, subtle haptic check chime for completed tasks or daily checks.
   */
  public playTaskCheck(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.08); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Ignore audio execution errors
    }
  }

  /**
   * Plays a celestial chime for daily bonus XP grants.
   */
  public playDailyBonus(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 783.99, 1046.50]; // C5, G5, C6
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.14, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    } catch {
      // Ignore audio execution errors
    }
  }

  /**
   * Plays a softer, slower, and warmer robotic giggle / gentle chuckle.
   */
  public playRobotGiggle(intensity: number = 1): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Gentle, slower two-beat soft chuckle ("hee... hee...")
      const syllableCount = 2;
      const baseFreq = 420 + Math.random() * 60;
      const spacing = 0.16; // Slower cadence

      for (let i = 0; i < syllableCount; i++) {
        const startTime = now + i * spacing;
        const osc = ctx.createOscillator();
        const harmonic = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Warm, mellow lowpass filter to remove harshness
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1050 + (i === 0 ? 120 : 0), startTime);
        filter.Q.setValueAtTime(0.8, startTime);

        const freqGlide = baseFreq + (i * 24);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqGlide, startTime);
        osc.frequency.exponentialRampToValueAtTime(freqGlide * 1.15, startTime + 0.06);
        osc.frequency.exponentialRampToValueAtTime(freqGlide * 0.96, startTime + 0.13);

        harmonic.type = 'triangle';
        harmonic.frequency.setValueAtTime(freqGlide * 1.5, startTime);

        // Soft, gentle volume level
        const vol = Math.min(0.045, 0.024 * (intensity || 1));
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.138);

        osc.connect(filter);
        harmonic.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        harmonic.start(startTime);
        osc.stop(startTime + 0.14);
        harmonic.stop(startTime + 0.14);
      }
    } catch {
      // Ignore audio execution errors
    }
  }
}

export const soundEffects = new SoundEffectsManager();

export const playLevelUpSound = () => soundEffects.playLevelUp();
export const playProjectCompleteSound = () => soundEffects.playProjectComplete();
export const playTaskCheckSound = () => soundEffects.playTaskCheck();
export const playDailyBonusSound = () => soundEffects.playDailyBonus();
export const playRobotGiggleSound = (intensity?: number) => soundEffects.playRobotGiggle(intensity);
export const isSoundMuted = () => soundEffects.isMuted();
export const toggleSoundMute = () => soundEffects.toggleMute();
