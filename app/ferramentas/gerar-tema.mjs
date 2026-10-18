#!/usr/bin/env node
/**
 * Gera `tema/gerado/tokens.ts` a partir de `02-design/sistema-de-design/tokens.json`.
 *
 * O tema do app NUNCA é copiado à mão (P11, agente X): mudou o tokens.json, roda
 * `npm run gerar:tema` e o app acompanha. O arquivo gerado diz a versão dos
 * tokens e não deve ser editado.
 *
 * O que o script resolve, para o app não precisar saber CSS:
 * - referências a papéis ("marca", "viva", "marcaSuave") viram a cor do tema;
 * - `color-mix(in srgb, A p%, B)` vira rgba calculado (pré-multiplicado, como o CSS);
 * - `linear-gradient(...)` vira { inicio, fim, cores, posicoes } (expo-linear-gradient);
 * - `radial-gradient(...)` da luz lateral vira { cx, cy, rx, ry, cores, posicoes } (react-native-svg);
 * - `cubic-bezier(...)` vira os 4 números (Easing.bezier do Reanimated);
 * - cada estilo da escala tipográfica vira fontFamily pelo nome do arquivo
 *   (`tipografia.familiaPorPeso`; no iOS cada peso é uma família), tamanho,
 *   altura de linha e espaçamento em px.
 *
 * Uso: node ferramentas/gerar-tema.mjs   (de dentro de app/)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const ORIGEM = resolve(aqui, '../../02-design/sistema-de-design/tokens.json');
const DESTINO = resolve(aqui, '../tema/gerado/tokens.ts');

const t = JSON.parse(readFileSync(ORIGEM, 'utf8'));

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------

/** Lê #RGB, #RRGGBB, rgb(), rgba() e 'transparent'. Devolve [r, g, b, a]. */
function lerCor(texto) {
  const s = String(texto).trim();
  if (s === 'transparent') return [0, 0, 0, 0];
  let m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)).concat(1);
  m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
  throw new Error(`cor que o gerador não sabe ler: ${s}`);
}

function escreverCor([r, g, b, a]) {
  const R = Math.round(r), G = Math.round(g), B = Math.round(b);
  if (a >= 0.9995) return '#' + [R, G, B].map((x) => x.toString(16).padStart(2, '0').toUpperCase()).join('');
  return `rgba(${R}, ${G}, ${B}, ${Number(a.toFixed(3))})`;
}

/** color-mix(in srgb, A p%, B): interpolação pré-multiplicada, como o navegador faz. */
function misturar(a, p, b) {
  const [ar, ag, ab, aa] = lerCor(a);
  const [br, bg, bb, ba] = lerCor(b);
  const q = 1 - p;
  const alfa = aa * p + ba * q;
  if (alfa === 0) return 'rgba(0, 0, 0, 0)';
  const canal = (x, y) => (x * aa * p + y * ba * q) / alfa;
  return escreverCor([canal(ar, br), canal(ag, bg), canal(ab, bb), alfa]);
}

const PAPEIS = Object.keys(t.cor.claro);

/** Troca "marca", "viva", "vidro.claro.fundo"… pelo valor do tema; resolve color-mix. */
function resolverCor(valor, tema, extras = {}) {
  if (typeof valor !== 'string') return valor;
  const v = valor.trim();
  if (PAPEIS.includes(v)) return t.cor[tema][v];
  if (v in extras) return extras[v];
  const mix = /^color-mix\(in srgb,\s*([^,]+?)\s+(\d+)%,\s*([^)]+)\)$/.exec(v);
  if (mix) {
    const a = resolverCor(mix[1], tema, extras);
    const b = resolverCor(mix[3], tema, extras);
    return misturar(a, Number(mix[2]) / 100, b);
  }
  return v;
}

/** Sombra CSS: troca os papéis ("0 0 0 2px marca, …") pela cor do tema. */
function resolverSombra(valor, tema) {
  return String(valor).replace(/\b([a-zA-Z]+)\b/g, (palavra) => (PAPEIS.includes(palavra) ? t.cor[tema][palavra] : palavra));
}

// ---------------------------------------------------------------------------
// Degradês
// ---------------------------------------------------------------------------

/** Separa por vírgula de primeiro nível (ignora as vírgulas dentro de rgba()). */
function partes(texto) {
  const saida = [];
  let nivel = 0, atual = '';
  for (const c of texto) {
    if (c === '(') nivel += 1;
    if (c === ')') nivel -= 1;
    if (c === ',' && nivel === 0) { saida.push(atual.trim()); atual = ''; continue; }
    atual += c;
  }
  if (atual.trim()) saida.push(atual.trim());
  return saida;
}

function paradas(lista) {
  const cores = [], posicoes = [];
  lista.forEach((p, i) => {
    const m = /^(.*?)(?:\s+([\d.]+)%)?$/.exec(p);
    cores.push(escreverCor(lerCor(m[1].trim())));
    posicoes.push(m[2] === undefined ? null : Number(m[2]) / 100);
  });
  // sem posição: distribui por igual, como o CSS
  if (posicoes[0] === null) posicoes[0] = 0;
  if (posicoes[posicoes.length - 1] === null) posicoes[posicoes.length - 1] = 1;
  for (let i = 1; i < posicoes.length - 1; i += 1) {
    if (posicoes[i] === null) {
      let j = i;
      while (posicoes[j] === null) j += 1;
      const a = posicoes[i - 1], b = posicoes[j];
      for (let k = i; k < j; k += 1) posicoes[k] = a + ((b - a) * (k - i + 1)) / (j - i + 1);
    }
  }
  return { cores, posicoes: posicoes.map((x) => Number(x.toFixed(4))) };
}

/** linear-gradient(180deg | to top, ...) → expo-linear-gradient. */
function lerDegradeLinear(texto) {
  const m = /^linear-gradient\((.*)\)$/s.exec(String(texto).trim());
  if (!m) throw new Error(`degradê que o gerador não sabe ler: ${texto}`);
  const p = partes(m[1]);
  let direcao = '180deg';
  if (/deg$|^to /.test(p[0])) direcao = p.shift();
  const DIRECOES = {
    '180deg': [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }],
    'to bottom': [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }],
    '0deg': [{ x: 0.5, y: 1 }, { x: 0.5, y: 0 }],
    'to top': [{ x: 0.5, y: 1 }, { x: 0.5, y: 0 }],
    '90deg': [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }],
    'to right': [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }],
  };
  const [inicio, fim] = DIRECOES[direcao] ?? (() => { throw new Error(`direção sem tradução: ${direcao}`); })();
  return { inicio, fim, ...paradas(p) };
}

/** radial-gradient(120% 80% at 100% 0%, ...) → elipse para o RadialGradient do react-native-svg. */
function lerDegradeRadial(texto) {
  const m = /^radial-gradient\((.*)\)$/s.exec(String(texto).trim());
  if (!m) throw new Error(`degradê radial que o gerador não sabe ler: ${texto}`);
  const p = partes(m[1]);
  const forma = /^([\d.]+)%\s+([\d.]+)%\s+at\s+([\d.]+)%\s+([\d.]+)%$/.exec(p.shift());
  if (!forma) throw new Error(`forma do radial sem tradução: ${texto}`);
  return {
    rx: Number(forma[1]) / 100, ry: Number(forma[2]) / 100,
    cx: Number(forma[3]) / 100, cy: Number(forma[4]) / 100,
    ...paradas(p),
  };
}

function lerCurva(texto) {
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(String(texto).trim());
  if (!m) throw new Error(`curva que o gerador não sabe ler: ${texto}`);
  return m[1].split(',').map((x) => Number(x.trim()));
}

// ---------------------------------------------------------------------------
// Montagem por tema
// ---------------------------------------------------------------------------

/** Tira as chaves de documentação ($nota, $regra…) de um bloco. */
function semNotas(obj) {
  if (Array.isArray(obj) || obj === null || typeof obj !== 'object') return obj;
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('$')).map(([k, v]) => [k, semNotas(v)]));
}

/**
 * Valores que o sistema.css usa e que ainda NÃO estão no tokens.json. Ficam aqui,
 * num lugar só e com a origem citada, até o time de design levá-los ao tokens.json
 * (pendência registrada em docs/revisao/X-BASE.md). Não são inventados: são os do
 * mockup aprovado.
 */
const DO_SISTEMA_CSS = {
  claro: {
    camadaToque: 0.08, // --camada-toque (cartão e botão pressionados)
    brilhoEsqueleto: 'rgba(255, 255, 255, 0.65)', // --brilho-esqueleto
    toastFundo: t.cor.claro.texto, // --cor-toast-fundo: no claro o aviso é invertido
    toastTexto: t.cor.claro.fundo,
    toastAcao: t.cor.claro.fundo,
    trilhoSobreFoto: 'rgba(255, 255, 255, 0.22)', // .foto-texto { --cor-trilho }
  },
  escuro: {
    camadaToque: 0.12,
    brilhoEsqueleto: 'rgba(255, 255, 255, 0.07)',
    toastFundo: t.cor.escuro.superficieElevada,
    toastTexto: t.cor.escuro.texto,
    toastAcao: t.cor.escuro.marca,
    trilhoSobreFoto: 'rgba(255, 255, 255, 0.22)',
  },
};

function coresDoTema(tema) {
  const c = {};
  for (const papel of PAPEIS) c[papel] = t.cor[tema][papel];

  const v = t.vidro[tema];
  const extrasVidro = { [`vidro.${tema}.fundo`]: v.fundo };
  c.vidroFundo = v.fundo;
  c.vidroBorda = v.borda;
  c.vidroTexto = v.texto;
  c.vidroTextoSecundario = v.textoSecundario;
  c.vidroDestaque = v.destaque;
  c.vidroSolido = v.solido;
  c.vidroSelecionado = resolverCor(v.selecionado, tema, extrasVidro);
  c.vidroBarra = t.vidro.barra[tema];
  const f = t.vidro.escuroFixo;
  c.vidroEscuroFixoFundo = f.fundo;
  c.vidroEscuroFixoBorda = f.borda;
  c.vidroEscuroFixoTexto = f.texto;
  c.vidroEscuroFixoTextoSecundario = f.textoSecundario;
  c.vidroEscuroFixoDestaque = f.destaque;
  c.vidroEscuroFixoSolido = f.solido;

  c.fotoTexto = t.foto.texto;
  c.fotoTextoSecundario = t.foto.textoSecundario;
  c.fotoFundoSemFoto = t.foto.fundoSemFoto;
  c.fotoEntradaTexto = t.foto.entrada[tema].texto;
  c.fotoEntradaTextoSecundario = t.foto.entrada[tema].textoSecundario;
  c.fotoEntradaVeuDesfocada = t.foto.entrada[tema].veuDesfocada;

  c.aberturaFundo = resolverCor(t.abertura[tema].fundo, tema);
  c.aberturaSimbolo = resolverCor(t.abertura[tema].simbolo, tema);
  c.contaSocialFundo = t.contaSocial[tema].fundo;
  c.contaSocialTexto = t.contaSocial[tema].texto;
  c.ilustracaoFundo = t.ilustracao[tema].fundo;
  c.ilustracaoTraco = t.ilustracao[tema].traco;
  c.ilustracaoDestaque = t.ilustracao[tema].destaque;
  for (const [k, val] of Object.entries(semNotas(t.grafico[tema]))) c['grafico' + k[0].toUpperCase() + k.slice(1)] = val;
  c.mapaVazio = t.mapa[tema].vazio;
  c.mapaFuturo = t.mapa[tema].futuro;
  c.avisoFundo = resolverCor(t.aviso[tema].fundo, tema);
  c.avisoFio = resolverCor(t.aviso[tema].fio, tema);
  c.abaPilulaAtiva = resolverCor(t.abas.pilulaAtiva.cor, tema);
  c.abaMais = resolverCor(t.abas.mais.cor, tema);
  c.abaMaisTexto = resolverCor(t.abas.mais.texto, tema);

  Object.assign(c, DO_SISTEMA_CSS[tema]);
  return c;
}

function sombrasDoTema(tema) {
  const s = {};
  for (const nivel of ['1', '2', '3', 'atual', 'viva']) s[nivel === '1' || nivel === '2' || nivel === '3' ? `sombra${nivel}` : `sombra${nivel[0].toUpperCase()}${nivel.slice(1)}`] = resolverSombra(t.sombra[nivel][tema], tema);
  s.vidroBrilhoTopo = t.vidro[tema].brilhoTopo;
  s.vidroSombra = t.vidro[tema].sombra;
  s.vidroEscuroFixoBrilhoTopo = t.vidro.escuroFixo.brilhoTopo;
  s.vidroEscuroFixoSombra = t.vidro.escuroFixo.sombra;
  return s;
}

function degradesDoTema(tema) {
  return {
    foto: lerDegradeLinear(t.foto.gradiente),
    fotoCapa: lerDegradeLinear(t.foto.gradienteCapa),
    fotoLuzLateral: lerDegradeRadial(t.foto.luzLateral),
    vidroCamadaContraste: lerDegradeLinear(t.vidro[tema].camadaContraste),
    fotoEntradaVeu: lerDegradeLinear(t.foto.entrada[tema].veu),
  };
}

// ---------------------------------------------------------------------------
// Tipografia
// ---------------------------------------------------------------------------

const FAMILIA = t.tipografia.familiaPorPeso;
/**
 * O tokens.json traz o mapa de Archivo só para 700. A escala usa 800 em
 * numeroGigante e numeroDestaque; o arquivo `Archivo-ExtraBold.ttf` já está em
 * recursos/fontes (e no app.json). Até o design acrescentar "800" ao mapa, o 800
 * cai no ExtraBold — anotado no relatório X-BASE.
 */
const NUMERO_800 = 'Archivo-ExtraBold';

function familiaDe(estilo) {
  const peso = String(estilo.peso);
  if (estilo.tabular) {
    if (FAMILIA.numero[peso]) return FAMILIA.numero[peso];
    if (peso === '800') return NUMERO_800;
    return FAMILIA.numero['700'];
  }
  return FAMILIA.interface[peso] ?? FAMILIA.interface['400'];
}

function estiloDeTexto(nome, e) {
  const saida = {
    fontFamily: familiaDe(e),
    fontSize: e.tamanho,
    lineHeight: e.linha,
    letterSpacing: Number(((e.espacamento ?? 0) * e.tamanho).toFixed(3)),
    numerico: Boolean(e.tabular),
  };
  const teto = t.tipografia.tetoAmpliacao[nome];
  if (teto?.tamanhoMaximo) saida.multiplicadorMaximo = Number((teto.tamanhoMaximo / e.tamanho).toFixed(3));
  if (teto?.fatorMaximo) saida.multiplicadorMaximo = teto.fatorMaximo;
  return saida;
}

const escala = {};
for (const [nome, e] of Object.entries(t.tipografia.escala)) {
  if (nome.startsWith('$')) continue;
  escala[nome] = estiloDeTexto(nome, e);
}
const escalaPequeno = {};
for (const [nome, e] of Object.entries(t.tipografia.escalaCelularPequeno)) {
  if (nome.startsWith('$')) continue;
  const base = t.tipografia.escala[nome];
  escalaPequeno[nome] = estiloDeTexto(nome, { ...base, tamanho: e.tamanho, linha: e.linha });
  // o teto é absoluto (tamanhoMaximo): no pequeno o multiplicador cresce na mesma conta
}

// Confere a regra da escala fechada: nenhum tamanho fora dela.
const PERMITIDOS = t.tipografia.$escala;
for (const [nome, e] of [...Object.entries(escala), ...Object.entries(escalaPequeno)]) {
  if (!PERMITIDOS.includes(e.fontSize)) throw new Error(`${nome}: ${e.fontSize} está fora da escala fechada ${PERMITIDOS.join(' · ')}`);
}

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

const num = (o) => semNotas(o);
const blocos = {
  coresClaro: coresDoTema('claro'),
  coresEscuro: coresDoTema('escuro'),
  sombrasClaro: sombrasDoTema('claro'),
  sombrasEscuro: sombrasDoTema('escuro'),
  degradesClaro: degradesDoTema('claro'),
  degradesEscuro: degradesDoTema('escuro'),
  espaco: num(t.espaco),
  raio: num(t.raio),
  imagem: num(t.imagem),
  vidro: { desfoque: t.vidro.desfoque, saturacao: t.vidro.saturacao, borda: t.vidro.borda },
  foto: { escurecer: t.foto.escurecer, saturacao: t.foto.saturacao, desfoqueDescanso: t.foto.desfoqueDescanso },
  deslizar: { altura: t.deslizar.altura, botao: t.deslizar.botao, limiar: t.deslizar.limiar },
  anel: num(t.anel),
  abertura: { simbolo: t.abertura.simbolo, simboloSelo: t.abertura.simboloSelo, esperaDemo: t.abertura.esperaDemo },
  porta: num(t.porta),
  codigo: num(t.codigo),
  ilustracao: { raio: t.ilustracao.raio },
  mapa: { dia: t.mapa.dia, bolinhaSemana: t.mapa.bolinhaSemana },
  comemoracao: num(t.comemoracao),
  descanso: num(t.descanso),
  telas: num(t.telas),
  abas: {
    pilulaAtiva: { largura: t.abas.pilulaAtiva.largura, altura: t.abas.pilulaAtiva.altura, raio: t.abas.pilulaAtiva.raio },
    mais: { tamanho: t.abas.mais.tamanho },
  },
  alvo: num(t.alvo),
  controle: num(t.controle),
  borda: num(t.borda),
  duracao: num(t.duracao),
  curva: Object.fromEntries(Object.entries(t.curva).map(([k, v]) => [k, lerCurva(v)])),
  movimento: num(t.movimento),
  vibracao: num(t.vibracao),
  cronometro: num(t.cronometro),
  folha: num(t.folha),
  layout: num(t.layout),
  icone: num(t.icone),
  camada: num(t.camada),
  tipografia: {
    escala,
    escalaCelularPequeno: escalaPequeno,
    fonteAmpliada: num(t.tipografia.fonteAmpliada),
    tamanhoMinimoTexto: t.tipografia.tamanhoMinimoTexto,
    tamanhoMinimoCampo: t.tipografia.tamanhoMinimoCampo,
    escalaPermitida: PERMITIDOS,
  },
};

const linhas = [
  '/* eslint-disable */',
  '/**',
  ' * GERADO por ferramentas/gerar-tema.mjs a partir de',
  ` * 02-design/sistema-de-design/tokens.json (versão ${t.$versao}, ${t.$data}).`,
  ' * NÃO EDITE À MÃO: mude o tokens.json e rode `npm run gerar:tema`.',
  ' */',
  '',
  `export const VERSAO_DOS_TOKENS = '${t.$versao}';`,
  '',
];
for (const [nome, valor] of Object.entries(blocos)) {
  linhas.push(`export const ${nome} = ${JSON.stringify(valor, null, 2)} as const;`, '');
}
linhas.push(
  '/** Os papéis de cor de um tema (os dois temas têm as mesmas chaves). */',
  'export type CoresDoTema = { readonly [K in keyof typeof coresClaro]: (typeof coresClaro)[K] extends number ? number : string };',
  'export type SombrasDoTema = { readonly [K in keyof typeof sombrasClaro]: string };',
  'export interface DegradeLinear { readonly inicio: { readonly x: number; readonly y: number }; readonly fim: { readonly x: number; readonly y: number }; readonly cores: readonly string[]; readonly posicoes: readonly number[] }',
  'export interface DegradeRadial { readonly rx: number; readonly ry: number; readonly cx: number; readonly cy: number; readonly cores: readonly string[]; readonly posicoes: readonly number[] }',
  'export interface DegradesDoTema { readonly foto: DegradeLinear; readonly fotoCapa: DegradeLinear; readonly fotoLuzLateral: DegradeRadial; readonly vidroCamadaContraste: DegradeLinear; readonly fotoEntradaVeu: DegradeLinear }',
  'export type NomeDoEstiloDeTexto = keyof typeof tipografia.escala;',
  '',
);

mkdirSync(dirname(DESTINO), { recursive: true });
writeFileSync(DESTINO, linhas.join('\n'));

// O claro e o escuro precisam ter as mesmas chaves.
const faltam = Object.keys(blocos.coresClaro).filter((k) => !(k in blocos.coresEscuro));
if (faltam.length) throw new Error(`o escuro não tem: ${faltam.join(', ')}`);

console.log(`tema gerado: ${DESTINO} (tokens ${t.$versao}, ${Object.keys(blocos.coresClaro).length} cores por tema, ${Object.keys(escala).length} estilos de texto)`);
