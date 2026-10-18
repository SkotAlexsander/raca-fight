#!/usr/bin/env node
/**
 * Converte os sprites de 02-design/icones/ em dados para o react-native-svg:
 * `componentes/icones/gerado.ts`. Lê o sprite geral (`sprite.svg`, sem os
 * desenhos de musculação desde o P12) e o de luta (`luta/sprite-luta.svg`, do
 * agente AL); com o mesmo nome, vale o de luta (o `inicio` virou a casa).
 *
 * O sprite é gerado por 02-design/icones/fonte/gerar.py (o agente W está
 * trocando o "+" da marca nesta mesma onda). Quando o sprite mudar, rode de
 * novo `npm run gerar:icones`: o app nunca guarda um desenho copiado à mão.
 *
 * Cada <symbol> vira { viewBox, raiz, filhos }, onde cada filho é um
 * caminho, um círculo ou um grupo com os atributos de traço que o SVG usa
 * (stroke-width, opacity, fill, fill-rule). `currentColor` fica como está: o
 * componente Icone troca pela cor pedida. Na ilustração de exercício, o
 * grupo `musculo` recebe a cor de destaque do tema.
 *
 * Uso: node ferramentas/gerar-icones.mjs   (de dentro de app/)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const ORIGENS = [resolve(aqui, '../../02-design/icones/sprite.svg'), resolve(aqui, '../../02-design/icones/luta/sprite-luta.svg')];
const DESTINO = resolve(aqui, '../componentes/icones/gerado.ts');

const svg = ORIGENS.map((o) => readFileSync(o, 'utf8')).join(String.fromCharCode(10));

const ATRIBUTOS = {
  d: 'd', cx: 'cx', cy: 'cy', r: 'r',
  fill: 'fill', stroke: 'stroke', opacity: 'opacity',
  'stroke-width': 'strokeWidth', 'fill-rule': 'fillRule',
  'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  class: 'classe',
};

function lerAtributos(texto) {
  const saida = {};
  for (const m of texto.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) {
    const [, nome, valor] = m;
    if (nome === 'style') {
      // único uso: style="stroke:var(--ilustracao-destaque, #007761)" no grupo do músculo
      if (/ilustracao-destaque/.test(valor)) saida.destaque = true;
      continue;
    }
    if (!(nome in ATRIBUTOS)) continue;
    const chave = ATRIBUTOS[nome];
    saida[chave] = ['cx', 'cy', 'r', 'strokeWidth', 'opacity'].includes(chave) ? Number(valor) : valor;
  }
  return saida;
}

/** Lê o conteúdo de um <symbol>: path, circle e g (um nível de grupo, como o gerar.py produz). */
function lerFilhos(texto) {
  const filhos = [];
  const re = /<(path|circle)\b([^>]*?)\/>|<g\b([^>]*)>([\s\S]*?)<\/g>/g;
  for (const m of texto.matchAll(re)) {
    if (m[1]) filhos.push({ tipo: m[1] === 'path' ? 'caminho' : 'circulo', ...lerAtributos(m[2]) });
    else filhos.push({ tipo: 'grupo', ...lerAtributos(m[3]), filhos: lerFilhos(m[4]) });
  }
  return filhos;
}

const simbolos = {};
for (const m of svg.matchAll(/<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/g)) {
  const atributos = m[1];
  const id = /id="([^"]+)"/.exec(atributos)[1];
  const viewBox = /viewBox="([^"]+)"/.exec(atributos)[1];
  const raiz = lerAtributos(atributos.replace(/id="[^"]*"|viewBox="[^"]*"/g, ''));
  simbolos[id] = { viewBox, raiz, filhos: lerFilhos(m[2]) };
}

const icones = Object.keys(simbolos).filter((k) => k.startsWith('i-')).map((k) => k.slice(2));
const ilustracoes = Object.keys(simbolos).filter((k) => k.startsWith('ex-')).map((k) => k.slice(3));
if (icones.length === 0) throw new Error('nenhum ícone i-* no sprite');

const dados = {};
for (const nome of icones) dados[nome] = simbolos[`i-${nome}`];
const dadosIlustracao = {};
for (const nome of ilustracoes) dadosIlustracao[nome] = simbolos[`ex-${nome}`];

const texto = [
  '/* eslint-disable */',
  '/**',
  ' * GERADO por ferramentas/gerar-icones.mjs a partir de 02-design/icones/sprite.svg e luta/sprite-luta.svg.',
  ' * NÃO EDITE À MÃO: mude o gerar.py do design, rode o sprite e depois `npm run gerar:icones`.',
  ' */',
  '',
  "import type { SimboloSvg } from './tipos';",
  '',
  `export const NOMES_DOS_ICONES = ${JSON.stringify(icones)} as const;`,
  'export type NomeDoIcone = (typeof NOMES_DOS_ICONES)[number];',
  '',
  `export const NOMES_DAS_ILUSTRACOES = ${JSON.stringify(ilustracoes)} as const;`,
  'export type NomeDaIlustracao = (typeof NOMES_DAS_ILUSTRACOES)[number];',
  '',
  `export const ICONES: Readonly<Record<NomeDoIcone, SimboloSvg>> = ${JSON.stringify(dados)};`,
  '',
  `export const ILUSTRACOES: Readonly<Record<NomeDaIlustracao, SimboloSvg>> = ${JSON.stringify(dadosIlustracao)};`,
  '',
].join('\n');

mkdirSync(dirname(DESTINO), { recursive: true });
writeFileSync(DESTINO, texto);
console.log(`ícones gerados: ${icones.length} ícones e ${ilustracoes.length} ilustrações → ${DESTINO}`);
