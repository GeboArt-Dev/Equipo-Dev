# equipo-dev

Equipo de desarrollo de software con subagentes. El dueño (tú) aprueba la spec y el diseño; Claude orquesta y delega en cada rol.

## Contenido

| Componente | Nombre | Función |
|---|---|---|
| Agente | `product-owner` | Idea → historias, criterios de aceptación (Gherkin), prioridad |
| Agente | `ux-designer` | Spec → flujos, pantallas, estados y design system con `ui-ux-pro-max` |
| Agente | `architect` | Spec + UX → ADR con contratos, seguridad y plan de tareas |
| Agente | `backend-dev` | ADR → código backend + tests |
| Agente | `frontend-dev` | ADR + UX → código de interfaz + tests |
| Agente | `qa-engineer` | Valida contra los criterios; informe APROBADO/RECHAZADO |
| Agente | `code-reviewer` | Revisión final de seguridad y calidad (solo lectura) |
| Skill | `/feature` | Ejecuta el flujo completo con pausas de aprobación |
| Skill | `reglas-equipo` | Flujo, Definition of Done y reglas de seguridad |
| Skill | `/equipo-dev:equipo-panel` | Abre el panel en vivo del equipo |
| Skill | `/equipo-dev:equipo-reiniciar` | Vacía el panel para empezar una feature nueva |

## Uso

```
/feature reservas de citas online
```

O un rol suelto:

```
Usa el subagente code-reviewer sobre los cambios actuales
```

## Diseñador UI/UX

`ux-designer` se ejecuta tras aprobar la spec y antes del arquitecto, solo si la feature tiene interfaz. Usa el buscador de `ui-ux-pro-max` (`--design-system --persist`, `--domain`, `--stack`) y entrega:

- `docs/ux/<feature>.md`: flujos, pantallas, estados, accesibilidad, responsive y necesidades de datos.
- `design-system/<proyecto>/MASTER.md` (+ `pages/<pantalla>.md`): solo si no existía; nunca usa `--force` sin tu permiso.

La segunda aprobación cubre UX + ADR. Frontend, QA y reviewer validan contra ese diseño.

**Requisito**: plugin `ui-ux-pro-max` instalado y Python 3 disponible.

## Panel en vivo

Se abre solo cuando el primer rol del equipo empieza a trabajar (o con `/equipo-dev:equipo-panel`). Muestra:

- Cada rol con su estado: ○ pendiente, ◌ hecho antes de esta sesión, ● trabajando, ✔ terminado, ✖ error, más la duración y las vueltas (por ejemplo, QA repetido).
- Las dos aprobaciones del dueño (spec y diseño), marcadas con ⏸ cuando el equipo te espera; además aparece un aviso.
- Una bitácora con los últimos movimientos.

Si la pantalla no admite paneles laterales, `/equipo-dev:equipo-panel` muestra el mismo estado como texto en el chat. En la barra de estado aparece el rol que está trabajando.

Escribe cada comando en su propio mensaje: solo la barra del inicio cuenta como comando (`/feature ... /equipo-dev:equipo-panel` en una línea no abre el panel).

El panel solo observa: si falla, los agentes siguen trabajando igual. Una nueva feature empieza limpia cuando el PO arranca después de la revisión final, o con `/equipo-dev:equipo-reiniciar`.

## Retomar una feature

```
/feature continuemos con CheckIn
```

Antes de lanzar a nadie, `/feature` busca los archivos de esa feature en `docs/specs/`, `docs/ux/`, `docs/adr/` y `docs/qa/`, revisa los cambios pendientes y te propone desde qué paso seguir. Espera tu confirmación y nunca rehace un paso que ya tiene archivo salvo que lo pidas. En el panel, los pasos hechos en sesiones anteriores aparecen con ◌.

## Requisito por proyecto

Cada proyecto necesita un `CLAUDE.md` en su raíz con stack, comandos (instalar, ejecutar, tests, lint, build) y restricciones. Genera un borrador con `/init` y complétalo.

Las salidas del equipo se guardan en `docs/specs/`, `docs/ux/`, `docs/adr/`, `docs/qa/` y `design-system/` del proyecto.

## Modelos y permisos

- `opus` en PO, UX, arquitecto y reviewer; `sonnet` en devs y QA.
- El reviewer no puede editar archivos; el PO no puede ejecutar comandos; el UX solo ejecuta `search.py`.

## Versiones

- 0.4.1: `/equipo-panel` y `/equipo-reiniciar` pasan a ser skills, así aparecen en el menú de la app; si el panel no está activo, la skill arma el estado leyendo `docs/`.
- 0.4.0: `/feature` retoma features empezadas desde el último paso completado; el panel marca con ◌ los pasos de sesiones anteriores; `/equipo-panel` responde siempre (texto si no hay panel) y línea de estado con el rol activo.
- 0.3.0: rol `ux-designer` con `ui-ux-pro-max`; panel con 7 roles.
- 0.2.0: panel en vivo del equipo, comandos `/equipo-panel` y `/equipo-reiniciar`.
- 0.1.0: versión inicial.
