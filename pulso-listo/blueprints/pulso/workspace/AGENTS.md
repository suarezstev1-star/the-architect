# PULSO — agent instructions

Entrenador de voz en vivo (PWA, español): monitor de voz con línea fantasma por perfil de oratoria, medidores de dicción, muletillas y vocabulario. Monorepo pnpm: `apps/web` (Vite SPA), `apps/server` (Hono en Cloud Run), `packages/shared`.

## Commands

| Tarea | Comando |
|---|---|
| Instalar | `pnpm install --frozen-lockfile` |
| Desarrollo | `pnpm dev` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Lint / formato | `pnpm lint` · `pnpm format` |
| Pruebas | `pnpm test:unit` · `pnpm test:emu` (JDK 21+) · `pnpm test` |
| E2E | `pnpm test:e2e` · `pnpm test:e2e:full <ruta>` |

**Gate:** `pnpm typecheck && pnpm lint && pnpm test`.

## Non-negotiable

1. Aislamiento por organización: el navegador solo lee Firestore; toda escritura pasa por el servidor; recurso ajeno = 404.
2. Sin dobles de prueba en el camino del producto; el ID del modelo de Gemini solo en configuración (`GEMINI_MODEL`).
3. Versiones: manda `pnpm-lock.yaml`; no cambies pins ni los recuerdes de memoria.
4. Sin secretos en el repo; las puertas manuales (despliegue, spike de STT, iPhone) son del dueño.
5. Cero hex fuera de `apps/web/src/styles/tokens.css`; cadenas de UI solo en `apps/web/src/i18n/es.ts`.

Arquitectura completa, fronteras y tokens de diseño: ver `CLAUDE.md` en este directorio. Orden de construcción: `blueprints/pulso/tasks.json` y `blueprints/pulso/epics/`.
