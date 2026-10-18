// Capturas do Admin CONSTRUÍDO (admin/), para o PDF do dono. Agente AV, 16/10/2026.
// Em vez dos desenhos do AK, o PDF passa a mostrar o Admin de verdade, rodando no modo local
// (a Raça Fight de exemplo do admin/src/dados/local/exemplo.ts: nomes inventados, valores de exemplo).
//
// Uso (de dentro de docs/apresentacao/admin/):
//   node capturar-admin.mjs [pasta-do-dist]     → _capturas/admin/<nome>.jpg (2040 × 790, escala 1,5, tema escuro)
// Sem argumento, usa ../../../admin/dist (rode antes `npm run build` em admin/). O dist é servido por um
// servidor estático daqui; nada é escrito em admin/.
// Além das telas que o AM1 e o AO já capturavam, traz os estados da onda 4: colar uma coluna, Ctrl+D,
// filtro por pessoa e valor, importar "Data · Aluno · Valor", Turmas e horários, a família paga de uma vez.
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrirNavegador, servirPasta } from './navegador.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(process.argv[2] ?? join(aqui, '..', '..', '..', 'admin', 'dist'))
const SAIDA = join(aqui, '_capturas', 'admin')
mkdirSync(SAIDA, { recursive: true })
const SO = process.env.SO?.split(',')

const colarTexto = async (p, alvo, texto) => {
  await alvo.evaluate((el, t) => { const dt = new DataTransfer(); dt.setData('text/plain', t); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })) }, texto)
}
const grade = (p) => p.getByRole('grid')

// Nomes que aparecem no Instagram da academia (a mesma lista do app: app/dados/local/dados-de-exemplo.ts, e a do AS).
// O exemplo do Admin (admin/src/dados/local/exemplo.ts) ainda usa alguns deles em nomes inventados ("Bruno Hoffmann",
// "Gustavo Duarte"). Como o AS fez com os mockups, a troca vale só para a cópia aberta no navegador, na hora da foto:
// o admin/ não muda (achado anotado no relatório AV).
const TROCAS = { Bruno: 'Breno', Leonardo: 'Leandro', Duarte: 'Dutra', Rafael: 'Renan', 'João': 'Joel', Juliana: 'Juliane', Carlos: 'Cláudio', Caio: 'Cauã', Arthur: 'Augusto', Richard: 'Ricardo', Cesar: 'Celso', 'César': 'Célio', Thales: 'Tiago', Eduardo: 'Edson', Rodrigues: 'Ribeiro', Moreschi: 'Moraes', Toledo: 'Torres', Cardozo: 'Cardim', Norton: 'Nilton', Schutz: 'Scholz' }
export async function trocarNomes(p) {
  await p.evaluate((trocas) => {
    const re = new RegExp(`\\b(${Object.keys(trocas).join('|')})\\b`, 'g')
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) if (re.test(n.nodeValue)) { re.lastIndex = 0; n.nodeValue = n.nodeValue.replace(re, (m) => trocas[m]) }
    for (const i of document.querySelectorAll('input, textarea')) if (re.test(i.value)) { re.lastIndex = 0; i.value = i.value.replace(re, (m) => trocas[m]) }
  }, TROCAS)
}
const celula = (p, linha, col) => grade(p).locator('tbody tr').nth(linha).locator(`td[data-c="${col}"]`)
const COLADAS = ['01/10\tMensal — Pedro Henrique Sá\tMensalidades\tEntrada\t220,00\tPix', '01/10\tMensal — Aline Castro\tMensalidades\tEntrada\t120,00\tPix', '02/10\tMensal — Sofia Brandão\tMensalidades\tEntrada\t110,00\tDinheiro', '31/09\tMensal — Tatiane Moura\tMensalidades\tEntrada\t405,00\tPix', '03/10\tLuvas 14 oz\tVenda de produtos\tEntrada\t12,345\tPix', '03/10\tFaixa preta (bordada)\tVenda de produtos\tEntrada\t90,00\tPix', '04/10\tÁgua\tÁgua\tSaída\t187,50\tBoleto', '04/10\tProdutos de limpeza\tLimpeza e manutenção\tSaída\t126,90\tCartão de débito'].join('\n')

/** Abre a gaveta Filtrar da planilha e marca só as saídas (assim as linhas de cima são todas lançamentos, sem cobrança). */
const soSaidas = async (p) => {
  await p.getByRole('button', { name: 'Filtrar' }).first().click()
  await p.getByRole('dialog').getByLabel('Saídas', { exact: true }).check()
  await p.getByRole('dialog').getByRole('button', { name: 'Aplicar' }).click()
  await p.waitForTimeout(400)
}

// [nome, rota, preparar?, largura?]
const TELAS = [
  ['painel', 'painel'],
  ['lancamentos', 'financeiro/lancamentos', async (p) => {
    await celula(p, 0, 0).click()
    await p.keyboard.press('Shift+Space'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Shift+Space')
    for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowRight')
  }],
  ['colar', 'financeiro/lancamentos', async (p) => { await celula(p, 0, 0).click(); await colarTexto(p, grade(p), COLADAS) }],
  ['colar-coluna', 'financeiro/lancamentos', async (p) => {
    await soSaidas(p)
    await celula(p, 0, 5).click()
    // a coluna Forma das quatro saídas de cima é Pix, Boleto, Boleto, Boleto: colar outra ordem muda as quatro
    await colarTexto(p, grade(p), ['Boleto', 'Pix', 'Pix', 'Pix'].join('\n'))
    await p.locator('text=Colada a coluna').waitFor(); await p.waitForTimeout(800)
  }],
  ['ctrl-d', 'financeiro/lancamentos', async (p) => {
    await soSaidas(p)
    await celula(p, 0, 5).click()
    for (let i = 0; i < 3; i++) await p.keyboard.press('Shift+ArrowDown')
    await p.keyboard.press('Control+d')
  }],
  ['filtro-lanc', 'financeiro/lancamentos', async (p) => {
    await p.getByRole('button', { name: 'Filtrar' }).first().click()
    const g = p.getByRole('dialog')
    await p.waitForTimeout(500)
    await g.getByLabel('Valor de', { exact: true }).fill('100')
    await g.getByLabel('até', { exact: true }).fill('200')
    await g.getByRole('checkbox', { name: 'Entradas', exact: true }).evaluate((el) => el.click())
    await g.getByLabel('Pessoa', { exact: true }).fill('Talita Sá')
    await g.getByRole('button', { name: 'Aplicar' }).evaluate((el) => el.click())
    await p.waitForTimeout(500)
    await p.getByRole('button', { name: 'Filtrar' }).first().click()
  }],
  ['filtro-lanc-aplicado', 'financeiro/lancamentos', async (p) => {
    await p.getByRole('button', { name: 'Filtrar' }).first().click()
    const g = p.getByRole('dialog')
    await p.waitForTimeout(500)
    await g.getByLabel('Valor de', { exact: true }).fill('100')
    await g.getByLabel('até', { exact: true }).fill('200')
    await g.getByRole('checkbox', { name: 'Entradas', exact: true }).evaluate((el) => el.click())
    await g.getByLabel('Pessoa', { exact: true }).fill('Talita Sá')
    await g.getByRole('button', { name: 'Aplicar' }).evaluate((el) => el.click())
  }],
  ['fechado', 'financeiro/lancamentos', async (p) => { await p.getByRole('button', { name: 'Mês anterior' }).click(); await p.waitForTimeout(300); await grade(p).locator('td[tabindex="0"]').focus(); await p.keyboard.press('Enter') }],
  ['cobrancas', 'financeiro/cobrancas', async (p) => { await p.getByRole('button', { name: 'Marcar como paga' }).first().click() }],
  ['cobrancas-lista', 'financeiro/cobrancas'],
  ['despesas-fixas', 'financeiro/despesas-fixas'],
  ['fechamento', 'financeiro/fechamento'],
  ['importar', 'financeiro/importar', async (p) => { await p.locator('input[type="file"]').setInputFiles(join(aqui, '..', '..', '..', 'admin', 'e2e', 'planilha-de-exemplo.xlsx')) }],
  ['importar-curta', 'financeiro/importar', async (p) => {
    const linhas = ['Data\tAluno\tValor', '01/10/2026\tCíntia Bittencourt\t150,00', '01/10/2026\tPriscila Vieira\t70,00', '02/10/2026\tKarina Teles\t120,00', '03/10/2026\tTalita Sá\t160,00', '03/10/2026\tMarcos Antunes\t120,00', '05/10/2026\tBianca Dornelles\t150,00']
    await p.locator('textarea').fill(linhas.join('\n'))
    await p.getByRole('button', { name: 'Conferir o que colei' }).click()
    await p.waitForTimeout(400)
    await p.locator('select').first().selectOption('entrada')
    await p.waitForTimeout(300)
    await p.getByRole('group', { name: 'Grupos da prévia' }).getByText('Com aviso').click()
  }],
  ['exportar', 'financeiro/exportar'],
  ['pessoas', 'pessoas/alunos'],
  ['filtro', 'pessoas/filtro'],
  // a família com duas cobranças abertas no exemplo é a da Vanessa Vieira (a Fernanda Lima tem uma só)
  ['ficha-kids', 'pessoas/responsaveis', async (p) => { await p.getByRole('link', { name: 'Vanessa Vieira' }).click() }],
  ['ficha-kids-paga', 'pessoas/responsaveis', async (p) => {
    await p.getByRole('link', { name: 'Vanessa Vieira' }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: /^Marcar as \d+ como pagas$/ }).click()
  }],
  ['funcionarios', 'pessoas/funcionarios'],
  ['relatorio-modalidade', 'relatorios/modalidade'],
  ['relatorio-ano', 'relatorios/ano'],
  ['inadimplencia', 'relatorios/inadimplencia'],
  ['funil', 'funil'],
  ['agenda', 'agenda'],
  ['historico', 'historico'],
  ['ajustes', 'ajustes/regras'],
  ['turmas', 'ajustes/turmas'],
  ['turmas-gaveta', 'ajustes/turmas', async (p) => { await p.getByText('Jiu-Jitsu Kids', { exact: true }).last().click() }],
  // o histórico depois de três mudanças feitas na mesma sessão (pagar a família, pagar uma cobrança, mudar um valor)
  ['historico-cheio', 'pessoas/responsaveis', async (p) => {
    await p.getByRole('link', { name: 'Vanessa Vieira' }).click(); await p.waitForTimeout(400)
    await p.getByRole('button', { name: /^Marcar as \d+ como pagas$/ }).click(); await p.waitForTimeout(600)
    await p.evaluate(() => { location.hash = '#/financeiro/lancamentos' }); await p.waitForTimeout(900)
    await celula(p, 0, 4).click(); await p.keyboard.press('Enter'); await p.keyboard.press('Control+a'); await p.keyboard.type('480'); await p.keyboard.press('Enter'); await p.waitForTimeout(600)
    await p.evaluate(() => { location.hash = '#/historico' }); await p.waitForTimeout(900)
  }],
  ['busca', 'painel', async (p) => { await p.keyboard.press('Control+k'); await p.keyboard.type('lima') }],
  ['cel-painel', 'painel', null, 'celular'],
  ['cel-lancamentos', 'financeiro/lancamentos', null, 'celular'],
  ['cel-folha', 'financeiro/lancamentos', async (p) => { await p.locator('.ad-lanc button.linha').first().click() }, 'celular'],
  ['cel-pessoas', 'pessoas/alunos', null, 'celular'],
]

const srv = await servirPasta(DIST, { spa: true })
const nav = await abrirNavegador()
let n = 0
for (const [nome, rota, preparar, larg] of TELAS) {
  if (SO && !SO.includes(nome)) continue
  const [w, h] = larg === 'celular' ? [390, 844] : [2040, 790]
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark', deviceScaleFactor: larg === 'celular' ? 2 : 1.5, serviceWorkers: 'block' })
  const p = await ctx.newPage()
  await p.goto(`${srv.base}/?hoje=2026-10-15&tema=escuro&movimento=reduzido#/${rota}`, { waitUntil: 'networkidle' })
  await p.locator('.ad-conteudo').waitFor()
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(700)
  if (preparar) { try { await preparar(p) } catch (e) { console.warn(`  ${nome}: o preparo falhou (${e.message.split('\n')[0]})`) } }
  await p.waitForTimeout(600)
  await trocarNomes(p)
  await p.screenshot({ path: join(SAIDA, `${nome}.jpg`), type: 'jpeg', quality: 90 })
  n++
  await ctx.close()
}
await nav.close(); srv.fechar()
console.log(`ok · ${n} capturas do Admin em ${SAIDA}`)
