import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Self-contained on purpose: this runs before any workspace package is built, and it must not
// import product code. It writes the WAV that Chromium plays as the "microphone" in the `app`
// project: 1 s silence, 3 s of a 130 Hz voice-like tone, 3 s at 260 Hz (one octave up), 1 s silence.
const SAMPLE_RATE = 48000;

function tone(freq: number, seconds: number): number[] {
  const count = Math.round(seconds * SAMPLE_RATE);
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    let sample = 0;
    for (let harmonic = 1; harmonic <= 5; harmonic += 1) {
      sample += Math.sin(2 * Math.PI * freq * harmonic * t) / harmonic;
    }
    out.push(0.3 * sample);
  }
  return out;
}

function silence(seconds: number): number[] {
  return Array.from({ length: Math.round(seconds * SAMPLE_RATE) }, () => 0);
}

function encodeWav(samples: number[]): Buffer {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + index * 2);
  }
  return buffer;
}

export default function globalSetup(): void {
  const target = resolve(import.meta.dirname, ".tmp/voice.wav");
  mkdirSync(dirname(target), { recursive: true });
  const samples = [...silence(1), ...tone(130, 3), ...tone(260, 3), ...silence(1)];
  writeFileSync(target, encodeWav(samples));
}
