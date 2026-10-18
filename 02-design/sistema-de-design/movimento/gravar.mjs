// Grava a demo de movimento e tira os quadros-chave em PNG.
// Uso: node "02-design/sistema-de-design/movimento/gravar.mjs"
// Saída: movimento/capturas/quadros/*.png e movimento/capturas/video/*.webm
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("A:/Claude/03-projetos/.ferramentas/node_modules/playwright");
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const URL_DEMO = pathToFileURL(path.join(AQUI, "demo.html")).href;
const QUADROS = path.join(AQUI, "capturas", "quadros");
const VIDEO = path.join(AQUI, "capturas", "video");
fs.mkdirSync(QUADROS, { recursive: true }); fs.mkdirSync(VIDEO, { recursive: true });

// O Chromium padrão do Playwright às vezes dá "acesso negado" nesta máquina: cai para o headless shell 1234.
const RESERVA = "C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe";
async function abrirNavegador() {
  try { return await chromium.launch(); }
  catch (e) { console.log("Chromium padrão falhou, usando o 1234:", e.message.split("\n")[0]); return chromium.launch({ executablePath: RESERVA }); }
}

const L = 4; // câmera lenta nos quadros
const espera = ms => new Promise(r => setTimeout(r, ms));

// marcos em ms reais desde o "repetir" (já com a câmera lenta, quando ela vale)
const ROTEIRO = [
  { id: "serie", sel: "#ef-serie", marcos: [0, 2480 + L * 60, 2480 + L * 160, 2480 + L * 400, 2480 + L * 900] },
  { id: "fechar", sel: "#ef-fechar", marcos: [L * 40, L * 200, L * 420, L * 600, L * 950] },
  { id: "anel", sel: "#ef-anel", marcos: [1000, 6200, 13600, 15400], tempoReal: true },
  { id: "fase", sel: "#ef-fase", marcos: [1000, 2080, 2250, 6300, 20400], tempoReal: true },
  { id: "nav", sel: "#ef-nav", marcos: [1600 + L * 60, 1600 + L * 160, 4400 + L * 80, 4400 + L * 160, 4400 + L * 400, 8800 + L * 120] },
  { id: "cartao", sel: "#ef-cartao", marcos: [L * 40, L * 300, 2400 + L * 50, 2400 + L * 120, 2400 + L * 400] },
  { id: "esq", sel: "#ef-esq", marcos: [600, 1200 + L * 150, 1200 + L * 700, 1200 + L * 1300, 16000 + L * 100, 16000 + L * 300] },
  { id: "plus", sel: "#ef-plus", marcos: [L * 100, L * 500, L * 750, L * 950, L * 1150, L * 1900] },
  { id: "puxar", sel: "#ef-puxar", marcos: [900, 1700, 2500, 5000, 6200, 7600] },
  { id: "titulo-ios", sel: "#ef-titulo", plataforma: "ios", marcos: [200, 1500, 2300, 4500, 7000, 11200] },
  { id: "titulo-android", sel: "#ef-titulo", plataforma: "android", marcos: [200, 1700, 2300, 3200, 4600, 7000, 11200] },
];
const REDUZIDO = ["serie", "fechar", "nav", "plus", "esq", "titulo-android", "anel"];

async function tirarQuadros(pagina, item, sufixo) {
  const alvo = pagina.locator(`${item.sel} .tela`);
  await alvo.scrollIntoViewIfNeeded();
  if (item.plataforma) await pagina.evaluate(p => window.demo.plataforma(p), item.plataforma);
  await espera(300);
  const id = item.id.startsWith("titulo") ? "titulo" : item.id;
  const t0 = Date.now();
  await pagina.evaluate(id => { window.demo.repetir(id); }, id); // sem esperar a promessa: o relógio começa no toque
  for (const [i, m] of item.marcos.entries()) {
    const falta = m - (Date.now() - t0);
    if (falta > 0) await espera(falta);
    const real = Date.now() - t0;
    const nome = `${item.id}${sufixo}-${String(i + 1).padStart(2, "0")}-${real}ms.png`;
    await alvo.screenshot({ path: path.join(QUADROS, nome), animations: "allow" });
  }
}

const navegador = await abrirNavegador();
for (const f of fs.readdirSync(QUADROS)) fs.unlinkSync(path.join(QUADROS, f));

// 1) quadros-chave, câmera lenta ×4, movimento normal e depois reduzido
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const pagina = await ctx.newPage();
  const erros = []; pagina.on("pageerror", e => erros.push(e.message)); pagina.on("console", m => m.type() === "error" && erros.push(m.text()));
  await pagina.goto(URL_DEMO); await espera(1500);
  await pagina.evaluate(() => { window.demo.reduzir(false); window.demo.lento(true); });
  for (const item of ROTEIRO) await tirarQuadros(pagina, item, "");
  await pagina.evaluate(() => window.demo.reduzir(true));
  for (const item of ROTEIRO.filter(r => REDUZIDO.includes(r.id))) await tirarQuadros(pagina, item, "-reduzido");
  // escuro: um quadro de cada efeito parado
  await pagina.evaluate(() => { window.demo.reduzir(false); window.demo.lento(false); window.demo.tema(true); });
  await pagina.setViewportSize({ width: 2040, height: 790 });
  await pagina.evaluate(() => window.scrollTo(0, 0)); await espera(400);
  await pagina.screenshot({ path: path.join(QUADROS, "pagina-escuro-2040x790.png") });
  await pagina.setViewportSize({ width: 390, height: 844 }); await espera(300);
  await pagina.screenshot({ path: path.join(QUADROS, "pagina-escuro-390x844.png") });
  const largura = await pagina.evaluate(() => document.documentElement.scrollWidth);
  console.log("rolagem horizontal em 390:", largura > 390 ? `SIM (${largura})` : "não");
  console.log("erros na página:", erros.length ? erros : "nenhum");
  await ctx.close();
}

// 2) vídeo em velocidade real: cada efeito rola para a vista e toca
for (const reduzir of [false, true]) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: VIDEO, size: { width: 1440, height: 900 } } });
  const pagina = await ctx.newPage();
  await pagina.goto(URL_DEMO); await espera(800);
  await pagina.evaluate(r => { window.demo.reduzir(r); window.demo.lento(false); window.demo.tema(false); }, reduzir);
  const DUR = { serie: 2400, fechar: 1800, anel: 16500, fase: 21000, nav: 3200, cartao: 1400, esq: 4800, plus: 2400, puxar: 3600, titulo: 3200 };
  for (const [id, dur] of Object.entries(DUR)) {
    await pagina.locator(`#ef-${id === "titulo" ? "titulo" : id} .tela`).scrollIntoViewIfNeeded();
    await espera(300);
    await pagina.evaluate(id => { window.demo.repetir(id); }, id); // sem esperar a promessa: o relógio começa no toque
    await espera(dur);
  }
  const video = pagina.video(); await ctx.close();
  const destino = path.join(VIDEO, reduzir ? "movimento-reduzido.webm" : "movimento.webm");
  if (fs.existsSync(destino)) fs.unlinkSync(destino);
  fs.renameSync(await video.path(), destino);
  console.log("vídeo:", destino);
}
await navegador.close();
console.log("quadros:", fs.readdirSync(QUADROS).length);
