---
name: equipo-reiniciar
description: Vacía la bitácora del equipo de desarrollo para empezar una feature nueva en este proyecto. Úsalo solo cuando el usuario escriba /equipo-reiniciar.
---
# Reiniciar la bitácora del equipo (Antigravity)

La carpeta del plugin es la que está dos niveles por encima de la carpeta de este `SKILL.md` (`<plugin>/skills/equipo-reiniciar/SKILL.md`).

1. Ejecuta: `node "<plugin>/hooks/bitacora.mjs" --reset "<raíz del proyecto>"`
   Pasa siempre la raíz del proyecto: sin ella se vaciaría la bitácora de todos los proyectos.
2. Responde en una línea con el resultado del comando. No toques `docs/` ni ningún otro archivo: los archivos de la feature se conservan.

