/**
 * A MECÂNICA da fila de envio (a regra está em dominio/sincronizacao.ts):
 * gravar a presença (o check-in do aluno, a chamada do professor; R15.9) no
 * aparelho e enfileirar; depois, quando houver rede e a sessão certa, subir
 * em ordem, um de cada vez. (Até o P12 era o treino realizado.)
 *
 * - erro de rede: guarda, conta a tentativa e para (tenta de novo depois);
 * - erro de sessão: guarda SEM contar tentativa e pede para entrar de novo;
 * - erro de regra (com a sessão certa): marca `falhou` e mostra ao aluno.
 * Nada é apagado por falha (R1.24, R12.3); sair da conta não apaga a fila.
 */
import type { Id, InstanteISO, RefeicaoRegistrada } from '../dominio/tipos.ts';
import type { Presenca } from '../dominio/presenca/presenca.ts';
import {
  classificarErroDeEnvio,
  enfileirar,
  itensParaEnviar,
  registrarResultado,
  type ErroDeEnvio,
  type ItemDaFila,
  type SessaoAtual,
} from '../dominio/sincronizacao.ts';
import type { ArmazenamentoLocal } from './armazenamento/tipos.ts';

/** O lado do servidor que recebe a fila. O Supabase implementa; o exemplo simula. */
export interface DestinoDaFila {
  enviar(item: ItemDaFila): Promise<void>;
}

/** A coleção do armazenamento onde mora a presença (R15.9). */
export const COLECAO_DE_PRESENCAS = 'presencas';

/** O id do item da fila: um por presença, por tipo e por quem fez (dois aparelhos, duas ações). */
export const idDoItemDaPresenca = (tipo: 'checkin' | 'chamada', presencaId: Id, usuarioId: Id) => `${tipo}:${presencaId}:${usuarioId}`;

/**
 * Grava as presenças e põe na fila, no mesmo passo. Síncrono: o "Estou na
 * aula" e o "Fechar a chamada" gravam ANTES de vibrar e animar.
 * Tudo ou nada (agente AG): o app fechando no meio não deixa presença gravada
 * fora da fila. A mesma presença gravada de novo (desfazer e marcar) atualiza
 * o item pendente, sem duplicar.
 */
export function gravarPresencasEEnfileirar(arm: ArmazenamentoLocal, presencas: readonly Presenca[], tipo: 'checkin' | 'chamada', usuarioId: Id, agora: InstanteISO): ItemDaFila[] {
  const itens = presencas.map((p) => enfileirar({ id: idDoItemDaPresenca(tipo, p.id, usuarioId), tipo, usuarioId, carga: p, criadoEm: agora }));
  return arm.transacao(() => {
    presencas.forEach((p, i) => {
      arm.gravarNaColecao(COLECAO_DE_PRESENCAS, p.id, p);
      arm.gravarItemDaFila(itens[i]!);
    });
    return itens;
  });
}

/** A coleção do armazenamento onde mora a refeição registrada (o treino tem tabela própria). */
export const COLECAO_DE_REFEICOES = 'refeicoes';

/** Grava a refeição registrada e põe na fila, no mesmo passo (R3.6, R1.24). Síncrono. */
export function gravarRefeicaoEEnfileirar(arm: ArmazenamentoLocal, refeicao: RefeicaoRegistrada, usuarioId: Id, agora: InstanteISO): ItemDaFila {
  const item = enfileirar({ id: refeicao.id, tipo: 'refeicao_registrada', usuarioId, carga: refeicao, criadoEm: agora });
  return arm.transacao(() => {
    arm.gravarNaColecao(COLECAO_DE_REFEICOES, refeicao.id, refeicao);
    arm.gravarItemDaFila(item);
    return item;
  });
}

export interface ResultadoDoEnvio {
  enviados: number;
  falharam: number;
  /** Itens de outra conta esperando, por conta (R12.3). */
  esperandoOutraConta: { usuarioId: Id; quantos: number }[];
  precisaEntrar: boolean;
  /** Parou por falta de rede (o resto fica para depois). */
  semRede: boolean;
}

/** A subida em andamento por armazenamento: a segunda chamada espera a primeira (agente AB). */
const subindo = new WeakMap<ArmazenamentoLocal, Promise<ResultadoDoEnvio>>();

/**
 * Sobe a fila. Uma subida por vez no aparelho: quem chama durante outra
 * recebe a mesma promessa (antes, a rede voltando junto com o relógio de 15 s
 * mandava o mesmo treino duas vezes).
 *
 * O item pode MUDAR enquanto sobe (o aluno desfaz o check-in durante o envio;
 * agente AB, com o treino). No fim do envio só se tira da fila e só se marca
 * `sincronizadaEm` se o que está guardado é o MESMO que subiu; senão a versão
 * nova fica na fila e a presença do aparelho não é tocada.
 */
export function enviarFila(arm: ArmazenamentoLocal, destino: DestinoDaFila, sessao: SessaoAtual | null, agora: () => InstanteISO): Promise<ResultadoDoEnvio> {
  const atual = subindo.get(arm);
  if (atual) return atual;
  const promessa = subir(arm, destino, sessao, agora).finally(() => subindo.delete(arm));
  subindo.set(arm, promessa);
  return promessa;
}

const mesmaCarga = (a: ItemDaFila, b: ItemDaFila) => JSON.stringify(a.carga) === JSON.stringify(b.carga);

async function subir(arm: ArmazenamentoLocal, destino: DestinoDaFila, sessao: SessaoAtual | null, agora: () => InstanteISO): Promise<ResultadoDoEnvio> {
  const plano = itensParaEnviar(arm.fila(), sessao);
  const resultado: ResultadoDoEnvio = { enviados: 0, falharam: 0, esperandoOutraConta: plano.esperandoOutraConta, precisaEntrar: plano.precisaEntrar, semRede: false };
  for (const item of plano.enviar) {
    try {
      await destino.enviar(item);
    } catch (e) {
      const erro = lerErro(e);
      const classe = classificarErroDeEnvio(erro, item, sessao);
      // a tentativa conta na versão GUARDADA (pode ter mudado durante o envio); se saiu da fila, não volta
      const guardado = arm.itemDaFila(item.id);
      if (guardado) {
        try {
          arm.gravarItemDaFila(registrarResultado(guardado, classe, erro));
        } catch {
          // o aparelho não gravou a contagem da tentativa: o item continua na fila como estava
        }
      }
      if (classe === 'rede') {
        resultado.semRede = true;
        break;
      }
      if (classe === 'sessao') {
        resultado.precisaEntrar = true;
        break;
      }
      resultado.falharam += 1;
      continue;
    }
    // Subiu. O fim do envio é uma transação (agente AG): tirar da fila e marcar "sincronizado" vão juntos.
    // Se o aparelho não gravar agora, o item continua na fila e sobe de novo (o servidor recebe pelo id; repetir não duplica).
    try {
      arm.transacao(() => concluirEnvio(arm, item, agora));
      resultado.enviados += 1;
    } catch {
      // o aparelho parou de gravar (disco cheio): para aqui, em vez de subir o resto e não conseguir anotar
      resultado.falharam += 1;
      break;
    }
  }
  return resultado;
}

function concluirEnvio(arm: ArmazenamentoLocal, item: ItemDaFila, agora: () => InstanteISO): void {
  const guardado = arm.itemDaFila(item.id);
  const mudou = !!guardado && !mesmaCarga(guardado, item);
  if (!mudou) arm.removerItemDaFila(item.id);
  if (item.tipo === 'checkin' || item.tipo === 'chamada') {
    // só marca se a presença guardada ainda é a que subiu (outra ação depois dela fica para a próxima subida)
    const p = item.carga as Presenca;
    const guardada = arm.registroDaColecao(COLECAO_DE_PRESENCAS, p.id) as Presenca | null;
    if (!mudou && guardada && guardada.atualizadaEm === p.atualizadaEm && guardada.estado === p.estado) arm.gravarNaColecao(COLECAO_DE_PRESENCAS, p.id, { ...guardada, sincronizadaEm: agora() });
  } else if (item.tipo === 'refeicao_registrada') {
    // só marca se a refeição ainda existe; se o aluno desmarcou ENQUANTO subia, ela chegou ao servidor e precisa de um "apagar"
    const v = arm.registroDaColecao(COLECAO_DE_REFEICOES, item.id);
    const ainda = v !== null && !apagadoNaColecao(v);
    if (ainda && !mudou) arm.gravarNaColecao(COLECAO_DE_REFEICOES, item.id, { ...(item.carga as RefeicaoRegistrada), sincronizadoEm: agora() });
    else if (!ainda && !guardado) enfileirarApagarRefeicao(arm, item.carga as RefeicaoRegistrada, item.usuarioId, agora());
  }
}

/** A marca de "apagado" do repositório local numa coleção. */
const apagadoNaColecao = (v: unknown) => typeof v === 'object' && v !== null && (v as { __apagado?: boolean }).__apagado === true;

/** Põe na fila o "apagar" de uma refeição que já está (ou pode estar) no servidor. */
export function enfileirarApagarRefeicao(arm: ArmazenamentoLocal, refeicao: RefeicaoRegistrada, usuarioId: Id, agora: InstanteISO): ItemDaFila {
  const item = enfileirar({ id: `${refeicao.id}:apagar`, tipo: 'refeicao_apagada', usuarioId, carga: refeicao, criadoEm: agora });
  arm.gravarItemDaFila(item);
  return item;
}

/**
 * "Desmarcar" do lado da fila (agente AB, pendência do AA): a marca que ainda
 * não subiu só sai da fila; a que já subiu vira um "apagar" na fila. A marca
 * que está subindo AGORA também sai da fila (ela ainda está lá durante o
 * envio), e o fim do envio, que não a acha mais, põe o "apagar".
 */
export function tirarRefeicaoDaFila(arm: ArmazenamentoLocal, refeicao: RefeicaoRegistrada, usuarioId: Id, agora: InstanteISO): void {
  const naFila = arm.itemDaFila(refeicao.id);
  if (naFila) {
    arm.removerItemDaFila(refeicao.id);
    return;
  }
  enfileirarApagarRefeicao(arm, refeicao, usuarioId, agora);
}

/** Só status e código saem daqui (a mensagem pode repetir a linha recusada). */
function lerErro(e: unknown): ErroDeEnvio {
  if (e && typeof e === 'object') {
    const x = e as { status?: unknown; code?: unknown; codigo?: unknown };
    return {
      status: typeof x.status === 'number' ? x.status : undefined,
      codigo: typeof x.code === 'string' ? x.code : typeof x.codigo === 'string' ? x.codigo : undefined,
    };
  }
  return {};
}

export function pendentesDe(arm: ArmazenamentoLocal, usuarioId: Id): ItemDaFila[] {
  return arm.fila().filter((i) => i.usuarioId === usuarioId && i.estado === 'pendente');
}
