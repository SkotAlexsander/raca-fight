/**
 * O tema: escuro é o principal; o claro vem do sistema ou do botão da barra
 * lateral. A escolha fica no navegador (conveniência; sem dado nenhum).
 * `?tema=claro|escuro` na URL fixa o tema (capturas).
 */

import { useCallback, useEffect, useState } from 'react';

const CHAVE = 'raca-fight-admin-tema';

export function aplicarTemaInicial(): void {
  const raiz = document.documentElement;
  let t: string | null = null;
  try { t = new URLSearchParams(location.search).get('tema') ?? localStorage.getItem(CHAVE); } catch { /* sem armazenamento */ }
  if (t === 'claro' || t === 'escuro') raiz.setAttribute('data-tema', t);
  let m: string | null = null;
  try { m = new URLSearchParams(location.search).get('movimento'); } catch { /* nada */ }
  if (m === 'reduzido' || m === 'normal') raiz.setAttribute('data-movimento', m);
}

const ehEscuro = () => {
  const t = document.documentElement.getAttribute('data-tema');
  if (t) return t === 'escuro';
  return !window.matchMedia('(prefers-color-scheme: light)').matches;
};

export function useTema(): { escuro: boolean; alternar: () => void } {
  const [escuro, setEscuro] = useState(ehEscuro);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const mudou = () => setEscuro(ehEscuro());
    mq.addEventListener?.('change', mudou);
    return () => mq.removeEventListener?.('change', mudou);
  }, []);
  const alternar = useCallback(() => {
    const novo = ehEscuro() ? 'claro' : 'escuro';
    document.documentElement.setAttribute('data-tema', novo);
    try { localStorage.setItem(CHAVE, novo); } catch { /* sem armazenamento: vale só nesta aba */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', '#1C1C1C');
    setEscuro(novo === 'escuro');
  }, []);
  return { escuro, alternar };
}
