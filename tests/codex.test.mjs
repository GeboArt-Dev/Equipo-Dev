import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { runBuild } from '../scripts/build.mjs'
import { installCodex, recoverCodex, validateManifest, safePath } from '../scripts/codex.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'dist/codex/equipo-dev')
const sha = data => createHash('sha256').update(data).digest('hex')
const readManifest = dir => JSON.parse(fs.readFileSync(path.join(dir, 'package-manifest.json'), 'utf8'))
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'equipo-dev-codex-'))
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }))
  const pkg = path.join(temp, 'package'), base = path.join(temp, 'skills')
  fs.cpSync(out, pkg, { recursive: true })
  return { temp, pkg, base }
}
function update(pkg, edit) {
  const manifest = readManifest(pkg)
  edit(manifest)
  fs.writeFileSync(path.join(pkg, 'package-manifest.json'), JSON.stringify(manifest))
}
const entryPath = 'equipo-dev-feature/SKILL.md'
function change(pkg) {
  fs.appendFileSync(path.join(pkg, 'skills', entryPath), '\nActualización de prueba.\n')
  update(pkg, m => { m.version = '99.0.0'; m.files.find(e => e.path === entryPath).sha256 = sha(fs.readFileSync(path.join(pkg, 'skills', entryPath))) })
}

test('Codex: generación determinista, 4 skills y 7 recursos trazables', () => {
  runBuild({ target: 'codex' })
  const first = fs.readFileSync(path.join(out, 'package-manifest.json'))
  const manifest = readManifest(out)
  assert.equal(manifest.files.length, 11)
  assert.equal(manifest.sources.roles.length, 7)
  for (const entry of manifest.files) {
    const data = fs.readFileSync(path.join(out, 'skills', entry.path), 'utf8')
    assert.equal(sha(data), entry.sha256)
    assert.doesNotMatch(data, /\{\{|^model:|^tools:|^model_tier:|^color:/m)
    if (entry.path.includes('/agents/')) assert.match(data, /Fuente: src\/agents\//)
  }
  fs.writeFileSync(path.join(out, 'stale.txt'), 'stale')
  runBuild({ target: 'codex' })
  assert.deepEqual(fs.readFileSync(path.join(out, 'package-manifest.json')), first)
  assert.equal(fs.existsSync(path.join(out, 'stale.txt')), false)
  const feature = fs.readFileSync(path.join(out, 'skills', entryPath), 'utf8')
  assert.match(feature, /pausa antes del rol/)
  assert.match(feature, /Detente y espera aprobación/)
  const ux = fs.readFileSync(path.join(out, 'skills/equipo-dev-feature/references/agents/ux-designer.md'), 'utf8')
  assert.match(ux, /Si falta la skill o Python/)
  const report = fs.readFileSync(path.join(out, 'skills/equipo-dev-team-report/SKILL.md'), 'utf8')
  assert.match(report, /existente no acredita aprobación/)
})

test('instalación, repetición sin escrituras y preservación de ajenos', t => {
  const { base, pkg } = fixture(t)
  const first = installCodex(pkg, base)
  assert.equal(first.created, 11)
  const file = path.join(base, entryPath), mtime = fs.statSync(file).mtimeMs
  fs.writeFileSync(path.join(base, 'equipo-dev-feature/personal.txt'), 'personal')
  fs.writeFileSync(path.join(base, 'config.toml'), 'ajeno')
  assert.equal(installCodex(pkg, base).unchanged, 11)
  assert.equal(fs.statSync(file).mtimeMs, mtime)
  assert.equal(fs.readFileSync(path.join(base, 'config.toml'), 'utf8'), 'ajeno')
  assert.equal(fs.readFileSync(path.join(base, 'equipo-dev-feature/personal.txt'), 'utf8'), 'personal')
})

test('actualización retira recurso obsoleto y restaura administrado ausente', t => {
  const { base, pkg } = fixture(t)
  installCodex(pkg, base)
  const removed = 'equipo-dev-feature/references/agents/architect.md'
  update(pkg, m => { m.files = m.files.filter(e => e.path !== removed); m.version = '2.0.0' })
  fs.unlinkSync(path.join(base, entryPath))
  const result = installCodex(pkg, base)
  assert.equal(result.removed, 1)
  assert.equal(result.created, 1)
  assert.equal(fs.existsSync(path.join(base, removed)), false)
  assert.ok(fs.existsSync(path.join(base, entryPath)))
})

test('preflight rechaza modificación local incluso recurso obsoleto sin cambios parciales', t => {
  const { base, pkg } = fixture(t)
  installCodex(pkg, base)
  const before = fs.readFileSync(path.join(base, '.equipo-dev-install/manifest.json'))
  fs.appendFileSync(path.join(base, entryPath), 'personal')
  update(pkg, m => { m.files = m.files.filter(e => e.path !== entryPath) })
  assert.throws(() => installCodex(pkg, base), /CODEX_CONFLICT/)
  assert.deepEqual(fs.readFileSync(path.join(base, '.equipo-dev-install/manifest.json')), before)
  assert.match(fs.readFileSync(path.join(base, entryPath), 'utf8'), /personal$/)
})

test('no adopta archivo sin registro aunque tenga contenido idéntico', t => {
  const { base, pkg } = fixture(t)
  fs.mkdirSync(path.join(base, 'equipo-dev-feature'), { recursive: true })
  fs.copyFileSync(path.join(pkg, 'skills', entryPath), path.join(base, entryPath))
  assert.throws(() => installCodex(pkg, base), /CODEX_CONFLICT/)
  assert.equal(fs.existsSync(path.join(base, 'equipo-dev-team-rules')), false)
})

test('manifiestos: traversal, ADS, reservados, case collision, esquema y ámbito', () => {
  const manifest = readManifest(out)
  for (const bad of ['../outside', 'equipo-dev-feature/../x', 'equipo-dev-feature/a:b', 'equipo-dev-feature/CON.txt', 'otro/SKILL.md', '/absolute', 'equipo-dev-feature/a\\b', 'equipo-dev-feature/a.']) {
    assert.throws(() => validateManifest({ ...manifest, files: [{ path: bad, sha256: 'a'.repeat(64) }] }), /CODEX_PATH_UNSAFE/)
  }
  assert.throws(() => validateManifest({ ...manifest, files: [manifest.files[0], { ...manifest.files[0], path: manifest.files[0].path.replace('SKILL', 'skill') }] }), /CODEX_CONFLICT/)
  assert.throws(() => validateManifest({ ...manifest, schemaVersion: 99 }), /CODEX_CONFLICT/)
  assert.throws(() => installCodex(out, root), /CODEX_PATH_UNSAFE/)
})

test('manifiesto instalado inválido no autoriza rutas ajenas', t => {
  const { base, pkg } = fixture(t)
  installCodex(pkg, base)
  const file = path.join(base, '.equipo-dev-install/manifest.json')
  const manifest = JSON.parse(fs.readFileSync(file))
  manifest.files.push({ path: 'foreign/SKILL.md', sha256: 'a'.repeat(64) })
  fs.writeFileSync(file, JSON.stringify(manifest))
  assert.throws(() => installCodex(pkg, base), /CODEX_PATH_UNSAFE/)
})

test('rechaza junction en destino y en origen', t => {
  const { base, pkg, temp } = fixture(t)
  const elsewhere = path.join(temp, 'elsewhere')
  fs.mkdirSync(elsewhere); fs.mkdirSync(base)
  const link = path.join(base, 'equipo-dev-feature')
  try { fs.symlinkSync(elsewhere, link, 'junction') } catch (e) { if (['EPERM', 'EACCES'].includes(e.code)) { t.skip(`Sin privilegios de enlace: ${e.code}`); return } throw e }
  assert.throws(() => installCodex(pkg, base), /CODEX_PATH_UNSAFE/)
  assert.deepEqual(fs.readdirSync(elsewhere), [])
  assert.throws(() => safePath(path.join(link, 'SKILL.md')), /CODEX_PATH_UNSAFE/)
  const linkedPackage = path.join(temp, 'linked-package')
  fs.symlinkSync(pkg, linkedPackage, 'junction')
  assert.throws(() => installCodex(linkedPackage, path.join(temp, 'other-skills')), /CODEX_PATH_UNSAFE/)
})

test('fallo inyectado durante reemplazo revierte archivos y manifiesto', t => {
  const { base, pkg } = fixture(t)
  installCodex(pkg, base)
  const before = fs.readFileSync(path.join(base, entryPath))
  const manifest = fs.readFileSync(path.join(base, '.equipo-dev-install/manifest.json'))
  change(pkg)
  update(pkg, m => { m.files = m.files.filter(e => !e.path.endsWith('/architect.md')) })
  assert.throws(() => installCodex(pkg, base, { beforeOperation(i) { if (i === 1) { const e = new Error('denied'); e.code = 'EACCES'; throw e } } }), /CODEX_PERMISSION/)
  assert.deepEqual(fs.readFileSync(path.join(base, entryPath)), before)
  assert.deepEqual(fs.readFileSync(path.join(base, '.equipo-dev-install/manifest.json')), manifest)
  assert.equal(fs.existsSync(path.join(base, '.equipo-dev-install/journal.json')), false)
  assert.equal(fs.existsSync(path.join(base, '.equipo-dev-install/lock')), false)
})

test('rollback no pisa cambios posteriores; journal bloquea y recuperación compara hashes', t => {
  const { base, pkg } = fixture(t)
  installCodex(pkg, base)
  change(pkg)
  update(pkg, m => { m.files = m.files.filter(e => !e.path.endsWith('/architect.md')) })
  assert.throws(() => installCodex(pkg, base, { beforeOperation(i) { if (i === 1) { fs.writeFileSync(path.join(base, entryPath), 'cambio externo'); throw new Error('fallo') } } }), /CODEX_INSTALL_INCOMPLETE/)
  assert.equal(fs.readFileSync(path.join(base, entryPath), 'utf8'), 'cambio externo')
  assert.throws(() => installCodex(pkg, base), /CODEX_INSTALL_INCOMPLETE/)
  assert.throws(() => recoverCodex(base), /CODEX_CONFLICT/)
  fs.copyFileSync(path.join(pkg, 'skills', entryPath), path.join(base, entryPath))
  recoverCodex(base)
  assert.equal(fs.existsSync(path.join(base, '.equipo-dev-install/journal.json')), false)
  assert.equal(fs.existsSync(path.join(base, '.equipo-dev-install/lock')), false)
})

test('lock existente detiene instalación', t => {
  const { base, pkg } = fixture(t)
  fs.mkdirSync(path.join(base, '.equipo-dev-install'), { recursive: true })
  fs.writeFileSync(path.join(base, '.equipo-dev-install/lock'), 'activo')
  assert.throws(() => installCodex(pkg, base), /CODEX_INSTALL_BUSY/)
  assert.equal(fs.readFileSync(path.join(base, '.equipo-dev-install/lock'), 'utf8'), 'activo')
})

test('fallo durante staging limpia recuperación sin bloquear reinstalación', t => {
  const { base, pkg } = fixture(t)
  installCodex(pkg, base)
  change(pkg)
  const before = fs.readFileSync(path.join(base, entryPath))
  assert.throws(() => installCodex(pkg, base, { beforeStage() { const e = new Error('staging denied'); e.code = 'EPERM'; throw e } }), /CODEX_PERMISSION/)
  assert.deepEqual(fs.readFileSync(path.join(base, entryPath)), before)
  assert.deepEqual(fs.readdirSync(path.join(base, '.equipo-dev-install')), ['manifest.json'])
  assert.equal(installCodex(pkg, base).updated, 1)
})

test('metadatos ajenos preservados y paquete alterado rechazado antes del destino', t => {
  const { base, pkg } = fixture(t)
  fs.mkdirSync(path.join(base, '.equipo-dev-install'), { recursive: true })
  fs.writeFileSync(path.join(base, '.equipo-dev-install/personal'), 'ajeno')
  assert.throws(() => installCodex(pkg, base), /CODEX_CONFLICT/)
  assert.deepEqual(fs.readdirSync(path.join(base, '.equipo-dev-install')), ['personal'])
  fs.appendFileSync(path.join(pkg, 'skills', entryPath), 'alterado')
  assert.throws(() => installCodex(pkg, base), /CODEX_SOURCE_INVALID/)
})
