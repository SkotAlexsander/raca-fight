/**
 * Estilos de texto da escala FECHADA (13 · 16 · 20 · 25 · 31 · 39 · 49 · 61),
 * gerados do tokens.json. Cada estilo já vem com a fonte pelo nome do arquivo
 * (sem `fontWeight`: no iOS cada peso é uma família), o espaçamento em px e
 * os algarismos tabulares nos números.
 *
 * `celularPequeno` (tela < 390) desce um passo nos estilos que o token manda
 * (`escalaCelularPequeno`). `multiplicadorMaximo` é o teto de ampliação
 * (`tetoAmpliacao`): o número do cronômetro não cresce além de 61, o rótulo da
 * aba até 1,3×.
 */
import type { TextStyle } from 'react-native';
import { tipografia, type NomeDoEstiloDeTexto } from './gerado/tokens';

export interface EstiloDeTexto {
  estilo: TextStyle;
  multiplicadorMaximo?: number;
}

interface EstiloGerado {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  numerico: boolean;
  multiplicadorMaximo?: number;
}

const ESCALA = tipografia.escala as unknown as Record<NomeDoEstiloDeTexto, EstiloGerado>;
const ESCALA_PEQUENO = tipografia.escalaCelularPequeno as unknown as Partial<Record<NomeDoEstiloDeTexto, EstiloGerado>>;

export function estiloDeTexto(nome: NomeDoEstiloDeTexto, celularPequeno = false): EstiloDeTexto {
  const e = (celularPequeno ? ESCALA_PEQUENO[nome] : undefined) ?? ESCALA[nome];
  const estilo: TextStyle = {
    fontFamily: e.fontFamily,
    fontSize: e.fontSize,
    lineHeight: e.lineHeight,
    letterSpacing: e.letterSpacing,
  };
  if (e.numerico) estilo.fontVariant = ['tabular-nums'];
  return { estilo, multiplicadorMaximo: e.multiplicadorMaximo };
}

/** Os 8 tamanhos permitidos. Usado pelo catálogo e pelos testes de tela. */
export const ESCALA_PERMITIDA: readonly number[] = tipografia.escalaPermitida;
