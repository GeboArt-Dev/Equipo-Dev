---
name: equipo-dev-team-report
description: Consulta el estado de una feature o fix cuando se solicita explícitamente equipo-dev-team-report o el estado de Equipo Dev en Codex.
---
# Estado de Equipo Dev

No existe panel persistente. Inspecciona documentos y código sin modificar archivos ni lanzar subagentes.

0. Si se solicita o detecta una remediación técnica en docs/fixes o invocación de fix, reporta Tipo: FIX y modo de Remediación directa (Dev -> QA -> Reviewer), ocultando Product Owner, UX y Arquitecto y suprimiendo compuertas de diseño para desplegar únicamente el circuito técnico activo (Dev, QA, Reviewer).
1. Busca la feature por nombre, sin distinguir mayúsculas, guiones ni guiones bajos, en docs/specs, docs/ux, docs/adr y docs/qa; los ADR pueden tener prefijo numérico. Revisa git status. Si hay ambigüedad, pregunta qué feature consultar.
2. Determina el modo de ejecución (Supervisado por defecto vs Continuo / Autónomo con flags `--no-pause` o `--auto-approve`). Distingue documento existente, aprobación explícita vs auto-aprobada, implementación inspeccionada, tests ejecutados y resultado QA. En modo supervisado, una spec o ADR existente no acredita aprobación. No conviertas QA antiguo en validación del código posterior.
3. Informa Product Owner, UX (no aplica si no hay UI), arquitecto, backend/frontend (N de M tareas), QA y reviewer. Marca completado solo con evidencia; indica fecha y límites de tests. Una revisión exige constancia de su veredicto.
4. Muestra feature, modo activo (`Supervisado / Interactivo` o `Continuo / Autónomo`), aprobación o bloqueo pendiente (omitida en modo continuo salvo duda bloqueante o seguridad), estado por rol y siguiente paso con su motivo. Si falta delegación, indica el bloqueo sin simular ejecución.
