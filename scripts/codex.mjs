import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'

export const SKILLS = { feature: 'equipo-dev-feature', 'reglas-equipo': 'equipo-dev-team-rules', 'team-report': 'equipo-dev-team-report', 'equipo-reiniciar': 'equipo-dev-team-reset' }
export const ROLES = ['architect', 'backend-dev', 'code-reviewer', 'frontend-dev', 'product-owner', 'qa-engineer', 'ux-designer']
const PACKAGE = 'equipo-dev-codex'
const META = '.equipo-dev-install'
const hash = data => createHash('sha256').update(data).digest('hex')
const fail = (code, file, action = 'Revise la ruta y restaure la fuente antes de reintentar.') => { throw new Error(`${code}: ${file}. ${action}`) }
const exists = file => { try { fs.lstatSync(file); return true } catch (e) { if (e.code === 'ENOENT') return false; throw e } }
const inside = (child, base) => { const rel = path.relative(base, child); return rel && !rel.startsWith('..') && !path.isAbsolute(rel) }

export function safePath(file) {
  const absolute = path.resolve(file)
  let current = path.parse(absolute).root
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part)
    if (exists(current)) {
      if (fs.lstatSync(current).isSymbolicLink() || path.resolve(fs.realpathSync(current)).toLowerCase() !== current.toLowerCase()) fail('CODEX_PATH_UNSAFE', current)
    }
  }
  return absolute
}

function relativeFile(file) {
  if (typeof file !== 'string' || !file || file.includes('\\') || file.split('/').some(s => !s || s === '.' || s === '..' || /[<>:"|?*\x00-\x1f]/.test(s) || /[. ]$/.test(s) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s))) fail('CODEX_PATH_UNSAFE', String(file))
  if (!Object.values(SKILLS).includes(file.split('/')[0]) || file.split('/').length < 2) fail('CODEX_PATH_UNSAFE', file)
}

export function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || manifest.packageId !== PACKAGE || typeof manifest.version !== 'string' || !Array.isArray(manifest.files)) fail('CODEX_CONFLICT', 'manifest.json', 'Registro inválido; conserve una copia y revise su procedencia.')
  const seen = new Set()
  for (const entry of manifest.files) {
    relativeFile(entry.path)
    if (!/^[a-f0-9]{64}$/.test(entry.sha256) || seen.has(entry.path.toLowerCase())) fail('CODEX_CONFLICT', entry.path, 'Hash inválido o ruta duplicada en manifiesto.')
    seen.add(entry.path.toLowerCase())
  }
  return manifest
}

function json(file) { try { return JSON.parse(fs.readFileSync(safePath(file), 'utf8')) } catch (e) { if (e.message.startsWith('CODEX_')) throw e; fail('CODEX_CONFLICT', file, 'JSON inválido o ilegible; revise el registro antes de reintentar.') } }
function write(file, data) { safePath(file); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data) }
function digest(file) { safePath(file); if (!exists(file)) return null; if (!fs.lstatSync(file).isFile()) fail('CODEX_CONFLICT', file, 'El destino debe ser un archivo regular.'); return hash(fs.readFileSync(file)) }
function removeTree(file, base) { if (!inside(path.resolve(file), path.resolve(base))) fail('CODEX_PATH_UNSAFE', file); safePath(file); fs.rmSync(file, { recursive: true, force: true }) }
function pruneEmpty(file, base) {
  let dir = path.dirname(file)
  while (inside(dir, base)) {
    safePath(dir)
    if (!exists(dir) || fs.readdirSync(dir).length) break
    fs.rmdirSync(dir)
    dir = path.dirname(dir)
  }
}
function cleanTransaction(transaction, meta, operations) {
  const allowed = new Set(['manifest.bak', 'manifest.new', ...operations.flatMap(op => [op.backup, op.staged])])
  if (exists(transaction)) {
    for (const name of fs.readdirSync(transaction)) {
      const file = safePath(path.join(transaction, name))
      if (!allowed.has(name) || !fs.lstatSync(file).isFile()) fail('CODEX_INSTALL_INCOMPLETE', file, 'Recurso ajeno en recuperación: consérvelo fuera antes de continuar.')
    }
    removeTree(transaction, meta)
  }
}

export function buildCodex(root, parseFrontmatter) {
  try { return generateCodex(root, parseFrontmatter) } catch (error) {
    if (error.message.startsWith('CODEX_')) throw error
    fail(['EACCES', 'EPERM', 'EROFS'].includes(error.code) ? 'CODEX_PERMISSION' : 'CODEX_SOURCE_INVALID', error.path || 'fuentes Codex', 'Revise las fuentes y los permisos; genere de nuevo el paquete.')
  }
}

function generateCodex(root, parseFrontmatter) {
  const out = safePath(path.join(root, 'dist/codex/equipo-dev'))
  const files = new Map()
  const dispatch = 'Antes de cada etapa lee el recurso del rol en references/agents/<rol>.md. Usa la capacidad de delegación disponible y autorizada del host (por ejemplo collaboration.spawn_agent en sesiones que la exponen), pasando instrucciones completas del rol, raíz, entradas, alcance, restricciones y salida esperada. Hereda modelo y permisos; no inventes tipos de agentes registrados. Espera el resultado antes de pasos dependientes. Si no hay delegación, informa el bloqueo y pausa antes del rol; no simules subagentes ni ejecutes tú su trabajo. Ejecuta secuencialmente los roles dependientes.'
  const tokens = { '{{AGENT_GUIDE_FILE}}': '`AGENTS.md` y, cuando exista, `CLAUDE.md`', '{{CMD_TOOL}}': 'la herramienta de terminal disponible en la sesión', '{{SEARCH_TOOL}}': 'con la búsqueda de archivos y contenido disponible en la sesión', '{{SUBAGENT_DISPATCH_GUIDE}}': dispatch, '{{UX_SEARCH_LOCATION}}': '   - Busca ui-ux-pro-max en el catálogo de skills del host, lee sus instrucciones y resuelve search.py desde su ubicación. Requiere Python; no se instala automáticamente. Si falta la skill o Python, informa el bloqueo de UX y pausa esa etapa. Las features sin UI omiten UX.' }
  const transform = content => {
    for (const [a, b] of Object.entries(tokens)) content = content.replaceAll(a, b)
    if (/\{\{[^}]+\}\}/.test(content)) fail('CODEX_SOURCE_INVALID', 'token pendiente')
    return content.replace(/\r\n/g, '\n')
  }
  for (const [source, name] of Object.entries(SKILLS)) {
    const identity = name.slice('equipo-dev-'.length)
    const override = path.join(root, 'platforms/codex/skills', identity, 'SKILL.md')
    const file = exists(override) ? override : path.join(root, 'src/skills', source, 'SKILL.md')
    const { body, attributes } = parseFrontmatter(fs.readFileSync(safePath(file), 'utf8'))
    let text = transform(body)
    if (source === 'feature') {
      text = text.replace('`team-rules`', '[equipo-dev-team-rules](../equipo-dev-team-rules/SKILL.md)').replace('# Flujo /feature', '# Flujo Equipo Dev').replace('en `docs/specs/`,', '(incluyendo prefijos numéricos de ADR) en `docs/specs/`,')
      text += '\n## Recursos de roles\n' + ROLES.map(role => `- [${role}](references/agents/${role}.md)`).join('\n') + '\n'
    }
    files.set(`${name}/SKILL.md`, `---\nname: ${name}\ndescription: ${JSON.stringify(`Equipo Dev en Codex: selecciona explícitamente ${name}. ${attributes.description}`.replace(/\/feature|\/team-report/g, name))}\n---\n${text}`)
  }
  for (const role of ROLES) {
    const source = path.join(root, 'src/agents', `${role}.md`)
    const { body } = parseFrontmatter(fs.readFileSync(safePath(source), 'utf8'))
    files.set(`equipo-dev-feature/references/agents/${role}.md`, `# Rol: ${role}\n\nFuente: src/agents/${role}.md. Recurso de instrucciones; modelo, herramientas y permisos heredados del host.\n\n${transform(body)}`)
  }
  for (const [file, content] of files) {
    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(https?:|#)/.test(match[1])) continue
      const ref = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]))
      if (!files.has(ref)) fail('CODEX_SOURCE_INVALID', `${file}: ${match[1]}`, 'Corrija la referencia interna.')
    }
  }
  const manifest = validateManifest({ schemaVersion: 1, packageId: PACKAGE, version: json(path.join(root, 'src/manifest.json')).version, sources: { skills: SKILLS, roles: ROLES }, files: [...files].sort(([a], [b]) => a.localeCompare(b)).map(([file, data]) => ({ path: file, sha256: hash(data) })) })
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const stage = fs.mkdtempSync(path.join(path.dirname(out), '.codex-build-'))
  try {
    for (const [file, data] of files) write(path.join(stage, 'skills', file), data)
    for (const name of ['README.md', 'README.es.md', 'LICENSE']) fs.copyFileSync(safePath(path.join(root, name)), path.join(stage, name))
    write(path.join(stage, 'package-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    removeTree(out, path.join(root, 'dist'))
    fs.renameSync(stage, out)
  } finally { if (exists(stage)) removeTree(stage, path.join(root, 'dist')) }
  console.log(`[build] Target 'codex' completado en ${out}`)
  return out
}

function installationBase(override) {
  const base = path.resolve(override || path.join(os.homedir(), '.agents/skills'))
  if (override && !inside(base, path.resolve(os.tmpdir()))) fail('CODEX_PATH_UNSAFE', base, 'El override de tests debe estar dentro de un temporal.')
  return safePath(base)
}

export function installCodex(out, override, { beforeOperation, beforeStage } = {}) {
  let base, meta, locked = false, journal = null
  try {
    base = installationBase(override)
    safePath(out)
    const desired = validateManifest(json(path.join(out, 'package-manifest.json')))
    const payload = new Map()
    for (const entry of desired.files) {
      const source = safePath(path.join(out, 'skills', entry.path))
      const data = fs.readFileSync(source)
      if (hash(data) !== entry.sha256) fail('CODEX_SOURCE_INVALID', source, 'Genere de nuevo el paquete.')
      payload.set(entry.path, data)
    }
    meta = safePath(path.join(base, META))
    if (exists(meta)) {
      for (const name of fs.readdirSync(meta)) if (!['manifest.json', 'lock', 'journal.json', 'transaction'].includes(name)) fail('CODEX_CONFLICT', path.join(meta, name), 'Metadatos ajenos: consérvelos fuera del directorio reservado antes de instalar.')
    }
    fs.mkdirSync(meta, { recursive: true })
    if (exists(path.join(meta, 'journal.json'))) fail('CODEX_INSTALL_INCOMPLETE', meta, 'Hay recuperación pendiente. Use recoverCodex sobre esta base tras revisar journal y backups.')
    try { fs.writeFileSync(path.join(meta, 'lock'), '', { flag: 'wx' }); locked = true } catch (e) { if (e.code === 'EEXIST') fail('CODEX_INSTALL_BUSY', meta, 'Otra instalación o un lock pendiente; compruebe que no haya proceso activo antes de retirar el lock.'); throw e }
    const manifestFile = path.join(meta, 'manifest.json')
    const previousBytes = exists(manifestFile) ? fs.readFileSync(safePath(manifestFile)) : null
    const previous = previousBytes ? validateManifest(json(manifestFile)) : { files: [] }
    const old = new Map(previous.files.map(e => [e.path, e.sha256]))
    const wanted = new Map(desired.files.map(e => [e.path, e.sha256]))
    const operations = []
    const counts = { created: 0, updated: 0, removed: 0, unchanged: 0 }
    for (const file of [...new Set([...old.keys(), ...wanted.keys()])].sort()) {
      const current = digest(path.join(base, file))
      if (current !== null && (!old.has(file) || current !== old.get(file))) fail('CODEX_CONFLICT', path.join(base, file), 'Conserve su personalización fuera del destino y compárela con la fuente; no se sobrescribe automáticamente.')
      const next = wanted.get(file) || null
      if (current === next) { counts.unchanged++; continue }
      operations.push({ path: file, before: current, after: next, backup: `${operations.length}.bak`, staged: `${operations.length}.new` })
      counts[next === null ? 'removed' : current === null ? 'created' : 'updated']++
    }
    const transaction = path.join(meta, 'transaction')
    if (exists(transaction)) fail('CODEX_INSTALL_INCOMPLETE', transaction, 'Hay recursos de recuperación pendientes; revíselos antes de reintentar.')
    journal = { schemaVersion: 1, packageId: PACKAGE, version: desired.version, operations, previousManifest: previousBytes !== null, previousHash: previousBytes ? hash(previousBytes) : null, nextHash: hash(JSON.stringify(desired, null, 2) + '\n') }
    write(path.join(meta, 'journal.json'), JSON.stringify(journal, null, 2))
    fs.mkdirSync(transaction)
    if (previousBytes) write(path.join(transaction, 'manifest.bak'), previousBytes)
    for (const [i, op] of operations.entries()) {
      beforeStage?.(i, op)
      if (op.before !== null) fs.copyFileSync(safePath(path.join(base, op.path)), path.join(transaction, op.backup))
      if (op.after !== null) write(path.join(transaction, op.staged), payload.get(op.path))
    }
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]
      beforeOperation?.(i, op)
      const target = safePath(path.join(base, op.path))
      if (digest(target) !== op.before) fail('CODEX_CONFLICT', target, 'El archivo cambió durante la instalación.')
      if (op.after === null) fs.unlinkSync(target)
      else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.renameSync(safePath(path.join(transaction, op.staged)), target) }
    }
    for (const entry of desired.files) if (digest(path.join(base, entry.path)) !== entry.sha256) fail('CODEX_INSTALL_INCOMPLETE', entry.path)
    if (digest(manifestFile) !== journal.previousHash) fail('CODEX_CONFLICT', manifestFile)
    write(path.join(transaction, 'manifest.new'), JSON.stringify(desired, null, 2) + '\n')
    fs.renameSync(path.join(transaction, 'manifest.new'), manifestFile)
    journal.committed = true
    write(path.join(meta, 'journal.json'), JSON.stringify(journal, null, 2))
    cleanTransaction(transaction, meta, operations)
    fs.unlinkSync(path.join(meta, 'journal.json'))
    journal = null
    for (const op of operations) if (op.after === null) pruneEmpty(path.join(base, op.path), base)
    console.log(`[install] Codex ${base}: ${JSON.stringify(counts)}. Archivos instalados; reconocimiento por el cliente pendiente de comprobar. Seleccione equipo-dev-feature; reinicie el cliente si no aparece.`)
    return counts
  } catch (error) {
    if (journal) {
      try { rollback(base, journal) } catch { fail('CODEX_INSTALL_INCOMPLETE', meta, 'Conserve journal/backups; cierre el instalador y ejecute recoverCodex tras revisar el conflicto.') }
    }
    if (['EACCES', 'EPERM', 'EROFS'].includes(error.code)) fail('CODEX_PERMISSION', base || out, 'Revise permisos y reintente sin elevar privilegios.')
    if (error.code === 'ENOENT') fail('CODEX_SOURCE_INVALID', error.path || out, 'Falta un recurso; genere de nuevo el paquete.')
    throw error
  } finally {
    if (locked && !exists(path.join(meta, 'journal.json'))) fs.unlinkSync(path.join(meta, 'lock'))
  }
}

function rollback(base, journal) {
  const meta = safePath(path.join(base, META)), transaction = safePath(path.join(meta, 'transaction'))
  if (journal.schemaVersion !== 1 || journal.packageId !== PACKAGE || !Array.isArray(journal.operations)) fail('CODEX_INSTALL_INCOMPLETE', meta)
  if (typeof journal.previousManifest !== 'boolean' || ![journal.previousHash, journal.nextHash].every(h => h === null || /^[a-f0-9]{64}$/.test(h)) || journal.previousManifest !== (journal.previousHash !== null) || journal.nextHash === null) fail('CODEX_INSTALL_INCOMPLETE', meta)
  const seen = new Set()
  for (const [i, op] of journal.operations.entries()) {
    relativeFile(op.path)
    if (seen.has(op.path.toLowerCase())) fail('CODEX_INSTALL_INCOMPLETE', op.path)
    seen.add(op.path.toLowerCase())
    if (op.backup !== `${i}.bak` || op.staged !== `${i}.new` || ![op.before, op.after].every(h => h === null || /^[a-f0-9]{64}$/.test(h))) fail('CODEX_INSTALL_INCOMPLETE', meta)
    const current = digest(path.join(base, op.path))
    if (current !== op.before && current !== op.after) fail('CODEX_CONFLICT', op.path, 'Cambios posteriores; recuperación detenida.')
    if (!journal.committed && current !== op.before && op.before !== null && digest(path.join(transaction, op.backup)) !== op.before) fail('CODEX_INSTALL_INCOMPLETE', op.backup)
  }
  const manifestFile = path.join(meta, 'manifest.json')
  const currentManifest = digest(manifestFile)
  if (journal.committed === true) {
    if (currentManifest !== journal.nextHash || journal.operations.some(op => digest(path.join(base, op.path)) !== op.after)) fail('CODEX_CONFLICT', meta, 'La instalación completada cambió antes de limpiar recuperación.')
    cleanTransaction(transaction, meta, journal.operations)
    fs.unlinkSync(path.join(meta, 'journal.json'))
    return
  }
  if (currentManifest !== journal.previousHash && currentManifest !== journal.nextHash) fail('CODEX_CONFLICT', manifestFile)
  if (currentManifest !== journal.previousHash && journal.previousManifest && digest(path.join(transaction, 'manifest.bak')) !== journal.previousHash) fail('CODEX_INSTALL_INCOMPLETE', manifestFile)
  for (const op of [...journal.operations].reverse()) {
    const target = safePath(path.join(base, op.path))
    const current = digest(target)
    if (current === op.before) continue
    if (current !== op.after) fail('CODEX_CONFLICT', target)
    if (op.before === null) fs.unlinkSync(target)
    else fs.copyFileSync(safePath(path.join(transaction, op.backup)), target)
  }
  if (currentManifest !== journal.previousHash) {
    if (journal.previousManifest) fs.copyFileSync(safePath(path.join(transaction, 'manifest.bak')), manifestFile)
    else if (exists(manifestFile)) fs.unlinkSync(manifestFile)
  }
  cleanTransaction(transaction, meta, journal.operations)
  fs.unlinkSync(path.join(meta, 'journal.json'))
  for (const op of journal.operations) if (op.before === null) pruneEmpty(path.join(base, op.path), base)
}

export function recoverCodex(override) {
  const base = installationBase(override), meta = safePath(path.join(base, META))
  rollback(base, json(path.join(meta, 'journal.json')))
  if (exists(path.join(meta, 'lock'))) fs.unlinkSync(path.join(meta, 'lock'))
}
