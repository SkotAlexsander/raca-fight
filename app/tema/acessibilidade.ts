/**
 * "Reduzir movimento" e "Reduzir transparência" do sistema, acompanhados ao
 * vivo. O `useReducedMotion()` do Reanimated lê uma vez e não re-renderiza
 * quando a opção muda (catálogo de movimento, seção 3); estes hooks acompanham.
 *
 * No navegador há a versão `acessibilidade.web.ts` (lê as media queries).
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReduzirMovimentoDoSistema(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => vivo && setReduzir(v));
    const s = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir);
    return () => {
      vivo = false;
      s.remove();
    };
  }, []);
  return reduzir;
}

/**
 * iPhone: Acessibilidade › Tela e Tamanho do Texto › Reduzir Transparência.
 * Android não tem a preferência na API pública; lá o vidro decide pela versão
 * do sistema (componente 20: abaixo do Android 12 nasce sólido).
 */
export function useReduzirTransparenciaDoSistema(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let vivo = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((v) => vivo && setReduzir(v));
    const s = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduzir);
    return () => {
      vivo = false;
      s.remove();
    };
  }, []);
  return reduzir;
}
