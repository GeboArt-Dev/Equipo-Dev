# Instrucciones de Equipo Dev para GitHub Copilot

Este repositorio utiliza el sistema de trabajo `equipo-dev` con flujo multi-rol.

## Flujo por Feature
1. **Product Owner (`product-owner`)**: Especificación con historias de usuario, criterios de aceptación en Gherkin (Dado/Cuando/Entonces) y priorización MoSCoW en `docs/specs/<feature>.md`.
2. **Pausa**: Aprobación del dueño de la especificación.
3. **Diseñador UI/UX (`ux-designer`)**: Si la feature incluye pantallas o interfaz de usuario, define flujos, estados, diseño y design system con tokens en `docs/ux/<feature>.md`.
4. **Arquitecto (`architect`)**: Diseño técnico, contratos de API/datos, seguridad y plan de tareas ordenado en `docs/adr/<NNN>-<feature>.md`.
5. **Pausa**: Aprobación del dueño del diseño técnico y contratos.
6. **Desarrollo Backend / Frontend (`backend-dev` / `frontend-dev`)**: Implementación estricta de las tareas del ADR y pruebas unitarias/componentes correspondientes.
7. **QA Engineer (`qa-engineer`)**: Validación de cada criterio de aceptación con tests en `docs/qa/<feature>.md`.
8. **Code Reviewer (`code-reviewer`)**: Revisión final de seguridad (OWASP Top 10), calidad y verificación de cumplimiento del ADR antes del cierre.

## Reglas de Ejecución
- Sigue siempre las convenciones de código y el stack especificado en el proyecto.
- No realices cambios fuera de lo aprobado en la spec y el ADR.
- Definition of Done: Criterios cubiertos por tests, QA aprobado, sin hallazgos bloqueantes en code review y documentación actualizada.
- Seguridad: Nunca almacenes secretos ni tokens en código, valida toda entrada externa y no ejecutes comandos destructivos sin confirmación.
