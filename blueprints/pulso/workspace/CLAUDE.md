# PULSO

Entrenador de voz en vivo (PWA) para Steven Suárez: muestra "tu voz en el monitor", la sigue contra una línea fantasma por perfil de oratoria y entrena dicción, muletillas y vocabulario.

## Commands

| Tarea | Comando |
|---|---|
| Instalar | `pnpm install --frozen-lockfile` |
| Desarrollo | `pnpm dev` — web http://127.0.0.1:5173, servidor http://127.0.0.1:8787 · emuladores: `pnpm emulators` |
| Build | `pnpm build` (orden: shared → server → web) |
| Typecheck | `pnpm typecheck` |
| Lint / formato | `pnpm lint` · `pnpm format` (Biome; haz `format` antes de `lint`) |
| Pruebas unitarias | `pnpm test:unit` · un archivo: `pnpm test:unit <ruta>` |
| Pruebas con emuladores | `pnpm test:emu` (Auth + Firestore + Storage; requiere JDK 21+) |
| Todas las pruebas | `pnpm test` (= `test:unit` + `test:emu`) |
| E2E | `pnpm test:e2e` (proyecto `ui`) · `pnpm test:e2e:full <ruta>` (pila completa) |
| Humo del servidor | `node scripts/smoke-server.mjs` |
| Evaluación LLM | `pnpm eval` (grabada, sin red ni Firestore; usa `.env.example`) · `pnpm eval:live` (manual, credenciales reales) |
| Guardas | `node scripts/check-no-hex.mjs` · `node scripts/check-pwa.mjs` · `node deploy/check-bundle-budget.mjs` |

**Gate:** `pnpm typecheck && pnpm lint && pnpm test` debe pasar antes de marcar una tarea como hecha. El gate final está en `blueprints/pulso/blueprint.md` §20.1.

Runtime fijado en `.nvmrc` (24). Versiones de dependencias: en `pnpm-lock.yaml`; léelo, no adivines.
Orden de construcción: `blueprints/pulso/tasks.json` (el orden del arreglo ES el orden) y `blueprints/pulso/epics/*.md`; diseño y puertas finales en `blueprints/pulso/blueprint.md`.

## Stack

Vite + React 19 + TypeScript 6 + Tailwind 4 (web, PWA, Firebase Hosting) · Hono sobre Node 24 en Cloud Run (server) · Firestore con SDK oficial, sin ORM · Firebase Auth (solo Google) · STT v2 (Google Cloud) · Gemini vía `@google/genai` (Vertex) · `packages/shared` con zod y DSP puro · Biome · Vitest · Playwright.

## Architecture

**Petición típica.** Navegador (`apps/web/src/lib/api.ts` añade el ID token) → Hono `apps/server/src/app.ts` → `auth/verify.ts` (`requireUser`) → guardia de organización (404 si no es miembro) → ruta en `src/routes/*.ts` → `src/data/org-store.ts` → Firestore (Admin SDK). Lecturas en vivo: el navegador lee Firestore directo (las reglas permiten leer solo a miembros). **Escrituras: siempre por el servidor.**

**Audio.** Micrófono → `apps/web/src/audio/capture.worklet.ts` (remuestrea a 16 kHz, tramas de 100 ms) → `MicCapture` → tono (`PitchTracker`), VAD y medidores en el navegador → trama PCM16 por WebSocket `/ws/audio` (token en el primer mensaje) → `ws/audio-gateway.ts` → `SttAdapter` (STT v2). El audio temporal vive en `tmp/{orgId}/{sessionId}.wav` y se borra al terminar la sesión; el barredor `/internal/sweep-audio` cubre el resto.

**Fronteras.** Cruzar una al revés rompe la build:

| Capa | Puede importar de | Nunca |
|---|---|---|
| `packages/shared/src` | `zod` | Node, DOM, `firebase*`, `Date.now()`/`Math.random()` sin inyectar |
| `apps/server/src` | `@pulso/shared`, SDKs de Google | `apps/web`, dobles de `tests/` |
| `apps/server/src/llm/gateway.ts` | `@google/genai` | — (es el ÚNICO que lo importa) |
| `apps/server/src/data/org-store.ts` | `firebase-admin` | — (único que arma rutas `orgs/...`) |
| `apps/web/src` | `@pulso/shared`, `firebase` (solo lectura) | `apps/server`, escribir en Firestore |

**Dónde vive cada cosa.**

| Concepto | Fuente única |
|---|---|
| Esquemas de datos | `packages/shared/src/schemas/*.ts` (zod) |
| Variables de entorno (servidor) | `apps/server/src/env.ts` → `loadEnv()` |
| Tokens de diseño | `apps/web/src/styles/tokens.css` |
| Cadenas de la UI | `apps/web/src/i18n/es.ts` |
| Manifiesto de rutas | `apps/web/src/routes.ts` |
| Perfiles y fórmulas | `packages/shared/src/profiles.ts`, `coaching/*.ts` |
| Reglas de acceso | `firestore.rules`, `storage.rules` |

## Code rules

1. **Imports relativos con extensión `.ts`/`.tsx`** (`./app.ts`); `@pulso/shared` por nombre de paquete. Sin alias `@/` ni `../../..` profundos.
2. **Un componente por archivo, máximo 300 líneas.**
3. **Valida en el borde**: cada ruta parsea su entrada con zod antes de tocar lógica.
4. **Errores del servidor** con el sobre `{ error: { code, message, requestId } }`; recurso ajeno = 404.
5. **Sin barriles** salvo `packages/shared/src/index.ts` (API pública del paquete).
6. **Sin `any`** (Biome lo marca como error); usa `unknown` y estrecha.
7. **Lógica numérica pura en `packages/shared`**; el worklet y los componentes son cables finos.
8. **Dependencia nueva = razón en el mensaje del commit.**
9. **Ningún ID de modelo en el código**: `GEMINI_MODEL`, `STT_MODEL` viven en configuración.

## Design system

Tokens en `apps/web/src/styles/tokens.css`; los componentes usan solo nombres de token. Oscuro por defecto, claro completo.

| Rol | Oscuro | Claro |
|---|---|---|
| bg / surface / surface2 | `#0B0D0C` / `#121614` / `#1A201D` | `#F7F3EA` / `#FFFDF8` / `#EDE6D6` |
| text / text-secondary | `#F2EDE3` / `#A9B0A9` | `#1A1B19` / `#55584F` |
| signal (tu voz) | `#3DDC84` | `#0B7A43` |
| ghost (fantasma) | `#E8C873` | `#7A5A00` |
| alert (sello/alerta) | `#FF6B81` | `#C8102E` |
| border-strong / focus | `#5F7A70` / `#7CC4FF` | `#7A7A6C` / `#0B5FB0` |

- **Tipografía:** títulos Fraunces (variable), UI Inter, números/Hz/reloj JetBrains Mono. Escala: display 3rem, h1 2.25, h2 1.875, h3 1.5, cuerpo 1rem (nunca < 16 px en móvil), pequeño 0.875, leyenda 0.75.
- **Espaciado** base 4 px (4, 8, 12, 16, 24, 32, 48, 64). **Radios** 4 / 8 / 12 px. **Breakpoints** 640/768/1024/1280/1536; se diseña a 375 px primero.
- **Movimiento:** UI ease-out 150–250 ms, sin rebotes; respetar `prefers-reduced-motion` (la línea del monitor sí se dibuja).
- **Nunca solo color:** señal = línea sólida ≈3 px + etiqueta "TÚ"; fantasma = punteada ≈2 px + marcadores + etiqueta "FANTASMA".

## Environment

`.env.example` está commiteado y completo (valores locales del emulador). Copia a `.env`. El servidor solo exige una variable desde el paso que la consume.

| Variable | Requerida desde el paso | Usada por |
|---|---|---|
| `NODE_ENV`, `PORT`, `GIT_SHA`, `LOG_LEVEL` | 1 (con valor por defecto) | `src/index.ts`, `env.ts` |
| `GOOGLE_CLOUD_PROJECT` | 4 | `firebase.ts` |
| `ALLOWED_EMAILS`, `WEB_ORIGINS` | 5 | `auth/verify.ts`, CORS |
| `STT_MODEL`, `STT_LOCATION`, `STT_LANGUAGE`, `STT_DAILY_SECONDS_PER_ORG`, `STT_PRICE_USD_PER_MIN` | 14 | `stt/`, `usage/quota.ts` |
| `STORAGE_BUCKET`, `SWEEP_AUDIENCE`, `SCHEDULER_SA_EMAIL`, `FILLERS_FROM_AUDIO` | 15 | `storage/`, `routes/internal.ts` |
| `GEMINI_MODEL`, `GEMINI_LOCATION`, `GEMINI_TIMEOUT_MS` | 16 | `llm/gateway.ts` |
| `VITE_FIREBASE_*`, `VITE_USE_EMULATORS`, `VITE_API_URL`, `VITE_WS_URL` | 6 (web) | `apps/web/src/lib/env.ts` |
| `CREDITS_EXPIRY_DATE` | — (documentación) | runbook |

## Rules

Convenciones por área (se cargan solo al tocar esos archivos):

| Archivo | Aplica a |
|---|---|
| `.claude/rules/data-firestore.md` | `apps/server/src/data/**`, `schemas/**`, reglas, índices |
| `.claude/rules/server-api.md` | `apps/server/src/**` |
| `.claude/rules/dsp-shared.md` | `packages/shared/src/**` |
| `.claude/rules/web-ui.md` | `apps/web/src/**`, `index.html`, `public/**` |
| `.claude/rules/llm-stt.md` | `llm/**`, `stt/**`, `ws/**`, `evals/**` |
| `.claude/rules/testing.md` | `*.test.ts(x)`, `tests/**`, configs de prueba |

Skills del proyecto: `add-api-route`, `add-screen`, `add-collection`, `run-gate` (en `.claude/skills/`).

## Non-negotiable

1. **El aislamiento por organización no se negocia**: toda ruta de datos pasa por el guardia de membresía y `org-store`; el navegador nunca escribe en Firestore.
2. **Sin dobles en el camino del producto**: los dobles de STT/Gemini existen solo en `apps/server/tests/**` y `evals/**`. Ninguna variable los activa.
3. **Nunca recuerdes una versión de memoria** ni cambies un pin: manda el lockfile.
4. **Nunca commitees secretos, `.env` ni salida de build.** No empujes (`git push` está denegado).
5. **Las puertas manuales no se simulan**: spike de STT, despliegue, alertas de presupuesto, iPhone y lector de pantalla son del dueño (Steven); ver `blueprints/pulso/blueprint.md` §20.1.
6. **Nunca marques una tarea hecha con un gate en rojo**, ni edites un comando `verify`.
7. **Audio temporal**: borrado por código al terminar; nunca prometas "borrado a las 24 h exactas" (barredor horario + lifecycle de respaldo).
8. **Sin cobro en v1**: solo `org.plan = "free"`; no implementes Stripe ni planes.
