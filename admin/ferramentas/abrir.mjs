// npm run abrir: gera a versão de produção (se ainda não existe), sobe a prévia
// local em http://localhost:4174 e abre no navegador. Daí o Chrome/Edge oferece
// "Instalar o app" (ícone na barra de endereço). Nada é publicado na internet.
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const opcoes = { cwd: raiz, stdio: 'inherit', shell: process.platform === 'win32' };

if (!existsSync(resolve(raiz, 'dist/index.html')) || process.argv.includes('--refazer')) {
  const r = spawnSync(npm, ['run', 'build'], opcoes);
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const previa = spawn(npm, ['run', 'previa'], opcoes);
const endereco = 'http://localhost:4174/#/painel';
setTimeout(() => {
  const abrir = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', endereco]] : process.platform === 'darwin' ? ['open', [endereco]] : ['xdg-open', [endereco]];
  spawn(abrir[0], abrir[1], { stdio: 'ignore', detached: true }).unref();
  console.log(`\nAdmin aberto em ${endereco} — feche esta janela (Ctrl+C) para parar.\n`);
}, 2500);
previa.on('exit', (c) => process.exit(c ?? 0));
