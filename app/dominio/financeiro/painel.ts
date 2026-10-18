/**
 * O painel do dono (RA2): uma chamada, todos os números da primeira tela.
 * Pessoas, funcionários, o mês (realizado), a previsão, os inadimplentes, a
 * comparação com o mês anterior, os 12 meses, o funil do mês e o que lembrar
 * hoje.
 */

import type { Centavos, DataISO } from '../tipos.ts';
import { listarInadimplentes } from './cobrancas.ts';
import { competenciaDe, mesmoPeriodoDoMesAnterior, periodoAteODia, periodoDaCompetencia, somarMeses } from './datas.ts';
import { conversaoDoFunil, type NumerosDoFunil } from './funil.ts';
import { linhasDeAlunos } from './filtros.ts';
import { lembretesDoDia, tarefasAbertas } from './anotacoes.ts';
import { compararPeriodos, evolucaoDoAno, previsaoDoMes, totaisDoPeriodo, type PrevisaoDoMes, type Variacao } from './totais.ts';
import type {
  AulaExperimental, Categoria, Cobranca, Competencia, DespesaFixa, FuncaoDoFuncionario, Funcionario, Interessado, Lancamento, Lembrete, Matricula,
  Periodo, Pessoa, Plano, Tarefa, TotaisDoPeriodo,
} from './tipos.ts';

export interface ResumoDoPainel {
  alunos: { matriculados: number; trancados: number; inativos: number; novosNoMes: number; total: number };
  funcionarios: { total: number; porFuncao: Partial<Record<FuncaoDoFuncionario, number>> };
  mes: TotaisDoPeriodo;
  /**
   * O MESMO trecho dos dois meses (AR, 15/10): no dia 15, 1 a 15 deste mês
   * contra 1 a 15 do anterior. Nunca meio mês contra um mês inteiro.
   */
  comparacao: { periodoAtual: Periodo; periodoAnterior: Periodo; entradas: Variacao; saidas: Variacao; resultado: Variacao };
  /** O mês anterior inteiro ("setembro fechou em…"), à parte e sem percentual. */
  mesAnterior: { competencia: Competencia; totais: TotaisDoPeriodo };
  previsao: PrevisaoDoMes;
  inadimplentes: { pessoas: number; centavos: Centavos };
  evolucao: { competencia: Competencia; entradas: Centavos; saidas: Centavos; resultado: Centavos }[];
  funil: NumerosDoFunil;
  hoje: { lembretesAtrasados: number; lembretesDeHoje: number; lembretesEmBreve: number; tarefasAtrasadas: number };
}

export function resumoDoPainel(d: {
  pessoas: readonly Pessoa[];
  matriculas: readonly Matricula[];
  planos: readonly Plano[];
  cobrancas: readonly Cobranca[];
  funcionarios: readonly Funcionario[];
  lancamentos: readonly Lancamento[];
  despesasFixas: readonly DespesaFixa[];
  categorias: readonly Categoria[];
  interessados: readonly Interessado[];
  experimentais: readonly AulaExperimental[];
  lembretes: readonly Lembrete[];
  tarefas: readonly Tarefa[];
  competencia: Competencia;
  hoje: DataISO;
}): ResumoDoPainel {
  const alunos = linhasDeAlunos(d, d.hoje);
  const conta = (s: string) => alunos.filter((a) => a.situacao === s).length;
  const novos = alunos.filter((a) => a.desde && competenciaDe(a.desde) === d.competencia).length;
  const ativos = d.funcionarios.filter((f) => !f.ate || f.ate >= d.hoje);
  const porFuncao: Partial<Record<FuncaoDoFuncionario, number>> = {};
  for (const f of ativos) porFuncao[f.funcao] = (porFuncao[f.funcao] ?? 0) + 1;
  const periodo = periodoDaCompetencia(d.competencia);
  const periodoAtual = periodoAteODia(d.competencia, d.hoje);
  const periodoAnterior = mesmoPeriodoDoMesAnterior(periodoAtual);
  const competenciaAnterior = somarMeses(d.competencia, -1);
  const inad = listarInadimplentes(d.cobrancas, d.hoje);
  const dia = lembretesDoDia(d.lembretes, d.hoje);
  return {
    alunos: { matriculados: conta('matriculado'), trancados: conta('trancado'), inativos: conta('inativo'), novosNoMes: novos, total: alunos.length },
    funcionarios: { total: ativos.length, porFuncao },
    mes: totaisDoPeriodo(d.lancamentos, periodo),
    comparacao: { periodoAtual, periodoAnterior, ...compararPeriodos(d.lancamentos, periodoAtual, periodoAnterior) },
    mesAnterior: { competencia: competenciaAnterior, totais: totaisDoPeriodo(d.lancamentos, periodoDaCompetencia(competenciaAnterior)) },
    previsao: previsaoDoMes({ competencia: d.competencia, hoje: d.hoje, cobrancas: d.cobrancas, lancamentos: d.lancamentos, despesasFixas: d.despesasFixas }),
    inadimplentes: { pessoas: inad.length, centavos: inad.reduce((s, i) => s + i.totalCentavos, 0) },
    evolucao: evolucaoDoAno(d.lancamentos, d.competencia),
    funil: conversaoDoFunil(d.interessados, d.experimentais, periodo).total,
    hoje: {
      lembretesAtrasados: dia.atrasados.length, lembretesDeHoje: dia.hoje.length, lembretesEmBreve: dia.emBreve.length,
      tarefasAtrasadas: tarefasAbertas(d.tarefas, d.hoje).filter((t) => t.atrasada).length,
    },
  };
}
