/**
 * Um envio por vez (AO, 16/10): o botão que grava dinheiro ("Confirmar
 * pagamento", "Gravar as 8 linhas", "Fechar o mês", "Gravar 40 linhas" da
 * importação) não pode rodar duas vezes com o duplo clique. O segundo clique,
 * enquanto o primeiro ainda grava, é ignorado; `enviando` desliga o botão.
 *
 * A trava é um `ref` (vale no mesmo instante, antes da tela redesenhar), e o
 * estado só serve para a tela mostrar.
 */

import { useCallback, useRef, useState } from 'react';

export function useEnvio(): { enviando: boolean; enviar: <R>(fazer: () => Promise<R>) => Promise<R | undefined> } {
  const trava = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const enviar = useCallback(async <R,>(fazer: () => Promise<R>): Promise<R | undefined> => {
    if (trava.current) return undefined;
    trava.current = true;
    setEnviando(true);
    try {
      return await fazer();
    } finally {
      trava.current = false;
      setEnviando(false);
    }
  }, []);
  return { enviando, enviar };
}
