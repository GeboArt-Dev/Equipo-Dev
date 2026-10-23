# Instrucciones de Equipo Dev para GitHub Copilot

Este repositorio utiliza el sistema de trabajo `equipo-dev` con flujo multi-rol.

## Modos de Ejecución
- **Modo Supervisado / Interactivo (por defecto)**: Flujo estándar con pausas de aprobación en pasos 2 (Spec) y 5 (Diseño UX + ADR).
- **Modo Continuo / Autónomo (`--no-pause` o `--auto-approve`)**: Omite las pausas de aprobación intermedia de diseño, adoptando supuestos técnicos razonables documentados en artefactos salvo dudas bloqueantes de negocio.

## Flujo por Feature (/feature)
1. **Product Owner (`product-owner`)**: Especificación con historias de usuario, criterios de aceptación en Gherkin (Dado/Cuando/Entonces) y priorización MoSCoW en `docs/specs/<feature>.md`.
2. **Pausa**: Aprobación del dueño de la especificación (omitida en modo continuo salvo duda bloqueante).
3. **Diseñador UI/UX (`ux-designer`)**: Si la feature incluye pantallas o interfaz de usuario, define flujos, estados, diseño y design system con tokens en `docs/ux/<feature>.md`.
4. **Arquitecto (`architect`)**: Diseño técnico, contratos de API/datos, seguridad y plan de tareas ordenado en `docs/adr/<NNN>-<feature>.md`.
5. **Pausa**: Aprobación del dueño del diseño técnico y contratos (omitida en modo continuo).
6. **Desarrollo Backend / Frontend (`backend-dev` / `frontend-dev`)**: Implementación estricta de las tareas del ADR y pruebas unitarias/componentes correspondientes.
7. **QA Engineer (`qa-engineer`)**: Validación de cada criterio de aceptación con tests en `docs/qa/<feature>.md`.
8. **Code Reviewer (`code-reviewer`)**: Revisión final de seguridad (OWASP Top 10), calidad y verificación de cumplimiento del ADR antes del cierre.

## Protocolo de Remediación Rápida (`/fix`)
Circuito técnico directo para bugs, excepciones y regresiones (`/fix <descripción o traza>`):
1. Omite etapas de Product Owner, UX Designer y Arquitecto y pausas de diseño.
2. **Desarrollador (`backend-dev` / `frontend-dev`)**: Formulación de Causa Raíz (RCA ≤ 5 líneas), test automatizado de regresión obligatorio (rojo a verde) y parche mínimo indispensable.
3. **QA Engineer**: Valida con la suite completa de pruebas (máximo 3 reintentos antes de escalar al dueño).
4. **Code Reviewer**: Auditoría de seguridad OWASP y calidad (máximo 3 reintentos).
5. **Artefacto sintético**: Registro documental ligero en `<vault>/Proyectos/<proyecto>/Fixes/Fix - <slug>.md` (sustituye a `docs/fixes/<slug>.md`).

## Memoria (Obsidian): fuente de verdad
- `<vault>` = `$OBSIDIAN_VAULT_PATH` (D:\EquipoDev-Memoria). Toda la documentación de todos los proyectos vive ahí, nunca en el repo.
- `<proyecto>`: valor de `Proyecto en memoria:` en `.github/copilot-instructions.md`; si no existe, nombre de la carpeta del proyecto (crear `Proyectos/<proyecto>/` + nota índice, enlazarla desde `Proyectos` y añadir la línea a `.github/copilot-instructions.md` avisando al dueño).
- Consultar siempre: al empezar cualquier tarea, el orquestador y cada subagente consultan la memoria del proyecto y las carpetas compartidas `Decisiones/` y `Aprendizajes/`.
- Guardar siempre: nombre único con prefijo de tipo (`Spec - `, `UX - `, `ADR <NNN> - `, `QA - `, `Fix - `), frontmatter `tags: [<proyecto>, <tipo>]`, enlace `[[<proyecto>]]` y entrada en la nota índice del proyecto. Al terminar, refrescar memoria (`graph_refresh`).
- Si Obsidian no responde: avisar al dueño y no escribir documentación hasta resolverlo.
- Exportar al repo solo bajo pedido del dueño: copia de solo lectura a `docs/` con fecha y origen (no se edita en el repo, se modifica en el vault y se vuelve a exportar).

## Reglas de Ejecución y Seguridad
- Salvaguardas críticas inviolables en ambos modos y flujos: Nunca realices `git commit` ni `git push` sin autorización explícita del dueño; jamás ejecutes comandos destructivos sin confirmación humana previa.
- Sigue siempre las convenciones de código y el stack especificado en el proyecto.
- No realices cambios fuera de lo aprobado en la spec y el ADR.
- Definition of Done: Criterios cubiertos por tests, QA aprobado, sin hallazgos bloqueantes en code review y README con número de versión actualizado (SemVer: `/fix` parche, `/feature` menor) también en `package.json`.
- Seguridad: Nunca almacenes secretos ni tokens en código, valida toda entrada externa y escala tras 3 fallos consecutivos en QA.
