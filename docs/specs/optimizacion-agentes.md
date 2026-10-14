# Especificación: Optimización de Agentes para Reducción de Tokens, Eliminación de Redundancias y Calidad de Entrega

## 1. Objetivo
Reducir el consumo excesivo de tokens y eliminar respuestas redundantes o conversacionales en los 7 agentes de `equipo-dev`, integrando las capacidades de DevOps en `backend-dev` y las de Documentador en `qa-engineer`, garantizando diagnósticos directos, código listo para ejecución, accesibilidad WCAG 2.1 AA y documentación continua en oraciones cortas.

---

## 2. Historias de Usuario

### HU-1: Diagnóstico directo y calibración de certeza en Product Owner y Architect
**Como** dueño del producto y orquestador del equipo,  
**quiero** que los agentes `product-owner` y `architect` inicien sus respuestas con un diagnóstico directo y clasifiquen sus afirmaciones técnicas mediante niveles explícitos de certeza (`[Seguro]`, `[Probable]`, `[Especulando]`),  
**para** obtener análisis concisos, evitar preámbulos innecesarios y tomar decisiones basadas en el grado real de confianza técnica.

### HU-2: Desarrollo Backend integral con capacidades DevOps en Backend Dev
**Como** desarrollador y responsable de infraestructura del proyecto,  
**quiero** que el agente `backend-dev` genere código y APIs en bloques completos listos para ejecutar, provea scripts de despliegue y CI/CD listos para usar (Docker/YAML), optimice consultas a base de datos y aplique seguridad estricta con comentarios breves y claros,  
**para** evitar la proliferación de agentes adicionales, reducir el gasto de tokens en explicaciones teóricas y disponer de infraestructura y backend unificados y operativos.

### HU-3: Diseño e implementación accesible, mobile-first y documentada en Frontend Dev y UX Designer
**Como** usuario final y mantenedor de interfaces,  
**quiero** que los agentes `ux-designer` y `frontend-dev` apliquen enfoque mobile-first, tipografía consistente con el design system, estándar de accesibilidad WCAG 2.1 AA y documenten sus decisiones clave de diseño en el README,  
**para** garantizar interfaces inclusivas y consistentes sin gastar tokens en justificaciones visuales redundantes.

### HU-4: Aseguramiento de calidad, revisión crítica y documentación continua en QA Engineer y Code Reviewer
**Como** responsable de calidad y documentación del proyecto,  
**quiero** que `qa-engineer` genere casos de prueba mínimos de alto impacto, actualice el README tras cada tarea y documente hooks y funciones en frases cortas, mientras que `code-reviewer` restrinja sus reportes exclusivamente a hallazgos críticos,  
**para** mantener la documentación siempre sincronizada con el código sin saturar el contexto con matrices de prueba redundantes ni observaciones menores de estilo.

---

## 3. Criterios de Aceptación (Gherkin)

### Criterios para HU-1: Diagnóstico directo y calibración de certeza en Product Owner y Architect
```gherkin
Escenario: Diagnóstico directo sin preámbulos conversacionales
  Dado que se solicita un análisis a "product-owner" o "architect"
  Cuando el agente emite su respuesta
  Entonces la primera oración contiene directamente el diagnóstico o la definición del problema
  Y la respuesta contiene 0 frases de cortesía o introducciones de relleno ("¡Hola!", "Con gusto te ayudo", "A continuación presento").

Escenario: Uso de etiquetas de certeza epistémica en afirmaciones técnicas
  Dado que el "architect" o "product-owner" emite una evaluación técnica, estimación de riesgo o deducción
  Cuando se clasifican los argumentos del análisis
  Entonces cada afirmación relevante está precedida exactamente por una de las etiquetas "[Seguro]", "[Probable]" o "[Especulando]"
  Y ninguna deducción sin verificación empírica se cataloga como "[Seguro]".
```

### Criterios para HU-2: Desarrollo Backend integral con capacidades DevOps en Backend Dev
```gherkin
Escenario: Código backend y APIs en bloques completos listos para ejecutar
  Dado que "backend-dev" implementa una tarea del plan de arquitectura
  Cuando escribe la solución de código o API
  Entonces el código se presenta en bloques ejecutables completos sin marcadores de posición truncados ("// implementar aquí...")
  Y los comentarios de código están restringidos a un máximo de 1 línea por sección compleja únicamente cuando la intención no sea obvia por el nombre del método.

Escenario: Entrega de scripts de despliegue y CI/CD listos para usar
  Dado que la feature o tarea requiere configuración de despliegue o integración continua
  Cuando "backend-dev" genera los artefactos DevOps
  Entonces entrega los Dockerfiles y archivos YAML de CI/CD completos y listos para ejecutar
  Y las instrucciones complementarias no exceden 3 oraciones operativas directas sin explicaciones teóricas extensas.

Escenario: Optimización de consultas y aplicación de reglas de seguridad
  Dado que la tarea involucra acceso a datos o endpoints
  Cuando el agente "backend-dev" genera la lógica
  Entonces aplica consultas parametrizadas u optimizadas sin concatenación de parámetros
  Y no incluye ningún secreto o credencial en texto plano
  Y la respuesta no incluye párrafos teóricos explicando conceptos básicos de seguridad.
```

### Criterios para HU-3: Diseño e implementación accesible, mobile-first y documentada en Frontend Dev y UX Designer
```gherkin
Escenario: Aplicación de enfoque mobile-first y consistencia visual
  Dado que "ux-designer" o "frontend-dev" diseñan o implementan una interfaz
  Cuando definen estilos, componentes y maquetación
  Entonces las definiciones de estilos comienzan con reglas para pantallas móviles antes de breakpoints de mayor resolución
  Y se utilizan exclusivamente los tokens del design system para tipografía y paleta cromática.

Escenario: Cumplimiento de accesibilidad WCAG 2.1 AA
  Dado que se evalúa o implementa un componente interactivo o pantalla
  Cuando se definen sus propiedades visuales y de interacción
  Entonces se comprueba que el contraste de texto sea de al menos 4.5:1 para texto normal
  Y los objetivos táctiles interactivos tienen un tamaño mínimo de 44 por 44 píxeles
  Y los elementos interactivos cuentan con foco visible y soporte de navegación por teclado.

Escenario: Registro de decisiones de diseño en README
  Dado que se concluye una tarea de interfaz o experiencia de usuario
  Cuando el agente finaliza su entrega
  Entonces documenta las decisiones de diseño adoptadas en el README del proyecto
  Y cada decisión se redacta en como máximo 2 oraciones directas.
```

### Criterios para HU-4: Aseguramiento de calidad, revisión crítica y documentación continua en QA Engineer y Code Reviewer
```gherkin
Escenario: Generación de suite mínima de pruebas sin redundancia
  Dado que "qa-engineer" diseña los casos de prueba para una feature
  Cuando traduce los criterios de aceptación en tests
  Entonces cada criterio de aceptación de la spec cuenta con exactamente los casos indispensables (camino feliz y condiciones de borde críticas)
  Y no se generan escenarios duplicados con variaciones triviales de datos de entrada.

Escenario: Actualización obligatoria del README y documentación concisa de funciones/hooks
  Dado que "qa-engineer" valida una tarea o feature
  Cuando culmina la verificación técnica
  Entonces actualiza el archivo README del proyecto reflejando los cambios y funcionalidades incorporadas
  Y documenta cada hook o función nueva mediante una única frase corta descriptiva.

Escenario: Reporte enfocado exclusivamente en hallazgos críticos
  Dado que "code-reviewer" audita los cambios implementados
  Cuando redacta el listado de observaciones
  Entonces reporta únicamente hallazgos que impidan el funcionamiento correcto, comprometan la seguridad o violen contratos del ADR
  Y se omite cualquier párrafo narrativo de apreciación estilística que no impida el merge.
```

---

## 4. Prioridad MoSCoW

### Must (Obligatorio)
- **HU-1**: Directrices para `product-owner` y `architect`: diagnóstico directo en la primera frase y uso de taxonomía de certeza `[Seguro]`, `[Probable]`, `[Especulando]`.
- **HU-2**: Ampliación de responsabilidades de `backend-dev` para incluir DevOps: código y APIs listas, scripts de despliegue Docker y CI/CD en YAML concisos y listos, consultas optimizadas y seguridad con comentarios breves.
- **HU-3**: Directrices para `ux-designer` y `frontend-dev`: enfoque mobile-first, tipografía consistente, accesibilidad WCAG 2.1 AA y registro de decisiones de diseño en README.
- **HU-4**: Ampliación de responsabilidades de `qa-engineer` para incluir Documentador: generación de pruebas mínimas esenciales, actualización del README tras cada tarea y documentación de hooks/funciones en frases cortas.
- **HU-4**: Enfoque de `code-reviewer` estrictamente en hallazgos críticos y bloqueantes.
- Supresión de frases de cortesía, saludos y conclusiones de relleno en todos los prompts del sistema.

### Should (Deseable)
- Plantillas de salida estandarizadas y compactas para respuestas y reportes en los agentes optimizados.
- Verificación automática de cumplimiento de pautas en el proceso de compilación de agentes (`scripts/build.mjs`).

### Could (Podría incluirse si no compromete tiempos)
- Reporte comparativo de conteo de tokens antes y después de aplicar la optimización a los prompts en `src/agents/`.

### Won't (Fuera de esta iteración)
- Creación de subagentes independientes adicionales para DevOps y Documentador (se descarta formalmente, ya que sus responsabilidades quedan integradas en `backend-dev` y `qa-engineer`).
- Modificación del flujo de orquestación `/feature` o adición de roles en el panel en vivo (se conservan exactamente los 7 roles existentes).
- Modificación de herramientas (`tools`) o permisos de sistema asignados a los agentes.

---

## 5. Fuera de Alcance
1. Creación de subagentes nuevos (`devops.md` o `documentador.md`): el equipo permanece conformado por 7 roles activos.
2. Modificación del flujo de 2 aprobaciones obligatorias del dueño (Spec y UX/ADR).
3. Modificaciones al motor de compilación multi-AI (`scripts/build.mjs`) o soporte de nuevas plataformas fuera de las definidas.
4. Alteración de la lógica de negocio de proyectos cliente donde se despliega `equipo-dev`.

---

## 6. Métricas de Éxito
- **Conservación de la arquitectura de 7 agentes**: 0 subagentes adicionales creados; 100% de responsabilidades de DevOps y Documentación asumidas por `backend-dev` y `qa-engineer`.
- **Reducción de tokens de prompt**: Reducción de al menos un 15% en el recuento total de tokens de los archivos en `src/agents/`.
- **Reducción de tokens de salida**: Disminución de al menos un 25% en tokens generados durante las revisiones de código y reportes de QA al eliminar observaciones no críticas y narrativa teórica.
- **Diagnóstico en primera frase**: 100% de las respuestas de `architect` y `product-owner` inician su primera frase con el diagnóstico o resolución técnica.
- **Trazabilidad de certeza**: 100% de afirmaciones analíticas o técnicas con incertidumbre catalogadas con `[Seguro]`, `[Probable]` o `[Especulando]`.
- **Accesibilidad WCAG 2.1 AA**: 100% de componentes visuales revisados cumplen contraste ≥ 4.5:1, táctiles ≥ 44px y navegación por teclado.
- **Actualización de documentación**: 100% de las tareas completadas por el equipo cuentan con README actualizado y funciones/hooks documentados en 1 frase corta.

---

## 7. Preguntas Abiertas
1. **Flujo de actualización del README por QA**:
   ¿La actualización del README por parte de `qa-engineer` se realiza de forma incremental por cada tarea de desarrollo que va probando, o se realiza en un único paso integrador al aprobar la suite de pruebas de la feature antes del Code Review?
2. **Tratamiento de observaciones menores en Code Review**:
   Al restringir `code-reviewer` a reportar solo hallazgos críticos, ¿las observaciones de severidad "Menor" (sugerencias cosméticas o micro-optimizaciones opcionales) deben ser totalmente descartadas del reporte, o resumirse en un bloque final de viñetas de 1 línea sin bloquear el merge?
3. **Ubicación de la documentación de hooks y funciones**:
   ¿La documentación en frases cortas de hooks y funciones debe incorporarse directamente en una sección del `README.md` del proyecto o mantenerse en comentarios directos de código (ej. JSDoc/docstrings) que luego QA valida?

---

Spec lista para aprobación del dueño.
