/**
 * Despesas que se repetem todo mês (aluguel, salário, luz, internet): viram
 * linhas PENDENTES da planilha no vencimento, uma vez por mês (RA4.8).
 * A variável (luz, água) vem pela média dos últimos 3 meses lançados e fica
 * marcada como estimada até alguém conferir a conta.
 */

import type { Id, InstanteISO } from '../tipos.ts';
import { arredondar } from './dinheiro.ts';
import { competenciaDe, dataNaCompetencia } from './datas.ts';
import type { Competencia, DespesaFixa, Lancamento } from './tipos.ts';

export function despesaValeNoMes(d: DespesaFixa, competencia: Competencia): boolean {
  return d.ativa && d.desde <= competencia && (!d.ate || d.ate >= competencia);
}

export function gerarDespesasFixasDoMes(entrada: {
  competencia: Competencia;
  despesas: readonly DespesaFixa[];
  /** Todos os lançamentos conhecidos (para não duplicar e para a média). */
  lancamentos: readonly Lancamento[];
  porId: Id;
  em: InstanteISO;
  gerarId: () => Id;
}): Lancamento[] {
  const { competencia, despesas, lancamentos, porId, em, gerarId } = entrada;
  const vivos = lancamentos.filter((l) => !l.arquivado && l.despesaFixaId);
  const jaTem = new Set(vivos.filter((l) => competenciaDe(l.data) === competencia).map((l) => l.despesaFixaId));
  const saida: Lancamento[] = [];
  for (const d of despesas) {
    if (!despesaValeNoMes(d, competencia) || jaTem.has(d.id)) continue;
    let valor = d.valorCentavos;
    let estimado = false;
    if (d.variavel) {
      const anteriores = vivos
        .filter((l) => l.despesaFixaId === d.id && competenciaDe(l.data) < competencia && !l.estimado)
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(-3);
      if (anteriores.length) valor = arredondar(anteriores.reduce((s, l) => s + l.valorCentavos, 0) / anteriores.length);
      estimado = true;
    }
    saida.push({
      id: gerarId(), academiaId: d.academiaId, data: dataNaCompetencia(competencia, d.diaDeVencimento), descricao: d.descricao,
      ...(d.categoriaId ? { categoriaId: d.categoriaId } : {}),
      tipo: 'saida', valorCentavos: valor, ...(d.formaDePagamento ? { formaDePagamento: d.formaDePagamento } : {}),
      ...(d.pessoaId ? { pessoaId: d.pessoaId } : {}),
      situacao: 'pendente', origem: 'despesa_fixa', despesaFixaId: d.id, ...(estimado ? { estimado } : {}),
      criadoPor: porId, criadoEm: em, atualizadoEm: em,
    });
  }
  return saida;
}
