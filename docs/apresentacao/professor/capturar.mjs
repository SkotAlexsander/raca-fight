// Junta em _capturas/ o que o PDF do professor mostra e que vem de fora desta pasta (agente AS, 15/10/2026):
//   1. as fotos reais da Raça Fight escolhidas (sem rosto de criança; adultos só de longe ou sem rosto);
//   2. o logo PROVISÓRIO do AL (02-design/marca-e-proposta/logo-raca-fight/);
//   3. as telas prontas da cara de luta, com a moldura de celular: mockups/luta.html e mockups/entrada.html.
// Uso: node capturar.mjs        (depois: node montar.mjs)
//
// As telas que o AL ainda não desenhou (Turmas, ficha do aluno, Graduação, Recepção…) são esboços em HTML no
// paginas.mjs. Quando o AL (ou o AK) desenhar uma delas, acrescente uma linha na tabela TELAS abaixo com o mesmo id do
// esboço: o montar.mjs usa a captura no lugar do esboço sem mexer em mais nada (ESBOCOS=1 volta aos esboços).
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrirNavegador, servirPasta } from './navegador.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const design = resolve(aqui, '..', '..', '..', '02-design')
const saida = join(aqui, '_capturas')
for (const p of ['fotos', 'marca', 'telas']) mkdirSync(join(saida, p), { recursive: true })

// 1. fotos (02-design/imagens/raca-fight/00-INDICE.md): nenhuma com criança
const FOTOS = {
  'capa.jpg': ['referencias', 'raca-fight', 'fotos', 'raca-09.jpg'], // sparring no tatame, adultos de longe
  'cordao.jpg': ['imagens', 'raca-fight', 'graduacao-cordao-capa@2x.jpg'], // o cordão amarelo, sem pessoa
  'luva.jpg': ['referencias', 'raca-fight', 'fotos', 'raca-20.jpg'], // a luva de perto, sem rosto
}
for (const [para, de] of Object.entries(FOTOS)) copyFileSync(join(design, ...de), join(saida, 'fotos', para))
// 2. logo provisório
for (const f of ['raca-fight-completo-escuro.svg', 'raca-fight-compacto-escuro.svg', 'raca-fight-compacto-claro.svg']) {
  const de = join(design, 'marca-e-proposta', 'logo-raca-fight', f)
  if (existsSync(de)) copyFileSync(de, join(saida, 'marca', f))
}
console.log(`fotos e logo copiados para ${saida}`)

// 3. telas prontas: id no PDF → página do mockup, índice do .celular, e o que fazer antes da foto
// (os ajustes valem só para a cópia aberta no navegador; os arquivos do 02-design não mudam)
export const TELAS = {
  'boas-vindas': { pagina: 'entrada.html', i: 2 },
  'equipe-entrar': { pagina: 'entrada.html', i: 11 },
  'equipe-convite': { pagina: 'entrada.html', i: 12 },
  'equipe-pendente': { pagina: 'entrada.html', i: 13 },
  'aluno-inicio': { pagina: 'luta.html', i: 0 },
  'aluno-checkin-feito': { pagina: 'luta.html', i: 0, antes: 'checkin' },
  cronometro: { pagina: 'luta.html', i: 4 },
  hoje: { pagina: 'luta.html', i: 5 },
  chamada: { pagina: 'luta.html', i: 6 },
}

// Nomes reais que aparecem no Instagram da academia (01-DADOS-REAIS.md) e que não podem sair no PDF.
// "Bruno" é o primeiro nome de um atleta real; na chamada do mockup há um "Bruno Souza" fictício: troca na cópia.
const TROCAS = [['Bruno Souza', 'Breno Souza']]

rmSync(join(saida, 'telas'), { recursive: true, force: true }); mkdirSync(join(saida, 'telas'))
// as imagens dos mockups apontam para ../../imagens: serve o 02-design inteiro e abre as páginas pelo caminho delas
const raiz = await servirPasta(design)
const nav = await abrirNavegador()
const avisos = []
for (const [id, t] of Object.entries(TELAS)) {
  const p = await nav.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'light' })
  const erros = []
  p.on('pageerror', (e) => erros.push(e.message))
  await p.addInitScript(() => { try { localStorage.setItem('academia-plus-movimento', 'reduzido'); localStorage.setItem('academia-plus-fonte', '100'); localStorage.setItem('academia-plus-transparencia', 'normal') } catch {} })
  await p.goto(`${raiz.base}/sistema-de-design/mockups/${t.pagina}?moldura=real&aparelho=iphone-16`, { waitUntil: 'networkidle' })
  await p.evaluate(() => document.documentElement.setAttribute('data-tema', 'claro'))
  await p.addStyleTag({ content: '.pagina__topo, .o-pagina__topo { position: static !important }' })
  await p.evaluate(() => document.fonts.ready)
  // nomes reais fora; e o Hoje do professor de quinta não pode ter Muay Thai às 21h (a grade real só tem 21h na seg e qua)
  await p.evaluate((trocas) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) for (const [a, b] of trocas) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.replaceAll(a, b)
    for (const e of document.querySelectorAll('[aria-label]')) for (const [a, b] of trocas) e.setAttribute('aria-label', e.getAttribute('aria-label').replaceAll(a, b))
    for (const li of document.querySelectorAll('.l-aula')) if (/^\s*21:00/.test(li.textContent) && li.closest('[aria-label="Tela: Hoje do professor"]')) li.remove()
  }, TROCAS)
  const els = await p.$$('.celular')
  const el = els[t.i]
  if (!el) { avisos.push(`${id}: .celular[${t.i}] não existe em ${t.pagina} (achou ${els.length})`); await p.close(); continue }
  await el.scrollIntoViewIfNeeded()
  // o canto da moldura mostra o fundo da página do mockup: na cópia, o fundo vira o branco do PDF
  await el.evaluate((e) => { for (let a = e.parentElement; a; a = a.parentElement) a.style.setProperty('background', '#fff', 'important') })
  if (t.antes === 'checkin') { await el.$('[data-checkin]').then((b) => b.click()); }
  await p.waitForTimeout(900)
  const caixa = await el.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height } })
  const arq = join(saida, 'telas', `${id}.jpg`)
  await p.screenshot({ path: arq, fullPage: true, clip: caixa, type: 'jpeg', quality: 86 })
  console.log(`  tela ${id} ← ${t.pagina} [${t.i}] ${Math.round(caixa.width)}×${Math.round(caixa.height)}${erros.length ? '  ← ERRO: ' + erros.join(' | ') : ''}`)
  if (erros.length) avisos.push(`${id}: ${erros.join(' | ')}`)
  await p.close()
}
await nav.close(); raiz.fechar()
if (avisos.length) { console.log('  ATENÇÃO:\n  - ' + avisos.join('\n  - ')); process.exitCode = 1 } else console.log(`ok · ${Object.keys(TELAS).length} telas prontas capturadas em ${join(saida, 'telas')}`)
