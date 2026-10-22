#!/usr/bin/env node
/**
 * Sincronización guardada de equipo-dev con los entornos instalados.
 * Exige que las herramientas que usan los plugins (Claude Code, Antigravity, Codex,
 * VS Code) estén cerradas antes de reemplazar sus archivos.
 *
 * Sintaxis:
 *   node scripts/sync.mjs [--wait] [--hook] [--force]
 *
 *   --wait    Espera (máx. 5 min) a que cierres las herramientas y luego sincroniza.
 *   --hook    Modo git hook: si hay herramientas abiertas, avisa y sale con 0 (no rompe el commit).
 *   --force   Sincroniza aunque haya herramientas abiertas (bajo tu responsabilidad).
 */

import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const TOOLS = [
  { label: 'Claude Code', names: ['claude', 'claude.exe'] },
  { label: 'Antigravity', names: ['antigravity', 'antigravity.exe'] },
  { label: 'Codex', names: ['codex', 'codex.exe'] },
  { label: 'VS Code', names: ['code', 'code.exe'] },
]

/** Devuelve las etiquetas de herramientas presentes en una lista de nombres de proceso. */
export function detectRunning(processNames) {
  const set = new Set(processNames.map(n => n.trim().toLowerCase()).filter(Boolean))
  return TOOLS.filter(t => t.names.some(n => set.has(n))).map(t => t.label)
}

function listProcessNames() {
  if (process.platform === 'win32') {
    const r = spawnSync('tasklist', ['/FO', 'CSV', '/NH'], { encoding: 'utf8' })
    if (r.status !== 0) return null
    return r.stdout.split(/\r?\n/).map(l => (l.match(/^"([^"]+)"/) || [])[1]).filter(Boolean)
  }
  const r = spawnSync('ps', ['-A', '-o', 'comm='], { encoding: 'utf8' })
  if (r.status !== 0) return null
  return r.stdout.split(/\r?\n/).map(l => path.basename(l.trim()))
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function main(args = process.argv.slice(2)) {
  const force = args.includes('--force')
  const hook = args.includes('--hook')
  const wait = args.includes('--wait')

  let running = []
  if (!force) {
    const deadline = Date.now() + 5 * 60 * 1000
    for (;;) {
      const names = listProcessNames()
      if (!names) {
        console.log('[sync] No se pudo listar procesos; se omite la comprobación de herramientas abiertas.')
        break
      }
      running = detectRunning(names)
      if (running.length === 0 || !wait || Date.now() > deadline) break
      console.log(`[sync] Cierra: ${running.join(', ')} (esperando...)`)
      await sleep(3000)
    }
  }

  if (running.length > 0) {
    console.log(`[sync] Herramientas abiertas: ${running.join(', ')}.`)
    console.log('[sync] Ciérralas y ejecuta `npm run sync` (o `npm run sync -- --wait`) para sincronizar equipo-dev.')
    return hook ? 0 : 2
  }

  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build.mjs'), '--install-all'], {
    cwd: ROOT,
    stdio: 'inherit',
  })
  return r.status ?? 1
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isDirect) {
  process.exit(await main())
}
