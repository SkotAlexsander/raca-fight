/**
 * Texto da escala fechada. Todo texto do app passa por aqui: assim nenhum
 * tamanho fora de 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61 entra na tela.
 *
 * `cor` é um PAPEL do tema (`texto`, `textoSecundario`, `marca`…), nunca um
 * valor solto. Dentro da foto ou do vidro o papel já vem trocado
 * (`SobreposicaoDeCores`).
 */
import { Text, type TextProps } from 'react-native';
import { estiloDeTexto, useTema, type CoresDoTema, type NomeDoEstiloDeTexto } from '@/tema';

type PapelDeCor = { [K in keyof CoresDoTema]: CoresDoTema[K] extends string ? K : never }[keyof CoresDoTema];

export interface PropsDoTexto extends TextProps {
  variante?: NomeDoEstiloDeTexto;
  cor?: PapelDeCor;
  /** Alinhamento rápido; o resto vai em `style`. */
  alinhar?: 'left' | 'center' | 'right';
}

export function Texto({ variante = 'corpo', cor = 'texto', alinhar, style, maxFontSizeMultiplier, ...resto }: PropsDoTexto) {
  const { cores, celularPequeno } = useTema();
  const { estilo, multiplicadorMaximo } = estiloDeTexto(variante, celularPequeno);
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? multiplicadorMaximo}
      style={[estilo, { color: cores[cor] }, alinhar ? { textAlign: alinhar } : null, style]}
      {...resto}
    />
  );
}

export type { PapelDeCor };
