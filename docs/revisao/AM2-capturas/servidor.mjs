// Servidor estático do dist com volta ao index.html (rotas do Expo Router na web).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const raiz = process.argv[2];
const porta = Number(process.argv[3] ?? 8790);
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json', '.ico': 'image/x-icon', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let arquivo = join(raiz, caminho);
  try {
    const s = await stat(arquivo);
    if (s.isDirectory()) arquivo = join(arquivo, 'index.html');
  } catch {
    arquivo = join(raiz, 'index.html');
  }
  try {
    const dados = await readFile(arquivo);
    res.writeHead(200, { 'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream' });
    res.end(dados);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(porta, () => console.log('ouvindo', porta));
