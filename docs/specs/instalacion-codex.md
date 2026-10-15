# Instalación de Equipo Dev para Codex

Estado: aprobada por el dueño al indicar «Continua» después de presentar la especificación. Fecha: 2026-10-14.

Alcance aprobado: instalación por usuario y validación inicial en Windows con el cliente Codex utilizado en esta sesión. Compatibilidad con otros clientes y sistemas pendiente de validación, sin prometer soporte en esta iteración.

## Objetivo

[Seguro] El compilador actual permite generar adaptadores e instalar aquellos que declaran un destino, pero no existe un adaptador Codex en `platforms/`.
Permitir que quien usa Codex genere e instale Equipo Dev con `node scripts/build.mjs --target codex --install`, conservando sus archivos y accediendo al flujo del equipo con capacidades y limitaciones explícitas.

## Contexto verificado

- [Seguro] `scripts/build.mjs` expone `--target`, `--install`, `--clean` y `--help`; `all` descubre los directorios de plataformas.
- [Seguro] Existen adaptadores para Claude Code, Antigravity, Cursor y Copilot; las fuentes comunes contienen siete roles y cuatro skills: `feature`, `reglas-equipo`, `team-report` y `equipo-reiniciar`.
- [Seguro] La generación transforma herramientas, modelos y tokens, y copia skills y documentación. Los adaptadores ya permiten instrucciones de orquestación diferentes.
- [Seguro] `src/skills/feature/SKILL.md` referencia `team-rules`, mientras el directorio canónico se llama `reglas-equipo`; el resultado Codex debe resolver las referencias internas del paquete que entrega.
- [Seguro] La instalación actual copia artefactos sobre un destino autorizado; esa existencia no demuestra compatibilidad con la instalación de Codex.
- [Probable] Reutilizar las fuentes comunes reducirá la divergencia entre plataformas. El formato de integración, el destino reconocido, los modelos, las herramientas y la disponibilidad de delegación requieren validación técnica en el ADR; esta spec no afirma soporte nativo de roles, hooks ni paneles en Codex.

## Historias de usuario y aceptación

### HU-01 — Generar el paquete Codex — Must

Como mantenedor, quiero generar el adaptador Codex desde las fuentes comunes, para distribuir una versión coherente de Equipo Dev.

```gherkin
Dado un checkout válido y los prerrequisitos documentados
Cuando ejecuto node scripts/build.mjs --target codex
Entonces el proceso termina con código 0 y muestra la ubicación del resultado
Y el resultado incluye las instrucciones de los siete roles y las cuatro skills vigentes
Y las referencias internas del paquete resuelven a recursos incluidos o a dependencias explícitamente documentadas
Y no quedan tokens de adaptación sin resolver
Y no se modifica el entorno personal de Codex

Dadas las mismas fuentes y configuración
Cuando genero dos veces el target codex
Entonces el contenido de los artefactos resultantes es idéntico
```

### HU-02 — Instalar y comprobar disponibilidad — Must

Como usuario de Codex, quiero instalar el paquete mediante el comando del proyecto, para utilizarlo sin copiar manualmente sus componentes.

```gherkin
Dado un entorno Codex compatible según la documentación y un destino permitido con permisos de escritura
Cuando ejecuto node scripts/build.mjs --target codex --install
Entonces el proceso termina con código 0 e informa qué instaló y dónde
Y explica cualquier paso posterior necesario para que Codex reconozca el paquete
Y tras seguir esos pasos puedo invocar feature con el mecanismo documentado

Dada una instalación completada y reconocida por Codex
Cuando inicio una feature de prueba y consulto su estado
Entonces el equipo puede producir la spec y señalar que requiere aprobación antes de avanzar
Y team-report distingue los entregables presentes de los pasos pendientes
```

### HU-03 — Reinstalar preservando el entorno — Must

Como usuario con personalizaciones, quiero repetir la instalación y actualizar Equipo Dev, para conservar mis archivos y configuración.

```gherkin
Dada una instalación previa sin cambios locales en sus archivos administrados
Y archivos y configuración ajenos al paquete en el entorno de destino
Cuando repito la instalación de la misma versión
Entonces no aparecen copias ni entradas de configuración duplicadas
Y el contenido ajeno permanece idéntico

Dada una versión anterior del paquete sin modificaciones locales
Cuando instalo una nueva versión
Entonces los recursos administrados corresponden a la versión nueva
Y ningún recurso obsoleto de Equipo Dev queda activo
Y los archivos ajenos permanecen idénticos

Dado un archivo local en conflicto con un recurso que se instalaría
Cuando intento instalar Equipo Dev
Entonces no se sobrescribe silenciosamente el archivo local
Y recibo la identificación del conflicto y los pasos para resolverlo
```

### HU-04 — Conservar el flujo con capacidades explícitas — Must

Como usuario, quiero instrucciones adaptadas a las capacidades comprobadas de Codex, para ejecutar el flujo del equipo sin depender de funciones inexistentes.

```gherkin
Dado el paquete Codex instalado
Cuando consulto sus instrucciones y la guía de uso
Entonces identifico cómo ejecutar los siete roles y las cuatro skills
Y se mantienen las aprobaciones de spec y ADR, la reanudación y los entregables del flujo
Y cada capacidad dependiente de plataforma indica si está soportada, tiene alternativa o no está disponible
Y ninguna instrucción exige herramientas, modelos, hooks o paneles cuya compatibilidad no haya sido verificada

Dada una capacidad sin soporte verificado ni alternativa
Cuando consulto el procedimiento que dependería de ella
Entonces se informa la limitación y no se presenta ese procedimiento como operativo
```

### HU-05 — Entender y resolver errores — Must

Como usuario, quiero errores identificables y accionables, para corregir una instalación fallida.

```gherkin
Dado un destino no permitido o una ruta que escape del ámbito autorizado, incluso mediante enlaces
Cuando intento instalar el paquete
Entonces el proceso termina con código distinto de 0
Y no escribe fuera del ámbito autorizado
Y informa el problema y una acción de corrección

Dado un fallo de permisos, una fuente inválida o un recurso requerido ausente
Cuando genero o instalo Codex
Entonces el proceso termina con código distinto de 0 sin declarar éxito
Y identifica la causa y el paso para reintentar
Y conserva archivos y configuración ajenos
Y si quedó una instalación incompleta, lo informa expresamente
```

### HU-06 — Documentar y proteger plataformas existentes — Must

Como mantenedor y usuario, quiero documentación bilingüe y validación de regresiones, para incorporar Codex sin romper los destinos existentes.

```gherkin
Dado el adaptador Codex integrado
Cuando consulto --help, README.md y README.es.md
Entonces encuentro codex, los comandos de generación e instalación, prerrequisitos, alcance de instalación, comprobación de disponibilidad y solución de conflictos
Y ambas guías describen las mismas capacidades y limitaciones

Dadas las fuentes vigentes
Cuando ejecuto la compilación para all y las pruebas pertinentes
Entonces se incluye Codex junto a las cuatro plataformas existentes
Y sus contratos de generación e instalación previamente soportados siguen cumpliéndose
Y las pruebas de instalación utilizan entornos temporales y no alteran el perfil personal
```

## Fuera de alcance — Won't en esta iteración

- Instalar o autenticar el cliente Codex, gestionar credenciales o cambiar la cuenta del usuario.
- Publicar el paquete, hacer commit/push o instalarlo realmente en el perfil personal como parte de las pruebas.
- Rediseñar los roles, resolver otras features pendientes o cambiar los contratos de plataformas existentes.
- Añadir una interfaz gráfica, un panel en vivo o hooks por paridad con otras plataformas sin soporte comprobado.
- Distribución mediante marketplace, desinstalador y actualización automática.
- Garantizar compatibilidad con todas las versiones, clientes o sistemas operativos de Codex. La matriz soportada debe declararse y validarse.

Todas las historias propuestas son Must; no se incluyen historias Should o Could para ampliar la primera iteración.

## Métricas de éxito

- 7/7 roles y 4/4 skills trazables desde la fuente al paquete Codex; 0 referencias internas rotas y 0 tokens pendientes.
- 2 generaciones consecutivas con contenido idéntico y 2 instalaciones consecutivas sin duplicados.
- 0 archivos o configuraciones ajenos modificados en las pruebas de instalación, actualización y conflicto.
- 100 % de los escenarios de aceptación cubiertos por pruebas automatizadas o evidencia funcional reproducible; las comprobaciones estáticas no sustituyen el reconocimiento por Codex.
- 1 prueba funcional de instalación y ejecución de `feature` y `team-report` por entorno declarado compatible; si no puede ejecutarse, QA registra la limitación y no certifica ese entorno.
- 4/4 plataformas previas sin regresiones en sus contratos existentes; documentación ES/EN completa; QA aprobado y revisión sin bloqueantes.

## Decisiones de alcance

1. Instalación por usuario. Las rutas y el mecanismo pertenecen al diseño técnico.
2. Validación inicial en Windows con el cliente Codex de esta sesión. La matriz concreta y su evidencia deben constar en el ADR y QA; no se exige certificar otros clientes o sistemas en esta iteración.

Las decisiones sobre formato, rutas, descubrimiento, activación, delegación y recuperación de instalaciones incompletas quedan para el ADR, basadas en documentación oficial vigente y en los requisitos anteriores.

Spec aprobada e implementación cerrada el 2026-10-15: [ADR 004](../adr/004-instalacion-codex.md), [QA APROBADO y revisión final LISTO PARA MERGE](../qa/instalacion-codex.md). Alcance validado: Windows y cliente de esta sesión; otros entornos no certificados.
