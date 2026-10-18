/**
 * Ação que grava (enviar, criar conta): o segundo toque que chega ANTES de a
 * primeira terminar é ignorado (agente AB, P11). O estado `ocupado` serve ao
 * `carregando` do botão; a trava de verdade é a ref, porque dois toques
 * rápidos chegam antes de a tela redesenhar e veem o mesmo estado.
 */
import { useCallback, useRef, useState } from 'react';

export function useUmPorVez<A extends unknown[]>(acao: (...args: A) => unknown): { executar: (...args: A) => Promise<void>; ocupado: boolean } {
  const emAndamento = useRef(false);
  const ultima = useRef(acao);
  ultima.current = acao;
  const [ocupado, setOcupado] = useState(false);
  const executar = useCallback(async (...args: A) => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setOcupado(true);
    try {
      await ultima.current(...args);
    } finally {
      emAndamento.current = false;
      setOcupado(false);
    }
  }, []);
  return { executar, ocupado };
}
