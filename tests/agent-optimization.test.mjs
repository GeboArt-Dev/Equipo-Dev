import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from '../scripts/build.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AGENTS_DIR = path.join(ROOT, 'src', 'agents')

function readAgent(name) {
  const filePath = path.join(AGENTS_DIR, name)
  assert.ok(fs.existsSync(filePath), `El agente ${name} debe existir en ${AGENTS_DIR}`)
  const content = fs.readFileSync(filePath, 'utf8')
  const { attributes, body } = parseFrontmatter(content)
  return { content, attributes, body }
}

// 1. Ausencia de frases de cortesía comunes e imposición de concisión
test('Punto 1: Ausencia de saludos y frases de cortesía activas en agentes canónicos', () => {
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'))
  assert.equal(agentFiles.length, 7, 'Deben existir exactamente 7 agentes canónicos')

  const forbiddenActivePhrases = [
    '¡Hola! ¿En qué puedo ayudarte hoy?',
    'Con gusto te asisto',
    'A continuación presento el detalle de la solución',
    'Espero que esta información te sea de utilidad'
  ]

  for (const file of agentFiles) {
    const { body } = readAgent(file)
    for (const phrase of forbiddenActivePhrases) {
      assert.ok(
        !body.includes(phrase),
        `El agente ${file} contiene una frase de cortesía prohibida activa: "${phrase}"`
      )
    }

    // Todos los agentes deben normar explícitamente la ausencia de cortesías, saludos o preámbulos
    const mentionsZeroCourtesy = /cero (cortesías|saludos|preámbulos)/i.test(body)
    assert.ok(
      mentionsZeroCourtesy,
      `El agente ${file} debe incluir directiva expresa de cero cortesías, saludos o preámbulos`
    )
  }
})

// 2. Calibración epistémica y diagnóstico directo en product-owner.md y architect.md
test('Punto 2: Calibración epistémica y diagnóstico directo en product-owner.md', () => {
  const { body, attributes } = readAgent('product-owner.md')
  assert.equal(attributes.model_tier, 'pro')

  // Directiva de diagnóstico en primera frase
  assert.match(body, /diagnóstico/i, 'product-owner.md debe requerir diagnóstico en la primera oración')
  assert.match(body, /primera oración/i, 'product-owner.md debe especificar primera oración')

  // Taxonomía obligatoria de certeza
  assert.ok(body.includes('[Seguro]'), 'product-owner.md debe incluir etiqueta [Seguro]')
  assert.ok(body.includes('[Probable]'), 'product-owner.md debe incluir etiqueta [Probable]')
  assert.ok(body.includes('[Especulando]'), 'product-owner.md debe incluir etiqueta [Especulando]')

  // Estructura Gherkin y MoSCoW
  assert.match(body, /Gherkin/i, 'product-owner.md debe especificar criterios Gherkin medibles')
  assert.match(body, /MoSCoW/i, 'product-owner.md debe especificar prioridad MoSCoW')
  assert.ok(body.includes('Spec lista para aprobación del dueño'))
})

test('Punto 2: Calibración epistémica y asignación en architect.md', () => {
  const { body, attributes } = readAgent('architect.md')
  assert.equal(attributes.model_tier, 'pro')

  // Directiva de diagnóstico en primera frase
  assert.match(body, /diagnóstico/i, 'architect.md debe requerir diagnóstico en la primera frase')

  // Taxonomía obligatoria de certeza
  assert.ok(body.includes('[Seguro]'), 'architect.md debe incluir etiqueta [Seguro]')
  assert.ok(body.includes('[Probable]'), 'architect.md debe incluir etiqueta [Probable]')
  assert.ok(body.includes('[Especulando]'), 'architect.md debe incluir etiqueta [Especulando]')

  // Asignación explícita de responsabilidades en el plan
  assert.match(body, /backend-dev/i, 'architect.md debe asignar tareas a backend-dev')
  assert.match(body, /frontend-dev/i, 'architect.md debe asignar tareas a frontend-dev')
  assert.match(body, /qa-engineer/i, 'architect.md debe asignar tareas a qa-engineer')
  assert.match(body, /DevOps|Docker|CI-CD/i, 'architect.md debe referenciar DevOps/Docker/CI-CD para backend-dev')
  assert.match(body, /mobile-first|WCAG/i, 'architect.md debe referenciar mobile-first/WCAG para frontend-dev')
  assert.match(body, /README|documentación/i, 'architect.md debe referenciar README/documentación para qa-engineer')
  assert.ok(body.includes('ADR listo para aprobación del dueño'))
})

// 3. Capacidades DevOps y buenas prácticas en backend-dev.md
test('Punto 3: Directivas DevOps y calidad de código en backend-dev.md', () => {
  const { body, attributes } = readAgent('backend-dev.md')
  assert.equal(attributes.model_tier, 'balanced')

  // Dockerfile multi-stage y CI/CD YAML
  assert.match(body, /Dockerfile/i, 'backend-dev.md debe contener directiva para Dockerfile')
  assert.match(body, /multi-stage/i, 'backend-dev.md debe especificar Dockerfiles multi-stage')
  assert.match(body, /CI\/CD/i, 'backend-dev.md debe especificar integración CI/CD en YAML')
  assert.match(body, /YAML/i, 'backend-dev.md debe requerir YAML completo')

  // Instrucciones de despliegue compactas
  assert.match(body, /3 oraciones/i, 'backend-dev.md debe limitar instrucciones de despliegue a <= 3 oraciones')

  // Código completo y sin placeholders
  assert.match(body, /\/\/ implementar aquí/i, 'backend-dev.md debe prohibir comentarios de implementación pendiente')
  assert.match(body, /bloques ejecutables completos/i, 'backend-dev.md debe exigir bloques ejecutables completos')

  // Consultas optimizadas y seguridad
  assert.match(body, /parametrizadas/i, 'backend-dev.md debe requerir consultas parametrizadas')
  assert.match(body, /N\+1/i, 'backend-dev.md debe prevenir consultas N+1')
  assert.match(body, /secretos/i, 'backend-dev.md debe prohibir secretos en código y exigir variables de entorno')
  assert.match(body, /1 línea/i, 'backend-dev.md debe limitar comentarios a <= 1 línea')
})

// 4. Directivas mobile-first y WCAG 2.1 AA en ux-designer.md y frontend-dev.md
test('Punto 4: Directivas mobile-first y WCAG 2.1 AA en ux-designer.md', () => {
  const { body, attributes } = readAgent('ux-designer.md')
  assert.equal(attributes.model_tier, 'pro')

  assert.match(body, /mobile-first/i, 'ux-designer.md debe contener directiva mobile-first')
  assert.match(body, /WCAG 2\.1 AA/i, 'ux-designer.md debe exigir WCAG 2.1 AA')
  assert.match(body, /4\.5:1/, 'ux-designer.md debe especificar ratio de contraste 4.5:1')
  assert.match(body, /44(x| por )44|44px/, 'ux-designer.md debe especificar objetivo táctil mínimo de 44px')
  assert.match(body, /README/i, 'ux-designer.md debe preparar decisiones para el README')
})

test('Punto 4: Directivas mobile-first y WCAG 2.1 AA en frontend-dev.md', () => {
  const { body, attributes } = readAgent('frontend-dev.md')
  assert.equal(attributes.model_tier, 'balanced')

  assert.match(body, /mobile-first/i, 'frontend-dev.md debe contener directiva mobile-first')
  assert.match(body, /WCAG 2\.1 AA/i, 'frontend-dev.md debe exigir WCAG 2.1 AA')
  assert.match(body, /4\.5:1/, 'frontend-dev.md debe especificar ratio de contraste 4.5:1')
  assert.match(body, /44(x| por )44|44px/, 'frontend-dev.md debe especificar objetivos táctiles interactivos >= 44x44px')
  assert.match(body, /README/i, 'frontend-dev.md debe documentar decisiones en README')
  assert.match(body, /2 oraciones/i, 'frontend-dev.md debe limitar decisiones en README a <= 2 oraciones')
})

// 5. Integración de Documentador y suite mínima en qa-engineer.md
test('Punto 5: Suite mínima y función de Documentador en qa-engineer.md', () => {
  const { body, attributes } = readAgent('qa-engineer.md')
  assert.equal(attributes.model_tier, 'balanced')

  // Suite mínima sin redundancias
  assert.match(body, /1 caso feliz/i, 'qa-engineer.md debe exigir 1 caso feliz por criterio')
  assert.match(body, /1-2 casos límite/i, 'qa-engineer.md debe exigir 1-2 casos límite críticos')
  assert.match(body, /redundante|permutacion/i, 'qa-engineer.md debe prohibir permutaciones redundantes')

  // Documentador integrado
  assert.match(body, /README\.md/i, 'qa-engineer.md debe actualizar README.md')
  assert.match(body, /Nuevas Capacidades/i, 'qa-engineer.md debe actualizar sección de Nuevas Capacidades')
  assert.match(body, /Referencia Técnica de Funciones y Hooks/i, 'qa-engineer.md debe incluir Referencia Técnica')
  assert.match(body, /1 frase corta/i, 'qa-engineer.md debe documentar funciones/hooks en 1 frase corta')

  // Reporte binario
  assert.match(body, /APROBADO/i, 'qa-engineer.md debe emitir veredicto APROBADO')
  assert.match(body, /RECHAZADO/i, 'qa-engineer.md debe emitir veredicto RECHAZADO')
})

// 6. Filtro crítico exclusivo en code-reviewer.md
test('Punto 6: Exclusividad de hallazgos críticos en code-reviewer.md', () => {
  const { body, attributes } = readAgent('code-reviewer.md')
  assert.equal(attributes.model_tier, 'pro')

  // Exclusividad en bloqueantes y prohibición de estilo
  assert.match(body, /bloqueante/i, 'code-reviewer.md debe enfocar en hallazgos bloqueantes')
  assert.match(body, /prohibido reportar/i, 'code-reviewer.md debe prohibir reportar observaciones de estilo cosmético')
  assert.match(body, /OWASP/i, 'code-reviewer.md debe auditar seguridad OWASP')

  // Formato compacto de 1 línea
  assert.ok(body.includes('[Bloqueante]'), 'code-reviewer.md debe usar formato de 1 línea con [Bloqueante]')

  // Veredicto binario
  assert.ok(body.includes('LISTO PARA MERGE'), 'code-reviewer.md debe incluir veredicto LISTO PARA MERGE')
  assert.ok(body.includes('CAMBIOS REQUERIDOS'), 'code-reviewer.md debe incluir veredicto CAMBIOS REQUERIDOS')
})
