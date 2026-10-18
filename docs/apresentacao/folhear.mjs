// Renderiza páginas do PDF em PNG para conferir (o Read de PDF nesta máquina não tem pdftoppm).
// Uso: node folhear.mjs [páginas, ex.: 1,2,5-8]   → _capturas/_pdf/pagina-NN.png (e uma folha de contato)
// Usa o pdf.js do cdnjs dentro do Chromium do Playwright.
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrirNavegador } from './navegador.mjs'
const ARQUIVO = 'Academia Plus - Ideia, estrutura e design.pdf'

const aqui = dirname(fileURLToPath(import.meta.url))
const saida = join(aqui, '_capturas', '_pdf'); mkdirSync(saida, { recursive: true })
const pdf = readFileSync(join(aqui, 'saida', ARQUIVO)).toString('base64')
const pedido = process.argv[2] || ''
const quer = new Set(); for (const t of pedido.split(',').filter(Boolean)) { const [a, b] = t.split('-').map(Number); for (let i = a; i <= (b || a); i++) quer.add(i) }

const navegador = await abrirNavegador()
const p = await navegador.newPage({ viewport: { width: 1200, height: 1700 } })
await p.setContent(`<html><body style="margin:0"><canvas id="c"></canvas><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs" type="module"></script></body></html>`)
await p.waitForFunction(() => globalThis.pdfjsLib, null, { timeout: 30000 })
const total = await p.evaluate(async (b64) => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  window.doc = await pdfjsLib.getDocument({ data: bytes }).promise
  return window.doc.numPages
}, pdf)
const paginas = quer.size ? [...quer].filter((n) => n <= total) : Array.from({ length: total }, (_, i) => i + 1)
for (const n of paginas) {
  await p.evaluate(async (n) => {
    const pg = await window.doc.getPage(n); const vp = pg.getViewport({ scale: 1.6 })
    const c = document.getElementById('c'); c.width = vp.width; c.height = vp.height
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise
  }, n)
  const el = await p.$('#c')
  await el.screenshot({ path: join(saida, `pagina-${String(n).padStart(2, '0')}.png`) })
}
// folha de contato: miniaturas de todas as páginas pedidas, 4 por linha
await p.setViewportSize({ width: 1600, height: 200 + Math.ceil(paginas.length / 4) * 560 })
await p.setContent(`<html><body style="margin:16px;background:#ddd;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;font:12px sans-serif">${paginas.map((n) => `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(join(saida, `pagina-${String(n).padStart(2, '0')}.png`)).toString('base64')}" style="width:100%;box-shadow:0 1px 4px rgba(0,0,0,.3)"><figcaption>p. ${n}</figcaption></figure>`).join('')}</body></html>`)
await p.waitForTimeout(500)
await p.screenshot({ path: join(saida, 'contato.png'), fullPage: true })
await navegador.close()
console.log(`ok · ${paginas.length} de ${total} páginas em ${saida}`)
