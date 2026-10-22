# QA: integración VS Code y Claude

Fecha: 2026-10-22. Fuente: spec aprobada y ADR 007 aprobado. Versión del paquete: 0.8.0.

## Evidencia ejecutada

- Windows; suite Node secuencial completa de los ocho archivos `tests/*.test.mjs`: **85/85 pasan, 0 fallos, 0 omitidos**, 18,08 s después de la corrección del detector VS Code; mismo conjunto que `npm test` actualizado.
- `node scripts/build.mjs`: generación de los seis targets sin fallo; Claude y VS Code se verifican mediante sus manifiestos aunque el compilador no imprima sus líneas individuales.
- `claude plugin validate dist/marketplace`: validación oficial aprobada; el consejo de documentación de instalación remota no cambia el veredicto y no autoriza publicar el repositorio fuente como marketplace.
- `claude plugin test dist/claude-code/equipo-dev`: 11 pasan, 0 fallan, mediante CLI 2.1.296; prueba handlers del mod, no renderizado real del panel en la extensión.
- Diagnóstico real de solo lectura: extensión Claude 2.1.301, registro `equipo-dev@synced` 0.6.0 activo, copia manual 0.7.0 y fuente 0.8.0. Se informa `origin-conflict` y carga desconocida.
- Diagnóstico VS Code: cliente **1.142.0**, caché antigua 0.4.1 y artefacto 0.8.0; no se inventa registro ni carga a partir de archivos.
- Estructura VS Code contrastada con la [referencia oficial](https://code.visualstudio.com/docs/agents/reference/agent-plugin-reference) y [schema Agent Plugins 1.0](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json): manifiesto raíz, namespace `com.github.copilot/agents`, cinco skills normalizadas y ausencia de hooks Claude. Esta inspección no equivale a carga en VS Code.
- Archivos del mod contrastados con la [referencia Claude](https://code.claude.com/docs/en/plugins/mods/reference); `modules` y `types` son componentes válidos.

## Matriz de aceptación

| Criterio Gherkin | Test asociado | Resultado (OK / FALLA) |
| --- | --- | --- |
| H1: distinguir hosts, origen, alcance y versiones verificables | `host-plugins`: diagnóstico temporal y lectura real; `vscode-client`: instalación clásica/versionada | OK |
| H1: comparar una copia 0.4.1 con fuente actual sin atribuir carga | `diagnose is read only...` | OK |
| H1: carga desconocida sin evidencia del cliente | asserts `loaded.status === unknown` y diagnósticos reales | OK |
| H2: instalar mediante gestor y reconocer paquete en extensión | instalación con ejecutor inyectado OK; smoke de extensión pendiente | FALLA |
| H2: actualizar, recargar, reconocer fix/team-report y retirar skills antiguas | actualización y árboles limpios OK; inventario y uso real pendientes | FALLA |
| H2: detectar otro origen sin eliminar instalaciones | synced 0.6.0, otro marketplace y copia deshabilitada | OK |
| H3: VS Code reconoce versión y capacidades | paquete nativo OK; activación/reconocimiento interactivo pendiente | FALLA |
| H3: no editar caché administrada | perfil temporal intacto; rechazo de managed cache y junction | OK |
| H3: documentar capacidades no compatibles | README ES/EN y test de ausencia TSX/modelos Claude | OK |
| H4: conservar configuraciones, hooks y archivos ajenos | hashes de archivos modificados, archivo ajeno y perfil temporal | OK |
| H4: repetición sin registros duplicados | instalación idempotente y reintento tras fallo parcial | OK |
| H4: fallo informa estado sin éxito ni secretos | fallo inyectado, completedSteps, filtrado de stdout | OK |
| H5: instalación, actualización, repetición, conflicto y fallo temporales | `host-plugins.test.mjs`, paths con espacios y junction | OK |
| H5: ambos clientes usan team-report y reconocen fix | smoke interactivo de ambos hosts pendiente | FALLA |
| H5: declarar comprobación pendiente | este informe y `verification-pending` | OK |
| H5: instrucciones ES/EN de uso y recuperación | README.md y README.es.md actualizados | OK |
| H6: cliente ausente/incompatible y acción siguiente | tests missing/incompatible + diagnósticos con issues/nextSteps | OK |

## Bugs y limitaciones

1. **Media, corregido por backend:** VS Code instalado en layout versionado devolvía `clientVersion.vscode: null`. Reproducir con `node scripts/host-plugins.mjs diagnose --host vscode-agent --json`; esperado versión verificable, obtenido null. Backend añadió descubrimiento seguro y tres regresiones, sin ejecutar un wrapper mediante shell.
2. **Pendiente funcional, bloquea cierre:** no hay evidencia de instalación/actualización y uso del paquete 0.8.0 en las dos interfaces. Los mocks, la validación de manifiestos y los tests del mod no sustituyen esta evidencia.
3. **Migración deliberada pendiente:** el origen sincronizado activo no se ha deshabilitado ni reemplazado; requiere elección expresa del dueño en el gestor original. No se modificó el perfil personal, cachés, preferencias ni credenciales.

## Qué debe validar el dueño y cómo

1. En Claude, abrir `/plugins` y decidir conservar/actualizar `equipo-dev@synced` desde la cuenta o deshabilitarlo para usar el marketplace local. Si una política obliga a conservarlo, detener la migración y consultar al administrador.
2. Para el origen local, ejecutar `node scripts/host-plugins.mjs install --host claude-code --json`. Comprobar registro `equipo-dev@equipo-dev-local`, alcance user, versión 0.8.0; repetir instalación y comprobar ausencia de duplicados. Ejecutar update, recargar con `/reload-plugins` o abrir sesión nueva.
3. En la extensión oficial, anotar versión del cliente y origen del plugin; comprobar las cinco skills `feature`, `fix`, `team-report`, `team-reset`, `team-rules` y los siete agentes. Ejecutar únicamente el reporte documental `team-report`; comprobar que `fix` está disponible sin iniciar reparaciones ficticias. Confirmar que las skills antiguas no pertenecen al paquete nuevo. Comprobar el panel aparte y registrar si renderiza.
4. Para Agent Plugins de VS Code, ejecutar `node scripts/host-plugins.mjs install --host vscode-agent --json`; la salida 2 es esperada. Resolver la copia anterior en la interfaz que la instaló y fusionar la entrada `chat.pluginLocations` emitida en Settings JSON, conservando las otras entradas. No editar `.vscode/agent-plugins/`.
5. Recargar VS Code, comprobar el origen local 0.8.0 y repetir inventario, reporte y descubrimiento de fix; no esperar panel Claude. Reconstruir con update y comprobar reconocimiento tras recarga.
6. Entregar por host: versión del cliente, origen/versión del plugin, inventario, resultado del reporte, descubrimiento de fix, fecha y resultado de actualización/repetición. Es suficiente evidencia textual verificable; no compartir configuraciones completas ni secretos.

## Veredicto

**RECHAZADO** para cierre de la feature: faltan los smokes funcionales de ambos hosts. Las comprobaciones automatizadas y CLI aprobadas se conservan como evidencia parcial; no existe aprobación funcional implícita.
