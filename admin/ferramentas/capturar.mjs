// Capturas do Admin construído (agente AM1), com os MESMOS nomes das capturas do AK
// (02-design/sistema-de-design/mockups/admin-capturas/), para comparar lado a lado:
//   <tela>-pc.png (2040 × 790, escuro) · <tela>-pc-claro.png · <tela>-celular.png (390 × 844) · <tela>-celular-claro.png
// Precisa do Admin rodando: npm run dev (porta 5174) ou --url=http://localhost:4174 (npm run previa).
// Uso: node ferramentas/capturar.mjs [--so=painel,financeiro] [--url=…]
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirNavegador } from './navegador.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const arg = (n) => process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const SO = arg('so')?.split(',');
const URL_BASE = arg('url') ?? 'http://localhost:5174';
const SAIDA = resolve(aqui, '../capturas');
mkdirSync(SAIDA, { recursive: true });

const colar = (texto) => async (p) => {
  const g = p.getByRole('grid');
  await g.locator('td[tabindex="0"]').focus();
  await p.keyboard.press('Home');
  await g.evaluate((el, t) => { const dt = new DataTransfer(); dt.setData('text/plain', t); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); }, texto);
};
const COLADAS = ['01/10\tMensal — Pedro Henrique Sá\tMensalidades\tEntrada\t220,00\tPix', '01/10\tMensal — Aline Castro\tMensalidades\tEntrada\t120,00\tPix', '02/10\tMensal — Sofia Brandão\tMensalidades\tEntrada\t110,00\tDinheiro', '31/09\tMensal — Tatiane Moura\tMensalidades\tEntrada\t405,00\tPix', '03/10\tLuvas 14 oz\tVenda de produtos\tEntrada\t12,345\tPix', '03/10\tFaixa preta (bordada)\tVenda de produtos\tEntrada\t90,00\tPix', '04/10\tÁgua\tÁgua\tSaída\t187,50\tBoleto', '04/10\tProdutos de limpeza\tLimpeza e manutenção\tSaída\t126,90\tCartão de débito'].join('\n');

// [nome, rota, preparar?, so?]
const TELAS = [
  ['painel', 'painel'],
  ['financeiro', 'financeiro/lancamentos', async (p) => {
    const g = p.getByRole('grid');
    await g.locator('td[data-c="0"]').nth(0).click();
    await p.keyboard.press('Shift+Space'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Shift+Space');
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  }],
  ['financeiro-colar', 'financeiro/lancamentos', colar(COLADAS), 'pc'],
  ['financeiro-fechado', 'financeiro/lancamentos', async (p) => { await p.getByRole('button', { name: 'Mês anterior' }).click(); await p.getByRole('grid').locator('td[tabindex="0"]').focus(); await p.keyboard.press('Enter'); }, 'pc'],
  ['financeiro-folha', 'financeiro/lancamentos', async (p) => { await p.locator('.ad-lanc button.linha').first().click(); }, 'celular'],
  ['cobrancas', 'financeiro/cobrancas', async (p) => { await p.getByRole('button', { name: 'Marcar como paga' }).first().click(); }],
  ['despesas-fixas', 'financeiro/despesas-fixas'],
  ['fechamento', 'financeiro/fechamento'],
  ['importar', 'financeiro/importar', async (p) => { await p.locator('input[type="file"]').setInputFiles(resolve(aqui, '../e2e/planilha-de-exemplo.xlsx')); }],
  ['exportar', 'financeiro/exportar'],
  ['pessoas', 'pessoas/alunos'],
  ['filtro', 'pessoas/filtro'],
  ['ficha-aluno', 'pessoas/alunos', async (p) => { await p.locator('.ad-tabela tbody tr a.forte, .ad-lanc button.linha').filter({ visible: true }).first().click(); }],
  ['ficha-kids', 'pessoas/responsaveis', async (p) => { await p.getByRole('link', { name: 'Fernanda Lima' }).click(); }],
  ['ficha-funcionario', 'pessoas/funcionarios'],
  ['relatorios', 'relatorios/modalidade'],
  ['relatorio-ano', 'relatorios/ano'],
  ['inadimplencia', 'relatorios/inadimplencia'],
  ['funil', 'funil'],
  ['agenda', 'agenda'],
  ['notas', 'notas'],
  ['historico', 'historico'],
  ['ajustes', 'ajustes/regras'],
  ['turmas', 'ajustes/turmas'],
  ['busca', 'painel', async (p) => { await p.keyboard.press('Control+k'); await p.keyboard.type('lima'); }],
  ['estados', 'financeiro/lancamentos', async (p) => { await p.context().setOffline(true); }, 'pc'],
];

const navegador = await abrirNavegador();
const feitos = [];
for (const [sufixo, w, h] of [['pc', 2040, 790], ['celular', 390, 844]]) {
  for (const tema of ['escuro', 'claro']) {
    for (const [nome, rota, preparar, so] of TELAS) {
      if (SO && !SO.includes(nome)) continue;
      if (so && so !== sufixo) continue;
      if (tema === 'claro' && ['financeiro-folha', 'estados'].includes(nome)) continue;
      const ctx = await navegador.newContext({ viewport: { width: w, height: h }, colorScheme: tema === 'escuro' ? 'dark' : 'light', deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.goto(`${URL_BASE}/?hoje=2026-10-15&tema=${tema}&movimento=reduzido#/${rota}`, { waitUntil: 'networkidle' });
      await p.locator('.ad-conteudo').waitFor();
      await p.waitForTimeout(700);
      try { if (preparar && !(sufixo === 'celular' && ['financeiro', 'estados'].includes(nome))) await preparar(p); } catch (e) { console.warn(`${nome}: preparo falhou (${e.message.split('\n')[0]})`); }
      await p.waitForTimeout(500);
      const arquivo = `${nome}-${sufixo}${tema === 'claro' ? '-claro' : ''}.png`;
      await p.screenshot({ path: join(SAIDA, arquivo) });
      feitos.push(arquivo);
      await ctx.close();
    }
  }
}
await navegador.close();
console.log(`${feitos.length} capturas em capturas/`);
