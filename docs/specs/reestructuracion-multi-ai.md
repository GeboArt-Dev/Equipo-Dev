# Especificación: Reestructuración del Repositorio hacia una Arquitectura Agnóstica Multi-AI (src/ + platforms/)

## 1. Objetivo
Transformar el repositorio de `equipo-dev` en un sistema agnóstico multi-plataforma donde toda la lógica de negocio, definiciones de roles, flujos y habilidades residan en una única fuente de verdad (`src/`), permitiendo compilar adaptadores específicos (`platforms/`) para Claude Code, Antigravity y futuras plataformas (Cursor, GitHub Copilot) mediante un proceso unificado de construcción hacia `dist/`, sin duplicación de definiciones ni divergencia de comportamiento.

---

## 2. Historias de Usuario

### HU-1: Centralización agnóstica de roles y habilidades en `src/`
**Como** desarrollador y mantenedor de `equipo-dev`,  
**quiero** definir los prompts, roles del equipo, flujos de trabajo y habilidades en un directorio fuente agnóstico (`src/`),  
**para** evitar la duplicación de definiciones, asegurar coherencia entre herramientas y mantener una única fuente de verdad independiente de la plataforma de IA consumidora.

### HU-2: Adaptadores modulares por plataforma en `platforms/`
**Como** desarrollador y mantenedor de `equipo-dev`,  
**quiero** disponer de configuraciones y adaptadores desacoplados para cada plataforma soportada en `platforms/` (Claude Code y Antigravity, con bases estructurales para Cursor y GitHub Copilot),  
**para** transformar y mapear las capacidades agnósticas (herramientas, nombres de modelos, formatos de manifiestos y hooks) según los requerimientos de cada entorno sin alterar la fuente de verdad.

### HU-3: Proceso unificado de compilación y empaquetado en `dist/`
**Como** desarrollador y mantenedor de `equipo-dev`,  
**quiero** ejecutar un comando centralizado de construcción que admita generar todos los targets o un target específico,  
**para** obtener artefactos listos para uso y distribución dentro de `dist/<plataforma>/` de manera consistente y reproducible.

### HU-4: Instalación local automatizada por plataforma
**Como** usuario del sistema `equipo-dev`,  
**quiero** contar con una opción de instalación directa hacia mi entorno local configurado para la plataforma seleccionada (por ejemplo, Antigravity o Claude Code),  
**para** desplegar las actualizaciones del equipo en mi entorno de trabajo sin necesidad de copiar archivos manualmente.

### HU-5: Base de extensibilidad para Cursor y GitHub Copilot
**Como** desarrollador del sistema,  
**quiero** contar con contratos de adaptación y estructura base para Cursor y GitHub Copilot en `platforms/`,  
**para** permitir la integración fluida de estas plataformas en fases posteriores sin requerir una reestructuración adicional del repositorio.

---

## 3. Criterios de Aceptación (Gherkin)

### Criterios para HU-1: Centralización agnóstica de roles y habilidades
```gherkin
Escenario: Edición de un rol en la fuente agnóstica
  Dado que existe la definición del rol "product-owner" en "src/agents/product-owner.md"
  Cuando se actualiza una instrucción de negocio en dicho archivo
  Y se ejecuta el proceso de construcción para todas las plataformas soportadas
  Entonces los artefactos generados en "dist/claude-code/" y "dist/antigravity/" reflejan la misma instrucción actualizada
  Y no existe ningún archivo fuente secundario fuera de "src/" que contenga duplicados manuales de esa instrucción.

Escenario: Validación de independencia de plataforma en src/
  Dado el conjunto de archivos ubicados en "src/agents/" y "src/skills/"
  Cuando se inspecciona su contenido
  Entonces no contienen referencias fijas a APIs propietarias, nombres de herramientas específicos de un solo proveedor ni convenciones exclusivas de una sola plataforma sin parametrizar.
```

### Criterios para HU-2: Adaptadores modulares por plataforma
```gherkin
Escenario: Generación de artefacto adaptado para Antigravity
  Dado el adaptador de plataforma configurado en "platforms/antigravity/"
  Cuando se compila el target "antigravity"
  Entonces el manifiesto resultante en "dist/antigravity/" cumple con el esquema esperado por Antigravity ("plugin.json" en raíz)
  Y las herramientas agnósticas quedan traducidas a las herramientas correspondientes de Antigravity
  Y los hooks específicos de bitácora quedan incluidos en el paquete generado.

Escenario: Generación de artefacto adaptado para Claude Code
  Dado el adaptador de plataforma configurado en "platforms/claude-code/"
  Cuando se compila el target "claude-code"
  Entonces el manifiesto resultante en "dist/claude-code/" cumple con la estructura requerida por Claude Code (".claude-plugin/plugin.json")
  Y las herramientas y modelos conservan las equivalencias correspondientes para Claude Code.

Escenario: Presencia de adaptadores base para Cursor y Copilot
  Dado el directorio "platforms/"
  Cuando se auditan los targets disponibles
  Entonces existen los directorios "platforms/cursor/" y "platforms/copilot/" con sus archivos de definición y contratos de mapeo base
  Y el sistema no falla si se solicita una verificación de targets disponibles.
```

### Criterios para HU-3: Proceso unificado de compilación y empaquetado
```gherkin
Escenario: Compilación global de todas las plataformas
  Dado que el repositorio contiene las fuentes en "src/" y adaptadores en "platforms/"
  Cuando se ejecuta el comando de construcción global sin especificar target
  Entonces se generan artefactos completos e independientes en "dist/claude-code/" y "dist/antigravity/"
  Y el proceso finaliza con código de salida 0
  Y el tiempo total de compilación no excede los 5 segundos en un entorno local estándar.

Escenario: Compilación de un target individual
  Dado que se requiere generar únicamente el paquete de una plataforma
  Cuando se ejecuta el comando de construcción indicando el target "antigravity"
  Entonces únicamente se actualiza el contenido de "dist/antigravity/"
  Y los demás directorios en "dist/" no sufren alteraciones.

Escenario: Detección y manejo de errores de validación
  Dado un archivo fuente en "src/" que carece de metadatos obligatorios para un agente o habilidad
  Cuando se ejecuta el comando de compilación
  Entonces el proceso se detiene con código de error distinto de 0
  Y emite en consola un mensaje descriptivo indicando el archivo exacto y el campo faltante
  Y no se generan artefactos corruptos en "dist/".
```

### Criterios para HU-4: Instalación local automatizada
```gherkin
Escenario: Instalación automática para Antigravity
  Dado que se solicita la compilación con la opción de instalación para el target "antigravity"
  Cuando el proceso de compilación culmina exitosamente
  Entonces los artefactos generados se sincronizan en la ruta local de plugins del usuario para Antigravity
  Y los archivos instalados corresponden idénticamente a los generados en "dist/antigravity/".

Escenario: Instalación en entorno no disponible
  Dado que se solicita la opción de instalación para una plataforma cuya ruta destino local no existe o no tiene permisos de escritura
  Cuando se ejecuta el comando con opción de instalación
  Entonces el comando informa un mensaje claro de advertencia indicando la ruta inaccesible
  Y mantiene intactos los artefactos generados en "dist/".
```

### Criterios para HU-5: Base de extensibilidad para Cursor y Copilot
```gherkin
Escenario: Estructura de adaptadores lista para implementación futura
  Dado el repositorio reestructurado
  Cuando un desarrollador examina "platforms/cursor/" y "platforms/copilot/"
  Entonces encuentra plantillas de configuración de destino y documentación de mapeo de instrucciones
  Y la incorporación futura de la generación para estas plataformas no requiere modificar la estructura interna de "src/".
```

---

## 4. Prioridad MoSCoW

### Must (Obligatorio)
- **HU-1**: Reestructuración y migración de todos los agentes (7 roles actuales) y habilidades (4 skills actuales) a `src/agents/` y `src/skills/` como única fuente de verdad agnóstica.
- **HU-2**: Adaptador funcional completo para Claude Code en `platforms/claude-code/`.
- **HU-2**: Adaptador funcional completo para Antigravity en `platforms/antigravity/`.
- **HU-3**: Script o comando unificado de construcción (`build`) que genere las salidas en `dist/<plataforma>/` por target y de forma global.
- Paridad funcional al 100% con las funcionalidades existentes de `equipo-dev` v0.5.0.

### Should (Deseable)
- **HU-4**: Bandera o parámetro de instalación local automatizada (`--install`) para las plataformas soportadas activamente.
- **HU-5**: Estructura de directorios y especificación de adaptación base para GitHub Copilot y Cursor en `platforms/copilot/` y `platforms/cursor/`.
- Validación sintáctica y de integridad de variables en los artefactos empaquetados en `dist/` antes de concluir el build.

### Could (Podría incluirse si no compromete el tiempo)
- Modo de observación continua (`--watch`) para recompilar automáticamente ante cambios en `src/`.
- Resumen en consola con métricas del build (tamaño de artefactos generados, número de roles procesados, advertencias).

### Won't (Fuera de esta iteración)
- Implementación de extensiones binarias completas o publicación en VS Code Marketplace para Cursor o Copilot.
- Publicación automática en registros de distribución remota (npm, GitHub Packages).
- Soporte para plataformas adicionales fuera de las mencionadas (p. ej., Windsurf, Gemini Code Assist CLI independiente).

---

## 5. Fuera de Alcance
1. Modificación de la semántica de negocio o del comportamiento de los roles existentes (el flujo PO → UX → Arquitecto → Devs → QA → Reviewer permanece idéntico en su lógica).
2. Creación de nuevos roles de agentes o alteración sustancial de los prompts actuales.
3. Creación o publicación de paquetes en registros públicos (npm, VS Code Marketplace, etc.).
4. Ejecución nativa completa de agentes multi-subagente en GitHub Copilot o Cursor en esta etapa (únicamente se preparan la arquitectura y adaptadores base).

---

## 6. Métricas de Éxito
- **Paridad funcional del 100%**: Los 7 roles (`product-owner`, `ux-designer`, `architect`, `backend-dev`, `frontend-dev`, `qa-engineer`, `code-reviewer`) y las 4 skills (`equipo-panel`, `team-reset`, `feature`, `team-rules`) operan con idéntico comportamiento en Claude Code y Antigravity respecto a la versión previa.
- **Cero duplicación de definiciones de negocio**: 0 líneas de instrucciones o prompts duplicados manualmente entre plataformas en el directorio fuente (`src/`).
- **Tiempo de construcción menor a 5 segundos**: La compilación global de todos los targets finaliza en menos de 5 segundos en condiciones normales de desarrollo.
- **0 fallos de empaquetado**: 100% de los artefactos generados en `dist/` pasan las validaciones de estructura de manifiesto y resolución de variables sin errores.

---

## 7. Preguntas Abiertas
1. **Formato de la fuente agnóstica**: ¿Se mantendrá Markdown con Frontmatter YAML para las definiciones agnósticas en `src/`, o se prefiere separar los metadatos a archivos YAML/JSON dedicados junto a archivos de plantilla Markdown?
2. **Consumo de Claude Code**: ¿El entorno de desarrollo de Claude Code consumirá directamente la carpeta generada en `dist/claude-code/` (enlazada simbólicamente o copiada), o el repositorio mantendrá algún enlace en la raíz para desarrollo local inmediato?
3. **Mapeo para Cursor y Copilot**: ¿Cuál es el formato final esperado para Cursor y Copilot cuando se activen completamente (por ejemplo, directivas de sistema tipo `.cursorrules` / `.github/copilot-instructions.md`, o subagentes basados en APIs de extensiones)?
4. **Política de limpieza previa de dist**: ¿El comando de build debe limpiar (`clean/rimraf`) automáticamente el directorio `dist/` antes de cada ejecución completa, o conservar versiones previas no afectadas?

---

Spec lista para aprobación del dueño.

