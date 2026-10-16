import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBuild } from '../scripts/build.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'src')
const PLATFORMS_DIR = path.join(ROOT, 'platforms')
const DIST_DIR = path.join(ROOT, 'dist')

function parseCommandMode(input) {
  const isContinuous = /--(?:no-pause|auto-approve)\b/i.test(input)
  const cleanDescription = input.replace(/--(?:no-pause|auto-approve)\b\s*/gi, '').trim()
  return {
    mode: isContinuous ? 'continuous' : 'supervised',
    cleanDescription,
  }
}

test('Parsing de flags --no-pause y --auto-approve en diversas posiciones y mayúsculas/minúsculas', () => {
  // Flag al inicio
  const r1 = parseCommandMode('/feature --no-pause reservas de citas')
  assert.equal(r1.mode, 'continuous')
  assert.equal(r1.cleanDescription, '/feature reservas de citas')

  // Flag al final
  const r2 = parseCommandMode('/feature reservas de citas --auto-approve')
  assert.equal(r2.mode, 'continuous')
  assert.equal(r2.cleanDescription, '/feature reservas de citas')

  // Case insensitive (mayúsculas)
  const r3 = parseCommandMode('/feature --NO-PAUSE pasarela de pagos')
  assert.equal(r3.mode, 'continuous')
  assert.equal(r3.cleanDescription, '/feature pasarela de pagos')

  const r4 = parseCommandMode('/feature --Auto-Approve autenticacion biometrica')
  assert.equal(r4.mode, 'continuous')
  assert.equal(r4.cleanDescription, '/feature autenticacion biometrica')

  // Retomar con flag
  const r5 = parseCommandMode('/feature continuemos con CheckIn --no-pause')
  assert.equal(r5.mode, 'continuous')
  assert.equal(r5.cleanDescription, '/feature continuemos con CheckIn')
})

test('Modo supervisado por defecto sin flags y con flags malformados', () => {
  // Sin flags: modo supervisado por defecto
  const r1 = parseCommandMode('/feature reservas de citas')
  assert.equal(r1.mode, 'supervised')
  assert.equal(r1.cleanDescription, '/feature reservas de citas')

  // Retomar sin flags: modo supervisado por defecto
  const r2 = parseCommandMode('/feature continuemos con CheckIn')
  assert.equal(r2.mode, 'supervised')
  assert.equal(r2.cleanDescription, '/feature continuemos con CheckIn')

  // Flag malformado (--no-pauses, --autoapprove): fallback determinista a supervisado
  const r3 = parseCommandMode('/feature --no-pauses gestion de inventario')
  assert.equal(r3.mode, 'supervised')

  const r4 = parseCommandMode('/feature --autoapprove gestion de inventario')
  assert.equal(r4.mode, 'supervised')
})

test('Contratos requeridos en src/skills/feature/SKILL.md', () => {
  const content = fs.readFileSync(path.join(SRC_DIR, 'skills', 'feature', 'SKILL.md'), 'utf8')

  // Modos y flags
  assert.match(content, /--no-pause/)
  assert.match(content, /--auto-approve/)
  assert.match(content, /Modo: Continuo \/ Autónomo \(aprobaciones de diseño desactivadas\)/)
  assert.match(content, /Modo: Supervisado \/ Interactivo \(aprobaciones estándar activadas\)/)

  // Supuestos técnicos vs dudas bloqueantes
  assert.match(content, /bloqueantes para el alcance de negocio/)
  assert.match(content, /supuestos técnicos razonables/)

  // Omisión de pausas de diseño
  assert.match(content, /UX y ADR auto-aprobados/)

  // Retomar por defecto supervisado
  assert.match(content, /Al retomar \(`\/feature continuemos con\.\.\.`\), el flujo opera en \*\*Modo Supervisado\*\* por defecto/)

  // Salvaguardas inviolables
  assert.match(content, /Nunca hagas commit ni push sin autorización explícita/)
  assert.match(content, /Nunca ejecutes comandos destructivos/)
  assert.match(content, /Al 3er fallo consecutivo de QA/)
})

test('Contratos requeridos en src/skills/reglas-equipo/SKILL.md', () => {
  const content = fs.readFileSync(path.join(SRC_DIR, 'skills', 'reglas-equipo', 'SKILL.md'), 'utf8')

  assert.match(content, /## Modos de Ejecución/)
  assert.match(content, /Modo Supervisado \/ Interactivo \(por defecto\)/)
  assert.match(content, /Modo Continuo \/ Autónomo \(con `--no-pause` o `--auto-approve`\)/)
  assert.match(content, /supuestos técnicos razonables/)
  assert.match(content, /Seguridad y Salvaguardas Críticas/)
  assert.match(content, /inviolables tanto en Modo Supervisado como en Modo Continuo/)
  assert.match(content, /commit ni push sin autorización explícita/)
  assert.match(content, /comandos destructivos/)
  assert.match(content, /rechaza 3 veces consecutivas/)
})

test('Contratos requeridos en src/skills/team-report/SKILL.md y platforms/antigravity/', () => {
  const srcReport = fs.readFileSync(path.join(SRC_DIR, 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.match(srcReport, /Modo: <Supervisado \/ Interactivo \| Continuo \/ Autónomo>/)
  assert.match(srcReport, /suprime estrictamente la línea `⏸`/)

  const antigravityReport = fs.readFileSync(path.join(PLATFORMS_DIR, 'antigravity', 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.match(antigravityReport, /Modo: <Supervisado \/ Interactivo \| Continuo \/ Autónomo>/)
  assert.match(antigravityReport, /En modo continuo, suprime estrictamente la línea `⏸`/)
})

test('Contratos requeridos en adaptadores de plataformas', () => {
  // Codex team-report
  const codexReport = fs.readFileSync(path.join(PLATFORMS_DIR, 'codex', 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.match(codexReport, /Supervisado por defecto vs Continuo \/ Autónomo/)
  assert.match(codexReport, /existente no acredita aprobación/)

  // Claude Code types
  const claudeTypes = fs.readFileSync(path.join(PLATFORMS_DIR, 'claude-code', 'types', 'index.d.ts'), 'utf8')
  assert.match(claudeTypes, /export type FlowMode = 'supervised' \| 'continuous'/)
  assert.match(claudeTypes, /mode\?: FlowMode/)

  // Claude Code hooks register.tsx
  const claudeHooks = fs.readFileSync(path.join(PLATFORMS_DIR, 'claude-code', 'hooks', 'register.tsx'), 'utf8')
  assert.match(claudeHooks, /parseMode/)
  assert.match(claudeHooks, /summary/)
  assert.match(claudeHooks, /Modo: Continuo \/ Autónomo/)
  assert.match(claudeHooks, /Modo: Supervisado \/ Interactivo/)
  assert.match(claudeHooks, /isContinuous/)

  // Cursor rules
  const cursorRules = fs.readFileSync(path.join(PLATFORMS_DIR, 'cursor', 'templates', '.cursorrules'), 'utf8')
  assert.match(cursorRules, /Modos de Ejecución/)
  assert.match(cursorRules, /--no-pause/)
  assert.match(cursorRules, /--auto-approve/)
  assert.match(cursorRules, /Salvaguardas críticas inviolables/)

  // Copilot instructions
  const copilotInstructions = fs.readFileSync(path.join(PLATFORMS_DIR, 'copilot', 'templates', 'copilot-instructions.md'), 'utf8')
  assert.match(copilotInstructions, /Modos de Ejecución/)
  assert.match(copilotInstructions, /--no-pause/)
  assert.match(copilotInstructions, /--auto-approve/)
  assert.match(copilotInstructions, /Salvaguardas críticas inviolables/)
})

test('Compilación y propagación determinista a dist/ para todos los targets', () => {
  runBuild({ target: 'all', clean: true })

  // Antigravity en dist
  const distAntiFeature = fs.readFileSync(path.join(DIST_DIR, 'antigravity', 'equipo-dev', 'skills', 'feature', 'SKILL.md'), 'utf8')
  assert.match(distAntiFeature, /Modo Continuo \/ Autónomo/)
  assert.match(distAntiFeature, /--no-pause/)
  assert.doesNotMatch(distAntiFeature, /\{\{/)

  const distAntiReport = fs.readFileSync(path.join(DIST_DIR, 'antigravity', 'equipo-dev', 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.match(distAntiReport, /Modo: <Supervisado \/ Interactivo \| Continuo \/ Autónomo>/)
  assert.doesNotMatch(distAntiReport, /\{\{/)

  // Codex en dist
  const distCodexFeature = fs.readFileSync(path.join(DIST_DIR, 'codex', 'equipo-dev', 'skills', 'equipo-dev-feature', 'SKILL.md'), 'utf8')
  assert.match(distCodexFeature, /Modo Continuo \/ Autónomo/)
  assert.match(distCodexFeature, /--no-pause/)
  assert.doesNotMatch(distCodexFeature, /\{\{/)

  const distCodexReport = fs.readFileSync(path.join(DIST_DIR, 'codex', 'equipo-dev', 'skills', 'equipo-dev-team-report', 'SKILL.md'), 'utf8')
  assert.match(distCodexReport, /Supervisado por defecto vs Continuo \/ Autónomo/)
  assert.doesNotMatch(distCodexReport, /\{\{/)

  // Cursor en dist
  const distCursor = fs.readFileSync(path.join(DIST_DIR, 'cursor', '.cursorrules'), 'utf8')
  assert.match(distCursor, /--no-pause/)
  assert.doesNotMatch(distCursor, /\{\{/)

  // Copilot en dist
  const distCopilot = fs.readFileSync(path.join(DIST_DIR, 'copilot', '.github', 'copilot-instructions.md'), 'utf8')
  assert.match(distCopilot, /--no-pause/)
  assert.doesNotMatch(distCopilot, /\{\{/)
})
