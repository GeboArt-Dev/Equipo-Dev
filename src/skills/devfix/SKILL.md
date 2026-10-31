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

## ⚠️ PROTOCOLO DE DESPACHO OBLIGATORIO (SUBAGENT HANDOFF)
Si eres el agente principal/asistente raíz de la conversación y dispones de herramientas de subagentes (`invoke_subagent`):
1. **TIENES ESTRICTAMENTE PROHIBIDO** aplicar parches o modificar código directamente en el hilo principal.
2. **DEBES invocar de inmediato al subagente `backend-dev` o `frontend-dev`** según la naturaleza del error mediante `invoke_subagent`.
3. Cede el control de la remediación al desarrollador para que ejecute el RCA y los tests.

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
- Si es APROBADO: redacta el reporte en `<vault>/Proyectos/<proyecto>/Fixes/Fix - <slug>.md` y concluye el flujo.
