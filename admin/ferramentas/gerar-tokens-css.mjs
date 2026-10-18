// Gera `src/estilos/tokens.css` a partir de `02-design/sistema-de-design/tokens.json`
// (agente AM1, 15/10/2026). Irmão do `app/ferramentas/gerar-tema.mjs`: ninguém copia cor à mão.
//
// Os nomes --ad-* são os do `admin.css` do AK (mapa em docs/revisao/AK-ADMIN-TELAS.md, seção 5).
// O que NÃO existe no tokens.json está na tabela SO_DO_ADMIN abaixo, com o motivo, e é proposta ao AL.
// Uso: node ferramentas/gerar-tokens-css.mjs   (o `npm run dev` e o `npm run build` rodam antes)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const origem = resolve(aqui, '../../02-design/sistema-de-design/tokens.json');
const destino = resolve(aqui, '../src/estilos/tokens.css');
const t = JSON.parse(readFileSync(origem, 'utf8'));

/** papel do tokens.json → variável do admin */
const MAPA = {
  fundo: '--ad-fundo', superficie: '--ad-superficie', superficieElevada: '--ad-elevada',
  texto: '--ad-texto', textoSecundario: '--ad-texto-2', borda: '--ad-borda',
  marca: '--ad-marca', marcaTexto: '--ad-marca-texto', marcaSuave: '--ad-marca-suave',
  viva: '--ad-viva', vivaTexto: '--ad-viva-texto',
  sucesso: '--ad-sucesso', atencao: '--ad-atencao', erro: '--ad-erro',
  foco: '--ad-foco', trilho: '--ad-trilho', regua: '--ad-regua', sobreposicao: '--ad-veu',
};

/**
 * Só do admin (AK, seção 5). Cada valor diz de onde vem; o que diverge do token é proposta ao AL.
 * - lateral: a barra lateral e a de baixo são pretas da marca nos DOIS temas;
 * - selecao: a linha selecionada da grade (= marcaSuave no escuro; mais clara no claro);
 * - zebra: o cabeçalho e os totais da tabela;
 * - barra: a barra de gráfico que não é o destaque (grafico.escuro.neutro2 no escuro);
 * - sucesso/atencao do CLARO: o #0A7E3A e o #B74D00 do token reprovam sobre a linha nova (#FBE6E6),
 *   4,33:1 e 4,31:1; o AK mediu #087033 (5,20:1) e #A84700 (4,92:1).
 */
const SO_DO_ADMIN = {
  escuro: {
    '--ad-zebra': '#232323', '--ad-selecao': t.cor.escuro.marcaSuave, '--ad-barra': t.grafico.escuro.neutro2,
    '--ad-sombra': `0 8px 24px rgba(0, 0, 0, .48), 0 0 0 1px ${t.cor.escuro.borda}`,
  },
  claro: {
    '--ad-zebra': t.cor.claro.fundo, '--ad-selecao': '#FDF1F1', '--ad-barra': '#A3A3A3',
    '--ad-sucesso': '#087033', '--ad-atencao': '#A84700',
    '--ad-sombra': `0 8px 24px rgba(0, 0, 0, .16), 0 0 0 1px ${t.cor.claro.borda}`,
  },
};

const MARCA = { '--rf-vermelho': '#C42024', '--rf-preto': '#1C1C1C', '--rf-grafite': '#343434', '--rf-branco': '#FFFFFF' };

function cores(tema) {
  const c = t.cor[tema];
  const linhas = Object.entries(MAPA).map(([papel, v]) => {
    if (c[papel] == null) throw new Error(`tokens.json não tem cor.${tema}.${papel}`);
    return `  ${v}: ${c[papel]};`;
  });
  for (const [v, valor] of Object.entries(SO_DO_ADMIN[tema])) {
    const i = linhas.findIndex((l) => l.startsWith(`  ${v}:`));
    if (i >= 0) linhas[i] = `  ${v}: ${valor}; /* só do admin: ver SO_DO_ADMIN */`;
    else linhas.push(`  ${v}: ${valor};`);
  }
  return linhas.join('\n');
}

const rem = (px) => `${+(px / 16).toFixed(4)}rem`;
const e = t.tipografia.escala;
const escala = [
  ['--t13', rem(e.legenda.tamanho)], ['--l13', rem(e.legenda.linha)], ['--l13b', rem(e.corpoPequeno.linha)],
  ['--t16', rem(e.corpo.tamanho)], ['--l16', rem(e.corpo.linha)],
  ['--t20', rem(e.titulo3.tamanho)], ['--l20', rem(e.titulo3.linha)],
  ['--t25', rem(e.titulo2.tamanho)], ['--l25', rem(e.titulo2.linha)],
  ['--t31', rem(e.titulo1.tamanho)], ['--l31', rem(e.titulo1.linha)],
];

const fixos = [
  ...Object.entries(MARCA),
  ['--fonte', t.tipografia.familia.interface.replace(/'/g, '"')],
  ['--fonte-numero', t.tipografia.familia.numero.replace(/'/g, '"')],
  ...escala,
  ['--alvo', `${t.alvo.minimoIos}px`], ['--alvo-celular', `${t.alvo.minimo}px`],
  ['--raio', `${t.raio.pequeno}px`], ['--raio-p', `${t.espaco['1']}px`],
  ['--lateral', '232px'],
  // a barra lateral é preta nos dois temas: usa as cores do ESCURO sempre (só do admin)
  ['--ad-lateral', t.cor.escuro.superficie], ['--ad-lateral-texto', t.cor.escuro.texto], ['--ad-lateral-texto-2', t.cor.escuro.textoSecundario],
  ['--dur-rapida', `${t.duracao.rapida}ms`], ['--dur-media', `${t.duracao.media}ms`], ['--dur-lenta', `${t.duracao.lenta}ms`],
  ['--dur-reduzida', `${t.movimento.reduzido.duracao}ms`], ['--dur-aviso', `${t.duracao.toast}ms`],
  ['--curva', t.curva.padrao], ['--curva-entrada', t.curva.entrada],
].map(([k, v]) => `  ${k}: ${v};`).join('\n');

const css = `/* GERADO por ferramentas/gerar-tokens-css.mjs a partir de tokens.json ${t.$versao} (${t.$data}). Não edite à mão. */

:root {
${fixos}

  /* ESCURO é o principal */
  color-scheme: dark;
${cores('escuro')}
}

@media (prefers-color-scheme: light) {
  :root:not([data-tema="escuro"]) {
    color-scheme: light;
${cores('claro').replace(/^ {2}/gm, '    ')}
  }
}

:root[data-tema="claro"] {
  color-scheme: light;
${cores('claro')}
}

:root[data-tema="escuro"] {
  color-scheme: dark;
${cores('escuro')}
}
`;

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, css);
console.log(`tokens.css gerado de tokens.json ${t.$versao}`);
