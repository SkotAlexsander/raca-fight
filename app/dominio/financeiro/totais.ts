/**
 * Os números do painel e dos relatórios (RA2, RA7). Regime de CAIXA: o que
 * entrou e saiu de fato, pela data do lançamento pago. O pendente aparece
 * à parte, nunca misturado ao resultado.
 *
 * Lançamento arquivado não conta em nada.
 */

import type { Centavos, DataISO, Id } from '../tipos.ts';
import { competenciaDe, dentroDoPeriodo, periodoDaCompetencia, ultimasCompetencias } from './datas.ts';
import { despesaValeNoMes } from './despesas-fixas.ts';
import type { Cobranca, Competencia, DespesaFixa, Lancamento, Periodo, TotaisDoPeriodo } from './tipos.ts';

const vivo = (l: Lancamento) => !l.arquivado;

export function totaisDoPeriodo(lancamentos: readonly Lancamento[], periodo: Periodo): TotaisDoPeriodo {
  const t: TotaisDoPeriodo = { entradas: 0, saidas: 0, resultado: 0, entradasPendentes: 0, saidasPendentes: 0, quantidade: 0 };
  for (const l of lancamentos) {
    if (!vivo(l) || !dentroDoPeriodo(l.data, periodo)) continue;
    t.quantidade += 1;
    if (l.situacao === 'pago') {
      if (l.tipo === 'entrada') t.entradas += l.valorCentavos;
      else t.saidas += l.valorCentavos;
    } else if (l.tipo === 'entrada') t.entradasPendentes += l.valorCentavos;
    else t.saidasPendentes += l.valorCentavos;
  }
  t.resultado = t.entradas - t.saidas;
  return t;
}

/** Soma o realizado (pago) por uma chave: categoria, forma, pessoa, evento… Sem chave, fica de fora. */
export function somarPor(
  lancamentos: readonly Lancamento[],
  periodo: Periodo,
  chave: (l: Lancamento) => string | undefined,
): Map<string, { entradas: Centavos; saidas: Centavos }> {
  const m = new Map<string, { entradas: Centavos; saidas: Centavos }>();
  for (const l of lancamentos) {
    if (!vivo(l) || l.situacao !== 'pago' || !dentroDoPeriodo(l.data, periodo)) continue;
    const k = chave(l);
    if (k == null) continue;
    const atual = m.get(k) ?? { entradas: 0, saidas: 0 };
    if (l.tipo === 'entrada') atual.entradas += l.valorCentavos;
    else atual.saidas += l.valorCentavos;
    m.set(k, atual);
  }
  return m;
}

/** Quanto entrou de cada modalidade (o combo entra pela repartição congelada). */
export function quantoEntrouPorModalidade(lancamentos: readonly Lancamento[], periodo: Periodo): Map<Id, Centavos> {
  const m = new Map<Id, Centavos>();
  for (const l of lancamentos) {
    if (!vivo(l) || l.situacao !== 'pago' || l.tipo !== 'entrada' || !dentroDoPeriodo(l.data, periodo)) continue;
    for (const p of l.reparticao ?? []) m.set(p.modalidadeId, (m.get(p.modalidadeId) ?? 0) + p.centavos);
  }
  return m;
}

/** Cada evento com o que entrou (inscrições, ingressos) e o que saiu (viagem, taxa, premiação). */
export function resultadoPorEvento(lancamentos: readonly Lancamento[]): Map<Id, { entradas: Centavos; saidas: Centavos; resultado: Centavos }> {
  const m = new Map<Id, { entradas: Centavos; saidas: Centavos; resultado: Centavos }>();
  for (const l of lancamentos) {
    if (!vivo(l) || l.situacao !== 'pago' || !l.eventoId) continue;
    const a = m.get(l.eventoId) ?? { entradas: 0, saidas: 0, resultado: 0 };
    if (l.tipo === 'entrada') a.entradas += l.valorCentavos;
    else a.saidas += l.valorCentavos;
    a.resultado = a.entradas - a.saidas;
    m.set(l.eventoId, a);
  }
  return m;
}

export interface Variacao {
  atual: Centavos;
  anterior: Centavos;
  diferenca: Centavos;
  /** null quando o anterior é zero (não há percentual honesto). */
  pontosBase: number | null;
}

function variacao(atual: Centavos, anterior: Centavos): Variacao {
  return {
    atual, anterior, diferenca: atual - anterior,
    pontosBase: anterior === 0 ? null : Math.round(((atual - anterior) * 10000) / Math.abs(anterior)),
  };
}

export function compararPeriodos(
  lancamentos: readonly Lancamento[],
  atual: Periodo,
  anterior: Periodo,
): { entradas: Variacao; saidas: Variacao; resultado: Variacao } {
  const a = totaisDoPeriodo(lancamentos, atual);
  const b = totaisDoPeriodo(lancamentos, anterior);
  return { entradas: variacao(a.entradas, b.entradas), saidas: variacao(a.saidas, b.saidas), resultado: variacao(a.resultado, b.resultado) };
}

/** Os 12 meses que terminam em `ate`, do mais antigo para o mais novo. */
export function evolucaoDoAno(
  lancamentos: readonly Lancamento[],
  ate: Competencia,
): { competencia: Competencia; entradas: Centavos; saidas: Centavos; resultado: Centavos }[] {
  return ultimasCompetencias(ate, 12).map((competencia) => {
    const t = totaisDoPeriodo(lancamentos, periodoDaCompetencia(competencia));
    return { competencia, entradas: t.entradas, saidas: t.saidas, resultado: t.resultado };
  });
}

export interface PrevisaoDoMes {
  jaEntrou: Centavos;
  /** Cobranças abertas do mês (inclusive as que já atrasaram dentro do mês). */
  aReceberNoMes: Centavos;
  /** Atrasado de meses anteriores: pode entrar, mas não se conta como certo. */
  atrasadoDeMesesAnteriores: Centavos;
  jaSaiu: Centavos;
  /** Saídas pendentes do mês + despesas fixas que ainda nem têm linha. */
  aPagarNoMes: Centavos;
  resultadoPrevisto: Centavos;
}

export function previsaoDoMes(entrada: {
  competencia: Competencia;
  hoje: DataISO;
  cobrancas: readonly Cobranca[];
  lancamentos: readonly Lancamento[];
  despesasFixas: readonly DespesaFixa[];
}): PrevisaoDoMes {
  const { competencia, cobrancas, lancamentos, despesasFixas } = entrada;
  const t = totaisDoPeriodo(lancamentos, periodoDaCompetencia(competencia));
  let aReceber = 0;
  let atrasado = 0;
  for (const c of cobrancas) {
    if (c.estado !== 'aberta') continue;
    if (c.competencia === competencia) aReceber += c.valorCentavos;
    else if (c.competencia < competencia) atrasado += c.valorCentavos;
  }
  const comLinha = new Set(
    lancamentos.filter((l) => vivo(l) && l.despesaFixaId && competenciaDe(l.data) === competencia).map((l) => l.despesaFixaId),
  );
  const fixasSemLinha = despesasFixas
    .filter((d) => despesaValeNoMes(d, competencia) && !comLinha.has(d.id))
    .reduce((s, d) => s + d.valorCentavos, 0);
  const aPagar = t.saidasPendentes + fixasSemLinha;
  return {
    jaEntrou: t.entradas, aReceberNoMes: aReceber, atrasadoDeMesesAnteriores: atrasado,
    jaSaiu: t.saidas, aPagarNoMes: aPagar, resultadoPrevisto: t.entradas + aReceber - t.saidas - aPagar,
  };
}
