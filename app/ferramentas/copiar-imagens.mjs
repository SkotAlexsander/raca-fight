#!/usr/bin/env node
/**
 * Copia as fotos e ilustrações aprovadas de 02-design/imagens/ para
 * app/imagens/, e gera app/imagens/indice.ts com um `require` por imagem. O
 * React Native escolhe sozinho entre @1x e @2x.
 *
 * Luta (P12, agente AM2): entram as fotos da Raça Fight (`raca-fight/`, do
 * agente AL, a academia autorizou o uso; nenhuma com rosto de criança) e as
 * ilustrações dos estados vazios. SAÍRAM as fotos de musculação (treinos,
 * capas, telas do treino, o Plus e as fotos do mockup antigo).
 * Os retratos de professor (`professor-*`) NÃO entram: são professores reais
 * e o app usa nomes fictícios até a autorização (L34); a tela usa as iniciais.
 *
 * Os créditos vão junto: toda imagem do app tem origem registrada.
 *
 * Uso: node ferramentas/copiar-imagens.mjs   (de dentro de app/)
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const DESIGN = resolve(aqui, '../../02-design/imagens');
const DESTINO = resolve(aqui, '../imagens');

const PASTAS = ['estados-vazios', 'raca-fight'];
/** O que fica de fora mesmo estando na pasta (ver o comentário do topo). */
const FORA = /^(professor-|admin-fundo-faixa)/;
/** As pastas que existiam antes da luta e saem do app. */
const ANTIGAS = ['treinos', 'telas', 'plus', 'mockup', 'entrada'];

const indice = {};

function copiarPasta(origem, pasta) {
  const destino = join(DESTINO, pasta);
  mkdirSync(destino, { recursive: true });
  for (const arquivo of readdirSync(origem)) {
    if (!/\.webp$/.test(arquivo) || FORA.test(arquivo)) continue;
    copyFileSync(join(origem, arquivo), join(destino, arquivo));
    const base = arquivo.replace(/@\dx\.webp$/, '');
    indice[`${pasta}/${base}`] = `./${pasta}/${base}.webp`;
  }
}

for (const antiga of ANTIGAS) rmSync(join(DESTINO, antiga), { recursive: true, force: true });
for (const velho of ['CREDITOS-treinos.md', 'CREDITOS-telas.md', 'CREDITOS-entrada.md']) rmSync(join(DESTINO, velho), { force: true });
for (const pasta of PASTAS) copiarPasta(join(DESIGN, pasta), pasta);

if (existsSync(join(DESIGN, 'CREDITOS.md'))) copyFileSync(join(DESIGN, 'CREDITOS.md'), join(DESTINO, 'CREDITOS.md'));
if (existsSync(join(DESIGN, 'raca-fight', '00-INDICE.md'))) copyFileSync(join(DESIGN, 'raca-fight', '00-INDICE.md'), join(DESTINO, 'CREDITOS-raca-fight.md'));

const chaves = Object.keys(indice).sort();
const linhas = [
  '/* eslint-disable */',
  '/**',
  ' * GERADO por ferramentas/copiar-imagens.mjs. NÃO EDITE À MÃO.',
  ' * Fonte: 02-design/imagens/ (créditos em imagens/CREDITOS*.md).',
  ' */',
  "import type { ImageSourcePropType } from 'react-native';",
  '',
  'export const IMAGENS = {',
  ...chaves.map((k) => `  '${k}': require('${indice[k]}') as ImageSourcePropType,`),
  '} as const;',
  '',
  'export type NomeDaImagem = keyof typeof IMAGENS;',
  '',
];
writeFileSync(join(DESTINO, 'indice.ts'), linhas.join('\n'));
console.log(`${chaves.length} imagens copiadas para ${DESTINO}`);
