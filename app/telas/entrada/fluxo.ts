/**
 * O caminho da entrada enquanto a pessoa ainda não entrou (F13): a porta
 * escolhida, a conta nova (simulada), a academia achada pelo código, as duas
 * perguntas opcionais e o pedido para a equipe.
 *
 * Este é só o rascunho do caminho, na memória: as respostas valem quando o
 * caminho FECHA, e aí são GRAVADAS pelo repositório (agente AA, P11): a conta
 * nova (`criarConta`), o vínculo pedido (`pedirVinculo`) e as respostas
 * (`salvarPerfilDoAluno`). A conta só "entra" (`useSessao().entrar`) no fim,
 * porque o layout `(entrada)` manda para a visão assim que existe sessão.
 */
import { useSyncExternalStore } from 'react';
import type { Academia, ChaveDoObjetivo, Id } from '@/dominio/tipos';

export type Porta = 'aluno' | 'academia';
/** O papel que a pessoa diz ter (mockup `entrada.html`, C3): o dono confirma ou ajusta no Admin. */
export type PapelPedido = 'recepcao' | 'professor';

export interface EstadoDaEntrada {
  porta: Porta;
  /** Nome e e-mail da conta nova (criar conta por e-mail). */
  contaNova: { nome: string; email: string } | null;
  /** Academia achada pelo código dos alunos (R8.1). */
  academia: Academia | null;
  objetivo: ChaveDoObjetivo | null;
  dias: number | null;
  autorizaAcademia: boolean;
  /** Pedido para a equipe (F13.4): academia, papel esperado e quando. */
  pedidoDaEquipe: { academia: Academia; papel: PapelPedido; em: Date; usuarioId: Id; vinculoId: Id } | null;
  /** A abertura animada já passou nesta abertura do app. */
  aberturaVista: boolean;
}

const INICIAL: EstadoDaEntrada = {
  porta: 'aluno',
  contaNova: null,
  academia: null,
  objetivo: null,
  dias: null,
  autorizaAcademia: true,
  pedidoDaEquipe: null,
  aberturaVista: false,
};

let estado: EstadoDaEntrada = INICIAL;
const ouvintes = new Set<() => void>();

export function mudarEntrada(mudancas: Partial<EstadoDaEntrada>) {
  estado = { ...estado, ...mudancas };
  ouvintes.forEach((o) => o());
}

/** Recomeça o caminho (mantém só a abertura já vista). */
export function recomecarEntrada(porta: Porta) {
  estado = { ...INICIAL, porta, aberturaVista: estado.aberturaVista };
  ouvintes.forEach((o) => o());
}

export function lerEntrada() {
  return estado;
}

export function useEntrada(): EstadoDaEntrada {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
    () => estado,
    () => estado,
  );
}
