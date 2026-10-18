/**
 * Ponta a ponta, no navegador, em 2040 × 790 (o monitor do Alex), no modo
 * local: lançar uma linha pelo teclado, colar várias linhas do Excel, marcar
 * uma mensalidade como paga, fechar o mês e exportar o CSV para o Excel.
 */

import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const ENTRAR = '/?hoje=2026-10-15#/financeiro/lancamentos';

async function colar(page: Page, texto: string) {
  await page.getByRole('grid').evaluate((el, t) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', t);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, texto);
}

test('lançar, colar, marcar como paga, fechar o mês e exportar', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.goto(ENTRAR);
  const grade = page.getByRole('grid');
  await expect(grade).toBeVisible({ timeout: 30_000 });

  // 1. lançar pelo teclado: Ctrl+Enter, descrição, Tab, anda até o valor, Enter, valor, Enter
  await grade.locator('td[tabindex="0"]').focus();
  await page.keyboard.press('Control+Enter');
  await page.keyboard.type('Aula particular — Rafaela Nunes');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.type('150');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Linha nova "Aula particular — Rafaela Nunes"')).toBeVisible();
  await expect(grade.getByText('Aula particular — Rafaela Nunes')).toBeVisible();
  await expect(page.getByText(/Salvo às \d\d:\d\d/)).toBeVisible();

  // 2. colar 3 linhas do Excel (uma com a data que não existe): prévia, depois gravar as 2
  await grade.locator('td[tabindex="0"]').focus();
  await page.keyboard.press('Home');
  await colar(page, '06/10\tLuvas 12 oz × 2 pares\tVenda de produtos\tEntrada\t380,00\tCartão de débito\n31/09\tFaixa preta\tVenda de produtos\tEntrada\t90,00\tPix\n08/10\tBandagens\tProdutos para revenda\tSaída\t412,40\tPix');
  await expect(page.getByText('Você colou 3 linhas do Excel: 2 prontas e 1 com erro.')).toBeVisible();
  await expect(grade.getByText(/31\/09 · Data inválida/)).toBeVisible();
  await page.getByRole('button', { name: 'Gravar as 2 linhas' }).click();
  await expect(page.getByText('Colar 2 linhas do Excel')).toBeVisible();
  await expect(grade.getByText('Luvas 12 oz × 2 pares')).toBeVisible();

  // 3. marcar uma mensalidade como paga: nasce a linha de entrada
  await grade.getByRole('button', { name: 'Marcar como paga' }).first().click();
  const gaveta = page.getByRole('dialog', { name: 'Marcar como paga' });
  await expect(gaveta).toBeVisible();
  await gaveta.getByRole('button', { name: 'Confirmar pagamento' }).click();
  await expect(page.getByText(/^Paga: .*Nasceu a linha de entrada na planilha\./)).toBeVisible();

  // 4. fechar outubro (o mês não terminou: a gaveta avisa, e o dono decide)
  await page.goto('/?hoje=2026-10-15#/financeiro/fechamento');
  await page.getByRole('button', { name: 'Fechar outubro' }).click();
  const fechar = page.getByRole('dialog', { name: 'Fechar outubro' });
  await expect(fechar.getByText('O mês ainda não terminou.')).toBeVisible();
  await fechar.getByRole('button', { name: 'Fechar o mês' }).click();
  await expect(page.getByText('Outubro fechado. As linhas ficaram travadas.')).toBeVisible();
  await page.goto(ENTRAR);
  await expect(page.getByText(/Outubro está fechado desde 15\/10\/2026/)).toBeVisible();
  await expect(page.getByRole('grid')).toHaveAttribute('aria-readonly', 'true');
  await page.getByRole('grid').locator('td[tabindex="0"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Outubro está fechado: nada foi mudado.')).toBeVisible();

  // 5. exportar: UTF-8 com BOM, ";", vírgula decimal, e o que foi lançado está lá
  await page.goto('/?hoje=2026-10-15#/financeiro/exportar');
  const [baixado] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar o CSV de outubro' }).click()]);
  expect(baixado.suggestedFilename()).toBe('lancamentos-outubro-2026.csv');
  const bytes = readFileSync((await baixado.path())!);
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const csv = bytes.toString('utf8');
  expect(csv.split('\r\n')[0]).toBe('\uFEFFData;Descrição;Categoria;Tipo;Valor;Valor (±);Forma de pagamento;Pessoa;Situação;Modalidade;Observação');
  expect(csv).toContain('15/10/2026;Aula particular — Rafaela Nunes;;Entrada;150,00;150,00');
  expect(csv).toContain('06/10/2026;Luvas 12 oz × 2 pares;Venda de produtos;Entrada;380,00;380,00;Cartão de débito');
  expect(csv).not.toContain('2026-10;');
  expect(erros).toEqual([]);
});

test('importar a planilha XLSX: conferir colunas, criar a categoria, gravar e desfazer', async ({ page }) => {
  await page.goto('/?hoje=2026-10-15#/financeiro/importar');
  await page.locator('input[type="file"]').setInputFiles('e2e/planilha-de-exemplo.xlsx');
  await expect(page.getByText('planilha-de-exemplo.xlsx', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Papel da coluna Histórico')).toHaveValue('descricao');
  await expect(page.getByLabel('Papel da coluna Entrada')).toHaveValue('entrada');
  await expect(page.getByText('"Gasolina viagem" (saída, 1 linha)')).toBeVisible();
  await page.getByRole('link', { name: /Com erro/ }).click();
  await expect(page.getByText(/Data inválida: "31\/09\/2026"/).first()).toBeVisible();
  await page.getByRole('button', { name: /Gravar 4 linhas/ }).click();
  await expect(page.getByText('4 linhas gravadas de planilha-de-exemplo.xlsx')).toBeVisible();
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(page.getByText(/Importação desfeita/)).toBeVisible();
});
