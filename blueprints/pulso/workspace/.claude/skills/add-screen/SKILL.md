---
name: add-screen
description: Add or change a screen (route) in apps/web following the route manifest, design tokens, Spanish copy file, states and accessibility rules. Use when asked to build a page, a new route, or a UI panel.
---

# Añadir una pantalla

## When to use
Cada vez que se añade o modifica una ruta de `apps/web/src/routes/`.

## Steps
1. Registra la ruta en `apps/web/src/routes.ts` (path, titleKey, auth). El router se construye desde el manifiesto.
2. Crea `apps/web/src/routes/<Nombre>.tsx` con UN `<h1>` y `document.title` propio. Define los tres estados con `PageState`: cargando (esqueleto del mismo tamaño), vacío (con la acción principal) y error (reintentar + requestId).
3. Textos solo en `apps/web/src/i18n/es.ts` (tuteo neutro). Colores solo con clases/variables de tokens; nunca hex.
4. Datos: lectura con el SDK de Firestore bajo `orgs/{orgId}`; escritura con `apiFetch`. Nunca escribas en Firestore desde el navegador.
5. Accesibilidad: objetivos ≥ 24×24 px (botones primarios ≥ 48 px), foco visible, etiquetas reales en formularios, `aria-live="polite"` para estados asíncronos, nada solo-color.
6. Prueba de renderizado en jsdom (un `h1`, `main#contenido`, estados) y, si es un flujo crítico, un spec de Playwright en `tests/e2e/app/`.

## Verify
```bash
pnpm typecheck && pnpm lint && pnpm test:unit && node scripts/check-no-hex.mjs   # expect: exit 0
```

## Do not
- No cambiar de ruta ni de hash mientras se captura audio.
- No añadir librerías de UI nuevas sin razón en el commit.
