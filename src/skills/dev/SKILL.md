---
name: dev
description: "Ejecuta o retoma el flujo de ingeniería de software para una funcionalidad (PO → UX → arquitecto → dev → QA → reviewer) con pausas de aprobación del dueño. Úsalo cuando el usuario escriba /dev, pida desarrollar una funcionalidad nueva con el equipo o continuar una feature ya empezada."
---
# Flujo /dev — Ingeniería de Software Integral

Argumento: `[--no-pause | --auto-approve]` seguido de la descripción de la feature en lenguaje natural, o el nombre de una tarea ya empezada ("continuemos con Checkout").

## 🚀 DETECCIÓN DE PRIMER USO (/start)
Si `.tete360-init.json` no existe en la raíz del espacio de trabajo, el sistema lanza de manera transparente el inicializador `/start` para calibrar el entorno, bóveda y permisos antes de proseguir con la feature.

---

## 📋 Ficha de Despacho Estandarizada
Al arrancar, emite obligatoriamente en la cabecera:
```text
╔══════════════════════════════════════════════════════════════════════╗
║ ⚡ COMANDO: /dev [<descripción>]                                      ║
║ 🏢 EQUIPO: Equipo-Dev (Ingeniería de Software)                       ║
║ 👤 ROL LÍDER: product-owner                                          ║
║ 👥 SECUENCIA: PO ➔ UX ➔ Architect ➔ Dev ➔ QA ➔ Reviewer             ║
║ 📁 MEMORIA: Bóveda Obsidian (<vault>/Proyectos/<proyecto>/)          ║
║ ⏸️ GOBERNANZA: Requiere aprobación del Dueño en Spec y ADR           ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ PROTOCOLO DE DELEGACIÓN ADAPTATIVA Y EJECUCIÓN DUAL

Inspecciona en tiempo de ejecución las herramientas disponibles:
- **Modo Multi-Agente / Despacho Concurrente (Harness con soporte de subagentes)**:
  Si dispones de herramientas de subagentes (`invoke_subagent` en Antigravity o `Agent` en Claude Code):
  1. No implementes todo en el hilo raíz si tienes la herramienta de despacho.
  2. Invoca ordenadamente a los subagentes especialistas (`product-owner`, `ux-designer`, `architect`, `backend-dev` / `frontend-dev`, `qa-engineer`, `code-reviewer`).
- **Modo Secuencial In-Process (Extensiones IDE y Entornos Monohilo)**:
  Si te encuentras ejecutando dentro de una extensión de IDE (VS Code, Cursor, Windsurf, etc.) o el entorno no dispone de herramientas de subagentes:
  1. Conmuta automáticamente a ejecución secuencial asumiendo de forma directa y fluida los roles requeridos en este hilo.
  2. **PROHIBIDO emitir mensajes de bloqueo, disculpas o advertencias** (como *"No hay subagentes utilizables en esta sesión"* o *"trabajo en este hilo"*). Este es el comportamiento estándar y previsto para extensiones de IDE y entornos monohilo.
  3. Emite obligatoriamente los banners simétricos de trazabilidad para delimitar cada rol:
     - `🤖 [ROL ACTIVO: <nombre-rol>] ➔ <Acción concisa en ejecución>`
     - `🏁 [ROL COMPLETADO: <nombre-rol>] ➔ <Entregable persistido en memoria>`
  4. Aplica **Context-Folding**: Los artefactos íntegros se persisten en el vault de Obsidian (`<vault>`). En el chat solo se emite la síntesis ejecutiva estructurada (15 a 25 líneas).

---

## Modos de Ejecución
- **Modo Continuo / Autónomo**: Se activa si el comando contiene los modificadores `--no-pause` o `--auto-approve` (insensible a mayúsculas/minúsculas, en cualquier posición). Omite las pausas de aprobación de diseño humano de Spec (Pausa 1) y de Diseño UX + ADR (Pausa 2).
- **Modo Supervisado / Interactivo**: Es el comportamiento predeterminado si no se incluye ninguno de los flags anteriores. Requiere confirmación humana en el paso 1 (Spec) y en el paso 3 (UX + ADR).

Al arrancar, emite también:
- Modo continuo: `Modo: Continuo / Autónomo (aprobaciones de diseño desactivadas)`
- Modo supervisado: `Modo: Supervisado / Interactivo (aprobaciones estándar activadas)`

Antes de empezar, carga la skill `dev-rules` y aplícala.

0. **Retomar antes de empezar** (siempre, antes de lanzar ningún rol):
   - Al retomar (`/dev continuemos con...`), el flujo opera en **Modo Supervisado** por defecto, a menos que el usuario incluya explícitamente `--no-pause` o `--auto-approve`.
   - Busca archivos por nombre en `<vault>/Proyectos/<proyecto>/` (subcarpetas `Specs/`, `UX/`, `ADR/` y `QA/`). Revisa también los cambios pendientes con `git status`.
   - Si no hay nada: es una feature nueva, sigue en el paso 1.
   - Si hay archivos, determina el último paso completado y continúa desde allí con aprobación del dueño.

1. **Especificación**: ejecuta rol `product-owner` con la descripción neta.
   - Salida: `<vault>/Proyectos/<proyecto>/Specs/Spec - <feature>.md`.
   - **Modo Supervisado**: Muestra resumen y preguntas abiertas. **Detente y espera aprobación.**
   - **Modo Continuo**: Adopta supuestos técnicos razonables y avanza.

2. **Diseño UX** (solo si la feature tiene interfaz): ejecuta rol `ux-designer` con la spec aprobada.
   - Salida: `<vault>/Proyectos/<proyecto>/UX/UX - <feature>.md` + `design-system/<proyecto>/MASTER.md`.

3. **Diseño técnico**: ejecuta rol `architect` con la spec aprobada y UX.
   - Salida: `<vault>/Proyectos/<proyecto>/ADR/ADR <NNN> - <feature>.md`.
   - **Modo Supervisado**: **Detente y espera aprobación** (cubre UX + ADR).
   - **Modo Continuo**: Omite la pausa y avanza a implementación.

4. **Implementación**: ejecuta roles `backend-dev` y/o `frontend-dev` con las tareas del ADR y el diseño UX.
   - Escriben el código de producción y sus tests unitarios.

5. **Validación QA**: ejecuta rol `qa-engineer` con la spec, el ADR y los cambios implementados.
   - Valida 100% tests pasando y cobertura. Salida: `<vault>/Proyectos/<proyecto>/QA/QA - <feature>.md`.

6. **Revisión de código**: ejecuta rol `code-reviewer` para auditar calidad, seguridad y cumplimiento del ADR.
