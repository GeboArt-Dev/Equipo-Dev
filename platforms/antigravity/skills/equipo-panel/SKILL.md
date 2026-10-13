---
name: equipo-panel
description: Muestra el estado del equipo de desarrollo (qué rol trabaja, qué pasos terminaron y si se espera aprobación del dueño). Úsalo cuando el usuario escriba /equipo-panel o pregunte en qué va el equipo o una feature.
---
# Estado del equipo (Antigravity)

En Antigravity no hay panel lateral: arma el estado tú combinando los archivos del proyecto con la bitácora del plugin. No lances subagentes ni modifiques archivos.

Argumento opcional: nombre de la feature. Si no se da, usa la feature con archivos modificados más recientemente en `docs/`.

1. **Bitácora**: la carpeta del plugin es la que está dos niveles por encima de la carpeta de este `SKILL.md` (`<plugin>/skills/equipo-panel/SKILL.md`). Ejecuta:
   `node "<plugin>/hooks/bitacora.mjs" --show "<raíz del proyecto>"`
   Te da cuántas veces se lanzó cada rol, cuándo fue el último lanzamiento y los últimos movimientos. Si falla o no hay Node, sigue sin ella y dilo en una línea.
2. **Archivos**: busca la feature (sin distinguir mayúsculas ni guiones) en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`, y revisa `git status`.
3. Deduce el estado de cada paso:
   - Product Owner: ✔ si hay spec.
   - Diseño UX: ✔ si hay `docs/ux/<feature>.md`; ○ si no (indica "no aplica" si la spec no tiene interfaz).
   - Arquitecto: ✔ si hay ADR.
   - Backend / Frontend: ✔ si todas sus tareas del plan del ADR están en el código; ● con "N de M tareas" si están a medias; ○ si no empezaron.
   - QA: ✔ APROBADO o ✖ RECHAZADO según `docs/qa/<feature>.md`; ○ si no existe.
   - Code Reviewer: ✔ solo si hay constancia de revisión; si no, ○.
   - Un rol lanzado según la bitácora cuyo archivo de salida aún no existe, o es anterior al lanzamiento: ● trabajando (o "lanzado, sin resultado" si fue en otra conversación).
   - Aprobaciones del dueño: ⏸ spec si hay spec sin UX ni ADR; ⏸ diseño si hay ADR sin cambios de código del plan.
   - Usa ◌ para pasos con archivo cuya fecha es anterior a la primera entrada de la bitácora (hechos antes de esta sesión).
4. Responde solo con este formato:

```
Feature: <nombre>
⏸ <aprobación pendiente, si la hay>
✔ 1. Product Owner · <n vueltas si > 1>
○ 2. Diseño UX
...
○ 7. Code Reviewer
Bitácora: <2-3 últimos movimientos>
Siguiente paso: <qué rol sigue y por qué>
```

