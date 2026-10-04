# PULSO — Blueprint

> Generado por The Architect el 2026-10-04
> Forma: saas-webapp · `knowledge/shapes/saas-webapp.md`
> Pista de ejecución: ts-node (con desviaciones declaradas en §2) · `knowledge/runtime-tracks/ts-node.md`
> Modo de emisión: bundle (21 pasos → 3 épicas)
> Versión del blueprint: 1
> Versiones verificadas por última vez: 2026-10-04 — ver §11 para la procedencia de cada paquete

**Cómo leer este bundle.** Este archivo explica el *porqué* y fija los contratos. `tasks.json` decide *qué sigue* (el orden del arreglo es el orden de construcción). `epics/*.md` explican el *cómo*, cada una autocontenida. `workspace/` contiene los archivos que se copian a la raíz del proyecto (`CLAUDE.md`, `AGENTS.md`, `.claude/`, y todos los archivos de configuración que las puertas necesitan para ejecutarse). Todo el texto está en español; comandos, rutas e identificadores van en inglés.

---

## 1. Project Overview & Non-Goals

### Vision

PULSO es un entrenador de voz en vivo para quien vende hablando. Muestra "tu voz en el monitor": una línea verde estilo electrocardiograma que corre de derecha a izquierda en una ventana de 8 segundos y dibuja el tono (Hz) y la energía mientras hablas. Sube cuando enfatizas, baja cuando das peso, se aplana en las pausas y se vuelve una "temblorosa plana" cuando hay monotonía. Sobre ella, una **línea fantasma** punteada dorada dibuja el contorno ideal de la frase para el perfil elegido (Redes, Tarima o Eventos) —un karaoke de oratoria—, y el puntaje de seguimiento mide el porcentaje del tiempo que tu línea queda dentro de ±15 % de la banda. En el modo "mi mejor yo", el contorno de tu última Frase Perfecta se guarda y se convierte en tu nuevo fantasma.

Debajo del monitor hay tres medidores: Frecuencia (Hz, con zona verde calibrada en tu línea base), Dicción (0–100, un proxy honesto, no análisis fonético clínico) y Muletillas (contador en vivo con tu lista personal). Un motor de vocabulario cuenta las palabras comodín (cosa, eso, muy, también, bueno, algo), propone reemplazos en contexto, mide el vocabulario activo y lanza un reto semanal de cinco palabras. La primera semana es de línea base: se mide, no se juzga. Después, cuatro sesiones por semana con una corrección prioritaria cada una.

El usuario de hoy es Steven Suárez (acentos objetivo: español suramericano y centroamericano); una venta futura es posible, por eso el producto nace multi-organización con una organización personal automática por usuario, sin cobro en v1. La restricción dura es presupuestaria: **$300 de créditos de Google Cloud que vencen a los 90 días**, y toda decisión de diseño minimiza el gasto (STT mínimo, cuota diaria por organización, tope de sesión de 270 s, audio efímero).

### Users

| Persona | What they come to do | Frequency |
|---|---|---|
| Steven Suárez (único usuario v1, dueño del producto) | Practicar oratoria de ventas con feedback en vivo, medir dicción/muletillas/vocabulario y subir de nivel | 4 sesiones por semana (ver §1 metas) |
| Futuro comprador (vendedor/orador, post-v1) | Lo mismo, con cuenta propia | Diaria o semanal |

### Goals — v1 scope

1. Monitor en vivo: línea de tono y energía en ventana de 8 s a 60 fps, con detección de línea plana/monotonía y un resumen de texto accesible.
2. Línea fantasma determinista por perfil (Redes, Tarima, Eventos) con puntaje de seguimiento (±15 % de la banda, tolerancia temporal fija) y modo "mi mejor yo".
3. Tres medidores secundarios: Frecuencia (zona verde), Dicción (0–100) y Muletillas (lista personal, meta −50 % de las top-3 en 30 días).
4. Modo Frase Perfecta con repertorio de 10 frases de negocio y veredicto exacto "ORATORIA PERFECTA ✓" (seguimiento ≥ 85, dicción ≥ 85, 0 muletillas y ritmo en la zona del perfil), con el segundo y la palabra de la separación cuando no se logra.
5. Motor de vocabulario: palabras comodín con conteo real, reemplazos en contexto, vocabulario activo (meta +30 % en 90 días), reto semanal de 5 palabras y diccionario personal.
6. Nivel de orador (Aspirante, Orador, Maestro, Arquitecto de la voz) y la semana de línea base con ficha vocal.
7. Multi-organización desde el día 1 (organización personal automática, `org.plan = "free"`, sin cobro), acceso cerrado por lista de permitidos, PWA instalable, exportar mis datos y borrar mi cuenta.
8. Control de gasto sobre los $300 de crédito: cuota diaria de segundos de STT, tope de 270 s por sesión, métrica propia `cost_usd` y scripts de alertas de presupuesto (ejecución manual).

### Non-Goals — explicitly out of scope for v1

| Not building | Why not now | Revisit when |
|---|---|---|
| Cobro, Stripe, planes y límites por plan | Un solo usuario; añadiría webhooks, entitlement y una superficie de fraude sin demanda validada | Cuando exista un segundo comprador dispuesto a pagar; condición adicional: política de privacidad publicada |
| Sparring con IA como prospecto escéptico y hook scorer (v2 del PDF) | Requiere un bucle de conversación con LLM y costo variable por sesión que choca con el presupuesto de crédito | Tras 30 días de uso real de v1 y con el costo por sesión medido en `llm_calls` |
| Video, postura, contacto visual, currículo estilo Toastmasters, modo equipo (v3 del PDF) | Otro producto: visión por computador y multiusuario colaborativo | Cuando la v2 esté en producción y haya más de un usuario activo |
| Sitio de marketing / landing | Producto tras login, sin SEO; los skills `/claude-seo-ai:audit` y `/humanizalo` no aplican hoy | Cuando se decida vender públicamente |
| App nativa iOS/Android | La PWA cubre micrófono y pantalla; la nativa exige cuentas de tienda y revisión | Si la prueba en iPhone real (puerta manual M10) demuestra que el micrófono en PWA es inviable |
| Análisis fonético clínico y medición de emociones | La dicción es un proxy (confianza de transcripción + ritmo + pausas); la frecuencia mide tono, no emoción — límite honesto del PDF | Nunca sin un cambio de producto aprobado por escrito |
| Registro abierto de usuarios | Los datos de voz son datos personales sensibles; abrir exige política de privacidad y consentimiento | Cuando existan política de privacidad y consentimiento; entonces se cambia `ALLOWED_EMAILS` por registro abierto |
| DTW (alineación dinámica) en la fantasma | Complejidad innecesaria en v1: se usa tolerancia temporal fija de ±300 ms | Si la validación en línea base (R1) muestra que ±300 ms castiga ritmos legítimos |
| Sentry u otro rastreador de errores de terceros | Decisión: Cloud Logging estructurado + Error Reporting + uptime check de Cloud Monitoring | Si el volumen de errores de cliente exige agrupación y source maps de terceros |

**El constructor no debe implementar nada de esta tabla**, aunque parezca una adición pequeña mientras trabaja en un paso adyacente. Si un paso parece exigir un no-objetivo, es un defecto del blueprint: detente y repórtalo en lugar de ampliar el alcance.

### Success metrics

| Metric | Target | How measured |
|---|---|---|
| Muletillas top-3 de Steven | −50 % a 30 días de la línea base | Comparar `sessions.metrics.fillersByWord` (top-3 de la semana 1) contra la semana 5 |
| Vocabulario activo (únicas significativas por 100 palabras) | +30 % a 90 días | `vocabGrowth(base, current)` sobre `sessions.metrics.activeVocabPer100` |
| Constancia | ≥ 4 sesiones por semana | Conteo de `sessions` con `state = "done"` por semana ISO |
| Nivel de orador | ≥ 80 (Maestro) a 90 días | `computeLevel` sobre las sesiones de la última semana |
| Gasto de crédito de Google Cloud | ≤ $300 antes del `CREDITS_EXPIRY_DATE`; alertas al 50/80/100 % | `usage/{fecha}.cost_usd` acumulado + `llm_calls.costUsd` + facturación de la consola |
| Retención de audio | 0 objetos en `tmp/` con más de 25 h | Barrido horario: respuesta `{ deleted: n }` de `/internal/sweep-audio` y listado de `tmp/` |

---

## 2. Tech Stack

**Pista de ejecución: ts-node, con cuatro desviaciones declaradas.** Esta tabla nombra *decisiones*, no versiones. Toda versión vive en §11 y en ningún otro sitio.

**Desviaciones respecto de `knowledge/runtime-tracks/ts-node.md`** (todas aprobadas por el usuario):

| La pista dice | PULSO hace | Por qué |
|---|---|---|
| Next.js (framework por defecto) | SPA Vite + React | Es una app tras login sin SEO; el canvas, el AudioWorklet y el micrófono son 100 % cliente. Renderizado en servidor no aporta nada |
| Vercel como host | Hono en Cloud Run + Firebase Hosting | Los $300 de crédito son de Google Cloud; WebSockets de larga duración encajan en Cloud Run |
| Postgres + Drizzle | Firestore con el SDK oficial, sin ORM | Datos jerárquicos por usuario sin invariantes cruzadas; Cloud SQL cobra por estar encendido y consumiría el crédito |
| Clerk / Better Auth | Firebase Auth (solo Google) | Un solo proveedor, gratis hasta 50 000 MAU y ya dentro del proyecto de Google |

| Layer | Choice | Why this, over what |
|---|---|---|
| Language / runtime | TypeScript en Node.js LTS | Un lenguaje de extremo a extremo (el DSP puro se comparte entre navegador, servidor y pruebas); no Python porque no hay trabajo numérico pesado en proceso |
| Framework (web) | Vite + React 19 (SPA) + React Router en modo biblioteca | Sin SEO ni SSR que justifiquen Next.js; el router se construye desde un manifiesto de rutas |
| Framework (server) | Hono + `@hono/node-server` + `@hono/node-ws` | Pequeño, tipado y con WebSocket; no Express (sin tipos de primera) ni Fastify (más superficie para lo que se necesita) |
| Styling | Tailwind CSS 4 con tokens como variables CSS (primitivo → semántico → componente) | Los mismos tokens alimentan el canvas, que las clases de utilidad no alcanzan |
| Component layer | Componentes propios sobre `@radix-ui/react-dialog` y `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` | Solo hay un diálogo y botones; no se instala shadcn ni una librería de componentes |
| Database | Firestore (modo nativo, `us-central1`) | Gratis hasta 1 GiB y 50 000 lecturas/día; escala a cero sin costo fijo, a diferencia de Cloud SQL |
| ORM / data access | SDK oficial (`firebase-admin` en servidor, `firebase` en web solo lectura); esquemas zod en `@pulso/shared` | No existe ORM SQL para Firestore; zod valida en cada borde |
| Auth | Firebase Auth, solo Google sign-in; `verifyIdToken` en el servidor; lista de permitidos `ALLOWED_EMAILS` | Un único proveedor de identidad; la v1 está cerrada a emails permitidos |
| Speech-to-text | STT v2 de Google Cloud (`@google-cloud/speech`) detrás de la interfaz `SttAdapter` | Modelo, región e idioma por configuración; el spike manual decide `long`@`us` o `chirp_2`@`us-central1` |
| LLM | Gemini vía `@google/genai` con `vertexai: true`, un solo módulo | `@google-cloud/vertexai` está deprecado; el ID de modelo solo en configuración |
| Realtime | WebSocket binario (PCM16 16 kHz) navegador → Cloud Run | El navegador no puede poner cabeceras en el handshake: token en el primer mensaje |
| Background work | Cloud Scheduler (cada hora) → `POST /internal/sweep-audio` con OIDC | Es la única tarea periódica; no se justifica una cola |
| Payments | NOT APPLICABLE — sin cobro en v1 (solo `org.plan = "free"`) | Ver no-objetivos |
| File storage | Cloud Storage, bucket `us-central1`, solo `tmp/{orgId}/{sessionId}.wav` | Audio temporal para el análisis de muletillas; 5 GB-mes gratis en `us-central1` |
| Email / notifications | NOT APPLICABLE — no hay correo transaccional ni push en v1 | El recordatorio de constancia vive en la pantalla Inicio |
| Hosting | Firebase Hosting (web, gratis 10 GB) + Cloud Run (server, `us-central1`) | 180 000 vCPU-s/mes gratis; `min-instances 0` por defecto (arranque en frío documentado) |
| Observabilidad | pino (JSON) → Cloud Logging, Error Reporting, uptime check de Cloud Monitoring, métrica propia `cost_usd` | Sin Sentry en v1 (decisión) |
| Pruebas | Vitest, Playwright, `@axe-core/playwright`, `@firebase/rules-unit-testing` con emuladores | Las pruebas de aislamiento son obligatorias |
| Lint / formato | Biome | Una herramienta, una configuración |
| Package manager | pnpm (workspace) | Estricto contra dependencias fantasma; monorepo de 3 paquetes |

### Compatibility check

Verificado contra `knowledge/stack-compatibility.md`. Aplican dos filas:

1. **"Documento + relacional"**, justificada así: los datos son jerárquicos por usuario/organización y no hay invariantes entre documentos que un modelo relacional deba proteger; Cloud SQL cobra por estar encendido y consume los $300; las reglas de Firestore tienen pruebas de aislamiento obligatorias (paso 3); y no hay ORM (SDK oficial), por lo que la fila "ORM SQL + plataforma solo-SDK" no se activa.
2. **"Linter que parsea CSS + motor CSS-first"** (Biome + Tailwind 4): resuelta con `css.parser.tailwindDirectives: true` en `biome.json`, ya presente antes del primer `lint`.

Ninguna otra fila de la tabla aplica. Las trampas propias de la pista (pnpm 11 `ERR_PNPM_IGNORED_BUILDS` / `allowBuilds`, `corepack enable` sin permisos, TypeScript 7 fuera de la pista) se tratan en §10 y §11.

### Decisiones de dominio que explican el diseño (leer antes de §9)

**1. Minimizar la dependencia de STT.** De los hechos verificados el 2026-10-04: en streaming, Chirp 3 *no* devuelve marcas de tiempo por palabra ("Available only in Speech.Recognize and BatchRecognize"); no se encontró que `long` las soporte en streaming; la confianza por palabra de Chirp "isn't truly a confidence score"; y no hay documentación de que se transcriban muletillas o disfluencias. Por eso: **ritmo (ppm) y pausas se calculan en local** (VAD por RMS en el navegador + conteo de palabras del transcript final ÷ tiempo hablado), y de STT solo se exige el transcript final por enunciado y su `confidence`. La interfaz `SttAdapter` aísla al proveedor. Un spike manual con un WAV real (`pnpm spike:stt`) decide si `long`@`us` sirve; la alternativa documentada es `chirp_2`@`us-central1`.

**2. Muletillas con doble detección.** (a) Léxica sobre el transcript, en vivo. (b) Si el spike demuestra que el reconocedor las omite, análisis post-sesión con Gemini sobre el audio temporal (`fileUri` en Cloud Storage; límite documentado de 15 MB, 5 min de PCM 16 kHz mono ≈ 9.6 MB entran), detrás de `FILLERS_FROM_AUDIO` (por defecto `true`).

**3. La fantasma "según el texto" es el riesgo principal (R1).** Algoritmo, en cuatro partes:
- Gemini **solo marca** palabras clave y pausas como datos estructurados (número, dolor, llamado a la acción, ideas completas), dado texto + perfil. Si falla, `heuristicMarks` (determinista) las sustituye.
- Un **generador determinista** en `packages/shared` dibuja el contorno en **semitonos relativos a la mediana del usuario** sobre una duración = palabras ÷ ppm del perfil + pausas, con la forma de cada perfil (Redes: montañas altas y seguidas con el primer pico sobre el hook de 3 s; Tarima: olas amplias con valles que tocan el piso; Eventos: colinas suaves sin montañas).
- El **seguimiento** compara en semitonos normalizados con banda ±15 % y tolerancia temporal fija de ±300 ms (sin DTW).
- "Mi mejor yo" = contorno de la última Frase Perfecta normalizado en tiempo y en tono relativo.
- Sin llamadas a Gemini no hay marcas del modelo, pero las plantillas por perfil y "mi mejor yo" funcionan sin red: el producto no se vacía si falla el modelo.

**4. Control de gasto sin patrones destructivos.** Los presupuestos de facturación solo alertan; los "spend caps" (preview) cubren solo Cloud Run y Gemini/Vertex; el patrón "Pub/Sub + desactivar facturación" elimina recursos de forma irreversible y no garantiza no pasar el presupuesto, así que **no se implementa**. El control es: (1) la cuenta de prueba no cobra sola; (2) cuota diaria de segundos de STT por organización, aplicada en servidor antes de abrir el stream; (3) tope de 270 s por sesión; (4) alertas al 50/80/100 % (script manual); (5) métrica propia `cost_usd` por llamada.

---

## 3. Directory Structure

```
pulso/                                  # raíz del proyecto = donde se copia workspace/
  package.json                          # workspace emitido: scripts raíz y devDependencies con pins exactos
  pnpm-workspace.yaml                   # packages + allowBuilds (pnpm 11); excluye blueprints/
  .nvmrc                                # 24
  .gitignore  .dockerignore             # emitidos; existen ANTES del primer commit
  .env.example  .env.e2e                # valores locales del emulador (commiteados)
  biome.json                            # 2 espacios; css.parser.tailwindDirectives; excluye blueprints/
  tsconfig.base.json  tsconfig.json     # base compartida; el raíz cubre vitest/playwright/tests
  vitest.config.ts                      # proyectos: shared, server, web, emulator
  playwright.config.ts                  # proyectos: ui (solo Vite) y app (pila completa, E2E_FULL=1)
  firebase.json  .firebaserc            # emuladores auth/firestore/storage + Hosting + cabeceras
  firestore.rules  storage.rules        # lectura solo a miembros; toda escritura por el servidor
  firestore.indexes.json                # compuesto sessions(profileId, startedAt desc) + exención de `contour`
  Dockerfile                            # imagen de Cloud Run del servidor
  CLAUDE.md  AGENTS.md  .claude/        # §19 (settings.json, skills/, rules/)
  .github/workflows/ci.yml              # paso 21
  blueprints/pulso/                     # ESTE bundle (blueprint.md, tasks.json, epics/, workspace/)
  scripts/
    make-icons.mjs                      # emitido: regenera los PNG de la PWA
    smoke-server.mjs                    # paso 1: arranca dist/index.js y comprueba /health
    check-no-hex.mjs                    # paso 2: ningún hex fuera de tokens.css
    check-pwa.mjs                       # paso 7: manifiesto + service worker
  deploy/                               # pasos 20 y 21: scripts MANUALES, runbook, presupuesto de bundle
    deploy-server.sh  deploy-web.sh  storage-setup.sh  scheduler.sh  budget-alerts.sh
    storage-lifecycle.json  RUNBOOK.md  check-bundle-budget.mjs
  tests/
    e2e/global-setup.ts                 # emitido: genera el WAV del micrófono falso
    e2e/ui/*.spec.ts                    # proyecto ui (paso 2: layout; pasos 7 y 8: pwa.spec.ts y worklet.spec.ts, que corren contra el bundle de producción servido por vite preview en el puerto 4173)
    e2e/app/*.spec.ts                   # proyecto app (pasos 6, 7, 10, 18, 19, 20)
    repo/*.test.ts                      # comprobaciones de repositorio (pasos 3, 7, 21)
  packages/shared/                      # @pulso/shared — puro y determinista
    package.json  tsconfig.json  tsconfig.build.json
    src/index.ts                        # único punto de entrada público
    src/health.ts  src/constants.ts  src/profiles.ts  src/wire.ts  src/llm-schemas.ts
    src/schemas/                        # zod de cada colección + paths.ts (COLLECTION_NAMES)
    src/dsp/                            # resample, frames, synth, wav, yin, pitch
    src/monitor/                        # series, geometry, flatline
    src/ghost/                          # marks, generate, tracking
    src/meters/                         # vad, rhythm, frequency, fillers
    src/coaching/                       # diction, verdict, repertoire, vocab, challenge, level, baseline
  apps/server/                          # @pulso/server — Hono en Cloud Run
    package.json  tsconfig.json  tsconfig.build.json   # build: src → dist/index.js
    src/index.ts  src/app.ts  src/env.ts  src/load-dotenv.ts  src/logger.ts  src/errors.ts  src/firebase.ts
    src/data/org-store.ts               # ÚNICO módulo que arma rutas orgs/...
    src/auth/  src/routes/  src/stt/  src/ws/  src/usage/  src/storage/  src/sessions/
    src/llm/                            # gateway.ts es el ÚNICO importador de @google/genai; prompts/*.md
    src/rate-limit.ts
    scripts/spike-stt.ts                # manual (credenciales reales)
    evals/                              # golden.json, baseline.json, run.ts
    tests/setup.ts  tests/e2e-server.ts  tests/helpers/env.ts (baseEnv)  tests/helpers/emulator-auth.ts  tests/doubles/  tests/fixtures/  tests/emulator/
  apps/web/                             # @pulso/web — SPA Vite + PWA
    package.json  tsconfig.json  vite.config.ts   # proxy /api,/health,/ws; PWA; alias @pulso/shared → fuente
    index.html  public/theme-init.js  public/icons/*.png
    src/main.tsx  App.tsx  router.tsx  routes.ts  pwa.ts  vite-env.d.ts
    src/styles/tokens.css  app.css
    src/i18n/es.ts                      # ÚNICO archivo de cadenas visibles
    src/lib/  src/auth/  src/audio/  src/monitor/  src/meters/  src/components/  src/routes/
    src/session/useRecordingSession.ts  # paso 18: grabar → sesión → métricas → finish → /sesiones/:id
    tests/setup.ts
```

**Boundary rules**
- `packages/shared` no importa Node, DOM ni SDKs de Firebase: es puro, determinista y corre en los tres contextos. No usa `Date.now()` ni `Math.random()` en la lógica.
- `apps/server/src/data/org-store.ts` es el único lugar que construye rutas `orgs/{orgId}/...`. `apps/server/src/llm/gateway.ts` es el único archivo que importa `@google/genai`. `apps/server/src/storage/audio-store.ts` es el único que toca Cloud Storage.
- `apps/web` nunca escribe en Firestore: lee con el SDK (las reglas lo permiten solo a miembros) y escribe con `apiFetch` hacia el servidor.
- Los dobles de STT y de LLM viven solo en `apps/server/tests/**` y `apps/server/evals/**`; ningún archivo de `src/` los importa y ninguna variable de entorno los activa.
- Convención de imports (una sola, reconciliada contra todos los cargadores en §19.6): los especificadores relativos llevan extensión `.ts`/`.tsx`; `@pulso/shared` se importa por nombre de paquete; no hay alias `@/`.

**Cada ruta de salida dibujada aquí** (`apps/server/dist/index.js`, `packages/shared/dist/index.js`, `apps/web/dist/`) es un valor que dos archivos emitidos también declaran; su única fuente está en la tabla *Cross-artifact value reconciliation* de §19.6.

**Origen de cada archivo.** Los que dibuja este árbol y no escribe ningún paso son archivos de `workspace/` (copiados antes del paso 1): `package.json` (raíz y de cada paquete), `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore`, `.dockerignore`, `.env.example`, `.env.e2e`, `biome.json`, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/global-setup.ts`, `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `Dockerfile`, `apps/web/vite.config.ts`, `apps/web/public/icons/*.png`, `scripts/make-icons.mjs`, `apps/server/tests/setup.ts`, `apps/web/tests/setup.ts`, `CLAUDE.md`, `AGENTS.md` y `.claude/**`. Todo lo demás lo escribe el paso cuyo `files[]` lo cubre.

---

## 4. Data Model

Firestore (modo nativo, `us-central1`), SDK oficial, **sin ORM**. Todo dato de usuario vive bajo la organización. **Todas las marcas de tiempo se guardan como cadenas ISO-8601 UTC** (`2026-10-04T12:00:00.000Z`): los esquemas zod son idénticos en servidor y navegador y el orden lexicográfico equivale al cronológico. Los documentos usan ids opacos (`crypto.randomUUID()`) salvo donde la tabla dice otra cosa.

### Entities

**users/{uid}** — espejo mínimo del usuario de Firebase Auth; `uid` es el id de Auth. Se crea una vez (aprovisionamiento JIT).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| email | string | not null, minúsculas | Debe estar en `ALLOWED_EMAILS` al crearse |
| displayName | string \| null | | Nombre de Google |
| personalOrgId | string | not null | Organización personal creada en la misma transacción |
| themePreference | `"dark" \| "light" \| "system"` | default `"dark"` | Espejo de `localStorage["pulso-theme"]` |
| sttLocale | `"es-US" \| "es-MX" \| "es-419"` | default `"es-US"` | Idioma que se pasa a STT |
| createdAt | ISO string | not null | |

**orgs/{orgId}** — la unidad de tenencia. Cada usuario tiene una personal.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| name | string | not null | "Mi espacio" |
| plan | `"free"` | not null | Único valor en v1; relación usuario↔plan stub, sin cobro |
| ownerUid | string | not null | No removible |
| createdAt | ISO string | not null | |

**orgs/{orgId}/members/{uid}** — pertenencia; las reglas deciden acceso por la existencia de este documento.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| role | `"owner"` | not null | Solo `owner` en v1 |
| joinedAt | ISO string | not null | |

**orgs/{orgId}/voiceSheet/{profileId}** — ficha vocal por perfil (`redes`, `tarima`, `eventos`); la crea la semana de línea base.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| profileId | enum | doc id | |
| medianHz | number | > 0 | Mediana de tono del usuario: el cero de los semitonos |
| greenLowHz / greenHighHz | number | low < median < high | Percentiles 25 y 75 de los tonos sonoros de la línea base |
| targetPpmMin / targetPpmMax | number | | Rango de ritmo del perfil |
| sessionsUsed | integer | ≥ 0 | |
| updatedAt | ISO string | | |

**orgs/{orgId}/phrases/{id}** — repertorio. 10 frases sembradas por organización (`seeded: true`) más las propias.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| text | string | 12–400 caracteres | |
| profileId | enum | | Perfil por defecto de la frase |
| ghostSpec | `{ marks, pauses, source }` | `source` ∈ `heuristic`, `gemini` | Marcas de énfasis y pausas, no el dibujo |
| bestRunContour | integer[] \| null | ≤ 3000 | "Mi mejor yo": contorno normalizado en tiempo y en semitonos relativos (×10) |
| seeded | boolean | | |
| createdAt | ISO string | | |

**orgs/{orgId}/sessions/{id}** — una sesión de práctica. Borrado duro a petición del usuario.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| startedAt / endedAt | ISO string / null | | |
| profileId | enum | | |
| mode | `"libre" \| "frase" \| "mi-mejor-yo"` | | |
| phraseId | string \| null | | |
| durationSec | number | ≤ 270 | Tope de sesión |
| state | `"recording" \| "done" \| "failed"` | | |
| contour | integer[] | ≤ 3000, **exento de índice** | Semitonos × 10 a 10 Hz; 3000 muestras ≈ 24 KB, lejos del 1 MiB |
| referenceHz | number | | Mediana usada como cero |
| metrics | objeto | | `trackingPct` (null en modo libre), `diction`, `fillersCount`, `fillersByWord`, `ppm`, `pauseRatio`, `pauseCount`, `greenZonePct`, `activeVocabPer100`, `comodinCount` |
| transcript | string | | Texto final concatenado |
| utterances | `{ text, confidence }[]` | | Para la dicción |
| verdict | `{ perfect, failedChecks, divergence } \| null` | | Solo en modo `frase` |
| sttSeconds | number | | Segundos realmente transmitidos |

**orgs/{orgId}/reports/{sessionId}** — salida estructurada de Gemini (doc id = id de la sesión).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| priorityCorrection | `{ title, detail }` | | Una corrección prioritaria por sesión |
| replacements | `{ original, suggestions[], context }[]` | | Vocabulario |
| summary | string | | |
| divergence | `{ second, word } \| null` | | **Calculada por `trackingScore`, no por el modelo** |
| fillersFromAudio | `{ word, atMs }[] \| null` | | Solo con `FILLERS_FROM_AUDIO=true` |
| model, createdAt | string | | `model` = valor de `GEMINI_MODEL` usado |

**orgs/{orgId}/vocab/{word}** — diccionario personal (id = palabra normalizada).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| word | string | | |
| kind | `"personal" \| "comodin"` | | |
| replacements | string[] | | |
| count | integer | ≥ 0 | |
| lastSeenAt | ISO string | | |

**orgs/{orgId}/challenges/{isoWeek}** — reto semanal (id `2026-W41`).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| isoWeek | string | | Semana ISO 8601 en UTC (`isoWeekKey`): `2026-10-04` (domingo) → `2026-W40`; `2026-10-05` y `2026-10-11` → `2026-W41` |
| words | string[5] | | legado, previsión, dignidad, amparo, innegociable |
| used | `Record<string, boolean>` | | Palabra → usada alguna vez esa semana |
| updatedAt | ISO string | | |

**orgs/{orgId}/usage/{yyyy-mm-dd}** — consumo diario (UTC).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| date | string | | |
| sttSeconds | number | ≥ 0 | Incrementado con `FieldValue.increment` |
| cost_usd | number | ≥ 0 | segundos ÷ 60 × `STT_PRICE_USD_PER_MIN` (precio indicativo; ver §16) |
| sessions | integer | | |

**orgs/{orgId}/llm_calls/{id}** — una fila por llamada a Gemini (éxito o fallo).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| feature | `"ghostMarks" \| "sessionReport" \| "fillersFromAudio"` | | |
| model | string | | Valor de `GEMINI_MODEL` |
| tokensIn / tokensOut / tokensCached | integer \| null | | Lo informado por el proveedor |
| latencyMs | integer | | |
| costUsd | number \| null | | `null` en v1: no hay precios en el código; el costo se calcula desde los tokens con los precios verificados al revisar la factura |
| status | `"ok" \| "repaired" \| "invalid_output" \| "error"` | | |
| sessionId, createdAt | string \| null / ISO | | |

**Cloud Storage** (no es Firestore): `tmp/{orgId}/{sessionId}.wav`, WAV PCM16 16 kHz mono, solo audio temporal.

### Relationships

- `users —(1:1)→ orgs` (la personal) · `orgs —(1:N)→ members` · `orgs —(1:N)→ {voiceSheet, phrases, sessions, reports, vocab, challenges, usage, llm_calls}`.
- `sessions —(1:0..1)→ reports` (mismo id) · `sessions —(N:0..1)→ phrases` (campo `phraseId`).
- **Borrado:** `DELETE …/sessions/:id` borra sesión, informe y audio. `DELETE /api/v1/orgs/:orgId` (confirmación `BORRAR`) borra recursivamente `orgs/{orgId}`, `users/{uid}`, el audio `tmp/{orgId}/` y el usuario de Auth. No hay cascadas implícitas: las hace el servidor, en código probado.

### Indexes

| Collection | Index | Why |
|---|---|---|
| sessions | compuesto `profileId ASC + startedAt DESC` | Historial por perfil (Inicio, Baseline) |
| sessions | exención del campo `contour` (`indexes: []`) | Un array de 3000 elementos produciría hasta 6000 entradas de índice; el límite es 40 000 por documento y el campo nunca se consulta |
| (resto) | índices de campo único automáticos | `startedAt` para listados cronológicos |

### Schema

La fuente de verdad son los esquemas zod de `packages/shared/src/schemas/` (el código de abajo es el contrato; los pasos 3, 15, 16 y 17 lo completan con los tipos `Metrics`, `Verdict`, etc.):

```ts
import { z } from "zod";

export const PROFILE_IDS = ["redes", "tarima", "eventos"] as const;
export const ProfileIdSchema = z.enum(PROFILE_IDS);
export const IsoSchema = z.iso.datetime();

export const COLLECTION_NAMES = [
  "members", "voiceSheet", "phrases", "sessions", "reports",
  "vocab", "challenges", "usage", "llm_calls",
] as const; // schemas/paths.ts — subcolecciones bajo orgs/{orgId}

export const UserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().nullable(),
  personalOrgId: z.string().min(8),
  themePreference: z.enum(["dark", "light", "system"]).default("dark"),
  sttLocale: z.enum(["es-US", "es-MX", "es-419"]).default("es-US"),
  createdAt: IsoSchema,
});

export const OrgSchema = z.object({
  name: z.string().min(1),
  plan: z.literal("free"),
  ownerUid: z.string().min(1),
  createdAt: IsoSchema,
});

export const MemberSchema = z.object({ role: z.literal("owner"), joinedAt: IsoSchema });

export const EmphasisMarkSchema = z.object({
  wordIndex: z.number().int().min(0),
  kind: z.enum(["numero", "dolor", "llamado", "idea"]),
  strength: z.number().min(0).max(1),
});
export const PauseMarkSchema = z.object({
  afterWordIndex: z.number().int().min(0),
  kind: z.enum(["corta", "larga", "respiracion"]),
});
export const GhostSpecSchema = z.object({
  marks: z.array(EmphasisMarkSchema),
  pauses: z.array(PauseMarkSchema),
  source: z.enum(["heuristic", "gemini"]),
});

export const PhraseSchema = z.object({
  text: z.string().min(12).max(400),
  profileId: ProfileIdSchema,
  ghostSpec: GhostSpecSchema,
  bestRunContour: z.array(z.number().int()).max(3000).nullable(),
  seeded: z.boolean(),
  createdAt: IsoSchema,
});

export const MetricsSchema = z.object({
  trackingPct: z.number().min(0).max(100).nullable(),
  diction: z.number().min(0).max(100),
  fillersCount: z.number().int().min(0),
  fillersByWord: z.record(z.string(), z.number().int().min(0)),
  ppm: z.number().min(0),
  pauseRatio: z.number().min(0).max(1),
  pauseCount: z.number().int().min(0),
  greenZonePct: z.number().min(0).max(100).nullable(),
  activeVocabPer100: z.number().min(0),
  comodinCount: z.number().int().min(0),
});

export const SessionSchema = z.object({
  startedAt: IsoSchema,
  endedAt: IsoSchema.nullable(),
  profileId: ProfileIdSchema,
  mode: z.enum(["libre", "frase", "mi-mejor-yo"]),
  phraseId: z.string().nullable(),
  durationSec: z.number().min(0).max(270),
  state: z.enum(["recording", "done", "failed"]),
  contour: z.array(z.number().int()).max(3000),
  referenceHz: z.number().positive().nullable(),
  metrics: MetricsSchema.nullable(),
  transcript: z.string(),
  utterances: z.array(z.object({ text: z.string(), confidence: z.number().min(0).max(1).nullable() })),
  verdict: z.object({
    perfect: z.boolean(),
    failedChecks: z.array(z.enum(["seguimiento", "diccion", "muletillas", "ritmo"])),
    divergence: z.object({ second: z.number(), word: z.string() }).nullable(),
  }).nullable(),
  sttSeconds: z.number().min(0),
});

export const UsageSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sttSeconds: z.number().min(0),
  cost_usd: z.number().min(0),
  sessions: z.number().int().min(0),
});
```

Los demás esquemas (`VoiceSheetSchema`, `ReportSchema`, `VocabSchema`, `ChallengeSchema`, `LlmCallSchema`) siguen las tablas de arriba campo por campo; el paso 3 los escribe (incluido `ReportSchema`) y el paso 16 añade `GhostMarksSchema` y `FillersFromAudioSchema` en `packages/shared/src/llm-schemas.ts`.

### Migrations

NOT APPLICABLE — Firestore no tiene migraciones de esquema ni herramienta que las genere. La regla de cambio: todo campo nuevo es opcional con valor por defecto en el esquema zod; un campo renombrado se añade primero (expandir), se rellena con un script idempotente, se cambian las lecturas y solo después se elimina el viejo (contraer), en despliegues distintos. Los índices y las reglas se despliegan con `firebase deploy --only firestore` (paso manual M5). Ningún paso de §9 depende de esta sección para un contrato de formato: los contratos de datos están en los esquemas de arriba.

### Seed data

No hay script de siembra. En local, el usuario de prueba `e2e@pulso.test` (contraseña `pulso-test-1234`) se crea en el emulador de Auth desde el botón "Entrar con cuenta de prueba"; el primer `POST /api/v1/session` crea su organización. Las **10 frases del repertorio** se siembran de forma perezosa (idempotente) en la primera `GET /api/v1/orgs/:orgId/phrases` desde `REPERTOIRE_SEED` (paso 17).

---

## 5. API Design

### Conventions

- Base path: `/api/v1`. Fuera del prefijo: `GET /health`, `GET /health/deep`, `GET /ws/audio` (WebSocket) y `POST /internal/sweep-audio`.
- Autenticación: `Authorization: Bearer <Firebase ID token>`. El navegador no puede enviar cabeceras en el handshake de WebSocket: el token va en el **primer mensaje** (nunca en la URL).
- Éxito: el objeto JSON de la ruta (sin envoltorio). **Error, siempre:** `{ "error": { "code": string, "message": string, "requestId": string } }` y cabecera `x-request-id`.
- Códigos de error: `unauthenticated` 401 · `forbidden_email` 403 · `not_found` 404 (también para recursos de otra organización) · `validation_error` 422 · `quota_exceeded` 429 · `rate_limited` 429 (con `retry-after`) · `upstream_unavailable` 503 · `internal` 500.
- Validación: zod en cada borde (`@hono/zod-validator`), esquemas en `@pulso/shared`.
- Paginación: listados pequeños por organización (historial de sesiones: `?limit=` por defecto 20, máximo 50, ordenado por `startedAt desc` con cursor `startAfter`).
- Idempotencia: `POST /session` es idempotente por `uid`; `finish` ignora un segundo cierre de una sesión ya `done`.
- Límites de tasa: 60 solicitudes/min por `uid`, 10/min por IP en `POST /session` (en memoria, por instancia; ver §14).
- CORS: orígenes de `WEB_ORIGINS` (el navegador llama directo al servicio de Cloud Run en producción; Firebase Hosting sirve solo estáticos).

### Routes

| Method | Path | Description | Auth | Rate limit |
|---|---|---|---|---|
| GET | /health | Liveness: `{ ok: true, sha }` | pública | — |
| GET | /health/deep | Lee Firestore: `{ ok, firestore }` | pública | — |
| POST | /api/v1/session | Verifica token (revocación incluida), aplica lista de permitidos y aprovisiona usuario+org+membresía | token | 10/min por IP |
| GET | /api/v1/me | Usuario y organización | token | 60/min |
| PATCH | /api/v1/me | Tema e idioma STT | token | 60/min |
| GET | /api/v1/orgs/:orgId/phrases | Repertorio (siembra las 10 frases la primera vez) | token + miembro | 60/min |
| POST | /api/v1/orgs/:orgId/phrases | Frase propia | token + miembro | 60/min |
| DELETE | /api/v1/orgs/:orgId/phrases/:id | Borra una frase propia | token + miembro | 60/min |
| POST | /api/v1/orgs/:orgId/ghost | Marcas de énfasis para el texto (Gemini o heurística) | token + miembro | 60/min |
| POST | /api/v1/orgs/:orgId/sessions | Crea la sesión (`recording`) | token + miembro | 60/min |
| POST | /api/v1/orgs/:orgId/sessions/:id/finish | Guarda contorno y métricas, genera informe, borra audio | token + miembro | 60/min |
| GET | /api/v1/orgs/:orgId/sessions/:id | Lee sesión (y su informe si existe) | token + miembro | 60/min |
| DELETE | /api/v1/orgs/:orgId/sessions/:id | Borrado duro de sesión, informe y audio | token + miembro | 60/min |
| PUT | /api/v1/orgs/:orgId/voice-sheet/:profileId | Guarda la ficha vocal | token + miembro | 60/min |
| POST | /api/v1/orgs/:orgId/baseline/complete | Construye las fichas vocales desde las sesiones de línea base | token + miembro | 60/min |
| GET, PUT | /api/v1/orgs/:orgId/vocab | Diccionario personal | token + miembro | 60/min |
| GET, PUT | /api/v1/orgs/:orgId/challenge | Reto semanal | token + miembro | 60/min |
| GET | /api/v1/orgs/:orgId/export | JSON con todos los datos (exige token no revocado) | token + owner | 60/min |
| DELETE | /api/v1/orgs/:orgId | Borra la cuenta (`{ confirm: "BORRAR" }`) | token + owner | 60/min |
| GET (WS) | /ws/audio | Audio PCM16 → STT; ver protocolo abajo | token en el 1.er mensaje | tope 270 s + cuota diaria |
| POST | /internal/sweep-audio | Borra objetos de `tmp/` con más de 24 h | OIDC de Cloud Scheduler | horario |

### Critical endpoints — full detail

**`POST /api/v1/session`**
- Request: sin cuerpo. Cabecera `Authorization: Bearer <idToken>`.
- Validaciones: el token se verifica con `verifyIdToken(token, true)` (comprueba revocación); `email` presente y `email_verified === true`; el email (minúsculas) pertenece a `ALLOWED_EMAILS`.
- Errores: sin token o inválido → 401 `unauthenticated`; email fuera de la lista → 403 `forbidden_email` **sin escribir nada**.
- Efectos: transacción Firestore que, si `users/{uid}` no existe, crea `users/{uid}`, `orgs/{orgId}` (`plan: "free"`, `ownerUid: uid`) y `orgs/{orgId}/members/{uid}` (`role: "owner"`); si existe, no escribe. Idempotente también bajo concurrencia.
- Respuesta 200: `{ user: { uid, email, displayName, themePreference, sttLocale }, org: { id, name, plan } }`.

**`GET /ws/audio` (protocolo)**
- Cliente → servidor: primer mensaje de texto, dentro de 5 s: `{ "type": "auth", "token": string, "sessionId": string, "profileId": enum, "locale": enum }`. Luego tramas **binarias** PCM16 little-endian mono 16 kHz (3200 bytes = 100 ms). Al terminar: `{ "type": "end" }`.
- Servidor → cliente: `{ "type": "ready" }`, `{ "type": "transcript", "text": string, "isFinal": boolean, "confidence": number | null }`, `{ "type": "limit" }`, `{ "type": "error", "code": string }`, `{ "type": "done", "utterances": [{ "text", "confidence" }] }`.
- Cierres: 1000 normal (incluido el tope) · 4400 trama inválida (longitud impar o > 25 000 bytes) · 4401 sin token a tiempo o token inválido · 4403 email fuera de la lista · 4429 cuota diaria agotada.
- Límites: 270 s de audio por sesión (se cuentan bytes ÷ 32 000, no reloj); límite de STT v2 de 25 KB por solicitud y stream de 5 min. El servidor abre el stream de STT solo después de autenticar y pasar la cuota. Al cerrar (cualquier causa) registra `usage/{hoy}` con los segundos reales.
- Cloud Run: las conexiones WebSocket también están sujetas al tiempo de espera de la solicitud (300 s por defecto, 3600 s máximo) y la afinidad de sesión es "best effort": el cliente reconecta (hasta 3 intentos con 500/1000/2000 ms).

**`POST /api/v1/orgs/:orgId/sessions/:id/finish`**
- Request: `{ contour: number[] (≤ 3000), referenceHz, metrics, transcript, utterances }` (esquema `FinishSessionSchema`).
- Validaciones: el usuario es miembro de `:orgId` (si no, 404, sin escribir); la sesión existe y está `recording` o `done`; `contour` ≤ 3000 puntos (si no, 422 `validation_error`).
- Efectos: guarda `contour` como enteros (semitonos × 10), `metrics` (con `diction` calculada en servidor), `state: "done"`; si hay veredicto, lo guarda; genera el informe con Gemini (si falla: sesión sin informe, no error) y **siempre** borra `tmp/{orgId}/{sessionId}.wav`.
- Respuesta 200: la sesión guardada y `report` (o `null`).

**`POST /internal/sweep-audio`**
- Auth: `Authorization: Bearer <OIDC>` verificado con `OAuth2Client.verifyIdToken({ idToken, audience: SWEEP_AUDIENCE })`; el `email` del payload debe ser `SCHEDULER_SA_EMAIL` y `email_verified`.
- Errores: sin token válido → 401, sin borrar nada.
- Efecto: borra todo objeto de `tmp/` con antigüedad > 24 h. Respuesta 200: `{ deleted: number }`. **Garantía honesta:** borrado ≤ 24 h + intervalo del barredor (1 h) en condiciones normales; la regla de ciclo de vida `age:1` es solo respaldo y no garantiza el momento.

### Contratos de dominio (packages/shared) — fórmulas y algoritmos

Estas funciones son puras y están probadas en los pasos 8–17. Los valores son constantes con nombre.

| Contrato | Definición |
|---|---|
| Audio | 16 000 Hz, tramas de 100 ms = 1600 muestras, ventana del monitor 8 s, 10 datos/s (80 puntos), tope de sesión 270 s, 32 000 bytes/s |
| Tono | YIN (fmin 70, fmax 500 Hz, umbral 0.15), mediana de 5, corrección de octava (±12 semitonos ± 1), `semitonos = 12 × log2(hz / referenciaHz)`; sin voz si `rms < 0.01` o ningún `τ` baja del umbral |
| Línea plana | `monotonia`: ≥ 60 % sonoras en 2 s y desviación estándar < 0.35 st; `pausa`: ≥ 4 muestras no sonoras; `variada`: desviación ≥ 1.5 st |
| Ritmo | `ppm = palabras ÷ (tiempo hablado en min)`; pausa = racha ≥ 400 ms de no-voz dentro del tramo hablado; `pauseRatio` = tiempo en pausa ÷ tiempo del tramo hablado |
| Perfiles | Redes 140–160 ppm, pausas 5–12 % `corta`; Tarima 120–140 ppm, pausas 20–35 % `larga`; Eventos 110–130 ppm, pausas 12–22 % `respiracion`; formas en `profiles.ts` (paso 11) |
| Fantasma | `contour` a 10 Hz en semitonos relativos; `baseSt + Σ strength × peakSt × gauss(Δt/σ)`, acotado inferiormente por `floorSt`; determinista |
| Seguimiento | `tol = max(0.75, 0.15 × rango del fantasma)` st; acierto si algún `k ∈ [i−3, i+3]` cumple `|usuario[i] − fantasma[k]| ≤ tol`; `pct` = aciertos ÷ muestras donde el fantasma espera voz; divergencia = primer tramo de ≥ 1 s sin aciertos → `{ second, word }` |
| Dicción | `100 × (0.55 × confianza + 0.25 × factorRitmo + 0.20 × factorPausas)`; factor = 1 en rango, si no `max(0, 1 − distancia/20)` (ppm) o `max(0, 1 − distancia/0.15)` (pauseRatio) |
| Veredicto | `perfect` ⇔ seguimiento ≥ 85 ∧ dicción ≥ 85 ∧ 0 muletillas ∧ ppm en el rango del perfil |
| Nivel | `0.30·dicción + 0.25·(100 − muletillasNorm) + 0.20·controlFrecuencia + 0.15·vocabScore + 0.10·constancia`; Aspirante < 60, Orador 60–79.99, Maestro 80–89.99, Arquitecto de la voz ≥ 90 sostenido 2 semanas |
| Vocabulario | `COMODIN = cosa, eso, muy, también, bueno, algo`; activo = palabras únicas significativas por 100; meta +30 % en 90 días; reto semanal: legado, previsión, dignidad, amparo, innegociable |

---

## 6. Frontend Architecture

### Routes

Contrato del frontend: `apps/web/src/routes.ts` (manifiesto) lo repite en código y el router se construye desde él (paso 7). **Todas las rutas son cliente** (SPA tras login, sin SEO).

| Route | Page | Data source | Auth |
|---|---|---|---|
| /entrar | Entrar (Google; cuenta de prueba solo con emuladores) | Firebase Auth | pública |
| / | Inicio: nivel (o "Midiendo tu línea base"), reto semanal, siguiente sesión | Firestore (lectura) + `POST /session` | usuario |
| /monitor | Monitor en vivo: canvas al centro, 3 medidores debajo, botón grabar, selector de perfil, resumen de texto | Micrófono local; WebSocket `/ws/audio`; `voiceSheet` | usuario |
| /frase-perfecta | Frase Perfecta: 3 pasos y veredicto con sello | Repertorio; `POST …/ghost`; WebSocket | usuario |
| /sesiones/:id | Reporte de sesión | `GET …/sessions/:id` | usuario |
| /repertorio | 10 frases con vista previa del fantasma | `GET …/phrases` | usuario |
| /vocabulario | Palabras comodín, reemplazos, diccionario personal, reto semanal | `…/vocab`, `…/challenge`, sesiones | usuario |
| /baseline | Semana de línea base y ficha vocal | `…/voice-sheet`, sesiones | usuario |
| /ajustes | Tema, idioma STT, exportar, borrar cuenta | `PATCH /me`, `…/export`, `DELETE …` | usuario |

### Rendering strategy

Todo es **renderizado en cliente** con Vite: `index.html` estático + bundle; React Router 7 en modo biblioteca (`createBrowserRouter`). Cada ruta se carga con `import()` dinámico salvo `/entrar`. El tema se aplica antes del primer pintado con un script bloqueante (`/theme-init.js`) que fija `data-theme` en `<html>`. El service worker (vite-plugin-pwa, `registerType: "autoUpdate"`) precachea el shell y **nunca** intercepta `/api`, `/ws` ni `/health`. Hosting reescribe `**` a `/index.html` y sirve `sw.js` y `theme-init.js` con `Cache-Control: no-cache`.

### Component hierarchy

```
<Providers: QueryClient, AuthProvider>
  <RouterProvider>
    /entrar  → <Entrar/>                                   (cliente)
    <RequireAuth>
      <AppShell>                                           (skip link · header · nav · <main id="contenido">)
        /monitor  → <Monitor/>
                      <ProfileSelect/>
                      <MonitorCanvas/>        (cliente puro: canvas 60 fps + AudioWorklet vía MicCapture)
                      <Meters/>               (Frecuencia · Muletillas · Ritmo · Dicción)
                      <p role="status" aria-live="polite">   (resumen de texto, ≤ 1 cambio / 2 s)
        /frase-perfecta → <FrasePerfecta/> → <Monitor/> reutilizado + <Verdict/>
        /sesiones/:id   → <Sesion/> → <Verdict/>
```

### State management

- **Estado de servidor:** TanStack Query (`@tanstack/react-query`) para lecturas de Firestore y llamadas a la API; las mutaciones invalidan claves por organización.
- **Estado local:** React (`useState`/`useReducer`) para el monitor; el bucle de dibujo usa `ref`s y `requestAnimationFrame`, y publica estado de React como máximo 10 veces por segundo.
- **Sesión:** `AuthProvider` (cargando | anónimo | autenticado + organización personal). Sin librería de estado global; sin `react-hook-form` (los formularios son pocos y simples).
- **Fuera del estado global a propósito:** las muestras de tono (viven en `RingSeries`), el transcript en vivo (viven en el hook del WebSocket) y el tema (vive en `<html data-theme>` y `localStorage`).

### Loading, empty, and error states

Cada pantalla usa `PageState` (paso 7): **cargando** = esqueleto con las mismas dimensiones que el contenido (sin salto de layout), **vacío** = mensaje + acción principal, **error** = mensaje + "Reintentar" + `requestId` si lo hay. Casos concretos: Monitor sin permiso de micrófono (`mic.denied`, explica cómo reactivarlo), sin dispositivo (`mic.noDevice`), conectando al servidor ("Conectando…" por arranque en frío), reconectando y fallo definitivo; Repertorio y Vocabulario vacíos con su acción; Reporte sin informe de Gemini ("Sesión guardada sin informe"); Inicio de un usuario nuevo ("Midiendo tu línea base").

---

## 7. Design System

Dirección aprobada: **"Monitor clínico" con lujo sobrio y elegante, sensación de app de clase.** Principios: oscuro por defecto con tema claro completo desde el día 1; mucho espacio en blanco; líneas finas (hairline); serif de alto contraste para títulos; carmesí/rosa de alerta como acento escaso (sello, alerta); sin gradientes vistosos ni brillos; movimiento lento y contenido. Diseñar a 375 px primero.

### Colors

Los contrastes son razones WCAG 2.x calculadas el 2026-10-04 con un script sobre estos hex y reproducidas por la prueba del paso 2 (`apps/web/src/styles/tokens.test.ts`, tolerancia 0.05). Las razones se listan sobre bg / surface / surface2.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg` | `#0B0D0C` | `#F7F3EA` | Fondo de página |
| `--surface` | `#121614` | `#FFFDF8` | Tarjetas, paneles, diálogos |
| `--surface-2` | `#1A201D` | `#EDE6D6` | Superficies elevadas, pistas de medidores |
| `--text` | `#F2EDE3` | `#1A1B19` | Texto principal |
| `--text-secondary` | `#A9B0A9` | `#55584F` | Texto secundario |
| `--signal` | `#3DDC84` | `#0B7A43` | Tu voz (línea sólida), zona verde, botón primario |
| `--ghost` | `#E8C873` | `#7A5A00` | Línea fantasma (champán / bronce) |
| `--alert` | `#FF6B81` | `#C8102E` | Sello, alertas, línea plana |
| `--border-strong` | `#5F7A70` | `#7A7A6C` | Bordes de controles |
| `--focus` | `#7CC4FF` | `#0B5FB0` | Anillo de foco |
| `--hairline` | `#232B27` | `#D9D1BF` | Separadores decorativos (exentos de contraste) |
| `--on-signal` | = `--bg` | = `--bg` | Texto sobre relleno `--signal` |

| Par (primer plano) | Dark | Light | Umbral |
|---|---|---|---|
| text | 16.71 / 15.64 / 14.19 | 15.61 / 17.01 / 13.90 | ≥ 4.5 |
| text-secondary | 8.79 / 8.23 / 7.47 | 6.55 / 7.14 / 5.83 | ≥ 4.5 |
| signal | 10.93 / 10.23 / 9.28 | 4.89 / 5.33 / 4.35 | ≥ 4.5 (texto) · ≥ 3 (gráfico) |
| ghost | 12.01 / 11.25 / 10.20 | 5.76 / 6.28 / 5.13 | ≥ 4.5 |
| alert | 7.12 / 6.67 / 6.05 | 5.31 / 5.79 / 4.73 | ≥ 4.5 |
| border-strong | 4.18 / 3.91 / 3.55 | 3.93 / 4.28 / 3.50 | ≥ 3 |
| focus | 10.40 / 9.73 / 8.83 | 5.78 / 6.30 / 5.15 | ≥ 3 |

**Contrast:** los tres pares más arriesgados son `signal` claro sobre `surface2` (4.35, pasa como gráfico ≥ 3 y se usa solo para línea/relleno grande, no para texto pequeño sobre surface2), `border-strong` claro sobre `surface2` (3.50) y `border-strong` oscuro sobre `surface2` (3.55); los tres superan 3:1. **Daltonismo:** `signal` y `ghost` tienen casi la misma luminosidad (≈1.1:1 entre sí en oscuro, calculado con el mismo script), por lo que **nunca se distinguen solo por color**: la señal es sólida, gruesa (≈3 px) y lleva la etiqueta "TÚ"; el fantasma es punteado (≈2 px), lleva marcadores y la etiqueta "FANTASMA". La línea plana "alarma" no parpadea: cambia a `--alert` y a una etiqueta de texto.

**Capas de tokens:** primitivo (`--p-dark-bg`, `--p-light-bg`, …; los únicos hex del proyecto, en `tokens.css`) → semántico (`--bg`, `--text`, `--signal`, …; redefinidos por tema) → componente (`--button-bg`, `--card-bg`, `--meter-track`, `--focus-ring`). Un hex fuera de `tokens.css` es un defecto (`node scripts/check-no-hex.mjs`).

### Typography

| Role | Family | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Display | Fraunces (variable, eje wght) | 3rem / 1.1 | 600 | -0.01em |
| Heading (h1) | Fraunces | 2.25rem / 1.2 | 600 | -0.01em |
| Heading (h2) | Fraunces | 1.875rem / 1.3 | 600 | 0 |
| Heading (h3) | Fraunces | 1.5rem / 1.4 | 600 | 0 |
| Body / UI | Inter (variable) | 1rem / 1.6 (nunca < 16 px en móvil) | 400 / 500 | 0 |
| Small | Inter | 0.875rem / 1.5 | 400 | 0 |
| Caption | Inter | 0.75rem / 1.4 | 500 | 0.02em |
| Mono (Hz, puntajes, reloj) | JetBrains Mono (variable) | 1rem / 1.4 | 500 | 0 |

**Font loading:** autoalojadas con `@fontsource-variable/*` importadas desde `main.tsx` (el bundler emite los `.woff2`); `font-display: swap` (el valor por defecto de fontsource); pilas de respaldo `Georgia, serif` / `system-ui, sans-serif` / `ui-monospace, monospace`. Solo se cargan los subconjuntos latinos que el paquete expone por defecto.

### Spacing, radius, elevation

- Escala de espaciado base 4 px: 4, 8, 12, 16, 24, 32, 48, 64 (`--space-1` … `--space-16`).
- Radios: 4 px (campos), 8 px (botones y tarjetas), 12 px (paneles y diálogos); círculo para el botón de grabar.
- Elevación: plana — bordes hairline, sin sombras decorativas; un solo nivel de sombra para el diálogo (`0 8px 24px` con la opacidad del tema).
- Ancho máximo de contenido 1120 px · Breakpoints 640 / 768 / 1024 / 1280 / 1536 (los de Tailwind) · diseño a 375 px primero.

### Motion

UI: `ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`), 150–250 ms; sin rebotes. La línea del monitor se dibuja a 60 fps interpolando entre datos de 10 Hz. El sello "ORATORIA PERFECTA ✓" hace **un único pulso de 400 ms**. Con `prefers-reduced-motion: reduce` se eliminan pulsos y transiciones decorativas (la línea del monitor sí se dibuja: es la función del producto). Nada parpadea más de 3 veces por segundo. Usar `emil-design-eng` en los pasos 10, 11 y 18.

### Component style

Instrumento de precisión, no tablero de juego: superficies oscuras casi negras con verde esmeralda como única señal viva, champán para el fantasma, tipografía serif de alto contraste para los títulos y números tabulares monoespaciados para todo lo medible. Un componente nuevo pertenece si es sobrio, tiene bordes finos, mucho aire y un solo acento; no pertenece si lleva gradientes, brillos, sombras de color o animaciones decorativas.

---

## 8. Authentication & Authorization

### Provider and rationale

**Firebase Auth con Google como único proveedor.** Un solo proveedor de identidad (no hay segunda fuente de verdad), gratis (Google sign-in es "Tier 1": 0–50 000 MAU gratis vía Identity Platform) y dentro del mismo proyecto de Google Cloud que Firestore. La v1 está cerrada: el servidor solo aprovisiona emails de `ALLOWED_EMAILS`. Cuando se venda, se sustituye la lista por registro abierto y se publican política de privacidad y consentimiento (R8).

### Flows

1. **Entrar:** `/entrar` → `signInWithPopup(GoogleAuthProvider)` en escritorio; `signInWithRedirect` + `getRedirectResult` cuando la app corre como PWA instalada en iOS o en Safari (requiere `authDomain` propio del dominio de Hosting; en PWA instalada de iOS **no hay documentación**: se prueba en iPhone real, puerta manual M10). → `POST /api/v1/session` con el ID token → aprovisionamiento JIT → redirección a `next` (o `/`).
2. **Fallo de permitidos:** 403 `forbidden_email` → pantalla "Esta cuenta no está autorizada" con la opción de salir; no se crea ningún documento.
3. **Sesión caducada:** el SDK renueva el ID token; si falla, `AuthProvider` pasa a anónimo y la guardia redirige a `/entrar?next=…`.
4. **Salir:** `signOut` y limpieza de la caché de TanStack Query.
5. **Exportar y borrar la cuenta:** ver Ajustes (paso 19). El borrado exige escribir `BORRAR`, usa un token no revocado y elimina también el usuario de Auth.
6. **Cuenta de prueba:** solo con `VITE_USE_EMULATORS === "true"`, un botón "Entrar con cuenta de prueba" crea/inicia `e2e@pulso.test` contra el emulador de Auth. No es alcanzable en producción (la variable es falsa y el emulador no existe).

### Route protection

| Surface | Rule | Enforced where |
|---|---|---|
| Toda ruta salvo `/entrar` | Usuario autenticado | Cosmético: `apps/web/src/auth/RequireAuth.tsx` (redirige a `/entrar?next=`). **El control real es el servidor** |
| `/api/v1/**` | Token válido + email permitido | `apps/server/src/auth/verify.ts` (`requireUser`) |
| `/api/v1/orgs/:orgId/**` | Miembro de `:orgId` (si no, 404) | Guardia de organización (paso 15) + `org-store` |
| `/api/v1/orgs/:orgId/export`, `DELETE …` | `ownerUid` y token no revocado | `routes/account.ts` (`checkRevoked: true`) |
| `/ws/audio` | Token en el primer mensaje + lista + cuota | `ws/audio-gateway.ts` |
| `/internal/*` | OIDC de Cloud Scheduler | `routes/internal.ts` |
| Firestore (lectura del navegador) | Miembro de la organización; **escritura denegada** | `firestore.rules` |
| Storage | Sin acceso de clientes | `storage.rules` |

**Enforcement rule:** la autorización se comprueba en el servidor en cada petición. Las guardias del cliente son cosméticas. Un botón oculto no es un permiso.

### Roles and permissions

| Role | Can | Cannot |
|---|---|---|
| owner (único rol en v1) | Leer todo lo de su organización; crear/borrar sesiones y frases; exportar y borrar la cuenta | Leer o escribir en otra organización; escribir en Firestore desde el navegador |
| Anónimo | Ver `/entrar` | Cualquier ruta de datos |

### Sessions

Token de Firebase ID (JWT de ~1 h) renovado por el SDK; el servidor lo verifica con `verifyIdToken` en cada petición (sin revocación, por costo) y con `checkRevoked: true` en `POST /session`, exportar y borrar. Persistencia del SDK en IndexedDB (la gestiona Firebase; no hay cookies propias ni CSRF: la API usa cabecera `Authorization`, no cookies, por lo que no es susceptible a CSRF clásico). Nunca se guarda el token en `localStorage` por código propio.

### Multi-tenancy / row-level isolation

Mecanismo doble: (1) **reglas de Firestore** — solo un miembro lee `orgs/{orgId}/**` y nadie escribe desde el cliente; (2) **capa de datos** — `createOrgStore(db, orgId)` es el único constructor de rutas `orgs/...` y valida el `orgId`; el guardia de organización del servidor devuelve **404 (no 403)** si el usuario no es miembro, para no confirmar la existencia del id. La prueba `rules-isolation` recorre `COLLECTION_NAMES` con `@firebase/rules-unit-testing` (paso 3).

---

## 9. BUILD ORDER

Esta sección es la razón de ser del blueprint: un constructor que sigue la sección 9 al pie de la letra y se detiene cuando cada puerta pasa, entrega el proyecto. **Los pasos que necesitan credenciales reales de Google, un dispositivo físico o a una persona NO son pasos de esta sección**: están en la lista de puertas manuales de §20.1 con dueño (Steven) y comando exacto.

### The rules of a step

1. **Un paso, una sentada.** Cada paso lleva Do, Done when, Verify y Checkpoint. Los `files` de `tasks.json` usan globs solo para directorios que el paso posee por completo o para ediciones de un directorio de `src/` (máximo 5 entradas por tarea y 6 criterios); el bloque Do de cada paso nombra cada archivo. **«Una sentada» se mide por la unidad de trabajo, no por el conteo de archivos**: un Do que posee un directorio completo (p. ej. `schemas/` en el paso 3 o `deploy/` en el paso 21) lista su contenido, y cuando un Do nombra más de unos 8 archivos lo justifica en una línea «Una sola sentada: …» (esquemas generados con un único patrón, módulos de arranque de pocas líneas, archivos de texto sin lógica). **`packages/shared/src/index.ts` es la entrada pública única del paquete:** todo paso que añade exportes lo edita («`index.ts` (editar) — reexporta …» en su Do), y todas las `deps.*` de `createApp` posteriores a `sha` son opcionales (el paso 4 fija la regla).
2. **Checkpoint = bloque de shell**: `git add -A && git commit -m "step N: slug"` y luego `git tag step-NN-slug` (cero relleno al número de paso). Es el objetivo de reversión del paso siguiente (`git reset --hard step-NN-slug`).
3. **Done when** son condiciones observables y decidibles por un script, en esta máquina, durante la build.
4. **Verify es shell literal** y **cada línea termina en 0 cuando el paso es correcto**. Las comprobaciones cuyo éxito es un código distinto de cero están envueltas en una aserción del código esperado (`grep …; test $? -eq 1`).
5. **Un paso no está hecho hasta que pasan sus verificaciones y siguen pasando las de los pasos anteriores.**
6. **Nunca saltes adelante**: si el paso N está bloqueado, detente y repórtalo.
7. **Ningún paso introduce un requisito que rompa la puerta de uno anterior.** Las variables de entorno son obligatorias solo desde el paso que las consume (§10, columna "Requerida desde el paso"); `scripts/smoke-server.mjs` carga `.env.example` completo, así que nunca hay que fabricar valores.
8. **Ningún Verify depende de su propio Checkpoint**: las aserciones sobre archivos commiteados están en el bloque Checkpoint, después del commit (`git ls-files --error-unmatch <ruta>`, una ruta por invocación).
9. **Ningún número derivado sin contarlo**: las únicas cifras que las puertas afirman son invariantes del producto (10 frases del repertorio, 270 s, 3000 puntos, umbrales de fórmulas). El resto son propiedades ("0 failed, 0 skipped").
10. **Los dobles solo en pruebas**: el STT grabado y las respuestas grabadas de Gemini viven en `apps/server/tests/**` y `evals/**`; nunca en el camino del producto.

### One step, one unit — the counting rule

> **Un paso de §9 = una tarea de `tasks.json` = un bloque de tarea en un archivo de épica.**

Hay **21 pasos**, por lo tanto 21 tareas y 21 bloques de tarea. Rango legal de épicas para 21 pasos: al menos `ceil(21 ÷ 9) = 3`, como máximo `floor(21 ÷ 5) = 4`. Se eligen **3 épicas** (cortes naturales por capa/superficie): `01-fundacion` (pasos 1–7, 7 tareas), `02-nucleo-de-voz` (pasos 8–12, 5 tareas) y `03-coaching-y-lanzamiento` (pasos 13–21, 9 tareas). Los pasos 3 a 7, 17 y 18, 19 a 21 son el resultado de partir pasos que, juntos, tocaban demasiados archivos para una sentada. Los slugs de épica coinciden con el campo `epic` de `tasks.json` y con los nombres de archivo de `epics/`.

### Step map

| # | Paso | Depende de | Toca | Puerta |
|---|---|---|---|---|
| 1 | Monorepo, tooling y servidor /health ejecutable | — | `packages/shared/src/**`, `apps/server/src/**`, `apps/web/index.html`, `apps/web/src/**`, `scripts/smoke-server.mjs` | `test -f apps/web/dist/index.html` |
| 2 | Sistema visual Monitor clínico: tokens y tema | 1 | `apps/web/index.html`, `apps/web/public/theme-init.js`, `apps/web/src/**`, `scripts/check-no-hex.mjs`, `tests/e2e/ui/layout.spec.ts` | `pnpm test:e2e tests/e2e/ui/layout.spec.ts` |
| 3 | Esquemas de datos, reglas de Firestore y org-store | 1 | `packages/shared/src/schemas/**`, `apps/server/src/data/org-store.ts`, `apps/server/tests/emulator/**`, `tests/repo/firestore-indexes.test.ts` | `node scripts/smoke-server.mjs` |
| 4 | Entorno validado, logger con request id y health profundo | 1 | `apps/server/src/*.ts`, `apps/server/tests/helpers/env.ts`, `apps/server/tests/emulator/health.test.ts` | `node scripts/smoke-server.mjs` |
| 5 | Auth en el servidor: token, lista de permitidos y JIT | 3, 4 | `apps/server/src/auth/**`, `apps/server/src/routes/session.ts`, `apps/server/src/*.ts`, `apps/server/tests/**` | `node scripts/smoke-server.mjs` |
| 6 | Auth en la web: Google, guardia de rutas y entorno | 5, 2 | `apps/web/src/**`, `tests/e2e/app/auth.spec.ts` | `pnpm test:e2e:full tests/e2e/app/auth.spec.ts` |
| 7 | Shell autenticado, ajustes y PWA instalable | 2, 6 | `apps/web/src/**`, `apps/server/src/routes/session.ts`, `scripts/check-pwa.mjs`, `tests/repo/tokens-parity.test.ts`, `tests/e2e/*/{shell,pwa}.spec.ts` | `pnpm test:e2e:full tests/e2e/app/shell.spec.ts` |
| 8 | Captura de micrófono con AudioWorklet | 7 | `packages/shared/src/dsp/**`, `packages/shared/src/constants.ts`, `packages/shared/src/index.ts`, `apps/web/src/**`, `tests/e2e/ui/worklet.spec.ts` | `pnpm test:e2e tests/e2e/ui/worklet.spec.ts` |
| 9 | Tono con YIN, mediana y semitonos | 8 | `packages/shared/src/dsp/yin.ts`, `packages/shared/src/dsp/pitch.ts`, `packages/shared/src/dsp/*.test.ts`, `packages/shared/src/index.ts` | `pnpm test:unit packages/shared` |
| 10 | Monitor en vivo sobre canvas | 9, 7 | `packages/shared/src/monitor/**`, `apps/web/src/audio/**`, `apps/web/src/monitor/**`, `apps/web/src/routes/Monitor.tsx`, `tests/e2e/app/monitor.spec.ts` | `pnpm test:e2e:full tests/e2e/app/monitor.spec.ts` |
| 11 | Línea fantasma y puntaje de seguimiento | 10 | `packages/shared/src/profiles.ts`, `packages/shared/src/ghost/**`, `packages/shared/src/index.ts`, `apps/web/src/monitor/**`, `apps/web/src/i18n/es.ts` | `pnpm build` |
| 12 | Medidores: frecuencia, muletillas y ritmo local | 11 | `packages/shared/src/meters/**`, `packages/shared/src/index.ts`, `apps/web/src/meters/**`, `apps/web/src/routes/Monitor.tsx`, `apps/web/src/i18n/es.ts` | `pnpm build` |
| 13 | Motores de coaching: vocabulario, reto, nivel y línea base | 12 | `packages/shared/src/coaching/**`, `packages/shared/src/index.ts` | `pnpm test:unit packages/shared` |
| 14 | Pasarela WebSocket de audio y adaptador STT | 5, 8 | `packages/shared/src/wire.ts`, `packages/shared/src/index.ts`, `apps/server/src/**`, `apps/server/tests/**`, `apps/web/src/audio/**` | `node scripts/smoke-server.mjs` |
| 15 | Sesiones, dicción y retención de audio | 14, 12 | `packages/shared/src/coaching/diction.ts`, `packages/shared/src/schemas/session.ts`, `packages/shared/src/index.ts`, `apps/server/src/**`, `apps/server/tests/**` | `node scripts/smoke-server.mjs` |
| 16 | Pasarela Gemini, informe estructurado y evaluación | 15, 13 | `packages/shared/src/llm-schemas.ts`, `packages/shared/src/index.ts`, `apps/server/src/**`, `apps/server/tests/**`, `apps/server/evals/**` | `grep -rl '@google/genai' apps/server/src | grep -qx 'apps/server/src/llm/gateway.ts'` |
| 17 | Veredicto, repertorio de 10 frases y rutas de frases | 16, 12 | `packages/shared/src/coaching/verdict.ts`, `packages/shared/src/coaching/repertoire.ts`, `packages/shared/src/index.ts`, `apps/server/src/**`, `apps/server/tests/emulator/phrases.test.ts` | `node scripts/smoke-server.mjs` |
| 18 | Frase Perfecta en pantalla y flujo de grabación | 17 | `apps/web/src/session/**`, `apps/web/src/routes/**`, `apps/web/src/components/Verdict.tsx`, `apps/web/src/meters/Meters.tsx`, `tests/e2e/app/perfect-phrase.spec.ts` | `pnpm test:e2e:full tests/e2e/app/perfect-phrase.spec.ts` |
| 19 | Rutas y pantallas del coaching; exportar y borrar cuenta | 18 | `apps/server/src/routes/**`, `apps/server/src/app.ts`, `apps/server/tests/emulator/**`, `apps/web/src/**`, `tests/e2e/app/baseline.spec.ts` | `pnpm test:e2e:full tests/e2e/app/baseline.spec.ts` |
| 20 | Límites de tasa, presupuesto de bundle y pasada a11y | 19 | `apps/server/src/rate-limit.ts`, `apps/server/src/app.ts`, `apps/server/src/rate-limit.test.ts`, `deploy/check-bundle-budget.mjs`, `tests/e2e/app/a11y.spec.ts` | `pnpm test:e2e:full tests/e2e/app/a11y.spec.ts` |
| 21 | Scripts de entrega, runbook y CI | 20 | `deploy/*.sh`, `deploy/storage-lifecycle.json`, `deploy/RUNBOOK.md`, `.github/workflows/ci.yml`, `tests/repo/*.test.ts` | `pnpm test:e2e:full` |

---

#### Paso 1 — Monorepo, tooling y servidor /health ejecutable

**Tarea:** `E1-T1` · **Épica:** `01-fundacion`

**Do**

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

**Done when**

- [ ] **WHEN** `pnpm install --frozen-lockfile` runs **THE SYSTEM SHALL** exit 0 without modifying `pnpm-lock.yaml`.
- [ ] **WHEN** `pnpm typecheck` runs **THE SYSTEM SHALL** exit 0 for the root project, `@pulso/shared`, `@pulso/server` and `@pulso/web`.
- [ ] **WHEN** `pnpm lint` runs **THE SYSTEM SHALL** exit 0 with zero errors, including over the files copied from `workspace/` and with `blueprints/` excluded.
- [ ] **WHEN** `pnpm build` runs **THE SYSTEM SHALL** emit `packages/shared/dist/index.js`, `apps/server/dist/index.js` and `apps/web/dist/index.html`.
- [ ] **WHEN** `node scripts/smoke-server.mjs` runs **THE SYSTEM SHALL** start `node apps/server/dist/index.js` on a free port, receive status 200 and a JSON body `{ ok: true, sha: <non-empty string> }` from `GET /health` (a body that `app.ts` builds and validates with `HealthResponseSchema` imported from `@pulso/shared`), confirm that `@pulso/shared` resolves from `apps/server` to `packages/shared/dist/index.js`, stop the process and exit 0.
- [ ] **WHEN** `pnpm test:unit` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped.

**Verify**

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

---

#### Paso 2 — Sistema visual Monitor clínico: tokens y tema

**Tarea:** `E1-T2` · **Épica:** `01-fundacion`

**Do**

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

**Done when**

- [ ] **WHEN** `pnpm test:unit apps/web/src/styles/tokens.test.ts` runs **THE SYSTEM SHALL** parse `tokens.css` and assert, in the dark and in the light theme, that text, secondary text, ghost and alert each reach at least 4.5:1 against bg, surface and surface2, that signal reaches at least 4.5:1 against bg and surface and at least 3:1 against surface2 (light surface2 = 4.35, graphic use only), that strong border and focus each reach at least 3:1 against the same three, and that every ratio equals the measured value of the design table within 0.05.
- [ ] **WHEN** `node scripts/check-no-hex.mjs` runs **THE SYSTEM SHALL** exit 0 because no hex color literal appears in `apps/web/src` outside `apps/web/src/styles/tokens.css` and its tests, nor in `apps/web/index.html`.
- [ ] **WHEN** `pnpm test:unit apps/web/src/theme-init.test.ts` runs **THE SYSTEM SHALL** assert that `index.html` declares `lang="es"` and `data-theme="dark"` on `<html>` and loads `/theme-init.js` as a blocking script before any stylesheet, and that executing `theme-init.js` with `localStorage` value `light` sets `data-theme` to `light` and with value `system` and a dark `matchMedia` sets it to `dark`.
- [ ] **WHEN** `pnpm test:e2e tests/e2e/ui/layout.spec.ts` runs **THE SYSTEM SHALL** load `/` at 375x812 and at 1440x900 and find `document.documentElement.scrollWidth` equal to `document.documentElement.clientWidth` on both.

**Verify**

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

---

#### Paso 3 — Esquemas de datos, reglas de Firestore y org-store

**Tarea:** `E1-T3` · **Épica:** `01-fundacion`

**Do**

Existen los esquemas zod de las colecciones, el módulo único de acceso por organización y las reglas de Firestore con su exención de índice, con pruebas de aislamiento contra el emulador.

Capa de datos con aislamiento por organización. Firestore con el SDK oficial, **sin ORM**. El navegador solo lee (reglas); toda escritura pasa por el servidor con Admin SDK. Este paso no toca el entorno ni el servidor HTTP: las pruebas crean su propio cliente de Firestore contra el emulador.

- `packages/shared/src/schemas/` — el directorio completo que posee este paso: un archivo por documento de §4 con su esquema zod y `type` inferido (`user.ts`, `org.ts`, `member.ts`, `voice-sheet.ts`, `phrase.ts`, `session.ts`, `report.ts` —incluye `ReportSchema` con los campos de §4—, `vocab.ts`, `challenge.ts`, `usage.ts`, `llm-call.ts`), más `paths.ts` (exporta `COLLECTION_NAMES` —las subcolecciones bajo `orgs/{orgId}`— y `orgPath(orgId)`) y `schemas.test.ts`. `packages/shared/src/index.ts` reexporta el directorio.
- `apps/server/src/data/org-store.ts` — `createOrgStore(db: Firestore, orgId)`: valida `orgId` con `/^[A-Za-z0-9-]{8,64}$/` y devuelve referencias tipadas a `members`, `voiceSheet`, `phrases`, `sessions`, `reports`, `vocab`, `challenges`, `usage`, `llmCalls`, todas bajo `orgs/{orgId}`. **Ningún otro módulo construye rutas `orgs/...` a mano** (regla de frontera; ver CLAUDE.md). Recibe el `db` por parámetro: aún no existe `firebase.ts` (lo crea el paso 4).
- `apps/server/tests/emulator/rules-isolation.test.ts` — con `initializeTestEnvironment({ projectId: "demo-pulso", firestore: { rules } })`, donde `rules` es el texto leído de `firestore.rules`: crea las orgs A y B con un miembro cada una (usando `withSecurityRulesDisabled`) y, **para cada nombre en `COLLECTION_NAMES`**, afirma `assertSucceeds(get/list)` del miembro de A en A, `assertFails(get/list)` del miembro de A en B, `assertFails` de cualquier `set/update/delete` del propio miembro en su org y en `users/{uid}`, y `assertFails` de todo acceso sin autenticar.
- `apps/server/tests/emulator/org-store.test.ts` — crea un `Firestore` de Admin con `initializeApp({ projectId: "demo-pulso" }, "org-store-test")` (el emulador se detecta por `FIRESTORE_EMULATOR_HOST`), escribe con `createOrgStore(db, A)` y `createOrgStore(db, B)` y afirma que cada uno solo ve lo suyo; un `orgId` inválido lanza.
- `tests/repo/firestore-indexes.test.ts` — lee `firestore.indexes.json` y afirma la exención de índice (`fieldOverrides` con `collectionGroup: "sessions"`, `fieldPath: "contour"`, `indexes: []`) y que el índice compuesto `profileId ASC + startedAt DESC` existe.
- `packages/shared/src/schemas/schemas.test.ts` — para cada esquema, un ejemplo válido de §4 parsea y los casos inválidos fallan: `contour` con 3001 puntos, `plan: "pro"`, `role: "admin"`, `themePreference: "neon"`, `profileId: "otro"`.

**Una sola sentada:** los esquemas del directorio `schemas/` siguen un único patrón (zod + tipo inferido) y las dos pruebas de emulador recorren `COLLECTION_NAMES`.

**Done when**

- [ ] **WHEN** `pnpm test:unit packages/shared/src/schemas/schemas.test.ts` runs **THE SYSTEM SHALL** parse a valid example of each schema of the data model and reject `contour` with 3001 points, `plan: 'pro'`, `role: 'admin'`, `themePreference: 'neon'` and an unknown `profileId`.
- [ ] **WHEN** `pnpm test:emu` runs the rules suite **THE SYSTEM SHALL** show, for every name in `COLLECTION_NAMES`, that a member of org A can get and list under `orgs/A`, gets permission denied on get and list under `orgs/B`, and that no signed-in user (member included) and no anonymous client can create, update or delete any document under `orgs/{orgId}` or `users/{uid}`.
- [ ] **WHEN** `pnpm test:emu` runs the org-store suite **THE SYSTEM SHALL** read and write only under `orgs/{orgId}` for the given orgId, never return a document stored under another org, and throw on an orgId that does not match `/^[A-Za-z0-9-]{8,64}$/`.
- [ ] **WHEN** `pnpm test:unit tests/repo/firestore-indexes.test.ts` runs **THE SYSTEM SHALL** assert that `firestore.indexes.json` has a field override for collection group `sessions`, field `contour`, with `indexes: []`, and the composite index `profileId` ascending plus `startedAt` descending.

**Verify**

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

---

#### Paso 4 — Entorno validado, logger con request id y health profundo

**Tarea:** `E1-T4` · **Épica:** `01-fundacion`

**Do**

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

**Done when**

- [ ] **WHEN** `pnpm test:unit apps/server/src/env.test.ts` runs **THE SYSTEM SHALL** use `baseEnv()` (every server key of `.env.example`) as the valid input and assert that `loadEnv(baseEnv without GOOGLE_CLOUD_PROJECT)` throws an error naming it and that `loadEnv(baseEnv())` returns the typed object with the documented defaults, an empty value counting as absent.
- [ ] **WHEN** a request reaches the server **THE SYSTEM SHALL** answer with an `x-request-id` header and write every log line of that request with the same `request_id`, with the `authorization` header redacted (asserted in `apps/server/src/logger.test.ts`).
- [ ] **WHEN** `GET /health/deep` runs against the Firestore emulator **THE SYSTEM SHALL** return 200 with `{ ok: true, firestore: 'up' }`, and **WHEN** Firestore is unreachable, or no `db` is injected, **THE SYSTEM SHALL** return 503 with `{ ok: false, firestore: 'down' }`.
- [ ] **WHEN** `pnpm build` and then `node scripts/smoke-server.mjs` run after `loadEnv` replaced the raw `process.env` reads **THE SYSTEM SHALL** still exit 0, because the script starts the server with the complete environment of `.env.example`.

**Verify**

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

---

#### Paso 5 — Auth en el servidor: token, lista de permitidos y JIT

**Tarea:** `E1-T5` · **Épica:** `01-fundacion`

**Do**

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

**Done when**

- [ ] **WHEN** a request without `Authorization`, or with an invalid token, reaches `GET /api/v1/me` **THE SYSTEM SHALL** answer 401 with `{ error: { code: 'unauthenticated', message, requestId } }`.
- [ ] **WHEN** a valid Auth-emulator ID token for an email outside `ALLOWED_EMAILS` calls `POST /api/v1/session` **THE SYSTEM SHALL** answer 403 with code `forbidden_email` and create no document in `users`, `orgs` or `members`.
- [ ] **WHEN** a valid token for an allowed email calls `POST /api/v1/session` **THE SYSTEM SHALL** create exactly one `users/{uid}`, one `orgs/{orgId}` with `plan: 'free'` and `ownerUid: uid`, and one `orgs/{orgId}/members/{uid}` with `role: 'owner'`, and **WHEN** it is called again, also twice concurrently, **THE SYSTEM SHALL** return the same `orgId` and leave those document counts unchanged.
- [ ] **WHEN** a preflight `OPTIONS /api/v1/me` arrives with an `Origin` listed in `WEB_ORIGINS` **THE SYSTEM SHALL** reply with the same value in `access-control-allow-origin`, and **WHEN** the `Origin` is not listed **THE SYSTEM SHALL** omit that header.
- [ ] **WHEN** `loadEnv` receives `baseEnv()` with `ALLOWED_EMAILS` missing or empty **THE SYSTEM SHALL** throw an error that names `ALLOWED_EMAILS`.

**Verify**

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

---

#### Paso 6 — Auth en la web: Google, guardia de rutas y entorno

**Tarea:** `E1-T6` · **Épica:** `01-fundacion`

**Do**

La web inicia sesión con Google (o con la cuenta de prueba del emulador), llama a POST /session, protege las rutas devolviendo al usuario a su URL original y valida su propio entorno.

La web inicia sesión con Google, llama a `POST /api/v1/session` y protege las rutas. El entorno de la web se valida con zod y las pruebas unitarias de la web traen sus valores `VITE_*` por defecto desde `apps/web/tests/setup.ts` (ya emitido, con los valores de `.env.example`).

- `apps/web/src/lib/env.ts` — zod sobre `import.meta.env`: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_USE_EMULATORS`, `VITE_API_URL`, `VITE_WS_URL` (las dos últimas pueden estar vacías); si falta una obligatoria, lanza nombrándola. `lib/env.test.ts` lo prueba con los valores del setup y con `vi.stubEnv` para la ausencia de `VITE_FIREBASE_PROJECT_ID`.
- `apps/web/src/lib/firebase.ts` — `initializeApp`, `getAuth`, `connectAuthEmulator("http://127.0.0.1:9099", { disableWarnings: true })` si `VITE_USE_EMULATORS === "true"`, `getFirestore` + `connectFirestoreEmulator("127.0.0.1", 8080)`. `lib/api.ts` — `apiFetch(path, init)` añade el `Authorization: Bearer` del usuario actual y usa `VITE_API_URL` como base.
- `apps/web/src/auth/AuthProvider.tsx` — estado `cargando | anonimo | autenticado`; tras iniciar sesión llama a `POST /api/v1/session` y guarda `{ user, org }`. `apps/web/src/auth/RequireAuth.tsx` — si anónimo: `<Navigate to={"/entrar?next=" + encodeURIComponent(location.pathname + location.search)} />`; mientras carga muestra `PageState` en `cargando`.
- `apps/web/src/routes/Entrar.tsx` — botón "Entrar con Google": `signInWithPopup` en escritorio, `signInWithRedirect` + `getRedirectResult` cuando `navigator.standalone` o iOS; y, **solo** dentro de la rama `VITE_USE_EMULATORS === "true"`, un botón "Entrar con cuenta de prueba" que crea o inicia sesión con `e2e@pulso.test` / `pulso-test-1234` (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword`) contra el emulador y **a continuación** marca el correo como verificado (el emulador emite `email_verified: false` y `requireUser` exige `true`): `POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=fake` con `{ idToken, emailVerified: true }`, luego `getIdToken(true)` para refrescar el token y solo entonces `POST /api/v1/session`. Un 403 `forbidden_email` muestra "Esta cuenta no está autorizada" con la opción de salir.
- `apps/web/src/router.tsx` — `createBrowserRouter`: `/entrar` pública; `/` y `/monitor` envueltas en `RequireAuth` con `AppShell`. Las cadenas nuevas van a `i18n/es.ts`.
- `apps/web/src/auth/RequireAuth.test.tsx` — con `MemoryRouter`: anónimo en `/monitor` termina en `/entrar?next=%2Fmonitor`; autenticado renderiza el hijo. `routes/Entrar.test.tsx` — el botón de cuenta de prueba no existe cuando `VITE_USE_EMULATORS` es `"false"`, y con `"true"` verifica con `fetch` y Auth simulados el orden: inicio de sesión → `accounts:update` con `emailVerified: true` → `getIdToken(true)` → `POST /api/v1/session`.
- `tests/e2e/app/auth.spec.ts` — abre `/monitor` anónimo, afirma la URL `/entrar?next=%2Fmonitor`, pulsa el botón de prueba y afirma volver a `/monitor`.

**Done when**

- [ ] **WHEN** the anonymous browser opens `/monitor` **THE SYSTEM SHALL** redirect to `/entrar?next=%2Fmonitor` and, after the emulator test sign-in, return to `/monitor` (`pnpm test:e2e:full tests/e2e/app/auth.spec.ts`).
- [ ] **WHEN** `apps/web/src/lib/env.ts` is imported in a jsdom test **THE SYSTEM SHALL** parse the `VITE_*` defaults that `apps/web/tests/setup.ts` takes from `.env.example`, and **WHEN** `VITE_FIREBASE_PROJECT_ID` is absent **THE SYSTEM SHALL** throw an error naming it.
- [ ] **WHEN** an anonymous user renders a route wrapped by `RequireAuth` at `/monitor` **THE SYSTEM SHALL** navigate to `/entrar?next=%2Fmonitor`, and **WHEN** the user is authenticated **THE SYSTEM SHALL** render the child.
- [ ] **WHEN** `VITE_USE_EMULATORS` is `false` **THE SYSTEM SHALL** NOT render the button 'Entrar con cuenta de prueba' on `/entrar`.
- [ ] **WHEN**, inside the `VITE_USE_EMULATORS === 'true'` branch only, the test sign-in has created or signed in `e2e@pulso.test` **THE SYSTEM SHALL** call `POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=fake` with `{ idToken, emailVerified: true }`, refresh the token with `getIdToken(true)` and only then call `POST /api/v1/session`, so that the `email_verified` check of the server passes (asserted in `Entrar.test.tsx` with simulated `fetch` and Auth, and by the e2e sign-in succeeding).

**Verify**

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

---

#### Paso 7 — Shell autenticado, ajustes y PWA instalable

**Tarea:** `E1-T7` · **Épica:** `01-fundacion`

**Do**

Existe el manifiesto de rutas con sus estados, el shell autenticado completo, la pantalla de Ajustes con tema e idioma STT y una PWA que cumple el contrato de instalación.

Shell autenticado completo y PWA instalable. Aquí se fija el **manifiesto de rutas** (contrato del frontend) y los tres estados de cada pantalla.

- `apps/web/src/routes.ts` — manifiesto: array de `{ path, titleKey, auth: "publica" | "usuario", rendering: "cliente" }` para `/entrar`, `/`, `/monitor`, `/frase-perfecta`, `/sesiones/:id`, `/repertorio`, `/vocabulario`, `/baseline`, `/ajustes`. Todas son **cliente** (SPA tras login, sin SEO). `router.tsx` se construye A PARTIR de este manifiesto; un test recorre el manifiesto y afirma que cada ruta resuelve a un componente.
- `apps/web/src/components/PageState.tsx` — `PageState` con las variantes `cargando` (esqueleto con las mismas dimensiones que el contenido real), `vacio` (mensaje + acción principal) y `error` (mensaje + reintentar + `requestId` si lo hay). Cada pantalla pendiente de pasos posteriores renderiza hoy `PageState variant="vacio"` con su `<h1>` (un único `h1` por ruta; `document.title` propio por ruta).
- `apps/web/src/components/layout/AppShell.tsx` (editar) — navegación completa (Inicio, Monitor, Frase Perfecta, Repertorio, Vocabulario, Baseline, Ajustes) con `aria-current="page"`, objetivos táctiles ≥ 48 px en móvil, cabecera con el menú de la cuenta.
- `apps/web/src/lib/theme.ts` — `applyTheme(pref)`: escribe `localStorage["pulso-theme"]` y `data-theme` en `<html>` (resolviendo `system` con `matchMedia`); `routes/Ajustes.tsx` — selector de tema (oscuro / claro / sistema), idioma STT (`es-US`, `es-MX`, `es-419`; guardado en `users.sttLocale`) y, por ahora, los botones "Exportar mis datos" y "Borrar mi cuenta" deshabilitados con texto explicativo (los activa el paso 19). Al cambiar se llama a `PATCH /api/v1/me`.
- `apps/server/src/routes/session.ts` (editar) — `PATCH /api/v1/me` con `@hono/zod-validator`: cuerpo `{ themePreference?: "dark"|"light"|"system", sttLocale?: "es-US"|"es-MX"|"es-419" }`, al menos un campo; escribe en `users/{uid}`; valor inválido → 422 `validation_error` sin escribir.
- PWA — `apps/web/src/pwa.ts` registra el service worker con `registerSW` de `virtual:pwa-register` (solo en producción); `vite-plugin-pwa` ya está configurado en `vite.config.ts` (emitido); para tipar `virtual:pwa-register` se crea `apps/web/src/vite-env.d.ts` con `/// <reference types="vite-plugin-pwa/client" />` (si el paquete expone ese módulo de tipos con otro nombre, léelo en `node_modules/vite-plugin-pwa/package.json`, campo `exports`). `scripts/check-pwa.mjs` lee `apps/web/dist/manifest.webmanifest` y `apps/web/dist/sw.js` y valida el contrato del criterio 1.
- `tests/e2e/ui/pwa.spec.ts` — se ejecuta contra el **bundle de producción** que sirve `vite preview` en el puerto 4173 (`playwright.config.ts` ya añade ese `webServer` cuando existe `apps/web/dist`; el proyecto `ui` es el predeterminado). No importa código del producto: abre `http://127.0.0.1:4173/entrar`, espera `await navigator.serviceWorker.ready` y comprueba que `fetch('/sw.js')` responde 200. Necesita un `.env` (Bootstrap lo crea desde `.env.example`: el build de producción lee `VITE_*` de `.env`).
- `tests/repo/tokens-parity.test.ts` — extrae `manifestColor` de `apps/web/vite.config.ts` y `--p-dark-bg` de `tokens.css` y exige igualdad (sin mayúsculas/minúsculas).
- `tests/e2e/app/shell.spec.ts` — con el usuario de prueba: recorre `/`, `/ajustes` y `/entrar` (esta última sin sesión) a 375 y 1440 px sin scroll horizontal; ejecuta `AxeBuilder` con las etiquetas `wcag2a, wcag2aa, wcag21aa, wcag22aa` y exige `violations` vacío; cambia el tema en Ajustes, recarga y comprueba `data-theme` en `DOMContentLoaded`.

**Una sola sentada:** reúne el manifiesto de rutas, un componente de estados, la pantalla de Ajustes y la PWA; las pantallas pendientes son marcadores con el mismo componente, y cada prueba cubre un contrato.

**Done when**

- [ ] **WHEN** `pnpm build` and then `node scripts/check-pwa.mjs` run **THE SYSTEM SHALL** exit 0 because `apps/web/dist/manifest.webmanifest` has name, short_name, start_url `/`, display `standalone`, lang `es`, icons of 192x192 and 512x512 (one of them maskable) whose files exist in `apps/web/dist`, and `apps/web/dist/sw.js` exists.
- [ ] **WHEN** `pnpm test:unit tests/repo/tokens-parity.test.ts` runs **THE SYSTEM SHALL** assert that `theme_color` and `background_color` in `apps/web/vite.config.ts` equal the dark `--p-dark-bg` hex of `tokens.css`.
- [ ] **WHEN** each route of `apps/web/src/routes.ts` renders in jsdom **THE SYSTEM SHALL** produce exactly one `h1`, a `main` landmark with id `contenido`, and a skip link as the first focusable element.
- [ ] **WHEN** `PATCH /api/v1/me` receives `{ themePreference: 'light', sttLocale: 'es-MX' }` with a valid token **THE SYSTEM SHALL** persist both on `users/{uid}` and answer 200, and **WHEN** it receives `{ themePreference: 'neon' }` **THE SYSTEM SHALL** answer 422 with code `validation_error` and persist nothing.
- [ ] **WHEN** `pnpm test:e2e:full tests/e2e/app/shell.spec.ts` visits `/`, `/ajustes` and `/entrar` at 375 and 1440 px **THE SYSTEM SHALL** find no horizontal scroll and an axe-core scan with tags wcag2a, wcag2aa, wcag21aa and wcag22aa reporting 0 violations, and after the signed-in user changes the theme in Ajustes and reloads **THE SYSTEM SHALL** have `data-theme` on `<html>` equal to the chosen theme at `DOMContentLoaded`.
- [ ] **WHEN** `pnpm test:e2e tests/e2e/ui/pwa.spec.ts` loads the production bundle served by `vite preview` on port 4173 **THE SYSTEM SHALL** resolve `navigator.serviceWorker.ready` and answer 200 to `fetch('/sw.js')`.

**Verify**

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

---

#### Paso 8 — Captura de micrófono con AudioWorklet

**Tarea:** `E2-T1` · **Épica:** `02-nucleo-de-voz`

**Do**

El navegador captura el micrófono, remuestrea a 16 kHz y entrega tramas de 100 ms en Int16 con su RMS, con la lógica numérica pura y probada en el paquete compartido.

Captura de micrófono con AudioWorklet. Decisión: **toda la lógica numérica vive en `packages/shared` y es pura** (se prueba con señales generadas); el worklet y `MicCapture` son cables finos alrededor de ella.

- `packages/shared/src/constants.ts` — `SAMPLE_RATE = 16000`, `FRAME_MS = 100`, `FRAME_SAMPLES = 1600`, `WINDOW_SECONDS = 8`, `DATA_HZ = 10`, `MAX_SESSION_SECONDS = 270`, `BYTES_PER_SECOND = 32000`.
- `packages/shared/src/dsp/resample.ts` — `class StreamResampler(inputRate, outputRate)` con `process(block: Float32Array): Float32Array`; interpolación lineal con estado entre bloques (fase fraccionaria y última muestra), identidad cuando las tasas coinciden. Limitación declarada: sin filtro antialias (aceptable para tono de voz; el RMS y YIN no dependen de >8 kHz).
- `packages/shared/src/dsp/frames.ts` — `class FrameAssembler(inputRate)`: `push(block: Float32Array): Frame[]` donde `Frame = { pcm: Int16Array /* 1600 */, rms: number /* 0..1 sobre la señal float */ }`; remuestrea a 16 kHz, acumula y emite tramas de exactamente 1600 muestras sin pérdida ni duplicación entre bloques de tamaño arbitrario; convierte a Int16 con saturación (`round(clamp(x,-1,1)*32767)`).
- `packages/shared/src/dsp/synth.ts` — generadores deterministas para pruebas: `sine(freq, seconds, rate, amp)`, `voice(f0, seconds, rate, { harmonics: 6 })` (armónicos con amplitud 1/h), `silence`, `whiteNoise(seconds, rate, amp, seed)` con PRNG sembrado (mulberry32), `concat(...)`.
- `packages/shared/src/dsp/wav.ts` — `encodeWavPcm16(samples: Int16Array, sampleRate): Uint8Array` (cabecera RIFF/fmt/data canónica de 44 bytes, mono) y `decodeWavPcm16(bytes): { sampleRate, samples: Int16Array }` que lanza `WavError` si falta `RIFF`/`WAVE`, si no es PCM16 mono o si el `data` está truncado. (No se usa la librería `wavefile`: un codificador de 40 líneas evita una dependencia sin mantenimiento.)
- `packages/shared/src/index.ts` (editar) — reexporta `constants`, `dsp/resample`, `dsp/frames`, `dsp/synth` y `dsp/wav`.
- Pruebas junto a cada módulo (`resample.test.ts`, `frames.test.ts`, `wav.test.ts`).
- `apps/web/src/audio/capture.worklet.ts` — registra el procesador `pulso-capture` (`registerProcessor`). No importa tipos DOM de worklet: accede a `AudioWorkletProcessor`, `registerProcessor` y `sampleRate` a través de `globalThis` con un tipo local mínimo (el `lib.dom` no los declara). Dentro: `new FrameAssembler(processorOptions.inputRate)`; en `process(inputs)` toma el canal 0 y por cada trama completa hace `port.postMessage({ pcm, rms }, [pcm.buffer])`. Se importa con `import workletUrl from "./capture.worklet.ts?worker&url"` (Vite compila el worklet como módulo aparte) **únicamente en `apps/web/src/audio/worklet-url.ts`** (`export { default as workletUrl }`): ese es el único módulo con el sufijo `?worker&url`, para que ninguna prueba de Vitest lo cargue (las pruebas que importan `useLiveMonitor` lo reemplazan con `vi.mock("../audio/worklet-url.ts")`).
- `apps/web/src/audio/MicCapture.ts` — `class MicCapture` (recibe `workletUrl: string` por constructor; **no** importa `worklet-url.ts`) con `start(onFrame): Promise<void>` y `stop()`. `start`: `getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } })`; crea `new AudioContext()` (intenta `{ sampleRate: 16000 }` en un `try/catch` y **lee siempre `audioContext.sampleRate` real**), `audioWorklet.addModule(workletUrl)`, `new AudioWorkletNode(ctx, "pulso-capture", { processorOptions: { inputRate: ctx.sampleRate } })`, conecta la fuente al nodo (sin conectar a `destination`). `NotAllowedError` → `MicError("permission-denied")`; `NotFoundError` → `MicError("no-device")`; otro → `MicError("unknown")`. `stop()` detiene pistas, cierra el contexto. **No cambia de ruta ni de hash mientras captura** (bug WebKit 215884).
- `apps/web/src/audio/mic-messages.ts` — mapea `MicError.reason` a la clave de `es.ts` (`mic.denied`, `mic.noDevice`, `mic.unknown`); `es.ts` recibe los textos (permiso denegado explica cómo reactivarlo en el navegador).
- `tests/e2e/ui/worklet.spec.ts` — se ejecuta contra el **bundle de producción** que sirve `vite preview` (`playwright.config.ts` ya añade ese `webServer` en el puerto 4173 cuando existe `apps/web/dist`; el proyecto `ui` sigue siendo el predeterminado). No importa código del producto: con `node:fs` busca en `apps/web/dist/assets` el archivo `.js` que contiene `registerProcessor` y, en la página `http://127.0.0.1:4173/entrar`, ejecuta `const ctx = new AudioContext(); await ctx.audioWorklet.addModule('/assets/<archivo>'); new AudioWorkletNode(ctx, 'pulso-capture')`, que debe resolverse sin error (el contrato del service worker lo ejerce `tests/e2e/ui/pwa.spec.ts`, paso 7).

**Una sola sentada:** cuatro módulos de DSP puro con el mismo patrón de prueba (señal generada → resultado exacto) y dos cables finos de navegador; el worklet se ejerce con una única especificación.

**Done when**

- [ ] **WHEN** `StreamResampler` converts a generated 440 Hz sine from 48000 Hz and from 44100 Hz to 16000 Hz in blocks of 128 samples **THE SYSTEM SHALL** output 16000 samples per second of input (plus or minus 1) with a zero-crossing frequency of 440 Hz plus or minus 1 percent, and **WHEN** both rates are 16000 **THE SYSTEM SHALL** return the input unchanged.
- [ ] **WHEN** `FrameAssembler` is fed blocks of arbitrary sizes totalling 3 s of a 0.5-amplitude sine at 48000 Hz **THE SYSTEM SHALL** emit exactly 30 frames of 1600 Int16 samples with `rms` equal to 0.5/sqrt(2) plus or minus 2 percent, emit `rms` 0 for silence, and drop or duplicate no sample across block boundaries.
- [ ] **WHEN** `encodeWavPcm16` output is passed to `decodeWavPcm16` **THE SYSTEM SHALL** return the same sample rate and identical samples, and **WHEN** the bytes lack a `RIFF` header or are truncated **THE SYSTEM SHALL** throw `WavError`.
- [ ] **WHEN** `getUserMedia` rejects with `NotAllowedError` **THE SYSTEM SHALL** make `MicCapture.start()` reject with a `MicError` whose `reason` is `permission-denied`, mapped to the Spanish message key `mic.denied` of `es.ts`.
- [ ] **WHEN** the `AudioContext` reports a `sampleRate` different from 16000 **THE SYSTEM SHALL** pass that real rate to the worklet as `processorOptions.inputRate` (asserted with a fake `AudioContext`).
- [ ] **WHEN** `pnpm test:e2e tests/e2e/ui/worklet.spec.ts` runs against the production bundle served by `vite preview` on port 4173 **THE SYSTEM SHALL** load the built worklet file in a real `AudioContext` with `audioWorklet.addModule` and construct `new AudioWorkletNode(ctx, 'pulso-capture')` without error.

**Verify**

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

---

#### Paso 9 — Tono con YIN, mediana y semitonos

**Tarea:** `E2-T2` · **Épica:** `02-nucleo-de-voz`

**Do**

Una trama de 100 ms produce un tono en Hz y en semitonos relativos a la mediana del usuario, estable frente a saltos de octava y ruido, con presupuesto de latencia medido.

Detección de tono: YIN + mediana de 5 + corrección de octava + semitonos relativos. Todo en `packages/shared/src/dsp`, puro y probado con frecuencias conocidas.

- `packages/shared/src/dsp/yin.ts` — `yin(frame: Float32Array, sampleRate: number, opts?: { fmin?: number /* 70 */; fmax?: number /* 500 */; threshold?: number /* 0.15 */ }): { freq: number | null; probability: number }`. Algoritmo: `tauMax = floor(sampleRate / fmin)`, `tauMin = floor(sampleRate / fmax)`, ventana `W = frame.length - tauMax`; diferencia `d(τ) = Σ_{j<W} (x[j] − x[j+τ])²`; diferencia normalizada acumulada `d'(τ) = d(τ) · τ / Σ_{k≤τ} d(k)` con `d'(0) = 1`; primer `τ ≥ tauMin` con `d'(τ) < threshold` que además sea mínimo local; si ninguno cumple devuelve `{ freq: null, probability: 0 }` (sin voz); interpolación parabólica sobre `d'` alrededor de `τ`; `freq = sampleRate / τ'`, `probability = 1 − d'(τ)`.
- `packages/shared/src/dsp/pitch.ts` — `hzToSemitones(hz, referenceHz) = 12 * log2(hz / referenceHz)`; `median(values)`; `class PitchTracker({ referenceHz?: number, silenceRms: 0.01 })` con `push({ pcm: Int16Array, rms }, tMs): PitchSample` donde `PitchSample = { tMs, hz: number | null, semitones: number | null, rms, voiced: boolean }`. Reglas: trama con `rms < silenceRms` → no sonora; si no, `yin` sobre `pcm/32768`; la salida es la **mediana de las últimas 5 estimaciones sonoras** (ventana deslizante que ignora las no sonoras); **corrección de octava**: si la estimación nueva está a 12 ± 1 semitonos de la mediana vigente (arriba o abajo), se pliega multiplicando o dividiendo por 2 antes de entrar en la ventana. La referencia: `referenceHz` si se pasó (viene de la ficha vocal); si no, se **fija** como la mediana de las primeras 20 estimaciones sonoras (2 s de voz) y se expone `tracker.referenceHz`; mientras no esté fijada, `semitones` se calcula contra la mediana provisional.
- `packages/shared/src/dsp/yin.test.ts`, `pitch.test.ts` — usan `sine`, `voice`, `whiteNoise` de `synth.ts`: seno puro a 85/120/180/220/300/440 Hz (±10 cents, probabilidad ≥ 0.9), voz de 110 Hz con ruido a SNR 20 dB (±25 cents), silencio y ruido blanco (`freq: null`), secuencia con un salto de octava aislado (sin saltos > 2 semitonos en la salida), `hzToSemitones` en 0, +12 y −12.
- `packages/shared/src/dsp/latency.test.ts` — procesa 600 tramas de voz sintética de 1600 muestras con `performance.now()` y afirma `p95 < 20 ms` por trama (presupuesto: 20 % del periodo de 100 ms). Si esta prueba falla en una máquina lenta, se optimiza `yin` (p. ej. limitar `tauMax`), nunca se sube el umbral.
- `packages/shared/src/index.ts` (editar) — reexporta `dsp/yin` y `dsp/pitch`.

**Done when**

- [ ] **WHEN** `yin` analyses a 1600-sample frame at 16000 Hz of a pure sine at each of 85, 120, 180, 220, 300 and 440 Hz **THE SYSTEM SHALL** return a frequency within 10 cents of the input and `probability` of at least 0.9.
- [ ] **WHEN** `yin` analyses a synthesized voice with fundamental 110 Hz and harmonics 2 to 6 at amplitude 1/h plus seeded white noise at SNR 20 dB **THE SYSTEM SHALL** return 110 Hz within 25 cents.
- [ ] **WHEN** the frame is all zeros, or white noise at RMS 0.2, **THE SYSTEM SHALL** return `freq: null`.
- [ ] **WHEN** `PitchTracker` receives frames whose raw estimates contain one isolated octave jump (110, 220, 110 Hz) **THE SYSTEM SHALL** output no jump larger than 2 semitones for that frame (median of 5 plus octave correction).
- [ ] **WHEN** `hzToSemitones` runs **THE SYSTEM SHALL** return 0 for the reference, 12 for twice the reference and -12 for half, within 1e-9.
- [ ] **WHEN** `pnpm test:unit packages/shared/src/dsp/latency.test.ts` processes 600 frames **THE SYSTEM SHALL** measure a p95 processing time under 20 ms per 100 ms frame.

**Verify**

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

---

#### Paso 10 — Monitor en vivo sobre canvas

**Tarea:** `E2-T3` · **Épica:** `02-nucleo-de-voz`

**Do**

La pantalla Monitor dibuja la voz del usuario en una ventana de 8 s a 60 fps, detecta línea plana y publica un resumen de texto accesible, probado con un WAV real en Chromium.

Monitor en vivo (canvas). Datos a 10 Hz (una muestra por trama de 100 ms), renderizado a 60 fps interpolando el último tramo. Línea sólida gruesa (~3 px), derecha → izquierda, ventana de 8 s.

- `packages/shared/src/monitor/series.ts` — `class RingSeries(windowMs = 8000)`: `push(sample: PitchSample)`, `samples(): PitchSample[]` (solo las que caen en la ventana; con 10 Hz son como máximo 80), `last()`.
- `packages/shared/src/monitor/geometry.ts` — `toPlotPoints(samples, nowMs, windowMs, width, height, yRangeSt: [min, max]): Array<Array<{x:number;y:number}>>` (lista de **segmentos**: las muestras `null` cortan la línea); `x = width * (1 - (nowMs - t) / windowMs)`, `y` lineal en semitonos con el cero (mediana del usuario) a media altura y `yRangeSt` por defecto `[-8, 8]`; `interpolateTail(prev, next, progress)` devuelve el punto interpolado linealmente.
- `packages/shared/src/monitor/flatline.ts` — `classifyTone(samples, nowMs): "sin-voz" | "pausa" | "monotonia" | "variada" | "normal"`: `pausa` si las últimas ≥ 4 muestras (0.4 s) no son sonoras; `monotonia` si en los últimos 2 s hay ≥ 60 % de muestras sonoras y la desviación estándar de sus semitonos es < 0.35; `variada` si la desviación estándar ≥ 1.5; `normal` en el resto; `sin-voz` si no hay ninguna muestra sonora en la ventana. La "línea plana alarma" **no parpadea**: cambia de color (`--alert`) y de etiqueta de texto.
- `apps/web/src/monitor/MonitorCanvas.tsx` — `<canvas data-testid="monitor-canvas">` con escala por `devicePixelRatio`, `requestAnimationFrame` a 60 fps; lee los colores de las variables CSS (`getComputedStyle(document.documentElement).getPropertyValue("--signal")`, nunca hex); línea `lineWidth = 3`, `lineJoin = "round"`; etiqueta "TÚ" junto al extremo derecho de la línea (texto, no solo color); franja inferior de 8 px con la energía (RMS) como barras; actualiza el atributo `data-last-semitones` en cada muestra nueva. `prefers-reduced-motion` NO detiene el dibujo (es la función del producto) pero se eliminan pulsos y transiciones decorativas.
- `apps/web/src/monitor/useLiveMonitor.ts` — hook que une `MicCapture` → `PitchTracker` → `RingSeries`; expone `{ estado: "inactivo"|"pidiendo-permiso"|"grabando"|"error", series, ultimaMuestra, tono: ReturnType<typeof classifyTone>, error }`, `iniciar()`, `detener()`; usa un `ref` para el bucle de dibujo y `useSyncExternalStore` o estado con `setState` ≤ 10 veces por segundo.
- `apps/web/src/routes/Monitor.tsx` — pantalla principal: monitor al centro, botón Grabar/Detener ≥ 48 px de alto, lectura de frecuencia `<output data-testid="freq-readout" data-hz={…}>` en JetBrains Mono, y un resumen de texto accesible `<p role="status" aria-live="polite">` actualizado como máximo cada 2 s ("Tu tono sube", "Línea plana: varía el tono", "Pausa", …; textos en `es.ts`). Los tres medidores secundarios llegan en el paso 12. No cambia de ruta ni de hash mientras graba.
- `apps/web/src/monitor/useLiveMonitor.ts` crea `new MicCapture(workletUrl)` importando `workletUrl` de `../audio/worklet-url.ts`.
- Pruebas: `series.test.ts`, `geometry.test.ts`, `flatline.test.ts` (shared); `apps/web/src/routes/Monitor.test.tsx` (jsdom, temporizadores falsos, con `vi.mock("../audio/worklet-url.ts", () => ({ workletUrl: "/worklet.js" }))`): el resumen no cambia más de una vez cada 2 s.
- `tests/e2e/app/monitor.spec.ts` — proyecto `app` (Chromium con micrófono falso alimentado por `tests/e2e/.tmp/voice.wav`: 1 s silencio, 3 s a 130 Hz, 3 s a 260 Hz, 1 s silencio, en bucle). Inicia sesión con la cuenta de prueba, abre `/monitor`, pulsa Grabar, muestrea `freq-readout[data-hz]` y `monitor-canvas[data-last-semitones]` cada 100 ms durante 18 s (más de dos ciclos de 8 s) y, usando solo las muestras posteriores a los primeros 4 s (la referencia de semitonos ya está fijada), afirma: existen lecturas con `hz` dentro de 130 ± 8 % y de 260 ± 8 %; existe un par (i < j) con `hz[i]≈130`, `hz[j]≈260` y `semitones[j] − semitones[i] ≥ 9`; y el canvas contiene al menos un píxel del color `--signal` (lectura de `getImageData`).
- `packages/shared/src/index.ts` (editar) — reexporta `monitor/series`, `monitor/geometry` y `monitor/flatline`.

**Done when**

- [ ] **WHEN** 100 samples at 10 Hz are pushed into `RingSeries` with an 8000 ms window **THE SYSTEM SHALL** retain at most the last 80, and `toPlotPoints` SHALL map the newest sample to x = width and the oldest retained to x = 0 within 1 px, with `null` samples splitting the line into separate segments.
- [ ] **WHEN** the render loop draws between two data frames **THE SYSTEM SHALL** place the newest point with `interpolateTail(prev, next, progress)`, returning `prev` at 0, the midpoint at 0.5 and `next` at 1.
- [ ] **WHEN** voiced samples of the last 2 s are at least 60 percent of the window and their semitone standard deviation is under 0.35 **THE SYSTEM SHALL** classify `monotonia`, **WHEN** the last 4 samples are unvoiced **THE SYSTEM SHALL** classify `pausa`, and **WHEN** the standard deviation is at least 1.5 **THE SYSTEM SHALL** classify `variada`.
- [ ] **WHEN** the live summary element (`role="status"`, `aria-live="polite"`) receives state changes faster than every 2 s **THE SYSTEM SHALL** update its text at most once per 2 s (asserted with fake timers).
- [ ] **WHEN** `pnpm test:e2e:full tests/e2e/app/monitor.spec.ts` feeds the fake microphone with the generated WAV (130 Hz then 260 Hz) and the user presses record **THE SYSTEM SHALL** show `data-hz` of the frequency readout within 8 percent of 130 and within 8 percent of 260, show a rise of at least 9 semitones in `data-last-semitones` between a 130 Hz sample and a later 260 Hz sample taken after the first 4 s, and draw at least one pixel of the signal color on the canvas.

**Verify**

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

---

#### Paso 11 — Línea fantasma y puntaje de seguimiento

**Tarea:** `E2-T4` · **Épica:** `02-nucleo-de-voz`

**Do**

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

**Done when**

- [ ] **WHEN** `generateGhost` runs twice with the same text, profile and marks **THE SYSTEM SHALL** return deeply equal results whose `durationMs` equals the word time (words divided by the midpoint ppm of the profile) plus the declared pauses, whose `contour.length` equals `round(durationMs / 100)`, and whose `wordTimes` are ordered and non-overlapping.
- [ ] **WHEN** the same text is generated for `redes`, `tarima` and `eventos` **THE SYSTEM SHALL** give `redes` a maximum within its first 3 s of at least 60 percent of its global maximum and at least 1.5 times the peaks of `eventos`, give `eventos` a range of at most half the range of `redes`, and give `tarima` a contour value equal to its `floorSt` at the middle of every `larga` pause.
- [ ] **WHEN** `heuristicMarks` runs on 'Pierde 3 millones por no cuidar a tu familia, actúa hoy.' **THE SYSTEM SHALL** mark '3' and 'millones' as `numero`, mark 'hoy' as `idea` and add a pause after 'familia'.
- [ ] **WHEN** `trackingScore` compares a user contour identical to the ghost **THE SYSTEM SHALL** return 100, and **WHEN** a 4 s section of a 10 s ghost is shifted by +6 semitones **THE SYSTEM SHALL** return between 50 and 70 with `firstDivergence.second` within 0.5 s of the section start and `firstDivergence.word` equal to the word of `wordTimes` at that second.
- [ ] **WHEN** the user contour is the ghost shifted in time by 300 ms **THE SYSTEM SHALL** score at least 95, and **WHEN** shifted by 800 ms **THE SYSTEM SHALL** score strictly lower than the 300 ms case (fixed temporal tolerance of plus or minus 3 samples).
- [ ] **WHEN** `drawGhost` runs against a recording canvas context **THE SYSTEM SHALL** call `setLineDash` with a non-empty pattern, stroke with the color read from `--ghost`, and draw the text `FANTASMA`.

**Verify**

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

---

#### Paso 12 — Medidores: frecuencia, muletillas y ritmo local

**Tarea:** `E2-T5` · **Épica:** `02-nucleo-de-voz`

**Do**

El monitor muestra los medidores de Frecuencia (zona verde), Muletillas (léxico personal) y Ritmo, calculados en local con VAD por RMS y conteo de palabras.

Medidores secundarios y cálculo local de ritmo y pausas (VAD por RMS en el navegador). Nada de esto depende de la transcripción de Google excepto el conteo de palabras.

- `packages/shared/src/meters/vad.ts` — `class Vad({ onRms: 0.02, offRms: 0.012, hangoverMs: 200 })`: `push(rms, tMs): boolean` con histéresis (sube a sonoro cuando `rms ≥ onRms`; baja a no sonoro solo tras `hangoverMs` con `rms < offRms`); `vadSeries(rmsArray): boolean[]`.
- `packages/shared/src/meters/rhythm.ts` — `computeRhythm(vad: boolean[] /* una por trama de 100 ms */, wordCount: number): { ppm: number; pauseRatio: number; pauseCount: number; longPauseCount: number; speakingMs: number }`. Se recorta el silencio inicial y final; una **pausa** es una racha de ≥ 4 tramas no sonoras (400 ms) dentro del tramo hablado; `longPause` ≥ 12 tramas (1.2 s); `speakingMs` = duración del tramo hablado − suma de pausas; `ppm = wordCount / (speakingMs / 60000)`; `pauseRatio = suma de pausas / duración del tramo hablado`.
- `packages/shared/src/meters/frequency.ts` — `computeGreenZone(hzSamples: number[]): { medianHz, lowHz, highHz }` (p25 y p75 en Hz de las muestras sonoras, `lowHz < medianHz < highHz`; error si hay < 30 muestras) y `classifyHz(hz, zone): "baja" | "verde" | "alta"`.
- `packages/shared/src/meters/fillers.ts` — léxico por defecto `DEFAULT_FILLERS` (la lista personal inicial: `eh`, `este`, `o sea`, `bueno`, `como`, `pues`, `¿sí?`, `¿no?`, `entonces`, `digamos`), cada entrada con una regla: `siempre` (`eh`, `o sea`, `digamos`), `aislada` (la palabra entre comas, al inicio o al final del enunciado: `este`, `bueno`, `pues`, `entonces`, `como`) o `pregunta-cola` (`¿sí?`, `¿no?`: `, sí?` / `, ¿no?` / `¿sí?` al final de cláusula). `countFillers(transcript, lexicon = DEFAULT_FILLERS): { total: number; byWord: Record<string, number> }` (normaliza minúsculas, conserva tildes y signos); `topFillers(byWord, n = 3)`; clase `LiveFillerCounter` con `update(fullTranscript)` que recalcula sobre el texto acumulado. Límite honesto documentado: es una heurística léxica; `este` demostrativo ("este carro") y `como` comparativo ("como el sol") NO cuentan. El reconocedor puede omitir disfluencias (no está documentado): el análisis de audio del paso 16 lo compensa.
- `apps/web/src/meters/Meters.tsx` — tres medidores bajo el monitor: **Frecuencia** (valor en Hz en `font-mono`, etiqueta de texto "Zona verde" / "Baja" / "Alta" además del color, barra con la zona verde marcada), **Muletillas** (contador total y top-3 con su conteo) y **Ritmo** (ppm y pausas, con la zona del perfil). El medidor de **Dicción** (0–100) se cablea en el paso 17 (la fórmula `dictionScore` nace en el paso 15 y el flujo de grabación de sesiones, que aporta la confianza de las transcripciones, en el paso 17); hoy muestra "—" con texto explicativo. Cada medidor tiene `role="group"` y un nombre accesible.
- `apps/web/src/routes/Monitor.tsx` (editar) — integra los medidores usando `Vad`, `computeRhythm` y la zona verde de la ficha vocal si existe (en la semana de línea base se mide sin juzgar: la zona se muestra como "midiendo").
- Pruebas: `vad.test.ts`, `rhythm.test.ts` (60 s sintéticos: 50 s de habla con 4 pausas de 2.5 s y 125 palabras → `ppm` 150 ± 0.5, `pauseCount` 4, `pauseRatio` 10/60 ± 0.01), `frequency.test.ts`, `fillers.test.ts` (tabla de ≥ 12 casos, incluidos los negativos), `Meters.test.tsx` (jsdom: la etiqueta de zona es texto).
- `packages/shared/src/index.ts` (editar) — reexporta `meters/*`.

**Done when**

- [ ] **WHEN** `countFillers` runs over the table of at least 12 transcripts of `fillers.test.ts` **THE SYSTEM SHALL** return the exact `total` and `byWord` expected for each, counting 'eh', 'o sea' and 'digamos' always, counting 'este', 'bueno', 'pues', 'entonces' and 'como' only when isolated by commas or at the edge of an utterance, and not counting 'Compré este carro' nor 'como el sol'.
- [ ] **WHEN** a personal lexicon is passed **THE SYSTEM SHALL** count only the words of that lexicon.
- [ ] **WHEN** `computeRhythm` runs on 60 s of synthetic VAD frames made of 50 s of speech and 4 interior pauses of 2.5 s, with 125 words, **THE SYSTEM SHALL** return `ppm` 150 plus or minus 0.5, `pauseCount` 4 and `pauseRatio` 10/60 plus or minus 0.01, excluding leading and trailing silence.
- [ ] **WHEN** `Vad` receives an RMS series that oscillates around the on threshold **THE SYSTEM SHALL** not toggle state more than once, and **WHEN** `rms` falls below the off threshold **THE SYSTEM SHALL** keep voiced for the 200 ms hangover before switching off.
- [ ] **WHEN** `computeGreenZone` receives at least 30 voiced Hz samples **THE SYSTEM SHALL** return `lowHz < medianHz < highHz` using the 25th and 75th percentiles, and `classifyHz` SHALL return `baja`, `verde` or `alta` accordingly.
- [ ] **WHEN** the Frecuencia meter renders in jsdom **THE SYSTEM SHALL** show the zone as text ('Zona verde', 'Baja' or 'Alta') in addition to color, in an element with `role="group"` and an accessible name.

**Verify**

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

---

#### Paso 13 — Motores de coaching: vocabulario, reto, nivel y línea base

**Tarea:** `E3-T1` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

Existen, puros y probados, el motor de palabras comodín con reemplazos, el vocabulario activo, el reto semanal con su semana ISO, la fórmula del nivel de orador y el plan de la semana de línea base.

Motores puros del coaching en `packages/shared/src/coaching/`: vocabulario, reto semanal, nivel de orador y plan de línea base. Sin red, sin servidor, sin pantallas: aquí solo hay fórmulas con vectores calculados a mano. Sin línea base no hay zonas verdes ni fantasmas personales: **la primera semana se mide, no se juzga**.

- `packages/shared/src/coaching/vocab.ts` — `COMODIN = ["cosa","eso","muy","también","bueno","algo"]`; `detectComodin(transcript): { total, byWord }` (conteo real, comparando sin tildes y con la misma normalización que `countFillers`); `REPLACEMENTS`: mapa contextual (`"cosa que"` + posesivo/familia → `carga`, `legado`, `responsabilidad`; `"muy importante"` → `crucial`, `decisivo`, `innegociable`; `"muy bueno"` → `excelente`, `sólido`; `"algo"` → `una cuestión`, `un aspecto`) con `suggestReplacements(transcript)`; `STOPWORDS_ES`; `activeVocabPer100(transcript): number` = palabras únicas significativas (sin `STOPWORDS_ES` y sin muletillas) por cada 100 palabras; `vocabGrowth(base, current) = (current − base) / base` (meta +30 % en 90 días).
- `packages/shared/src/coaching/challenge.ts` — `WEEKLY_WORDS = ["legado","previsión","dignidad","amparo","innegociable"]`; `isoWeekKey(date: Date): string` (semana ISO 8601 en UTC, formato `2026-W41`: el jueves de la semana decide el año; las semanas empiezan en lunes); `usedChallengeWords(transcript, words)` compara sin tildes y acepta plural simple (`+s`/`+es`).
- `packages/shared/src/coaching/level.ts` — `computeLevel({ diction, fillersPer100, controlFrecuencia, vocabScore, constancia, sustainedWeeks }): { score: number; band: "Aspirante"|"Orador"|"Maestro"|"Arquitecto de la voz" }` con `score = 0.30·diction + 0.25·(100 − fillersNorm) + 0.20·controlFrecuencia + 0.15·vocabScore + 0.10·constancia`, `fillersNorm = clamp(fillersPer100 / 8 × 100, 0, 100)`; helpers `controlFrecuencia(zonaVerdePct, seguimientoPct) = 0.5·zonaVerdePct + 0.5·seguimientoPct`, `vocabScore(growth) = clamp(50 + (growth / 0.30) × 50, 0, 100)` (50 sin base) y `constancia(sesionesEstaSemana) = min(100, sesiones / 4 × 100)`. Bandas: Aspirante < 60, Orador 60–79.99, Maestro 80–89.99, y "Arquitecto de la voz" solo si `score ≥ 90` **sostenido 2 semanas** (`sustainedWeeks ≥ 2`); si no, Maestro.
- `packages/shared/src/coaching/baseline.ts` — `baselinePlan(dayIndex: 1..7)`: días 1–2 = tres sesiones libres de 180 s; días 3–4 = dos sesiones de Frase Perfecta por perfil; día 5 = "ficha vocal" (zonas verdes por perfil, 3 muletillas a eliminar, 5 palabras a reemplazar, vocabulario inicial); después 4 sesiones por semana con una corrección prioritaria por sesión y el reto semanal; `buildVoiceSheet(sessions): VoiceSheet[]` (por perfil: `computeGreenZone` del paso 12 sobre los tonos de las sesiones de línea base y el `ppm` objetivo del perfil; con menos de 30 muestras sonoras por perfil no genera ficha para ese perfil); `levelState(startedAt, now)` devuelve `"midiendo"` durante la semana 1 (no se muestra nivel ni se juzga) y `"activo"` después.
- Pruebas junto a cada módulo (`vocab.test.ts`, `challenge.test.ts`, `level.test.ts`, `baseline.test.ts`) y `packages/shared/src/index.ts` (editar) reexporta los cuatro módulos.

**Done when**

- [ ] **WHEN** `detectComodin` runs over at least 8 transcripts **THE SYSTEM SHALL** return the exact count per word for 'cosa', 'eso', 'muy', 'también', 'bueno' and 'algo', and `suggestReplacements` on 'esa cosa que les queda a tus hijos' SHALL include 'carga', 'legado' and 'responsabilidad' and on 'muy importante' SHALL include 'crucial', 'decisivo' and 'innegociable'.
- [ ] **WHEN** `activeVocabPer100` runs **THE SYSTEM SHALL** return the unique significant words per 100 words excluding stopwords and fillers, and `vocabGrowth(base, current)` SHALL equal (current - base) / base.
- [ ] **WHEN** `usedChallengeWords` runs over a transcript **THE SYSTEM SHALL** detect each of 'legado', 'previsión', 'dignidad', 'amparo' and 'innegociable' ignoring accents and simple plurals, and `isoWeekKey(new Date('2026-10-04T12:00:00Z'))` SHALL equal '2026-W40', `isoWeekKey(new Date('2026-10-05T00:00:00Z'))` SHALL equal '2026-W41' and `isoWeekKey(new Date('2026-10-11T23:59:59Z'))` SHALL equal '2026-W41'.
- [ ] **WHEN** `computeLevel` runs **THE SYSTEM SHALL** apply the weights 0.30, 0.25, 0.20, 0.15 and 0.10 and return Aspirante below 60, Orador from 60 to 79.99, Maestro from 80 to 89.99, and 'Arquitecto de la voz' only for 90 or more sustained for 2 weeks (otherwise Maestro).
- [ ] **WHEN** the account is in its first week **THE SYSTEM SHALL** return `levelState` equal to `midiendo` and show no level, and `baselinePlan` SHALL return three free 180 s sessions on days 1 and 2, two Frase Perfecta sessions per profile on days 3 and 4, and the vocal sheet on day 5.
- [ ] **WHEN** `buildVoiceSheet` receives baseline sessions with at least 30 voiced Hz samples for a profile **THE SYSTEM SHALL** return a sheet with `greenLowHz < medianHz < greenHighHz` and the target ppm of that profile, and for a profile with fewer than 30 samples **THE SYSTEM SHALL** return no sheet.

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test:unit packages/shared
```

**Checkpoint**

```bash
git add -A && git commit -m "step 13: coaching-engines"
git tag step-13-coaching-engines
```

---

#### Paso 14 — Pasarela WebSocket de audio y adaptador STT

**Tarea:** `E3-T2` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

El servidor acepta audio por WebSocket autenticado en el primer mensaje, lo valida, lo reenvía a una interfaz SttAdapter con tope de 270 s y cuota diaria por organización, y el cliente reconecta con retroceso.

Pasarela WebSocket de audio. El navegador no puede poner cabeceras en el handshake: **el token viaja en el primer mensaje**, nunca en la URL. El servidor decide si abre el stream de STT y nunca reenvía audio sin autenticar.

Protocolo (contrato en `packages/shared/src/wire.ts`, esquemas zod discriminados por `type`):
- Cliente → servidor, primer mensaje de texto (máx. 5 s tras abrir): `{ type: "auth", token, sessionId, profileId, locale }`. Después: tramas **binarias** PCM16 little-endian mono 16 kHz (el cliente envía 3200 bytes = 100 ms por trama) y, al terminar, `{ type: "end" }`.
- Servidor → cliente: `{ type: "ready" }`, `{ type: "transcript", text, isFinal, confidence: number | null }`, `{ type: "limit" }` (cap de 270 s), `{ type: "error", code }`, `{ type: "done", utterances: Array<{ text, confidence }> }`.
- Códigos de cierre: 1000 normal; 4400 trama inválida (longitud impar o > 25 000 bytes); 4401 sin token a tiempo / token inválido; 4403 email fuera de la lista; 4429 cuota diaria agotada.

Piezas:
- `apps/server/src/env.ts` (editar) — añade `STT_MODEL`, `STT_LOCATION`, `STT_LANGUAGE`, `STT_DAILY_SECONDS_PER_ORG` (entero > 0), `STT_PRICE_USD_PER_MIN` (número > 0), todas **obligatorias desde el paso 14**, sin valor por defecto en el código (los valores `long` / `us` / `es-US` / `1800` / `0.016` viven en `.env.example`).
- `apps/server/src/stt/adapter.ts` — contrato propio: `interface SttAdapter { open(opts: { language: string; onUtterance(u: SttUtterance): void; onError(e: Error): void }): Promise<SttStream> }`, `interface SttStream { write(pcm: Uint8Array): void; end(): Promise<void> }`, `type SttUtterance = { text: string; isFinal: boolean; confidence: number | null }`. De STT **solo** se exige transcripción final por enunciado y su `confidence`; ritmo y pausas son locales (VAD del navegador).
- `apps/server/src/stt/google.ts` — `GoogleSttAdapter` con `v2.SpeechClient` de `@google-cloud/speech`: `apiEndpoint` = `speech.googleapis.com` si `STT_LOCATION === "global"`, o `${STT_LOCATION}-speech.googleapis.com`; recognizer `projects/${project}/locations/${STT_LOCATION}/recognizers/_`; primera petición del stream con `streamingConfig.config = { explicitDecodingConfig: { encoding: "LINEAR16", sampleRateHertz: 16000, audioChannelCount: 1 }, languageCodes: [language], model: STT_MODEL }` y `streamingFeatures.interimResults = true`; peticiones siguientes `{ audio }`. **El nombre exacto del método de streaming bidireccional y la forma de los tipos se leen de `node_modules/@google-cloud/speech/build/src/v2/speech_client.d.ts`** (en v2 es el método bidi de bajo nivel, no el helper de v1) y se ajustan hasta que `pnpm typecheck` pasa. El adaptador real **no se prueba contra Google en la build**: lo valida el spike manual (§20.1, `pnpm spike:stt`). `apps/server/scripts/spike-stt.ts` — script (`load-dotenv` primero) que lee un WAV real con `decodeWavPcm16`, lo envía en trozos de 3200 bytes **a ritmo de tiempo real** al adaptador real e imprime cada enunciado final, su `confidence` y si aparecen muletillas; sirve para decidir `long`@`us` o la alternativa `chirp_2`@`us-central1`.
- `apps/server/src/usage/quota.ts` — `getUsageToday(store, now)`, `assertQuota(store, now, limitSeconds)` y `recordUsage(store, now, seconds, pricePerMin)`: documento `orgs/{orgId}/usage/{yyyy-mm-dd}` (UTC) con `sttSeconds` y `cost_usd` incrementados con `FieldValue.increment`. `assertQuota` lanza `HttpError(429, "quota_exceeded")` si `sttSeconds >= limit`.
- `apps/server/src/ws/audio-gateway.ts` — `createAudioGateway({ stt, db, adminAuth, env, now, authTimeoutMs = 5000 })` devuelve el manejador de `upgradeWebSocket` de `@hono/node-ws`. Flujo: temporizador de autenticación → `verifyIdToken` + allowlist → resolver la organización del usuario (membresía) → `assertQuota` → `stt.open` → enviar `ready`. Cada trama binaria: validar longitud par y ≤ 25 000 bytes, sumar `bytes / 32000` al contador de **audio** de la sesión (no al reloj) y reenviar en orden a `stream.write`; al alcanzar 270 s enviar `{ type: "limit" }`, terminar el stream y cerrar con 1000. Al cerrar (cualquier causa) llamar `recordUsage` con los segundos realmente transmitidos y `end()` del stream. `@hono/node-ws`: `const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })` y `injectWebSocket(server)` tras `serve()`; los mensajes binarios llegan como `ArrayBuffer`/`Buffer` y los de texto como `string` (el código distingue con `typeof evt.data === "string"` y convierte con `new Uint8Array(...)`).
- `apps/server/src/app.ts` (editar) — `createApp(deps)` acepta `deps.stt`, `deps.audioAuthTimeoutMs` y monta `GET /ws/audio`; `index.ts` construye `GoogleSttAdapter` y llama a `injectWebSocket`.
- `apps/server/tests/doubles/recorded-stt-adapter.ts` — doble **solo de pruebas**: lee un JSON de enunciados grabados y emite el enunciado `k` cuando se han escrito `threshold_k` bytes; cuenta los bytes recibidos y las llamadas a `open`. **Nunca se importa desde `src/`.** `tests/e2e-server.ts` lo inyecta.
- `apps/server/tests/emulator/ws-gateway.test.ts` — arranca la app con `serve({ port: 0 })`, `injectWebSocket`, emuladores de Auth y Firestore y un cliente `ws`; cubre autenticación (sin token → 4401 a los 5 s con `authTimeoutMs` reducido a 200 ms en la prueba; token inválido → 4401; email fuera de la lista → 4403 y `open` no llamado), trama inválida → 4400, reenvío íntegro y en orden, tope de 270 s (envía 270 s de audio sin esperar → `limit` y cierre 1000), cuota → 4429 antes de abrir, registro de uso y `cost_usd = segundos/60 × STT_PRICE_USD_PER_MIN`.
- `apps/web/src/audio/useAudioSocket.ts` — hook/clase: abre `VITE_WS_URL` (o `ws(s)://${location.host}/ws/audio` si vacío), envía `auth`, expone `estado: "conectando"|"listo"|"reconectando"|"fallo"|"cerrado"`, `enviar(pcm: Int16Array)` y `transcript`; si el socket cae mientras se graba reintenta con retroceso exponencial 500 ms, 1000 ms, 2000 ms (máx. 3 intentos) y pasa a `fallo`. Arranque en frío de Cloud Run: el estado `conectando` se muestra como "Conectando…". Prueba con temporizadores falsos y un `WebSocket` simulado.
- `packages/shared/src/index.ts` (editar) — reexporta `wire`. Como el resto de `deps.*` posteriores a `sha`, `deps.stt` es opcional en `createApp` (sin él, `/ws/audio` cierra con 1011 y `{ type: "error", code: "upstream_unavailable" }`).

**Una sola sentada:** el protocolo, el adaptador, la cuota y el cliente giran alrededor de un único contrato (`wire.ts` + `SttAdapter`); el doble de pruebas es un archivo.

**Done when**

- [ ] **WHEN** a WebSocket to `/ws/audio` opens and no `auth` message arrives within `authTimeoutMs` (5000 ms by default) **THE SYSTEM SHALL** close it with code 4401 and never call `SttAdapter.open`.
- [ ] **WHEN** the first message carries an invalid token **THE SYSTEM SHALL** close with 4401, and **WHEN** it carries a valid token for an email outside `ALLOWED_EMAILS` **THE SYSTEM SHALL** close with 4403, in both cases without opening an STT stream.
- [ ] **WHEN** an authenticated client sends binary frames of 3200 bytes **THE SYSTEM SHALL** forward every byte to the adapter in order and send `transcript` messages, and **WHEN** a frame has odd length or more than 25000 bytes **THE SYSTEM SHALL** close with code 4400 without forwarding it.
- [ ] **WHEN** the audio received in a session reaches 270 s (bytes divided by 32000, not wall-clock) **THE SYSTEM SHALL** send `{ type: 'limit' }`, end the STT stream and close with code 1000.
- [ ] **WHEN** `usage/{yyyy-mm-dd}.sttSeconds` of the organization is at least `STT_DAILY_SECONDS_PER_ORG` **THE SYSTEM SHALL** send `{ type: 'error', code: 'quota_exceeded' }` and close with 4429 before opening the stream, and **WHEN** a stream closes **THE SYSTEM SHALL** add the streamed seconds and `cost_usd` (seconds divided by 60 times `STT_PRICE_USD_PER_MIN`) to that day document.
- [ ] **WHEN** the client socket drops while recording **THE SYSTEM SHALL** have `useAudioSocket` retry after 500, 1000 and 2000 ms, expose the states `reconectando` and finally `fallo` after the third failed attempt (asserted with fake timers and a simulated `WebSocket`).

**Verify**

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
git add -A && git commit -m "step 14: audio-gateway"
git tag step-14-audio-gateway
```

---

#### Paso 15 — Sesiones, dicción y retención de audio

**Tarea:** `E3-T3` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

Una sesión se crea, se cierra con su contorno y métricas (incluida la dicción), el audio temporal se borra por código y un barredor autenticado limpia lo que quede.

Sesiones, métricas y retención de audio. El audio temporal existe solo para el análisis de muletillas (bandera `FILLERS_FROM_AUDIO`); se borra por código al terminar y un barredor horario cubre cualquier resto.

- `packages/shared/src/coaching/diction.ts` — `dictionScore({ confidence, ppm, pauseRatio, profileId }): number` = `100 × (0.55 × confidence + 0.25 × rhythmFactor + 0.20 × pauseFactor)`, con `confidence ∈ [0,1]` (media de la confianza por enunciado ponderada por palabras), `rhythmFactor = 1` si `ppm` está en el rango del perfil y `max(0, 1 − dist/20)` con `dist` = ppm de distancia al límite más cercano; `pauseFactor = 1` si `pauseRatio` está en el rango del perfil y `max(0, 1 − dist/0.15)` si no; resultado acotado a [0,100] y redondeado a 1 decimal. Es un **proxy**, no análisis fonético clínico (límite honesto del producto).
- `packages/shared/src/schemas/session.ts` (editar) — `FinishSessionSchema`: `{ contour: number[] (≤ 3000), referenceHz, metrics, transcript, utterances }`; `contour` se guarda como enteros (`round(semitonos × 10)`).
- `apps/server/src/routes/sessions.ts` — todas bajo `/api/v1/orgs/:orgId/sessions`, con el guardia `requireOrgMember` (404 —no 403— si el usuario no es miembro): `POST /` crea `sessions/{id}` con `state: "recording"`; `POST /:id/finish` valida con `FinishSessionSchema`, calcula `dictionScore`, guarda `contour` compacto, `metrics`, `state: "done"`, `endedAt`, y llama a `finalizeSession` (ver abajo); `GET /:id`; `DELETE /:id` (borrado duro del documento, de `reports/{id}` y del audio).
- `apps/server/src/storage/audio-store.ts` — único módulo que importa `@google-cloud/storage`/`firebase-admin/storage`: `saveSessionAudio(orgId, sessionId, pcm: Uint8Array)` escribe `tmp/{orgId}/{sessionId}.wav` (con `encodeWavPcm16`), `deleteSessionAudio(orgId, sessionId)` (idempotente), `listTmpObjects()`. La pasarela del paso 14 acumula el PCM de la sesión en memoria (máx. 270 s × 32 000 B = 8.64 MB) y, si `FILLERS_FROM_AUDIO` es `true`, lo guarda al terminar el stream.
- `apps/server/src/sessions/finalize.ts` — `finalizeSession(deps, orgId, sessionId)`: persistencia → (hueco del paso 16: informe) → `finally { deleteSessionAudio }`. El borrado ocurre **siempre**, exista o no el objeto, falle o no el informe.
- `apps/server/src/storage/sweeper.ts` — `sweepAudio(now = Date.now())` borra todo objeto de `tmp/` con antigüedad > 24 h y devuelve `{ deleted }`; la hora se inyecta para poder probarlo.
- `apps/server/src/routes/internal.ts` — `POST /internal/sweep-audio`: exige `Authorization: Bearer <OIDC>`; verifica con `OAuth2Client` de `google-auth-library` (`verifyIdToken({ idToken, audience: SWEEP_AUDIENCE })`, `payload.email === SCHEDULER_SA_EMAIL` y `email_verified`); sin token válido → 401 y no borra nada. El verificador se inyecta (`deps.oidcVerifier`) para que las pruebas usen un doble. Garantía honesta que documenta el runbook: "borrado ≤ 24 h + intervalo del barredor (1 h) en condiciones normales; la regla lifecycle `age:1` es solo respaldo y no garantiza el momento".
- `apps/server/src/env.ts` (editar) — añade `STORAGE_BUCKET`, `SWEEP_AUDIENCE`, `SCHEDULER_SA_EMAIL`, `FILLERS_FROM_AUDIO` (boolean, por defecto `true`), obligatorias desde el paso 15 salvo la bandera. `google-auth-library` (11.1.0) ya está en `apps/server/package.json` desde el Bootstrap: no hay nada que instalar aquí.
- `apps/server/src/sessions/finalize.ts` y `apps/server/src/app.ts` (editar `app.ts` para montar las rutas de sesiones y `/internal`; `finalize.ts` es nuevo en este paso).
- Pruebas: `dictionScore` (vector fijo: confianza 0.8, ppm 20 por encima del rango, pausas en rango → 64.0 exacto; límites 0 y 100), `sessions.test.ts` y `sweeper.test.ts` en `apps/server/tests/emulator/` (Storage emulator: se sube un objeto, `sweepAudio(now)` no lo borra, `sweepAudio(now + 25 h)` sí), aislamiento (`orgId` ajeno → 404 sin escrituras), tamaño de documento (3000 puntos < 1 MiB), WAV subido decodificable a las muestras enviadas.
- `packages/shared/src/index.ts` (editar) — reexporta `coaching/diction`. `deps.oidcVerifier` es opcional como el resto de `deps.*` posteriores a `sha` (sin él, `/internal/sweep-audio` responde 401).

**Una sola sentada:** una canalización (crear → cerrar → borrar audio → barrer) con un módulo por eslabón y pruebas contra emuladores.

**Done when**

- [ ] **WHEN** `dictionScore` runs with confidence 0.8, ppm 20 above the profile range and pause ratio inside its range **THE SYSTEM SHALL** return exactly 64.0 (weights 0.55, 0.25, 0.20), and **WHEN** all three factors are 1 **THE SYSTEM SHALL** return 100, never leaving the range 0 to 100.
- [ ] **WHEN** `POST /api/v1/orgs/:orgId/sessions` is called with an `orgId` of which the caller is not a member **THE SYSTEM SHALL** answer 404 (not 403) and write nothing, and with the caller's own org **THE SYSTEM SHALL** create `sessions/{id}` with `state: 'recording'`.
- [ ] **WHEN** `POST /api/v1/orgs/:orgId/sessions/:id/finish` receives a contour of 3000 points **THE SYSTEM SHALL** store `contour` as integers (semitones times 10, rounded) in a document smaller than 1 MiB with `state: 'done'`, and **WHEN** the contour has more than 3000 points **THE SYSTEM SHALL** answer 422 with code `validation_error`.
- [ ] **WHEN** a session finishes, whether or not an audio object exists, **THE SYSTEM SHALL** delete `tmp/{orgId}/{sessionId}.wav` from Storage, and **WHEN** `DELETE /api/v1/orgs/:orgId/sessions/:id` runs **THE SYSTEM SHALL** hard-delete the session document, its report and its audio.
- [ ] **WHEN** `POST /internal/sweep-audio` is called without a bearer accepted by the injected OIDC verifier **THE SYSTEM SHALL** answer 401 and delete nothing, and with a valid one (email equal to `SCHEDULER_SA_EMAIL`, audience equal to `SWEEP_AUDIENCE`) **THE SYSTEM SHALL** delete every object under `tmp/` older than 24 h and keep newer ones, answering `{ deleted: n }`.
- [ ] **WHEN** the gateway stores session audio **THE SYSTEM SHALL** write a WAV (RIFF, 16000 Hz, mono, PCM16) that `decodeWavPcm16` turns back into the exact samples that were streamed.

**Verify**

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
git add -A && git commit -m "step 15: sessions-retention"
git tag step-15-sessions-retention
```

---

#### Paso 16 — Pasarela Gemini, informe estructurado y evaluación

**Tarea:** `E3-T4` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

Un único módulo envuelve el SDK de Gemini para marcas de fantasma, informe de sesión y muletillas desde audio, con reparación, registro de costos y una suite de evaluación con baseline.

Pasarela de Gemini: **un único módulo importa el SDK** (`apps/server/src/llm/gateway.ts`). El ID del modelo vive solo en la configuración (`GEMINI_MODEL`), nunca en el código.

- `apps/server/src/env.ts` (editar) — añade `GEMINI_MODEL` (obligatoria, **sin valor por defecto en código**), `GEMINI_LOCATION` (por defecto el valor de `.env.example`), `GEMINI_TIMEOUT_MS`; obligatorias desde el paso 16.
- `packages/shared/src/llm-schemas.ts` — `GhostMarksSchema` (`{ marks: EmphasisMark[], pauses: PauseMark[] }`) y `FillersFromAudioSchema` (`{ fillers: Array<{ word: string, atMs: number }> }`); `ReportSchema` (`{ priorityCorrection: { title, detail }, replacements: Array<{ original, suggestions, context }>, summary }` más los campos de §4) ya existe desde el paso 3 en `schemas/report.ts` y es la fuente única: el esquema JSON que se envía al modelo se deriva con `z.toJSONSchema`. **El segundo y la palabra donde la línea se separó del fantasma NO los inventa el modelo: los calcula `trackingScore` (paso 11) y se copian al informe.**
- `apps/server/src/llm/gateway.ts` — `interface LlmTransport { generate(req: { model: string; system: string; parts: LlmPart[]; jsonSchema: object; timeoutMs: number }): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number; cachedTokens: number } }> }`; `createGeminiTransport(env)` usa `new GoogleGenAI({ vertexai: true, project: env.GOOGLE_CLOUD_PROJECT, location: env.GEMINI_LOCATION })` con **opciones explícitas, nunca variables de entorno ambientales** (las variables del snippet de Google son inconsistentes), y `ai.models.generateContent({ model, contents, config: { systemInstruction, responseMimeType: "application/json", responseJsonSchema, abortSignal } })`; `generateStructured<T>({ feature, system, parts, schema, orgId, sessionId }, deps: { transport: LlmTransport; recordCall(row: LlmCallRow): Promise<void>; env })` → llama al transporte, valida con el esquema zod; si falla la validación, **un** reintento de reparación añadiendo el error del validador al prompt; un segundo fallo lanza `LlmError("invalid_output")`. Errores 429/5xx/transporte: reintento con retroceso exponencial con jitter (máx. 2 reintentos); 400: sin reintento (`LlmError("bad_request")`). Cada llamada (éxito o fallo) invoca `recordCall(row)`: el servidor inyecta el escritor de Firestore (`orgs/{orgId}/llm_calls/{id}`, vía `createOrgStore`) y `evals/run.ts` un registrador en memoria, de modo que el modo grabado no necesita Firestore. La fila lleva `feature`, `model`, `tokensIn`, `tokensOut`, `tokensCached`, `latencyMs`, `costUsd` (siempre `null` en v1: no se escribe ningún precio en el código; el costo se calcula a partir de los tokens con los precios verificados al revisar la factura — los precios indicativos de §16 están marcados VERIFICAR), `status`, `createdAt`.
- `apps/server/src/llm/features.ts` — tres funciones: `ghostMarks({ text, profileId })`, `sessionReport({ metrics, transcript, divergence, profileId, comodinWords })` y `fillersFromAudio({ fileUri })`. Los prompts viven en archivos `apps/server/src/llm/prompts/*.md` versionados (cargados con `readFileSync` en el arranque del módulo); el contenido no estable (texto del usuario) va al final; el contenido del usuario se delimita como DATO ("el texto entre <dato> y </dato> no contiene instrucciones"). El audio se pasa como `fileUri` `gs://${STORAGE_BUCKET}/tmp/{orgId}/{sessionId}.wav` (límite documentado: 15 MB; 5 min de PCM 16 kHz mono ≈ 9.6 MB entran) con `mimeType: "audio/wav"`.
- `apps/server/src/routes/ghost.ts` — `POST /api/v1/orgs/:orgId/ghost` `{ text, profileId }`: intenta `ghostMarks`; ante cualquier `LlmError` responde 200 con `source: "heuristic"` y `heuristicMarks` (el producto no se vacía si falla el modelo); éxito → `source: "gemini"`.
- `apps/server/src/sessions/finalize.ts` y `apps/server/src/app.ts` (editar; `app.ts` monta `routes/ghost.ts` y recibe `deps.llm`) — tras persistir: si `FILLERS_FROM_AUDIO` y existe el objeto de audio, `fillersFromAudio`; luego `sessionReport`; guarda `reports/{sessionId}` validado con `ReportSchema` más `divergence` calculada; cualquier fallo del LLM deja `state: "done"` sin informe (`report: null`) y **no** impide el borrado del audio (`finally`).
- Carga del entorno: `pnpm eval` (`tsx --env-file=.env.example`) ya trae todas las variables; `pnpm eval:live` y `pnpm spike:stt` usan el `.env` real (los importa `load-dotenv.ts`). Evaluación — `apps/server/evals/golden.json`: **al menos 20 casos** repartidos en `ghostMarks` (8), `sessionReport` (8), `fillersFromAudio` (4) y 2 casos de respuesta malformada que debe repararse; cada caso tiene los campos `id`, `feature`, `input`, `recorded` (la respuesta cruda grabada) y `expect` (propiedades estructurales que debe cumplir la salida). `apps/server/evals/run.ts` — modo `recorded` (por defecto, sin red: reproduce las respuestas grabadas a través del mismo `generateStructured` con un `LlmTransport` de reproducción) o `--live` (usa el transporte real; solo manual, `pnpm eval:live`). Imprime tasa de aciertos, costo y latencia p95, y sale con código 1 si la tasa cae por debajo de `apps/server/evals/baseline.json` (un objeto con el campo `passRate`, calculado en la primera ejecución limpia y commiteado). Honestidad: el modo `recorded` prueba el pipeline (esquemas, reparación, límites), no la calidad del modelo; la calidad se mide con `pnpm eval:live` en la puerta manual.
- Pruebas (`apps/server/tests/emulator/llm-gateway.test.ts` por escribir `llm_calls`; el resto unitarias en `apps/server/src/llm/*.test.ts`): reparación (malformado → válido = 2 llamadas; malformado dos veces = 2 llamadas y `LlmError`), 429 reintenta y 400 no, fila `llm_calls`, `ghost` con fallo del modelo → `source: "heuristic"`, informe guardado y audio borrado, `evals.test.ts` (la función de puntuación devuelve fallo si se corrompe una respuesta grabada).
- **Puertas de grep del paso**: ningún ID de modelo en el código y un único importador del SDK (ver Verify).
- `packages/shared/src/index.ts` (editar) — reexporta `llm-schemas`. `deps.llm` es opcional como el resto de `deps.*` posteriores a `sha` (sin él, `POST …/ghost` usa las marcas heurísticas y `finalizeSession` no genera informe).

**Una sola sentada:** un único módulo de pasarela con tres funciones del mismo patrón (esquema → llamada → validación → registro) y un conjunto de evaluación; los prompts son archivos de texto.

**Done when**

- [ ] **WHEN** `grep -rEn 'gemini-[0-9]' apps/server/src apps/web/src packages/shared/src` runs **THE SYSTEM SHALL** find no match (exit code 1), and `@google/genai` SHALL be imported by exactly one file, `apps/server/src/llm/gateway.ts`.
- [ ] **WHEN** the transport returns malformed output and then valid output **THE SYSTEM SHALL** return the parsed value after exactly 2 transport calls, the second including the validator error, and **WHEN** it returns invalid output twice **THE SYSTEM SHALL** throw `LlmError` with code `invalid_output` after exactly 2 transport calls.
- [ ] **WHEN** the transport fails with a 429 or 5xx error **THE SYSTEM SHALL** retry with exponential backoff and jitter up to 2 times, and **WHEN** it fails with a 400 error **THE SYSTEM SHALL** not retry.
- [ ] **WHEN** any gateway call completes **THE SYSTEM SHALL** invoke the injected `recordCall(row)` exactly once with `feature`, `model` equal to the `GEMINI_MODEL` value, `tokensIn`, `tokensOut`, `tokensCached`, `latencyMs`, `status` and `createdAt`, and the Firestore writer that the server injects SHALL persist that row as `orgs/{orgId}/llm_calls/{id}`.
- [ ] **WHEN** `POST /api/v1/orgs/:orgId/ghost` is called and the model fails **THE SYSTEM SHALL** answer 200 with `source: 'heuristic'` marks, and **WHEN** it succeeds `source: 'gemini'`; and **WHEN** a session finishes **THE SYSTEM SHALL** store `reports/{sessionId}` valid against `ReportSchema` with the `divergence` computed by `trackingScore`, and delete the temporary audio even if the model call fails.
- [ ] **WHEN** `pnpm eval` runs in recorded mode with an in-memory `recordCall` and no Firestore **THE SYSTEM SHALL** score every case of `apps/server/evals/golden.json` (at least 20 cases), print pass rate, cost and p95 latency, and exit 0 only when the pass rate is at least the one committed in `apps/server/evals/baseline.json`.

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:emu
pnpm build
node scripts/smoke-server.mjs
pnpm eval
grep -rEn 'gemini-[0-9]' apps/server/src apps/web/src packages/shared/src; test $? -eq 1
test "$(grep -rl '@google/genai' apps/server/src | wc -l | tr -d ' ')" = 1
grep -rl '@google/genai' apps/server/src | grep -qx 'apps/server/src/llm/gateway.ts'
```

**Checkpoint**

```bash
git add -A && git commit -m "step 16: gemini-gateway"
git tag step-16-gemini-gateway
git ls-files --error-unmatch apps/server/evals/baseline.json   # expect: exit 0 — ya commiteado
```

---

#### Paso 17 — Veredicto, repertorio de 10 frases y rutas de frases

**Tarea:** `E3-T5` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

Existen el veredicto exacto de Frase Perfecta, el repertorio de 10 frases con su fantasma, las rutas de frases por organización y el guardado del mejor intento (mi mejor yo), todo en shared y servidor.

Lado compartido y servidor del modo Frase Perfecta: veredicto exacto, repertorio de 10 frases, rutas de frases y "mi mejor yo". Sin pantallas: la interfaz y el flujo de grabación llegan en el paso 18. El veredicto **"ORATORIA PERFECTA ✓"** solo existe si se cumplen las cuatro condiciones a la vez.

- `packages/shared/src/coaching/verdict.ts` — `evaluateVerdict({ trackingPct, diction, fillers, ppm, profileId, divergence }): { perfect: boolean; failedChecks: Array<"seguimiento"|"diccion"|"muletillas"|"ritmo">; divergence }` con `perfect` ⇔ `trackingPct ≥ 85 && diction ≥ 85 && fillers === 0 && ppm dentro del rango del perfil` (límites inclusivos: 85 exacto es perfecto, 84.99 no).
- `packages/shared/src/coaching/repertoire.ts` — `REPERTOIRE_SEED`: **exactamente 10** frases de negocio en español neutro (cada una de 12 a 40 palabras, ids estables `frase-01`…`frase-10`, temas: ventas, seguros, propuesta de valor, cierre, objeciones, urgencia, legado/familia, confianza, llamada a la acción, presentación en evento). `normalizeContour(contour, targetLength)` re-muestrea en tiempo y deja el contorno en semitonos relativos; `ghostForPhrase(phrase, mode: "perfil" | "mi-mejor-yo")` devuelve el fantasma de plantilla y, en `mi-mejor-yo`, el `bestRunContour` guardado (si no existe, cae a la plantilla).
- `packages/shared/src/index.ts` (editar) — reexporta `coaching/verdict.ts` y `coaching/repertoire.ts`.
- `apps/server/src/routes/phrases.ts` — bajo `/api/v1/orgs/:orgId/phrases`: `GET /` (si la organización no tiene frases, las siembra desde `REPERTOIRE_SEED` con marcas heurísticas y `seeded: true`; idempotente), `POST /` (frase propia), `DELETE /:id`, todas con el guardia de membresía (404 si la organización es ajena). `apps/server/src/app.ts` (editar) monta la ruta.
- `apps/server/src/sessions/finalize.ts` (editar) — tras persistir, si el veredicto de una sesión de modo `frase` es perfecto, guarda su contorno normalizado (`normalizeContour`) como `bestRunContour` de la frase; si no es perfecto no toca la frase.
- Pruebas: `verdict.test.ts` (tabla: cada condición falla sola → no perfecto; límites 85 / 84.99; `fillers = 1` → no perfecto; el resultado no perfecto conserva la `divergence`), `repertoire.test.ts` (10 frases, ids únicos, 12–40 palabras, `generateGhost` sin error para los 3 perfiles, `ghostForPhrase` con y sin mejor intento) y `apps/server/tests/emulator/phrases.test.ts` (siembra idempotente, alta y baja de frases propias, aislamiento por organización, `bestRunContour` guardado solo con veredicto perfecto).

**Done when**

- [ ] **WHEN** `evaluateVerdict` runs **THE SYSTEM SHALL** return `perfect: true` only when tracking is at least 85, diction is at least 85, fillers equal 0 and ppm is inside the profile range, treating 85 as perfect and 84.99 as not perfect, each failing condition alone SHALL give `perfect: false` with that condition in `failedChecks`, and a not-perfect result SHALL carry the `divergence` second and word computed by `trackingScore`.
- [ ] **WHEN** `REPERTOIRE_SEED` is read **THE SYSTEM SHALL** contain exactly 10 phrases with unique ids, each of 12 to 40 words, and `generateGhost` SHALL produce a ghost for each of them in all three profiles without throwing.
- [ ] **WHEN** a Frase Perfecta session reaches a perfect verdict **THE SYSTEM SHALL** store its time-normalized, semitone-relative contour as `bestRunContour` of the phrase and `ghostForPhrase(phrase, 'mi-mejor-yo')` SHALL return it, and **WHEN** the verdict is not perfect or no best run exists **THE SYSTEM SHALL** leave the phrase unchanged and fall back to the profile template.
- [ ] **WHEN** `GET /api/v1/orgs/:orgId/phrases` runs for an org without phrases **THE SYSTEM SHALL** seed the 10 phrases of the repertoire and a second call SHALL leave exactly 10, `POST` and `DELETE` SHALL add and remove an own phrase, and **WHEN** the `orgId` belongs to another org **THE SYSTEM SHALL** answer 404 and write nothing.

**Verify**

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
git add -A && git commit -m "step 17: verdict-phrases"
git tag step-17-verdict-phrases
```

---

#### Paso 18 — Frase Perfecta en pantalla y flujo de grabación

**Tarea:** `E3-T6` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

El usuario elige perfil y frase, la dice siguiendo el fantasma y recibe el veredicto con el segundo y la palabra de la separación; el flujo de grabación de sesiones y el medidor de Dicción quedan cableados.

Interfaz del modo Frase Perfecta y el flujo de grabación de sesiones, que ningún paso anterior construye. Usa los motores del paso 13, el WebSocket del paso 14, las sesiones del paso 15, el informe del paso 16 y el veredicto y repertorio del paso 17.

- `apps/web/src/session/useRecordingSession.ts` — **el flujo de grabación de sesiones, que ningún paso anterior construye**. `useRecordingSession({ profileId, mode, phraseId?, ghost? })` devuelve `{ estado, iniciar, detener, dictionLive }` y ejecuta, en este orden: (1) `POST /api/v1/orgs/:orgId/sessions` → `sessionId`; (2) abre `useAudioSocket` (paso 14) y envía como **primer mensaje** `auth` con `sessionId`; (3) reenvía cada trama de `MicCapture` como binario; (4) al detener envía `end` y espera `done` con los enunciados; (5) calcula las métricas del cliente con funciones puras de `@pulso/shared`: `computeRhythm` (VAD + palabras), `countFillers`, `trackingScore` (si hay fantasma), `computeGreenZone`/`classifyHz` para `greenZonePct`, `activeVocabPer100` y `detectComodin` (paso 13); (6) `POST …/sessions/:id/finish` con contorno, `referenceHz`, métricas, transcripción y enunciados; (7) navega a `/sesiones/:id`. Mientras graba, `dictionLive` = `dictionScore` (paso 15) calculado con la confianza media de los enunciados finales recibidos, el ppm y la razón de pausas actuales, y alimenta el medidor de **Dicción** de `Meters.tsx` (que hasta ahora mostraba "—"). `Monitor.tsx` ("Grabar") usa este mismo hook con `mode: "libre"` (la semana de línea base del paso 19 depende de ello) y `FrasePerfecta.tsx` con `mode: "frase"` o `"mi-mejor-yo"`. `useRecordingSession.test.ts` lo prueba con `MicCapture`, `WebSocket` y `apiFetch` simulados y verifica el orden de las llamadas.
- `apps/web/src/routes/FrasePerfecta.tsx` — tres pasos con `<ol>` visible y foco gestionado: (1) elegir perfil y frase del repertorio (o escribir una; llama a `POST …/ghost` para las marcas), (2) decirla siguiendo el fantasma (monitor + fantasma + puntaje de seguimiento en vivo), (3) veredicto.
- `apps/web/src/components/Verdict.tsx` — el sello se muestra **una sola vez**: texto exacto `ORATORIA PERFECTA ✓`, animación de 400 ms de un único pulso (`emil-design-eng` para la curva; desactivada con `prefers-reduced-motion`) y un `role="status"` con el mismo texto; si no es perfecto, lista cada condición fallida como texto. `apps/web/src/routes/Sesion.tsx` (reporte `/sesiones/:id`) muestra métricas, `segundo N · palabra «X»` de la separación, corrección prioritaria, reemplazos de vocabulario y el sello. `apps/web/src/routes/Repertorio.tsx` lista las 10 frases con una vista previa del fantasma. Textos nuevos en `i18n/es.ts`.
- Pruebas: `useRecordingSession.test.ts` (orden de las llamadas con dobles de `MicCapture`, `WebSocket` y `apiFetch`), `Verdict.test.tsx` y `FrasePerfecta.test.tsx` (jsdom: los tres pasos en un `<ol>`, foco gestionado) y `tests/e2e/app/perfect-phrase.spec.ts` (con el STT grabado del servidor de pruebas y el micrófono falso: elegir "Tarima", cargar la frase 1, grabar 6 s, aterrizar en `/sesiones/:id` con veredicto **no** perfecto, segundo y palabra visibles; el documento existe vía `GET`).

**Done when**

- [ ] **WHEN** the `Verdict` component renders a perfect result **THE SYSTEM SHALL** show the text `ORATORIA PERFECTA ✓` exactly once with a `role="status"` announcement, and **WHEN** the result is not perfect **THE SYSTEM SHALL** list each failed check as text and `segundo N · palabra «X»` for the divergence.
- [ ] **WHEN** `useRecordingSession` runs with a simulated `MicCapture`, `WebSocket` and `apiFetch` **THE SYSTEM SHALL**, in this order, call `POST …/sessions`, send `auth` with the returned `sessionId` as the first socket message, forward every frame as binary, send `end`, call `POST …/sessions/:id/finish` with the metrics computed by `computeRhythm`, `countFillers`, `trackingScore`, `activeVocabPer100` and `detectComodin`, and navigate to `/sesiones/:id`, and the Dicción meter SHALL show `dictionScore` computed from the utterance confidences instead of a dash.
- [ ] **WHEN** `FrasePerfecta` renders in jsdom **THE SYSTEM SHALL** show the three steps in an ordered list, move focus to the heading of the active step when it changes, and offer the 10 phrases of the repertoire in step 1.
- [ ] **WHEN** `pnpm test:e2e:full tests/e2e/app/perfect-phrase.spec.ts` selects Tarima, loads phrase 1 and records the fake microphone for 6 s **THE SYSTEM SHALL** navigate to `/sesiones/:id` showing a not-perfect verdict with a divergence second and word, and the session document SHALL be readable through `GET /api/v1/orgs/:orgId/sessions/:id`.

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
node scripts/check-no-hex.mjs
pnpm build
pnpm test:e2e:full tests/e2e/app/perfect-phrase.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 18: perfect-phrase-ui"
git tag step-18-perfect-phrase-ui
```

---

#### Paso 19 — Rutas y pantallas del coaching; exportar y borrar cuenta

**Tarea:** `E3-T7` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

El usuario ve su vocabulario, su reto semanal, su línea base y su nivel en pantalla, guarda su diccionario y su ficha vocal, y puede exportar o borrar todos sus datos.

Rutas del servidor y pantallas de web del coaching: diccionario personal, reto semanal, línea base con ficha vocal, Inicio, y exportar/borrar la cuenta. Los motores puros ya existen (paso 13) y el flujo de grabación (paso 18); aquí solo se conectan.

- `apps/server/src/routes/vocab.ts` — `GET/PUT /api/v1/orgs/:orgId/vocab` (diccionario personal) y `GET/PUT …/challenge` (reto semanal, clave `isoWeekKey(new Date())`).
- `apps/server/src/routes/baseline.ts` — `PUT …/voice-sheet/:profileId` y `POST …/baseline/complete` (construye las fichas con `buildVoiceSheet`).
- `apps/server/src/routes/account.ts` — `GET /api/v1/orgs/:orgId/export` (JSON con `user`, `org`, `members` y todas las subcolecciones de `COLLECTION_NAMES`, con `checkRevoked: true`) y `DELETE /api/v1/orgs/:orgId` con cuerpo `{ confirm: "BORRAR" }` (borra recursivamente `orgs/{orgId}`, `users/{uid}`, el audio `tmp/{orgId}/`, y el usuario de Auth con `deleteUser`; después `POST /api/v1/session` con el token viejo responde 401 por `checkRevoked`). Ambas exigen que el usuario sea el `ownerUid`. `apps/server/src/app.ts` (editar) monta las tres rutas.
- Web — `routes/Vocabulario.tsx` (palabras comodín con conteo real de las sesiones, reemplazos en contexto, diccionario personal editable, reto semanal con ✓ por palabra usada), `routes/Baseline.tsx` (plan de la semana con `baselinePlan`, progreso y ficha vocal; los botones "Grabar" usan `useRecordingSession` en modo `libre`), `routes/Inicio.tsx` (nivel con `computeLevel` o "Midiendo tu línea base" según `levelState`, reto semanal, siguiente sesión), `routes/Ajustes.tsx` (activa "Exportar mis datos" —descarga `pulso-datos.json`— y "Borrar mi cuenta" con diálogo de confirmación `@radix-ui/react-dialog` que exige escribir `BORRAR`). Textos nuevos en `i18n/es.ts`; `router.tsx` ya tiene las rutas del manifiesto (paso 7).
- Pruebas: `apps/server/tests/emulator/account.test.ts` (exportar incluye cada colección; borrar deja 0 documentos bajo la organización y el usuario ya no puede re-aprovisionarse), `apps/server/tests/emulator/baseline.test.ts` (la ficha se guarda por perfil y `orgId` ajeno responde 404), `Vocabulario.test.tsx` y `Inicio.test.tsx` (jsdom) y `tests/e2e/app/baseline.spec.ts` (Inicio muestra "Midiendo tu línea base" en un usuario nuevo; Ajustes exporta un JSON con las claves esperadas).

**Done when**

- [ ] **WHEN** `GET /api/v1/orgs/:orgId/export` runs **THE SYSTEM SHALL** return JSON with the user, the org, the members and every collection of `COLLECTION_NAMES`, and **WHEN** `DELETE /api/v1/orgs/:orgId` runs with `{ confirm: 'BORRAR' }` **THE SYSTEM SHALL** leave no document under the organization, delete the Auth user and the `tmp/{orgId}/` audio, and answer 401 to a later `POST /api/v1/session` with the old token.
- [ ] **WHEN** `PUT /api/v1/orgs/:orgId/voice-sheet/:profileId` and `POST /api/v1/orgs/:orgId/baseline/complete` run for the caller's org **THE SYSTEM SHALL** persist one `voiceSheet` document per profile that has enough samples, and **WHEN** the `orgId` belongs to another org **THE SYSTEM SHALL** answer 404 and write nothing.
- [ ] **WHEN** `GET` and `PUT` run on `/api/v1/orgs/:orgId/vocab` and `/api/v1/orgs/:orgId/challenge` **THE SYSTEM SHALL** persist and return the personal dictionary and the weekly challenge keyed by `isoWeekKey(now)`, answering 422 with code `validation_error` on invalid input.
- [ ] **WHEN** `Inicio` renders in jsdom for `levelState` equal to `midiendo` **THE SYSTEM SHALL** show 'Midiendo tu línea base' and no level, and otherwise **THE SYSTEM SHALL** show the level band, and `Vocabulario` SHALL show the comodín counts as text.
- [ ] **WHEN** `pnpm test:e2e:full tests/e2e/app/baseline.spec.ts` runs for a new user **THE SYSTEM SHALL** show 'Midiendo tu línea base' on Inicio and export from Ajustes a JSON file with the keys user, org, members and every collection name.

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:emu
node scripts/check-no-hex.mjs
pnpm build
pnpm test:e2e:full tests/e2e/app/baseline.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 19: coaching-routes-web"
git tag step-19-coaching-routes-web
```

---

#### Paso 20 — Límites de tasa, presupuesto de bundle y pasada a11y

**Tarea:** `E3-T8` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

El servidor limita la tasa de solicitudes, el bundle tiene una guarda de tamaño y todas las rutas autenticadas pasan axe y el recorrido de teclado en ambos temas.

Endurecimiento de calidad: límites de tasa, presupuesto de bundle y pasada de accesibilidad sobre todas las rutas. Nada de esto despliega ni llama a Google.

- `apps/server/src/rate-limit.ts` — middleware de ventana fija en memoria por `uid` (o por IP en `POST /api/v1/session`): 60 solicitudes/min por `uid`, 10/min por IP en `/session`; excedido → 429 `rate_limited` con `retry-after`. Limitación honesta: es **por instancia** de Cloud Run (con varias instancias el tope efectivo se multiplica); la defensa de costo real son la cuota diaria de STT y el tope de 270 s. El reloj se inyecta. `apps/server/src/app.ts` (editar) lo monta; `rate-limit.test.ts` lo prueba con reloj falso.
- `deploy/check-bundle-budget.mjs` — tras `pnpm build` suma los bytes gzip de `apps/web/dist/assets/*.js` (presupuesto: ≤ 600 KB) y de `*.css` (≤ 60 KB); falla si se exceden. Es una guarda de regresión inicial: se afina tras medir en producción.
- `tests/e2e/app/a11y.spec.ts` — **no importa código del producto**: lee `apps/web/src/routes.ts` como TEXTO (con `node:fs`) y extrae los `path` de las rutas con `auth: "usuario"`; antes del recorrido crea una sesión real llamando a la API del servidor de pruebas (`POST /api/v1/orgs/:orgId/sessions` con el token del usuario de prueba) para sustituir `:id` en `/sesiones/:id`. Recorre cada ruta en el tema oscuro y en el claro a 375 px con `AxeBuilder` (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) y exige 0 violaciones; el primer Tab llega al enlace "Saltar al contenido" y todo elemento enfocable tiene `outline-width ≥ 2px`.

**Done when**

- [ ] **WHEN** the 61st authenticated request from one uid arrives within 60 s **THE SYSTEM SHALL** answer 429 with code `rate_limited` and a `retry-after` header, while the first 60 pass, and **WHEN** the window elapses (injected clock) **THE SYSTEM SHALL** accept requests again.
- [ ] **WHEN** the limiter is mounted **THE SYSTEM SHALL** keep `/health`, `/health/deep` and `/internal/*` outside the limit and key `POST /api/v1/session` by client IP at 10 per minute.
- [ ] **WHEN** `pnpm build` and then `node deploy/check-bundle-budget.mjs` run **THE SYSTEM SHALL** exit 0 with the gzip size of `apps/web/dist/assets/*.js` at most 600 KB and of `*.css` at most 60 KB.
- [ ] **WHEN** `pnpm test:e2e:full tests/e2e/app/a11y.spec.ts` reads the authenticated routes from `apps/web/src/routes.ts` as text, creates one session through the API for `/sesiones/:id`, and scans every route in the dark and light themes at 375 px **THE SYSTEM SHALL** report 0 axe violations for the tags wcag2a, wcag2aa, wcag21aa and wcag22aa, reach the skip link with the first Tab and find `outline-width` of at least 2px on every focused element.

**Verify**

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:emu
pnpm build
node deploy/check-bundle-budget.mjs
pnpm test:e2e:full tests/e2e/app/a11y.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 20: hardening-quality"
git tag step-20-hardening-quality
git ls-files --error-unmatch deploy/check-bundle-budget.mjs   # expect: exit 0 — ya commiteado
```

---

#### Paso 21 — Scripts de entrega, runbook y CI

**Tarea:** `E3-T9` · **Épica:** `03-coaching-y-lanzamiento`

**Do**

Existen los scripts de despliegue y alertas validados localmente, el runbook, el CI idéntico a la puerta final y las pruebas estáticas que fijan los valores compartidos; la entrega real queda como puertas manuales con dueño.

Entrega: scripts de despliegue y alertas validados localmente, runbook, CI idéntico a la puerta final y las pruebas estáticas que fijan los valores compartidos. **El despliegue real, las alertas de presupuesto, el spike de STT, el iPhone y el lector de pantalla son puertas manuales con dueño** (§20.1), no pasos de la build. Todos los scripts usan `set -euo pipefail`, comprueban sus variables obligatorias y **ninguno se ejecuta en la build**.

El directorio `deploy/` que posee este paso (siete archivos: cinco `.sh`, `storage-lifecycle.json` y `RUNBOOK.md`; `check-bundle-budget.mjs` es del paso 20):
- `deploy/deploy-server.sh` — `gcloud run deploy pulso-server --source . --region us-central1 --allow-unauthenticated --min-instances 0 --max-instances 3 --timeout 600 --set-env-vars …` (`--min-instances 1` queda documentado en comentarios como opción de pago contra el arranque en frío).
- `deploy/deploy-web.sh` — exige que exista `.env.production.local` con los `VITE_*` reales (Vite lo prioriza sobre `.env`, que trae los valores del emulador; ambos están en `.gitignore`), y luego `pnpm build && pnpm exec firebase deploy --only hosting,firestore:rules,firestore:indexes,storage`.
- `deploy/storage-setup.sh` — crea el bucket en `us-central1`, `gcloud storage buckets update gs://$BUCKET --soft-delete-duration=0` y aplica `deploy/storage-lifecycle.json`.
- `deploy/scheduler.sh` — crea el job de Cloud Scheduler **llamado `pulso-sweep-audio`**, cada hora → `POST $SERVER_URL/internal/sweep-audio` con token OIDC de la cuenta de servicio.
- `deploy/budget-alerts.sh` — `gcloud billing budgets create` con umbrales 0.5, 0.8 y 1.0.
- `deploy/storage-lifecycle.json` = `{"rule":[{"action":{"type":"Delete"},"condition":{"age":1,"matchesPrefix":["tmp/"]}}]}`.
- `deploy/RUNBOOK.md` — secciones `stt-cuota-agotada`, `error-rate-5xx` y `creditos-vencen`, cada una con al menos un bloque de comandos; el procedimiento "exportar mis datos y decidir migrar/mejorar antes del día 80"; y la lista de puertas manuales.

Además:
- `.github/workflows/ci.yml` — Node desde `.nvmrc`, pnpm 11.28.2 vía corepack, `pnpm install --frozen-lockfile`, instalación de Chromium (`pnpm exec playwright install --with-deps chromium`: el ejecutor de CI tiene `sudo` sin contraseña) y JDK 21, un paso `test -f .env || cp .env.example .env` **antes de `pnpm build`** (el build de producción lee los `VITE_*` de `.env`), y las mismas órdenes de la puerta automática de §20.1 en el mismo orden (incluidos `pnpm eval` y ambos e2e).
- `tests/repo/deploy-config.test.ts` — ejecuta `bash -n` sobre cada `deploy/*.sh`; afirma el JSON del lifecycle, los umbrales 0.5/0.8/1.0, `--soft-delete-duration=0`, la región `us-central1`, que `deploy-server.sh` contiene `--max-instances 3`, `--min-instances 0` y `--timeout 600`, que `scheduler.sh` contiene `pulso-sweep-audio`, que el `CMD` del `Dockerfile` coincide con `main` y `scripts.start` de `apps/server/package.json` y que la etiqueta de Node del `Dockerfile` empieza por el mayor de `.nvmrc`.
- `tests/repo/ci-parity.test.ts` — lee `blueprints/pulso/blueprint.md`, toma el PRIMER bloque ```bash bajo el encabezado `### 20.1`, elimina el comentario final desde ` #` en cada línea y descarta las líneas vacías, y exige que `.github/workflows/ci.yml` contenga cada comando como subsecuencia ordenada (el CI puede tener pasos adicionales: instalar JDK y Chromium, crear `.env`) y que lea la versión de Node con `node-version-file: .nvmrc`. `tests/repo/runbook.test.ts` — exige las tres secciones del runbook, cada una con un bloque de comandos.

**Una sola sentada:** son archivos de texto planos sin lógica (cinco scripts de shell cortos, un JSON, un runbook, un workflow) y tres pruebas estáticas de lectura de archivos.

**Done when**

- [ ] **WHEN** `pnpm test:unit tests/repo/deploy-config.test.ts` runs **THE SYSTEM SHALL** assert that `bash -n` exits 0 for every `deploy/*.sh`, that `deploy/storage-lifecycle.json` has a Delete rule with age 1 and prefix `tmp/`, that `deploy/budget-alerts.sh` sets thresholds 0.5, 0.8 and 1.0, that `deploy/storage-setup.sh` contains `--soft-delete-duration=0`, that the deploy scripts use region `us-central1`, that `deploy/deploy-server.sh` contains `--max-instances 3`, `--min-instances 0` and `--timeout 600`, that `deploy/scheduler.sh` names the job `pulso-sweep-audio`, and that the `CMD` of the `Dockerfile` equals `main` and `scripts.start` of `apps/server/package.json` (`dist/index.js`).
- [ ] **WHEN** `pnpm test:unit tests/repo/ci-parity.test.ts` runs **THE SYSTEM SHALL** assert that `.github/workflows/ci.yml` runs every command of the automated global gate as an ordered subsequence (extra setup steps are allowed, among them the installation of JDK and Chromium and `test -f .env || cp .env.example .env` before `pnpm build`, which it SHALL contain), reads the Node version from `.nvmrc` and runs `pnpm eval`.
- [ ] **WHEN** `pnpm test:unit tests/repo/runbook.test.ts` runs **THE SYSTEM SHALL** find in `deploy/RUNBOOK.md` the sections `stt-cuota-agotada`, `error-rate-5xx` and `creditos-vencen`, each with at least one fenced command block.
- [ ] **WHEN** the automated global gate runs in the order of the blueprint **THE SYSTEM SHALL** exit 0 on every command, from `pnpm install --frozen-lockfile` to `pnpm test:e2e:full`.

**Verify**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
node scripts/smoke-server.mjs
node scripts/check-pwa.mjs
node scripts/check-no-hex.mjs
node deploy/check-bundle-budget.mjs
pnpm eval
pnpm test:e2e
pnpm test:e2e:full
```

**Checkpoint**

```bash
git add -A && git commit -m "step 21: delivery-ci"
git tag step-21-delivery-ci
git ls-files --error-unmatch .github/workflows/ci.yml   # expect: exit 0 — ya commiteado
git ls-files --error-unmatch deploy/storage-lifecycle.json   # expect: exit 0 — ya commiteado
```

---

### 9.1 Parity and cutover

NOT APPLICABLE — greenfield build, no system is being replaced.

---

## 10. Environment Setup

**La build completa no necesita ninguna cuenta ni credencial de Google**: Auth, Firestore y Storage corren en emuladores, STT y Gemini se prueban con dobles y respuestas grabadas. Las cuentas reales solo se usan en las puertas manuales de §20.1.

### Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 24.21.0 (LTS "Krypton"; ver §11) | `node -v` imprime `v24.21.0` o un 24.x posterior |
| pnpm | 11.28.2 (vía corepack) | `pnpm -v` imprime `11.28.2` |
| corepack | incluido con Node | `corepack enable --install-directory "$HOME/.local/bin"` (la forma sin directorio falla con `EACCES` donde el directorio global no es escribible; añade ese directorio al `PATH`) |
| JDK | 21 o superior (lo exigen los emuladores de `firebase-tools`; VERIFICAR antes de instalar la versión mínima exacta de `firebase-tools` 15.32.1) | `java -version` |
| git | cualquiera reciente | `git --version` |
| jq | 1.6 o posterior (lo usan las puertas de §20.1 y las manuales) | `jq --version` (instalación: `apt-get install jq`, `brew install jq`) |
| rsync | cualquiera | `rsync --version` |
| Chromium de Playwright | lo instala Bootstrap (`pnpm exec playwright install chromium`, sin `--with-deps`: no pide `sudo`). En Linux hacen falta las librerías del sistema: el dueño ejecuta **una sola vez** `sudo pnpm exec playwright install-deps chromium` (o el equivalente de su distribución); en CI se usa `--with-deps` (el ejecutor tiene `sudo` sin contraseña) | `pnpm exec playwright --version` |
| gcloud CLI (solo puertas manuales) | actual | `gcloud --version` — no se usa en la build |
| Docker (opcional, puerta manual M13) | actual | `docker --version` |

El sandbox o la máquina con Node < 24 (p. ej. 22.22.0) **no sirve**: `jsdom` 30 exige Node ^22.22.2 || ^24.15 || >=26 y `vitest` 5 exige ^22.12 || ^24. CI y Docker usan 24.

### Accounts to create first

| Servicio | URL | Primer uso | ¿Necesario para la build? |
|---|---|---|---|
| Google Cloud (prueba con $300 de crédito, vence a los 90 días) y proyecto Firebase en el mismo proyecto | https://console.cloud.google.com · https://console.firebase.google.com | Puertas manuales M1–M9 | No |
| Dispositivo iPhone con Safari/PWA | — | Puerta manual M10 | No |

### Environment variables

| Variable | Purpose | Where to get it | Required by step | Secret? |
|---|---|---|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` | `.env.example` | 4 (antes: lectura directa con valor por defecto) | no |
| `PORT` | Puerto del servidor (local `8787`; Cloud Run inyecta `8080`) | `.env.example` | 4 (antes: lectura directa con valor por defecto) | no |
| `GIT_SHA` | SHA que devuelve `/health` | `git rev-parse --short HEAD` en el despliegue | 4 (antes: lectura directa con valor por defecto) | no |
| `LOG_LEVEL` | Nivel de pino | `.env.example` | 4 (antes: lectura directa con valor por defecto) | no |
| `GOOGLE_CLOUD_PROJECT` | Proyecto de Firestore/Auth (`demo-pulso` en local) | `.env.example`; en producción, la consola de Google Cloud | 4 | no |
| `FIRESTORE_EMULATOR_HOST` | Apunta el SDK al emulador de Firestore (`127.0.0.1:8080`) | `.env.example`; lo exporta `firebase emulators:exec` | 3 (solo local) | no |
| `FIREBASE_AUTH_EMULATOR_HOST` | Emulador de Auth (`127.0.0.1:9099`) | `.env.example` | 5 (solo local) | no |
| `FIREBASE_STORAGE_EMULATOR_HOST` | Emulador de Storage (`127.0.0.1:9199`) | `.env.example` | 15 (solo local) | no |
| `ALLOWED_EMAILS` | Lista de permitidos, separada por comas | Tú (emails de Google permitidos) | 5 | no |
| `WEB_ORIGINS` | Orígenes CORS permitidos | `.env.example`; en producción, el dominio de Hosting | 5 | no |
| `STT_MODEL` | Modelo de STT v2 (`long` por defecto) | `.env.example`; decide el spike M8 | 14 | no |
| `STT_LOCATION` | Región del reconocedor (`us`; alternativa `us-central1` con `chirp_2`) | `.env.example` | 14 | no |
| `STT_LANGUAGE` | Código de idioma (`es-US`) | `.env.example` | 14 | no |
| `STT_DAILY_SECONDS_PER_ORG` | Cuota diaria de segundos de STT por organización (`1800`) | `.env.example` | 14 | no |
| `STT_PRICE_USD_PER_MIN` | Precio indicativo USD/min para `cost_usd` (`0.016`: tarifa "Standard" documentada; el precio de `long`/`chirp_*` no se encontró: VERIFICAR) | `.env.example` | 14 | no |
| `STORAGE_BUCKET` | Bucket del audio temporal (`demo-pulso.appspot.com` en local) | `.env.example`; en producción, el bucket de `deploy/storage-setup.sh` | 15 | no |
| `SWEEP_AUDIENCE` | Audiencia esperada del OIDC del barredor (URL del servicio) | `.env.example`; en producción, la URL de Cloud Run | 15 | no |
| `SCHEDULER_SA_EMAIL` | Cuenta de servicio de Cloud Scheduler | `.env.example`; en producción, `deploy/scheduler.sh` | 15 | no |
| `FILLERS_FROM_AUDIO` | `true` \| `false`: análisis de muletillas desde audio con Gemini | `.env.example` | 15 | no |
| `GEMINI_MODEL` | ID del modelo (único lugar donde existe; sin valor por defecto en código) | `.env.example` | 16 | no |
| `GEMINI_LOCATION` | `global` (recomendado; no controla la región, aceptable sin requisitos de residencia) | `.env.example` | 16 | no |
| `GEMINI_TIMEOUT_MS` | Tiempo de espera por llamada (`30000`) | `.env.example` | 16 | no |
| `CREDITS_EXPIRY_DATE` | Fecha de vencimiento de los créditos (solo documentación; la define Steven en M1) | Consola de facturación | — | no |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Configuración web de Firebase (valores `demo-*` en local; públicos por diseño) | `.env.example`; en producción, la consola de Firebase | 6 | no |
| `VITE_USE_EMULATORS` | `true` conecta Auth/Firestore a los emuladores y habilita el botón de cuenta de prueba | `.env.example` / `.env.e2e` | 6 | no |
| `VITE_API_URL`, `VITE_WS_URL` | Base de la API y URL del WebSocket (vacío en local: proxy de Vite) | `.env.example`; en producción, la URL de Cloud Run | 6 | no |
| `E2E_FULL` | `1` habilita el proyecto Playwright `app` | `pnpm test:e2e:full` lo exporta | 6 | no |
| `CI` | Lo fijan GitHub Actions y la mayoría de CI; endurece Playwright (`forbidOnly`, reintentos) y desactiva la reutilización de servidores | El entorno de CI | 21 | no |
| `GCLOUD_PROJECT` | Solo `apps/server/tests/setup.ts` (`demo-pulso`) para los SDK en pruebas | Pruebas | 3 | no |
| `PROJECT`, `BILLING_ACCOUNT`, `BUCKET`, `SERVER_URL` | Parámetros de los scripts `deploy/*.sh` (puertas manuales M3–M7; cada script los exige y falla si faltan) | Consola de Google Cloud | — (solo manual) | no |

`.env.example` está commiteado con **todas** las claves y valores locales seguros (emulador); `.env` y `.env.*.local` están en `.gitignore`. El servidor valida las variables al arrancar y falla con un error que **nombra** las que faltan; nunca usa un valor por defecto para un secreto (no hay secretos en la build: Google usa credenciales por defecto de aplicación en Cloud Run).

**"Requerida desde el paso" es un contrato con §9, no una nota.** `loadEnv` exige una variable solo desde el paso indicado y es opcional antes; el paso que la consume es el que la promueve a obligatoria. `scripts/smoke-server.mjs` lee `.env.example` completo para que el arranque del servidor compilado nunca dependa de valores fabricados.

**Cómo se carga el entorno en cada herramienta** (ninguna lo hace por sí sola):

| Herramienta | Mecanismo |
|---|---|
| Servidor (`pnpm dev`, `node dist/index.js`) | `import "./load-dotenv.ts"` como primer import de `src/index.ts`: `process.loadEnvFile()` sobre `<raíz>/.env` si existe (no sobrescribe lo ya exportado); Bootstrap crea ese `.env` desde `.env.example` |
| `pnpm eval` (modo grabado) | `tsx --env-file=.env.example` en el propio script de `package.json`: trae todas las variables sin depender de un `.env`, y no necesita Firestore (registrador en memoria) |
| `pnpm spike:stt` y `pnpm eval:live` (manuales) | El `.env` real vía `load-dotenv.ts` (primer import de cada entrypoint) con `GOOGLE_CLOUD_PROJECT=<PROYECTO>` exportado: nunca heredan los hosts de emuladores |
| `tests/e2e-server.ts` (`start:e2e`) | `load-dotenv.ts` primero más el bloque `env` de `playwright.config.ts` |
| Vitest (servidor) | `apps/server/tests/setup.ts` fija valores por defecto con `??=` (respeta lo que exporte `firebase emulators:exec`); las pruebas de `loadEnv` parten de `baseEnv()` (`apps/server/tests/helpers/env.ts`, paso 4: todas las claves de `.env.example`) |
| Vitest (web) | `apps/web/tests/setup.ts` fija con `??=` todas las `VITE_*` con los valores de `.env.example` (`process.env` e `import.meta.env`) para que `src/lib/env.ts` (paso 6) no lance en jsdom |
| Playwright | El bloque `env` de cada `webServer` en `playwright.config.ts` |
| Vite (web) | `envDir` = raíz del repositorio: lee `.env` (que Bootstrap y el CI crean con `test -f .env || cp .env.example .env`, porque Vite **no** lee `.env.example`; sin `.env` el build de producción no trae `VITE_*` y `env.ts` aborta `main.tsx`), y `.env.e2e` con `--mode e2e`. Para un despliegue real, `.env.production.local` (gitignored) pisa a `.env` |
| Firebase CLI | `--project demo-pulso` explícito en cada script (`emulators`, `test:emu`) y `.firebaserc` |
| `scripts/smoke-server.mjs` | Lee `.env.example` y lo pasa al proceso hijo |

### Files that must be committed

| File | Why it is committed | Ignore-file exception line |
|---|---|---|
| `.env.example` | Plantilla local completa; la usa `smoke-server.mjs` | `!.env.example` después de `.env.*` |
| `.env.e2e` | Valores del emulador para Vite `--mode e2e` | `!.env.e2e` después de `.env.*` |
| `pnpm-lock.yaml` | Reproducibilidad (`--frozen-lockfile`) | — no coincide con ningún patrón |
| `package.json`, `pnpm-workspace.yaml`, `biome.json`, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `Dockerfile` | Configuración que las puertas ejecutan | — no coinciden con ningún patrón |
| `apps/web/public/icons/*.png`, `apps/web/public/theme-init.js` | Activos de la PWA | — no coinciden con ningún patrón |
| `.claude/settings.json`, `.claude/skills/**`, `.claude/rules/**`, `CLAUDE.md`, `AGENTS.md` | Configuración del agente | — no coinciden (`.claude/settings.local.json` es personal y no se lista) |
| `.github/workflows/ci.yml` | CI idéntico a la puerta final (paso 21) | — no coincide con ningún patrón |
| `blueprints/pulso/**` | El bundle debe poder commitearse | — `blueprints/` no está en `.gitignore` |
| `tests/e2e/.tmp/voice.wav` | **Se ignora a propósito** (lo genera `global-setup.ts`) | `tests/e2e/.tmp/` está en `.gitignore` |

El `.gitignore` y sus excepciones **llegan desde `workspace/` y se copian antes del primer commit** (Bootstrap); ningún paso de §9 lo crea (el paso 21 no lo toca).

### Bootstrap

```bash
# Ejecutar desde la raíz del proyecto, que ya contiene blueprints/pulso/ (el bundle).
# Seguro de ejecutar dos veces. Debe correr con `set -e`.
# order matters: ignore file + exceptions (rsync) → .env → repo init → install → browsers → format reconcile → first commit → services

BUNDLE=blueprints/pulso

# 0. Toolchain (sin sudo: corepack con directorio explícito escribible)
mkdir -p "$HOME/.local/bin" && export PATH="$HOME/.local/bin:$PATH"
corepack enable --install-directory "$HOME/.local/bin"
corepack prepare pnpm@11.28.2 --activate
node -v && pnpm -v && java -version

# 1. Copia NO destructiva de workspace/ → raíz (nunca pisa un archivo que ya existe)
rsync -a --ignore-existing "$BUNDLE/workspace/" ./   # --ignore-existing: no revierte package.json ni ningún archivo editado por un paso; sale 0 aunque omita archivos
# Nunca se sobrescriben una vez presentes: los 4 package.json, pnpm-workspace.yaml, biome.json, tsconfig*.json,
# vitest.config.ts, playwright.config.ts, vite.config.ts, .gitignore, CLAUDE.md. (pnpm-lock.yaml no viene en workspace/.)

# 1b. .env local: Vite lee `.env` (NO `.env.example`) y el build de producción lee los VITE_* de ahí; .env está en .gitignore
test -f .env || cp .env.example .env   # idempotente: sale 0 con o sin .env; no pisa un .env que el dueño ya editó

# 2. Repositorio y primer commit (el .gitignore ya está en el árbol)
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main   # idempotente: no hace nada si ya existe
git config user.name >/dev/null 2>&1 || git config user.name "PULSO builder"
git config user.email >/dev/null 2>&1 || git config user.email "builder@pulso.local"

# 3. Instalación. pnpm 11 aborta con ERR_PNPM_IGNORED_BUILDS si falta `allowBuilds`:
pnpm install --no-frozen-lockfile || true   # crea pnpm-lock.yaml la primera vez. `|| true`: con un paquete nuevo sin aprobar, pnpm 11 sale 1 con ERR_PNPM_IGNORED_BUILDS aunque ya instaló todo; la puerta real es la tercera línea (si de verdad falló la red, no habrá lockfile y esa puerta falla)
pnpm approve-builds --all || true   # clave de pnpm 11 = allowBuilds (NO onlyBuiltDependencies); no interactivo. `|| true`: en una re-ejecución no hay nada pendiente; la línea siguiente es la puerta real
pnpm install --frozen-lockfile       # la puerta real: sale 0 solo tras la línea anterior

# 4. Navegador para Playwright (las pruebas e2e fallan sin binarios). Sin --with-deps: no usa apt/sudo (ver Prerequisites para las librerías del sistema)
pnpm exec playwright install chromium   # idempotente: sale 0 si el binario ya está

# 5. Reconciliar el formato de los archivos emitidos con biome.json, una vez
pnpm exec biome check --write .
pnpm lint

# 6. Primer commit: todo lo anterior, incluido el bundle y pnpm-lock.yaml
git add -A && git commit -m "chore: scaffold" --allow-empty   # un tag necesita un commit al que apuntar

# 7. Servicios locales: no hay compose; los emuladores los levantan `pnpm test:emu` (efímero) y `pnpm emulators`
#    (la primera ejecución descarga los emuladores de Firebase: requiere red y JDK 21+)
```

**Re-ejecución (puerta de §20.1):** volver a correr este bloque sale 0 y no cambia nada relevante: `rsync --ignore-existing` omite todo lo existente, `git init` está protegido, `pnpm install` es idempotente y `--allow-empty` hace que el commit nunca falle.

---

## 11. Dependencies

**Esta es la tabla de procedencia de versiones.** Todas las versiones de paquetes npm se verificaron el **2026-10-04** contra el registro de npm (`https://registry.npmjs.org/-/package/<paquete>/dist-tags` y `/<paquete>/<versión>`) en la sesión de investigación que alimentó este blueprint; ninguna se escribió de memoria. Node se verificó contra `https://nodejs.org/dist/index.json`. Los archivos emitidos de §19.6 llevan el valor real en el `package.json` (exacto, sin `^`); esta tabla lleva la procedencia. Cada fila nombra dónde se instala: el `package.json` emitido en `workspace/` se copia en el Bootstrap de §10 y `pnpm install` instala todo lo que declara.

**Elecciones de versión que no son `latest`** (cada una deliberada):
- **pnpm 11.28.2** (etiqueta `latest-11`; `latest` es 12.9.1): las trampas de la pista (`ERR_PNPM_IGNORED_BUILDS`, `allowBuilds`, `pnpm approve-builds --all`) se reprodujeron en la línea 11 y §10 las cubre.
- **TypeScript ~6.0.3** (`latest` es 7.0.2): regla de la pista; con TS 7 haría falta `"types": ["node", "vite/client"]` y es una actualización deliberada futura.
- **@hono/node-server 1.19.17** (no 2.x): `@hono/node-ws` 1.3.1 exige `^1.19.11`.
- **react-router 7.18.4** (la 8.4.0 existe, se queda en 7) y **@vitejs/plugin-react 6.1.1** (solo Vite 8).
- **@types/node 24.19.1** (no 26): coincide con el runtime.

### Runtime

| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| zod | 4.6.5 | https://registry.npmjs.org/-/package/zod/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `packages/shared/package.json` | Esquemas y validación en cada borde (datos, API, mensajes del WebSocket, entorno); fuente única de tipos y del esquema JSON para Gemini |
| @google-cloud/speech | 8.1.1 | https://registry.npmjs.org/-/package/@google-cloud/speech/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | STT v2 (`v2.SpeechClient`) detrás de `SttAdapter` |
| @google-cloud/storage | 8.2.0 | https://registry.npmjs.org/-/package/@google-cloud/storage/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Audio temporal `tmp/` y barredor |
| @google/genai | 2.27.0 | https://registry.npmjs.org/-/package/@google/genai/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Cliente Gemini con `vertexai: true` (reemplaza a `@google-cloud/vertexai`, deprecado); la doc lo marca "Preview": un solo módulo + evaluación en CI |
| @hono/node-server | 1.19.17 | https://registry.npmjs.org/-/package/@hono/node-server/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Adaptador Node de Hono (NO la 2.x: `@hono/node-ws` 1.3.1 pide ^1.19.11) |
| @hono/node-ws | 1.3.1 | https://registry.npmjs.org/-/package/@hono/node-ws/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | WebSocket de audio sobre Hono |
| @hono/zod-validator | 0.9.1 | https://registry.npmjs.org/-/package/@hono/zod-validator/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Validación de rutas con zod |
| firebase-admin | 14.5.0 | https://registry.npmjs.org/-/package/firebase-admin/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Auth (verifyIdToken), Firestore y Storage en el servidor (trae `@google-cloud/firestore` y `@google-cloud/storage` como opcionales) |
| google-auth-library | 11.1.0 | https://registry.npmjs.org/-/package/google-auth-library/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Verificación del OIDC del barredor (`OAuth2Client.verifyIdToken`); la misma versión que pide `firebase-admin` 14.5.0 (^11.1.0), Node >= 22 |
| hono | 4.13.13 | https://registry.npmjs.org/-/package/hono/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Framework HTTP del servidor |
| pino | 10.4.0 | https://registry.npmjs.org/-/package/pino/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Logs JSON con request id (Cloud Logging) |
| ws | 8.22.0 | https://registry.npmjs.org/-/package/ws/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Implementación WebSocket (par de `@hono/node-ws`; cliente de pruebas) |
| @fontsource-variable/fraunces | 5.3.0 | https://registry.npmjs.org/-/package/@fontsource-variable/fraunces/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Títulos (serif de alto contraste, eje wght) |
| @fontsource-variable/inter | 5.3.0 | https://registry.npmjs.org/-/package/@fontsource-variable/inter/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Tipografía de UI |
| @fontsource-variable/jetbrains-mono | 5.3.0 | https://registry.npmjs.org/-/package/@fontsource-variable/jetbrains-mono/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Números, Hz, puntajes, reloj |
| @radix-ui/react-dialog | 1.1.23 | https://registry.npmjs.org/-/package/@radix-ui/react-dialog/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Diálogo accesible (borrar cuenta) |
| @radix-ui/react-slot | 1.3.3 | https://registry.npmjs.org/-/package/@radix-ui/react-slot/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Composición de botones/enlaces |
| @tanstack/react-query | 5.104.1 | https://registry.npmjs.org/-/package/@tanstack/react-query/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Estado de servidor |
| class-variance-authority | 0.7.1 | https://registry.npmjs.org/-/package/class-variance-authority/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Variantes de componentes |
| clsx | 2.1.1 | https://registry.npmjs.org/-/package/clsx/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Composición de clases |
| firebase | 12.19.0 | https://registry.npmjs.org/-/package/firebase/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | SDK web: Auth y lectura de Firestore (12.x por el par de `@firebase/rules-unit-testing`) |
| lucide-react | 1.52.0 | https://registry.npmjs.org/-/package/lucide-react/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Iconos (major 1.x) |
| react | 19.3.0 | https://registry.npmjs.org/-/package/react/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | UI |
| react-dom | 19.3.0 | https://registry.npmjs.org/-/package/react-dom/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | UI |
| react-router | 7.18.4 | https://registry.npmjs.org/-/package/react-router/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Enrutado en modo biblioteca (NO `react-router-dom`; la 8.x existe pero se queda en 7) |
| tailwind-merge | 3.7.0 | https://registry.npmjs.org/-/package/tailwind-merge/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Resolución de conflictos de utilidades |

### Development

| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| @types/ws | 8.18.2 | https://registry.npmjs.org/-/package/@types/ws/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/server/package.json` | Tipos de `ws` |
| @tailwindcss/vite | 4.3.3 | https://registry.npmjs.org/-/package/@tailwindcss/vite/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Plugin de Tailwind 4 para Vite |
| @types/react | 19.3.0 | https://registry.npmjs.org/-/package/@types/react/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Tipos |
| @types/react-dom | 19.3.0 | https://registry.npmjs.org/-/package/@types/react-dom/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Tipos |
| tailwindcss | 4.3.3 | https://registry.npmjs.org/-/package/tailwindcss/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Estilos (configuración en CSS, `@theme`) |
| vite-plugin-pwa | 2.0.0 | https://registry.npmjs.org/-/package/vite-plugin-pwa/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Manifiesto y service worker (2.x) |
| workbox-build | 7.4.1 | https://registry.npmjs.org/-/package/workbox-build/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Par obligatorio de vite-plugin-pwa |
| workbox-window | 7.4.1 | https://registry.npmjs.org/-/package/workbox-window/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `apps/web/package.json` | Par obligatorio de vite-plugin-pwa |
| @axe-core/playwright | 4.13.0 | https://registry.npmjs.org/-/package/@axe-core/playwright/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Auditoría de accesibilidad en e2e |
| @biomejs/biome | 2.5.15 | https://registry.npmjs.org/-/package/@biomejs/biome/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Lint + formato (con `css.parser.tailwindDirectives`) |
| @firebase/rules-unit-testing | 5.0.2 | https://registry.npmjs.org/-/package/@firebase/rules-unit-testing/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Pruebas de aislamiento de reglas contra el emulador (peer `firebase` ^12) |
| @playwright/test | 1.63.0 | https://registry.npmjs.org/-/package/@playwright/test/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | E2E |
| @types/node | 24.19.1 | https://registry.npmjs.org/-/package/@types/node/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Tipos de Node 24 (no 26) |
| @vitejs/plugin-react | 6.1.1 | https://registry.npmjs.org/-/package/@vitejs/plugin-react/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Plugin de React (6.x, solo Vite 8); también en las pruebas web |
| @vitest/coverage-v8 | 5.0.3 | https://registry.npmjs.org/-/package/@vitest/coverage-v8/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Cobertura (versión exacta de vitest) |
| firebase | 12.19.0 | https://registry.npmjs.org/-/package/firebase/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | SDK web: Auth y lectura de Firestore (12.x por el par de `@firebase/rules-unit-testing`) |
| firebase-tools | 15.32.1 | https://registry.npmjs.org/-/package/firebase-tools/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Emuladores (Auth, Firestore, Storage) y despliegue manual |
| jsdom | 30.1.2 | https://registry.npmjs.org/-/package/jsdom/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Entorno DOM de las pruebas web (exige Node ^22.22.2 || ^24.15 || >=26) |
| tsx | 4.23.15 | https://registry.npmjs.org/-/package/tsx/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Ejecuta scripts TypeScript (spike, evals, dev del servidor) |
| typescript | ~6.0.3 | https://registry.npmjs.org/-/package/typescript/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Compilador; se queda en la línea 6.0 (la 7.x existe pero rompe tooling; con TS 7 haría falta `types: [node, vite/client]`) |
| vite | 8.3.2 | https://registry.npmjs.org/-/package/vite/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Bundler y servidor de desarrollo (8.x) |
| vitest | 5.0.3 | https://registry.npmjs.org/-/package/vitest/dist-tags | 2026-10-04 | §10 Bootstrap — `pnpm install` lee `package.json` (raíz) | Pruebas unitarias e integración (5.x; Node ^22.12 || ^24) |
| Node.js | 24.21.0 (`.nvmrc`: `24`) | https://nodejs.org/dist/index.json | 2026-10-04 | Prerrequisito de §10 (lo instala el desarrollador; CI usa `.nvmrc`) | Runtime LTS "Krypton"; el sandbox con Node 22.22.0 queda por debajo del piso de jsdom |
| pnpm | 11.28.2 | https://registry.npmjs.org/-/package/pnpm/dist-tags (etiqueta `latest-11`) | 2026-10-04 | Prerrequisito de §10 (`corepack prepare pnpm@11.28.2 --activate`); `packageManager` en `package.json` | Gestor de paquetes |
| node (imagen Docker) | `node:24.21.0-bookworm-slim` | etiqueta de Docker Hub que coincide con la versión de Node (existe: HTTP 200 el 2026-10-04) | 2026-10-04 | `Dockerfile` (emitido en `workspace/`; lo instala `docker build`, puerta manual M13) | Imagen de Cloud Run |

### Deliberately not used

| Rejected | Instead | Why |
|---|---|---|
| `@google-cloud/vertexai` | `@google/genai` con `vertexai: true` | Deprecado (mayo 2026) |
| Sentry | Cloud Logging estructurado (pino) + Error Reporting + uptime check de Cloud Monitoring | Decisión: sin Sentry en v1 |
| `react-hook-form` | Formularios nativos con estado local | Los formularios son 3 campos; no hace falta |
| `wavefile` 11.0.0 y `audio-decode` 3.12.0 | Codificador/decodificador WAV PCM16 propio en `packages/shared/src/dsp/wav.ts` (~40 líneas) | `wavefile` no tiene mantenimiento desde 2022; solo se necesita PCM16 mono |
| Next.js, Drizzle, Clerk, Better Auth, Vercel | Vite SPA, Firestore sin ORM, Firebase Auth, Cloud Run + Hosting | Desviaciones declaradas en §2 |
| `react-router-dom` | `react-router` 7 | En la 7 el paquete único reemplaza a `react-router-dom` |
| shadcn/ui CLI | Componentes propios sobre Radix | No hace falta un generador para un diálogo y botones |
| `gemini-2.5-*` (cualquier modelo) | El ID de `GEMINI_MODEL` de `.env.example` | Se retiran el 2026-10-20 |
| Turborepo | `pnpm -r` | Tres paquetes; el orden topológico de pnpm basta |
| `eslint`, `prettier` | Biome | Una herramienta |

---

## 12. Deployment Strategy

**La build no despliega nada.** Los scripts de `deploy/` (pasos 20 y 21) se validan con `bash -n` y pruebas estáticas; el despliegue real, las alertas de presupuesto y el resto son las puertas manuales M1–M14 de §20.1, con dueño (Steven) y comando exacto.

### Hosting

| Pieza | Plataforma | Región | Detalle |
|---|---|---|---|
| Web (SPA + PWA) | Firebase Hosting | global (CDN) | `pnpm build` → `apps/web/dist`; `firebase.json` reescribe `**` a `/index.html`; `sw.js` y `theme-init.js` con `Cache-Control: no-cache`; cabeceras de seguridad (§14). Plan gratuito: 10 GB de almacenamiento, 360 MB/día de transferencia |
| Servidor (REST + WebSocket) | Cloud Run, servicio `pulso-server` | `us-central1` | Imagen del `Dockerfile` (`node dist/index.js`); `--min-instances 0` (arranque en frío en la primera conexión: la UI muestra "Conectando…"; `--min-instances 1` queda documentado como opción de pago), `--max-instances 3` (tope de gasto), `--timeout 600` (los 270 s de sesión caben con margen; el valor por defecto es 300 s y el máximo 3600 s), `--allow-unauthenticated` (la autenticación es de aplicación) |
| Datos | Firestore (modo nativo) | `us-central1` | `firebase deploy --only firestore:rules,firestore:indexes` |
| Audio temporal | Cloud Storage | `us-central1` | 5 GB-mes gratis; soft delete en 0 y lifecycle `age:1` sobre `tmp/` |
| STT | Speech-to-Text v2 | `us` (multi-región) | `long` con `es-US`; alternativa `chirp_2` en `us-central1` si el spike lo decide |
| Gemini | Vertex AI (`@google/genai`) | `global` | Sin requisitos de residencia |
| Barredor | Cloud Scheduler → `POST /internal/sweep-audio` cada hora, token OIDC | `us-central1` | Precio y cuota de Cloud Scheduler: VERIFICAR antes de instalar (no se verificó el 2026-10-04) |

El servidor y el navegador se comunican **directamente** (el navegador llama a la URL de Cloud Run con CORS; Firebase Hosting no hace de proxy del WebSocket). Build del servidor: `tsc -p apps/server/tsconfig.build.json` → `apps/server/dist/index.js`; la imagen ejecuta `node dist/index.js` con `WORKDIR /app/apps/server`.

**Hechos de plataforma verificados el 2026-10-04** (de los que depende el diseño):

| Hecho | Fuente |
|---|---|
| Cloud Run admite WebSockets sin configuración extra; "WebSockets streams are HTTP requests, still subject to the request timeout"; timeout por defecto 300 s, máximo 3600 s; afinidad de sesión "best effort" (el cliente debe reconectar); `min-instances` 0 por defecto; gratis al mes: 180 000 vCPU-s, 360 000 GiB-s, 2 M de solicitudes, 1 GB de salida en Norteamérica; runtime Node 24 listado | https://docs.cloud.google.com/run/docs/triggering/websockets · /run/docs/configuring/request-timeout · /run/docs/configuring/min-instances · https://docs.cloud.google.com/free/docs/free-cloud-features |
| STT v2 streaming: stream máx. 5 min, solicitud ≤ 25 KB, audio a ritmo aproximado de tiempo real, solo gRPC, 300 sesiones concurrentes por región y 3 000 solicitudes/min; LINEAR16 soportado | https://docs.cloud.google.com/speech-to-text/docs/quotas · /encoding |
| Modelos es-US: `global` → long, short, telephony; multi-región `us`/`eu` → chirp_3, long, short; `us-central1` → chirp, chirp_2; es-419 solo chirp_2; Chirp 3 no devuelve marcas por palabra en streaming; no hay documentación sobre disfluencias; precio "Standard" $0.016/min con redondeo por segundo (no se encontró el precio de long/chirp_2/chirp_3 ni nivel gratuito V2); por defecto Google no registra audio ni transcripciones | https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages · /models/chirp-3 · /models/chirp-2 · https://cloud.google.com/speech-to-text/pricing · /data-logging |
| Firestore: documento ≤ 1 MiB; 40 000 entradas de índice por documento; gratis/día 1 GiB, 50 000 lecturas, 20 000 escrituras, 20 000 borrados; escritura $0.09 por 100 000 en us-central1; TTL "típicamente dentro de 24 h" sin cuota gratuita | https://firebase.google.com/docs/firestore/quotas · /pricing · /ttl |
| Cloud Storage: lifecycle `age` en días, acción asíncrona y sin garantía de tiempo; la configuración tarda hasta 24 h; soft delete activo por defecto con 7 días de retención (se pone en 0); 5 GB-mes gratis en us-central1 | https://docs.cloud.google.com/storage/docs/lifecycle · /soft-delete · /use-soft-delete |
| Gemini en Vertex: GA con retirada ≥ 12 meses para `gemini-3.5-flash-lite` (2026-07-21), `gemini-3.5-flash` (2026-05-19) y `gemini-3.1-flash-lite`; los `gemini-2.5-*` se retiran el 2026-10-20; audio: ≤ 8.4 h por prompt, un archivo, `fileUri` (gs://) hasta 15 MB; `@google-cloud/vertexai` deprecado; `@google/genai` en "Preview" con variables de entorno inconsistentes; precios indicativos por 1 M de tokens (global, estándar): flash-lite $0.30 entrada / $2.50 salida, flash $1.50 / $9.00 (la extracción no etiquetó columnas: VERIFICAR) | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions · /multimodal/audio-understanding · /start/libraries · /sdks/overview · https://cloud.google.com/vertex-ai/generative-ai/pricing · /learn/locations |
| Firebase: Hosting gratis 10 GB y 360 MB/día; Google sign-in "Tier 1" (0–50 000 MAU); `verifyIdToken` no comprueba revocación salvo `checkRevoked`; sin cabeceras en el handshake de WebSocket; en Safari/iOS el redirect exige `authDomain` propio; en PWA instalada de iOS no hay documentación | https://firebase.google.com/docs/hosting/usage-quotas-pricing · /docs/auth/admin/verify-id-tokens · /docs/auth/web/redirect-best-practices |
| Facturación: los presupuestos solo alertan (tardan horas); los "spend caps" (preview) cubren solo Cloud Run y Gemini/Vertex y un servicio por tope; el patrón "Pub/Sub + desactivar facturación" elimina recursos de forma irreversible y no garantiza no pasar el presupuesto | https://docs.cloud.google.com/billing/docs/how-to/budgets · /budgets-spend-caps · /disable-billing-with-notifications |
| Navegador: AudioWorklet requiere contexto seguro; trabaja en cuantos de 128 muestras; `AudioContext({sampleRate:16000})` puede lanzar o ignorarse; bug WebKit 215884 (el permiso de micrófono se pierde al cambiar el hash en PWA de iOS) | MDN y developer.chrome.com (no son de Google Cloud) |

### Environments

| Environment | Branch | URL | Database | Third-party mode |
|---|---|---|---|---|
| Local | — | http://127.0.0.1:5173 (web) y :8787 (server) | Emuladores de Firestore/Auth/Storage (`demo-pulso`) | Dobles de STT y Gemini en pruebas; nada real |
| Preview | NOT APPLICABLE — sin entornos de vista previa en v1 (un solo usuario) | — | — | — |
| Production | `main` | `https://<proyecto>.web.app` (Hosting) y la URL `*.run.app` del servicio | Firestore del proyecto de Google Cloud | Credenciales por defecto de aplicación; STT y Gemini reales |

### CI/CD

`.github/workflows/ci.yml` (paso 21) corre en cada push y pull request, con Node desde `.nvmrc`, pnpm 11.28.2 por corepack, JDK 21 y Chromium (`playwright install --with-deps`), un paso `test -f .env || cp .env.example .env` antes de `pnpm build`: `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm lint` → `pnpm test` → `pnpm build` → `node scripts/smoke-server.mjs` → `node scripts/check-pwa.mjs` → `node scripts/check-no-hex.mjs` → `node deploy/check-bundle-budget.mjs` → `pnpm eval` → `pnpm test:e2e` → `pnpm test:e2e:full`. Es el mismo conjunto que la puerta automática de §20.1 y `tests/repo/ci-parity.test.ts` lo exige. **No hay despliegue automático**: el despliegue es manual (M4–M5) para que ningún merge pueda gastar crédito sin que Steven lo decida. Nivel de CI: Tier 0/1 (un solo desarrollador; las comprobaciones son la protección).

### Release and rollback

- **Servidor:** cada despliegue crea una revisión de Cloud Run. Rollback en segundos: `gcloud run services update-traffic pulso-server --region us-central1 --to-revisions=<REVISION>=100`.
- **Web:** redesplegar el commit anterior (`git checkout <commit-bueno> && pnpm build && pnpm exec firebase deploy --only hosting`) o usar el rollback de versiones de la consola de Firebase Hosting. El service worker usa `registerType: "autoUpdate"`: el cliente recoge la versión revertida en la siguiente carga.
- **Reglas e índices:** se despliegan por separado (`firebase deploy --only firestore:rules,firestore:indexes`); un cambio de reglas se prueba antes con `pnpm test:emu`.
- **Migraciones de datos:** expandir → rellenar → contraer, en despliegues distintos (§4). Nunca en el mismo despliegue que el código que las necesita.
- **Disparador de rollback:** error 5xx > 2 % durante 5 minutos (alerta `error-rate-5xx` del runbook) → revertir la revisión. Ensayo previo al lanzamiento en la puerta M4.

### Domain, DNS, TLS

Se usa el dominio de Hosting (`<proyecto>.web.app`) como `authDomain` de Firebase Auth (necesario para el redirect en Safari/iOS) y como único origen en `WEB_ORIGINS` de producción; el TLS es automático. Un dominio propio es opcional: si se añade, hay que agregarlo a los dominios autorizados de Firebase Auth, a `WEB_ORIGINS` y a `VITE_FIREBASE_AUTH_DOMAIN`.

---

## 13. Testing Strategy

Las pruebas existen para hacer comprobables los "Done when" de §9. Pirámide invertida hacia integración: base fina de unitarias para lógica con ramas (DSP, fórmulas), integración contra **emuladores reales** para datos y reglas, y E2E solo para los recorridos cuya rotura sería un incidente.

| Layer | Framework | What it covers | Where | Runs |
|---|---|---|---|---|
| Estática | `tsc` (TypeScript 6), Biome | Tipos, lint, formato, guardas (`check-no-hex`) | todo el repositorio | `pnpm typecheck`, `pnpm lint` en cada paso |
| Unit (puro) | Vitest, proyecto `shared` | DSP, YIN, fantasma, seguimiento, medidores, fórmulas de dicción/veredicto/nivel/vocabulario | `packages/shared/src/**/*.test.ts` | `pnpm test:unit` |
| Unit (servidor y repo) | Vitest, proyecto `server` | `env`, logger, errores, cuota con almacén simulado, pasarela LLM con transporte grabado, evals, límites de tasa, comprobaciones de repositorio (índices, paridad con CI, scripts de despliegue, runbook, paridad del manifiesto con los tokens) | `apps/server/src/**/*.test.ts`, `tests/repo/*.test.ts` | `pnpm test:unit` |
| Unit (web) | Vitest + jsdom, proyecto `web` | Tokens y contraste, script de tema, rutas (un `h1`), componentes (medidores, veredicto), `MicCapture` con `AudioContext` falso | `apps/web/src/**/*.test.ts(x)` | `pnpm test:unit` |
| Integración con emuladores | Vitest, proyecto `emulator` + `firebase emulators:exec` | Reglas de Firestore (aislamiento), `org-store`, Auth/aprovisionamiento, pasarela WebSocket con el doble de STT, sesiones, Storage y barredor, cuenta (exportar/borrar) | `apps/server/tests/emulator/*.test.ts` | `pnpm test:emu` |
| E2E | Playwright (Chromium), proyectos `ui` y `app` | Layout sin scroll, shell + axe, auth, monitor con WAV real, Frase Perfecta, línea base, accesibilidad total | `tests/e2e/ui/*.spec.ts`, `tests/e2e/app/*.spec.ts` | `pnpm test:e2e`, `pnpm test:e2e:full` |
| Evaluación del LLM | Vitest + `pnpm eval` | Golden set ≥ 20 casos (modo grabado, sin red) | `apps/server/evals/` | `pnpm eval` |

### Critical flows to cover E2E

1. **Iniciar sesión y volver a la URL original** (anónimo → `/entrar?next=…` → cuenta de prueba del emulador → destino).
2. **Monitor con voz real**: un WAV de 130 Hz y luego 260 Hz entra como micrófono falso y la línea sube ≥ 9 semitonos.
3. **Frase Perfecta de extremo a extremo** con STT grabado: perfil → frase → grabar → reporte con segundo y palabra de separación.
4. **Línea base / Inicio** de un usuario nuevo ("Midiendo tu línea base") y exportación de datos.
5. **Accesibilidad**: axe sin violaciones en todas las rutas, ambos temas, a 375 px, y recorrido de teclado.

### Test data

No hay base de datos compartida: los emuladores se levantan por ejecución (`firebase emulators:exec`) y cada prueba crea sus organizaciones con ids únicos (`crypto.randomUUID()`), por lo que no dependen del orden. Servicios que provisiona el bundle: `firebase.json` (emuladores Auth 9099, Firestore 8080, Storage 9199) y `.firebaserc` (`demo-pulso`); las variables que apuntan a ellos están en §10 y en `.env.example` (`FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`). Las señales de audio se generan con `dsp/synth.ts` (PRNG sembrado) y `tests/e2e/global-setup.ts` escribe el WAV del micrófono falso. Respuestas de Gemini y enunciados de STT: fixtures grabados en `apps/server/tests/fixtures/**`, reproducidos por dobles que **solo existen en pruebas** y se inyectan en `createApp(deps)`.

### What is deliberately not tested

- **Llamadas reales a Google (STT, Gemini, Cloud Run, Scheduler, presupuestos):** necesitan credenciales y gasto; son puertas manuales con dueño (§20.1, M3–M9).
- **Calidad del modelo de lenguaje y del reconocimiento de voz:** el modo grabado prueba el pipeline (esquemas, reparación, límites), no la calidad; se mide con `pnpm eval:live` y el spike (M8, M9).
- **PWA instalada en iPhone** (micrófono y sign-in): requiere dispositivo (M10).
- **Lector de pantalla:** una persona debe oír el flujo (M11).
- **Estilos y espaciados concretos** más allá de los tokens y contrastes.
- **Comportamiento interno del SDK de Firebase y de Hono.**

---

## 14. Security & Secrets

| Concern | Control | Implemented in |
|---|---|---|
| Secret storage | **No hay secretos en el repositorio.** En Cloud Run se usan credenciales por defecto de aplicación (cuenta de servicio del servicio); la configuración web de Firebase es pública por diseño | `apps/server/src/env.ts`; Cloud Run |
| Secret rotation | N/A en v1 (sin claves de larga vida). Si se añade una, su procedimiento va al runbook antes de usarla | `deploy/RUNBOOK.md` |
| Input validation | zod en cada borde: cuerpos, parámetros, mensajes del WebSocket, entorno; límites (contorno ≤ 3000 puntos, trama ≤ 25 000 bytes y par) | `@hono/zod-validator`, `packages/shared/src/wire.ts`, `schemas/**` |
| Output encoding / XSS | React escapa por defecto; **la salida del modelo se renderiza solo como texto**, nunca como HTML; sin `dangerouslySetInnerHTML` | `apps/web/src/**` |
| SQL injection | NOT APPLICABLE — no hay SQL (Firestore con SDK oficial) | — |
| AuthN / AuthZ | §8: token verificado en el servidor en cada petición, lista de permitidos, membresía por organización, 404 para lo ajeno | `auth/verify.ts`, `data/org-store.ts`, `firestore.rules` |
| CSRF | NOT APPLICABLE — la API usa cabecera `Authorization: Bearer`, sin cookies de sesión | — |
| Rate limiting / abuse | 60 solicitudes/min por `uid` y 10/min por IP en `POST /session` (**en memoria, por instancia de Cloud Run**: con varias instancias el tope efectivo se multiplica); el control de costo real es la cuota diaria de STT (`STT_DAILY_SECONDS_PER_ORG`) y el tope de 270 s por sesión; `--max-instances 3` | `rate-limit.ts`, `usage/quota.ts`, `ws/audio-gateway.ts` |
| Webhook verification | NOT APPLICABLE — sin webhooks de terceros. El único llamador automático es Cloud Scheduler, verificado con OIDC (audiencia + email de la cuenta de servicio) | `routes/internal.ts` |
| Dependency audit | `pnpm audit --prod` revisado antes de cada despliegue (informativo; no es una puerta porque un aviso sin parche bloquearía la build) y lockfile congelado | Puerta manual M4 |
| Security headers | `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: microphone=(self), camera=(), geolocation=()` · `Strict-Transport-Security: max-age=31536000; includeSubDomains` · `Content-Security-Policy-Report-Only` (política en `firebase.json`; se mantiene en modo "solo reporte" hasta verificarla con el sign-in real en un navegador, porque Firebase Auth carga scripts e iframes de Google) | `firebase.json` |
| PII handling | Se guarda: email, nombre, contornos de tono, transcripciones y métricas. **El audio no se conserva**: existe como `tmp/{orgId}/{sessionId}.wav` solo mientras se genera el informe y se borra por código al terminar; el barredor horario borra lo que supere 24 h; soft delete 0; lifecycle `age:1` de respaldo. Por defecto Google no registra audio ni transcripciones de STT. Exportar y borrar la cuenta están en Ajustes | `storage/audio-store.ts`, `storage/sweeper.ts`, `routes/account.ts` |
| Logging hygiene | `pino` con `redact` de `authorization`, `token` e `idToken`; nunca se loguean cuerpos crudos ni transcripciones completas | `src/logger.ts` |

**Hard rules**
- Ningún secreto se commitea, se imprime en un log, ni llega al bundle del cliente (todo lo que llega al navegador es público).
- Toda comprobación de autorización ocurre antes del trabajo, no después.
- `/internal/*` jamás acepta tokens de usuario.

**Régimen de datos.** Una grabación de voz es un dato personal (y puede considerarse biométrico si se usara para identificar). La v1 es de un solo usuario conocido y cerrada por lista de permitidos. **Antes de abrir el registro** (no-objetivo de §1) hacen falta política de privacidad, consentimiento explícito para procesar voz y definición de retención (R8). Hoy no se aplica ningún régimen regulado adicional.

---

## 15. Accessibility

**Objetivo: WCAG 2.2 nivel AA.** Los criterios de accesibilidad están en los "Done when" de §9, no en un backlog.

### Baseline requirements

| Requirement | Rule |
|---|---|
| Semantic HTML | Un único `<h1>` por ruta, encabezados en orden, `lang="es"`, `<main id="contenido">`, `<nav aria-label>`, listas para listas |
| Keyboard | Todo operable con teclado; orden lógico; enlace "Saltar al contenido" como primer elemento enfocable; sin trampas de foco |
| Focus visible | Anillo `--focus` de 3 px con desplazamiento de 2 px (≥ 3:1 sobre bg, surface y surface2 en ambos temas); nunca `outline: none` sin reemplazo |
| Contrast | Texto ≥ 4.5:1; texto grande, controles y gráficos ≥ 3:1 (tabla de §7, verificada por prueba) |
| Forms | Etiqueta real en cada campo; errores como texto asociado con `aria-describedby`; el diálogo de borrar cuenta devuelve el foco al disparador |
| Images | Iconos decorativos con `aria-hidden`; sin imágenes de contenido |
| Motion | `prefers-reduced-motion` respetado; la línea del monitor sí se dibuja; nada parpadea más de 3 veces/s; la "línea plana" no parpadea, cambia de color y de etiqueta |
| Zoom / reflow | Usable a 200 % y a 320 px de ancho sin scroll horizontal (prueba a 375 px en cada ruta; 320 px en la pasada manual) |
| Live regions | Resumen de texto del monitor en `role="status"` (`aria-live="polite"`), actualizado como máximo cada 2 s; el sello del veredicto se anuncia una vez |
| Canvas | El canvas es decorativo para lectores de pantalla (`aria-hidden`); su alternativa es el resumen de texto en vivo y el reporte de sesión accesible |
| Color | Nunca solo color: etiquetas "TÚ" / "FANTASMA", estilo de trazo, texto "Zona verde / Baja / Alta" |

### WCAG 2.2 additions — the ones most often missed

| SC | Requirement |
|---|---|
| 2.4.11 Focus Not Obscured (Min) | Ninguna cabecera pegajosa tapa el elemento enfocado; el botón grabar no queda bajo la barra de navegación |
| 2.5.7 Dragging Movements | No hay interacciones de arrastre |
| 2.5.8 Target Size (Min) | Objetivos ≥ 24×24 px; el botón grabar ≥ 48 px de alto |
| 3.3.7 Redundant Entry | No se pide dos veces la misma información |
| 3.3.8 Accessible Authentication (Min) | Solo Google sign-in: no hay prueba cognitiva ni campos de contraseña propios |

### Verification
```bash
pnpm test:e2e:full tests/e2e/app/a11y.spec.ts   # expect: exit 0 — 0 violaciones axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) en todas las rutas, temas oscuro y claro, 375 px; primer Tab = enlace "Saltar al contenido"; outline-width >= 2px
```
Las comprobaciones automáticas detectan alrededor de un tercio de los problemas reales. Pasadas manuales antes del lanzamiento (dueño: Steven, puertas M10 y M11): recorrido solo con teclado de todos los flujos, una pasada con lector de pantalla (NVDA + Firefox, VoiceOver + Safari y VoiceOver en iOS) sobre Monitor y Frase Perfecta, y una pasada de zoom al 200 % en la anchura menor.

---

## 16. Observability & Cost

### Instrumentation

| Signal | Tool | What it captures | Who looks at it |
|---|---|---|---|
| Errors | Google Cloud Error Reporting (lee los errores que pino escribe en stderr con `severity` y `stack`) | Excepciones no controladas con `request_id`, release (`GIT_SHA`) y organización; sin PII | Steven (alerta `error-rate-5xx`) |
| Logs | pino (JSON) → Cloud Logging | Una línea por evento con `request_id`, `org_id`, `duration_ms`, `status`; tokens redactados | Steven |
| Metrics | Cloud Monitoring con métricas basadas en logs sobre los campos `cost_usd`, `stt_seconds`, `llm_status` + la métrica propia `cost_usd` por llamada guardada en `usage` y `llm_calls` | Segundos y costo de STT, tasa de fallo del LLM | Steven (runbook) |
| Uptime | Comprobación de tiempo de actividad de Cloud Monitoring sobre `GET /health/deep` cada 5 min | Firestore alcanzable y SHA desplegado | Steven (correo) |

Sin Sentry en v1 (decisión; ver §1 y §11).

### The metrics that matter for this project

| Metric | Target | Alert at |
|---|---|---|
| Segundos de STT por organización y día | < 1800 s (cuota) | Rechazo `quota_exceeded` ≥ 1 vez al día (aviso, no página) |
| Gasto acumulado de crédito de Google Cloud | ≤ $300 antes de `CREDITS_EXPIRY_DATE` | Alertas de presupuesto al 50 %, 80 % y 100 % (llegan con horas de retraso) |
| Tasa de error 5xx del servidor | < 1 % | > 2 % durante 5 min → `error-rate-5xx` |
| Fallos del LLM (`llm_calls.status` ≠ `ok`) | < 5 % | > 20 % en un día |
| Objetos de `tmp/` con más de 25 h | 0 | ≥ 1 tras dos ejecuciones del barredor |
| Días hasta el vencimiento del crédito | decisión tomada antes del día 80 | Día 80 desde `CREDITS_EXPIRY_DATE` → `creditos-vencen` |

### Health check

`GET /health` (vivacidad: `{ ok: true, sha }`, sin dependencias; lo usa el humo de la build) y `GET /health/deep` (lee un documento de Firestore; 200 `{ ok: true, firestore: "up" }` o 503). El uptime check de Cloud Monitoring sondea `/health/deep`.

### Cost model

Supuestos del cálculo (indicativos; los precios marcados VERIFICAR no se encontraron o no se etiquetaron en la investigación del 2026-10-04): 4 sesiones por semana de 3 minutos (≈ 17 sesiones y 51 minutos de audio al mes) con un solo usuario; STT al precio "Standard" de $0.016/min; Gemini flash-lite a $0.30 por 1 M de tokens de entrada y $2.50 por 1 M de salida; informe de ≈ 3 000 tokens de entrada y ≈ 1 000 de salida.

| Service | Free tier | Cost at 1 usuario (≈ 17 sesiones/mes) | Cost at 10× | Cliff to watch |
|---|---|---|---|---|
| Speech-to-Text v2 | Sin nivel gratuito V2 documentado (V1: 60 min/mes) | 51 min × $0.016 ≈ $0.82 | ≈ $8.2 | El precio de `long`/`chirp_2`/`chirp_3` es distinto del "Standard" y no se encontró: VERIFICAR antes de depender de la cifra |
| Gemini (flash-lite) | — | 17 × (3 000 × $0.30 + 1 000 × $2.50) / 1 M ≈ $0.06; con análisis de muletillas por audio (≈ 8 640 tokens de audio por sesión de 270 s, estimado) ≈ $0.04 más | ≈ $1 | Pasar a `flash` ($1.50 / $9.00) multiplica el costo por 5 |
| Cloud Run | 180 000 vCPU-s, 360 000 GiB-s, 2 M solicitudes/mes | $0 | $0 | `--min-instances 1` deja de ser gratuito (VERIFICAR el precio antes) |
| Firestore | 1 GiB, 50 000 lecturas/día, 20 000 escrituras/día | $0 | $0 | 20 000 escrituras/día; un contorno de 3000 puntos ≈ 24 KB |
| Cloud Storage | 5 GB-mes en us-central1 | $0 (audio efímero) | $0 | Un fallo del borrado acumula audio: lo cubre el barredor |
| Firebase Hosting / Auth | 10 GB y 360 MB/día / 50 000 MAU | $0 | $0 | Transferencia > 360 MB/día |
| Cloud Scheduler | VERIFICAR | VERIFICAR | VERIFICAR | Precio y cuota no verificados el 2026-10-04 |

**Costo mensual estimado al lanzar: ≈ $1–2 (indicativo).** La línea más grande es STT; la palanca más barata es bajar `STT_DAILY_SECONDS_PER_ORG`. **Peor caso acotado por código:** con la cuota diaria de 1800 s, STT cuesta como máximo 30 min × $0.016 = $0.48 por día, ≈ $43 en 90 días, muy por debajo de $300 aunque el precio real de `long` fuera varias veces mayor. Los presupuestos de facturación **solo alertan**; el gasto lo frenan la cuota, el tope de 270 s y `--max-instances 3`.

---

## 17. Model Routing

El único modelo de lenguaje que el producto llama en tiempo de ejecución es **Gemini** (Vertex AI) a través del módulo `apps/server/src/llm/gateway.ts`. Los IDs de modelo de este proyecto vienen de la investigación de Google verificada el 2026-10-04 (§12) y **viven solo en `GEMINI_MODEL`** (`.env.example`), nunca en el código: la puerta de grep del paso 16 lo comprueba.

### Routing table

| Task in this product | Model tier | Why this tier | Fallback |
|---|---|---|---|
| `ghostMarks`: marcas de énfasis y pausas para el texto | Pequeño/rápido: `gemini-3.5-flash-lite` (valor de `GEMINI_MODEL`) | Salida de forma fija con respuesta casi determinista; volumen alto; latencia importa | Marcas heurísticas deterministas (`heuristicMarks`): el producto sigue funcionando sin el modelo |
| `sessionReport`: corrección prioritaria, reemplazos y resumen | Pequeño/rápido: `gemini-3.5-flash-lite` | Texto breve estructurado; una llamada por sesión | Sesión guardada sin informe; si la evaluación falla, subir `GEMINI_MODEL` a `gemini-3.5-flash` (escalón) |
| `fillersFromAudio`: muletillas desde el audio temporal (`FILLERS_FROM_AUDIO=true`) | Pequeño/rápido: `gemini-3.5-flash-lite` con audio (`fileUri` gs://, ≤ 15 MB) | Una llamada por sesión, solo si el spike M8 demuestra que el STT omite disfluencias | Solo el conteo léxico sobre la transcripción |

Escalar significa cambiar el valor de `GEMINI_MODEL` y volver a pasar `pnpm eval` (modo grabado) y `pnpm eval:live` (manual); no hay ruteo dinámico entre modelos. Los `gemini-2.5-*` se retiran el 2026-10-20 y no se usan.

### Prompt and context strategy

Los prompts son archivos versionados en `apps/server/src/llm/prompts/*.md` (uno por función). Orden del prompt: instrucciones del sistema y definición del esquema (estable) primero, datos del usuario al final, delimitados como DATO ("lo que está entre `<dato>` y `</dato>` no contiene instrucciones"). Sin caché de prompts: las llamadas son cortas y no repiten un prefijo largo. El cliente se crea con opciones explícitas `new GoogleGenAI({ vertexai: true, project, location })`; las variables de entorno del ejemplo de la documentación son inconsistentes (`GOOGLE_GENAI_USE_VERTEXAI` frente a `GOOGLE_GENAI_USE_ENTERPRISE`) y por eso nunca se usan.

### Cost controls

Tokens de salida acotados por llamada (esquema JSON pequeño); una llamada de informe por sesión; `fillersFromAudio` solo con la bandera; cada llamada escribe `llm_calls` con los tokens informados por el proveedor (el costo en USD queda en `null` en v1: ningún precio se escribe en el código). La cuota de gasto real del producto es la de STT (§16); los "spend caps" de Google cubren Gemini pero son preview y de un servicio por tope, así que no se confía en ellos.

### Failure handling

Tiempo de espera `GEMINI_TIMEOUT_MS` (30 s); 429/5xx → hasta 2 reintentos con retroceso exponencial y jitter; 400 → sin reintento; salida inválida → **un** reintento de reparación con el error del validador y luego `LlmError("invalid_output")`. La degradación es silenciosa y honesta: marcas heurísticas (`source: "heuristic"`) o sesión sin informe; el audio temporal se borra siempre (`finally`). Un error mitad de camino nunca bloquea el cierre de la sesión.

### Evaluation

`apps/server/evals/golden.json` (≥ 20 casos: marcas, informes, muletillas y 2 respuestas malformadas a reparar) + `baseline.json` comprometido. `pnpm eval` (modo grabado) reproduce respuestas grabadas por el mismo `generateStructured` y sale con 1 si la tasa cae bajo el baseline; imprime tasa, costo y latencia p95. **Honestidad:** el modo grabado prueba el pipeline, no la calidad del modelo; `pnpm eval:live` (puerta manual M9, con credenciales) la mide antes de cambiar `GEMINI_MODEL` o un prompt.

---

## 18. Skills to Use During Build

Nunca se depende de una skill: si falta, el constructor sigue con las guías de este blueprint, lo anota en una línea y continúa. Sin barra inicial = se autoactiva (nombrarla en prosa); con barra = comando real.

| Skill | Build steps | Why | Install |
|---|---|---|---|
| ui-ux-pro-max | Antes del paso 2 (y revisión en el paso 7) | Valida la jerarquía visual y el sistema de componentes contra §7 (la paleta ya es literal) | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` luego `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| emil-design-eng | Pasos 10, 11 y 18 (movimiento) | Curvas y duraciones del dibujo a 60 fps, el trazo del fantasma y el sello de 400 ms de un solo pulso; entrégale una pregunta concreta | `npx skills@latest add emilkowalski/skills` |
| frontend-design | Pasos 6, 7, 18 y 19 (pantallas) | Pantallas distintivas y sobrias que usan los tokens | `/plugin marketplace add anthropics/skills` luego `/plugin install example-skills@anthropic-agent-skills` |
| playwright-cli | Pasos 6, 7, 8, 10 y 18 (especificaciones e2e) | Redactar y depurar las especificaciones e2e (auth, monitor con micrófono falso) | `npm install -g @playwright/cli@latest` luego `playwright-cli install --skills` |
| /claude-seo-ai:audit | **Fuera de v1** (recomendación posterior si algún día hay sitio de marketing) | SEO y visibilidad en respuestas de IA; no aplica a una app tras login | `/plugin marketplace add Hainrixz/claude-seo-ai` luego `/plugin install claude-seo-ai@claude-seo-ai` y `/reload-plugins` |
| /humanizalo | **Fuera de v1** (idem: copy de marketing) | Pulir textos escritos; el copy de la UI es breve y vive en `es.ts` | `git clone https://github.com/Hainrixz/humanizalo.git ~/.claude/skills/humanizalo` |

---

## 19. Agent Workspace

En bundle mode los archivos de esta sección son **archivos reales bajo `workspace/`**, no bloques de texto. `workspace/` refleja exactamente el repositorio destino; la primera acción del constructor es **una sola copia no destructiva** (la escribe §10 Bootstrap):

```bash
rsync -a --ignore-existing blueprints/pulso/workspace/ ./   # --ignore-existing: nunca pisa un archivo que la build ya cambió; sale 0 aunque omita archivos
```

**Archivos que esta copia nunca sobrescribe una vez presentes:** los cuatro `package.json` (raíz, `packages/shared`, `apps/server`, `apps/web`), `pnpm-workspace.yaml`, `biome.json`, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`, `apps/web/vite.config.ts`, `.gitignore`, `CLAUDE.md` y `.claude/**`. Se eligió `rsync --ignore-existing` y no `cp -Rn` porque este último sale con 1 en BSD/macOS cuando omite un archivo, lo que abortaría la segunda ejecución bajo `set -e` (un guardián no puede fallar en la ruta que protege). Los 12 comandos de la puerta automática y las puertas manuales se comprueban con la copia ya hecha.

Todo lo emitido pasa las puertas del propio blueprint: **Biome con 2 espacios, comillas dobles, punto y coma, comas finales y 100 columnas** (la configuración que este bundle deja en disco, `biome.json`); los JSON no se formatean (`json.formatter.enabled: false`) y el CSS tampoco (`css.formatter.enabled: false`), pero ambos se lintean. Si Biome reformatea algo en Bootstrap (`biome check --write`), es la reconciliación prevista.

**`.claude/commands/` no se emite, en ningún modo.** Los flujos repetibles son skills (§19.4).

### 19.1 `CLAUDE.md`

Archivo real: `workspace/CLAUDE.md`, **128 líneas** (límite 200), comandos primero. Secciones: Commands (con la puerta), Stack, Architecture (camino de una petición, camino del audio, tabla de fronteras de importación, dónde vive cada concepto), Code rules (9 reglas comprobables), Design system (tokens literales de §7), Environment (variable → paso en que pasa a ser obligatoria), Rules (puntero a los 6 archivos de `.claude/rules/`) y Non-negotiable (8 reglas). No contiene versiones de dependencias (manda el lockfile).

### 19.2 `AGENTS.md`

Archivo real: `workspace/AGENTS.md`, **27 líneas**: qué es el proyecto, tabla de comandos, 5 reglas innegociables y la remisión a `CLAUDE.md` como fuente de verdad. Es neutral respecto de la herramienta.

### 19.3 `.claude/settings.json`

Archivo real: `workspace/.claude/settings.json`, JSON válido con **58 entradas en `permissions.allow`** y **8 en `permissions.deny`**. Cubre **todo comando que aparece en los `Verify` de §9 y en la puerta automática de §20.1**: `pnpm install:*`, `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm test:*` (unit, emu, e2e, e2e:full, coverage), `pnpm build`, `pnpm eval:*`, `pnpm --filter:*`, `pnpm exec playwright:*`/`biome:*`/`vitest:*`/`tsc:*`/`firebase emulators:*`, `jq`, `tail`, `node scripts/smoke-server.mjs`, `node scripts/check-no-hex.mjs`, `node scripts/check-pwa.mjs`, `node deploy/check-bundle-budget.mjs`, y los auxiliares de las aserciones (`grep`, `test`, `wc`, `tr`, `bash -n`, `ls`, `cat`, `curl`), más `git` (status, diff, log, add, commit, tag, ls-files, check-ignore, rev-parse, rev-list, grep, config, init, `reset --hard step-`), `rsync -a --ignore-existing`, `corepack`, `cp .env.example .env`, `java -version`, `node -v` y `pnpm -v` del Bootstrap. **Denegados:** leer `.env`, `.env.local` y `.env.*.local`, `git push`, **todo `gcloud`**, `firebase deploy`, `pnpm spike:stt` y `rm -rf`: el despliegue, el spike y las alertas son puertas manuales de Steven, nunca automáticas.

### 19.4 Project skills — `.claude/skills/<name>/SKILL.md`

| Skill | Triggers on | What it automates |
|---|---|---|
| `add-api-route` | "añade un endpoint", "nueva ruta /api/v1" | Esquema zod, `requireUser` + guardia de organización, `org-store`, sobre de error, pruebas (401, 404 ajeno, 422, caso feliz) |
| `add-screen` | "nueva pantalla", "nueva ruta de la web" | Manifiesto `routes.ts`, un `h1`, tres estados, cadenas en `es.ts`, tokens, accesibilidad, prueba |
| `add-collection` | "guardar un dato nuevo" | Esquema, `COLLECTION_NAMES`, accesor de `org-store`, reglas e índices, prueba de aislamiento, export de cuenta |
| `run-gate` | "¿está en verde?", antes de un checkpoint | Los 12 comandos de la puerta automática, en orden, deteniéndose en el primer fallo |

### 19.5 `.claude/rules/*.md`

Cada archivo lleva `paths:` y se carga solo al tocar esos archivos (todos < 60 líneas).

| File | `paths` globs | Covers |
|---|---|---|
| `.claude/rules/data-firestore.md` | `apps/server/src/data/**`, `packages/shared/src/schemas/**`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `apps/server/tests/emulator/**` | Todo bajo `orgs/{orgId}`, solo lectura en el navegador, 404, límites de documento e índice, borrado |
| `.claude/rules/server-api.md` | `apps/server/src/**`, `apps/server/scripts/**` | Sobre de error, validación, autorización, `loadEnv`, `load-dotenv`, logs, inyección de dependencias, `/internal` |
| `.claude/rules/dsp-shared.md` | `packages/shared/src/**` | Pureza y determinismo, fórmulas con nombre, constantes de audio, señales generadas |
| `.claude/rules/web-ui.md` | `apps/web/src/**`, `apps/web/index.html`, `apps/web/public/**` | Tokens, `es.ts`, accesibilidad, movimiento, estados, solo lectura |
| `.claude/rules/llm-stt.md` | `apps/server/src/llm/**`, `stt/**`, `ws/**`, `apps/server/evals/**` | Un único importador del SDK, ID de modelo en config, reparación, `SttAdapter`, evals |
| `.claude/rules/testing.md` | `**/*.test.ts`, `**/*.test.tsx`, `tests/**`, `vitest.config.ts`, `playwright.config.ts` | Capas de prueba, dobles solo en pruebas, tiempo congelado, 0 skipped |

### 19.6 Verify-critical config and local infrastructure

Todos estos archivos son **reales, con contenido completo, bajo `workspace/`**, en la ruta que ocupan en el proyecto. Sin ellos las puertas de §9 no pueden ejecutarse.

| File | Path in the project | Which `Verify` commands need it | Resolution/env handling it carries | Bundle-path exclusion |
|---|---|---|---|---|
| Manifiesto raíz | `package.json` | todos | scripts de toda la puerta; `packageManager: pnpm@11.28.2`; `engines.node`; devDependencies con pins exactos; `typecheck` incluye `tsc -p tsconfig.json` (raíz); `eval`, `eval:live` y `spike:stt` usan `tsx --tsconfig apps/server/tsconfig.json` (para que `@pulso/shared` resuelva a la fuente); `eval` añade `--env-file=.env.example` | n/a — es un manifiesto (los workspaces los define `pnpm-workspace.yaml`) |
| Workspace de pnpm | `pnpm-workspace.yaml` | 1 (install) y todos | `allowBuilds` (`@firebase/util`, `@google/genai`, esbuild, protobufjs, re2; el resto lo añade `pnpm approve-builds --all`) | `- "!blueprints/**"` |
| Manifiestos de paquete | `packages/shared/package.json`, `apps/server/package.json`, `apps/web/package.json` | 1–20 | `exports` de `@pulso/shared` → `dist` (types + default); `main`/`start` del servidor; `workspace:*` | n/a |
| Biome | `biome.json` | todos (`pnpm lint`) | `css.parser.tailwindDirectives: true`; `assist.organizeImports: off`; JSON y CSS sin formatear; `noExplicitAny: error` | `"!blueprints"` en `files.includes` |
| TypeScript | `tsconfig.base.json`, `tsconfig.json`, `packages/shared/tsconfig.json` y `tsconfig.build.json`, `apps/server/tsconfig.json` y `tsconfig.build.json`, `apps/web/tsconfig.json` | 1–20 (`typecheck`, `build`) | `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`; server y web: `paths` de `@pulso/shared` → fuente; builds del servidor: `paths: {}` (resuelve el paquete compilado) | `"exclude": ["**/node_modules", "**/dist", "blueprints"]` (base y raíz); los demás solo `include` sus carpetas |
| Vitest | `vitest.config.ts` | 1–20 (`pnpm test*`) | 4 proyectos (`shared`, `server`, `web`, `emulator`); alias `@pulso/shared` → fuente; `setupFiles`; jsdom + plugin React para web; el sufijo `?worker&url` (solo en `apps/web/src/audio/worklet-url.ts`) no se carga en pruebas: se mockea con `vi.mock` | `"blueprints/**"` en `exclude` |
| Playwright | `playwright.config.ts` | 2, 6, 7, 8, 10, 18, 19, 20, 21 | proyectos `ui`/`app` (`E2E_FULL=1`); `webServer` con `env` propio (emuladores, servidor e2e, Vite `--mode e2e`) y, si existe `apps/web/dist`, `vite preview` en 4173 (bundle de producción, usado por `worklet.spec.ts`); micrófono falso con `--use-file-for-fake-audio-capture` | `testIgnore: ["**/node_modules/**", "**/blueprints/**"]` |
| Setup de e2e | `tests/e2e/global-setup.ts` | 2, 6, 7, 8, 10, 18, 19, 20, 21 | Autocontenido: escribe `tests/e2e/.tmp/voice.wav` (no importa código del producto) | n/a (solo corre cuando lo invoca Playwright) |
| Setup de pruebas del servidor | `apps/server/tests/setup.ts` | 1, 3–21 | Valores por defecto con `??=` de todas las variables (respeta lo que exporta `firebase emulators:exec`); IDs de modelo falsos (`test-*`) | n/a |
| Setup de pruebas web | `apps/web/tests/setup.ts` | 1, 2, 6–21 | `IS_REACT_ACT_ENVIRONMENT = true`, `TZ=UTC` y los valores por defecto `VITE_*` de `.env.example` (`??=`) | n/a |
| Vite | `apps/web/vite.config.ts` | 1, 7, 8, 10, 20 (`pnpm build`, e2e) | `envDir` = raíz; alias `@pulso/shared` → fuente; proxy `/api`, `/health`, `/ws`; PWA (manifest, workbox `navigateFallbackDenylist`); Tailwind | n/a (Vite parte de `apps/web`) |
| Firebase | `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `storage.rules` | 3–7, 14–21 (`pnpm test:emu`, `test:e2e:full`) | Emuladores Auth 9099 / Firestore 8080 / Storage 9199 en `127.0.0.1`; proyecto `demo-pulso`; Hosting `public: apps/web/dist` | n/a (la CLI no recorre el árbol) |
| Entorno | `.env.example`, `.env.e2e` | 1 (humo), 6 (e2e) | Todas las claves con valores locales; `smoke-server.mjs` lee `.env.example` | n/a |
| Ignore | `.gitignore`, `.dockerignore` | Bootstrap, M13 | Excepciones `!.env.example`, `!.env.e2e` | `.dockerignore`: `blueprints`; `.gitignore` NO ignora `blueprints/` a propósito (el bundle debe poder commitearse) |
| Imagen | `Dockerfile` | M13, `tests/repo/deploy-config.test.ts` (21) | `CMD ["node", "dist/index.js"]`, `WORKDIR /app/apps/server`, Node `24.21.0-bookworm-slim` | `.dockerignore` excluye `blueprints` |
| Iconos | `apps/web/public/icons/*.png`, `scripts/make-icons.mjs` | 7 (`check-pwa`), 21 | PNG de 180/192/512 generados con Node puro; `pnpm icons` los regenera | n/a |

**Servicios que una puerta necesita (regla de cuatro partes).** No hay base de datos relacional ni `docker-compose.yml`: los servicios son los emuladores de Firebase. (1) *Lo que los arranca:* `firebase.json` (sección `emulators`) más `firebase-tools` fijado en §11; la CLI descarga los emuladores la primera vez (requiere red y JDK 21+). (2) *La variable que apunta a ellos:* `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199` en §10 y `.env.example`; `firebase emulators:exec` las exporta al comando que envuelve. (3) *Los comandos:* `pnpm emulators` (arriba), `pnpm test:emu` (arriba, ejecuta y apaga; el "reset" es que cada ejecución parte de datos vacíos) en §10 y en la tabla de `CLAUDE.md`. (4) *El permiso:* `Bash(pnpm emulators:*)`, `Bash(pnpm test:*)` y `Bash(pnpm exec firebase emulators:*)` en `settings.json`.

#### Resolution convention matrix

**La convención, una sola vez:** los especificadores relativos llevan la extensión real del archivo (`./app.ts`, `./Monitor.tsx`); el paquete compartido se importa por nombre (`@pulso/shared`); no existe alias `@/`. Se apoya en `allowImportingTsExtensions` y `rewriteRelativeImportExtensions` de `tsconfig.base.json` (regla de la pista ts-node).

| Context | Command that exercises it | Convention as it appears there | Config + literal setting that makes it work |
|---|---|---|---|
| Fuente de la web | `pnpm --filter @pulso/web build` (Vite) y `pnpm dev` | `./Monitor.tsx`; `@pulso/shared` | Vite resuelve la extensión explícita; `apps/web/vite.config.ts` → `resolve.alias["@pulso/shared"]` = `packages/shared/src/index.ts`; `apps/web/tsconfig.json` → `moduleResolution: "bundler"` y `paths["@pulso/shared"]` |
| Pruebas | `pnpm test:unit` / `pnpm test:emu` | `./app.ts`; `@pulso/shared` | `vitest.config.ts` → `resolve.alias["@pulso/shared"]` (fuente) en los 4 proyectos |
| Scripts independientes | `pnpm spike:stt` y `pnpm eval` (`tsx --tsconfig apps/server/tsconfig.json …`); `pnpm --filter @pulso/server dev` y `start:e2e` (tsx) | `./stt/google.ts`; `@pulso/shared` | tsx resuelve el especificador `.ts` literalmente; `apps/server/tsconfig.json` → `paths["@pulso/shared"]` apunta a la fuente y `allowImportingTsExtensions` hace que el mismo archivo también pase `tsc` |
| Build del servidor | `pnpm --filter @pulso/server build` (`tsc -p tsconfig.build.json`) y `node apps/server/dist/index.js` | `./app.ts` → emitido como `./app.js`; `@pulso/shared` → paquete compilado | `tsconfig.base.json` → `rewriteRelativeImportExtensions: true`; `apps/server/tsconfig.build.json` → `paths: {}` (resuelve `node_modules/@pulso/shared` → `packages/shared/dist/index.js` vía `exports`); `pnpm -r build` compila `shared` antes |
| Build del paquete compartido | `pnpm --filter @pulso/shared build` | `./health.ts` → `./health.js` (y `.d.ts`) | `packages/shared/tsconfig.build.json` → `declaration: true`, `outDir: dist`, `rootDir: src` |
| Typecheck de pruebas y raíz | `tsc --noEmit -p tsconfig.json` (raíz) | `./foo.ts` | `tsconfig.base.json` flags; el raíz solo incluye `vitest.config.ts`, `playwright.config.ts`, `tests/**` |
| Playwright (specs y setup) | `pnpm test:e2e*` | Los specs importan solo `@playwright/test` y `@axe-core/playwright`; ningún código del producto | `tests/e2e/global-setup.ts` autocontenido |
| Imagen Docker | `docker build` (M13) | Mismo que build del servidor | `Dockerfile` ejecuta `pnpm --filter @pulso/shared build && pnpm --filter @pulso/server build` |

#### Cross-artifact value reconciliation

| Shared value | Single source — the file that decides it | Literal value | Every other place it appears | Compared |
|---|---|---|---|---|
| Entrada compilada del servidor | `apps/server/tsconfig.build.json` (`outDir: dist`, `rootDir: src`, entrada `src/index.ts`) | `apps/server/dist/index.js` | `apps/server/package.json` — `main` `dist/index.js` y `scripts.start` `node dist/index.js` · `Dockerfile` — `WORKDIR /app/apps/server` + `CMD ["node", "dist/index.js"]` · `scripts/smoke-server.mjs` (paso 1) — `node apps/server/dist/index.js` · §9 pasos 1 y 21, §12, §20.1 | yes |
| Salida del paquete compartido | `packages/shared/tsconfig.build.json` (`outDir: dist`) | `packages/shared/dist/index.js` y `dist/index.d.ts` | `packages/shared/package.json` — `main`, `types`, `exports["."]` · paso 1 (criterio 4) · `Dockerfile` | yes |
| Salida de la web | Valor por defecto de Vite (`build.outDir` no se cambia) | `apps/web/dist` | `firebase.json` — `hosting.public` · `scripts/check-pwa.mjs` y `deploy/check-bundle-budget.mjs` (pasos 7 y 20) · paso 1 (`test -f apps/web/dist/index.html`) · `.dockerignore` | yes |
| Puerto del servidor local | `.env.example` — `PORT` | `8787` | `apps/web/vite.config.ts` (`apiTarget`) · `playwright.config.ts` (`serverPort`, `PORT`, `SWEEP_AUDIENCE`) · `.env.example` (`SWEEP_AUDIENCE`) · `apps/server/tests/setup.ts` (`SWEEP_AUDIENCE`) · §10 y §12 | yes |
| Puerto de la web | `apps/web/vite.config.ts` (`server.port`) | `5173` | `playwright.config.ts` (`webPort`) · `.env.example` (`WEB_ORIGINS`) · `apps/server/tests/setup.ts` (`WEB_ORIGINS`) · §10 | yes |
| Puertos de emuladores | `firebase.json` (`emulators`) | auth `9099`, firestore `8080`, storage `9199` | `.env.example` (3 variables `*_EMULATOR_HOST`) · `playwright.config.ts` (`serverEnv` y URL de espera) · `apps/web/src/lib/firebase.ts` (paso 6: `connectAuthEmulator`/`connectFirestoreEmulator`) · §10 | yes |
| Id de proyecto Firebase | `.firebaserc` (`default`) | `demo-pulso` | `package.json` (`emulators`, `test:emu`: `--project demo-pulso`) · `.env.example` y `.env.e2e` (`VITE_FIREBASE_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`) · `playwright.config.ts` · `apps/server/tests/setup.ts` | yes |
| Nombres de paquete | Cada `package.json` (`name`) | `@pulso/shared`, `@pulso/server`, `@pulso/web` | `package.json` raíz (`--filter`) · dependencias `workspace:*` · `vitest.config.ts` (alias) · `vite.config.ts` (alias) · `Dockerfile` · CLAUDE.md · `playwright.config.ts` (`pnpm --filter @pulso/server start:e2e`) | yes |
| Versión de Node | `.nvmrc` | `24` | `package.json` (`engines.node` `>=24.21.0 <25`) · `Dockerfile` (`node:24.21.0-bookworm-slim`) · `.github/workflows/ci.yml` (`node-version-file: .nvmrc`, paso 21) · §10 y §11 | yes |
| Versión de pnpm | `package.json` (`packageManager`) | `pnpm@11.28.2` | `Dockerfile` (`corepack prepare pnpm@11.28.2`) · §10 Bootstrap · ci.yml (paso 21) · §11 | yes |
| Color de la marca en el manifiesto | `apps/web/src/styles/tokens.css` (`--p-dark-bg`) | `#0B0D0C` | `apps/web/vite.config.ts` (`manifestColor`) · `CLAUDE.md` y §7 (tabla de diseño) · `tests/repo/tokens-parity.test.ts` (paso 7) | yes |
| Clave de tema | `apps/web/public/theme-init.js` | `pulso-theme` | `apps/web/src/lib/theme.ts` (paso 7) · `apps/web/src/theme-init.test.ts` (paso 2) · §6 | yes |
| WAV del micrófono falso | `tests/e2e/global-setup.ts` | `tests/e2e/.tmp/voice.wav` | `playwright.config.ts` (`fakeVoiceWav`) · `.gitignore` (`tests/e2e/.tmp/`) · §13 | yes |
| Usuario de prueba | `.env.example` — `ALLOWED_EMAILS` | `e2e@pulso.test` / `pulso-test-1234` | `playwright.config.ts` (`ALLOWED_EMAILS`) · `apps/web/src/routes/Entrar.tsx` (paso 6) · `apps/server/tests/helpers/emulator-auth.ts` (paso 5) · §4 | yes |
| Prefijo y antigüedad del audio temporal | `deploy/storage-lifecycle.json` (paso 21) | `tmp/` y `age: 1` | `apps/server/src/storage/audio-store.ts` y `sweeper.ts` (24 h) · `storage.rules` (comentario) · §4 y §5 | yes |
| Banderas de despliegue del servidor | `deploy/deploy-server.sh` (paso 21) | `--min-instances 0 --max-instances 3 --timeout 600` | §12 (tabla de Hosting) · §14 (rate limiting: "`--max-instances 3`") · §16 (costo: "`--max-instances 3`") · `tests/repo/deploy-config.test.ts` (paso 21) | yes |
| Nombre del job del barredor | `deploy/scheduler.sh` (paso 21) | `pulso-sweep-audio` | M7 (`gcloud scheduler jobs run pulso-sweep-audio`) · `tests/repo/deploy-config.test.ts` (paso 21) · `deploy/RUNBOOK.md` | yes |
| Nombres de variable de entorno | `apps/server/src/env.ts` (esquema, pasos 4, 5, 14, 15, 16) | los de la tabla de §10 | `.env.example` · `apps/server/tests/setup.ts` · `apps/server/tests/helpers/env.ts` (`baseEnv`, paso 4: lee todas las claves de `.env.example`) · `playwright.config.ts` (`serverEnv`) · `CLAUDE.md` (tabla Environment) | yes |
| Constantes de audio | `packages/shared/src/constants.ts` (paso 8) | 16000 Hz · 1600 muestras · 270 s · 32000 B/s · 25000 B | `ws/audio-gateway.ts` (paso 14) · worklet (paso 8) · §5 · `.claude/rules/dsp-shared.md` | yes |
| Puerto de la vista previa del bundle de producción | `apps/web/package.json` — `scripts.preview` (`vite preview --host 127.0.0.1 --port 4173 --strictPort`) | `4173` | `playwright.config.ts` (`previewPort`, URL de espera del `webServer`) · `tests/e2e/ui/pwa.spec.ts` (paso 7) y `tests/e2e/ui/worklet.spec.ts` (paso 8): `http://127.0.0.1:4173/entrar` · §19.6 (fila de Playwright) | yes |
| Valores por defecto del entorno de pruebas | `.env.example` | Iguales a `.env.example`: `GOOGLE_CLOUD_PROJECT=demo-pulso`, `STT_LOCATION=us`, `STT_LANGUAGE=es-US`, `STT_DAILY_SECONDS_PER_ORG=1800`, `STT_PRICE_USD_PER_MIN=0.016`, `STORAGE_BUCKET=demo-pulso.appspot.com`, `SCHEDULER_SA_EMAIL=scheduler@demo-pulso.iam.gserviceaccount.com`, `GEMINI_LOCATION=global`, `FILLERS_FROM_AUDIO=true`, `SWEEP_AUDIENCE=http://127.0.0.1:8787`, los tres `*_EMULATOR_HOST` y los siete `VITE_*` | `apps/server/tests/setup.ts` (los iguales anteriores salvo emuladores, que exporta `firebase emulators:exec`) · `playwright.config.ts` `serverEnv` (los iguales y los emuladores) · `apps/web/tests/setup.ts` (los siete `VITE_*`). **Difieren a propósito:** `NODE_ENV`, `PORT` (`0` en `setup.ts`), `GIT_SHA`, `LOG_LEVEL`, `ALLOWED_EMAILS` (`allowed@pulso.test,second@pulso.test` en `setup.ts`; `e2e@pulso.test` en Playwright), `WEB_ORIGINS` (solo `http://127.0.0.1:5173` en pruebas), `STT_MODEL`/`GEMINI_MODEL` (`test-stt-model`/`test-llm-model`, nunca un ID real) y `GEMINI_TIMEOUT_MS` (`5000`) | yes |

Cada fila se comparó carácter por carácter contra los archivos emitidos (los puertos, el id de proyecto, los colores, las versiones y las claves se verificaron con `grep` sobre `workspace/`); las apariciones en archivos que escribe un paso (marcadas con su número) se vuelven a comprobar en la puerta de ese paso. **Primer paso donde existen ambos lados y que ejercita el contrato:** entrada del servidor → paso 1 (`smoke-server.mjs` ejecuta `dist/index.js`); salida de la web → paso 1 (`test -f`), paso 7 (`check-pwa`) y paso 8 (`worklet.spec.ts` carga el bundle servido por `vite preview`); color del manifiesto → paso 7 (`tokens-parity`); emuladores y proyecto → paso 3 (`test:emu`); usuario de prueba → paso 6 (e2e de auth); audio temporal → pasos 15 y 21; banderas de despliegue y nombre del job → paso 21 (`deploy-config.test.ts`); puerto de la vista previa → pasos 7 y 8 (`pwa.spec.ts`, `worklet.spec.ts`).

#### Byte-exact artifact reconciliation

| Byte-exact artifact | Authored by | First diffed at | Blueprint rules that constrain it | Runtime call that produces it, on the §11 pin | Both confirmed |
|---|---|---|---|---|---|
| Hex y razones de contraste de la tabla de §7 (copiada a `tokens.css` y a `tokens.test.ts`) | §7 (paso 2 la copia) | Paso 2 (`tokens.test.ts`, tolerancia 0.05; no es una igualdad de cadenas) | §7: umbrales (texto ≥ 4.5, controles ≥ 3); `signal`/`ghost` casi isoluminosos | Fórmula WCAG 2.x sobre los 20 hex (script ejecutado el 2026-10-04): oscuro text 16.71/15.64/14.19, secondary 8.79/8.23/7.47, signal 10.93/10.23/9.28, ghost 12.01/11.25/10.20, alert 7.12/6.67/6.05, border-strong 4.18/3.91/3.55, focus 10.40/9.73/8.83; claro text 15.61/17.01/13.90, secondary 6.55/7.14/5.83, signal 4.89/5.33/4.35, ghost 5.76/6.28/5.13, alert 5.31/5.79/4.73, border-strong 3.93/4.28/3.50, focus 5.78/6.30/5.15 — idénticas a las de la tabla | yes |
| `firestore.indexes.json` | §19.6 (emitido) | Paso 3 (`tests/repo/firestore-indexes.test.ts`) | §4 Indexes: exención de `sessions.contour` y compuesto `profileId + startedAt` | La prueba afirma propiedades del JSON parseado (no una igualdad de bytes); la forma `fieldOverrides[].indexes: []` es la documentada por Firebase | yes (propiedad, no bytes) |
| `deploy/storage-lifecycle.json` | Paso 21 | Paso 21 (`deploy-config.test.ts`) | §5 y §14: `age: 1` sobre `tmp/` | La prueba afirma propiedades; el aceptado por `gcloud storage buckets update --lifecycle-file` se verifica en la puerta manual M6 (VERIFICAR) | yes (propiedad, no bytes) |

Ninguna puerta compara contra una cadena producida por el runtime (mensajes de error, claves ordenadas, formatos de número): las comprobaciones son propiedades (esquemas, campos, umbrales).

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El proyecto está **terminado** cuando cada comando de abajo sale con 0 en un checkout limpio, y no antes. Es el mismo conjunto que ejecuta CI (`.github/workflows/ci.yml`, y `tests/repo/ci-parity.test.ts` lo exige) y el que mide cada paso de §9. **Este primer bloque contiene solo comandos y comentarios, en el orden de CI.**

```bash
pnpm install --frozen-lockfile
pnpm typecheck                     # expect: exit 0, zero errors (raíz, shared, server, web)
pnpm lint                          # expect: exit 0, zero errors
pnpm test                          # expect: exit 0, 0 failed, 0 skipped (test:unit + test:emu)
pnpm build                         # expect: exit 0 (shared -> server -> web)
node scripts/smoke-server.mjs      # expect: exit 0; ejecuta apps/server/dist/index.js y recibe {ok:true,sha} de /health
node scripts/check-pwa.mjs         # expect: exit 0; manifiesto y sw.js válidos en apps/web/dist
node scripts/check-no-hex.mjs      # expect: exit 0; ningún hex fuera de tokens.css
node deploy/check-bundle-budget.mjs  # expect: exit 0; JS <= 600 KB gzip, CSS <= 60 KB gzip
pnpm eval                          # expect: exit 0; tasa >= apps/server/evals/baseline.json (modo grabado)
pnpm test:e2e                      # expect: exit 0, 0 failed (proyecto ui)
pnpm test:e2e:full                 # expect: exit 0, 0 failed (proyecto app: auth, shell, monitor, frase perfecta, línea base, a11y)
```

**Cada expectativa es una propiedad, no una cuenta**, y cada línea sale con 0 en una build correcta. Ninguna puerta acepta "sale distinto de cero" como éxito: donde la respuesta correcta es un fallo, se afirma el código concreto (`grep …; test $? -eq 1`). No se ignoran advertencias.

**Puertas de repositorio** (se ejecutan una vez, con todos los pasos ya commiteados; cada una sale con 0):

```bash
tags=$(jq -r '.[].checkpoint' blueprints/pulso/tasks.json) && test -n "$tags" && for tag in $tags; do git rev-parse -q --verify "refs/tags/$tag" >/dev/null || exit 1; done   # todas las etiquetas de checkpoint existen
git ls-files --error-unmatch .env.example
git ls-files --error-unmatch .env.e2e
git ls-files --error-unmatch pnpm-lock.yaml
git ls-files --error-unmatch .claude/settings.json
git ls-files --error-unmatch apps/web/public/icons/icon-512.png
git ls-files --error-unmatch blueprints/pulso/blueprint.md
git check-ignore -q .env.example; test $? -eq 1      # 1 = no ignorado (128 sería un error de uso)
git check-ignore -q .env.e2e; test $? -eq 1
git check-ignore -q pnpm-lock.yaml; test $? -eq 1
git check-ignore -q blueprints/pulso/tasks.json; test $? -eq 1
git check-ignore -q tests/e2e/.tmp/voice.wav; test $? -eq 0   # 0 = ignorado a propósito
test -z "$(git ls-files -ci --exclude-standard)"   # expect: exit 0 — ningún archivo ignorado está trackeado
git grep -n "BEGIN PRIVATE KEY" -- ':!blueprints'; test $? -eq 1   # 1 = sin coincidencias (2 sería un error de uso)
```

**Nota sobre permisos:** la primera línea de este bloque usa `$()` y un `for`; un ejecutor no interactivo puede pedir confirmación porque el patrón `Bash(for:*)` no está en la lista de permitidos. Es equivalente a ejecutar `git rev-parse -q --verify refs/tags/<etiqueta>` por cada valor de `.[].checkpoint` de `tasks.json`; ejecutar esas comprobaciones una a una es válido.

Además, estas puertas se marcan una vez antes del lanzamiento:

- [ ] §10 Bootstrap se re-ejecutó sobre un árbol ya inicializado, **salió con 0** y no cambió nada relevante (los cuatro `package.json` conservan sus dependencias).
- [ ] Cada fila de la tabla *Cross-artifact value reconciliation* de §19.6 se volvió a comparar contra los archivos tal como quedaron al final de la build; las comprobaciones de lint/typecheck se ejecutaron desde la raíz **con el bundle presente**.
- [ ] Cada fila de *Byte-exact artifact reconciliation* de §19.6 sigue cumpliéndose (contrastes de tokens: `pnpm test:unit apps/web/src/styles/tokens.test.ts`).
- [ ] Ningún no-objetivo de §1 está construido (sin Stripe, sin planes, sin sparring, sin sitio de marketing, sin Sentry, sin DTW).

#### Puertas manuales posteriores a la build (dueño: Steven; no son pasos de la build)

Dependen de credenciales reales de Google, de un dispositivo físico o de una persona; ninguna se simula en la build. Cada una lleva su comando exacto.

| # | Puerta | Comando o acción exacta | Resultado esperado |
|---|---|---|---|
| M1 | Proyecto de Google Cloud y vencimiento del crédito | Crear el proyecto y vincular facturación (`gcloud projects create <PROYECTO>` y `gcloud billing projects link <PROYECTO> --billing-account=<CUENTA>`); fijar la fecha de inicio de la prueba y calcular `CREDITS_EXPIRY_DATE` (`date -d "+90 days" +%F` en Linux, `date -v+90d +%F` en macOS); guardarla en el runbook | La fecha existe y está escrita; el día 80 = fecha − 10 días |
| M2 | APIs habilitadas | `gcloud services enable run.googleapis.com speech.googleapis.com aiplatform.googleapis.com firestore.googleapis.com storage.googleapis.com cloudscheduler.googleapis.com billingbudgets.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project <PROYECTO>` | Sale 0 |
| M3 | Alertas de presupuesto 50/80/100 % | `PROJECT=<PROYECTO> BILLING_ACCOUNT=<CUENTA> bash deploy/budget-alerts.sh` y luego `gcloud billing budgets list --billing-account=<CUENTA>` | Un presupuesto con umbrales 0.5, 0.8 y 1.0 (las alertas tardan horas en llegar; **solo alertan, no limitan**) |
| M4 | Despliegue del servidor y ensayo de rollback | `PROJECT=<PROYECTO> bash deploy/deploy-server.sh`; `curl -s "$SERVER_URL/health/deep" \| jq -e '.ok == true'`; ensayo: `gcloud run services update-traffic pulso-server --region us-central1 --to-revisions=<REVISION_ANTERIOR>=100`; `pnpm audit --prod` revisado | `/health/deep` responde `ok`; el rollback tarda segundos |
| M5 | Despliegue de la web, reglas e índices | Crear `.env.production.local` (gitignored) con los `VITE_*` reales del proyecto (Vite lo prioriza sobre `.env`, que trae los valores del emulador); `PROJECT=<PROYECTO> bash deploy/deploy-web.sh`; añadir el dominio de Hosting a los dominios autorizados de Firebase Auth | La app carga por HTTPS en `https://<proyecto>.web.app` |
| M6 | Bucket: soft delete 0 y lifecycle | `PROJECT=<PROYECTO> BUCKET=<BUCKET> bash deploy/storage-setup.sh` y `gcloud storage buckets describe gs://<BUCKET> --format=json \| jq '.soft_delete_policy'` | Retención de soft delete en 0 y regla `age:1` sobre `tmp/` aplicada (puede tardar hasta 24 h; VERIFICAR el nombre exacto del campo en la salida) |
| M7 | Barredor horario | `PROJECT=<PROYECTO> SERVER_URL=<URL> bash deploy/scheduler.sh`; `gcloud scheduler jobs run pulso-sweep-audio --location us-central1` y leer el log | Respuesta `{ "deleted": 0 }` (o el número de objetos viejos); VERIFICAR precio y cuota de Cloud Scheduler antes |
| M8 | **Spike en vivo de STT** | `gcloud auth application-default login`, `export GOOGLE_CLOUD_PROJECT=<PROYECTO>` (no uses un `.env` copiado de `.env.example`: apunta a `demo-pulso` y a los emuladores) y `pnpm spike:stt ./muestra.wav` (un WAV real de Steven hablando español con muletillas, 16 kHz mono PCM16). Criterio: ¿`long`@`us` entrega transcripción final por enunciado y `confidence`? ¿aparecen las muletillas en el texto? | Si `long`@`us` sirve: se deja la configuración. Si no: `STT_MODEL=chirp_2` y `STT_LOCATION=us-central1`. Si omite muletillas: `FILLERS_FROM_AUDIO=true` se mantiene. Registrar la decisión en el decision log |
| M9 | Gemini real y evaluación en vivo | `export GOOGLE_CLOUD_PROJECT=<PROYECTO>` (sin hosts de emuladores en el entorno) y `pnpm eval:live` (credenciales por defecto de aplicación; `GEMINI_MODEL` del `.env` real) y una sesión real con informe | La tasa de aciertos en vivo ≥ baseline; si no, subir `GEMINI_MODEL` a `gemini-3.5-flash` y repetir |
| M10 | iPhone real | Instalar la PWA en iOS, abrir Monitor, conceder el micrófono, grabar 30 s sin cambiar de pantalla, iniciar sesión con Google (redirect con `authDomain` propio) | El permiso persiste, el monitor dibuja y el sign-in vuelve a la app. Si falla: abrir un hallazgo (R6) |
| M11 | Lector de pantalla | Pasada con NVDA + Firefox y VoiceOver (Safari e iOS) sobre Monitor, Frase Perfecta y Reporte, con notas en el repositorio | El resumen en vivo se anuncia sin ruido; cada pantalla se completa a oído |
| M12 | Decisión antes del día 80 | En Ajustes → "Exportar mis datos" (guardar `pulso-datos.json`) y decidir **migrar o actualizar la cuenta** antes de `CREDITS_EXPIRY_DATE` − 10 días. Al vencer o agotarse el crédito la cuenta de prueba se cierra y los recursos se detienen, con 30 días de gracia antes del borrado permanente | Exportación guardada fuera de Google y decisión escrita en el runbook |
| M13 | Imagen Docker | `docker build -t pulso-server .` y `docker run --rm -p 8080:8080 --env-file .env.example -e PORT=8080 pulso-server`, luego `curl -s localhost:8080/health \| jq -e '.ok == true'` | Responde `ok`|
| M14 | Producción y error tracking | Fijar las variables de §10 en Cloud Run (`ALLOWED_EMAILS`, `WEB_ORIGINS`, `STT_*`, `GEMINI_*`, …); provocar un error de prueba y comprobar que aparece en Error Reporting con el SHA; recorrer los flujos críticos de §13 contra la URL de producción | Variables presentes en producción y ausentes del repositorio; el error aparece |

**Los avisos no se ignoran.** Una advertencia tolerada se vuelve permanente y la siguiente real se esconde dentro.

### 20.2 Risk register

| Risk | Likelihood | Impact | Early signal | Mitigation |
|---|---|---|---|---|
| **R1** La fantasma "según el texto" está mal definida (el contorno ideal no coincide con lo que Steven considera buena oratoria) | M | H | En la semana de línea base, Steven reporta que el fantasma "no se parece" a una buena entrega, o que `trackingPct` queda < 40 % con entregas que él considera buenas | Algoritmo determinista + marcas de Gemini como datos (§2); constantes de perfiles en un solo archivo (`profiles.ts`) para ajustar sin tocar el generador; validar con Steven en la línea base. **Paso 11** (los pasos 16 a 18 la consumen). Dueño: Steven |
| **R2** STT puede omitir muletillas (no está documentado que las transcriba) | H | M | El spike M8 muestra una transcripción "limpia" donde Steven dijo "eh/este" | Spike manual M8; análisis de audio con Gemini detrás de `FILLERS_FROM_AUDIO` (por defecto `true`) y respuesta grabada en evals. **Pasos 14, 15 y 16** |
| **R3** `long` puede no dar marcas de tiempo por palabra en streaming y Chirp 3 no las da | H | M | `pnpm spike:stt` no devuelve tiempos por palabra | Ritmo y pausas son locales (VAD + conteo de palabras); STT solo aporta transcripción final y `confidence` por enunciado; adaptador con modelo/región configurables. **Paso 14** (y 12 para el cálculo local) |
| **R4** Gasto y vencimiento del crédito (90 días; las alertas tardan horas; los "spend caps" no cubren STT; el patrón de desactivar facturación es destructivo y no se usa) | M | H | Alerta de presupuesto al 50 %; `quota_exceeded` frecuente; se acerca el día 80 | Cuota diaria de segundos de STT por organización + tope de 270 s + `--max-instances 3` + alertas 50/80/100 % (M3) + métrica `cost_usd`; exportar datos y decidir antes del día 80 (M12, runbook `creditos-vencen`). **Pasos 14, 19 y 21**. Dueño: Steven |
| **R5** Retención de audio: el lifecycle no garantiza el tiempo y el soft delete retiene 7 días | M | M | Objetos en `tmp/` con más de 25 h; el barredor devuelve `deleted > 0` de forma constante | Borrado inmediato por código tras el informe + barredor horario (OIDC) + lifecycle `age:1` de respaldo + soft delete 0 (M6). Garantía documentada: "borrado ≤ 24 h + intervalo del barredor (1 h) en condiciones normales". **Paso 15** (y 21) |
| **R6** PWA en iOS: el micrófono (bug WebKit 215884: el permiso se pierde al cambiar el hash) y el sign-in de Google en PWA instalada no están documentados | M | H | M10 falla: el permiso se pide de nuevo o el sign-in no vuelve a la app | No cambiar de ruta ni de hash durante la captura; `authDomain` propio y redirect en iOS; prueba en iPhone real (M10); si falla, evaluar app nativa (no-objetivo con condición). **Pasos 6, 7, 8 y 10** |
| **R7** Alcance grande para una sola persona | H | M | Un paso excede una sentada o acumula fallos de puerta | Cortes verticales, un paso por sentada, puertas por paso y 3 épicas con salida clara; los no-objetivos fijan el alcance |
| **R8** Los datos de voz son datos personales sensibles al vender | L (hoy) | H | Se decide abrir el registro | v1 cerrada con `ALLOWED_EMAILS`; política de privacidad y consentimiento antes de abrir (no-objetivo con condición); audio efímero; exportar y borrar la cuenta |
| **R9** Los `gemini-2.5-*` se retiran el 2026-10-20 y `@google/genai` está en "Preview" | M | M | Error de modelo no disponible o cambio de API tras actualizar el SDK | IDs solo en configuración (`GEMINI_MODEL`), un único módulo importa el SDK, evaluación en CI (`pnpm eval`) y en vivo (M9); el cliente se construye con opciones explícitas. **Pasos 16 y 21** |
| **R10** Arranque en frío de Cloud Run en la primera conexión WebSocket | H | L | La primera conexión tarda varios segundos | El cliente tolera el retraso y muestra "Conectando…"; reconexión con retroceso; `--min-instances 0` por costo con la opción de `--min-instances 1` documentada. **Paso 14** |

### 20.3 Decision log

| # | Decision | Rejected alternative | Why | Would reverse if |
|---|---|---|---|---|
| 1 | Pista ts-node con SPA Vite en lugar de Next.js | Next.js | App tras login sin SEO; canvas, AudioWorklet y micrófono son cliente | Aparece una superficie pública indexable (sitio de marketing) |
| 2 | Cloud Run + Firebase Hosting | Vercel | Los $300 son de Google Cloud; WebSockets de larga duración | El crédito se acaba y Vercel resulta más barato |
| 3 | Firestore sin ORM | Postgres + Drizzle (Cloud SQL) | Datos jerárquicos por usuario; Cloud SQL cobra por estar encendido | Aparecen consultas relacionales entre usuarios (comunidad, equipos) |
| 4 | Firebase Auth solo con Google | Clerk / Better Auth | Un solo proveedor, gratis, mismo proyecto | Hace falta otro método de acceso o SSO empresarial |
| 5 | Lista de permitidos (`ALLOWED_EMAILS`) en v1 | Registro abierto | Datos de voz sensibles; sin política de privacidad | Existen política de privacidad y consentimiento |
| 6 | Organización personal automática, `plan = "free"` | Un esquema por usuario sin organización | Reconvertir a multi-organización después reescribe cada consulta | Nunca se venderá (poco probable) |
| 7 | Solo lectura en el navegador; escrituras por el servidor | Escrituras directas con reglas | Un solo lugar de validación y de cuota; reglas simples y probables | Hace falta modo sin conexión con escritura local |
| 8 | Ritmo y pausas locales (VAD) | Marcas de tiempo por palabra de STT | Chirp 3 no las da en streaming y `long` no está documentado | El spike M8 demuestra marcas por palabra fiables y baratas |
| 9 | Muletillas: léxico + análisis de audio con Gemini detrás de bandera | Confiar solo en la transcripción | STT puede omitirlas | El spike M8 demuestra que el reconocedor las transcribe |
| 10 | Fantasma determinista; Gemini solo marca énfasis | Que Gemini dibuje el contorno | Reproducible, probable y funciona sin red | La validación de línea base (R1) pide formas que solo un modelo infiere |
| 11 | Tolerancia temporal fija ±300 ms, sin DTW | DTW | Sencillo y explicable en v1 | Se castigan ritmos legítimos en la línea base |
| 12 | Cuota diaria de STT + tope 270 s + alertas | Pub/Sub + desactivar facturación | Esa acción elimina recursos de forma irreversible y no garantiza no pasar el presupuesto | Google ofrece un tope duro de gasto que cubra STT/Firestore/Storage |
| 13 | Audio temporal: borrado por código + barredor horario + lifecycle + soft delete 0 | Solo lifecycle `age:1` | El lifecycle es asíncrono y no garantiza el momento; el soft delete retiene 7 días | Google documenta una garantía de tiempo para el lifecycle |
| 14 | `@google/genai` con `vertexai: true` y opciones explícitas, un solo módulo | `@google-cloud/vertexai` | Deprecado; las variables de entorno del ejemplo son inconsistentes | El SDK sale de "Preview" y estabiliza la configuración |
| 15 | `gemini-3.5-flash-lite` por defecto, `gemini-3.5-flash` como escalón | `gemini-2.5-*` | Se retiran el 2026-10-20 | Una evaluación en vivo falla con flash-lite o Google retira el modelo |
| 16 | pnpm 11.28.2 (`latest-11`) | pnpm 12.9.1 (`latest`) | Las trampas de la pista se reprodujeron en la 11 | La pista se reverifica en la línea 12 |
| 17 | TypeScript ~6.0.3 | TypeScript 7.0.2 | Regla de la pista; la 7 rompe tooling | La pista adopta la 7 y todas las herramientas lo admiten |
| 18 | `@pulso/shared` compilado a `dist` para el servidor y como fuente para web/pruebas | Compartir solo fuente `.ts` en el servidor | `tsc` no emite archivos fuera de `rootDir` y Node no ejecuta TS de `node_modules` de forma fiable | Node estabiliza la ejecución de TS para paquetes de workspace |
| 19 | Biome con JSON y CSS sin formateo | Formatear todo | Los archivos JSON emitidos y el CSS de Tailwind no deben pelear con el formateador | Biome formatea Tailwind 4 sin falsos positivos |
| 20 | Dobles de STT/LLM solo en `apps/server/tests/**` | Una variable de entorno que active modo falso | Ningún interruptor de prueba en el camino del producto | Nunca |
| 21 | Sin Sentry | Sentry | Cloud Logging + Error Reporting + uptime ya cubren una v1 de un usuario | El volumen de errores de cliente exige agrupación y source maps |
| 22 | Presupuesto de bundle 600 KB gzip de JS (guarda de regresión inicial) | Sin presupuesto | Detecta regresiones; se afina tras medir | La primera medición real muestra una cifra mucho menor |

### 20.4 What to build next

1. **Registro abierto + política de privacidad + consentimiento** (condición: existen ambas y se decide vender). Sustituir `ALLOWED_EMAILS`.
2. **Cobro y planes** (condición: un segundo comprador dispuesto a pagar). Stripe, `org.plan`, entitlement en el servidor.
3. **Sparring con IA como prospecto escéptico y hook scorer** (condición: 30 días de uso de v1 con el costo por sesión medido en `llm_calls`).
4. **App nativa o empaquetado** (condición: M10 demuestra que el micrófono en PWA de iOS es inviable).
5. **Video, postura, contacto visual y modo equipo** (condición: v2 en producción y más de un usuario activo).

---

*End of blueprint. Build order is §9. Stop when §20.1 is green.*
