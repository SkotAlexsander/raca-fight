/**
 * Avisos (notificações) do Academia Plus: regras anti-incômodo e a agenda
 * semanal das notificações LOCAIS do aluno.
 *
 * Fonte: `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3 (tabela de avisos)
 * e `01-especificacao/03-REGRAS.md`, seção 10 (R10.x). Testado em `avisos.test.ts`.
 *
 * O que fica aqui é puro: nada de Expo, relógio ou fuso do aparelho. Quem chama
 * (o app, ou uma Edge Function) passa a semana, o fuso e o "agora"; recebe a
 * lista do que agendar (com id estável para cancelar e reagendar) e a lista do
 * que foi descartado, com o motivo — para a tela Avisos poder explicar.
 *
 * Regras anti-incômodo (R10.4 a R10.8):
 * - Horário de silêncio 22:00–07:00: nada toca, exceto o cronômetro do treino
 *   em andamento (descanso, série por tempo, cronômetro), que o aluno ligou.
 *   Lembrete local marcado no silêncio é DESCARTADO (nunca movido para outra
 *   hora que o aluno não escolheu). Aviso do servidor é SEGURADO até as 07:00.
 * - No máximo 3 lembretes locais por dia. Refeições que passariam do limite
 *   viram um resumo só, à noite (agrupar, não cortar o jantar).
 * - Refeições a menos de 30 min uma da outra viram um aviso só.
 * - Não lembra do treino no dia em que já treinou, nem depois de fechar a
 *   frequência da semana.
 * - Nenhum texto leva dado de saúde: nem peso, nem caloria, nem o nome da
 *   refeição (o plano alimentar inteiro é dado de saúde, R6.1).
 */

import type { DataISO, DiaDaSemana, HoraDoDia, InstanteISO, Id } from './tipos.ts';
import { DIAS_DA_SEMANA } from './tipos.ts';

export type { DiaDaSemana };

// ---------------------------------------------------------------------------
// Tipos de aviso e as chaves da tela Avisos
// ---------------------------------------------------------------------------

/** Todo aviso que a especificação promete (tabela da seção 3 de 03-DECISOES-TECNICAS). */
export const TIPOS_DE_AVISO = [
  // Locais, no telefone do aluno
  'fim_do_descanso',
  'fim_do_cronometro',
  'lembrete_treino',
  'lembrete_refeicao',
  'resumo_refeicao',
  // Do servidor, para o aluno
  'personal_ajustou_treino',
  'personal_ajustou_dieta',
  'nova_mensagem',
  'treino_da_academia',
  'aviso_da_academia',
  'vinculo_confirmado',
  'plus_ativo',
  'personal_designado',
  'plus_vence',
  'plus_suspenso',
  /** R12.11: "Seu vínculo com [academia] foi encerrado", sem o motivo. */
  'vinculo_encerrado',
  // Do servidor, para a equipe
  'pedido_de_vinculo',
  'alunos_sem_treinar',
  'aluno_plus_designado',
  'aluno_plus_sem_registro',
  'plus_sem_personal',
  /** R12.13: ao dono, segunda às 09:00, só contagens. */
  'resumo_da_semana',
  // Luta (P12, R22): para o aluno e o responsável
  'lembrete_aula',
  'aviso_da_turma',
  'aula_cancelada',
  'graduacao_registrada',
  'exame_marcado',
  // Luta (P12, R22.5): para a equipe, sem nome de aluno na tela bloqueada
  'checkins_para_confirmar',
  'experimentais_de_amanha',
  'prontos_para_avaliar',
] as const;

export type TipoDeAviso = (typeof TIPOS_DE_AVISO)[number];

/** Chaves da tela Avisos (aluno: Perfil → Avisos; equipe: Perfil → Avisos da equipe). */
export type ChaveDeAviso =
  | 'cronometro'
  | 'lembrete_treino'
  | 'lembrete_refeicao'
  | 'personal'
  | 'mensagens'
  | 'academia'
  | 'assinatura'
  | 'pedidos_de_vinculo'
  | 'alunos_sem_treinar'
  | 'alunos_plus'
  | 'resumo_da_semana'
  | 'lembrete_aula'
  | 'turmas'
  | 'graduacao'
  | 'checkins_para_confirmar'
  | 'experimentais'
  | 'prontos_para_avaliar';

/**
 * Em qual chave cada aviso desliga. `null` = não desliga: só o aviso ao dono
 * de "aluno Plus sem personal", que é a garantia do que o aluno pagou (B13).
 */
export const CHAVE_DO_AVISO: Readonly<Record<TipoDeAviso, ChaveDeAviso | null>> = {
  fim_do_descanso: 'cronometro',
  fim_do_cronometro: 'cronometro',
  lembrete_treino: 'lembrete_treino',
  lembrete_refeicao: 'lembrete_refeicao',
  resumo_refeicao: 'lembrete_refeicao',
  personal_ajustou_treino: 'personal',
  personal_ajustou_dieta: 'personal',
  nova_mensagem: 'mensagens',
  treino_da_academia: 'academia',
  aviso_da_academia: 'academia',
  vinculo_confirmado: 'academia',
  plus_ativo: 'assinatura',
  personal_designado: 'assinatura',
  plus_vence: 'assinatura',
  plus_suspenso: 'assinatura',
  vinculo_encerrado: 'academia',
  pedido_de_vinculo: 'pedidos_de_vinculo',
  alunos_sem_treinar: 'alunos_sem_treinar',
  aluno_plus_designado: 'alunos_plus',
  aluno_plus_sem_registro: 'alunos_plus',
  plus_sem_personal: null,
  resumo_da_semana: 'resumo_da_semana',
  lembrete_aula: 'lembrete_aula',
  aviso_da_turma: 'turmas',
  aula_cancelada: 'turmas',
  graduacao_registrada: 'graduacao',
  exame_marcado: 'graduacao',
  checkins_para_confirmar: 'checkins_para_confirmar',
  experimentais_de_amanha: 'experimentais',
  prontos_para_avaliar: 'prontos_para_avaliar',
};

const FURAM_O_SILENCIO: ReadonlySet<TipoDeAviso> = new Set<TipoDeAviso>([
  'fim_do_descanso',
  'fim_do_cronometro',
]);

/** O cronômetro do treino em andamento toca a qualquer hora; o resto espera (R10.4). */
export function respeitaSilencio(tipo: TipoDeAviso): boolean {
  return !FURAM_O_SILENCIO.has(tipo);
}

// ---------------------------------------------------------------------------
// Preferências (o que o aluno ligou na tela Avisos)
// ---------------------------------------------------------------------------


/**
 * Lembrete de refeição (só Plus). O padrão é um resumo só, à noite (B-MELHORIAS
 * A8): marcar refeição por refeição cansa, e cinco avisos por dia mais ainda.
 */
export type ModoDoLembreteDeRefeicao = 'desligado' | 'resumo_noturno' | 'por_refeicao';

export interface PreferenciasDeAviso {
  /** Dias vazios = usa a frequência pretendida do cadastro (`diasPelaFrequencia`). */
  lembreteDeTreino: { ligado: boolean; dias: DiaDaSemana[]; hora: HoraDoDia };
  lembreteDeRefeicao: { modo: ModoDoLembreteDeRefeicao; horaDoResumo: HoraDoDia };
  /** As chaves abaixo não entram na agenda local; o servidor e o cronômetro leem. */
  cronometro: boolean;
  personal: boolean;
  /** [decidir] só existe se o chat for próprio. */
  mensagens: boolean;
  academia: boolean;
  assinatura: boolean;
  /**
   * Luta (R22.4): o lembrete de aula, LOCAL e desligado por padrão; o aluno
   * liga por turma e escolhe a antecedência (30 min · 1 h · 2 h).
   * Opcional porque as contas gravadas antes do P12 não têm.
   */
  lembreteDeAula?: { ligado: boolean; antecedenciaMinutos: 30 | 60 | 120; turmaIds: Id[] };
  /** R22.5: aviso e cancelamento das turmas dele. */
  turmas?: boolean;
  /** R22.5: graduação registrada, exame marcado. */
  graduacao?: boolean;
}

/**
 * Padrão de uma conta nova. O lembrete de treino nasce desligado: só liga
 * quando o aluno escolhe dias e hora (convite depois do primeiro treino
 * fechado). O resto nasce ligado e desliga na tela Avisos.
 */
export const PREFERENCIAS_PADRAO: Readonly<PreferenciasDeAviso> = {
  lembreteDeTreino: { ligado: false, dias: [], hora: '18:00' },
  lembreteDeRefeicao: { modo: 'resumo_noturno', horaDoResumo: '20:30' },
  cronometro: true,
  personal: true,
  mensagens: true,
  academia: true,
  assinatura: true,
  lembreteDeAula: { ligado: false, antecedenciaMinutos: 60, turmaIds: [] },
  turmas: true,
  graduacao: true,
};

/** Preferências da equipe (visão da academia), uma por vínculo. */
export interface PreferenciasDaEquipe {
  pedidosDeVinculo: boolean;
  alunosSemTreinar: boolean;
  /** Aluno Plus designado e aluno Plus sem registro há 3 dias (personal). */
  alunosPlus: boolean;
  /** R12.13: o resumo da semana (só o dono recebe; ligado e desligável). */
  resumoDaSemana: boolean;
  /** Luta (R22.5): resumo às 23:00 se ficou chamada aberta. Opcional nas gravadas antes do P12. */
  checkinsParaConfirmar?: boolean;
  /** Luta (R22.5): resumo às 18:00 das experimentais de amanhã. */
  experimentaisDeAmanha?: boolean;
  /** Luta (R22.5): resumo semanal, segunda 09:00, de quem atingiu os mínimos. */
  prontosParaAvaliar?: boolean;
}

/**
 * Padrão de um vínculo de equipe novo. O instrutor nasce com "Alunos sem
 * treinar" desligado (tabela de avisos, linha 17); quem chama ajusta por papel.
 */
export const PREFERENCIAS_DA_EQUIPE_PADRAO: Readonly<PreferenciasDaEquipe> = {
  pedidosDeVinculo: true,
  alunosSemTreinar: true,
  alunosPlus: true,
  resumoDaSemana: true,
  checkinsParaConfirmar: true,
  experimentaisDeAmanha: true,
  prontosParaAvaliar: true,
};

// ---------------------------------------------------------------------------
// Horário de silêncio
// ---------------------------------------------------------------------------

export interface HorarioDeSilencio {
  inicio: HoraDoDia;
  fim: HoraDoDia;
}

/** R10.4: nada entre 22:00 e 07:00, exceto o cronômetro do treino em andamento. */
export const SILENCIO_PADRAO: Readonly<HorarioDeSilencio> = { inicio: '22:00', fim: '07:00' };

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutosDaHora(hora: HoraDoDia, nome = 'hora'): number {
  if (typeof hora !== 'string' || !HORA_VALIDA.test(hora)) {
    throw new RangeError(`${nome} precisa ser HH:MM (00:00 a 23:59), veio ${String(hora)}`);
  }
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

function horaDosMinutos(minutos: number): HoraDoDia {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * A hora cai no silêncio? Início entra, fim não (22:00 está dentro, 07:00 fora).
 * Silêncio que atravessa a meia-noite (22:00–07:00) funciona; início igual ao
 * fim = sem silêncio.
 */
export function dentroDoSilencio(hora: HoraDoDia, silencio: HorarioDeSilencio = SILENCIO_PADRAO): boolean {
  const h = minutosDaHora(hora);
  const inicio = minutosDaHora(silencio.inicio, 'início do silêncio');
  const fim = minutosDaHora(silencio.fim, 'fim do silêncio');
  if (inicio === fim) return false;
  if (inicio < fim) return h >= inicio && h < fim;
  return h >= inicio || h < fim;
}

/**
 * Para o servidor: se o aviso cai no silêncio, quando ele pode sair. Fora do
 * silêncio, sai na hora. Data e hora no fuso do destinatário (R10.5).
 */
export function proximoMomentoPermitido(
  data: DataISO,
  hora: HoraDoDia,
  silencio: HorarioDeSilencio = SILENCIO_PADRAO,
): { data: DataISO; hora: HoraDoDia } {
  exigirData(data, 'data');
  if (!dentroDoSilencio(hora, silencio)) return { data, hora };
  const h = minutosDaHora(hora);
  const inicio = minutosDaHora(silencio.inicio);
  const atravessaMeiaNoite = inicio > minutosDaHora(silencio.fim);
  const proximoDia = atravessaMeiaNoite && h >= inicio;
  return { data: proximoDia ? somarDias(data, 1) : data, hora: silencio.fim };
}

// ---------------------------------------------------------------------------
// Datas (sem fuso: só o calendário)
// ---------------------------------------------------------------------------

const DATA_VALIDA = /^(\d{4})-(\d{2})-(\d{2})$/;

function partesDaData(data: DataISO, nome: string): [number, number, number] {
  const achou = typeof data === 'string' ? DATA_VALIDA.exec(data) : null;
  if (!achou) throw new RangeError(`${nome} precisa ser AAAA-MM-DD, veio ${String(data)}`);
  const ano = Number(achou[1]);
  const mes = Number(achou[2]);
  const dia = Number(achou[3]);
  const conferida = new Date(Date.UTC(ano, mes - 1, dia));
  if (conferida.getUTCFullYear() !== ano || conferida.getUTCMonth() !== mes - 1 || conferida.getUTCDate() !== dia) {
    throw new RangeError(`${nome} não existe no calendário: ${data}`);
  }
  return [ano, mes, dia];
}

function exigirData(data: DataISO, nome: string): void {
  partesDaData(data, nome);
}

function somarDias(data: DataISO, dias: number): DataISO {
  const [ano, mes, dia] = partesDaData(data, 'data');
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

function diaDaSemana(data: DataISO): DiaDaSemana {
  const [ano, mes, dia] = partesDaData(data, 'data');
  return DIAS_DA_SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()] as DiaDaSemana;
}

const FUSO_VALIDO = /^(Z|[+-](0\d|1[0-4]):[0-5]\d)$/;

/** Instante ISO com data, hora e fuso explícito (R7.4): `2026-10-12T18:00:00-03:00`, `…:00.000Z`. */
const INSTANTE_COM_FUSO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

// ---------------------------------------------------------------------------
// Frequência pretendida → dias de lembrete
// ---------------------------------------------------------------------------

const DIAS_POR_FREQUENCIA: Readonly<Record<number, readonly DiaDaSemana[]>> = {
  1: ['seg'],
  2: ['seg', 'qui'],
  3: ['seg', 'qua', 'sex'],
  4: ['seg', 'ter', 'qui', 'sex'],
  5: ['seg', 'ter', 'qua', 'qui', 'sex'],
  6: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
  7: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
};

/**
 * Quando o aluno liga o lembrete sem escolher dias, o app espalha pela semana
 * a frequência que ele informou no cadastro (H09). Fora de 1 a 7: nenhum dia.
 */
export function diasPelaFrequencia(frequencia: number): DiaDaSemana[] {
  const dias = Number.isInteger(frequencia) ? DIAS_POR_FREQUENCIA[frequencia] : undefined;
  return dias ? [...dias] : [];
}

// ---------------------------------------------------------------------------
// Agenda da semana
// ---------------------------------------------------------------------------

/** Só o que a agenda precisa da refeição. O nome fica de fora de propósito: é dado de saúde. */
export interface RefeicaoParaLembrete {
  id: Id;
  /** `HH:MM`. Sem horário, não há lembrete próprio (entra no resumo da noite). */
  horario?: HoraDoDia;
  /** Opcional não lembra (também não conta na adesão, F8 passo 5). */
  opcional: boolean;
}

export interface EntradaDaAgenda {
  /** Primeiro dia dos 7 da agenda (o app usa a segunda-feira). */
  inicioDaSemana: DataISO;
  /** Fuso do aparelho, `-03:00` ou `Z`. Vai em cada instante agendado (R7.4). */
  fuso: string;
  /** O que já passou não é agendado. Ausente = agenda a semana inteira. */
  agora?: InstanteISO;
  preferencias: PreferenciasDeAviso;
  /** Do cadastro opcional (1 a 7). Serve de dias padrão e de meta da semana. */
  frequenciaSemanalPretendida?: number;
  /** Plus `ativo` ou `cancelado_vigente` (R5.1): só aí há lembrete de refeição. */
  temPlus: boolean;
  /** Refeições do plano em vigor. Vazio = sem plano = sem lembrete de refeição. */
  refeicoes: RefeicaoParaLembrete[];
  /** Datas com treino fechado (qualquer semana; só as desta contam). */
  datasComTreino: DataISO[];
  /** Nome curto do próximo dia ("Treino B"). Não é dado de saúde (R6.1). */
  proximoDiaDeTreino?: string;
  /** "Vou ficar parado" (B-MELHORIAS B4), se entrar: sem lembrete até esta data, inclusive. */
  pausadoAte?: DataISO;
  silencio?: HorarioDeSilencio;
  limitePorDia?: number;
}

export type TipoDeLembrete = 'lembrete_treino' | 'lembrete_refeicao' | 'resumo_refeicao';

/** Canal do Android (cada um desliga separado nos ajustes do sistema). */
export type CanalDeAviso = 'cronometro' | 'lembretes' | 'academia' | 'personal' | 'equipe';

export interface NotificacaoAgendada {
  /** Estável: o app cancela e reagenda pelo id sem duplicar. */
  id: string;
  tipo: TipoDeLembrete;
  data: DataISO;
  hora: HoraDoDia;
  quando: InstanteISO;
  titulo: string;
  corpo: string;
  canal: CanalDeAviso;
}

export type MotivoDoDescarte =
  | 'silencio'
  | 'limite_do_dia'
  | 'agrupado'
  | 'passado'
  | 'pausa'
  | 'treino_feito'
  | 'meta_da_semana'
  | 'sem_dias';

export interface AvisoDescartado {
  tipo: TipoDeLembrete;
  data: DataISO;
  hora: HoraDoDia;
  motivo: MotivoDoDescarte;
}

export interface AgendaDaSemana {
  agendadas: NotificacaoAgendada[];
  descartadas: AvisoDescartado[];
}

/** R10.6: no máximo 3 lembretes locais por dia (o cronômetro não conta). */
export const LIMITE_DE_LEMBRETES_POR_DIA = 3;

/** R10.7: refeições a menos disto uma da outra viram um aviso só. */
export const JANELA_DE_AGRUPAMENTO_MINUTOS = 30;

const PRIORIDADE: Readonly<Record<TipoDeLembrete, number>> = {
  lembrete_treino: 0,
  resumo_refeicao: 1,
  lembrete_refeicao: 1,
};

interface Candidato {
  tipo: TipoDeLembrete;
  data: DataISO;
  hora: HoraDoDia;
  /** Quantas refeições o aviso cobre (só `lembrete_refeicao`). */
  refeicoes?: number;
}

/**
 * Calcula as notificações locais da semana do aluno. Puro: a mesma entrada dá
 * sempre a mesma agenda. O app chama ao abrir, ao mudar a tela Avisos, ao
 * fechar um treino e ao receber plano alimentar novo, cancela o que tinha e
 * agenda o que voltou.
 */
export function agendaDaSemana(entrada: EntradaDaAgenda): AgendaDaSemana {
  exigirData(entrada.inicioDaSemana, 'inicioDaSemana');
  if (typeof entrada.fuso !== 'string' || !FUSO_VALIDO.test(entrada.fuso)) {
    throw new RangeError(`fuso precisa ser como -03:00 ou Z, veio ${String(entrada.fuso)}`);
  }
  const limite = entrada.limitePorDia ?? LIMITE_DE_LEMBRETES_POR_DIA;
  if (!Number.isInteger(limite) || limite < 1) {
    throw new RangeError(`limitePorDia precisa ser inteiro, 1 ou mais; veio ${String(limite)}`);
  }
  const silencio = entrada.silencio ?? SILENCIO_PADRAO;
  // Revisão T (T1): sem fuso, `Date.parse` lê na hora da MÁQUINA que roda a
  // conta; o celular (-03:00) e a Edge Function (UTC) davam agendas diferentes.
  if (entrada.agora !== undefined && (typeof entrada.agora !== 'string' || !INSTANTE_COM_FUSO.test(entrada.agora))) {
    throw new RangeError(`agora precisa ser um instante ISO com fuso (…-03:00 ou …Z), veio ${String(entrada.agora)}`);
  }
  const agoraMs = entrada.agora === undefined ? undefined : Date.parse(entrada.agora);
  if (agoraMs !== undefined && Number.isNaN(agoraMs)) {
    throw new RangeError(`agora precisa ser um instante ISO com fuso, veio ${String(entrada.agora)}`);
  }
  if (entrada.pausadoAte !== undefined) exigirData(entrada.pausadoAte, 'pausadoAte');
  // Revisão T (T5): data em outro formato nunca era igual à data do dia, e o
  // lembrete tocava no dia em que o aluno já tinha treinado.
  entrada.datasComTreino.forEach((d, i) => exigirData(d, `datasComTreino[${i}]`));
  for (const dia of entrada.preferencias.lembreteDeTreino.dias) {
    if (!DIAS_DA_SEMANA.includes(dia)) {
      throw new RangeError(`dia da semana desconhecido no lembrete de treino: ${String(dia)} (use ${DIAS_DA_SEMANA.join(', ')})`);
    }
  }

  const { preferencias } = entrada;
  const treino = preferencias.lembreteDeTreino;
  const refeicao = preferencias.lembreteDeRefeicao;
  if (treino.ligado) minutosDaHora(treino.hora, 'hora do lembrete de treino');
  minutosDaHora(refeicao.horaDoResumo, 'hora do resumo de refeição');

  const quando = (data: DataISO, hora: HoraDoDia): InstanteISO => `${data}T${hora}:00${entrada.fuso}`;

  const agendadas: NotificacaoAgendada[] = [];
  const descartadas: AvisoDescartado[] = [];
  const descartar = (c: Candidato, motivo: MotivoDoDescarte): void => {
    descartadas.push({ tipo: c.tipo, data: c.data, hora: c.hora, motivo });
  };

  /** Passado, pausa e silêncio valem para todo lembrete. Devolve o motivo ou null. */
  const barrado = (c: Candidato): MotivoDoDescarte | null => {
    if (agoraMs !== undefined && Date.parse(quando(c.data, c.hora)) <= agoraMs) return 'passado';
    if (entrada.pausadoAte !== undefined && c.data <= entrada.pausadoAte) return 'pausa';
    if (dentroDoSilencio(c.hora, silencio)) return 'silencio';
    return null;
  };

  const datas = Array.from({ length: 7 }, (_, i) => somarDias(entrada.inicioDaSemana, i));
  const fimDaSemana = datas[6] as DataISO;
  const treinosDaSemana = new Set(
    entrada.datasComTreino.filter((d) => d >= entrada.inicioDaSemana && d <= fimDaSemana),
  );

  // --- Lembrete de treino: dias escolhidos, senão os da frequência ---------
  let diasDeTreino: DiaDaSemana[] = [];
  let meta = 0;
  if (treino.ligado) {
    const frequencia = entrada.frequenciaSemanalPretendida;
    diasDeTreino = treino.dias.length > 0 ? [...new Set(treino.dias)] : diasPelaFrequencia(frequencia ?? 0);
    const frequenciaValida = frequencia !== undefined && diasPelaFrequencia(frequencia).length > 0;
    meta = frequenciaValida ? (frequencia as number) : diasDeTreino.length;
    if (diasDeTreino.length === 0) {
      descartar({ tipo: 'lembrete_treino', data: entrada.inicioDaSemana, hora: treino.hora }, 'sem_dias');
    }
  }

  const refeicaoLigada = entrada.temPlus && refeicao.modo !== 'desligado' && entrada.refeicoes.length > 0;
  const gruposDeRefeicao = refeicao.modo === 'por_refeicao' ? agruparRefeicoes(entrada.refeicoes) : [];
  // Revisão T (T4): refeição sem horário "entra no resumo da noite" (ver
  // `RefeicaoParaLembrete`); antes, no modo por refeição, ela sumia sem aviso nem descarte.
  const temRefeicaoSemHorario = entrada.refeicoes.some((r) => !r.opcional && r.horario === undefined);

  for (const data of datas) {
    const doDia: Candidato[] = [];

    if (diasDeTreino.includes(diaDaSemana(data))) {
      const c: Candidato = { tipo: 'lembrete_treino', data, hora: treino.hora };
      const feitosAntes = [...treinosDaSemana].filter((d) => d < data).length;
      const motivo =
        barrado(c) ??
        (treinosDaSemana.has(data) ? 'treino_feito' : null) ??
        (feitosAntes >= meta ? 'meta_da_semana' : null);
      if (motivo) descartar(c, motivo);
      else doDia.push(c);
    }

    if (refeicaoLigada) {
      const resumo: Candidato = { tipo: 'resumo_refeicao', data, hora: refeicao.horaDoResumo };
      if (refeicao.modo === 'resumo_noturno') {
        const motivo = barrado(resumo);
        if (motivo) descartar(resumo, motivo);
        else doDia.push(resumo);
      } else {
        const porRefeicao: Candidato[] = [];
        for (const grupo of gruposDeRefeicao) {
          const c: Candidato = { tipo: 'lembrete_refeicao', data, hora: grupo.hora, refeicoes: grupo.quantas };
          const motivo = barrado(c);
          if (motivo) descartar(c, motivo);
          else porRefeicao.push(c);
        }
        const espaco = limite - doDia.length - (temRefeicaoSemHorario ? 1 : 0);
        if (porRefeicao.length > espaco) {
          // Passaria do limite: um resumo à noite no lugar de todos (R10.7).
          for (const c of porRefeicao) descartar(c, 'agrupado');
          const motivo = barrado(resumo);
          if (motivo) descartar(resumo, motivo);
          else doDia.push(resumo);
        } else {
          doDia.push(...porRefeicao);
          if (temRefeicaoSemHorario) {
            const motivo = barrado(resumo);
            if (motivo) descartar(resumo, motivo);
            else doDia.push(resumo);
          }
        }
      }
    }

    // Limite do dia: treino primeiro, depois por horário (R10.6).
    doDia.sort((a, b) => PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo] || minutosDaHora(a.hora) - minutosDaHora(b.hora));
    doDia.forEach((c, i) => {
      if (i >= limite) descartar(c, 'limite_do_dia');
      else agendadas.push(montar(c, quando(c.data, c.hora), entrada.proximoDiaDeTreino));
    });
  }

  agendadas.sort((a, b) => Date.parse(a.quando) - Date.parse(b.quando));
  return { agendadas, descartadas };
}

/** Refeições com horário e não opcionais, em grupos de até 30 min a partir da primeira do grupo. */
function agruparRefeicoes(refeicoes: RefeicaoParaLembrete[]): { hora: HoraDoDia; quantas: number }[] {
  const minutos = refeicoes
    .filter((r) => !r.opcional && r.horario !== undefined)
    .map((r) => minutosDaHora(r.horario as HoraDoDia, 'horário da refeição'))
    .sort((a, b) => a - b);
  const grupos: { inicio: number; quantas: number }[] = [];
  for (const m of minutos) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && m - ultimo.inicio < JANELA_DE_AGRUPAMENTO_MINUTOS) ultimo.quantas += 1;
    else grupos.push({ inicio: m, quantas: 1 });
  }
  return grupos.map((g) => ({ hora: horaDosMinutos(g.inicio), quantas: g.quantas }));
}

/** Texto no tom de `01-TOM-DE-VOZ.md`: diz o que fazer, sem pressão, sem dado de saúde. */
function montar(c: Candidato, quando: InstanteISO, proximoDiaDeTreino?: string): NotificacaoAgendada {
  const base = { data: c.data, hora: c.hora, quando, tipo: c.tipo, canal: 'lembretes' as const };
  if (c.tipo === 'lembrete_treino') {
    const nome = proximoDiaDeTreino?.trim();
    return {
      ...base,
      id: `lembrete_treino:${c.data}`,
      titulo: nome ? `${nome} pronto` : 'Seu treino está pronto',
      corpo: 'Está no app quando você quiser.',
    };
  }
  if (c.tipo === 'resumo_refeicao') {
    return {
      ...base,
      id: `resumo_refeicao:${c.data}`,
      titulo: 'Como foi a alimentação hoje?',
      corpo: 'Marque as refeições no app.',
    };
  }
  const quantas = c.refeicoes ?? 1;
  return {
    ...base,
    id: `lembrete_refeicao:${c.data}:${c.hora}`,
    titulo: 'Hora da refeição',
    corpo: quantas > 1 ? `${quantas} refeições do plano agora. Marque no app quando fizer.` : 'Marque no app quando fizer.',
  };
}

// ---------------------------------------------------------------------------
// Aviso da academia (V6)
// ---------------------------------------------------------------------------

/** R10.10: texto curto, cabe na notificação sem cortar no meio. */
export const LIMITE_DO_AVISO_DA_ACADEMIA = 160;
export const LINHAS_DO_AVISO_DA_ACADEMIA = 3;
export const VALIDADE_MAXIMA_DO_AVISO_DIAS = 14;

/**
 * Revisão T (T6): domínio sem "http"/"www" ("bit.ly/x", "academia.com.br/pix",
 * "wa.me/55…") também é link — e é o formato do golpe do Pix. Pega palavra
 * colada a um ponto e a um final de domínio comum; "A.B" e "7.30" não casam.
 */
const DOMINIO =
  /\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|br|net|org|ly|me|io|app|co|gg|info|site|online|link|xyz|top|shop|store|click|to|tv|biz)\b/i;

/** Verdadeiro se o texto tem link, com ou sem "http"/"www". Usado também no perfil profissional. */
export function temLink(texto: string): boolean {
  // NFKC: "Ｗｗｗ．ｘ．ｃｏｍ" (letras de largura total) vira "Www.x.com" antes de conferir (agente AB)
  const t = texto.normalize('NFKC');
  return /(https?:\/\/|www\.)/i.test(t) || DOMINIO.test(t);
}

export type ProblemaDoAviso = 'vazio' | 'longo_demais' | 'linhas_demais' | 'tem_link' | 'validade_invalida';

export interface RascunhoDeAviso {
  texto: string;
  /** Quantos dias o cartão fica no Início (1 a 14). */
  validadeDias: number;
}

/**
 * Confere o aviso antes de enviar. Lista vazia = pode enviar. Conta caractere
 * (code point), não unidade de UTF-16: "é" e "💪" contam 1.
 */
export function validarAvisoDaAcademia(rascunho: RascunhoDeAviso): ProblemaDoAviso[] {
  const problemas: ProblemaDoAviso[] = [];
  const texto = rascunho.texto.trim();
  if (texto === '') problemas.push('vazio');
  if (Array.from(texto).length > LIMITE_DO_AVISO_DA_ACADEMIA) problemas.push('longo_demais');
  if (texto.split('\n').length > LINHAS_DO_AVISO_DA_ACADEMIA) problemas.push('linhas_demais');
  if (temLink(texto)) problemas.push('tem_link');
  const v = rascunho.validadeDias;
  if (!Number.isInteger(v) || v < 1 || v > VALIDADE_MAXIMA_DO_AVISO_DIAS) problemas.push('validade_invalida');
  return problemas;
}
