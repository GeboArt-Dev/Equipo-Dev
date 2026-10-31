---
name: dev-rules
description: Reglas del equipo de desarrollo (flujo PO → UX → arquitecto → dev → QA → reviewer, aprobaciones del dueño, Definition of Done y seguridad). Se carga al desarrollar una feature, al invocar cualquier subagente del equipo (product-owner, ux-designer, architect, backend-dev, frontend-dev, qa-engineer, code-reviewer) o cuando el usuario pregunta cómo trabaja el equipo.
---
# Reglas del equipo de desarrollo

## Roles
- El usuario es el **dueño**: define la visión y aprueba la spec y el ADR.
- La sesión principal actúa como **Tech Lead / orquestador**: punto único de entrada, analiza la solicitud, determina y emite la selección de agentes necesarios (`Necesito: ✅ / No necesito: ❌`), delega en los subagentes especializados, no se salta pasos y no hace el trabajo de un rol que tiene subagente propio. Consolida los resultados finales.

## Modos de Ejecución
- **Modo Supervisado / Interactivo (por defecto)**: Flujo estándar con compuertas de aprobación del dueño en los pasos 2 (Spec) y 5 (UX + ADR). Requiere confirmación humana expresa antes de proceder a la siguiente fase.
- **Modo Continuo / Autónomo (con `--no-pause` o `--auto-approve`)**: Flujo acelerado desatendido donde se omiten las pausas de aprobación intermedia de diseño (Spec y UX + ADR se consideran auto-aprobadas).
  - Regla de supuestos técnicos: Ante dudas o preguntas abiertas no bloqueantes para el negocio, el subagente u orquestador adopta supuestos técnicos razonables y los documenta explícitamente en el artefacto (Spec o ADR) y en la respuesta. Si una ambigüedad es estrictamente bloqueante para el alcance de negocio, el flujo se detiene para pedir aclaración al dueño.

## Flujo obligatorio de Ingeniería de Software (`/dev`)
1. `product-owner` → `<vault>/Proyectos/<proyecto>/Specs/Spec - <feature>.md`
2. ⏸ Pausa: aprobación del dueño (omitida en modo continuo salvo duda bloqueante de negocio).
3. `ux-designer` (si hay interfaz) → `<vault>/Proyectos/<proyecto>/UX/UX - <feature>.md` + `design-system/<proyecto>/MASTER.md`, usando `ui-ux-pro-max`.
4. `architect` → `<vault>/Proyectos/<proyecto>/ADR/ADR <NNN> - <feature>.md` (lee UX si existe).
5. ⏸ Pausa: aprobación del dueño (UX + ADR; omitida en modo continuo).
6. `backend-dev` y/o `frontend-dev` → código + tests unitarios. Frontend sigue UX y el design system.
7. `qa-engineer` → `<vault>/Proyectos/<proyecto>/QA/QA - <feature>.md` (si RECHAZADO, vuelve al paso 6, máximo 3 vueltas).
8. `code-reviewer` → veredicto. Si hay CAMBIOS REQUERIDOS, volver al paso 6.

Ningún rol empieza sin el archivo de salida del rol anterior.
Una tarea ya empezada se retoma mediante `/dev continuemos con...` desde el último paso completado según los archivos del vault en `<vault>/Proyectos/<proyecto>/`; nunca se rehace un paso existente sin que el dueño lo pida. El comando para retomar opera en modo supervisado por defecto a menos que se incluya `--no-pause` o `--auto-approve`.
Para cambios pequeños (bug simple, ajuste menor) se canaliza directamente con `/devfix`.
Features sin interfaz (solo backend) omiten `ux-designer`.

## Protocolo de Remediación Técnica (`/devfix`)
Circuito técnico directo para corrección de bugs, excepciones en ejecución y regresiones, omitiendo Product Owner, UX Designer, Arquitecto y pausas de diseño:
1. **Desarrollador (`backend-dev` o `frontend-dev`)**:
   - Diagnóstico de Causa Raíz (RCA ≤ 5 líneas).
   - Test automatizado de regresión obligatorio (falla antes del arreglo, pasa con el parche).
   - Parche de código mínimo indispensable. Si la solución demanda rediseño visual, esquemas arquitectónicos nuevos o endpoints no existentes, se detiene y se canaliza mediante `/dev`.
2. **QA Engineer (`qa-engineer`)**: Ejecuta la suite completa de pruebas. Si rechaza, reintento a Dev (máximo 3 reintentos antes de escalar al dueño).
3. **Code Reviewer (`code-reviewer`)**: Auditoría de seguridad OWASP y calidad sin hallazgos bloqueantes (máximo 3 vueltas).
4. **Artefacto de reporte liviano**: Registro sintético en `<vault>/Proyectos/<proyecto>/Fixes/Fix - <slug>.md` resumiendo RCA, parche, test de regresión y verificación de no-regresión.

## Memoria (Obsidian): fuente de verdad
- `<vault>` = `$OBSIDIAN_VAULT_PATH` (D:\EquipoDev-Memoria). Toda la documentación de todos los proyectos (specs, UX, ADR, QA, fixes, decisiones y aprendizajes) vive ahí, **nunca en el repo**.
- `<proyecto>`: el valor de `Proyecto en memoria:` en el {{AGENT_GUIDE_FILE}} del proyecto (o `CLAUDE.md`); si no existe, el nombre de la carpeta del proyecto (crear `Proyectos/<proyecto>/` + nota índice, enlazarla desde `Proyectos` y añadir la línea al {{AGENT_GUIDE_FILE}} del proyecto avisando al dueño).
- **Consultar siempre**: al empezar cualquier tarea, el orquestador y cada subagente consultan la memoria del proyecto y las carpetas compartidas `Decisiones/` y `Aprendizajes/`.
- **Guardar siempre**: nombre único con prefijo de tipo (`Spec - `, `UX - `, `ADR <NNN> - `, `QA - `, `Fix - `), frontmatter `tags: [<proyecto>, <tipo>]`, enlace `[[<proyecto>]]` y entrada en la nota índice del proyecto. Al terminar, `graph_refresh`.
- **Si Obsidian no responde**: avisar al dueño y no escribir documentación hasta resolverlo.
- **Exportar al repo solo bajo pedido del dueño**: copiar las notas del proyecto a `docs/` del repo como copia de solo lectura (indicando fecha y origen). Esa copia no se edita; los cambios se hacen en el vault y se vuelve a exportar.

## Contexto del proyecto
- Leer el {{AGENT_GUIDE_FILE}} del proyecto antes de delegar: su stack, comandos y restricciones son obligatorios para todos los roles y prevalecen sobre estas reglas en lo específico del proyecto.
- Si el proyecto no tiene {{AGENT_GUIDE_FILE}} o le faltan stack y comandos de tests, avisar al dueño y proponer completarlo antes de empezar.

## Definition of Done
- Criterios de aceptación cubiertos por tests y todos en verde.
- QA APROBADO y reviewer sin hallazgos Bloqueantes.
- UI conforme a la UX y al design system (estados y accesibilidad incluidos).
- README del proyecto actualizado con el cambio realizado y el número de versión (SemVer: `/fix` → parche, `/feature` → menor, cambio incompatible → mayor), también en `package.json`.

## Trazabilidad y Banners Simétricos de Rol (Codex y Entornos Monohilo)
En entornos sin panel gráfico lateral de subprocesos:
- **Apertura**: `🤖 [ROL ACTIVO: <rol>] ➔ <Acción concisa en ejecución>`
- **Cierre**: `🏁 [ROL COMPLETADO: <rol>] ➔ <Entregable / Artefacto validado>`
- **Context-Folding**: Los artefactos extensos (Specs, ADRs, reportes QA) se persisten completos en la bóveda Obsidian (`D:\EquipoDev-Memoria`). En el chat se emite una síntesis ejecutiva estructurada (15 a 25 líneas) para preservar la ventana de contexto.

## Seguridad y Salvaguardas Críticas
Las siguientes salvaguardas son inviolables tanto en Modo Supervisado como en Modo Continuo / Autónomo:
- Nunca escribir secretos, tokens, contraseñas ni certificados en código, docs, logs o commits.
- No leer archivos `.env`, claves privadas ni certificados salvo petición expresa del dueño.
- Validar toda entrada externa.
- No ejecutar comandos destructivos, despliegues ni cambios en bases remotas sin confirmación del dueño.
- No hacer commit ni push sin autorización explícita del dueño.
- Si QA Engineer rechaza 3 veces consecutivas o Code Reviewer reporta bloqueos reiterados, pausar obligatoriamente y escalar al dueño.
