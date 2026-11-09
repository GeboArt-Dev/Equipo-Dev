---
name: devfix
description: "Ejecuta el flujo técnico directo de remediación rápida de Equipo-Dev (Dev -> QA -> Reviewer) para resolver excepciones, bugs y regresiones con RCA, parche mínimo y test de regresión obligatorio. Úsalo cuando el usuario escriba /devfix o reporte un fallo de ejecución."
---
# Flujo /devfix — Remediación Técnica Directa

Argumento obligatorio: `<descripción del error, traza de excepción o archivo afectado>`.

Si el argumento no se proporciona o está vacío:
```text
Uso: /devfix <descripción del error, traza o archivo afectado>
```
Detén la ejecución inmediatamente sin convocar subagentes.

## 📋 Ficha de Despacho Estandarizada
Al arrancar, emite en la cabecera:
```text
╔══════════════════════════════════════════════════════════════════════╗
║ ⚡ COMANDO: /devfix [<error o traza>]                                 ║
║ 🏢 EQUIPO: Equipo-Dev (Ingeniería de Software)                       ║
║ 👤 ROL LÍDER: backend-dev / frontend-dev                             ║
║ 👥 SECUENCIA: Dev ➔ QA Engineer ➔ Code Reviewer                     ║
║ 📁 MEMORIA: Bóveda Obsidian (Fixes/Fix - <slug>.md)                  ║
║ ⏸️ GOBERNANZA: Remediación Directa (Sin pausas de diseño)           ║
╚══════════════════════════════════════════════════════════════════════╝
```

## ⚡ PROTOCOLO DE DELEGACIÓN ADAPTATIVA Y EJECUCIÓN DUAL

Inspecciona en tiempo de ejecución las herramientas disponibles:
- **Modo Multi-Agente / Despacho Concurrente (Harness con soporte de subagentes)**:
  Si dispones de herramientas de subagentes (`invoke_subagent` en Antigravity o `Agent` en Claude Code):
  1. No apliques parches directamente en el hilo principal si dispones de la herramienta de despacho.
  2. Invoca de inmediato al subagente `backend-dev` o `frontend-dev` según la naturaleza del error.
  3. Cede el control de la remediación al desarrollador para que ejecute el RCA y los tests.
- **Modo Secuencial In-Process (Extensiones IDE y Entornos Monohilo)**:
  Si te encuentras ejecutando dentro de una extensión de IDE (VS Code, Cursor, Windsurf, etc.) o el entorno no dispone de herramientas de subagentes:
  1. Conmuta automáticamente a ejecución secuencial asumiendo de forma directa y fluida los roles requeridos en este hilo.
  2. **PROHIBIDO emitir mensajes de bloqueo, disculpas o advertencias** (como *"No hay subagentes utilizables en esta sesión"* o *"trabajo en este hilo"*). Este es el comportamiento estándar y previsto para extensiones de IDE y entornos monohilo.
  3. Emite obligatoriamente los banners simétricos de trazabilidad para delimitar cada rol:
     - `🤖 [ROL ACTIVO: <nombre-rol>] ➔ <Acción concisa en ejecución>`
     - `🏁 [ROL COMPLETADO: <nombre-rol>] ➔ <Entregable persistido en memoria>`
  4. Aplica **Context-Folding**: persiste el reporte íntegro en la memoria Obsidian (`<vault>`) y emite en el chat una síntesis ejecutiva estructurada (15 a 25 líneas).

## Circuito Técnico Directo (Dev -> QA -> Code Reviewer)
Este flujo omite estrictamente las etapas de Product Owner, UX Designer y Arquitecto, suprimiendo pausas de diseño y no generando archivos en `Specs/`, `UX/` ni `ADR/`.

Antes de empezar, carga la skill `dev-rules` y aplícala.

### 1. Asignación y Diagnóstico (Desarrollador)
- **Despacho inicial**:
  - Si la descripción o traza involucra archivos de interfaz/cliente (`src/components/`, `src/ui/`, `frontend/`, `.tsx`, `.jsx`, `.css`, `.vue`, `.svelte`), convoca a `frontend-dev`.
  - En los demás casos (backend, Node.js, scripts, APIs, bases de datos o trazas genéricas de excepción), convoca a `backend-dev`.
- **Acciones obligatorias del desarrollador**:
  1. **Análisis de Causa Raíz (RCA)**: Formular una explicación concisa del mecanismo de falla en un máximo de 5 líneas.
  2. **Test automatizado de regresión obligatorio**: Escribir una prueba automatizada que reproduzca el defecto (fallando con el código previo y pasando con el parche).
  3. **Parche mínimo indispensable**: Aplicar la corrección quirúrgica estrictamente necesaria sin modificar contratos mayores ni rediseñar pantallas.
  - *Regla de desvío funcional*: Si la corrección requiere nuevas interfaces visuales, redefinir esquemas arquitectónicos o crear endpoints no existentes, detén el flujo y sugiere usar `/dev`.

### 2. Validación de No-Regresión (QA Engineer)
- Convoca a `qa-engineer` pasando el RCA, los archivos modificados y el test de regresión.
- `qa-engineer` ejecuta la suite de pruebas completa del proyecto.
- Si el veredicto es RECHAZADO: devuelve los fallos a Dev para ajuste (máximo 3 reintentos antes de escalar al dueño).
- Si el veredicto es APROBADO: avanza al paso 3.

### 3. Auditoría de Código y Seguridad (Code Reviewer)
- Convoca a `code-reviewer` para auditar el parche contra vulnerabilidades OWASP y estándares del proyecto.
- Si hay bloqueos: devuelve a Dev (máximo 3 vueltas).
- Si es APROBADO: redacta el reporte en `<vault>/GeboArt.Dev/Proyectos/<proyecto>/Fixes/Fix - <slug>.md` y concluye el flujo.
