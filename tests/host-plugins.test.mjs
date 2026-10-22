import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { buildHost, packageHost, treeFiles, sha256 } from '../scripts/plugin-artifacts.mjs'
import { parseFrontmatter } from '../scripts/frontmatter.mjs'
import { manageHost } from '../scripts/host-plugins.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'equipo host spaces '))
  for (const name of ['src', 'platforms']) fs.cpSync(path.join(ROOT, name), path.join(root, name), { recursive: true })
  const home = path.join(root, 'user profile')
  fs.mkdirSync(home)
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return { root, home, prepare: host => buildHost(root, host, parseFrontmatter) }
}
function client(root, initial = []) {
  const state = { registrations: initial, markets: [], calls: [], fail: null }
  state.runner = (command, args) => {
    assert.equal(command, 'claude')
    state.calls.push(args)
    const key = args.join(' ')
    if (state.fail?.(args)) return { status: 1, stderr: 'sensitive details not to print' }
    let stdout = ''
    if (args.includes('--help')) stdout = 'Usage: <path> --scope --json'
    else if (key === '--version') stdout = '2.1.296 (Claude Code)'
    else if (key === 'plugin list --json') stdout = JSON.stringify(state.registrations)
    else if (key === 'plugin marketplace list --json') stdout = JSON.stringify(state.markets)
    else if (key.startsWith('plugin marketplace add')) state.markets.push({ name: 'equipo-dev-local', source: { source: 'directory', path: args[3] } })
    else if (key.startsWith('plugin install ')) state.registrations.push({ id: args[2], version: JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'))).version, enabled: true, scope: 'user' })
    else if (key.startsWith('plugin update ')) state.registrations.find(item => item.id === args[2]).version = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'))).version
    return { status: 0, stdout }
  }
  return state
}
function run(f, c, operation = 'install', host = 'claude-code') { return manageHost({ ...f, runner: c.runner, operation, host }) }

test('Claude installation uses marketplace commands, spaces stay one argument, repeat is idempotent', t => {
  const f = fixture(t), c = client(f.root)
  const first = run(f, c)
  assert.equal(first.status, 'registered')
  assert.equal(first.exitCode, 0)
  assert.equal(first.loaded.status, 'unknown')
  assert.deepEqual(c.calls.find(args => args[2] === 'add' && !args.includes('--help')), ['plugin', 'marketplace', 'add', path.join(f.root, 'dist/marketplace'), '--scope', 'user'])
  const second = run(f, c)
  assert.equal(second.status, 'unchanged')
  assert.equal(c.calls.filter(args => args[1] === 'install' && !args.includes('--help')).length, 1)
  assert.equal(c.markets.length, 1)
  assert.deepEqual(fs.readdirSync(f.home), [])
})

test('update refreshes only own catalog then own package and verifies registration', t => {
  const f = fixture(t), c = client(f.root, [{ id: 'equipo-dev@equipo-dev-local', version: '0.4.1', scope: 'user', enabled: true }])
  c.markets.push({ name: 'equipo-dev-local', source: { path: path.join(f.root, 'dist/marketplace') } })
  const result = run(f, c, 'update')
  assert.equal(result.status, 'updated')
  const updates = c.calls.filter(args => args.includes('update') && !args.includes('--help'))
  assert.deepEqual(updates, [['plugin', 'marketplace', 'update', 'equipo-dev-local'], ['plugin', 'update', 'equipo-dev@equipo-dev-local', '--scope', 'user']])
  assert.equal(result.registrations[0].version, result.sourceVersion)
})

test('synced 0.6.0 conflicts before preparation or mutating commands; only Equipo Dev is disclosed', t => {
  const f = fixture(t), c = client(f.root, [{ id: 'equipo-dev@synced', scope: 'synced', enabled: true, version: '0.6.0', token: 'private' }, { id: 'other@private', token: 'secret' }])
  const result = run({ ...f, prepare: () => assert.fail('must not prepare') }, c)
  assert.equal(result.exitCode, 2)
  assert.ok(result.issues.some(item => item.code === 'origin-conflict'))
  assert.equal(result.registrations.length, 1)
  assert.ok(!JSON.stringify(result).includes('private'))
  assert.ok(!c.calls.some(args => ['add', 'install', 'update', 'disable', 'uninstall'].includes(args[1]) && !args.includes('--help')))
})

test('disabled synced origin permits intentional local install without enabling or deleting synced', t => {
  const f = fixture(t), c = client(f.root, [{ id: 'equipo-dev@synced', scope: 'synced', enabled: false, version: '0.6.0' }])
  assert.equal(run(f, c).status, 'registered')
  assert.equal(c.registrations[0].enabled, false)
})

test('another marketplace path is preserved and rejected', t => {
  const f = fixture(t), c = client(f.root)
  c.markets.push({ name: 'equipo-dev-local', source: { path: path.join(f.root, 'other') } })
  assert.ok(run(f, c).issues.some(item => item.code === 'path-conflict'))
  assert.ok(!fs.existsSync(path.join(f.root, 'dist')))
})

test('partial failure preserves marketplace and permits an idempotent retry', t => {
  const f = fixture(t), c = client(f.root)
  c.fail = args => args[1] === 'install' && !args.includes('--help')
  const failed = run(f, c)
  assert.equal(failed.exitCode, 1)
  assert.ok(failed.completedSteps.includes('marketplace-added'))
  assert.ok(!JSON.stringify(failed).includes('sensitive'))
  assert.equal(c.markets.length, 1)
  c.fail = null
  assert.equal(run(f, c).status, 'registered')
  assert.equal(c.calls.filter(args => args[2] === 'add' && !args.includes('--help')).length, 1)
})

test('missing client and incompatible client fail before writes', t => {
  const f = fixture(t)
  const missing = manageHost({ ...f, host: 'claude-code', runner: () => ({ error: { code: 'ENOENT' } }) })
  assert.equal(missing.issues[0].code, 'client-missing')
  const incompatible = manageHost({ ...f, host: 'claude-code', runner: () => ({ status: 0, stdout: 'old client' }) })
  assert.equal(incompatible.issues[0].code, 'unsupported-client')
  assert.ok(!fs.existsSync(path.join(f.root, 'dist')))
})

test('VS Code prepares a native artifact and prints mergeable Settings without mutating profile', t => {
  const f = fixture(t), c = client(f.root)
  const result = run(f, c, 'install', 'vscode-agent')
  assert.equal(result.exitCode, 2)
  assert.equal(result.status, 'manual-action-required')
  assert.equal(result.loaded.status, 'unknown')
  assert.equal(result.settings['chat.pluginLocations'][path.join(f.root, 'dist/vscode-agent/equipo-dev')], true)
  assert.equal(c.calls.length, 0)
  assert.deepEqual(fs.readdirSync(f.home), [])
})

test('diagnose is read only, observes legacy 0.4.1 without inventing a registration', t => {
  const f = fixture(t), c = client(f.root)
  const legacy = path.join(f.home, '.vscode/agent-plugins/github.com/GeboArtDev/equipo-dev/.claude-plugin')
  fs.mkdirSync(legacy, { recursive: true })
  fs.writeFileSync(path.join(legacy, 'plugin.json'), JSON.stringify({ name: 'equipo-dev', version: '0.4.1' }))
  const before = fs.readFileSync(path.join(legacy, 'plugin.json'))
  const result = run(f, c, 'diagnose', 'vscode-agent')
  assert.equal(result.artifacts[0].version, '0.4.1')
  assert.equal(result.registrations.length, 0)
  assert.deepEqual(fs.readFileSync(path.join(legacy, 'plugin.json')), before)
  assert.ok(!fs.existsSync(path.join(f.root, 'dist')))
})

test('native packages contain five normalized skills/seven agents and separate host capabilities', t => {
  const f = fixture(t)
  for (const host of ['claude-code', 'vscode-agent']) {
    const directory = f.prepare(host)
    assert.deepEqual(fs.readdirSync(path.join(directory, 'skills')).sort(), ['feature', 'fix', 'team-report', 'team-reset', 'team-rules'])
    for (const name of fs.readdirSync(path.join(directory, 'skills'))) assert.equal(parseFrontmatter(fs.readFileSync(path.join(directory, 'skills', name, 'SKILL.md'), 'utf8')).attributes.name, name)
    assert.equal(fs.readdirSync(path.join(directory, host === 'claude-code' ? 'agents' : 'com.github.copilot/agents')).length, 7)
    assert.equal(fs.existsSync(path.join(directory, 'hooks/register.tsx')), host === 'claude-code')
    if (host === 'vscode-agent') for (const [name, content] of treeFiles(path.join(directory, 'com.github.copilot/agents'))) assert.ok(!String(content).includes('model:'), name)
  }
  const marketplace = JSON.parse(fs.readFileSync(path.join(f.root, 'dist/marketplace/.claude-plugin/marketplace.json')))
  assert.equal(marketplace.plugins[0].source, './plugins/equipo-dev')
})

test('modified generated files and unknown files are preserved with conflict', t => {
  const f = fixture(t), directory = f.prepare('claude-code')
  const file = path.join(directory, 'skills/feature/SKILL.md')
  fs.appendFileSync(file, '\nPersonal change')
  assert.throws(() => f.prepare('claude-code'), /path-conflict/)
  assert.match(fs.readFileSync(file, 'utf8'), /Personal change/)
  const vscode = f.prepare('vscode-agent')
  fs.writeFileSync(path.join(vscode, 'custom.txt'), 'personal')
  assert.throws(() => f.prepare('vscode-agent'), /path-conflict/)
  assert.equal(fs.readFileSync(path.join(vscode, 'custom.txt'), 'utf8'), 'personal')
})

test('managed obsolete skill is removed through a clean generated tree', t => {
  const f = fixture(t)
  const old = path.join(f.root, 'src/skills/old')
  fs.mkdirSync(old)
  fs.writeFileSync(path.join(old, 'SKILL.md'), '---\nname: old\ndescription: legacy\n---\nOld')
  const directory = f.prepare('claude-code')
  fs.rmSync(old, { recursive: true })
  f.prepare('claude-code')
  assert.ok(!fs.existsSync(path.join(directory, 'skills/old')))
})

test('duplicate names reject before replacing prior valid artifacts', t => {
  const f = fixture(t), directory = f.prepare('claude-code')
  const before = sha256(fs.readFileSync(path.join(directory, '.equipo-dev-build.json')))
  fs.cpSync(path.join(f.root, 'src/skills/feature'), path.join(f.root, 'src/skills/duplicate'), { recursive: true })
  assert.throws(() => f.prepare('claude-code'), /duplicate skill/)
  assert.equal(sha256(fs.readFileSync(path.join(directory, '.equipo-dev-build.json'))), before)
})

test('junction/reparse output is refused before writes outside distribution', t => {
  const f = fixture(t)
  const outside = path.join(f.root, 'outside')
  fs.mkdirSync(outside)
  fs.mkdirSync(path.join(f.root, 'dist'))
  fs.symlinkSync(outside, path.join(f.root, 'dist/vscode-agent'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => f.prepare('vscode-agent'), /path-conflict/)
  assert.deepEqual(fs.readdirSync(outside), [])
})

test('ZIP is deterministic, carries hidden metadata and is extractable', t => {
  const f = fixture(t), directory = f.prepare('claude-code')
  const zip = path.join(f.root, 'dist/package.zip')
  packageHost(directory, zip)
  const before = sha256(fs.readFileSync(zip))
  packageHost(directory, zip)
  assert.equal(sha256(fs.readFileSync(zip)), before)
  assert.match(fs.readFileSync(zip + '.sha256', 'utf8'), new RegExp(before))
  const inventory = spawnSync('tar', ['-tf', zip], { encoding: 'utf8' })
  assert.equal(inventory.status, 0, inventory.stderr)
  assert.match(inventory.stdout, /\.claude-plugin\/plugin.json/)
  assert.match(inventory.stdout, /\.equipo-dev-build.json/)
  assert.doesNotMatch(inventory.stdout, /^manifest.json$/m)
})
