---
name: team-report
description: Consulta el estado documental de una feature o fix en VS Code.
---
# Estado del equipo

No existe panel persistente en este adaptador. Inspecciona documentos y código sin modificar archivos ni lanzar subagentes.
Busca la feature en docs/specs, docs/ux, docs/adr, docs/qa y docs/fixes, y revisa git status. Si hay ambigüedad, pregunta qué feature consultar.
Distingue documentos existentes, aprobación explícita o modo continuo aprobado, implementación inspeccionada, tests ejecutados y veredictos de QA/reviewer. Un documento antiguo no demuestra validación del código actual.
Informa modo y estado por rol, pruebas con fecha y límites, aprobación o bloqueo pendiente y siguiente paso. En FIX solo corresponde Dev → QA → Reviewer; en features sin interfaz UX no aplica.
