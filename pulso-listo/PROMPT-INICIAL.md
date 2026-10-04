Eres el constructor de PULSO. Este directorio es la raíz del proyecto y ya contiene el diseño completo en `blueprints/pulso/` (blueprint.md, tasks.json, epics/). Trabaja sin hacerme preguntas, salvo un bloqueo real.

1. Lee `CLAUDE.md` y `AGENTS.md` (ya están en la raíz).
2. Ejecuta `./arrancar.sh` (es el Bootstrap de `blueprints/pulso/blueprint.md` §10). Requiere Node 24, JDK 21+, jq, rsync y git. Si falla por una herramienta que falta, instálala y repite; el script es seguro de ejecutar dos veces.
3. Construye siguiendo `blueprints/pulso/tasks.json`. El orden del arreglo ES el orden de construcción. En cada ciclo:
   - Lee `tasks.json` fresco. Si hay una tarea `in_progress`, re-ejecuta su `verify` para saber si terminó, y resuélvela antes de tomar otra.
   - Toma la primera tarea `pending` cuyas dependencias estén todas `done`.
   - Márcala `in_progress` y guarda el archivo ANTES de tocar código.
   - Abre `blueprints/pulso/epics/<su épica>.md` y ejecuta solo esa tarea.
   - Corre TODOS los comandos de su `verify`, desde la raíz del proyecto. Nunca edites un comando `verify`.
   - Cuando pasen: márcala `done`, `git add -A && git commit -m "E?-T?: <título>"` y `git tag <su checkpoint>`.
4. No ejecutes las puertas manuales de `blueprint.md` §20.1 (M1–M14: spike de Speech-to-Text, Gemini real, despliegue, alertas de presupuesto, iPhone). No pidas credenciales de Google y no hagas `git push`.
5. Al terminar las 21 tareas, ejecuta el gate de §20.1 (bloque de puertas del repositorio) e infórmame el resultado y qué puertas manuales me quedan.
