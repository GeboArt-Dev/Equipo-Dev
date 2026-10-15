# ADR 003: Renombrado de la Skill Canónica y Comandos de Estado de `equipo-panel` a `team-report`

El renombrado de la habilidad canónica `equipo-panel` a `team-report` bajo sustitución estricta inmediata (Opción B) resuelve la inconsistencia léxica del plugin sin impacto estructural en el motor de compilación ni alteración en la lógica de deducción de estados del flujo de trabajo.

- **Estado**: Propuesto
- **Fecha**: 2026-10-14
- **Autor**: Arquitecto de Software (`equipo-dev`)
- **Spec de Referencia**: `docs/specs/renombrar-equipo-panel-a-team-report.md`

---

## 1. Contexto

[Seguro] El plugin `equipo-dev` cuenta actualmente con 4 skills registradas en su arquitectura agnóstica (`feature`, `team-rules`, `equipo-panel` y `team-reset`). La habilidad responsable de inspeccionar y presentar el estado de los subagentes, puertas de aprobación del dueño y bitácora de actividad fue denominada originalmente `equipo-panel`.

[Seguro] La especificación aprobada `docs/specs/renombrar-equipo-panel-a-team-report.md` identifica una fricción de adopción y falta de homogeneidad con estándares internacionales de comandos de reporte (`team-report`), planteando la necesidad de renombrar dicha habilidad en todas las plataformas soportadas manteniendo intacta la lógica de presentación y deducción del estado.

[Seguro] El dueño del producto ha revisado las alternativas de transición de la HU-3 y ha aprobado expresamente la **Opción B (Sustitución estricta inmediata)**:
- Reemplazo total de `equipo-panel` por `team-report`.
- No se preservan alias ni retrocompatibilidad temporal para `equipo-panel`.
- La eliminación es limpia y directa en todas las plataformas (`antigravity`, `claude-code`, `cursor`, `copilot`), suites de tests y documentación.

Este ADR cubre las 3 Historias de Usuario aprobadas en la especificación bajo los términos de la Opción B:
- **HU-1**: Invocación de la habilidad de estado como `team-report` (`/team-report` y `/equipo-dev:team-report`).
- **HU-2**: Actualización de la documentación oficial (`README.md`, `README.es.md`) y prompts sugeridos reflejando `team-report`.
- **HU-3**: Gestión de transición y retrocompatibilidad resuelta mediante sustitución estricta inmediata sin alias residuales.

---

## 2. Decisión

[Seguro] Se decide ejecutar una sustitución canónica inmediata de `equipo-panel` por `team-report` en la capa agnóstica (`src/`), en los adaptadores específicos de plataforma (`platforms/`), en los hooks y pruebas de Claude Code, en la suite de verificación automatizada del compilador y en la documentación pública del repositorio.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SUSTITUCIÓN CANÓNICA INMEDIATA                       │
├────────────────────────────────────────────────────────────────────────┤
│  src/skills/equipo-panel/       ──►  src/skills/team-report/           │
│  platforms/antigravity/skills/  ──►  platforms/antigravity/skills/     │
│    equipo-panel/                       team-report/                    │
│  platforms/claude-code/hooks/   ──►  PANE = 'team-report'              │
│    register.tsx                      PANEL_CMDS: ['equipo-dev:...']   │
│  src/manifest.json              ──►  suggestedPrompts: /team-report    │
│  README.md / README.es.md       ──►  Sintaxis oficial /team-report     │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Componentes Afectados y Flujo de Compilación

1. **Definiciones Canónicas Agnósticas (`src/`)**:
   - [Seguro] El directorio `src/skills/equipo-panel/` se renombra a `src/skills/team-report/`.
   - [Seguro] El archivo `src/skills/team-report/SKILL.md` actualiza su frontmatter con `name: team-report` y ajusta su descripción para reflejar la invocación con `/team-report`.
   - [Seguro] `src/manifest.json` actualiza el arreglo `suggestedPrompts` reemplazando `"/equipo-panel"` por `"/team-report"`.

2. **Adaptador Google Antigravity (`platforms/antigravity/`)**:
   - [Seguro] El directorio de overrides `platforms/antigravity/skills/equipo-panel/` se renombra a `platforms/antigravity/skills/team-report/`.
   - [Seguro] `platforms/antigravity/skills/team-report/SKILL.md` actualiza su frontmatter (`name: team-report`), su descripción y la referencia de ruta en la instrucción 1 (`<plugin>/skills/team-report/SKILL.md`).
   - [Seguro] El compilador `scripts/build.mjs` lee `overrides.skillsDir` y sobreescribe de forma transparente el directorio `dist/antigravity/equipo-dev/skills/team-report/` aplicando los tokens de plataforma.

3. **Adaptador Claude Code (`platforms/claude-code/`)**:
   - [Seguro] En `platforms/claude-code/hooks/register.tsx`, la constante de identificación del panel pasa de `const PANE = 'equipo-panel'` a `const PANE = 'team-report'`.
   - [Seguro] La lista de comandos interceptados pasa de `const PANEL_CMDS = ['equipo-dev:equipo-panel', 'equipo-panel']` a `const PANEL_CMDS = ['equipo-dev:team-report', 'team-report']`.
   - [Seguro] En `platforms/claude-code/tests/flujo.test.ts`, la función `panel` actualiza su `requestId` a `'team-report'`, y los casos de prueba de comando ejecutan y verifican `/team-report` y `equipo-dev:team-report`.

4. **Validación y Pruebas Automatizadas (`tests/`)**:
   - [Seguro] `tests/build.test.mjs`: Se actualiza la prueba de overrides de Antigravity para verificar la existencia y contenido de `skills/team-report/SKILL.md`.
   - [Seguro] `tests/qa-verification.test.mjs`: Se actualiza el arreglo `expectedSkills` reemplazando `'equipo-panel'` por `'team-report'`.

5. **Documentación del Repositorio**:
   - [Seguro] En `README.md` y `README.es.md`: Se actualiza la sección 3 "Consultar el Estado del Equipo" reemplazando todas las referencias a `/equipo-panel` por `/team-report` y se actualiza el paso de activación tras la recarga del entorno.

### 2.2 Inventario Completo de Operaciones sobre Archivos

| Operación | Ruta del Archivo | Propósito |
|---|---|---|
| **Renombrar/Mover** | `src/skills/equipo-panel` → `src/skills/team-report` | Renombrado canónico agnóstico de la carpeta de la skill |
| **Modificar** | `src/skills/team-report/SKILL.md` | Actualizar frontmatter (`name: team-report`) y descripción |
| **Renombrar/Mover** | `platforms/antigravity/skills/equipo-panel` → `platforms/antigravity/skills/team-report` | Renombrado del override de la skill para Antigravity |
| **Modificar** | `platforms/antigravity/skills/team-report/SKILL.md` | Actualizar frontmatter (`name: team-report`) y ruta de bitácora |
| **Modificar** | `src/manifest.json` | Actualizar `suggestedPrompts` de `"/equipo-panel"` a `"/team-report"` |
| **Modificar** | `platforms/claude-code/hooks/register.tsx` | Actualizar `PANE` y `PANEL_CMDS` hacia `team-report` |
| **Modificar** | `platforms/claude-code/tests/flujo.test.ts` | Actualizar `requestId` de Pane y comandos de test a `team-report` |
| **Modificar** | `tests/build.test.mjs` | Actualizar ruta de override en test a `skills/team-report/SKILL.md` |
| **Modificar** | `tests/qa-verification.test.mjs` | Actualizar `expectedSkills` con `'team-report'` |
| **Modificar** | `README.md` | Reemplazar `/equipo-panel` por `/team-report` en tablas y ejemplos EN |
| **Modificar** | `README.es.md` | Reemplazar `/equipo-panel` por `/team-report` en tablas y ejemplos ES |
| **Recompilar** | `dist/**` | Reconstruir artefactos multi-target mediante `node scripts/build.mjs --clean --all` |

---

## 3. Alternativas Descartadas

### Alternativa 1: Soporte Dual con Alias Retrocompatible y Advertencia de Deprecación
- **Descripción**: Mantener tanto `team-report` como `equipo-panel` registrados simultáneamente durante una o dos versiones menores, emitiendo una advertencia de deprecación al invocar `equipo-panel`.
- **Razón técnica de descarte**:
  - `[Seguro]` Incrementa la complejidad de los hooks de Claude Code requiriendo 4 comandos registrados (`['equipo-dev:team-report', 'team-report', 'equipo-dev:equipo-panel', 'equipo-panel']`).
  - `[Seguro]` Obliga a duplicar carpetas o crear enlaces simbólicos en `src/skills/` y `platforms/antigravity/skills/`, violando el principio de "fuente única de verdad".
  - `[Seguro]` El dueño descartó explícitamente la retrocompatibilidad en favor de una base limpia e inmediata (Opción B).

### Alternativa 2: Renombrado Global Incluyendo `team-reset` (`team-reset`) y Prefijo de Plugin
- **Descripción**: Renombrar en esta misma iteración la skill `team-reset` a `team-reset` y el namespace `equipo-dev` a `team-dev`.
- **Razón técnica de descarte**:
  - `[Seguro]` Fuera del alcance definido en la especificación aprobada.
  - `[Probable]` Modificar el namespace del plugin provocaría roturas críticas en configuraciones de rutas de instalación local (`~/.gemini/config/plugins/equipo-dev`, `~/.claude/plugins/`), requiriendo migraciones complejas de directorios y perfiles de usuario.

---

## 4. Contratos

### 4.1 Contrato de la Habilidad Canónica (`src/skills/team-report/SKILL.md`)

```markdown
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
```

### 4.2 Contrato del Override para Antigravity (`platforms/antigravity/skills/team-report/SKILL.md`)

```markdown
---
name: team-report
description: Muestra el estado del equipo de desarrollo (qué rol trabaja, qué pasos terminaron y si se espera aprobación del dueño). Úsalo cuando el usuario escriba /team-report o pregunte en qué va el equipo o una feature.
---
# Estado del equipo (Antigravity)

En Antigravity no hay panel lateral: arma el estado tú combinando los archivos del proyecto con la bitácora del plugin. No lances subagentes ni modifiques archivos.

Argumento opcional: nombre de la feature. Si no se da, usa la feature con archivos modificados más recientemente en `docs/`.

1. **Bitácora**: la carpeta del plugin es la que está dos niveles por encima de la carpeta de este `SKILL.md` (`<plugin>/skills/team-report/SKILL.md`). Ejecuta:
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
```

### 4.3 Contratos de Invocación y Parámetros

| Atributo | Especificación |
|---|---|
| **Comando de Invocación** | `/team-report` o `/equipo-dev:team-report` |
| **Comandos Anteriores** | `/equipo-panel` y `/equipo-dev:equipo-panel` (eliminados; devuelven comando no reconocido) |
| **Parámetro 1 (Opcional)** | `feature`: Nombre o fragmento identificador de la funcionalidad |
| **Comportamiento por Defecto** | Identifica automáticamente la feature más reciente en `docs/` |
| **Efectos Secundarios** | Estrictamente de solo lectura; cero mutaciones de archivos o estado |
| **Respuesta en UI (Claude)** | Abre el panel lateral con `requestId: 'team-report'` |
| **Respuesta en Texto/CLI** | Bloque de texto con estados de los 7 roles y aprobaciones del dueño |

---

## 5. Seguridad

1. **Validación de Entradas**:
   - [Seguro] El parámetro opcional de búsqueda de feature es sanitizado y utilizado exclusivamente en patrones de búsqueda relativa dentro de las rutas controladas de documentación (`docs/specs/`, `docs/ux/`, `docs/adr/`, `docs/qa/`).
   - [Seguro] No se permite inyección de rutas absolutas o escapes de directorio (`..`).

2. **Permisos y Modificación de Estado**:
   - [Seguro] La ejecución de `team-report` tiene prohibido invocar subagentes o modificar archivos del espacio de trabajo.
   - [Seguro] La invocación del script de soporte de bitácora (`hooks/bitacora.mjs --show`) opera exclusivamente en modo lectura contra `state/bitacora.jsonl`.

3. **Gestión de Secretos**:
   - [Seguro] Ninguna información de credenciales, variables de entorno (.env) o claves API es expuesta en el reporte de estado ni en la bitácora.

---

## 6. Plan de Implementación

### Tarea 1: Renombrado canónico en fuentes agnósticas y adaptadores
- **Responsable**: `backend-dev`
- **Acciones**:
  1. Renombrar directorio `src/skills/equipo-panel/` a `src/skills/team-report/`.
  2. Modificar `src/skills/team-report/SKILL.md` asignando `name: team-report` y actualizando la descripción a `/team-report`.
  3. Renombrar directorio `platforms/antigravity/skills/equipo-panel/` a `platforms/antigravity/skills/team-report/`.
  4. Modificar `platforms/antigravity/skills/team-report/SKILL.md` asignando `name: team-report`, actualizando la descripción y la ruta en el paso 1 a `<plugin>/skills/team-report/SKILL.md`.
  5. Actualizar `src/manifest.json` reemplazando `"/equipo-panel"` por `"/team-report"` en `suggestedPrompts`.

### Tarea 2: Actualización del adaptador y tests de Claude Code
- **Responsable**: `backend-dev`
- **Acciones**:
  1. Modificar `platforms/claude-code/hooks/register.tsx`:
     - Asignar `const PANE = 'team-report'`.
     - Actualizar `const PANEL_CMDS = ['equipo-dev:team-report', 'team-report']`.
  2. Modificar `platforms/claude-code/tests/flujo.test.ts`:
     - Actualizar `requestId: 'team-report'` en la función auxiliar `panel()`.
     - Actualizar llamadas de comando a `equipo-dev:team-report` y `team-report`.
     - Actualizar descripciones de tests que mencionen `/equipo-panel`.

### Tarea 3: Compilación multi-target e instalación local
- **Responsable**: `backend-dev`
- **Acciones**:
  1. Ejecutar compilación limpia: `node scripts/build.mjs --clean --all`.
  2. Verificar que `dist/antigravity/equipo-dev/skills/team-report/SKILL.md` y `dist/claude-code/equipo-dev/skills/team-report/SKILL.md` se generen correctamente.
  3. Ejecutar instalación en entorno local: `node scripts/build.mjs --install`.

### Tarea 4: Evaluación de interfaz y accesibilidad
- **Responsable**: `frontend-dev`
- **Acciones**:
  - [Seguro] Justificación: No aplica trabajo de interfaz gráfica, estilos ni maquetación web. El renderizado visual de paneles en Claude Code mantiene intacta su estructura de cajas y tipografías (Box/Text), actualizando únicamente su identificador interno `PANE`.

### Tarea 5: Actualización de suites de prueba, verificación y documentación
- **Responsable**: `qa-engineer`
- **Acciones**:
  1. Actualizar `tests/build.test.mjs`:
     - Cambiar la lectura de archivo de test de `skills/equipo-panel/SKILL.md` a `skills/team-report/SKILL.md`.
  2. Actualizar `tests/qa-verification.test.mjs`:
     - Actualizar `expectedSkills` en HU-1 para esperar `team-report` en lugar de `equipo-panel`.
  3. Actualizar `README.md` y `README.es.md`:
     - Reemplazar `/equipo-panel` por `/team-report` en las tablas de activación y sección 3 de consulta de estado.
  4. Ejecutar la suite completa de tests de regresión:
     - `node --test tests/build.test.mjs tests/qa-verification.test.mjs`.
  5. Elaborar el informe de validación formal en `docs/qa/renombrar-equipo-panel-a-team-report.md`.

---

## 7. Riesgos y Consecuencias

### Consecuencias Positivas
- `[Seguro]` Estandarización y consistencia en el vocabulario de comandos del equipo bajo convenciones internacionales (`team-report`).
- `[Seguro]` Base de código limpia, sin deuda técnica ni lógica residual de redirección o alias deprecados.
- `[Seguro]` Validación automatizada continua en los tests de regresión asegurando paridad multi-plataforma.

### Riesgos y Mitigaciones
- `[Seguro]` **Riesgo de Ruptura Inmediata**: Cualquier usuario o flujo de trabajo que invoque `/equipo-panel` experimentará un fallo de comando no reconocido.
  - *Mitigación*: Documentación explícita del cambio en `README.md` y `README.es.md`.
- `[Probable]` **Caché de Plugins en IDE**: El entorno del usuario puede mantener cargada la definición anterior del plugin en memoria.
  - *Mitigación*: Instrucción obligatoria documentada de recargar la ventana (`Developer: Reload Window` en Antigravity / reinicio de sesión en Claude Code) tras la ejecución de `--install`.

---

ADR listo para aprobación del dueño.
