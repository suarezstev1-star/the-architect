---
name: add-api-route
description: Add or change a Hono REST route in apps/server (validation, auth guard, org isolation, error envelope, test). Use when asked to add an endpoint, a /api/v1 route, or to change a request/response shape.
---

# Añadir una ruta del servidor

## When to use
Cada vez que se añade o cambia un endpoint bajo `/api/v1` en `apps/server/src/routes/`.

## Steps
1. Define el esquema zod de entrada y salida en `packages/shared/src/` (si lo usa la web) o junto a la ruta; exporta el tipo inferido.
2. Crea o edita `apps/server/src/routes/<nombre>.ts`: valida con `@hono/zod-validator`, aplica `requireUser(...)` y el guardia de pertenencia a la organización (404 si no es miembro), y accede a datos solo por `createOrgStore(db, orgId)`.
3. Errores: lanza `HttpError(status, code, message)` con un código del conjunto del sobre; nunca devuelvas un objeto de error propio.
4. Monta la ruta en `apps/server/src/app.ts`.
5. Escribe la prueba: unitaria (`app.request(...)` con dependencias inyectadas) y, si toca Firestore/Auth/Storage, en `apps/server/tests/emulator/`. Cubre: 401 sin token, 404 de otra organización, 422 con cuerpo inválido y el caso feliz.
6. Si la web la consume, añade la llamada con `apiFetch` y el texto en `es.ts`.

## Verify
```bash
pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:emu   # expect: exit 0
```

## Do not
- No leer `process.env` fuera de `src/env.ts`.
- No importar dobles de `tests/` desde `src/`.
- No devolver 403 para un recurso de otra organización.
