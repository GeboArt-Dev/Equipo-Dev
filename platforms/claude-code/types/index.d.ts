export type RoleId =
  | 'product-owner'
  | 'ux-designer'
  | 'architect'
  | 'backend-dev'
  | 'frontend-dev'
  | 'qa-engineer'
  | 'code-reviewer'

// 'previo': hecho en una sesión anterior (el flujo se retomó a mitad de camino).
export type RoleStatus = 'pendiente' | 'previo' | 'trabajando' | 'terminado' | 'error'

export type RoleState = {
  status: RoleStatus
  runs: number
  task?: string
  startedAt?: number
  endedAt?: number
}

export type LogEntry = { at: number; text: string }

export type FlowKind = 'feature' | 'fix'

export type FlowMode = 'supervised' | 'continuous'

export type Flow = {
  feature?: string
  kind?: FlowKind
  mode?: FlowMode
  roles: Record<RoleId, RoleState>
  awaiting?: 'spec' | 'adr'
  log: LogEntry[]
}

declare module 'claude-code' {
  interface PluginState {
    'equipo-dev': { flow: Flow }
  }
}
