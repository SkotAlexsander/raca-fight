// Contraste contra o PIOR pixel: grava as caixas do texto e dos ícones, apaga texto e ícones, fotografa o fundo.
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire('A:/Claude/03-projetos/.ferramentas/package.json');
const { chromium } = require('A:/Claude/03-projetos/.ferramentas/node_modules/playwright');
const [,, saida] = process.argv;
const base = 'file:///A:/Claude/03-projetos/Academia%20Plus/02-design/sistema-de-design/mockups/entrada.html?moldura=real&aparelho=iphone-16';
const b = await chromium.launch();
const combos = [];
for (const tema of ['claro', 'escuro']) for (const foto of ['principal', 'alternativa']) combos.push({ tema, foto, tr: 'normal' });
for (const tema of ['claro', 'escuro']) combos.push({ tema, foto: 'principal', tr: 'reduzida' });
for (const c of combos) {
  const p = await b.newPage({ viewport: { width: 2400, height: 1100 } });
  await p.goto(`${base}&tema=${c.tema}&foto=${c.foto}&transparencia=${c.tr}`); await p.waitForTimeout(2600);
  const itens = await p.evaluate(() => {
    const out = []; const telas = [...document.querySelectorAll('.celular__tela')];
    telas.forEach((t, ti) => {
      const nome = t.closest('figure')?.querySelector('.o-quadro__nome')?.textContent || 'tela ' + ti;
      const w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) {
        if (!n.textContent.trim()) continue; const el = n.parentElement;
        if (el.closest('.celular__status') || el.closest('[aria-hidden="true"]:not(svg)') && el.closest('.o-abertura')) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        const r = document.createRange(); r.selectNodeContents(n);
        const rects = [...r.getClientRects()].filter(x => x.width > 1 && x.height > 1).map(x => [x.left + scrollX, x.top + scrollY, x.right + scrollX, x.bottom + scrollY]);
        const tam = parseFloat(cs.fontSize), peso = +cs.fontWeight;
        out.push({ tela: nome, texto: n.textContent.trim().slice(0, 40), cor: cs.color, grande: tam >= 24 || (tam >= 18.66 && peso >= 700), rects, tipo: 'texto' });
      }
      t.querySelectorAll('svg.icone, svg.o-simbolo, svg.o-abertura__simbolo, svg.o-maca').forEach(s => {
        if (s.closest('.celular__status')) return; const x = s.getBoundingClientRect(); if (x.width < 2) return;
        const cs = getComputedStyle(s); const cor = s.classList.contains('icone') ? cs.color : cs.fill;
        out.push({ tela: nome, texto: '[ícone ' + (s.querySelector('use')?.getAttribute('href') || '') + ']', cor, grande: true, rects: [[x.left + scrollX, x.top + scrollY, x.right + scrollX, x.bottom + scrollY]], tipo: 'icone' });
      });
    });
    return out;
  });
  await p.addStyleTag({ content: '.celular__tela *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-decoration-color:transparent!important;caret-color:transparent!important} .celular__tela svg.icone,.celular__tela svg.o-simbolo,.celular__tela svg.o-abertura__simbolo,.celular__tela svg.o-marca-social, .o-viajante{visibility:hidden!important}' });
  await p.waitForTimeout(300);
  const nome = `${c.tema}-${c.foto}-${c.tr}`;
  await p.screenshot({ path: `${saida}/fundo-${nome}.png`, fullPage: true });
  fs.writeFileSync(`${saida}/itens-${nome}.json`, JSON.stringify(itens));
  await p.close(); console.log(nome, itens.length);
}
await b.close();
