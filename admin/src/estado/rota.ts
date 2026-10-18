/**
 * A rota do Admin fica no "#" da URL (#/financeiro/lancamentos): funciona em
 * qualquer hospedagem estática e no app instalado, sem servidor.
 */

import { useEffect, useState } from 'react';

export type Rota = string[];

const ler = (): Rota => (globalThis.location?.hash ?? '').replace(/^#\/?/, '').split('?')[0]!.split('/').filter(Boolean).map(decodeURIComponent);

export function ir(...partes: string[]): void {
  const alvo = `#/${partes.map(encodeURIComponent).join('/')}`;
  if (location.hash !== alvo) location.hash = alvo;
}

export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(ler);
  useEffect(() => {
    const mudou = () => setRota(ler());
    addEventListener('hashchange', mudou);
    return () => removeEventListener('hashchange', mudou);
  }, []);
  return rota.length ? rota : ['painel'];
}

export const href = (...partes: string[]) => `#/${partes.map(encodeURIComponent).join('/')}`;
