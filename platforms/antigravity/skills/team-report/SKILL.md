---
name: team-report
description: Muestra el estado del equipo de desarrollo (qué rol trabaja, qué pasos terminaron y si se espera aprobación del dueño). Úsalo cuando el usuario escriba /team-report o pregunte en qué va el equipo o una feature.
---
# Estado del equipo (Antigravity)

En Antigravity no hay panel lateral: arma el estado tú combinando los archivos del proyecto con la bitácora del plugin. No lances subagentes ni modifiques archivos.

Argumento opcional: nombre de la feature o del fix. Si no se da, usa la feature o fix con archivos modificados más recientemente en el vault (`<vault>/Proyectos/<proyecto>/`) o en `docs/`.

0. **Detección de tipo de flujo (FEATURE vs FIX)**:
   - Inspecciona el vault (`<vault>/Proyectos/<proyecto>/Fixes/`), `docs/fixes/` y la bitácora (`bitacora.mjs` o comandos recientes con `/fix`).
   - Si la actividad corresponde a una remediación (`Tipo: FIX`):
     - Oculta completamente las filas de Product Owner, Diseño UX y Arquitecto.
     - Suprime las compuertas `⏸` de especificación y diseño.
     - Muestra únicamente el circuito técnico de 3 fases (Dev, QA, Code Reviewer):
       ```
       Fix: <descripción o slug>
       Tipo: FIX
       Modo: Remediación directa (Dev -> QA -> Reviewer)
       ✔ 1. Dev (<Backend | Frontend>): terminado · <duración o vueltas>
       ✔ 2. QA: APROBADO (suite completa sin regresiones)
       ✔ 3. Code Reviewer: APROBADO (sin hallazgos de seguridad)
       Siguiente paso: Cierre y autorización del dueño para commit/push
       ```

1. **Bitácora**: la carpeta del plugin es la que está dos niveles por encima de la carpeta de este `SKILL.md` (`<plugin>/skills/team-report/SKILL.md`). Ejecuta:
   `node "<plugin>/hooks/bitacora.mjs" --show "<raíz del proyecto>"`
   Te da cuántas veces se lanzó cada rol, cuándo fue el último lanzamiento y los últimos movimientos. Si falla o no hay Node, sigue sin ella y dilo en una línea.
2. **Archivos**: busca la feature (sin distinguir mayúsculas ni guiones) en el vault `<vault>/Proyectos/<proyecto>/` (subcarpetas `Specs/`, `UX/`, `ADR/` y `QA/`) o en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`, y revisa `git status`.
3. Deduce el estado de cada paso para flujos estándar de feature:
   - Product Owner: ✔ si hay spec (indica "spec auto-aprobada" si opera en modo continuo).
   - Diseño UX: ✔ si hay `docs/ux/<feature>.md`; ○ si no (indica "no aplica" si la spec no tiene interfaz).
   - Arquitecto: ✔ si hay ADR (indica "ADR auto-aprobado" si opera en modo continuo).
   - Backend / Frontend: ✔ si todas sus tareas del plan del ADR están en el código; ● con "N de M tareas" si están a medias; ○ si no empezaron.
   - QA: ✔ APROBADO o ✖ RECHAZADO según `docs/qa/<feature>.md`; ○ si no existe.
   - Code Reviewer: ✔ solo si hay constancia de revisión; si no, ○.
   - Un rol lanzado según la bitácora cuyo archivo de salida aún no existe, o es anterior al lanzamiento: ● trabajando (o "lanzado, sin resultado" si fue en otra conversación).
   - Determina el modo: si en la bitácora (`bitacora.mjs`) o en los comandos de la sesión se invocó con `--no-pause` o `--auto-approve`, el modo es `Continuo / Autónomo`; de lo contrario, `Supervisado / Interactivo`.
   - Aprobaciones del dueño: En modo continuo, suprime estrictamente la línea `⏸` (salvo detención por duda bloqueante de negocio o fallo de seguridad). En modo supervisado: ⏸ spec si hay spec sin UX ni ADR; ⏸ diseño si hay ADR sin cambios de código del plan.
   - Usa ◌ para pasos con archivo cuya fecha es anterior a la primera entrada de la bitácora (hechos antes de esta sesión).
4. Responde solo con este formato:

```
Feature: <nombre>
Modo: <Supervisado / Interactivo | Continuo / Autónomo>
⏸ <aprobación pendiente, solo en modo supervisado si la hay>
✔ 1. Product Owner · <n vueltas si > 1>
○ 2. Diseño UX
...
○ 7. Code Reviewer
Bitácora: <2-3 últimos movimientos>
Siguiente paso: <qué rol sigue y por qué>
```
