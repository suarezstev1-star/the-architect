# Epic 01: Fundación

> Existe un monorepo que instala, tipa, lintea, prueba y compila; un servidor que arranca; el sistema visual con contrastes verificados; datos aislados por organización; login con Google y una PWA autenticada e instalable.

| | |
|---|---|
| **Epic id** | `01-fundacion` |
| **Tasks** | `E1-T1` … `E1-T7` (7 tareas) |
| **Depends on** | nada — empieza aquí |
| **Unlocks** | `02-nucleo-de-voz`, `03-coaching-y-lanzamiento` |
| **Parallel with** | ninguna (los pasos 2, 3 y 4 solo comparten archivos de configuración ya emitidos, pero se ejecutan en orden de array) |

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

**Gate:** `pnpm typecheck && pnpm lint && pnpm test` pasa antes de marcar cualquier tarea como hecha (las pruebas con emuladores requieren JDK 21+ y que `firebase-tools` pueda descargar los emuladores la primera vez).

Si alguna verificación usa un servicio (emuladores de Firebase), arráncalo con `pnpm test:emu` (se levanta y se apaga solo) o `pnpm emulators`. El archivo que lo define (`firebase.json`) ya está en la raíz: no lo escribes, y nunca sustituyes por un doble un servicio que los criterios de aceptación nombran.

## Directory subtree

Solo lo que toca esta épica:

```
package.json, pnpm-workspace.yaml, biome.json, tsconfig.base.json, tsconfig.json, vitest.config.ts, playwright.config.ts   # YA EXISTEN (workspace/)
firebase.json, firestore.rules, firestore.indexes.json, storage.rules, .env.example, .env.e2e, Dockerfile     # YA EXISTEN
scripts/
  smoke-server.mjs        # NUEVO paso 1
  check-no-hex.mjs        # NUEVO paso 2
  check-pwa.mjs           # NUEVO paso 7
  make-icons.mjs          # existe (genera los PNG de la PWA)
packages/shared/src/
  index.ts, health.ts     # NUEVO paso 1 (index.ts se edita en cada paso)
  schemas/                # NUEVO paso 3: user, org, member, voice-sheet, phrase, session, report, vocab, challenge, usage, llm-call, paths, schemas.test
apps/server/src/
  app.ts, index.ts        # NUEVO paso 1 (se editan en 4, 5 y 7)
  data/org-store.ts       # NUEVO paso 3: único módulo que arma rutas orgs/...
  env.ts, load-dotenv.ts, logger.ts, firebase.ts   # NUEVO paso 4 (env.ts y firebase.ts se editan en 5)
  errors.ts, auth/verify.ts, auth/provision.ts, routes/session.ts   # NUEVO paso 5 (session.ts se edita en 7)
apps/server/tests/        # setup.ts existe; helpers/env.ts (paso 4); helpers/emulator-auth.ts y e2e-server.ts (paso 5); emulator/* (pasos 3, 4, 5, 7: me.test.ts)
apps/web/
  index.html, public/theme-init.js, public/icons/*               # index.html y theme-init NUEVOS paso 2 (iconos existen)
  src/main.tsx, App.tsx, styles/tokens.css, app.css, i18n/es.ts, components/layout/AppShell.tsx   # NUEVO paso 2 (main.tsx, App.tsx, es.ts, AppShell se editan después)
  src/lib/env.ts, firebase.ts, api.ts, auth/AuthProvider.tsx, auth/RequireAuth.tsx, routes/Entrar.tsx, router.tsx   # NUEVO paso 6 (más los marcadores routes/Inicio.tsx y routes/Monitor.tsx; i18n/es.ts se edita: auth.loading)
  src/routes.ts, components/PageState.tsx, lib/theme.ts, routes/Ajustes.tsx, pwa.ts, vite-env.d.ts   # NUEVO paso 7 (auth/RequireAuth.tsx se edita para usar PageState; los marcadores routes/FrasePerfecta.tsx, Sesion.tsx, Repertorio.tsx, Vocabulario.tsx y Baseline.tsx nacen aquí y router.tsx no se vuelve a tocar)
tests/e2e/global-setup.ts (existe), ui/layout.spec.ts (paso 2), app/auth.spec.ts (paso 6), app/shell.spec.ts y ui/pwa.spec.ts (paso 7; pwa.spec.ts corre contra el bundle de producción en el puerto 4173)
tests/repo/firestore-indexes.test.ts (paso 3), tokens-parity.test.ts (paso 7)
```

Todo lo que quede fuera de este subárbol está fuera de alcance. Si una tarea parece exigir editar un archivo que no aparece, detente y repórtalo: el límite de la épica está mal.

## Data model touched here

| Entidad | Campos que esta épica añade o lee | Notas |
|---|---|---|
| `users/{uid}` | email, displayName, personalOrgId, themePreference (dark/light/system), sttLocale (es-US/es-MX/es-419), createdAt | Creado por aprovisionamiento JIT; `PATCH /api/v1/me` solo cambia themePreference y sttLocale |
| `orgs/{orgId}` | name, plan ("free"), ownerUid, createdAt | orgId = `crypto.randomUUID()`; sin cobro en v1 |
| `orgs/{orgId}/members/{uid}` | role ("owner"), joinedAt | Las reglas deciden acceso por existencia de este documento |
| Subcolecciones restantes | `voiceSheet`, `phrases`, `sessions`, `reports`, `vocab`, `challenges`, `usage`, `llm_calls` | Solo esquemas y reglas en esta épica; los pasos posteriores las llenan. Índice: exención de `sessions.contour` y compuesto `profileId + startedAt desc` |

## Contracts

**Consumed** — ya existe, no lo reconstruyas:

| From | Interface | Guarantee |
|---|---|---|
| `workspace/` | Todos los archivos de configuración emitidos | Ya están en la raíz; no se reescriben (solo se editan donde un paso lo dice) |

**Produced** — las épicas posteriores dependen exactamente de estas firmas:

| Export | Signature | Used by |
|---|---|---|
| `packages/shared/src/index.ts` → `HealthResponseSchema`, esquemas de §4, `COLLECTION_NAMES` | zod | `02`, `03` |
| `apps/server/src/data/org-store.ts` → `createOrgStore(db, orgId)` | refs tipadas bajo `orgs/{orgId}` | `03` |
| `apps/server/src/env.ts` → `loadEnv(source?)` | valida y devuelve entorno tipado; lanza nombrando las variables que faltan | `02`, `03` |
| `apps/server/src/auth/verify.ts` → `requireUser({ checkRevoked })` | middleware Hono; deja `{ uid, email, name }` | `03` |
| `apps/web/src/routes.ts` → manifiesto de rutas | `{ path, titleKey, auth, rendering }[]` | `02`, `03` |
| `apps/web/src/lib/api.ts` → `apiFetch(path, init)` | fetch con bearer del usuario | `02`, `03` |

## Conventions that bite in this area

- **Imports**: especificadores relativos con extensión `.ts`/`.tsx` (`import { createApp } from "./app.ts"`); `@pulso/shared` siempre desde el paquete. Ningún alias `@/`. (`allowImportingTsExtensions` + `rewriteRelativeImportExtensions` ya están en `tsconfig.base.json`.)
- **Env por paso**: una variable solo es obligatoria desde el paso que la consume (columna "Requerida desde el paso" de `.env.example`/CLAUDE.md). Nunca inventes valores para variables de pasos futuros: `scripts/smoke-server.mjs` ya lee `.env.example` completo.
- **Cero hex fuera de `tokens.css`**; el canvas lee colores con `getComputedStyle(...).getPropertyValue('--signal')`.
- **Todas las cadenas visibles en `apps/web/src/i18n/es.ts`** (español neutro con tuteo). Un solo archivo para poder cambiar a voseo.
- **Solo lectura en el navegador**: el cliente Firestore nunca escribe; toda escritura pasa por la API del servidor.
- **404, no 403**, para recursos de otra organización.
- Tras escribir código ejecuta `pnpm format` antes de `pnpm lint` (Biome 2 espacios, comillas dobles, punto y coma, comas finales, 100 columnas).

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

### `E1-T1` — Monorepo, tooling y servidor /health ejecutable

**Depends on:** nada · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-01-monorepo-health`

Existe un monorepo pnpm que instala, tipa, lintea, prueba y compila, con un servidor Hono que arranca de verdad y responde en /health con el SHA.

Primero la verdad del paso: el árbol `workspace/` ya está copiado en la raíz (Bootstrap de §10), así que `package.json`, `pnpm-workspace.yaml`, `biome.json`, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts` y los `package.json` de cada paquete **ya existen**. Este paso escribe el código mínimo que hace que todos esos archivos se ejecuten de verdad, incluido un servidor que **arranca y responde**.

- `packages/shared/src/health.ts` — `HealthResponseSchema = z.object({ ok: z.literal(true), sha: z.string().min(1) })` y `type HealthResponse`.
- `packages/shared/src/index.ts` — único punto de entrada público del paquete: `export * from "./health.ts";` (los demás pasos añaden sus módulos aquí).
- `packages/shared/src/health.test.ts` — acepta `{ ok: true, sha: "abc" }`, rechaza `{ ok: false, sha: "abc" }` y `{ ok: true }`.
- `apps/server/src/app.ts` — `import { HealthResponseSchema } from "@pulso/shared"` y `export function createApp(deps: { sha: string }): Hono` con `GET /health` que construye el cuerpo `{ ok: true, sha: deps.sha }`, lo valida con `HealthResponseSchema.parse(...)` y lo devuelve con `c.json(...)`. Así el primer arranque del servidor compilado ya carga `@pulso/shared` desde su `dist`.
- `apps/server/src/index.ts` — lee `PORT` (por defecto 8787) y `GIT_SHA` (por defecto `dev`) de `process.env`, crea la app y llama a `serve({ fetch: app.fetch, port })` de `@hono/node-server`. El paso 4 reemplaza estas lecturas por `loadEnv()`.
- `apps/server/src/app.test.ts` — `createApp({ sha: "t" }).request("/health")` responde 200 y el cuerpo cumple `HealthResponseSchema`.
- `apps/web/index.html` — `<div id="root">` y `<script type="module" src="/src/main.tsx">`; `apps/web/src/main.tsx` monta `<App />` con `createRoot`; `apps/web/src/App.tsx` devuelve un `<h1>` con el texto `PULSO`.
- `apps/web/src/test-utils.tsx` — helper `renderInto(node)` que crea un `div`, monta con `createRoot` dentro de `act()` (de `react`) y devuelve `{ container, unmount }`; `apps/web/src/App.test.tsx` comprueba que existe exactamente un `h1` con `PULSO`.
- `scripts/smoke-server.mjs` — script Node sin dependencias: lee `.env.example` (parser simple `CLAVE=valor`, ignora comentarios), elige un puerto libre abriendo y cerrando un `net.createServer().listen(0)`, lanza `node apps/server/dist/index.js` con ese entorno más `PORT=<libre>`, hace polling a `GET /health` hasta 15 s, valida `ok === true` y `typeof sha === "string"`, ejecuta `node --input-type=module -e "console.log(import.meta.resolve('@pulso/shared'))"` con `cwd = apps/server` y exige que la salida termine en `packages/shared/dist/index.js`, mata el proceso hijo (`SIGTERM`) y sale con 0; ante cualquier fallo imprime el motivo y sale con 1. Usa el entorno de `.env.example` completo para que los pasos 4 a 16 (que añaden variables obligatorias) no rompan esta puerta.

Convención de imports (decidida una vez, ver §19.6): los especificadores relativos llevan la extensión `.ts` (`import { createApp } from "./app.ts"`); `@pulso/shared` se importa siempre desde el paquete, nunca por ruta relativa.

**Una sola sentada:** es un único corte vertical mínimo (un esquema, una ruta, una página y un script de humo); ningún archivo supera unas pocas líneas y todos se verifican con el mismo `Verify`.

**Files**
- `packages/shared/src/**` — nuevo o editado según el detalle anterior
- `apps/server/src/**` — nuevo o editado según el detalle anterior
- `apps/web/index.html` — nuevo o editado según el detalle anterior
- `apps/web/src/**` — nuevo o editado según el detalle anterior
- `scripts/smoke-server.mjs` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `pnpm install --frozen-lockfile` runs **THE SYSTEM SHALL** exit 0 without modifying `pnpm-lock.yaml`.
2. **WHEN** `pnpm typecheck` runs **THE SYSTEM SHALL** exit 0 for the root project, `@pulso/shared`, `@pulso/server` and `@pulso/web`.
3. **WHEN** `pnpm lint` runs **THE SYSTEM SHALL** exit 0 with zero errors, including over the files copied from `workspace/` and with `blueprints/` excluded.
4. **WHEN** `pnpm build` runs **THE SYSTEM SHALL** emit `packages/shared/dist/index.js`, `apps/server/dist/index.js` and `apps/web/dist/index.html`.
5. **WHEN** `node scripts/smoke-server.mjs` runs **THE SYSTEM SHALL** start `node apps/server/dist/index.js` on a free port, receive status 200 and a JSON body `{ ok: true, sha: <non-empty string> }` from `GET /health` (a body that `app.ts` builds and validates with `HealthResponseSchema` imported from `@pulso/shared`), confirm that `@pulso/shared` resolves from `apps/server` to `packages/shared/dist/index.js`, stop the process and exit 0.
6. **WHEN** `pnpm test:unit` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
node scripts/smoke-server.mjs
test -f apps/web/dist/index.html
```

**Checkpoint**

```bash
git add -A && git commit -m "step 1: monorepo-health"
git tag step-01-monorepo-health
git ls-files --error-unmatch pnpm-lock.yaml   # expect: exit 0 — ya commiteado
git ls-files --error-unmatch .env.example   # expect: exit 0 — ya commiteado
git ls-files --error-unmatch scripts/smoke-server.mjs   # expect: exit 0 — ya commiteado
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-01-monorepo-health`.

### `E1-T2` — Sistema visual Monitor clínico: tokens y tema

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-02-visual-system`

Existen los tokens de diseño de dos temas con contrastes verificados, fuentes autoalojadas, tema sin parpadeo y un shell vacío accesible.

Sistema visual "Monitor clínico / lujo sobrio". Antes de empezar, si la skill `ui-ux-pro-max` está instalada, úsala para validar la jerarquía visual contra §7; si no está, la paleta de §7 ya es literal y suficiente (no hay que investigar nada más).

- `apps/web/src/styles/tokens.css` — tres capas. **Primitivos** en `:root` con prefijo `--p-` (los hex de la paleta de §7, uno por nombre: `--p-dark-bg`, `--p-light-bg`, etc.). **Semánticos** (`--bg`, `--surface`, `--surface-2`, `--text`, `--text-secondary`, `--signal`, `--ghost`, `--alert`, `--border-strong`, `--focus`, `--hairline`, `--on-signal`) definidos en `:root` (oscuro, por defecto) con `var(--p-dark-…)` y redefinidos en `:root[data-theme="light"]` con `var(--p-light-…)`. **Componente**: `--button-bg`, `--button-fg`, `--card-bg`, `--card-border`, `--meter-track`, `--focus-ring: 3px solid var(--focus)`. Además: escala tipográfica (`--text-display: 3rem`, `--text-h1: 2.25rem`, `--text-h2: 1.875rem`, `--text-h3: 1.5rem`, `--text-body: 1rem`, `--text-small: 0.875rem`, `--text-caption: 0.75rem`), espaciado de 4 px (`--space-1` … `--space-16` = 0.25rem … 4rem en la escala 4, 8, 12, 16, 24, 32, 48, 64), radios (`--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`), movimiento (`--dur-fast: 150ms`, `--dur-base: 200ms`, `--dur-slow: 250ms`, `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`). Ningún hex fuera de este archivo.
- `apps/web/src/styles/app.css` — `@import "tailwindcss";`, `@import "./tokens.css";`, un bloque `@theme inline` que expone los tokens semánticos como utilidades (`--color-bg: var(--bg)` …, `--font-display`, `--font-sans`, `--font-mono`), estilos base (`html` con `font-family` Inter, `h1…h3` con Fraunces, números con JetBrains Mono vía clase `.num`), foco visible global (`:focus-visible { outline: var(--focus-ring); outline-offset: 2px }`; nunca `outline: none` sin reemplazo) y `@media (prefers-reduced-motion: reduce)` que anula transiciones y animaciones decorativas.
- `apps/web/src/main.tsx` — importa `@fontsource-variable/fraunces`, `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` (autoalojadas por el bundler) y `./styles/app.css`. Familias: `"Fraunces Variable"` (títulos), `"Inter Variable"` (UI), `"JetBrains Mono Variable"` (Hz, puntajes, reloj), cada una con pila de respaldo (`Georgia, serif` / `system-ui, sans-serif` / `ui-monospace, monospace`).
- `apps/web/public/theme-init.js` — script **bloqueante** y literal (sin CSP inline):
  ```js
  (() => {
    let theme = "dark";
    try {
      theme = localStorage.getItem("pulso-theme") || "dark";
    } catch {}
    if (theme === "system") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (theme !== "light" && theme !== "dark") theme = "dark";
    document.documentElement.setAttribute("data-theme", theme);
  })();
  ```
- `apps/web/index.html` — `<html lang="es" data-theme="dark">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<meta name="theme-color">` omitido (lo gestiona el manifiesto), `<script src="/theme-init.js"></script>` **antes** de cualquier `<link rel="stylesheet">` o módulo, `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`, `<title>PULSO</title>`.
- `apps/web/src/components/layout/AppShell.tsx` — cabecera con la marca `PULSO` (Fraunces), `<nav aria-label>` con enlaces vacíos de marcador, `<main id="contenido" tabIndex={-1}>` y, como **primer** elemento enfocable de la página, el enlace "Saltar al contenido" (`href="#contenido"`, visible al recibir foco). `apps/web/src/i18n/es.ts` — `export const es = { … } as const` con TODAS las cadenas visibles (único archivo de cadenas; tuteo neutro). `App.tsx` pasa a renderizar el shell.
- `apps/web/src/styles/tokens.test.ts` — lee `tokens.css` con `node:fs`, resuelve cada token semántico por sus `var()` hasta el hex (en `:root` y en `:root[data-theme="light"]`), calcula la razón de contraste WCAG 2.x (luminancia relativa sRGB) y compara con la tabla de §7 (copiada en el epic): umbral ≥ 4.5 para texto, texto secundario, fantasma y alerta; la señal ≥ 4.5 contra bg y surface y ≥ 3 contra surface2 (en el tema claro surface2 da 4.35: solo uso gráfico); ≥ 3 para borde fuerte y foco; y cada razón igual al valor medido ± 0.05.
- `apps/web/src/theme-init.test.ts` — lee `index.html` y `public/theme-init.js`; ejecuta el script con `new Function` sobre un `document`/`localStorage`/`matchMedia` simulados.
- `scripts/check-no-hex.mjs` — recorre `apps/web/src/**` (`.ts`, `.tsx`, `.css`) excepto `styles/tokens.css` y `*.test.ts(x)`, más `apps/web/index.html`, y falla (exit 1) si encuentra `/#[0-9a-fA-F]{3,8}\b/`; imprime archivo:línea de cada hallazgo.
- `tests/e2e/ui/layout.spec.ts` — para cada viewport `375x812` y `1440x900`, abre `/` y afirma `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

**Una sola sentada:** un archivo de tokens y su prueba de contraste, un script de cabecera y un shell vacío; no hay lógica de producto.

**Files**
- `apps/web/index.html` — nuevo o editado según el detalle anterior
- `apps/web/public/theme-init.js` — nuevo o editado según el detalle anterior
- `apps/web/src/**` — nuevo o editado según el detalle anterior
- `scripts/check-no-hex.mjs` — nuevo o editado según el detalle anterior
- `tests/e2e/ui/layout.spec.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `pnpm test:unit apps/web/src/styles/tokens.test.ts` runs **THE SYSTEM SHALL** parse `tokens.css` and assert, in the dark and in the light theme, that text, secondary text, ghost and alert each reach at least 4.5:1 against bg, surface and surface2, that signal reaches at least 4.5:1 against bg and surface and at least 3:1 against surface2 (light surface2 = 4.35, graphic use only), that strong border and focus each reach at least 3:1 against the same three, and that every ratio equals the measured value of the design table within 0.05.
2. **WHEN** `node scripts/check-no-hex.mjs` runs **THE SYSTEM SHALL** exit 0 because no hex color literal appears in `apps/web/src` outside `apps/web/src/styles/tokens.css` and its tests, nor in `apps/web/index.html`.
3. **WHEN** `pnpm test:unit apps/web/src/theme-init.test.ts` runs **THE SYSTEM SHALL** assert that `index.html` declares `lang="es"` and `data-theme="dark"` on `<html>` and loads `/theme-init.js` as a blocking script before any stylesheet, and that executing `theme-init.js` with `localStorage` value `light` sets `data-theme` to `light` and with value `system` and a dark `matchMedia` sets it to `dark`.
4. **WHEN** `pnpm test:e2e tests/e2e/ui/layout.spec.ts` runs **THE SYSTEM SHALL** load `/` at 375x812 and at 1440x900 and find `document.documentElement.scrollWidth` equal to `document.documentElement.clientWidth` on both.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
node scripts/check-no-hex.mjs
pnpm test:e2e tests/e2e/ui/layout.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 2: visual-system"
git tag step-02-visual-system
git ls-files --error-unmatch apps/web/public/theme-init.js   # expect: exit 0 — ya commiteado
git ls-files --error-unmatch apps/web/src/styles/tokens.css   # expect: exit 0 — ya commiteado
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-02-visual-system`.

### `E1-T3` — Esquemas de datos, reglas de Firestore y org-store

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-03-data-schemas-rules`

Existen los esquemas zod de las colecciones, el módulo único de acceso por organización y las reglas de Firestore con su exención de índice, con pruebas de aislamiento contra el emulador.

Capa de datos con aislamiento por organización. Firestore con el SDK oficial, **sin ORM**. El navegador solo lee (reglas); toda escritura pasa por el servidor con Admin SDK. Este paso no toca el entorno ni el servidor HTTP: las pruebas crean su propio cliente de Firestore contra el emulador.

- `packages/shared/src/schemas/` — el directorio completo que posee este paso: un archivo por documento de §4 con su esquema zod y `type` inferido (`user.ts`, `org.ts`, `member.ts`, `voice-sheet.ts`, `phrase.ts`, `session.ts`, `report.ts` —incluye `ReportSchema` con los campos de §4—, `vocab.ts`, `challenge.ts`, `usage.ts`, `llm-call.ts`), más `paths.ts` (exporta `COLLECTION_NAMES` —las subcolecciones bajo `orgs/{orgId}`— y `orgPath(orgId)`) y `schemas.test.ts`. `packages/shared/src/index.ts` reexporta el directorio.
- `apps/server/src/data/org-store.ts` — `createOrgStore(db: Firestore, orgId)`: valida `orgId` con `/^[A-Za-z0-9-]{8,64}$/` y devuelve referencias tipadas a `members`, `voiceSheet`, `phrases`, `sessions`, `reports`, `vocab`, `challenges`, `usage`, `llmCalls`, todas bajo `orgs/{orgId}`. **Ningún otro módulo construye rutas `orgs/...` a mano** (regla de frontera; ver CLAUDE.md). Recibe el `db` por parámetro: aún no existe `firebase.ts` (lo crea el paso 4).
- `apps/server/tests/emulator/rules-isolation.test.ts` — con `initializeTestEnvironment({ projectId: "demo-pulso", firestore: { rules } })`, donde `rules` es el texto leído de `firestore.rules`: crea las orgs A y B con un miembro cada una (usando `withSecurityRulesDisabled`) y, **para cada nombre en `COLLECTION_NAMES`**, afirma `assertSucceeds(get/list)` del miembro de A en A, `assertFails(get/list)` del miembro de A en B, `assertFails` de cualquier `set/update/delete` del propio miembro en su org y en `users/{uid}`, y `assertFails` de todo acceso sin autenticar.
- `apps/server/tests/emulator/org-store.test.ts` — crea un `Firestore` de Admin con `initializeApp({ projectId: "demo-pulso" }, "org-store-test")` (el emulador se detecta por `FIRESTORE_EMULATOR_HOST`), escribe con `createOrgStore(db, A)` y `createOrgStore(db, B)` y afirma que cada uno solo ve lo suyo; un `orgId` inválido lanza.
- `tests/repo/firestore-indexes.test.ts` — lee `firestore.indexes.json` y afirma la exención de índice (`fieldOverrides` con `collectionGroup: "sessions"`, `fieldPath: "contour"`, `indexes: []`) y que el índice compuesto `profileId ASC + startedAt DESC` existe.
- `packages/shared/src/schemas/schemas.test.ts` — para cada esquema, un ejemplo válido de §4 parsea y los casos inválidos fallan: `contour` con 3001 puntos, `plan: "pro"`, `role: "admin"`, `themePreference: "neon"`, `profileId: "otro"`.

**Una sola sentada:** los esquemas del directorio `schemas/` siguen un único patrón (zod + tipo inferido) y las dos pruebas de emulador recorren `COLLECTION_NAMES`.

**Files**
- `packages/shared/src/schemas/**` — nuevo o editado según el detalle anterior
- `packages/shared/src/index.ts` — nuevo o editado según el detalle anterior
- `apps/server/src/data/org-store.ts` — nuevo o editado según el detalle anterior
- `apps/server/tests/emulator/**` — nuevo o editado según el detalle anterior
- `tests/repo/firestore-indexes.test.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `pnpm test:unit packages/shared/src/schemas/schemas.test.ts` runs **THE SYSTEM SHALL** parse a valid example of each schema of the data model and reject `contour` with 3001 points, `plan: 'pro'`, `role: 'admin'`, `themePreference: 'neon'` and an unknown `profileId`.
2. **WHEN** `pnpm test:emu` runs the rules suite **THE SYSTEM SHALL** show, for every name in `COLLECTION_NAMES`, that a member of org A can get and list under `orgs/A`, gets permission denied on get and list under `orgs/B`, and that no signed-in user (member included) and no anonymous client can create, update or delete any document under `orgs/{orgId}` or `users/{uid}`.
3. **WHEN** `pnpm test:emu` runs the org-store suite **THE SYSTEM SHALL** read and write only under `orgs/{orgId}` for the given orgId, never return a document stored under another org, and throw on an orgId that does not match `/^[A-Za-z0-9-]{8,64}$/`.
4. **WHEN** `pnpm test:unit tests/repo/firestore-indexes.test.ts` runs **THE SYSTEM SHALL** assert that `firestore.indexes.json` has a field override for collection group `sessions`, field `contour`, with `indexes: []`, and the composite index `profileId` ascending plus `startedAt` descending.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:emu
pnpm build
node scripts/smoke-server.mjs
```

**Checkpoint**

```bash
git add -A && git commit -m "step 3: data-schemas-rules"
git tag step-03-data-schemas-rules
git ls-files --error-unmatch apps/server/src/data/org-store.ts   # expect: exit 0 — ya commiteado
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-03-data-schemas-rules`.

### `E1-T4` — Entorno validado, logger con request id y health profundo

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-04-env-logger-health`

El servidor valida su entorno al arrancar nombrando lo que falta, registra cada petición con un request id y expone una comprobación profunda de Firestore.

Entorno validado al arrancar, logger con id de petición y comprobación profunda de Firestore. Desde este paso el servidor ya no lee `process.env` a mano.

- `apps/server/src/env.ts` — `loadEnv(source = process.env)` valida con zod y lanza un error que **lista por nombre todas las variables faltantes o inválidas**. Una cadena vacía se trata como ausente (`.env.example` trae `CREDITS_EXPIRY_DATE=` vacío). En este paso exige: `NODE_ENV` (por defecto `development`), `PORT` (por defecto 8787), `GIT_SHA` (por defecto `dev`), `LOG_LEVEL` (por defecto `info`) y `GOOGLE_CLOUD_PROJECT` (obligatoria). Los pasos 5, 14, 15 y 16 añaden las suyas a este mismo esquema (columna "Requerida desde el paso" de §10); nunca se exige una variable antes de que su paso la consuma.
- `apps/server/src/load-dotenv.ts` — calcula `const envPath = new URL("../../../.env", import.meta.url)` (la raíz del repositorio, a la misma profundidad desde `src/` y desde `dist/`) y, si `existsSync(envPath)`, llama a `process.loadEnvFile(envPath)` (no sobrescribe variables ya presentes). Se importa como **primer** import (efecto lateral) en `index.ts` y en todo script/entrypoint (`scripts/*.ts`, `evals/run.ts`, `tests/e2e-server.ts`).
- `apps/server/src/logger.ts` — pino en JSON con `redact` para `req.headers.authorization`, `token`, `idToken`; middleware Hono que genera `requestId` (`crypto.randomUUID()`), lo guarda en el contexto, lo devuelve en el header `x-request-id` y crea un logger hijo con `request_id`; registra una línea `request.completed` con `duration_ms` y `status`.
- `apps/server/src/firebase.ts` — `getDb()` inicializa `firebase-admin` una sola vez con `projectId = GOOGLE_CLOUD_PROJECT` (sin credenciales en local: el emulador no las necesita). Es el **único** módulo que importa `firebase-admin/app`.
- `apps/server/src/app.ts` y `apps/server/src/index.ts` (editar) — `index.ts` pasa a usar `loadEnv()` y el logger (si `loadEnv` lanza, imprime el mensaje y sale con código 1); `app.ts` monta el middleware del logger y añade `GET /health/deep`: lee un documento centinela (`db.collection('_health').doc('ping').get()`, no lo crea) y responde `{ ok: true, firestore: "up" }`; si lanza, responde 503 `{ ok: false, firestore: "down" }`. `createApp` recibe `db` por dependencia (`deps.db`). **Regla de dependencias:** todas las `deps.*` posteriores a `sha` (`db`, y más adelante `adminAuth`, `stt`, `oidcVerifier`, `llm`) son opcionales; la ruta que necesita una dependencia ausente responde 503 `upstream_unavailable` (aquí, `/health/deep` responde 503 sin `db`). El `app.test.ts` del paso 1 no cambia.
- `apps/server/tests/helpers/env.ts` — `baseEnv(overrides?)`: parsea `.env.example` (solo las claves que no empiezan por `VITE_`) y devuelve un objeto con **todas** las claves del servidor como cadenas. Es la entrada válida de las pruebas de `loadEnv`; los pasos posteriores añaden claves a `.env.example` (ya están) y nunca editan las pruebas anteriores.
- `apps/server/src/env.test.ts` — con `baseEnv()`: sin `GOOGLE_CLOUD_PROJECT` lanza nombrándola; con `baseEnv()` completo devuelve el objeto tipado con los valores por defecto. `logger.test.ts` captura la salida con un destino en memoria. `apps/server/tests/emulator/health.test.ts` prueba `/health/deep` contra el emulador y con un `db` simulado que lanza.

**Una sola sentada:** cuatro módulos pequeños de arranque (entorno, carga de `.env`, logger, cliente de Firestore) más dos ediciones de una línea y tres archivos de prueba que cubren un comportamiento cada uno.

**Files**
- `apps/server/src/*.ts` — nuevo o editado según el detalle anterior
- `apps/server/tests/helpers/env.ts` — nuevo o editado según el detalle anterior
- `apps/server/tests/emulator/health.test.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `pnpm test:unit apps/server/src/env.test.ts` runs **THE SYSTEM SHALL** use `baseEnv()` (every server key of `.env.example`) as the valid input and assert that `loadEnv(baseEnv without GOOGLE_CLOUD_PROJECT)` throws an error naming it and that `loadEnv(baseEnv())` returns the typed object with the documented defaults, an empty value counting as absent.
2. **WHEN** a request reaches the server **THE SYSTEM SHALL** answer with an `x-request-id` header and write every log line of that request with the same `request_id`, with the `authorization` header redacted (asserted in `apps/server/src/logger.test.ts`).
3. **WHEN** `GET /health/deep` runs against the Firestore emulator **THE SYSTEM SHALL** return 200 with `{ ok: true, firestore: 'up' }`, and **WHEN** Firestore is unreachable, or no `db` is injected, **THE SYSTEM SHALL** return 503 with `{ ok: false, firestore: 'down' }`.
4. **WHEN** `pnpm build` and then `node scripts/smoke-server.mjs` run after `loadEnv` replaced the raw `process.env` reads **THE SYSTEM SHALL** still exit 0, because the script starts the server with the complete environment of `.env.example`.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:emu
pnpm build
node scripts/smoke-server.mjs
```

**Checkpoint**

```bash
git add -A && git commit -m "step 4: env-logger-health"
git tag step-04-env-logger-health
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-04-env-logger-health`.

### `E1-T5` — Auth en el servidor: token, lista de permitidos y JIT

**Depends on:** `E1-T3`, `E1-T4` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-05-auth-server`

El servidor verifica el token de Firebase, aplica la lista de permitidos y aprovisiona usuario, organización personal y membresía en una transacción idempotente.

Un solo proveedor de identidad: Firebase Auth con Google. El servidor verifica el token en cada petición y aprovisiona (JIT) usuario, organización personal y membresía en una transacción. La lista de permitidos (`ALLOWED_EMAILS`) cierra la v1. Este paso es solo servidor; la web llega en el paso 6.

- `apps/server/src/env.ts` (editar) — añade `ALLOWED_EMAILS` (obligatoria; lista separada por comas, se normaliza a minúsculas y se descartan vacíos; error si queda vacía) y `WEB_ORIGINS` (obligatoria; lista de orígenes). Ambas pasan a "requeridas desde el paso 5"; `.env.example` ya las trae con valores locales.
- `apps/server/src/errors.ts` — clase `HttpError(status, code, message)` y manejador `app.onError` que responde SIEMPRE `{ error: { code, message, requestId } }`. Códigos: `unauthenticated` 401, `forbidden_email` 403, `not_found` 404, `validation_error` 422, `quota_exceeded` 429, `rate_limited` 429, `upstream_unavailable` 503, `internal` 500.
- `apps/server/src/auth/verify.ts` — middleware `requireUser({ checkRevoked })`: exige `Authorization: Bearer <idToken>`, llama a `getAdminAuth().verifyIdToken(token, checkRevoked)`, exige `email` presente y `email_verified === true`, comprueba que el email (minúsculas) esté en `ALLOWED_EMAILS` (si no, `HttpError(403, "forbidden_email")` sin tocar Firestore) y deja `{ uid, email, name }` en el contexto. `POST /api/v1/session` usa `checkRevoked: true`; el resto, `false`. `getAdminAuth()` se añade a `firebase.ts`.
- `apps/server/src/auth/provision.ts` — `provisionUser(db, user)`: transacción Firestore que, si `users/{uid}` no existe, crea `users/{uid}` (`personalOrgId`, `themePreference: "dark"`, `sttLocale: "es-US"`, `createdAt`), `orgs/{orgId}` (`orgId = crypto.randomUUID()`, `name` = "Mi espacio", `plan: "free"`, `ownerUid`, `createdAt`) y `orgs/{orgId}/members/{uid}` (`role: "owner"`), usando `createOrgStore` para las rutas de la organización; si ya existe, devuelve el `personalOrgId` sin escribir. Idempotente también con dos llamadas concurrentes (la lectura de `users/{uid}` ocurre dentro de la transacción).
- `apps/server/src/routes/session.ts` y `apps/server/src/app.ts` (editar) — `POST /api/v1/session` (provisiona y devuelve `{ user, org }`) y `GET /api/v1/me` (404 si no existe el usuario). `app.ts` monta CORS (`hono/cors`) con `origin` ∈ `WEB_ORIGINS`, `allowHeaders: ["authorization","content-type"]`, y el manejador de errores; `createApp` recibe `deps.adminAuth` (opcional como el resto de `deps.*` posteriores a `sha`; sin él, las rutas autenticadas responden 503 `upstream_unavailable`).
- `apps/server/tests/helpers/emulator-auth.ts` — `createEmulatorUser(email)`: POST a `http://${FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake` con `{ email, password: "pulso-test-1234", returnSecureToken: true }`, marca el email como verificado con `accounts:update` (`emailVerified: true`) y devuelve `{ uid, idToken }`.
- `apps/server/tests/emulator/auth.test.ts` — cubre las condiciones de aceptación contra el emulador de Auth y de Firestore; el criterio de `ALLOWED_EMAILS` vacío usa `baseEnv()` (paso 4).
- `apps/server/tests/e2e-server.ts` — entrypoint **de prueba** (no es código de producto) que importa `../src/load-dotenv.ts` primero, construye las dependencias reales apuntando a los emuladores y arranca el servidor en `PORT`; los pasos 14 y 16 le inyectan los dobles de STT y de LLM. `pnpm --filter @pulso/server start:e2e` lo ejecuta (lo usa el e2e del paso 6).

**Una sola sentada:** es una sola cadena de autenticación del servidor (verificar → permitir → aprovisionar) con su ayudante de pruebas y su entrypoint de prueba; la web no se toca.

**Files**
- `apps/server/src/auth/**` — nuevo o editado según el detalle anterior
- `apps/server/src/routes/session.ts` — nuevo o editado según el detalle anterior
- `apps/server/src/*.ts` — nuevo o editado según el detalle anterior
- `apps/server/tests/**` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** a request without `Authorization`, or with an invalid token, reaches `GET /api/v1/me` **THE SYSTEM SHALL** answer 401 with `{ error: { code: 'unauthenticated', message, requestId } }`.
2. **WHEN** a valid Auth-emulator ID token for an email outside `ALLOWED_EMAILS` calls `POST /api/v1/session` **THE SYSTEM SHALL** answer 403 with code `forbidden_email` and create no document in `users`, `orgs` or `members`.
3. **WHEN** a valid token for an allowed email calls `POST /api/v1/session` **THE SYSTEM SHALL** create exactly one `users/{uid}`, one `orgs/{orgId}` with `plan: 'free'` and `ownerUid: uid`, and one `orgs/{orgId}/members/{uid}` with `role: 'owner'`, and **WHEN** it is called again, also twice concurrently, **THE SYSTEM SHALL** return the same `orgId` and leave those document counts unchanged.
4. **WHEN** a preflight `OPTIONS /api/v1/me` arrives with an `Origin` listed in `WEB_ORIGINS` **THE SYSTEM SHALL** reply with the same value in `access-control-allow-origin`, and **WHEN** the `Origin` is not listed **THE SYSTEM SHALL** omit that header.
5. **WHEN** `loadEnv` receives `baseEnv()` with `ALLOWED_EMAILS` missing or empty **THE SYSTEM SHALL** throw an error that names `ALLOWED_EMAILS`.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:emu
pnpm build
node scripts/smoke-server.mjs
```

**Checkpoint**

```bash
git add -A && git commit -m "step 5: auth-server"
git tag step-05-auth-server
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-05-auth-server`.

### `E1-T6` — Auth en la web: Google, guardia de rutas y entorno

**Depends on:** `E1-T5`, `E1-T2` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-06-auth-web`

La web inicia sesión con Google (o con la cuenta de prueba del emulador), llama a POST /session, protege las rutas devolviendo al usuario a su URL original y valida su propio entorno.

La web inicia sesión con Google, llama a `POST /api/v1/session` y protege las rutas. El entorno de la web se valida con zod y las pruebas unitarias de la web traen sus valores `VITE_*` por defecto desde `apps/web/tests/setup.ts` (ya emitido, con los valores de `.env.example`).

- `apps/web/src/lib/env.ts` — zod sobre `import.meta.env`: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_USE_EMULATORS`, `VITE_API_URL`, `VITE_WS_URL` (las dos últimas pueden estar vacías); si falta una obligatoria, lanza nombrándola. `lib/env.test.ts` lo prueba con los valores del setup y con `vi.stubEnv` para la ausencia de `VITE_FIREBASE_PROJECT_ID`.
- `apps/web/src/lib/firebase.ts` — `initializeApp`, `getAuth`, `connectAuthEmulator("http://127.0.0.1:9099", { disableWarnings: true })` si `VITE_USE_EMULATORS === "true"`, `getFirestore` + `connectFirestoreEmulator("127.0.0.1", 8080)`. `lib/api.ts` — `apiFetch(path, init)` añade el `Authorization: Bearer` del usuario actual y usa `VITE_API_URL` como base.
- `apps/web/src/auth/AuthProvider.tsx` — estado `cargando | anonimo | autenticado`; tras iniciar sesión llama a `POST /api/v1/session` y guarda `{ user, org }`. **Al recargar la página**, `onAuthStateChanged` devuelve el usuario que Firebase persistió en IndexedDB y el proveedor restaura `{ user, org }` llamando a `POST /api/v1/session` (idempotente; se usa `POST /session` y no `GET /me` porque devuelve el mismo `{ user, org }` en una sola llamada) **una sola vez por carga de página** (una referencia evita repetirla en cada renovación de token y en el doble montaje de `StrictMode`). La restauración solo se intenta si el PRIMER callback de `onAuthStateChanged` de la carga ya trae usuario (ese primer callback consume la referencia, traiga usuario o `null`); un usuario que aparece después por un inicio de sesión en la misma página lo maneja únicamente `Entrar`, que entrega `{ user, org }` al proveedor mediante `setSession` del contexto (el contexto expone `{ estado, user, org, setSession, cerrarSesion }`). Sin usuario en el primer callback pasa a `anonimo`, y si la llamada falla pasa a `anonimo` conservando el error para `Entrar`. `apps/web/src/auth/RequireAuth.tsx` — si anónimo: `<Navigate to={"/entrar?next=" + encodeURIComponent(location.pathname + location.search)} />`; mientras carga renderiza `<p role="status">` con la cadena `auth.loading` de `es.ts` ("Cargando…"); el paso 7 lo sustituye por `PageState`.
- `apps/web/src/routes/Entrar.tsx` — botón "Entrar con Google": `signInWithPopup` en escritorio, `signInWithRedirect` + `getRedirectResult` cuando `navigator.standalone` o iOS; y, **solo** dentro de la rama `VITE_USE_EMULATORS === "true"`, un botón "Entrar con cuenta de prueba" que crea o inicia sesión con `e2e@pulso.test` / `pulso-test-1234` (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword`) contra el emulador y **a continuación** marca el correo como verificado (el emulador emite `email_verified: false` y `requireUser` exige `true`): `POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=fake` con `{ idToken, emailVerified: true }`, luego `getIdToken(true)` para refrescar el token y solo entonces `POST /api/v1/session`. Tras cualquier inicio de sesión (Google o cuenta de prueba) `Entrar` llama a `setSession({ user, org })` con la respuesta de ese `POST` y navega a `next`; el proveedor no repite la llamada. Un 403 `forbidden_email` muestra "Esta cuenta no está autorizada" con la opción de salir.
- `apps/web/src/router.tsx` — `createBrowserRouter`: `/entrar` pública; `/` y `/monitor` envueltas en `RequireAuth` con `AppShell`. Las cadenas nuevas van a `i18n/es.ts` (entre ellas `auth.loading`). Las pantallas de `/` y `/monitor` son marcadores mínimos (`routes/Inicio.tsx` y `routes/Monitor.tsx`, un `<h1>` cada uno) que los pasos 7, 10 y 19 reescriben sin tocar `router.tsx`.
- `apps/web/src/auth/RequireAuth.test.tsx` — con `MemoryRouter`: anónimo en `/monitor` termina en `/entrar?next=%2Fmonitor`; autenticado renderiza el hijo; en `cargando` renderiza el `role="status"` con el texto de `auth.loading`. `auth/AuthProvider.test.tsx` — con `onAuthStateChanged` y `apiFetch` simulados: una carga con usuario persistido llama a `POST /api/v1/session` exactamente una vez, aunque el token se renueve, y deja `{ user, org }` disponibles; con el primer callback en `null` y un usuario que aparece después, el proveedor NO llama a `apiFetch`. `routes/Entrar.test.tsx` — el botón de cuenta de prueba no existe cuando `VITE_USE_EMULATORS` es `"false"`, y con `"true"` verifica con `fetch` y Auth simulados el orden: inicio de sesión → `accounts:update` con `emailVerified: true` → `getIdToken(true)` → `POST /api/v1/session` → `setSession`.
- `tests/e2e/app/auth.spec.ts` — abre `/monitor` anónimo, afirma la URL `/entrar?next=%2Fmonitor`, pulsa el botón de prueba y afirma volver a `/monitor`.

**Files**
- `apps/web/src/**` — nuevo o editado según el detalle anterior
- `tests/e2e/app/auth.spec.ts` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** the anonymous browser opens `/monitor` **THE SYSTEM SHALL** redirect to `/entrar?next=%2Fmonitor` and, after the emulator test sign-in, return to `/monitor` (`pnpm test:e2e:full tests/e2e/app/auth.spec.ts`).
2. **WHEN** `apps/web/src/lib/env.ts` is imported in a jsdom test **THE SYSTEM SHALL** parse the `VITE_*` defaults that `apps/web/tests/setup.ts` takes from `.env.example`, and **WHEN** `VITE_FIREBASE_PROJECT_ID` is absent **THE SYSTEM SHALL** throw an error naming it.
3. **WHEN** an anonymous user renders a route wrapped by `RequireAuth` at `/monitor` **THE SYSTEM SHALL** navigate to `/entrar?next=%2Fmonitor`, and **WHEN** the user is authenticated **THE SYSTEM SHALL** render the child.
4. **WHEN** `VITE_USE_EMULATORS` is `false` **THE SYSTEM SHALL** NOT render the button 'Entrar con cuenta de prueba' on `/entrar`.
5. **WHEN**, inside the `VITE_USE_EMULATORS === 'true'` branch only, the test sign-in has created or signed in `e2e@pulso.test` **THE SYSTEM SHALL** call `POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=fake` with `{ idToken, emailVerified: true }`, refresh the token with `getIdToken(true)` and only then call `POST /api/v1/session`, so that the `email_verified` check of the server passes (asserted in `Entrar.test.tsx` with simulated `fetch` and Auth, and by the e2e sign-in succeeding).

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
node scripts/check-no-hex.mjs
pnpm build
pnpm test:e2e:full tests/e2e/app/auth.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 6: auth-web"
git tag step-06-auth-web
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-06-auth-web`.

### `E1-T7` — Shell autenticado, ajustes y PWA instalable

**Depends on:** `E1-T2`, `E1-T6` · **Priority:** p0 — metadato para recortes de alcance, no un orden de ejecución · **Checkpoint:** `step-07-shell-pwa`

Existe el manifiesto de rutas con sus estados, el shell autenticado completo, la pantalla de Ajustes con tema e idioma STT y una PWA que cumple el contrato de instalación.

Shell autenticado completo y PWA instalable. Aquí se fija el **manifiesto de rutas** (contrato del frontend) y los tres estados de cada pantalla.

- `apps/web/src/routes.ts` — manifiesto: array de `{ path, titleKey, auth: "publica" | "usuario", rendering: "cliente" }` para `/entrar`, `/`, `/monitor`, `/frase-perfecta`, `/sesiones/:id`, `/repertorio`, `/vocabulario`, `/baseline`, `/ajustes`. Todas son **cliente** (SPA tras login, sin SEO). `router.tsx` se construye A PARTIR de este manifiesto y mapea cada ruta a `routes/<Nombre>.tsx`; un test recorre el manifiesto y afirma que cada ruta resuelve a un componente. Las pantallas que aún no existen (`FrasePerfecta`, `Sesion`, `Repertorio`, `Vocabulario`, `Baseline`) se crean aquí como marcadores, y los pasos 10, 18 y 19 **reescriben esos archivos sin volver a tocar `router.tsx`**.
- `apps/web/src/components/PageState.tsx` — `PageState` con las variantes `cargando` (esqueleto con las mismas dimensiones que el contenido real), `vacio` (mensaje + acción principal) y `error` (mensaje + reintentar + `requestId` si lo hay). Cada pantalla pendiente de pasos posteriores (incluidos los marcadores `Inicio` y `Monitor` del paso 6) renderiza hoy `PageState variant="vacio"` con su `<h1>` (un único `h1` por ruta; `document.title` propio por ruta).
- `apps/web/src/auth/RequireAuth.tsx` (editar) — sustituye el `<p role="status">` de `auth.loading` del paso 6 por `PageState variant="cargando"`, que conserva `role="status"` y el texto de `auth.loading`; `RequireAuth.test.tsx` sigue pasando.
- `apps/web/src/components/layout/AppShell.tsx` (editar) — navegación completa (Inicio, Monitor, Frase Perfecta, Repertorio, Vocabulario, Baseline, Ajustes) con `aria-current="page"`, objetivos táctiles ≥ 48 px en móvil, cabecera con el menú de la cuenta.
- `apps/web/src/lib/theme.ts` — `applyTheme(pref)`: escribe `localStorage["pulso-theme"]` y `data-theme` en `<html>` (resolviendo `system` con `matchMedia`); `routes/Ajustes.tsx` — selector de tema (oscuro / claro / sistema), idioma STT (`es-US`, `es-MX`, `es-419`; guardado en `users.sttLocale`) y, por ahora, los botones "Exportar mis datos" y "Borrar mi cuenta" deshabilitados con texto explicativo (los activa el paso 19). Al cambiar se llama a `PATCH /api/v1/me`.
- `apps/server/src/routes/session.ts` (editar) — `PATCH /api/v1/me` con `@hono/zod-validator`: cuerpo `{ themePreference?: "dark"|"light"|"system", sttLocale?: "es-US"|"es-MX"|"es-419" }`, al menos un campo; escribe en `users/{uid}`; valor inválido o cuerpo vacío → 422 `validation_error` sin escribir.
- `apps/server/tests/emulator/me.test.ts` — `PATCH /api/v1/me` con `{ themePreference: "light", sttLocale: "es-MX" }` y token válido → 200 y `users/{uid}` actualizado; `{ themePreference: "neon" }` → 422 `validation_error` y documento intacto; cuerpo `{}` → 422.
- PWA — `apps/web/src/pwa.ts` registra el service worker con `registerSW` de `virtual:pwa-register` (solo en producción); `vite-plugin-pwa` ya está configurado en `vite.config.ts` (emitido); para tipar `virtual:pwa-register` se crea `apps/web/src/vite-env.d.ts` con `/// <reference types="vite-plugin-pwa/client" />` (si el paquete expone ese módulo de tipos con otro nombre, léelo en `node_modules/vite-plugin-pwa/package.json`, campo `exports`). `scripts/check-pwa.mjs` lee `apps/web/dist/manifest.webmanifest` y `apps/web/dist/sw.js` y valida el contrato del criterio 1.
- `tests/e2e/ui/pwa.spec.ts` — se ejecuta contra el **bundle de producción** que sirve `vite preview` en el puerto 4173 (`playwright.config.ts` ya añade ese `webServer` cuando existe `apps/web/dist`; el proyecto `ui` es el predeterminado). No importa código del producto: abre `http://127.0.0.1:4173/entrar`, espera `await navigator.serviceWorker.ready` y comprueba que `fetch('/sw.js')` responde 200. Necesita un `.env` (Bootstrap lo crea desde `.env.example`: el build de producción lee `VITE_*` de `.env`).
- `tests/repo/tokens-parity.test.ts` — extrae `manifestColor` de `apps/web/vite.config.ts` y `--p-dark-bg` de `tokens.css` y exige igualdad (sin mayúsculas/minúsculas).
- `tests/e2e/app/shell.spec.ts` — con el usuario de prueba: recorre `/`, `/ajustes` y `/entrar` (esta última sin sesión) a 375 y 1440 px sin scroll horizontal; ejecuta `AxeBuilder` con las etiquetas `wcag2a, wcag2aa, wcag21aa, wcag22aa` y exige `violations` vacío; cambia el tema en Ajustes, recarga y comprueba `data-theme` en `DOMContentLoaded`.

**Una sola sentada:** reúne el manifiesto de rutas, un componente de estados (más la edición de una línea en `RequireAuth`), la pantalla de Ajustes y la PWA; las pantallas pendientes son marcadores con el mismo componente, y cada prueba cubre un contrato.

**Files**
- `apps/web/src/**` — nuevo o editado según el detalle anterior
- `apps/server/src/routes/session.ts` — nuevo o editado según el detalle anterior
- `scripts/check-pwa.mjs` — nuevo o editado según el detalle anterior
- `apps/server/tests/emulator/me.test.ts` — nuevo o editado según el detalle anterior
- `tests/**` — nuevo o editado según el detalle anterior

**Acceptance**

Copiado literalmente del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante la build.

1. **WHEN** `pnpm build` and then `node scripts/check-pwa.mjs` run **THE SYSTEM SHALL** exit 0 because `apps/web/dist/manifest.webmanifest` has name, short_name, start_url `/`, display `standalone`, lang `es`, icons of 192x192 and 512x512 (one of them maskable) whose files exist in `apps/web/dist`, and `apps/web/dist/sw.js` exists.
2. **WHEN** `pnpm test:unit tests/repo/tokens-parity.test.ts` runs **THE SYSTEM SHALL** assert that `theme_color` and `background_color` in `apps/web/vite.config.ts` equal the dark `--p-dark-bg` hex of `tokens.css`.
3. **WHEN** each route of `apps/web/src/routes.ts` renders in jsdom **THE SYSTEM SHALL** produce exactly one `h1`, a `main` landmark with id `contenido`, and a skip link as the first focusable element.
4. **WHEN** `PATCH /api/v1/me` receives `{ themePreference: 'light', sttLocale: 'es-MX' }` with a valid token **THE SYSTEM SHALL** persist both on `users/{uid}` and answer 200, and **WHEN** it receives `{ themePreference: 'neon' }` **THE SYSTEM SHALL** answer 422 with code `validation_error` and persist nothing.
5. **WHEN** `pnpm test:e2e:full tests/e2e/app/shell.spec.ts` visits `/`, `/ajustes` and `/entrar` at 375 and 1440 px **THE SYSTEM SHALL** find no horizontal scroll and an axe-core scan with tags wcag2a, wcag2aa, wcag21aa and wcag22aa reporting 0 violations, and after the signed-in user changes the theme in Ajustes and reloads **THE SYSTEM SHALL** have `data-theme` on `<html>` equal to the chosen theme at `DOMContentLoaded`.
6. **WHEN** `pnpm test:e2e tests/e2e/ui/pwa.spec.ts` loads the production bundle served by `vite preview` on port 4173 **THE SYSTEM SHALL** resolve `navigator.serviceWorker.ready` and answer 200 to `fetch('/sw.js')`.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno termina en 0 cuando la tarea es correcta; que el último termine en 0 es lo que da la tarea por hecha.

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:emu
pnpm build
node scripts/check-pwa.mjs
node scripts/smoke-server.mjs
pnpm test:e2e tests/e2e/ui/pwa.spec.ts
pnpm test:e2e:full tests/e2e/app/shell.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 7: shell-pwa"
git tag step-07-shell-pwa
git ls-files --error-unmatch apps/web/public/icons/icon-512.png   # expect: exit 0 — ya commiteado
git ls-files --error-unmatch scripts/check-pwa.mjs   # expect: exit 0 — ya commiteado
```

Ejecuta ambos tras el último `Verify` en 0 y antes de la tarea siguiente. Si la siguiente sale mal: `git reset --hard step-07-shell-pwa`.

---

## Epic acceptance

La épica está hecha cuando cada tarea está `done` **y**:

1. **WHEN** el usuario de prueba abre `/monitor` anónimo y luego inicia sesión con el emulador **THE SYSTEM SHALL** volver a `/monitor` dentro de un shell instalable (manifiesto y service worker válidos) sin scroll horizontal ni violaciones axe.
2. **WHEN** un miembro de la organización A intenta leer o escribir bajo la organización B **THE SYSTEM SHALL** recibir permiso denegado en el emulador de Firestore.

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm test:e2e && pnpm test:e2e:full tests/e2e/app/shell.spec.ts
```

Desde la raíz del proyecto. Ambos criterios los deciden estos comandos.

## Pitfalls

- **`pnpm install` aborta con `ERR_PNPM_IGNORED_BUILDS`** — pnpm 11 exige `allowBuilds` (no `onlyBuiltDependencies`); si el error nombra un paquete nuevo, `pnpm approve-builds --all` y repite `pnpm install --frozen-lockfile`. Nunca uses `dangerouslyAllowAllBuilds`.
- **Biome no parsea `@theme` de Tailwind 4 sin `css.parser.tailwindDirectives: true`** — ya está en `biome.json`; no lo quites.
- **Dos configs raíz de Biome**: el bundle está en `blueprints/<slug>/workspace/` y `biome.json` ya lo excluye (`!blueprints`); no copies la carpeta `blueprints/` a otro sitio dentro del árbol.
- **El emulador de Firestore necesita Java 21+**; sin JDK `pnpm test:emu` falla antes de ejecutar nada. No lo sustituyas por mocks.
- **`signInWithPopup` falla en PWA instalada de iOS** sin `authDomain` propio — es una puerta manual (§20.1), no la "arregles" en la build.
- **Vite no lee `.env.example`**: el build de producción (y el bundle que sirve `vite preview` en los e2e `pwa.spec.ts` y `worklet.spec.ts`) toma los `VITE_*` de `.env`, que Bootstrap crea con `test -f .env || cp .env.example .env`. Si falta, `env.ts` aborta `main.tsx` antes de registrar el service worker.
- **La cuenta de prueba solo existe contra el emulador** (`VITE_USE_EMULATORS === "true"`): no la dejes alcanzable en producción.

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
