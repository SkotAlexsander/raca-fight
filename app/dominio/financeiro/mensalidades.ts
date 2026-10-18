/**
 * Mensalidades geradas sozinhas a partir das matrículas (RA3), descontos
 * (família, bolsista, atleta, indicação) e a repartição do combo entre as
 * modalidades.
 *
 * A geração é IDEMPOTENTE: rodar de novo no mesmo mês não duplica nada, nem
 * recria a cobrança que o dono cancelou de propósito.
 */

import type { Centavos, DataISO, Id, InstanteISO } from '../tipos.ts';
import { aplicarPontosBase, arredondar, repartirPorPesos } from './dinheiro.ts';
import { competenciaDe, dataNaCompetencia, diasEntre, diasNoMes, mesesEntre, nomeDoMesComAno } from './datas.ts';
import type {
  Cobranca, Competencia, Desconto, Matricula, MotivoDoDesconto, ParteDaModalidade, Periodicidade, Plano, RegraDoPrimeiroMes,
} from './tipos.ts';

const MESES_DO_PERIODO: Record<Exclude<Periodicidade, 'gratuito'>, number> = {
  mensal: 1, trimestral: 3, semestral: 6, anual: 12,
};

/** Reparte o valor entre as modalidades do plano (pesos do plano, ou partes iguais). */
export function repartirPorModalidade(valor: Centavos, plano: Pick<Plano, 'modalidadeIds' | 'pesos'>): ParteDaModalidade[] {
  return repartirEntreModalidades(valor, plano.modalidadeIds, plano.pesos);
}

/** Reparte entre as modalidades dadas (pesos opcionais; sem peso = partes iguais). */
export function repartirEntreModalidades(valor: Centavos, modalidadeIds: readonly Id[], pesos?: Record<Id, number>): ParteDaModalidade[] {
  if (!modalidadeIds.length) return [];
  const partes = repartirPorPesos(valor, modalidadeIds.map((id) => pesos?.[id] ?? 1));
  return modalidadeIds.map((modalidadeId, i) => ({ modalidadeId, centavos: partes[i] }));
}

/** Soma os descontos que valem no vencimento; o total nunca passa do valor bruto. */
export function calcularDesconto(
  valorBruto: Centavos,
  descontos: readonly Desconto[],
  vencimento: DataISO,
): { descontoCentavos: Centavos; motivos: MotivoDoDesconto[] } {
  let total = 0;
  const motivos: MotivoDoDesconto[] = [];
  for (const d of descontos) {
    if (d.ate && d.ate < vencimento) continue;
    total += d.tipo === 'percentual' ? aplicarPontosBase(valorBruto, d.pontosBase) : d.centavos;
    motivos.push(d.motivo);
  }
  return { descontoCentavos: Math.min(total, valorBruto), motivos };
}

/**
 * "Traga um amiguinho" (RA3.8): quem indicou e quem chegou ganham o MESMO
 * desconto, até a mesma data, e cada um guarda de onde veio. O valor e a
 * duração são escolha da academia [decidir]: entram prontos.
 */
export function descontosDaIndicacao(entrada: {
  indicador: Matricula;
  novo: Matricula;
  desconto: { tipo: 'percentual'; pontosBase: number } | { tipo: 'valor'; centavos: Centavos };
  ate: DataISO;
  interessadoId?: Id;
}): { indicador: Matricula; novo: Matricula } {
  const { indicador, novo, desconto, ate, interessadoId } = entrada;
  if (indicador.pessoaId === novo.pessoaId) throw new RangeError('indicação para a mesma pessoa');
  const montar = (origemPessoaId: Id): Desconto => ({
    ...desconto, motivo: 'indicacao', ate, origemPessoaId, ...(interessadoId ? { origemInteressadoId: interessadoId } : {}),
  });
  return {
    indicador: { ...indicador, descontos: [...indicador.descontos, montar(novo.pessoaId)] },
    novo: { ...novo, descontos: [...novo.descontos, montar(indicador.pessoaId)] },
  };
}

/**
 * Família (RA3.7): quem paga duas ou mais matrículas ativas. A tela sugere o
 * desconto; o percentual é da academia [decidir] e ninguém aplica sozinho.
 */
export function sugerirDescontoFamilia(
  matriculas: readonly Matricula[],
): { pagadorPessoaId: Id; matriculaIds: Id[]; semDescontoDeFamilia: Id[] }[] {
  const porPagador = new Map<Id, Matricula[]>();
  for (const m of matriculas) {
    if (m.estado !== 'ativa') continue;
    porPagador.set(m.pagadorPessoaId, [...(porPagador.get(m.pagadorPessoaId) ?? []), m]);
  }
  return [...porPagador.entries()]
    .filter(([, ms]) => ms.length > 1)
    .map(([pagadorPessoaId, ms]) => ({
      pagadorPessoaId,
      matriculaIds: ms.map((m) => m.id),
      semDescontoDeFamilia: ms.filter((m) => !m.descontos.some((d) => d.motivo === 'familia')).map((m) => m.id),
    }));
}

export type MotivoDePular =
  | 'ja_existe' | 'trancada' | 'encerrada' | 'fora_do_periodo' | 'gratuito' | 'isenta'
  | 'nao_e_mes_de_cobranca' | 'plano_inexistente' | 'primeiro_mes';

export interface ResultadoDaGeracao {
  novas: Cobranca[];
  puladas: { matriculaId: Id; motivo: MotivoDePular }[];
}

/**
 * Gera as cobranças do mês (mensalidade e, no primeiro mês, a taxa de
 * matrícula). `primeiroMes` é [decidir]: a função não tem padrão de propósito.
 */
export function gerarMensalidadesDoMes(entrada: {
  competencia: Competencia;
  matriculas: readonly Matricula[];
  planos: readonly Plano[];
  existentes: readonly Cobranca[];
  primeiroMes: RegraDoPrimeiroMes;
  gerarId: () => Id;
  em: InstanteISO;
}): ResultadoDaGeracao {
  const { competencia, matriculas, planos, existentes, primeiroMes, gerarId, em } = entrada;
  const planoPorId = new Map(planos.map((p) => [p.id, p]));
  const jaTem = new Set(
    existentes
      .filter((c) => c.competencia === competencia && (c.tipo === 'mensalidade' || c.tipo === 'matricula'))
      .map((c) => `${c.matriculaId}|${c.tipo}`),
  );
  const novas: Cobranca[] = [];
  const puladas: ResultadoDaGeracao['puladas'] = [];
  const pular = (matriculaId: Id, motivo: MotivoDePular) => puladas.push({ matriculaId, motivo });

  for (const m of matriculas) {
    const plano = planoPorId.get(m.planoId);
    if (!plano) { pular(m.id, 'plano_inexistente'); continue; }
    if (plano.periodicidade === 'gratuito') { pular(m.id, 'gratuito'); continue; }
    const compInicio = competenciaDe(m.inicio);
    if (compInicio > competencia) { pular(m.id, 'fora_do_periodo'); continue; }

    const primeiro = compInicio === competencia;
    let vencimento = dataNaCompetencia(competencia, m.diaDeVencimento);
    if (primeiro && m.inicio > vencimento) vencimento = m.inicio;

    if (m.estado === 'encerrada' && (!m.fim || m.fim < vencimento)) { pular(m.id, 'encerrada'); continue; }
    if (m.fim && m.fim < vencimento) { pular(m.id, 'encerrada'); continue; }
    if (m.trancadaDe && m.trancadaDe <= vencimento && (!m.trancadaAte || m.trancadaAte >= vencimento)) {
      pular(m.id, 'trancada'); continue;
    }
    if (mesesEntre(compInicio, competencia) % MESES_DO_PERIODO[plano.periodicidade] !== 0) {
      pular(m.id, 'nao_e_mes_de_cobranca'); continue;
    }

    const alunoPessoaId = m.pagadorPessoaId !== m.pessoaId ? m.pessoaId : undefined;
    const comum = {
      academiaId: m.academiaId, pessoaId: m.pagadorPessoaId, ...(alunoPessoaId ? { alunoPessoaId } : {}),
      matriculaId: m.id, competencia, vencimento, estado: 'aberta' as const, criadaEm: em,
    };

    if (jaTem.has(`${m.id}|mensalidade`)) {
      pular(m.id, 'ja_existe');
    } else if (primeiro && primeiroMes === 'a_partir_do_proximo' && m.inicio.slice(8) !== '01') {
      pular(m.id, 'primeiro_mes');
    } else {
      let bruto = plano.valorCentavos;
      if (primeiro && primeiroMes === 'proporcional' && plano.periodicidade === 'mensal') {
        const dias = diasEntre(m.inicio, dataNaCompetencia(competencia, 31)) + 1;
        bruto = arredondar((bruto * dias) / diasNoMes(competencia));
      }
      const { descontoCentavos } = calcularDesconto(bruto, m.descontos, vencimento);
      const valor = bruto - descontoCentavos;
      if (valor <= 0) {
        pular(m.id, 'isenta');
      } else {
        novas.push({
          ...comum, id: gerarId(), tipo: 'mensalidade', descricao: `${plano.nome} — ${nomeDoMesComAno(competencia)}`,
          valorBrutoCentavos: bruto, descontoCentavos, valorCentavos: valor, reparticao: repartirPorModalidade(valor, plano),
        });
      }
    }

    // Taxa de matrícula: no primeiro mês, uma vez, qualquer que seja a regra do primeiro mês.
    if (primeiro && plano.taxaDeMatriculaCentavos && !m.isentarTaxaDeMatricula && !jaTem.has(`${m.id}|matricula`)) {
      const taxa = plano.taxaDeMatriculaCentavos;
      novas.push({
        ...comum, id: gerarId(), tipo: 'matricula', descricao: `Matrícula — ${plano.nome}`,
        valorBrutoCentavos: taxa, descontoCentavos: 0, valorCentavos: taxa, reparticao: repartirPorModalidade(taxa, plano),
      });
    }
  }
  return { novas, puladas };
}
