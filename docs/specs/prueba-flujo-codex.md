# Prueba del flujo instalado en Codex

Fecha: 2026-10-15  
Estado: **Pendiente de aprobación del dueño**  
Tipo: prueba documental sin interfaz.

## Objetivo

[Seguro] El dueño solicita una feature de prueba sin interfaz mediante la skill instalada `equipo-dev-feature`. Validar que esa invocación permite delegar en Product Owner, producir una especificación y solicitar aprobación antes de avanzar, con evidencia revisable por el dueño.

## Historias y criterios de aceptación

### H1 — Iniciar el flujo instalado (Must)

Como dueño, quiero iniciar una prueba mediante la skill instalada, para verificar la delegación y obtener una especificación revisable.

```gherkin
Dado que el dueño invoca equipo-dev-feature para una prueba sin interfaz
Cuando el orquestador inicia la etapa de Product Owner
Entonces delega realmente esa etapa a un subagente
Y el subagente consulta el recurso de Product Owner de la instalación
Y produce un único archivo docs/specs/prueba-flujo-codex.md
Y el archivo contiene objetivo, historias, criterios, prioridades, exclusiones, métricas y preguntas abiertas
```

### H2 — Respetar la aprobación (Must)

Como dueño, quiero revisar la especificación antes de continuar, para conservar el control del alcance de la prueba.

```gherkin
Dado que la especificación está generada y no ha sido aprobada
Cuando el orquestador presenta el resultado
Entonces identifica el archivo y solicita aprobación del dueño
Y mantiene el estado pendiente de aprobación
Y no inicia UX, arquitectura, desarrollo, QA ni revisión de esta prueba
```

### H3 — Consultar el estado (Should; comprobación posterior)

Como dueño, quiero consultar el estado de esta prueba, para identificar el paso completado y la aprobación pendiente.

```gherkin
Dado que esta especificación existe y sigue pendiente de aprobación
Cuando el dueño solicita equipo-dev-team-report para prueba-flujo-codex
Entonces el reporte identifica la especificación como generada
Y señala la aprobación del dueño como pendiente
Y no presenta la prueba ni la integración Codex como aprobadas por QA
```

### H4 — Explicar el reinicio sin pérdida documental (Should; comprobación posterior)

Como dueño, quiero comprobar el comportamiento de reinicio, para conservar los entregables de la prueba.

```gherkin
Dado que existen documentos de la prueba
Cuando el dueño solicita explícitamente equipo-dev-team-reset
Entonces recibe una explicación del reinicio disponible en Codex
Y los documentos existentes conservan su contenido
```

## Fuera de alcance

- Crear una funcionalidad de producto, interfaz, código o cambios de configuración.
- Ejecutar un reinicio sin una petición explícita del dueño.
- Elaborar ADR, implementar o avanzar otras etapas antes de aprobar la especificación.
- Aprobar automáticamente esta especificación o cerrar QA de la integración Codex.
- Ejecutar H3 y H4 durante la creación de esta especificación.

## Métricas de éxito

- H1: una delegación real verificable en la conversación y un archivo de especificación generado.
- H2: una solicitud de aprobación, estado pendiente y cero etapas posteriores iniciadas antes de la respuesta del dueño.
- H3: un reporte que identifique correctamente la especificación y la aprobación pendiente, cuando se solicite.
- H4: cero documentos eliminados o modificados por el reinicio, cuando se solicite.

[Seguro] La creación de este archivo no acredita por sí sola el cumplimiento de H2, H3 o H4; requieren observar las interacciones correspondientes.

## Preguntas abiertas

Ninguna para esta prueba documental.

Spec lista para aprobación del dueño
