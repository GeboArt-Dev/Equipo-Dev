---
name: team-report
description: Muestra el estado del equipo de desarrollo (qué rol trabaja, qué pasos terminaron y si se espera aprobación del dueño). Úsalo cuando el usuario escriba /team-report o pregunte en qué va el equipo o una feature.
---
# Estado del equipo

Normalmente este comando lo responde el panel en vivo del plugin. Si estás leyendo estas instrucciones, el panel no está activo en esta pantalla: arma el estado tú a partir de los archivos del proyecto.

Argumento opcional: nombre de la feature. Si no se da, usa la feature con archivos modificados más recientemente en `docs/`.

1. Busca la feature (sin distinguir mayúsculas ni guiones) en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`, y revisa `git status`.
2. Deduce el estado de cada paso:
   - Product Owner: ✔ si hay spec.
   - Diseño UX: ✔ si hay `docs/ux/<feature>.md`; ○ si no (indica "no aplica" si la spec no tiene interfaz).
   - Arquitecto: ✔ si hay ADR.
   - Backend / Frontend: ✔ si todas sus tareas del plan del ADR están en el código; ● con "N de M tareas" si están a medias; ○ si no empezaron.
   - QA: ✔ APROBADO o ✖ RECHAZADO según `docs/qa/<feature>.md`; ○ si no existe.
   - Code Reviewer: ✔ solo si hay constancia de revisión; si no, ○.
3. Responde solo con este formato, sin lanzar subagentes ni modificar archivos:

```
Feature: <nombre>
⏸ <aprobación pendiente, si la hay>
✔ 1. Product Owner
○ 2. Diseño UX
...
○ 7. Code Reviewer
Siguiente paso: <qué rol sigue y por qué>
```
