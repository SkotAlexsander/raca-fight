/**
 * A interface ÚNICA dos dados do app. Tela nenhuma fala com Supabase, SQLite ou
 * arquivo: pede aqui (por `useRepositorio()` ou pelos hooks de `consultas.ts`).
 *
 * Duas implementações:
 * - `local/RepositorioLocal.ts` — os dados de exemplo (a Raça Fight com a
 *   grade real e pessoas FICTÍCIAS), com tudo o que o app grava guardado no
 *   aparelho (SQLite no celular, localStorage na web). Roda até existir a conta
 *   do Supabase (escolha provisória de 11/10/2026).
 * - `supabase/RepositorioSupabase.ts` — só a forma, sem chamada real.
 *
 * Luta (P12, agente AM2): o treino de musculação saiu (treinos, prontos,
 * exercícios, treino realizado, pedido de treino, envio de treino). Entram a
 * academia de luta (modalidades, turmas, régua de graduação, janela do
 * check-in), a presença, a graduação, o exame, os eventos e as lutas, a área
 * Atletas, as técnicas, o "Raça Responde", os dependentes Kids, a aula
 * experimental e a indicação.
 *
 * Leitura e escrita são assíncronas (vão virar rede), MENOS a presença: o
 * check-in do aluno e a chamada do professor gravam no aparelho de forma
 * SÍNCRONA e entram na fila (R15.9), antes de qualquer animação. O que é da
 * academia (graduação, cancelar aula, evento, experimental) precisa de sinal e
 * falha com `ErroSemSinal` sem ele, como o pedido de vínculo.
 */
import type { Academia, AssinaturaPlus, DataISO, Id, InstanteISO, MedicaoCorporal, MotivoDeSaida, PapelNaAcademia, PerfilDoAluno, PerfilProfissional, PlanoDeDieta, RefeicaoRegistrada, Usuario, Vinculo } from '../dominio/tipos.ts';
import type { PreferenciasDaEquipe, PreferenciasDeAviso } from '../dominio/avisos.ts';
import type { ItemDaFila } from '../dominio/sincronizacao.ts';
import type { Modalidade } from '../dominio/modalidades/modalidades.ts';
import type { AjusteDeAula, Turma } from '../dominio/turmas/turmas.ts';
import type { JanelaDeCheckin, Presenca } from '../dominio/presenca/presenca.ts';
import type { SistemaDeGraduacao } from '../dominio/graduacao/sistemas.ts';
import type { Exame, Graduacao } from '../dominio/graduacao/graduacao.ts';
import type { ConsentimentoDeAtleta, EventoDaAcademia, Luta } from '../dominio/eventos/eventos.ts';
import type { PerguntaFrequente, Tecnica } from '../dominio/conteudo/conteudo.ts';
import type { Dependente } from '../dominio/kids/kids.ts';
import type { AulaExperimental, Indicacao, Interessado } from '../dominio/experimental/experimental.ts';

export interface VinculoComAcademia extends Vinculo {
  academia: Academia;
}

/** O contato público da academia (vitrine, Academia, experimental). */
export interface ContatoDaAcademia {
  nome: string;
  nomeCurto: string;
  frase: string;
  endereco: string;
  cidade: string;
  whatsapp: string;
  instagram?: string;
}

/**
 * A academia de LUTA: o que o Admin configura e os dois apps leem. Os valores
 * que são [decidir] vêm daqui (a janela do check-in, L7; o link em evento,
 * L22), nunca de uma constante escondida na tela.
 */
export interface AcademiaDeLuta {
  academiaId: Id;
  contato: ContatoDaAcademia;
  fuso: string;
  modalidades: Modalidade[];
  turmas: Turma[];
  /** As réguas, já ligadas às modalidades (`modalidadeId`). */
  sistemas: SistemaDeGraduacao[];
  janela: JanelaDeCheckin;
  aceitaLinkEmEvento: boolean;
}

/**
 * O que o app sabe de cada aluno na luta (enquanto o Admin não existe, vem do
 * exemplo): as modalidades da matrícula, as turmas, a marca de atleta por
 * modalidade (R14.9). O aluno pode ser um DEPENDENTE (criança sem conta).
 * Nada financeiro aqui, de propósito (R14.6a, R15.7).
 */
export interface FichaDeLuta {
  alunoId: Id;
  academiaId: Id;
  nome: string;
  /** Ausente = adulto com conta. */
  dependenteDe?: Id;
  dataNascimento?: DataISO;
  modalidadeIds: Id[];
  turmaIds: Id[];
  atletaEm: Id[];
  desde: DataISO;
}

/** O aviso da academia no Início dos alunos (F10, R10.10): um em vigor por vez, o mais recente. */
export interface AvisoDaAcademia {
  id: Id;
  academiaId: Id;
  texto: string;
  publicadoEm: InstanteISO;
  /** Quantos dias fica no Início (1, 3, 7 ou 14; `validarAvisoDaAcademia`). */
  validadeDias: number;
  /** Se notificou (no máximo um aviso com notificação por dia). */
  comNotificacao: boolean;
  autorId: Id;
  /** Aviso de uma TURMA (R22.1); ausente = para todos. */
  turmaId?: Id;
  retiradoEm?: InstanteISO;
  retiradoPorId?: Id;
}

export interface MembroDaEquipe {
  usuario: Usuario;
  vinculo: Vinculo;
  perfil: PerfilProfissional | null;
}

/** Um aluno na lista da equipe: a ficha de luta e o vínculo (o adulto). */
export interface ResumoDoAluno {
  ficha: FichaDeLuta;
  vinculo: Vinculo | null;
  usuario: Usuario | null;
}

/**
 * A ação precisa de sinal: conta nova, pedido de vínculo, e o que é da
 * academia (graduação, cancelar aula, evento, experimental). Sem rede, nada é
 * gravado e a tela avisa.
 */
export class ErroSemSinal extends Error {
  readonly codigo = 'sem_sinal';
  constructor() {
    super('sem sinal: esta ação precisa de rede');
  }
}

/** Contas para "entrar" sem login de verdade (só no repositório local). */
export interface ContaDeExemplo {
  usuarioId: Id;
  nome: string;
  descricao: string;
}

export interface Repositorio {
  readonly nome: 'local' | 'supabase';

  // conta e vínculos
  contasDeExemplo(): ContaDeExemplo[];
  usuario(usuarioId: Id): Promise<Usuario | null>;
  /** A conta com esse e-mail (sem diferença de maiúscula e espaço). No local, o "Entrar com e-mail" simulado. */
  usuarioPeloEmail(email: string): Promise<Usuario | null>;
  vinculosDoUsuario(usuarioId: Id): Promise<VinculoComAcademia[]>;

  // entrada (F13): conta nova, código da academia, pedido de vínculo
  criarConta(dados: { nome: string; email: string }): Promise<Usuario>;
  academiaPeloCodigo(codigo: string): Promise<Academia | null>;
  academiaPeloCodigoDaEquipe(codigo: string): Promise<Academia | null>;
  pedirVinculo(usuarioId: Id, academiaId: Id, papel: PapelNaAcademia): Promise<Vinculo>;
  cancelarPedidoDeVinculo(vinculoId: Id, porId: Id): Promise<void>;

  // a academia de luta (configuração, grade, réguas) — também a vitrine sem conta
  academiaDeLuta(academiaId: Id): Promise<AcademiaDeLuta>;
  /** A academia da vitrine (sem conta): a única do exemplo. */
  academiaDaVitrine(): Promise<AcademiaDeLuta>;
  ajustesDeAula(academiaId: Id): Promise<AjusteDeAula[]>;
  /** Cancelar (R14.5): grava o ajuste e retira os check-ins da aula (R15.11). Precisa de sinal. */
  cancelarAula(ajuste: AjusteDeAula): Promise<void>;
  passarAula(ajuste: AjusteDeAula): Promise<void>;

  // alunos de luta
  fichasDaAcademia(academiaId: Id): Promise<FichaDeLuta[]>;
  /** As fichas de quem a conta cuida: a própria (se treina) e as dos dependentes. */
  fichasDoUsuario(usuarioId: Id): Promise<FichaDeLuta[]>;
  marcarAtleta(alunoId: Id, academiaId: Id, modalidadeId: Id, atleta: boolean): Promise<void>;
  alunosDaAcademia(academiaId: Id): Promise<ResumoDoAluno[]>;

  // presença (R15): grava no aparelho primeiro e sobe depois
  presencasDaAcademia(academiaId: Id): Promise<Presenca[]>;
  presencasDosAlunos(alunoIds: readonly Id[]): Promise<Presenca[]>;
  /** SÍNCRONO: grava e põe na fila. Chame ANTES de animar. */
  registrarPresencas(presencas: readonly Presenca[], tipo: 'checkin' | 'chamada', usuarioId: Id): ItemDaFila[];

  // graduação (R16): da equipe, com sinal
  graduacoesDaAcademia(academiaId: Id): Promise<Graduacao[]>;
  graduacoesDosAlunos(alunoIds: readonly Id[]): Promise<Graduacao[]>;
  salvarGraduacao(g: Graduacao): Promise<void>;
  exames(academiaId: Id): Promise<Exame[]>;
  salvarExame(e: Exame): Promise<void>;

  // eventos, lutas e Atletas (R18)
  eventos(academiaId: Id): Promise<EventoDaAcademia[]>;
  salvarEvento(e: EventoDaAcademia): Promise<void>;
  lutas(academiaId: Id): Promise<Luta[]>;
  salvarLuta(l: Luta): Promise<void>;
  /** Quem marcou "Vou participar" (só a equipe vê a lista; o aluno pergunta só por ele). */
  participantes(eventoId: Id): Promise<Id[]>;
  alternarParticipacao(eventoId: Id, alunoId: Id): Promise<Id[]>;
  consentimentosDeAtleta(academiaId: Id): Promise<ConsentimentoDeAtleta[]>;
  definirAparecerEmAtletas(alunoId: Id, academiaId: Id, ligado: boolean): Promise<void>;

  // o que a academia mostra
  tecnicas(academiaId: Id): Promise<Tecnica[]>;
  perguntasFrequentes(academiaId: Id): Promise<PerguntaFrequente[]>;

  // Kids (R20)
  dependentes(responsavelId: Id): Promise<Dependente[]>;
  salvarDependente(d: Dependente): Promise<void>;

  // aula experimental e indicação (R19)
  interessados(academiaId: Id): Promise<Interessado[]>;
  salvarInteressado(i: Interessado): Promise<void>;
  experimentais(academiaId: Id): Promise<AulaExperimental[]>;
  salvarExperimental(e: AulaExperimental): Promise<void>;
  indicacoesDoAluno(alunoId: Id): Promise<{ indicacao: Indicacao; interessado: Interessado | null }[]>;

  // cadastro opcional (dado de saúde: só o aluno e quem ele autorizou)
  perfilDoAluno(alunoId: Id): Promise<PerfilDoAluno | null>;
  salvarPerfilDoAluno(perfil: PerfilDoAluno): Promise<void>;
  medicoesDoAluno(alunoId: Id): Promise<MedicaoCorporal[]>;
  registrarMedicao(medicao: MedicaoCorporal): Promise<void>;
  preferenciasDeAviso(usuarioId: Id): Promise<PreferenciasDeAviso>;
  salvarPreferenciasDeAviso(usuarioId: Id, preferencias: PreferenciasDeAviso): Promise<void>;

  // Plus e dieta: DESLIGADOS na v1 (`dominio/recursos.ts`, L12 e L13); a mecânica fica
  assinaturaPlus(alunoId: Id): Promise<AssinaturaPlus | null>;
  planoDeDieta(alunoId: Id, data: DataISO): Promise<PlanoDeDieta | null>;
  refeicoesRegistradas(alunoId: Id, data: DataISO): Promise<RefeicaoRegistrada[]>;
  /** SÍNCRONO: grava e põe na fila. */
  registrarRefeicao(refeicao: RefeicaoRegistrada, usuarioId: Id): ItemDaFila;
  /** SÍNCRONO: "desmarcar". */
  desfazerRefeicao(alunoId: Id, refeicaoId: Id, data: DataISO): void;

  // academia: avisos, equipe, vínculos
  /** O aviso em vigor para todos (o mais recente não retirado e dentro da validade). */
  avisoDaAcademia(academiaId: Id): Promise<AvisoDaAcademia | null>;
  /** Todos, com o histórico; com `turmaId`, os da turma. */
  avisosDaAcademia(academiaId: Id): Promise<AvisoDaAcademia[]>;
  publicarAviso(aviso: Omit<AvisoDaAcademia, 'id' | 'publicadoEm' | 'retiradoEm' | 'retiradoPorId'>): Promise<AvisoDaAcademia>;
  retirarAviso(avisoId: Id, porId: Id): Promise<void>;
  equipe(academiaId: Id): Promise<MembroDaEquipe[]>;
  salvarPerfilProfissional(perfil: PerfilProfissional): Promise<void>;
  preferenciasDaEquipe(vinculoId: Id): Promise<PreferenciasDaEquipe>;
  salvarPreferenciasDaEquipe(vinculoId: Id, preferencias: PreferenciasDaEquipe): Promise<void>;
  confirmarVinculos(vinculoIds: Id[], porId: Id): Promise<void>;
  recusarVinculo(vinculoId: Id, porId: Id): Promise<void>;
  encerrarVinculo(vinculoId: Id, porId: Id, motivo?: MotivoDeSaida): Promise<void>;

  // só deste aparelho (nunca sobe): o cronômetro em andamento, o aviso dispensado
  lerDoAparelho(chave: string): string | null;
  gravarNoAparelho(chave: string, valor: string | null): void;
}
