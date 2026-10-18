/**
 * As ESCRITAS das telas, por um lugar só (agente AA, P11). Cada ação chama o
 * repositório (que grava no aparelho: SQLite no celular, localStorage na web)
 * e depois limpa o cache de leitura, para a tela que lê ver o dado novo.
 *
 * Regra do app (catálogo de movimento, regra 1): GRAVA ANTES de animar ou de
 * mostrar o aviso rápido. Quem chama espera a promessa (`await`) e só então
 * mostra "Enviado", fecha a folha ou anima.
 *
 * O cache é limpo inteiro depois de cada escrita: no repositório local a
 * leitura é imediata, e uma ação mexe em várias telas (registrar a graduação
 * muda a ficha do aluno, a aba Graduação e o Início do aluno). Quando
 * houver servidor, isto vira uma lista de chaves por ação.
 *
 * O que muda o vínculo (confirmar, recusar, encerrar, pedir, cancelar) também
 * recarrega a sessão: a visão vem do vínculo (dominio/papel.ts).
 */
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Repositorio } from './repositorio';
import { useRepositorio, useSessao } from './ProvedorDeDados';

/** Os métodos de escrita do repositório (as leituras e as gravações síncronas da fila ficam de fora). */
type Escritas = Pick<
  Repositorio,
  | 'criarConta'
  | 'pedirVinculo'
  | 'cancelarPedidoDeVinculo'
  | 'cancelarAula'
  | 'passarAula'
  | 'marcarAtleta'
  | 'salvarGraduacao'
  | 'salvarExame'
  | 'salvarEvento'
  | 'salvarLuta'
  | 'alternarParticipacao'
  | 'definirAparecerEmAtletas'
  | 'salvarDependente'
  | 'salvarInteressado'
  | 'salvarExperimental'
  | 'salvarPerfilDoAluno'
  | 'registrarMedicao'
  | 'salvarPreferenciasDeAviso'
  | 'publicarAviso'
  | 'retirarAviso'
  | 'salvarPerfilProfissional'
  | 'salvarPreferenciasDaEquipe'
  | 'confirmarVinculos'
  | 'recusarVinculo'
  | 'encerrarVinculo'
>;

const MUDAM_A_SESSAO: ReadonlySet<keyof Escritas> = new Set(['pedirVinculo', 'cancelarPedidoDeVinculo', 'confirmarVinculos', 'recusarVinculo', 'encerrarVinculo']);

const NOMES: (keyof Escritas)[] = [
  'criarConta',
  'pedirVinculo',
  'cancelarPedidoDeVinculo',
  'cancelarAula',
  'passarAula',
  'marcarAtleta',
  'salvarGraduacao',
  'salvarExame',
  'salvarEvento',
  'salvarLuta',
  'alternarParticipacao',
  'definirAparecerEmAtletas',
  'salvarDependente',
  'salvarInteressado',
  'salvarExperimental',
  'salvarPerfilDoAluno',
  'registrarMedicao',
  'salvarPreferenciasDeAviso',
  'publicarAviso',
  'retirarAviso',
  'salvarPerfilProfissional',
  'salvarPreferenciasDaEquipe',
  'confirmarVinculos',
  'recusarVinculo',
  'encerrarVinculo',
];

export function useGravar(): Escritas {
  const repo = useRepositorio();
  const cliente = useQueryClient();
  const { recarregar } = useSessao();
  return useMemo(() => {
    const embrulhar = <K extends keyof Escritas>(nome: K): Escritas[K] =>
      (async (...args: unknown[]) => {
        const resultado = await (repo[nome] as (...a: unknown[]) => Promise<unknown>)(...args);
        await cliente.invalidateQueries();
        if (MUDAM_A_SESSAO.has(nome)) recarregar();
        return resultado;
      }) as Escritas[K];
    return Object.fromEntries(NOMES.map((n) => [n, embrulhar(n)])) as unknown as Escritas;
  }, [repo, cliente, recarregar]);
}
