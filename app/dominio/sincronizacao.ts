/**
 * Fila de envio offline: o que entra, em que ordem sobe, de quem é cada item
 * e como se lê o erro. A mecânica (SQLite, NetInfo, chamar o Supabase) fica em
 * `dados/fila/`; a regra fica aqui (`02-ESTRUTURA-DO-CODIGO.md`).
 * Regras: R1.24 (nunca se perde um registro feito sem sinal) e R12.3 (sessão
 * vencida não perde nada). Testado em `revisao-t-p10.test.ts`.
 *
 * Luta (P12, R15.9, agente AM2): o treino realizado saiu; entram o CHECK-IN do
 * aluno e a CHAMADA do professor, as duas com a carga `Presenca`. O dono do
 * item é quem fez a última ação (`atualizadaPorId`): o aluno, o responsável
 * pelo dependente ou o professor.
 *
 * Revisão T (P10): a arquitetura (`03-DECISOES-TECNICAS.md`, seção 2) tinha a
 * fila sem o DONO de cada item e lia toda recusa da RLS como "erro de regra →
 * falhou". Com o token vencido sem sinal, o cliente do Supabase sai da sessão
 * e o envio vai como anônimo: a RLS recusa (42501) e o treino do porão virava
 * "falhou". Com outra conta no aparelho, o treino de Ana subia na conta de Bia
 * (e a RLS recusava, de novo "falhou"). Agora cada item tem `usuarioId`, só
 * sobe com a sessão VÁLIDA daquela conta, e recusa fora dela é "entrar de novo".
 */

import type { Id, InstanteISO, RefeicaoRegistrada } from './tipos.ts';
import type { Presenca } from './presenca/presenca.ts';

export { resolverPresenca } from './presenca/presenca.ts';

/**
 * O que entra na fila (03-DECISOES, seção 2, com a luta):
 * - `checkin`: o "Estou na aula" (e o desfazer) do aluno ou do responsável;
 * - `chamada`: o que o professor (ou a recepção) confirmou ou retirou;
 * - `refeicao_registrada` / `refeicao_apagada`: a marca da dieta (que está
 *   DESLIGADA na v1, L13, mas a mecânica fica pronta). `refeicao_apagada`
 *   (agente AB, P11) é "desmarcar" uma refeição que JÁ subiu.
 */
export type TipoDeItemDaFila = 'checkin' | 'chamada' | 'refeicao_registrada' | 'refeicao_apagada';

export type CargaDaFila = Presenca | RefeicaoRegistrada;

const ehPresenca = (tipo: TipoDeItemDaFila) => tipo === 'checkin' || tipo === 'chamada';

/** Quem é dono do registro: na presença, quem fez a última ação; na refeição, o aluno. */
export function donoDaCarga(tipo: TipoDeItemDaFila, carga: CargaDaFila): Id {
  return ehPresenca(tipo) ? (carga as Presenca).atualizadaPorId : (carga as RefeicaoRegistrada).alunoId;
}

export type EstadoDoItemDaFila = 'pendente' | 'falhou';

export interface ItemDaFila {
  id: Id;
  tipo: TipoDeItemDaFila;
  /** R12.3: a conta de quem registrou. A fila só sobe com a sessão dela. */
  usuarioId: Id;
  carga: CargaDaFila;
  criadoEm: InstanteISO;
  tentativas: number;
  estado: EstadoDoItemDaFila;
  /** Só status e código do último erro ("400 23514"), para a tela e o suporte. Nunca o conteúdo. */
  ultimoErro?: string;
}

/** A sessão do aparelho agora. `valida = false`: o token venceu e não renovou. */
export interface SessaoAtual {
  usuarioId: Id;
  valida: boolean;
}

const msDe = (instante: InstanteISO, nome: string): number => {
  const ms = Date.parse(instante);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instante) || Number.isNaN(ms)) {
    throw new RangeError(`${nome} precisa ser um instante ISO com fuso; veio ${String(instante)}`);
  }
  return ms;
};

/**
 * Cria o item da fila. A conta que registra tem de ser a dona do dado
 * (`donoDaCarga`), senão a RLS recusaria depois e o registro se perderia.
 */
export function enfileirar(dados: {
  id: Id;
  tipo: TipoDeItemDaFila;
  usuarioId: Id;
  carga: CargaDaFila;
  criadoEm: InstanteISO;
}): ItemDaFila {
  if (typeof dados.usuarioId !== 'string' || dados.usuarioId.trim() === '') {
    throw new RangeError('usuarioId é obrigatório em cada item da fila (R12.3)');
  }
  const dono = donoDaCarga(dados.tipo, dados.carga);
  if (dono !== dados.usuarioId) {
    throw new Error(`o item da fila é de "${dados.usuarioId}", mas o dono do registro é "${dono}"`);
  }
  msDe(dados.criadoEm, 'criadoEm');
  return { ...dados, tentativas: 0, estado: 'pendente' };
}

export interface PlanoDeEnvio {
  /** O que sobe agora, em ordem. */
  enviar: ItemDaFila[];
  /** R12.3: "Há 2 presenças de Ana esperando. Entre com essa conta para enviar." */
  esperandoOutraConta: { usuarioId: Id; quantos: number }[];
  /** Há item pendente e a sessão está vencida ou ausente: a tela pede para entrar de novo. */
  precisaEntrar: boolean;
}

/** A refeição de um dia (uma marca por aluno, refeição e data). */
const chaveDaMarca = (i: ItemDaFila): string | null => {
  if (i.tipo !== 'refeicao_registrada' && i.tipo !== 'refeicao_apagada') return null;
  const c = i.carga as Partial<RefeicaoRegistrada>;
  return `${c.alunoId}|${c.refeicaoId}|${c.data}`;
};

/**
 * Decide o que sobe com a sessão de agora. Nunca apaga nada: o item que não
 * sobe fica na fila. Ordem: a de registro, pelo instante.
 *
 * Revisão AG (P11):
 * - item com o instante estragado (arquivo mexido, versão antiga) vai para o
 *   FIM, em vez de lançar erro e travar a fila inteira;
 * - o "apagar" de uma marca de refeição sobe ANTES da marca nova da mesma
 *   refeição e data, mesmo que o relógio tenha voltado entre os dois: os dois
 *   só convivem na fila quando o "apagar" é da marca ANTIGA (a marca pendente
 *   desmarcada sai da fila sem "apagar").
 */
export function itensParaEnviar(fila: readonly ItemDaFila[], sessao: SessaoAtual | null): PlanoDeEnvio {
  const comInstante = fila
    .filter((i) => i.estado === 'pendente')
    .map((i) => {
      const ms = Date.parse(i.criadoEm);
      return { i, ms: /(Z|[+-]\d{2}:\d{2})$/.test(String(i.criadoEm)) && !Number.isNaN(ms) ? ms : Infinity };
    });
  // o apagar nunca sobe depois de uma marca nova da mesma refeição e data
  const primeiraMarca = new Map<string, number>();
  for (const x of comInstante) {
    const k = x.i.tipo === 'refeicao_registrada' ? chaveDaMarca(x.i) : null;
    if (k !== null) primeiraMarca.set(k, Math.min(primeiraMarca.get(k) ?? Infinity, x.ms));
  }
  const pendentes = comInstante
    .map((x) => {
      const k = x.i.tipo === 'refeicao_apagada' ? chaveDaMarca(x.i) : null;
      const antesDe = k === null ? undefined : primeiraMarca.get(k);
      return { ...x, ms: antesDe !== undefined && antesDe < x.ms ? antesDe : x.ms, apagar: x.i.tipo === 'refeicao_apagada' ? 0 : 1 };
    })
    .sort((a, b) => (a.ms === b.ms ? a.apagar - b.apagar : a.ms < b.ms ? -1 : 1))
    .map((x) => x.i);
  const valida = sessao !== null && sessao.valida;
  const enviar = valida ? pendentes.filter((i) => i.usuarioId === sessao.usuarioId) : [];
  const vaiAgora = new Set(enviar);
  const esperando = new Map<Id, number>();
  for (const i of pendentes) {
    if (!vaiAgora.has(i)) esperando.set(i.usuarioId, (esperando.get(i.usuarioId) ?? 0) + 1);
  }
  return {
    enviar,
    esperandoOutraConta: [...esperando].map(([usuarioId, quantos]) => ({ usuarioId, quantos })),
    precisaEntrar: !valida && pendentes.length > 0,
  };
}

/**
 * O erro que o envio devolveu (do PostgREST/Supabase). `mensagem` e `detalhe`
 * podem trazer a LINHA recusada ("Failing row contains (…, 72450, …)"), com
 * peso, motivo ou recado: nunca são guardados nem logados (revisão T, S2).
 */
export interface ErroDeEnvio {
  status?: number;
  codigo?: string;
  mensagem?: string;
  detalhe?: string;
}

/**
 * - `rede`: sem resposta, tempo esgotado, servidor fora ou limite (408, 429, 5xx): tenta depois;
 * - `sessao`: token vencido (401, PGRST301/PGRST303) OU a sessão não é a do item: guarda e pede para entrar;
 * - `regra`: com a sessão CERTA, o servidor recusou (RLS, check): marca `falhou` e mostra ao aluno.
 */
export type ClasseDoErro = 'rede' | 'sessao' | 'regra';

export function classificarErroDeEnvio(erro: ErroDeEnvio, item: ItemDaFila, sessao: SessaoAtual | null): ClasseDoErro {
  const status = erro.status ?? 0;
  if (status === 0 || status === 408 || status === 429 || status >= 500) return 'rede';
  if (status === 401 || erro.codigo === 'PGRST301' || erro.codigo === 'PGRST303') return 'sessao';
  if (sessao === null || !sessao.valida || sessao.usuarioId !== item.usuarioId) return 'sessao';
  return 'regra';
}

/** Status e código, e nada mais: a mensagem do Postgres pode repetir a linha recusada. */
function resumoDoErro(erro: ErroDeEnvio): string {
  const partes = [erro.status, erro.codigo].filter((x) => x !== undefined && x !== 0 && x !== '');
  return partes.length === 0 ? 'sem resposta' : partes.join(' ');
}

/** Registra o resultado de uma tentativa. Devolve o item novo (ou o mesmo, se nada muda). */
export function registrarResultado(item: ItemDaFila, classe: ClasseDoErro, erro: ErroDeEnvio): ItemDaFila {
  if (classe === 'sessao') return item;
  const ultimoErro = resumoDoErro(erro);
  if (classe === 'rede') return { ...item, tentativas: item.tentativas + 1, ultimoErro };
  return { ...item, tentativas: item.tentativas + 1, estado: 'falhou', ultimoErro };
}
