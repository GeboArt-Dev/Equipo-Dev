#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { HOSTS, sha256, checkedPath } from './plugin-artifacts.mjs'
import { safePath } from './codex.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MARKET = 'equipo-dev-local'
const ID = `equipo-dev@${MARKET}`
const error = (code, message) => Object.assign(new Error(message), { code })
const readJSON = file => JSON.parse(fs.readFileSync(safePath(file), 'utf8'))
export const execute = (command, args, options = {}) => spawnSync(command, args, { shell: false, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true, env: options.env || process.env })

export function vscodeVersion(home, runner = execute) {
  const installation = path.join(home, 'AppData/Local/Programs/Microsoft VS Code')
  const launcher = path.join(installation, 'bin/code.cmd')
  const executable = path.join(installation, 'Code.exe')
  if (!fs.existsSync(launcher) || !fs.existsSync(executable)) return null
  const content = fs.readFileSync(safePath(launcher), 'utf8')
  const match = content.match(/"%~dp0\.\.\\Code\.exe"\s+"%~dp0\.\.\\((?:[a-zA-Z0-9._-]+\\)*resources\\app\\out\\cli\.js)"\s+%\*/i)
  if (!match) return null
  const relative = match[1].split('\\')
  if (relative.some(part => part === '.' || part === '..')) return null
  const cli = checkedPath(path.join(installation, ...relative), installation)
  if (!fs.existsSync(cli)) return null
  const result = runner(safePath(executable), [cli, '--version'], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', VSCODE_DEV: '' } })
  if (result.error || result.status !== 0) return null
  const version = String(result.stdout || '').trim().split(/\r?\n/)[0]
  if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version)) return null
  return { version, evidence: 'Code.exe + CLI selected by bin/code.cmd --version (shell:false)', executable, cli }
}

function issue(report, code, message) { report.issues.push({ code, message }) }

function artifact(report, directory, manifestFile, origin) {
  const file = path.join(directory, manifestFile)
  if (!fs.existsSync(file)) return
  try {
    const manifest = readJSON(file)
    if (manifest.name !== 'equipo-dev') return
    report.artifacts.push({ path: directory, version: manifest.version ?? null, sha256: sha256(fs.readFileSync(safePath(file))), origin })
    if (manifest.version !== report.sourceVersion) issue(report, 'version-mismatch', `${origin}: ${manifest.version ?? 'unknown'}; fuente ${report.sourceVersion}`)
  } catch { issue(report, 'invalid-package', `No se pudo comprobar el manifiesto de ${origin}.`) }
}

function inspectFiles(report, root, home, runner) {
  const manifestFile = report.host === 'claude-code' ? '.claude-plugin/plugin.json' : 'plugin.json'
  artifact(report, path.join(root, 'dist', report.host, 'equipo-dev'), manifestFile, 'generated')
  if (report.host === 'claude-code') {
    artifact(report, path.join(home, '.claude/plugins/equipo-dev'), '.claude-plugin/plugin.json', 'legacy-manual')
    const extensions = path.join(home, '.vscode/extensions')
    if (fs.existsSync(extensions)) {
      for (const name of fs.readdirSync(safePath(extensions)).filter(name => /^anthropic\.claude-code-[\d.]+/.test(name))) {
        try { const pkg = readJSON(path.join(extensions, name, 'package.json')); report.clientVersion.extensions.push({ id: 'anthropic.claude-code', version: pkg.version }) } catch { /* Missing extension manifest is not runtime evidence. */ }
      }
    }
  } else {
    artifact(report, path.join(home, '.vscode/agent-plugins/github.com/GeboArtDev/equipo-dev'), '.claude-plugin/plugin.json', 'legacy-vscode-cache')
    try {
      const client = vscodeVersion(home, runner)
      if (client) { report.clientVersion.vscode = client.version; report.clientEvidence = client }
    } catch { issue(report, 'client-missing', 'Versión VS Code no verificable desde su lanzador activo.') }
  }
}

function command(runner, args) {
  const result = runner('claude', args)
  if (result.error?.code === 'ENOENT') throw error('client-missing', 'Claude CLI no está disponible en PATH; instale o configure el cliente oficial.')
  if (result.error || result.status !== 0) throw error('command-failed', `Falló claude ${args.slice(0, 3).join(' ')}. Revise el gestor del cliente y reintente; no se revirtió ningún registro.`)
  return String(result.stdout || '')
}

function list(runner, args) {
  let value
  try { value = JSON.parse(command(runner, args)) } catch (e) { if (e.code) throw e; throw error('unsupported-client', 'El cliente no devolvió el inventario JSON esperado.') }
  if (!Array.isArray(value)) throw error('unsupported-client', 'Formato de inventario no compatible; actualice el cliente.')
  return value
}

function registrations(items) {
  return items.filter(item => typeof item.id === 'string' && (item.id === 'equipo-dev' || item.id.startsWith('equipo-dev@'))).map(item => ({
    id: item.id, scope: item.scope ?? null, origin: item.id.split('@')[1] || 'unknown', enabled: typeof item.enabled === 'boolean' ? item.enabled : null,
    version: item.version ?? null, evidence: 'claude plugin list --json'
  }))
}

function capabilities(runner, operation) {
  const requirements = [
    [['plugin', 'list', '--help'], ['--json']],
    [['plugin', 'marketplace', 'list', '--help'], ['--json']]
  ]
  if (operation !== 'diagnose') requirements.push(
    [['plugin', 'validate', '--help'], ['<path>']],
    [['plugin', 'marketplace', 'add', '--help'], ['--scope']],
    [['plugin', 'install', '--help'], ['--scope']],
    [['plugin', 'update', '--help'], ['--scope']],
    [['plugin', 'marketplace', 'update', '--help'], ['Usage:']]
  )
  for (const [args, tokens] of requirements) {
    let text
    try { text = command(runner, args) } catch { throw error('unsupported-client', `Cliente sin capacidad ${args.slice(0, -1).join(' ')}; actualice Claude.`) }
    if (tokens.some(token => !text.includes(token))) throw error('unsupported-client', 'Opciones requeridas no disponibles; actualice Claude.')
  }
}

export function manageHost({ root = ROOT, home = os.homedir(), host, operation = 'diagnose', runner = execute, prepare } = {}) {
  const report = { schemaVersion: 1, host, operation, status: 'prepared', exitCode: 0, clientVersion: { cli: null, extensions: [], vscode: null }, sourceVersion: null, artifacts: [], registrations: [], loaded: { status: 'unknown', version: null, evidence: null, date: null }, issues: [], nextSteps: [], completedSteps: [] }
  try {
    if (!HOSTS.includes(host) || !['diagnose', 'install', 'update'].includes(operation)) throw error('invalid-package', 'Uso: host-plugins.mjs <diagnose|install|update> --host <claude-code|vscode-agent> [--json]')
    report.sourceVersion = readJSON(path.join(root, 'src/manifest.json')).version
    inspectFiles(report, root, home, runner)
    if (host === 'vscode-agent') {
      if (operation !== 'diagnose') { if (!prepare) throw error('invalid-package', 'Falta preparación del paquete.'); prepare(host); report.completedSteps.push('prepared'); report.artifacts = []; inspectFiles(report, root, home, runner) }
      report.status = 'manual-action-required'; report.exitCode = 2
      report.settings = { 'chat.pluginLocations': { [path.join(root, 'dist/vscode-agent/equipo-dev')]: true } }
      report.nextSteps.push('En VS Code identifique Equipo Dev y su origen en Agent Customizations/Agent Plugins (o /plugin del harness). Resuelva la copia antigua desde el mismo gestor antes de activar otra; no edite la caché.', 'Integre la entrada chat.pluginLocations mostrada en Settings JSON, conservando entradas existentes. Esta ubicación local requiere reconstrucción para actualizar.', 'Recargue ventana o abra sesión nueva; compruebe versión/origen, cinco skills, siete agentes, dev-report y reconocimiento de fix. No hay panel TSX en este host.')
    } else {
      report.clientVersion.cli = command(runner, ['--version']).trim().split('\n')[0]
      capabilities(runner, operation)
      const markets = list(runner, ['plugin', 'marketplace', 'list', '--json'])
      report.registrations = registrations(list(runner, ['plugin', 'list', '--json']))
      report.completedSteps.push('diagnosed')
      const conflicts = report.registrations.filter(item => item.enabled !== false && (item.id !== ID || item.scope !== 'user'))
      if (conflicts.length) throw error('origin-conflict', 'Otro origen o alcance de Equipo Dev está activo. Mantenga/actualice synced desde su cuenta, o deshabilítelo en el gestor Claude antes de instalar el origen local. Si una política lo exige, consulte al administrador.')
      const own = report.registrations.filter(item => item.id === ID && item.scope === 'user')
      if (own.length > 1) throw error('origin-conflict', 'Registros locales duplicados; resuélvalos desde el gestor Claude.')
      if (own[0]?.enabled === false) throw error('origin-conflict', 'El origen local está deshabilitado; revise su intención en el gestor Claude. No se habilitará automáticamente.')
      const market = markets.filter(item => item.name === MARKET)
      const marketPath = checkedPath(path.join(root, 'dist/marketplace'), path.join(root, 'dist'))
      if (market.length > 1) throw error('path-conflict', 'Marketplace local duplicado; resuélvalo desde Claude.')
      if (market[0]) {
        const source = market[0].path || market[0].installLocation || (typeof market[0].source === 'string' && path.isAbsolute(market[0].source) ? market[0].source : market[0].source?.path)
        if (!source || !path.isAbsolute(source) || path.resolve(source).toLowerCase() !== marketPath.toLowerCase()) throw error('path-conflict', 'El marketplace equipo-dev-local apunta a otro origen o no se pudo comprobar su ruta. No se reemplazó.')
      }
      if (operation !== 'diagnose') {
        if (!prepare) throw error('invalid-package', 'Falta preparación del paquete.')
        prepare(host); report.completedSteps.push('prepared')
        report.artifacts = []; inspectFiles(report, root, home, runner)
        try { command(runner, ['plugin', 'validate', marketPath]) } catch { throw error('invalid-package', 'Claude rechazó el marketplace; valide el artefacto antes de instalar.') }
        report.completedSteps.push('validated')
        if (!market[0]) { command(runner, ['plugin', 'marketplace', 'add', marketPath, '--scope', 'user']); report.completedSteps.push('marketplace-added') }
        if (!own.length) { command(runner, ['plugin', 'install', ID, '--scope', 'user']); report.completedSteps.push('plugin-installed'); report.status = 'registered' }
        else if (operation === 'update' || own[0].version !== report.sourceVersion) {
          command(runner, ['plugin', 'marketplace', 'update', MARKET]); report.completedSteps.push('marketplace-updated')
          command(runner, ['plugin', 'update', ID, '--scope', 'user']); report.completedSteps.push('plugin-updated'); report.status = 'updated'
        } else report.status = 'unchanged'
        report.registrations = registrations(list(runner, ['plugin', 'list', '--json']))
        const installed = report.registrations.filter(item => item.id === ID && item.scope === 'user')
        if (installed.length !== 1 || installed[0].version !== report.sourceVersion || installed[0].enabled !== true) throw error('command-failed', 'El inventario posterior no confirma versión, alcance y habilitación esperados; revise /plugins y reintente.')
        report.completedSteps.push('registration-verified')
      }
      report.nextSteps.push('En la extensión oficial Claude use /plugins para comprobar origen y versión; ejecute /reload-plugins o abra una sesión nueva.', 'Compruebe dev-report, reconocimiento de fix, cinco skills y siete roles. El registro CLI no demuestra carga en una conversación; valide el panel por separado.')
    }
    issue(report, 'verification-pending', 'La carga y el uso dentro del cliente siguen pendientes de comprobación.')
  } catch (e) {
    const prefix = String(e.message).split(':')[0]
    const code = e.code || (['path-conflict', 'invalid-package'].includes(prefix) ? prefix : 'command-failed')
    report.status = ['origin-conflict', 'path-conflict'].includes(code) ? 'manual-action-required' : 'failed'
    report.exitCode = report.status === 'manual-action-required' ? 2 : 1
    issue(report, code, e.code || code === 'path-conflict' ? e.message : 'No se completó la operación. Revise el paquete y los permisos; reintente sin editar cachés.')
    report.nextSteps.push('Conserve la instalación y archivos actuales. Resuelva el problema indicado desde el gestor correspondiente y repita diagnose antes de install/update.')
  }
  return report
}

export function printReport(report, asJSON = false) {
  if (asJSON) { console.log(JSON.stringify(report, null, 2)); return }
  console.log(`[${report.host}] ${report.status}; fuente ${report.sourceVersion}; carga ${report.loaded.status}`)
  for (const item of report.registrations) console.log(`  ${item.id} ${item.version} (${item.scope}, enabled=${item.enabled})`)
  for (const item of report.issues) console.log(`  ${item.code}: ${item.message}`)
  if (report.settings) console.log(JSON.stringify(report.settings, null, 2))
  for (const step of report.nextSteps) console.log(`  ${step}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.includes('--help')) { console.log('node scripts/host-plugins.mjs <diagnose|install|update> --host <claude-code|vscode-agent> [--json]'); process.exit(0) }
  const { parseFrontmatter } = await import('./frontmatter.mjs')
  const { buildHost } = await import('./plugin-artifacts.mjs')
  const report = manageHost({ host: args[args.indexOf('--host') + 1], operation: args[0], prepare: host => buildHost(ROOT, host, parseFrontmatter) })
  printReport(report, args.includes('--json'))
  process.exitCode = report.exitCode
}
