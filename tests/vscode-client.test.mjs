import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { vscodeVersion } from '../scripts/host-plugins.mjs'

function installation(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode active client '))
  const root = path.join(home, 'AppData/Local/Programs/Microsoft VS Code')
  fs.mkdirSync(path.join(root, 'bin'), { recursive: true })
  fs.writeFileSync(path.join(root, 'Code.exe'), 'fixture')
  for (const version of ['6d62b1d5da', 'zz-newer-unused']) {
    fs.mkdirSync(path.join(root, version, 'resources/app/out'), { recursive: true })
    fs.writeFileSync(path.join(root, version, 'resources/app/out/cli.js'), 'fixture')
  }
  const launcher = path.join(root, 'bin/code.cmd')
  fs.writeFileSync(launcher, '@echo off\r\n"%~dp0..\\Code.exe" "%~dp0..\\6d62b1d5da\\resources\\app\\out\\cli.js" %*\r\n')
  t.after(() => fs.rmSync(home, { recursive: true, force: true }))
  return { home, root, launcher }
}

test('VS Code version uses the active launcher CLI, never a newer leftover directory or cmd shell', t => {
  const { home, root } = installation(t)
  const result = vscodeVersion(home, (executable, args, options) => {
    assert.equal(executable, path.join(root, 'Code.exe'))
    assert.deepEqual(args, [path.join(root, '6d62b1d5da/resources/app/out/cli.js'), '--version'])
    assert.equal(options.env.ELECTRON_RUN_AS_NODE, '1')
    assert.equal(options.env.VSCODE_DEV, '')
    return { status: 0, stdout: '1.120.0\n6d62b1d5da\nx64\n' }
  })
  assert.equal(result.version, '1.120.0')
  assert.match(result.evidence, /shell:false/)
})

test('unrecognized and traversal wrappers never execute', t => {
  const { home, launcher } = installation(t)
  for (const wrapper of ['custom shell wrapper', '"%~dp0..\\Code.exe" "%~dp0..\\..\\resources\\app\\out\\cli.js" %*']) {
    fs.writeFileSync(launcher, wrapper)
    assert.equal(vscodeVersion(home, () => assert.fail('must not execute')), null)
  }
})

test('failed version command remains unknown and never picks another installation', t => {
  const { home } = installation(t)
  assert.equal(vscodeVersion(home, () => ({ status: 1, stdout: '2.0.0' })), null)
  assert.equal(vscodeVersion(home, () => ({ status: 0, stdout: 'unexpected output' })), null)
})
