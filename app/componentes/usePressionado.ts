/**
 * A resposta ao dedo (catálogo de movimento, regra 4 e efeito 4.5): começa no
 * `onPressIn`, a ação sai ao soltar dentro do alvo. Botão e cartão vão a 0,98
 * em `rapida` com a curva `padrao`; o cartão ainda desce 1 px e perde a
 * sombra, e volta na `mola.toque` (200 ms, sem quique).
 *
 * "Reduzir movimento": sem escala e sem descida; só a camada de toque aparece.
 */
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { curva, duracao, esmaecer, mola, movimento, useTema } from '@/tema';

export function usePressionado({ afundar = false, escala = movimento.escalaToque }: { afundar?: boolean; escala?: number } = {}) {
  const { reduzirMovimento } = useTema();
  const p = useSharedValue(0);

  const aoPressionar = () => {
    p.value = reduzirMovimento ? esmaecer(1) : withTiming(1, { duration: duracao.rapida, easing: curva.padrao });
  };
  const aoSoltar = () => {
    p.value = reduzirMovimento ? esmaecer(0) : withSpring(0, mola.toque);
  };

  const estiloDoCorpo = useAnimatedStyle(() => {
    if (reduzirMovimento) return { transform: [] };
    const s = 1 - (1 - escala) * p.value;
    return { transform: afundar ? [{ scale: s }, { translateY: p.value }] : [{ scale: s }] };
  });
  /** A camada de `texto` por cima (8 % no claro, 12 % no escuro); multiplique pela opacidade da camada. */
  const estiloDaCamada = useAnimatedStyle(() => ({ opacity: p.value }));
  /** A sombra de repouso, que some enquanto o cartão está afundado. */
  const estiloDaSombra = useAnimatedStyle(() => ({ opacity: 1 - p.value }));

  return { aoPressionar, aoSoltar, estiloDoCorpo, estiloDaCamada, estiloDaSombra };
}
