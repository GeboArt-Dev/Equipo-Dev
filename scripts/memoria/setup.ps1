<#
.SYNOPSIS
  Instalador idempotente de la memoria de largo plazo (Obsidian + Local REST API + obsidian-graph-memory) para equipo-dev.
  100% autónomo y funcional para usuarios externos del repositorio público de equipo-dev,
  y con delegación automática transparente hacia la suite canónica cuando opera dentro de TETE360.
.DESCRIPTION
  Cada paso se ejecuta por separado con -Step y admite -Check (solo informa, no modifica nada).
  Pasos: node, obsidian, vault, plugin, config, apikey, mcp, autostart, all.
  Salida por paso: "<paso>: OK|FALTA|ERROR - detalle". Nunca imprime la API key.
  Los pasos que modifican el sistema solo se ejecutan con -Yes.
#>
param(
  [ValidateSet('node','obsidian','vault','plugin','config','apikey','mcp','autostart','all')]
  [string]$Step = 'all',
  [switch]$Check,
  [switch]$Yes,
  [string]$VaultPath
)

# Delegacion transparente al canonico si esta dentro de TETE360 y no se fuerza modo standalone
$candidatePaths = @(
  (Join-Path $PSScriptRoot '..\..\..\..\scripts\memoria\setup.ps1'),
  (Join-Path $PSScriptRoot '..\..\..\scripts\memoria\setup.ps1')
)
$canonicalScript = $candidatePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($canonicalScript -and (-not $env:EQUIPO_DEV_STANDALONE)) {
  & $canonicalScript @PSBoundParameters @args
  exit $LASTEXITCODE
}

# --- Modo Autonomo e Independiente para equipo-dev ---
$ErrorActionPreference = 'Stop'
$GraphMemoryPkg = 'obsidian-graph-memory@1.0.1'
$PluginRepo = 'coddingtonbear/obsidian-local-rest-api'
$PluginId = 'obsidian-local-rest-api'
$Port = 27123
$script:hasFailures = $false

if (-not $VaultPath) { $VaultPath = $env:OBSIDIAN_VAULT_PATH }
if (-not $VaultPath) { $VaultPath = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'EquipoDev-Memoria' }

function Out-Step($name, $state, $detail) {
  if ($state -in @('FALTA', 'ERROR')) { $script:hasFailures = $true }
  Write-Output ("{0}: {1} - {2}" -f $name, $state, $detail)
}

function Need-Yes($name) {
  if ($Check) { return $false }
  if (-not $Yes) { Out-Step $name 'FALTA' 'requiere confirmacion (use -Yes tras aprobar)'; return $false }
  return $true
}

function Get-ApiKey {
  $k = [Environment]::GetEnvironmentVariable('OBSIDIAN_API_KEY', 'User')
  if (-not $k) { $k = $env:OBSIDIAN_API_KEY }
  return $k
}

function Find-Obsidian {
  $c = @("$env:LOCALAPPDATA\Programs\Obsidian\Obsidian.exe", "$env:ProgramFiles\Obsidian\Obsidian.exe")
  return ($c | Where-Object { Test-Path $_ } | Select-Object -First 1)
}

function Plugin-Dir { Join-Path $VaultPath ".obsidian\plugins\$PluginId" }

function Step-Node {
  $v = $null
  try { $v = (& node --version) 2>$null } catch {}
  if ($v -match '^v(\d+)' -and [int]$Matches[1] -ge 18) { Out-Step 'node' 'OK' $v; return }
  if (-not (Need-Yes 'node')) { if ($Check) { Out-Step 'node' 'FALTA' 'instale Node.js >= 18: winget install OpenJS.NodeJS.LTS' }; return }
  winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements | Out-Null
  Out-Step 'node' 'OK' 'instalado; abra una terminal nueva para que quede en PATH'
}

function Step-Obsidian {
  $exe = Find-Obsidian
  if ($exe) { Out-Step 'obsidian' 'OK' $exe; return }
  if (-not (Need-Yes 'obsidian')) { if ($Check) { Out-Step 'obsidian' 'FALTA' 'winget install --id Obsidian.Obsidian -e' }; return }
  winget install --id Obsidian.Obsidian -e --accept-package-agreements --accept-source-agreements | Out-Null
  Out-Step 'obsidian' 'OK' 'instalado'
}

function Step-Vault {
  $dirs = @('Proyectos','Decisiones','Aprendizajes','Personas')
  $hasObsidian = Test-Path (Join-Path $VaultPath '.obsidian')
  $missingDirs = @()
  $missingIndices = @()

  foreach ($d in $dirs) {
    $dirPath = Join-Path $VaultPath $d
    if (-not (Test-Path $dirPath)) {
      $missingDirs += $d
    } else {
      $indexPath = Join-Path $dirPath "$d.md"
      if (-not (Test-Path $indexPath)) {
        $missingIndices += "$d/$d.md"
      }
    }
  }

  $inicio = Join-Path $VaultPath 'Inicio.md'
  $hasInicio = Test-Path $inicio

  $ok = $hasObsidian -and ($missingDirs.Count -eq 0) -and ($missingIndices.Count -eq 0) -and $hasInicio
  if ($ok) { Out-Step 'vault' 'OK' $VaultPath; return }

  if (-not (Need-Yes 'vault')) {
    if ($Check) {
      $detalles = @()
      if (-not $hasObsidian) { $detalles += 'falta .obsidian' }
      if ($missingDirs.Count -gt 0) { $detalles += ('carpetas faltantes: ' + ($missingDirs -join ', ')) }
      if ($missingIndices.Count -gt 0) { $detalles += ('indices faltantes: ' + ($missingIndices -join ', ')) }
      if (-not $hasInicio) { $detalles += 'falta Inicio.md' }
      Out-Step 'vault' 'FALTA' ("{0} ({1})" -f $VaultPath, ($detalles -join '; '))
    }
    return
  }

  # Creacion idempotente con indices homonimos
  New-Item -ItemType Directory -Force -Path (Join-Path $VaultPath '.obsidian') | Out-Null
  foreach ($d in $dirs) {
    $dirPath = Join-Path $VaultPath $d
    if (-not (Test-Path $dirPath)) {
      New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
    }
    $indexPath = Join-Path $dirPath "$d.md"
    if (-not (Test-Path $indexPath)) {
      $tag = $d.ToLower()
      $content = @"
---
tipo: indice
ambito: compartido
estado: vigente
tags: [$tag, indice]
---

# $d

Índice canónico de $d para equipo-dev.

- [[Inicio|← Inicio de la Bóveda]]
"@
      Set-Content -Path $indexPath -Encoding UTF8 -Value $content
    }
  }

  if (-not (Test-Path $inicio)) {
    $inicioContent = @"
---
tipo: indice
ambito: compartido
estado: vigente
tags: [inicio, indice]
---

# Memoria del equipo

Bóveda compartida entre proyectos de equipo-dev.

- [[Proyectos/Proyectos|Proyectos]]
- [[Decisiones/Decisiones|Decisiones]]
- [[Aprendizajes/Aprendizajes|Aprendizajes]]
- [[Personas/Personas|Personas]]
"@
    Set-Content -Path $inicio -Encoding UTF8 -Value $inicioContent
  }

  Out-Step 'vault' 'OK' $VaultPath
}

function Step-Plugin {
  $dir = Plugin-Dir
  if ((Test-Path "$dir\main.js") -and (Test-Path "$dir\manifest.json")) { Out-Step 'plugin' 'OK' "instalado en $dir"; return }
  if (-not (Need-Yes 'plugin')) { if ($Check) { Out-Step 'plugin' 'FALTA' 'Local REST API no instalado en el vault' }; return }
  if (-not (Test-Path $VaultPath)) { Out-Step 'plugin' 'ERROR' 'cree primero el vault (-Step vault)'; return }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $rel = Invoke-RestMethod "https://api.github.com/repos/$PluginRepo/releases/latest" -Headers @{ 'User-Agent' = 'equipo-dev' }
  foreach ($f in 'main.js','manifest.json','styles.css') {
    $a = $rel.assets | Where-Object { $_.name -eq $f }
    if ($a) { Invoke-WebRequest $a.browser_download_url -OutFile (Join-Path $dir $f) -UseBasicParsing }
    elseif ($f -ne 'styles.css') { Out-Step 'plugin' 'ERROR' "release sin $f"; return }
  }
  $cp = Join-Path $VaultPath '.obsidian\community-plugins.json'
  $list = @(); if (Test-Path $cp) { $list = @(Get-Content $cp -Raw | ConvertFrom-Json) }
  if ($list -notcontains $PluginId) { $list += $PluginId; ConvertTo-Json -InputObject $list | Set-Content $cp -Encoding UTF8 }
  Out-Step 'plugin' 'OK' ("release {0}; en Obsidian: Ajustes > Plugins de la comunidad > activar" -f $rel.tag_name)
}

function Step-Apikey {
  if (Get-ApiKey) { Out-Step 'apikey' 'OK' 'OBSIDIAN_API_KEY definida (no se muestra)'; return }
  if (-not (Need-Yes 'apikey')) { if ($Check) { Out-Step 'apikey' 'FALTA' 'OBSIDIAN_API_KEY no definida' }; return }
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $key = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
  [Environment]::SetEnvironmentVariable('OBSIDIAN_API_KEY', $key, 'User')
  [Environment]::SetEnvironmentVariable('OBSIDIAN_VAULT_PATH', $VaultPath, 'User')
  Out-Step 'apikey' 'OK' 'generada y guardada como variable de usuario; reinicie la terminal'
}

function Step-Config {
  $f = Join-Path (Plugin-Dir) 'data.json'
  $key = Get-ApiKey
  if (-not $key) { if ($Check) { Out-Step 'config' 'FALTA' 'sin API key' } else { Out-Step 'config' 'ERROR' 'ejecute -Step apikey antes' }; return }
  $cfg = $null
  if (Test-Path $f) { try { $cfg = Get-Content $f -Raw | ConvertFrom-Json } catch {} }
  if ($cfg -and $cfg.apiKey -eq $key -and $cfg.enableInsecureServer -eq $true -and $cfg.insecurePort -eq $Port -and $cfg.insecureHost -ne '0.0.0.0') {
    Out-Step 'config' 'OK' "servidor HTTP en 127.0.0.1:$Port"; return
  }
  if (-not (Need-Yes 'config')) { if ($Check) { Out-Step 'config' 'FALTA' 'data.json sin servidor HTTP o clave distinta' }; return }
  if (-not (Test-Path (Plugin-Dir))) { Out-Step 'config' 'ERROR' 'plugin no instalado'; return }
  $h = @{}; if ($cfg) { $cfg.PSObject.Properties | ForEach-Object { $h[$_.Name] = $_.Value } }
  $h['apiKey'] = $key; $h['enableInsecureServer'] = $true; $h['insecurePort'] = $Port
  $h | ConvertTo-Json | Set-Content $f -Encoding UTF8
  Out-Step 'config' 'OK' "servidor HTTP en 127.0.0.1:$Port (solo localhost); reinicie Obsidian"
}

function Step-Mcp {
  $listed = ''
  try { $listed = (& claude mcp list) 2>&1 | Out-String } catch {}
  if ($listed -match 'graph-memory') { Out-Step 'mcp' 'OK' 'graph-memory registrado'; return }
  if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Out-Step 'mcp' 'FALTA' 'CLI claude no disponible; registre manualmente'; return }
  if (-not (Need-Yes 'mcp')) { if ($Check) { Out-Step 'mcp' 'FALTA' 'graph-memory no registrado' }; return }
  & claude mcp add graph-memory --scope user -e "OBSIDIAN_API_KEY=$(Get-ApiKey)" -- cmd /c npx -y $GraphMemoryPkg | Out-Null
  Out-Step 'mcp' 'OK' "registrado $GraphMemoryPkg (reinicie Claude Code)"
}

function Step-Autostart {
  $lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Obsidian-EquipoDev.lnk'
  if (Test-Path $lnk) { Out-Step 'autostart' 'OK' 'acceso directo presente'; return }
  if (-not (Need-Yes 'autostart')) { if ($Check) { Out-Step 'autostart' 'FALTA' 'opcional: Obsidian no inicia con Windows' }; return }
  $exe = Find-Obsidian
  if (-not $exe) { Out-Step 'autostart' 'ERROR' 'Obsidian no instalado'; return }
  $s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
  $s.TargetPath = $exe; $s.Save()
  Out-Step 'autostart' 'OK' 'Obsidian iniciara con Windows'
}

$all = 'node','obsidian','vault','plugin','apikey','config','mcp','autostart'
$run = if ($Step -eq 'all') { $all } else { @($Step) }
foreach ($s in $run) {
  try { & ("Step-" + (Get-Culture).TextInfo.ToTitleCase($s)) } catch { Out-Step $s 'ERROR' $_.Exception.Message }
}

if ($script:hasFailures) { exit 1 } else { exit 0 }
