# ADR 004 — Instalación por usuario para Codex

Estado: aprobado por el dueño al indicar «Continua» después de presentar el diseño. Aprobación: 2026-10-15. Fecha del diseño: 2026-10-14.

## Contexto y diagnóstico

[Seguro] `scripts/build.mjs` ya descubre plataformas y transforma fuentes, pero su generación de agentes siempre escribe metadatos de herramientas/modelo propios de otros hosts y su instalador copia sobre archivos existentes sin registro de propiedad. Esos mecanismos no satisfacen por sí solos HU-01 a HU-06 de [la spec aprobada](../specs/instalacion-codex.md).

[Seguro] Las fuentes contienen siete roles. Los directorios de skills no siempre coinciden con su identidad: `reglas-equipo` declara `name: team-rules` y `equipo-reiniciar` declara `name: team-reset`. La referencia `team-rules` de `feature` coincide con la identidad, pero el adaptador debe resolver también su ruta física.

[Seguro] Stack obligatorio: JavaScript ESM, Node.js 18+, módulos nativos, Markdown y `node:test`. Esta feature no tiene interfaz gráfica; UX y frontend-dev no aplican.

## Evidencia de plataforma

Consultada el 2026-10-14; una ruta documentada no certifica el descubrimiento en el cliente utilizado.

| Evidencia | Conclusión y límite |
| --- | --- |
| [Build skills, estructura y descubrimiento](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills) | [Seguro] Skills locales por usuario en `$HOME/.agents/skills`, con `SKILL.md`, `name`, `description` y referencias opcionales. Los nombres duplicados no se fusionan. Se documenta detección automática y reinicio si no aparece el cambio. |
| [Build skills, invocación](https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills) | [Seguro] La selección explícita varía por host: `@` en ChatGPT; `$` y `/skills` en CLI/IDE. No presentar `/feature` como comando nativo universal. |
| [Subagents, custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agents) | [Seguro] Existen agentes TOML personales en `~/.codex/agents`; su formato no es el Markdown generado actualmente. |
| Herramientas expuestas en esta sesión | [Seguro] `collaboration.spawn_agent`, `send_message` y `wait_agent` permiten delegar instrucciones. Esto no demuestra que otros clientes expongan las mismas herramientas ni que registren TOML personalizados. |
| Prueba funcional del paquete instalado (2026-10-15) | El dueño instaló el paquete e invocó las skills en este cliente Windows. Se observó descubrimiento, delegación real al Product Owner, generación de spec, pausa de aprobación, reporte y reset sin mutaciones. La reevaluación de QA se registra en su informe. No acredita otros clientes ni versiones. |

## Decisión

Distribuir cuatro skills independientes y siete instrucciones de rol como recursos de la skill de orquestación. No registrar agentes nativos ni modificar configuración de Codex. Los roles son instrucciones delegables, no siete agentes que prometan aparecer en un selector.

La instalación escribe exclusivamente cuatro carpetas con prefijo `equipo-dev-` bajo `path.join(os.homedir(), '.agents', 'skills')`, más metadatos propios en `.equipo-dev-install/` dentro de esa misma base. `$HOME` en este documento es notación documental; el código no reasigna variables de entorno ni modifica `CODEX_HOME`. No derivar la ruta desde `.codex/skills` porque la sesión tenga skills antiguos allí.

| Fuente canónica | Carpeta y `name` Codex |
| --- | --- |
| `src/skills/feature` | `equipo-dev-feature` |
| `src/skills/reglas-equipo` (`team-rules`) | `equipo-dev-team-rules` |
| `src/skills/team-report` | `equipo-dev-team-report` |
| `src/skills/equipo-reiniciar` (`team-reset`) | `equipo-dev-team-reset` |

Los nombres prefijados permiten convivir con las skills personales actuales. No crear alias `feature`, `team-rules`, `team-report` ni `team-reset`, ni migrar/eliminar versiones personales. Las descripciones priorizan la invocación explícita de Equipo Dev; la documentación indica seleccionar el nombre prefijado para evitar ambigüedad.

Salida determinista en `dist/codex/equipo-dev/`:

```text
skills/equipo-dev-feature/SKILL.md
skills/equipo-dev-feature/references/agents/{product-owner,ux-designer,architect,backend-dev,frontend-dev,qa-engineer,code-reviewer}.md
skills/equipo-dev-team-rules/SKILL.md
skills/equipo-dev-team-report/SKILL.md
skills/equipo-dev-team-reset/SKILL.md
package-manifest.json
README.md
README.es.md
LICENSE
```

Los roles conservan su cuerpo canónico y una cabecera informativa; no llevan `model`, `model_tier`, `tools`, `color`, permisos o campos que aparenten configuración nativa. Se heredan modelo y permisos del host. Los tokens de comandos y búsquedas describen capacidades disponibles en la sesión, sin exigir identificadores de herramientas de Claude o Antigravity. El contexto del proyecto se toma de `AGENTS.md` y, cuando exista, `CLAUDE.md`, sin generar ni sobrescribir estos archivos durante la instalación.

El generador mantiene un mapa explícito fuente → identidad → destino. Reescribe referencias de skills y rutas internas en el adaptador Codex, valida que todas resuelvan y rechaza tokens `{{...}}` pendientes. Las referencias entre skills usan rutas relativas entre carpetas hermanas. Las referencias a roles parten de `references/agents/` dentro de feature. La búsqueda de ADR contempla el prefijo numérico. No sustituir arbitrariamente cualquier aparición de palabras como `feature` en contenido o nombres de documentos.

### Flujo de ejecución

La skill feature carga `../equipo-dev-team-rules/SKILL.md` y el recurso del rol antes de cada etapa. Cuando hay delegación disponible y autorizada por las instrucciones aplicables, entrega al subagente el rol leído, raíz del proyecto, entradas, alcance, restricciones y salida esperada. En esta sesión se puede usar `collaboration.spawn_agent`; no se inventa un tipo de agente registrado. Se espera su resultado antes de tareas dependientes.

Si el host carece de delegación, el adaptador informa la limitación y pausa el flujo antes del rol que la requiere; no simula subagentes ni sustituye silenciosamente el trabajo por el orquestador. Ejecutar etapas secuencialmente significa delegar un rol por vez, conservando las reglas canónicas. team-report sigue disponible para informar el bloqueo.

Se conservan reanudación, aprobaciones de spec/ADR, QA y revisión. `team-report` inspecciona documentos y código, distingue documento existente de aprobación y prueba ejecutada. `team-reset` explica que no hay panel persistente que vaciar y no borra documentos. No instalar hooks ni crear paneles.

`ux-designer` conserva la dependencia externa `ui-ux-pro-max` y Python, que no se empaquetan ni instalan automáticamente. Busca la skill en el catálogo del host y resuelve `search.py` según sus instrucciones. Si falta, informa el bloqueo específico de UX; las features sin UI siguen su flujo. La guía explica esta dependencia y no promete siete roles incondicionalmente operativos.

## Componentes y alternativas

Crear `platforms/codex/platform.json`, los overrides necesarios en `platforms/codex/skills/`, `scripts/codex.mjs` y `tests/codex.test.mjs`. Modificar `scripts/build.mjs` solo para ayuda y despacho explícito del generador/instalador Codex; conservar los caminos de las cuatro plataformas existentes. `scripts/codex.mjs` concentra transformación, validación y sincronización. No modificar `dist/` manualmente. QA actualiza `README.md`, `README.es.md` y `docs/qa/instalacion-codex.md`.

- Agentes TOML nativos: [Seguro] documentados; se descartan en esta iteración porque requieren otro formato y otro ámbito de instalación sin ser necesarios para ejecutar roles desde recursos. [Probable] podrán añadirse con validación del cliente en una iteración posterior.
- Copiar el paquete completo a `.codex/plugins` o `.codex/skills`: no elegir una ruta por analogía con plataformas existentes ni por presencia de instalaciones heredadas.
- Conservar nombres cortos: [Seguro] puede coexistir con nombres idénticos sin fusión según documentación; se descarta por ambigüedad con skills personales ya presentes.
- Modificar `config.toml` para desactivar skills previas: descartado; excede la propiedad del paquete.

## Contratos CLI y de archivos

No hay endpoints HTTP, autenticación remota, base de datos ni migraciones SQL.

| Entrada | Contrato |
| --- | --- |
| `node scripts/build.mjs --target codex` | Genera y valida el paquete; no escribe en el perfil. |
| `node scripts/build.mjs --target codex --install` | Genera y después sincroniza únicamente recursos administrados en la base de usuario. |
| `--target all` | Incluye Codex por descubrimiento; `--install` conserva la semántica existente de instalar todos los targets soportados. Documentar que la instalación exclusiva de Codex requiere `--target codex`. |
| `--clean --target codex` | Limpia solo su salida validada en `dist/`; nunca elimina la instalación. |
| `runBuild({ target: 'codex', install: true, installDir })` | Inyección para tests: `installDir` representa una base de skills estrictamente dentro de un temporal creado por la prueba; rechazar cualquier otro override. No añadir flag público para destinos arbitrarios. |

Éxito: exit 0, rutas de generación/instalación, conteo de creados/actualizados/retirados/sin cambios, y mensaje separado «archivos instalados; reconocimiento por el cliente pendiente de comprobar». Indicar selección de `equipo-dev-feature` y reinicio si no aparece. No afirmar disponibilidad solo porque la copia terminó.

Errores: exit 1 y código estable en mensaje, ruta afectada sin contenido sensible y acción recomendada: `CODEX_SOURCE_INVALID`, `CODEX_PATH_UNSAFE`, `CODEX_CONFLICT`, `CODEX_PERMISSION`, `CODEX_INSTALL_BUSY`, `CODEX_INSTALL_INCOMPLETE`. Un error de permisos no se convierte en éxito parcial. Conflictos se corrigen conservando la personalización fuera del destino, comparándola con la fuente o restaurando explícitamente la versión administrada; no habrá `--force` implícito.

`package-manifest.json` incluye `schemaVersion: 1`, `packageId: "equipo-dev-codex"`, versión de `src/manifest.json`, mapa de fuentes/roles/skills y lista ordenada de archivos instalables `{ path, sha256 }`. Paths relativos POSIX; hashes SHA-256 del contenido exacto. Sin timestamp, rutas absolutas ni hash del manifiesto sobre sí mismo. Los README/licencia quedan en la distribución; solo se instalan los archivos enumerados de las cuatro skills.

`.equipo-dev-install/manifest.json` guarda esquema, identidad, versión y archivos relativos con hashes de la última instalación completada. Este registro no es configuración de Codex. Esquema desconocido o manifiesto inválido implica conflicto; no se adopta contenido existente aunque coincida byte a byte sin registro previo.

### Propiedad, repetibilidad y actualización

1. Validar todas las fuentes, hashes, nombres y rutas antes de tocar el perfil. Generar en staging limpio y publicar la salida completa para evitar artefactos obsoletos incluso sin `--clean`.
2. Validar contención real de origen, destino y ancestros existentes con `lstat`/`realpath`. Rechazar enlaces simbólicos/junctions en rutas administradas; no seguirlos aunque el host soporte skills enlazadas. Rechazar rutas absolutas, `..`, ADS, nombres reservados, separadores inesperados y colisiones por mayúsculas en manifiestos Windows.
3. Obtener un lock exclusivo propio. Si hay lock o journal pendiente, no iniciar otra actualización ni borrar el lock automáticamente; informar recuperación pendiente.
4. Construir plan completo antes de mutar: archivos existentes sin propiedad son conflicto; archivos administrados cambiados respecto al hash previo son conflicto; archivos ausentes administrados se pueden restaurar. Igual hash deseado y previo implica no escribir. Revisar también archivos obsoletos antes de eliminarlos.
5. Preparar staging y copias de recuperación bajo el directorio de metadatos, en el mismo volumen, con journal de operaciones. Sus nombres de respaldo no son `SKILL.md` ni carpetas de skills activas. Revalidar rutas y hashes inmediatamente antes de cada operación.
6. Aplicar reemplazos y retirar solo archivos obsoletos cuyo hash aún coincide. Preservar archivos adicionales ajenos dentro de carpetas administradas; retirar directorios únicamente si quedaron vacíos. No borrar recursivamente carpetas de skills instaladas.
7. Publicar el manifiesto al final; verificar hashes finales; limpiar únicamente staging/backups propios y liberar lock. Reinstalar la misma versión conserva contenido y no duplica recursos.
8. Ante fallo, restaurar las operaciones registradas y el manifiesto anterior. Si rollback no completa o el proceso se interrumpe, conservar journal/backups y emitir `CODEX_INSTALL_INCOMPLETE` con rutas y procedimiento de recuperación; no declarar éxito ni ejecutar otra instalación sobre ese estado. La recuperación compara hashes antes de restaurar y no sobrescribe cambios posteriores ajenos.

[Seguro] No existe transacción atómica multiruta mediante simples copias. [Probable] Journal, rollback y lock reducen instalaciones parciales recuperables; no garantizan atomicidad frente a caída del sistema ni frente a procesos externos maliciosos que cambien rutas entre verificaciones. Documentar cierre/reinicio del cliente durante una actualización si observa recursos transitorios. La implementación debe demostrar el rollback ante fallos inyectados.

## Seguridad

Autorización local bajo los permisos del usuario. No elevar privilegios, autenticar servicios, leer credenciales ni leer/modificar configuración personal. No ejecutar contenido del paquete durante instalación. El manifiesto expresa propiedad operativa, no autenticidad criptográfica; ambos manifiestos y el checkout se consideran datos que deben validarse. La lista de destinos se limita a las cuatro carpetas prefijadas y metadatos propios, incluso si un manifiesto anterior pretende reclamar otra ruta. No ampliar globalmente `isAuthorizedInstallTarget` para autorizar todo el perfil.

## Plan atómico y validación

| Orden | Responsable | Entregable / aceptación |
| --- | --- | --- |
| 1 | backend-dev | Generador Codex y mapa de identidades; 7 roles, 4 skills, referencias resueltas, cuerpos trazables, tokens completos y dos builds idénticos. |
| 2 | backend-dev | Instalador aislado con preflight, propiedad/hashes, lock, journal, rollback y errores; pruebas unitarias en temporales. |
| 3 | backend-dev | Conexión a `runBuild`, ayuda y `all`; no cambios al contrato de plataformas previas. |
| 4 | qa-engineer | Tests de aceptación, README ES/EN y guía de conflictos/recuperación; informe trazable HU-01 a HU-06. |
| 5 | qa-engineer | Prueba funcional en entorno Windows aislado con el mismo cliente disponible; registrar nombre/versión observables, raíz temporal y evidencia de descubrimiento/invocación. Si no se puede aislar el perfil del cliente, dejar bloqueada esta certificación sin instalar en el perfil personal. |
| 6 | code-reviewer | Revisión de alcance, seguridad, preservación de ajenos, coherencia de docs y evidencia; sin bloqueantes antes del cierre. |

Pruebas mínimas: nueva instalación; repetición; versión nueva que retira un rol/recurso obsoleto; local modificado; ruta ocupada sin registro; archivos ajenos dentro y fuera de carpetas del paquete; manifiesto inválido/traversal/case collision; symlink/junction; permisos y fallo durante reemplazo con rollback; interrupción con journal pendiente; ausencia de dependencia UX; report sin panel; ninguna configuración personal leída o cambiada. En sistemas sin privilegios para crear enlaces, registrar el escenario pendiente, no marcarlo aprobado por omisión.

Ejecutar `node --test --test-concurrency=1 tests/build.test.mjs tests/qa-verification.test.mjs tests/agent-optimization.test.mjs tests/codex.test.mjs` y build `--target all`, sin instalación real. Los tests existentes que enumeran exactamente cuatro plataformas deben ampliarse sin reducir sus aserciones previas. Toda instalación automatizada usa temporales; nunca `--target all --install` contra el perfil.

Smoke funcional: descubrir las cuatro identidades prefijadas; invocar feature explícitamente en proyecto de prueba; producir spec y detenerse para aprobación; consultar team-report y verificar que identifica esa aprobación pendiente; verificar team-reset sin borrar evidencia. Registrar las herramientas utilizadas para delegación real; sin ellas, registrar el flujo bloqueado y no certificarlo. Los tests de texto/archivos no sustituyen esta prueba.

### Ejecución guiada por el dueño (2026-10-15)

El dueño ejecutó la instalación por usuario y solicitó explícitamente las comprobaciones en este cliente, después del bloqueo del ensayo aislado. El smoke funcional se realizó sobre esa instalación y produjo `docs/specs/prueba-flujo-codex.md` en este repositorio. Esta intervención sustituye la instancia aislada prevista para el smoke: no se presenta como aislamiento ni autoriza al agente a reinstalar en el perfil. Las pruebas automatizadas de instalación permanecen en temporales. La aprobación final se limita a los comportamientos observados en esta sesión; la spec de prueba conserva su aprobación pendiente.

## Riesgos y consecuencias

- [Probable] El prefijo evita colisiones habituales; no evita que un usuario ya posea archivos con ese prefijo. En tal caso se aborta sin sobrescribir.
- [Probable] Overrides Codex pueden divergir del flujo canónico; tests deben contrastar etapas, aprobaciones y mapas con las fuentes.
- [Seguro] El diseño no instala agentes TOML, hooks ni panel. La ejecución por roles se realiza desde recursos de skill y capacidades del host.
- [Especulando] La versión exacta del cliente actual podría requerir un mecanismo adicional de descubrimiento. QA debe registrarlo antes de certificar; no cambiar configuración ajena para forzar reconocimiento.
- [Seguro] Si falta prueba funcional o revisión, la implementación podrá estar terminada pero la feature no cumple todavía su Definition of Done.

Integración cerrada el 2026-10-15 para Windows y el cliente de esta sesión. [QA APROBADO](../qa/instalacion-codex.md): prueba funcional guiada completada, 11/11 archivos instalados coincidentes, suite 50/50 y build de cinco plataformas correcto. Revisión final: cero hallazgos bloqueantes, LISTO PARA MERGE. No se realizó commit ni push. La spec documental de prueba sigue pendiente de aprobación y no requiere implementación para este cierre; otros clientes, versiones y sistemas no están certificados.
