// Auditoria de responsividade e proporções do Academia Plus.
// Abre o mockup do sistema de design e o comparativo de logo no Chromium e MEDE (nada no olho):
// rolagem horizontal, elemento que estoura o pai, texto cortado / vazando / sobreposto, alvo de toque,
// contraste, imagem e forma deformadas, moldura do celular, escala de 4 px, escala tipográfica e
// hierarquia de títulos, e as abas das duas visões.
//
// Uso (de qualquer pasta):
//   node "02-design/sistema-de-design/auditoria/auditar.mjs"            mede tudo, salva resultado.json e as capturas
//   node ... auditar.mjs --antes                                        salva em resultado-antes.json, sem capturas
//   node ... auditar.mjs --antes-iphone                                 salva em resultado-antes-iphone.json, sem capturas
//   node ... auditar.mjs --sem-capturas                                 só mede
// Termina com "0 achados" (código de saída 0) ou "N achados" (código 1).
//
// Janelas: 360, 390, 430, 768, 1280, 1440 e 2040 × 790 (o ultrawide do Alex) · temas claro e escuro ·
// fonte do sistema a 100 % e 160 % (simulada como a do navegador: html { font-size: 160% }, que é o que
// muda quando a pessoa aumenta a fonte; o texto do sistema é em rem e o resto em px, como no app).
//
// iPhone (agente F, 10/10/2026): os 4 iPhones de tokens.json › layout.aparelhos (SE 3ª geração, 13 mini, 16 e
// 16 Pro Max), cada um com a janela do próprio tamanho e o mockup aberto com ?aparelho=<id>, e o mockup de cada
// um também a 1440 × 900 e a 2040 × 790. Nos dois temas e com a fonte a 100 % e a 160 % (no iOS, Texto Dinâmico
// grande). Mede também a ÁREA SEGURA: nada do app (texto, ícone, alvo) dentro do inset do topo ou da base, nem
// embaixo da Dynamic Island, do notch, do furo da câmera ou do indicador de início; o cabeçalho começa abaixo do
// recorte e a barra de abas termina acima do indicador. As janelas antigas seguem com a moldura padrão (Android 390).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const { chromium } = await import('file:///A:/Claude/03-projetos/.ferramentas/node_modules/playwright/index.mjs')
const RESERVA = 'C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'

const aqui = dirname(fileURLToPath(import.meta.url))
const args = new Set(process.argv.slice(2))
const ANTES = args.has('--antes')
const ANTES_IPHONE = args.has('--antes-iphone')
const CAPTURAR = !ANTES && !ANTES_IPHONE && !args.has('--sem-capturas')
const tokens = JSON.parse(readFileSync(join(aqui, '..', 'tokens.json'), 'utf8'))

const PAGINAS_TODAS = [
  { nome: 'mockup', arquivo: resolve(aqui, '..', 'mockups', 'index.html') },
  // P09 (agente Q): a entrada (agente O) e as telas novas (agente P) entram na mesma medida
  { nome: 'entrada', arquivo: resolve(aqui, '..', 'mockups', 'entrada.html') },
  { nome: 'novas', arquivo: resolve(aqui, '..', 'mockups', 'novas.html') },
  // P12 (agente AL, 15/10/2026): as telas de luta da Raça Fight (aluno e professor)
  { nome: 'luta', arquivo: resolve(aqui, '..', 'mockups', 'luta.html') },
  { nome: 'logo', arquivo: resolve(aqui, '..', '..', 'marca-e-proposta', 'logo', 'comparativo.html') },
  // P12 (agente AK): as telas do admin (app do dono), PC 2040 × 790 e celular, na mesma medida
  { nome: 'admin', arquivo: resolve(aqui, '..', 'mockups', 'admin.html') },
]
// --pagina=mockup,novas mede só essas (para corrigir rápido); sem o argumento, todas
const SO = [...process.argv.slice(2)].find((a) => a.startsWith('--pagina='))?.split('=')[1]?.split(',')
const PAGINAS = SO ? PAGINAS_TODAS.filter((p) => SO.includes(p.nome)) : PAGINAS_TODAS
const MOCKUPS = PAGINAS.filter((p) => p.nome !== 'logo')
const JANELAS = [[360, 640], [390, 844], [430, 932], [768, 1024], [1280, 800], [1440, 900], [2040, 790]]
const TEMAS = ['claro', 'escuro']
const FONTES = [100, 160]
// aparelhos (tokens.json › layout.aparelhos); o padrão do mockup, sem ?aparelho, é o Android 390
const APARELHOS = Object.entries(tokens.layout.aparelhos).filter(([k]) => !k.startsWith('$')).map(([, a]) => a)
const IPHONES = APARELHOS.filter((a) => a.plataforma === 'ios')

// Escala tipográfica permitida, tirada do tokens.json (nada escrito à mão aqui).
const esc = tokens.tipografia.escala
const TIPOS = Object.entries(esc).filter(([k]) => !k.startsWith('$')).map(([nome, v]) => ({ nome, tamanho: v.tamanho, linha: v.linha }))
for (const [nome, v] of Object.entries(tokens.tipografia.escalaCelularPequeno || {})) if (!nome.startsWith('$')) TIPOS.push({ nome: nome + '<390', tamanho: v.tamanho, linha: v.linha })
const TETOS = tokens.tipografia.tetoAmpliacao || {}
const CFG = {
  tipos: TIPOS,
  tetos: Object.fromEntries(Object.entries(TETOS).filter(([k]) => !k.startsWith('$'))),
  alvo: tokens.alvo,
  // 1.8.0 (regra do Alex): escala fechada, piso do alvo efetivo (44 pt do iOS) e teto do desenho (56)
  escalaFechada: tokens.tipografia.$escala,
  alvoPiso: tokens.alvo.minimoIos || 44,
  controleMaximo: tokens.controle?.maximo || 56,
  passo: tokens.espaco['1'],
  telaCelular: tokens.moldura ? [tokens.moldura.larguraTela, tokens.moldura.alturaTela] : [390, 844],
  minimoTexto: tokens.tipografia.tamanhoMinimoTexto,
  aparelhos: Object.fromEntries(APARELHOS.map((a) => [a.id, a])),
  aparelhoPadrao: 'android',
}

// ---------------------------------------------------------------- dentro da página
function auditarPagina(cfg) {
  const A = []
  const cs = (e) => getComputedStyle(e)
  const px = (v) => parseFloat(v) || 0
  const zoomDe = (el) => { let z = 1; for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const v = parseFloat(cs(a).zoom); if (v && v !== 1) z *= v } return z }
  const classes = (el) => { const c = typeof el.className === 'string' ? el.className : el.className?.baseVal || ''; return c.trim() ? '.' + c.trim().split(/\s+/).join('.') : '' }
  const onde = (el) => {
    const p = []
    const tela = el.closest('.tela-legenda'); if (tela) p.push('tela ' + ([...document.querySelectorAll('.tela-legenda')].indexOf(tela) + 1))
    const am = el.closest('.amostra'); if (am) p.push('amostra "' + (am.querySelector('.amostra__rotulo span')?.textContent.trim() || '') + '"')
    const cam = el.closest('.caminho'); if (cam) p.push('caminho "' + (cam.querySelector('h2')?.firstChild?.textContent.trim() || '') + '"')
    if (!p.length) { const s = el.closest('section, header, main, body'); p.push(s.id ? '#' + s.id : s.tagName.toLowerCase() + (classes(s).split('.')[1] ? '.' + classes(s).split('.')[1] : '')) }
    const txt = (el.innerText ?? el.textContent ?? el.getAttribute('aria-label') ?? '').trim().replace(/\s+/g, ' ').slice(0, 36)
    return p.join(' › ') + ' › ' + el.tagName.toLowerCase() + classes(el) + (txt ? ` "${txt}"` : '')
  }
  const add = (tipo, el, detalhe) => A.push({ tipo, onde: el ? onde(el) : 'página', detalhe })

  const noSprite = (el) => !!el.closest('svg[width="0"]')
  const visivel = (el) => {
    if (noSprite(el) || el.closest('.so-leitor')) return false
    // o conteúdo de um <details> fechado não está na tela (só o <summary>)
    { const d = el.closest('details:not([open])'); if (d && !el.closest('summary')) return false }
    const r = el.getBoundingClientRect(); if (r.width < 0.5 || r.height < 0.5) return false
    for (let a = el; a; a = a.parentElement) { const s = cs(a); if (s.display === 'none' || s.visibility === 'hidden' || px(s.opacity) === 0 && s.opacity !== '') return false }
    return true
  }
  const desbotado = (el) => { for (let a = el; a; a = a.parentElement) if (parseFloat(cs(a).opacity) < 1) return true; return !!el.closest('[disabled], [aria-disabled="true"]') }
  const rola = (s, eixo) => /auto|scroll/.test(eixo === 'x' ? s.overflowX : s.overflowY)
  const corta = (s, eixo) => /hidden|clip/.test(eixo === 'x' ? s.overflowX : s.overflowY)

  const todos = [...document.body.querySelectorAll('*')].filter((e) => !['SCRIPT', 'STYLE', 'TITLE'].includes(e.tagName) && !(e.closest('svg') && e.tagName.toLowerCase() !== 'svg'))
  const vis = todos.filter(visivel)

  // 1. Rolagem horizontal
  const sw = document.documentElement.scrollWidth, vw = document.documentElement.clientWidth
  if (sw > vw + 1) {
    // quem empurra: os elementos mais fundos que passam da borda direita
    const fora = [...document.body.querySelectorAll('*')].filter((e) => !e.closest('svg') && e.getBoundingClientRect().right > vw + 1 && ![...e.children].some((f) => f.getBoundingClientRect().right > vw + 1))
    add('rolagem horizontal', null, `conteúdo de ${sw}px numa janela de ${vw}px; passam da borda: ${fora.slice(0, 3).map(onde).join(' | ')}`)
  }

  // 2. Elemento que estoura o pai (caixa visual mais próxima, ou ancestral que corta)
  const CAIXAS = '.celular__tela, .cartao, .amostra__caixa, .amostra, .lado-a-lado, .paleta, .escala-tipo, .telas, .linha, .lista, .serie, .folha, .toast, .chip, .botao, .numero-cartao, .barra-abas, .cabecalho, .caminho, .lado-a-lado > div, .faixa-cronometro, .passo, .tela-legenda, .pagina, figure, .cor-amostra, .selo-plus, .selo, body'
  for (const el of vis) {
    if (el === document.body) continue
    const r = el.getBoundingClientRect()
    let x = false, y = false, contra = null
    const caixa = el.parentElement?.closest(CAIXAS)
    const verifica = (anc, soCorte) => {
      let liberaX = false, liberaY = false
      for (let a = el.parentElement; a && a !== anc; a = a.parentElement) { const s = cs(a); if (rola(s, 'x')) liberaX = true; if (rola(s, 'y')) liberaY = true }
      const c = anc.getBoundingClientRect(), s = cs(anc)
      if (rola(s, 'x')) liberaX = true; if (rola(s, 'y')) liberaY = true
      const ex = !liberaX && (r.left < c.left - 1 || r.right > c.right + 1) && (!soCorte || corta(s, 'x'))
      const ey = !liberaY && (r.top < c.top - 1 || r.bottom > c.bottom + 1) && (!soCorte || corta(s, 'y'))
      if (ex || ey) { x ||= ex; y ||= ey; contra ||= anc }
    }
    if (caixa && caixa !== document.body) verifica(caixa, false)
    else if (caixa === document.body) { if (r.right > vw + 1 || r.left < -1) { x = true; contra = document.body } }
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = cs(a); if (corta(s, 'x') || corta(s, 'y')) { verifica(a, true); break } }
    if (x || y) add('estoura o pai', el, `${x ? 'na largura' : ''}${x && y ? ' e ' : ''}${y ? 'na altura' : ''} de ${contra.tagName.toLowerCase()}${classes(contra)}`)
  }

  // 3. Texto: cortado, vazando, sobreposto
  const temTexto = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const textos = vis.filter(temTexto)
  const PERMITIDO = '.cabecalho__titulo .titulo-2, .exercicio__titulo .titulo-3, .treino-pronto__descricao'
  let truncPermitidos = 0
  for (const el of textos) {
    const s = cs(el)
    const cortaX = corta(s, 'x'), cortaY = corta(s, 'y')
    const clamp = s.webkitLineClamp && s.webkitLineClamp !== 'none'
    const horiz = el.scrollWidth > el.clientWidth + 1
    const vert = el.scrollHeight > el.clientHeight + 1
    if ((cortaX && horiz) || (clamp && vert) || (cortaY && vert && !clamp)) {
      if (el.matches(PERMITIDO) && (s.textOverflow === 'ellipsis' || clamp)) truncPermitidos++
      else add('texto cortado', el, s.textOverflow === 'ellipsis' || clamp ? 'reticências onde a especificação não prevê' : 'cortado sem reticências')
    } else if (s.display !== 'inline' && el.clientWidth > 0) {
      // largura: o que passa da caixa; altura: linhas × altura de linha (a "caixa de glifo" da fonte não conta,
      // ela passa da linha em fontes como a Segoe UI e não é estouro de layout)
      const lh = s.lineHeight === 'normal' ? null : px(s.lineHeight)
      const linhas = new Set(); for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) linhas.add(Math.round(q.top)) }
      const z = zoomDe(el), alturaVista = el.getBoundingClientRect().height - (px(s.borderTopWidth) + px(s.borderBottomWidth)) * z
      const precisa = lh ? (linhas.size * lh + px(s.paddingTop) + px(s.paddingBottom)) * z : 0
      if (horiz && !cortaX) add('texto vaza da caixa', el, `${el.scrollWidth}px em ${el.clientWidth}px de largura`)
      else if (lh && !cortaY && precisa > alturaVista + 1) add('texto vaza da caixa', el, `${linhas.size} linha(s) de ${lh}px em ${(alturaVista / z).toFixed(0)}px de altura`)
    }
  }
  // sobreposição: retângulos das linhas de texto, recortados pelo que está visível
  const recorteVisivel = (el, incluiProprio) => {
    let v = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 }
    for (let a = incluiProprio ? el : el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = cs(a); if (corta(s, 'x') || corta(s, 'y') || rola(s, 'x') || rola(s, 'y')) { const c = a.getBoundingClientRect(); v = { l: Math.max(v.l, c.left), t: Math.max(v.t, c.top), r: Math.min(v.r, c.right), b: Math.min(v.b, c.bottom) } }
    }
    return v
  }
  const CAMADA = '.celular__flutuante, .folha-moldura'
  const caixasTexto = []
  for (const el of textos) {
    const v = recorteVisivel(el, true), camada = el.closest(CAMADA)
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue
      const rg = document.createRange(); rg.selectNodeContents(n)
      const lh = cs(el).lineHeight === 'normal' ? null : px(cs(el).lineHeight) * zoomDe(el)
      for (const q0 of rg.getClientRects()) {
        // a caixa de linha (line-height), não a caixa de glifo
        const meio = (q0.top + q0.bottom) / 2, alt = lh ? Math.min(q0.height, lh) : q0.height
        const q = { left: q0.left, right: q0.right, top: meio - alt / 2, bottom: meio + alt / 2 }
        const b = { l: Math.max(q.left, v.l), t: Math.max(q.top, v.t), r: Math.min(q.right, v.r), b: Math.min(q.bottom, v.b) }
        if (b.r - b.l > 1 && b.b - b.t > 1) caixasTexto.push({ el, camada, ...b })
      }
    }
  }
  caixasTexto.sort((a, b) => a.t - b.t)
  const visto = new Set()
  for (let i = 0; i < caixasTexto.length; i++) {
    const a = caixasTexto[i]
    for (let j = i + 1; j < caixasTexto.length && caixasTexto[j].t < a.b; j++) {
      const b = caixasTexto[j]
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
      if (a.camada !== b.camada) continue
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t)
      if (w > 1 && h > 1) { const k = [a.el, b.el].map(onde).sort().join('|'); if (!visto.has(k)) { visto.add(k); add('texto sobreposto', a.el, `cruza com ${onde(b.el)} (${w.toFixed(0)}×${h.toFixed(0)} px)`) } }
    }
  }

  // 4. Alvo de toque (em px de CSS do componente, sem o zoom da moldura)
  // o teto de 56 é do desenho na fonte padrão: com a fonte do sistema ampliada o botão cresce com o texto, de propósito
  const escalaFonte = px(cs(document.documentElement).fontSize) / 16
  const INTER = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="spinbutton"], [tabindex]:not([tabindex="-1"])'
  const alvos = []
  for (const el of document.querySelectorAll(INTER)) {
    if (!visivel(el)) continue
    // nos gráficos (telas novas) o alvo do dedo é o gráfico inteiro (o dedo corre por ele); as barras e pontos com tabindex são paradas de teclado
    if (el.closest('.p-grafico') && el.closest('svg')) continue
    const alvo = el.matches('input') && el.closest('.campo__caixa') ? el.closest('.campo__caixa') : el
    const r = alvo.getBoundingClientRect(), z = zoomDe(alvo)
    const w = r.width / z, h = r.height / z
    // 1.8.0: o alvo EFETIVO é o maior entre o desenho e a área invisível (::before posicionado, o hitSlop do mockup)
    const pb = getComputedStyle(alvo, '::before')
    const temArea = pb.content !== 'none' && pb.content !== 'normal' && /absolute|fixed/.test(pb.position)
    const we = temArea ? Math.max(w, px(pb.width)) : w, he = temArea ? Math.max(h, px(pb.height)) : h
    if (Math.min(we, he) < cfg.alvoPiso - 0.5) add('alvo de toque pequeno', alvo, `${we.toFixed(0)}×${he.toFixed(0)} px efetivos (desenho ${w.toFixed(0)}×${h.toFixed(0)}), mínimo ${cfg.alvoPiso}`)
    // 1.8.0: nada interativo passa de 56 de desenho; linhas de lista, cartões, abas e campos são superfície, não botão
    const SUPERFICIE = '.linha, .cartao, .cartao--tocavel, .exercicio-linha, .treino-pronto, .capa-treino, .foto-texto, .aba, .refeicao, .item-refeicao, .campo__caixa, input, textarea, select, .o-porta, .o-opcao, .o-chave, .p-cartao-tocavel, .p-atalho, .p-capa, .p-legenda-rosca button, .p-proximo, .p-dia, .p-mapa__dia, .l-linhas a, .l-aula, .p-grafico *, [role="spinbutton"], .deslizar, .amostra__caixa *:not(button):not(a), .celular, .pagina__topo *:not(button):not(a)'
    if (escalaFonte <= 1.01 && h > cfg.controleMaximo + 0.5 && (alvo.matches('button, a[href], [role="button"]')) && !alvo.matches(SUPERFICIE)) add('controle grande demais', alvo, `${w.toFixed(0)}×${h.toFixed(0)} px de desenho, máximo ${cfg.controleMaximo}`)
    const v = recorteVisivel(alvo)
    const rv = { left: Math.max(r.left, v.l), top: Math.max(r.top, v.t), right: Math.min(r.right, v.r), bottom: Math.min(r.bottom, v.b) }
    if (rv.right - rv.left > 1 && rv.bottom - rv.top > 1) alvos.push({ el: alvo, r: rv, camada: alvo.closest(CAMADA) })
  }
  for (let i = 0; i < alvos.length; i++) for (let j = i + 1; j < alvos.length; j++) {
    const a = alvos[i], b = alvos[j]
    if (a.el.contains(b.el) || b.el.contains(a.el) || a.camada !== b.camada) continue
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
    if (w > 1 && h > 1) add('alvos sobrepostos', a.el, `cruza com ${onde(b.el)}`)
  }

  // 5. Contraste (texto 4,5:1; texto grande e ícone 3:1). Desabilitado é isento (WCAG 1.4.3).
  const cor = (str) => {
    let m = str.match(/^rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1] }
    m = str.match(/^color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1] }
    return null
  }
  const mistura = (topo, base) => { const a = topo[3]; return [topo[0] * a + base[0] * (1 - a), topo[1] * a + base[1] * (1 - a), topo[2] * a + base[2] * (1 - a), 1] }
  const fundoDe = (el) => {
    const camadas = []
    for (let a = el; a; a = a.parentElement) { const c = cor(cs(a).backgroundColor); if (c && c[3] > 0) { camadas.push(c); if (c[3] >= 1) break } }
    let base = camadas.length && camadas[camadas.length - 1][3] >= 1 ? camadas.pop() : [255, 255, 255, 1]
    for (let i = camadas.length - 1; i >= 0; i--) base = mistura(camadas[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const razao = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  // sobre foto ou vidro: medido depois, contra o pior pixel (fora daqui)
  // + as superfícies da entrada (agente O) e das telas novas (agente P), cuja medida de pior pixel veio para cá
  const SOBRE_FOTO = '.foto-texto, .vidro, .vidro--escuro, .pilula-vidro, .botao--vidro, .celular__tela--imersiva .celular__inset-topo, .o-tela, .p-capa, .p-foto, .p-hero, .p-treino, .p-ativos, .p-comemoracao, .p-tela--foto-topo .celular__inset-topo'
  const sobreFoto = []
  const linhasDe = (el) => { const v = recorteVisivel(el, false), q = []; for (const n of el.childNodes) { if (n.nodeType !== 3 || !n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) { const b = { l: Math.max(r.left, v.l), t: Math.max(r.top, v.t), r: Math.min(r.right, v.r), b: Math.min(r.bottom, v.b) }; if (b.r - b.l > 1 && b.b - b.t > 1) q.push(b) } } return q }
  const registrarFoto = (el, c, grande, caixas) => {
    const cel = el.closest('.celular, .amostra__caixa'); if (!cel || !caixas.length) return
    if (!cel.hasAttribute('data-pp')) cel.setAttribute('data-pp', String(document.querySelectorAll('[data-pp]').length))
    const rc = cel.getBoundingClientRect(), i = cel.getAttribute('data-pp')
    el.setAttribute('data-pior-pixel', '')
    sobreFoto.push({ celular: i, cor: c, minimo: grande ? 3 : 4.5, onde: onde(el), caixas: caixas.map((b) => ({ l: b.l - rc.left, t: b.t - rc.top, r: b.r - rc.left, b: b.b - rc.top })) })
  }
  for (const el of textos) {
    if (desbotado(el)) continue
    const s = cs(el), c = cor(s.color); if (!c || c[3] === 0) continue
    if (el.closest(SOBRE_FOTO)) { const tam = px(s.fontSize), peso = parseInt(s.fontWeight); registrarFoto(el, c, tam >= 24 || (tam >= 18.66 && peso >= 700), linhasDe(el)); continue }
    const f = fundoDe(el), t = c[3] < 1 ? mistura(c, f) : c
    const tam = px(s.fontSize), peso = parseInt(s.fontWeight)
    const grande = tam >= 24 || (tam >= 18.66 && peso >= 700)
    const min = grande ? 3 : 4.5, k = razao(t, f)
    if (k < min - 0.005) add('contraste baixo', el, `${k.toFixed(2)}:1, mínimo ${min}:1 (${tam}px)`)
  }
  for (const el of vis.filter((e) => e.matches('svg.icone'))) {
    if (desbotado(el)) continue
    const s = cs(el), c = cor(s.stroke !== 'none' ? s.stroke : s.fill) || cor(s.color); if (!c || c[3] === 0) continue
    if (el.closest(SOBRE_FOTO)) { const r = el.getBoundingClientRect(), v = recorteVisivel(el, false); const b = { l: Math.max(r.left, v.l), t: Math.max(r.top, v.t), r: Math.min(r.right, v.r), b: Math.min(r.bottom, v.b) }; if (b.r - b.l > 1 && b.b - b.t > 1) registrarFoto(el, c, true, [b]); continue }
    const f = fundoDe(el), k = razao(c[3] < 1 ? mistura(c, f) : c, f)
    if (k < 2.995) add('contraste baixo', el, `ícone ${k.toFixed(2)}:1, mínimo 3:1`)
  }

  // 6. Imagem e forma deformadas
  for (const img of vis.filter((e) => e.tagName === 'IMG')) {
    if (!img.naturalWidth) { add('imagem não carregou', img, img.getAttribute('src')); continue }
    const s = cs(img), w = img.clientWidth - px(s.paddingLeft) - px(s.paddingRight), h = img.clientHeight - px(s.paddingTop) - px(s.paddingBottom)
    const nat = img.naturalWidth / img.naturalHeight, ren = w / h
    if (s.objectFit === 'fill' && Math.abs(ren / nat - 1) > 0.015) add('imagem deformada', img, `proporção ${ren.toFixed(3)} exibida, ${nat.toFixed(3)} no arquivo`)
  }
  const QUADRADOS = '.avatar, .serie__numero, .passo__botao, .botao--icone, .botao--circular, .refeicao__check-tudo, .ponto-plus, .ponto-aviso, .cronometro__anel, svg.icone, .item-refeicao__check > span, .exercicio__imagem, .serie__marcar, .mini img'
  for (const el of vis.filter((e) => e.matches(QUADRADOS))) {
    const r = el.getBoundingClientRect(); if (Math.abs(r.width - r.height) > 1) add('forma deformada', el, `${r.width.toFixed(0)}×${r.height.toFixed(0)} px, devia ser quadrada/redonda`)
  }
  for (const el of vis.filter((e) => e.tagName.toLowerCase() === 'svg' && e.getAttribute('preserveAspectRatio') === 'none')) add('forma deformada', el, 'SVG com preserveAspectRatio="none"')

  // 7. Moldura de celular: tela de 390 × 844 e cabendo na janela (largura sempre; altura quando a janela é deitada)
  const topo = document.querySelector('.pagina__topo, .o-pagina__topo')?.getBoundingClientRect().height || 0
  // o aparelho pedido na URL (?aparelho=) manda; sem ele, o padrão. O mockup tem de obedecer (data-aparelho).
  const pedido = new URLSearchParams(location.search).get('aparelho') || cfg.aparelhoPadrao
  const ap = cfg.aparelhos[pedido]
  const temMoldura = document.querySelector('.celular')
  if (temMoldura && !ap) add('aparelho', null, `aparelho "${pedido}" não existe no tokens.json`)
  if (temMoldura && ap && (document.documentElement.dataset.aparelho || cfg.aparelhoPadrao) !== pedido) add('aparelho', null, `pedi ${pedido}, o mockup mostra ${document.documentElement.dataset.aparelho || '(sem data-aparelho)'}`)
  const telaEsperada = ap ? [ap.largura, ap.altura] : cfg.telaCelular
  for (const c of document.querySelectorAll('.celular')) {
    const t = c.querySelector('.celular__tela'), r = t.getBoundingClientRect(), z = zoomDe(t)
    const w = r.width / z, h = r.height / z
    if (Math.abs(w - telaEsperada[0]) > 0.5 || Math.abs(h - telaEsperada[1]) > 0.5) add('moldura fora da proporção', c, `tela de ${w.toFixed(1)}×${h.toFixed(1)}, devia ser ${telaEsperada[0]}×${telaEsperada[1]} (${ap?.nome || pedido})`)
    // o texto da tela não pode herdar o alinhamento da legenda da página (cabeçalho grande e listas são à esquerda, componente 13)
    if (!/start|left/.test(cs(c).textAlign)) add('alinhamento herdado', c, `a tela herda text-align: ${cs(c).textAlign} de fora da moldura`)
    const rc = c.getBoundingClientRect()
    if (rc.right > vw + 0.5 || rc.left < -0.5) add('moldura não cabe na janela', c, `${rc.width.toFixed(0)}px de largura numa janela de ${vw}px`)
    if (innerWidth > innerHeight && rc.height > innerHeight - topo + 0.5) add('moldura não cabe na janela', c, `${rc.height.toFixed(0)}px de altura; visível sob o topo fixo: ${(innerHeight - topo).toFixed(0)}px`)
  }

  // 8. Escala de 4 px em margem, preenchimento e vão (molduras do aparelho ficam de fora)
  const CROMO = '.celular__ilha, .celular__gesto, .celular__inset-topo, .celular__inset-topo *, .espacos i, .esqueleto'
  for (const el of vis) {
    if (el.tagName.toLowerCase() === 'svg' || el.matches(CROMO)) continue
    const s = cs(el)
    // margem auto (centralizar, empurrar para o fim) não é espaço da escala: o Typed OM diz quando é auto
    const auto = (p) => { try { return String(el.computedStyleMap().get(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()))) === 'auto' } catch { return false } }
    const props = ['marginTop', 'marginBottom', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginLeft', 'marginRight'].filter((p) => !p.startsWith('margin') || !auto(p))
    if (/flex|grid/.test(s.display)) props.push('rowGap', 'columnGap')
    const fora = props.filter((p) => { const v = Math.abs(px(s[p])); return v > 0.01 && Math.abs(v / cfg.passo - Math.round(v / cfg.passo)) > 0.01 }).map((p) => `${p} ${s[p]}`)
    if (fora.length) add('espaço fora da escala de 4', el, fora.join(', '))
  }

  // 9. Tipografia: todo texto num degrau da escala (tamanho E altura de linha) e títulos em ordem
  const escala = px(cs(document.documentElement).fontSize) / 16
  const degraus = cfg.tipos.map((t) => {
    const teto = cfg.tetos[t.nome.split('<')[0]] || {}
    let e = escala
    if (teto.fatorMaximo) e = Math.min(e, teto.fatorMaximo)
    if (teto.tamanhoMaximo) e = Math.min(e, Math.max(1, teto.tamanhoMaximo / t.tamanho))
    return { nome: t.nome, tamanho: t.tamanho * e, linha: t.linha * e }
  })
  const herois = new Map()
  // a barra de status é desenhada pelo sistema, não pelo app: não segue a escala nem o Texto Dinâmico
  for (const el of textos.filter((e) => !e.closest('.celular__inset-topo'))) {
    const s = cs(el), tam = px(s.fontSize)
    const casam = degraus.filter((d) => Math.abs(d.tamanho - tam) < 0.3)
    if (!casam.length) { add('tamanho fora da escala tipográfica', el, `${+tam.toFixed(2)}px`); continue }
    const lh = s.lineHeight === 'normal' ? null : px(s.lineHeight)
    if (lh === null || !casam.some((d) => Math.abs(d.linha - lh) < 0.6)) add('altura de linha fora da escala', el, `${+tam.toFixed(2)}px com linha ${s.lineHeight} (esperado ${casam.map((d) => +d.linha.toFixed(1)).join(' ou ')})`)
    if (tam < cfg.minimoTexto * Math.min(escala, 1) - 0.01) add('texto abaixo do mínimo', el, `${tam}px`)
    // 1.8.0: o degrau precisa estar na escala fechada (13 · 16 · 20 · 25 · 31 · 39 · 49 · 61)
    const base = casam.map((d) => cfg.tipos.find((t) => t.nome === d.nome)?.tamanho)
    if (cfg.escalaFechada && !base.some((b) => cfg.escalaFechada.includes(b))) add('tamanho fora da escala fechada', el, `${+tam.toFixed(2)}px (degrau ${casam.map((d) => d.nome).join('/')})`)
    if (base.some((b) => b >= 49)) { const cel = el.closest('.celular'); if (cel) { const v = recorteVisivel(el, true), r = el.getBoundingClientRect(); if (Math.min(r.right, v.r) - Math.max(r.left, v.l) > 1 && Math.min(r.bottom, v.b) - Math.max(r.top, v.t) > 1) { if (!herois.has(cel)) herois.set(cel, []); herois.get(cel).push(el) } } }
  }
  for (const [cel, hs] of herois) if (hs.length > 1) add('mais de um herói na tela', hs[1], `${hs.length} textos de 49 ou mais visíveis: ${hs.map((h) => '"' + (h.textContent || '').trim().slice(0, 12) + '"').join(', ')}`)
  // a 160 %, texto em px fixo cai fora da escala ampliada: é assim que a medida pega texto que não acompanha a fonte
  const escopos = new Map()
  for (const h of vis.filter((e) => /^H[1-6]$/.test(e.tagName))) {
    const esc = h.closest('.celular, .amostra__caixa') || document.body
    if (!escopos.has(esc)) escopos.set(esc, []); escopos.get(esc).push(h)
  }
  for (const hs of escopos.values()) for (const a of hs) for (const b of hs) {
    const na = +a.tagName[1], nb = +b.tagName[1]
    if (na < nb && px(cs(a).fontSize) < px(cs(b).fontSize) - 0.1) add('títulos fora de ordem', b, `${b.tagName} de ${px(cs(b).fontSize)}px maior que ${a.tagName} "${a.textContent.trim().slice(0, 24)}" de ${px(cs(a).fontSize)}px`)
  }

  // 10. Abas: aluno = Início · Treinos · Plus · Perfil; academia (dono que é personal) = Alunos · Treinos · Plus · Academia · Perfil
  // P12 (agente AL): luta. Aluno (luta) = Início · Horários · Treinos · Academia · Perfil; professor = Hoje · Turmas · Alunos · Graduação · Perfil
  const ESPERADO = { aluno: ['Início', 'Treinos', 'Plus', 'Perfil'], academia: ['Alunos', 'Treinos', 'Plus', 'Academia', 'Perfil'],
    alunoLuta: ['Início', 'Horários', 'Treinos', 'Academia', 'Perfil'], professor: ['Hoje', 'Turmas', 'Alunos', 'Graduação', 'Perfil'] }
  for (const nav of document.querySelectorAll('nav.barra-abas')) {
    const rot = (nav.getAttribute('aria-label') || '').toLowerCase()
    const visao = rot.includes('professor') ? 'professor' : rot.includes('aluno') && rot.includes('luta') ? 'alunoLuta' : rot.includes('aluno') ? 'aluno' : rot.includes('academia') ? 'academia' : null
    const abas = [...nav.querySelectorAll('.aba')]
    const nomes = abas.map((a) => a.querySelector('.aba__rotulo')?.textContent.trim())
    if (!visao) add('abas', nav, 'barra sem rótulo de visão (aluno/academia/professor)')
    // academia: de 3 a 5 abas conforme o papel (decisoes.md): Plus só para personal, Academia só para dono; a ordem não muda
    else if (visao === 'academia' ? !(['Alunos', 'Treinos', 'Perfil'].every((n) => nomes.includes(n)) && nomes.every((n, i) => ESPERADO.academia.includes(n) && (i === 0 || ESPERADO.academia.indexOf(n) > ESPERADO.academia.indexOf(nomes[i - 1])))) : nomes.join('·') !== ESPERADO[visao].join('·')) add('abas', nav, `${visao}: ${nomes.join(' · ')} (esperado ${ESPERADO[visao].join(' · ')})`)
    const ativas = abas.filter((a) => a.classList.contains('aba--ativa'))
    if (ativas.length !== 1 || ativas[0].getAttribute('aria-current') !== 'page') add('abas', nav, 'precisa de exatamente 1 aba ativa com aria-current="page"')
    if (visivel(nav)) { const ws = abas.map((a) => a.getBoundingClientRect().width); if (Math.max(...ws) - Math.min(...ws) > 1) add('abas', nav, `larguras diferentes: ${ws.map((w) => w.toFixed(0)).join(', ')}`) }
  }
  for (const leg of document.querySelectorAll('.tela-legenda')) {
    const n = leg.querySelectorAll('nav.barra-abas .aba').length
    for (const p of leg.querySelectorAll(':scope > p')) { const m = p.textContent.match(/(\d+) abas/); if (m && +m[1] !== n) add('abas', p, `legenda diz ${m[1]} abas, a barra tem ${n}`) }
  }

  // 11. Comparativo de logo: os caminhos A, B e C com a mesma disposição e o mesmo tamanho (vão lado a lado no PDF)
  const caminhos = [...document.querySelectorAll('section.caminho')].filter((c) => c.querySelector('.linha')).slice(0, 3)
  if (caminhos.length === 3) {
    const medidas = caminhos.map((c) => { const l = c.querySelector('.linha').getBoundingClientRect(); return [...c.querySelectorAll('.linha figure, .linha img')].map((e) => { const r = e.getBoundingClientRect(); return [r.left - l.left, r.top - l.top, r.width, r.height].map((v) => Math.round(v)) }) })
    for (let k = 1; k < 3; k++) {
      if (medidas[k].length !== medidas[0].length) { add('logos desiguais', caminhos[k], `${medidas[k].length} peças, o caminho A tem ${medidas[0].length}`); continue }
      medidas[k].forEach((m, i) => { if (m.some((v, j) => Math.abs(v - medidas[0][i][j]) > 1)) add('logos desiguais', caminhos[k].querySelectorAll('.linha figure, .linha img')[i], `posição/tamanho ${m.join(',')} contra ${medidas[0][i].join(',')} no caminho A`) })
    }
  }

  // 12. Área segura (iPhone e Android): insets de tokens.json › layout.aparelhos, não do CSS, para pegar o CSS que
  // se afasta do token. Nada do app (texto, ícone, alvo) no inset do topo ou da base nem embaixo do recorte
  // (Dynamic Island, notch, furo) ou do indicador de início; cabeçalho abaixo do recorte, abas acima do indicador.
  if (ap) for (const c of document.querySelectorAll('.celular')) {
    const t = c.querySelector('.celular__tela'), rt = t.getBoundingClientRect(), z = zoomDe(t)
    const topoSeguro = rt.top + ap.areaSegura.topo * z, baseSegura = rt.bottom - ap.areaSegura.base * z
    const recorte = c.querySelector('.celular__ilha'), gesto = c.querySelector('.celular__gesto')
    const rr = recorte && visivel(recorte) ? recorte.getBoundingClientRect() : null
    const rg = gesto && visivel(gesto) ? gesto.getBoundingClientRect() : null
    const cruza = (a, b) => b && Math.min(a.r, b.right) - Math.max(a.l, b.left) > 0.5 && Math.min(a.b, b.bottom) - Math.max(a.t, b.top) > 0.5
    const nome = ap.recorte === 'ilhaDinamica' ? 'Dynamic Island' : ap.recorte === 'notch' ? 'notch' : 'furo da câmera'
    const doApp = [...t.querySelectorAll('*')].filter((e) => !e.closest('.celular__inset-topo, .celular__gesto') && visivel(e) &&
      (temTexto(e) || e.matches(INTER) || e.matches('svg.icone')))
    for (const e of doApp) {
      const r = e.getBoundingClientRect(), v = recorteVisivel(e)
      const q = { l: Math.max(r.left, v.l), t: Math.max(r.top, v.t), r: Math.min(r.right, v.r), b: Math.min(r.bottom, v.b) }
      if (q.r - q.l <= 0.5 || q.b - q.t <= 0.5) continue
      if (cruza(q, rr)) add('embaixo do recorte', e, `${nome} (${ap.nome})`)
      else if (q.t < topoSeguro - 0.5) add('fora da área segura', e, `${((topoSeguro - q.t) / z).toFixed(0)}px dentro do inset do topo (${ap.areaSegura.topo}, ${ap.nome})`)
      if (cruza(q, rg)) add('embaixo do indicador de início', e, ap.nome)
      else if (q.b > baseSegura + 0.5) add('fora da área segura', e, `${((q.b - baseSegura) / z).toFixed(0)}px dentro do inset da base (${ap.areaSegura.base}, ${ap.nome})`)
    }
    for (const h of t.querySelectorAll('.cabecalho')) {
      if (!visivel(h)) continue
      const r = h.getBoundingClientRect(), limite = Math.max(topoSeguro, rr ? rr.bottom : -1e9)
      if (r.top < limite - 0.5) add('cabeçalho sob o recorte', h, `começa ${((limite - r.top) / z).toFixed(0)}px acima do fim da área segura/recorte (${ap.nome})`)
    }
    for (const n of t.querySelectorAll('.barra-abas')) {
      if (!visivel(n)) continue
      const r = n.getBoundingClientRect(), limite = Math.min(baseSegura, rg ? rg.top : 1e9)
      if (r.bottom > limite + 0.5) add('abas sob o indicador de início', n, `terminam ${((r.bottom - limite) / z).toFixed(0)}px abaixo do limite (${ap.nome})`)
    }
    // a barra de status do aparelho não pode cruzar o recorte (hora e bateria dos lados da ilha/notch)
    for (const s of c.querySelectorAll('.celular__status > *')) {
      if (!visivel(s) || !rr) continue
      const r = s.getBoundingClientRect()
      if (cruza({ l: r.left, t: r.top, r: r.right, b: r.bottom }, rr)) add('barra de status cruza o recorte', s, ap.nome)
    }
    // o desenho é do aparelho certo: botão Início × indicador; recorte × tela inteira
    if (ap.botaoInicio && rg) add('aparelho', gesto, `${ap.nome} tem botão Início, não indicador`)
    if (!ap.botaoInicio && !rg) add('aparelho', c, `${ap.nome} precisa do indicador de início/barra de gestos`)
    if (ap.recorte === 'nenhum' && rr) add('aparelho', recorte, `${ap.nome} não tem recorte na tela`)
    if (ap.recorte !== 'nenhum' && !rr) add('aparelho', c, `${ap.nome} precisa do recorte (${ap.recorte})`)
  }

  return { achados: A, truncPermitidos, escala, sobreFoto }
}

// ---------------------------------------------------------------- fora da página
// pior pixel: com o texto transparente, fotografa cada moldura e compara a cor do texto com cada pixel da caixa da linha
function medirPixels({ png, itens }) {
  return new Promise((ok) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height
      const g = cv.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height).data
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
      const lum = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b)
      const res = []
      for (const it of itens) {
        let pior = 99, ondeP = null
        for (const c of it.caixas) {
          const x0 = Math.max(0, Math.ceil(c.l + 1)), x1 = Math.min(img.width, Math.floor(c.r - 1)), y0 = Math.max(0, Math.ceil(c.t + 1)), y1 = Math.min(img.height, Math.floor(c.b - 1))
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
            const k = (y * img.width + x) * 4, a = it.cor[3]
            const fr = d[k], fg = d[k + 1], fb = d[k + 2]
            const tr = it.cor[0] * a + fr * (1 - a), tg = it.cor[1] * a + fg * (1 - a), tb = it.cor[2] * a + fb * (1 - a)
            const l1 = lum(tr, tg, tb), l2 = lum(fr, fg, fb), raz = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
            if (raz < pior) { pior = raz; ondeP = [fr, fg, fb] }
          }
        }
        if (pior < it.minimo - 0.005) res.push({ onde: it.onde, detalhe: `${pior.toFixed(2)}:1 contra o pior pixel rgb(${ondeP.join(', ')}), mínimo ${it.minimo}:1` })
      }
      ok(res)
    }
    img.src = 'data:image/png;base64,' + png
  })
}

async function abrir() {
  try { return await chromium.launch() } catch (e) {
    if (!existsSync(RESERVA)) throw e
    return chromium.launch({ executablePath: RESERVA })
  }
}

const navegador = await abrir()
const capturas = join(aqui, 'capturas')
if (CAPTURAR) mkdirSync(capturas, { recursive: true })
// Rodadas: cada página em cada janela, mais a do mockup com as amostras forçadas a 324 px de coluna
// (a largura em que o PDF de apresentação recorta cada amostra numa janela de 1440).
const RODADAS = []
for (const pg of PAGINAS) for (const [w, h] of JANELAS) RODADAS.push({ pg, w, h, rotulo: `${w} × ${h}` })
if (PAGINAS.some((p) => p.nome === 'mockup')) RODADAS.push({ pg: PAGINAS_TODAS[0], w: 1440, h: 900, rotulo: 'amostra 324', estilo: '.amostras { grid-template-columns: repeat(auto-fill, 324px) !important }' })
// iPhones: a janela do tamanho do aparelho (as duas páginas; o mockup com a moldura do aparelho) e a moldura de
// cada iPhone no desktop e no ultrawide
for (const a of IPHONES) {
  for (const pg of PAGINAS) RODADAS.push({ pg, w: a.largura, h: a.altura, rotulo: `${a.id} ${a.largura} × ${a.altura}`, aparelho: pg.nome !== 'logo' ? a.id : null })
  for (const pg of MOCKUPS) for (const [w, h] of [[1440, 900], [2040, 790]]) if (pg.nome === 'mockup' || a.id === 'iphone-16') RODADAS.push({ pg, w, h, rotulo: `${a.id} ${w} × ${h}`, aparelho: a.id })
}
// transparência reduzida (o vidro vira sólido) e o + central (?abas=mais), no celular e no ultrawide
for (const [w, h] of [[393, 852], [2040, 790]]) {
  for (const pg of MOCKUPS) RODADAS.push({ pg, w, h, rotulo: `sem transparência ${w} × ${h}`, aparelho: 'iphone-16', transparencia: 'reduzida' })
  if (MOCKUPS.some((p) => p.nome === 'mockup')) RODADAS.push({ pg: PAGINAS_TODAS[0], w, h, rotulo: `abas=mais ${w} × ${h}`, aparelho: 'iphone-16', query: 'abas=mais' })
}
const resultados = []
for (const { pg, w, h, rotulo, estilo, aparelho, transparencia, query } of RODADAS) {
  for (const tema of TEMAS) for (const fonte of FONTES) {
    const ctx = await navegador.newContext({ viewport: { width: w, height: h }, colorScheme: tema === 'escuro' ? 'dark' : 'light', deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const erros = []
    page.on('pageerror', (e) => erros.push(e.message))
    if (pg.nome !== 'logo') await page.addInitScript((t) => { try { localStorage.setItem('academia-plus-tema', t); localStorage.setItem('academia-plus-fonte', '100'); localStorage.setItem('academia-plus-movimento', 'normal') } catch {} }, tema)
    if (pg.nome !== 'logo') await page.addInitScript((t) => { try { if (t) localStorage.setItem('academia-plus-transparencia', t); else localStorage.removeItem('academia-plus-transparencia') } catch {} }, transparencia || null)
    const qs = [aparelho ? `aparelho=${aparelho}` : '', query || ''].filter(Boolean).join('&')
    await page.goto(pathToFileURL(pg.arquivo).href + (qs ? '?' + qs : ''), { waitUntil: 'load', timeout: 30000 }).catch((e) => erros.push('carregar: ' + e.message))
    if (pg.nome === 'logo' && tema === 'escuro') await page.evaluate(() => window.alternarTema())
    if (estilo) { await page.addStyleTag({ content: estilo }); await page.evaluate(() => window.dispatchEvent(new Event('resize'))) }
    if (fonte !== 100) {
      await page.addStyleTag({ content: `html { font-size: ${fonte}% !important }` })
      await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    }
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))) })
    await page.waitForTimeout(pg.nome === 'entrada' || pg.nome === 'novas' ? 1700 : 80) // a entrada toca a demo da abertura (~1,3 s); a comemoração entra com escalonamento
    // espera os efeitos que terminam (os de laço, como o brilho do esqueleto, ficam de fora)
    await page.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => 0))), new Promise((r) => setTimeout(r, 3000))]))
    const r = await page.evaluate(auditarPagina, CFG)
    if (r.sobreFoto?.length) {
      // o texto some (a cor vira transparente) e cada moldura é fotografada sem o topo fixo por cima
      await page.addStyleTag({ content: '.pagina__topo, .o-pagina__topo { position: relative !important } [data-pior-pixel] { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important } svg[data-pior-pixel] { stroke: transparent !important; fill: transparent !important } *, *::before, *::after { animation-play-state: paused !important; transition: none !important }' })
      await page.waitForTimeout(40)
      const porCelular = new Map(); for (const it of r.sobreFoto) { if (!porCelular.has(it.celular)) porCelular.set(it.celular, []); porCelular.get(it.celular).push(it) }
      for (const [i, itens] of porCelular) {
        // a moldura entra na tela; o que ela dispara ao aparecer (a comemoração, por IntersectionObserver) é levado ao fim antes da foto
        await page.locator(`[data-pp="${i}"]`).scrollIntoViewIfNeeded()
        await page.waitForTimeout(60)
        await page.evaluate(() => document.getAnimations().forEach((a) => { if (a.effect?.getComputedTiming().endTime !== Infinity) try { a.finish() } catch {} }))
        const png = (await page.locator(`[data-pp="${i}"]`).screenshot({ animations: 'disabled' })).toString('base64')
        for (const a of await page.evaluate(medirPixels, { png, itens })) r.achados.push({ tipo: 'contraste baixo sobre foto', ...a })
      }
      r.medidosSobreFoto = r.sobreFoto.length
      delete r.sobreFoto
    }
    for (const e of erros) r.achados.push({ tipo: 'erro de script', onde: 'página', detalhe: e })
    resultados.push({ pagina: pg.nome, rodada: rotulo, aparelho: aparelho || null, largura: w, altura: h, tema, fonte, ...r })
    if (CAPTURAR && fonte === 100 && !estilo) await page.screenshot({ path: join(capturas, `${pg.nome}-${aparelho ? aparelho + '-' : ''}${w}x${h}-${tema}.png`), fullPage: true })
    await ctx.close()
  }
}
await navegador.close()

// ---------------------------------------------------------------- relatório no terminal
const total = resultados.reduce((s, r) => s + r.achados.length, 0)
writeFileSync(join(aqui, ANTES ? 'resultado-antes.json' : ANTES_IPHONE ? 'resultado-antes-iphone.json' : 'resultado.json'), JSON.stringify({ data: new Date().toISOString(), total, resultados }, null, 1))
const linha = (cols) => cols.map((c, i) => String(c).padEnd(i ? 9 : 34)).join('')
console.log(linha(['janela', ...PAGINAS.flatMap((p) => FONTES.flatMap((f) => TEMAS.map((t) => `${p.nome[0].toUpperCase()}${t[0]}${f}`)))]))
for (const rot of [...new Set(resultados.map((r) => r.rodada))]) console.log(linha([rot, ...PAGINAS.flatMap((p) => FONTES.flatMap((f) => TEMAS.map((t) => resultados.find((r) => r.pagina === p.nome && r.rodada === rot && r.tema === t && r.fonte === f)?.achados.length ?? '—')))]))
console.log('(M = mockup, E = entrada, N = novas, L = luta e logo, nesta ordem; c/e = claro/escuro; 100/160 = fonte do sistema)\n')
const porTipo = {}
for (const r of resultados) for (const a of r.achados) porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1
for (const [t, n] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${t}`)
const unicos = new Map()
for (const r of resultados) for (const a of r.achados) { const k = `${r.pagina}|${a.tipo}|${a.onde}|${a.detalhe}`; if (!unicos.has(k)) unicos.set(k, { ...a, pagina: r.pagina, ondeQuando: [] }); unicos.get(k).ondeQuando.push(`${r.rodada === 'amostra 324' ? 'a324' : (r.aparelho ? r.aparelho + '@' : '') + r.largura}${r.tema[0]}${r.fonte}`) }
if (unicos.size) {
  console.log(`\n${unicos.size} achados distintos (primeiros 150):`)
  ;[...unicos.values()].slice(0, 150).forEach((a) => console.log(`- [${a.pagina}] ${a.tipo} · ${a.onde} · ${a.detalhe}  (${a.ondeQuando.length}×: ${a.ondeQuando.slice(0, 4).join(' ')}${a.ondeQuando.length > 4 ? '…' : ''})`))
}
const trunc = resultados.reduce((s, r) => s + r.truncPermitidos, 0)
console.log(`\ntexto e ícone medidos contra o pior pixel (sobre foto ou vidro): ${resultados.reduce((s, r) => s + (r.medidosSobreFoto || 0), 0)} medições`)
console.log(`\nreticências previstas na especificação (cabeçalho 1 linha, nome do exercício 2 linhas, descrição do treino pronto): ${trunc} ocorrências, não contam como achado`)
console.log(total === 0 ? '\n0 achados' : `\n${total} achados`)
process.exitCode = total === 0 ? 0 : 1
