# Contexto del proyecto

Equipo Dev genera adaptadores para asistentes de programación desde una fuente común.

## Estructura y stack
- `src/agents/` y `src/skills/`: definiciones canónicas en Markdown.
- `src/manifest.json`: metadatos comunes.
- `platforms/`: configuración y recursos específicos de cada plataforma.
- `scripts/build.mjs`: compilador en JavaScript ESM con módulos nativos de Node.js 18 o superior.
- `dist/`: artefactos generados; modificar las fuentes, no estos archivos.
- `docs/specs/`, `docs/ux/`, `docs/adr/`, `docs/qa/`: entregables del flujo del equipo.

## Comandos
- Ayuda: `node scripts/build.mjs --help`.
- Compilar: `node scripts/build.mjs --target <plataforma>`.
- Tests del compilador: `node --test tests/build.test.mjs`.
- Verificación QA: `node --test tests/qa-verification.test.mjs`.
- Tests de optimización: `node --test tests/agent-optimization.test.mjs`.
- Tests de Codex: `node --test tests/codex.test.mjs`.
- Suite completa secuencial (evita conflictos sobre `dist/` en Windows): `node --test --test-concurrency=1 tests/build.test.mjs tests/qa-verification.test.mjs tests/agent-optimization.test.mjs tests/codex.test.mjs`.

## Restricciones
- Respetar los cambios pendientes del usuario y otras features.
- Mantener las definiciones compartidas en `src/` y las diferencias en cada adaptador.
- Validar contención de rutas antes de instalar o limpiar; preservar configuración y archivos ajenos.
- Ejecutar pruebas de instalación en directorios temporales, sin modificar el entorno personal.
- No leer secretos ni hacer commit o push sin autorización explícita.
- Seguir las aprobaciones de especificación y ADR del flujo `feature`.
