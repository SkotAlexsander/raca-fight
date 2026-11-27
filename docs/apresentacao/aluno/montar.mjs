// Monta o PDF do aluno da Raça Fight (A4 deitado) e confere cada página antes de imprimir. Agente AT, 15/10/2026.
// Mesmo método e mesmas conferências do PDF do admin (admin/montar.mjs, do AR), para os três PDFs serem uma família.
// As páginas saem de paginas.mjs; as telas, de _capturas/ (capturar.mjs). Não há números calculados neste PDF.
//
// Uso (de dentro de docs/apresentacao/aluno):
//   node capturar.mjs   → fotos, logo, as telas do AL e os esboços em _capturas/
//   node montar.mjs     → gera aluno.html e saida/Raça Fight — Aluno.pdf, e copia para A:\Projetos\10-10-26 Raça Fight - Academia Plus (app)//   node folhear.mjs    → cada página em PNG (_capturas/_pdf/) para conferir a olho
// Variável: SEM_COPIA=1 não copia para A:\Projetos.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { abrirNavegador } from './navegador.mjs'
import { paginas } from './paginas.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
export const ARQUIVO = 'Raça Fight — Aluno.pdf'
const COPIA = 'A:/Projetos/10-10-26 Raça Fight - Academia Plus (app)'
const TITULO = 'Raça Fight · O app do aluno'

// 1. o que vem de fora (capturar.mjs)
const svg = (f) => { const p = join(aqui, '_capturas', 'marca', f); return existsSync(p) ? `data:image/svg+xml;base64,${readFileSync(p).toString('base64')}` : null }
const faltam = []
const img = (pasta, id) => { const f = `_capturas/${pasta}/${id}.jpg`; if (!existsSync(join(aqui, f))) faltam.push(f); return f }
const x = {
  logoCompleto: svg('raca-fight-completo-escuro.svg'),
  fotoCapa: '_capturas/fotos/capa.jpg',
  fotoAcademia: '_capturas/fotos/academia.jpg',
  tela: (id) => img('telas', id),
  esboco: (id) => img('esbocos', id),
  // AV (16/10): as telas do app CONSTRUÍDO, de ../app-capturas/capturar-app.mjs
  app: (id) => { const f = `../app-capturas/${id}.png`; if (!existsSync(join(aqui, f))) faltam.push(f); return f },
}

// 2. as páginas, numeradas, com o rodapé
const lista = paginas(x)
for (const f of [x.fotoCapa, x.fotoAcademia]) if (!existsSync(join(aqui, f))) faltam.push(f)
if (faltam.length) { console.error(`falta(m): ${faltam.join(', ')}. Rode antes node capturar.mjs`); process.exit(1) }
const total = lista.length
const numero = Object.fromEntries(lista.map((p, i) => [p.id, i + 1]))
const corpo = lista.map((p, i) => {
  if (p.capa) return `<section class="pg capa" id="${p.id}">${p.html}</section>`
  return `<section class="pg" id="${p.id}">
    <header class="pg__topo"><p class="olho">${p.olho}</p><h1>${p.titulo}</h1>${p.lide ? `<p class="lide">${p.lide}</p>` : ''}</header>
    <div class="pg__corpo">${p.corpo}</div>
    <footer class="pg__rodape"><span><b>RAÇA FIGHT</b> · O app do aluno · versão de 16/10/2026</span><span class="exemplo">Nomes de pessoas inventados; grade, endereço e WhatsApp reais</span><span>${i + 1} / ${total}</span></footer>
  </section>`
}).join('\n').replace(/\{\{p:([\w-]+)\}\}/g, (_, id) => { if (!numero[id]) throw new Error(`sumário aponta para página que não existe: ${id}`); return String(numero[id]) })

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${TITULO}</title>
<style>${readFileSync(join(aqui, 'aluno.css'), 'utf8')}</style></head><body>
${corpo}
</body></html>`
const arqHtml = join(aqui, 'aluno.html')
writeFileSync(arqHtml, html)

// 4. conferir no navegador e imprimir
const navegador = await abrirNavegador()
const pg = await navegador.newPage({ viewport: { width: 1123, height: 794 } })
await pg.goto(pathToFileURL(arqHtml).href, { waitUntil: 'networkidle' })
await pg.emulateMedia({ media: 'print' })
await pg.evaluate(() => document.fonts.ready)
const avisos = []
const fontes = await pg.evaluate(() => [...document.fonts].filter((f) => f.status === 'error').map((f) => `${f.family} ${f.weight}`))
if (fontes.length) avisos.push(`fontes que não carregaram: ${fontes.join(', ')}`)
const imgs = await pg.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute('src').slice(0, 60)))
if (imgs.length) avisos.push(`imagens que não abriram: ${imgs.join(', ')}`)
const problemas = await pg.evaluate(() => {
  const out = []
  for (const s of document.querySelectorAll('section.pg')) {
    const caixa = s.getBoundingClientRect()
    const c = s.querySelector('.pg__corpo')
    if (c && c.scrollHeight > c.clientHeight + 1) out.push(`${s.id}: o corpo passa ${c.scrollHeight - c.clientHeight}px da página`)
    if (s.scrollHeight > s.clientHeight + 1) out.push(`${s.id}: a página passa ${s.scrollHeight - s.clientHeight}px`)
    for (const e of s.querySelectorAll('*')) {
      const r = e.getBoundingClientRect()
      if (!r.width || !r.height || e.closest('.recorte')) continue
      if (r.right > caixa.right + 0.5 || r.bottom > caixa.bottom + 0.5) { out.push(`${s.id}: ${e.tagName.toLowerCase()}.${e.className} sai da página`); break }
    }
    for (const e of s.querySelectorAll('.tela, .tela__corpo, .cx, .tabela-cx, .folha, .caixa, .pergunta, .degrau, .app, .traz, .coluna-sai, .cels, .texto-col, td, th')) {
      if (e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflowY !== 'visible') out.push(`${s.id}: ${e.tagName.toLowerCase()}.${e.className} corta ${e.scrollHeight - e.clientHeight}px na altura ("${e.textContent.trim().slice(0, 40)}")`)
      if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible') out.push(`${s.id}: ${e.tagName.toLowerCase()}.${e.className} corta ${e.scrollWidth - e.clientWidth}px na largura ("${e.textContent.trim().slice(0, 40)}")`)
    }
  }
  return out
})
avisos.push(...problemas)
// tamanhos de letra fora da escala do projeto
const fora = await pg.evaluate(() => {
  const escala = new Set([13, 16, 20, 25, 31, 39, 49, 61])
  const vistos = new Map()
  for (const e of document.querySelectorAll('section.pg *')) {
    if (!e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
    if (e.closest('svg')) continue
    const t = Math.round(parseFloat(getComputedStyle(e).fontSize))
    if (!escala.has(t)) vistos.set(t, (vistos.get(t) ?? 0) + 1)
  }
  return [...vistos].map(([t, n]) => `${t}px (${n}×)`)
})
if (fora.length) avisos.push(`letra fora da escala 13·16·20·25·31·39·49·61: ${fora.join(', ')}`)

mkdirSync(join(aqui, 'saida'), { recursive: true })
const pdf = join(aqui, 'saida', ARQUIVO)
await pg.pdf({ path: pdf, printBackground: true, preferCSSPageSize: true, outline: true, tagged: true })
await navegador.close()

const paginasNoPdf = (readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length
const mb = statSync(pdf).size / 1024 / 1024
if (paginasNoPdf !== total) avisos.push(`o PDF tem ${paginasNoPdf} páginas, mas foram montadas ${total}: alguma página quebrou em duas`)
if (mb >= 20) avisos.push(`o PDF tem ${mb.toFixed(1)} MB (limite: 20 MB)`)
console.log(`ok · ${total} páginas · ${mb.toFixed(2)} MB → ${pdf}`)
if (!process.env.SEM_COPIA) {
  mkdirSync(COPIA, { recursive: true })
  copyFileSync(pdf, join(COPIA, ARQUIVO))
  console.log(`  cópia → ${join(COPIA, ARQUIVO)}`)
}
if (avisos.length) { console.log('  ATENÇÃO:\n  - ' + avisos.join('\n  - ')); process.exitCode = 1 }
