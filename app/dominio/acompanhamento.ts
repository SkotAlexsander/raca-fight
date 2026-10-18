/**
 * O que a academia lê de um aluno, para a tela (revisão AE, P11):
 * - `adesaoDaDieta` e `motivosDoNaoSegui`: a dieta do aluno Plus vista pelo
 *   personal (mapa, "Aluno Plus (personal)": adesão de 7 e 30 dias e os
 *   motivos do "Não segui"). A adesão vem como PAR ("1 de 35 refeições
 *   marcadas"), nunca percentual: número é texto (tom de voz, princípio 8), e
 *   refeição sem marca não é "não segui";
 * - `sumiuEstaSemana` e `ordenarPorFiltro`: a ordem de cada filtro da lista de
 *   Alunos (R13.8). Usa só a data do último treino e a do vínculo, nunca dado
 *   de saúde.
 *
 * Puro: sem React, sem relógio (o "hoje" vem de quem chama). Testado em
 * `acompanhamento.test.ts`.
 */
import type { DataISO, PlanoDeDieta, RefeicaoRegistrada } from './tipos.ts';

const MS_POR_DIA = 86_400_000;

/** Dias de calendário de `de` até `ate` (pode ser negativo). Lê o texto ISO, sem passar por fuso. */
export function diasEntreDatas(de: DataISO, ate: DataISO): number {
  const ms = (d: DataISO) => {
    const [a, m, dia] = d.slice(0, 10).split('-').map(Number);
    return Date.UTC(a, m - 1, dia);
  };
  return Math.round((ms(ate) - ms(de)) / MS_POR_DIA);
}

export interface Adesao {
  /** Refeições que contam marcadas como feitas na janela. */
  marcadas: number;
  /** Refeições que contam × dias de plano na janela. */
  planejadas: number;
}

/**
 * Os últimos `dias` dias até `hoje` (inclusive). Só contam os dias desde o
 * início do plano (e até o fim, se houver), e só as refeições não opcionais (R3.7).
 */
export function adesaoDaDieta(plano: PlanoDeDieta | null | undefined, registros: readonly RefeicaoRegistrada[], hoje: DataISO, dias: number): Adesao {
  if (!plano) return { marcadas: 0, planejadas: 0 };
  const contam = new Set(plano.refeicoes.filter((r) => !r.opcional).map((r) => r.id));
  const naJanela = (data: DataISO) => {
    const atras = diasEntreDatas(data, hoje);
    if (atras < 0 || atras >= dias) return false;
    if (diasEntreDatas(plano.inicio, data) < 0) return false;
    if (plano.fim && diasEntreDatas(data, plano.fim) < 0) return false;
    return true;
  };
  let diasDePlano = 0;
  for (let i = 0; i < dias; i += 1) {
    const ms = Date.UTC(Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7)) - 1, Number(hoje.slice(8, 10))) - i * MS_POR_DIA;
    if (naJanela(new Date(ms).toISOString().slice(0, 10))) diasDePlano += 1;
  }
  const marcadas = registros.filter((r) => r.estado === 'feita' && contam.has(r.refeicaoId) && naJanela(r.data)).length;
  return { marcadas, planejadas: contam.size * diasDePlano };
}

export interface MotivoDoNaoSegui {
  data: DataISO;
  refeicaoId: string;
  motivo: string;
}

/** Os "Não segui" COM motivo escrito, do mais novo ao mais velho, nos últimos `dias` dias. */
export function motivosDoNaoSegui(registros: readonly RefeicaoRegistrada[], hoje: DataISO, dias: number): MotivoDoNaoSegui[] {
  return registros
    .filter((r) => r.estado === 'nao_segui' && !!r.motivo?.trim())
    .filter((r) => {
      const atras = diasEntreDatas(r.data, hoje);
      return atras >= 0 && atras < dias;
    })
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
    .map((r) => ({ data: r.data, refeicaoId: r.refeicaoId, motivo: r.motivo!.trim() }));
}

// ---------------------------------------------------------------------------
// R13.8: a ordem de cada filtro de Alunos
// ---------------------------------------------------------------------------

export const DIAS_PARA_SUMIR = 14;

export type FiltroDeAlunos = 'todos' | 'sumidos' | 'semTreino' | 'plus' | 'pendentes' | 'novos' | 'pediuTreino' | 'trocar';

export interface AlunoParaOrdenar {
  nome: string;
  /** Dias desde o último treino; null = nunca treinou. */
  diasSemTreinar: number | null;
  /** Dias desde o `vinculo.desde` (para o pendente, desde o pedido). */
  diasDeVinculo: number;
  /** Quando pediu treino (instante ISO), se pediu. */
  pedidoEm?: string;
}

/** Há quantos dias o aluno "sumiu" para a lista: do último treino ou, se nunca treinou, do vínculo. */
const diasSumido = (a: Pick<AlunoParaOrdenar, 'diasSemTreinar' | 'diasDeVinculo'>) => a.diasSemTreinar ?? a.diasDeVinculo;

/** Cruzou os 14 dias sem treinar nos últimos 7 dias: está entre 14 e 20 dias sumido. */
export function sumiuEstaSemana(a: Pick<AlunoParaOrdenar, 'diasSemTreinar' | 'diasDeVinculo'>, corte = DIAS_PARA_SUMIR): boolean {
  const d = diasSumido(a);
  return d >= corte && d < corte + 7;
}

const porNome = (x: AlunoParaOrdenar, y: AlunoParaOrdenar) => x.nome.localeCompare(y.nome, 'pt-BR');

export function ordenarPorFiltro<T extends AlunoParaOrdenar>(filtro: FiltroDeAlunos, alunos: readonly T[]): T[] {
  const lista = [...alunos];
  switch (filtro) {
    case 'sumidos':
      // quem sumiu há menos tempo primeiro: ainda volta se alguém chamar
      return lista.sort((x, y) => diasSumido(x) - diasSumido(y) || porNome(x, y));
    case 'pediuTreino':
      return lista.sort((x, y) => (x.pedidoEm ?? '').localeCompare(y.pedidoEm ?? '') || porNome(x, y));
    case 'pendentes':
    case 'novos':
      // o mais antigo primeiro: o pedido que espera há mais tempo; o novo mais perto de sair da janela
      return lista.sort((x, y) => y.diasDeVinculo - x.diasDeVinculo || porNome(x, y));
    default:
      return lista.sort(porNome);
  }
}
