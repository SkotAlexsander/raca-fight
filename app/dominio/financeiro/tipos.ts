/**
 * Tipos da área do ADMINISTRADOR (dono): pessoas, planos, matrículas,
 * cobranças, lançamentos, despesas fixas, fechamento, importação, funil,
 * anotações e histórico.
 *
 * Fonte: `01-especificacao/admin/` (RA1…, HA1…) e
 * `03-arquitetura/01-MODELO-DE-DADOS.md`, seções 26 a 40.
 *
 * Regras do arquivo inteiro (as mesmas do resto do domínio):
 * - Dinheiro em CENTAVOS, inteiro. Percentual em PONTOS-BASE, inteiro
 *   (1000 = 10 %, 200 = 2 %): nada de 0,1 + 0,2 no dado guardado.
 * - Data `AAAA-MM-DD`; mês de referência (competência) `AAAA-MM`.
 * - `academiaId` em tudo.
 * - Sem `enum`: uniões de texto.
 *
 * Só tipos e listas fixas; nenhuma regra mora aqui.
 */

import type { Centavos, DataISO, Id, InstanteISO } from '../tipos.ts';

/** Mês de referência, `AAAA-MM`. */
export type Competencia = string;

/** Percentual inteiro em pontos-base: 10000 = 100 %, 1000 = 10 %, 200 = 2 %. */
export type PontosBase = number;

/** Período fechado, as duas pontas incluídas. */
export interface Periodo {
  de: DataISO;
  ate: DataISO;
}

// ---------------------------------------------------------------------------
// Modalidade (o nome é o mesmo da especificação de luta, AJ)
// ---------------------------------------------------------------------------

/**
 * Modalidade ensinada na academia. É cadastro da academia (a Raça Fight tem
 * Muay Thai, Jiu-Jitsu, Boxe e Luta-Livre), não lista fixa do app.
 */
export interface Modalidade {
  id: Id;
  academiaId: Id;
  nome: string;
  ativa: boolean;
}

// ---------------------------------------------------------------------------
// Pessoas (cadastro administrativo)
// ---------------------------------------------------------------------------

/**
 * Situação do aluno no cadastro do dono. "Matriculado" (com matrícula ativa)
 * NÃO é o "aluno ativo" do R8.5 (treinou nos últimos 30 dias): são duas
 * perguntas diferentes e a tela usa as duas palavras.
 */
export type SituacaoDoAluno = 'matriculado' | 'trancado' | 'inativo';

/**
 * Uma pessoa no cadastro do dono. Existe MESMO sem conta no app: muito aluno
 * nunca instala nada. `usuarioId` liga ao app quando a pessoa tem conta.
 * Nada de saúde aqui (R6.1).
 */
export interface Pessoa {
  id: Id;
  academiaId: Id;
  nome: string;
  telefone?: string;
  email?: string;
  /** [decidir] guardar CPF? Só se a cobrança (nota, boleto) exigir. */
  documento?: string;
  dataNascimento?: DataISO;
  /**
   * Menor de 18 (turmas Kids): a pessoa responsável, também cadastrada. Ela é
   * quem paga (`Matricula.pagadorPessoaId`) e quem recebe a cobrança.
   */
  responsavelPessoaId?: Id;
  usuarioId?: Id;
  ehAluno: boolean;
  ehFuncionario: boolean;
  /** Pessoa só responsável (pai/mãe de aluno Kids), sem treinar. */
  ehResponsavel?: boolean;
  observacao?: string;
  criadaEm: InstanteISO;
  atualizadaEm: InstanteISO;
}

export type FuncaoDoFuncionario = 'professor' | 'recepcao' | 'limpeza' | 'administrativo' | 'outro';

export type TipoDeRemuneracao = 'fixo' | 'comissao' | 'fixo_mais_comissao' | 'por_aula' | 'sem_remuneracao';

export interface Remuneracao {
  tipo: TipoDeRemuneracao;
  /** Salário ou pró-labore do mês. */
  fixoCentavos?: Centavos;
  /** Percentual sobre o que entrou das modalidades dele no mês (regime de caixa). */
  comissaoPontosBase?: PontosBase;
  valorPorAulaCentavos?: Centavos;
}

/** O lado "trabalho" de uma pessoa. Uma pessoa pode ser aluna e professora. */
export interface Funcionario {
  id: Id;
  academiaId: Id;
  pessoaId: Id;
  funcao: FuncaoDoFuncionario;
  /** Professor: as modalidades que ele dá (base da comissão). */
  modalidadeIds: Id[];
  remuneracao: Remuneracao;
  desde: DataISO;
  ate?: DataISO;
}

// ---------------------------------------------------------------------------
// Plano e matrícula
// ---------------------------------------------------------------------------

export type Periodicidade = 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'gratuito';

/** "Muay Thai 3×", "Jiu-Jitsu livre", "Combo 2 modalidades", "Aula experimental". */
export interface Plano {
  id: Id;
  academiaId: Id;
  nome: string;
  modalidadeIds: Id[];
  /** Aulas por semana; ausente = livre. */
  aulasPorSemana?: number;
  periodicidade: Periodicidade;
  /** Valor de UM período (o trimestral é o valor do trimestre). */
  valorCentavos: Centavos;
  taxaDeMatriculaCentavos?: Centavos;
  /**
   * Como repartir o valor entre as modalidades do combo, para os relatórios
   * por modalidade e a comissão. Ausente = partes iguais.
   */
  pesos?: Record<Id, number>;
  ativo: boolean;
}

export type EstadoDaMatricula = 'ativa' | 'trancada' | 'encerrada';

/** `indicacao` = "Traga um amiguinho": quem indicou e quem chegou ganham. */
export type MotivoDoDesconto = 'familia' | 'bolsista' | 'atleta' | 'indicacao' | 'funcionario' | 'outro';

interface BaseDoDesconto {
  motivo: MotivoDoDesconto;
  /** Último dia em que vale (vencimento até esta data). Ausente = sem fim. */
  ate?: DataISO;
  /**
   * Indicação: de onde veio, para rastrear. Na matrícula de quem indicou, o
   * `pessoaId` de quem chegou; na de quem chegou, o de quem indicou.
   */
  origemPessoaId?: Id;
  origemInteressadoId?: Id;
}

export type Desconto =
  | (BaseDoDesconto & { tipo: 'percentual'; pontosBase: PontosBase })
  | (BaseDoDesconto & { tipo: 'valor'; centavos: Centavos });

export interface Matricula {
  id: Id;
  academiaId: Id;
  /** Quem treina. */
  pessoaId: Id;
  /** Quem paga: o responsável no Kids; senão a própria pessoa. Mesma pagadora = mesma família. */
  pagadorPessoaId: Id;
  planoId: Id;
  inicio: DataISO;
  fim?: DataISO;
  estado: EstadoDaMatricula;
  /** 1 a 31; mês curto encurta (31 → 30 em abril). */
  diaDeVencimento: number;
  /** Vários descontos somam (família + indicação); o total nunca passa do valor. */
  descontos: Desconto[];
  /** Trancamento (viagem, lesão): sem cobrança dentro do intervalo. */
  trancadaDe?: DataISO;
  trancadaAte?: DataISO;
  isentarTaxaDeMatricula?: boolean;
}

// ---------------------------------------------------------------------------
// Cobrança (a receber) e lançamento (o caixa)
// ---------------------------------------------------------------------------

export type TipoDeCobranca = 'mensalidade' | 'matricula' | 'graduacao' | 'evento' | 'produto' | 'avulsa';

/** O que fica guardado. Atrasada/a vencer é CALCULADO (`situacaoDaCobranca`). */
export type EstadoDaCobranca = 'aberta' | 'paga' | 'cancelada';

export type FormaDePagamento = 'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'outro';

export const FORMAS_DE_PAGAMENTO: readonly FormaDePagamento[] = [
  'pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'outro',
];

/** A parte de cada modalidade num valor (combo repartido). */
export interface ParteDaModalidade {
  modalidadeId: Id;
  centavos: Centavos;
}

export interface Cobranca {
  id: Id;
  academiaId: Id;
  /** Quem deve (o pagador). */
  pessoaId: Id;
  /** Quem treina, quando é outra pessoa (Kids). */
  alunoPessoaId?: Id;
  matriculaId?: Id;
  eventoId?: Id;
  tipo: TipoDeCobranca;
  competencia: Competencia;
  vencimento: DataISO;
  descricao: string;
  /** Antes do desconto. */
  valorBrutoCentavos: Centavos;
  descontoCentavos: Centavos;
  /** O que se cobra: bruto − desconto. */
  valorCentavos: Centavos;
  estado: EstadoDaCobranca;
  pagaEm?: DataISO;
  valorPagoCentavos?: Centavos;
  formaDePagamento?: FormaDePagamento;
  lancamentoId?: Id;
  /** Repartição congelada no momento da geração (o plano pode mudar depois). */
  reparticao: ParteDaModalidade[];
  criadaEm: InstanteISO;
}

export type TipoDeLancamento = 'entrada' | 'saida';
export type SituacaoDoLancamento = 'pago' | 'pendente';
export type OrigemDoLancamento = 'manual' | 'mensalidade' | 'despesa_fixa' | 'importacao' | 'remuneracao';

/** Uma linha da planilha. */
export interface Lancamento {
  id: Id;
  academiaId: Id;
  /** Pago: o dia em que o dinheiro entrou ou saiu. Pendente: o vencimento. */
  data: DataISO;
  descricao: string;
  categoriaId?: Id;
  tipo: TipoDeLancamento;
  /** Sempre positivo; o sinal vem do `tipo`. */
  valorCentavos: Centavos;
  formaDePagamento?: FormaDePagamento;
  pessoaId?: Id;
  situacao: SituacaoDoLancamento;
  /** Repartição por modalidade (mensalidade de combo, venda ligada a uma modalidade). */
  reparticao?: ParteDaModalidade[];
  origem: OrigemDoLancamento;
  cobrancaId?: Id;
  despesaFixaId?: Id;
  importacaoId?: Id;
  /** Receita ou despesa de um evento (inscrição, ingresso, viagem, premiação). */
  eventoId?: Id;
  /** Despesa variável (luz, água) gerada pela média: o valor é estimativa até alguém conferir. */
  estimado?: boolean;
  observacao?: string;
  arquivado?: boolean;
  criadoPor: Id;
  criadoEm: InstanteISO;
  atualizadoEm: InstanteISO;
}

export interface Categoria {
  id: Id;
  academiaId: Id;
  nome: string;
  tipo: TipoDeLancamento;
  ordem: number;
  arquivada: boolean;
}

export interface DespesaFixa {
  id: Id;
  academiaId: Id;
  descricao: string;
  categoriaId?: Id;
  valorCentavos: Centavos;
  diaDeVencimento: number;
  formaDePagamento?: FormaDePagamento;
  /** Salário: a pessoa que recebe. */
  pessoaId?: Id;
  /** Luz, água: o valor do mês é a média dos últimos 3 lançados (marcado `estimado`). */
  variavel: boolean;
  desde: Competencia;
  ate?: Competencia;
  ativa: boolean;
}

// ---------------------------------------------------------------------------
// Eventos e lutas
// ---------------------------------------------------------------------------

/** Os tipos da especificação de luta (R18.1). */
export type TipoDeEvento = 'exame' | 'seminario' | 'aulao' | 'campeonato' | 'luta' | 'confraternizacao' | 'outro';

/**
 * O Evento é da especificação de luta (R18.1, com hora, local, público e
 * link); aqui só os campos que o financeiro usa para juntar as entradas e
 * saídas de cada um (inscrição, ingresso, viagem, premiação).
 */
export interface Evento {
  id: Id;
  academiaId: Id;
  nome: string;
  tipo: TipoDeEvento;
  data: DataISO;
  local?: string;
  modalidadeIds: Id[];
  arquivado: boolean;
}

// ---------------------------------------------------------------------------
// Regras da academia (o que o dono escolhe uma vez)
// ---------------------------------------------------------------------------

/**
 * [decidir] Cada campo é uma escolha da academia; o domínio NUNCA assume uma
 * delas. As funções recebem a regra pronta.
 */
export interface RegraDeAtraso {
  /** Multa única por atraso. O CDC (art. 52, § 1º) limita a 2 % (200). */
  multaPontosBase: PontosBase;
  /** Juros de mora ao mês, pró-rata por dia (base 30). Limite usado: 1 % (100). */
  jurosAoMesPontosBase: PontosBase;
  /** Dias depois do vencimento sem encargo. */
  diasDeTolerancia: number;
}

/** [decidir] Quem começa no meio do mês paga o mês cheio, a parte do mês ou só a partir do próximo? */
export type RegraDoPrimeiroMes = 'cheio' | 'proporcional' | 'a_partir_do_proximo';

/** Um desconto que a academia escolhe uma vez (família, indicação). */
export type DescontoDaRegra = { tipo: 'percentual'; pontosBase: PontosBase } | { tipo: 'valor'; centavos: Centavos };

/**
 * As escolhas [decidir] da academia, guardadas como CONFIGURAÇÃO (uma por
 * academia; modelo, seção 34). As funções do domínio recebem cada uma pronta:
 * nada aqui tem valor padrão no código.
 */
export interface RegrasDeCobranca {
  academiaId: Id;
  /** A7 */
  primeiroMes: RegraDoPrimeiroMes;
  /** A3. `null` = a academia não cobra multa nem juros. */
  atraso: RegraDeAtraso | null;
  /** A6 */
  gerarSozinhoNoDia1: boolean;
  /** A15 */
  diasParaRetornoDaExperimental: number;
  /** A8. Ausente = não há desconto de família (o Admin só sugere). */
  descontoFamilia?: DescontoDaRegra;
  /** A9 ("Traga um amiguinho"). */
  descontoIndicacao?: DescontoDaRegra & { mesesDeDuracao: number };
  /** L23: dias sem movimento para o interessado sair do cadastro. */
  diasParaApagarInteressado: number;
  whatsappDaAcademia: string;
  /** Verdadeiro enquanto os valores forem os provisórios (a academia ainda não respondeu). */
  provisorio: boolean;
  atualizadoEm: InstanteISO;
}

// ---------------------------------------------------------------------------
// Fechamento e importação
// ---------------------------------------------------------------------------

export interface TotaisDoPeriodo {
  entradas: Centavos;
  saidas: Centavos;
  resultado: Centavos;
  entradasPendentes: Centavos;
  saidasPendentes: Centavos;
  quantidade: number;
}

export interface FechamentoDoMes {
  id: Id;
  academiaId: Id;
  competencia: Competencia;
  totais: TotaisDoPeriodo;
  porCategoria: Record<string, { entradas: Centavos; saidas: Centavos }>;
  aReceberEmAberto: Centavos;
  fechadoEm: InstanteISO;
  fechadoPor: Id;
  reabertoEm?: InstanteISO;
  reabertoPor?: Id;
  motivoDaReabertura?: string;
}

export type PapelDaColuna =
  | 'data' | 'descricao' | 'valor' | 'valor_com_sinal' | 'entrada' | 'saida'
  | 'tipo' | 'categoria' | 'forma' | 'pessoa' | 'situacao' | 'modalidade' | 'observacao' | 'ignorar';

export interface Importacao {
  id: Id;
  academiaId: Id;
  arquivoNome: string;
  formato: 'csv' | 'xlsx' | 'colado';
  mapeamento: { indice: number; cabecalho: string; papel: PapelDaColuna }[];
  linhasLidas: number;
  linhasGravadas: number;
  linhasRepetidas: number;
  linhasComErro: number;
  estado: 'conferindo' | 'gravada' | 'desfeita';
  porId: Id;
  em: InstanteISO;
}

// ---------------------------------------------------------------------------
// Funil: interessado → aula experimental → matrícula
// (Interessado e AulaExperimental são os da especificação de luta, R19.1 e
// R19.3; aqui só o que o funil e o financeiro usam.)
// ---------------------------------------------------------------------------

/** "Como conheceu" (R19.1). Opcional: quem não informou entra como "não informado". */
export type OrigemDoContato = 'instagram' | 'whatsapp' | 'indicacao' | 'passou_na_porta' | 'outro';

export interface Interessado {
  id: Id;
  academiaId: Id;
  nome: string;
  whatsapp?: string;
  modalidadeIds: Id[];
  /** Experimental de criança (R19.10): o interessado é o responsável. */
  crianca?: { nome: string; idade: number };
  origem?: OrigemDoContato;
  /** "Traga um amiguinho" (R19.9): o aluno que indicou. */
  indicadoPorPessoaId?: Id;
  contatoEm: DataISO;
  /** Quando o Admin matricula: a pessoa criada no cadastro. */
  matriculadoEm?: DataISO;
  pessoaId?: Id;
  /** Desistiu antes de qualquer aula (as outras desistências estão na experimental, `nao_seguiu`). */
  desistiuEm?: DataISO;
  motivoDaDesistencia?: string;
}

/** R19.3: agendada → compareceu · faltou · remarcada · cancelada; depois de compareceu, matriculou · nao_seguiu. */
export type EstadoDaExperimental = 'agendada' | 'compareceu' | 'faltou' | 'remarcada' | 'cancelada' | 'matriculou' | 'nao_seguiu';

export interface AulaExperimental {
  id: Id;
  academiaId: Id;
  interessadoId: Id;
  data: DataISO;
  turmaId?: Id;
  /** O horário da grade (AU, 16/10): sem ele, a experimental não aparece na chamada do professor. */
  horarioId?: Id;
  modalidadeId?: Id;
  estado: EstadoDaExperimental;
  marcadaPor: Id;
}

/** A etapa do funil é CALCULADA a partir do interessado e das experimentais dele. */
export type EtapaDoFunil = 'interessado' | 'experimental_agendada' | 'experimental_feita' | 'matriculado' | 'desistiu';

// ---------------------------------------------------------------------------
// Filtro salvo
// ---------------------------------------------------------------------------

/** "Muay Thai inadimplentes há mais de 30 dias" guardado com nome, para abrir de novo. */
export interface FiltroSalvo {
  id: Id;
  academiaId: Id;
  nome: string;
  alvo: 'alunos' | 'funcionarios' | 'lancamentos' | 'cobrancas';
  /** O objeto do filtro (`FiltroDeAlunos`, `FiltroDeLancamentos`…), em JSON. */
  filtro: unknown;
  criadoPor: Id;
  criadoEm: InstanteISO;
}

// ---------------------------------------------------------------------------
// Anotar e lembrar
// ---------------------------------------------------------------------------

export interface Nota {
  id: Id;
  academiaId: Id;
  texto: string;
  pessoaId?: Id;
  lancamentoId?: Id;
  data?: DataISO;
  valorCentavos?: Centavos;
  fixada: boolean;
  arquivada: boolean;
  criadaPor: Id;
  criadaEm: InstanteISO;
  atualizadaEm: InstanteISO;
}

export type RepeticaoDoLembrete = 'nao_repete' | 'semanal' | 'mensal' | 'anual';

export interface Lembrete {
  id: Id;
  academiaId: Id;
  titulo: string;
  detalhe?: string;
  /** A próxima ocorrência. */
  data: DataISO;
  /** `HH:MM`; ausente = o dia todo (aparece no resumo da manhã). */
  hora?: string;
  repeticao: RepeticaoDoLembrete;
  /** Mensal: o dia escolhido (31 continua 31 depois de fevereiro). */
  diaDoMes?: number;
  /** Começa a aparecer N dias antes (0 = no dia). */
  avisarDiasAntes: number;
  pessoaId?: Id;
  valorCentavos?: Centavos;
  despesaFixaId?: Id;
  interessadoId?: Id;
  concluidoEm?: InstanteISO;
  ultimaConclusaoEm?: InstanteISO;
  criadoPor: Id;
  criadoEm: InstanteISO;
}

export interface Tarefa {
  id: Id;
  academiaId: Id;
  titulo: string;
  detalhe?: string;
  prazo?: DataISO;
  responsavelPessoaId?: Id;
  pessoaId?: Id;
  feitaEm?: InstanteISO;
  criadaPor: Id;
  criadaEm: InstanteISO;
}

// ---------------------------------------------------------------------------
// Histórico de tudo
// ---------------------------------------------------------------------------

export type AcaoDoHistorico = 'criou' | 'mudou' | 'arquivou' | 'anulou' | 'fechou' | 'reabriu' | 'importou' | 'desfez_importacao';

export interface MudancaDeCampo {
  campo: string;
  de: unknown;
  para: unknown;
}

/** Quem mudou o quê e quando. No banco, quem grava é um gatilho, nunca a tela. */
export interface RegistroDoHistorico {
  id: Id;
  academiaId: Id;
  tabela: string;
  registroId: Id;
  acao: AcaoDoHistorico;
  mudancas: MudancaDeCampo[];
  porId: Id;
  em: InstanteISO;
  motivo?: string;
}
