import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SKILLS } from '../scripts/codex.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'src')
const PLATFORMS_DIR = path.join(ROOT, 'platforms')

function validateFixInvocation(input) {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Uso: /fix <descripción del error, traza o archivo afectado>' }
  }
  const match = input.match(/^\/fix(?:\s+(.*))?$/i)
  if (!match) {
    return { valid: false, error: 'Comando no reconocido' }
  }
  const arg = (match[1] || '').trim()
  if (!arg) {
    return { valid: false, error: 'Uso: /fix <descripción del error, traza o archivo afectado>' }
  }
  return { valid: true, target: arg }
}

function parseKind(desc) {
  if (!desc) return 'feature'
  return /^\/fix\b|^fix\b|^\[fix\]/i.test(desc.trim()) ? 'fix' : 'feature'
}

function startsNewFlow(f, role, kind) {
  if (kind === 'fix' || f.kind === 'fix') {
    return !f.feature || f.roles['code-reviewer']?.status === 'terminado'
  }
  return role === 'product-owner' && (!f.feature || f.roles['code-reviewer']?.status === 'terminado')
}

test('Validación de sintaxis e invocación de /fix (argumento vacío vs válido)', () => {
  const rEmpty1 = validateFixInvocation('/fix')
  assert.equal(rEmpty1.valid, false)
  assert.equal(rEmpty1.error, 'Uso: /fix <descripción del error, traza o archivo afectado>')

  const rEmpty2 = validateFixInvocation('/fix   ')
  assert.equal(rEmpty2.valid, false)
  assert.equal(rEmpty2.error, 'Uso: /fix <descripción del error, traza o archivo afectado>')

  const rValid = validateFixInvocation("/fix Cannot read properties of undefined (reading 'status')")
  assert.equal(rValid.valid, true)
  assert.equal(rValid.target, "Cannot read properties of undefined (reading 'status')")

  const rValidFile = validateFixInvocation('/fix src/components/button.tsx error de renderizado')
  assert.equal(rValidFile.valid, true)
  assert.equal(rValidFile.target, 'src/components/button.tsx error de renderizado')
})

test('Contratos en src/skills/fix/SKILL.md: Frontmatter, RCA, test obligatorio, reintentos y plantilla', () => {
  const filePath = path.join(SRC_DIR, 'skills', 'fix', 'SKILL.md')
  assert.ok(fs.existsSync(filePath), 'src/skills/fix/SKILL.md debe existir')
  const content = fs.readFileSync(filePath, 'utf8')

  // Frontmatter
  assert.match(content, /^name:\s*fix$/m)
  assert.match(content, /^description:/m)

  // Mensaje de ayuda para argumento vacío
  assert.match(content, /Uso: \/fix <descripción del error, traza o archivo afectado>/)

  // Circuito técnico Dev -> QA -> Reviewer y omisión de roles
  assert.match(content, /Dev -> QA -> Code Reviewer/)
  assert.match(content, /omite estrictamente las etapas de Product Owner, UX Designer y Arquitecto/)
  assert.match(content, /Tipo: FIX/)
  assert.match(content, /Modo: Remediación directa \(Dev -> QA -> Reviewer\)/)

  // RCA <= 5 líneas y test obligatorio
  assert.match(content, /Causa Raíz \(RCA\)/)
  assert.match(content, /máximo de 5 líneas/)
  assert.match(content, /Test automatizado de regresión obligatorio/)

  // Desvío funcional
  assert.match(content, /sugiere usar `\/feature`/)

  // Límite de 3 reintentos
  assert.match(content, /Límite de 3 reintentos/)

  // Plantilla docs/fixes/<slug>.md
  assert.match(content, /docs\/fixes\/<slug>\.md/)
  assert.match(content, /# Fix: <Título Sintético del Defecto>/)
  assert.match(content, /## 1\. Diagnóstico y Causa Raíz \(RCA\)/)
  assert.match(content, /## 2\. Parche Aplicado/)
  assert.match(content, /## 3\. Test de Regresión Obligatorio/)
  assert.match(content, /## 4\. Verificación de No-Regresión/)

  // Salvaguardas
  assert.match(content, /Cero commits y cero push autónomos/)
  assert.match(content, /Cero comandos destructivos/)
  assert.match(content, /Gestión de secretos/)
})

test('Contratos de /fix en src/skills/reglas-equipo/SKILL.md', () => {
  const content = fs.readFileSync(path.join(SRC_DIR, 'skills', 'reglas-equipo', 'SKILL.md'), 'utf8')
  assert.match(content, /## Protocolo de Remediación Técnica \(`\/fix`\)/)
  assert.match(content, /`backend-dev` o `frontend-dev`/)
  assert.match(content, /Test automatizado de regresión obligatorio/)
  assert.match(content, /docs\/fixes\/<slug>\.md/)
  assert.match(content, /máximo 3 reintentos antes de escalar al dueño/)
})

test('Contratos de tipo FIX en team-report agnóstico y plataformas', () => {
  const srcReport = fs.readFileSync(path.join(SRC_DIR, 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.match(srcReport, /Tipo: FIX/)
  assert.match(srcReport, /Oculta por completo las filas correspondientes a `Product Owner`, `Diseño UX` y `Arquitecto`/)
  assert.match(srcReport, /Modo: Remediación directa \(Dev -> QA -> Reviewer\)/)

  const agReport = fs.readFileSync(path.join(PLATFORMS_DIR, 'antigravity', 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.match(agReport, /Tipo: FIX/)
  assert.match(agReport, /Oculta completamente las filas de Product Owner, Diseño UX y Arquitecto/)

  const codexReport = fs.readFileSync(path.join(PLATFORMS_DIR, 'codex', 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.match(codexReport, /Tipo: FIX/)
  assert.match(codexReport, /ocultando Product Owner, UX y Arquitecto/)
})

test('Contratos en adaptadores de plataformas (Claude Code, Codex, Cursor, Copilot)', () => {
  // Types Claude Code
  const types = fs.readFileSync(path.join(PLATFORMS_DIR, 'claude-code', 'types', 'index.d.ts'), 'utf8')
  assert.match(types, /export type FlowKind = 'feature' \| 'fix'/)
  assert.match(types, /kind\?: FlowKind/)

  // Claude Code register.tsx
  const claudeHooks = fs.readFileSync(path.join(PLATFORMS_DIR, 'claude-code', 'hooks', 'register.tsx'), 'utf8')
  assert.match(claudeHooks, /export function parseKind\(desc\?: string\): FlowKind/)
  assert.match(claudeHooks, /kind === 'fix' \|\| f\.kind === 'fix'/)
  assert.match(claudeHooks, /Tipo: FIX/)
  assert.match(claudeHooks, /Remediación directa/)
  assert.match(claudeHooks, /Tipo: FIX \(Remediación rápida\)/)

  // Codex scripts/codex.mjs
  assert.equal(SKILLS.fix, 'equipo-dev-fix')

  // Cursor rules
  const cursorRules = fs.readFileSync(path.join(PLATFORMS_DIR, 'cursor', 'templates', '.cursorrules'), 'utf8')
  assert.match(cursorRules, /Protocolo de Remediación Rápida \(`\/fix`\)/)
  assert.match(cursorRules, /docs\/fixes\/<slug>\.md/)

  // Copilot instructions
  const copilot = fs.readFileSync(path.join(PLATFORMS_DIR, 'copilot', 'templates', 'copilot-instructions.md'), 'utf8')
  assert.match(copilot, /Protocolo de Remediación Rápida \(`\/fix`\)/)
  assert.match(copilot, /docs\/fixes\/<slug>\.md/)
})

test('Lógica de adaptadores: parseKind, startsNewFlow y detección de roles técnicos', () => {
  // parseKind
  assert.equal(parseKind('/fix error de conexion'), 'fix')
  assert.equal(parseKind('fix: null pointer exception'), 'fix')
  assert.equal(parseKind('[fix] button click fail'), 'fix')
  assert.equal(parseKind('/feature checkout'), 'feature')
  assert.equal(parseKind(undefined), 'feature')
  assert.equal(parseKind(''), 'feature')

  // startsNewFlow con fix
  const emptyFlowState = {
    roles: {
      'product-owner': { status: 'pendiente', runs: 0 },
      'ux-designer': { status: 'pendiente', runs: 0 },
      architect: { status: 'pendiente', runs: 0 },
      'backend-dev': { status: 'pendiente', runs: 0 },
      'frontend-dev': { status: 'pendiente', runs: 0 },
      'qa-engineer': { status: 'pendiente', runs: 0 },
      'code-reviewer': { status: 'pendiente', runs: 0 },
    },
    log: [],
  }
  // En fix, backend-dev puede arrancar sin requerir product-owner
  assert.equal(startsNewFlow(emptyFlowState, 'backend-dev', 'fix'), true)
  assert.equal(startsNewFlow(emptyFlowState, 'backend-dev', 'feature'), false)
  assert.equal(startsNewFlow(emptyFlowState, 'product-owner', 'feature'), true)
})

test('Salvaguardas de seguridad en /fix', () => {
  const fixSkill = fs.readFileSync(path.join(SRC_DIR, 'skills', 'fix', 'SKILL.md'), 'utf8')

  // Sin commits ni push automáticos
  assert.match(fixSkill, /Cero commits y cero push autónomos/)
  assert.match(fixSkill, /autorización explícita del dueño/)

  // Sin comandos destructivos
  assert.match(fixSkill, /Cero comandos destructivos/)
  assert.match(fixSkill, /rm -rf/)
  assert.match(fixSkill, /DROP TABLE/)

  // Manejo de secretos
  assert.match(fixSkill, /Gestión de secretos/)
  assert.match(fixSkill, /Prohibido incluir credenciales, tokens o datos confidenciales/)

  // Límite de reintentos
  assert.match(fixSkill, /Límite de 3 reintentos/)
  assert.match(fixSkill, /escala inmediatamente al dueño/)
})
