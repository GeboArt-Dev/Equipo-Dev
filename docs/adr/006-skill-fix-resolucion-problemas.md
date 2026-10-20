# ADR 006: Skill Canónica `/fix` para Remediación Rápida de Defectos y Regresiones

La incorporación de la habilidad canónica `/fix` introduce un flujo técnico directo y compacto (Dev -> QA -> Code Reviewer) que reduce entre un 60% y un 75% el consumo de tokens y acorta la latencia a la mitad frente a `/feature`, resolviendo defectos puntuales mediante análisis de causa raíz (RCA), parche mínimo, test de regresión obligatorio y registro documental ligero en `docs/fixes/` sin comprometer las salvaguardas críticas del repositorio.

- **Estado**: Propuesto
- **Fecha**: 2026-10-20
- **Autor**: Arquitecto de Software (`equipo-dev`)
- **Spec de Referencia**: `docs/specs/skill-fix-resolucion-problemas.md`

---

## 1. Contexto

[Seguro] En el flujo estándar `/feature`, cualquier intervención en el repositorio —incluso la corrección de un fallo menor en tiempo de ejecución o una aserción rota en tests— impone un costo desproporcionado de tokens (40.000 a 80.000+ tokens por ciclo) y una latencia inadmisible. Dicho flujo exige convocar secuencialmente a `product-owner`, `ux-designer` y `architect`, intercalando dos pausas de confirmación humana obligatorias antes de que un desarrollador pueda escribir la primera línea de código o ejecutar un test de diagnóstico.

[Seguro] La especificación aprobada `docs/specs/skill-fix-resolucion-problemas.md` define la necesidad de un circuito de resolución quirúrgica y rápida diseñado para corregir excepciones, fallos de tipado, regresiones funcionales y comportamientos inesperados de código, cubriendo cuatro Historias de Usuario con prioridad MoSCoW:
- **HU-1 (Must have)**: Invocación ágil de remediación técnica mediante comando directo con validación estricta de parámetros.
- **HU-2 (Must have)**: Circuito técnico acotado y test de regresión obligatorio: Dev (RCA + parche mínimo + test que reproduce el fallo) -> QA (validación de suite completa) -> Code Reviewer (auditoría de seguridad y calidad), con un tope estricto de 3 reintentos.
- **HU-3 (Must have / Should have)**: Registro documental ligero en `docs/fixes/<slug>.md` y trazabilidad de estado en panel y reportes con tipología `FIX`.
- **HU-4 (Must have)**: Preservación irrestricta de salvaguardas de seguridad (cero commits ni pushes autónomos, cero comandos destructivos sin confirmación previa del dueño).

[Seguro] El dueño del proyecto ha aprobado la especificación con dos decisiones vinculantes:
1. **Comando canónico único**: Exclusivamente `/fix <descripción o traza>` (se descarta el alias secundario `/bug` para evitar duplicidad léxica y sobrecarga en los adaptadores).
2. **Visualización en `/team-report` y panel en vivo**: En flujos de tipo FIX, ocultar directamente las filas de roles no participantes (`Product Owner`, `UX Designer`, `Arquitecto`), mostrando exclusivamente el circuito técnico activo (`Dev`, `QA`, `Code Reviewer`).

---

## 2. Decisión

[Seguro] Se decide implementar la habilidad canónica `fix` como un flujo técnico de remediación rápida y quirúrgica dentro de la arquitectura multi-plataforma agnóstica de `equipo-dev`. La solución opera a través de una nueva definición canónica en `src/skills/fix/SKILL.md`, actualizaciones en el manifiesto agnóstico (`src/manifest.json`), soporte condicional en la lógica de reporte (`team-report`), extensión de tipos y hooks de interfaz en Claude Code (`register.tsx`), adaptación en plantillas de asistentes (Cursor, Copilot, Codex) y verificación exhaustiva mediante una nueva suite de pruebas unitarias.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CIRCUITO TÉCNICO DIRECTO /fix                        │
├────────────────────────────────────────────────────────────────────────┤
│ Invocación: /fix <descripción del error, traza o archivo afectado>     │
│                                                                        │
│   [Omitidos: Product Owner, UX Designer, Arquitecto, Pausas Diseño]    │
│                                                                        │
│   1. DEV (Backend / Frontend según naturaleza del error)               │
│      ├── Análisis de Causa Raíz (RCA ≤ 5 líneas)                       │
│      ├── Test automatizado de regresión (reproduce el fallo)           │
│      └── Parche de código mínimo indispensable                         │
│                                │                                       │
│                                ▼                                       │
│   2. QA ENGINEER                                                       │
│      ├── Ejecuta suite completa del proyecto                           │
│      ├── ¿Aprobado sin regresiones?                                    │
│      │     ├─ NO: Reintento a Dev (máximo 3 vueltas)                   │
│      │     └─ SÍ: Avanza a Code Reviewer                               │
│                                │                                       │
│                                ▼                                       │
│   3. CODE REVIEWER                                                     │
│      ├── Auditoría de seguridad OWASP y calidad                        │
│      ├── ¿Sin hallazgos bloqueantes?                                   │
│      │     ├─ NO: Reintento a Dev (máximo 3 vueltas)                   │
│      │     └─ SÍ: Avanza a Cierre                                      │
│                                │                                       │
│                                ▼                                       │
│   4. CIERRE Y REGISTRO                                                 │
│      ├── Genera artefacto ligero docs/fixes/<slug>.md                  │
│      ├── Resumen de 5 líneas al usuario                                │
│      └── [⏸ PAUSA SEGURIDAD]: Autorización explícita para commit/push │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Componentes Afectados y Modificaciones Técnicas

1. **Definición Canónica de la Skill (`src/skills/fix/SKILL.md`)**:
   - `[Seguro]` Archivo canónico que define el prompt de orquestación para incidentes técnicos.
   - `[Seguro]` Valida que el argumento no sea vacío; si falta, aborta inmediatamente mostrando la sintaxis: `Uso: /fix <descripción del error, traza o archivo afectado>`.
   - `[Seguro]` Despacha directamente al desarrollador relevante (`backend-dev` o `frontend-dev`) según los archivos o la traza suministrada.
   - `[Seguro]` Exige obligatoriamente: (a) Formulación de Causa Raíz (RCA), (b) Creación de un test de regresión automatizado que falla con el código actual y pasa con el parche, (c) Aplicación del parche de código mínimo indispensable.
   - `[Seguro]` Convoca a `qa-engineer` para validar la suite completa y posteriormente a `code-reviewer` para verificar seguridad y calidad.
   - `[Seguro]` Límite estricto de 3 reintentos ante rechazos de QA o Reviewer antes de escalar al dueño.
   - `[Seguro]` Genera el documento de auditoría sintético en `docs/fixes/<slug>.md`.

2. **Manifiesto Canónico Agnóstico (`src/manifest.json`)**:
   - `[Seguro]` Se incorpora `"/fix Cannot read properties of undefined"` dentro del arreglo `suggestedPrompts` para facilitar la autocompleción en plataformas compatibles.
   - `[Seguro]` La carpeta `src/skills/fix` queda registrada como skill canónica gestionada por el compilador `scripts/build.mjs`.

3. **Protocolo y Reglas de Trabajo (`src/skills/reglas-equipo/SKILL.md`)**:
   - `[Seguro]` Se incorpora formalmente el apartado "Protocolo de Remediación Técnica (`/fix`)", detallando su secuencia operativa (Dev -> QA -> Reviewer), la exención de diseño UX y de especificación formal de negocio, el requisito innegociable del test de regresión y la generación de `docs/fixes/`.
   - `[Seguro]` Se ratifica que las salvaguardas críticas (prohibición de commit/push autónomos, comandos destructivos y límite de 3 reintentos) son inviolables e idénticas a las de `/feature`.

4. **Reportes de Estado Agnósticos y Adaptados (`team-report`)**:
   - `[Seguro]` `src/skills/team-report/SKILL.md`: Si el flujo activo o la inspección de artefactos corresponde a un fix (`docs/fixes/`), reporta `Tipo: FIX`, oculta por completo las filas correspondientes a `Product Owner`, `Diseño UX` y `Arquitecto`, suprimiendo las compuertas `⏸` de diseño y presentando exclusivamente la secuencia técnica (Dev, QA, Code Reviewer).
   - `[Seguro]` `platforms/antigravity/skills/team-report/SKILL.md`: Reconoce invocaciones registradas en la bitácora o modificaciones en `docs/fixes/`, presentando el formato compacto de 3 fases técnicas sin los roles de negocio.
   - `[Seguro]` `platforms/codex/skills/team-report/SKILL.md`: Añade la instrucción para detectar y desplegar el formato compacto en remediaciones de tipo FIX.

5. **Adaptador Claude Code (`platforms/claude-code/`)**:
   - `[Seguro]` `platforms/claude-code/types/index.d.ts`:
     - Añade el tipo `export type FlowKind = 'feature' | 'fix'`.
     - Extiende el tipo `Flow` con la propiedad opcional `kind?: FlowKind`.
   - `[Seguro]` `platforms/claude-code/hooks/register.tsx`:
     - Función `parseKind(desc?: string): FlowKind`: detecta si la descripción del agente o invocación inicia con `/fix` o contiene marcadores de fix.
     - En `on('tool.call', { tool: 'Agent' })`: inicializa o preserva `kind: 'fix'` cuando corresponda, evitando asumir que un nuevo flujo depende exclusivamente de `product-owner`.
     - En `summary(f)`: si `f.kind === 'fix'`, despliega la cabecera `Fix: <desc>` y `Tipo: FIX`, filtrando la lista de roles para omitir `product-owner`, `ux-designer` y `architect`, mostrando únicamente los roles técnicos.
     - En `ui.render` (`Pane`): si `f.kind === 'fix'`, renderiza el panel compacto ocultando los componentes visuales de PO, UX, Arquitecto y sus compuertas (`gate('spec')`, `gate('adr')`).

6. **Adaptadores de Asistentes (`platforms/cursor/` y `platforms/copilot/`)**:
   - `[Seguro]` `platforms/cursor/templates/.cursorrules`: Se añade la directriz para el comando `/fix <descripción o traza>` como vía rápida de resolución técnica con test de regresión obligatorio y artefacto `docs/fixes/<slug>.md`.
   - `[Seguro]` `platforms/copilot/templates/copilot-instructions.md`: Se incorpora la guía del flujo de remediación técnica `/fix`.

7. **Soporte en Codex (`scripts/codex.mjs`)**:
   - `[Seguro]` Se incorpora `fix: 'equipo-dev-fix'` en el diccionario `SKILLS` de `scripts/codex.mjs`, permitiendo su distribución y generación del manifiesto de paquete.

### 2.2 Inventario Completo de Operaciones sobre Archivos

| Operación | Ruta del Archivo | Propósito | Asignación |
|---|---|---|---|
| **Crear** | `src/skills/fix/SKILL.md` | Definición canónica agnóstica de la skill `/fix` | `backend-dev` |
| **Modificar** | `src/manifest.json` | Agregar `"/fix Cannot read properties of undefined"` en `suggestedPrompts` | `backend-dev` |
| **Modificar** | `src/skills/reglas-equipo/SKILL.md` | Formalizar protocolo técnico `/fix` y reglas de no-regresión | `backend-dev` |
| **Modificar** | `src/skills/team-report/SKILL.md` | Soporte de formato compacto de 3 roles en flujos FIX | `backend-dev` |
| **Modificar** | `platforms/antigravity/skills/team-report/SKILL.md` | Adaptación de reporte Antigravity ocultando PO, UX y Arquitecto | `backend-dev` |
| **Modificar** | `platforms/codex/skills/team-report/SKILL.md` | Adaptación de reporte Codex para flujos FIX | `backend-dev` |
| **Modificar** | `scripts/codex.mjs` | Registro de `fix: 'equipo-dev-fix'` en `SKILLS` | `backend-dev` |
| **Modificar** | `platforms/claude-code/types/index.d.ts` | Adición de `FlowKind` y campo `kind?: FlowKind` en `Flow` | `backend-dev` |
| **Modificar** | `platforms/claude-code/hooks/register.tsx` | Detección de `/fix`, asignación de `kind` y renderizado compacto | `backend-dev` |
| **Modificar** | `platforms/cursor/templates/.cursorrules` | Documentación del protocolo `/fix` en reglas de Cursor | `backend-dev` |
| **Modificar** | `platforms/copilot/templates/copilot-instructions.md` | Documentación del protocolo `/fix` en reglas de Copilot | `backend-dev` |
| **Crear** | `tests/fix-skill.test.mjs` | Suite de tests unitarios de validación, parsing, contratos y hooks de `/fix` | `backend-dev` |
| **Modificar** | `tests/qa-verification.test.mjs` | Incluir `'fix'` en el arreglo `expectedSkills` | `backend-dev` |
| **Modificar** | `tests/codex.test.mjs` | Actualizar conteo de archivos de manifiesto a 12 | `backend-dev` |
| **Modificar** | `README.md` / `README.es.md` | Documentación pública del comando canónico `/fix` | `qa-engineer` |
| **Crear** | `docs/qa/skill-fix-resolucion-problemas.md` | Informe de certificación QA de la feature | `qa-engineer` |
| **Recompilar**| `dist/**` | Generación de artefactos multi-target con `node scripts/build.mjs --clean --target all` | `backend-dev` |

---

## 3. Alternativas Descartadas

### Alternativa 1: Implementar `/fix` como modificador o flag de `/feature` (`/feature --fix <descripción>`)
- **Descripción**: Reutilizar el comando existente `/feature` agregando una bandera `--fix` para omitir las fases de PO, UX y Arquitecto.
- **Razón técnica de descarte**:
  - `[Seguro]` Viola el principio de responsabilidad única de interfaces. El comando `/feature` está conceptualmente orientado a ciclo completo de producto (historias de usuario, prototipado visual, diseño arquitectónico).
  - `[Seguro]` Sobrecarga innecesariamente la lógica condicional del orquestador en `src/skills/feature/SKILL.md`.
  - `[Seguro]` Degrada la ergonomía del desarrollador que busca una respuesta inmediata ante errores de ejecución.

### Alternativa 2: Soporte Simultáneo de Alias `/bug` en Manifiestos y Adaptadores
- **Descripción**: Mantener `/fix` y `/bug` como comandos equivalentes registrados en todas las plataformas.
- **Razón técnica de descarte**:
  - `[Seguro]` Duplica innecesariamente entradas de configuración, hooks y suites de prueba sin aportar diferenciación funcional.
  - `[Seguro]` Descartado de manera expresa y vinculante por el dueño del producto en favor de la nomenclatura canónica única `/fix`.

### Alternativa 3: Remediación en Memoria sin Artefacto Documental `docs/fixes/<slug>.md`
- **Descripción**: Concluir el fix emitiendo únicamente un mensaje sintético en el chat de la sesión sin persistir archivos en disco.
- **Razón técnica de descarte**:
  - `[Seguro]` Elimina la auditabilidad técnica del repositorio. Un parche sin constancia documental impide a futuros mantenedores comprender la causa raíz del defecto o rastrear qué prueba de regresión lo respalda.
  - `[Seguro]` Generar `docs/fixes/<slug>.md` aporta trazabilidad con un peso despreciable (menos de 20 líneas de Markdown).

---

## 4. Contratos Técnicos

### 4.1 Contrato de Invocación Canónica

```text
/fix <descripción del error, traza de excepción o archivo afectado>
```

#### Reglas de Validación y Despacho:
- `[Seguro]` Entrada obligatoria: Si la cadena tras `/fix` está vacía o contiene solo espacios en blanco, la ejecución se aborta en el acto emitiendo:
  ```text
  Uso: /fix <descripción del error, traza o archivo afectado>
  ```
- `[Probable]` Criterio de asignación inicial de rol:
  - Si la entrada referencia archivos bajo rutas de cliente (`src/components/`, `src/ui/`, `frontend/`, `.tsx`, `.jsx`, `.css`, `.vue`, `.svelte`), se despacha a `frontend-dev`.
  - En todos los demás casos (errores de backend, Node.js, scripts, APIs, bases de datos o trazas genéricas de excepción), se despacha a `backend-dev`.
  - El desarrollador asignado puede colaborar o transferir tareas al otro especialista si durante el RCA se demuestra que la falla reside en la otra capa.

### 4.2 Contrato del Artefacto de Reporte `docs/fixes/<slug>.md`

- **Ruta**: `docs/fixes/<slug>.md`, donde `<slug>` se deriva del título del defecto en formato kebab-case limpio (máximo 40 caracteres, solo `[a-z0-9-]`).
- **Esquema Markdown Estricto**:

```markdown
# Fix: <Título Sintético del Defecto>

- **Fecha**: YYYY-MM-DD
- **Tipo**: Remediación Rápida (Bugfix)
- **Estado**: Resuelto y Verificado

## 1. Diagnóstico y Causa Raíz (RCA)
<Explicación técnica concisa del mecanismo de falla en un máximo de 5 líneas>.

## 2. Parche Aplicado
- **Archivos modificados**:
  - `ruta/al/archivo.ext`: <resumen de la corrección mínima>

## 3. Test de Regresión Obligatorio
- **Archivo de prueba**: `tests/<archivo-de-test>.test.ext`
- **Comprobación**: <descripción de la prueba automatizada que reproduce la falla y valida su corrección>

## 4. Verificación de No-Regresión
- **Suite ejecutada**: <comando de prueba, e.g. node --test ... o npm test>
- **Resultado**: APROBADO (0 fallos, suite íntegra en verde)
- **Revisión de Seguridad**: Sin hallazgos Bloqueantes en Code Review
```

### 4.3 Contrato de Estado y Visualización en `/team-report`

En flujos donde la actividad más reciente o en curso corresponda a un fix:
- `[Seguro]` Se ocultan absolutamente las líneas de `Product Owner`, `Diseño UX` y `Arquitecto`.
- `[Seguro]` Se suprime cualquier indicador de pausa `⏸` de especificación o diseño.
- `[Seguro]` Formato de texto devuelto:

```text
Fix: <descripción o slug>
Tipo: FIX
Modo: Remediación directa (Dev -> QA -> Reviewer)
✔ 1. Dev (<Backend | Frontend>): terminado · <duración o vueltas>
✔ 2. QA: APROBADO (suite completa sin regresiones)
✔ 3. Code Reviewer: APROBADO (sin hallazgos de seguridad)
Siguiente paso: Cierre y autorización del dueño para commit/push
```

### 4.4 Contrato de Modelos y Tipos en Claude Code

En `platforms/claude-code/types/index.d.ts`:

```typescript
export type FlowKind = 'feature' | 'fix'

export type Flow = {
  feature?: string
  kind?: FlowKind
  mode?: FlowMode
  roles: Record<RoleId, RoleState>
  awaiting?: 'spec' | 'adr'
  log: LogEntry[]
}
```

En `platforms/claude-code/hooks/register.tsx`:

```typescript
export function parseKind(desc?: string): FlowKind {
  if (!desc) return 'feature'
  return /^\/fix\b|^fix\b|^\[fix\]/i.test(desc.trim()) ? 'fix' : 'feature'
}
```

#### Regla de Renderizado en `Pane`:
- Si `f.kind === 'fix'`:
  - Cabecera: `Fix: ${f.feature}` y `Tipo: FIX (Remediación rápida)`.
  - Omitir `roleRow(1, 'product-owner')`, `gate('spec')`, `roleRow(2, 'ux-designer')`, `roleRow(3, 'architect')` y `gate('adr')`.
  - Renderizar únicamente:
    - `roleRow(1, 'backend-dev')` (o el dev que haya intervenido)
    - `roleRow(2, 'frontend-dev')` (si intervino)
    - `roleRow(3, 'qa-engineer')`
    - `roleRow(4, 'code-reviewer')`
  - Bitácora filtrada o resumida con los eventos técnicos.

---

## 5. Seguridad y Salvaguardas

[Seguro] La rapidez operativa de `/fix` no debilita bajo ningún concepto las salvaguardas críticas del proyecto:

1. **Autorización Humana para Operaciones de Git**:
   - `[Seguro]` Queda estrictamente prohibida la ejecución autónoma de `git commit` o `git push` por parte de cualquier agente al finalizar la remediación.
   - `[Seguro]` El flujo debe presentar los archivos modificados y solicitar la autorización explícita del dueño antes de cualquier mutación en el árbol de control de versiones.

2. **Prevención de Comandos Destructivos**:
   - `[Seguro]` Durante el análisis o aplicación del parche, ningún agente ejecutará comandos destructivos (`rm -rf`, borrado masivo de carpetas, sentencias SQL destructivas como `DROP TABLE` o `TRUNCATE`, o modificación de entornos protegidos) sin autorización humana previa.

3. **Validación y Sanitización de Entradas**:
   - `[Seguro]` La descripción suministrada se sanitiza para derivar el `<slug>` del archivo `docs/fixes/<slug>.md`.
   - `[Seguro]` Se prohíbe cualquier uso de caracteres de control o secuencias de path traversal (`../`) en la resolución de nombres de archivos.

4. **Gestión de Secretos**:
   - `[Seguro]` Los agentes tienen prohibido incorporar credenciales, tokens, certificados o datos confidenciales expuestos en trazas de error dentro del código, los tests o el artefacto `docs/fixes/<slug>.md`.

5. **Protección contra Bucles Finitos**:
   - `[Seguro]` Límite innegociable de 3 reintentos: si un parche es rechazado 3 veces consecutivas por `qa-engineer` o `code-reviewer`, el sistema detiene inmediatamente la ejecución y escala el problema al dueño con el diagnóstico consolidado.

---

## 6. Plan de Implementación

El plan de tareas atómicas y secuenciadas se asigna formalmente según las responsabilidades del equipo:

### Fase 1: Creación de Fuentes Canónicas y Adaptadores (Asignado a: `backend-dev`)
- [ ] **Tarea 1.1**: Crear `src/skills/fix/SKILL.md` con las instrucciones completas de orquestación técnica, validación de argumento no vacío, circuito Dev -> QA -> Reviewer, límite de 3 reintentos, plantilla de `docs/fixes/<slug>.md` y salvaguardas críticas.
- [ ] **Tarea 1.2**: Actualizar `src/manifest.json` agregando `"/fix Cannot read properties of undefined"` en `suggestedPrompts`.
- [ ] **Tarea 1.3**: Actualizar `src/skills/reglas-equipo/SKILL.md` formalizando la sección "Protocolo de Remediación Técnica (`/fix`)".
- [ ] **Tarea 1.4**: Modificar `src/skills/team-report/SKILL.md` para soportar la tipología FIX ocultando roles de negocio.
- [ ] **Tarea 1.5**: Modificar `platforms/antigravity/skills/team-report/SKILL.md` y `platforms/codex/skills/team-report/SKILL.md` reflejando el formato FIX compacto.
- [ ] **Tarea 1.6**: Actualizar `scripts/codex.mjs` agregando `fix: 'equipo-dev-fix'` al objeto `SKILLS`.
- [ ] **Tarea 1.7**: Extender `platforms/claude-code/types/index.d.ts` agregando `FlowKind` y campo `kind?: FlowKind` en `Flow`.
- [ ] **Tarea 1.8**: Modificar `platforms/claude-code/hooks/register.tsx` incorporando `parseKind`, inicialización de flujo fix y renderizado compacto en `summary()` y `Pane`.
- [ ] **Tarea 1.9**: Actualizar plantillas `platforms/cursor/templates/.cursorrules` y `platforms/copilot/templates/copilot-instructions.md` con las reglas de uso de `/fix`.

### Fase 2: Automatización de Pruebas y Compilación (Asignado a: `backend-dev`)
- [ ] **Tarea 2.1**: Crear la suite de pruebas unitarias `tests/fix-skill.test.mjs` usando `node:test` y `node:assert/strict` para verificar:
  - Validación de invocación sin argumentos (mensaje de ayuda).
  - Parsing de `parseKind` y asignación de tipo `fix`.
  - Contratos y presencia de directivas en `src/skills/fix/SKILL.md` (RCA, test obligatorio, 3 vueltas, salvaguardas).
  - Renderizado condicional compacto en hooks de Claude Code (ocultación de PO, UX y Arquitecto).
  - Generación del archivo sintético en `docs/fixes/`.
- [ ] **Tarea 2.2**: Actualizar `tests/qa-verification.test.mjs` incorporando `'fix'` en el arreglo `expectedSkills`.
- [ ] **Tarea 2.3**: Actualizar `tests/codex.test.mjs` ajustando la aserción de cantidad de archivos generados a 12.
- [ ] **Tarea 2.4**: Ejecutar compilación limpia multi-target mediante `node scripts/build.mjs --clean --target all` y certificar que la duración sea inferior a 5 segundos sin errores.

### Fase 3: Pruebas Esenciales, Documentación y Verificación QA (Asignado a: `qa-engineer`)
- [ ] **Tarea 3.1**: Ejecutar la suite completa secuencial de pruebas automatizadas:
  ```bash
  node --test --test-concurrency=1 tests/build.test.mjs tests/qa-verification.test.mjs tests/agent-optimization.test.mjs tests/approval-control.test.mjs tests/codex.test.mjs tests/fix-skill.test.mjs
  ```
- [ ] **Tarea 3.2**: Verificar cobertura integral de los criterios de aceptación Gherkin definidos en `docs/specs/skill-fix-resolucion-problemas.md`.
- [ ] **Tarea 3.3**: Actualizar `README.md` y `README.es.md` incorporando la guía de uso del comando canónico `/fix`.
- [ ] **Tarea 3.4**: Emitir el informe formal de certificación en `docs/qa/skill-fix-resolucion-problemas.md` con veredicto APROBADO o RECHAZADO.

*(Nota: `frontend-dev` no cuenta con asignaciones en este plan al tratarse de infraestructura interna de comandos y adaptadores TUI en TypeScript gestionados por `backend-dev`).*

---

## 7. Riesgos y Consecuencias

### Impactos Técnicos Positivos
- `[Seguro]` Reducción drástica del consumo de tokens (ahorro estimado entre 60% y 75%) al omitir etapas analíticas y de diseño visual innecesarias para incidencias puntuales.
- `[Seguro]` Reducción de latencia a más de la mitad para resolución de excepciones operativas.
- `[Seguro]` Blindaje contra regresiones al imponer como condición indispensable un test automatizado que reproduce el defecto antes de aplicar el parche.
- `[Seguro]` Registro histórico ligero pero formal en `docs/fixes/<slug>.md`, evitando la dispersión de conocimiento técnico.

### Riesgos Técnicos y Mitigaciones
- `[Probable]` **Riesgo**: Desvío funcional (*feature creep*) mediante el uso indebido de `/fix` para implementar funcionalidades completas eludiendo el diseño de UX y de arquitectura.
  - **Mitigación**: Regla explícita en `src/skills/fix/SKILL.md` y `src/skills/reglas-equipo/SKILL.md` que instruye a los desarrolladores a detenerse y sugerir `/feature` si la remediación requiere diseñar nuevas pantallas, modificar esquemas arquitectónicos o añadir endpoints nuevos no existentes.
- `[Probable]` **Riesgo**: Indecisión en el despacho cuando un fallo afecta simultáneamente backend y frontend.
  - **Mitigación**: Regla de precedencia por defecto hacia `backend-dev` para el diagnóstico inicial de causa raíz (RCA), con capacidad expresa de delegar o convocar a `frontend-dev` si la causa identificada es de naturaleza visual o de cliente.

---

ADR listo para aprobación del dueño.
