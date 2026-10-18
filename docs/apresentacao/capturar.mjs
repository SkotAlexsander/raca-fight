// Captura o mockup do sistema de design, o comparativo de direção de arte e o de logo em PNG, para a apresentação,
// e copia para _capturas/ as imagens do banco do app e os quadros dos efeitos que a apresentação mostra.
// Uso: node capturar.mjs [filtro]   — filtro é um trecho do nome do arquivo (ex.: "tela", "logo", "direcao", "anatomia", "app")
// O app construído (agente AF, 11/10): exporte antes, `cd app && npx expo export --platform web --output-dir <pasta>`,
// e passe a pasta em APP_WEB (PowerShell: $env:APP_WEB='<pasta>'; node capturar.mjs app). Sem APP_WEB, as capturas do app ficam como estão.
// Fontes: 02-design/sistema-de-design/mockups/index.html, 02-design/direcao-de-arte/comparativo.html,
//         02-design/marca-e-proposta/logo/comparativo.html, 02-design/imagens/, 02-design/sistema-de-design/movimento/capturas/quadros/
// Saída: _capturas/<grupo>-<nome>-<tema>.png  (sempre por elemento, nunca a janela inteira)
// Pode ser rodado de novo a qualquer hora: as capturas saem do que estiver lá.
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { abrirNavegador, servirPasta } from './navegador.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const design = resolve(aqui, '..', '..', '02-design')
const saida = join(aqui, '_capturas')
mkdirSync(saida, { recursive: true })
const filtro = process.argv[2] || ''

// [nome do arquivo, página, seletor, tema, índice (quando o seletor casa vários)]
const MOCKUP = '/sistema-de-design/mockups/index.html'
const LOGO = '/marca-e-proposta/logo/comparativo.html'
const DIRECAO = '/direcao-de-arte/comparativo.html'
// P09 (agente Q): a entrada (agente O), as telas novas (agente P) e a galeria de ícones (agente R)
const ENTRADA = '/sistema-de-design/mockups/entrada.html'
const NOVAS = '/sistema-de-design/mockups/novas.html'
const GALERIA = '/icones/galeria.html'
const MOCKUPS = [MOCKUP, ENTRADA, NOVAS]
// o mapa muscular do agente AD (aguarda a aprovação do Alex)
const ANATOMIA = '/anatomia/comparativo.html'
const TELAS = ['treino-do-dia', 'treinos-prontos', 'perfil-do-aluno', 'dieta-de-hoje', 'cronometro', 'convite-plus']
const COMPONENTES = ['botao', 'campo-texto', 'campo-numerico', 'selecao', 'cartao-exercicio', 'linha-serie', 'cronometro',
  'cronometro-ferramenta', 'cartao-treino-pronto', 'cartao-aluno', 'selo-plus', 'lista-refeicao', 'barra-abas', 'cabecalho', 'folha-inferior',
  'estado-vazio', 'toast', 'claro-escuro']

const capturas = []
const JPEG = /^(tela|aparelho|novas|entrada|direcao)-/
for (const tema of ['claro', 'escuro']) {
  TELAS.forEach((t, i) => capturas.push({ nome: `tela-${i + 1}-${t}-${tema}`, pagina: MOCKUP, sel: '#telas .celular', i, tema }))
}
// a mesma tela 1 nos outros aparelhos (página do iPhone e do Android)
for (const ap of ['iphone-se', 'iphone-16-pro-max', 'android']) capturas.push({ nome: `aparelho-${ap}-claro`, pagina: MOCKUP, sel: '#telas .celular', i: 0, tema: 'claro', aparelho: ap })
COMPONENTES.forEach((c, i) => capturas.push({ nome: `comp-${String(i + 1).padStart(2, '0')}-${c}-claro`, pagina: MOCKUP, sel: '#componentes .amostra', i, tema: 'claro' }))
capturas.push({ nome: 'efeitos-fechar-claro', pagina: MOCKUP, sel: '#efeitos .amostra', i: 1, tema: 'claro' })
capturas.push({ nome: 'tokens-paleta-claro', pagina: MOCKUP, sel: '#tokens .paleta', i: 0, tema: 'claro' })
capturas.push({ nome: 'tokens-paleta-escuro', pagina: MOCKUP, sel: '#tokens .paleta', i: 0, tema: 'escuro' })
capturas.push({ nome: 'tokens-tipografia-claro', pagina: MOCKUP, sel: '#tokens .amostra', i: 0, tema: 'claro' })
capturas.push({ nome: 'tokens-espaco-claro', pagina: MOCKUP, sel: '#tokens .amostra', i: 1, tema: 'claro' })
// entrada: abertura estática, boas-vindas, como entrar, sua academia, dias, quem pode ver, da academia, pendente, dono abre
const ENT = { 1: 'abertura', 2: 'boas-vindas', 3: 'como-entrar', 4: 'entrar-email', 7: 'sua-academia', 8: 'objetivo', 9: 'dias', 10: 'quem-pode-ver', 11: 'equipe-entrar', 12: 'convite', 13: 'pendente', 14: 'dono-abre' }
for (const [i, n] of Object.entries(ENT)) capturas.push({ nome: `entrada-${String(i).padStart(2, '0')}-${n}-claro`, pagina: ENTRADA, sel: '.celular', i: +i, tema: 'claro' })
for (const i of [1, 2, 3, 9]) capturas.push({ nome: `entrada-${String(i).padStart(2, '0')}-${ENT[i]}-escuro`, pagina: ENTRADA, sel: '.celular', i, tema: 'escuro' })
// telas novas: os 7 quadros no claro e no escuro
const NOV = ['inicio', 'evolucao', 'evolucao-vazia', 'modo-treino', 'descanso', 'comemoracao', 'painel-dono']
for (const tema of ['claro', 'escuro']) NOV.forEach((n, i) => capturas.push({ nome: `novas-${i + 1}-${n}-${tema}`, pagina: NOVAS, sel: '.celular', i, tema }))
// ícones: o teste de 16 px, a barra de abas e as ilustrações (galeria do R)
capturas.push({ nome: 'icones-16px-claro', pagina: GALERIA, sel: '.temas', i: 0, tema: 'claro' })
capturas.push({ nome: 'icones-abas-claro', pagina: GALERIA, sel: '.temas', i: 1, tema: 'claro' })
capturas.push({ nome: 'icones-ilustracoes-claro', pagina: GALERIA, sel: '.temas', i: -2, tema: 'claro' })
capturas.push({ nome: 'icones-lista-claro', pagina: GALERIA, sel: '.temas', i: -1, tema: 'claro' })
// direção de arte: tela 1 e tela 2 de A, B e C (claro) e a tela 1 das três no escuro
;['a', 'b', 'c'].forEach((d, k) => {
  capturas.push({ nome: `direcao-${d}-treino-claro`, pagina: DIRECAO, sel: '.item .fone', i: k, tema: 'claro' })
  capturas.push({ nome: `direcao-${d}-prontos-claro`, pagina: DIRECAO, sel: '.item .fone', i: 3 + k, tema: 'claro' })
  capturas.push({ nome: `direcao-${d}-treino-escuro`, pagina: DIRECAO, sel: '.item .fone', i: k, tema: 'escuro' })
})
;['a', 'b', 'c', 'selo'].forEach((c, i) => capturas.push({ nome: `logo-${c}-claro`, pagina: LOGO, sel: 'section.caminho', i, tema: 'claro' }))
// mapa muscular: o caso do peitoral (lado A) no claro e no escuro, o contexto da lista e os filtros com a Evolução
capturas.push({ nome: 'anatomia-caso-claro', pagina: ANATOMIA, sel: '.caso .lado', i: 0, tema: 'claro' })
capturas.push({ nome: 'anatomia-caso-escuro', pagina: ANATOMIA, sel: '.caso .lado', i: 12, tema: 'claro' })
capturas.push({ nome: 'anatomia-contexto-claro', pagina: ANATOMIA, sel: '.dois > .painel', i: 2, tema: 'claro' })
capturas.push({ nome: 'anatomia-contexto-escuro', pagina: ANATOMIA, sel: '.dois > .painel', i: 3, tema: 'claro' })
capturas.push({ nome: 'anatomia-filtros-claro', pagina: ANATOMIA, sel: '.dois > .painel', i: 4, tema: 'claro' })
capturas.push({ nome: 'logo-a-escuro', pagina: LOGO, sel: 'section.caminho', i: 0, tema: 'escuro' })

// cópias: imagens do banco do app (agente J) e quadros dos efeitos (agente K)
const COPIAS = []
COPIAS.push(['imagens/plus/convite-plus@2x.webp', 'img-convite-plus.webp'])
for (const v of ['primeiro-treino', 'historico-vazio', 'sem-plus-alimentacao', 'sem-plano', 'aguardando-personal', 'busca-sem-resultado', 'erro-carregar', 'sem-conexao', 'nenhum-aluno', 'biblioteca-vazia']) COPIAS.push([`imagens/estados-vazios/${v}-claro@2x.webp`, `img-vazio-${v}.webp`])
const QUADROS = { serie: 'serie-03-3122ms', fechar: 'fechar-04-2414ms', anel: 'anel-03-13600ms', fase: 'fase-03-2252ms', cartao: 'cartao-02-1201ms', esqueleto: 'esq-02-1812ms', plus: 'plus-04-3808ms', titulo: 'titulo-ios-04-4513ms', 'serie-reduzido': 'serie-reduzido-03-3134ms', 'plus-reduzido': 'plus-reduzido-04-3801ms' }
for (const [n, q] of Object.entries(QUADROS)) COPIAS.push([`sistema-de-design/movimento/capturas/quadros/${q}.png`, `efeito-${n}.png`])
// as referências do Alex e as capas do catálogo de treinos prontos (agente S)
for (const r of ['01-escuro-calendario-cronometro-lista', '02-entrada-vidro-sobre-foto', '03-inicio-treino-dieta-com-foto', '04-kit-progresso-graficos-nutricao', '05-explorar-comemoracao-exercicio', '06-sequencia-semana-musculos']) COPIAS.push([`referencias/${r}.jpg`, `ref-${r}.jpg`])
for (const t of ['primeiros-passos', 'full-body-3x', 'abc-hipertrofia', 'superior-inferior-4x', 'empurrar-puxar-pernas', 'circuito-30', 'forca-e-caminhada', 'folego-3x', 'intervalado-25', 'corpo-em-dia', 'treino-em-casa']) COPIAS.push([`imagens/treinos/${t}-larga@2x.webp`, `img-treino-${t}.webp`])
COPIAS.push(['imagens/treinos/supino-inclinado-com-halteres-heroi@2x.webp', 'img-heroi-supino-inclinado.webp'])
let copiadas = 0
for (const [de, para] of COPIAS) { if (filtro && !para.includes(filtro)) continue; copyFileSync(join(design, de), join(saida, para)); copiadas++ }

const servidor = await servirPasta(design)
const navegador = await abrirNavegador()
let n = 0
const avisos = []
for (const c of capturas) {
  if (filtro && !c.nome.includes(filtro)) continue
  const p = await navegador.newPage({ viewport: { width: c.pagina === LOGO ? 960 : c.pagina === GALERIA || c.pagina === ANATOMIA ? 1100 : 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: c.tema === 'escuro' ? 'dark' : 'light' })
  const erros = []
  p.on('pageerror', (e) => erros.push(e.message))
  // o mockup segue a opção de movimento do sistema; aqui fica sempre "normal", para a captura mostrar o efeito
  if (MOCKUPS.includes(c.pagina)) await p.addInitScript(() => { try { localStorage.setItem('academia-plus-movimento', 'normal'); localStorage.setItem('academia-plus-fonte', '100'); localStorage.setItem('academia-plus-transparencia', 'normal') } catch {} })
  await p.goto(servidor.base + c.pagina + (MOCKUPS.includes(c.pagina) ? `?moldura=real&aparelho=${c.aparelho || 'iphone-16'}` : ''), { waitUntil: 'networkidle' })
  if (c.pagina === LOGO) {
    if (c.tema === 'escuro') await p.evaluate(() => window.alternarTema())
  } else if (c.pagina === GALERIA) {
    if (c.tema === 'escuro') await p.evaluate(() => document.documentElement.setAttribute('data-tema', 'escuro'))
  } else if (c.pagina === ANATOMIA) {
    // a página mostra os dois temas lado a lado; não há o que trocar
  } else if (c.pagina === DIRECAO) {
    await p.click(`[data-tema-sel="${c.tema}"]`)
  } else {
    await p.evaluate((t) => document.documentElement.setAttribute('data-tema', t), c.tema)
  }
  // só na cópia aberta aqui (o arquivo do design não muda): amostras com a altura do próprio conteúdo
  await p.addStyleTag({ content: '.amostras { align-items: start !important } .amostra { align-self: start !important }' })
  await p.evaluate(() => document.fonts.ready)
  // o halo e o reflexo do convite ao Plus terminam em 1,6 s; o esqueleto passa por 4,5 s. Espera o halo assentar.
  await p.waitForTimeout(MOCKUPS.includes(c.pagina) ? 2200 : 400)
  // o topo fixo da página não pode cobrir a moldura no recorte
  await p.addStyleTag({ content: '.pagina__topo, .o-pagina__topo { position: static !important }' })
  const els = await p.$$(c.sel)
  const el = els[c.i < 0 ? els.length + c.i : c.i]
  if (!el) { avisos.push(`${c.nome}: seletor ${c.sel} [${c.i}] não existe (achou ${els.length})`); await p.close(); continue }
  // o elemento não pode estourar por dentro (texto cortado, rolagem escondida)
  const estouro = await el.evaluate((e) => [...e.querySelectorAll('*')].filter((x) => x.scrollWidth > x.clientWidth + 2 && getComputedStyle(x).overflowX === 'hidden' && !x.matches('.esqueleto, .reflexo, .treino-pronto__capa, .convite__capa, .exercicio__imagem, .mini, .cabecalho__titulo .titulo-2, .exercicio__titulo .titulo-3, .treino-pronto__descricao, .celular__tela, .progresso')).length)
  // recorte pela posição absoluta na página inteira (o screenshot do elemento saía deslocado na moldura do celular)
  const caixa = await el.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height } })
  // as telas de celular do protótipo saem em JPEG (foto e degradê): em PNG o PDF passava de 20 MB
  const ext = JPEG.test(c.nome) ? 'jpg' : 'png'
  await p.screenshot({ path: join(saida, `${c.nome}.${ext}`), fullPage: true, clip: caixa, ...(ext === 'jpg' ? { type: 'jpeg', quality: 86 } : {}) })
  console.log(`${c.nome}.${ext}  ${Math.round(caixa.width)}×${Math.round(caixa.height)}${estouro ? `  ← ${estouro} elemento(s) cortado(s) por dentro` : ''}${erros.length ? '  ← ERRO: ' + erros.join(' | ') : ''}`)
  await p.close(); n++
}
// ---- o app construído (export web do Expo), entrando com as contas de exemplo, em 393 × 852 ----
const APP_NOMES = ['abertura', 'boas-vindas', 'inicio-ana', 'modo-treino', 'descanso', 'comemoracao', 'evolucao', 'equipe', 'professor', 'painel-marcos', 'alunos', 'meus-alunos-plus-julia']
if (process.env.APP_WEB && (!filtro || APP_NOMES.some((a) => `app-${a}`.includes(filtro) || filtro.startsWith('app')))) {
  const app = await servirPasta(process.env.APP_WEB, { spa: true })
  const CHAVE = 'academia-plus:armazenamento-local'
  for (const tema of ['claro', 'escuro']) {
    const ctx = await navegador.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, colorScheme: tema === 'escuro' ? 'dark' : 'light', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' })
    const p = await ctx.newPage()
    const erros = []
    p.on('pageerror', (e) => erros.push(e.message))
    const ir = async (u, ms = 1500) => { await p.goto(app.base + u, { waitUntil: 'networkidle' }); await p.waitForTimeout(ms) }
    // JPEG: as telas têm foto, e o PDF precisa ficar abaixo de 20 MB
    const foto = async (nome) => { await p.screenshot({ path: join(saida, `app-${nome}-${tema}.jpg`), type: 'jpeg', quality: 84 }); console.log(`app-${nome}-${tema}.jpg  ${new URL(p.url()).pathname}${erros.length ? '  ← ERRO: ' + erros.splice(0).join(' | ') : ''}`); n++ }
    const conta = async (u) => { await ir('/boas-vindas', 300); await p.evaluate(([c, u]) => { localStorage.clear(); localStorage.setItem(c, JSON.stringify({ preferencias: { 'sessao.usuarioId': u } })) }, [CHAVE, u]); await ir('/', 2200) }
    const botao = async (nome, ms = 900) => { await p.getByRole('button', { name: nome }).first().click(); await p.waitForTimeout(ms) }
    const texto = async (t, ms = 900) => { await p.getByText(t, { exact: true }).last().click(); await p.waitForTimeout(ms) }
    try {
      // abertura: o símbolo assentado (desce em 200 ms e espera 700); depois as duas portas
      await p.goto(app.base + '/boas-vindas', { waitUntil: 'domcontentloaded' })
      await p.waitForTimeout(650); await foto('abertura')
      await p.waitForTimeout(2600); await foto('boas-vindas')
      // Ana (aluna Plus)
      await conta('usuario-ana'); await foto('inicio-ana')
      await botao(/Começar o Treino/, 1300)
      await botao(/Ir para o próximo exercício/, 1000); await foto('modo-treino')
      await p.getByTestId('marcar-serie').click(); await p.waitForTimeout(1600); await foto('descanso')
      for (let k = 0; k < 3; k++) { await botao(/^Pular/, 700); await p.getByTestId('marcar-serie').click(); await p.waitForTimeout(900) }
      await botao('Pausar o treino', 700); await texto('Fechar o treino'); await texto('Fechar assim', 5000); await foto('comemoracao')
      await texto('Pronto', 1200)
      await ir('/treinos/evolucao', 2200); await foto('evolucao')
      await ir('/perfil/equipe', 1600); await foto('equipe')
      await texto('Carla', 1600); await foto('professor')
      // Marcos (dono): abre nos números; depois Alunos
      await conta('usuario-marcos'); await foto('painel-marcos')
      await ir('/alunos', 1600); await foto('alunos')
      // Júlia (personal da Ana no Plus): abre em Meus alunos Plus
      await conta('usuario-julia'); await foto('meus-alunos-plus-julia')
    } catch (e) { avisos.push(`app (${tema}): ${e.message.split(String.fromCharCode(10))[0]} em ${new URL(p.url()).pathname}`) }
    await ctx.close()
  }
  app.fechar()
} else if (!process.env.APP_WEB && (!filtro || filtro.startsWith('app'))) console.log('  (sem APP_WEB: as capturas do app construído ficaram como estavam)')
await navegador.close(); servidor.fechar()
if (avisos.length) { console.log('  atenção:\n  ' + avisos.join('\n  ')); process.exitCode = 1 }
console.log(`ok · ${n} capturas e ${copiadas} cópias em ${saida}`)
