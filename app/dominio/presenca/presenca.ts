/**
 * Presença e check-in (regras R15.1 a R15.14).
 *
 * - O aluno diz "Estou na aula" dentro da JANELA (R15.2): a presença nasce
 *   `pendente`. A janela é parâmetro da academia; a proposta (L7) é de 30 min
 *   antes a 30 min depois do início.
 * - A CHAMADA do professor (R15.4) confirma o que está marcado e retira o
 *   check-in desmarcado ("não estava na aula"). Quem veio sem celular entra
 *   pela chamada, já confirmado.
 * - Chamada esquecida (R15.5): o pendente às 23:59 do dia da aula (no fuso da
 *   academia) confirma sozinho, com a marca "sem chamada". A conta é feita na
 *   leitura (`confirmarSemChamada`), sem tarefa agendada: o aluno nunca perde a
 *   presença porque ninguém fechou a chamada, e o servidor pode gravar igual.
 * - Uma presença por aluno por aula (R15.6): o id é `aula|aluno`.
 * - Sem sinal (R15.9): tudo isto é dado puro que entra na fila; no servidor,
 *   a ação da EQUIPE vence o check-in, e entre duas da equipe vale a mais
 *   recente (`resolverPresenca`).
 * - Nada aqui é dado de saúde, mas é pessoal (R15.13): nunca em log.
 */
import type { DataISO, Id, InstanteISO } from '../tipos.ts';
import { dataNoFuso, diasEntre, msNoFuso, escreverHora, somarDias } from '../turmas/horario.ts';
import { aulasDoDia, type AjusteDeAula, type Aula, type Turma } from '../turmas/turmas.ts';

export type OrigemDaPresenca = 'checkin' | 'chamada' | 'recepcao' | 'experimental' | 'correcao';
export type EstadoDaPresenca = 'pendente' | 'confirmada' | 'retirada';
export type MotivoDaRetirada = 'nao_estava' | 'aula_cancelada' | 'desfeito_pelo_aluno' | 'correcao';

export const TEXTO_DO_MOTIVO_DA_RETIRADA: Readonly<Record<MotivoDaRetirada, string>> = {
  nao_estava: 'Não estava na aula',
  aula_cancelada: 'Aula cancelada',
  desfeito_pelo_aluno: 'Check-in desfeito',
  correcao: 'Corrigido pela equipe',
};

/** Quem fez a última ação (o "sistema" é a confirmação sozinha das 23:59). */
export const SISTEMA = 'sistema';

export interface Presenca {
  /** `aula|aluno` (R15.6). */
  id: Id;
  academiaId: Id;
  aulaId: Id;
  turmaId: Id;
  /** A data da aula, no calendário da academia. */
  data: DataISO;
  /** O aluno, ou o dependente (criança sem conta, R20.1). */
  alunoId: Id;
  modalidadeId: Id;
  origem: OrigemDaPresenca;
  estado: EstadoDaPresenca;
  registradaEm: InstanteISO;
  registradaPorId: Id;
  /** A última ação: quem e quando. É o dono do item na fila (R12.3). */
  atualizadaEm: InstanteISO;
  atualizadaPorId: Id;
  /** A última ação foi da equipe (professor, substituto, recepção, dono). */
  pelaEquipe: boolean;
  /** Confirmada sozinha às 23:59 (R15.5). */
  semChamada?: boolean;
  motivoDaRetirada?: MotivoDaRetirada;
  /** Presença de aula experimental (R19.5). */
  experimentalId?: Id;
  /** Quando o servidor recebeu (a fila marca). Ausente = ainda só no aparelho ("aguardando sinal"). */
  sincronizadaEm?: InstanteISO;
}

export interface JanelaDeCheckin {
  minutosAntes: number;
  minutosDepois: number;
}

/** A proposta do AJ para a janela (L7, [decidir]): a academia confirma ou muda no Admin. */
export const JANELA_PROPOSTA_L7: Readonly<JanelaDeCheckin> = { minutosAntes: 30, minutosDepois: 30 };

/** R15.5 e R15.8: até quantos dias a equipe corrige ou lança uma presença. */
export const DIAS_PARA_CORRIGIR = 7;

/** R15.10: "aluno ativo" teve presença confirmada nos últimos 30 dias. */
export const DIAS_PARA_ATIVO = 30;

/** R15.12: sumido sem presença há 14 dias; o novo (até 90 dias de vínculo), há 7. */
export const DIAS_PARA_SUMIR = 14;
export const DIAS_PARA_SUMIR_NOVO = 7;
export const DIAS_DE_ALUNO_NOVO = 90;

export const idDaPresenca = (aulaId: Id, alunoId: Id): Id => `${aulaId}|${alunoId}`;

export type CodigoDoErroDePresenca = 'fora_da_janela' | 'aula_cancelada' | 'ja_marcada' | 'retirada_pela_equipe' | 'nao_pode_desfazer' | 'fora_do_prazo' | 'aula_futura';

export class ErroDePresenca extends Error {
  readonly codigo: CodigoDoErroDePresenca;
  constructor(codigo: CodigoDoErroDePresenca, mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
  }
}

// ---------------------------------------------------------------------------
// A janela do check-in
// ---------------------------------------------------------------------------

export type SituacaoDaJanela =
  | { tipo: 'antes'; abreEmMs: number; abreAs: string }
  | { tipo: 'aberta'; fechaEmMs: number; fechaAs: string }
  | { tipo: 'fechada' };

/** R15.2: antes da janela o botão não aparece (a tela diz "Abre às 19:30"); depois, também não. */
export function janelaDoCheckin(aula: Pick<Aula, 'inicioMs' | 'hora' | 'cancelada'>, agoraMs: number, janela: JanelaDeCheckin): SituacaoDaJanela {
  if (aula.cancelada) return { tipo: 'fechada' };
  const abre = aula.inicioMs - janela.minutosAntes * 60_000;
  const fecha = aula.inicioMs + janela.minutosDepois * 60_000;
  const [h, m] = aula.hora.split(':').map(Number) as [number, number];
  const minutos = h * 60 + m;
  if (agoraMs < abre) return { tipo: 'antes', abreEmMs: abre, abreAs: escreverHora(minutos - janela.minutosAntes) };
  if (agoraMs <= fecha) return { tipo: 'aberta', fechaEmMs: fecha, fechaAs: escreverHora(minutos + janela.minutosDepois) };
  return { tipo: 'fechada' };
}

// ---------------------------------------------------------------------------
// Check-in do aluno (ou do responsável pelo dependente, R15.3)
// ---------------------------------------------------------------------------

export interface PedidoDeCheckin {
  aula: Aula;
  alunoId: Id;
  modalidadeId: Id;
  /** Quem toca: o próprio aluno ou o responsável. */
  porId: Id;
  agoraMs: number;
  em: InstanteISO;
  janela: JanelaDeCheckin;
  /** A presença que já existe nesta aula para este aluno, se houver. */
  existente?: Presenca | null;
}

export function fazerCheckin(p: PedidoDeCheckin): Presenca {
  if (p.aula.cancelada) throw new ErroDePresenca('aula_cancelada', 'Esta aula foi cancelada.');
  const j = janelaDoCheckin(p.aula, p.agoraMs, p.janela);
  if (j.tipo === 'antes') throw new ErroDePresenca('fora_da_janela', `O check-in abre às ${j.abreAs}.`);
  if (j.tipo === 'fechada') throw new ErroDePresenca('fora_da_janela', 'O check-in desta aula já fechou.');
  const ex = p.existente;
  if (ex && ex.estado !== 'retirada') throw new ErroDePresenca('ja_marcada', 'Você já está nesta aula.');
  if (ex && ex.estado === 'retirada' && ex.pelaEquipe) throw new ErroDePresenca('retirada_pela_equipe', 'O professor tirou esta presença. Fale com ele.');
  return {
    id: idDaPresenca(p.aula.id, p.alunoId),
    academiaId: p.aula.academiaId,
    aulaId: p.aula.id,
    turmaId: p.aula.turmaId,
    data: p.aula.data,
    alunoId: p.alunoId,
    modalidadeId: p.modalidadeId,
    origem: 'checkin',
    estado: 'pendente',
    registradaEm: ex?.registradaEm ?? p.em,
    registradaPorId: ex?.registradaPorId ?? p.porId,
    atualizadaEm: p.em,
    atualizadaPorId: p.porId,
    pelaEquipe: false,
  };
}

/** "Desfazer": só o check-in ainda pendente, que ninguém da equipe mexeu. */
export function desfazerCheckin(p: Presenca, porId: Id, em: InstanteISO): Presenca {
  if (p.estado !== 'pendente' || p.pelaEquipe || p.origem !== 'checkin') throw new ErroDePresenca('nao_pode_desfazer', 'Esta presença já foi confirmada pela equipe.');
  return { ...p, estado: 'retirada', motivoDaRetirada: 'desfeito_pelo_aluno', atualizadaEm: em, atualizadaPorId: porId, pelaEquipe: false };
}

// ---------------------------------------------------------------------------
// Chamada esquecida (R15.5)
// ---------------------------------------------------------------------------

/** O pendente às 23:59 do dia da aula vira confirmado, "sem chamada". */
export function confirmarSemChamada(p: Presenca, agoraMs: number, fuso: string): Presenca {
  if (p.estado !== 'pendente') return p;
  const limite = msNoFuso(p.data, '23:59', fuso);
  if (agoraMs < limite) return p;
  return { ...p, estado: 'confirmada', semChamada: true, atualizadaEm: p.atualizadaEm, atualizadaPorId: p.atualizadaPorId };
}

/** A lista como a tela deve ler, com as confirmações sozinhas já aplicadas. */
export function presencasEmDia(presencas: readonly Presenca[], agoraMs: number, fuso: string): Presenca[] {
  return presencas.map((p) => confirmarSemChamada(p, agoraMs, fuso));
}

// ---------------------------------------------------------------------------
// A chamada do professor (R15.4)
// ---------------------------------------------------------------------------

/** As que ainda contam numa aula (pendentes e confirmadas). */
export const contamNaAula = (p: Presenca) => p.estado !== 'retirada';

/**
 * Quantos estão na aula AGORA (pendentes + confirmadas): o MESMO número no
 * Hoje do professor e na Chamada (achado do AS: o Hoje dizia 9 e a chamada 4).
 */
export function contarNaAula(aulaId: Id, presencas: readonly Presenca[]): number {
  return presencas.filter((p) => p.aulaId === aulaId && contamNaAula(p)).length;
}

export interface ExperimentalNaChamada {
  experimentalId: Id;
  /** Só o primeiro nome (R19.5: o professor não vê o WhatsApp). */
  nome: string;
  modalidadeId: Id;
}

export interface GruposDaChamada {
  /** Fizeram check-in (pendente ou já confirmado). */
  checkins: Presenca[];
  /** Da turma, sem presença nesta aula (ou com o check-in desfeito pelo aluno). */
  daTurmaSemCheckin: Id[];
  experimentais: ExperimentalNaChamada[];
  /** Retiradas pela equipe (aparecem riscadas, para desfazer). */
  retiradas: Presenca[];
}

export function montarChamada(aulaId: Id, presencas: readonly Presenca[], alunosDaTurma: readonly Id[], experimentais: readonly ExperimentalNaChamada[] = []): GruposDaChamada {
  const daAula = presencas.filter((p) => p.aulaId === aulaId && !p.experimentalId);
  const checkins = daAula.filter(contamNaAula);
  const comPresenca = new Set(checkins.map((p) => p.alunoId));
  const retiradas = daAula.filter((p) => p.estado === 'retirada' && p.pelaEquipe);
  const retiradosPelaEquipe = new Set(retiradas.map((p) => p.alunoId));
  return {
    checkins,
    daTurmaSemCheckin: alunosDaTurma.filter((a) => !comPresenca.has(a) && !retiradosPelaEquipe.has(a)),
    experimentais: [...experimentais],
    retiradas,
  };
}

export interface FechamentoDaChamada {
  aula: Aula;
  presencas: readonly Presenca[];
  /** Os alunos marcados na tela (check de mola). */
  presentes: ReadonlySet<Id>;
  /** A modalidade de quem entra pela chamada (o professor pode trocar, R15.6). */
  modalidadeDe: (alunoId: Id) => Id;
  porId: Id;
  em: InstanteISO;
}

export interface ResultadoDaChamada {
  /** As presenças que mudaram ou nasceram (vão para a fila). */
  mudadas: Presenca[];
  presentes: number;
  retirados: number;
}

/**
 * "Fechar a chamada": confirma o marcado; o check-in desmarcado vira
 * `retirada` ("não estava na aula"); quem foi marcado sem check-in nasce
 * `confirmada` com a origem `chamada`. A presença de experimental fica fora
 * (é a recepção quem fecha a experimental, R19.5).
 */
export function fecharChamada(f: FechamentoDaChamada): ResultadoDaChamada {
  const daAula = f.presencas.filter((p) => p.aulaId === f.aula.id && !p.experimentalId);
  const porAluno = new Map(daAula.map((p) => [p.alunoId, p]));
  const mudadas: Presenca[] = [];
  let retirados = 0;
  for (const p of daAula) {
    if (!contamNaAula(p)) continue;
    if (f.presentes.has(p.alunoId)) {
      if (p.estado !== 'confirmada' || !p.pelaEquipe) mudadas.push({ ...p, estado: 'confirmada', semChamada: false, pelaEquipe: true, atualizadaEm: f.em, atualizadaPorId: f.porId });
    } else {
      retirados += 1;
      mudadas.push({ ...p, estado: 'retirada', motivoDaRetirada: 'nao_estava', pelaEquipe: true, atualizadaEm: f.em, atualizadaPorId: f.porId });
    }
  }
  for (const alunoId of f.presentes) {
    const ex = porAluno.get(alunoId);
    if (ex && contamNaAula(ex)) continue;
    mudadas.push({
      id: idDaPresenca(f.aula.id, alunoId),
      academiaId: f.aula.academiaId,
      aulaId: f.aula.id,
      turmaId: f.aula.turmaId,
      data: f.aula.data,
      alunoId,
      modalidadeId: f.modalidadeDe(alunoId),
      origem: ex?.origem === 'checkin' ? 'checkin' : 'chamada',
      estado: 'confirmada',
      registradaEm: ex?.registradaEm ?? f.em,
      registradaPorId: ex?.registradaPorId ?? f.porId,
      atualizadaEm: f.em,
      atualizadaPorId: f.porId,
      pelaEquipe: true,
    });
  }
  return { mudadas, presentes: f.presentes.size, retirados };
}

/** R15.5: a equipe retira uma presença até 7 dias depois da aula, com motivo. */
export function retirarPresenca(p: Presenca, porId: Id, motivo: MotivoDaRetirada, em: InstanteISO, agoraMs: number, fuso: string): Presenca {
  if (diasEntre(p.data, dataNoFuso(agoraMs, fuso)) > DIAS_PARA_CORRIGIR) throw new ErroDePresenca('fora_do_prazo', 'Passou de 7 dias: a correção é pela recepção ou pelo dono no Admin.');
  return { ...p, estado: 'retirada', motivoDaRetirada: motivo, pelaEquipe: true, atualizadaEm: em, atualizadaPorId: porId };
}

/** R15.8: presença retroativa (equipe), numa aula dos últimos 7 dias, nunca no futuro. */
export function lancarPresencaRetroativa(d: { aula: Aula; alunoId: Id; modalidadeId: Id; porId: Id; em: InstanteISO; agoraMs: number; fuso: string }): Presenca {
  if (d.aula.inicioMs > d.agoraMs) throw new ErroDePresenca('aula_futura', 'A aula ainda não aconteceu.');
  if (diasEntre(d.aula.data, dataNoFuso(d.agoraMs, d.fuso)) > DIAS_PARA_CORRIGIR) throw new ErroDePresenca('fora_do_prazo', 'Só nos últimos 7 dias.');
  return {
    id: idDaPresenca(d.aula.id, d.alunoId),
    academiaId: d.aula.academiaId,
    aulaId: d.aula.id,
    turmaId: d.aula.turmaId,
    data: d.aula.data,
    alunoId: d.alunoId,
    modalidadeId: d.modalidadeId,
    origem: 'correcao',
    estado: 'confirmada',
    registradaEm: d.em,
    registradaPorId: d.porId,
    atualizadaEm: d.em,
    atualizadaPorId: d.porId,
    pelaEquipe: true,
  };
}

/** R15.11: a aula cancelada retira os check-ins dela, sem o aluno perder nada (não conta como falta). */
export function retirarPorCancelamento(presencas: readonly Presenca[], aulaId: Id, porId: Id, em: InstanteISO): Presenca[] {
  return presencas
    .filter((p) => p.aulaId === aulaId && contamNaAula(p))
    .map((p) => ({ ...p, estado: 'retirada' as const, motivoDaRetirada: 'aula_cancelada' as const, pelaEquipe: true, atualizadaEm: em, atualizadaPorId: porId }));
}

// ---------------------------------------------------------------------------
// Sem sinal: a mesma presença nos dois lados (R15.9)
// ---------------------------------------------------------------------------

const msDe = (iso: InstanteISO) => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? -Infinity : ms;
};

/** A ação da equipe vence o check-in; entre duas da equipe (ou duas do aluno), a mais recente. Empate: a do servidor. */
export function resolverPresenca(local: Presenca, remoto: Presenca): Presenca {
  if (local.id !== remoto.id) throw new Error('resolverPresenca compara a mesma presença (mesmo id)');
  if (local.pelaEquipe !== remoto.pelaEquipe) return local.pelaEquipe ? local : remoto;
  return msDe(local.atualizadaEm) > msDe(remoto.atualizadaEm) ? local : remoto;
}

// ---------------------------------------------------------------------------
// Frequência (R15.10, R15.12)
// ---------------------------------------------------------------------------

/** As confirmadas (com as sozinhas aplicadas), sem as experimentais. */
export function confirmadas(presencas: readonly Presenca[], agoraMs: number, fuso: string): Presenca[] {
  return presencasEmDia(presencas, agoraMs, fuso).filter((p) => p.estado === 'confirmada' && !p.experimentalId);
}

/**
 * As que contam para o aluno ver: confirmadas e pendentes (a pendente vira
 * confirmada sozinha). A retirada não conta.
 */
export function quePontuam(presencas: readonly Presenca[]): Presenca[] {
  return presencas.filter((p) => contamNaAula(p) && !p.experimentalId);
}

/** Presenças por modalidade (contando pendentes e confirmadas). */
export function contarPorModalidade(presencas: readonly Presenca[]): Map<Id, number> {
  const m = new Map<Id, number>();
  for (const p of quePontuam(presencas)) m.set(p.modalidadeId, (m.get(p.modalidadeId) ?? 0) + 1);
  return m;
}

/** Presenças numa modalidade desde uma data (exclusive: a graduação daquele dia não conta a aula dela). */
export function presencasDesde(presencas: readonly Presenca[], modalidadeId: Id, desde: DataISO | null): number {
  return quePontuam(presencas).filter((p) => p.modalidadeId === modalidadeId && (desde === null || p.data > desde)).length;
}

/** A data da última presença que conta, ou nula. */
export function ultimaPresenca(presencas: readonly Presenca[]): DataISO | null {
  const datas = quePontuam(presencas).map((p) => p.data).sort();
  return datas.at(-1) ?? null;
}

/** R15.10: ativo = ao menos uma presença confirmada nos últimos 30 dias. */
export function alunoAtivo(presencas: readonly Presenca[], agoraMs: number, fuso: string): boolean {
  const hoje = dataNoFuso(agoraMs, fuso);
  const corte = somarDias(hoje, -DIAS_PARA_ATIVO);
  return confirmadas(presencas, agoraMs, fuso).some((p) => p.data > corte && p.data <= hoje);
}

/** R15.12: sumido. Sem nenhuma presença, conta desde o começo do vínculo. */
export function estaSumido(d: { ultima: DataISO | null; desde: DataISO; hoje: DataISO }): boolean {
  const diasDeVinculo = diasEntre(d.desde, d.hoje);
  const corte = diasDeVinculo <= DIAS_DE_ALUNO_NOVO ? DIAS_PARA_SUMIR_NOVO : DIAS_PARA_SUMIR;
  return diasEntre(d.ultima ?? d.desde, d.hoje) >= corte;
}

/** Dias sem presença (para "Última aula há 9 dias"). Nulo sem nenhuma. */
export function diasSemPresenca(ultima: DataISO | null, hoje: DataISO): number | null {
  return ultima === null ? null : diasEntre(ultima, hoje);
}

/** "Sua semana": as datas de segunda a domingo com ao menos uma presença que conta. */
export function datasComPresenca(presencas: readonly Presenca[], de: DataISO, ate: DataISO): Set<DataISO> {
  return new Set(quePontuam(presencas).filter((p) => p.data >= de && p.data <= ate).map((p) => p.data));
}

// ---------------------------------------------------------------------------
// Revisão AN: a aula do herói do Início e os presentes da chamada
// ---------------------------------------------------------------------------

export interface AulaDoCheckin {
  aula: Aula;
  /** As aulas de HOJE dessas turmas que foram canceladas e ainda não começariam (para o aviso no herói). */
  canceladasHoje: Aula[];
}

/**
 * A aula que o herói do Início mostra: a primeira que não foi cancelada, não
 * acabou e cujo check-in ainda não fechou. Antes (só `proximaAula`), o herói
 * ficava na aula em andamento até ela acabar, e a aula seguinte (Muay Thai às
 * 20h e Boxe às 21h, na terça) não recebia check-in entre 20:30 e 21:00.
 */
export function aulaDoCheckin(turmas: readonly Turma[], agoraMs: number, fuso: string, janela: JanelaDeCheckin, ajustes: readonly AjusteDeAula[] = [], dias = 7): AulaDoCheckin | null {
  const hoje = dataNoFuso(agoraMs, fuso);
  let aula: Aula | null = null;
  for (let i = 0; i <= dias && !aula; i += 1) {
    aula = aulasDoDia(turmas, somarDias(hoje, i), fuso, ajustes).find((a) => !a.cancelada && a.fimMs > agoraMs && janelaDoCheckin(a, agoraMs, janela).tipo !== 'fechada') ?? null;
  }
  if (!aula) return null;
  const canceladasHoje = aulasDoDia(turmas, hoje, fuso, ajustes).filter((a) => a.cancelada && a.inicioMs > agoraMs - janela.minutosDepois * 60_000 && a.inicioMs < aula.inicioMs);
  return { aula, canceladasHoje };
}

/**
 * Quem está presente na chamada: os check-ins (sempre marcados, a não ser que
 * o professor tenha DESMARCADO) mais quem ele marcou à mão. Guardar só o que o
 * professor mudou faz o check-in que chega com a chamada aberta entrar
 * marcado; antes, a tela congelava a lista no primeiro toque e o check-in novo
 * virava "não estava na aula" ao fechar.
 */
export function presentesDaChamada({ checkins, marcadosAMao, desmarcadosAMao }: { checkins: readonly Id[]; marcadosAMao: ReadonlySet<Id>; desmarcadosAMao: ReadonlySet<Id> }): Set<Id> {
  const presentes = new Set<Id>();
  for (const a of checkins) if (!desmarcadosAMao.has(a)) presentes.add(a);
  for (const a of marcadosAMao) presentes.add(a);
  return presentes;
}
