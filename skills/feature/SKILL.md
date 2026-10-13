---
name: feature
description: Ejecuta o retoma el flujo del equipo para una feature (PO → UX → arquitecto → dev → QA → reviewer) con pausas de aprobación del dueño. Úsalo cuando el usuario escriba /feature, pida desarrollar una funcionalidad nueva con el equipo o quiera continuar una feature ya empezada.
---
# Flujo /feature

Argumento: descripción de la feature en lenguaje natural, o el nombre de una feature ya empezada ("continuemos con CheckIn").

Antes de empezar, carga la skill `reglas-equipo` y aplícala. Actúa como orquestador. Delega cada paso en su subagente y respeta las pausas.

0. **Retomar antes de empezar** (siempre, antes de lanzar ningún subagente):
   - Busca archivos de la feature por nombre, sin distinguir mayúsculas ni guiones (`checkin`, `check-in`, `check_in`), en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`. Revisa también los cambios pendientes con `git status`.
   - Si no hay nada: es una feature nueva, sigue en el paso 1.
   - Si hay archivos, determina el último paso completado:
     - Hay spec y nada más: falta la aprobación de la spec (o el paso 2/3 si el dueño ya la aprobó).
     - Hay spec + UX sin ADR: sigue en el paso 3.
     - Hay ADR: revisa su plan de tareas contra el código y los cambios pendientes para ver qué tareas faltan; sigue en el paso 4 solo con esas tareas.
     - Hay informe en `docs/qa/` RECHAZADO: sigue en el paso 4 con los bugs del informe. APROBADO: sigue en el paso 6.
   - Antes de lanzar nada, muestra al dueño en 3-5 líneas: qué archivos encontraste, en qué paso está la feature y desde dónde propones seguir. **Detente y espera su confirmación.**
   - Si hay varias features con nombre parecido, pregunta cuál es. Nunca relances el `product-owner` sobre una spec existente salvo que el dueño pida cambiarla: en ese caso pásale la spec actual y los cambios pedidos.

1. **Especificación**: lanza `product-owner` con la descripción.
   Muestra al dueño un resumen de `docs/specs/<feature>.md` y las preguntas abiertas.
   **Detente y espera aprobación.** Si pide cambios, vuelve a lanzar `product-owner` con ellos.

2. **Diseño UX** (solo si la feature tiene interfaz): lanza `ux-designer` con la ruta de la spec aprobada.
   Usa los comandos de `ui-ux-pro-max` y produce `docs/ux/<feature>.md` (+ `design-system/<proyecto>/MASTER.md` si no existía).
   Si deja preguntas abiertas, muéstralas al dueño antes de seguir.

3. **Diseño técnico**: lanza `architect` con la spec aprobada y, si existe, `docs/ux/<feature>.md`.
   Muestra al dueño el resumen UX (flujos, pantallas, design system) junto a la decisión, los contratos y el plan de tareas.
   **Detente y espera aprobación** (cubre UX + ADR). Si pide cambios de UX, vuelve a lanzar `ux-designer` y luego `architect`.

4. **Implementación**: lanza `backend-dev` y/o `frontend-dev` según el plan del ADR. `frontend-dev` recibe también `docs/ux/<feature>.md`.
   Si las tareas no comparten archivos, pueden ir en paralelo; si dependen entre sí, backend primero.

5. **QA**: lanza `qa-engineer`.
   Si el veredicto es RECHAZADO, devuelve los bugs al dev correspondiente y repite QA (máximo 3 vueltas; luego escala al dueño).

6. **Revisión**: lanza `code-reviewer`.
   Si hay hallazgos Bloqueantes, devuelve al dev y repite la revisión.

7. **Cierre**: actualiza el README del proyecto si corresponde y entrega al dueño un resumen de 5 líneas: qué se hizo, archivos clave, tests, riesgos pendientes.

Reglas:
- No avances sin el archivo de salida del paso anterior.
- Al retomar, nunca rehagas un paso cuyo archivo ya existe sin que el dueño lo pida.
- No hagas commit ni push sin autorización explícita del dueño.
