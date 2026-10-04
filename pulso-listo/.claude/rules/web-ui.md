---
description: Web UI - tokens, copy, accessibility, motion, states
paths:
  - "apps/web/src/**"
  - "apps/web/index.html"
  - "apps/web/public/**"
---

# Web (Vite SPA, React 19, Tailwind 4)

- Cero hex fuera de `src/styles/tokens.css` (`node scripts/check-no-hex.mjs` lo comprueba). El canvas lee los colores de variables CSS.
- Tres capas de tokens: primitivo (`--p-*`) → semántico (`--bg`, `--text`, `--signal`, `--ghost`, `--alert`...) → componente. Los componentes usan solo semánticos.
- Todas las cadenas visibles en `src/i18n/es.ts` (español neutro, tuteo). Nada de texto literal en JSX.
- Un `<h1>` por ruta, `lang="es"`, enlace "Saltar al contenido" como primer elemento enfocable, `main#contenido`.
- Objetivos táctiles ≥ 24×24 px (botón grabar ≥ 48 px de alto); foco visible ≥ 3:1; nunca `outline: none` sin reemplazo.
- Nunca solo color: la señal (sólida ≈3 px, etiqueta "TÚ") y el fantasma (punteado ≈2 px, marcadores, "FANTASMA") se distinguen por trazo y texto.
- `prefers-reduced-motion` se respeta: se quitan pulsos y transiciones decorativas (la línea del monitor SÍ se dibuja). Nada parpadea más de 3 veces por segundo. UI: ease-out 150–250 ms, sin rebotes.
- Cada pantalla define sus tres estados: cargando (esqueleto), vacío (con acción principal) y error (con reintentar).
- El canvas tiene alternativa de texto: `role="status"` + `aria-live="polite"`, actualizada como máximo cada 2 s.
- El navegador nunca escribe en Firestore; usa `apiFetch` para escrituras.
- No cambies de ruta ni de hash mientras se captura audio (bug WebKit 215884).
