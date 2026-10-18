// Junta em _capturas/ o que o PDF do aluno mostra e que vem de fora desta pasta (agente AT, 15/10/2026).
// Mesmo roteiro do PDF do admin (capturar → montar → folhear), adaptado:
//   1. as fotos reais da Raça Fight (02-design/referencias/raca-fight/fotos/): só as sem rosto de criança;
//   2. o logo PROVISÓRIO do AL (02-design/marca-e-proposta/logo-raca-fight/);
//   3. as TELAS prontas do AL, fotografadas na moldura de celular: mockups/luta.html e mockups/entrada.html,
//      no claro e no escuro (cada [aria-label="Tela: …"] vira um JPEG em _capturas/telas/);
//   4. os ESBOÇOS das telas que o AL ainda não desenhou (esbocos.html, nesta pasta), com as mesmas classes e tokens
//      dos mockups, fotografados do mesmo jeito em _capturas/esbocos/.
// Nada é gravado em 02-design: a página de esboços é servida por interceptação (page.route).
// Uso: node capturar.mjs        (depois: node montar.mjs)
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrirNavegador, servirPasta } from './navegador.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = resolve(aqui, '..', '..', '..')
const design = join(raiz, '02-design')
const saida = join(aqui, '_capturas')
for (const p of ['fotos', 'marca', 'telas', 'esbocos']) { rmSync(join(saida, p), { recursive: true, force: true }); mkdirSync(join(saida, p), { recursive: true }) }

// 1. fotos (sem criança; sem rosto de atleta em destaque)
const FOTOS = { 'capa.jpg': 'raca-54.jpg', 'academia.jpg': 'raca-01.jpg' }
for (const [para, de] of Object.entries(FOTOS)) copyFileSync(join(design, 'referencias', 'raca-fight', 'fotos', de), join(saida, 'fotos', para))
// 2. logo provisório
for (const f of ['raca-fight-completo-escuro.svg', 'raca-fight-compacto-escuro.svg', 'raca-fight-completo-claro.svg']) {
  const de = join(design, 'marca-e-proposta', 'logo-raca-fight', f)
  if (existsSync(de)) copyFileSync(de, join(saida, 'marca', f))
}
console.log('fotos e logo copiados')

// 3 e 4. telas
// [arquivo, página, rótulo da moldura (início do aria-label), tema, ação antes da foto]
const TELAS = [
  ['inicio-claro', 'luta', 'Tela: Início do aluno', 'claro'],
  ['inicio-escuro', 'luta', 'Tela: Início do aluno', 'escuro'],
  ['inicio-marcado-claro', 'luta', 'Tela: Início do aluno', 'claro', 'checkin'],
  ['inicio-rolado-escuro', 'luta', 'Tela: Início do aluno', 'escuro', 'rolar'],
  ['horarios-claro', 'luta', 'Tela: Horários', 'claro'],
  ['horarios-escuro', 'luta', 'Tela: Horários', 'escuro'],
  ['treinos-claro', 'luta', 'Tela: Treinos', 'claro'],
  ['treinos-escuro', 'luta', 'Tela: Treinos', 'escuro'],
  ['treinos-rolado-claro', 'luta', 'Tela: Treinos', 'claro', 'rolar'],
  ['academia-claro', 'luta', 'Tela: Academia', 'claro'],
  ['academia-escuro', 'luta', 'Tela: Academia', 'escuro'],
  ['cronometro', 'luta', 'Tela: cronômetro de rounds', 'escuro'],
  ['abertura', 'entrada', 'Tela: abertura estática', 'claro'],
  ['boas-vindas-claro', 'entrada', 'Tela: boas-vindas', 'claro'],
  ['boas-vindas-escuro', 'entrada', 'Tela: boas-vindas', 'escuro'],
  ['como-entrar-claro', 'entrada', 'Tela: aluno escolhe como entrar', 'claro'],
  ['objetivo-claro', 'entrada', 'Tela: objetivo, opcional', 'claro'],
  ['quem-pode-ver-claro', 'entrada', 'Tela: quem pode ver os dados corporais', 'claro'],
]
const ESBOCOS = [
  ['experimental', 'claro'], ['indicar', 'claro'], ['notificacoes', 'escuro'], ['avisos', 'claro'], ['avisos', 'escuro'],
  ['perfil', 'claro'], ['perfil', 'escuro'], ['meus-dados', 'claro'], ['kids-inicio', 'claro'], ['kids-inicio', 'escuro'],
  ['kids-dependente', 'claro'], ['raca-responde', 'claro'],
]

// o sprite do luta.html (ícones de luta + logo) entra na página de esboços
const luta = readFileSync(join(design, 'sistema-de-design', 'mockups', 'luta.html'), 'utf8')
const sprite = luta.slice(luta.indexOf('<svg width="0" height="0"'), luta.indexOf('</svg>', luta.indexOf('<!-- SPRITE:FIM -->')) + 6)
const esbocosHtml = readFileSync(join(aqui, 'esbocos.html'), 'utf8').replace('<!--SPRITE-->', sprite)

const srv = await servirPasta(raiz)
const nav = await abrirNavegador()
const LIMPAR = `html, body, .pagina { background: #fff !important; } .celular { box-shadow: none !important; }`

async function abrir(pagina, tema) {
  const ctx = await nav.newContext({ viewport: { width: 2040, height: 1200 }, deviceScaleFactor: 2, colorScheme: tema === 'escuro' ? 'dark' : 'light', reducedMotion: 'reduce' })
  await ctx.addInitScript((tema) => {
    try {
      localStorage.setItem('academia-plus-tema', tema); localStorage.setItem('academia-plus-aparelho', 'android')
      localStorage.setItem('academia-plus-movimento', 'reduzido'); localStorage.setItem('academia-plus-transparencia', 'normal'); localStorage.removeItem('academia-plus-fonte')
    } catch (e) {}
  }, tema)
  const p = await ctx.newPage()
  if (pagina === 'esbocos') {
    await p.route('**/__esbocos.html', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: esbocosHtml }))
    await p.goto(`${srv.base}/02-design/sistema-de-design/mockups/__esbocos.html`, { waitUntil: 'networkidle' })
  } else {
    await p.goto(`${srv.base}/02-design/sistema-de-design/mockups/${pagina}.html?aparelho=android`, { waitUntil: 'networkidle' })
  }
  await p.addStyleTag({ content: LIMPAR })
  // a barra de controles da página (fixa ou grudada no topo) não pode cobrir a moldura
  await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { if (e.closest('.celular')) continue; const pos = getComputedStyle(e).position; if (pos === 'sticky' || pos === 'fixed') e.style.position = 'static' } })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(400)
  return { p, ctx }
}

let n = 0
const tamanhos = new Set()
for (const [arq, pagina, rotulo, tema, acao] of TELAS) {
  const { p, ctx } = await abrir(pagina, tema)
  const cel = p.locator(`.celular[aria-label^="${rotulo}"]`).first()
  if (!(await cel.count())) { console.error(`  FALTA a tela "${rotulo}" em ${pagina}.html`); process.exitCode = 1; await ctx.close(); continue }
  if (acao === 'checkin') { await cel.locator('[data-checkin]').click(); await p.waitForTimeout(500) }
  if (acao === 'rolar') { await cel.locator('.p-rolagem').evaluate((e) => { e.scrollTop = e.scrollHeight }); await p.waitForTimeout(300) }
  const caixa = await cel.boundingBox(); tamanhos.add(`${Math.round(caixa.width)}×${Math.round(caixa.height)}`)
  await cel.screenshot({ path: join(saida, 'telas', `${arq}.jpg`), type: 'jpeg', quality: 84 })
  n++; await ctx.close()
}
for (const [id, tema] of ESBOCOS) {
  const { p, ctx } = await abrir('esbocos', tema)
  const cel = p.locator(`[data-esboco="${id}"]`)
  const caixa = await cel.boundingBox(); tamanhos.add(`${Math.round(caixa.width)}×${Math.round(caixa.height)}`)
  await cel.screenshot({ path: join(saida, 'esbocos', `${id}-${tema}.jpg`), type: 'jpeg', quality: 84 })
  n++; await ctx.close()
}
await nav.close(); srv.fechar()
console.log(`ok · ${n} capturas (molduras de ${[...tamanhos].join(', ')} px CSS) em ${saida}`)
