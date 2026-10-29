import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { safePath } from './codex.mjs'

export const HOSTS = ['claude-code', 'vscode-agent']
const META = '.equipo-dev-build.json'
export const sha256 = data => createHash('sha256').update(data).digest('hex')
const json = value => JSON.stringify(value, null, 2) + '\n'
const fail = message => { throw new Error(`path-conflict: ${message}`) }

export function checkedPath(file, base) {
  const absolute = path.resolve(file)
  if (base) {
    const relative = path.relative(path.resolve(base), absolute)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) fail(absolute)
  }
  if (/(?:^|[\\/])(?:\.claude[\\/]plugins|\.vscode[\\/]agent-plugins)(?:[\\/]|$)/i.test(absolute)) fail('managed cache')
  try { return safePath(absolute) } catch { fail(absolute) }
}

export function treeFiles(directory) {
  const files = new Map()
  if (!fs.existsSync(directory)) return files
  checkedPath(directory)
  const walk = (dir, prefix = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = checkedPath(path.join(dir, entry.name), directory)
      const relative = prefix + entry.name
      if (entry.isDirectory()) walk(file, relative + '/')
      else if (entry.isFile()) files.set(relative, fs.readFileSync(file))
      else fail(file)
    }
  }
  walk(directory)
  return files
}

export function verifyGenerated(directory) {
  const files = treeFiles(directory)
  if (!files.size) return
  if (!files.has(META)) fail(`${directory}: salida anterior sin inventario; conserve o mueva esa carpeta antes de reconstruir`)
  let metadata
  try { metadata = JSON.parse(files.get(META)) } catch { fail('invalid build inventory') }
  if (metadata.schemaVersion !== 1 || !metadata.files || typeof metadata.files !== 'object') fail('invalid build inventory')
  const actual = [...files.keys()].filter(name => name !== META)
  if (actual.length !== Object.keys(metadata.files).length || actual.some(name => metadata.files[name] !== sha256(files.get(name)))) fail(`${directory}: archivos modificados o ajenos; consérvelos antes de reconstruir`)
}

function writeTree(directory, files) {
  for (const [name, data] of files) {
    const file = checkedPath(path.join(directory, name), directory)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, data)
  }
}

function inventory(files, version) {
  const hashes = Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([name, data]) => [name, sha256(data)]))
  return new Map([...files, [META, json({ schemaVersion: 1, version, files: hashes })]])
}

export function publishTrees(root, outputs) {
  const base = checkedPath(path.join(root, 'dist'))
  for (const { directory } of outputs) { checkedPath(directory, base); verifyGenerated(directory) }
  fs.mkdirSync(base, { recursive: true })
  const transaction = checkedPath(path.join(base, `.staging-${randomUUID()}`), base)
  fs.mkdirSync(transaction)
  const committed = []
  let cleanup = true
  try {
    outputs.forEach((output, index) => writeTree(path.join(transaction, String(index)), output.files))
    for (const [index, output] of outputs.entries()) {
      const backup = path.join(transaction, `backup-${index}`)
      fs.mkdirSync(path.dirname(output.directory), { recursive: true })
      if (fs.existsSync(output.directory)) fs.renameSync(output.directory, backup)
      committed.push({ directory: output.directory, backup })
      fs.renameSync(path.join(transaction, String(index)), output.directory)
    }
  } catch (error) {
    try {
      for (const { directory, backup } of committed.reverse()) {
        checkedPath(directory, base)
        fs.rmSync(directory, { recursive: true, force: true })
        if (fs.existsSync(backup)) fs.renameSync(backup, directory)
      }
    } catch {
      cleanup = false
      throw new Error(`path-conflict: recuperación pendiente; conserve ${transaction} y restaure sus backups antes de reconstruir`)
    }
    throw error
  } finally {
    checkedPath(transaction, base)
    if (cleanup) fs.rmSync(transaction, { recursive: true, force: true })
  }
}

export function buildHost(root, host, parseFrontmatter) {
  if (!HOSTS.includes(host)) throw new Error('invalid-package: unsupported target')
  const config = JSON.parse(fs.readFileSync(checkedPath(path.join(root, 'platforms', host, 'platform.json')), 'utf8'))
  const manifest = JSON.parse(fs.readFileSync(checkedPath(path.join(root, 'src/manifest.json')), 'utf8'))
  const files = new Map()
  const transform = text => {
    for (const [from, to] of Object.entries(config.tokens)) text = text.replaceAll(from, to)
    text = text.replace(/(?<=skills[\\/])dev-rules(?=[\\/])/g, 'dev-rules').replace(/(?<=skills[\\/])equipo-reiniciar(?=[\\/])/g, 'team-reset')
    if (/\{\{[A-Z_]+\}\}/.test(text)) throw new Error('invalid-package: unresolved token')
    return text.replace(/\r\n/g, '\n')
  }
  const targetManifest = Object.fromEntries(config.manifest.fields.filter(key => manifest[key] !== undefined).map(key => [key, manifest[key]]))
  Object.assign(targetManifest, config.manifest.extraFields)
  files.set(config.output.manifestFile, json(targetManifest))
  const names = new Set()
  const skillsDir = checkedPath(path.join(root, 'src/skills'))
  for (const folder of fs.readdirSync(skillsDir)) {
    const source = path.join(skillsDir, folder)
    const skillFiles = treeFiles(source)
    const { attributes } = parseFrontmatter(String(skillFiles.get('SKILL.md') || ''))
    const name = attributes.name
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || names.has(name)) throw new Error('invalid-package: invalid or duplicate skill name')
    names.add(name)
    const override = path.join(root, 'platforms', host, 'skills', name)
    const selected = fs.existsSync(override) ? treeFiles(override) : skillFiles
    if (parseFrontmatter(String(selected.get('SKILL.md') || '')).attributes.name !== name) throw new Error('invalid-package: override skill name does not match directory')
    for (const [file, data] of selected) files.set(`skills/${name}/${file}`, file.endsWith('.md') ? transform(String(data)) : data)
  }
  for (const [file, data] of treeFiles(path.join(root, 'src/agents'))) {
    if (!file.endsWith('.md')) continue
    const { attributes, body } = parseFrontmatter(String(data))
    const mapped = [...new Set(attributes.tools.flatMap(tool => config.tools[tool] || []))]
    const fm = [`name: ${attributes.name}`, `description: ${JSON.stringify(attributes.description)}`]
    if (host === 'claude-code') fm.push(`tools: ${mapped.join(', ')}`, `model: ${config.models[attributes.model_tier]}`)
    else fm.push(`tools: ${JSON.stringify(mapped)}`)
    const extension = host === 'claude-code' ? file : file.replace(/\.md$/, '.agent.md')
    const agentsDir = host === 'claude-code' ? 'agents' : 'com.github.copilot/agents'
    files.set(`${agentsDir}/${extension}`, `---\n${fm.join('\n')}\n---\n${transform(body)}`)
  }
  for (const asset of config.assets || []) {
    for (const [file, data] of treeFiles(path.join(root, asset.from))) files.set(`${asset.to}/${file}`, data)
  }
  for (const name of ['README.md', 'README.es.md', 'LICENSE']) if (fs.existsSync(path.join(root, name))) files.set(name, fs.readFileSync(checkedPath(path.join(root, name))))
  const directory = checkedPath(path.resolve(root, config.output.dir), path.join(root, 'dist'))
  const packaged = inventory(files, manifest.version)
  const outputs = [{ directory, files: packaged }]
  if (host === 'claude-code') {
    const marketplace = new Map([...packaged].map(([name, data]) => [`plugins/equipo-dev/${name}`, data]))
    marketplace.set('.claude-plugin/marketplace.json', json({ name: 'equipo-dev-local', owner: manifest.author, metadata: { description: 'Distribución local de Equipo Dev para Claude Code.' }, plugins: [{ name: 'equipo-dev', source: './plugins/equipo-dev', version: manifest.version, description: manifest.description }] }))
    outputs.push({ directory: path.join(root, 'dist/marketplace'), files: inventory(marketplace, manifest.version) })
  }
  publishTrees(root, outputs)
  return directory
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0) }
  return (crc ^ 0xffffffff) >>> 0
}

// Stored ZIP entries use fixed dates and sorted names; hidden metadata is included.
export function packageHost(directory, destination) {
  verifyGenerated(directory)
  checkedPath(destination)
  const locals = [], centrals = []
  let offset = 0
  for (const [name, data] of [...treeFiles(directory)].sort(([a], [b]) => a.localeCompare(b))) {
    const filename = Buffer.from(name)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6); header.writeUInt16LE(33, 12)
    header.writeUInt32LE(crc32(data), 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); header.copy(central, 6, 4, 30); central.writeUInt32LE(offset, 42)
    locals.push(header, filename, data); centrals.push(central, filename)
    offset += header.length + filename.length + data.length
  }
  const central = Buffer.concat(centrals), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(centrals.length / 2, 8); end.writeUInt16LE(centrals.length / 2, 10); end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16)
  const zip = Buffer.concat([...locals, central, end])
  fs.writeFileSync(destination, zip)
  fs.writeFileSync(checkedPath(destination + '.sha256'), `${sha256(zip)}  ${path.basename(destination)}\n`)
  return destination
}
