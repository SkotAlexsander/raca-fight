// Embute o sprite dos ícones (../sprite.svg) nas páginas do mockup (agente Q, P09, 10/10/2026).
// Por file:// o Chrome não deixa <use> buscar outro arquivo, então cada página leva uma cópia.
// A cópia fica entre os marcadores <!-- ICONES:INICIO --> e <!-- ICONES:FIM -->.
// Rode depois de `python -I gerar.py`:
//   node embutir.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const sprite = readFileSync(join(aqui, '..', 'sprite.svg'), 'utf8')
const simbolos = sprite.match(/<symbol[\s\S]*?<\/symbol>/g)
const mockups = join(aqui, '..', '..', 'sistema-de-design', 'mockups')
const paginas = ['index.html', 'entrada.html', 'novas.html']

const bloco = '<!-- ICONES:INICIO — cópia de 02-design/icones/sprite.svg (gerar.py → embutir.mjs); não editar aqui -->\n'
  + simbolos.join('\n') + '\n<!-- ICONES:FIM -->'

for (const p of paginas) {
  const caminho = join(mockups, p)
  let html
  try { html = readFileSync(caminho, 'utf8') } catch { continue }
  const re = /<!-- ICONES:INICIO[\s\S]*?<!-- ICONES:FIM -->/
  if (!re.test(html)) { console.log(`${p}: sem marcadores, nada feito`); continue }
  writeFileSync(caminho, html.replace(re, () => bloco))
  console.log(`${p}: ${simbolos.length} símbolos`)
}
