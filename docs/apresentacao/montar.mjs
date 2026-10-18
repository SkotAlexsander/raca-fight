// Monta a apresentação do Academia Plus (A4) e imprime em PDF. Método copiado do Valores (docs/apresentacao).
// Uso: node montar.mjs     (de dentro de docs/apresentacao; antes, node capturar.mjs gera as imagens)
// Texto: partes/*.html, na ordem do nome. Estilo: apresentacao.css. Imagens: _capturas/.
// Saída: apresentacao.html (gerado, não editar) e saida/<ARQUIVO>.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { abrirNavegador } from './navegador.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
export const ARQUIVO = 'Academia Plus - Ideia, estrutura e design.pdf'
const TITULO = 'Academia Plus · A ideia, a estrutura e o design'
const DATA = '11/10/2026'
const LARGURA_UTIL = Math.floor((210 - 34) / 25.4 * 96)

const partes = readdirSync(join(aqui, 'partes')).filter((f) => f.endsWith('.html')).sort()
const corpo = partes.map((f) => readFileSync(join(aqui, 'partes', f), 'utf8')).join('\n')
// imagens referenciadas que não existem → aviso antes de imprimir
const faltam = [...corpo.matchAll(/src="_capturas\/([^"]+)"/g)].map((m) => m[1]).filter((f) => !existsSync(join(aqui, '_capturas', f)))
if (faltam.length) console.log('  atenção: capturas que não existem:', [...new Set(faltam)].join(', '))

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${TITULO}</title>
<style>${readFileSync(join(aqui, 'apresentacao.css'), 'utf8')}</style></head>
<body>
${corpo}
</body></html>`
const arqHtml = join(aqui, 'apresentacao.html')
writeFileSync(arqHtml, html)

const navegador = await abrirNavegador()
const p = await navegador.newPage({ viewport: { width: LARGURA_UTIL, height: 1100 } })
await p.goto(pathToFileURL(arqHtml).href, { waitUntil: 'networkidle' })
await p.emulateMedia({ media: 'print' })
await p.evaluate(() => document.fonts.ready)

const fontes = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'error').map((f) => `${f.family} ${f.weight}`))
if (fontes.length) console.log('  atenção: fontes que não carregaram (sai com a letra do sistema):', fontes.join(', '))

const vazou = await p.evaluate((lim) => [...document.querySelectorAll('table, pre, .fluxo, .numeros, .grade, .entidades, .tokens, .camadas, figure, .capa__ficha')]
  .filter((e) => e.getBoundingClientRect().right > lim + 1 || e.scrollWidth > e.clientWidth + 1)
  .map((e) => `${e.closest('section')?.id || '?'} → ${e.tagName.toLowerCase()}.${e.getAttribute('class') || ''}`), LARGURA_UTIL)
if (vazou.length) console.log('  atenção, passa da coluna:', vazou.join(' · '))
// página quase vazia ou elemento que não cabe numa página (altura útil A4 ≈ 259 mm)
const ALTURA_UTIL = Math.floor((297 - 36) / 25.4 * 96)
const altas = await p.evaluate((lim) => [...document.querySelectorAll('figure, .trilha, .mapa, .visoes, .celulares, .componentes, table, .diagrama')]
  .filter((e) => e.getBoundingClientRect().height > lim).map((e) => `${e.closest('section')?.id || '?'} → ${e.tagName.toLowerCase()}.${e.getAttribute('class') || ''}`), ALTURA_UTIL)
if (altas.length) console.log('  atenção, mais alto que uma página:', altas.join(' · '))

const rodape = `<div style="width:100%;padding:0 17mm;display:flex;justify-content:space-between;font:8px 'Segoe UI',sans-serif;color:#66736F">
  <span>${TITULO} · ${DATA}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`

mkdirSync(join(aqui, 'saida'), { recursive: true })
const pdf = join(aqui, 'saida', ARQUIVO)
await p.pdf({
  path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: rodape,
  outline: true, tagged: true,
})
await navegador.close()

const paginas = (readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length
console.log(`ok · ${partes.length} partes · ${paginas} páginas → ${pdf}`)
if (fontes.length || vazou.length || faltam.length || altas.length) process.exitCode = 1
