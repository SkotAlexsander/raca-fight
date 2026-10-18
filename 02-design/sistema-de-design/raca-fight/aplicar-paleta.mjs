// Aplica a paleta Raça Fight (paleta.mjs) ao tokens.json (1.8.0 → 2.0.0) e aos CSS dos mockups.
// Roda UMA vez (agente AL, 15/10/2026). Antes de mexer, guarda o tokens.json antigo em ../historico/.
// Uso: node aplicar-paleta.mjs
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COR } from './paleta.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..')
const arqTokens = join(raiz, 'tokens.json')
const t = JSON.parse(readFileSync(arqTokens, 'utf8'))
if (t.$versao !== '1.8.0') { console.log(`tokens.json já está na ${t.$versao}; nada a fazer`); process.exit(0) }
mkdirSync(join(raiz, 'historico'), { recursive: true })
const antigo = join(raiz, 'historico', 'tokens-1.8.0-academia-plus.json')
if (!existsSync(antigo)) copyFileSync(arqTokens, antigo)

// ---------- tokens.json
for (const tema of ['claro', 'escuro']) for (const [k, v] of Object.entries(COR[tema])) {
  if (!(k in t.cor[tema])) throw new Error(`papel novo ${k}: o gerador do app só conhece os papéis que já existem`)
  t.cor[tema][k] = v
}
const VIDRO_ESCURO = { fundo: 'rgba(14, 14, 14, 0.60)', borda: 'rgba(255, 255, 255, 0.14)', brilhoTopo: 'inset 0 1px 0 rgba(255, 255, 255, 0.10)', sombra: '0 8px 24px -12px rgba(0, 0, 0, 0.6)', texto: '#FFFFFF', textoSecundario: '#D9D9D9', destaque: '#FF6B6B', solido: '#262626', camadaContraste: 'linear-gradient(to top, rgba(10, 10, 10, 0.55), rgba(10, 10, 10, 0))' }
Object.assign(t.vidro.claro, { texto: '#1C1C1C', textoSecundario: '#3D3D3D', destaque: '#A51B1F' })
Object.assign(t.vidro.escuro, VIDRO_ESCURO)
Object.assign(t.vidro.escuroFixo, VIDRO_ESCURO)
t.vidro.barra = { ...t.vidro.barra, claro: 'rgba(255, 255, 255, 0.88)', escuro: 'rgba(28, 28, 28, 0.86)' }
Object.assign(t.foto, {
  gradiente: 'linear-gradient(180deg, rgba(10, 10, 10, 0.55) 0%, rgba(10, 10, 10, 0) 22%, rgba(10, 10, 10, 0) 32%, rgba(10, 10, 10, 0.74) 60%, rgba(10, 10, 10, 0.94) 100%)',
  gradienteCapa: 'linear-gradient(180deg, rgba(10, 10, 10, 0) 20%, rgba(10, 10, 10, 0.8) 64%, rgba(10, 10, 10, 0.94) 100%)',
  luzLateral: 'radial-gradient(120% 80% at 100% 0%, rgba(196, 32, 36, 0.24), rgba(196, 32, 36, 0) 60%)',
  textoSecundario: '#D9D9D9', fundoSemFoto: '#161616',
})
Object.assign(t.foto.entrada.claro, {
  veu: 'linear-gradient(180deg, rgba(245, 245, 245, 0.55) 0%, rgba(245, 245, 245, 0) 16%, rgba(245, 245, 245, 0) 38%, rgba(245, 245, 245, 0.80) 62%, rgba(245, 245, 245, 0.94) 100%)',
  veuDesfocada: 'rgba(245, 245, 245, 0.45)', texto: '#1C1C1C', textoSecundario: '#333333' })
Object.assign(t.foto.entrada.escuro, {
  veu: 'linear-gradient(180deg, rgba(20, 20, 20, 0.55) 0%, rgba(20, 20, 20, 0) 16%, rgba(20, 20, 20, 0) 36%, rgba(20, 20, 20, 0.72) 60%, rgba(20, 20, 20, 0.92) 100%)',
  veuDesfocada: 'rgba(20, 20, 20, 0.30)', textoSecundario: '#D9D9D9' })
t.abertura.claro = { fundo: '#1C1C1C', simbolo: '#FFFFFF' }
t.abertura.escuro = { fundo: '#1C1C1C', simbolo: '#FFFFFF' }
t.abertura.$nota = '2.0.0 (agente AL): a abertura é o preto da marca (#1C1C1C) com o logo compacto da Raça Fight em branco e a ponta da faixa em vermelho, IGUAL nos dois temas (os cartazes da academia são todos escuros). Branco sobre #1C1C1C 17,04:1. O logo é PROVISÓRIO (reconstrução em SVG, 02-design/marca-e-proposta/logo-raca-fight/) até chegar o original. Antes: ' + (t.abertura.$nota || '')
t.ilustracao.claro = { ...t.ilustracao.claro, fundo: '#EFEFEF', traco: '#1C1C1C', destaque: '#C42024' }
t.ilustracao.escuro = { ...t.ilustracao.escuro, fundo: '#262626', traco: '#F5F5F5', destaque: '#FF6B6B' }
Object.assign(t.grafico.claro, { neutro1: '#9A9A9A', neutro2: '#BDBDBD', neutro3: '#D6D6D6', grade: 'rgba(28, 28, 28, 0.10)', area: 'rgba(196, 32, 36, 0.14)' })
Object.assign(t.grafico.escuro, { neutro1: '#8A8A8A', neutro2: '#5C5C5C', neutro3: '#3D3D3D', grade: 'rgba(245, 245, 245, 0.10)', area: 'rgba(255, 107, 107, 0.16)' })
t.mapa.claro = { ...t.mapa.claro, vazio: '#E8E8E8' }
t.mapa.escuro = { ...t.mapa.escuro, vazio: '#262626' }
t.aviso.claro = { fundo: '#FFFFFF', fio: 'marca' }
t.aviso.escuro = { fundo: '#1C1C1C', fio: 'marca' }
t.sombra.atual = { ...t.sombra.atual, claro: '0 0 0 2px marca, 0 12px 24px -12px rgba(0,0,0,0.18)', escuro: '0 0 0 1.5px marca, 0 0 40px -4px rgba(196, 32, 36, 0.55)' }
t.sombra.viva = { ...t.sombra.viva, claro: '0 8px 24px -8px rgba(196, 32, 36, 0.35)', escuro: '0 0 0 1px rgba(196, 32, 36, 0.45), 0 8px 32px -6px rgba(196, 32, 36, 0.5)' }
t.cronometro.fase.trabalho = { fundo: 'viva', texto: 'vivaTexto' }

t.$versao = '2.0.0'
t.$data = '2026-10-15'
t.$descricao = 'Tokens do Raça Fight Gravataí (antes Academia Plus). Desde a 2.0.0 (agente AL, P12, 15/10/2026) a cor é a da academia: VERMELHO #C42024, PRETO #1C1C1C / GRAFITE #343434 e BRANCO, medidos nos cartazes, no letreiro e nas camisetas do Instagram (02-design/referencias/raca-fight/01-DADOS-REAIS.md). O sistema do P09 continua igual: foto grande e escura, vidro sobre a foto, escala tipográfica fechada 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61, um herói por tela, toque invisível de 48 separado do tamanho visual, movimento reduzido = esmaecer de 160 ms. Os NOMES dos papéis não mudaram (o gerador do app, app/ferramentas/gerar-tema.mjs, segue igual). viva é o vermelho de PREENCHIMENTO (botão primário, check-in, cronômetro em trabalho, comemoração), igual nos dois temas, sempre com branco por cima (5,87:1). No escuro, o vermelho da marca NÃO é texto nem traço (2,90:1 sobre #1C1C1C): marca e progresso viram o vermelho claro #FF6B6B (6,14:1). O dourado do Plus fica parado enquanto o Plus for [decidir] (L12). Medida de cada par: raca-fight/paleta.mjs e raca-fight/contraste.json.'
t.$historico = '2.0.0 (15/10/2026, agente AL, P12): troca de MARCA, por isso versão maior. O verde-água do Academia Plus (#007761 / #39F0CD, fundo esverdeado #070C0C) sai; entra a paleta da Raça Fight. claro: fundo #F5F5F5, texto #1C1C1C, textoSecundario #545454, marca = viva = #C42024, marcaSuave #FBE6E6, erro #B3261E. escuro: fundo #141414, superficie #1C1C1C, superficieElevada #262626, borda #343434, texto #F5F5F5, textoSecundario #ADADAD, marca = progresso = foco #FF6B6B, viva #C42024 com vivaTexto #FFFFFF, marcaSuave #3A1517, erro #FF8A80. Vidro, foto, véu da entrada, ilustração, gráfico, mapa, aviso e sombras: tons neutros (sem o verde) e o brilho em vermelho. abertura: preto da marca nos dois temas, com o logo branco. cronometro.fase.trabalho: viva/vivaTexto (era marca/marcaTexto, que no escuro agora é o vermelho claro). O tokens.json antigo está inteiro em historico/tokens-1.8.0-academia-plus.json. ' + t.$historico
t.cor.$contrato = '2.0.0 (Raça Fight): os 10 papéis obrigatórios continuam (fundo, superficie, texto, textoSecundario, marca, marcaTexto, sucesso, atencao, erro, plus). viva = #C42024 nos dois temas, só como PREENCHIMENTO e sempre com vivaTexto #FFFFFF (5,87:1). marca: no claro = #C42024 (texto, link, aba ativa, traço: 5,87:1 sobre branco, 5,38:1 sobre o fundo); no escuro = #FF6B6B (6,14:1 sobre #1C1C1C), porque o vermelho cru dá 2,90:1. erro e marca são da mesma família: erro SEMPRE com o ícone de alerta e a frase (a cor nunca é o único sinal), e o vermelho da marca nunca aparece sozinho como mensagem de estado. Antes (1.8.0): ' + (t.cor.$contrato || '')
writeFileSync(arqTokens, JSON.stringify(t, null, 2) + '\n')
console.log('tokens.json → 2.0.0')

// ---------- CSS dos mockups: troca por nome de variável e por tema
const nomeCss = (k) => '--cor-' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
const VARS = { claro: {}, escuro: {}, raiz: {} }
for (const tema of ['claro', 'escuro']) for (const [k, v] of Object.entries(COR[tema])) VARS[tema][nomeCss(k)] = v
Object.assign(VARS.claro, {
  '--vidro-texto': '#1C1C1C', '--vidro-texto-secundario': '#3D3D3D', '--vidro-destaque': '#A51B1F', '--vidro-barra': 'rgba(255, 255, 255, 0.88)',
  '--sombra-viva': '0 8px 24px -8px rgba(196, 32, 36, 0.35)',
  '--foto-veu-entrada': t.foto.entrada.claro.veu, '--foto-veu-desfocada': t.foto.entrada.claro.veuDesfocada,
  '--foto-entrada-texto': '#1C1C1C', '--foto-entrada-texto-secundario': '#333333',
  '--abertura-fundo': '#1C1C1C', '--abertura-simbolo-cor': '#FFFFFF',
  '--ilustracao-fundo': '#EFEFEF', '--ilustracao-traco': '#1C1C1C', '--ilustracao-destaque': '#C42024',
  '--grafico-neutro-1': '#9A9A9A', '--grafico-neutro-2': '#BDBDBD', '--grafico-neutro-3': '#D6D6D6', '--grafico-grade': 'rgba(28, 28, 28, 0.10)', '--grafico-area': 'rgba(196, 32, 36, 0.14)',
  '--mapa-vazio': '#E8E8E8', '--aviso-fundo': '#FFFFFF', '--aviso-fio': 'var(--cor-marca)', '--cor-moldura': '#1C1C1C',
})
Object.assign(VARS.escuro, {
  '--vidro-fundo': VIDRO_ESCURO.fundo, '--vidro-texto-secundario': '#D9D9D9', '--vidro-destaque': '#FF6B6B', '--vidro-solido': '#262626', '--vidro-camada': VIDRO_ESCURO.camadaContraste,
  '--vidro-barra': 'rgba(28, 28, 28, 0.86)',
  '--sombra-viva': t.sombra.viva.escuro, '--sombra-atual': '0 0 0 1.5px var(--cor-marca), 0 0 40px -4px rgba(196, 32, 36, 0.55)',
  '--foto-veu-entrada': t.foto.entrada.escuro.veu, '--foto-veu-desfocada': t.foto.entrada.escuro.veuDesfocada,
  '--abertura-fundo': '#1C1C1C', '--abertura-simbolo-cor': '#FFFFFF',
  '--ilustracao-fundo': '#262626', '--ilustracao-traco': '#F5F5F5', '--ilustracao-destaque': '#FF6B6B',
  '--grafico-neutro-1': '#8A8A8A', '--grafico-neutro-2': '#5C5C5C', '--grafico-neutro-3': '#3D3D3D', '--grafico-grade': 'rgba(245, 245, 245, 0.10)', '--grafico-area': 'rgba(255, 107, 107, 0.16)',
  '--mapa-vazio': '#262626', '--aviso-fundo': '#1C1C1C', '--aviso-fio': 'var(--cor-marca)', '--cor-moldura': '#262626',
})
Object.assign(VARS.raiz, { '--foto-gradiente': t.foto.gradiente, '--foto-gradiente-capa': t.foto.gradienteCapa, '--foto-luz-lateral': t.foto.luzLateral, '--foto-texto-secundario': '#D9D9D9', '--foto-fundo-sem-foto': '#161616' })
// o que sobra fora das variáveis (efeitos de componente e véus locais)
const SOLTAS = [
  [/rgba\(57, ?240, ?205, ?([\d.]+)\)/g, 'rgba(196, 32, 36, $1)'], [/rgba\(0, ?119, ?97, ?([\d.]+)\)/g, 'rgba(196, 32, 36, $1)'],
  [/rgba\(4, ?8, ?8, ?([\d.]+)\)/g, 'rgba(10, 10, 10, $1)'], [/rgba\(7, ?12, ?12, ?([\d.]+)\)/g, 'rgba(20, 20, 20, $1)'],
  [/rgba\(8, ?14, ?13, ?([\d.]+)\)/g, 'rgba(14, 14, 14, $1)'], [/rgba\(18, ?26, ?25, ?([\d.]+)\)/g, 'rgba(28, 28, 28, $1)'],
  [/rgba\(244, ?248, ?247, ?([\d.]+)\)/g, 'rgba(245, 245, 245, $1)'], [/rgba\(19, ?29, ?28, ?([\d.]+)\)/g, 'rgba(28, 28, 28, $1)'],
  [/rgba\(233, ?242, ?241, ?([\d.]+)\)/g, 'rgba(245, 245, 245, $1)'],
  [/#007761/gi, '#C42024'], [/#00604E/gi, '#A51B1F'], [/#39F0CD/gi, '#FF6B6B'], [/#D5DEDD/gi, '#D9D9D9'], [/#0B1312/gi, '#161616'],
  [/#131D1C/gi, '#1C1C1C'], [/#1B2423/gi, '#262626'], [/#121A19/gi, '#1C1C1C'], [/#E9F2F1/gi, '#F5F5F5'], [/#3B4847/gi, '#3D3D3D'], [/#2E3B3A/gi, '#333333'],
]
function recolorir(css) {
  let tema = null
  return css.split('\n').map((l) => {
    if (/^:root \{/.test(l)) tema = 'raiz'
    else if (/data-tema="claro"\] \{/.test(l)) tema = 'claro'
    else if (/^\[data-tema="escuro"\] \{|:root:not\(\[data-tema\]\) \{|^\.vidro--escuro \{/.test(l)) tema = 'escuro'
    if (tema) l = l.replace(/(--[\w-]+):\s*([^;]+);/g, (m, nome, val) => (VARS[tema][nome] !== undefined ? `${nome}: ${VARS[tema][nome]};` : m))
    if (/^\s*\}\s*$/.test(l)) tema = null
    for (const [re, novo] of SOLTAS) l = l.replace(re, novo)
    return l
  }).join('\n')
}
for (const f of ['sistema.css', 'entrada.css', 'novas.css', 'index.html', 'entrada.html', 'novas.html']) {
  const p = join(raiz, 'mockups', f)
  const antes = readFileSync(p, 'utf8'), depois = recolorir(antes)
  if (antes !== depois) { writeFileSync(p, depois); console.log('recolorido:', f) }
}
