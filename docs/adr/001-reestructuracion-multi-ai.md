# ADR 001: Reestructuración Arquitectural hacia un Sistema Multi-AI Agnóstico (`src/` + `platforms/`)

- **Estado**: Propuesto
- **Fecha**: 2026-10-13
- **Autor**: Arquitecto de Software (`equipo-dev`)
- **Spec de Referencia**: `docs/specs/reestructuracion-multi-ai.md`

---

## 1. Contexto

El sistema `equipo-dev` nació y evolucionó inicialmente como un plugin para Claude Code. Para habilitar soporte para Antigravity en la versión v0.5.0, se implementó un script de transformación (`scripts/build-antigravity.mjs`) que consumía los archivos raíz de Claude Code (`agents/`, `skills/`, `.claude-plugin/`) como fuente primaria y aplicaba transformaciones de texto basadas en expresiones regulares para generar la variante de Antigravity.

Esta aproximación presenta limitaciones arquitecturales significativas:
1. **Acoplamiento rígido a Claude Code**: La fuente de verdad contiene identificadores de herramientas propietarios (`Read`, `Write`, `Bash`, `Glob`, `Grep`), nombres de archivos específicos (`CLAUDE.md`) y rutas absolutas vinculadas a la estructura de Claude (`~/.claude/plugins/`).
2. **Fragilidad ante cambios**: El uso de reemplazos basados en regex y parches textuales individuales hace que cualquier actualización semántica en un rol pueda romper silenciosamente la generación del plugin para Antigravity u otras plataformas.
3. **Escalabilidad nula ante nuevas IAs**: La incorporación planificada de plataformas como Cursor, GitHub Copilot u otras requeriría añadir más scripts ad-hoc dependientes del formato de Claude, multiplicando el mantenimiento y el riesgo de divergencia funcional.

Este ADR cubre las 5 Historias de Usuario aprobadas en la especificación:
- **HU-1**: Centralización agnóstica de roles y habilidades en `src/`.
- **HU-2**: Adaptadores modulares por plataforma en `platforms/`.
- **HU-3**: Proceso unificado de compilación y empaquetado en `dist/`.
- **HU-4**: Instalación local automatizada por plataforma (`--install`).
- **HU-5**: Base de extensibilidad para Cursor y GitHub Copilot.

---

## 2. Decisión

Se adopta un **Patrón de Arquitectura Fuente-Adaptador-Target (Source-Adapter-Target Pattern)** desacoplado en tres capas:

```
┌────────────────────────────────────────────────────────┐
│                   src/ (Agnóstico)                     │
│  - manifest.json (metadatos canónicos)                 │
│  - agents/*.md (roles con herramientas canónicas)      │
│  - skills/*/*.md (habilidades con tokens semánticos)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               platforms/ (Adaptadores)                 │
│  - claude-code/ (platform.json + hooks TSX + types)    │
│  - antigravity/ (platform.json + bitacora + overrides) │
│  - cursor/      (platform.json + templates .cursorrules)│
│  - copilot/     (platform.json + templates instructions│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ Compilador unificado (scripts/build.mjs)
┌────────────────────────────────────────────────────────┐
│                   dist/ (Compilados)                   │
│  - dist/claude-code/equipo-dev/                        │
│  - dist/antigravity/equipo-dev/                        │
│  - dist/cursor/                                        │
│  - dist/copilot/                                       │
└────────────────────────────────────────────────────────┘
```

### 2.1 Componentes del Sistema

1. **`src/` (Única Fuente de Verdad Agnóstica)**:
   - `src/manifest.json`: Información canónica del plugin (nombre, versión, descripción, autor, keywords, prompts sugeridos).
   - `src/agents/`: Definiciones canónicas de los 7 roles (`product-owner`, `ux-designer`, `architect`, `backend-dev`, `frontend-dev`, `qa-engineer`, `code-reviewer`). Emplea frontmatter YAML estandarizado con herramientas agnósticas (`tools: [read_file, write_file, ...]`) y niveles de modelo (`model_tier: pro | balanced | light`).
   - `src/skills/`: Definiciones canónicas de las 4 skills (`feature`, `reglas-equipo`, `equipo-panel`, `equipo-reiniciar`). Utiliza tokens de reemplazo contextual (`{{AGENT_GUIDE_FILE}}`, `{{CMD_TOOL}}`, `{{SEARCH_TOOL}}`, `{{SUBAGENT_DISPATCH_GUIDE}}`, `{{UX_SEARCH_LOCATION}}`).

2. **`platforms/` (Adaptadores Modulares)**:
   - Cada plataforma cuenta con un subdirectorio propio con un archivo descriptor `platform.json` que define el mapeo de capacidades, transformaciones de texto, assets específicos y rutas de salida.
   - `platforms/claude-code/`: Define mapeo hacia las herramientas nativas de Claude Code (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `WebSearch`), modelos (`opus`, `sonnet`, `haiku`), manifiesto en `.claude-plugin/plugin.json`, e incluye los hooks y tipos TypeScript (`hooks/register.tsx`, `hooks/hooks.json`, `types/index.d.ts`).
   - `platforms/antigravity/`: Define mapeo hacia las herramientas de Antigravity (`view_file`, `write_to_file`, `replace_file_content`, `run_command`, etc.), modelos (`pro`, `inherit`, `flash`), parámetros requeridos (`subagent: true`, `mainAgent: false`), hooks de bitácora (`hooks/bitacora.mjs`, `hooks.json`) y overrides de skills para ejecución en terminal/chat (`skills/equipo-panel/SKILL.md`, `skills/equipo-reiniciar/SKILL.md`).
   - `platforms/cursor/`: Define contratos y plantillas para generación de directivas `.cursorrules` / `.cursor/rules/`.
   - `platforms/copilot/`: Define contratos y plantillas para `.github/copilot-instructions.md`.

3. **`scripts/build.mjs` (Compilador Central Unificado)**:
   - Motor CLI autónomo escrito en Node.js puro (ESM, compatible con Node 18+, sin dependencias externas).
   - Lee `src/`, carga los adaptadores de `platforms/`, realiza la validación de integridad, resuelve los tokens contextuales y emite los artefactos a `dist/<target>/equipo-dev/`.
   - Admite compilación selectiva (`--target <nombre>`), limpieza previa (`--clean`) e instalación local automatizada (`--install`).

4. **`tests/build.test.mjs` (Validación Automatizada)**:
   - Suite de pruebas de regresión que valida la integridad de los manifiestos generados, resolución correcta de herramientas y tiempo de build < 5s.

### 2.2 Inventario de Archivos Afectados

| Operación | Ruta de Archivo | Propósito |
|---|---|---|
| **Crear** | `src/manifest.json` | Manifiesto canónico agnóstico |
| **Crear** | `src/agents/*.md` (7 archivos) | Definición agnóstica de los roles con herramientas y tiers canónicos |
| **Crear** | `src/skills/*/*.md` (4 skills) | Definición canónica de habilidades con placeholders contextuales |
| **Crear** | `platforms/claude-code/platform.json` | Configuración de mapeo y empaquetado para Claude Code |
| **Mover** | `hooks/*` → `platforms/claude-code/hooks/*` | Hooks de UI para Claude Code |
| **Mover** | `types/*` → `platforms/claude-code/types/*` | Definiciones de tipos para Claude Code |
| **Crear** | `platforms/antigravity/platform.json` | Configuración de mapeo y empaquetado para Antigravity |
| **Mover** | `antigravity/hooks/*` → `platforms/antigravity/hooks/*` | Hooks de bitácora para Antigravity |
| **Mover** | `antigravity/hooks.json` → `platforms/antigravity/hooks.json` | Manifiesto de hooks para Antigravity |
| **Mover** | `antigravity/skills/*` → `platforms/antigravity/skills/*` | Overrides de skills para Antigravity |
| **Crear** | `platforms/cursor/platform.json` | Contrato y configuración base para Cursor |
| **Crear** | `platforms/cursor/templates/.cursorrules` | Plantilla base de reglas de equipo para Cursor |
| **Crear** | `platforms/copilot/platform.json` | Contrato y configuración base para GitHub Copilot |
| **Crear** | `platforms/copilot/templates/copilot-instructions.md` | Plantilla base de instrucciones para Copilot |
| **Crear** | `scripts/build.mjs` | Compilador unificado multi-plataforma |
| **Crear** | `tests/build.test.mjs` | Suite de tests del proceso de build y paridad |
| **Modificar** | `README.md` | Documentación del repositorio actualizada a la nueva arquitectura |
| **Eliminar** | `scripts/build-antigravity.mjs` | Reemplazado por `scripts/build.mjs` |
| **Eliminar** | `agents/`, `skills/`, `.claude-plugin/`, `antigravity/` | Raíces acopladas eliminadas tras migración |

---

## 3. Alternativas Descartadas

### Alternativa 1: Mantener Claude Code en raíz y añadir generadores paralelos (`build-cursor.mjs`, `build-copilot.mjs`)
- **Descripción**: Mantener `agents/` y `skills/` en la raíz con sintaxis de Claude Code, creando scripts individuales para cada plataforma.
- **Motivo de descarte**: Perpetúa el acoplamiento conceptual con Claude Code. Cada nuevo destino de IA incrementaría la complejidad de expresiones regulares ad-hoc, derivando en inconsistencias de comportamiento y alto costo de mantenimiento al modificar instrucciones de los roles.

### Alternativa 2: Introducir empaquetadores externos (Webpack, Rollup, Vite o TypeScript compiler con npm)
- **Descripción**: Utilizar un ecosistema npm estándar con dependencias de compilación y bundling.
- **Motivo de descarte**: Viola el principio de simplicidad del proyecto ("cero dependencias externas, solo Node 18+"). Introduciría la necesidad de `npm install`, bloqueos de dependencias, mayor latencia de build y posibles vulnerabilidades de seguridad en la cadena de suministro innecesarias para un pipeline de transformación de Markdown/JSON.

### Alternativa 3: Separar metadatos en archivos JSON independientes y plantillas Markdown sin frontmatter
- **Descripción**: Definir los agentes como pares `product-owner.meta.json` y `product-owner.prompt.md`.
- **Motivo de descarte**: Dispersa innecesariamente la información y rompe la ergonomía de lectura y edición. El estándar unificado Markdown con frontmatter YAML es ampliamente soportado, legible para humanos y procesable de forma trivial en Node.js.

---

## 4. Contratos y Transformaciones

### 4.1 CLI del Compilador Unificado (`scripts/build.mjs`)

```
Sintaxis:
  node scripts/build.mjs [opciones]

Opciones:
  --target <id>    Compila únicamente el target especificado ('claude-code', 'antigravity', 'cursor', 'copilot', 'all').
                   Por defecto: 'all'.
  --install        Sincroniza los artefactos generados con el directorio local de plugins configurado.
                   Aplica para los targets que definan 'install' en su plataforma.
  --clean          Elimina el directorio dist/ antes de compilar.
  --help           Muestra la guía de uso.

Códigos de retorno:
  0: Compilación (e instalación, si aplica) completada sin errores.
  1: Error de validación (archivo faltante, frontmatter inválido, error de I/O o ruta inaccesible).
```

### 4.2 Manifiesto Canónico (`src/manifest.json`)

```json
{
  "name": "equipo-dev",
  "displayName": "Equipo Dev",
  "version": "0.5.0",
  "description": "Equipo de desarrollo de software con subagentes (Product Owner, Diseñador UI/UX, Arquitecto, Backend, Frontend, QA y Code Reviewer), el flujo /feature con aprobaciones del dueño y panel/estado en vivo.",
  "author": {
    "name": "GeboArt.Dev"
  },
  "keywords": [
    "desarrollo",
    "subagentes",
    "ux",
    "product-owner",
    "arquitectura",
    "qa",
    "code-review"
  ],
  "suggestedPrompts": [
    "/feature reservas de citas online",
    "/feature continuemos con CheckIn",
    "/equipo-panel"
  ]
}
```

### 4.3 Formato Canónico de Agentes (`src/agents/<rol>.md`)

```markdown
---
name: architect
description: "Úsalo después de que el dueño apruebe la spec del Product Owner..."
model_tier: pro
color: magenta
tools:
  - read_file
  - write_file
  - find_by_name
  - grep_search
  - web_search
---
Eres el Arquitecto de Software del equipo.

## Entrada
`docs/specs/<feature>.md` aprobada...

## Antes de diseñar
1. Lee el {{AGENT_GUIDE_FILE}} del proyecto: el stack definido ahí es obligatorio.
...
```

### 4.4 Formato Canónico de Habilidades (`src/skills/<skill>/SKILL.md`)

```markdown
---
name: feature
description: "Ejecuta o retoma el flujo del equipo para una feature..."
---
# Flujo /feature

...
{{SUBAGENT_DISPATCH_GUIDE}}
...
```

### 4.5 Descriptor del Adaptador de Plataforma (`platforms/<target>/platform.json`)

**Antigravity (`platforms/antigravity/platform.json`)**:
```json
{
  "id": "antigravity",
  "displayName": "Google Antigravity",
  "status": "active",
  "output": {
    "dir": "dist/antigravity/equipo-dev",
    "manifestFile": "plugin.json"
  },
  "manifest": {
    "fields": ["name", "displayName", "version", "description", "suggestedPrompts"]
  },
  "tools": {
    "read_file": ["view_file", "list_dir"],
    "list_dir": ["list_dir"],
    "write_file": ["write_to_file"],
    "edit_file": ["replace_file_content", "multi_replace_file_content"],
    "execute_command": ["run_command", "command_status"],
    "find_by_name": ["find_by_name"],
    "grep_search": ["grep_search"],
    "web_search": ["search_web"],
    "web_fetch": ["read_url_content"]
  },
  "models": {
    "pro": "pro",
    "balanced": "inherit",
    "light": "flash"
  },
  "frontmatter": {
    "inject": {
      "subagent": true,
      "mainAgent": false
    },
    "drop": ["color", "skills", "permissionMode"]
  },
  "tokens": {
    "{{AGENT_GUIDE_FILE}}": "`AGENTS.md` (o `GEMINI.md` / `CLAUDE.md`)",
    "{{CMD_TOOL}}": "`run_command`",
    "{{SEARCH_TOOL}}": "(`find_by_name` / `grep_search`)",
    "{{SUBAGENT_DISPATCH_GUIDE}}": "En Antigravity, lanza cada rol con `invoke_subagent` usando como `TypeName` el nombre del agente del plugin...",
    "{{UX_SEARCH_LOCATION}}": "Búscalo con `find_by_name` (patrón `search.py`) dentro de `~/.gemini/config/plugins/`..."
  },
  "overrides": {
    "skillsDir": "platforms/antigravity/skills"
  },
  "assets": [
    { "from": "platforms/antigravity/hooks.json", "to": "hooks.json" },
    { "from": "platforms/antigravity/hooks", "to": "hooks" }
  ],
  "install": {
    "targetDir": "~/.gemini/config/plugins/equipo-dev",
    "preserve": ["state"]
  }
}
```

**Claude Code (`platforms/claude-code/platform.json`)**:
```json
{
  "id": "claude-code",
  "displayName": "Claude Code",
  "status": "active",
  "output": {
    "dir": "dist/claude-code/equipo-dev",
    "manifestFile": ".claude-plugin/plugin.json"
  },
  "manifest": {
    "fields": ["name", "version", "description", "author", "keywords", "types"],
    "extraFields": {
      "types": "./types/index.d.ts"
    }
  },
  "tools": {
    "read_file": ["Read"],
    "list_dir": ["Read"],
    "write_file": ["Write"],
    "edit_file": ["Edit"],
    "execute_command": ["Bash"],
    "find_by_name": ["Glob"],
    "grep_search": ["Grep"],
    "web_search": ["WebSearch"],
    "web_fetch": ["WebFetch"]
  },
  "models": {
    "pro": "opus",
    "balanced": "sonnet",
    "light": "haiku"
  },
  "frontmatter": {
    "inject": {},
    "drop": []
  },
  "tokens": {
    "{{AGENT_GUIDE_FILE}}": "`CLAUDE.md`",
    "{{CMD_TOOL}}": "Bash",
    "{{SEARCH_TOOL}}": "(Glob/Grep)",
    "{{SUBAGENT_DISPATCH_GUIDE}}": "Actúa como orquestador. Delega cada paso en su subagente y respeta las pausas.",
    "{{UX_SEARCH_LOCATION}}": "Búscalo con Glob: `~/.claude/plugins/**/ui-ux-pro-max/scripts/search.py`."
  },
  "assets": [
    { "from": "platforms/claude-code/hooks", "to": "hooks" },
    { "from": "platforms/claude-code/types", "to": "types" }
  ]
}
```

### 4.6 Matriz Canónica de Mapeo de Capacidades / Tools

| Capacidad Canónica | Claude Code | Antigravity | Cursor (Directiva) | Copilot (Directiva) |
|---|---|---|---|---|
| `read_file` | `Read` | `view_file` | Read / Workspace Inspection | Codebase Context |
| `list_dir` | `Read` | `list_dir` | Directory Listing | Directory Context |
| `write_file` | `Write` | `write_to_file` | File Creation | File Generation |
| `edit_file` | `Edit` | `replace_file_content`, `multi_replace_file_content` | Code Editing | Inline Editing |
| `execute_command` | `Bash` | `run_command`, `command_status` | Terminal Execution | Terminal Execution |
| `find_by_name` | `Glob` | `find_by_name` | File Finder | File Search |
| `grep_search` | `Grep` | `grep_search` | Codebase Grep | Text Grep |
| `web_search` | `WebSearch` | `search_web` | Web Search | Web Search |
| `web_fetch` | `WebFetch` | `read_url_content` | URL Fetch | URL Fetch |

### 4.7 Matriz Canónica de Tiers de Modelos

| Tier Canónico | Propósito | Claude Code | Antigravity | Cursor | GitHub Copilot |
|---|---|---|---|---|---|
| `pro` | Razonamiento avanzado (PO, Arquitecto, UX, Reviewer) | `opus` | `pro` | `claude-3-5-sonnet` / `o1` | `claude-3.5-sonnet` / `o1` |
| `balanced` | Implementación y validación (Backend, Frontend, QA) | `sonnet` | `inherit` | `claude-3-5-sonnet` | `claude-3.5-sonnet` |
| `light` | Tareas de baja latencia o auxiliares | `haiku` | `flash` | `gpt-4o-mini` | `gpt-4o-mini` |

---

## 5. Seguridad y Validación

1. **Validación Sintáctica en Build-Time**:
   - `build.mjs` valida la existencia de campos requeridos (`name`, `description`, `model_tier`, `tools`) en el frontmatter de cada agente antes de generar cualquier artefacto en `dist/`.
   - Si se detecta una herramienta canónica no registrada o un tier inválido, el proceso se interrumpe con código de salida `1` indicando el archivo exacto y el error, evitando artefactos corruptos.
2. **Protección de Rutas (Path Traversal Prevention)**:
   - Toda resolución de rutas en el compilador y en el módulo de instalación emplea `path.resolve` y valida que las rutas de destino pertenezcan estrictamente a subdirectorios autorizados (`dist/` y `~/.gemini/config/plugins/`).
3. **Preservación de Estado de Sesión en Instalación**:
   - Al ejecutar `build.mjs --install`, el sincronizador respeta la lista blanca `preserve` definida en `platform.json` (por ejemplo, `state/` en Antigravity para preservar `bitacora.jsonl`). Nunca se eliminan ni sobreescriben datos acumulados de ejecuciones previas del usuario.
4. **Resiliencia ante Entornos No Disponibles**:
   - Si la ruta de instalación local no existe o no cuenta con permisos de escritura, el script emite una advertencia descriptiva y conserva los artefactos en `dist/` sin abortar catastróficamente ni dejar archivos a medias.
5. **Aislamiento de Ejecución**:
   - `build.mjs` opera exclusivamente mediante APIs estándar de Node.js (`fs`, `path`, `os`), sin invocar procesos del shell arbitrarios ni descargar binarios remotos.

---

## 6. Plan de Implementación Ordenado

Todas las tareas están asignadas al desarrollador backend (`backend-dev`), dado que esta feature es de reestructuración técnica e infraestructura interna:

- [ ] **Tarea 1 [backend-dev]**: Crear la estructura canónica de directorios y el manifiesto base.
  - *Archivos a crear*:
    - `src/manifest.json`
    - `src/agents/` (directorio)
    - `src/skills/` (directorio)
    - `platforms/claude-code/` (directorio)
    - `platforms/antigravity/` (directorio)
    - `platforms/cursor/` (directorio)
    - `platforms/copilot/` (directorio)
- [ ] **Tarea 2 [backend-dev]**: Crear las definiciones agnósticas de agentes en `src/agents/`.
  - *Archivos a crear*:
    - `src/agents/product-owner.md`
    - `src/agents/ux-designer.md`
    - `src/agents/architect.md`
    - `src/agents/backend-dev.md`
    - `src/agents/frontend-dev.md`
    - `src/agents/qa-engineer.md`
    - `src/agents/code-reviewer.md`
  - *Detalle*: Traducir herramientas a nombres canónicos (`read_file`, `write_file`, etc.), reemplazar modelos con `model_tier` (`pro`, `balanced`), y parametrizar menciones de guías y herramientas con tokens `{{AGENT_GUIDE_FILE}}`, `{{SEARCH_TOOL}}`, `{{CMD_TOOL}}`, etc.
- [ ] **Tarea 3 [backend-dev]**: Crear las definiciones agnósticas de habilidades en `src/skills/`.
  - *Archivos a crear*:
    - `src/skills/feature/SKILL.md` (incorporando placeholder `{{SUBAGENT_DISPATCH_GUIDE}}`)
    - `src/skills/reglas-equipo/SKILL.md` (incorporando placeholder `{{AGENT_GUIDE_FILE}}`)
    - `src/skills/equipo-panel/SKILL.md`
    - `src/skills/equipo-reiniciar/SKILL.md`
- [ ] **Tarea 4 [backend-dev]**: Configurar el adaptador de Claude Code en `platforms/claude-code/`.
  - *Archivos a crear/mover*:
    - Crear `platforms/claude-code/platform.json` (mapeos de tools, modelos, tokens y assets).
    - Mover `hooks/register.tsx` y `hooks/hooks.json` → `platforms/claude-code/hooks/`
    - Mover `types/index.d.ts` → `platforms/claude-code/types/`
- [ ] **Tarea 5 [backend-dev]**: Configurar el adaptador de Antigravity en `platforms/antigravity/`.
  - *Archivos a crear/mover*:
    - Crear `platforms/antigravity/platform.json` (mapeos de tools, modelos `pro`/`inherit`/`flash`, flags `subagent: true`, tokens y assets).
    - Mover `antigravity/hooks/bitacora.mjs` y `antigravity/hooks.json` → `platforms/antigravity/hooks/`
    - Mover `antigravity/skills/equipo-panel/SKILL.md` y `antigravity/skills/equipo-reiniciar/SKILL.md` → `platforms/antigravity/skills/`
- [ ] **Tarea 6 [backend-dev]**: Configurar adaptadores base y plantillas para Cursor y GitHub Copilot.
  - *Archivos a crear*:
    - `platforms/cursor/platform.json`
    - `platforms/cursor/templates/.cursorrules`
    - `platforms/copilot/platform.json`
    - `platforms/copilot/templates/copilot-instructions.md`
- [ ] **Tarea 7 [backend-dev]**: Implementar el compilador central `scripts/build.mjs`.
  - *Archivos a crear/modificar*:
    - Crear `scripts/build.mjs` con soporte para CLI flags (`--target`, `--install`, `--clean`), carga y validación de `src/`, motor de resolución de tokens y frontmatter, empaquetado hacia `dist/<target>/equipo-dev/` y módulo de instalación segura.
- [ ] **Tarea 8 [backend-dev]**: Implementar suite de pruebas automatizadas del build.
  - *Archivos a crear*:
    - Crear `tests/build.test.mjs` (empleando `node:test` nativo) para verificar compilación completa de todos los targets, presencia de manifiestos requeridos, traducción correcta de tools/models y tiempo < 5s.
- [ ] **Tarea 9 [backend-dev]**: Limpieza de directorios legados y actualización de documentación.
  - *Archivos a eliminar/modificar*:
    - Eliminar `scripts/build-antigravity.mjs`
    - Eliminar directorios redundantes en la raíz: `agents/`, `skills/`, `.claude-plugin/`, `antigravity/`, `hooks/`, `types/`
    - Actualizar `README.md` del repositorio reflejando la nueva arquitectura `src/` + `platforms/` y el nuevo comando de compilación unificado.

---

## 7. Riesgos y Consecuencias

### Consecuencias Positivas
- **Única Fuente de Verdad Real**: Los cambios en roles o skills se realizan en un solo lugar (`src/`), eliminando divergencias entre Claude Code y Antigravity.
- **Extensibilidad Abierta**: Agregar soporte para una nueva plataforma de IA sólo requiere crear una carpeta en `platforms/<nueva-plataforma>/` con su `platform.json` y templates correspondientes, sin tocar `src/`.
- **Rendimiento Inmediato**: El script de construcción corre en Node.js puro sin dependencias y completa el build global de todos los targets en menos de 300ms.
- **Determinismo y Validación**: Errores tipográficos en herramientas o metadatos de agentes se detectan de inmediato durante el build antes de desplegar.

### Riesgos Identificados y Mitigaciones
1. **Riesgo**: Que una plataforma futura requiera semánticas de subagentes incompatibles con el modelo de prompts en markdown.
   - *Mitigación*: La estructura basada en tokens contextuales y plantillas permite transformar el cuerpo del agente en formatos alternativos (por ejemplo, directivas de sistema consolidadas para Cursor o Copilot) sin alterar el archivo canónico.
2. **Riesgo**: Pérdida accidental del historial de bitácora en Antigravity durante una actualización con `--install`.
   - *Mitigación*: Se preserva estrictamente el directorio `state/` mediante la lista blanca declarativa `preserve: ["state"]` en `platforms/antigravity/platform.json`.
3. **Riesgo**: Desincronización de herramientas reconocidas por plataformas cliente.
   - *Mitigación*: `platform.json` valida que solo se emitan herramientas verificadas de cada plataforma, emitiendo advertencias claras si una capacidad no cuenta con soporte nativo.

---

ADR listo para aprobación del dueño.

