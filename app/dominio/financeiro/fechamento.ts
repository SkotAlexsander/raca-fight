/**
 * Fechamento do mês (RA4.10): guarda a foto dos números e TRAVA as linhas do
 * mês. Reabrir pede motivo e fica no histórico. No banco, a trava é um
 * gatilho; aqui está a mesma regra para a tela avisar antes.
 */

import type { Centavos, DataISO, Id, InstanteISO } from '../tipos.ts';
import { competenciaDe, dataNaCompetencia, nomeDaCompetencia, periodoDaCompetencia } from './datas.ts';
import { somarPor, totaisDoPeriodo } from './totais.ts';
import type { Cobranca, Competencia, FechamentoDoMes, Lancamento } from './tipos.ts';

export type TipoDePendencia = 'mes_nao_terminou' | 'lancamento_pendente' | 'sem_categoria' | 'cobranca_em_aberto';

/** O que está pendurado no mês. Não impede fechar: a tela mostra e o dono decide. */
export function pendenciasAntesDeFechar(
  competencia: Competencia,
  lancamentos: readonly Lancamento[],
  cobrancas: readonly Cobranca[],
  hoje: DataISO,
): { tipo: TipoDePendencia; quantidade: number; centavos: Centavos }[] {
  const saida: { tipo: TipoDePendencia; quantidade: number; centavos: Centavos }[] = [];
  if (hoje <= dataNaCompetencia(competencia, 31)) saida.push({ tipo: 'mes_nao_terminou', quantidade: 0, centavos: 0 });
  const doMes = lancamentos.filter((l) => !l.arquivado && competenciaDe(l.data) === competencia);
  const somar = (tipo: TipoDePendencia, xs: { valorCentavos: Centavos }[]) => {
    if (xs.length) saida.push({ tipo, quantidade: xs.length, centavos: xs.reduce((s, x) => s + x.valorCentavos, 0) });
  };
  somar('lancamento_pendente', doMes.filter((l) => l.situacao === 'pendente'));
  somar('sem_categoria', doMes.filter((l) => !l.categoriaId));
  somar('cobranca_em_aberto', cobrancas.filter((c) => c.estado === 'aberta' && c.competencia === competencia));
  return saida;
}

/** "2026-09" → "Setembro de 2026" (começo de frase). */
export function mesComMaiuscula(c: Competencia): string {
  const n = nomeDaCompetencia(c);
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** Fechado = existe fechamento do mês que não foi reaberto. */
export function mesFechado(competencia: Competencia, fechamentos: readonly FechamentoDoMes[]): boolean {
  return fechamentos.some((f) => f.competencia === competencia && !f.reabertoEm);
}

export function fecharMes(entrada: {
  id: Id;
  academiaId: Id;
  competencia: Competencia;
  lancamentos: readonly Lancamento[];
  cobrancas: readonly Cobranca[];
  porId: Id;
  em: InstanteISO;
  fechamentos?: readonly FechamentoDoMes[];
}): FechamentoDoMes {
  const { competencia, lancamentos, cobrancas } = entrada;
  if (mesFechado(competencia, entrada.fechamentos ?? [])) throw new RangeError('o mês já está fechado');
  const periodo = periodoDaCompetencia(competencia);
  return {
    id: entrada.id, academiaId: entrada.academiaId, competencia,
    totais: totaisDoPeriodo(lancamentos, periodo),
    porCategoria: Object.fromEntries(somarPor(lancamentos, periodo, (l) => l.categoriaId ?? 'sem_categoria')),
    aReceberEmAberto: cobrancas.filter((c) => c.estado === 'aberta' && c.competencia <= competencia).reduce((s, c) => s + c.valorCentavos, 0),
    fechadoEm: entrada.em, fechadoPor: entrada.porId,
  };
}

export function reabrirMes(f: FechamentoDoMes, motivo: string, porId: Id, em: InstanteISO): FechamentoDoMes {
  if (!motivo.trim()) throw new RangeError('reabrir o mês pede um motivo');
  if (f.reabertoEm) throw new RangeError('o mês já foi reaberto');
  return { ...f, reabertoEm: em, reabertoPor: porId, motivoDaReabertura: motivo.trim() };
}

/**
 * Pode criar, mudar ou arquivar esta linha? Olha o mês de ANTES e o de
 * DEPOIS: mover uma linha para dentro de um mês fechado também é mexer nele.
 */
export function podeAlterarLancamento(
  antes: Lancamento | undefined,
  depois: Lancamento | undefined,
  fechamentos: readonly FechamentoDoMes[],
): { pode: true } | { pode: false; motivo: string } {
  for (const l of [antes, depois]) {
    if (l && mesFechado(competenciaDe(l.data), fechamentos)) {
      return { pode: false, motivo: `${mesComMaiuscula(competenciaDe(l.data))} está fechado. Reabra o mês para mudar.` };
    }
  }
  return { pode: true };
}
