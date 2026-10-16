# Especificación: Control de Activación y Desactivación de Aprobaciones del Equipo

## 1. Objetivo
El flujo `/feature` impone actualmente dos pausas obligatorias sincrónicas de confirmación humana (aprobación de Spec y aprobación de UX/ADR), lo cual bloquea la ejecución desatendida requerida por el dueño para flujos continuos, prototipado acelerado o pipelines automatizados. Esta funcionalidad dota al dueño de un mecanismo de control explícito para alternar entre el modo interactivo supervisado estándar y un modo continuo autónomo sin pausas intermedias en las compuertas de diseño.

---

## 2. Historias de Usuario

### HU-1: Ejecución del flujo continuo en modo autónomo (aprobaciones desactivadas)
**Como** dueño del proyecto y orquestador del equipo,  
**quiero** desactivar las pausas obligatorias de aprobación de Spec y UX/ADR en la ejecución de `/feature`,  
**para** permitir que el equipo de agentes complete el ciclo completo de entrega de extremo a extremo sin esperas ociosas de intervención humana.

### HU-2: Ejecución interactiva estándar con pausas de control (aprobaciones activadas por defecto)
**Como** dueño del proyecto,  
**quiero** que el modo supervisado con pausas obligatorias de aprobación en Spec y UX/ADR permanezca como comportamiento por defecto del sistema,  
**para** asegurar la gobernanza sobre el alcance, la interfaz y las decisiones arquitectónicas antes de que se inicie la codificación cuando no indique explícitamente lo contrario.

### HU-3: Señalización y trazabilidad del modo de aprobación en reportes y bitácora
**Como** dueño del proyecto,  
**quiero** que el reporte de estado (`team-report`) y el mensaje de arranque del orquestador indiquen claramente si el flujo opera en modo supervisado o continuo,  
**para** tener certeza inmediata sobre si el sistema se encuentra esperando interacción o procesando fases en segundo plano de manera autónoma.

---

## 3. Criterios de Aceptación (Gherkin)

### Criterios para HU-1: Ejecución del flujo continuo en modo autónomo
```gherkin
Escenario: Ejecución de extremo a extremo sin pausas intermedias en feature con interfaz
  Dado que el dueño inicia el flujo "/feature" con el modo continuo activado
  Y la feature requiere interfaz gráfica
  Cuando el agente "product-owner" genera exitosamente "docs/specs/<feature>.md"
  Entonces el orquestador no se detiene a solicitar aprobación de la spec
  Y transiciona inmediatamente al agente "ux-designer"
  Y tras generarse el diseño UX y el ADR de arquitectura
  Entonces el orquestador no se detiene a solicitar la segunda aprobación (UX + ADR)
  Y transiciona inmediatamente a la fase de implementación con los desarrolladores.

Escenario: Ejecución continua en feature exclusivamente backend
  Dado que el dueño inicia el flujo "/feature" con el modo continuo activado
  Y la feature es de tipo backend sin interfaz
  Cuando el agente "product-owner" genera exitosamente la spec
  Entonces el orquestador transiciona de inmediato a "architect" omitiendo la pausa humana
  Y tras generarse el ADR, transiciona directamente a "backend-dev" sin esperar confirmación.

Escenario: Respeto inviolable a las compuertas de seguridad críticas
  Dado que una ejecución en modo continuo se encuentra en curso
  Cuando se presenta una acción catalogada como crítica de seguridad (ejecución de commit, push git, comandos destructivos o tercer fallo consecutivo de QA/Revisión)
  Entonces el sistema detiene la ejecución inmediatamente
  Y solicita confirmación explícita del dueño sin omitir la compuerta de seguridad.
```

### Criterios para HU-2: Ejecución interactiva estándar con pausas de control
```gherkin
Escenario: Retención obligatoria en compuerta de Especificación por defecto
  Dado que el dueño invoca "/feature" sin suministrar flags ni configuraciones de modo continuo
  Cuando "product-owner" finaliza la redacción de "docs/specs/<feature>.md"
  Entonces el orquestador muestra el resumen de la spec y las preguntas abiertas
  Y detiene completamente el avance del equipo hasta recibir aprobación explícita del dueño.

Escenario: Retención obligatoria en compuerta de UX y Arquitectura por defecto
  Dado que el dueño aprobó la spec en modo estándar
  Cuando "architect" (y "ux-designer" si aplica) finaliza la entrega del ADR y artefactos de diseño
  Entonces el orquestador muestra el resumen de diseño, contratos y plan de tareas
  Y detiene completamente el avance del equipo hasta recibir la segunda aprobación explícita del dueño.
```

### Criterios para HU-3: Señalización y trazabilidad del modo de aprobación
```gherkin
Escenario: Notificación inicial del modo de operación al iniciar la feature
  Dado que se invoca el comando de feature
  Cuando el orquestador emite el primer mensaje de inicio
  Entonces el mensaje especifica en la primera o segunda línea el modo seleccionado ("Modo continuo / Autónomo" o "Modo supervisado / Interactivo").

Escenario: Reflejo del estado de pausas en team-report
  Dado que una feature se ejecuta en modo continuo
  Cuando se consulta el estado mediante "/team-report"
  Entonces las fases de aprobación de Spec y Aprobación UX+ADR se muestran marcadas como auto-aprobadas o no bloqueantes
  Y no se muestran con el indicador de espera "⏸".
```

---

## 4. Prioridad MoSCoW
- **Must have**:
  - `[Seguro]` HU-1: Capacidad de desactivar las dos compuertas de aprobación del flujo `/feature` (Pausa 1: Spec y Pausa 2: UX + ADR).
  - `[Seguro]` HU-2: Preservación del modo interactivo supervisado con pausas como comportamiento por defecto cuando no se explicite lo contrario.
  - `[Seguro]` Preservación estricta de las reglas de seguridad: las autorizaciones de git commit/push y comandos destructivos no pueden ser omitidas por esta funcionalidad.
- **Should have**:
  - `[Probable]` HU-3: Indicador visible del modo activo (supervisado vs continuo) tanto en la cabecera de ejecución de `/feature` como en `team-report`.
- **Could have**:
  - `[Especulando]` Configuración opcional persistente a nivel de proyecto (por ejemplo en `CLAUDE.md` o archivo de configuración local) para fijar el modo sin requerir parámetros en cada invocación.
- **Won't have (en esta iteración)**:
  - Granularidad selectiva por fase (por ejemplo, pausar únicamente en Spec pero auto-aprobar ADR, o viceversa).
  - Auto-aprobación o bypass de los veredictos de QA Engineer o Code Reviewer ante fallos bloqueantes.
  - Modificación de la estructura de artefactos generados en `docs/`.

---

## 5. Fuera de Alcance
- Omitir o relajar las autorizaciones para comandos de riesgo, mutación destructiva de datos o commits/push a repositorios remotos.
- Modificar el flujo de trabajo interno o los prompts de especialidad de los subagentes individuales (`product-owner`, `ux-designer`, `architect`, `backend-dev`, `frontend-dev`, `qa-engineer`, `code-reviewer`).
- Alterar la lógica de reintento de QA (límite de 3 ciclos antes de escalar).
- Modificar la sintaxis de definición de historias o especificaciones en Gherkin.

---

## 6. Métricas de Éxito
1. **0 pausas intermedias en modo continuo**: El 100% de las ejecuciones iniciadas con aprobaciones desactivadas completan las transiciones PO → UX → Arquitecto → Dev sin solicitar entradas de confirmación en las compuertas de diseño (siempre que no ocurran errores de ejecución).
2. **100% de retención en modo interactivo**: El 100% de las ejecuciones por defecto se detienen de forma determinista en la compuerta 1 (Spec) y en la compuerta 2 (UX + ADR).
3. **0 incidentes de seguridad**: 0 transgresiones a las reglas de no commit/push sin autorización explícita del dueño, con independencia del modo de aprobación configurado.
4. **Trazabilidad inequívoca**: El 100% de las salidas de arranque e informes de `team-report` reflejan con precisión el modo operativo en curso.

---

## 7. Preguntas Abiertas
1. ¿Cuál es la interfaz preferida por el dueño para alternar el modo de aprobación?
   - Opción A: Flag de comando directo en `/feature` (ejemplo: `/feature --no-pause <descripción>` o `/feature --auto-approve <descripción>`). `[Probable]`
   - Opción B: Comando o instrucción interactiva al iniciar la sesión (ejemplo: solicitar confirmación del modo si no viene definido). `[Especulando]`
   - Opción C: Parámetro persistente en archivo de configuración de proyecto (`CLAUDE.md` o descriptor de entorno). `[Probable]`
   - Opción D: Variable de entorno del sistema (ejemplo: `EQUIPO_DEV_AUTO_APPROVE=1`). `[Especulando]`
2. ¿Debe el modo continuo abortar inmediatamente el flujo si el `product-owner` o el `ux-designer` dejan preguntas abiertas críticas sin resolver, o debe continuar asumiendo supuestos razonables? `[Probable]` riesgo de desvío de negocio si se avanza con dudas estructurales no contestadas.
3. Al retomar una feature previamente pausada (`/feature continuemos con <nombre>`), ¿el comando debe asumir el modo interactivo por defecto a menos que se agregue explícitamente el modificador de modo continuo? `[Probable]`.
