/**
 * Ícone do sistema (02-design/icones/, grade 24, traço 2,25, `currentColor`),
 * desenhado com react-native-svg a partir dos dados gerados do sprite
 * (`npm run gerar:icones`). Tamanhos: 16 (dentro de texto e chip), 24
 * (padrão), 32 (destaque). O ícone nunca é o alvo de toque.
 *
 * Contorno é o normal; `-cheio` só na aba ativa (e em pausar/começar quando o
 * botão é o assunto da tela).
 */
import { View } from 'react-native';
import { SVG_DECORATIVO } from './svgDecorativo';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { icone as tamanhosDoIcone, useTema } from '@/tema';
import { ICONES, type NomeDoIcone } from './icones/gerado';
import type { AtributosSvg, ElementoSvg } from './icones/tipos';
import type { PapelDeCor } from './Texto';

export type { NomeDoIcone };

export interface PropsDoIcone {
  nome: NomeDoIcone;
  tamanho?: 'pequeno' | 'medio' | 'grande' | number;
  /** Papel do tema ou cor já resolvida (`#…`, `rgba(…)`). Padrão: `texto`. */
  cor?: PapelDeCor | (string & {});
}

/** Troca `currentColor` pela cor pedida e passa só o que o react-native-svg entende. */
export function atributosParaSvg(a: AtributosSvg, cor: string, destaque?: string) {
  const troca = (v?: string) => (v === 'currentColor' ? cor : v);
  return {
    fill: troca(a.fill),
    stroke: a.destaque && destaque ? destaque : troca(a.stroke),
    strokeWidth: a.strokeWidth,
    opacity: a.opacity,
    fillRule: a.fillRule as 'evenodd' | 'nonzero' | undefined,
    strokeLinecap: a.strokeLinecap as 'round' | 'butt' | 'square' | undefined,
    strokeLinejoin: a.strokeLinejoin as 'round' | 'miter' | 'bevel' | undefined,
  };
}

export function desenharElementos(filhos: ElementoSvg[], cor: string, destaque?: string, prefixo = 'e') {
  return filhos.map((f, i) => {
    const chave = `${prefixo}${i}`;
    const atributos = atributosParaSvg(f, cor, destaque);
    if (f.tipo === 'caminho') return <Path key={chave} d={f.d} {...atributos} />;
    if (f.tipo === 'circulo') return <Circle key={chave} cx={f.cx} cy={f.cy} r={f.r} {...atributos} />;
    return (
      <G key={chave} {...atributos}>
        {desenharElementos(f.filhos, cor, destaque, chave)}
      </G>
    );
  });
}

export function Icone({ nome, tamanho = 'medio', cor = 'texto' }: PropsDoIcone) {
  const { cores } = useTema();
  const px = typeof tamanho === 'number' ? tamanho : tamanhosDoIcone[tamanho];
  const simbolo = ICONES[nome];
  const corResolvida = (cores as Record<string, string | number>)[cor as string];
  const c = typeof corResolvida === 'string' ? corResolvida : (cor as string);
  // A View por fora: no navegador o <svg> solto pinta ABAIXO das camadas absolutas
  // (vidro, camada de toque); a View do react-native-web é posicionada e fica na ordem.
  return (
    <View pointerEvents="none" style={{ width: px, height: px }}>
      <Svg width={px} height={px} viewBox={simbolo.viewBox} {...atributosParaSvg(simbolo.raiz, c)} {...SVG_DECORATIVO}>
        {desenharElementos(simbolo.filhos, c)}
      </Svg>
    </View>
  );
}
