// Capturas das telas do admin (agente AK, P12, 15/10/2026).
// Cada <section class="ad-quadro" data-captura="nome"> vira um PNG do tamanho da janela:
//   nome-pc.png (2040 × 790, escuro)      nome-pc-claro.png (2040 × 790, claro)
//   nome-celular.png (390 × 844, escuro)  nome-celular-claro.png (390 × 844, claro)
// Quadro com data-so="pc" não tem versão de celular, e data-so="celular" não tem de PC.
// Quando o quadro tem data-tela (o id da tela no PDF do AR) diferente do nome, sai também <id>-pc.png e <id>-celular.png.
// Uso: node "02-design/sistema-de-design/mockups/admin-capturas/capturar.mjs" [--so=painel,financeiro] [--saida=pasta]
import { mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const { chromium } = await import('file:///A:/Claude/03-projetos/.ferramentas/node_modules/playwright/index.mjs')
const RESERVA = 'C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'
const aqui = dirname(fileURLToPath(import.meta.url))
const arg = (n) => process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))?.split('=')[1]
const SO = arg('so')?.split(',')
const SAIDA = arg('saida') ? resolve(arg('saida')) : aqui
mkdirSync(SAIDA, { recursive: true })
const pagina = pathToFileURL(resolve(aqui, '..', 'admin.html')).href

let navegador
try { navegador = await chromium.launch() } catch (e) { if (!existsSync(RESERVA)) throw e; navegador = await chromium.launch({ executablePath: RESERVA }) }
const feitos = []
for (const [sufixo, w, h] of [['pc', 2040, 790], ['celular', 390, 844]]) {
  for (const tema of ['escuro', 'claro']) {
    const ctx = await navegador.newContext({ viewport: { width: w, height: h }, colorScheme: tema === 'escuro' ? 'dark' : 'light', deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await page.goto(pagina + '?tema=' + tema, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(400)
    await page.evaluate(() => document.getAnimations().forEach((a) => { if (a.effect?.getComputedTiming().endTime !== Infinity) try { a.finish() } catch {} }))
    const nomes = await page.$$eval('.ad-quadro[data-captura]', (qs) => qs.filter((q) => getComputedStyle(q).display !== 'none').map((q) => [q.dataset.captura, q.dataset.tela || '']))
    for (const [n, tela] of nomes) {
      if (SO && !SO.includes(n)) continue
      const arquivo = `${n}-${sufixo}${tema === 'claro' ? '-claro' : ''}.png`
      await page.locator(`.ad-quadro[data-captura="${n}"]`).screenshot({ path: join(SAIDA, arquivo), animations: 'disabled' })
      feitos.push(arquivo)
      // o PDF do AR (docs/apresentacao/admin/capturar.mjs) acha a tela pela palavra do id dele no nome do arquivo:
      // quando o id (data-tela) é outro, grava também <id>-<pc|celular>.png (só no escuro, que é o principal)
      if (tela && tela !== n && tema === 'escuro') {
        const copia = `${tela}-${sufixo}.png`
        copyFileSync(join(SAIDA, arquivo), join(SAIDA, copia))
        feitos.push(copia + ' (= ' + arquivo + ')')
      }
    }
    await ctx.close()
  }
}
await navegador.close()
console.log(feitos.length + ' capturas em ' + SAIDA + '\n' + feitos.join('\n'))
