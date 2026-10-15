# QA — Instalación Codex

Fecha: 2026-10-15. Referencias: [spec](../specs/instalacion-codex.md), [ADR 004 aprobado](../adr/004-instalacion-codex.md).

## Veredicto

**APROBADO** para Windows y el cliente de esta sesión: HU-02 cuenta ahora con una prueba funcional guiada por el usuario sobre su instalación real. La versión exacta de este cliente no es observable en la evidencia y no se extrapola a otros clientes, versiones o sistemas. El rechazo inicial se conserva como historial. Revisión final completada: **LISTO PARA MERGE**, sin hallazgos bloqueantes.

## Ejecución y alcance

La ejecución inicial y el ensayo parcial siguientes se conservan como historial; la reevaluación y regresión final de cierre constan al final.

En Windows, desde `D:\GeboArt.Dev\Equipo-Dev`, se ejecutó:

```text
node --test --test-concurrency=1 tests/build.test.mjs tests/qa-verification.test.mjs tests/agent-optimization.test.mjs tests/codex.test.mjs
```

Resultado: exit 0, 50 pruebas aprobadas, 0 fallos, 0 omitidas, aproximadamente 3.87 s. Incluye 13 casos Codex y 37 de regresión. Las pruebas de junction en origen y destino se ejecutaron; no fueron omitidas por permisos. Las pruebas de permisos usan fallos EACCES/EPERM inyectados, no una configuración real de ACL del usuario. Todas las instalaciones de prueba usan temporales creados con `mkdtemp`; no se instaló en el perfil personal.

También se verificaron la ayuda CLI, ambos README y la compilación final `node scripts/build.mjs --target all` tras actualizar documentación. Las guías documentan los mismos nombres, comandos, alcance, límites, dependencias UX y recuperación; los README generados se copian desde esas fuentes.

## Smoke parcial del parser CLI

Se ejecutó el `app-server --stdio` del binario local de la extensión VS Code `openai.chatgpt-26.1007.21434-win32-x64/bin/windows-x86_64/codex.exe`, sin autenticación ni solicitud de ejecución de modelo. `initialize` informó `0.162.0-alpha.17.2`, Windows `10.0.22631` x86_64 y `codexHome` temporal. Se copió el payload generado a `C:\Users\geboa\AppData\Local\Temp\equipo-dev-parser-ZQeCdc\skills` y se invocaron `skills/extraRoots/set` con esa raíz y `skills/list` con `cwds` temporal y `forceReload:true`.

Resultado: las cuatro identidades `equipo-dev-feature`, `equipo-dev-team-rules`, `equipo-dev-team-report` y `equipo-dev-team-reset` aparecen con `enabled:true`, sus rutas apuntan al temporal y `errors:[]`. Evidencia JSON retenida en `C:\Users\geboa\AppData\Local\Temp\equipo-dev-parser-ZQeCdc\evidence.json`. Esto prueba parsing y descubrimiento mediante raíz extra explícita en ese CLI, no descubrimiento automático de la instalación por usuario, invocación ni compatibilidad del cliente de esta conversación.

El proceso hijo recibió un entorno mínimo con HOME, USERPROFILE y CODEX_HOME apuntando a temporales; no se modificaron variables del proceso padre ni del sistema. Aun así, el CLI enumeró dos skills personales existentes bajo `.agents/skills`; por tanto, el aislamiento del descubrimiento no fue completo. Se terminó el proceso sin ejecutar modelo ni continuar a autenticación. No se instalaron archivos en el perfil ni se solicitaron lecturas de configuración/credenciales personales; este ensayo no demuestra ausencia absoluta de lecturas internas del cliente fuera del temporal.

## Tabla de verificación

Los nombres de tests Codex corresponden a `tests/codex.test.mjs`; los de regresión pertenecen a las otras tres suites del comando anterior.

| Criterio Gherkin | Test asociado / evidencia | Resultado (OK / FALLA) |
|---|---|---|
| HU-01: generar siete roles y cuatro skills, referencias y tokens válidos sin instalar | `Codex: generación determinista, 4 skills y 7 recursos trazables`; build valida referencias relativas y hashes | OK |
| HU-01: dos generaciones idénticas | Mismo test compara manifiestos y hashes del contenido instalado, además de retirar salida obsoleta | OK |
| HU-02: instalar e informar resultado y pasos de reconocimiento | `instalación, repetición sin escrituras y preservación de ajenos`; salida informa 11 archivos y reconocimiento pendiente | OK |
| HU-02: tras instalar, reconocer e invocar feature en el cliente | Prueba guiada del 2026-10-15: instalación por el usuario, cuatro skills en catálogo e invocación instalada | OK |
| HU-02: feature produce spec y espera aprobación; team-report refleja pendiente | Prueba guiada: delegación PO real, spec pendiente y reporte de aprobación pendiente | OK |
| HU-03: reinstalar sin duplicados y conservar archivos ajenos | `instalación, repetición sin escrituras y preservación de ajenos`; conserva contenido y mtime | OK |
| HU-03: actualizar y retirar recursos obsoletos | `actualización retira recurso obsoleto y restaura administrado ausente` | OK |
| HU-03: conflicto local sin sobrescritura | `preflight rechaza modificación local incluso recurso obsoleto sin cambios parciales`; `no adopta archivo sin registro aunque tenga contenido idéntico` | OK |
| HU-04: instrucciones adaptadas, aprobaciones, siete recursos y cuatro skills | Test de generación, inspección de feature/roles y guías bilingües; no configura modelos/herramientas nativas | OK |
| HU-04: capacidad no disponible se declara y pausa | Test de generación comprueba pausa sin delegación y dependencia UX; report indica que documento no acredita aprobación; ejecución funcional de estas ramas no certificada | OK |
| HU-05: rutas no permitidas, enlaces y manifiestos peligrosos | Tests `manifiestos: traversal, ADS, reservados, case collision, esquema y ámbito`, `manifiesto instalado inválido no autoriza rutas ajenas`, `rechaza junction en destino y en origen` | OK |
| HU-05: permisos/fuente inválida sin éxito falso y preservación | Tests de fallo inyectado durante reemplazo, fallo staging y paquete alterado; rollback restaura archivos/manifiesto | OK |
| HU-05: interrupción incompleta informada y recuperación segura | `rollback no pisa cambios posteriores; journal bloquea y recuperación compara hashes`; `lock existente detiene instalación` | OK |
| HU-06: help y guías ES/EN describen comandos, alcance, comprobación y conflictos | Lectura de ambos README y salida de `--help`; referencia `recoverCodex` y límites incluidos | OK |
| HU-06: all incluye cinco plataformas y preserva contratos anteriores | 50/50 suite secuencial y build final de cinco targets sin instalación personal | OK |

## Historial de bugs y bloqueos (evaluación inicial, superada)

No se identificaron defectos de producción reproducibles en esta ejecución automatizada. La revisión independiente de solo lectura tampoco encontró bloqueantes de código; su alcance y veredicto constan al final de este informe.

**QA-01 — Bloqueante inicial de certificación: smoke ausente. Resuelto por la evidencia nueva descrita abajo.**

- Reproducción de la brecha: compilar/instalar en temporal y observar que ello no cambia el catálogo de skills de esta sesión; no existe aquí evidencia de una instancia aislada de este mismo cliente que cargue ese destino y ejecute el flujo.
- Esperado: descubrir las cuatro identidades prefijadas en el mismo cliente, invocar feature, producir spec mediante delegación real, detenerse por aprobación, consultar team-report y comprobar que team-reset conserva documentos.
- Obtenido: generación e instalación aisladas verificadas, más parsing de cuatro skills por raíz extra en el CLI local; reconocimiento e invocación en el cliente actual no ejecutados. El CLI de la extensión es un cliente distinto y el smoke sin autenticación no se presenta como validación de esta sesión.
- Resolución: disponer de una instancia aislada del cliente objetivo y ejecutar el protocolo funcional descrito en el ADR; conservar versión, rutas temporales, catálogo reconocido, herramientas de delegación y artefactos de prueba. No requiere cambiar producción basándose solo en esta limitación.

No se solicitaron lecturas de credenciales/configuración personal; el límite de aislamiento del parser está documentado arriba. No hay certificado de compatibilidad macOS/Linux ni de otros clientes. La lectura de instrucciones y los tests de texto no sustituyen evidencia de ejecución.

El orquestador comunicó revisión independiente inicial sin bloqueantes de código, con veredicto **CAMBIOS REQUERIDOS** por la certificación funcional entonces pendiente. Esta constancia es histórica.


## Reevaluación funcional — 2026-10-15

El dueño ejecutó personalmente `node scripts/build.mjs --target codex --install` y aportó la salida: destino `C:\Users\geboa\.agents\skills`, `created:11`, `updated:0`, `removed:0`, `unchanged:0`, finalización en 267 ms. Después invocó explícitamente las skills instaladas y pidió «completa la integracion COdex que esta pendiente de cierre de QA». Esta intervención sustituye el protocolo aislado inicial por una prueba funcional guiada voluntaria sobre su perfil real, documentada en la adenda del ADR. No se afirma aislamiento. QA no instaló ni reinstaló el paquete en ese perfil; las instalaciones automatizadas siguen usando temporales.

| Paso observado en la conversación | Evidencia y resultado |
|---|---|
| Reconocimiento | El catálogo de sesión incluye las cuatro identidades prefijadas bajo `.agents/skills`. |
| Invocación instalada | El dueño seleccionó `equipo-dev-feature` desde su ruta instalada para crear una feature de prueba sin interfaz. |
| Delegación real | El orquestador leyó instrucciones instaladas y usó `collaboration.spawn_agent` para `/root/po_prueba_instalada`; el PO consultó su recurso instalado y produjo [prueba-flujo-codex](../specs/prueba-flujo-codex.md). |
| Aprobación | La respuesta solicitó aprobación y no inició arquitectura ni desarrollo de la prueba; la spec continúa pendiente. |
| Reporte | `equipo-dev-team-report` informó PO completado, aprobación pendiente y etapas posteriores sin iniciar; no declaró QA aprobado. |
| Reinicio | `equipo-dev-team-reset` explicó que no hay panel persistente; su turno solo leyó la skill, sin herramientas de mutación ni eliminación. La spec permanece disponible. |

La evidencia de interacción está en la conversación de esta sesión, no en un log independiente del cliente. La preservación durante reset se sustenta en la ausencia de escrituras del turno y la persistencia del documento; no hay un hash anterior al reset. En esta reevaluación, el SHA-256 de la spec es `1dd2f611cf9be0a89dcc915a12da6c5c34ee17ee726829f6f793aa74f7782f09`.

Trazabilidad de solo lectura: los 11 archivos instalados coinciden por SHA-256 con `dist/codex/equipo-dev/package-manifest.json`, paquete `equipo-dev-codex` versión `0.5.0`. Se leyeron únicamente recursos del paquete, sin configuración ni credenciales personales. Esto demuestra identidad del contenido actual, no reconstruye estados históricos.

Alcance funcional: generación de spec por Product Owner, pausa, reporte y reinicio en el cliente de sesión Windows, cuya versión exacta no se registró. Los siete recursos están presentes y cubiertos por tests de generación; el smoke no acredita ejecución de los otros seis roles, del flujo UX ni del ciclo completo de desarrollo. La delegación de QA para este cierre es evidencia adicional de uso, no amplía esa certificación. Se conserva el ensayo parcial del parser CLI con su limitación de aislamiento; su versión no se atribuye al cliente de esta conversación.

QA-01 queda resuelto para el alcance Windows/cliente de sesión. No requiere modificar producción ni aprobar la feature documental de prueba.

## Regresión final de cierre

Se repitió una vez la suite completa secuencial el 2026-10-15 tras actualizar README ES/EN: **50/50 aprobadas, 0 fallos, 0 omitidas**, exit 0, 3951.7301 ms. Se ejecutó después `node scripts/build.mjs --target all`: cinco targets compilados sin instalación personal. El alcance y los límites de permisos inyectados/junctions son los descritos en la ejecución inicial. La documentación bilingüe refleja el smoke guiado y no promete compatibilidad con otros entornos.

## Revisión final y cierre

El 2026-10-15, el reviewer delegado `review_cierre_codex` revisó en modo solo lectura la implementación, el ADR y este informe actualizado: **0 hallazgos bloqueantes detectados; LISTO PARA MERGE**. No repitió pruebas ni modificó archivos. Sustituye el veredicto preventivo previo, cuyo único bloqueo era la evidencia funcional ahora acreditada. Integración cerrada dentro del alcance Windows/cliente de sesión, sin commit ni push.
