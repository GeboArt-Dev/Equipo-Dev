#!/usr/bin/env node
// Bitácora del equipo equipo-dev para Antigravity.
//
// Modo hook (sin argumentos): Antigravity lo ejecuta tras cada `invoke_subagent` (PostToolUse)
// y le pasa el evento en JSON por stdin. Si el subagente lanzado es un rol del equipo, añade una
// línea a state/bitacora.jsonl. Siempre responde `{}` y nunca falla: la bitácora es solo informativa.
//
// Modo CLI (lo usan las skills):
//   node hooks/bitacora.mjs --show  "<raíz del proyecto>"   → últimos movimientos y resumen por rol
//   node hooks/bitacora.mjs --reset "<raíz del proyecto>"   → borra los movimientos de ese proyecto

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STATE_DIR = path.join(PLUGIN_ROOT, 'state')
const LOG_FILE = path.join(STATE_DIR, 'bitacora.jsonl')
const MAX_ENTRIES = 500
const SHOW_LAST = 15

const ROLES = {
  'product-owner': 'Product Owner',
  'ux-designer': 'Diseño UX',
  architect: 'Arquitecto',
  'backend-dev': 'Backend',
  'frontend-dev': 'Frontend',
  'qa-engineer': 'QA',
  'code-reviewer': 'Code Reviewer',
}

/** "equipo-dev:architect", "equipo-dev/architect" o "architect" → "architect"; null si no es del equipo. */
export function toRole(typeName) {
  const name = String(typeName ?? '').split(/[:/.]/).pop()
  return Object.hasOwn(ROLES, name) ? name : null
}

/** Normaliza rutas y URIs de workspace para compararlas ("file:///d:/a%20b/" → "d:/a b"). */
export function normWorkspace(p) {
  let s = String(p ?? '').trim().replace(/^"+|"+$/g, '')
  if (s.startsWith('file://')) s = decodeURIComponent(s.slice('file://'.length))
  s = s.replace(/\\/g, '/').replace(/^\/([a-zA-Z]:)/, '$1').replace(/\/+$/, '')
  return s.toLowerCase()
}

function sameProject(a, b) {
  return a === b || a.startsWith(b + '/') || b.startsWith(a + '/')
}

function readEntries() {
  try {
    return fs
      .readFileSync(LOG_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(l => {
        try { return JSON.parse(l) } catch { return null }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function writeEntries(entries) {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  const kept = entries.slice(-MAX_ENTRIES)
  fs.writeFileSync(LOG_FILE, kept.map(e => JSON.stringify(e)).join('\n') + (kept.length ? '\n' : ''))
}

/** Extrae la lista de subagentes de los argumentos de invoke_subagent (objeto o JSON en texto). */
export function subagentsFrom(args) {
  let list = args?.Subagents ?? args?.subagents
  if (typeof list === 'string') {
    try { list = JSON.parse(list) } catch { list = [] }
  }
  return Array.isArray(list) ? list : []
}

function oneLine(text, max) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

async function readStdin() {
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

async function hookMode() {
  try {
    const event = JSON.parse((await readStdin()) || '{}')
    if (event?.toolCall?.name !== 'invoke_subagent') return
    const at = new Date().toISOString()
    const workspace = normWorkspace(event.workspacePaths?.[0])
    const fresh = []
    for (const sa of subagentsFrom(event.toolCall.args)) {
      const role = toRole(sa?.TypeName ?? sa?.typeName)
      if (!role) continue
      fresh.push({
        at,
        workspace,
        conversationId: event.conversationId,
        role,
        task: oneLine(sa?.Role ?? sa?.role ?? '', 80),
        prompt: oneLine(sa?.Prompt ?? sa?.prompt ?? '', 160),
        ...(event.error ? { error: oneLine(event.error, 160) } : {}),
      })
    }
    if (fresh.length) writeEntries([...readEntries(), ...fresh])
  } catch {
    // Nunca alterar el flujo del agente por un fallo de la bitácora.
  } finally {
    process.stdout.write('{}')
  }
}

function show(ws) {
  const entries = readEntries().filter(e => !ws || sameProject(e.workspace ?? '', ws))
  if (!entries.length) {
    console.log('Bitácora vacía para este proyecto: ningún rol del equipo se ha lanzado desde Antigravity.')
    return
  }
  console.log('Resumen por rol (lanzamientos registrados):')
  for (const [id, label] of Object.entries(ROLES)) {
    const mine = entries.filter(e => e.role === id)
    if (!mine.length) continue
    const last = mine[mine.length - 1]
    const err = last.error ? ` · ERROR: ${last.error}` : ''
    console.log(`- ${label}: ${mine.length} vez/veces · último ${last.at}${err}`)
  }
  console.log(`\nÚltimos ${Math.min(SHOW_LAST, entries.length)} movimientos (más reciente primero):`)
  for (const e of entries.slice(-SHOW_LAST).reverse()) {
    const what = e.task || e.prompt || ''
    console.log(`· ${e.at} · ${ROLES[e.role]} lanzado${e.error ? ' (falló)' : ''}${what ? `: ${what}` : ''}`)
  }
}

function reset(ws) {
  const before = readEntries()
  const after = ws ? before.filter(e => !sameProject(e.workspace ?? '', ws)) : []
  writeEntries(after)
  console.log(`Bitácora reiniciada: ${before.length - after.length} movimiento(s) eliminados.`)
}

const [flag, target] = process.argv.slice(2)
if (flag === '--show') show(normWorkspace(target))
else if (flag === '--reset') reset(normWorkspace(target))
else await hookMode()
