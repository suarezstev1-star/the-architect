# PULSO — listo para construir

Esta carpeta ya está armada: el diseño completo está en `blueprints/pulso/` y los archivos de configuración ya están en la raíz.

## Lo único que tienes que hacer
1. Sube **toda esta carpeta** como raíz de tu proyecto nuevo (incluye los archivos ocultos: `.claude/`, `.gitignore`, `.env.example`, etc.).
2. Abre Claude Code dentro de esa carpeta.
3. Pega el contenido de `PROMPT-INICIAL.md` como primer mensaje.

Claude se encarga del resto: corre `./arrancar.sh` y construye los 21 pasos en orden, con una verificación por paso.

## Requisitos de la máquina donde corra
- Node 24 (el proyecto fija 24.21.0 en `.nvmrc`), JDK 21 o superior (para los emuladores de Firebase), git, jq y rsync.
- En Linux, una sola vez: `sudo pnpm exec playwright install-deps chromium` (librerías del navegador de pruebas).
- No necesita cuenta de Google para construirse: todo corre en emuladores y con respuestas grabadas.

## Lo que queda para ti (después de la construcción)
Las puertas manuales M1–M14 de `blueprints/pulso/blueprint.md` §20.1 necesitan tus credenciales o tu dispositivo: spike de Speech-to-Text, Gemini real, despliegue en Cloud Run y Firebase Hosting, alertas de presupuesto y prueba en un iPhone real.

**Créditos de Google Cloud:** vencen a los 90 días. Anota la fecha de inicio y exporta tus datos antes del día 80 (el blueprint incluye "exportar mis datos").
