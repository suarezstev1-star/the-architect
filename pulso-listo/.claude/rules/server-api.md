---
description: Hono server conventions - envelope, validation, auth, env, logging
paths:
  - "apps/server/src/**"
  - "apps/server/scripts/**"
---

# Servidor (Hono en Cloud Run)

- Base `/api/v1`. Éxito: el objeto JSON de la ruta. Error: SIEMPRE `{ error: { code, message, requestId } }` con códigos `unauthenticated` 401, `forbidden_email` 403, `not_found` 404, `validation_error` 422, `quota_exceeded` 429, `rate_limited` 429, `upstream_unavailable` 503, `internal` 500.
- Valida cada cuerpo, query y parámetro con `@hono/zod-validator` + esquemas de `@pulso/shared`. Nada sin validar llega a la lógica.
- Autorización en el servidor en cada petición: `requireUser` y luego pertenencia a la organización (404 si no es miembro). Un botón oculto no es un permiso.
- Variables de entorno: solo a través de `loadEnv()` (`src/env.ts`). Nunca `process.env` fuera de ese módulo y de los entrypoints.
- Todo entrypoint (`src/index.ts`, `scripts/*.ts`, `evals/run.ts`, `tests/e2e-server.ts`) importa `./load-dotenv.ts` PRIMERO.
- Logs con pino: JSON, `request_id` en cada línea, nada de tokens ni cuerpos crudos (hay `redact`).
- `createApp(deps)` recibe sus dependencias (`stt`, `llm`, `db`, `now`...). Los dobles de prueba viven en `apps/server/tests/**` y NUNCA se importan desde `src/`.
- Imports relativos con extensión `.ts`; `@pulso/shared` por nombre de paquete.
- Rutas con efectos secundarios (crear sesión, finalizar) son idempotentes cuando el cliente reintenta.
- `/internal/*` solo acepta tokens OIDC de Cloud Scheduler; nunca tokens de usuario.
