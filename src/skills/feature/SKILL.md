---
name: feature
description: Ejecuta o retoma el flujo del equipo para una feature (PO → UX → arquitecto → dev → QA → reviewer) con pausas de aprobación del dueño. Úsalo cuando el usuario escriba /feature, pida desarrollar una funcionalidad nueva con el equipo o quiera continuar una feature ya empezada.
---
# Flujo /feature

Argumento: `[--no-pause | --auto-approve]` seguido de la descripción de la feature en lenguaje natural, o el nombre de una feature ya empezada ("continuemos con CheckIn").

## ⚠️ PROTOCOLO DE DESPACHO OBLIGATORIO (SUBAGENT HANDOFF)
Si eres el agente principal/asistente raíz de la conversación y dispones de herramientas de subagentes (`invoke_subagent`):
1. **TIENES ESTRICTAMENTE PROHIBIDO** implementar código, crear specs o saltarte las etapas directamente en el hilo principal.
2. **DEBES invocar inmediatamente al subagente correspondiente** mediante `invoke_subagent` (comenzando por `product-owner` para nuevas features).
3. Cede el control del paso a cada subagente especialista.

## Modos de Ejecución
- **Modo Continuo / Autónomo**: Se activa si el comando contiene los modificadores `--no-pause` o `--auto-approve` (insensible a mayúsculas/minúsculas, en cualquier posición). Extrae el flag de la descripción para obtener la descripción neta de la feature. Omite las pausas de aprobación de diseño humano de Spec (Pausa 1) y de Diseño UX + ADR (Pausa 2).
- **Modo Supervisado / Interactivo**: Es el comportamiento predeterminado si no se incluye ninguno de los flags anteriores. Requiere confirmación humana en el paso 1 (Spec) y en el paso 3 (UX + ADR).

Al arrancar, emite obligatoriamente en la cabecera (primera o segunda línea):
- Modo continuo: `Modo: Continuo / Autónomo (aprobaciones de diseño desactivadas)`
- Modo supervisado: `Modo: Supervisado / Interactivo (aprobaciones estándar activadas)`

Antes de empezar, carga la skill `dev-rules` y aplícala. {{SUBAGENT_DISPATCH_GUIDE}}

0. **Retomar antes de empezar** (siempre, antes de lanzar ningún subagente):
   - Al retomar (`/feature continuemos con...`), el flujo opera en **Modo Supervisado** por defecto, a menos que el usuario incluya explícitamente `--no-pause` o `--auto-approve`.
   - Busca archivos de la feature por nombre, sin distinguir mayúsculas ni guiones (`checkin`, `check-in`, `check_in`), en el vault `<vault>/Proyectos/<proyecto>/` (subcarpetas `Specs/`, `UX/`, `ADR/` y `QA/`) o en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`. Revisa también los cambios pendientes con `git status`.
   - Si no hay nada: es una feature nueva, sigue en el paso 1.
   - Si hay archivos, determina el último paso completado:
     - Hay spec y nada más: falta la aprobación de la spec (en modo continuo se asume auto-aprobada salvo duda bloqueante; en modo supervisado se espera confirmación).
     - Hay spec + UX sin ADR: sigue en el paso 3.
     - Hay ADR: revisa su plan de tareas contra el código y los cambios pendientes para ver qué tareas faltan; sigue en el paso 4 solo con esas tareas.
     - Hay informe en `QA/` o `docs/qa/` RECHAZADO: sigue en el paso 4 con los bugs del informe. APROBADO: sigue en el paso 6.
   - Muestra al dueño en 3-5 líneas: qué archivos encontraste, en qué paso está la feature y desde dónde propones seguir. En modo supervisado: **Detente y espera aprobación** o confirmación del dueño. En modo continuo: procede directamente a menos que falte información bloqueante.
   - Si hay varias features con nombre parecido, pregunta cuál es. Nunca relances el `product-owner` sobre una spec existente salvo que el dueño pida cambiarla: en ese caso pásale la spec actual y los cambios pedidos.

1. **Especificación**: lanza `product-owner` con la descripción neta.
   - Salida: `<vault>/Proyectos/<proyecto>/Specs/Spec - <feature>.md`.
   - **Modo Supervisado**: Muestra al dueño un resumen de `<vault>/Proyectos/<proyecto>/Specs/Spec - <feature>.md` (o `docs/specs/<feature>.md`) y las preguntas abiertas. **Detente y espera aprobación.** Si pide cambios, vuelve a lanzar `product-owner` con ellos.
   - **Modo Continuo**: Revisa las preguntas abiertas de la spec. Si existen dudas bloqueantes para el alcance de negocio, detén el flujo y solicita aclaración (`⏸ Esperando aclaración de alcance...`). Si no hay dudas o son decisiones técnicas no bloqueantes, adopta supuestos técnicos razonables más simples, documéntalos en la respuesta y en la spec, y avanza inmediatamente al paso 2 (o al paso 3 si no hay interfaz) sin detenerte.

2. **Diseño UX** (solo si la feature tiene interfaz): lanza `ux-designer` con la ruta de la spec aprobada.
   Usa los comandos de `ui-ux-pro-max` y produce `<vault>/Proyectos/<proyecto>/UX/UX - <feature>.md` (o `docs/ux/<feature>.md`) (+ `design-system/<proyecto>/MASTER.md` si no existía).
   Si deja preguntas abiertas: en modo supervisado muéstralas al dueño antes de seguir; en modo continuo, adopta supuestos técnicos razonables y documéntalos.

3. **Diseño técnico**: lanza `architect` con la spec aprobada y, si existe, el diseño UX.
   Salida: `<vault>/Proyectos/<proyecto>/ADR/ADR <NNN> - <feature>.md` (o `docs/adr/<NNN>-<feature>.md`).
   - **Modo Supervisado**: Muestra al dueño el resumen UX (flujos, pantallas, design system) junto a la decisión, los contratos y el plan de tareas. **Detente y espera aprobación** (cubre UX + ADR). Si pide cambios de UX, vuelve a lanzar `ux-designer` y luego `architect`.
   - **Modo Continuo**: Omite la pausa (UX y ADR auto-aprobados) y avanza inmediatamente al paso 4 (implementación). Documenta cualquier supuesto técnico adoptado en el ADR y en el mensaje.

4. **Implementación**: lanza `backend-dev` y/o `frontend-dev` según el plan del ADR. `frontend-dev` recibe también el diseño UX.
   Si las tareas no comparten archivos, pueden ir en paralelo; si dependen entre sí, backend primero.

5. **QA**: lanza `qa-engineer`.
   Salida: `<vault>/Proyectos/<proyecto>/QA/QA - <feature>.md` (o `docs/qa/<feature>.md`).
   Si el veredicto es RECHAZADO, devuelve los bugs al dev correspondiente y repite QA (máximo 3 vueltas; luego escala al dueño).

6. **Revisión**: lanza `code-reviewer`.
   Si hay hallazgos Bloqueantes, devuelve al dev y repite la revisión (máximo 3 vueltas; luego escala al dueño).

7. **Cierre y Definición de Terminado (DoD)**:
   - Actualiza el `README.md` del proyecto y el número de versión en `package.json` aplicando SemVer (menor para `/feature`, mayor si hay cambios incompatibles).
   - En la memoria (Obsidian): añade enlace a la nota índice `[[<proyecto>]]`, agrega tags `[<proyecto>, feature]` y ejecuta `graph_refresh`. Si Obsidian no responde, avisa al dueño y no escribas documentación en el repo.
   - Entrega al dueño un resumen de 5 líneas: qué se hizo, archivos clave, tests, versión actualizada y riesgos pendientes.

Reglas y Salvaguardas:
- No avances sin el archivo de salida del paso anterior.
- Al retomar, nunca rehagas un paso cuyo archivo ya existe sin que el dueño lo pida.
- Salvaguardas críticas de seguridad (inviolables en modo supervisado y en modo continuo):
  - Nunca hagas commit ni push sin autorización explícita del dueño.
  - Nunca ejecutes comandos destructivos (borrado de datos, rm, drop table, migraciones destructivas) sin confirmación humana previa.
  - Al 3er fallo consecutivo de QA o hallazgos bloqueantes reiterados en Code Reviewer, detén el flujo y escala inmediatamente al dueño.

## Memoria (Obsidian): fuente de verdad
- `<vault>` = `$OBSIDIAN_VAULT_PATH` (D:\EquipoDev-Memoria). Toda la documentación de todos los proyectos vive ahí, nunca en el repo.
- `<proyecto>`: valor de `Proyecto en memoria:` en {{AGENT_GUIDE_FILE}}; si no existe, nombre de la carpeta del proyecto (crear `Proyectos/<proyecto>/` + nota índice, enlazarla desde `Proyectos` y añadir la línea al {{AGENT_GUIDE_FILE}} avisando al dueño).
- Consultar siempre: al empezar cualquier tarea, el orquestador y cada subagente consultan la memoria del proyecto (`graph_query_related` sobre `<proyecto>`) y las carpetas compartidas `Decisiones/` y `Aprendizajes/`.
- Guardar siempre: nombre único con prefijo de tipo (`Spec - `, `UX - `, `ADR <NNN> - `, `QA - `), frontmatter `tags: [<proyecto>, <tipo>]`, enlace `[[<proyecto>]]` y entrada en la nota índice del proyecto. Al terminar, `graph_refresh`.
- Si Obsidian no responde, avisar al dueño y no escribir documentación hasta resolverlo.
- Exportar al repo solo bajo pedido del dueño: copia de solo lectura a `docs/` con fecha y origen (no se edita en el repo, se actualiza en el vault y se vuelve a exportar).
