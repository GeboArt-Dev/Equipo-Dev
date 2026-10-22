# Integración y actualización de Equipo Dev en VS Code y Claude

Fecha: 2026-10-22. Estado: aprobada explícitamente por el dueño («AProbado»); pendiente de diseño técnico.

## 1. Objetivo

[Seguro] El dueño informa que Equipo Dev no se actualiza en su extensión Claude de VS Code. Permitir instalar, actualizar y comprobar la versión utilizada desde Windows, priorizando la extensión oficial de Claude y distinguiendo su gestión de plugins de la de agentes de VS Code.

### Evidencia y límites del diagnóstico

- [Seguro] La inspección del orquestador identifica la extensión `anthropic.claude-code-2.1.301-win32-x64`.
- [Seguro] La copia `C:\Users\geboa\.vscode\agent-plugins\github.com\GeboArtDev\equipo-dev` declara versión `0.4.1` y skills `equipo-panel`, `equipo-reiniciar`, `feature` y `reglas-equipo`.
- [Seguro] La copia `C:\Users\geboa\.claude\plugins\equipo-dev` y `src/manifest.json` declaran `0.7.0`; la copia incluye `fix` y `team-report`. El instalador actual copia el paquete Claude sin registrar un marketplace.
- [Seguro] Estas observaciones prueban versiones de archivos, no qué plugin está cargado. La ausencia observada de `installed_plugins.json` en la ubicación examinada no prueba que ningún plugin esté registrado.
- [Especulando] La copia antigua podría explicar el comportamiento comunicado. No se ha demostrado que la extensión oficial Claude consuma esa caché de VS Code.

## 2. Historias y prioridad MoSCoW

| ID | Prioridad | Historia |
| --- | --- | --- |
| H1 | Must | Como dueño, quiero identificar el cliente y las versiones de fuente, instalación y carga, para saber dónde está el desfase. |
| H2 | Must | Como usuario de Claude oficial en VS Code sobre Windows, quiero instalar y actualizar Equipo Dev por un mecanismo soportado, para usar las capacidades vigentes. |
| H3 | Must | Como usuario de plugins de agentes de VS Code sobre Windows, quiero instalar y actualizar el paquete compatible por su mecanismo soportado, para mantener esa integración al día. |
| H4 | Must | Como dueño, quiero conservar mis configuraciones, hooks y restricciones de seguridad, para actualizar sin perder personalizaciones ni habilitar comportamientos nuevos inadvertidamente. |
| H5 | Must | Como mantenedor, quiero instrucciones ES/EN y evidencia reproducible, para distinguir una compilación correcta de una actualización reconocida por el cliente. |
| H6 | Should | Como usuario, quiero un diagnóstico que indique la acción concreta ante una actualización incompleta, para recuperarme sin manipular cachés internas. |

## 3. Criterios de aceptación

### H1 — Diagnóstico verificable

- Dado un equipo Windows con una o ambas integraciones, cuando se diagnostique Equipo Dev, entonces se distinguirán explícitamente Claude oficial y los plugins de agentes de VS Code, con origen, alcance y versión instalada cuando sean verificables.
- Dada una fuente `0.7.0` y una copia `0.4.1`, cuando se comparen, entonces el diagnóstico señalará el desfase sin equiparar copia en disco a plugin cargado.
- Dado que no haya evidencia del registro o de la versión cargada, cuando se informe el estado, entonces se marcará como desconocido o pendiente de comprobación y se indicará cómo verificarlo en el cliente.

### H2 — Claude oficial, prioridad inicial

- Dado un paquete versionado y una instalación Windows compatible, cuando el usuario complete la instalación mediante el mecanismo soportado por Claude, entonces el cliente reconocerá Equipo Dev y se registrará evidencia de su versión u origen verificable.
- Dada una versión anterior, cuando se complete la actualización y la recarga requerida por el cliente, entonces `fix` y `team-report` vigentes estarán disponibles y las skills retiradas no aparecerán como capacidades del paquete actualizado.
- Dado un registro distinto o duplicado de Equipo Dev, cuando se detecte, entonces se explicará cuál se está comprobando y cómo resolver el conflicto, sin eliminar instalaciones por inferencia.

### H3 — Plugins de agentes de VS Code

- Dado un VS Code compatible, cuando se instale o actualice el paquete por su mecanismo documentado, entonces el host reconocerá la versión correspondiente y las capacidades compatibles se enumerarán explícitamente.
- Dada la caché `\.vscode\agent-plugins\github.com\`, cuando se actualice Equipo Dev, entonces no se editarán directamente sus archivos como mecanismo de instalación.
- Dada una capacidad no compatible en un host, cuando se documente o diagnostique, entonces se identificará la limitación sin prometer equivalencia con Claude ni con otros adaptadores.

### H4 — Conservación y repetición segura

- Dadas configuraciones, hooks y archivos ajenos existentes, cuando se instale o actualice Equipo Dev, entonces permanecerán intactos; cualquier conflicto que requiera intervención se comunicará antes de sustituir contenido personalizado.
- Dada una instalación ya actualizada, cuando se repita el procedimiento, entonces no generará registros duplicados ni copias activas contradictorias.
- Dado un fallo de actualización, cuando termine la operación, entonces se informará el estado resultante y el procedimiento de recuperación sin declarar éxito ni exponer credenciales.

### H5 y H6 — Entrega y validación

- Dado un entorno de pruebas temporal, cuando se ejecuten los casos de instalación nueva, actualización desde versión anterior, repetición, conflicto y fallo, entonces todos tendrán resultados verificables sin modificar el perfil personal.
- Dados ambos clientes Windows disponibles, cuando se ejecute la comprobación funcional, entonces quedará evidencia separada de instalación, reconocimiento y uso de `team-report` y del reconocimiento de `fix`, sin ejecutar reparaciones ficticias ni cambios destructivos.
- Dado un cliente no disponible o una comprobación interactiva pendiente, cuando QA informe, entonces registrará la limitación y no dará esa integración por validada.
- Dado el README ES/EN actualizado, cuando un usuario siga las instrucciones de su cliente, entonces encontrará requisitos, instalación, actualización, recarga, diagnóstico, recuperación y diferencias entre hosts.
- Dada una incompatibilidad, ausencia del cliente o fallo del mecanismo de instalación, cuando ocurra, entonces el mensaje identificará el host, la operación fallida y el siguiente paso aplicable.

## 4. Fuera de alcance

- Crear una extensión propia de VS Code o una interfaz nueva.
- Editar manualmente cachés internas administradas por los clientes.
- Reescribir los flujos de negocio o roles compartidos de Equipo Dev.
- Prometer paridad de todas las funciones entre Claude, agentes de VS Code y Codex.
- Cambiar credenciales, hooks, políticas o preferencias ajenas a esta instalación.
- Trabajar sobre METM, LMD o la API municipal; hacer commit, push o publicar una versión sin autorización explícita.

## 5. Métrica de éxito

- 2 integraciones Windows con evidencia de instalación y actualización reconocidas por su respectivo host; Claude oficial es la primera a resolver.
- 0 skills obsoletas atribuidas al paquete actualizado y 100 % de las capacidades vigentes compatibles verificadas en cada host.
- 0 archivos ajenos modificados y 0 registros duplicados tras repetir la instalación.
- 100 % de los casos de aceptación ejecutables aprobados; comprobaciones pendientes identificadas individualmente.
- Documentación de uso disponible en 2 idiomas: español e inglés.

## 6. Preguntas abiertas y decisiones posteriores

- [Seguro] No hay una duda de negocio bloqueante para presentar esta especificación. Los siguientes detalles requieren investigación técnica en el ADR, no aprobación anticipada de una solución concreta.
- ¿Qué registro, origen y alcance está usando realmente la extensión Claude instalada? Debe comprobarse sin deducirlo únicamente de rutas de caché.
- ¿Qué mecanismo soportado de distribución y actualización corresponde a cada host y versión? El ADR definirá el contrato operativo y los requisitos de compatibilidad.
- ¿Qué señal permite verificar la versión cargada en cada cliente y qué recarga exige? Si el host no la expone directamente, se documentará la evidencia alternativa y su límite.
- ¿Qué capacidades del paquete común son compatibles con los plugins de agentes de VS Code? Debe enumerarse la compatibilidad, sin asumir que su soporte actual equivale al de Claude.

Referencias oficiales identificadas para el diseño técnico: [Claude en VS Code](https://code.claude.com/docs/en/vs-code), [gestión de plugins Claude](https://code.claude.com/docs/en/discover-plugins), [plugins de agentes de VS Code](https://code.visualstudio.com/docs/agent-customization/agent-plugins).

Spec aprobada; continuar con el diseño técnico.
