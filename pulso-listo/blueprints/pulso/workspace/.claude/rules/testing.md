---
description: Test conventions - unit, emulator, e2e, doubles
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "tests/**"
  - "vitest.config.ts"
  - "playwright.config.ts"
---

# Pruebas

- Unitarias (`pnpm test:unit`): junto al código (`foo.test.ts`). Emulador (`pnpm test:emu`): `apps/server/tests/emulator/**`, contra Firestore/Auth/Storage reales del emulador, nunca mocks.
- E2E: `tests/e2e/ui/**` (proyecto `ui`, solo Vite) y `tests/e2e/app/**` (proyecto `app`, pila completa con `E2E_FULL=1`). `tests/e2e/global-setup.ts` genera el WAV del micrófono falso.
- Nombra la prueba por el comportamiento ("rechaza un token revocado"), no "test 3".
- Congela el tiempo (reloj inyectado) donde importen las fechas; los temporizadores de reconexión se prueban con temporizadores falsos.
- Las señales de audio se generan (`dsp/synth.ts`, PRNG sembrado). Respuestas de Gemini y de STT: grabadas en `apps/server/tests/fixtures/**` y reproducidas por dobles que solo existen en pruebas.
- Cada criterio de aceptación tiene un comando; no dejes pruebas `skip`/`only` (la puerta exige 0 skipped).
- Un fallo de prueba se arregla en el código, no relajando el umbral (p. ej. el presupuesto de latencia de YIN).
- Tras cambiar `firestore.rules`, ejecuta `pnpm test:emu` completo.
