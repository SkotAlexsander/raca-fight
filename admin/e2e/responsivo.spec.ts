/**
 * AO (16/10): as três larguras que o Alex usa, em todas as telas: o PC
 * ultrawide (2040 × 790), o notebook (1366 × 768) e o celular (390 × 844).
 * Nenhuma rola para o lado; no PC largo o painel cabe sem rolar; e nada de
 * número gigante (proporção planejada: o maior texto da tela fica em 56 px).
 */

import { expect, test } from '@playwright/test';

const ROTAS = ['painel', 'financeiro/lancamentos', 'financeiro/cobrancas', 'financeiro/despesas-fixas', 'financeiro/fechamento', 'financeiro/importar',
  'financeiro/exportar', 'pessoas/alunos', 'pessoas/funcionarios', 'pessoas/responsaveis', 'relatorios/modalidade', 'relatorios/ano', 'relatorios/mes',
  'relatorios/inadimplencia', 'funil', 'agenda', 'notas', 'historico', 'ajustes/regras', 'ajustes/turmas'];

const TELAS = [
  { nome: 'ultrawide', width: 2040, height: 790 },
  { nome: 'notebook', width: 1366, height: 768 },
  { nome: 'celular', width: 390, height: 844 },
];

for (const tela of TELAS) {
  test(`${tela.nome} ${tela.width}×${tela.height}: sem rolagem lateral e sem número gigante`, async ({ page }) => {
    await page.setViewportSize({ width: tela.width, height: tela.height });
    const problemas: string[] = [];
    for (const rota of ROTAS) {
      await page.goto(`/?hoje=2026-10-15#/${rota}`);
      await page.locator('.ad-conteudo').waitFor();
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        let maior = 0;
        for (const el of document.querySelectorAll<HTMLElement>('.ad-conteudo *')) {
          if (!el.offsetParent || !el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) continue;
          maior = Math.max(maior, parseFloat(getComputedStyle(el).fontSize));
        }
        const c = document.querySelector<HTMLElement>('.ad-conteudo')!;
        // o quadro tem overflow hidden: a rolagem lateral, se houver, aparece na área de conteúdo
        return { lateral: Math.max(doc.scrollWidth - innerWidth, c.scrollWidth - c.clientWidth), maior, sobraVertical: c.scrollHeight - c.clientHeight };
      });
      if (m.lateral > 1) problemas.push(`${rota}: rola ${m.lateral}px para o lado`);
      if (m.maior > 56) problemas.push(`${rota}: texto de ${m.maior}px`);
      if (tela.nome === 'ultrawide' && rota === 'painel' && m.sobraVertical > 1) problemas.push(`painel: rola ${m.sobraVertical}px no PC largo`);
    }
    expect(problemas).toEqual([]);
  });
}
