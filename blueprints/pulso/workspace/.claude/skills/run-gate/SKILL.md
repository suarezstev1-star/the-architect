---
name: run-gate
description: Run the full automated acceptance gate of PULSO in order and report the first failure. Use before marking a task done, before a checkpoint, or when asked whether the project is green.
---

# Ejecutar la puerta automática

## When to use
Antes de dar una tarea por hecha y antes de cada checkpoint.

## Steps
1. Desde la raíz del proyecto, ejecuta en este orden y detente en el primer fallo (no sigas "mientras tanto").
2. Si un comando falla, arregla el código; nunca edites el comando ni relajes un umbral.
3. Si falla `pnpm test:emu` con un error de Java, instala JDK 21+ (prerrequisito de §10).

## Verify
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
Cada línea debe terminar con exit 0. (`check-pwa`, `eval` y `check-bundle-budget` existen desde los pasos 7, 16 y 19: antes de esos pasos, omite las que aún no existen.)

## Do not
- No ignorar advertencias: una advertencia tolerada se vuelve permanente.
- No ejecutar nada de `deploy/` ni `pnpm spike:stt`: son puertas manuales con dueño.
