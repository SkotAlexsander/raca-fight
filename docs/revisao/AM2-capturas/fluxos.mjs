// Fluxos e2e da virada de luta (AM2) sobre o export web, em 390 de largura.
// Quinta-feira 15/10/2026, 20:05 em Gravataí (23:05 UTC): o Muay Thai das 20h está rolando.
import { createRequire } from 'node:module';
const require = createRequire('A:/Claude/03-projetos/.ferramentas/node_modules/');
const { chromium } = require('playwright');

const BASE = 'http://localhost:8790';
const SAIDA = process.argv[2];
const QUINTA = new Date('2026-10-15T23:05:00Z');
const CHROME = 'C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-win/headless_shell.exe';

const resultados = [];
const ok = (nome, cond, detalhe = '') => {
  resultados.push({ nome, ok: !!cond, detalhe });
  console.log(`${cond ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
};

let navegador;
try {
  navegador = await chromium.launch();
} catch {
  navegador = await chromium.launch({ executablePath: CHROME });
}

async function nova(largura = 390, altura = 844, esquema = 'dark') {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2, colorScheme: esquema, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });
  const page = await ctx.newPage();
  await page.clock.install({ time: QUINTA });
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  return { ctx, page, erros };
}

const foto = (page, nome) => page.screenshot({ path: `${SAIDA}/${nome}.png` });
const espera = (page, ms = 600) => page.waitForTimeout(ms);
const tid = (page, id) => page.locator(`[data-testid="${id}"]`).first();

async function entrarComo(page, nome) {
  await page.goto(`${BASE}/contas-de-exemplo`);
  await page.getByText(nome, { exact: true }).first().click();
  await espera(page, 1500);
}

async function semDinheiro(page, onde) {
  const texto = await page.locator('body').innerText();
  ok(`${onde}: nenhum valor em reais`, !/R\$\s?\d/.test(texto));
}

// --- A. Entrada e vitrine ----------------------------------------------------
{
  const { ctx, page, erros } = await nova();
  await page.goto(`${BASE}/boas-vindas`);
  await espera(page, 3000);
  await foto(page, 'a1-boas-vindas');
  ok('boas-vindas: "Quero conhecer · aula experimental grátis"', await tid(page, 'quero-conhecer').isVisible());
  await tid(page, 'quero-conhecer').click();
  await espera(page, 1500);
  await foto(page, 'a2-conheca');
  ok('vitrine: botão da experimental', await tid(page, 'agendar-experimental').isVisible());
  await tid(page, 'agendar-experimental').click();
  await espera(page, 900);
  await foto(page, 'a3-qual-modalidade');
  const opcoes = await page.locator('[data-testid^="experimental-"]').allInnerTexts();
  ok('vitrine: "Qual modalidade?" com as 5 modalidades e "Ainda não sei"', ['Muay Thai', 'Boxe', 'Jiu-Jitsu', 'Luta Livre', 'MMA', 'Ainda não sei'].every((m) => opcoes.some((o) => o.includes(m))), opcoes.join(' | '));
  const [popup] = await Promise.all([page.waitForEvent('popup', { timeout: 5000 }).catch(() => null), tid(page, 'experimental-Boxe').click()]);
  const link = popup ? popup.url() : '';
  ok('vitrine: WhatsApp (51) 98196-2077 com a modalidade na mensagem', /(wa\.me\/5551981962077\?|phone=5551981962077&)text=.*Boxe/.test(decodeURIComponent(link).replace(/\+/g, ' ')), decodeURIComponent(link).slice(0, 120));
  await page.goto(`${BASE}/conheca/horarios`);
  await espera(page, 1500);
  await foto(page, 'a4-conheca-horarios');
  ok('erros de página na entrada', erros.length === 0, erros.join(' / ').slice(0, 200));
  await ctx.close();
}

// --- B. Aluno: check-in e desfazer -------------------------------------------
{
  const { ctx, page, erros } = await nova();
  await entrarComo(page, 'Lucas Ferraz');
  await page.goto(`${BASE}/inicio`);
  await espera(page, 1500);
  await foto(page, 'b1-inicio');
  ok('Início: "Estou na aula" aberto (janela de 30 min antes)', await tid(page, 'estou-na-aula').isVisible());
  await tid(page, 'estou-na-aula').click();
  await espera(page, 1200);
  // pode abrir a folha "Hoje você treina…" (duas turmas): escolhe a primeira
  const folha = page.getByText(/Hoje você treina/);
  if (await folha.isVisible().catch(() => false)) {
    await page.getByRole('button').filter({ hasText: /Muay Thai/ }).first().click();
    await espera(page, 1000);
  }
  await foto(page, 'b2-checkin-feito');
  ok('Início: check-in feito, com "Desfazer"', await tid(page, 'desfazer-checkin').isVisible());
  await tid(page, 'desfazer-checkin').click();
  await espera(page, 1000);
  ok('Início: desfazer volta o "Estou na aula"', await tid(page, 'estou-na-aula').isVisible());
  await semDinheiro(page, 'Início do aluno');
  for (const [rota, nome] of [['/horarios', 'b3-horarios'], ['/treinos', 'b4-treinos'], ['/academia', 'b5-academia'], ['/perfil', 'b6-perfil']]) {
    await page.goto(`${BASE}${rota}`);
    await espera(page, 1300);
    await foto(page, nome);
  }
  const textoHorarios = await (async () => {
    await page.goto(`${BASE}/horarios`);
    await espera(page, 1300);
    return page.locator('body').innerText();
  })();
  ok('Horários: a grade de luta (sem musculação)', /Muay Thai/.test(textoHorarios) && !/supino|séries|carga/i.test(textoHorarios));

  // offline: o check-in entra na fila
  await page.goto(`${BASE}/inicio`);
  await espera(page, 1300);
  await ctx.setOffline(true);
  await tid(page, 'estou-na-aula').click();
  await espera(page, 1200);
  if (await page.getByText(/Hoje você treina/).isVisible().catch(() => false)) {
    await page.getByRole('button').filter({ hasText: /Muay Thai/ }).first().click();
    await espera(page, 1000);
  }
  await foto(page, 'b7-checkin-sem-sinal');
  ok('Sem sinal: o check-in fica no aparelho (Desfazer visível)', await tid(page, 'desfazer-checkin').isVisible());
  const fila = await page.evaluate(() => Object.keys(localStorage).map((k) => localStorage.getItem(k) ?? '').join(' ').includes('checkin:'));
  ok('Sem sinal: item "checkin" na fila', fila);
  await ctx.setOffline(false);

  await page.goto(`${BASE}/cronometro`);
  await espera(page, 1300);
  await foto(page, 'b8-cronometro');
  const textoCron = await page.locator('body').innerText();
  ok('Cronômetro: rounds (3 × 3 min, 1 min de intervalo)', /Muay Thai|Boxe/.test(textoCron) && /3:00|3 min/.test(textoCron), textoCron.replace(/\s+/g, ' ').slice(0, 160));
  ok('erros de página no aluno', erros.length === 0, erros.join(' / ').slice(0, 200));
  await ctx.close();
}

// --- C. Professor: Hoje → chamada → fechar -----------------------------------
{
  const { ctx, page, erros } = await nova();
  await entrarComo(page, 'Diego Moura');
  await page.goto(`${BASE}/hoje`);
  await espera(page, 1800);
  await foto(page, 'c1-hoje-professor');
  const n = Number(await tid(page, 'hoje-checkins').innerText());
  const textoHoje = await page.locator('body').innerText();
  ok('Hoje (quinta): sem o Muay Thai das 21h', !/21:00/.test(textoHoje) || !/noite 2/.test(textoHoje));
  await semDinheiro(page, 'Hoje do professor');
  await tid(page, 'abrir-chamada').click();
  await espera(page, 1500);
  await foto(page, 'c2-chamada');
  const contagem = await tid(page, 'grupo-checkins-contagem').innerText();
  ok('Chamada: o mesmo número de check-ins do Hoje', contagem.endsWith(` de ${n} confirmados`), `Hoje ${n} · Chamada "${contagem}"`);
  ok('Chamada: "Fechar a chamada" visível sem rolar', await tid(page, 'fechar-chamada').isVisible());
  const caixa = await tid(page, 'fechar-chamada').boundingBox();
  ok('Chamada: botão dentro da tela (844)', caixa && caixa.y + caixa.height <= 844, JSON.stringify(caixa));
  await tid(page, 'fechar-chamada').click();
  await espera(page, 800);
  await foto(page, 'c3-fechar-folha');
  await tid(page, 'confirmar-fechar-chamada').click();
  await espera(page, 1500);
  await foto(page, 'c4-chamada-fechada');
  for (const [rota, nome] of [['/turmas', 'c5-turmas'], ['/alunos', 'c6-alunos'], ['/graduacao', 'c7-graduacao'], ['/perfil-da-equipe', 'c8-perfil']]) {
    await page.goto(`${BASE}${rota}`);
    await espera(page, 1500);
    await foto(page, nome);
    await semDinheiro(page, `professor ${rota}`);
  }
  await page.goto(`${BASE}/experimentais`);
  await espera(page, 1200);
  ok('Professor não abre Experimentais (volta ao Hoje)', !page.url().includes('/experimentais'), page.url());
  ok('erros de página no professor', erros.length === 0, erros.join(' / ').slice(0, 200));
  await ctx.close();
}

// --- D. Recepção: nova experimental ------------------------------------------
{
  const { ctx, page, erros } = await nova();
  await entrarComo(page, 'Simone Alves');
  await page.goto(`${BASE}/hoje`);
  await espera(page, 1500);
  await foto(page, 'd1-hoje-recepcao');
  await page.goto(`${BASE}/experimentais`);
  await espera(page, 1500);
  await foto(page, 'd2-experimentais');
  await tid(page, 'nova-experimental').click();
  await espera(page, 1000);
  await page.getByLabel('Nome', { exact: true }).fill('Teodoro Prates');
  await page.getByLabel('WhatsApp com DDD').fill('51 90000-0001');
  await page.getByRole('button', { name: 'Muay Thai', exact: true }).first().click();
  await espera(page, 500);
  ok('Nova experimental: avisa que o WhatsApp já fez experimental (não bloqueia)', await tid(page, 'aviso-ja-fez').isVisible());
  await page.getByRole('button', { name: /^(Hoje|Sex|Sáb|Seg|Ter|Qua|Qui) \d\d:\d\d$/ }).first().click();
  await espera(page, 400);
  await foto(page, 'd3-nova-experimental');
  await tid(page, 'salvar-experimental').click();
  await espera(page, 1500);
  const texto = await page.locator('body').innerText();
  ok('Nova experimental: marcada e na lista', /Teodoro/.test(texto), page.url());
  await foto(page, 'd4-experimental-marcada');
  await page.goto(`${BASE}/alunos`);
  await espera(page, 1500);
  await foto(page, 'd5-alunos-recepcao');
  ok('Recepção: vínculo pendente com "Confirmar todos"', await tid(page, 'confirmar-todos').isVisible());
  ok('erros de página na recepção', erros.length === 0, erros.join(' / ').slice(0, 200));
  await ctx.close();
}

// --- E. Dono: Abra o app Admin -----------------------------------------------
{
  const { ctx, page, erros } = await nova();
  await entrarComo(page, 'Sérgio Vargas');
  await page.goto(`${BASE}/hoje`);
  await espera(page, 1500);
  await foto(page, 'e1-dono');
  ok('Dono: "Abra o app Admin"', await tid(page, 'abra-o-admin').isVisible());
  ok('erros de página no dono', erros.length === 0, erros.join(' / ').slice(0, 200));
  await ctx.close();
}

// --- F. Claro e tela larga ---------------------------------------------------
{
  const { ctx, page } = await nova(390, 844, 'light');
  await entrarComo(page, 'Lucas Ferraz');
  await page.goto(`${BASE}/inicio`);
  await espera(page, 1500);
  await foto(page, 'f1-inicio-claro');
  await ctx.close();
  const larga = await nova(2040, 790);
  await entrarComo(larga.page, 'Diego Moura');
  await larga.page.goto(`${BASE}/hoje`);
  await espera(larga.page, 1500);
  await foto(larga.page, 'f2-hoje-ultrawide');
  const rola = await larga.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok('Tela larga: sem rolagem lateral', !rola);
  await larga.ctx.close();
}

await navegador.close();
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} verificações passaram.`);
process.exit(falhas.length ? 1 : 0);
