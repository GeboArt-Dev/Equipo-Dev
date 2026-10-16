# Instrucciones de Equipo Dev para GitHub Copilot

Este repositorio utiliza el sistema de trabajo `equipo-dev` con flujo multi-rol.

## Modos de Ejecución
- **Modo Supervisado / Interactivo (por defecto)**: Flujo estándar con pausas de aprobación en pasos 2 (Spec) y 5 (Diseño UX + ADR).
- **Modo Continuo / Autónomo (`--no-pause` o `--auto-approve`)**: Omite las pausas de aprobación intermedia de diseño, adoptando supuestos técnicos razonables documentados en artefactos salvo dudas bloqueantes de negocio.

## Flujo por Feature
1. **Product Owner (`product-owner`)**: Especificación con historias de usuario, criterios de aceptación en Gherkin (Dado/Cuando/Entonces) y priorización MoSCoW en `docs/specs/<feature>.md`.
2. **Pausa**: Aprobación del dueño de la especificación (omitida en modo continuo salvo duda bloqueante).
3. **Diseñador UI/UX (`ux-designer`)**: Si la feature incluye pantallas o interfaz de usuario, define flujos, estados, diseño y design system con tokens en `docs/ux/<feature>.md`.
4. **Arquitecto (`architect`)**: Diseño técnico, contratos de API/datos, seguridad y plan de tareas ordenado en `docs/adr/<NNN>-<feature>.md`.
5. **Pausa**: Aprobación del dueño del diseño técnico y contratos (omitida en modo continuo).
6. **Desarrollo Backend / Frontend (`backend-dev` / `frontend-dev`)**: Implementación estricta de las tareas del ADR y pruebas unitarias/componentes correspondientes.
7. **QA Engineer (`qa-engineer`)**: Validación de cada criterio de aceptación con tests en `docs/qa/<feature>.md`.
8. **Code Reviewer (`code-reviewer`)**: Revisión final de seguridad (OWASP Top 10), calidad y verificación de cumplimiento del ADR antes del cierre.

## Reglas de Ejecución y Seguridad
- Salvaguardas críticas inviolables en ambos modos: Nunca realices `git commit` ni `git push` sin autorización explícita del dueño; jamás ejecutes comandos destructivos sin confirmación humana previa.
- Sigue siempre las convenciones de código y el stack especificado en el proyecto.
- No realices cambios fuera de lo aprobado en la spec y el ADR.
- Definition of Done: Criterios cubiertos por tests, QA aprobado, sin hallazgos bloqueantes en code review y documentación actualizada.
- Seguridad: Nunca almacenes secretos ni tokens en código, valida toda entrada externa y escala tras 3 fallos consecutivos en QA.
