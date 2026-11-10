/** Synthesized SFX tuning. Frequencies in Hz, times in seconds, gains 0..1. */
export const AUDIO = {
  masterGain: 0.5,
  cut: { freq: 1800, endFreq: 600, duration: 0.08, gain: 0.5, type: "sawtooth" as OscillatorType },
  star: { freqs: [880, 1174.7, 1568], noteLength: 0.09, gain: 0.35, type: "sine" as OscillatorType },
  bubbleEnter: { freq: 320, endFreq: 640, duration: 0.18, gain: 0.3, type: "sine" as OscillatorType },
  bubblePop: { freq: 900, endFreq: 150, duration: 0.09, gain: 0.4, type: "triangle" as OscillatorType },
  puff: { noiseDuration: 0.16, gain: 0.3, filterFreq: 900 },
  feed: { freqs: [523.25, 659.25, 783.99, 1046.5], noteLength: 0.11, gain: 0.4, type: "triangle" as OscillatorType },
  shatter: { noiseDuration: 0.28, gain: 0.45, filterFreq: 2600 },
  escape: { freq: 420, endFreq: 110, duration: 0.5, gain: 0.35, type: "square" as OscillatorType },
  click: { freq: 660, endFreq: 660, duration: 0.05, gain: 0.25, type: "sine" as OscillatorType }
} as const;
