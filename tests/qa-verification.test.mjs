import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { runBuild, parseFrontmatter, applyTokens } from '../scripts/build.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'src')
const DIST_DIR = path.join(ROOT, 'dist')
const PLATFORMS_DIR = path.join(ROOT, 'platforms')

// HU-1: Centralización agnóstica de roles y habilidades
test('HU-1: No existen fuentes secundarias duplicadas de agentes o skills fuera de src/', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'agents')), 'Carpeta agents/ legada no debe existir en raíz')
  assert.ok(!fs.existsSync(path.join(ROOT, 'skills')), 'Carpeta skills/ legada no debe existir en raíz')
  assert.ok(!fs.existsSync(path.join(ROOT, '.claude-plugin')), 'Carpeta .claude-plugin/ legada no debe existir en raíz')
  assert.ok(!fs.existsSync(path.join(ROOT, 'antigravity')), 'Carpeta antigravity/ legada no debe existir en raíz')
})

test('HU-1: src/ es agnóstico (sin herramientas propietarias ni rutas duras)', () => {
  const checkDir = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        checkDir(full)
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(full, 'utf8')
        // No debe tener herramientas propietarias de Claude en el frontmatter tools
        const { attributes } = parseFrontmatter(content)
        if (attributes.tools) {
          const raw = JSON.stringify(attributes.tools)
          assert.ok(!raw.includes('Bash'), `tools en ${full} contiene 'Bash' en vez de execute_command`)
          assert.ok(!raw.includes('Glob'), `tools en ${full} contiene 'Glob' en vez de find_by_name`)
          assert.ok(!raw.includes('Grep'), `tools en ${full} contiene 'Grep' en vez de grep_search`)
          assert.ok(!raw.includes('view_file'), `tools en ${full} contiene 'view_file' en vez de read_file`)
          assert.ok(!raw.includes('command_status'), `tools en ${full} contiene 'command_status'`)
        }
      }
    }
  }
  checkDir(path.join(SRC_DIR, 'agents'))
  checkDir(path.join(SRC_DIR, 'skills'))
})

test('HU-1: Todos los 7 agentes canónicos y 4 skills están presentes en src/', () => {
  const expectedAgents = [
    'product-owner.md',
    'ux-designer.md',
    'architect.md',
    'backend-dev.md',
    'frontend-dev.md',
    'qa-engineer.md',
    'code-reviewer.md'
  ]
  for (const agent of expectedAgents) {
    assert.ok(fs.existsSync(path.join(SRC_DIR, 'agents', agent)), `Agente canónico faltante: ${agent}`)
  }

  const expectedSkills = ['feature', 'reglas-equipo', 'equipo-panel', 'equipo-reiniciar']
  for (const skill of expectedSkills) {
    assert.ok(fs.existsSync(path.join(SRC_DIR, 'skills', skill, 'SKILL.md')), `Skill canónica faltante: ${skill}`)
  }
})

// HU-2: Adaptadores modulares por plataforma
test('HU-2: Adaptador Antigravity genera plugin.json en raíz y traduce herramientas canónicas sin command_status', () => {
  runBuild({ target: 'antigravity', clean: false })
  const agDist = path.join(DIST_DIR, 'antigravity', 'equipo-dev')
  const manifest = JSON.parse(fs.readFileSync(path.join(agDist, 'plugin.json'), 'utf8'))
  assert.equal(manifest.name, 'equipo-dev')
  assert.equal(manifest.displayName, 'Equipo Dev')

  const agAgentsDir = path.join(agDist, 'agents')
  const agentFiles = fs.readdirSync(agAgentsDir).filter(f => f.endsWith('.md'))
  assert.equal(agentFiles.length, 7)

  for (const f of agentFiles) {
    const raw = fs.readFileSync(path.join(agAgentsDir, f), 'utf8')
    assert.ok(!raw.includes('command_status'), `${f} no debe incluir command_status`)
    assert.ok(!raw.includes('{{AGENT_GUIDE_FILE}}'), `${f} contiene token sin resolver`)
  }

  // Bitacora hooks incluidos
  assert.ok(fs.existsSync(path.join(agDist, 'hooks.json')))
  assert.ok(fs.existsSync(path.join(agDist, 'hooks', 'bitacora.mjs')))
})

test('HU-2: Adaptador Claude Code genera .claude-plugin/plugin.json y mapea herramientas nativas y modelos', () => {
  runBuild({ target: 'claude-code', clean: false })
  const claudeDist = path.join(DIST_DIR, 'claude-code', 'equipo-dev')
  const manifest = JSON.parse(fs.readFileSync(path.join(claudeDist, '.claude-plugin', 'plugin.json'), 'utf8'))
  assert.equal(manifest.name, 'equipo-dev')
  assert.equal(manifest.types, './types/index.d.ts')

  const architect = fs.readFileSync(path.join(claudeDist, 'agents', 'architect.md'), 'utf8')
  assert.ok(architect.includes('tools: Read, Write, Glob, Grep, WebSearch'))
  assert.ok(architect.includes('model: opus'))
})

test('HU-2: Plataformas Cursor y Copilot poseen configuración de adaptación base', () => {
  assert.ok(fs.existsSync(path.join(PLATFORMS_DIR, 'cursor', 'platform.json')))
  assert.ok(fs.existsSync(path.join(PLATFORMS_DIR, 'cursor', 'templates', '.cursorrules')))
  assert.ok(fs.existsSync(path.join(PLATFORMS_DIR, 'copilot', 'platform.json')))
  assert.ok(fs.existsSync(path.join(PLATFORMS_DIR, 'copilot', 'templates', 'copilot-instructions.md')))
})

// HU-3: Proceso unificado de compilación y empaquetado
test('HU-3: Compilación global genera todos los targets en < 5s con código 0', () => {
  const result = runBuild({ clean: true, target: 'all' })
  assert.ok(result.duration < 5000, `Demora excesiva: ${result.duration}ms`)
  assert.ok(fs.existsSync(path.join(DIST_DIR, 'claude-code', 'equipo-dev')))
  assert.ok(fs.existsSync(path.join(DIST_DIR, 'antigravity', 'equipo-dev')))
  assert.ok(fs.existsSync(path.join(DIST_DIR, 'cursor', '.cursorrules')))
  assert.ok(fs.existsSync(path.join(DIST_DIR, 'copilot', '.github', 'copilot-instructions.md')))
})

test('HU-3: Compilación selectiva no altera otros targets', () => {
  // Aseguramos que cursor existe
  assert.ok(fs.existsSync(path.join(DIST_DIR, 'cursor', '.cursorrules')))
  const cursorMtimeBefore = fs.statSync(path.join(DIST_DIR, 'cursor', '.cursorrules')).mtimeMs

  // Compilar solo antigravity
  runBuild({ target: 'antigravity', clean: false })
  const cursorMtimeAfter = fs.statSync(path.join(DIST_DIR, 'cursor', '.cursorrules')).mtimeMs
  assert.equal(cursorMtimeBefore, cursorMtimeAfter, 'Cursor no debió modificarse al compilar solo antigravity')
})

test('HU-3 & Casos límite: Detección y detención ante metadata inválida', () => {
  const tempInvalidAgent = path.join(SRC_DIR, 'agents', 'temp-invalid-qa.md')
  try {
    fs.writeFileSync(tempInvalidAgent, `---
name: temp-invalid
description: "prueba invalida"
model_tier: pro
---
Cuerpo sin tools`, 'utf8')

    assert.throws(() => {
      runBuild({ target: 'antigravity', clean: false })
    }, /Campo obligatorio 'tools' faltante/)
  } finally {
    if (fs.existsSync(tempInvalidAgent)) fs.unlinkSync(tempInvalidAgent)
  }
})

test('HU-3 & Casos límite: Detección de model_tier inválido', () => {
  const tempInvalidTier = path.join(SRC_DIR, 'agents', 'temp-tier-qa.md')
  try {
    fs.writeFileSync(tempInvalidTier, `---
name: temp-tier
description: "prueba tier"
model_tier: ultra_pro_max
tools:
  - read_file
---
Cuerpo`, 'utf8')

    assert.throws(() => {
      runBuild({ target: 'antigravity', clean: false })
    }, /model_tier 'ultra_pro_max' inválido/)
  } finally {
    if (fs.existsSync(tempInvalidTier)) fs.unlinkSync(tempInvalidTier)
  }
})

test('HU-3 & Casos límite: Detección de herramienta canónica desconocida', () => {
  const tempInvalidTool = path.join(SRC_DIR, 'agents', 'temp-tool-qa.md')
  try {
    fs.writeFileSync(tempInvalidTool, `---
name: temp-tool
description: "prueba tool"
model_tier: pro
tools:
  - herramienta_fantasma
---
Cuerpo`, 'utf8')

    assert.throws(() => {
      runBuild({ target: 'antigravity', clean: false })
    }, /Herramienta canónica no reconocida 'herramienta_fantasma'/)
  } finally {
    if (fs.existsSync(tempInvalidTool)) fs.unlinkSync(tempInvalidTool)
  }
})

// HU-4: Instalación local automatizada
test('HU-4: Instalación para Antigravity sincroniza artefactos y preserva directorio state', () => {
  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'equipo-dev-test-'))
  const installDir = path.join(tempBase, 'plugins', 'equipo-dev')
  const stateDir = path.join(installDir, 'state')
  fs.mkdirSync(stateDir, { recursive: true })
  const testStateFile = path.join(stateDir, 'test-qa-bitacora.jsonl')
  fs.writeFileSync(testStateFile, '{"test": true}\n', 'utf8')

  try {
    runBuild({ target: 'antigravity', install: true, clean: false, installDir })

    // Verificar que el plugin quedó instalado
    assert.ok(fs.existsSync(path.join(installDir, 'plugin.json')))
    assert.ok(fs.existsSync(path.join(installDir, 'agents', 'backend-dev.md')))

    // Verificar que test-qa-bitacora.jsonl fue preservado
    assert.ok(fs.existsSync(testStateFile), 'El directorio state/ y sus archivos debieron preservarse')
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true })
  }
})

test('HU-4 & Casos límite: Ejecución CLI con flags --clean y --target', () => {
  const proc = spawnSync('node', ['scripts/build.mjs', '--clean', '--target', 'claude-code'], {
    cwd: ROOT,
    encoding: 'utf8'
  })
  assert.equal(proc.status, 0)
  assert.ok(fs.existsSync(path.join(DIST_DIR, 'claude-code', 'equipo-dev', '.claude-plugin', 'plugin.json')))
})

test('HU-5: Contratos y templates para Cursor y Copilot son válidos y sin tokens rotos', () => {
  runBuild({ target: 'cursor', clean: false })
  const cursorRules = fs.readFileSync(path.join(DIST_DIR, 'cursor', '.cursorrules'), 'utf8')
  assert.ok(cursorRules.includes('Reglas de Trabajo Equipo Dev para Cursor'))
  assert.ok(!cursorRules.includes('{{AGENT_GUIDE_FILE}}'))

  runBuild({ target: 'copilot', clean: false })
  const copilotInstructions = fs.readFileSync(path.join(DIST_DIR, 'copilot', '.github', 'copilot-instructions.md'), 'utf8')
  assert.ok(copilotInstructions.includes('Instrucciones de Equipo Dev para GitHub Copilot'))
  assert.ok(!copilotInstructions.includes('{{AGENT_GUIDE_FILE}}'))
})

test('Validación específica: NINGÚN agente en Antigravity contiene command_status', () => {
  // Asegurar compilación de Antigravity
  runBuild({ target: 'antigravity', clean: false })

  const agDistAgents = path.join(DIST_DIR, 'antigravity', 'equipo-dev', 'agents')
  const files = fs.readdirSync(agDistAgents).filter(f => f.endsWith('.md'))
  for (const f of files) {
    const content = fs.readFileSync(path.join(agDistAgents, f), 'utf8')
    assert.ok(!content.includes('command_status'), `dist/antigravity/equipo-dev/agents/${f} contiene command_status`)
  }

  const installedAgents = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'equipo-dev', 'agents')
  if (fs.existsSync(installedAgents)) {
    const installedFiles = fs.readdirSync(installedAgents).filter(f => f.endsWith('.md'))
    for (const f of installedFiles) {
      const content = fs.readFileSync(path.join(installedAgents, f), 'utf8')
      assert.ok(!content.includes('command_status'), `installed agents/${f} contiene command_status`)
    }
  }
})

