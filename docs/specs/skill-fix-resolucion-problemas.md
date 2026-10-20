# Especificación: Skill /fix para Resolución Rápida de Problemas y Regresiones

El flujo estándar `/feature` impone un overhead desproporcionado de tokens (40.000 a 80.000+ tokens por ejecución) y una latencia inadmisible al forzar la intervención de Product Owner, UX Designer y Arquitecto con dos pausas de aprobación humana obligatorias para corregir defectos técnicos puntuales, fallos en tiempo de ejecución o regresiones que demandan una remediación quirúrgica inmediata.

---

## 1. Objetivo
Resolver defectos de código, excepciones en tiempo de ejecución y regresiones de software reduciendo entre un 60% y un 75% el consumo de tokens y acortando el tiempo de ciclo a la mitad respecto a `/feature`. Beneficia al desarrollador y al dueño del proyecto al suprimir fases de diseño y aprobaciones intermedias innecesarias para incidencias operativas, canalizando la resolución a través de un circuito técnico directo (Dev -> QA -> Code Reviewer) con salvaguardas de seguridad intactas y verificación de no-regresión.

---

## 2. Historias de Usuario

### HU-1: Invocación ágil de remediación técnica
**Como** desarrollador o mantenedor que detecta un bug o fallo de ejecución,  
**quiero** invocar la habilidad mediante el comando `/fix <descripción o traza>` (o el alias `/bug`),  
**para** disparar inmediatamente el análisis y corrección del problema sin redactar requerimientos de negocio ni esperar aprobaciones de diseño.

### HU-2: Circuito técnico acotado y test de regresión obligatorio
**Como** responsable técnico de la estabilidad del proyecto,  
**quiero** que la corrección sea ejecutada exclusivamente por el desarrollador correspondiente (análisis de causa raíz, parche mínimo y test automatizado que reproduce el fallo), validada por QA contra la suite de pruebas completa y auditada por Code Reviewer,  
**para** asegurar que el defecto queda resuelto sin generar efectos colaterales y con garantía de no-regresión.

### HU-3: Registro documental ligero y trazabilidad de estado
**Como** mantenedor del historial del proyecto,  
**quiero** que la remediación quede registrada en el panel en vivo bajo la tipología `FIX` y genere un artefacto sintético en `docs/fixes/<id-o-slug>.md`,  
**para** auditar la causa raíz y los cambios introducidos sin incurrir en la pesadez de una especificación formal ni de un ADR completo.

### HU-4: Preservación irrestricta de salvaguardas de seguridad
**Como** dueño del repositorio,  
**quiero** que el flujo rápido `/fix` mantenga activas las restricciones de confirmación humana obligatoria antes de realizar commits, push o ejecutar comandos destructivos,  
**para** evitar daños irreversibles o alteraciones no autorizadas en el código base o entorno durante arreglos urgentes.

---

## 3. Criterios de Aceptación (Gherkin)

### Criterios para HU-1: Invocación ágil de remediación técnica
```gherkin
Escenario: Invocación válida con descripción del problema o traza de error
  Dado que el usuario detecta un fallo o prueba rota en el proyecto
  Cuando ejecuta el comando "/fix Cannot read properties of undefined (reading 'status')" o "/bug <descripción>"
  Entonces el sistema inicializa el flujo de remediación omitiendo las etapas de Product Owner, UX Designer y Arquitecto
  Y no solicita aprobaciones previas de diseño o especificación
  Y delega el problema directamente al rol de desarrollo relevante.

Escenario: Invocación de comando sin argumentos
  Dado que el usuario ingresa "/fix" o "/bug" sin proveer descripción ni traza
  Cuando el orquestador analiza la entrada
  Entonces el sistema detiene la ejecución inmediatamente
  Y muestra un mensaje de ayuda indicando: "Uso: /fix <descripción del error, traza o archivo afectado>".

Escenario: Compatibilidad de sintaxis con alias /bug
  Dado que un usuario prefiere invocar la corrección mediante "/bug <descripción>"
  Cuando el comando es procesado
  Entonces el sistema ejecuta la misma rutina y lógica que "/fix" sin divergencia funcional.
```

### Criterios para HU-2: Circuito técnico acotado y test de regresión obligatorio
```gherkin
Escenario: Ejecución de flujo técnico completo en verde
  Dado que se dispara una remediación con "/fix"
  Cuando el agente desarrollador formula el análisis de causa raíz (RCA), aplica el parche de código mínimo indispensable y añade un test automatizado que reproduce el defecto
  Y el agente QA ejecuta la suite de pruebas completa obteniendo veredicto APROBADO sin regresiones
  Y el agente Code Reviewer dictamina APROBADO sin hallazgos de severidad Bloqueante ni riesgos de seguridad
  Entonces el flujo concluye exitosamente entregando un resumen de cierre de 5 líneas al usuario.

Escenario: Rechazo en QA y ciclo de reintento acotado
  Dado que el agente QA ejecuta las pruebas sobre el parche y detecta un fallo funcional o regresión
  Cuando emite un informe con veredicto RECHAZADO
  Entonces el sistema reasigna la tarea al desarrollador adjuntando los fallos específicos reportados
  Y el desarrollador ajusta el código y reenvía a QA
  Y si se alcanza el 3er intento fallido consecutivo, el sistema detiene el flujo y escala inmediatamente el caso al dueño.

Escenario: Hallazgos bloqueantes en Code Reviewer
  Dado que el parche supera la fase de QA pero Code Reviewer identifica una vulnerabilidad crítica o regresión de seguridad
  Cuando emite su dictamen con hallazgos Bloqueantes
  Entonces el flujo devuelve el control al desarrollador para subsanar el hallazgo de seguridad (máximo 3 vueltas antes de escalar al dueño).

Escenario: Omisión estricta de roles innecesarios
  Dado un ciclo de remediación con "/fix" en ejecución
  Cuando se inspecciona la secuencia de subagentes convocados
  Entonces no se registran llamadas a "product-owner", "ux-designer" ni "architect"
  Y no se generan archivos en "docs/specs/", "docs/ux/" ni "docs/adr/".
```

### Criterios para HU-3: Registro documental ligero y trazabilidad de estado
```gherkin
Escenario: Creación del artefacto de reporte ágil
  Dado que el flujo de remediación concluye con aprobación técnica
  Cuando se consolida la solución
  Entonces se genera el archivo "docs/fixes/<id-o-slug>.md"
  Y el documento contiene exclusivamente: Diagnóstico/RCA (máximo 5 líneas), Archivos modificados, Test de regresión añadido y Comprobación de no-regresión.

Escenario: Visibilidad en bitácora y panel de estado
  Dado que el comando "/fix" inicia su ejecución
  Cuando el usuario consulta el estado mediante "/team-report" o panel en vivo
  Entonces la actividad se clasifica explícitamente con tipo o prefijo "FIX"
  Y los roles omitidos (PO, UX, Arquitecto) figuran como omitidos o no aplicables en la sesión.
```

### Criterios para HU-4: Preservación irrestricta de salvaguardas de seguridad
```gherkin
Escenario: Bloqueo de commits o push automáticos sin autorización
  Dado que el parche ha sido probado y revisado satisfactoriamente por QA y Reviewer
  Cuando el flujo finaliza sus validaciones
  Entonces el sistema no ejecuta "git commit" ni "git push" de forma autónoma
  Y solicita autorización explícita al dueño indicando los archivos modificados.

Escenario: Prevención de comandos destructivos durante la corrección
  Dado que el desarrollador o cualquier agente del flujo evalúa una acción que implica borrado masivo, eliminación de tablas, "rm -rf" o alteración destructiva de base de datos
  Cuando se pretende invocar dicho comando
  Entonces el sistema bloquea la ejecución y solicita confirmación humana explícita antes de proceder.
```

---

## 4. Prioridad MoSCoW

- **Must have**:
  - `[Seguro]` HU-1: Invocación mediante `/fix <descripción o traza>` con validación de argumento no vacío.
  - `[Seguro]` HU-2: Secuencia operativa obligatoria y acotada: Dev (RCA + parche mínimo + test de regresión) -> QA (validación de suite) -> Code Reviewer (filtro de seguridad y calidad).
  - `[Seguro]` HU-2: Límite estricto de 3 reintentos ante rechazos de QA o Reviewer antes de escalar al dueño.
  - `[Seguro]` HU-3: Generación del artefacto liviano `docs/fixes/<id-o-slug>.md` resumiendo causa y parche.
  - `[Seguro]` HU-4: Preservación del 100% de las salvaguardas de seguridad (cero commits/push no autorizados, cero comandos destructivos sin confirmación humana).
- **Should have**:
  - `[Probable]` HU-1: Soporte del alias `/bug` idéntico funcionalmente a `/fix` para ergonomía del desarrollador.
  - `[Probable]` HU-3: Registro diferenciado en bitácora/panel (`team-report`) identificando el flujo como `FIX` y marcando como no aplicables las etapas de PO, UX y Arquitecto.
- **Could have**:
  - `[Probable]` Flag opcional `--reproduce-only` que instruye a Dev a escribir únicamente el test que falla para confirmar el bug antes de modificar el código productivo.
  - `[Especulando]` Detección automática en base a la traza si el error corresponde a frontend o backend para despachar al agente especialista sin intervención manual.
- **Won't have (en esta iteración)**:
  - `[Seguro]` Soporte para diseño visual o maquetado de pantallas (si requiere interfaz nueva, debe canalizarse por `/feature`).
  - `[Seguro]` Modificación de decisiones arquitectónicas estructurales o nuevos contratos de servicios no contemplados en el código existente.
  - `[Seguro]` Pausas de aprobación humana previas a la intervención de QA o Reviewer (el flujo corre de manera continua técnica).

---

## 5. Fuera de Alcance

- Creación o desarrollo de funcionalidades nuevas o historias de usuario ampliadas (deben utilizar `/feature`).
- Rediseño de componentes visuales, flujos de navegación o interacción con `ui-ux-pro-max`.
- Redacción de especificaciones de negocio (`docs/specs/`) o registros de arquitectura (`docs/adr/`).
- Realización de commits o git push automáticos al finalizar el parche.
- Resolución de conflictos mayores de merge en ramas externas no vinculadas directamente al defecto.

---

## 6. Métricas de Éxito

1. **Reducción del consumo de tokens**: `[Probable]` Disminución de entre 60% y 75% en el gasto total de tokens por remediación frente al flujo estándar `/feature` sobre la misma base de código.
2. **Reducción de latencia de ciclo**: `[Probable]` Reducción de al menos un 50% en el tiempo transcurrido desde la invocación hasta la obtención del dictamen final aprobado.
3. **Cobertura de regresión**: `[Seguro]` El 100% de las remediaciones aprobadas incluyen al menos un test automatizado nuevo que verifica la corrección de la falla y previene su reaparición.
4. **Adherencia a salvaguardas de seguridad**: `[Seguro]` 0 incidentes de commits no aprobados, pushes no solicitados o comandos destructivos ejecutados de manera desatendida.
5. **Efectividad de resolución**: `[Probable]` Tasa de aprobación en primera o segunda vuelta de QA >= 85% sin requerir escalamiento al dueño.

---

## 7. Preguntas Abiertas

1. ¿El comando principal debe ser `/fix` con `/bug` como alias secundario en todos los adaptadores, o se requiere que ambos se registren como comandos independientes de primer nivel en los manifiestos de plataforma? `[Probable]` que definirlos como alias facilite la portabilidad entre asistentes.
2. ¿El archivo `docs/fixes/<id-o-slug>.md` debe generarse obligatoriamente para parches ultra-breves (e.g. typos, correcciones de una línea), o se debe habilitar una opción de reporte exclusivo en chat/bitácora para evitar acumulación de archivos menores? `[Especulando]`.
3. ¿Cómo debe visualizarse la ejecución de `/fix` en `team-report`: conservando la tabla habitual de 7 fases con PO, UX y Arquitecto marcados como omitidos (`-` o `◌`), o desplegando un formato compacto de 3 roles técnicos (Dev, QA, Reviewer)? `[Probable]` que conservar la estructura base minimice roturas en herramientas de visualización existentes.
4. Si un defecto involucra simultáneamente frontend y backend o la traza es ambigua, ¿cuál debe ser la regla de precedencia por defecto: despachar primero a `backend-dev`, a `frontend-dev`, o solicitar aclaración al usuario antes de iniciar? `[Especulando]`.

---

Spec lista para aprobación del dueño.
