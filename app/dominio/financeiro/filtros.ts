/**
 * Filtro total (RA10): alunos, funcionários e lançamentos, cruzando cadastro,
 * plano, modalidade e dinheiro. Dentro de um critério, qualquer valor serve
 * (OU); entre critérios, todos valem (E). Critério ausente não filtra.
 *
 * Exemplos que o Alex deu e que estão nos testes: "alunos de Muay Thai
 * inadimplentes há mais de 30 dias" e "quanto entrou de Jiu-Jitsu neste
 * trimestre".
 */

import type { Centavos, DataISO, Id } from '../tipos.ts';
import { situacaoDaCobranca } from './cobrancas.ts';
import { dentroDoPeriodo, ehDataISO } from './datas.ts';
import { gerarCSV } from './exportacao.ts';
import { normalizar } from './nomes.ts';
import type {
  Cobranca, FormaDePagamento, FuncaoDoFuncionario, Funcionario, Lancamento, Matricula, Modalidade, MotivoDoDesconto,
  OrigemDoLancamento, Periodo, Pessoa, Plano, SituacaoDoAluno, SituacaoDoLancamento, TipoDeLancamento, TipoDeRemuneracao,
} from './tipos.ts';

// ---------------------------------------------------------------------------
// Alunos
// ---------------------------------------------------------------------------

export interface LinhaDeAluno {
  pessoa: Pessoa;
  situacao: SituacaoDoAluno;
  /** Matrículas que não estão encerradas. */
  matriculas: Matricula[];
  planoIds: Id[];
  modalidadeIds: Id[];
  pagadorPessoaIds: Id[];
  motivosDeDesconto: MotivoDoDesconto[];
  /** Primeira matrícula. */
  desde?: DataISO;
  emAtrasoCentavos: Centavos;
  /** Do atraso mais antigo; 0 = em dia. */
  diasDeAtraso: number;
}

const trancadaEm = (m: Matricula, hoje: DataISO) =>
  m.estado === 'trancada' || (!!m.trancadaDe && m.trancadaDe <= hoje && (!m.trancadaAte || m.trancadaAte >= hoje));

/** Uma linha por aluno, com tudo o que o filtro cruza já calculado. */
export function linhasDeAlunos(
  dados: { pessoas: readonly Pessoa[]; matriculas: readonly Matricula[]; planos: readonly Plano[]; cobrancas: readonly Cobranca[] },
  hoje: DataISO,
): LinhaDeAluno[] {
  const planoPorId = new Map(dados.planos.map((p) => [p.id, p]));
  return dados.pessoas.filter((p) => p.ehAluno).map((pessoa) => {
    const todas = dados.matriculas.filter((m) => m.pessoaId === pessoa.id);
    const vivas = todas.filter((m) => m.estado !== 'encerrada' && (!m.fim || m.fim >= hoje));
    const ativas = vivas.filter((m) => !trancadaEm(m, hoje));
    const situacao: SituacaoDoAluno = ativas.length ? 'matriculado' : vivas.length ? 'trancado' : 'inativo';
    const minhas = dados.cobrancas.filter((c) => (c.alunoPessoaId ?? c.pessoaId) === pessoa.id);
    let atraso = 0;
    let dias = 0;
    for (const c of minhas) {
      const s = situacaoDaCobranca(c, hoje);
      if (s.estado !== 'atrasada') continue;
      atraso += c.valorCentavos;
      dias = Math.max(dias, s.diasDeAtraso);
    }
    const unicos = <T>(xs: T[]) => [...new Set(xs)];
    return {
      pessoa, situacao, matriculas: vivas,
      planoIds: unicos(vivas.map((m) => m.planoId)),
      modalidadeIds: unicos(vivas.flatMap((m) => planoPorId.get(m.planoId)?.modalidadeIds ?? [])),
      pagadorPessoaIds: unicos(vivas.map((m) => m.pagadorPessoaId)),
      motivosDeDesconto: unicos(vivas.flatMap((m) => m.descontos.map((d) => d.motivo))),
      ...(todas.length ? { desde: todas.map((m) => m.inicio).sort()[0] } : {}),
      emAtrasoCentavos: atraso, diasDeAtraso: dias,
    };
  });
}

export interface FiltroDeAlunos {
  texto?: string;
  situacoes?: SituacaoDoAluno[];
  modalidadeIds?: Id[];
  planoIds?: Id[];
  /** Em atraso há MAIS de N dias. */
  inadimplenteHaMaisDeDias?: number;
  emDia?: boolean;
  /** Primeira matrícula a partir desta data. */
  novosDesde?: DataISO;
  motivosDeDesconto?: MotivoDoDesconto[];
}

const algum = <T>(lista: readonly T[] | undefined, tem: readonly T[]) => !lista?.length || lista.some((x) => tem.includes(x));

/** Só os números, quando o texto parece telefone ("51 90000", "(51) 9…"): 4 dígitos ou mais (AO). */
function digitosDoTelefone(texto: string): string {
  return /^[\d\s()+.-]+$/.test(texto) ? texto.replace(/\D/g, '') : '';
}

export function filtrarAlunos(linhas: readonly LinhaDeAluno[], f: FiltroDeAlunos): LinhaDeAluno[] {
  const texto = f.texto ? normalizar(f.texto) : '';
  const digitos = f.texto ? digitosDoTelefone(f.texto.trim()) : '';
  return linhas.filter((x) =>
    (!texto || normalizar(`${x.pessoa.nome} ${x.pessoa.telefone ?? ''} ${x.pessoa.email ?? ''}`).includes(texto)
      || (digitos.length >= 4 && (x.pessoa.telefone ?? '').replace(/\D/g, '').includes(digitos)))
    && (!f.situacoes?.length || f.situacoes.includes(x.situacao))
    && algum(f.modalidadeIds, x.modalidadeIds)
    && algum(f.planoIds, x.planoIds)
    && algum(f.motivosDeDesconto, x.motivosDeDesconto)
    && (f.inadimplenteHaMaisDeDias == null || x.diasDeAtraso > f.inadimplenteHaMaisDeDias)
    && (!f.emDia || x.diasDeAtraso === 0)
    && (!f.novosDesde || (!!x.desde && x.desde >= f.novosDesde)));
}

export function exportarAlunos(
  linhas: readonly LinhaDeAluno[],
  ctx: { planos: readonly Plano[]; modalidades: readonly Modalidade[]; pessoas: readonly Pessoa[] },
): string {
  const nome = (lista: readonly { id: Id; nome: string }[], ids: readonly Id[]) => ids.map((id) => lista.find((x) => x.id === id)?.nome ?? '').filter(Boolean).join(' + ');
  const rotulo: Record<SituacaoDoAluno, string> = { matriculado: 'Matriculado', trancado: 'Trancado', inativo: 'Inativo' };
  return gerarCSV(
    ['Nome', 'Telefone', 'Situação', 'Planos', 'Modalidades', 'Responsável', 'Em atraso', 'Dias de atraso'],
    linhas.map((x) => [
      x.pessoa.nome, x.pessoa.telefone ?? '', rotulo[x.situacao], nome(ctx.planos, x.planoIds), nome(ctx.modalidades, x.modalidadeIds),
      x.pessoa.responsavelPessoaId ? nome(ctx.pessoas, [x.pessoa.responsavelPessoaId]) : '', { centavos: x.emAtrasoCentavos }, x.diasDeAtraso,
    ]),
  );
}

// ---------------------------------------------------------------------------
// Funcionários
// ---------------------------------------------------------------------------

export interface FiltroDeFuncionarios {
  texto?: string;
  funcoes?: FuncaoDoFuncionario[];
  modalidadeIds?: Id[];
  tiposDeRemuneracao?: TipoDeRemuneracao[];
  /** Padrão: só quem está trabalhando hoje. */
  incluirDesligados?: boolean;
}

export function filtrarFuncionarios(
  funcionarios: readonly Funcionario[],
  pessoas: readonly Pessoa[],
  f: FiltroDeFuncionarios,
  hoje: DataISO,
): { funcionario: Funcionario; pessoa?: Pessoa }[] {
  const texto = f.texto ? normalizar(f.texto) : '';
  return funcionarios
    .map((funcionario) => ({ funcionario, pessoa: pessoas.find((p) => p.id === funcionario.pessoaId) }))
    .filter(({ funcionario: x, pessoa }) =>
      (f.incluirDesligados || !x.ate || x.ate >= hoje)
      && (!texto || normalizar(pessoa?.nome ?? '').includes(texto))
      && (!f.funcoes?.length || f.funcoes.includes(x.funcao))
      && algum(f.modalidadeIds, x.modalidadeIds)
      && (!f.tiposDeRemuneracao?.length || f.tiposDeRemuneracao.includes(x.remuneracao.tipo)));
}

// ---------------------------------------------------------------------------
// Lançamentos
// ---------------------------------------------------------------------------

export interface FiltroDeLancamentos {
  periodo?: Periodo;
  texto?: string;
  tipos?: TipoDeLancamento[];
  situacoes?: SituacaoDoLancamento[];
  categoriaIds?: Id[];
  /** "Sem categoria" entra com o id especial `sem_categoria`. */
  modalidadeIds?: Id[];
  formas?: FormaDePagamento[];
  pessoaIds?: Id[];
  eventoIds?: Id[];
  origens?: OrigemDoLancamento[];
  valorMin?: Centavos;
  valorMax?: Centavos;
  incluirArquivados?: boolean;
}

export function filtrarLancamentos(lancamentos: readonly Lancamento[], f: FiltroDeLancamentos): Lancamento[] {
  const texto = f.texto ? normalizar(f.texto) : '';
  if (f.periodo && (!ehDataISO(f.periodo.de) || !ehDataISO(f.periodo.ate))) throw new RangeError('período inválido');
  return lancamentos.filter((l) =>
    (f.incluirArquivados || !l.arquivado)
    && (!f.periodo || dentroDoPeriodo(l.data, f.periodo))
    && (!texto || normalizar(`${l.descricao} ${l.observacao ?? ''}`).includes(texto))
    && (!f.tipos?.length || f.tipos.includes(l.tipo))
    && (!f.situacoes?.length || f.situacoes.includes(l.situacao))
    && (!f.categoriaIds?.length || f.categoriaIds.includes(l.categoriaId ?? 'sem_categoria'))
    && algum(f.modalidadeIds, (l.reparticao ?? []).map((p) => p.modalidadeId))
    && (!f.formas?.length || (!!l.formaDePagamento && f.formas.includes(l.formaDePagamento)))
    && (!f.pessoaIds?.length || (!!l.pessoaId && f.pessoaIds.includes(l.pessoaId)))
    && (!f.eventoIds?.length || (!!l.eventoId && f.eventoIds.includes(l.eventoId)))
    && (!f.origens?.length || f.origens.includes(l.origem))
    && (f.valorMin == null || l.valorCentavos >= f.valorMin)
    && (f.valorMax == null || l.valorCentavos <= f.valorMax));
}

/**
 * A cobrança em aberto, que a planilha mostra como linha "virtual" (RA4.7),
 * passa no MESMO filtro das linhas? Antes (AO) a tela só olhava o texto (sem
 * tirar o acento) e escondia a mensalidade quando o filtro era a própria
 * categoria Mensalidades. A cobrança é uma entrada pendente, sem forma, com a
 * origem "mensalidade" e a categoria em que ela entra quando paga.
 */
export function cobrancaPassaNoFiltro(
  c: Cobranca,
  f: FiltroDeLancamentos,
  ctx: { nomeDaPessoa: (id?: Id) => string; categoriaId?: Id },
): boolean {
  if (c.estado !== 'aberta') return false;
  const texto = f.texto ? normalizar(f.texto) : '';
  return (!texto || normalizar(`${c.descricao} ${ctx.nomeDaPessoa(c.alunoPessoaId)} ${ctx.nomeDaPessoa(c.pessoaId)}`).includes(texto))
    && (!f.periodo || dentroDoPeriodo(c.vencimento, f.periodo))
    && (!f.tipos?.length || f.tipos.includes('entrada'))
    && (!f.situacoes?.length || f.situacoes.includes('pendente'))
    && (!f.categoriaIds?.length || f.categoriaIds.includes(ctx.categoriaId ?? 'sem_categoria'))
    && algum(f.modalidadeIds, c.reparticao.map((p) => p.modalidadeId))
    && !f.formas?.length
    && (!f.pessoaIds?.length || f.pessoaIds.includes(c.pessoaId) || (!!c.alunoPessoaId && f.pessoaIds.includes(c.alunoPessoaId)))
    && (!f.eventoIds?.length || (!!c.eventoId && f.eventoIds.includes(c.eventoId)))
    && (!f.origens?.length || f.origens.includes('mensalidade'))
    && (f.valorMin == null || c.valorCentavos >= f.valorMin)
    && (f.valorMax == null || c.valorCentavos <= f.valorMax);
}

/**
 * Quanto ENTROU (pago) com o filtro. Com modalidade no filtro, soma só a
 * parte daquela modalidade (o combo não conta inteiro).
 */
export function quantoEntrou(lancamentos: readonly Lancamento[], f: FiltroDeLancamentos): Centavos {
  const filtrados = filtrarLancamentos(lancamentos, { ...f, tipos: ['entrada'], situacoes: ['pago'] });
  if (!f.modalidadeIds?.length) return filtrados.reduce((s, l) => s + l.valorCentavos, 0);
  return filtrados.reduce((s, l) => s + (l.reparticao ?? []).filter((p) => f.modalidadeIds!.includes(p.modalidadeId)).reduce((a, p) => a + p.centavos, 0), 0);
}
