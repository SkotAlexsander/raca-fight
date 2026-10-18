// Junta em _capturas/ o que o PDF do admin mostra e que vem de fora desta pasta (agente AR, 15/10/2026):
//   1. as fotos reais da Raça Fight (02-design/referencias/raca-fight/fotos/) — só as escolhidas, sem rosto de menor;
//   2. o logo (02-design/marca-e-proposta/logo-raca-fight/) — PROVISÓRIO até chegar o arquivo da academia;
//   3. as telas do admin desenhadas pelo agente AK, QUANDO existirem.
// Uso: node capturar.mjs        (depois: node montar.mjs)
//
// TELAS: enquanto o AK não entrega, o PDF usa os quadros de tela (esboços em HTML, em paginas.mjs). Quando houver
// captura para um quadro, o montar.mjs usa a captura no lugar do esboço, sem mexer em mais nada. Duas fontes, nesta ordem:
//   a) as PNG/JPG que o AK salvar em 02-design/sistema-de-design/mockups/admin-capturas/ (o nome do arquivo precisa
//      conter uma das palavras da tabela TELAS abaixo; se houver "claro" e "escuro", vale o claro; "pc" ganha de "celular");
//   b) se não houver arquivo, a própria página do AK (mockups/admin.html), recortando o elemento [data-tela="<id>"].
// O resultado vai para _capturas/telas/<id>.png|jpg. Para voltar aos esboços: apague _capturas/telas/ ou rode o
// montar com ESBOCOS=1. Se o AK usar outros nomes, ajuste só a tabela TELAS.
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrirNavegador, servirPasta } from './navegador.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const design = resolve(aqui, '..', '..', '..', '02-design')
const saida = join(aqui, '_capturas')
for (const p of ['fotos', 'marca', 'telas']) mkdirSync(join(saida, p), { recursive: true })

// 1. fotos (sem criança e sem rosto de atleta em destaque)
const FOTOS = { 'capa.jpg': 'raca-14.jpg', 'academia.jpg': 'raca-01.jpg' }
for (const [para, de] of Object.entries(FOTOS)) copyFileSync(join(design, 'referencias', 'raca-fight', 'fotos', de), join(saida, 'fotos', para))
// 2. logo provisório
for (const f of ['raca-fight-completo-escuro.svg', 'raca-fight-compacto-escuro.svg', 'raca-fight-completo-claro.svg']) {
  const de = join(design, 'marca-e-proposta', 'logo-raca-fight', f)
  if (existsSync(de)) copyFileSync(de, join(saida, 'marca', f))
}
console.log(`fotos e logo copiados para ${saida}`)

// 3. telas do AK
// id do quadro no PDF → palavras que o nome da captura do AK pode ter
export const TELAS = {
  painel: ['painel'],
  alunos: ['alunos', 'pessoas'],
  funcionarios: ['funcionarios', 'equipe'],
  lancamentos: ['lancamentos', 'grade', 'planilha'],
  colar: ['colar'],
  cobrancas: ['cobrancas', 'mensalidades'],
  'despesas-fixas': ['despesas-fixas', 'despesas'],
  fechamento: ['fechamento'],
  inadimplencia: ['inadimplencia', 'inadimplentes', 'cobrar'],
  importar: ['importar', 'importacao'],
  exportar: ['exportar', 'exportacao'],
  'relatorio-ano': ['relatorio-ano', 'relatorios-ano', 'relatorios'],
  'relatorio-modalidade': ['relatorio-modalidade', 'modalidade'],
  filtro: ['filtro'],
  funil: ['funil'],
  agenda: ['agenda', 'lembretes'],
  historico: ['historico'],
}
const pastaAK = join(design, 'sistema-de-design', 'mockups', 'admin-capturas')
const paginaAK = join(design, 'sistema-de-design', 'mockups', 'admin.html')
rmSync(join(saida, 'telas'), { recursive: true, force: true }); mkdirSync(join(saida, 'telas'))
let trocadas = 0
const arquivos = existsSync(pastaAK) ? readdirSync(pastaAK).filter((f) => /\.(png|jpe?g)$/i.test(f)) : []
const faltam = []
for (const [id, palavras] of Object.entries(TELAS)) {
  // o AK grava <id>-pc.png (tema escuro, 2040 × 790): esse é o preferido; "-claro" e "-celular" só se não houver outro
  const exato = palavras.map((p) => `${p}-pc.png`).find((f) => arquivos.includes(f))
  const candidatos = exato ? [exato] : arquivos.filter((f) => palavras.some((p) => f.toLowerCase().startsWith(p)))
    .sort((a, b) => (/claro/.test(a) - /claro/.test(b)) || (/celular/.test(a) - /celular/.test(b)) || a.localeCompare(b))
  if (candidatos[0]) { copyFileSync(join(pastaAK, candidatos[0]), join(saida, 'telas', `${id}${extname(candidatos[0]).toLowerCase()}`)); trocadas++; console.log(`  tela ${id} ← ${candidatos[0]}`) } else faltam.push(id)
}
if (faltam.length && existsSync(paginaAK)) {
  const srv = await servirPasta(join(design, 'sistema-de-design', 'mockups'))
  const nav = await abrirNavegador()
  const p = await nav.newPage({ viewport: { width: 2040, height: 790 }, deviceScaleFactor: 1.5, colorScheme: 'light' })
  await p.goto(`${srv.base}/admin.html`, { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  for (const id of [...faltam]) {
    const el = await p.$(`[data-tela="${id}"]`)
    if (!el) continue
    await el.screenshot({ path: join(saida, 'telas', `${id}.jpg`), type: 'jpeg', quality: 86 })
    faltam.splice(faltam.indexOf(id), 1); trocadas++; console.log(`  tela ${id} ← admin.html [data-tela="${id}"]`)
  }
  await nav.close(); srv.fechar()
}
console.log(trocadas ? `ok · ${trocadas} tela(s) do AK no lugar dos esboços; continuam esboço: ${faltam.join(', ') || 'nenhuma'}` : 'ok · o AK ainda não tem capturas: o PDF usa os esboços')
