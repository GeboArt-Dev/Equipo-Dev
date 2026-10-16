# ADR 005: Control de Activación y Desactivación de Aprobaciones del Equipo (`--no-pause` / `--auto-approve`)

La incorporación del modo continuo en `equipo-dev` mediante los modificadores idempotentes `--no-pause` y `--auto-approve` desacopla deterministamente las compuertas de diseño humano (Spec y UX/ADR) sin alterar la arquitectura multi-plataforma agnóstica ni comprometer las salvaguardas críticas de seguridad (commits, push y comandos destructivos).

- **Estado**: Propuesto
- **Fecha**: 2026-10-16
- **Autor**: Arquitecto de Software (`equipo-dev`)
- **Spec de Referencia**: `docs/specs/control-aprobaciones-equipo.md`

---

## 1. Contexto

[Seguro] El flujo principal de trabajo del plugin, implementado en la habilidad canónica `src/skills/feature/SKILL.md`, impone actualmente dos pausas obligatorias y sincrónicas de confirmación humana:
1. Pausa 1: Aprobación de la especificación tras la intervención de `product-owner`.
2. Pausa 2: Aprobación del diseño técnico y contratos (UX + ADR) tras las intervenciones de `ux-designer` y `architect`.

[Seguro] Esta estructura garantiza una gobernanza estricta sobre el alcance y la arquitectura en sesiones interactivas, pero introduce esperas ociosas innecesarias en flujos continuos, prototipado rápido, ejecuciones desatendidas o tareas delegadas de desarrollo.

[Seguro] La especificación aprobada `docs/specs/control-aprobaciones-equipo.md` define tres Historias de Usuario con prioridad MoSCoW:
- **HU-1 (Must have)**: Ejecución del flujo continuo en modo autónomo (aprobaciones desactivadas) de extremo a extremo sin esperas intermedias de diseño.
- **HU-2 (Must have)**: Preservación determinista del modo interactivo supervisado con pausas como comportamiento predeterminado del sistema.
- **HU-3 (Should have)**: Señalización visible e inequívoca del modo de operación activo tanto en la cabecera del orquestador como en el reporte de estado `team-report`.

[Seguro] El dueño del proyecto ha resuelto formalmente las preguntas abiertas de la especificación con las siguientes directrices vinculantes:
1. **Mecanismo de activación**: Opción A aprobada. Invocación mediante flag explícito en el comando (`/feature --no-pause <descripción>` o `/feature --auto-approve <descripción>`), manteniendo `/feature <descripción>` en modo supervisado por defecto.
2. **Gestión de dudas de negocio**: En modo continuo, pausar únicamente ante preguntas abiertas que sean estrictamente bloqueantes para el alcance de negocio. Si las dudas no son bloqueantes, proceder bajo supuestos técnicos razonables y documentarlos explícitamente en el artefacto correspondiente.
3. **Flujo al retomar**: El comando de reanudación (`/feature continuemos con <nombre>`) opera en modo supervisado por defecto a menos que se le agregue explícitamente `--no-pause` o `--auto-approve`.

---

## 2. Decisión

[Seguro] Se decide implementar un control de modo de ejecución en dos variantes funcionales: **Modo Supervisado / Interactivo (por defecto)** y **Modo Continuo / Autónomo (activado por flag)**, preservando intacto el núcleo de compilación multi-target (`scripts/build.mjs`) y aplicando las reglas en las definiciones canónicas de skills (`src/skills/`) y adaptadores correspondientes.

```
┌────────────────────────────────────────────────────────────────────────┐
│             ARQUITECTURA DE CONTROL DE APROBACIONES                    │
├────────────────────────────────────────────────────────────────────────┤
│ Invocación: /feature [--no-pause | --auto-approve] <descripción>       │
│                                                                        │
│                      ¿Contiene flag continuo?                          │
│                             │                                          │
│              NO             ▼             SÍ                           │
│     ┌───────────────────┐        ┌───────────────────┐                 │
│     │ Modo Supervisado  │        │   Modo Continuo   │                 │
│     │   (Por defecto)   │        │    (Autónomo)     │                 │
│     └─────────┬─────────┘        └─────────┬─────────┘                 │
│               │                            │                           │
│     PO → [⏸ Pausa Spec]          PO → ¿Duda bloqueante?                │
│               │                         ├─ SÍ: [⏸ Pausa negocio]       │
│               │                         └─ NO: Supuestos técnicos      │
│               │                                │                       │
│     UX → ARCH → [⏸ Pausa ADR]    UX → ARCH ────┘                       │
│               │                            │                           │
│               │                            ▼ (Omitir Pausa 2)          │
│               ▼                            ▼                           │
│        DEV → QA → REVIEW            DEV → QA → REVIEW                  │
│               │                            │                           │
│               └─────────────┬──────────────┘                           │
│                             ▼                                          │
│        ┌───────────────────────────────────────────┐                   │
│        │ SALVAGUARDAS CRÍTICAS DE SEGURIDAD        │                   │
│        │ (Inviolables en ambos modos):             │                   │
│        │ - git commit / git push                   │                   │
│        │ - Comandos destructivos (rm, drop, etc.)  │                   │
│        │ - 3er fallo consecutivo de QA / Reviewer  │                   │
│        │ ──► [⏸ PAUSA Y CONFIRMACIÓN HUMANA]       │                   │
│        └───────────────────────────────────────────┘                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Componentes Afectados y Modificaciones Técnicas

1. **Definición canónica de `feature` (`src/skills/feature/SKILL.md`)**:
   - [Seguro] Reconocimiento y parsing de argumentos: Detectar los modificadores `--no-pause` y `--auto-approve` (insensible a mayúsculas, al inicio o embebidos en el comando). Extraer la descripción neta de la feature retirando dichos flags.
   - [Seguro] Emisión del mensaje de arranque: Obligar a que la primera o segunda línea del orquestador señale de forma determinista el modo activo:
     - `Modo: Continuo / Autónomo (aprobaciones de diseño desactivadas)` o
     - `Modo: Supervisado / Interactivo (aprobaciones estándar activadas)`.
   - [Seguro] Regla de transición en Pausa 1 (Spec):
     - En modo supervisado: Detenerse y esperar confirmación explícita.
     - En modo continuo: Evaluar preguntas abiertas. Si no hay dudas o si se resuelven con supuestos razonables, documentar los supuestos en el mensaje y avanzar automáticamente a `ux-designer` (o `architect`). Pausar únicamente si existe una ambigüedad que impida definir el alcance fundamental de negocio.
   - [Seguro] Regla de transición en Pausa 2 (UX + ADR):
     - En modo supervisado: Detenerse y esperar confirmación explícita de diseño UX y ADR.
     - En modo continuo: Omitir la pausa y transicionar inmediatamente a la fase de implementación (`backend-dev` / `frontend-dev`).
   - [Seguro] Comportamiento de reanudación: `/feature continuemos con <nombre>` mantiene el modo supervisado por defecto a menos que incluya `--no-pause` o `--auto-approve`.

2. **Definición canónica de reglas (`src/skills/reglas-equipo/SKILL.md`)**:
   - [Seguro] Sección formal de "Modos de Ejecución":
     - Definición precisa del Modo Supervisado / Interactivo (flujo estándar con compuertas en pasos 2 y 5).
     - Definición precisa del Modo Continuo / Autónomo (flujo acelerado sin pausas 2 y 5, directiva de supuestos técnicos razonables).
   - [Seguro] Cláusula de salvaguardas inviolables: Establecer que bajo ninguna circunstancia el modo continuo omite la autorización humana para commits, push, comandos destructivos o escalaciones por fallos reiterados en QA.

3. **Definiciones canónicas y adaptadores de `team-report`**:
   - [Seguro] `src/skills/team-report/SKILL.md`: Incluir en la respuesta la línea `Modo: <Supervisado | Continuo (autónomo)>`. Si la feature se ejecuta en modo continuo, no mostrar el indicador de bloqueo "⏸" para las aprobaciones de Spec o Diseño; reflejarlas como auto-aprobadas o completadas.
   - [Seguro] `platforms/antigravity/skills/team-report/SKILL.md`: Adaptar la inspección para detectar si la tarea o prompts registrados en la bitácora (`bitacora.mjs`) o en la sesión corresponden a modo continuo, suprimiendo el indicador "⏸" y reportando el modo activo.
   - [Seguro] `platforms/codex/skills/team-report/SKILL.md`: Actualizar la instrucción para reportar el modo y distinguir aprobaciones pendientes reales de auto-aprobaciones en modo continuo.

4. **Adaptador Claude Code (`platforms/claude-code/`)**:
   - [Probable] `platforms/claude-code/types/index.d.ts`: Incorporar el campo opcional `mode?: 'supervised' | 'continuous'` en la estructura `Flow`.
   - [Probable] `platforms/claude-code/hooks/register.tsx`:
     - Al registrar el inicio de un rol con `Agent`, analizar si la descripción o feature contiene `--no-pause` o `--auto-approve` para establecer `mode: 'continuous'`.
     - Si `mode === 'continuous'`, evitar asignar `awaiting = 'spec'` o `awaiting = 'adr'` al finalizar los roles `product-owner` o `architect`.
     - En la función `summary(f)`, omitir los textos de espera `⏸` y reportar el modo en ejecución.

5. **Plantillas y directrices de asistentes (`platforms/cursor/`, `platforms/copilot/`)**:
   - [Seguro] `platforms/cursor/templates/.cursorrules` y `platforms/copilot/templates/copilot-instructions.md`: Reflejar en la sección de flujo la disponibilidad del modo continuo mediante `--no-pause` y `--auto-approve`, y la regla de no omisión de compuertas de seguridad.

### 2.2 Inventario de Operaciones sobre Archivos

| Operación | Ruta del Archivo | Propósito |
|---|---|---|
| **Modificar** | `src/skills/feature/SKILL.md` | Parsing de flags `--no-pause`/`--auto-approve`, omisión de pausas 1 y 2, documentación de supuestos razonables, compuertas de seguridad |
| **Modificar** | `src/skills/reglas-equipo/SKILL.md` | Definición de Modos de Ejecución (Supervisado vs Continuo) y salvaguardas críticas |
| **Modificar** | `src/skills/team-report/SKILL.md` | Inclusión del modo en reporte y supresión de `⏸` en modo continuo |
| **Modificar** | `platforms/antigravity/skills/team-report/SKILL.md` | Detección de modo y supresión de `⏸` en Antigravity |
| **Modificar** | `platforms/codex/skills/team-report/SKILL.md` | Adaptación de reporte y distinciones en Codex |
| **Modificar** | `platforms/claude-code/types/index.d.ts` | Extensión de tipo `Flow` con `mode?: 'supervised' \| 'continuous'` |
| **Modificar** | `platforms/claude-code/hooks/register.tsx` | Supresión de `awaiting` en modo continuo e inclusión de modo en `summary()` |
| **Modificar** | `platforms/cursor/templates/.cursorrules` | Documentación del modo continuo y reglas de flujo |
| **Modificar** | `platforms/copilot/templates/copilot-instructions.md` | Documentación del modo continuo y reglas de flujo |
| **Crear** | `tests/approval-control.test.mjs` | Suite automatizada de tests para validar flags, contratos y no-regresión |
| **Modificar** | `README.md` / `README.es.md` | Documentación para el usuario de los modificadores `--no-pause` y `--auto-approve` |
| **Recompilar** | `dist/**` | Generación de artefactos con `node scripts/build.mjs --clean --target all` |

---

## 3. Alternativas Descartadas

### Alternativa 1: Activación Interactiva Mediante Confirmación en el Mensaje Inicial (Opción B)
- **Descripción**: Solicitar al usuario al inicio de cada `/feature` que elija interactivamente si desea pausar o continuar de forma desatendida.
- **Razón técnica de descarte**:
  - `[Seguro]` Viola el principio de automatización desatendida: obliga siempre a una interacción sincrónica al inicio, impidiendo dejar un comando corriendo en background.
  - `[Seguro]` Rechazada explícitamente por el dueño del producto en favor del flag directo en línea de comandos (Opción A).

### Alternativa 2: Parámetro Persistente de Proyecto o Variable de Entorno Global (Opción C / D)
- **Descripción**: Almacenar la preferencia en `CLAUDE.md`, `.cursorrules`, un archivo `.equipo-dev.json` o una variable de entorno (`EQUIPO_DEV_AUTO_APPROVE=1`).
- **Razón técnica de descarte**:
  - `[Probable]` Introduce estado mutable y riesgo de desbordamiento operativo: un usuario podría olvidar que dejó activo el modo continuo global y ejecutar inadvertidamente features críticas con omisión de diseño.
  - `[Seguro]` La activación por invocación mediante flag es idempotente, predecible y no contamina el control de versiones ni la configuración del entorno.

### Alternativa 3: Bypass Total Incluyendo Compilaciones, Tests y Revisiones de Seguridad
- **Descripción**: Permitir que el modo continuo auto-apruebe también commits, pushes y veredictos desfavorables de QA Engineer o Code Reviewer.
- **Razón técnica de descarte**:
  - `[Seguro]` Violación crítica de seguridad y del principio de mínimo privilegio. Podría provocar publicaciones automáticas de código defectuoso o vulnerable a repositorios remotos.
  - `[Seguro]` Contradice frontalmente la HU-1 (criterio de respeto inviolable a compuertas de seguridad) y los límites innegociables del proyecto.

---

## 4. Contratos

### 4.1 Contrato de Invocación de la Skill `/feature`

```text
/feature [--no-pause | --auto-approve] <descripción de la feature | continuemos con <nombre>>
```

#### Reglas de Normalización y Parsing:
- [Seguro] El orquestador busca la presencia de `--no-pause` o `--auto-approve` (sin distinguir mayúsculas/minúsculas).
- [Seguro] Si se detecta cualquiera de los dos flags:
  - Se activa internamente `modo = "continuo"`.
  - Se remueve el flag de la cadena de entrada para obtener la descripción limpia de la feature.
- [Seguro] Si no se suministra ninguno de los dos flags:
  - Se activa internamente `modo = "supervisado"`.
- [Seguro] Mensaje de arranque obligatorio (Línea 1 o 2 del orquestador):
  - Modo continuo: `Modo: Continuo / Autónomo (aprobaciones de diseño desactivadas)`
  - Modo supervisado: `Modo: Supervisado / Interactivo (aprobaciones estándar activadas)`

#### Regla de Preguntas Abiertas de Negocio vs Supuestos Técnicos:
```text
IF modo == "continuo":
    IF dudas_abiertas contienen ambigüedades_bloqueantes_de_negocio:
        PAUSAR flujo y solicitar aclaración del dueño ("⏸ Esperando aclaración de alcance...")
    ELSE:
        Adoptar supuestos técnicos razonables más simples
        Documentar los supuestos adoptados en la respuesta y en la Spec/ADR
        AVANZAR inmediatamente al siguiente rol
ELSE (modo == "supervisado"):
    Mostrar resumen y preguntas abiertas
    PAUSAR y esperar aprobación explícita del dueño
```

### 4.2 Contrato de Salida de `/team-report`

#### Formato en Modo Supervisado:
```text
Feature: <nombre>
Modo: Supervisado / Interactivo
⏸ <aprobación pendiente: spec o diseño (UX + ADR)>
✔ 1. Product Owner
○ 2. Diseño UX
...
○ 7. Code Reviewer
Siguiente paso: <qué rol sigue y por qué>
```

#### Formato en Modo Continuo / Autónomo:
```text
Feature: <nombre>
Modo: Continuo / Autónomo
✔ 1. Product Owner (spec auto-aprobada)
✔ 2. Diseño UX
✔ 3. Arquitecto (ADR auto-aprobado)
● 4. Backend (implementando tareas del plan)
○ 5. Frontend
○ 6. QA
○ 7. Code Reviewer
Siguiente paso: <qué rol sigue y por qué>
```
*Nota*: En modo continuo queda terminantemente prohibido emitir la línea con el indicador `⏸`, salvo que se haya producido una detención de seguridad o duda bloqueante de negocio.

### 4.3 Contrato de Estado para Hooks de Claude Code (`Flow`)

```typescript
export type FlowMode = 'supervised' | 'continuous'

export type Flow = {
  feature?: string
  mode?: FlowMode
  roles: Record<RoleId, RoleState>
  awaiting?: 'spec' | 'adr'
  log: LogEntry[]
}
```

- [Probable] Si `f.mode === 'continuous'`, la propiedad `awaiting` se mantiene en `undefined` tras finalizar `product-owner` y `architect`, evitando que la UI o la barra de estado muestren estados de espera humana.

---

## 5. Seguridad

[Seguro] La relajación de compuertas en el diseño técnico no relaja en ninguna circunstancia las compuertas de seguridad e integridad del repositorio:

1. **Inviolabilidad de Operaciones Git Remotas**:
   - Ningún subagente ni el orquestador puede ejecutar `git commit` o `git push` sin autorización humana expresa, con independencia del modo configurado.
2. **Protección contra Comandos Destructivos**:
   - Cualquier operación de borrado masivo de directorios, eliminación de tablas, migración irreversible de datos o parada de servicios exige confirmación explícita previa.
3. **Escalación Forzada ante Fallos Reiterados**:
   - Si `qa-engineer` emite un veredicto `RECHAZADO` por tercera vez consecutiva (o si `code-reviewer` detecta hallazgos bloqueantes no resueltos), el modo continuo aborta la ejecución y transfiere el control al dueño de forma inmediata.
4. **Resistencia a Inyecciones y Fallbacks Seguros**:
   - Si un usuario ingresa flags mal formados (ej. `--no-pauses`, `--autoapprove`), el parser los ignora o los trata como texto descriptivo, cayendo de forma determinista y segura en el **Modo Supervisado por defecto**.

---

## 6. Plan de Implementación

### Responsabilidades por Rol:
- **`backend-dev`**: Modificación de habilidades canónicas (`src/`), adaptadores de plataforma (`platforms/`), suite de pruebas `tests/approval-control.test.mjs`, recompilación multi-target con `node scripts/build.mjs` y verificación completa de la suite.
- **`frontend-dev`**: *No aplica*. Esta feature no introduce componentes gráficos, páginas HTML ni estilos UI.
- **`qa-engineer`**: Ejecución de las suites de prueba, verificación de no-regresión en todas las plataformas, elaboración del informe de validación `docs/qa/control-aprobaciones-equipo.md` y actualización del `README.md` / `README.es.md`.

### Tareas Atómicas y Ordenadas:

1. **Tarea 1 (`backend-dev`)**: Actualizar `src/skills/feature/SKILL.md`
   - Incorporar detección y parsing de `--no-pause` y `--auto-approve`.
   - Implementar la emisión del modo en el mensaje de inicio.
   - Definir la omisión de Pausa 1 y Pausa 2 en modo continuo con la regla de preguntas bloqueantes vs supuestos razonables.
   - Preservar las reglas de seguridad críticas y el comportamiento por defecto supervisado al retomar.

2. **Tarea 2 (`backend-dev`)**: Actualizar `src/skills/reglas-equipo/SKILL.md`
   - Formalizar la sección de Modos de Ejecución (Supervisado vs Continuo).
   - Documentar la obligatoriedad de registrar supuestos técnicos razonables.
   - Ratificar la inviolabilidad de las salvaguardas de seguridad en ambos modos.

3. **Tarea 3 (`backend-dev`)**: Actualizar `src/skills/team-report/SKILL.md` y `platforms/antigravity/skills/team-report/SKILL.md`
   - Agregar el campo `Modo: <Supervisado | Continuo (autónomo)>` al formato de reporte.
   - Instruir la supresión del indicador de espera `⏸` cuando se opera en modo continuo.

4. **Tarea 4 (`backend-dev`)**: Actualizar adaptadores de plataforma
   - `platforms/codex/skills/team-report/SKILL.md`: Incluir modo y distinguir aprobaciones.
   - `platforms/claude-code/types/index.d.ts`: Incorporar `mode?: 'supervised' | 'continuous'` en `Flow`.
   - `platforms/claude-code/hooks/register.tsx`: Gestionar `mode` y suprimir `awaiting` cuando el modo es continuo.
   - `platforms/cursor/templates/.cursorrules` y `platforms/copilot/templates/copilot-instructions.md`: Agregar mención al modo continuo.

5. **Tarea 5 (`backend-dev`)**: Crear la suite de pruebas `tests/approval-control.test.mjs`
   - Validar parsing de `--no-pause` y `--auto-approve` en diferentes posiciones del comando.
   - Validar preservación del modo supervisado por defecto sin flags.
   - Validar contenido contractual en `src/skills/` y en los archivos compilados (`dist/`).
   - Validar que las compuertas de seguridad no hayan sido debilitadas.

6. **Tarea 6 (`backend-dev`)**: Compilar artefactos multi-target
   - Ejecutar `node scripts/build.mjs --clean --target all` para regenerar `dist/` en todas las plataformas.
   - Verificar ausencia de tokens pendientes `{{...}}` y consistencia de manifiestos.

7. **Tarea 7 (`backend-dev`)**: Ejecutar la suite completa de pruebas
   - Ejecutar secuencialmente: `node --test --test-concurrency=1 tests/build.test.mjs tests/qa-verification.test.mjs tests/agent-optimization.test.mjs tests/codex.test.mjs tests/approval-control.test.mjs`.
   - Garantizar 100% de tests en verde sin regresiones.

8. **Tarea 8 (`qa-engineer`)**: Documentación y certificación
   - Actualizar `README.md` y `README.es.md` con ejemplos de uso de `--no-pause` y `--auto-approve`.
   - Generar el informe de control de calidad en `docs/qa/control-aprobaciones-equipo.md`.

---

## 7. Riesgos y Consecuencias

### Impactos Positivos
- [Seguro] Reducción sustancial del tiempo total de entrega en prototipado rápido al eliminar dos compuertas sincrónicas ociosas.
- [Seguro] Total flexibilidad para el dueño, manteniendo una experiencia predecible y segura con valor por defecto supervisado.
- [Seguro] Trazabilidad clara del modo operativo en reportes y mensajes de arranque sin requerir cambios en la estructura de `docs/`.

### Riesgos Técnicos y Mitigaciones
- **Riesgo 1 (Desvío de negocio en supuestos erróneos)**: [Probable] Si el `product-owner` asume un requerimiento de negocio ambiguo sin pausar, el equipo podría codificar una funcionalidad desviada del propósito del dueño.
  - *Mitigación*: Se establece la regla categórica de pausar incluso en modo continuo si la duda es catalogada como bloqueante para el alcance de negocio.
- **Riesgo 2 (Inconsistencia de estado en Claude Code)**: [Probable] Que el panel lateral en Claude Code muestre `⏸` debido a la asignación rígida de `awaiting`.
  - *Mitigación*: Adaptación de `register.tsx` para inhibir `awaiting` cuando la descripción contiene flags continuos.
- **Riesgo 3 (Confusión en la reanudación de features)**: [Probable] Que el usuario intente retomar una feature en modo continuo esperando que recuerde el flag previo.
  - *Mitigación*: El comando `/feature continuemos con <nombre>` es determinista: requiere pasar explícitamente `--no-pause` si se desea continuar sin pausas; de lo contrario, aplica supervisión estándar.

---

ADR listo para aprobación del dueño
