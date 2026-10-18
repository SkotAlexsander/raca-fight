// Exporta as artes do app (logo/app/*.svg, geradas por gerar.py) para os PNG que o app.json pede,
// em app/recursos/. Renderiza no Chromium do Playwright com fundo transparente; o ícone do iOS sai
// sem canal alfa (a App Store recusa ícone com alfa) — o verificar-png.py confere tudo depois.
// Uso: node exportar-png.mjs        (depois: python -I verificar-png.py)
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const { chromium } = await import('file:///A:/Claude/03-projetos/.ferramentas/node_modules/playwright/index.mjs')
const RESERVA = 'C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'
const aqui = dirname(fileURLToPath(import.meta.url))
const artes = resolve(aqui, '..', 'app')
const destino = resolve(aqui, '..', '..', '..', '..', 'app', 'recursos')
mkdirSync(destino, { recursive: true })

// [arte, png, lado, transparente]
const LISTA = [
  ['icone.svg', 'icone.png', 1024, false],
  ['icone-adaptativo.svg', 'icone-adaptativo.png', 1024, true],
  ['icone-notificacao.svg', 'icone-notificacao.png', 96, true],
  ['abertura-simbolo-claro.svg', 'abertura-simbolo-claro.png', 1024, true],
  ['abertura-simbolo-escuro.svg', 'abertura-simbolo-escuro.png', 1024, true],
]

let nav
try { nav = await chromium.launch() } catch (e) { if (!existsSync(RESERVA)) throw e; nav = await chromium.launch({ executablePath: RESERVA }) }
for (const [arte, png, lado, transparente] of LISTA) {
  const p = await nav.newPage({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 })
  const svg = readFileSync(join(artes, arte), 'utf8')
  await p.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:${lado}px;height:${lado}px}</style></head><body>${svg}</body></html>`)
  await p.screenshot({ path: join(destino, png), omitBackground: transparente, clip: { x: 0, y: 0, width: lado, height: lado } })
  console.log(`${png}  ${lado}×${lado}${transparente ? '  fundo transparente' : ''}`)
  await p.close()
}
await nav.close()
