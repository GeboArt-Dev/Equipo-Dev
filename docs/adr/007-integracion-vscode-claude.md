# ADR 007: Instalación y actualización de Equipo Dev en Claude y VS Code

Fecha: 2026-10-22. Estado: aprobado explícitamente por el dueño («Aprovado»); implementación en curso.
Entrada: `docs/specs/integracion-vscode-claude.md`, aprobada. Historias: H1–H6.

## Contexto y diagnóstico

[Seguro] El instalador actual copia archivos a `~/.claude/plugins/equipo-dev`; no registra un marketplace ni demuestra carga. `buildTarget` copia carpetas de skills literalmente y no elimina residuos de versiones anteriores. `packageTarget` añade un manifiesto raíz y renombra ZIP a `.plugin`; ese sufijo no acredita compatibilidad con ninguno de los dos clientes. `dist/` está ignorado en Git. Stack: Node.js 18+, ESM y módulos nativos, según `CLAUDE.md`; no existe `AGENTS.md` en la raíz.

[Seguro] Evidencia local reunida por el orquestador: fuente y copia manual Claude `0.7.0`; caché de VS Code `~/.vscode/agent-plugins/github.com/GeboArtDev/equipo-dev` en `0.4.1`; `claude plugin list --json` registra **`equipo-dev@synced`, versión `0.6.0`, scope `synced`, enabled `true`**, dentro de `~/.claude/plugins/synced/...`. CLI independiente `2.1.296`; extensión oficial `anthropic.claude-code` `2.1.301`. Son cuatro observaciones distintas; ninguna demuestra por sí sola la versión cargada en una conversación abierta de la extensión.

[Probable] El origen sincronizado explica por qué copiar `0.7.0` no actualizó el registro usado por Claude. Debe comprobarse en la extensión antes de atribuirle causalidad definitiva. La caché de plugins VS Code pertenece a otro gestor.

## Decisión

### 1. Dos adaptadores, dos gestores

Mantener `claude-code` para Claude oficial (incluida su extensión) y añadir `vscode-agent` para plugins de agentes de VS Code. No modificar el adaptador `copilot` draft como efecto lateral. Ambos derivan de `src/`, conservan identidad `equipo-dev` y versión canónica; la entrega incrementará la versión, evitando reutilizar `0.7.0` para bytes diferentes.

| Componente | Claude oficial | Plugins VS Code |
| --- | --- | --- |
| Manifiesto | `.claude-plugin/plugin.json` | `plugin.json`, Agent Plugins 1.0 |
| Skills | `feature`, `fix`, `team-report`, `team-reset`, `team-rules` | Las mismas, con instrucciones adaptadas al host |
| Roles | Siete agentes Claude | Siete `.agent.md` en `com.github.copilot/agents/`, herramientas del host; no modelos Claude fijos |
| Reporte | Panel existente si el mod funciona; alternativa documental existente | Reporte documental |
| Reset | Estado del panel si está activo; alternativa no destructiva | Explicación sin borrar documentos |
| Hooks TSX y tipos | Conservar y validar como mod Claude | No incluir; no existe equivalencia prometida |

[Seguro] `hooks/hooks.json` contiene `modules: ["./register.tsx"]`; el módulo importa `claude-code`, y `types/index.d.ts` amplía `PluginState`. Es una estructura documentada de **mods**, no un hook shell inválido. Validar eventos, imports y tipos con el cliente real; no retirar `types` aplicando solo el esquema genérico de plugins. La capacidad de dibujar depende de la extensión y del entorno; no es requisito para el reporte documental. [Referencia mods](https://code.claude.com/docs/en/plugins/mods/reference), [extensión](https://code.claude.com/docs/en/vs-code).

[Seguro] Las carpetas fuente `reglas-equipo` y `equipo-reiniciar` difieren de sus nombres declarados. Generar carpetas `team-rules` y `team-reset`, actualizar referencias internas en los artefactos y detectar nombres duplicados antes de escribir. Construir árboles completos en staging, sin arrastrar `equipo-panel` ni otros residuos. VS Code exige coincidencia nombre/directorio. [Guía VS Code](https://code.visualstudio.com/docs/agent-customization/agent-plugins).

### 2. Distribución local reproducible primero

Generar un marketplace **local** autocontenido en `dist/marketplace/`, nombre `equipo-dev-local`, con `.claude-plugin/marketplace.json` y `plugins/equipo-dev/` (paquete Claude). Su entrada usa `source: "./plugins/equipo-dev"`; versión del índice y manifiesto coinciden. Prepararlo mediante `node scripts/build.mjs --target claude-code` antes de registrarlo. La ruta absoluta del checkout debe permanecer estable; reconstruir antes de actualizar. `--clean` elimina el artefacto, por lo que nunca debe ejecutarse entre preparación y gestión del cliente.

Para VS Code, generar `dist/vscode-agent/equipo-dev/` y registrar esa ubicación local mediante la interfaz de Settings, clave pública `chat.pluginLocations`. El script imprime un fragmento JSON con ruta absoluta y `true`; no sobrescribe `settings.json`. El usuario integra solo esa entrada y conserva las existentes. No afirmar que el paquete está instalado porque se imprimió el fragmento. [Formato y estructura](https://code.visualstudio.com/docs/agents/reference/agent-plugin-reference).

No anunciar instalación desde el GitHub actual: el consumidor no ejecuta nuestro build y `dist/` no se publica. `--package` debe producir ZIP por host con sus archivos ocultos y metadatos/checksums; no añadir manifiestos contradictorios ni vender `.plugin` como instalador universal. El ZIP de marketplace incluye su índice y paquete. Quien lo reciba lo extrae en ubicación estable y sigue el registro local.

Distribución remota futura, sin publicar en esta feature: preparar el mismo árbol generado para un repositorio/rama de distribución con archivos realmente versionados y commit identificable. Solo después de una publicación autorizada se podrá documentar su URL para `marketplace add` o **Chat: Install Plugin From Source**. No generar un índice remoto que apunte al `dist/` ignorado del repositorio fuente. [Marketplace Claude](https://code.claude.com/docs/en/plugin-marketplaces).

### 3. Gestión oficial y migración sin duplicados

Sustituir la copia directa de `--target claude-code --install` por preflight + gestor oficial, manteniendo el argumento por compatibilidad. `--install-all` debe pasar por el mismo preflight y comunicar estado por host; no puede seguir anunciando éxito global tras una copia manual.

Contrato propuesto adicional: `node scripts/host-plugins.mjs <diagnose|install|update> --host <claude-code|vscode-agent> [--json]`. `diagnose` es solo lectura; `install/update` preparan artefactos y gestionan exclusivamente el origen propio. Para VS Code devuelven instrucciones de Settings/cliente y estado `manual-action-required`, sin fingir una API de instalación CLI. Sin nuevos endpoints HTTP ni base de datos.

Flujo Claude, comandos nativos comprobados con `--help`, siempre invocados con argumentos separados y `shell: false`:

```text
claude plugin marketplace list --json
claude plugin list --json
claude plugin validate <ruta-marketplace>
claude plugin marketplace add <ruta-marketplace> --scope user
claude plugin install equipo-dev@equipo-dev-local --scope user
claude plugin marketplace update equipo-dev-local
claude plugin update equipo-dev@equipo-dev-local --scope user
```

Consultar capacidades CLI antes de usar opciones en clientes antiguos. `install`: añadir únicamente si no existe ese marketplace; instalar únicamente si falta esa identidad/scope. `update`: refrescar únicamente ese catálogo y después actualizar ese plugin. Un catálogo actualizado no demuestra paquete actualizado. Confirmar registro posterior y solicitar `/reload-plugins` o sesión nueva en la extensión; si el diálogo ofrece recarga/reinicio, usarlo. Registrar extensión y CLI separadamente. [Gestión Claude](https://code.claude.com/docs/en/discover-plugins).

**Conflicto actual:** `equipo-dev@synced` no es nuestro marketplace. Preflight devuelve `origin-conflict`, identifica origen/versión y no instala otra copia silenciosamente. El usuario elige mantener el origen sincronizado y actualizarlo desde su cuenta, o deshabilitarlo mediante el gestor de Claude y usar el marketplace local. No ejecutar `plugin update equipo-dev@synced`, borrar caché sincronizada ni modificar registros para simular migración. Si el plugin es obligatorio por política, detener la migración y explicar esa restricción. Después repetir diagnóstico. Una copia manual sin registro queda preservada como legado, no se trata automáticamente como instalación activa.

En VS Code gestionar desde la misma interfaz que creó el registro: Agent Customizations/Agent Plugins y sus actualizaciones, o el inventario `/plugin` del harness si ese fue el origen. No mezclar inventarios. Antes de activar la ubicación local, identificar la copia antigua y deshabilitarla desde su interfaz cuando proceda, con decisión expresa del usuario. Para un paquete remoto ya administrado usar **Extensions: Check for Extension Updates**; para el nuevo paquete local reconstruir la misma ruta y comprobar/reabrir la sesión o recargar ventana. No modificar `~/.vscode/agent-plugins/` ni prometer actualización remota del artefacto local.

## Contratos de diagnóstico y errores

Salida JSON versión 1: `host`, `clientVersion`, `sourceVersion`, `artifacts[]`, `registrations[]`, `loaded`, `issues[]`, `nextSteps[]`. Cada artefacto: `path`, `version`, `sha256`, `origin`; cada registro: `id`, `scope`, `origin`, `enabled`, `version`, `evidence`. `loaded` contiene `status: unknown|verified`, versión nullable, evidencia del cliente y fecha. Nunca derivar `verified` de archivos o de `enabled: true`. Mostrar discrepancias sin escoger automáticamente la versión mayor.

Estados de operaciones: `prepared`, `registered`, `updated`, `unchanged`, `manual-action-required`, `failed`. Códigos de fallo identificables: `client-missing`, `unsupported-client`, `invalid-package`, `origin-conflict`, `path-conflict`, `command-failed`, `verification-pending`. Exit 0: operación técnica completada; 2: acción manual/conflicto; 1: fallo. El reconocimiento pendiente se presenta explícitamente incluso si el gestor terminó con exit 0. Guardar reporte solo cuando se solicita, sin stdout sensible ni contenido completo del perfil.

La migración afecta el mecanismo de distribución, no documentos ni estado del equipo. No borrar instalación legacy o datos para «limpiar». Si un gestor falla después de registrar el marketplace, informar el paso alcanzado y permitir reintento idempotente; no eliminar el marketplace como rollback, pues esa operación puede desinstalar otros plugins. Conservar artefacto previo hasta validar el nuevo; recuperación usando versión previa conocida mediante el gestor, nunca parcheando su caché.

## Seguridad y conservación

No nuevas credenciales ni servicios. Autenticación, confianza y políticas quedan en cada host. No activar auto-update ni relajar restricciones implícitamente. Leer manifiestos de Equipo Dev, versiones y listados oficiales filtrados; evitar credenciales, configuración completa y logs de sesiones. Validar rutas absolutas, espacios, contención y enlaces/reparse points antes de generar o reemplazar salidas; rechazar rutas de caché administrada. Hashes de archivos gestionados detectan edición local: conservar y reportar conflicto antes de sobrescribir. Personalizaciones externas, hooks y archivos ajenos permanecen intactos.

## Plan de implementación

1. **backend-dev:** crear `scripts/host-plugins.mjs` y helpers testeables con ejecutor inyectable; diagnóstico filtrado, separación fuente/disco/registro/carga y preflight de duplicados/synced. Integrar delegación desde `scripts/build.mjs`; no instalar en perfil durante tests.
2. **backend-dev:** corregir generación limpia y nombres de skills en ambos targets; actualizar `platforms/claude-code/platform.json`, añadir `platforms/vscode-agent/platform.json` y recursos propios. Mantener lógica común y no alterar Codex/Antigravity por accidente. Adaptar instrucciones y agentes a herramientas reales; roles sin herramienta equivalente requieren limitación explícita.
3. **backend-dev:** generar marketplace local, metadata/checksums y paquetes separados; eliminar supuestos de `.plugin` para estos hosts. Incrementar versión canónica al finalizar entrega, sincronizar metadatos y documentar método reproducible. Validar el mod existente con herramientas oficiales sin añadir interfaz nueva.
4. **qa-engineer:** tests temporales de instalación, actualización, idempotencia, antiguo `0.4.1`, registro `synced 0.6.0`, conflicto de origen, personalización, fallo parcial, cliente ausente, espacios y enlaces, paquete con archivos ocultos, residuos y duplicados. Fixtures independientes de perfiles reales; mocks verifican comandos pero no acreditan reconocimiento. Comprobar hashes ajenos antes/después, suite completa secuencial y build de todos los targets.
5. **qa-engineer:** README ES/EN y `docs/qa/integracion-vscode-claude.md`, comandos por host, límites y recuperación. Smoke real separado por cliente y versión: registro/origen, recarga, inventario vigente, ejecución documental de `team-report`, reconocimiento de `fix` sin reparación ficticia, siete roles y ausencia de skills retiradas del paquete. Probar validación/test del mod Claude y reportar panel por separado; no aprobarlo por pruebas de Markdown.
6. **code-reviewer:** revisar contención, comandos sin shell, preservación, conflictos synced, artefactos reproducibles, empaquetado y cobertura de H1–H6. Cierre solo con evidencia de ambos hosts; cliente no disponible implica QA pendiente para ese host.

**frontend-dev / UX:** no aplica: no hay interfaz propia que desarrollar.

## Alternativas y consecuencias

- Descartado copiar directamente a `.vscode/agent-plugins` o editar registros Claude: elude ciclo oficial y no garantiza recarga ni conservación.
- Descartado un único paquete con TSX para ambos: soporte del formato Claude en VS Code no implica ejecución de mods ni equivalencia de herramientas.
- Descartado apuntar ahora al repositorio fuente: un checkout sin build no contiene los artefactos ignorados.
- [Seguro] La solución local evita una publicación para validar y permite usar gestores soportados; exige conservar una ruta estable y reconstruir antes de actualizar. La actualización automática desde GitHub requiere posteriormente distribución publicada y autorizada.
- [Probable] Separar adaptadores y registrar el origen resolverá el desfase; la prueba funcional de la extensión sigue siendo indispensable. Panel, versiones de CLI/extensión y políticas pueden divergir y deben informarse, no ocultarse.

ADR aprobado; pendiente de implementación, QA y revisión.
