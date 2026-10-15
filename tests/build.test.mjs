import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runBuild, parseFrontmatter, applyTokens, assertWithin, isAuthorizedInstallTarget, serializeFrontmatterField } from '../scripts/build.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

test('Compilación global completa (tiempo < 5s y targets generados)', () => {
  const result = runBuild({ clean: true, target: 'all' })
  assert.ok(result.duration < 5000, `El build tomó ${result.duration}ms, superando el límite de 5000ms`)
  assert.ok(fs.existsSync(path.join(DIST, 'claude-code', 'equipo-dev')))
  assert.ok(fs.existsSync(path.join(DIST, 'antigravity', 'equipo-dev')))
  assert.ok(fs.existsSync(path.join(DIST, 'cursor')))
  assert.ok(fs.existsSync(path.join(DIST, 'copilot')))
})

test('Validación de esquema y manifiesto para Claude Code', () => {
  const manifestPath = path.join(DIST, 'claude-code', 'equipo-dev', '.claude-plugin', 'plugin.json')
  assert.ok(fs.existsSync(manifestPath), 'Manifiesto .claude-plugin/plugin.json debe existir')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  assert.equal(manifest.name, 'equipo-dev')
  assert.equal(manifest.version, '0.5.0')
  assert.equal(manifest.types, './types/index.d.ts')
  assert.ok(Array.isArray(manifest.keywords))
  assert.equal(manifest.author?.name, 'GeboArt.Dev')

  // Assets
  assert.ok(fs.existsSync(path.join(DIST, 'claude-code', 'equipo-dev', 'hooks', 'register.tsx')))
  assert.ok(fs.existsSync(path.join(DIST, 'claude-code', 'equipo-dev', 'types', 'index.d.ts')))
})

test('Validación de esquema y manifiesto para Antigravity', () => {
  const manifestPath = path.join(DIST, 'antigravity', 'equipo-dev', 'plugin.json')
  assert.ok(fs.existsSync(manifestPath), 'Manifiesto plugin.json debe existir en la raíz')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  assert.equal(manifest.name, 'equipo-dev')
  assert.equal(manifest.displayName, 'Equipo Dev')
  assert.equal(manifest.version, '0.5.0')
  assert.ok(Array.isArray(manifest.suggestedPrompts))

  // Hooks en raíz
  assert.ok(fs.existsSync(path.join(DIST, 'antigravity', 'equipo-dev', 'hooks.json')))
  assert.ok(fs.existsSync(path.join(DIST, 'antigravity', 'equipo-dev', 'hooks', 'bitacora.mjs')))
})

test('Mapeo de herramientas en Antigravity (NO command_status)', () => {
  const agAgentsDir = path.join(DIST, 'antigravity', 'equipo-dev', 'agents')
  const files = fs.readdirSync(agAgentsDir).filter(f => f.endsWith('.md'))

  assert.equal(files.length, 7, 'Deben existir 7 agentes compilados para Antigravity')

  for (const file of files) {
    const content = fs.readFileSync(path.join(agAgentsDir, file), 'utf8')
    assert.ok(!content.includes('command_status'), `El agente ${file} contiene command_status, lo cual está prohibido`)
    assert.ok(content.includes('subagent: true'), `El agente ${file} debe tener subagent: true`)
    assert.ok(content.includes('mainAgent: false'), `El agente ${file} debe tener mainAgent: false`)
    assert.ok(!content.includes('color:'), `El agente ${file} no debe incluir color`)
  }

  // Verificar backend-dev específicamente
  const backendContent = fs.readFileSync(path.join(agAgentsDir, 'backend-dev.md'), 'utf8')
  assert.ok(backendContent.includes('run_command'), 'backend-dev debe incluir run_command')
  assert.ok(backendContent.includes('view_file'), 'backend-dev debe incluir view_file')
  assert.ok(backendContent.includes('model: inherit'), 'backend-dev debe mapear balanced -> inherit')
})

test('Mapeo de modelos y herramientas en Claude Code', () => {
  const claudeAgentsDir = path.join(DIST, 'claude-code', 'equipo-dev', 'agents')
  const backendContent = fs.readFileSync(path.join(claudeAgentsDir, 'backend-dev.md'), 'utf8')
  assert.ok(backendContent.includes('tools: Read, Write, Edit, Bash, Glob, Grep'))
  assert.ok(backendContent.includes('model: sonnet'))

  const architectContent = fs.readFileSync(path.join(claudeAgentsDir, 'architect.md'), 'utf8')
  assert.ok(architectContent.includes('model: opus'))
  assert.ok(architectContent.includes('tools: Read, Write, Glob, Grep, WebSearch'))
})

test('Resolución completa de tokens contextuales en agentes y skills', () => {
  const checkNoTokens = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        checkNoTokens(fullPath)
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8')
        assert.ok(!content.includes('{{AGENT_GUIDE_FILE}}'), `Token no resuelto en ${fullPath}`)
        assert.ok(!content.includes('{{CMD_TOOL}}'), `Token no resuelto en ${fullPath}`)
        assert.ok(!content.includes('{{SEARCH_TOOL}}'), `Token no resuelto en ${fullPath}`)
        assert.ok(!content.includes('{{SUBAGENT_DISPATCH_GUIDE}}'), `Token no resuelto en ${fullPath}`)
        assert.ok(!content.includes('{{UX_SEARCH_LOCATION}}'), `Token no resuelto en ${fullPath}`)
      }
    }
  }

  checkNoTokens(path.join(DIST, 'claude-code', 'equipo-dev', 'agents'))
  checkNoTokens(path.join(DIST, 'claude-code', 'equipo-dev', 'skills'))
  checkNoTokens(path.join(DIST, 'antigravity', 'equipo-dev', 'agents'))
  checkNoTokens(path.join(DIST, 'antigravity', 'equipo-dev', 'skills'))
})

test('Overrides de skills en Antigravity', () => {
  const panelSkill = fs.readFileSync(path.join(DIST, 'antigravity', 'equipo-dev', 'skills', 'team-report', 'SKILL.md'), 'utf8')
  assert.ok(panelSkill.includes('# Estado del equipo (Antigravity)'))
  assert.ok(panelSkill.includes('hooks/bitacora.mjs'))

  const restartSkill = fs.readFileSync(path.join(DIST, 'antigravity', 'equipo-dev', 'skills', 'equipo-reiniciar', 'SKILL.md'), 'utf8')
  assert.ok(restartSkill.includes('# Reiniciar la bitácora del equipo (Antigravity)'))
})

test('Templates base para Cursor y Copilot', () => {
  const cursorRulesPath = path.join(DIST, 'cursor', '.cursorrules')
  assert.ok(fs.existsSync(cursorRulesPath), '.cursorrules debe existir en dist/cursor/')
  const cursorContent = fs.readFileSync(cursorRulesPath, 'utf8')
  assert.ok(cursorContent.includes('Reglas de Trabajo Equipo Dev para Cursor'))

  const copilotPath = path.join(DIST, 'copilot', '.github', 'copilot-instructions.md')
  assert.ok(fs.existsSync(copilotPath), 'copilot-instructions.md debe existir en dist/copilot/.github/')
  const copilotContent = fs.readFileSync(copilotPath, 'utf8')
  assert.ok(copilotContent.includes('Instrucciones de Equipo Dev para GitHub Copilot'))
})

test('Compilación de target individual (--target antigravity)', () => {
  const result = runBuild({ target: 'antigravity' })
  assert.equal(result.targets.length, 1)
  assert.equal(result.targets[0], 'antigravity')
})

test('Parser frontmatter y applyTokens unitarios', () => {
  const parsed = parseFrontmatter(`---
name: test-agent
description: "prueba"
model_tier: pro
tools:
  - read_file
  - write_file
---
Cuerpo con {{AGENT_GUIDE_FILE}}`)

  assert.equal(parsed.attributes.name, 'test-agent')
  assert.equal(parsed.attributes.model_tier, 'pro')
  assert.deepEqual(parsed.attributes.tools, ['read_file', 'write_file'])

  const replaced = applyTokens(parsed.body, { '{{AGENT_GUIDE_FILE}}': 'AGENTS.md' })
  assert.ok(replaced.includes('AGENTS.md'))
})

test('Validación de contención de rutas con assertWithin', () => {
  const parent = path.join(ROOT, 'dist')
  const validChild = path.join(ROOT, 'dist', 'sub', 'file.txt')
  assert.equal(assertWithin(validChild, parent), validChild)

  // Escape con ..
  assert.throws(() => {
    assertWithin(path.join(ROOT, 'dist', '..', 'secret.txt'), parent)
  }, /Violación de seguridad/)

  // Ruta idéntica al padre (no es estrictamente dentro)
  assert.throws(() => {
    assertWithin(parent, parent)
  }, /Violación de seguridad/)
})

test('Validación de directorios autorizados con isAuthorizedInstallTarget', () => {
  const home = os.homedir()
  const validGemini = path.join(home, '.gemini', 'config', 'plugins', 'equipo-dev')
  const validClaude = path.join(home, '.claude', 'plugins', 'equipo-dev')
  const validTmp = path.join(os.tmpdir(), 'test-plugins', 'equipo-dev')

  assert.equal(isAuthorizedInstallTarget(validGemini), true)
  assert.equal(isAuthorizedInstallTarget(validClaude), true)
  assert.equal(isAuthorizedInstallTarget(validTmp), true)

  // Prohibir home directo y raíz
  assert.equal(isAuthorizedInstallTarget(home), false)
  const root = path.parse(home).root
  assert.equal(isAuthorizedInstallTarget(root), false)

  // Prohibir rutas ajenas
  const outside = path.join(ROOT, 'some-dir')
  assert.equal(isAuthorizedInstallTarget(outside), false)
})

test('Serialización de campos de frontmatter con serializeFrontmatterField', () => {
  // Array
  assert.deepEqual(serializeFrontmatterField('skills', ['skill-a', 'skill-b']), [
    'skills:',
    '  - skill-a',
    '  - skill-b',
  ])

  // Array vacío
  assert.deepEqual(serializeFrontmatterField('empty', []), ['empty: []'])

  // Escalares y booleanos
  assert.deepEqual(serializeFrontmatterField('subagent', true), ['subagent: true'])
  assert.deepEqual(serializeFrontmatterField('tier', 'pro'), ['tier: pro'])
})

test('Limpieza selectiva con --clean y --target específico', () => {
  // Compilar todo primero
  runBuild({ clean: true, target: 'all' })
  assert.ok(fs.existsSync(path.join(DIST, 'cursor', '.cursorrules')))
  assert.ok(fs.existsSync(path.join(DIST, 'copilot', '.github', 'copilot-instructions.md')))

  const cursorMtime = fs.statSync(path.join(DIST, 'cursor', '.cursorrules')).mtimeMs

  // Limpiar y compilar solo copilot
  runBuild({ clean: true, target: 'copilot' })

  // Cursor no debió ser borrado ni alterado
  assert.ok(fs.existsSync(path.join(DIST, 'cursor', '.cursorrules')))
  assert.equal(fs.statSync(path.join(DIST, 'cursor', '.cursorrules')).mtimeMs, cursorMtime)
  assert.ok(fs.existsSync(path.join(DIST, 'copilot', '.github', 'copilot-instructions.md')))
})
