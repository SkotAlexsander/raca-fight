/**
 * Remuneração do mês de um funcionário (RA6): fixo, comissão sobre o que
 * ENTROU das modalidades dele (regime de caixa, pela repartição) e valor por
 * aula. Dois professores na mesma modalidade recebem cada um sobre a base
 * inteira; dividir a base entre eles é [decidir] (pergunta ao Alex).
 */

import type { Centavos } from '../tipos.ts';
import { aplicarPontosBase } from './dinheiro.ts';
import { periodoDaCompetencia } from './datas.ts';
import { quantoEntrouPorModalidade } from './totais.ts';
import type { Competencia, Funcionario, Lancamento } from './tipos.ts';

export interface RemuneracaoDoMes {
  fixoCentavos: Centavos;
  baseDaComissaoCentavos: Centavos;
  comissaoCentavos: Centavos;
  porAulaCentavos: Centavos;
  totalCentavos: Centavos;
}

export function calcularRemuneracaoDoMes(
  f: Funcionario,
  lancamentos: readonly Lancamento[],
  competencia: Competencia,
  opcoes: { aulasDadas?: number } = {},
): RemuneracaoDoMes {
  const r = f.remuneracao;
  const fixo = r.tipo === 'fixo' || r.tipo === 'fixo_mais_comissao' ? (r.fixoCentavos ?? 0) : 0;
  let base = 0;
  let comissao = 0;
  if (r.tipo === 'comissao' || r.tipo === 'fixo_mais_comissao') {
    const porModalidade = quantoEntrouPorModalidade(lancamentos, periodoDaCompetencia(competencia));
    base = f.modalidadeIds.reduce((s, id) => s + (porModalidade.get(id) ?? 0), 0);
    comissao = aplicarPontosBase(base, r.comissaoPontosBase ?? 0);
  }
  let porAula = 0;
  if (r.tipo === 'por_aula') {
    if (opcoes.aulasDadas == null || !Number.isInteger(opcoes.aulasDadas) || opcoes.aulasDadas < 0) {
      throw new RangeError('remuneração por aula precisa do número de aulas dadas no mês');
    }
    porAula = (r.valorPorAulaCentavos ?? 0) * opcoes.aulasDadas;
  }
  return { fixoCentavos: fixo, baseDaComissaoCentavos: base, comissaoCentavos: comissao, porAulaCentavos: porAula, totalCentavos: fixo + comissao + porAula };
}
