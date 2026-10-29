import { test, expect, mock } from 'claude-code/testing'

// Simula el flujo del equipo y comprueba lo que dibuja el panel en cada superficie.
const PANE = { title: 'Equipo de desarrollo', isFocused: false, bodyColumns: 60 }
const SURFACES = ['terminal', 'desktop'] as const

type Run = { type: string; desc: string; fails?: boolean }

async function agentes($: any, on: any, runs: Run[]) {
  // Debajo del plugin: reloj en memoria y respuesta a cada llamada al agente como lo haría el motor.
  mock.clock(on, { now: 1_000_000 })
  let next = 0
  on('tool.call', async () => {
    const r = runs[next++]
    return r?.fails ? { result: 'falló', isError: true } : { result: 'listo' }
  })
  for (const r of runs) {
    await $.tool.call({ tool: 'Agent', description: r.desc, prompt: r.desc, subagent_type: r.type })
  }
}

async function panel($: any, surface: (typeof SURFACES)[number]) {
  return $.ui.mount({ plugin: 'equipo-dev', surface, component: 'Pane', requestId: 'dev-report', props: PANE })
}

test('tras el PO, el panel pide aprobar la spec', async ($, on) => {
  await agentes($, on, [{ type: 'equipo-dev:product-owner', desc: 'Reservas online' }])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /Feature: Reservas online/ })).toBeDefined()
    expect(await ui.find({ text: /✔ 1\. Product Owner/ })).toBeDefined()
    expect(await ui.find({ text: /Aprobación de la spec: te toca a ti/ })).toBeDefined()
    expect(await ui.find({ text: /○ 2\. Diseño UX/ })).toBeDefined()
  }
})

test('al lanzar el arquitecto, la spec queda aprobada y luego espera el diseño', async ($, on) => {
  await agentes($, on, [
    { type: 'equipo-dev:product-owner', desc: 'Reservas online' },
    { type: 'architect', desc: 'Diseño de reservas' },
  ])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /✔ Aprobación de la spec/ })).toBeDefined()
    expect(await ui.find({ text: /Aprobación del diseño: te toca a ti/ })).toBeDefined()
  }
})

test('el diseñador UX trabaja entre la spec y el arquitecto', async ($, on) => {
  await agentes($, on, [
    { type: 'equipo-dev:product-owner', desc: 'Reservas online' },
    { type: 'equipo-dev:ux-designer', desc: 'UX de reservas' },
  ])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /✔ Aprobación de la spec/ })).toBeDefined()
    expect(await ui.find({ text: /✔ 2\. Diseño UX/ })).toBeDefined()
    expect(await ui.find({ text: /○ 3\. Arquitecto/ })).toBeDefined()
    // El UX no abre la puerta del diseño: esa la abre el arquitecto.
    expect(await ui.find({ text: /te toca a ti/ })).toBeUndefined()
  }
})

test('agentes ajenos al equipo no cambian el panel', async ($, on) => {
  await agentes($, on, [{ type: 'Explore', desc: 'Buscar archivos' }])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /Sin feature activa/ })).toBeDefined()
  }
})

test('un fallo se marca con error y QA cuenta sus vueltas', async ($, on) => {
  await agentes($, on, [
    { type: 'equipo-dev:product-owner', desc: 'Login' },
    { type: 'equipo-dev:architect', desc: 'ADR login' },
    { type: 'equipo-dev:backend-dev', desc: 'API login', fails: true },
    { type: 'equipo-dev:qa-engineer', desc: 'QA login' },
    { type: 'equipo-dev:qa-engineer', desc: 'QA login 2' },
  ])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /✖ 4\. Backend/ })).toBeDefined()
    expect(await ui.find({ text: /6\. QA.*2 vueltas/ })).toBeDefined()
  }
})

test('tras la revisión final, un nuevo PO empieza una feature limpia', async ($, on) => {
  await agentes($, on, [
    { type: 'equipo-dev:product-owner', desc: 'Login' },
    { type: 'equipo-dev:code-reviewer', desc: 'Revisión login' },
    { type: 'equipo-dev:product-owner', desc: 'Facturas' },
  ])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /Feature: Facturas/ })).toBeDefined()
    expect(await ui.find({ text: /○ 7\. Code Reviewer/ })).toBeDefined()
  }
})

test('retomar en el arquitecto marca los pasos anteriores como hechos antes', async ($, on) => {
  await agentes($, on, [{ type: 'equipo-dev:architect', desc: 'ADR CheckIn' }])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /◌ 1\. Product Owner · antes de esta sesión/ })).toBeDefined()
    expect(await ui.find({ text: /◌ 2\. Diseño UX/ })).toBeDefined()
    expect(await ui.find({ text: /✔ Aprobación de la spec/ })).toBeDefined()
    expect(await ui.find({ text: /✔ 3\. Arquitecto/ })).toBeDefined()
    expect(await ui.find({ text: /Se retoma el flujo en Arquitecto/ })).toBeDefined()
  }
})

test('retomar en backend no marca al frontend como hecho', async ($, on) => {
  await agentes($, on, [{ type: 'equipo-dev:backend-dev', desc: 'API CheckIn' }])
  for (const surface of SURFACES) {
    const ui = await panel($, surface)
    expect(await ui.find({ text: /◌ 3\. Arquitecto/ })).toBeDefined()
    expect(await ui.find({ text: /○ 5\. Frontend/ })).toBeDefined()
  }
})

test('/dev-report responde con el estado aunque no haya panel', async ($, on) => {
  await agentes($, on, [{ type: 'equipo-dev:product-owner', desc: 'Reservas online' }])
  const r = await ($ as any).command.run({ command: 'equipo-dev:dev-report' })
  expect(r.text).toMatch(/Esta pantalla no muestra paneles laterales/)
  expect(r.text).toMatch(/Feature: Reservas online/)
  expect(r.text).toMatch(/✔ 1\. Product Owner: terminado/)
  expect(r.text).toMatch(/⏸ Esperando tu aprobación de la spec/)
})

test('/team-reset vacía el estado', async ($, on) => {
  await agentes($, on, [{ type: 'equipo-dev:product-owner', desc: 'Reservas online' }])
  await ($ as any).command.run({ command: 'equipo-dev:team-reset' })
  const r = await ($ as any).command.run({ command: 'equipo-dev:dev-report' })
  expect(r.text).toMatch(/Sin feature activa/)
})

test('el nombre corto del comando también funciona', async ($, on) => {
  await agentes($, on, [{ type: 'equipo-dev:product-owner', desc: 'CheckIn' }])
  const r = await ($ as any).command.run({ command: 'dev-report' })
  expect(r.text).toMatch(/Feature: CheckIn/)
})
