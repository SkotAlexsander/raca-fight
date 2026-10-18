// Paleta Raça Fight (agente AL, P12, 15/10/2026): a fonte única das cores novas.
// A marca medida nas 54 fotos do Instagram (02-design/referencias/raca-fight/01-DADOS-REAIS.md):
// vermelho #C42024, preto #1C1C1C e #343434, branco. O resto são tons de apoio para o claro e o escuro.
// Uso: node paleta.mjs  → imprime a tabela de contraste (WCAG 2.x) e grava contraste.json
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MARCA = { vermelho: '#C42024', preto: '#1C1C1C', grafite: '#343434', branco: '#FFFFFF' }

export const COR = {
  claro: {
    fundo: '#F5F5F5', superficie: '#FFFFFF', superficieElevada: '#FFFFFF', texto: '#1C1C1C', textoSecundario: '#545454',
    borda: '#D6D6D6', marca: '#C42024', marcaTexto: '#FFFFFF', marcaSuave: '#FBE6E6', viva: '#C42024', vivaTexto: '#FFFFFF',
    progresso: '#C42024', foco: '#C42024', sucesso: '#0A7E3A', sucessoTexto: '#FFFFFF', atencao: '#B74D00', atencaoTexto: '#FFFFFF',
    erro: '#B3261E', erroTexto: '#FFFFFF', plus: '#EAB444', plusTexto: '#3A2B0D', plusTextoSobreFundo: '#9A6100', plusSuave: '#FCF2E1',
    trilho: '#E2E2E2', regua: 'rgba(28, 28, 28, 0.10)', sobreposicao: 'rgba(0, 0, 0, 0.48)',
  },
  escuro: {
    fundo: '#141414', superficie: '#1C1C1C', superficieElevada: '#262626', texto: '#F5F5F5', textoSecundario: '#ADADAD',
    borda: '#343434', marca: '#FF6B6B', marcaTexto: '#1C1C1C', marcaSuave: '#3A1517', viva: '#C42024', vivaTexto: '#FFFFFF',
    progresso: '#FF6B6B', foco: '#FF6B6B', sucesso: '#67D283', sucessoTexto: '#141414', atencao: '#FDA16B', atencaoTexto: '#141414',
    erro: '#FF8A80', erroTexto: '#141414', plus: '#F8C153', plusTexto: '#2F2207', plusTextoSobreFundo: '#F8C153', plusSuave: '#332710',
    trilho: '#2E2E2E', regua: 'rgba(245, 245, 245, 0.10)', sobreposicao: 'rgba(0, 0, 0, 0.64)',
  },
}

// pares que o sistema usa de verdade (texto 4,5:1; texto grande, ícone e traço 3:1)
export const PARES = [
  ['claro', 'texto', 'fundo', 4.5], ['claro', 'texto', 'superficie', 4.5], ['claro', 'textoSecundario', 'fundo', 4.5],
  ['claro', 'textoSecundario', 'superficie', 4.5], ['claro', 'marca', 'superficie', 4.5], ['claro', 'marca', 'fundo', 4.5],
  ['claro', 'marcaTexto', 'marca', 4.5], ['claro', 'vivaTexto', 'viva', 4.5], ['claro', 'marca', 'marcaSuave', 4.5],
  ['claro', 'texto', 'marcaSuave', 4.5], ['claro', 'progresso', 'trilho', 3], ['claro', 'foco', 'fundo', 3],
  ['claro', 'erro', 'superficie', 4.5], ['claro', 'erroTexto', 'erro', 4.5], ['claro', 'sucesso', 'fundo', 4.5],
  ['claro', 'atencao', 'fundo', 4.5],
  ['escuro', 'texto', 'fundo', 4.5], ['escuro', 'texto', 'superficieElevada', 4.5], ['escuro', 'textoSecundario', 'fundo', 4.5],
  ['escuro', 'textoSecundario', 'superficie', 4.5], ['escuro', 'textoSecundario', 'superficieElevada', 4.5],
  ['escuro', 'marca', 'fundo', 4.5], ['escuro', 'marca', 'superficie', 4.5], ['escuro', 'marca', 'superficieElevada', 4.5],
  ['escuro', 'marcaTexto', 'marca', 4.5], ['escuro', 'vivaTexto', 'viva', 4.5], ['escuro', 'marca', 'marcaSuave', 4.5],
  ['escuro', 'texto', 'marcaSuave', 4.5], ['escuro', 'progresso', 'trilho', 3], ['escuro', 'foco', 'fundo', 3],
  ['escuro', 'erro', 'superficie', 4.5], ['escuro', 'erroTexto', 'erro', 4.5], ['escuro', 'sucesso', 'superficie', 4.5],
  ['escuro', 'atencao', 'superficie', 4.5],
]
// a marca crua contra os fundos (por que o vermelho não é texto no escuro)
export const CRUS = [['#C42024', '#1C1C1C', 'vermelho sobre o preto da marca'], ['#C42024', '#141414', 'vermelho sobre o fundo escuro'],
  ['#FFFFFF', '#C42024', 'branco sobre o vermelho'], ['#FFFFFF', '#1C1C1C', 'branco sobre o preto'], ['#FFFFFF', '#343434', 'branco sobre o grafite'],
  ['#C42024', '#343434', 'vermelho sobre o grafite']]

const hex = (x) => { x = x.replace('#', ''); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)) }
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
export const lum = (c) => { const [r, g, b] = hex(c); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) }
export const razao = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const linhas = PARES.map(([t, a, b, m]) => ({ tema: t, frente: a, fundo: b, cores: `${COR[t][a]} / ${COR[t][b]}`, razao: +razao(COR[t][a], COR[t][b]).toFixed(2), minimo: m }))
  let falhas = 0
  for (const l of linhas) { const ok = l.razao >= l.minimo; if (!ok) falhas++; console.log(`${ok ? 'ok ' : 'NÃO'} ${l.tema.padEnd(7)} ${l.frente.padEnd(16)} sobre ${l.fundo.padEnd(18)} ${l.cores}  ${l.razao.toFixed(2)}:1 (mín. ${l.minimo})`) }
  const crus = CRUS.map(([a, b, n]) => ({ par: n, cores: `${a} / ${b}`, razao: +razao(a, b).toFixed(2) }))
  for (const c of crus) console.log(`--- ${c.par.padEnd(32)} ${c.cores}  ${c.razao.toFixed(2)}:1`)
  writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'contraste.json'), JSON.stringify({ data: '2026-10-15', pares: linhas, crus }, null, 1))
  console.log(falhas ? `\n${falhas} par(es) abaixo do mínimo` : '\ntodos os pares no mínimo ou acima')
  process.exitCode = falhas ? 1 : 0
}
