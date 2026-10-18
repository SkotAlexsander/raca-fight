/**
 * Movimento: as durações, curvas e molas do `tokens.json` (blocos `duracao`,
 * `curva`, `movimento`) em forma de Reanimated 4. Catálogo de cada efeito:
 * 02-design/sistema-de-design/movimento/00-CATALOGO.md.
 *
 * Regra 1 do catálogo: o dado grava ANTES da animação; a animação segue o dado.
 * Regra 2: com "reduzir movimento", todo efeito vira o `esmaecer` de 160 ms.
 */
import { Easing, ReduceMotion, withTiming } from 'react-native-reanimated';
import { curva as curvaDosTokens, duracao as duracaoDosTokens, movimento as movimentoDosTokens } from './gerado/tokens';

export const duracao = {
  instantanea: duracaoDosTokens.instantanea,
  rapida: duracaoDosTokens.rapida,
  media: duracaoDosTokens.media,
  lenta: duracaoDosTokens.lenta,
  toast: duracaoDosTokens.toast,
  esmaecerReduzido: movimentoDosTokens.duracao.esmaecerReduzido,
  comemoracao: movimentoDosTokens.duracao.comemoracao,
  passadaEsqueleto: movimentoDosTokens.duracao.passadaEsqueleto,
  brilhoPlus: movimentoDosTokens.duracao.brilhoPlus,
} as const;

export const atraso = movimentoDosTokens.atraso;

const bezier = (c: readonly number[]) => Easing.bezier(c[0], c[1], c[2], c[3]);

export const curva = {
  padrao: bezier(curvaDosTokens.padrao),
  entrada: bezier(curvaDosTokens.entrada),
  saida: bezier(curvaDosTokens.saida),
  constante: Easing.linear,
};

/** withSpring(valor, mola.check): amortecimento = dampingRatio; duracao = tempo percebido. */
export const mola = {
  padrao: { dampingRatio: movimentoDosTokens.mola.padrao.amortecimento, duration: movimentoDosTokens.mola.padrao.duracao },
  check: { dampingRatio: movimentoDosTokens.mola.check.amortecimento, duration: movimentoDosTokens.mola.check.duracao },
  toque: { dampingRatio: movimentoDosTokens.mola.toque.amortecimento, duration: movimentoDosTokens.mola.toque.duracao },
} as const;

export const movimento = {
  deslocamentoEntrada: movimentoDosTokens.deslocamentoEntrada,
  escalaToque: movimentoDosTokens.escalaToque,
  escalaInicialCheck: movimentoDosTokens.escalaInicialCheck,
  escalaInicialComemoracao: movimentoDosTokens.escalaInicialComemoracao,
  passadasEsqueleto: movimentoDosTokens.passadasEsqueleto,
  limitePuxar: movimentoDosTokens.limitePuxar,
  rolagemTituloGrande: movimentoDosTokens.rolagemTituloGrande,
} as const;

/**
 * O esmaecer do "reduzir movimento". `ReduceMotion.Never` é de propósito: o
 * padrão do Reanimated (System) PULA a animação para o fim com a opção ligada,
 * e aí nem o esmaecer aconteceria (catálogo, seção 3).
 */
export const esmaecer = (para: number) => {
  'worklet';
  return withTiming(para, { duration: duracao.esmaecerReduzido, easing: curva.entrada, reduceMotion: ReduceMotion.Never });
};

/** Uma transição comum que respeita o "reduzir movimento" (vira o esmaecer). */
export const transicao = (para: number, ms: number, reduzir: boolean, easing = curva.padrao) => {
  'worklet';
  return reduzir ? esmaecer(para) : withTiming(para, { duration: ms, easing, reduceMotion: ReduceMotion.Never });
};
