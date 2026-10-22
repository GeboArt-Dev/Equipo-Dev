---
name: feature
description: Ejecuta o retoma el flujo del equipo para una feature (PO → UX → arquitecto → dev → QA → reviewer) con pausas de aprobación del dueño. Úsalo cuando el usuario escriba /feature, pida desarrollar una funcionalidad nueva con el equipo o quiera continuar una feature ya empezada.
---
# Flujo /feature

Argumento: `[--no-pause | --auto-approve]` seguido de la descripción de la feature en lenguaje natural, o el nombre de una feature ya empezada ("continuemos con CheckIn").

## Modos de Ejecución
- **Modo Continuo / Autónomo**: Se activa si el comando contiene los modificadores `--no-pause` o `--auto-approve` (insensible a mayúsculas/minúsculas, en cualquier posición). Extrae el flag de la descripción para obtener la descripción neta de la feature. Omite las pausas de aprobación de diseño humano de Spec (Pausa 1) y de Diseño UX + ADR (Pausa 2).
- **Modo Supervisado / Interactivo**: Es el comportamiento predeterminado si no se incluye ninguno de los flags anteriores. Requiere confirmación humana en el paso 1 (Spec) y en el paso 3 (UX + ADR).

Al arrancar, emite obligatoriamente en la cabecera (primera o segunda línea):
- Modo continuo: `Modo: Continuo / Autónomo (aprobaciones de diseño desactivadas)`
- Modo supervisado: `Modo: Supervisado / Interactivo (aprobaciones estándar activadas)`

Antes de empezar, carga la skill `team-rules` y aplícala. {{SUBAGENT_DISPATCH_GUIDE}}

0. **Retomar antes de empezar** (siempre, antes de lanzar ningún subagente):
   - Al retomar (`/feature continuemos con...`), el flujo opera en **Modo Supervisado** por defecto, a menos que el usuario incluya explícitamente `--no-pause` o `--auto-approve`.
   - Busca archivos de la feature por nombre, sin distinguir mayúsculas ni guiones (`checkin`, `check-in`, `check_in`), en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`. Revisa también los cambios pendientes con `git status`.
   - Si no hay nada: es una feature nueva, sigue en el paso 1.
   - Si hay archivos, determina el último paso completado:
     - Hay spec y nada más: falta la aprobación de la spec (en modo continuo se asume auto-aprobada salvo duda bloqueante; en modo supervisado se espera confirmación).
     - Hay spec + UX sin ADR: sigue en el paso 3.
     - Hay ADR: revisa su plan de tareas contra el código y los cambios pendientes para ver qué tareas faltan; sigue en el paso 4 solo con esas tareas.
     - Hay informe en `docs/qa/` RECHAZADO: sigue en el paso 4 con los bugs del informe. APROBADO: sigue en el paso 6.
   - Muestra al dueño en 3-5 líneas: qué archivos encontraste, en qué paso está la feature y desde dónde propones seguir. En modo supervisado: **Detente y espera aprobación** o confirmación del dueño. En modo continuo: procede directamente a menos que falte información bloqueante.
   - Si hay varias features con nombre parecido, pregunta cuál es. Nunca relances el `product-owner` sobre una spec existente salvo que el dueño pida cambiarla: en ese caso pásale la spec actual y los cambios pedidos.

1. **Especificación**: lanza `product-owner` con la descripción neta.
   - **Modo Supervisado**: Muestra al dueño un resumen de `docs/specs/<feature>.md` y las preguntas abiertas. **Detente y espera aprobación.** Si pide cambios, vuelve a lanzar `product-owner` con ellos.
   - **Modo Continuo**: Revisa las preguntas abiertas de la spec. Si existen dudas bloqueantes para el alcance de negocio, detén el flujo y solicita aclaración (`⏸ Esperando aclaración de alcance...`). Si no hay dudas o son decisiones técnicas no bloqueantes, adopta supuestos técnicos razonables más simples, documéntalos en la respuesta y en la spec, y avanza inmediatamente al paso 2 (o al paso 3 si no hay interfaz) sin detenerte.

2. **Diseño UX** (solo si la feature tiene interfaz): lanza `ux-designer` con la ruta de la spec aprobada.
   Usa los comandos de `ui-ux-pro-max` y produce `docs/ux/<feature>.md` (+ `design-system/<proyecto>/MASTER.md` si no existía).
   Si deja preguntas abiertas: en modo supervisado muéstralas al dueño antes de seguir; en modo continuo, adopta supuestos técnicos razonables y documéntalos.

3. **Diseño técnico**: lanza `architect` con la spec aprobada y, si existe, `docs/ux/<feature>.md`.
   - **Modo Supervisado**: Muestra al dueño el resumen UX (flujos, pantallas, design system) junto a la decisión, los contratos y el plan de tareas. **Detente y espera aprobación** (cubre UX + ADR). Si pide cambios de UX, vuelve a lanzar `ux-designer` y luego `architect`.
   - **Modo Continuo**: Omite la pausa (UX y ADR auto-aprobados) y avanza inmediatamente al paso 4 (implementación). Documenta cualquier supuesto técnico adoptado en el ADR y en el mensaje.

4. **Implementación**: lanza `backend-dev` y/o `frontend-dev` según el plan del ADR. `frontend-dev` recibe también `docs/ux/<feature>.md`.
   Si las tareas no comparten archivos, pueden ir en paralelo; si dependen entre sí, backend primero.

5. **QA**: lanza `qa-engineer`.
   Si el veredicto es RECHAZADO, devuelve los bugs al dev correspondiente y repite QA (máximo 3 vueltas; luego escala al dueño).

6. **Revisión**: lanza `code-reviewer`.
   Si hay hallazgos Bloqueantes, devuelve al dev y repite la revisión (máximo 3 vueltas; luego escala al dueño).

7. **Cierre**: actualiza el README del proyecto si corresponde y entrega al dueño un resumen de 5 líneas: qué se hizo, archivos clave, tests, riesgos pendientes.

Reglas y Salvaguardas:
- No avances sin el archivo de salida del paso anterior.
- Al retomar, nunca rehagas un paso cuyo archivo ya existe sin que el dueño lo pida.
- Salvaguardas críticas de seguridad (inviolables en modo supervisado y en modo continuo):
  - Nunca hagas commit ni push sin autorización explícita del dueño.
  - Nunca ejecutes comandos destructivos (borrado de datos, rm, drop table, migraciones destructivas) sin confirmación humana previa.
  - Al 3er fallo consecutivo de QA o hallazgos bloqueantes reiterados en Code Reviewer, detén el flujo y escala inmediatamente al dueño.

## Memoria de largo plazo (opcional)

Antes de convocar a `product-owner`, `architect` y `code-reviewer`, indícales que consulten la memoria del equipo (ver `team-rules`, sección «Memoria del equipo (Obsidian)»). Al **cerrar la feature**, tras el informe final, el orquestador registra una nota en el vault (decisiones clave del ADR, hallazgos del reviewer y aprendizajes) con wikilinks y llama a `graph_refresh`. Si la memoria no está instalada o no responde, omite este paso sin bloquear el flujo.
