#!/usr/bin/env bash
# Bootstrap de blueprints/pulso/blueprint.md §10, literal. Seguro de ejecutar dos veces.
set -e
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
