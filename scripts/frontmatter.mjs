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

