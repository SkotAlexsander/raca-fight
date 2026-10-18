// Abre o Chromium do Playwright das ferramentas desta máquina.
// Em 26/09/2026 o binário padrão (headless_shell-1243) dava "Acesso negado" ao ser executado;
// o 1234, do mesmo cache, roda. Tenta o padrão e cai para o 1234.
import { existsSync } from 'node:fs'

const { chromium } = await import('file:///A:/Claude/03-projetos/.ferramentas/node_modules/playwright/index.mjs')
  .catch(() => import('playwright'))

const RESERVA = 'C:/Users/alexs/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'

export async function abrirNavegador() {
  try { return await chromium.launch() } catch (e) {
    if (!existsSync(RESERVA)) throw e
    console.log('  (Chromium padrão não abriu; usando o headless shell 1234)')
    return chromium.launch({ executablePath: RESERVA })
  }
}

// Serve uma pasta por HTTP (módulos ES não carregam por file://). Devolve { base, fechar }.
// Com { spa: true }, o caminho que não é arquivo devolve o index.html (as rotas do app exportado do Expo).
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join as juntar, normalize } from 'node:path'
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon' }
export function servirPasta(pasta, { spa = false } = {}) {
  return new Promise((resolver) => {
    const srv = createServer(async (req, res) => {
      const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
      try {
        const corpo = await readFile(juntar(pasta, caminho))
        res.writeHead(200, { 'content-type': TIPOS[extname(caminho)] || 'application/octet-stream' }); res.end(corpo)
      } catch {
        if (!spa) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TIPOS['.html'] }); res.end(await readFile(juntar(pasta, 'index.html')))
      }
    })
    srv.listen(0, '127.0.0.1', () => resolver({ base: `http://127.0.0.1:${srv.address().port}`, fechar: () => srv.close() }))
  })
}
