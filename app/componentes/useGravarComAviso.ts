/**
 * O padrão de GRAVAÇÃO das telas (agente AG, P11).
 *
 *   const salvarPeso = useGravarComAviso(gravar.registrarMedicao);
 *   const r = await salvarPeso.gravar(medicao);
 *   if (r.ok) fecharAFolha();
 *
 * - Grava (síncrono ou promessa). Deu certo: devolve `{ ok: true, valor }`.
 * - Não deu: mostra o aviso rápido de erro ("Não deu para salvar." ou o texto
 *   do tipo do erro, `textoDoErroDeGravacao`) com "Tentar de novo", que grava
 *   OUTRA VEZ com os mesmos argumentos — o que a pessoa digitou não se perde.
 *   Devolve `{ ok: false, erro }`; nunca rejeita (nada de promessa solta).
 * - Um por vez: o segundo toque durante a gravação é ignorado (como o
 *   `useUmPorVez`); `ocupado` serve ao `carregando` do botão. Para gravação
 *   de fundo (chaves, a série, o treino editado), `{ umPorVez: false }`: cada
 *   chamada grava, nenhuma é descartada.
 *
 * O que sobe ao servidor (treino realizado, refeição) a FILA guarda; o que
 * falha aqui é o aparelho não ter gravado (disco cheio, banco travado) ou a
 * ação que precisa de sinal. O texto nunca repete o conteúdo (R6.2).
 */
import { useCallback, useRef, useState } from 'react';
import { textoDoErroDeGravacao } from '@/dados/erros';
import { useAvisoRapido } from './AvisoRapido';

export type ResultadoDaGravacao<R> = { ok: true; valor: R } | { ok: false; erro?: unknown };

export function useGravarComAviso<A extends unknown[], R>(
  acao: (...args: A) => R | Promise<R>,
  opcoes: { textoDoErro?: (erro: unknown) => string; umPorVez?: boolean } = {},
): { gravar: (...args: A) => Promise<ResultadoDaGravacao<R>>; ocupado: boolean } {
  const aviso = useAvisoRapido();
  const [ocupado, setOcupado] = useState(false);
  const emAndamento = useRef(false);
  // a ação e o texto MAIS RECENTES (o "Tentar de novo" de um aviso antigo não grava com a função velha)
  const ultima = useRef({ acao, opcoes });
  ultima.current = { acao, opcoes };

  const gravar = useCallback(
    async (...args: A): Promise<ResultadoDaGravacao<R>> => {
      // gravação de fundo (chave, série) passa `umPorVez: false`: a segunda NÃO pode ser descartada
      if (emAndamento.current && ultima.current.opcoes.umPorVez !== false) return { ok: false };
      emAndamento.current = true;
      setOcupado(true);
      try {
        const valor = await ultima.current.acao(...args);
        return { ok: true, valor };
      } catch (erro) {
        const texto = (ultima.current.opcoes.textoDoErro ?? textoDoErroDeGravacao)(erro);
        aviso.mostrar({ tipo: 'erro', texto, acao: { rotulo: 'Tentar de novo', aoTocar: () => void gravar(...args) } });
        return { ok: false, erro };
      } finally {
        emAndamento.current = false;
        setOcupado(false);
      }
    },
    [aviso],
  );

  return { gravar, ocupado };
}
