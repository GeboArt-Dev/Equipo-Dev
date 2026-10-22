#!/usr/bin/env node
/**
 * Instalador de Git Hooks automáticos para equipo-dev.
 * Configura 'post-commit' y 'post-merge' para sincronizar automáticamente
 * los plugins en Antigravity, Claude Code y OpenAI Codex tras cada commit o pull.
 *
 * Sintaxis:
 *   node scripts/setup-hooks.mjs [--remove] [--status]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GIT_DIR = path.join(ROOT, '.git')
const HOOKS_DIR = path.join(GIT_DIR, 'hooks')

const HOOK_SCRIPT = `#!/bin/sh
# [equipo-dev] Sincronizacion automatica multi-IDE tras commit o merge
echo "[auto-sync] Sincronizando plugins (exige cerrar Claude Code, Antigravity, Codex y VS Code)..."
node scripts/sync.mjs --hook
`

export function setupHooks(action = 'install') {
  if (!fs.existsSync(GIT_DIR)) {
    console.log('[setup-hooks] No se detectó directorio .git/. Omitiendo configuración de hooks.')
    return false
  }

  if (!fs.existsSync(HOOKS_DIR)) {
    fs.mkdirSync(HOOKS_DIR, { recursive: true })
  }

  const hookFiles = ['post-commit', 'post-merge']

  if (action === 'status') {
    let installed = true
    for (const file of hookFiles) {
      const hookPath = path.join(HOOKS_DIR, file)
      const exists = fs.existsSync(hookPath) && fs.readFileSync(hookPath, 'utf8').includes('[equipo-dev]')
      console.log(`- ${file}: ${exists ? 'ACTIVO' : 'NO INSTALADO'}`)
      if (!exists) installed = false
    }
    return installed
  }

  if (action === 'remove') {
    for (const file of hookFiles) {
      const hookPath = path.join(HOOKS_DIR, file)
      if (fs.existsSync(hookPath)) {
        const content = fs.readFileSync(hookPath, 'utf8')
        if (content.includes('[equipo-dev]')) {
          fs.unlinkSync(hookPath)
          console.log(`[setup-hooks] Desinstalado: ${file}`)
        }
      }
    }
    console.log('[setup-hooks] Hooks automáticos desinstalados.')
    return true
  }

  for (const file of hookFiles) {
    const hookPath = path.join(HOOKS_DIR, file)
    fs.writeFileSync(hookPath, HOOK_SCRIPT, { encoding: 'utf8', mode: 0o755 })
    try {
      fs.chmodSync(hookPath, 0o755)
    } catch {
      // Ignorar en sistemas que no soporten chmod
    }
    console.log(`[setup-hooks] Instalado: .git/hooks/${file}`)
  }

  console.log('[setup-hooks] Git Hooks configurados exitosamente.')
  console.log('[setup-hooks] Cada vez que hagas `git commit` o `git pull`, los plugins se sincronizarán solos.')
  return true
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isDirect) {
  const args = process.argv.slice(2)
  if (args.includes('--status')) {
    setupHooks('status')
  } else if (args.includes('--remove')) {
    setupHooks('remove')
  } else {
    setupHooks('install')
  }
}
