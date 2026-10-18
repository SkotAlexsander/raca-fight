/**
 * Versão do navegador: `prefers-reduced-motion` e `prefers-reduced-transparency`
 * (o mesmo que o mockup usa). A nativa está em `acessibilidade.ts`.
 */
import { useEffect, useState } from 'react';

function usePreferenciaDeMidia(consulta: string): boolean {
  const [ligada, setLigada] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(consulta).matches);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const m = window.matchMedia(consulta);
    const aoMudar = () => setLigada(m.matches);
    aoMudar();
    m.addEventListener?.('change', aoMudar);
    return () => m.removeEventListener?.('change', aoMudar);
  }, [consulta]);
  return ligada;
}

export function useReduzirMovimentoDoSistema(): boolean {
  return usePreferenciaDeMidia('(prefers-reduced-motion: reduce)');
}

export function useReduzirTransparenciaDoSistema(): boolean {
  return usePreferenciaDeMidia('(prefers-reduced-transparency: reduce)');
}
