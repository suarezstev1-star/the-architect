---
description: Gemini gateway, STT adapter, prompts and evals
paths:
  - "apps/server/src/llm/**"
  - "apps/server/src/stt/**"
  - "apps/server/src/ws/**"
  - "apps/server/evals/**"
---

# LLM y STT

- `apps/server/src/llm/gateway.ts` es el ÚNICO archivo que importa `@google/genai`. El cliente se construye con `{ vertexai: true, project, location }` explícitos, nunca con variables ambientales.
- El ID del modelo vive solo en `GEMINI_MODEL` (config). Ninguna cadena `gemini-<dígito>` en `src/`. Los modelos 2.5 se retiran el 2026-10-20: no usarlos.
- Salida estructurada: un esquema zod (`@pulso/shared`) es la fuente única; el esquema JSON se deriva con `z.toJSONSchema`. Un reintento de reparación con el error del validador; el segundo fallo lanza `LlmError("invalid_output")`.
- Cada llamada escribe una fila `llm_calls` (tokens, latencia, costo, estado) atribuida a organización y función.
- `generateStructured` recibe la dependencia `recordCall(row)`: el servidor inyecta el escritor de Firestore (`llm_calls`) y `evals/run.ts` un registrador en memoria (el modo grabado no necesita Firestore).
- El texto del usuario va delimitado como DATO en el prompt; los prompts son archivos versionados en `src/llm/prompts/`.
- El segundo y la palabra de la separación del fantasma los calcula `trackingScore`; el modelo no los inventa.
- `SttAdapter` es la interfaz propia; modelo, región e idioma por configuración. De STT solo: transcripción final por enunciado + `confidence`. Ritmo y pausas son locales.
- Chirp 3 no da marcas de tiempo por palabra en streaming y no se asume que `long` las dé. Las muletillas pueden omitirse en la transcripción: por eso existe el análisis desde audio (`FILLERS_FROM_AUDIO`).
- Evals: `apps/server/evals/golden.json` (≥ 20 casos) + `baseline.json`; `pnpm eval` sale con 1 si cae bajo el baseline. El modo grabado prueba el pipeline; la calidad del modelo se mide con `pnpm eval:live` (manual).
