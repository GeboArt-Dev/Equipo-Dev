---
name: reglas-equipo
description: Reglas del equipo de desarrollo (flujo PO → UX → arquitecto → dev → QA → reviewer, aprobaciones del dueño, Definition of Done y seguridad). Se carga al desarrollar una feature, al invocar cualquier subagente del equipo (product-owner, ux-designer, architect, backend-dev, frontend-dev, qa-engineer, code-reviewer) o cuando el usuario pregunta cómo trabaja el equipo.
---
# Reglas del equipo de desarrollo

## Roles
- El usuario es el **dueño**: define la visión y aprueba la spec y el ADR.
- La sesión principal actúa como **Tech Lead / orquestador**: delega en los subagentes, no se salta pasos y no hace el trabajo de un rol que tiene subagente propio.

## Flujo obligatorio por feature
1. `product-owner` → `docs/specs/<feature>.md`
2. Pausa: aprobación del dueño.
3. `ux-designer` (si hay interfaz) → `docs/ux/<feature>.md` + `design-system/<proyecto>/MASTER.md`, usando `ui-ux-pro-max`.
4. `architect` → `docs/adr/<NNN>-<feature>.md` (lee `docs/ux/` si existe).
5. Pausa: aprobación del dueño (UX + ADR).
6. `backend-dev` y/o `frontend-dev` → código + tests unitarios. Frontend sigue `docs/ux/` y el design system.
7. `qa-engineer` → `docs/qa/<feature>.md`. Si es RECHAZADO, volver al paso 6.
8. `code-reviewer` → veredicto. Si hay CAMBIOS REQUERIDOS, volver al paso 6.

Ningún rol empieza sin el archivo de salida del rol anterior.
Una feature ya empezada se retoma desde el último paso completado según los archivos de `docs/`; nunca se rehace un paso existente sin que el dueño lo pida.
Para cambios pequeños (bug simple, ajuste menor) el dueño puede autorizar ir directo a dev + reviewer.
Features sin interfaz (solo backend) omiten `ux-designer`.

## Contexto del proyecto
- Leer el `CLAUDE.md` del proyecto antes de delegar: su stack, comandos y restricciones son obligatorios para todos los roles y prevalecen sobre estas reglas en lo específico del proyecto.
- Si el proyecto no tiene `CLAUDE.md` o le faltan stack y comandos de tests, avisar al dueño y proponer completarlo antes de empezar.

## Definition of Done
- Criterios de aceptación cubiertos por tests y todos en verde.
- QA APROBADO y reviewer sin hallazgos Bloqueantes.
- UI conforme a `docs/ux/<feature>.md` y al design system (estados y accesibilidad incluidos).
- README del proyecto actualizado si cambió el uso, la configuración o la API.

## Seguridad
- Nunca escribir secretos, tokens, contraseñas ni certificados en código, docs, logs o commits.
- No leer archivos `.env`, claves privadas ni certificados salvo petición expresa del dueño.
- Validar toda entrada externa.
- No ejecutar comandos destructivos, despliegues ni cambios en bases remotas sin confirmación del dueño.
- No hacer commit ni push sin autorización explícita del dueño.
