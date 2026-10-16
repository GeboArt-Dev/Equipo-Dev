# Historial de Cambios (Changelog)

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.0] - 2026-10-16

### Añadido
- **Modos de Ejecución Autónomo y Supervisado**: Incorporación de modificadores `--no-pause` y `--auto-approve` para el comando `/feature`, permitiendo ejecuciones continuas desatendidas sin pausas en las compuertas de diseño, preservando de manera inviolable las compuertas de seguridad (`git commit`, `git push`, comandos destructivos) (ADR 005).
- **Instalación Simultánea Multi-Plataforma**: Comando CLI `--install-all` en `scripts/build.mjs` y script `npm run install:all` para compilar e instalar al mismo tiempo en Google Antigravity, Claude Code y OpenAI Codex.
- **Adaptador para OpenAI Codex**: Soporte nativo para OpenAI Codex vía `scripts/codex.mjs`, empaquetado determinista, instalación transaccional automatizada en `~/.agents/skills`, rollback y suite de pruebas dedicadas (ADR 004).
- **Optimización de Prompts y Ahorro de Tokens**: Rediseño integral de los 7 prompts canónicos en `src/agents/`, reduciendo el consumo de tokens (~15-30%), exigiendo diagnóstico directo en 1ª frase y calibración epistémica con `[Seguro]`, `[Probable]`, `[Especulando]` para PO y Architect (ADR 002).
- **Rol de DevOps Integrado en Backend Dev**: Generación automática de Dockerfiles multi-stage y pipelines CI/CD en YAML completos con instrucciones operativas directas (≤ 3 oraciones).
- **Rol de Documentador Integrado en QA Engineer**: Mantenimiento automático del `README.md` del proyecto y documentación técnica de nuevas funciones y hooks en una sola frase corta al verificar tareas.
- **Enfoque Mobile-First y Accesibilidad WCAG 2.1 AA**: Reglas de maquetación prioritarias para móviles (< 640px), enlace estricto a tokens del design system y checklist WCAG 2.1 AA (contraste ≥ 4.5:1, áreas de toque ≥ 44x44px, foco visible y navegación por teclado) en `ux-designer` y `frontend-dev`.
- **Filtro Exclusivo de Hallazgos Críticos**: `code-reviewer` restringe observaciones al 100% en defectos bloqueantes de seguridad, contratos o lógica, eliminando debates subjetivos de estilo.
- **Ampliación de Pruebas Automatizadas**: Cobertura expandida a 58 pruebas automatizadas nativas (`58/58 passed`), incorporando `tests/agent-optimization.test.mjs`, `tests/codex.test.mjs` y `tests/approval-control.test.mjs`.

### Cambiado
- **Renombrado de Habilidad Canónica**: Renombrado de `equipo-panel` a `team-report` (`/team-report`) en definiciones canónicas, adaptadores de plataforma, pruebas y documentación (ADR 003).
- **Actualización Integral de Documentación**: Sincronización completa de las guías en inglés y español con especificaciones de modos de ejecución, instalación multi-plataforma y tablas de referencia.

---

## [0.5.0] - 2026-10-14

### Añadido
- **Arquitectura Multi-IA**: Reestructuración de `equipo-dev` bajo el patrón Source-Adapter-Target (`src/`, `platforms/`, `dist/`), separando la lógica agnóstica de los adaptadores de cada host de IA (ADR 001).
- **Compilador Nativo sin Dependencias**: Compilador CLI nativo en Node.js 18+ (`scripts/build.mjs`) compatible con Google Antigravity, Claude Code, Cursor y GitHub Copilot.
- **Protección contra Path Traversal**: Validación estricta de rutas con `assertWithin` y verificación de destinos de instalación autorizados (`isAuthorizedInstallTarget`).
- **Suites de Pruebas del Compilador**: Añadidas `tests/build.test.mjs` y `tests/qa-verification.test.mjs`.

---

## [0.4.1] - 2026-10-13

### Cambiado
- Migración de las herramientas de estado y reinicio a habilidades estándar (`equipo-panel`, `equipo-reiniciar`).
- Soporte de salida en texto estructurado como fallback para entornos sin panel gráfico lateral.

---

## [0.4.0] - 2026-10-12

### Añadido
- Reanudación de funcionalidades en curso: `/feature continuemos con <nombre>` escanea automáticamente artefactos en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/` para retomar el flujo desde el último paso sin repetir trabajo completado.

---

## [0.3.0] - 2026-10-10

### Añadido
- **Rol de Diseñador UI/UX**: Incorporación del subagente `ux-designer` integrado con `ui-ux-pro-max`, generando `docs/ux/<feature>.md` y tokens en `design-system/`.
- Expansión del equipo de desarrollo a 7 roles de ingeniería especializados.

---

## [0.2.0] - 2026-10-08

### Añadido
- Panel lateral en vivo para Claude Code y bitácora de sesión (`bitacora.mjs`) para seguimiento de subagentes y compuertas de aprobación del dueño.
- Creación de los comandos `/equipo-panel` y `/equipo-reiniciar`.

---

## [0.1.0] - 2026-10-05

### Añadido
- Versión inicial del equipo de desarrollo de software `equipo-dev` con ciclo ágil: Product Owner, Arquitecto, Backend Developer, Frontend Developer, QA Engineer y Code Reviewer.
- Dos compuertas obligatorias de aprobación humana (Especificación y Arquitectura).
