---
description: Firestore data layer, security rules and isolation tests
paths:
  - "apps/server/src/data/**"
  - "packages/shared/src/schemas/**"
  - "firestore.rules"
  - "firestore.indexes.json"
  - "storage.rules"
  - "apps/server/tests/emulator/**"
---

# Datos (Firestore, sin ORM)

- Todo dato de usuario vive bajo `orgs/{orgId}/...`. Solo `apps/server/src/data/org-store.ts` arma esas rutas; ningún otro módulo escribe la cadena `orgs/`.
- El navegador solo LEE (reglas: miembro de la organización). Toda escritura pasa por el servidor con Admin SDK. `allow write: if false` en todas las reglas.
- Un recurso de otra organización responde 404 (nunca 403).
- Cada colección nueva: esquema zod en `packages/shared/src/schemas/`, nombre en `COLLECTION_NAMES`, prueba de aislamiento en `apps/server/tests/emulator/rules-isolation.test.ts` (el bucle ya recorre `COLLECTION_NAMES`).
- Límites: documento ≤ 1 MiB; ≤ 40 000 entradas de índice por documento. Los arrays grandes (`sessions.contour`) llevan exención en `firestore.indexes.json`.
- `contour` se guarda como enteros (semitonos × 10), máximo 3000 puntos.
- Borrado: sesiones con borrado duro a petición; la cuenta borra todo (recursivo) y exporta JSON antes.
- Nunca escribas `orgs/{orgId}` con un `orgId` que no cumpla `/^[A-Za-z0-9-]{8,64}$/`.
- Las pruebas de reglas usan `@firebase/rules-unit-testing` contra el emulador (`pnpm test:emu`); nunca mocks de Firestore.
