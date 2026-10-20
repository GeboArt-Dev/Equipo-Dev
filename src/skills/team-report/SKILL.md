---
name: team-report
description: Muestra el estado del equipo de desarrollo (qué rol trabaja, qué pasos terminaron y si se espera aprobación del dueño). Úsalo cuando el usuario escriba /team-report o pregunte en qué va el equipo o una feature.
---
# Estado del equipo

Normalmente este comando lo responde el panel en vivo del plugin. Si estás leyendo estas instrucciones, el panel no está activo en esta pantalla: arma el estado tú a partir de los archivos del proyecto.

Argumento opcional: nombre de la feature o del fix. Si no se da, usa la feature o fix con archivos modificados más recientemente en `docs/`.

0. **Detección de tipo de flujo (FEATURE vs FIX)**:
   - Inspecciona `docs/fixes/` y `git status`. Si el flujo en curso o los cambios más recientes corresponden a una remediación (`/fix` o archivos bajo `docs/fixes/`), clasifica como `Tipo: FIX`.
   - En flujos `FIX`:
     - Oculta por completo las filas correspondientes a `Product Owner`, `Diseño UX` y `Arquitecto`.
     - Suprime las compuertas `⏸` de especificación y diseño.
     - Muestra únicamente el circuito técnico activo (Dev, QA, Code Reviewer).
     - Formato para remediaciones FIX:
       ```
       Fix: <descripción o slug>
       Tipo: FIX
       Modo: Remediación directa (Dev -> QA -> Reviewer)
       ✔ 1. Dev (<Backend | Frontend>): terminado · <duración o vueltas>
       ✔ 2. QA: APROBADO (suite completa sin regresiones)
       ✔ 3. Code Reviewer: APROBADO (sin hallazgos de seguridad)
       Siguiente paso: Cierre y autorización del dueño para commit/push
       ```

1. **Flujo estándar de FEATURE**:
   Busca la feature (sin distinguir mayúsculas ni guiones) en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`, y revisa `git status`.
2. Determina el modo de ejecución: si la feature fue invocada con `--no-pause` o `--auto-approve`, o si los artefactos reflejan ejecución autónoma sin pausas, el modo es `Continuo / Autónomo`; de lo contrario, es `Supervisado / Interactivo`.
3. Deduce el estado de cada paso:
   - Product Owner: ✔ si hay spec (indica "spec auto-aprobada" si opera en modo continuo).
   - Diseño UX: ✔ si hay `docs/ux/<feature>.md`; ○ si no (indica "no aplica" si la spec no tiene interfaz).
   - Arquitecto: ✔ si hay ADR (indica "ADR auto-aprobado" si opera en modo continuo).
   - Backend / Frontend: ✔ si todas sus tareas del plan del ADR están en el código; ● con "N de M tareas" si están a medias; ○ si no empezaron.
   - QA: ✔ APROBADO o ✖ RECHAZADO según `docs/qa/<feature>.md`; ○ si no existe.
   - Code Reviewer: ✔ solo si hay constancia de revisión; si no, ○.
   - Aprobaciones del dueño: En modo continuo, suprime estrictamente la línea `⏸` (salvo detención por duda bloqueante de negocio o fallo de seguridad). En modo supervisado, incluye la línea `⏸` si falta aprobación de spec o de diseño (UX + ADR).
4. Responde con este formato, sin lanzar subagentes ni modificar archivos:

```
Feature: <nombre>
Modo: <Supervisado / Interactivo | Continuo / Autónomo>
⏸ <aprobación pendiente, solo en modo supervisado si la hay>
✔ 1. Product Owner
○ 2. Diseño UX
...
○ 7. Code Reviewer
Siguiente paso: <qué rol sigue y por qué>
```
