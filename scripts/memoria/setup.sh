#!/usr/bin/env bash
# Instalador idempotente de la memoria de largo plazo (Obsidian + Local REST API + obsidian-graph-memory) para equipo-dev.
# 100% autónomo y funcional para usuarios externos del repositorio público de equipo-dev,
# y con delegación automática transparente hacia la suite canónica cuando opera dentro de TETE360.
# Uso: setup.sh [--step <node|obsidian|vault|plugin|apikey|config|mcp|all>] [--check] [--yes] [--vault <ruta>]
# Salida por paso: "<paso>: OK|FALTA|ERROR - detalle". Nunca imprime la API key.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CANONICAL="$SCRIPT_DIR/../../../scripts/memoria/setup.sh"
if [ -f "$CANONICAL" ] && [ -z "${EQUIPO_DEV_STANDALONE:-}" ]; then
  exec bash "$CANONICAL" "$@"
fi

# --- Modo Autónomo e Independiente para equipo-dev ---
STEP=all; CHECK=0; YES=0; VAULT="${OBSIDIAN_VAULT_PATH:-}"
GRAPH_PKG='obsidian-graph-memory@1.0.1'; PLUGIN_REPO='coddingtonbear/obsidian-local-rest-api'
PLUGIN_ID='obsidian-local-rest-api'; PORT=27123
HAS_FAILURES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --step) STEP="$2"; shift 2;;
    --check) CHECK=1; shift;;
    --yes) YES=1; shift;;
    --vault) VAULT="$2"; shift 2;;
    *) echo "argumento desconocido: $1"; exit 2;;
  esac
done

[ -z "$VAULT" ] && VAULT="$HOME/Documents/EquipoDev-Memoria"
PDIR="$VAULT/.obsidian/plugins/$PLUGIN_ID"
OS=$(uname -s)

out() {
  local name="$1" state="$2" detail="$3"
  if [ "$state" = "FALTA" ] || [ "$state" = "ERROR" ]; then
    HAS_FAILURES=1
  fi
  echo "$name: $state - $detail"
}

need_yes() {
  [ "$CHECK" = 1 ] && return 1
  [ "$YES" = 1 ] || { out "$1" FALTA "requiere confirmacion (use --yes tras aprobar)"; return 1; }
  return 0
}

profile_file() { case "${SHELL:-}" in */zsh) echo "$HOME/.zshrc";; *) echo "$HOME/.bashrc";; esac; }

step_node() {
  local v; v=$(node --version 2>/dev/null || true)
  if [[ "$v" =~ ^v([0-9]+) ]] && [ "${BASH_REMATCH[1]}" -ge 18 ]; then out node OK "$v"; return; fi
  [ "$CHECK" = 1 ] && { out node FALTA "instale Node.js >= 18 (https://nodejs.org o gestor de paquetes)"; return; }
  need_yes node || return
  if [ "$OS" = Darwin ] && command -v brew >/dev/null; then brew install node >/dev/null && out node OK instalado
  else out node FALTA "instale Node.js >= 18 con su gestor de paquetes (apt/dnf/nvm)"; fi
}

step_obsidian() {
  if [ "$OS" = Darwin ] && [ -d /Applications/Obsidian.app ]; then out obsidian OK /Applications/Obsidian.app; return; fi
  if command -v obsidian >/dev/null || flatpak list 2>/dev/null | grep -qi obsidian || ls "$HOME"/Applications/Obsidian*.AppImage >/dev/null 2>&1; then out obsidian OK instalado; return; fi
  [ "$CHECK" = 1 ] && { out obsidian FALTA "macOS: brew install --cask obsidian | Linux: flatpak install flathub md.obsidian.Obsidian"; return; }
  need_yes obsidian || return
  if [ "$OS" = Darwin ]; then brew install --cask obsidian >/dev/null && out obsidian OK instalado
  else flatpak install -y flathub md.obsidian.Obsidian >/dev/null && out obsidian OK instalado; fi
}

step_vault() {
  local dirs=(Proyectos Decisiones Aprendizajes Personas)
  local ok=1
  [ -d "$VAULT/.obsidian" ] || ok=0
  [ -f "$VAULT/Inicio.md" ] || ok=0

  for d in "${dirs[@]}"; do
    [ -d "$VAULT/$d" ] || ok=0
    [ -f "$VAULT/$d/$d.md" ] || ok=0
  done

  if [ $ok -eq 1 ]; then out vault OK "$VAULT"; return; fi
  if [ "$CHECK" = 1 ]; then out vault FALTA "$VAULT"; return; fi
  need_yes vault || return

  mkdir -p "$VAULT/.obsidian"
  for d in "${dirs[@]}"; do
    mkdir -p "$VAULT/$d"
    local idx="$VAULT/$d/$d.md"
    if [ ! -f "$idx" ]; then
      local tag; tag=$(echo "$d" | tr '[:upper:]' '[:lower:]')
      cat <<EOF > "$idx"
---
tipo: indice
ambito: compartido
estado: vigente
tags: [$tag, indice]
---

# $d

Índice canónico de $d para equipo-dev.

- [[Inicio|← Inicio de la Bóveda]]
EOF
    fi
  done

  if [ ! -f "$VAULT/Inicio.md" ]; then
    cat <<EOF > "$VAULT/Inicio.md"
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
EOF
  fi

  out vault OK "$VAULT"
}

step_plugin() {
  if [ -f "$PDIR/main.js" ] && [ -f "$PDIR/manifest.json" ]; then out plugin OK "instalado en $PDIR"; return; fi
  [ "$CHECK" = 1 ] && { out plugin FALTA "Local REST API no instalado en el vault"; return; }
  need_yes plugin || return
  [ -d "$VAULT" ] || { out plugin ERROR "cree primero el vault (--step vault)"; return; }
  mkdir -p "$PDIR"
  local base="https://github.com/$PLUGIN_REPO/releases/latest/download" f
  for f in main.js manifest.json styles.css; do
    curl -fsSL "$base/$f" -o "$PDIR/$f" || { [ "$f" = styles.css ] || { out plugin ERROR "no se pudo descargar $f"; return; }; }
  done
  node -e '
    const fs=require("fs"),p=process.argv[1],id=process.argv[2];
    let l=[];try{l=JSON.parse(fs.readFileSync(p,"utf8"))}catch{}
    if(!l.includes(id))l.push(id);fs.writeFileSync(p,JSON.stringify(l))' "$VAULT/.obsidian/community-plugins.json" "$PLUGIN_ID"
  out plugin OK "descargado; en Obsidian: Ajustes > Plugins de la comunidad > activar"
}

step_apikey() {
  if [ -n "${OBSIDIAN_API_KEY:-}" ]; then out apikey OK "OBSIDIAN_API_KEY definida (no se muestra)"; return; fi
  [ "$CHECK" = 1 ] && { out apikey FALTA "OBSIDIAN_API_KEY no definida"; return; }
  need_yes apikey || return
  local key; key=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
  local pf; pf=$(profile_file)
  { echo "export OBSIDIAN_API_KEY=\"$key\""; echo "export OBSIDIAN_VAULT_PATH=\"$VAULT\""; } >> "$pf"
  chmod 600 "$pf" 2>/dev/null || true
  out apikey OK "guardada en $pf; reinicie la terminal"
}

step_config() {
  local key="${OBSIDIAN_API_KEY:-}" f="$PDIR/data.json"
  [ -z "$key" ] && { [ "$CHECK" = 1 ] && out config FALTA "sin API key" || out config ERROR "ejecute --step apikey antes"; return; }
  if [ -f "$f" ] && node -e '
    const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
    process.exit(c.apiKey===process.argv[2]&&c.enableInsecureServer===true&&c.insecurePort==+process.argv[3]?0:1)' "$f" "$key" "$PORT" 2>/dev/null
  then out config OK "servidor HTTP en 127.0.0.1:$PORT"; return; fi
  [ "$CHECK" = 1 ] && { out config FALTA "data.json sin servidor HTTP o clave distinta"; return; }
  need_yes config || return
  [ -d "$PDIR" ] || { out config ERROR "plugin no instalado"; return; }
  node -e '
    const fs=require("fs"),f=process.argv[1];let c={};try{c=JSON.parse(fs.readFileSync(f,"utf8"))}catch{}
    c.apiKey=process.argv[2];c.enableInsecureServer=true;c.insecurePort=+process.argv[3];
    fs.writeFileSync(f,JSON.stringify(c,null,2))' "$f" "$key" "$PORT"
  chmod 600 "$f" 2>/dev/null || true
  out config OK "servidor HTTP en 127.0.0.1:$PORT (solo localhost); reinicie Obsidian"
}

step_mcp() {
  command -v claude >/dev/null || { out mcp FALTA "CLI claude no disponible; registre manualmente"; return; }
  if claude mcp list 2>&1 | grep -q graph-memory; then out mcp OK "graph-memory registrado"; return; fi
  [ "$CHECK" = 1 ] && { out mcp FALTA "graph-memory no registrado"; return; }
  need_yes mcp || return
  claude mcp add graph-memory --scope user -e "OBSIDIAN_API_KEY=${OBSIDIAN_API_KEY:-}" -- npx -y "$GRAPH_PKG" >/dev/null
  out mcp OK "registrado $GRAPH_PKG (reinicie Claude Code)"
}

if [ "$STEP" = all ]; then steps="node obsidian vault plugin apikey config mcp"; else steps="$STEP"; fi
for s in $steps; do
  case "$s" in node|obsidian|vault|plugin|apikey|config|mcp) "step_$s";; *) out "$s" ERROR "paso desconocido";; esac
done

if [ "$HAS_FAILURES" -ne 0 ]; then exit 1; else exit 0; fi
