#!/usr/bin/env node
/**
 * Compilador multi-target para equipo-dev.
 * Transforma las fuentes agnósticas en src/ a los artefactos específicos en dist/
 * según los adaptadores definidos en platforms/.
 *
 * Sintaxis:
 *   node scripts/build.mjs [opciones]
 *
 * Opciones:
 *   --target <id>    Compila únicamente el target especificado ('claude-code', 'antigravity', 'cursor', 'copilot', 'all').
 *   --install        Sincroniza los artefactos generados con la ruta local de plugins configurada.
 *   --clean          Elimina el directorio dist/ antes de compilar.
 *   --help           Muestra la guía de uso.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCodex, installCodex, safePath } from './codex.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'src')
const PLATFORMS_DIR = path.join(ROOT, 'platforms')
const DIST_DIR = path.join(ROOT, 'dist')

const VALID_TIERS = new Set(['pro', 'balanced', 'light'])
const KNOWN_CANONICAL_TOOLS = new Set([
  'read_file',
  'list_dir',
  'write_file',
  'edit_file',
  'execute_command',
  'find_by_name',
  'grep_search',
  'web_search',
  'web_fetch',
])

function showHelp() {
  console.log(`
Compilador Multi-Target de equipo-dev

Uso:
  node scripts/build.mjs [opciones]

Opciones:
  --target <id>    Compila el target especificado (claude-code, antigravity, codex, cursor, copilot, all). Por defecto: all.
  --install        Instala los artefactos en el directorio local de plugins configurado (si la plataforma lo soporta).
  --install-all    Instala simultáneamente en todas las plataformas soportadas (Antigravity, Claude Code, Codex).
  --clean          Limpia la carpeta dist/ antes de la compilación.
  --help           Muestra esta ayuda.

Instalación simultánea:
  node scripts/build.mjs --install-all
  (o bien: node scripts/build.mjs --target all --install)
  Compila e instala en ~/.gemini/config/plugins (Antigravity), ~/.claude/plugins (Claude Code) y ~/.agents/skills (Codex).
`)
}

export function parseFrontmatter(content) {
  const norm = content.replace(/\r\n/g, '\n')
  const match = norm.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { attributes: {}, body: content }
  const rawFm = match[1]
  const body = match[2]
  const attributes = {}

  const lines = rawFm.split('\n')
  let currentKey = null
  let isList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const listMatch = line.match(/^\s*-\s+(.*)$/)
    if (listMatch && currentKey && isList) {
      attributes[currentKey].push(listMatch[1].trim())
      continue
    }

    const kvMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      const val = kvMatch[2].trim()
      if (val === '') {
        attributes[currentKey] = []
        isList = true
      } else {
        isList = false
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          try {
            attributes[currentKey] = JSON.parse(val)
          } catch {
            attributes[currentKey] = val.slice(1, -1)
          }
        } else if (val === 'true') {
          attributes[currentKey] = true
        } else if (val === 'false') {
          attributes[currentKey] = false
        } else {
          attributes[currentKey] = val
        }
      }
    }
  }
  return { attributes, body }
}

export function applyTokens(text, tokens = {}) {
  let result = text
  for (const [token, replacement] of Object.entries(tokens)) {
    result = result.replaceAll(token, replacement)
  }
  return result
}

export function assertWithin(childPath, parentPath, label = 'Ruta') {
  const resolvedChild = path.resolve(childPath)
  const resolvedParent = path.resolve(parentPath)
  const rel = path.relative(resolvedParent, resolvedChild)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Violación de seguridad: ${label} '${childPath}' debe residir estrictamente dentro de '${parentPath}'`)
  }
  return resolvedChild
}

export function isAuthorizedInstallTarget(targetPath, allowedExtraBases = []) {
  const resolved = path.resolve(targetPath)
  const home = path.resolve(os.homedir())
  const root = path.parse(resolved).root

  // Nunca ser home ni raíz del disco
  if (resolved === home || resolved === root) {
    return false
  }

  const authorizedBases = [
    path.join(home, '.gemini', 'config', 'plugins'),
    path.join(home, '.claude', 'plugins'),
    path.join(home, '.agents', 'skills'),
    path.resolve(os.tmpdir()),
    ...allowedExtraBases.map(b => path.resolve(b)),
  ]

  for (const base of authorizedBases) {
    const rel = path.relative(base, resolved)
    // Debe residir estrictamente dentro de la base autorizada (subdirectorio no vacío)
    if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
      return true
    }
  }

  return false
}

export function serializeFrontmatterField(key, value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${key}: []`]
    }
    const lines = [`${key}:`]
    for (const item of value) {
      lines.push(`  - ${item}`)
    }
    return lines
  }
  if (typeof value === 'object' && value !== null) {
    return [`${key}: ${JSON.stringify(value)}`]
  }
  return [`${key}: ${value}`]
}

function rmrf(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true })
  }
}

function copyDirRecursive(src, dst, fileTransform = null) {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const dstPath = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath, fileTransform)
    } else if (fileTransform && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(srcPath, 'utf8')
      fs.writeFileSync(dstPath, fileTransform(content, srcPath))
    } else {
      fs.copyFileSync(srcPath, dstPath)
    }
  }
}

function validateSourceIntegrity() {
  const manifestPath = path.join(SRC_DIR, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Archivo manifiesto no encontrado: ${manifestPath}`)
  }

  const agentsDir = path.join(SRC_DIR, 'agents')
  if (!fs.existsSync(agentsDir)) {
    throw new Error(`Directorio de agentes no encontrado: ${agentsDir}`)
  }

  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
  if (agentFiles.length === 0) {
    throw new Error(`No se encontraron agentes en ${agentsDir}`)
  }

  for (const file of agentFiles) {
    const filePath = path.join(agentsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    const { attributes } = parseFrontmatter(content)

    for (const reqField of ['name', 'description', 'model_tier', 'tools']) {
      if (!attributes[reqField]) {
        throw new Error(`Campo obligatorio '${reqField}' faltante en agente: ${file}`)
      }
    }

    if (!VALID_TIERS.has(attributes.model_tier)) {
      throw new Error(`model_tier '${attributes.model_tier}' inválido en ${file}. Debe ser: pro, balanced o light`)
    }

    const tools = Array.isArray(attributes.tools)
      ? attributes.tools
      : String(attributes.tools).split(',').map(s => s.trim()).filter(Boolean)

    for (const tool of tools) {
      if (!KNOWN_CANONICAL_TOOLS.has(tool)) {
        throw new Error(`Herramienta canónica no reconocida '${tool}' en ${file}`)
      }
    }
  }

  const skillsDir = path.join(SRC_DIR, 'skills')
  if (!fs.existsSync(skillsDir)) {
    throw new Error(`Directorio de skills no encontrado: ${skillsDir}`)
  }
}

function buildTarget(platformId, platformConfig, canonicalManifest) {
  const outDir = path.resolve(ROOT, platformConfig.output.dir)
  assertWithin(outDir, DIST_DIR, `Directorio de salida outDir para '${platformId}'`)
  fs.mkdirSync(outDir, { recursive: true })

  // 1. Manifiesto
  if (platformConfig.output.manifestFile) {
    const manifestOutPath = path.resolve(outDir, platformConfig.output.manifestFile)
    assertWithin(manifestOutPath, DIST_DIR, `Destino de manifiesto para '${platformId}'`)
    fs.mkdirSync(path.dirname(manifestOutPath), { recursive: true })

    const targetManifest = {}
    const requestedFields = platformConfig.manifest?.fields || Object.keys(canonicalManifest)
    for (const field of requestedFields) {
      if (canonicalManifest[field] !== undefined) {
        targetManifest[field] = canonicalManifest[field]
      }
    }
    if (platformConfig.manifest?.extraFields) {
      Object.assign(targetManifest, platformConfig.manifest.extraFields)
    }
    fs.writeFileSync(manifestOutPath, JSON.stringify(targetManifest, null, 2) + '\n', 'utf8')
  }

  // 2. Si tiene templates declarados (ej. cursor, copilot)
  if (Array.isArray(platformConfig.templates)) {
    for (const tpl of platformConfig.templates) {
      const srcTpl = path.resolve(ROOT, tpl.from)
      const dstTpl = path.resolve(outDir, tpl.to)
      assertWithin(dstTpl, DIST_DIR, `Destino de template '${tpl.to}' para '${platformId}'`)
      if (fs.existsSync(srcTpl)) {
        fs.mkdirSync(path.dirname(dstTpl), { recursive: true })
        let content = fs.readFileSync(srcTpl, 'utf8')
        content = applyTokens(content, platformConfig.tokens)
        fs.writeFileSync(dstTpl, content, 'utf8')
      }
    }
  }

  // 3. Procesar Agentes si la plataforma define mapeo de tools y models
  if (platformConfig.tools && platformConfig.models) {
    const srcAgentsDir = path.join(SRC_DIR, 'agents')
    const dstAgentsDir = path.join(outDir, 'agents')
    assertWithin(dstAgentsDir, DIST_DIR, `Directorio de agentes para '${platformId}'`)
    fs.mkdirSync(dstAgentsDir, { recursive: true })

    const dropKeys = new Set(platformConfig.frontmatter?.drop || [])
    const injectKeys = platformConfig.frontmatter?.inject || {}

    for (const file of fs.readdirSync(srcAgentsDir).filter(f => f.endsWith('.md'))) {
      const srcFile = path.join(srcAgentsDir, file)
      const dstFile = path.join(dstAgentsDir, file)
      assertWithin(dstFile, DIST_DIR, `Archivo de agente '${file}' para '${platformId}'`)
      const rawContent = fs.readFileSync(srcFile, 'utf8')
      const { attributes, body } = parseFrontmatter(rawContent)

      // Transformar herramientas
      const canonicalTools = Array.isArray(attributes.tools)
        ? attributes.tools
        : String(attributes.tools).split(',').map(s => s.trim()).filter(Boolean)

      const mappedTools = []
      for (const ct of canonicalTools) {
        const platformTools = platformConfig.tools[ct] || []
        for (const pt of platformTools) {
          if (!mappedTools.includes(pt)) mappedTools.push(pt)
        }
      }

      // Transformar modelo
      const targetModel = platformConfig.models[attributes.model_tier] || 'inherit'

      // Construir frontmatter de salida
      const outFm = []
      outFm.push(`name: ${attributes.name}`)
      outFm.push(`description: ${JSON.stringify(attributes.description)}`)

      // Formato de herramientas
      if (platformId === 'claude-code') {
        outFm.push(`tools: ${mappedTools.join(', ')}`)
      } else {
        outFm.push('tools:')
        for (const mt of mappedTools) {
          outFm.push(`  - ${mt}`)
        }
      }

      outFm.push(`model: ${targetModel}`)

      // Otros atributos que no estén en dropKeys ni sean name/description/tools/model_tier
      for (const [key, value] of Object.entries(attributes)) {
        if (['name', 'description', 'tools', 'model_tier'].includes(key)) continue
        if (dropKeys.has(key)) continue
        outFm.push(...serializeFrontmatterField(key, value))
      }

      // Inyectar claves específicas de plataforma
      for (const [key, value] of Object.entries(injectKeys)) {
        outFm.push(...serializeFrontmatterField(key, value))
      }

      // Transformar tokens en el cuerpo
      const transformedBody = applyTokens(body, platformConfig.tokens)
      const finalContent = `---\n${outFm.join('\n')}\n---\n${transformedBody}`
      fs.writeFileSync(dstFile, finalContent, 'utf8')
    }
  }

  // 4. Procesar Skills
  const srcSkillsDir = path.join(SRC_DIR, 'skills')
  const dstSkillsDir = path.join(outDir, 'skills')
  assertWithin(dstSkillsDir, DIST_DIR, `Directorio de skills para '${platformId}'`)
  if (fs.existsSync(srcSkillsDir)) {
    copyDirRecursive(srcSkillsDir, dstSkillsDir, (content) => applyTokens(content, platformConfig.tokens))
  }

  // Overrides de skills específicos de plataforma
  if (platformConfig.overrides?.skillsDir) {
    const overridesDir = path.resolve(ROOT, platformConfig.overrides.skillsDir)
    if (fs.existsSync(overridesDir)) {
      for (const skillName of fs.readdirSync(overridesDir)) {
        const skillSrc = path.join(overridesDir, skillName)
        const skillDst = path.join(dstSkillsDir, skillName)
        assertWithin(skillDst, DIST_DIR, `Override de skill '${skillName}' para '${platformId}'`)
        if (fs.statSync(skillSrc).isDirectory()) {
          rmrf(skillDst)
          copyDirRecursive(skillSrc, skillDst, (content) => applyTokens(content, platformConfig.tokens))
        }
      }
    }
  }

  // 5. Assets
  if (Array.isArray(platformConfig.assets)) {
    for (const asset of platformConfig.assets) {
      const assetSrc = path.resolve(ROOT, asset.from)
      const assetDst = path.resolve(outDir, asset.to)
      assertWithin(assetDst, DIST_DIR, `Destino de asset '${asset.to}' para '${platformId}'`)
      if (fs.existsSync(assetSrc)) {
        if (fs.statSync(assetSrc).isDirectory()) {
          copyDirRecursive(assetSrc, assetDst)
        } else {
          fs.mkdirSync(path.dirname(assetDst), { recursive: true })
          fs.copyFileSync(assetSrc, assetDst)
        }
      }
    }
  }

  // 6. README (EN & ES)
  for (const readmeName of ['README.md', 'README.es.md', 'LICENSE']) {
    const docSrc = path.join(ROOT, readmeName)
    if (fs.existsSync(docSrc)) {
      const docDst = path.join(outDir, readmeName)
      assertWithin(docDst, DIST_DIR, `${readmeName} para '${platformId}'`)
      fs.copyFileSync(docSrc, docDst)
    }
  }

  console.log(`[build] Target '${platformId}' completado exitosamente en ${outDir}`)
}

function installTarget(platformId, platformConfig, installDirOverride = null) {
  const rawTarget = installDirOverride || platformConfig.install?.targetDir
  if (!rawTarget) {
    console.log(`[install] Target '${platformId}' no requiere instalación global (artefacto disponible en dist/${platformId} para copiar a proyectos). Se omite.`)
    return
  }

  const resolvedTarget = rawTarget.startsWith('~')
    ? path.join(os.homedir(), rawTarget.slice(1))
    : path.resolve(ROOT, rawTarget)

  if (!isAuthorizedInstallTarget(resolvedTarget)) {
    throw new Error(`[install] Violación de seguridad: La ruta de instalación '${resolvedTarget}' no pertenece a un directorio de plugins autorizado`)
  }

  const outDir = path.resolve(ROOT, platformConfig.output.dir)
  assertWithin(outDir, DIST_DIR, `Directorio origen para instalación (${platformId})`)

  // Resiliencia y manejo de errores:
  // No hacer borrado destructivo previo de carpetas completas (previene fallos EPERM en Windows y estados corruptos).
  // Usar sobreescritura directa y segura con copyDirRecursive.
  fs.mkdirSync(resolvedTarget, { recursive: true })
  copyDirRecursive(outDir, resolvedTarget)
  console.log(`[install] Target '${platformId}' instalado exitosamente en ${resolvedTarget}`)
}

export function runBuild(options = {}) {
  const startTime = Date.now()
  const doInstallAll = Boolean(options.installAll)
  const targetFilter = doInstallAll ? 'all' : (options.target || 'all')
  const doInstall = Boolean(options.install) || doInstallAll
  const doClean = Boolean(options.clean)

  if (doClean) {
    if (targetFilter === 'all') {
      console.log('[build] Limpiando todo dist/...')
      rmrf(DIST_DIR)
    } else {
      const configPath = path.join(PLATFORMS_DIR, targetFilter, 'platform.json')
      if (fs.existsSync(configPath)) {
        const platformConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        const targetOutDir = path.resolve(ROOT, platformConfig.output.dir)
        assertWithin(targetOutDir, DIST_DIR, `Directorio de salida para clean del target '${targetFilter}'`)
        if (targetFilter === 'codex') safePath(targetOutDir)
        console.log(`[build] Limpiando salida del target '${targetFilter}' (${targetOutDir})...`)
        rmrf(targetOutDir)
      } else {
        const targetOutDir = path.join(DIST_DIR, targetFilter)
        assertWithin(targetOutDir, DIST_DIR, `Directorio de salida para clean del target '${targetFilter}'`)
        rmrf(targetOutDir)
      }
    }
  }

  try { validateSourceIntegrity() } catch (error) {
    if (targetFilter === 'codex') throw new Error(`CODEX_SOURCE_INVALID: ${error.message}. Revise las fuentes antes de reintentar.`)
    throw error
  }

  const manifestPath = path.join(SRC_DIR, 'manifest.json')
  const canonicalManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  const platformDirs = fs.readdirSync(PLATFORMS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const targetsToBuild = targetFilter === 'all'
    ? platformDirs
    : [targetFilter]

  for (const pid of targetsToBuild) {
    const configPath = path.join(PLATFORMS_DIR, pid, 'platform.json')
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuración de plataforma no encontrada: ${configPath}`)
    }
    const platformConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (pid === 'codex') {
      const out = buildCodex(ROOT, parseFrontmatter)
      if (doInstall) {
        const codexDir = targetsToBuild.length === 1 ? options.installDir : null
        installCodex(out, codexDir)
      }
      continue
    }
    buildTarget(pid, platformConfig, canonicalManifest)

    if (doInstall) {
      const targetOverride = targetsToBuild.length === 1 ? options.installDir : null
      installTarget(pid, platformConfig, targetOverride)
    }
  }

  const duration = Date.now() - startTime
  console.log(`[build] Proceso finalizado en ${duration}ms.`)
  return { duration, targets: targetsToBuild }
}

// Ejecución CLI si se invoca directamente
const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isDirectExecution) {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }

  const installAll = args.includes('--install-all')
  let target = 'all'
  const targetIdx = args.indexOf('--target')
  if (targetIdx !== -1 && args[targetIdx + 1]) {
    target = args[targetIdx + 1]
  }

  const install = args.includes('--install') || installAll
  const clean = args.includes('--clean')

  try {
    runBuild({ target, install, installAll, clean })
    process.exit(0)
  } catch (err) {
    console.error(`[build ERROR] ${err.message}`)
    process.exit(1)
  }
}
