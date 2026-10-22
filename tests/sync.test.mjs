import test from 'node:test'
import assert from 'node:assert/strict'
import { detectRunning, TOOLS } from '../scripts/sync.mjs'

test('detectRunning identifica herramientas abiertas sin distinguir mayúsculas', () => {
  assert.deepEqual(detectRunning(['explorer.exe', 'Code.exe', 'Antigravity.exe']), ['Antigravity', 'VS Code'])
  assert.deepEqual(detectRunning(['claude', 'node']), ['Claude Code'])
})

test('detectRunning devuelve vacío cuando no hay herramientas abiertas', () => {
  assert.deepEqual(detectRunning(['explorer.exe', 'node.exe', '']), [])
  assert.equal(TOOLS.length, 4)
})
