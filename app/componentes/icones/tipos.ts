/** Formato dos dados que `ferramentas/gerar-icones.mjs` tira do sprite do design. */

export interface AtributosSvg {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fillRule?: 'evenodd' | 'nonzero' | string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  /** `aparelho`, `corpo`, `cabeca`, `musculo` (só nas ilustrações). */
  classe?: string;
  /** O grupo do músculo: pinta com a cor de destaque do tema. */
  destaque?: boolean;
}

export type ElementoSvg =
  | ({ tipo: 'caminho'; d: string } & AtributosSvg)
  | ({ tipo: 'circulo'; cx: number; cy: number; r: number } & AtributosSvg)
  | ({ tipo: 'grupo'; filhos: ElementoSvg[] } & AtributosSvg);

export interface SimboloSvg {
  viewBox: string;
  raiz: AtributosSvg;
  filhos: ElementoSvg[];
}
