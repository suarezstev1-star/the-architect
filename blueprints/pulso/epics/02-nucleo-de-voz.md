# Epic 02: Núcleo de voz

> El navegador captura el micrófono, detecta el tono, dibuja la voz del usuario en vivo con la línea fantasma y calcula localmente frecuencia, muletillas, ritmo y pausas.

| | |
|---|---|
| **Epic id** | `02-nucleo-de-voz` |
| **Tasks** | `E2-T1` … `E2-T5` (5 tareas) |
| **Depends on** | `01-fundacion` |
| **Unlocks** | `03-coaching-y-lanzamiento` |
| **Parallel with** | ninguna |

No necesitas ningún otro archivo para completar esta épica. Todo lo que sigue se repite aquí a propósito.

---

## Stack

SPA Vite + React + TypeScript + Tailwind 4 (web, Firebase Hosting) · Hono sobre Node 24 en Cloud Run (server) · Firestore con el SDK oficial, sin ORM · Firebase Auth (solo Google) · STT v2 de Google Cloud · Gemini vía `@google/genai` en Vertex · `packages/shared` (zod, DSP puro, fórmulas). Gestor de paquetes: `pnpm`. Runtime fijado en `.nvmrc` (24). Las versiones están en `pnpm-lock.yaml`: léelo, nunca adivines una.

| Tarea | Comando |
|---|---|
| Instalar | `pnpm install --frozen-lockfile` |
| Desarrollo | `pnpm dev` (web en http://127.0.0.1:5173, servidor en http://127.0.0.1:8787) · emuladores: `pnpm emulators` |
| Typecheck | `pnpm typecheck` |
| Lint / formato | `pnpm lint` · `pnpm format` |
| Pruebas unitarias | `pnpm test:unit` · un archivo: `pnpm test:unit <ruta>` |
| Pruebas con emuladores | `pnpm test:emu` (Auth, Firestore y Storage; requiere JDK 21+) |
| E2E | `pnpm test:e2e` (proyecto `ui`) · `pnpm test:e2e:full <ruta>` (pila completa) |
| Build | `pnpm build` |
| Humo del servidor | `node scripts/smoke-server.mjs` |

**Gate:** `pnpm typecheck && pnpm lint && pnpm test` pasa antes de marcar cualquier tarea como hecha.

Si alguna verificación usa un servicio (emuladores de Firebase), arráncalo con `pnpm test:emu` (se levanta y se apaga solo) o `pnpm emulators`. El archivo que lo define (`firebase.json`) ya está en la raíz: no lo escribes, y nunca sustituyes por un doble un servicio que los criterios de aceptación nombran.

## Directory subtree

Solo lo que toca esta épica:

```
packages/shared/src/
  index.ts                # se edita en cada paso (reexporta los módulos nuevos)
  constants.ts            # NUEVO paso 8: SAMPLE_RATE, FRAME_MS, FRAME_SAMPLES, WINDOW_SECONDS, DATA_HZ, MAX_SESSION_SECONDS, BYTES_PER_SECOND
  dsp/resample.ts, frames.ts, synth.ts, wav.ts   # NUEVO paso 8
  dsp/yin.ts, pitch.ts    # NUEVO paso 9
  monitor/series.ts, geometry.ts, flatline.ts    # NUEVO paso 10
  profiles.ts, ghost/marks.ts, generate.ts, tracking.ts   # NUEVO paso 11
  meters/vad.ts, rhythm.ts, frequency.ts, fillers.ts      # NUEVO paso 12
apps/web/src/
  audio/capture.worklet.ts, worklet-url.ts, MicCapture.ts, mic-messages.ts   # NUEVO paso 8
  monitor/MonitorCanvas.tsx, useLiveMonitor.ts               # NUEVO paso 10
  monitor/ghostDraw.ts, ProfileSelect.tsx                    # NUEVO paso 11
  meters/Meters.tsx                                          # NUEVO paso 12
  routes/Monitor.tsx      # reescribe el marcador de los pasos 6 y 7 (paso 10), se edita en 12
  i18n/es.ts              # existe, se edita en los pasos 8, 10, 11 y 12
apps/web/tests/setup.ts          # existe: ya sustituye src/audio/worklet-url.ts con vi.mock para toda prueba web (paso 8 en adelante)
tests/e2e/ui/worklet.spec.ts    # NUEVO paso 8 (bundle de producción servido por vite preview)
tests/e2e/app/monitor.spec.ts   # NUEVO paso 10
```

Todo lo que quede fuera de este subárbol está fuera de alcance. Si una tarea parece exigir editar un archivo que no aparece, detente y repórtalo: el límite de la épica está mal.

## Data model touched here

| Entidad | Campos que esta épica lee | Notas |
|---|---|---|
| `orgs/{orgId}/voiceSheet/{profileId}` | medianHz, greenLowHz, greenHighHz, targetPpmMin, targetPpmMax | Opcional hasta la semana de línea base: sin ficha, el monitor usa la referencia provisional (mediana de 2 s de voz) y la zona se muestra como "midiendo" |
| `sessions.contour` | array de enteros (semitonos × 10) a 10 Hz | Esta épica solo define su forma; lo escribe el paso 15 |

## Contracts

**Consumed** — ya existe, no lo reconstruyas:

| From | Interface | Guarantee |
|---|---|---|
| `01-fundacion` | `RequireAuth`, `AppShell`, `routes.ts`, `es.ts`, tokens CSS | Rutas protegidas, shell accesible, colores solo por variables CSS |

**Produced** — las épicas posteriores dependen exactamente de estas firmas:

| Export | Signature | Used by |
|---|---|---|
| `@pulso/shared` → `StreamResampler`, `FrameAssembler`, `encodeWavPcm16`, `decodeWavPcm16`, `sine/voice/whiteNoise/silence/concat` | DSP puro | `03` |
| `@pulso/shared` → `yin`, `PitchTracker`, `hzToSemitones` | tono y semitonos relativos | `03` |
| `@pulso/shared` → `generateGhost`, `heuristicMarks`, `trackingScore`, `PROFILES`, `PROFILE_IDS` | fantasma determinista y seguimiento | `03` |
| `@pulso/shared` → `countFillers`, `LiveFillerCounter`, `computeRhythm`, `Vad`, `computeGreenZone`, `classifyHz` | medidores locales | `03` |
| `apps/web/src/audio/MicCapture.ts` → `MicCapture.start(onFrame)` | tramas `{ pcm: Int16Array(1600), rms }` cada 100 ms | `03` |
| `apps/web/src/monitor/useLiveMonitor.ts` | `{ estado, series, ultimaMuestra, tono, iniciar, detener }` | `03` |

## Conventions that bite in this area

- **La lógica numérica es pura y vive en `packages/shared`**; el worklet y `MicCapture` son cables finos. Se prueba con señales generadas (`synth.ts`), no con micrófono.
- **Lee siempre `audioContext.sampleRate` real**: pedir 16 kHz puede lanzar o ser ignorado; el remuestreo a 16 kHz lo hace el `FrameAssembler`.
- **No cambies de ruta ni de hash mientras se captura** (bug WebKit 215884 en PWA de iOS: el permiso del micrófono se pierde).
- **Datos a 10 Hz, render a 60 fps**: el estado de React se actualiza como máximo 10 veces por segundo; el dibujo corre en `requestAnimationFrame` con refs.
- **El resumen de texto en vivo es `aria-live="polite"` y se actualiza como máximo cada 2 s**; el canvas es decorativo para lectores de pantalla.
- **Señal = línea sólida ≈3 px + etiqueta "TÚ"; fantasma = punteada ≈2 px + marcadores + etiqueta "FANTASMA"**: nunca solo color. La línea plana no parpadea: cambia de color y de texto.
- **La fantasma es determinista** (sin `Math.random`): misma entrada, misma salida. Gemini solo aporta marcas (paso 16), nunca el dibujo.

### Diseño (tabla literal)

Paleta (hex literales; los contrastes son razones WCAG 2.x calculadas sobre bg / surface / surface2):

| Token | Oscuro | Claro | Contraste oscuro (bg / surface / surface2) | Contraste claro (bg / surface / surface2) |
|---|---|---|---|---|
| bg | `#0B0D0C` | `#F7F3EA` | — | — |
| surface | `#121614` | `#FFFDF8` | — | — |
| surface2 | `#1A201D` | `#EDE6D6` | — | — |
| text | `#F2EDE3` | `#1A1B19` | 16.71 / 15.64 / 14.19 | 15.61 / 17.01 / 13.90 |
| text-secondary | `#A9B0A9` | `#55584F` | 8.79 / 8.23 / 7.47 | 6.55 / 7.14 / 5.83 |
| signal | `#3DDC84` | `#0B7A43` | 10.93 / 10.23 / 9.28 | 4.89 / 5.33 / 4.35 |
| ghost | `#E8C873` | `#7A5A00` | 12.01 / 11.25 / 10.20 | 5.76 / 6.28 / 5.13 |
| alert | `#FF6B81` | `#C8102E` | 7.12 / 6.67 / 6.05 | 5.31 / 5.79 / 4.73 |
| border-strong | `#5F7A70` | `#7A7A6C` | 4.18 / 3.91 / 3.55 | 3.93 / 4.28 / 3.50 |
| focus | `#7CC4FF` | `#0B5FB0` | 10.40 / 9.73 / 8.83 | 5.78 / 6.30 / 5.15 |
| hairline (decorativo, exento) | `#232B27` | `#D9D1BF` | — | — |

Objetivos: texto ≥ 4.5:1; texto grande, borde fuerte, foco y gráficos ≥ 3:1. Señal (sólida, ≈3 px, etiqueta "TÚ") y fantasma (punteada, ≈2 px, marcadores, etiqueta "FANTASMA") tienen casi la misma luminosidad (≈1.1:1 entre sí en oscuro): **nunca solo color**.

Reglas completas del proyecto: `CLAUDE.md`. Reglas por área: `.claude/rules/*.md`. Ambos están en la raíz del proyecto (el constructor los copió desde `workspace/` antes de la primera tarea).

---

## Tasks

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba abajo y no reordenes por prioridad.

### `E2-T1` — Captura de micrófono con AudioWorklet

**Depends on:** `E1-T7` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-08-mic-capture`

El navegador captura el micrófono, remuestrea a 16 kHz y entrega tramas de 100 ms en Int16 con su RMS, con la lógica numérica pura y probada en el paquete compartido.

Captura de micrófono con AudioWorklet. Decisión: **toda la lógica numérica vive en `packages/shared` y es pura** (se prueba con señales generadas); el worklet y `MicCapture` son cables finos alrededor de ella.

- `packages/shared/src/constants.ts` — `SAMPLE_RATE = 16000`, `FRAME_MS = 100`, `FRAME_SAMPLES = 1600`, `WINDOW_SECONDS = 8`, `DATA_HZ = 10`, `MAX_SESSION_SECONDS = 270`, `BYTES_PER_SECOND = 32000`.
- `packages/shared/src/dsp/resample.ts` — `class StreamResampler(inputRate, outputRate)` con `process(block: Float32Array): Float32Array`; interpolación lineal con estado entre bloques (fase fraccionaria y última muestra), identidad cuando las tasas coinciden. Limitación declarada: sin filtro antialias (aceptable para tono de voz; el RMS y YIN no dependen de >8 kHz).
- `packages/shared/src/dsp/frames.ts` — `class FrameAssembler(inputRate)`: `push(block: Float32Array): Frame[]` donde `Frame = { pcm: Int16Array /* 1600 */, rms: number /* 0..1 sobre la señal float */ }`; remuestrea a 16 kHz, acumula y emite tramas de exactamente 1600 muestras sin pérdida ni duplicación entre bloques de tamaño arbitrario; convierte a Int16 con saturación (`round(clamp(x,-1,1)*32767)`).
- `packages/shared/src/dsp/synth.ts` — generadores deterministas para pruebas: `sine(freq, seconds, rate, amp)`, `voice(f0, seconds, rate, { harmonics: 6 })` (armónicos con amplitud 1/h), `silence`, `whiteNoise(seconds, rate, amp, seed)` con PRNG sembrado (mulberry32), `concat(...)`.
- `packages/shared/src/dsp/wav.ts` — `encodeWavPcm16(samples: Int16Array, sampleRate): Uint8Array` (cabecera RIFF/fmt/data canónica de 44 bytes, mono) y `decodeWavPcm16(bytes): { sampleRate, samples: Int16Array }` que lanza `WavError` si falta `RIFF`/`WAVE`, si no es PCM16 mono o si el `data` está truncado. (No se usa la librería `wavefile`: un codificador de 40 líneas evita una dependencia sin mantenimiento.)
- `packages/shared/src/index.ts` (editar) — reexporta `constants`, `dsp/resample`, `dsp/frames`, `dsp/synth` y `dsp/wav`.
- Pruebas junto a cada módulo (`resample.test.ts`, `frames.test.ts`, `wav.test.ts`).
- `apps/web/src/audio/capture.worklet.ts` — registra el procesador `pulso-capture` (`registerProcessor`). No importa tipos DOM de worklet: accede a `AudioWorkletProcessor`, `registerProcessor` y `sampleRate` a través de `globalThis` con un tipo local mínimo (el `lib.dom` no los declara). Dentro: `new FrameAssembler(processorOptions.inputRate)`; en `process(inputs)` toma el canal 0 y por cada trama completa hace `port.postMessage({ pcm, rms }, [pcm.buffer])`. Se importa con `import workletUrl from "./capture.worklet.ts?worker&url"` (Vite compila el worklet como módulo aparte) **únicamente en `apps/web/src/audio/worklet-url.ts`** (`export { default as workletUrl }`): ese es el único módulo con el sufijo `?worker&url`, para que ninguna prueba de Vitest lo cargue (`apps/web/tests/setup.ts`, ya emitido, lo sustituye en toda prueba web con `vi.mock("../src/audio/worklet-url.ts", () => ({ workletUrl: "/worklet.js" }))`; ninguna prueba lo repite).
- `apps/web/src/audio/MicCapture.ts` — `class MicCapture` (recibe `workletUrl: string` por constructor; **no** importa `worklet-url.ts`) con `start(onFrame): Promise<void>` y `stop()`. `start`: `getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } })`; crea `new AudioContext()` (intenta `{ sampleRate: 16000 }` en un `try/catch` y **lee siempre `audioContext.sampleRate` real**), `audioWorklet.addModule(workletUrl)`, `new AudioWorkletNode(ctx, "pulso-capture", { processorOptions: { inputRate: ctx.sampleRate } })`, conecta la fuente al nodo (sin conectar a `destination`). `NotAllowedError` → `MicError("permission-denied")`; `NotFoundError` → `MicError("no-device")`; otro → `MicError("unknown")`. `stop()` detiene pistas, cierra el contexto. **No cambia de ruta ni de hash mientras captura** (bug WebKit 215884).
- `apps/web/src/audio/mic-messages.ts` — mapea `MicError.reason` a la clave de `es.ts` (`mic.denied`, `mic.noDevice`, `mic.unknown`); `es.ts` recibe los textos (permiso denegado explica cómo reactivarlo en el navegador).
- `tests/e2e/ui/worklet.spec.ts` — se ejecuta contra el **bundle de producción** que sirve `vite preview` (`playwright.config.ts` ya añade ese `webServer` en el puerto 4173 cuando existe `apps/web/dist`; el proyecto `ui` sigue siendo el predeterminado). No importa código del producto: con `node:fs` busca en `apps/web/dist/assets` el archivo `.js` que contiene `registerProcessor` y, en la página `http://127.0.0.1:4173/entrar`, ejecuta `const ctx = new AudioContext(); await ctx.audioWorklet.addModule('/assets/<archivo>'); new AudioWorkletNode(ctx, 'pulso-capture')`, que debe resolverse sin error (el contrato del service worker lo ejerce `tests/e2e/ui/pwa.spec.ts`, paso 7).

**Una sola sentada:** cuatro módulos de DSP puro con el mismo patrón de prueba (señal generada → resultado exacto) y dos cables finos de navegador; el worklet se ejerce con una única especificación.

**Files**
- `packages/shared/src/dsp/**` — nuevo o editado según el detalle anterior
- `packages/shared/src/constants.ts` — nuevo o editado según el detalle anterior
- `packages/shared/src/index.ts` — nuevo o editado según el detalle anterior
- `apps/web/src/**` — nuevo o editado según el detalle anterior
- `tests/e2e/ui/worklet.spec.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `StreamResampler` converts a generated 440 Hz sine from 48000 Hz and from 44100 Hz to 16000 Hz in blocks of 128 samples **THE SYSTEM SHALL** output 16000 samples per second of input (plus or minus 1) with a zero-crossing frequency of 440 Hz plus or minus 1 percent, and **WHEN** both rates are 16000 **THE SYSTEM SHALL** return the input unchanged.
2. **WHEN** `FrameAssembler` is fed blocks of arbitrary sizes totalling 3 s of a 0.5-amplitude sine at 48000 Hz **THE SYSTEM SHALL** emit exactly 30 frames of 1600 Int16 samples with `rms` equal to 0.5/sqrt(2) plus or minus 2 percent, emit `rms` 0 for silence, and drop or duplicate no sample across block boundaries.
3. **WHEN** `encodeWavPcm16` output is passed to `decodeWavPcm16` **THE SYSTEM SHALL** return the same sample rate and identical samples, and **WHEN** the bytes lack a `RIFF` header or are truncated **THE SYSTEM SHALL** throw `WavError`.
4. **WHEN** `getUserMedia` rejects with `NotAllowedError` **THE SYSTEM SHALL** make `MicCapture.start()` reject with a `MicError` whose `reason` is `permission-denied`, mapped to the Spanish message key `mic.denied` of `es.ts`.
5. **WHEN** the `AudioContext` reports a `sampleRate` different from 16000 **THE SYSTEM SHALL** pass that real rate to the worklet as `processorOptions.inputRate` (asserted with a fake `AudioContext`).
6. **WHEN** `pnpm test:e2e tests/e2e/ui/worklet.spec.ts` runs against the production bundle served by `vite preview` on port 4173 **THE SYSTEM SHALL** load the built worklet file in a real `AudioContext` with `audioWorklet.addModule` and construct `new AudioWorkletNode(ctx, 'pulso-capture')` without error.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
grep -rl registerProcessor apps/web/dist/assets
pnpm test:e2e tests/e2e/ui/worklet.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 8: mic-capture"
git tag step-08-mic-capture
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-08-mic-capture`.

### `E2-T2` — Tono con YIN, mediana y semitonos

**Depends on:** `E2-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-09-pitch-yin`

Una trama de 100 ms produce un tono en Hz y en semitonos relativos a la mediana del usuario, estable frente a saltos de octava y ruido, con presupuesto de latencia medido.

Detección de tono: YIN + mediana de 5 + corrección de octava + semitonos relativos. Todo en `packages/shared/src/dsp`, puro y probado con frecuencias conocidas.

- `packages/shared/src/dsp/yin.ts` — `yin(frame: Float32Array, sampleRate: number, opts?: { fmin?: number /* 70 */; fmax?: number /* 500 */; threshold?: number /* 0.15 */ }): { freq: number | null; probability: number }`. Algoritmo: `tauMax = floor(sampleRate / fmin)`, `tauMin = floor(sampleRate / fmax)`, ventana `W = frame.length - tauMax`; diferencia `d(τ) = Σ_{j<W} (x[j] − x[j+τ])²`; diferencia normalizada acumulada `d'(τ) = d(τ) · τ / Σ_{k≤τ} d(k)` con `d'(0) = 1`; primer `τ ≥ tauMin` con `d'(τ) < threshold` que además sea mínimo local; si ninguno cumple devuelve `{ freq: null, probability: 0 }` (sin voz); interpolación parabólica sobre `d'` alrededor de `τ`; `freq = sampleRate / τ'`, `probability = 1 − d'(τ)`.
- `packages/shared/src/dsp/pitch.ts` — `hzToSemitones(hz, referenceHz) = 12 * log2(hz / referenceHz)`; `median(values)`; `class PitchTracker({ referenceHz?: number, silenceRms: 0.01 })` con `push({ pcm: Int16Array, rms }, tMs): PitchSample` donde `PitchSample = { tMs, hz: number | null, semitones: number | null, rms, voiced: boolean }`. Reglas: trama con `rms < silenceRms` → no sonora; si no, `yin` sobre `pcm/32768`; la salida es la **mediana de las últimas 5 estimaciones sonoras** (ventana deslizante que ignora las no sonoras); **corrección de octava**: si la estimación nueva está a 12 ± 1 semitonos de la mediana vigente (arriba o abajo), se pliega multiplicando o dividiendo por 2 antes de entrar en la ventana. La referencia: `referenceHz` si se pasó (viene de la ficha vocal); si no, se **fija** como la mediana de las primeras 20 estimaciones sonoras (2 s de voz) y se expone `tracker.referenceHz`; mientras no esté fijada, `semitones` se calcula contra la mediana provisional.
- `packages/shared/src/dsp/yin.test.ts`, `pitch.test.ts` — usan `sine`, `voice`, `whiteNoise` de `synth.ts`: seno puro a 85/120/180/220/300/440 Hz (±10 cents, probabilidad ≥ 0.9), voz de 110 Hz con ruido a SNR 20 dB (±25 cents), silencio y ruido blanco (`freq: null`), secuencia con un salto de octava aislado (sin saltos > 2 semitonos en la salida), `hzToSemitones` en 0, +12 y −12.
- `packages/shared/src/dsp/latency.test.ts` — procesa 600 tramas de voz sintética de 1600 muestras con `performance.now()` y afirma `p95 < 20 ms` por trama (presupuesto: 20 % del periodo de 100 ms). Si esta prueba falla en una máquina lenta, se optimiza `yin` (p. ej. limitar `tauMax`), nunca se sube el umbral.
- `packages/shared/src/index.ts` (editar) — reexporta `dsp/yin` y `dsp/pitch`.

**Files**
- `packages/shared/src/dsp/yin.ts` — nuevo o editado según el detalle anterior
- `packages/shared/src/dsp/pitch.ts` — nuevo o editado según el detalle anterior
- `packages/shared/src/dsp/*.test.ts` — nuevo o editado según el detalle anterior
- `packages/shared/src/index.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `yin` analyses a 1600-sample frame at 16000 Hz of a pure sine at each of 85, 120, 180, 220, 300 and 440 Hz **THE SYSTEM SHALL** return a frequency within 10 cents of the input and `probability` of at least 0.9.
2. **WHEN** `yin` analyses a synthesized voice with fundamental 110 Hz and harmonics 2 to 6 at amplitude 1/h plus seeded white noise at SNR 20 dB **THE SYSTEM SHALL** return 110 Hz within 25 cents.
3. **WHEN** the frame is all zeros, or white noise at RMS 0.2, **THE SYSTEM SHALL** return `freq: null`.
4. **WHEN** `PitchTracker` receives frames whose raw estimates contain one isolated octave jump (110, 220, 110 Hz) **THE SYSTEM SHALL** output no jump larger than 2 semitones for that frame (median of 5 plus octave correction).
5. **WHEN** `hzToSemitones` runs **THE SYSTEM SHALL** return 0 for the reference, 12 for twice the reference and -12 for half, within 1e-9.
6. **WHEN** `pnpm test:unit packages/shared/src/dsp/latency.test.ts` processes 600 frames **THE SYSTEM SHALL** measure a p95 processing time under 20 ms per 100 ms frame.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit packages/shared
```

**Checkpoint**

```bash
git add -A && git commit -m "step 9: pitch-yin"
git tag step-09-pitch-yin
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-09-pitch-yin`.

### `E2-T3` — Monitor en vivo sobre canvas

**Depends on:** `E2-T2`, `E1-T7` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-10-live-monitor`

La pantalla Monitor dibuja la voz del usuario en una ventana de 8 s a 60 fps, detecta línea plana y publica un resumen de texto accesible, probado con un WAV real en Chromium.

Monitor en vivo (canvas). Datos a 10 Hz (una muestra por trama de 100 ms), renderizado a 60 fps interpolando el último tramo. Línea sólida gruesa (~3 px), derecha → izquierda, ventana de 8 s.

- `packages/shared/src/monitor/series.ts` — `class RingSeries(windowMs = 8000)`: `push(sample: PitchSample)`, `samples(): PitchSample[]` (solo las que caen en la ventana; con 10 Hz son como máximo 80), `last()`.
- `packages/shared/src/monitor/geometry.ts` — `toPlotPoints(samples, nowMs, windowMs, width, height, yRangeSt: [min, max]): Array<Array<{x:number;y:number}>>` (lista de **segmentos**: las muestras `null` cortan la línea); `x = width * (1 - (nowMs - t) / windowMs)`, `y` lineal en semitonos con el cero (mediana del usuario) a media altura y `yRangeSt` por defecto `[-8, 8]`; `interpolateTail(prev, next, progress)` devuelve el punto interpolado linealmente.
- `packages/shared/src/monitor/flatline.ts` — `classifyTone(samples, nowMs): "sin-voz" | "pausa" | "monotonia" | "variada" | "normal"`: `pausa` si las últimas ≥ 4 muestras (0.4 s) no son sonoras; `monotonia` si en los últimos 2 s hay ≥ 60 % de muestras sonoras y la desviación estándar de sus semitonos es < 0.35; `variada` si la desviación estándar ≥ 1.5; `normal` en el resto; `sin-voz` si no hay ninguna muestra sonora en la ventana. La "línea plana alarma" **no parpadea**: cambia de color (`--alert`) y de etiqueta de texto.
- `apps/web/src/monitor/MonitorCanvas.tsx` — `<canvas data-testid="monitor-canvas">` con escala por `devicePixelRatio`, `requestAnimationFrame` a 60 fps; lee los colores de las variables CSS (`getComputedStyle(document.documentElement).getPropertyValue("--signal")`, nunca hex); línea `lineWidth = 3`, `lineJoin = "round"`; etiqueta "TÚ" junto al extremo derecho de la línea (texto, no solo color); franja inferior de 8 px con la energía (RMS) como barras; actualiza el atributo `data-last-semitones` en cada muestra nueva. `prefers-reduced-motion` NO detiene el dibujo (es la función del producto) pero se eliminan pulsos y transiciones decorativas.
- `apps/web/src/monitor/useLiveMonitor.ts` — hook que une `MicCapture` → `PitchTracker` → `RingSeries`; expone `{ estado: "inactivo"|"pidiendo-permiso"|"grabando"|"error", series, ultimaMuestra, tono: ReturnType<typeof classifyTone>, error }`, `iniciar()`, `detener()`; usa un `ref` para el bucle de dibujo y `useSyncExternalStore` o estado con `setState` ≤ 10 veces por segundo.
- `apps/web/src/routes/Monitor.tsx` (reescribe el marcador de los pasos 6 y 7) — pantalla principal: monitor al centro, botón Grabar/Detener ≥ 48 px de alto, lectura de frecuencia `<output data-testid="freq-readout" data-hz={…}>` en JetBrains Mono, y un resumen de texto accesible `<p role="status" aria-live="polite">` actualizado como máximo cada 2 s ("Tu tono sube", "Línea plana: varía el tono", "Pausa", …; textos en `es.ts`). Los tres medidores secundarios llegan en el paso 12. No cambia de ruta ni de hash mientras graba.
- `apps/web/src/monitor/useLiveMonitor.ts` crea `new MicCapture(workletUrl)` importando `workletUrl` de `../audio/worklet-url.ts`.
- Pruebas: `series.test.ts`, `geometry.test.ts`, `flatline.test.ts` (shared); `apps/web/src/routes/Monitor.test.tsx` (jsdom, temporizadores falsos; `worklet-url.ts` ya está sustituido por `apps/web/tests/setup.ts`, así que la prueba no necesita `vi.mock`): el resumen no cambia más de una vez cada 2 s.
- `tests/e2e/app/monitor.spec.ts` — proyecto `app` (Chromium con micrófono falso alimentado por `tests/e2e/.tmp/voice.wav`: 1 s silencio, 3 s a 130 Hz, 3 s a 260 Hz, 1 s silencio, en bucle). Inicia sesión con la cuenta de prueba, abre `/monitor`, pulsa Grabar, muestrea `freq-readout[data-hz]` y `monitor-canvas[data-last-semitones]` cada 100 ms durante 18 s (más de dos ciclos de 8 s) y, usando solo las muestras posteriores a los primeros 4 s (la referencia de semitonos ya está fijada), afirma: existen lecturas con `hz` dentro de 130 ± 8 % y de 260 ± 8 %; existe un par (i < j) con `hz[i]≈130`, `hz[j]≈260` y `semitones[j] − semitones[i] ≥ 9`; y el canvas contiene al menos un píxel del color `--signal` (lectura de `getImageData`).
- `packages/shared/src/index.ts` (editar) — reexporta `monitor/series`, `monitor/geometry` y `monitor/flatline`.

**Files**
- `packages/shared/src/monitor/**` — nuevo o editado según el detalle anterior
- `packages/shared/src/index.ts` — nuevo o editado según el detalle anterior
- `apps/web/src/**` — nuevo o editado según el detalle anterior
- `tests/e2e/app/monitor.spec.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** 100 samples at 10 Hz are pushed into `RingSeries` with an 8000 ms window **THE SYSTEM SHALL** retain at most the last 80, and `toPlotPoints` SHALL map the newest sample to x = width and the oldest retained to x = 0 within 1 px, with `null` samples splitting the line into separate segments.
2. **WHEN** the render loop draws between two data frames **THE SYSTEM SHALL** place the newest point with `interpolateTail(prev, next, progress)`, returning `prev` at 0, the midpoint at 0.5 and `next` at 1.
3. **WHEN** voiced samples of the last 2 s are at least 60 percent of the window and their semitone standard deviation is under 0.35 **THE SYSTEM SHALL** classify `monotonia`, **WHEN** the last 4 samples are unvoiced **THE SYSTEM SHALL** classify `pausa`, and **WHEN** the standard deviation is at least 1.5 **THE SYSTEM SHALL** classify `variada`.
4. **WHEN** the live summary element (`role="status"`, `aria-live="polite"`) receives state changes faster than every 2 s **THE SYSTEM SHALL** update its text at most once per 2 s (asserted with fake timers).
5. **WHEN** `pnpm test:e2e:full tests/e2e/app/monitor.spec.ts` feeds the fake microphone with the generated WAV (130 Hz then 260 Hz) and the user presses record **THE SYSTEM SHALL** show `data-hz` of the frequency readout within 8 percent of 130 and within 8 percent of 260, show a rise of at least 9 semitones in `data-last-semitones` between a 130 Hz sample and a later 260 Hz sample taken after the first 4 s, and draw at least one pixel of the signal color on the canvas.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
node scripts/check-no-hex.mjs
pnpm build
pnpm test:e2e:full tests/e2e/app/monitor.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 10: live-monitor"
git tag step-10-live-monitor
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-10-live-monitor`.

### `E2-T4` — Línea fantasma y puntaje de seguimiento

**Depends on:** `E2-T3` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-11-ghost-line`

Existe un generador determinista de contorno ideal por perfil, la función de seguimiento con banda de 15 por ciento y tolerancia temporal fija, y el dibujo punteado dorado con etiquetas.

Línea fantasma: contorno ideal por perfil, determinista. Gemini (paso 16) solo aporta **marcas de énfasis como datos**; el dibujo lo hace el generador. Sin red, las plantillas por perfil y el modo "mi mejor yo" funcionan igual.

- `packages/shared/src/profiles.ts` — `PROFILE_IDS = ["redes","tarima","eventos"] as const` y `PROFILES: Record<ProfileId, ProfileSpec>` con constantes fijas:
  | perfil | ppm | pausas (fracción del tiempo hablado) | `baseSt` | `peakSt` | `peakWidthWords` | `floorSt` | forma |
  |---|---|---|---|---|---|---|---|
  | redes | 140–160 | 0.05–0.12; solo `corta` | +1.5 | +5 | 1.2 | +0.5 | montañas altas y seguidas; primer pico dentro de los primeros 3 s (hook) |
  | tarima | 120–140 | 0.20–0.35; `larga` | −1.5 | +4 | 3.0 | −4 | olas amplias; en cada pausa `larga` el contorno baja hasta `floorSt` ("toca cero") |
  | eventos | 110–130 | 0.12–0.22; `respiracion` | 0 | +2 | 3.5 | −1 | colinas suaves y redondeadas, sin montañas |
  Duración de pausas: `corta` 0.4 s, `larga` 1.2 s, `respiracion` 0.8 s. Cada perfil declara también `greenZone: { pauseRatio: [min,max], ppm: [min,max] }` que usan los pasos 12 y 15.
- `packages/shared/src/ghost/marks.ts` — tipos `EmphasisMark = { wordIndex: number; kind: "numero"|"dolor"|"llamado"|"idea"; strength: number /* 0..1 */ }`, `PauseMark = { afterWordIndex: number; kind: "corta"|"larga"|"respiracion" }`, `GhostSpec = { marks: EmphasisMark[]; pauses: PauseMark[]; source: "heuristic"|"gemini" }` (esquema zod en `schemas/phrase.ts`); `heuristicMarks(text, profileId): GhostSpec`: palabras con dígitos o numerales ("tres", "millones", "mil") → `numero` (strength 1); última palabra de cada oración (`.`, `!`, `?`) → `idea` (0.8; en `tarima`, 1.0); palabra tras `¡`/antes de `!` → `llamado`; una pausa del tipo del perfil tras cada `,` (corta/respiración) y tras cada `.` (el tipo del perfil); en `redes` además una marca `llamado` en la primera palabra (hook).
- `packages/shared/src/ghost/generate.ts` — `generateGhost(text, profileId, spec?): Ghost` con `Ghost = { durationMs, contour: number[] /* semitonos relativos a la mediana del usuario, 10 Hz, null→NaN no se usa: las pausas llevan floorSt */, wordTimes: Array<{ word, startMs, endMs }>, pauseSpans: Array<{ startMs, endMs, kind }>, spec }`. Cálculo: `ppm = (min+max)/2` del perfil; tiempo por palabra `60000/ppm` ms; se insertan las pausas de `spec.pauses`; `contour[i] = clamp(baseSt + Σ_marks strength * peakSt * exp(-(Δt/σ)²/2), floorSt, +∞)` con `σ = peakWidthWords * msPorPalabra / 2`; dentro de cada `pauseSpan` el valor es `floorSt` para `tarima` y `max(floorSt, valor suavizado)` para los otros; `contour.length = round(durationMs/100)`. Sin números aleatorios: misma entrada, misma salida.
- `packages/shared/src/ghost/tracking.ts` — `trackingScore(user: Array<number|null>, ghost: Ghost): { pct: number; firstDivergence: { second: number; word: string } | null; perSample: boolean[] }`. Reglas (fijas y documentadas): banda `±tol` con `tol = max(0.75, 0.15 * (max(ghost.contour) − min(ghost.contour)))` semitonos; **tolerancia temporal fija de ±3 muestras (±300 ms)**: la muestra `i` del usuario acierta si existe `k ∈ [i−3, i+3]` con `|user[i] − ghost[k]| ≤ tol`; solo se cuentan las muestras donde el fantasma espera voz (fuera de `pauseSpans`); `pct = 100 * aciertos / esperadas`; `firstDivergence` = primer tramo de ≥ 10 muestras (1 s) consecutivas sin acierto → `second = start/10` y `word` = la palabra de `wordTimes` que contiene ese instante (o la más cercana). Sin DTW (no-objetivo de v1).
- `packages/shared/src/ghost/*.test.ts` — determinismo e igualdad profunda; duración; forma por perfil (redes: ≥ 60 % del máximo global dentro de los primeros 3 s y ≥ 1.5× los picos de eventos para el mismo texto; eventos: rango ≤ 0.5× el de redes; tarima: valor en el centro de cada pausa `larga` = `floorSt`); `heuristicMarks` con el texto "Pierde 3 millones por no cuidar a tu familia, actúa hoy." (marca `numero` en "3" y en "millones", `idea` en "hoy", pausa tras "familia"); `trackingScore` idéntico → 100, desplazado +6 st en un tramo de 4 s sobre 10 s → entre 50 y 70 con `firstDivergence.second` dentro de ± 0.5 s del inicio del tramo y `word` consistente con `wordTimes`; desplazado 300 ms → ≥ 95; desplazado 800 ms → estrictamente menor que el de 300 ms.
- `apps/web/src/monitor/ghostDraw.ts` — `drawGhost(ctx, ghost, nowMs, startedAtMs, geometry, colors)`: `ctx.setLineDash([2, 6])` (punteado), `lineWidth = 2`, color `--ghost` leído de CSS, marcadores (círculo de 4 px) en cada marca de énfasis y la etiqueta de texto "FANTASMA" (en `es.ts`) junto a su extremo; la línea sólida del usuario sigue siendo ≈3 px y lleva "TÚ": la diferencia de trazo y las etiquetas son la señal para daltonismo (la luminosidad de ambos colores es casi igual). `ghostDraw.test.ts` usa un contexto 2D grabador (objeto con `setLineDash`, `beginPath`, `moveTo`, `lineTo`, `stroke`, `fillText`, `arc` como `vi.fn()`) y afirma que `setLineDash` recibe un patrón no vacío y que se dibuja el texto `FANTASMA`.
- `apps/web/src/monitor/ProfileSelect.tsx` — selector de perfil (radio group nativo con `<fieldset><legend>`), perfil por defecto `redes`; `MonitorCanvas` recibe `ghost?: Ghost` y lo dibuja detrás de la línea del usuario.
- `packages/shared/src/index.ts` (editar) — reexporta `profiles` y `ghost/*`.

**Files**
- `packages/shared/src/profiles.ts` — nuevo o editado según el detalle anterior
- `packages/shared/src/ghost/**` — nuevo o editado según el detalle anterior
- `packages/shared/src/index.ts` — nuevo o editado según el detalle anterior
- `apps/web/src/monitor/**` — nuevo o editado según el detalle anterior
- `apps/web/src/i18n/es.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `generateGhost` runs twice with the same text, profile and marks **THE SYSTEM SHALL** return deeply equal results whose `durationMs` equals the word time (words divided by the midpoint ppm of the profile) plus the declared pauses, whose `contour.length` equals `round(durationMs / 100)`, and whose `wordTimes` are ordered and non-overlapping.
2. **WHEN** the same text is generated for `redes`, `tarima` and `eventos` **THE SYSTEM SHALL** give `redes` a maximum within its first 3 s of at least 60 percent of its global maximum and at least 1.5 times the peaks of `eventos`, give `eventos` a range of at most half the range of `redes`, and give `tarima` a contour value equal to its `floorSt` at the middle of every `larga` pause.
3. **WHEN** `heuristicMarks` runs on 'Pierde 3 millones por no cuidar a tu familia, actúa hoy.' **THE SYSTEM SHALL** mark '3' and 'millones' as `numero`, mark 'hoy' as `idea` and add a pause after 'familia'.
4. **WHEN** `trackingScore` compares a user contour identical to the ghost **THE SYSTEM SHALL** return 100, and **WHEN** a 4 s section of a 10 s ghost is shifted by +6 semitones **THE SYSTEM SHALL** return between 50 and 70 with `firstDivergence.second` within 0.5 s of the section start and `firstDivergence.word` equal to the word of `wordTimes` at that second.
5. **WHEN** the user contour is the ghost shifted in time by 300 ms **THE SYSTEM SHALL** score at least 95, and **WHEN** shifted by 800 ms **THE SYSTEM SHALL** score strictly lower than the 300 ms case (fixed temporal tolerance of plus or minus 3 samples).
6. **WHEN** `drawGhost` runs against a recording canvas context **THE SYSTEM SHALL** call `setLineDash` with a non-empty pattern, stroke with the color read from `--ghost`, and draw the text `FANTASMA`.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
node scripts/check-no-hex.mjs
pnpm build
```

**Checkpoint**

```bash
git add -A && git commit -m "step 11: ghost-line"
git tag step-11-ghost-line
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-11-ghost-line`.

### `E2-T5` — Medidores: frecuencia, muletillas y ritmo local

**Depends on:** `E2-T4` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-12-meters`

El monitor muestra los medidores de Frecuencia (zona verde), Muletillas (léxico personal) y Ritmo, calculados en local con VAD por RMS y conteo de palabras.

Medidores secundarios y cálculo local de ritmo y pausas (VAD por RMS en el navegador). Nada de esto depende de la transcripción de Google excepto el conteo de palabras.

- `packages/shared/src/meters/vad.ts` — `class Vad({ onRms: 0.02, offRms: 0.012, hangoverMs: 200 })`: `push(rms, tMs): boolean` con histéresis (sube a sonoro cuando `rms ≥ onRms`; baja a no sonoro solo tras `hangoverMs` con `rms < offRms`); `vadSeries(rmsArray): boolean[]`.
- `packages/shared/src/meters/rhythm.ts` — `computeRhythm(vad: boolean[] /* una por trama de 100 ms */, wordCount: number): { ppm: number; pauseRatio: number; pauseCount: number; longPauseCount: number; speakingMs: number }`. Se recorta el silencio inicial y final; una **pausa** es una racha de ≥ 4 tramas no sonoras (400 ms) dentro del tramo hablado; `longPause` ≥ 12 tramas (1.2 s); `speakingMs` = duración del tramo hablado − suma de pausas; `ppm = wordCount / (speakingMs / 60000)`; `pauseRatio = suma de pausas / duración del tramo hablado`.
- `packages/shared/src/meters/frequency.ts` — `computeGreenZone(hzSamples: number[]): { medianHz, lowHz, highHz }` (p25 y p75 en Hz de las muestras sonoras, `lowHz < medianHz < highHz`; error si hay < 30 muestras) y `classifyHz(hz, zone): "baja" | "verde" | "alta"`.
- `packages/shared/src/meters/fillers.ts` — léxico por defecto `DEFAULT_FILLERS` (la lista personal inicial: `eh`, `este`, `o sea`, `bueno`, `como`, `pues`, `¿sí?`, `¿no?`, `entonces`, `digamos`), cada entrada con una regla: `siempre` (`eh`, `o sea`, `digamos`), `aislada` (la palabra entre comas, al inicio o al final del enunciado: `este`, `bueno`, `pues`, `entonces`, `como`) o `pregunta-cola` (`¿sí?`, `¿no?`: `, sí?` / `, ¿no?` / `¿sí?` al final de cláusula). `countFillers(transcript, lexicon = DEFAULT_FILLERS): { total: number; byWord: Record<string, number> }` (normaliza minúsculas, conserva tildes y signos); `topFillers(byWord, n = 3)`; clase `LiveFillerCounter` con `update(fullTranscript)` que recalcula sobre el texto acumulado. Límite honesto documentado: es una heurística léxica; `este` demostrativo ("este carro") y `como` comparativo ("como el sol") NO cuentan. El reconocedor puede omitir disfluencias (no está documentado): el análisis de audio del paso 16 lo compensa.
- `apps/web/src/meters/Meters.tsx` — tres medidores bajo el monitor: **Frecuencia** (valor en Hz en `font-mono`, etiqueta de texto "Zona verde" / "Baja" / "Alta" además del color, barra con la zona verde marcada), **Muletillas** (contador total y top-3 con su conteo) y **Ritmo** (ppm y pausas, con la zona del perfil). El medidor de **Dicción** (0–100) se cablea en el paso 18 (la fórmula `dictionScore` nace en el paso 15 y el flujo de grabación de sesiones, que aporta la confianza de las transcripciones, en el paso 18); hoy muestra "—" con texto explicativo. Cada medidor tiene `role="group"` y un nombre accesible.
- `apps/web/src/routes/Monitor.tsx` (editar) — integra los medidores usando `Vad`, `computeRhythm` y la zona verde de la ficha vocal si existe (en la semana de línea base se mide sin juzgar: la zona se muestra como "midiendo").
- Pruebas: `vad.test.ts`, `rhythm.test.ts` (60 s sintéticos: 50 s de habla con 4 pausas de 2.5 s y 125 palabras → `ppm` 150 ± 0.5, `pauseCount` 4, `pauseRatio` 10/60 ± 0.01), `frequency.test.ts`, `fillers.test.ts` (tabla de ≥ 12 casos, incluidos los negativos), `Meters.test.tsx` (jsdom: la etiqueta de zona es texto).
- `packages/shared/src/index.ts` (editar) — reexporta `meters/*`.

**Files**
- `packages/shared/src/meters/**` — nuevo o editado según el detalle anterior
- `packages/shared/src/index.ts` — nuevo o editado según el detalle anterior
- `apps/web/src/meters/**` — nuevo o editado según el detalle anterior
- `apps/web/src/routes/Monitor.tsx` — nuevo o editado según el detalle anterior
- `apps/web/src/i18n/es.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `countFillers` runs over the table of at least 12 transcripts of `fillers.test.ts` **THE SYSTEM SHALL** return the exact `total` and `byWord` expected for each, counting 'eh', 'o sea' and 'digamos' always, counting 'este', 'bueno', 'pues', 'entonces' and 'como' only when isolated by commas or at the edge of an utterance, and not counting 'Compré este carro' nor 'como el sol'.
2. **WHEN** a personal lexicon is passed **THE SYSTEM SHALL** count only the words of that lexicon.
3. **WHEN** `computeRhythm` runs on 60 s of synthetic VAD frames made of 50 s of speech and 4 interior pauses of 2.5 s, with 125 words, **THE SYSTEM SHALL** return `ppm` 150 plus or minus 0.5, `pauseCount` 4 and `pauseRatio` 10/60 plus or minus 0.01, excluding leading and trailing silence.
4. **WHEN** `Vad` receives an RMS series that oscillates around the on threshold **THE SYSTEM SHALL** not toggle state more than once, and **WHEN** `rms` falls below the off threshold **THE SYSTEM SHALL** keep voiced for the 200 ms hangover before switching off.
5. **WHEN** `computeGreenZone` receives at least 30 voiced Hz samples **THE SYSTEM SHALL** return `lowHz < medianHz < highHz` using the 25th and 75th percentiles, and `classifyHz` SHALL return `baja`, `verde` or `alta` accordingly.
6. **WHEN** the Frecuencia meter renders in jsdom **THE SYSTEM SHALL** show the zone as text ('Zona verde', 'Baja' or 'Alta') in addition to color, in an element with `role="group"` and an accessible name.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
node scripts/check-no-hex.mjs
pnpm build
```

**Checkpoint**

```bash
git add -A && git commit -m "step 12: meters"
git tag step-12-meters
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-12-meters`.

---

## Epic acceptance

La épica está hecha cuando cada tarea está `done` **y**:

1. **WHEN** el micrófono falso reproduce 130 Hz y luego 260 Hz y el usuario graba en `/monitor` **THE SYSTEM SHALL** mostrar la lectura de frecuencia y el canvas subiendo al menos 9 semitonos.
2. **WHEN** el usuario deniega el permiso del micrófono **THE SYSTEM SHALL** mostrar el mensaje `mic.denied` en español y no lanzar excepciones sin capturar.

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm test:e2e:full tests/e2e/app/monitor.spec.ts
```

Desde la raíz del proyecto. Ambos criterios los deciden estos comandos.

## Pitfalls

- **El worklet no puede importar tipos DOM de worklet**: `lib.dom` no declara `AudioWorkletProcessor`; accede por `globalThis` con un tipo local mínimo.
- **`?worker&url` es lo que compila el worklet**: un `new URL('./x.ts', import.meta.url)` suelto lo copia sin transformar TypeScript. La puerta `grep -rl registerProcessor apps/web/dist/assets` existe para cazarlo pronto.
- **YIN con ruido blanco no debe devolver tono**: si ningún `τ` baja del umbral, `freq` es `null` (no "el mínimo global").
- **Los saltos de octava** (110 → 220 Hz) son el fallo típico de YIN en voz: mediana de 5 + corrección de octava son obligatorias, no opcionales.
- **El e2e usa un WAV generado** por `tests/e2e/global-setup.ts`; el micrófono falso hace bucle (ciclo de 8 s). Muestrea más de un ciclo y compara solo tras los primeros 4 s.
- **`prefers-reduced-motion` no apaga la línea del monitor** (es la función): solo pulsos y transiciones decorativas.

## Before moving on

- [ ] Cada tarea de esta épica está `done` en `tasks.json`; ninguna queda `in_progress`.
- [ ] Todos los comandos `verify` de cada tarea pasaron, no solo el primero.
- [ ] Ningún `verify` fue editado ni omitido porque un archivo no existía.
- [ ] Cada tarea tiene su etiqueta de checkpoint en git (`git tag -l 'step-*'`).
- [ ] El gate pasa limpio desde la raíz.
- [ ] Cada contrato "Produced" existe con la firma indicada.
- [ ] Ningún archivo fuera del subárbol fue modificado.
- [ ] `.env.example` actualizado si la épica añadió una variable.
- [ ] Un commit por tarea, con el id de la tarea como prefijo, seguido de su etiqueta.
