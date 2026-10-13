import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Flow, RoleId, RoleState } from '../types'

// Panel en vivo del equipo equipo-dev: sigue cada llamada a un subagente del equipo.
const PANE = 'equipo-panel'
const TITLE = 'Equipo de desarrollo'
const MAX_LOG = 30
const PANEL_CMDS = ['equipo-dev:equipo-panel', 'equipo-panel']
const RESET_CMDS = ['equipo-dev:equipo-reiniciar', 'equipo-reiniciar']

const ROLES: { id: RoleId; label: string }[] = [
  { id: 'product-owner', label: 'Product Owner' },
  { id: 'ux-designer', label: 'Diseño UX' },
  { id: 'architect', label: 'Arquitecto' },
  { id: 'backend-dev', label: 'Backend' },
  { id: 'frontend-dev', label: 'Frontend' },
  { id: 'qa-engineer', label: 'QA' },
  { id: 'code-reviewer', label: 'Code Reviewer' },
]
// Etapa de cada rol: backend y frontend comparten etapa.
const STAGE: Record<RoleId, number> = {
  'product-owner': 0, 'ux-designer': 1, architect: 2, 'backend-dev': 3, 'frontend-dev': 3, 'qa-engineer': 4, 'code-reviewer': 5,
}
const ICON = { pendiente: '○', previo: '◌', trabajando: '●', terminado: '✔', error: '✖' } as const
const LABEL = Object.fromEntries(ROLES.map(r => [r.id, r.label])) as Record<RoleId, string>

const idle = (): RoleState => ({ status: 'pendiente', runs: 0 })
const emptyFlow = (): Flow => ({
  roles: {
    'product-owner': idle(),
    'ux-designer': idle(),
    architect: idle(),
    'backend-dev': idle(),
    'frontend-dev': idle(),
    'qa-engineer': idle(),
    'code-reviewer': idle(),
  },
  log: [],
})

const flow = atom({ plugin: 'equipo-dev', key: 'flow' } as const, emptyFlow())

// "equipo-dev:architect" o "architect" → "architect"; null si no es del equipo.
export function toRole(subagentType: string | undefined): RoleId | null {
  const name = (subagentType ?? '').split(':').pop() ?? ''
  return ROLES.some(r => r.id === name) ? (name as RoleId) : null
}

export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

function addLog(f: Flow, at: number, text: string): LogEntry[] {
  return [...f.log, { at, text }].slice(-MAX_LOG)
}
type LogEntry = Flow['log'][number]

// Un flujo nuevo empieza cuando el PO arranca y no hay feature o la anterior ya pasó revisión.
export function startsNewFlow(f: Flow, role: RoleId): boolean {
  return role === 'product-owner' && (!f.feature || f.roles['code-reviewer'].status === 'terminado')
}

// Al retomar a mitad de camino, las etapas anteriores se marcan como hechas antes.
export function markPrevious(f: Flow, role: RoleId): Flow {
  const roles = { ...f.roles }
  for (const r of ROLES) {
    if (STAGE[r.id] < STAGE[role] && roles[r.id].status === 'pendiente') roles[r.id] = { ...roles[r.id], status: 'previo' }
  }
  return { ...f, roles }
}

// Resumen del flujo en texto: se usa cuando la pantalla no admite paneles.
export function summary(f: Flow): string {
  const lines = [f.feature ? `Feature: ${f.feature}` : 'Sin feature activa']
  if (f.awaiting) lines.push(f.awaiting === 'spec' ? '⏸ Esperando tu aprobación de la spec' : '⏸ Esperando tu aprobación del diseño (UX + ADR)')
  ROLES.forEach((r, i) => {
    const st = f.roles[r.id]
    const laps = st.runs > 1 ? ` (${st.runs} vueltas)` : ''
    const label = st.status === 'previo' ? 'hecho antes de esta sesión' : st.status
    lines.push(`${ICON[st.status]} ${i + 1}. ${r.label}: ${label}${laps}`)
  })
  return lines.join('\n')
}

// Línea corta para la barra de estado.
export function statusLine(f: Flow): string | undefined {
  const busy = ROLES.filter(r => f.roles[r.id].status === 'trabajando').map(r => r.label)
  if (busy.length) return `Equipo: ${busy.join(' + ')} trabajando`
  if (f.awaiting) return f.awaiting === 'spec' ? 'Equipo: esperando tu aprobación de la spec' : 'Equipo: esperando tu aprobación del diseño'
  return undefined
}

export const register: Register = on => {
  // Los comandos son skills del plugin (aparecen en el menú de cualquier pantalla);
  // el hook los responde. Si el hook no está activo, la skill responde sola.
  on('command.run', { command: PANEL_CMDS }, async $ => {
    const f = await read($, flow)
    const opened = await $.ui.open({ id: PANE, title: TITLE }).catch(() => ({ isPlaced: false as const }))
    if (opened.isPlaced) return { text: 'Panel del equipo abierto.' }
    return { text: `Esta pantalla no muestra paneles laterales. Estado del equipo:\n\n${summary(f)}` }
  }).catch(($, e, next) => next(e))

  on('command.run', { command: RESET_CMDS }, async $ => {
    await update($, flow, () => emptyFlow())
    $.ui.status(undefined)
    return { text: 'Panel del equipo reiniciado.' }
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (e.tool !== 'Agent') return next(e)
    const role = toRole(e.subagent_type)
    if (!role) return next(e)

    let opened = false
    try {
    const startedAt = await $.clock.now()
    await update($, flow, f => {
      const fresh = startsNewFlow(f, role) ? { ...emptyFlow(), feature: e.description } : f
      const resumed = !fresh.feature && role !== 'product-owner'
      const base = resumed ? markPrevious(fresh, role) : fresh
      opened = base !== f || !f.feature
      const prev = base.roles[role]
      return {
        ...base,
        feature: base.feature ?? e.description,
        awaiting: undefined,
        roles: { ...base.roles, [role]: { status: 'trabajando', runs: prev.runs + 1, task: e.description, startedAt } },
        log: addLog(
          resumed ? { ...base, log: addLog(base, startedAt, `Se retoma el flujo en ${LABEL[role]}`) } : base,
          startedAt,
          `${LABEL[role]} empieza: ${e.description}`,
        ),
      }
    })
    } catch {
      // El panel es solo informativo: si falla, el agente sigue igual.
    }
    if (opened) $.ui.open({ id: PANE, title: TITLE }).catch(() => {})
    try { $.ui.status(statusLine(await read($, flow))) } catch {}

    const ran = await next(e)

    try {
    const endedAt = await $.clock.now()
    const failed = 'deny' in ran && ran.deny ? true : Boolean((ran as { isError?: boolean }).isError)
    const awaiting = failed ? undefined : role === 'product-owner' ? 'spec' : role === 'architect' ? 'adr' : undefined
    await update($, flow, f => {
      const prev = f.roles[role]
      const took = duration(endedAt - (prev.startedAt ?? endedAt))
      return {
        ...f,
        awaiting: awaiting ?? f.awaiting,
        roles: { ...f.roles, [role]: { ...prev, status: failed ? 'error' : 'terminado', endedAt } },
        log: addLog(f, endedAt, `${LABEL[role]} ${failed ? 'falló' : 'terminó'} (${took})`),
      }
    })
    try { $.ui.status(statusLine(await read($, flow))) } catch {}
    if (awaiting) {
      $.ui.toast(awaiting === 'spec' ? 'Spec lista: el equipo espera tu aprobación.' : 'Diseño (UX + ADR) listo: el equipo espera tu aprobación.')
    }
    } catch {
      // Igual que arriba: nunca alterar el resultado del agente.
    }
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const f = await read($, flow)
    const after = (ids: RoleId[]) => ids.some(id => f.roles[id].status !== 'pendiente')

    const roleRow = (n: number, id: RoleId) => {
      const r = f.roles[id]
      const icon = ICON[r.status]
      const color = { pendiente: 'inactive', previo: 'subtle', trabajando: 'warning', terminado: 'success', error: 'error' }[r.status]
      const time =
        r.status === 'trabajando' ? ' · en curso'
        : r.status === 'previo' ? ' · antes de esta sesión'
        : r.endedAt && r.startedAt ? ` · ${duration(r.endedAt - r.startedAt)}` : ''
      const laps = r.runs > 1 ? ` · ${r.runs} vueltas` : ''
      return (
        <Box flexDirection="column">
          <Text color={color} bold={r.status === 'trabajando'}>
            {icon} {n}. {LABEL[id]}{time}{laps}
          </Text>
          {r.status === 'trabajando' && r.task && <Text dimColor wrap="truncate-end">   {r.task}</Text>}
        </Box>
      )
    }

    const gate = (kind: 'spec' | 'adr', done: boolean) => {
      const what = kind === 'spec' ? 'Aprobación de la spec' : 'Aprobación del diseño'
      if (done) return <Text color="success">   ✔ {what}</Text>
      if (f.awaiting === kind) return <Text color="permission" bold>   ⏸ {what}: te toca a ti</Text>
      return <Text color="inactive">   ○ {what}</Text>
    }

    return (
      <Box flexDirection="column">
        <Text bold wrap="truncate-end">{f.feature ? `Feature: ${f.feature}` : 'Sin feature activa'}</Text>
        {f.awaiting && (
          <Text color="permission" bold>
            {f.awaiting === 'spec' ? 'Revisa docs/specs y aprueba para seguir.' : 'Revisa docs/ux y docs/adr y aprueba para seguir.'}
          </Text>
        )}
        <Text> </Text>
        {roleRow(1, 'product-owner')}
        {gate('spec', after(['ux-designer', 'architect', 'backend-dev', 'frontend-dev', 'qa-engineer', 'code-reviewer']))}
        {roleRow(2, 'ux-designer')}
        {roleRow(3, 'architect')}
        {gate('adr', after(['backend-dev', 'frontend-dev', 'qa-engineer', 'code-reviewer']))}
        {roleRow(4, 'backend-dev')}
        {roleRow(5, 'frontend-dev')}
        {roleRow(6, 'qa-engineer')}
        {roleRow(7, 'code-reviewer')}
        <Text> </Text>
        <Text bold>Bitácora</Text>
        {f.log.length === 0 && <Text dimColor>Aún no ha trabajado ningún rol. Usa /feature para empezar.</Text>}
        {f.log.slice(-8).reverse().map(l => <Text dimColor wrap="truncate-end">· {l.text}</Text>)}
      </Box>
    )
  })
}
