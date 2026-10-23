---
name: fix
description: Ejecuta el flujo técnico directo de remediación rápida (Dev -> QA -> Reviewer) para resolver excepciones, bugs y regresiones con RCA, parche mínimo y test de regresión obligatorio. Úsalo cuando el usuario escriba /fix o reporte un fallo de ejecución.
---
# Flujo /fix

Argumento obligatorio: `<descripción del error, traza de excepción o archivo afectado>`.

Si el argumento no se proporciona o está vacío (o solo espacios en blanco):
```text
Uso: /fix <descripción del error, traza o archivo afectado>
```
Detén la ejecución inmediatamente sin convocar subagentes.

## Circuito Técnico Directo (Dev -> QA -> Code Reviewer)
Este flujo omite estrictamente las etapas de Product Owner, UX Designer y Arquitecto, suprimiendo pausas de diseño y no generando archivos en `docs/specs/`, `docs/ux/` ni `docs/adr/`.

Al arrancar, emite en la cabecera:
```text
Tipo: FIX
Modo: Remediación directa (Dev -> QA -> Reviewer)
```

Antes de empezar, carga la skill `team-rules` y aplícala. {{SUBAGENT_DISPATCH_GUIDE}}

### 1. Asignación y Diagnóstico (Desarrollador)
- **Despacho inicial**:
  - Si la descripción o traza involucra archivos de interfaz/cliente (`src/components/`, `src/ui/`, `frontend/`, `.tsx`, `.jsx`, `.css`, `.vue`, `.svelte`), convoca a `frontend-dev`.
  - En los demás casos (backend, Node.js, scripts, APIs, bases de datos o trazas genéricas de excepción), convoca a `backend-dev`.
  - El desarrollador puede colaborar o transferir tareas si durante el RCA se identifica que la causa raíz pertenece a la otra capa.
- **Acciones obligatorias del desarrollador**:
  1. **Análisis de Causa Raíz (RCA)**: Formular una explicación concisa del mecanismo de falla en un máximo de 5 líneas.
  2. **Test automatizado de regresión obligatorio**: Escribir una prueba automatizada que reproduzca el defecto (fallando con el código previo y pasando con el parche).
  3. **Parche mínimo indispensable**: Aplicar la corrección quirúrgica estrictamente necesaria sin modificar contratos mayores ni rediseñar pantallas.
  - *Regla de desvío funcional*: Si la corrección requiere nuevas interfaces visuales, redefinir esquemas arquitectónicos o crear endpoints no existentes, detén el flujo y sugiere usar `/feature`.

### 2. Validación de No-Regresión (QA Engineer)
- Convoca a `qa-engineer` pasando el RCA, los archivos modificados y el test de regresión.
- `qa-engineer` ejecuta la suite de pruebas completa del proyecto.
- Si el veredicto es RECHAZADO (falla la suite o hay efectos colaterales):
  - Devuelve los fallos reportados a Dev para ajuste.
  - Límite de 3 reintentos: si al 3er intento no se obtiene aprobación, detén el flujo y escala de inmediato al dueño con el informe consolidado.
- Si el veredicto es APROBADO: avanza al paso 3.

### 3. Auditoría de Calidad y Seguridad (Code Reviewer)
- Convoca a `code-reviewer` para auditar el diff de cambios.
- Verifica cumplimiento de estándares OWASP, ausencia de secretos y sanidad del código.
- Si hay hallazgos Bloqueantes:
  - Devuelve los hallazgos a Dev para subsanar (máximo 3 vueltas antes de escalar al dueño).
- Si no hay hallazgos bloqueantes: avanza a Cierre y Registro.

### 4. Cierre y Registro Sintético
- Toda la documentación del proyecto vive en `<vault>`, nunca en `docs/` del repo. Genera el reporte ligero en `<vault>/Proyectos/<proyecto>/Fixes/Fix - <slug>.md` (sustituye al histórico `docs/fixes/<slug>.md`), derivando `<slug>` del título o descripción en kebab-case limpio (máximo 40 caracteres, solo caracteres alfanuméricos y guiones `[a-z0-9-]`).
- Cada nota lleva frontmatter `tags: [<proyecto>, fix]`, título `# Fix: <Título Sintético del Defecto>`, enlace `[[<proyecto>]]` y se añade al índice del proyecto.
- Actualiza el `README.md` del proyecto con el cambio y bump de versión SemVer (parche para `/fix`) en `package.json`. Al terminar ejecuta `graph_refresh`. Si Obsidian no responde, se avisa al dueño y no se escribe documentación en el repo.
- Plantilla estricta del documento:
```markdown
# Fix: <Título Sintético del Defecto>

- **Fecha**: YYYY-MM-DD
- **Tipo**: Remediación Rápida (Bugfix)
- **Estado**: Resuelto y Verificado

## 1. Diagnóstico y Causa Raíz (RCA)
<Explicación técnica concisa del mecanismo de falla en un máximo de 5 líneas>.

## 2. Parche Aplicado
- **Archivos modificados**:
  - `ruta/al/archivo.ext`: <resumen de la corrección mínima>

## 3. Test de Regresión Obligatorio
- **Archivo de prueba**: `tests/<archivo-de-test>.test.ext`
- **Comprobación**: <descripción de la prueba automatizada que reproduce la falla y valida su corrección>

## 4. Verificación de No-Regresión
- **Suite ejecutada**: <comando de prueba ejecutado>
- **Resultado**: APROBADO (0 fallos, suite íntegra en verde)
- **Revisión de Seguridad**: Sin hallazgos Bloqueantes en Code Review
```
- Entrega al usuario un resumen de 5 líneas con: causa raíz, archivos modificados, test de regresión añadido, resultado de QA y dictamen de Code Reviewer.

## Salvaguardas Críticas Inviolables
- **Cero commits y cero push autónomos**: Queda estrictamente prohibido ejecutar `git commit` o `git push` sin autorización explícita del dueño tras presentarle los cambios y el resumen.
- **Cero comandos destructivos**: No ejecutes comandos como `rm -rf`, borrado masivo de directorios o sentencias SQL destructivas (`DROP TABLE`, `TRUNCATE`) sin confirmación previa del dueño.
- **Gestión de secretos**: Prohibido incluir credenciales, tokens o datos confidenciales expuestos en trazas de error dentro del código, los tests o `docs/fixes/`.
- **Límite de 3 reintentos**: Ante 3 rechazos consecutivos de QA o Reviewer, detén el flujo y escala inmediatamente al dueño.

## Memoria de largo plazo (opcional)

Antes de convocar a `code-reviewer`, indícale que consulte la memoria del equipo (ver `team-rules`). Al **cerrar el fix**, el orquestador registra en el vault una nota en `Aprendizajes/` con la causa raíz y el patrón del defecto (enlazada con wikilinks al proyecto) y llama a `graph_refresh`. Nunca incluyas secretos ni trazas con datos sensibles. Si la memoria no está instalada o no responde, omite este paso sin bloquear el flujo.
