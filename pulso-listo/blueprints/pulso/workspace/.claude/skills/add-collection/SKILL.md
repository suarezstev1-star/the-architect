---
name: add-collection
description: Add a Firestore subcollection under an organization (zod schema, org-store accessor, rules coverage, index exemptions, isolation test). Use when asked to persist a new kind of data.
---

# Añadir una colección

## When to use
Cuando un dato nuevo debe persistir por organización.

## Steps
1. Esquema zod en `packages/shared/src/schemas/<nombre>.ts`; añade el nombre a `COLLECTION_NAMES` en `schemas/paths.ts` y exporta desde `index.ts`.
2. Accesor tipado en `apps/server/src/data/org-store.ts` (la única fuente de rutas `orgs/{orgId}/...`).
3. Reglas: las reglas genéricas de `orgs/{orgId}/{document=**}` ya cubren lectura de miembros y escritura denegada; añade excepciones solo con una prueba que las justifique.
4. Si el documento tiene un array grande o crecerá, mide el tamaño (< 1 MiB) y añade la exención de índice en `firestore.indexes.json`.
5. La prueba `rules-isolation` recorre `COLLECTION_NAMES`: ejecútala. Añade una prueba de `org-store` para el nuevo accesor.
6. Actualiza §4 de `blueprints/pulso/blueprint.md` y el export de cuenta (`routes/account.ts`) para incluirla.

## Verify
```bash
pnpm typecheck && pnpm lint && pnpm test:emu   # expect: exit 0
```

## Do not
- No construir rutas `orgs/...` a mano fuera de `org-store.ts`.
- No permitir escrituras desde el cliente.
