/**
 * Funil da aula experimental (RA11): interessado → aula experimental marcada
 * (pelo WhatsApp) → compareceu → matrícula. Com a origem do contato
 * (Instagram, WhatsApp, indicação), a conversão e o lembrete de retorno para
 * quem fez a aula e não voltou. A planilha não dá isso.
 *
 * O Interessado e a AulaExperimental são os da especificação de luta (R19.1,
 * R19.3): a recepção registra; o Admin vê os números e matricula. A etapa do
 * funil é CALCULADA, nunca guardada.
 */

import type { DataISO, Id, InstanteISO } from '../tipos.ts';
import { dentroDoPeriodo, formatarDataBR, somarDias } from './datas.ts';
import type { AulaExperimental, EstadoDaExperimental, EtapaDoFunil, Interessado, Lembrete, OrigemDoContato, Periodo } from './tipos.ts';

const FEITA: readonly EstadoDaExperimental[] = ['compareceu', 'matriculou', 'nao_seguiu'];

const dele = (i: Interessado, exps: readonly AulaExperimental[]) => exps.filter((e) => e.interessadoId === i.id);

/** A data em que fez a aula experimental (a mais recente), se fez. */
export function experimentalFeitaEm(i: Interessado, exps: readonly AulaExperimental[]): DataISO | undefined {
  return dele(i, exps).filter((e) => FEITA.includes(e.estado)).map((e) => e.data).sort().at(-1);
}

export function etapaDoInteressado(i: Interessado, exps: readonly AulaExperimental[]): EtapaDoFunil {
  if (i.matriculadoEm) return 'matriculado';
  const minhas = dele(i, exps);
  if (i.desistiuEm || minhas.some((e) => e.estado === 'nao_seguiu')) return 'desistiu';
  if (minhas.some((e) => e.estado === 'compareceu')) return 'experimental_feita';
  if (minhas.some((e) => e.estado === 'agendada')) return 'experimental_agendada';
  return 'interessado';
}

const TRANSICOES: Record<EstadoDaExperimental, readonly EstadoDaExperimental[]> = {
  agendada: ['compareceu', 'faltou', 'remarcada', 'cancelada'],
  compareceu: ['matriculou', 'nao_seguiu'],
  faltou: [], remarcada: [], cancelada: [], matriculou: [], nao_seguiu: [],
};

/** Muda o estado da experimental, só pelos caminhos do R19.3. */
export function mudarExperimental(e: AulaExperimental, para: EstadoDaExperimental): AulaExperimental {
  if (!TRANSICOES[e.estado].includes(para)) throw new RangeError(`a experimental não passa de "${e.estado}" para "${para}"`);
  return { ...e, estado: para };
}

/** Matricular um interessado: a pessoa já criada no cadastro; a experimental que ele fez vira "matriculou". */
export function matricularInteressado(
  i: Interessado,
  exps: readonly AulaExperimental[],
  pessoaId: Id,
  data: DataISO,
): { interessado: Interessado; experimentais: AulaExperimental[] } {
  if (i.matriculadoEm) throw new RangeError('já está matriculado');
  return {
    interessado: { ...i, matriculadoEm: data, pessoaId },
    experimentais: dele(i, exps).filter((e) => e.estado === 'compareceu').map((e) => ({ ...e, estado: 'matriculou' as const })),
  };
}

export interface NumerosDoFunil {
  contatos: number;
  agendaram: number;
  fizeramExperimental: number;
  matricularam: number;
  desistiram: number;
  /** Dos que fizeram a experimental, quantos se matricularam (pontos-base). */
  experimentalParaMatriculaPontosBase: number;
  /** Dos contatos, quantos se matricularam (pontos-base). */
  contatoParaMatriculaPontosBase: number;
}

function numeros(lista: readonly Interessado[], exps: readonly AulaExperimental[]): NumerosDoFunil {
  const fizeram = lista.filter((i) => experimentalFeitaEm(i, exps));
  const matricularam = lista.filter((i) => i.matriculadoEm);
  const pb = (a: number, b: number) => (b ? Math.round((a * 10000) / b) : 0);
  return {
    contatos: lista.length,
    agendaram: lista.filter((i) => dele(i, exps).length > 0).length,
    fizeramExperimental: fizeram.length,
    matricularam: matricularam.length,
    desistiram: lista.filter((i) => etapaDoInteressado(i, exps) === 'desistiu').length,
    experimentalParaMatriculaPontosBase: pb(fizeram.filter((i) => i.matriculadoEm).length, fizeram.length),
    contatoParaMatriculaPontosBase: pb(matricularam.length, lista.length),
  };
}

export type OrigemNoRelatorio = OrigemDoContato | 'nao_informado';

/** Conversão de quem CHEGOU no período (pela data do contato), no total e por origem. */
export function conversaoDoFunil(
  interessados: readonly Interessado[],
  experimentais: readonly AulaExperimental[],
  periodo: Periodo,
): { total: NumerosDoFunil; porOrigem: Record<OrigemNoRelatorio, NumerosDoFunil> } {
  const doPeriodo = interessados.filter((i) => dentroDoPeriodo(i.contatoEm, periodo));
  const origens: OrigemNoRelatorio[] = ['instagram', 'whatsapp', 'indicacao', 'passou_na_porta', 'outro', 'nao_informado'];
  return {
    total: numeros(doPeriodo, experimentais),
    porOrigem: Object.fromEntries(origens.map((o) => [o, numeros(doPeriodo.filter((i) => (i.origem ?? 'nao_informado') === o), experimentais)])) as Record<OrigemNoRelatorio, NumerosDoFunil>,
  };
}

/**
 * Compareceu à experimental há `diasDepois` dias ou mais e não se matriculou
 * nem desistiu: é hora de chamar. `diasDepois` é da academia [decidir].
 */
export function retornosPendentes(
  interessados: readonly Interessado[],
  experimentais: readonly AulaExperimental[],
  hoje: DataISO,
  opcoes: { diasDepois: number },
): { interessado: Interessado; compareceuEm: DataISO }[] {
  return interessados
    .filter((i) => etapaDoInteressado(i, experimentais) === 'experimental_feita')
    .map((interessado) => ({ interessado, compareceuEm: experimentalFeitaEm(interessado, experimentais)! }))
    .filter((x) => somarDias(x.compareceuEm, opcoes.diasDepois) <= hoje)
    .sort((a, b) => a.compareceuEm.localeCompare(b.compareceuEm));
}

export function lembreteDeRetorno(
  i: Interessado,
  compareceuEm: DataISO,
  opcoes: { diasDepois: number; gerarId: () => Id; porId: Id; em: InstanteISO },
): Lembrete {
  return {
    id: opcoes.gerarId(), academiaId: i.academiaId, titulo: `Retorno da aula experimental: ${i.nome}`,
    detalhe: `Fez a aula em ${formatarDataBR(compareceuEm)}.`,
    data: somarDias(compareceuEm, opcoes.diasDepois), repeticao: 'nao_repete', avisarDiasAntes: 0,
    interessadoId: i.id, criadoPor: opcoes.porId, criadoEm: opcoes.em,
  };
}

/**
 * Interessado que não virou aluno sai do cadastro depois de `dias` sem
 * movimento (R19.1, proposta de 180 dias, [decidir] L23). A conta usa a
 * última experimental ou, sem nenhuma, o contato.
 */
export function interessadosParaApagar(
  interessados: readonly Interessado[],
  experimentais: readonly AulaExperimental[],
  hoje: DataISO,
  dias: number,
): Id[] {
  return interessados
    .filter((i) => !i.matriculadoEm)
    .filter((i) => {
      const ultima = [i.contatoEm, ...dele(i, experimentais).map((e) => e.data)].sort().at(-1)!;
      return somarDias(ultima, dias) < hoje;
    })
    .map((i) => i.id);
}
