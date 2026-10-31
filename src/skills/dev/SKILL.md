---
name: dev
description: "Ejecuta o retoma el flujo de ingeniería de software para una funcionalidad (PO → UX → arquitecto → dev → QA → reviewer) con pausas de aprobación del dueño. Úsalo cuando el usuario escriba /dev, pida desarrollar una funcionalidad nueva con el equipo o continuar una feature ya empezada."
---
# Flujo /dev — Ingeniería de Software Integral

Argumento: `[--no-pause | --auto-approve]` seguido de la descripción de la feature en lenguaje natural, o el nombre de una tarea ya empezada ("continuemos con Checkout").

## 📋 Ficha de Despacho Estandarizada
Al arrancar, emite obligatoriamente en la cabecera:
```text
╔══════════════════════════════════════════════════════════════════════╗
║ ⚡ COMANDO: /dev [<descripción>]                                      ║
║ 🏢 EQUIPO: Equipo-Dev (Ingeniería de Software)                       ║
║ 👤 ROL LÍDER: product-owner                                          ║
║ 👥 SECUENCIA: PO ➔ UX ➔ Architect ➔ Dev ➔ QA ➔ Reviewer             ║
║ 📁 MEMORIA: Bóveda Obsidian (D:\EquipoDev-Memoria\Proyectos\<proj>\) ║
║ ⏸️ GOBERNANZA: Requiere aprobación del Dueño en Spec y ADR           ║
╚══════════════════════════════════════════════════════════════════════╝
```

## ⚠️ PROTOCOLO DE DESPACHO OBLIGATORIO (SUBAGENT HANDOFF)
Si eres el agente principal/asistente raíz de la conversación y dispones de herramientas de subagentes (`invoke_subagent`):
1. **TIENES ESTRICTAMENTE PROHIBIDO** implementar código, crear specs o saltarte las etapas directamente en el hilo principal.
2. **DEBES invocar inmediatamente al subagente correspondiente** mediante `invoke_subagent` (comenzando por `product-owner` para nuevas features).
3. Cede el control del paso a cada subagente especialista.

## Modos de Ejecución
- **Modo Continuo / Autónomo**: Se activa si el comando contiene los modificadores `--no-pause` o `--auto-approve` (insensible a mayúsculas/minúsculas, en cualquier posición). Omite las pausas de aprobación de diseño humano de Spec (Pausa 1) y de Diseño UX + ADR (Pausa 2).
- **Modo Supervisado / Interactivo**: Es el comportamiento predeterminado si no se incluye ninguno de los flags anteriores. Requiere confirmación humana en el paso 1 (Spec) y en el paso 3 (UX + ADR).

Al arrancar, emite también:
- Modo continuo: `Modo: Continuo / Autónomo (aprobaciones de diseño desactivadas)`
- Modo supervisado: `Modo: Supervisado / Interactivo (aprobaciones estándar activadas)`

Antes de empezar, carga la skill `dev-rules` y aplícala.

0. **Retomar antes de empezar** (siempre, antes de lanzar ningún subagente):
   - Al retomar (`/dev continuemos con...`), el flujo opera en **Modo Supervisado** por defecto, a menos que el usuario incluya explícitamente `--no-pause` o `--auto-approve`.
   - Busca archivos por nombre en `<vault>/Proyectos/<proyecto>/` (subcarpetas `Specs/`, `UX/`, `ADR/` y `QA/`). Revisa también los cambios pendientes con `git status`.
   - Si no hay nada: es una feature nueva, sigue en el paso 1.
   - Si hay archivos, determina el último paso completado y continúa desde allí con aprobación del dueño.

1. **Especificación**: lanza `product-owner` con la descripción neta.
   - Salida: `<vault>/Proyectos/<proyecto>/Specs/Spec - <feature>.md`.
   - **Modo Supervisado**: Muestra resumen y preguntas abiertas. **Detente y espera aprobación.**
   - **Modo Continuo**: Adopta supuestos técnicos razonables y avanza.

2. **Diseño UX** (solo si la feature tiene interfaz): lanza `ux-designer` con la spec aprobada.
   - Salida: `<vault>/Proyectos/<proyecto>/UX/UX - <feature>.md` + `design-system/<proyecto>/MASTER.md`.

3. **Diseño técnico**: lanza `architect` con la spec aprobada y UX.
   - Salida: `<vault>/Proyectos/<proyecto>/ADR/ADR <NNN> - <feature>.md`.
   - **Modo Supervisado**: **Detente y espera aprobación** (cubre UX + ADR).
   - **Modo Continuo**: Omite la pausa y avanza a implementación.

4. **Implementación**: lanza `backend-dev` y/o `frontend-dev` con las tareas del ADR y el diseño UX.
   - Escriben el código de producción y sus tests unitarios.

5. **Validación QA**: lanza `qa-engineer` con la spec, el ADR y los cambios implementados.
   - Salida: `<vault>/Proyectos/<proyecto>/QA/QA - <feature>.md`.
   - Si RECHAZADO: vuelve al paso 4 con los fallos reportados (máximo 3 vueltas).
   - Si APROBADO: avanza al paso 6.

6. **Revisión de Código**: lanza `code-reviewer` para auditar calidad, seguridad y cumplimiento del ADR.
   - Salida: veredicto en chat.
   - Si CAMBIOS REQUERIDOS: vuelve al paso 4 (máximo 3 vueltas).
   - Si APROBADO: muestra el veredicto final, actualiza la nota índice del proyecto en Obsidian y concluye el flujo.
