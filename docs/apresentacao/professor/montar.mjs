// Monta o PDF do professor e da recepção da Raça Fight (A4 deitado) e confere cada página antes de imprimir.
// Agente AS, 15/10/2026. Mesmo método do PDF do admin (docs/apresentacao/admin/montar.mjs): HTML + CSS → Playwright → PDF.
// Aqui não há número de dinheiro (o professor nunca vê valor): os exemplos são nomes inventados e a grade real.
//
// Uso (de dentro de docs/apresentacao/professor):
//   node capturar.mjs   → fotos, logo e as telas prontas do AL (luta.html, entrada.html) em _capturas/
//   node montar.mjs     → gera professor.html e saida/Raça Fight — Professor.pdf, e copia para A:\Projetos\10-10-26 Raça Fight - Academia Plus (app)\
//   node folhear.mjs    → cada página em PNG (_capturas/_pdf/) para conferir a olho
// Variáveis: ESBOCOS=1 ignora as capturas de telas que também têm esboço; SEM_COPIA=1 não copia para A:\Projetos.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { abrirNavegador } from './navegador.mjs'
import { paginas } from './paginas.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
export const ARQUIVO = 'Raça Fight — Professor.pdf'
const COPIA = 'A:/Projetos/10-10-26 Raça Fight - Academia Plus (app)'
const TITULO = 'Raça Fight · Professor e recepção, a equipe no tatame'
const HOJE = '16/10/2026'
// telas que só existem como captura (as que o AL desenhou); as outras têm esboço em paginas.mjs
const SO_CAPTURA = new Set(['boas-vindas', 'equipe-entrar', 'equipe-convite', 'equipe-pendente', 'aluno-inicio', 'aluno-checkin-feito', 'cronometro', 'hoje', 'chamada'])
// nomes reais do Instagram da academia (02-design/referencias/raca-fight/01-DADOS-REAIS.md): não podem aparecer
const NOMES_REAIS = ['Moreschi', 'Rafael', 'João', 'Thales', 'Juliana', 'Toledo', 'Richard', 'Cardozo', 'Norton', 'Duarte', 'Arthur', 'Rodrigues', 'Leonardo', 'Schutz', 'Bruno', 'Cesar', 'Carlos', 'Eduardo', 'Caio']

const svg = (f) => { const p = join(aqui, '_capturas', 'marca', f); return existsSync(p) ? `data:image/svg+xml;base64,${readFileSync(p).toString('base64')}` : null }
const x = {
  logoCompleto: svg('raca-fight-completo-escuro.svg'),
  foto: (n) => { const f = `_capturas/fotos/${n}.jpg`; if (!existsSync(join(aqui, f))) { console.error(`falta ${f}: rode antes node capturar.mjs`); process.exit(1) } return f },
  captura: (id) => {
    if (process.env.ESBOCOS && !SO_CAPTURA.has(id)) return null
    // AV (16/10): primeiro o app CONSTRUÍDO (../app-capturas/capturar-app.mjs); só sem ele, a tela desenhada do AL
    if (!process.env.MOCKUPS && existsSync(join(aqui, '..', 'app-capturas', `${id}.png`))) return `../app-capturas/${id}.png`
    for (const ext of ['png', 'jpg']) if (existsSync(join(aqui, '_capturas', 'telas', `${id}.${ext}`))) return `_capturas/telas/${id}.${ext}`
    return null
  },
}

const lista = paginas({}, x)
const total = lista.length
const numero = Object.fromEntries(lista.map((p, i) => [p.id, i + 1]))
const corpo = lista.map((p, i) => {
  if (p.capa) return `<section class="pg capa" id="${p.id}">${p.html}</section>`
  return `<section class="pg" id="${p.id}">
    <header class="pg__topo"><p class="olho">${p.olho}</p><h1>${p.titulo}</h1>${p.lide ? `<p class="lide">${p.lide}</p>` : ''}</header>
    <div class="pg__corpo">${p.corpo}</div>
    <footer class="pg__rodape"><span><b>RAÇA FIGHT</b> · Professor e recepção · versão de ${HOJE}</span>${p.exemplo ? '<span class="exemplo">Nomes inventados · horários da grade real da academia</span>' : '<span></span>'}<span>${i + 1} / ${total}</span></footer>
  </section>`
}).join('\n').replace(/\{\{p:([\w-]+)\}\}/g, (_, id) => { if (!numero[id]) throw new Error(`sumário aponta para página que não existe: ${id}`); return String(numero[id]) })

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${TITULO}</title>
<style>${readFileSync(join(aqui, 'professor.css'), 'utf8')}</style></head><body>
${corpo}
</body></html>`
const arqHtml = join(aqui, 'professor.html')
writeFileSync(arqHtml, html)

// conferir no navegador e imprimir
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
    if (c) {
      const fim = Math.max(...[...c.querySelectorAll('*')].map((e) => e.getBoundingClientRect().bottom))
      const lim = c.getBoundingClientRect().bottom
      if (c.scrollHeight > c.clientHeight + 1 || fim > lim + 1) out.push(`${s.id}: o corpo passa ${Math.round(Math.max(c.scrollHeight - c.clientHeight, fim - lim))}px da página`)
    }
    if (s.scrollHeight > s.clientHeight + 1) out.push(`${s.id}: a página passa ${s.scrollHeight - s.clientHeight}px`)
    for (const e of s.querySelectorAll('*')) {
      const r = e.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (r.right > caixa.right + 0.5 || r.bottom > caixa.bottom + 0.5) { out.push(`${s.id}: ${e.tagName.toLowerCase()}.${e.className} sai da página`); break }
    }
    for (const e of s.querySelectorAll('.cx, .tabela-cx, .caixa, .pergunta, .app, td, th, .cel, .cel__corpo, .cel__abas, .cel__folha, .c-chips, .c-ln__txt b, .c-ln__txt small, .c-campo i, .c-bt, .c-cartao')) {
      if (e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflowY !== 'visible') out.push(`${s.id}: ${e.tagName.toLowerCase()}.${e.className} corta ${e.scrollHeight - e.clientHeight}px na altura ("${e.textContent.trim().slice(0, 40)}")`)
      if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible') out.push(`${s.id}: ${e.tagName.toLowerCase()}.${e.className} corta ${e.scrollWidth - e.clientWidth}px na largura ("${e.textContent.trim().slice(0, 40)}")`)
    }
    // dentro do esboço de celular, nada pode passar da borda (overflow: hidden esconderia em silêncio)
    for (const cel of s.querySelectorAll('.cel__corpo, .cel__folha')) {
      const rc = cel.getBoundingClientRect()
      for (const e of cel.querySelectorAll('*')) { const r = e.getBoundingClientRect(); if (r.width && (r.bottom > rc.bottom + 1 || r.right > rc.right + 1)) { out.push(`${s.id}: dentro do celular, ${e.tagName.toLowerCase()}.${e.className} passa da borda ("${e.textContent.trim().slice(0, 30)}")`); break } }
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
// nomes reais
const texto = await pg.evaluate(() => document.body.innerText)
const achados = NOMES_REAIS.filter((n) => new RegExp(`\\b${n}\\b`).test(texto))
if (achados.length) avisos.push(`nome real de professor ou atleta no texto: ${achados.join(', ')}`)

mkdirSync(join(aqui, 'saida'), { recursive: true })
const pdf = join(aqui, 'saida', ARQUIVO)
await pg.pdf({ path: pdf, printBackground: true, preferCSSPageSize: true, outline: true, tagged: true })
await navegador.close()

const paginasNoPdf = (readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length
const mb = statSync(pdf).size / 1024 / 1024
if (paginasNoPdf !== total) avisos.push(`o PDF tem ${paginasNoPdf} páginas, mas foram montadas ${total}: alguma página quebrou em duas`)
if (mb >= 20) avisos.push(`o PDF tem ${mb.toFixed(1)} MB (limite: 20 MB)`)
console.log(`ok · ${total} páginas · ${mb.toFixed(2)} MB → ${pdf}`)
console.log(`  telas capturadas: ${lista.usadas.join(', ') || 'nenhuma'}`)
if (!process.env.SEM_COPIA) {
  mkdirSync(COPIA, { recursive: true })
  copyFileSync(pdf, join(COPIA, ARQUIVO))
  console.log(`  cópia → ${join(COPIA, ARQUIVO)}`)
}
if (avisos.length) { console.log('  ATENÇÃO:\n  - ' + avisos.join('\n  - ')); process.exitCode = 1 }
