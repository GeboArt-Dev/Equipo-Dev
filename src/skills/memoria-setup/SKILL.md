---
name: memoria-setup
description: Instala o verifica la memoria de largo plazo del equipo (Obsidian + Local REST API + obsidian-graph-memory). Idempotente. Úsalo cuando el usuario escriba /memoria-setup, /memoria-setup check o pida configurar la memoria compartida.
---
# /memoria-setup

Instala la memoria compartida entre proyectos. Es idempotente: detecta lo que existe y solo hace lo que falta. **Nunca bloquea**: si el dueño rechaza un paso, el equipo sigue funcionando sin memoria.

Scripts (en la raíz del plugin): `scripts/memoria/setup.ps1` (Windows) y `scripts/memoria/setup.sh` (macOS/Linux). Si `${CLAUDE_PLUGIN_ROOT}` no está disponible, búscalos con Glob en `~/.claude/plugins/**/scripts/memoria/`.

## Argumento
- Vacío → instalar.
- `check` → solo informar (no modifica nada, no pide confirmaciones).

## Flujo
1. **Diagnóstico**: ejecuta cada paso con `-Check` (PowerShell: `-File setup.ps1 -Step <paso> -Check`; bash: `setup.sh --step <paso> --check`). Pasos: `node`, `obsidian`, `vault`, `plugin`, `apikey`, `config`, `mcp`, y `autostart` (solo Windows, opcional). Presenta una tabla OK / FALTA / ERROR.
2. Si el argumento es `check`, detente aquí.
3. **Ruta del vault**: propón `~/Documents/EquipoDev-Memoria` (Windows: `C:\Users\<usuario>\Documents\EquipoDev-Memoria`). El dueño puede indicar otra; si no responde, usa la de por defecto. Pásala con `-VaultPath` / `--vault`.
4. **Confirmación**: lista los pasos en FALTA y pide un sí/no explícito por cada acción sobre el sistema (instalar Node/Obsidian, crear el vault, definir variables de usuario, registrar el MCP, autoinicio). Sin "sí", no ejecutes ese paso.
5. **Ejecución**: orden `node → obsidian → vault → plugin → apikey → config → mcp → autostart`, un paso a la vez con `-Yes` / `--yes`, mostrando el resultado de cada uno.
6. **Acciones manuales** que el dueño debe hacer una vez: abrir Obsidian con el vault, activar "Plugins de la comunidad" y habilitar *Local REST API*; reiniciar Obsidian y Claude Code. Obsidian debe estar **abierto** para que la memoria responda.
7. **Verificación final**: si `mcp__graph-memory__graph_get_stats` está disponible, llámala y reporta el estado; si no, indica qué falta reiniciar.

## Reglas
- No imprimas, registres ni escribas la `OBSIDIAN_API_KEY` en ningún archivo del proyecto; vive solo como variable de usuario y en el `data.json` del plugin dentro del vault.
- El servidor HTTP del plugin escucha solo en `127.0.0.1:27123`; `obsidian-graph-memory@1.0.1` es de solo lectura y no acepta HTTPS autofirmado.
- En Windows el MCP se registra con `cmd /c npx -y obsidian-graph-memory@1.0.1`.
- No uses `--force`, no borres el vault ni sobrescribas notas existentes.
- Desinstalar: `claude mcp remove graph-memory --scope user`, quitar las variables `OBSIDIAN_API_KEY` y `OBSIDIAN_VAULT_PATH` y, si se desea, borrar el vault manualmente (pide confirmación al dueño).
