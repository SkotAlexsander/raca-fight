/**
 * O que o Admin carrega de uma academia, e o contrato do repositório.
 *
 * Os dois repositórios (local e Supabase) cumprem a MESMA interface. Cada
 * operação é uma intenção do dono ("marcar como paga", "fechar o mês") e é
 * uma transação: ou tudo entra, ou nada entra (05-ADMIN.md, seção 5). Toda
 * operação devolve os dados da academia já atualizados.
 */

import type {
  AulaExperimental, Categoria, Cobranca, Competencia, DespesaFixa, Evento, FechamentoDoMes, FiltroSalvo, FormaDePagamento, Funcionario,
  Importacao, Interessado, Lancamento, Lembrete, Matricula, Modalidade, Nota, Pessoa, Plano, RegistroDoHistorico, RegrasDeCobranca, Tarefa,
} from '@dominio/financeiro/tipos.ts';
import type { LinhaConferida, ColunaDetectada } from '@dominio/financeiro/importacao.ts';
import type { Turma } from '@dominio/turmas/turmas.ts';
import type { ResultadoDaGeracao } from '@dominio/financeiro/mensalidades.ts';
import type { DataISO, Id } from '@dominio/tipos.ts';

export interface Academia {
  id: Id;
  nome: string;
}

export interface DadosDaAcademia {
  academia: Academia;
  modalidades: Modalidade[];
  planos: Plano[];
  pessoas: Pessoa[];
  funcionarios: Funcionario[];
  matriculas: Matricula[];
  cobrancas: Cobranca[];
  lancamentos: Lancamento[];
  categorias: Categoria[];
  despesasFixas: DespesaFixa[];
  fechamentos: FechamentoDoMes[];
  importacoes: Importacao[];
  eventos: Evento[];
  interessados: Interessado[];
  experimentais: AulaExperimental[];
  notas: Nota[];
  lembretes: Lembrete[];
  tarefas: Tarefa[];
  filtrosSalvos: FiltroSalvo[];
  historico: RegistroDoHistorico[];
  regras: RegrasDeCobranca;
  /** A grade de aulas (R14.2a): cada turma com os horários dela (no banco, `turmas` + `horarios`). */
  turmas: Turma[];
}

/** Quem está no Admin. Só o dono entra (RA1.1). */
export interface Sessao {
  usuarioId: Id;
  nome: string;
  papel: 'dono';
  academiaId: Id;
  /** Pessoa do cadastro que é o dono (para "quem fez" no histórico). */
  pessoaId?: Id;
}

/** Uma linha mudada pela grade (editar, colar, desfazer). `depois` arquivado = "apagar". */
export interface MudancaDeLinha {
  antes?: Lancamento;
  depois: Lancamento;
}

/** As tabelas "simples", gravadas inteiras pela ficha ou pelo formulário. */
export interface TabelasSimples {
  pessoas: Pessoa;
  funcionarios: Funcionario;
  matriculas: Matricula;
  planos: Plano;
  categorias: Categoria;
  despesas_fixas: DespesaFixa;
  notas: Nota;
  lembretes: Lembrete;
  tarefas: Tarefa;
  interessados: Interessado;
  aulas_experimentais: AulaExperimental;
  filtros_salvos: FiltroSalvo;
  modalidades: Modalidade;
  turmas: Turma;
}
export type NomeDaTabela = keyof TabelasSimples;

/** Matricular do funil (R19.3): a pessoa, a matrícula e o funil, numa transação só (AU: `matricular_interessado`). */
export interface PedidoDeMatriculaDoFunil {
  /** O interessado já com `matriculadoEm` e `pessoaId`. */
  interessado: Interessado;
  /** As experimentais que viraram "matriculou". */
  experimentais: AulaExperimental[];
  pessoa: Pessoa;
  matricula: Matricula;
  /** "Traga um amiguinho": a matrícula de quem indicou, com o desconto novo. */
  indicador?: Matricula;
}

export interface PedidoDeImportacao {
  arquivoNome: string;
  formato: Importacao['formato'];
  colunas: ColunaDetectada[];
  linhas: LinhaConferida[];
  categoriasNovas: { nome: string; tipo: Categoria['tipo'] }[];
  incluirRepetidas: boolean;
}

export interface Repositorio {
  readonly modo: 'local' | 'supabase';
  carregar(): Promise<DadosDaAcademia>;
  gravarLancamentos(mudancas: MudancaDeLinha[]): Promise<DadosDaAcademia>;
  marcarComoPaga(cobrancaId: Id, p: { data: DataISO; forma: FormaDePagamento; valorPagoCentavos?: number }): Promise<DadosDaAcademia>;
  /** "Marcar as N como pagas" (a família Kids): todas ou nenhuma (AU: `marcar_como_pagas`). */
  marcarComoPagas(cobrancaIds: Id[], p: { data: DataISO; forma: FormaDePagamento }): Promise<DadosDaAcademia>;
  matricularInteressado(p: PedidoDeMatriculaDoFunil): Promise<DadosDaAcademia>;
  desfazerPagamento(cobrancaId: Id): Promise<DadosDaAcademia>;
  cancelarCobranca(cobrancaId: Id): Promise<DadosDaAcademia>;
  gerarMensalidades(competencia: Competencia): Promise<{ dados: DadosDaAcademia; resultado: ResultadoDaGeracao }>;
  gerarDespesasFixas(competencia: Competencia): Promise<{ dados: DadosDaAcademia; geradas: number }>;
  fecharMes(competencia: Competencia): Promise<DadosDaAcademia>;
  reabrirMes(competencia: Competencia, motivo: string): Promise<DadosDaAcademia>;
  importar(p: PedidoDeImportacao): Promise<{ dados: DadosDaAcademia; gravadas: number }>;
  desfazerImportacao(importacaoId: Id): Promise<DadosDaAcademia>;
  salvar<T extends NomeDaTabela>(tabela: T, registro: TabelasSimples[T]): Promise<DadosDaAcademia>;
  salvarRegras(regras: RegrasDeCobranca): Promise<DadosDaAcademia>;
  /** Só o modo local: volta aos dados de exemplo. */
  recomecarExemplo?(): Promise<DadosDaAcademia>;
}

/** Erro de regra (mês fechado, pagamento parcial…): a frase já é para a tela. */
export class ErroDeRegra extends Error {
  override name = 'ErroDeRegra';
}

/** Sem rede: nada foi gravado (05-ADMIN.md, seção 5). */
export class ErroSemConexao extends Error {
  override name = 'ErroSemConexao';
  constructor() {
    super('Sem conexão: nada foi gravado.');
  }
}

/** A sessão não é de dono (a RLS recusou). */
export class ErroSemPermissao extends Error {
  override name = 'ErroSemPermissao';
  constructor() {
    super('Esta área é do dono da academia.');
  }
}
