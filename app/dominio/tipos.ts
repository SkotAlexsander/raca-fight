/**
 * Tipos do modelo de dados do app (Raça Fight; nasceu como Academia Plus).
 *
 * P12 (agente AM2): o treino de musculação (treino, dias, exercícios, séries,
 * treino realizado, pedido de treino e a biblioteca de exercícios) SAIU. Os
 * tipos de luta (turma, aula, presença, graduação, evento, experimental, kids)
 * moram nas pastas do domínio de luta (`turmas/`, `presenca/`, `graduacao/`…).
 *
 * Fonte das regras: `01-especificacao/03-REGRAS.md` (R1.1, R5.1… citados nos
 * comentários) e `CLAUDE.md`. Detalhe de cada campo e quem lê/escreve:
 * `03-arquitetura/01-MODELO-DE-DADOS.md`.
 *
 * Regras que valem para o arquivo inteiro:
 * - Medidas em unidades inteiras: peso e carga em gramas, altura em milímetros,
 *   tempo em segundos, dinheiro em centavos. Formatação só na tela (`unidades.ts`).
 * - Datas em texto ISO `AAAA-MM-DD`; instantes em ISO 8601 com fuso explícito.
 * - `academiaId` em tudo o que pertence a uma academia, mesmo que a v1 tenha
 *   uma só — a pendência [decidir] "uma ou várias" cabe nas duas respostas.
 * - Sem `enum`: uniões de texto. Node 24 roda este arquivo sem compilar.
 *
 * Este arquivo não importa nada e quase não tem código executável: só tipos e
 * duas listas fixas.
 */

// ---------------------------------------------------------------------------
// Primitivos com nome
// ---------------------------------------------------------------------------

/** Identificador único (UUID em texto), gerado no telefone ou no servidor. */
export type Id = string;

/** Data sem hora, `AAAA-MM-DD`. */
export type DataISO = string;

/** Instante com fuso, ISO 8601 (ex.: `2026-10-10T14:30:00-03:00`). R7.4. */
export type InstanteISO = string;

/** Horário do dia sem data, `HH:MM` (24 h). Usado em refeições. */
export type HoraDoDia = string;

/** Peso ou carga, em gramas, inteiro. */
export type Gramas = number;

/** Comprimento, em milímetros, inteiro. */
export type Milimetros = number;

/** Duração, em segundos, inteiro. */
export type Segundos = number;

/** Dinheiro em centavos de real, inteiro (R7: preço do Plus). */
export type Centavos = number;

// ---------------------------------------------------------------------------
// Academia, usuário e vínculo
// ---------------------------------------------------------------------------

/**
 * Papel de uma pessoa dentro de UMA academia. A mesma pessoa pode ter mais de
 * um vínculo na mesma academia (aluno e instrutor, por exemplo).
 * "Funcionário" na especificação = `recepcao` ou `instrutor`.
 */
export type PapelNaAcademia = 'aluno' | 'recepcao' | 'instrutor' | 'personal' | 'dono';

/** Visão que o app mostra. Deriva do papel, nunca é escolhida à mão. */
export type Visao = 'aluno' | 'academia';

/** Papéis que abrem a visão da academia. */
export const PAPEIS_DA_ACADEMIA: readonly PapelNaAcademia[] = ['recepcao', 'instrutor', 'personal', 'dono'];

export interface Academia {
  id: Id;
  nome: string;
  /** Texto curto, sem espaço, para link (ex.: `academia-centro`). */
  apelido: string;
  /** Código de 6 caracteres que o aluno digita para se vincular (R8.1). Trocável pelo dono. */
  codigoDeVinculo: string;
  /**
   * Código de 6 caracteres que a EQUIPE digita para pedir entrada (F13.4),
   * diferente do dos alunos: quem tem o dos alunos não vira funcionário por
   * engano. O dono troca. Nunca aparece para o aluno.
   */
  codigoDaEquipe: string;
  /** Se verdadeiro, o vínculo nasce `ativo` sem a recepção confirmar (R8.1). */
  entrarSemConfirmacao: boolean;
  /** Fuso IANA (ex.: `America/Sao_Paulo`). */
  fusoHorario: string;
  /** [decidir] marca própria ou white-label. Guardado desde já para caber nas duas. */
  marca?: MarcaDaAcademia;
  criadaEm: InstanteISO;
}

export interface MarcaDaAcademia {
  logoUrl?: string;
  /** Cor em hexadecimal `#RRGGBB`. */
  corPrimaria?: string;
}

/** Dados de identificação. Nada de saúde aqui (R6.1). */
export interface Usuario {
  id: Id;
  nome: string;
  email: string;
  telefone?: string;
  fotoUrl?: string;
  criadoEm: InstanteISO;
}

/** R8.1: nasce `pendente` (aluno digitou o código) ou `ativo`; sair/remover = `encerrado`. */
export type EstadoDoVinculo = 'pendente' | 'ativo' | 'encerrado';

/** R12.11: por que o vínculo acabou, quando a ACADEMIA encerra. Só aparece somado nos números do dono. */
export type MotivoDeSaida = 'cancelou_matricula' | 'mudou_de_academia' | 'outro';

/** Liga um usuário a uma academia com um papel. É o que decide a visão ao entrar. */
export interface Vinculo {
  id: Id;
  usuarioId: Id;
  academiaId: Id;
  papel: PapelNaAcademia;
  estado: EstadoDoVinculo;
  desde: DataISO;
  ate?: DataISO;
  /** R12.11: preenchido quando a academia encerra; ausente quando o próprio aluno sai (R8.3). */
  motivoDeSaida?: MotivoDeSaida;
  /** R12.11: quem encerrou (o próprio usuário, a recepção ou o dono). */
  encerradoPor?: Id;
}

// ---------------------------------------------------------------------------
// Perfil profissional e Equipe da academia (seção 11 das regras, P10)
// ---------------------------------------------------------------------------

/** Na ordem de `Date.getUTCDay()`: 0 = domingo. Usado nos lembretes e nos turnos. */
export type DiaDaSemana = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export const DIAS_DA_SEMANA: readonly DiaDaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export type PeriodoDoDia = 'manha' | 'tarde' | 'noite';

export const PERIODOS_DO_DIA: readonly PeriodoDoDia[] = ['manha', 'tarde', 'noite'];

/** Uma célula da grade "Na academia" (R11.2): dia da semana × turno. */
export interface TurnoNaAcademia {
  dia: DiaDaSemana;
  periodo: PeriodoDoDia;
}

/**
 * R11.3: lista fixa, para o filtro funcionar igual em toda academia. Começa com
 * as que o Alex citou; `outra` leva um texto curto (`especialidadeOutra`).
 * Acrescentar ou renomear é a pergunta 26 de `90-PERGUNTAS-PARA-O-ALEX.md`.
 */
export type Especialidade = 'musculacao' | 'funcional' | 'hiit' | 'reabilitacao' | 'idosos' | 'iniciantes' | 'outra';

export const ESPECIALIDADES: readonly Especialidade[] = ['musculacao', 'funcional', 'hiit', 'reabilitacao', 'idosos', 'iniciantes', 'outra'];

/**
 * R11.2: o perfil pertence ao VÍNCULO de equipe, não à conta (a mesma pessoa
 * pode estar em duas academias, com turnos diferentes). Dado pessoal do
 * profissional, publicado por ele; não é dado de saúde (R11.8).
 * Sem telefone, e-mail ou contato (R11.6) e sem preço (R11.10), de propósito.
 */
export interface PerfilProfissional {
  id: Id;
  vinculoId: Id;
  /** Repetidos do vínculo para a RLS não precisar subir até ele em cada leitura. */
  usuarioId: Id;
  academiaId: Id;
  nomeExibicao: string;
  fotoUrl?: string;
  /** Até 60 caracteres ("Professor de Educação Física"). */
  formacao: string;
  /** Formato do CONFEF: número, categoria e UF, `012345-G/SP` (`lerCref`). */
  cref?: string;
  /** [decidir] se o app confere na consulta do CONFEF/CREF. Só o servidor escreve. */
  crefConferido: boolean;
  especialidades: Especialidade[];
  /**
   * Luta (P12): as modalidades que o professor dá (R16.14, "Professores").
   * Ausente nos perfis antigos = nenhuma.
   */
  modalidadeIds?: Id[];
  /** A graduação do professor em cada modalidade, informada por ele (R16.14): "Faixa preta, 2º grau". */
  graduacaoInformada?: { modalidadeId: Id; texto: string }[];
  /** Obrigatório quando `especialidades` tem `outra`. */
  especialidadeOutra?: string;
  /** "Sobre mim", até 280 caracteres, sem contato (`limparSobre`). */
  sobre: string;
  turnos: TurnoNaAcademia[];
  /** R11.4: a chave "Mostrar meu perfil aos alunos". Nasce falsa; só o profissional liga. */
  visivelAosAlunos: boolean;
  /** R11.8: o consentimento — quando a chave foi ligada pela última vez. */
  visivelDesde?: InstanteISO;
  /** R11.7: o dono escondeu. Vence a chave do profissional; só o dono desfaz. */
  ocultadoPeloDono: boolean;
  atualizadoEm: InstanteISO;
}

// ---------------------------------------------------------------------------
// Objetivo (lista fixa do app — R2.1, trocada para luta pelo R14.10)
// ---------------------------------------------------------------------------

/**
 * R14.10: a lista de luta é a PROPOSTA do AJ ([decidir] L9), a mesma das telas
 * aprovadas (`entrada.html`). Continua opcional e tratada como dado de saúde.
 */
export type ChaveDoObjetivo = 'aprender_a_lutar' | 'condicionamento' | 'defesa_pessoal' | 'competir' | 'perder_peso' | 'saude_e_disciplina';

export const OBJETIVOS: readonly ChaveDoObjetivo[] = ['aprender_a_lutar', 'condicionamento', 'defesa_pessoal', 'competir', 'perder_peso', 'saude_e_disciplina'];

// ---------------------------------------------------------------------------
// Perfil do aluno e medições (dados de saúde — LGPD, seção 6 das regras)
// ---------------------------------------------------------------------------

export type Sexo = 'feminino' | 'masculino' | 'outro' | 'nao_informado';

/**
 * Cadastro opcional do aluno. Tudo aqui pode estar vazio; nenhuma tela trava
 * por falta destes dados. Um por (usuarioId, academiaId); `academiaId` nulo = sem academia.
 * Só o aluno e quem ele autoriza enxergam (R6.4, R6.6). Nunca em log.
 */
export interface PerfilDoAluno {
  usuarioId: Id;
  /** Nulo = aluno sem academia (R8.4, F1 passo 4): o cadastro opcional vale para ele também. */
  academiaId: Id | null;
  dataNascimento?: DataISO;
  sexo?: Sexo;
  /** Zero ou um objetivo (R2.2). Mudanças ficam em `HistoricoDeObjetivo`. */
  objetivo?: ChaveDoObjetivo;
  /** Texto livre: lesões, limitações, orientação médica. */
  restricoes?: string;
  /** Quantos dias por semana pretende treinar (1 a 7). */
  frequenciaSemanalPretendida?: number;
  /**
   * LGPD: quando o aluno leu a frase "quem vai ver" e aceitou guardar dado de
   * saúde (primeira vez que preenche peso/altura — 03-DECISOES-TECNICAS, seção 5).
   * Ausente = nunca preencheu. Diferente de `autorizaAcademia`, que é quem enxerga.
   */
  consentimentoEm?: InstanteISO;
  /** R6.4: a academia só vê cadastro corporal se isto for verdadeiro. Desligar tem efeito imediato. */
  autorizaAcademia: boolean;
  autorizacaoEm?: InstanteISO;
  /** R6.11: menor de 18 precisa de consentimento do responsável antes de guardar dado de saúde. */
  consentimentoDoResponsavelEm?: InstanteISO;
  atualizadoEm: InstanteISO;
}

/** R2.2: cada troca de objetivo fica no histórico com data. */
export interface HistoricoDeObjetivo {
  id: Id;
  alunoId: Id;
  /** Nulo = aluno sem academia (R8.4, F1 passo 4): o cadastro opcional vale para ele também. */
  academiaId: Id | null;
  objetivo: ChaveDoObjetivo | null;
  em: InstanteISO;
}

/** Uma medição no tempo. O histórico é a lista de medições do aluno. */
export interface MedicaoCorporal {
  id: Id;
  alunoId: Id;
  /** Nulo = aluno sem academia (R8.4, F1 passo 4): o cadastro opcional vale para ele também. */
  academiaId: Id | null;
  data: DataISO;
  pesoGramas?: Gramas;
  alturaMilimetros?: Milimetros;
  /** Percentual de gordura em décimos de ponto (ex.: 185 = 18,5 %). */
  gorduraCorporalDecimos?: number;
  circunferencias?: Circunferencias;
  /** Quem anotou: o próprio aluno ou um funcionário. */
  registradoPorId: Id;
}

/** Medidas de fita, em milímetros. Todas opcionais. */
export interface Circunferencias {
  cinturaMilimetros?: Milimetros;
  quadrilMilimetros?: Milimetros;
  peitoMilimetros?: Milimetros;
  bracoDireitoMilimetros?: Milimetros;
  bracoEsquerdoMilimetros?: Milimetros;
  coxaDireitaMilimetros?: Milimetros;
  coxaEsquerdaMilimetros?: Milimetros;
}

// ---------------------------------------------------------------------------
// Plus (seção 5 das regras)
// ---------------------------------------------------------------------------

/**
 * R5.1. "sem_plus" da especificação = não existe `AssinaturaPlus` para o aluno.
 * Só `ativo` e `cancelado_vigente` liberam as funções Plus.
 */
export type EstadoDaAssinatura = 'ativo' | 'cancelado_vigente' | 'inativo' | 'suspenso';

/**
 * [decidir] quem paga e por onde. A união cabe em qualquer resposta: loja
 * (Apple/Google), Pix/cartão direto, ou cobrado pela academia junto da mensalidade.
 */
export type OrigemDoPagamento = 'loja_apple' | 'loja_google' | 'pix' | 'cartao' | 'via_academia';

export interface AssinaturaPlus {
  id: Id;
  alunoId: Id;
  academiaId: Id;
  /** Personal designado pelo dono (R5.5). Pode ficar vazio: "Aguardando seu personal". */
  personalId: Id | null;
  estado: EstadoDaAssinatura;
  inicio: DataISO;
  /** Fim do período pago (`cancelado_vigente`) ou data em que ficou `inativo`. */
  fim?: DataISO;
  /** R5.8: até quando o `suspenso` dura antes de virar `inativo`. */
  carenciaAte?: DataISO;
  origemDoPagamento: OrigemDoPagamento;
  precoCentavos?: Centavos;
  /** Id do recibo na loja ou da cobrança no provedor. Nunca o cartão em si. */
  referenciaExterna?: string;
  criadaEm: InstanteISO;
}

/** R5.2: toda mudança de estado fica no histórico com data, hora e motivo. */
export interface MudancaDeEstadoDaAssinatura {
  id: Id;
  assinaturaId: Id;
  de: EstadoDaAssinatura | null;
  para: EstadoDaAssinatura;
  motivo: string;
  em: InstanteISO;
  /** Quem causou: servidor (webhook), funcionário ou o aluno. */
  porId: Id | 'servidor';
}

// ---------------------------------------------------------------------------
// Dieta: plano → refeições → itens (seção 3 das regras)
// ---------------------------------------------------------------------------

/** R3.1 / R3.2: no máximo um `em_vigor` por data. */
export type EstadoDoPlanoDeDieta = 'em_vigor' | 'futuro' | 'encerrado';

export interface PlanoDeDieta {
  id: Id;
  alunoId: Id;
  academiaId: Id;
  personalId: Id;
  assinaturaId: Id;
  nome: string;
  inicio: DataISO;
  fim?: DataISO;
  observacao?: string;
  estado: EstadoDoPlanoDeDieta;
  /** R3.5: de qual plano foi copiado, se foi. */
  copiadoDeId?: Id;
  refeicoes: Refeicao[];
  criadoEm: InstanteISO;
  atualizadoEm: InstanteISO;
}

/** R3.3. */
export interface Refeicao {
  id: Id;
  planoId: Id;
  ordem: number;
  /** "Café da manhã", "Pré-treino"... */
  nome: string;
  horarioSugerido?: HoraDoDia;
  /** Não conta na adesão (R3.7). */
  opcional: boolean;
  itens: ItemDeRefeicao[];
}

/**
 * R3.4. Na v1 é texto livre ("150 g de frango grelhado").
 * [decidir] banco de alimentos: se vier, `alimentoId`, `quantidadeGramas` e
 * `caloriasKcal` passam a ser preenchidos; a descrição continua valendo.
 */
export interface ItemDeRefeicao {
  id: Id;
  refeicaoId: Id;
  ordem: number;
  descricao: string;
  /** "Troca permitida" em texto, em qualquer versão (R3.4). */
  trocaPermitida?: string;
  alimentoId?: Id;
  quantidadeGramas?: Gramas;
  /** kcal inteiro (R7). */
  caloriasKcal?: number;
}

/** R3.6: sem marca = "a fazer". */
export type EstadoDaRefeicaoRegistrada = 'feita' | 'nao_segui';

/** O aluno marca o que fez em cada data (R3.6). Separado do plano. */
export interface RefeicaoRegistrada {
  id: Id;
  alunoId: Id;
  /** Entra sozinha na fila offline; a RLS filtra por ela sem subir até o plano. */
  academiaId: Id;
  planoId: Id;
  refeicaoId: Id;
  data: DataISO;
  estado: EstadoDaRefeicaoRegistrada;
  /** Hora em que marcou `feita`. */
  feitaEm?: InstanteISO;
  /** Motivo opcional do `nao_segui`. */
  motivo?: string;
  registradaEm: InstanteISO;
  sincronizadoEm?: InstanteISO;
}

// ---------------------------------------------------------------------------
// Conversa [decidir] chat próprio ou WhatsApp (R5.12)
// ---------------------------------------------------------------------------

/** Só existe se a decisão for chat próprio. Modelado para não travar o resto. */
export interface Conversa {
  id: Id;
  academiaId: Id;
  assinaturaId: Id;
  /** Aluno e personal. */
  participanteIds: Id[];
  /** R5.12: quando o Plus desliga, fica só leitura para o aluno. */
  somenteLeituraDesde?: InstanteISO;
  criadaEm: InstanteISO;
}

export interface Mensagem {
  id: Id;
  conversaId: Id;
  autorId: Id;
  texto: string;
  enviadaEm: InstanteISO;
  lidaEm?: InstanteISO;
}
