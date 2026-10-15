# Especificación: Renombrado de la Skill equipo-panel a team-report

## 1. Objetivo
La habilidad `equipo-panel` genera fricción de adopción y falta de homogeneidad con estándares internacionales de comandos de reporte, por lo que se requiere su renombre a `team-report` para clarificar su propósito de inspección de estado del equipo a usuarios de todas las plataformas soportadas sin alterar la lógica de reporte.

---

## 2. Historias de Usuario

### HU-1: Invocación de la habilidad de estado como team-report
**Como** usuario u orquestador del equipo de desarrollo,  
**quiero** invocar la habilidad de reporte de estado mediante el identificador `team-report` (vía `/team-report` o `/equipo-dev:team-report`),  
**para** visualizar el avance de las fases, estados de agentes y artefactos generados en la sesión activa bajo un nombre estandarizado en inglés.

### HU-2: Actualización de documentación de usuario y comandos de referencia
**Como** desarrollador que consulta las guías del repositorio,  
**quiero** que la documentación oficial (`README.md`, `README.es.md`) y descripciones de habilidades muestren `team-report` como comando oficial,  
**para** aprender y utilizar la sintaxis actualizada sin ambigüedad en ningún entorno de trabajo.

### HU-3: Gestión de transición y retrocompatibilidad para equipo-panel
**Como** usuario habitual con comandos o scripts configurados con `equipo-panel`,  
**quiero** que el sistema maneje ordenadamente la transición desde el nombre anterior,  
**para** no experimentar fallas abruptas o interrupciones de flujo al invocar la sintaxis previa.

---

## 3. Criterios de Aceptación (Gherkin)

### Criterios para HU-1: Invocación de la habilidad de estado como team-report
```gherkin
Escenario: Ejecución exitosa de team-report en modo texto/bitácora
  Dado que un proyecto cuenta con artefactos en "docs/" o actividad registrada en la bitácora
  Cuando el usuario ejecuta el comando "/team-report" o "/equipo-dev:team-report"
  Entonces el sistema presenta el resumen estructurado de las 7 fases del flujo
  Y muestra el indicador de estado correspondiente para cada rol (○ pendiente, ◌ previo, ● trabajando, ✔ terminado, ✖ error)
  Y no se producen errores por definición o manifiesto no encontrado.

Escenario: Disponibilidad de team-report en plataformas soportadas
  Dado que se compilan los paquetes de distribución para Antigravity, Claude Code, Cursor y Copilot
  Cuando se inspeccionan las habilidades compiladas
  Entonces la habilidad se encuentra registrada con el nombre "team-report"
  Y el archivo descriptor principal contiene "name: team-report".
```

### Criterios para HU-2: Actualización de documentación de usuario y comandos de referencia
```gherkin
Escenario: Documentación principal sincronizada con el nuevo nombre
  Dado que el usuario revisa "README.md" y "README.es.md"
  Cuando busca la sección de visualización del estado del equipo
  Entonces el 100% de los ejemplos y tablas de comandos indican "/team-report" (o "/equipo-dev:team-report")
  Y no existen instrucciones activas que indiquen "/equipo-panel" como comando principal vigente.
```

### Criterios para HU-3: Gestión de transición y retrocompatibilidad para equipo-panel
```gherkin
Escenario: Invocación de comando previo durante periodo de transición
  Dado que un usuario ingresa el comando "/equipo-panel"
  Cuando el sistema procesa la instrucción
  Entonces el sistema responde ejecutando el reporte de "team-report" o emitiendo un aviso de redirección hacia "/team-report"
  Y no genera un fallo no controlado de comando desconocido.
```

---

## 4. Prioridad MoSCoW
- **Must have**:
  - `[Seguro]` HU-1: Renombrar el identificador canónico de la habilidad y sus adaptadores por plataforma de `equipo-panel` a `team-report`.
  - `[Seguro]` HU-2: Actualización integral de documentación (`README.md`, `README.es.md`) reflejando `team-report`.
- **Should have**:
  - `[Probable]` HU-3: Soporte de alias de compatibilidad hacia atrás para `/equipo-panel` para prevenir rupturas inmediatas en usuarios existentes.
- **Could have**:
  - Mensaje informativo explícito de advertencia de deprecación ("aviso: equipo-panel ha sido renombrado a team-report").
- **Won't have (en esta iteración)**:
  - Renombrar la habilidad complementaria `team-reset` a `team-reset` o similares.
  - Modificar el diseño, columnas o lógica de deducción del reporte de estado.
  - Renombrar los roles de agentes o carpetas canónicas en `docs/`.

---

## 5. Fuera de Alcance
- Modificar el comportamiento funcional, esquema de datos o cálculo de tiempos del reporte de estado.
- Renombrar otras habilidades como `team-reset`, `feature` o `team-rules`.
- Modificar la estructura de carpetas de salida (`docs/specs/`, `docs/ux/`, `docs/adr/`, `docs/qa/`).
- Alterar el nombre base del plugin (`equipo-dev`).

---

## 6. Métricas de Éxito
1. **0 referencias obsoletas**: 100% de las menciones a `equipo-panel` en la documentación pública y tablas de comandos reemplazadas por `team-report`.
2. **100% de tests unitarios y de empaquetado en verde**: La suite completa de pruebas pasa exitosamente validando la presencia de `team-report`.
3. **Disponibilidad multi-plataforma**: La habilidad `team-report` se compila e instala en el 100% de las plataformas activas (Antigravity y Claude Code).
4. **Tiempo de compilación sin degradación**: El compilador completa la construcción multitarjet en un tiempo inferior a 5000 ms.

---

## 7. Preguntas Abiertas
1. ¿Se requiere conservar `/equipo-panel` como un alias funcional retrocompatible en esta versión, o se prefiere una sustitución estricta inmediata donde solo exista `/team-report`? `[Probable]` riesgo de fallo en flujos preexistentes si se elimina sin alias.
2. ¿El comando calificado en entornos con namespace de plugin debe ser `/equipo-dev:team-report` preservando el prefijo del plugin, o se plantea algún cambio en el prefijo `equipo-dev:`? `[Seguro]` que el plugin actualmente se denomina `equipo-dev`.
3. ¿Se debe planificar en una iteración posterior el renombre homogéneo de `team-reset` a `team-reset` para alinear toda la suite de comandos de soporte en inglés? `[Especulando]`.
