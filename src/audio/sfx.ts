import { AUDIO } from "../config/audio";

/**
 * All sound is synthesized with the Web Audio API — no audio assets.
 * The context is created lazily on first user gesture (autoplay policy).
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /** Call from a user gesture to unlock audio. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = AUDIO.masterGain;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  private get ready(): boolean {
    return !this.muted && this.ctx !== null && this.master !== null;
  }

  private tone(
    freq: number,
    endFreq: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    startAt = 0
  ): void {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + startAt;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + duration);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g).connect(this.master!);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  private noise(duration: number, gain: number, filterFreq: number): void {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t0 = ctx.currentTime;
    const samples = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / samples);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(filter).connect(g).connect(this.master!);
    src.start(t0);
  }

  private arpeggio(freqs: readonly number[], noteLength: number, gain: number, type: OscillatorType): void {
    freqs.forEach((f, i) => this.tone(f, f, noteLength, gain, type, i * noteLength));
  }

  cut(): void {
    const c = AUDIO.cut;
    this.tone(c.freq, c.endFreq, c.duration, c.gain, c.type);
  }
  star(): void {
    const c = AUDIO.star;
    this.arpeggio(c.freqs, c.noteLength, c.gain, c.type);
  }
  bubbleEnter(): void {
    const c = AUDIO.bubbleEnter;
    this.tone(c.freq, c.endFreq, c.duration, c.gain, c.type);
  }
  bubblePop(): void {
    const c = AUDIO.bubblePop;
    this.tone(c.freq, c.endFreq, c.duration, c.gain, c.type);
  }
  puff(): void {
    const c = AUDIO.puff;
    this.noise(c.noiseDuration, c.gain, c.filterFreq);
  }
  feed(): void {
    const c = AUDIO.feed;
    this.arpeggio(c.freqs, c.noteLength, c.gain, c.type);
  }
  shatter(): void {
    const c = AUDIO.shatter;
    this.noise(c.noiseDuration, c.gain, c.filterFreq);
  }
  escape(): void {
    const c = AUDIO.escape;
    this.tone(c.freq, c.endFreq, c.duration, c.gain, c.type);
  }
  click(): void {
    const c = AUDIO.click;
    this.tone(c.freq, c.endFreq, c.duration, c.gain, c.type);
  }
}
