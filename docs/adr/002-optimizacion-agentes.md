# ADR 002: Optimización de Agentes para Reducción de Tokens, Eliminación de Redundancias y Calidad de Entrega

La arquitectura actual de subagentes en `equipo-dev` presenta un consumo desproporcionado de tokens (~15% a 30% de sobrecosto por interacción) debido a preámbulos de cortesía conversacional, dispersión de responsabilidades operativas en tareas de infraestructura y documentación, generación de suites de prueba con permutaciones redundantes y reportes de revisión de código saturados de observaciones cosméticas no bloqueantes.

- **Estado**: Propuesto
- **Fecha**: 2026-10-14
- **Autor**: Arquitecto de Software (`equipo-dev`)
- **Spec de Referencia**: `docs/specs/optimizacion-agentes.md`

---

## 1. Contexto

[Seguro] El ecosistema de subagentes de `equipo-dev` opera sobre modelos LLM de alto rendimiento (`pro` para PO, Architect, UX y Reviewer; `balanced` para Backend, Frontend y QA). En cada delegación inter-agente, el prompt del sistema se inyecta en el contexto junto con el historial acumulado de la sesión, provocando que cualquier redundancia léxica o instrucción ambigua se multiplique en cada ciclo del flujo `/feature`.

[Seguro] La especificación aprobada `docs/specs/optimizacion-agentes.md` establece cuatro historias de usuario críticas:
- **HU-1**: Diagnóstico directo y calibración de certeza (`[Seguro]`, `[Probable]`, `[Especulando]`) en `product-owner` y `architect`, eliminando preámbulos y saludos.
- **HU-2**: Desarrollo Backend integral con absorción de capacidades DevOps en `backend-dev` (código completo ejecutable, Dockerfiles y CI/CD en YAML sin truncar, queries optimizadas, seguridad estricta y comentarios breves).
- **HU-3**: Diseño e implementación accesible, mobile-first y documentada en `frontend-dev` y `ux-designer` (WCAG 2.1 AA, tokens de diseño y registro de decisiones en README).
- **HU-4**: Aseguramiento de calidad, revisión crítica y documentación continua en `qa-engineer` y `code-reviewer` (QA absorbe Documentador, genera casos mínimos esenciales, actualiza README tras cada tarea y documenta hooks/funciones en frases cortas; Reviewer reporta exclusivamente hallazgos críticos/bloqueantes).

[Probable] La creación de subagentes independientes adicionales para DevOps y Documentador (descartada formalmente en la spec) hubiera incrementado la fragmentación del contexto, añadido al menos dos transiciones de red/proceso inter-agente y elevado el consumo de tokens en prompts repetidos del sistema.

[Seguro] El compilador `scripts/build.mjs` valida la integridad de los agentes en `src/agents/` verificando frontmatter canónico (`name`, `description`, `model_tier`, `tools`). Cualquier modificación debe respetar las herramientas canónicas existentes y no requerir dependencias externas.

---

## 2. Decisión

[Seguro] Se decide optimizar integralmente las 7 definiciones de agentes canónicos ubicadas en `src/agents/` bajo un **Patrón de Prompts Compactos de Alta Densidad Informativa (High-Density Prompt Pattern)** sin añadir subagentes nuevos ni modificar la firma de herramientas asignadas.

```
┌────────────────────────────────────────────────────────────────────────┐
│               FLUJO OPTIMIZADO DE 7 ROLES (equipo-dev)                 │
├────────────────────────────────────────────────────────────────────────┤
│ 1. product-owner  : Diagnóstico directo + Certeza [Seguro/Prob/Espec]  │
│ 2. ux-designer    : Mobile-first + WCAG 2.1 AA + Tokens design-system  │
│ 3. architect      : Diagnóstico directo + Certeza + Contratos precisos │
│ 4. backend-dev    : Backend + DevOps integrado (Docker/CI-CD/Seguridad)│
│ 5. frontend-dev   : Mobile-first + WCAG 2.1 AA + Decisiones en README  │
│ 6. qa-engineer    : Tests esenciales + Documentador (README + Funcs 1L)│
│ 7. code-reviewer  : Filtro 100% Crítico/Bloqueante (Cero estilo)       │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Arquitectura de Responsabilidades y Absorciones

1. **`product-owner` (Diagnóstico y Calibración Epistémica)**:
   - [Seguro] Suprime cualquier saludo ("Hola", "Con gusto te ayudo") o preámbulo formal.
   - [Seguro] Inicia la respuesta con la definición del problema o diagnóstico en la primera oración.
   - [Seguro] Clasifica toda deducción, riesgo o hipótesis de negocio con las etiquetas `[Seguro]`, `[Probable]` o `[Especulando]`.

2. **`architect` (Diagnóstico, Calibración Epistémica y Contratos Rigurosos)**:
   - [Seguro] Inicia el análisis técnico con un diagnóstico directo en la primera frase.
   - [Seguro] Aplica obligatoriamente las etiquetas `[Seguro]`, `[Probable]` o `[Especulando]` en toda evaluación técnica, riesgo o deducción.
   - [Seguro] Diseña planes de tareas asignando explícitamente artefactos DevOps a `backend-dev`, accesibilidad/UI a `frontend-dev` y documentación/README a `qa-engineer`.

3. **`backend-dev` (Backend Integral + DevOps)**:
   - [Seguro] Absorbe completamente las responsabilidades de infraestructura y despliegue (DevOps).
   - [Seguro] Entrega código y APIs en bloques completos ejecutables; prohibidos los marcadores de posición tipo `// implementar aquí`.
   - [Seguro] Provee `Dockerfile`, `docker-compose.yml` y flujos de CI/CD (GitHub Actions / GitLab CI) en YAML completos y listos para ejecutar.
   - [Seguro] Instrucciones de despliegue limitadas a un máximo de 3 oraciones operativas sin teoría.
   - [Seguro] Aplica consultas parametrizadas u ORM optimizadas (cero concatenaciones, prevención de N+1 e indexación considerada).
   - [Seguro] Comentarios en código restringidos a un máximo de 1 línea por sección compleja únicamente cuando la intención no sea evidente del nombre del símbolo.

4. **`ux-designer` (Diseño Mobile-First y Accesible)**:
   - [Seguro] Aplica diseño mobile-first: maquetación y flujos priorizan pantallas móviles antes de breakpoints mayores.
   - [Seguro] Enlaza estrictamente la tipografía y paleta a los tokens de `design-system/<proyecto>/MASTER.md`.
   - [Seguro] Exige cumplimiento de WCAG 2.1 AA (contraste ≥ 4.5:1, áreas de toque ≥ 44x44px, foco visible y teclado).
   - [Seguro] Registra decisiones visuales clave en formato compacto para su incorporación al README.

5. **`frontend-dev` (Implementación Mobile-First, WCAG 2.1 AA y Registro en README)**:
   - [Seguro] Define estilos comenzando obligatoriamente por reglas móviles (viewport < 640px) antes de media queries superiores.
   - [Seguro] Respeta tokens del design system y contratos exactos del ADR.
   - [Seguro] Implementa soporte completo de navegación por teclado, contraste ≥ 4.5:1 y objetivos táctiles ≥ 44x44px.
   - [Seguro] Documenta cada decisión de diseño adoptada en el `README.md` del proyecto en un máximo de 2 oraciones directas.

6. **`qa-engineer` (Aseguramiento Esencial + Documentador)**:
   - [Seguro] Genera una suite mínima de pruebas sin redundancias: exactamente 1 caso feliz y 1-2 casos límite críticos por criterio Gherkin. Prohibidas las permutaciones de datos triviales.
   - [Seguro] Absorbe la responsabilidad de Documentador: actualiza obligatoriamente el `README.md` tras validar cada feature/tarea, reflejando nuevas capacidades, variables de entorno o endpoints.
   - [Seguro] Documenta cada hook o función nueva mediante una única frase corta descriptiva en el README / referencia del proyecto.
   - [Seguro] Reporte en `docs/qa/<feature>.md` estructurado en tabla directa, bugs con severidad/pasos y veredicto binario (**APROBADO** o **RECHAZADO**).

7. **`code-reviewer` (Filtro Exclusivamente Crítico y Bloqueante)**:
   - [Seguro] Restringe sus observaciones únicamente a hallazgos que impidan el funcionamiento, violen contratos del ADR o comprometan la seguridad (OWASP Top 10).
   - [Seguro] Suprime al 100% observaciones cosméticas, debates estilísticos o párrafos narrativos.
   - [Seguro] Formato de hallazgo directo de 1 línea: `[Bloqueante] <archivo>:<línea> - <problema> | Corrección: <solución>`.
   - [Seguro] Veredicto final binario: **LISTO PARA MERGE** o **CAMBIOS REQUERIDOS**.

### 2.2 Inventario de Archivos Afectados

| Operación | Ruta de Archivo | Propósito |
|---|---|---|
| **Modificar** | `src/agents/product-owner.md` | Diagnóstico en 1ª frase, calibración epistémica, criterios Gherkin medibles, eliminación de saludos. |
| **Modificar** | `src/agents/architect.md` | Diagnóstico en 1ª frase, calibración epistémica, contratos de API/datos y asignación DevOps/Doc en plan. |
| **Modificar** | `src/agents/backend-dev.md` | Absorbe DevOps (Docker/CI-CD YAML), código completo ejecutable, queries optimizadas, comentarios ≤ 1 línea. |
| **Modificar** | `src/agents/ux-designer.md` | Mobile-first, tipografía/tokens de design system, estándar WCAG 2.1 AA, decisiones concisas para README. |
| **Modificar** | `src/agents/frontend-dev.md` | Mobile-first CSS, WCAG 2.1 AA, manejo de estados, registro de decisiones en README (≤ 2 oraciones). |
| **Modificar** | `src/agents/qa-engineer.md` | Suite mínima esencial, absorbe Documentador (actualiza README, funciones/hooks en 1 frase), reporte directo. |
| **Modificar** | `src/agents/code-reviewer.md` | Reporte exclusivo de hallazgos críticos/bloqueantes, supresión de estilo/cosméticos, formato compacto. |
| **Crear** | `tests/agent-optimization.test.mjs` | Pruebas de verificación automatizada de las reglas de optimización y concisión en `src/agents/`. |
| **Recompilar** | `dist/**` | Generación de artefactos distribuidos multi-AI mediante `node scripts/build.mjs`. |

---

## 3. Alternativas Descartadas

### Alternativa 1: Creación de dos subagentes independientes adicionales (`devops-engineer.md` y `technical-writer.md`)
- **Descripción**: Crear agentes especializados en `src/agents/devops-engineer.md` y `src/agents/technical-writer.md` para separar responsabilidades.
- **Motivo de descarte**: [Seguro] Viola los criterios de exclusión de la spec y genera una fragmentación innecesaria. Cada agente adicional añade un ciclo de invocación, retransmisión de contexto completo en el prompt del sistema y latencia de red. `backend-dev` ya posee las herramientas de ejecución y edición necesarias para emitir Dockerfiles y pipelines de CI/CD; `qa-engineer` es el rol idóneo para actualizar la documentación pública al verificar la interfaz real.

### Alternativa 2: Introducir linters semánticos externos o dependencias npm para auditar prompts
- **Descripción**: Añadir paquetes npm como `promptlint` o validadores basados en librerías externas.
- **Motivo de descarte**: [Seguro] Viola el principio arquitectónico del proyecto de mantener cero dependencias externas en Node.js puro. La validación se resuelve con una suite nativa `tests/agent-optimization.test.mjs` ejecutada mediante `node --test`.

### Alternativa 3: Eliminación de los bloques `<example>` en el frontmatter de los agentes
- **Descripción**: Eliminar los ejemplos de `user/assistant/commentary` en las descripciones YAML de los agentes para reducir tokens brutos.
- **Motivo de descarte**: [Probable] Los bloques `<example>` en el frontmatter son indispensables para el enrutador semántico de Antigravity y Claude Code al evaluar cuándo disparar un subagente de forma autónoma. Removerlos provocaría fallos de despacho en el orquestador principal. La reducción de tokens debe centrarse en el cuerpo normativo (`body`) y en la salida generada por los agentes.

---

## 4. Contratos y Estructuras

### 4.1 Contrato de Calibración Epistémica (Taxonomía Obligatoria)

[Seguro] Toda evaluación técnica, deducción analítica, estimación de esfuerzo o consideración de riesgo emitida por `architect` o `product-owner` debe clasificarse explícitamente mediante una de las siguientes tres etiquetas:

| Etiqueta | Significado Semántico | Criterio de Uso | Ejemplo |
|---|---|---|---|
| `[Seguro]` | Certeza verificable empíricamente | Respaldado por código existente, especificaciones explícitas, pruebas ejecutadas o restricciones deterministas de la plataforma. | `[Seguro] El archivo package.json no existe en la raíz; el proyecto usa ESM nativo en Node.js.` |
| `[Probable]` | Deducción técnica de alta confianza | Basado en patrones arquitectónicos estándar, compatibilidad documentada de librerías o prácticas consolidadas en el stack. | `[Probable] Restringir las observaciones a críticos reducirá el consumo de tokens de salida en más de un 25%.` |
| `[Especulando]` | Hipótesis o estimación no contrastada | Suposición sobre comportamiento futuro, heurística no verificada en producción o requerimiento ambiguo pendiente de negocio. | `[Especulando] Los usuarios podrían demandar soporte para Docker Swarm además de Docker Compose en etapas posteriores.` |

### 4.2 Directrices Transversales de Concisión y Ahorro de Tokens

[Seguro] Todos los agentes en `src/agents/` deben implementar de forma homogénea las siguientes directivas de contención:

1. **Supresión de Cortesía y Preámbulos**:
   - Prohibido cualquier saludo ("Hola", "Estimado equipo", "Con gusto").
   - Prohibidas introducciones conversacionales ("A continuación presento...", "Procederé a explicar...").
   - Primera frase = Diagnóstico, resultado o entrega directa.

2. **Código Completo y Sin Marcadores Truncados**:
   - Todo bloque de código generado debe ser 100% ejecutable y completo.
   - Prohibido el uso de comentarios de truncamiento (`// implementar lógica aquí...`, `// ...resto del código`).

3. **Comentarios de Código Quirúrgicos**:
   - Máximo 1 línea por sección compleja únicamente cuando la intención del código no sea deducible por la nomenclatura de variables y funciones.

4. **Instrucciones Operativas Breves**:
   - Las instrucciones complementarias (despliegue, ejecución, comandos CLI) no deben superar 3 oraciones operativas directas. Prohibidos párrafos teóricos explicativos.

---

### 4.3 Especificación de Contratos por Agente en `src/agents/`

#### 4.3.1 `src/agents/product-owner.md`
- **Herramientas canónicas**: `read_file`, `write_file`, `find_by_name`, `web_search`.
- **Model Tier**: `pro`.
- **Regla de inicio**: Primera frase contiene diagnóstico del problema de negocio.
- **Calibración**: Afirmaciones clasificadas con `[Seguro]`, `[Probable]`, `[Especulando]`.
- **Estructura de salida (`docs/specs/<feature>.md`)**:
  - Objetivo (2-3 líneas).
  - Historias de usuario (Como / Quiero / Para).
  - Criterios Gherkin medibles (Dado / Cuando / Entonces).
  - Prioridad MoSCoW (Must, Should, Could, Won't).
  - Fuera de alcance.
  - Métricas de éxito medibles.
  - Preguntas abiertas.
  - Cierre: `"Spec lista para aprobación del dueño"`.

#### 4.3.2 `src/agents/architect.md`
- **Herramientas canónicas**: `read_file`, `write_file`, `find_by_name`, `grep_search`, `web_search`.
- **Model Tier**: `pro`.
- **Regla de inicio**: Primera frase contiene diagnóstico técnico directo.
- **Calibración**: Afirmaciones técnicas clasificadas con `[Seguro]`, `[Probable]`, `[Especulando]`.
- **Estructura de salida (`docs/adr/<NNN>-<feature>.md`)**:
  - Contexto (historias cubiertas de la spec).
  - Decisión (solución técnica, componentes y archivos a crear/modificar).
  - Alternativas descartadas (con justificación técnica objetiva).
  - Contratos (endpoints REST/GraphQL/gRPC, esquemas de BD, interfaces, prompts).
  - Seguridad (autenticación, autorización, validación, gestión de secretos).
  - Plan de implementación ordenado asignando tareas a `backend-dev` (incluyendo DevOps/Docker/CI-CD) y `frontend-dev` (incluyendo mobile-first/WCAG).
  - Riesgos y consecuencias.
  - Cierre: `"ADR listo para aprobación del dueño"`.

#### 4.3.3 `src/agents/backend-dev.md` (Absorbe DevOps)
- **Herramientas canónicas**: `read_file`, `write_file`, `edit_file`, `execute_command`, `find_by_name`, `grep_search`.
- **Model Tier**: `balanced`.
- **Capacidades DevOps integradas**:
  - Creación de `Dockerfile` multi-stage optimizados (base liviana Alpine/Distroless, usuario no-root, aprovechamiento de capas de caché).
  - Creación de pipelines de CI/CD en YAML (GitHub Actions, GitLab CI) listos para ejecución sin marcadores vacíos.
  - Instrucciones de despliegue en máximo 3 oraciones operativas.
- **Reglas de código**:
  - Bloques de código ejecutables completos.
  - Consultas SQL/NoSQL parametrizadas; prevención explícita de problemas N+1 e inclusión de índices requeridos.
  - Manejo seguro de secretos mediante variables de entorno (nunca en código duro).
  - Comentarios breves de máximo 1 línea solo cuando sea indispensable.

#### 4.3.4 `src/agents/ux-designer.md`
- **Herramientas canónicas**: `read_file`, `write_file`, `find_by_name`, `grep_search`, `execute_command`.
- **Model Tier**: `pro`.
- **Reglas de diseño**:
  - Mobile-first: definición de flujos y pantallas estructurados prioritariamente para viewport móvil.
  - Uso estricto de tokens de tipografía, espaciado y color del `design-system/<proyecto>/MASTER.md`.
  - Verificación de accesibilidad WCAG 2.1 AA (contraste ≥ 4.5:1, objetivos táctiles interactivos ≥ 44x44px, navegación por teclado, foco visible).
  - Registro de decisiones visuales clave en bloque de máximo 2 oraciones para su traslado al README.
  - Cierre: `"Diseño UX listo para el arquitecto"`.

#### 4.3.5 `src/agents/frontend-dev.md`
- **Herramientas canónicas**: `read_file`, `write_file`, `edit_file`, `execute_command`, `find_by_name`, `grep_search`.
- **Model Tier**: `balanced`.
- **Reglas de implementación**:
  - Maquetación estrictamente mobile-first (estilos base sin media queries o con `min-width`).
  - Cumplimiento de WCAG 2.1 AA en componentes (atributos ARIA donde corresponda, contraste ≥ 4.5:1, touch target ≥ 44x44px, `:focus-visible`).
  - Cobertura obligatoria de estados de interfaz: carga, vacío, error, éxito y deshabilitado.
  - Documentación de decisiones de diseño en el `README.md` del proyecto (máximo 2 oraciones directas por decisión).

#### 4.3.6 `src/agents/qa-engineer.md` (Absorbe Documentador)
- **Herramientas canónicas**: `read_file`, `write_file`, `execute_command`, `find_by_name`, `grep_search`.
- **Model Tier**: `balanced`.
- **Reglas de pruebas**:
  - Suite mínima de pruebas de alto impacto: 1 camino feliz + 1-2 condiciones de borde críticas por criterio Gherkin. Cero permutaciones redundantes.
- **Capacidades de Documentador integradas**:
  - Actualización obligatoria del `README.md` del proyecto tras validar cada feature/tarea: sección de características nuevas, configuración o uso.
  - Documentación de cada hook o función nueva en el proyecto mediante exactamente una frase corta descriptiva.
- **Estructura de salida (`docs/qa/<feature>.md`)**:
  - Tabla de validación: `Criterio Gherkin | Test Asociado | Resultado (OK / FALLA)`.
  - Hallazgos/Bugs: pasos para reproducir, esperado vs obtenido, severidad.
  - Veredicto final: **APROBADO** o **RECHAZADO**.

#### 4.3.7 `src/agents/code-reviewer.md` (Filtro 100% Crítico)
- **Herramientas canónicas**: `read_file`, `grep_search`, `find_by_name`, `execute_command`.
- **Model Tier**: `pro`.
- **Reglas de auditoría**:
  - Exclusividad en hallazgos críticos: solo reporta vulnerabilidades de seguridad (OWASP), rotura de funcionalidad, violación flagrante de contratos del ADR o fallas de tests/accesibilidad bloqueante.
  - Prohibidas observaciones cosméticas de formato, indentación o preferencias estilísticas subjetivas.
- **Estructura de reporte**:
  - Lista de hallazgos críticos: `[Bloqueante] <archivo>:<línea> - <descripción del fallo> | Impacto: <riesgo> | Solución: <cambio concreto>`.
  - Veredicto final binario: **LISTO PARA MERGE** o **CAMBIOS REQUERIDOS**.

---

### 4.4 Esquema de Salida para Documentación en README por QA

[Seguro] Para dar cumplimiento determinista a la función de Documentador absorbida por `qa-engineer`, se establece el siguiente contrato de sección en el `README.md` del proyecto inspeccionado:

```markdown
### 📦 Nuevas Capacidades y Cambios (<feature>)
- **<funcionalidad>**: Descripción operativa en 1-2 oraciones directas.

### 🔧 Referencia Técnica de Funciones y Hooks
| Identificador | Ubicación | Descripción (1 frase corta) |
|---|---|---|
| `nombreFuncion` | `src/path/file.ext` | Frase descriptiva concisa de su responsabilidad única. |
| `useCustomHook` | `src/hooks/useCustomHook.ts` | Frase descriptiva concisa del estado o efecto gestionado. |
```

---

## 5. Seguridad y Validación

1. **Gestión Estricta de Secretos en Backend y DevOps**:
   - [Seguro] En ningún caso `backend-dev` emitirá Dockerfiles, compose files o YAMLs de CI/CD que contengan claves API, contraseñas o tokens en texto plano. Se exigirá el uso de `ARG` no confidenciales, variables de entorno y secrets nativos de CI (`${{ secrets.GITHUB_TOKEN }}`, `secrets: ...`).
2. **Consultas Seguras y Parametrizadas**:
   - [Seguro] Toda consulta a base de datos implementada por `backend-dev` debe emplear parámetros enlazados (prepared statements) o constructores de consulta tipados, previniendo inyección SQL o NoSQL.
3. **Modo de Solo Lectura para Code Reviewer**:
   - [Seguro] `code-reviewer` mantiene permisos restringidos a herramientas de lectura e inspección; no cuenta con herramientas de edición ni escritura de archivos en disco.
4. **Validación de Accesibilidad y Seguridad en Frontend**:
   - [Seguro] `frontend-dev` previene inyecciones XSS saneando o evitando `dangerouslySetInnerHTML`, valida inputs en el cliente y garantiza foco visible y navegación por teclado en elementos interactivos.
5. **Comandos Destructivos y Control de Ejecución**:
   - [Seguro] Ningún agente ejecutará comandos destructivos en terminal (`rm -rf /`, `DROP DATABASE`, `git reset --hard`, `git push --force`) sin confirmación explícita del usuario humano.

---

## 6. Plan de Implementación Ordenado

El plan de implementación se encuentra dividido en tareas pequeñas, atómicas y ordenadas secuencialmente, asignadas al rol técnico correspondiente (`backend-dev` para prompts de sistema, DevOps, testing y compilación; `frontend-dev` para pautas de UX/Frontend, WCAG y design tokens):

- [x] **Tarea 1 [backend-dev]**: Optimizar el prompt de `src/agents/product-owner.md`.
  - *Acción*: Reestructurar para exigir diagnóstico directo en la primera frase, taxonomía obligatoria de certeza `[Seguro]`, `[Probable]`, `[Especulando]`, criterios Gherkin medibles, eliminación estricta de saludos/cortesías y plantilla compacta de especificación.
  - *Verificación*: Contenido libre de cortesía y presencia de cláusulas epistémicas.

- [x] **Tarea 2 [backend-dev]**: Optimizar el prompt de `src/agents/architect.md`.
  - *Acción*: Incorporar diagnóstico directo en primera frase, calibración epistémica con `[Seguro]`, `[Probable]`, `[Especulando]`, directiva de contratos concisos, asignación de DevOps/Docker a `backend-dev`, WCAG/mobile-first a `frontend-dev` y README/documentación continua a `qa-engineer`.
  - *Verificación*: Reglas explícitas de asignación y cero código de producción.

- [x] **Tarea 3 [backend-dev]**: Optimizar el prompt de `src/agents/backend-dev.md` (Integración DevOps).
  - *Acción*: Integrar generación de `Dockerfile` multi-stage y pipelines CI/CD YAML completos sin placeholders, instrucciones de despliegue en ≤ 3 oraciones, consultas parametrizadas, gestión de secretos en entorno, bloques de código ejecutables completos y comentarios breves ≤ 1 línea.
  - *Verificación*: Inclusión de capacidades DevOps completas y prohibición de código truncado.

- [x] **Tarea 4 [frontend-dev]**: Optimizar el prompt de `src/agents/ux-designer.md`.
  - *Acción*: Establecer enfoque mobile-first como prioritario, enlace estricto a tokens tipográficos y cromáticos del design system, checklist obligatorio de accesibilidad WCAG 2.1 AA (contraste ≥ 4.5:1, áreas de toque ≥ 44x44px, teclado) y preparación de decisiones de diseño para README en ≤ 2 oraciones.
  - *Verificación*: Eliminación de narrativa teórica redundante y presencia de directivas mobile-first y WCAG.

- [x] **Tarea 5 [frontend-dev]**: Optimizar el prompt de `src/agents/frontend-dev.md`.
  - *Acción*: Exigir maquetación mobile-first por defecto, consumo de contratos según ADR, cumplimiento estricto de WCAG 2.1 AA, cobertura de los 5 estados de UI y registro de decisiones de diseño en README en ≤ 2 oraciones.
  - *Verificación*: Directivas explícitas de accesibilidad, mobile-first y README.

- [x] **Tarea 6 [backend-dev]**: Optimizar el prompt de `src/agents/qa-engineer.md` (Integración Documentador).
  - *Acción*: Establecer diseño de suite mínima de pruebas (1 caso feliz + 1-2 bordes críticos por criterio Gherkin sin permutaciones triviales), incorporar rol de Documentador con actualización obligatoria de `README.md` tras validar feature y documentación de cada hook/función nueva en exactamente 1 frase corta.
  - *Verificación*: Responsabilidad de actualización de README y especificación de pruebas concisas.

- [x] **Tarea 7 [backend-dev]**: Optimizar el prompt de `src/agents/code-reviewer.md` (Filtro Crítico).
  - *Acción*: Restringir el alcance exclusivamente a hallazgos bloqueantes (seguridad OWASP, contratos violados, errores funcionales, fallas de accesibilidad o tests), prohibir expresamente observaciones de estilo o cosméticas y estandarizar formato compacto de reporte.
  - *Verificación*: Reporte restringido a hallazgos bloqueantes y veredicto binario.

- [x] **Tarea 8 [backend-dev]**: Implementar la suite de pruebas unitarias `tests/agent-optimization.test.mjs`.
  - *Acción*: Crear tests automatizados con `node:test` que verifiquen estáticamente en `src/agents/*.md`:
    1. Ausencia de frases de cortesía ("¡Hola!", "Con gusto", "A continuación presento").
    2. Presencia de directivas de calibración epistémica en `product-owner.md` y `architect.md`.
    3. Presencia de directivas DevOps en `backend-dev.md`.
    4. Presencia de directivas mobile-first y WCAG 2.1 AA en `ux-designer.md` y `frontend-dev.md`.
    5. Presencia de directivas de Documentador y suite mínima en `qa-engineer.md`.
    6. Presencia de directiva de exclusividad de hallazgos críticos en `code-reviewer.md`.
  - *Verificación*: Ejecución exitosa mediante `node --test tests/agent-optimization.test.mjs`.

- [x] **Tarea 9 [backend-dev]**: Compilación multi-target y validación de regresión completa.
  - *Acción*: Ejecutar `node scripts/build.mjs --clean` para compilar los 4 targets (`antigravity`, `claude-code`, `cursor`, `copilot`), validar que las transformaciones y resolución de tokens contextuales operan correctamente, y correr la suite global de tests (`node --test tests/build.test.mjs tests/qa-verification.test.mjs tests/agent-optimization.test.mjs`).
  - *Verificación*: Build completo en < 5s y 100% de tests en estado verde.

---

## 7. Riesgos y Consecuencias

### Consecuencias Positivas
- **Ahorro Significativo de Tokens**: [Probable] Reducción estimada de entre 15% y 30% en tokens de contexto por iteración al erradicar preámbulos, observaciones cosméticas y matrices redundantes de prueba.
- **Velocidad y Agilidad Operacional**: [Probable] Disminución en el tiempo de respuesta total del flujo al reducir la longitud promedio de las respuestas de PO, Architect, QA y Reviewer.
- **Infraestructura y Despliegue Garantizados**: [Seguro] El proyecto contará con Dockerfiles y flujos CI/CD listos para producción sin la sobrecarga de orquestar un agente DevOps independiente.
- **Documentación Siempre Sincronizada**: [Seguro] La absorción de Documentador por `qa-engineer` y `frontend-dev` garantiza que el `README.md` y la referencia de hooks/funciones reflejen fielmente el código verificado.
- **Accesibilidad por Defecto**: [Seguro] Las interfaces producidas cumplirán formalmente el estándar WCAG 2.1 AA y el principio mobile-first.

### Riesgos Identificados y Mitigaciones
1. **Riesgo**: Que modelos LLM menores ignoren la instrucción de suprimir cortesías o preámbulos.
   - *Mitigación*: [Seguro] Se incluye la prohibición explícita con ejemplos negativos directos tanto en el cuerpo como en la sección de Reglas de cada agente.
2. **Riesgo**: Que `qa-engineer` altere secciones preexistentes o críticas del `README.md` durante su actualización.
   - *Mitigación*: [Seguro] El contrato delimita estrictamente la actualización al agregado de la sección `### 📦 Nuevas Capacidades y Cambios` y la tabla `### 🔧 Referencia Técnica de Funciones y Hooks`, preservando el resto de la estructura del documento.
3. **Riesgo**: Que `code-reviewer` omita defectos sutiles al limitarse a hallazgos estrictamente bloqueantes.
   - *Mitigación*: [Seguro] Se define contractualmente como "Bloqueante" cualquier violación de seguridad OWASP, discrepancia con los contratos del ADR, ausencia de cobertura de tests o fallo en accesibilidad WCAG 2.1 AA, asegurando que la barra de calidad se mantenga rigurosa.

---

ADR listo para aprobación del dueño.
