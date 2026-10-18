/**
 * Cobrança: situação calculada, multa e juros, "marcar como paga" (que cria a
 * linha da planilha), desfazer, cancelar e inadimplência (RA3, RA5).
 */

import type { Centavos, DataISO, Id, InstanteISO } from '../tipos.ts';
import { arredondar, aplicarPontosBase, repartirPorPesos } from './dinheiro.ts';
import { dataNaCompetencia, diasEntre } from './datas.ts';
import type { Cobranca, Competencia, FormaDePagamento, Lancamento, RegraDeAtraso } from './tipos.ts';

export type EstadoCalculado = 'paga' | 'cancelada' | 'a_vencer' | 'vence_hoje' | 'atrasada';

export function situacaoDaCobranca(c: Cobranca, hoje: DataISO): { estado: EstadoCalculado; diasDeAtraso: number } {
  if (c.estado === 'paga') return { estado: 'paga', diasDeAtraso: 0 };
  if (c.estado === 'cancelada') return { estado: 'cancelada', diasDeAtraso: 0 };
  const dias = diasEntre(c.vencimento, hoje);
  if (dias > 0) return { estado: 'atrasada', diasDeAtraso: dias };
  return { estado: dias === 0 ? 'vence_hoje' : 'a_vencer', diasDeAtraso: 0 };
}

/** Limites usados: multa de 2 % (CDC, art. 52, § 1º) e juros de 1 % ao mês. Confirmar com o contador. */
export const MULTA_MAXIMA_PONTOS_BASE = 200;
export const JUROS_MAXIMO_AO_MES_PONTOS_BASE = 100;

export function validarRegraDeAtraso(r: RegraDeAtraso): string[] {
  const erros: string[] = [];
  if (!Number.isInteger(r.multaPontosBase) || r.multaPontosBase < 0 || r.multaPontosBase > MULTA_MAXIMA_PONTOS_BASE) {
    erros.push('A multa vai de 0 a 2 % (o Código de Defesa do Consumidor limita a 2 %).');
  }
  if (!Number.isInteger(r.jurosAoMesPontosBase) || r.jurosAoMesPontosBase < 0 || r.jurosAoMesPontosBase > JUROS_MAXIMO_AO_MES_PONTOS_BASE) {
    erros.push('Os juros vão de 0 a 1 % ao mês.');
  }
  if (!Number.isInteger(r.diasDeTolerancia) || r.diasDeTolerancia < 0 || r.diasDeTolerancia > 30) {
    erros.push('A tolerância vai de 0 a 30 dias.');
  }
  return erros;
}

/**
 * Multa (uma vez) + juros simples pró-rata dia, base 30, contados desde o
 * vencimento quando passa da tolerância. `regra` nula = a academia não cobra
 * encargo (a escolha é [decidir]).
 */
export function calcularEncargos(
  valor: Centavos,
  vencimento: DataISO,
  dataDoPagamento: DataISO,
  regra: RegraDeAtraso | null,
): { multaCentavos: Centavos; jurosCentavos: Centavos; totalCentavos: Centavos; diasDeAtraso: number } {
  const dias = Math.max(0, diasEntre(vencimento, dataDoPagamento));
  if (!regra || dias === 0 || dias <= regra.diasDeTolerancia) {
    return { multaCentavos: 0, jurosCentavos: 0, totalCentavos: 0, diasDeAtraso: dias };
  }
  const multa = aplicarPontosBase(valor, regra.multaPontosBase);
  const juros = arredondar((valor * regra.jurosAoMesPontosBase * dias) / (10000 * 30));
  return { multaCentavos: multa, jurosCentavos: juros, totalCentavos: multa + juros, diasDeAtraso: dias };
}

export function marcarComoPaga(
  c: Cobranca,
  p: {
    data: DataISO;
    forma: FormaDePagamento;
    valorPagoCentavos?: Centavos;
    categoriaId?: Id;
    porId: Id;
    em: InstanteISO;
    gerarId: () => Id;
  },
): { cobranca: Cobranca; lancamento: Lancamento } {
  if (c.estado === 'paga') throw new RangeError('a cobrança já está paga');
  if (c.estado === 'cancelada') throw new RangeError('a cobrança está cancelada');
  const pago = p.valorPagoCentavos ?? c.valorCentavos;
  if (!Number.isSafeInteger(pago) || pago < c.valorCentavos) {
    throw new RangeError('pagamento parcial não é aceito (pergunta ao Alex)');
  }
  const lancamentoId = p.gerarId();
  const reparticao = c.reparticao.length
    ? repartirPorPesos(pago, c.reparticao.map((r) => r.centavos || 1)).map((centavos, i) => ({ modalidadeId: c.reparticao[i].modalidadeId, centavos }))
    : undefined;
  const lancamento: Lancamento = {
    id: lancamentoId, academiaId: c.academiaId, data: p.data, descricao: c.descricao,
    ...(p.categoriaId ? { categoriaId: p.categoriaId } : {}),
    tipo: 'entrada', valorCentavos: pago, formaDePagamento: p.forma, pessoaId: c.pessoaId, situacao: 'pago',
    ...(reparticao ? { reparticao } : {}),
    origem: 'mensalidade', cobrancaId: c.id, ...(c.eventoId ? { eventoId: c.eventoId } : {}),
    criadoPor: p.porId, criadoEm: p.em, atualizadoEm: p.em,
  };
  const cobranca: Cobranca = {
    ...c, estado: 'paga', pagaEm: p.data, valorPagoCentavos: pago, formaDePagamento: p.forma, lancamentoId,
  };
  return { cobranca, lancamento };
}

/** Volta a cobrança para aberta. O lançamento é ARQUIVADO (não apagado), e o histórico guarda os dois. */
export function desfazerPagamento(c: Cobranca): { cobranca: Cobranca; lancamentoParaArquivar?: Id } {
  if (c.estado !== 'paga') throw new RangeError('a cobrança não está paga');
  const cobranca: Cobranca = { ...c, estado: 'aberta' };
  delete cobranca.pagaEm;
  delete cobranca.valorPagoCentavos;
  delete cobranca.formaDePagamento;
  delete cobranca.lancamentoId;
  return { cobranca, ...(c.lancamentoId ? { lancamentoParaArquivar: c.lancamentoId } : {}) };
}

export function cancelarCobranca(c: Cobranca): Cobranca {
  if (c.estado === 'paga') throw new RangeError('cobrança paga não se cancela: desfaça o pagamento antes');
  return { ...c, estado: 'cancelada' };
}

export interface Inadimplente {
  pessoaId: Id;
  totalCentavos: Centavos;
  diasDoAtrasoMaisAntigo: number;
  vencimentoMaisAntigo: DataISO;
  cobrancaIds: Id[];
}

/** Quem deve (atrasada, depois do vencimento), agrupado por pagador; maior atraso primeiro. */
export function listarInadimplentes(
  cobrancas: readonly Cobranca[],
  hoje: DataISO,
  opcoes: { haMaisDeDias?: number } = {},
): Inadimplente[] {
  const minimo = opcoes.haMaisDeDias ?? 0;
  const porPessoa = new Map<Id, Inadimplente>();
  for (const c of cobrancas) {
    const s = situacaoDaCobranca(c, hoje);
    if (s.estado !== 'atrasada') continue;
    const atual = porPessoa.get(c.pessoaId) ?? {
      pessoaId: c.pessoaId, totalCentavos: 0, diasDoAtrasoMaisAntigo: 0, vencimentoMaisAntigo: c.vencimento, cobrancaIds: [],
    };
    atual.totalCentavos += c.valorCentavos;
    atual.cobrancaIds.push(c.id);
    if (s.diasDeAtraso > atual.diasDoAtrasoMaisAntigo) {
      atual.diasDoAtrasoMaisAntigo = s.diasDeAtraso;
      atual.vencimentoMaisAntigo = c.vencimento;
    }
    porPessoa.set(c.pessoaId, atual);
  }
  return [...porPessoa.values()]
    .filter((i) => i.diasDoAtrasoMaisAntigo > minimo)
    .sort((a, b) => b.diasDoAtrasoMaisAntigo - a.diasDoAtrasoMaisAntigo || b.totalCentavos - a.totalCentavos);
}

/** Do que venceu no mês até hoje, quanto está em atraso (em pontos-base). */
export function taxaDeInadimplencia(
  cobrancas: readonly Cobranca[],
  competencia: Competencia,
  hoje: DataISO,
): { vencidoCentavos: Centavos; emAtrasoCentavos: Centavos; pontosBase: number } {
  const fim = dataNaCompetencia(competencia, 31);
  const limite = hoje < fim ? hoje : fim;
  let vencido = 0;
  let atraso = 0;
  for (const c of cobrancas) {
    if (c.estado === 'cancelada' || c.competencia !== competencia || c.vencimento > limite) continue;
    vencido += c.valorCentavos;
    if (situacaoDaCobranca(c, hoje).estado === 'atrasada') atraso += c.valorCentavos;
  }
  return { vencidoCentavos: vencido, emAtrasoCentavos: atraso, pontosBase: vencido ? Math.round((atraso * 10000) / vencido) : 0 };
}
