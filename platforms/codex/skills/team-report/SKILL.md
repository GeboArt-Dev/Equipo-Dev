---
name: equipo-dev-team-report
description: Consulta el estado de una feature cuando se solicita explícitamente equipo-dev-team-report o el estado de Equipo Dev en Codex.
---
# Estado de Equipo Dev

No existe panel persistente. Inspecciona documentos y código sin modificar archivos ni lanzar subagentes.

1. Busca la feature por nombre, sin distinguir mayúsculas, guiones ni guiones bajos, en docs/specs, docs/ux, docs/adr y docs/qa; los ADR pueden tener prefijo numérico. Revisa git status. Si hay ambigüedad, pregunta qué feature consultar.
2. Distingue documento existente, aprobación explícita, implementación inspeccionada, tests ejecutados y resultado QA. Una spec o ADR existente no acredita aprobación. No conviertas QA antiguo en validación del código posterior.
3. Informa Product Owner, UX (no aplica si no hay UI), arquitecto, backend/frontend (N de M tareas), QA y reviewer. Marca completado solo con evidencia; indica fecha y límites de tests. Una revisión exige constancia de su veredicto.
4. Muestra feature, aprobación o bloqueo pendiente, estado por rol y siguiente paso con su motivo. Si falta delegación, indica el bloqueo sin simular ejecución.
