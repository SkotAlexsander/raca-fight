/**
 * O "hoje" que vira à meia-noite (AO, 16/10). Antes o Admin lia o dia uma
 * vez, ao abrir: o app instalado no PC, aberto de um dia para o outro,
 * continuava no dia de ontem (lembrete de hoje como "em breve", cobrança que
 * venceu ontem como "vence hoje"). Agora confere a cada minuto e quando a
 * janela volta a ter foco. `?hoje=AAAA-MM-DD` continua fixando o dia.
 */

import { useEffect, useState } from 'react';
import type { DataISO } from '@dominio/tipos.ts';
import { hojeNaAcademia } from '../util/relogio.ts';

export function useHoje(): DataISO {
  const [hoje, setHoje] = useState<DataISO>(() => hojeNaAcademia());
  useEffect(() => {
    // o mesmo texto não redesenha nada (o React compara o valor)
    const conferir = () => setHoje(hojeNaAcademia());
    const t = setInterval(conferir, 60_000);
    addEventListener('focus', conferir);
    document.addEventListener('visibilitychange', conferir);
    return () => {
      clearInterval(t);
      removeEventListener('focus', conferir);
      document.removeEventListener('visibilitychange', conferir);
    };
  }, []);
  return hoje;
}
