/**
 * Os dados de EXEMPLO do app, na academia de luta (P12, agente AM2): a Raça
 * Fight Gravataí com a GRADE REAL (`dominio/turmas/grade-raca-fight.ts`), o
 * endereço e o WhatsApp reais, e PESSOAS FICTÍCIAS (os nomes dos cartazes do
 * Instagram só entram com autorização, L34; o teste confere que nenhum nome
 * real aparece). Nenhuma foto de criança.
 *
 * As mesmas pessoas do desenho aprovado (`mockups/luta.html`): o Lucas treina
 * Muay Thai e Jiu-Jitsu; o professor Diego dá o Muay Thai; o Márcio, o
 * Jiu-Jitsu, a Luta Livre e o MMA; o Renato, o Boxe; a Simone é a recepção; o
 * Sérgio é o dono (usa o app Admin). A Carla é responsável pelo Pedro (Kids).
 *
 * O que é [decidir] fica como está no desenho e marcado: a janela do check-in
 * é a proposta L7; a duração das aulas (L1) segue a leitura do AJ (60 min); a
 * régua do Muay Thai (L3) só tem o cordão amarelo do post (`raca-11`); o
 * modelo de graus do Kids (L5) não foi escolhido.
 *
 * As datas são relativas a "agora" (no fuso da academia), para o app parecer
 * vivo em qualquer dia. Função pura: roda no Node e no app.
 */
import type { Academia, AssinaturaPlus, DataISO, Id, MedicaoCorporal, PerfilDoAluno, PerfilProfissional, PlanoDeDieta, RefeicaoRegistrada, Usuario, Vinculo } from '../../dominio/tipos.ts';
import { criarPerfilProfissional, editarPerfilProfissional } from '../../dominio/perfil-profissional.ts';
import { modalidadesDaRacaFight } from '../../dominio/modalidades/modalidades.ts';
import { CONTATO_RACA_FIGHT, gradeDaRacaFight } from '../../dominio/turmas/grade-raca-fight.ts';
import { dataNoFuso, instanteComFusoDaAcademia, msNoFuso, somarDias } from '../../dominio/turmas/horario.ts';
import { aulasEntre, type AjusteDeAula, type Aula, type Turma } from '../../dominio/turmas/turmas.ts';
import { idDaPresenca, JANELA_PROPOSTA_L7, janelaDoCheckin, type Presenca } from '../../dominio/presenca/presenca.ts';
import { sistemaIbjjfAdulto, sistemaIbjjfKids, sistemaLutaLivreAConfigurar, sistemaMuayThaiAConfigurar, type SistemaDeGraduacao } from '../../dominio/graduacao/sistemas.ts';
import type { Exame, Graduacao } from '../../dominio/graduacao/graduacao.ts';
import { definirAparecerEmAtletas, consentimentoInicial, type ConsentimentoDeAtleta, type EventoDaAcademia, type Luta } from '../../dominio/eventos/eventos.ts';
import type { PerguntaFrequente, Tecnica } from '../../dominio/conteudo/conteudo.ts';
import { novoDependente, type Dependente } from '../../dominio/kids/kids.ts';
import { codigoDeIndicacao, type AulaExperimental, type Indicacao, type Interessado } from '../../dominio/experimental/experimental.ts';
import type { AcademiaDeLuta, AvisoDaAcademia, ContaDeExemplo, FichaDeLuta } from '../repositorio.ts';

export interface DadosDeExemplo {
  academias: Academia[];
  usuarios: Usuario[];
  vinculos: Vinculo[];
  contas: ContaDeExemplo[];
  luta: AcademiaDeLuta;
  fichas: FichaDeLuta[];
  presencas: Presenca[];
  graduacoes: Graduacao[];
  exames: Exame[];
  ajustes: AjusteDeAula[];
  eventos: EventoDaAcademia[];
  lutas: Luta[];
  participacoes: Record<Id, Id[]>;
  consentimentos: ConsentimentoDeAtleta[];
  tecnicas: Tecnica[];
  perguntas: PerguntaFrequente[];
  dependentes: Dependente[];
  interessados: Interessado[];
  experimentais: AulaExperimental[];
  indicacoes: Indicacao[];
  perfis: PerfilDoAluno[];
  medicoes: MedicaoCorporal[];
  /** Plus e dieta: desligados na v1 (L12, L13); o exemplo não tem nenhum. */
  assinaturas: AssinaturaPlus[];
  planos: PlanoDeDieta[];
  refeicoesRegistradas: RefeicaoRegistrada[];
  avisos: AvisoDaAcademia[];
  perfisProfissionais: PerfilProfissional[];
}

export const FUSO_DA_ACADEMIA = 'America/Sao_Paulo';

export const ID = {
  academia: 'raca-fight',
  lucas: 'usuario-lucas',
  ana: 'usuario-ana',
  breno: 'usuario-breno',
  camila: 'usuario-camila',
  davi: 'usuario-davi',
  elisa: 'usuario-elisa',
  bianca: 'usuario-bianca',
  mateus: 'usuario-mateus',
  otavio: 'usuario-otavio',
  rita: 'usuario-rita',
  carla: 'usuario-carla',
  pedro: 'dependente-pedro',
  diego: 'usuario-diego',
  marcio: 'usuario-marcio',
  renato: 'usuario-renato',
  simone: 'usuario-simone',
  sergio: 'usuario-sergio',
} as const;

/** Os primeiros nomes de professores e atletas REAIS do Instagram (`01-DADOS-REAIS.md`): nenhum exemplo usa. */
export const NOMES_REAIS_PROIBIDOS = ['Moreschi', 'Rafael', 'João', 'Thales', 'Juliana', 'Richard', 'Norton', 'Arthur', 'Leonardo', 'Bruno', 'Carlos', 'Caio', 'Toledo', 'Cardozo', 'Duarte', 'Schutz', 'Cesar'];

/** Quem vai a quais aulas no histórico do exemplo: turma → dias da semana em que a pessoa costuma ir. */
type Plano = { turmaId: Id; dias: string[]; modalidadeId: Id }[];

export function montarDadosDeExemplo(entrada: { agora: Date }): DadosDeExemplo {
  const agoraMs = entrada.agora.getTime();
  const fuso = FUSO_DA_ACADEMIA;
  const hoje = dataNoFuso(agoraMs, fuso);
  const dia = (n: number) => somarDias(hoje, n);
  const em = (dias: number, hora = '10:00') => instanteComFusoDaAcademia(msNoFuso(dia(dias), hora, fuso), fuso);
  const academiaId = ID.academia;

  // --- a academia ---------------------------------------------------------------
  const academia: Academia = {
    id: academiaId,
    nome: CONTATO_RACA_FIGHT.nome,
    apelido: 'raca-fight-gravatai',
    codigoDeVinculo: 'RCF4K2',
    codigoDaEquipe: 'T9K2WM',
    entrarSemConfirmacao: false,
    fusoHorario: fuso,
    marca: { corPrimaria: '#C42024' },
    criadaEm: em(-900),
  };

  const turmas: Turma[] = gradeDaRacaFight({
    academiaId,
    professores: { muayThai: ID.diego, boxe: ID.renato, jiuJitsu: ID.marcio, mma: ID.marcio, muayThaiKids: ID.diego, jiuJitsuKids: ID.marcio },
    // [decidir] L1: o cartaz não diz a duração; o exemplo usa a leitura do AJ
    duracaoDaAulaMinutos: 60,
  });

  const modalidades = modalidadesDaRacaFight(academiaId);
  const sistemas: SistemaDeGraduacao[] = [
    sistemaIbjjfAdulto('jiu-jitsu'),
    // [decidir] L5: o modelo de graus do Kids não foi escolhido (a régua fica "a configurar")
    sistemaIbjjfKids(null, 'jiu-jitsu'),
    // [decidir] L3: só o cordão amarelo do post é conhecido; a palavra é a do desenho aprovado
    sistemaMuayThaiAConfigurar('Kruang', 'adulto', 'muay-thai', [{ id: 'amarelo', nome: 'amarelo', cores: ['#F2C230'], grausMaximos: 0 }]),
    sistemaLutaLivreAConfigurar('luta-livre'),
  ];

  const luta: AcademiaDeLuta = {
    academiaId,
    contato: { ...CONTATO_RACA_FIGHT },
    fuso,
    modalidades,
    turmas,
    sistemas,
    // [decidir] L7: a proposta do AJ, até a academia dizer outra no Admin
    janela: { ...JANELA_PROPOSTA_L7 },
    // [decidir] L22: link em evento fica desligado até o Alex decidir
    aceitaLinkEmEvento: false,
  };

  // --- pessoas (todas fictícias) ---------------------------------------------------
  const pessoa = (id: Id, nome: string, email: string, desde = -400): Usuario => ({ id, nome, email, criadoEm: em(desde) });
  const usuarios: Usuario[] = [
    pessoa(ID.lucas, 'Lucas Ferraz', 'lucas@exemplo.com.br'),
    pessoa(ID.ana, 'Ana Paula Reis', 'ana.paula@exemplo.com.br'),
    pessoa(ID.breno, 'Breno Souza', 'breno@exemplo.com.br'),
    pessoa(ID.camila, 'Camila Moura', 'camila@exemplo.com.br'),
    pessoa(ID.davi, 'Davi Rocha', 'davi@exemplo.com.br'),
    pessoa(ID.elisa, 'Elisa Lima', 'elisa@exemplo.com.br', -60),
    pessoa(ID.bianca, 'Bianca Prado', 'bianca@exemplo.com.br'),
    pessoa(ID.mateus, 'Mateus Ribeiro', 'mateus@exemplo.com.br'),
    pessoa(ID.otavio, 'Otávio Nunes', 'otavio@exemplo.com.br'),
    pessoa(ID.rita, 'Rita Campos', 'rita@exemplo.com.br', -2),
    pessoa(ID.carla, 'Carla Nunes', 'carla@exemplo.com.br'),
    pessoa(ID.diego, 'Diego Moura', 'diego@exemplo.com.br', -800),
    pessoa(ID.marcio, 'Márcio Teles', 'marcio@exemplo.com.br', -800),
    pessoa(ID.renato, 'Renato Lopes', 'renato@exemplo.com.br', -800),
    pessoa(ID.simone, 'Simone Alves', 'simone@exemplo.com.br', -500),
    pessoa(ID.sergio, 'Sérgio Vargas', 'sergio@exemplo.com.br', -900),
  ];

  const vinculo = (usuarioId: Id, papel: Vinculo['papel'], desde: number, estado: Vinculo['estado'] = 'ativo'): Vinculo => ({ id: `vinculo-${usuarioId.replace('usuario-', '')}-${papel}`, usuarioId, academiaId, papel, estado, desde: dia(desde) });
  const vinculos: Vinculo[] = [
    vinculo(ID.lucas, 'aluno', -420),
    vinculo(ID.ana, 'aluno', -300),
    vinculo(ID.breno, 'aluno', -200),
    vinculo(ID.camila, 'aluno', -380),
    vinculo(ID.davi, 'aluno', -250),
    vinculo(ID.elisa, 'aluno', -60),
    vinculo(ID.bianca, 'aluno', -700),
    vinculo(ID.mateus, 'aluno', -600),
    vinculo(ID.otavio, 'aluno', -150),
    vinculo(ID.rita, 'aluno', -2, 'pendente'),
    vinculo(ID.carla, 'aluno', -240),
    vinculo(ID.diego, 'instrutor', -800),
    vinculo(ID.marcio, 'instrutor', -800),
    vinculo(ID.renato, 'instrutor', -800),
    vinculo(ID.simone, 'recepcao', -500),
    vinculo(ID.sergio, 'dono', -900),
  ];
  const vinculoDe = (usuarioId: Id) => vinculos.find((v) => v.usuarioId === usuarioId)!;

  const contas: ContaDeExemplo[] = [
    { usuarioId: ID.lucas, nome: 'Lucas Ferraz', descricao: 'Aluno · Muay Thai e Jiu-Jitsu' },
    { usuarioId: ID.carla, nome: 'Carla Nunes', descricao: 'Responsável · o Pedro faz Jiu-Jitsu Kids' },
    { usuarioId: ID.diego, nome: 'Diego Moura', descricao: 'Professor · Muay Thai' },
    { usuarioId: ID.marcio, nome: 'Márcio Teles', descricao: 'Professor · Jiu-Jitsu, Luta Livre e MMA' },
    { usuarioId: ID.simone, nome: 'Simone Alves', descricao: 'Recepção' },
    { usuarioId: ID.sergio, nome: 'Sérgio Vargas', descricao: 'Dono · usa o app Admin' },
  ];

  // --- dependente (Kids): sem foto e com a autorização de imagem DESLIGADA ------------
  const pedro = novoDependente({ id: ID.pedro, responsavelId: ID.carla, academiaId, nome: 'Pedro Nunes', dataNascimento: `${+hoje.slice(0, 4) - 9}-04-09`, hoje, em: em(-240) });
  const dependentes = [pedro];

  // --- fichas de luta (modalidades e turmas; o que o Admin terá) ----------------------
  const ficha = (alunoId: Id, nome: string, modalidadeIds: Id[], turmaIds: Id[], desde: number, extra: Partial<FichaDeLuta> = {}): FichaDeLuta => ({ alunoId, academiaId, nome, modalidadeIds, turmaIds, atletaEm: [], desde: dia(desde), ...extra });
  const fichas: FichaDeLuta[] = [
    ficha(ID.lucas, 'Lucas Ferraz', ['muay-thai', 'jiu-jitsu', 'luta-livre'], ['muay-thai-noite-1', 'jiu-jitsu-luta-livre'], -420),
    ficha(ID.ana, 'Ana Paula Reis', ['muay-thai'], ['muay-thai-noite-1'], -300),
    ficha(ID.breno, 'Breno Souza', ['muay-thai'], ['muay-thai-noite-1'], -200),
    ficha(ID.camila, 'Camila Moura', ['muay-thai'], ['muay-thai-noite-1'], -380),
    ficha(ID.davi, 'Davi Rocha', ['muay-thai'], ['muay-thai-noite-1'], -250),
    ficha(ID.elisa, 'Elisa Lima', ['muay-thai'], ['muay-thai-noite-1'], -60),
    ficha(ID.bianca, 'Bianca Prado', ['jiu-jitsu'], ['jiu-jitsu-luta-livre'], -700),
    ficha(ID.mateus, 'Mateus Ribeiro', ['muay-thai'], ['muay-thai-noite-1', 'muay-thai-noite-2'], -600, { atletaEm: ['muay-thai'] }),
    ficha(ID.otavio, 'Otávio Nunes', ['boxe'], ['boxe-noite'], -150),
    ficha(ID.rita, 'Rita Campos', ['boxe'], ['boxe-noite'], -2),
    ficha(ID.carla, 'Carla Nunes', ['muay-thai'], ['muay-thai-manha'], -240),
    ficha(ID.pedro, 'Pedro Nunes', ['jiu-jitsu'], ['jiu-jitsu-kids'], -240, { dependenteDe: ID.carla, dataNascimento: pedro.dataNascimento }),
  ];

  // --- presenças: o histórico confirmado, e as de hoje ---------------------------------
  const planos: Record<Id, Plano> = {
    // o Lucas faz Jiu-Jitsu segunda e quarta e Muay Thai terça e quinta (o desenho)
    [ID.lucas]: [
      { turmaId: 'jiu-jitsu-luta-livre', dias: ['seg', 'qua'], modalidadeId: 'jiu-jitsu' },
      { turmaId: 'muay-thai-noite-1', dias: ['ter', 'qui'], modalidadeId: 'muay-thai' },
    ],
    [ID.ana]: [{ turmaId: 'muay-thai-noite-1', dias: ['seg', 'ter', 'qua', 'qui'], modalidadeId: 'muay-thai' }],
    [ID.breno]: [{ turmaId: 'muay-thai-noite-1', dias: ['ter', 'qui'], modalidadeId: 'muay-thai' }],
    [ID.camila]: [{ turmaId: 'muay-thai-noite-1', dias: ['seg', 'qua', 'qui'], modalidadeId: 'muay-thai' }],
    [ID.davi]: [{ turmaId: 'muay-thai-noite-1', dias: ['seg', 'qua'], modalidadeId: 'muay-thai' }],
    [ID.elisa]: [{ turmaId: 'muay-thai-noite-1', dias: ['ter'], modalidadeId: 'muay-thai' }],
    [ID.bianca]: [{ turmaId: 'jiu-jitsu-luta-livre', dias: ['seg', 'qua'], modalidadeId: 'jiu-jitsu' }],
    [ID.mateus]: [
      { turmaId: 'muay-thai-noite-1', dias: ['seg', 'ter', 'qua', 'qui'], modalidadeId: 'muay-thai' },
      { turmaId: 'muay-thai-noite-2', dias: ['seg', 'qua'], modalidadeId: 'muay-thai' },
    ],
    [ID.otavio]: [{ turmaId: 'boxe-noite', dias: ['ter', 'qui'], modalidadeId: 'boxe' }],
    [ID.carla]: [{ turmaId: 'muay-thai-manha', dias: ['seg', 'qua'], modalidadeId: 'muay-thai' }],
    [ID.pedro]: [{ turmaId: 'jiu-jitsu-kids', dias: ['seg', 'qua'], modalidadeId: 'jiu-jitsu' }],
  };
  /** Quem sumiu: o Davi não vem há 9 dias (o desenho: "Última aula há 9 dias"). */
  const ultimaVinda: Record<Id, number> = { [ID.davi]: -9 };
  const professorDa = (turmaId: Id) => turmas.find((t) => t.id === turmaId)?.professorId ?? ID.diego;
  // um padrão fixo de faltas (sem sorteio: o exemplo é igual em toda abertura)
  const faltou = (alunoId: Id, aula: Aula) => {
    let h = 0;
    for (const c of `${alunoId}|${aula.id}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 5 === 0;
  };
  const presencas: Presenca[] = [];
  const passadas = aulasEntre(turmas, dia(-42), dia(-1), fuso);
  for (const [alunoId, plano] of Object.entries(planos)) {
    const f = fichas.find((x) => x.alunoId === alunoId)!;
    const limite = ultimaVinda[alunoId] !== undefined ? dia(ultimaVinda[alunoId]!) : dia(-1);
    for (const aula of passadas) {
      const p = plano.find((x) => x.turmaId === aula.turmaId && x.dias.includes(aula.dia));
      if (!p || aula.data < f.desde || aula.data > limite || faltou(alunoId, aula)) continue;
      const porId = f.dependenteDe ?? alunoId;
      const professor = professorDa(aula.turmaId)!;
      presencas.push({
        id: idDaPresenca(aula.id, alunoId),
        academiaId,
        aulaId: aula.id,
        turmaId: aula.turmaId,
        data: aula.data,
        alunoId,
        modalidadeId: p.modalidadeId,
        origem: 'checkin',
        estado: 'confirmada',
        registradaEm: instanteComFusoDaAcademia(aula.inicioMs - 10 * 60_000, fuso),
        registradaPorId: porId,
        atualizadaEm: instanteComFusoDaAcademia(aula.inicioMs + 5 * 60_000, fuso),
        atualizadaPorId: professor,
        pelaEquipe: true,
        sincronizadaEm: instanteComFusoDaAcademia(aula.inicioMs + 6 * 60_000, fuso),
      });
    }
  }
  // hoje: quem costuma vir já fez check-in na aula cuja janela abriu (o Lucas, não: é ele quem toca no desenho)
  const deHoje = aulasEntre(turmas, hoje, hoje, fuso);
  for (const aula of deHoje) {
    if (janelaDoCheckin(aula, agoraMs, JANELA_PROPOSTA_L7).tipo === 'antes') continue;
    for (const [alunoId, plano] of Object.entries(planos)) {
      if (alunoId === ID.lucas || ultimaVinda[alunoId] !== undefined) continue;
      const p = plano.find((x) => x.turmaId === aula.turmaId && x.dias.includes(aula.dia));
      if (!p) continue;
      const f = fichas.find((x) => x.alunoId === alunoId)!;
      const quando = instanteComFusoDaAcademia(Math.min(agoraMs, aula.inicioMs) - 12 * 60_000, fuso);
      const porId = f.dependenteDe ?? alunoId;
      presencas.push({ id: idDaPresenca(aula.id, alunoId), academiaId, aulaId: aula.id, turmaId: aula.turmaId, data: aula.data, alunoId, modalidadeId: p.modalidadeId, origem: 'checkin', estado: 'pendente', registradaEm: quando, registradaPorId: porId, atualizadaEm: quando, atualizadaPorId: porId, pelaEquipe: false });
    }
  }

  // --- graduações (o tempo conta do registro no app, R16.7) ---------------------------
  let g = 0;
  const graduacao = (alunoId: Id, modalidadeId: Id, sistemaId: Id, nivelId: Id, grau: number, diasAtras: number, origem: Graduacao['origem'], por: Id | null): Graduacao => ({
    id: `graduacao-${(g += 1)}`,
    academiaId,
    alunoId,
    modalidadeId,
    sistemaId,
    nivelId,
    grau,
    data: dia(-diasAtras),
    graduadoPorId: por,
    origem,
    registradaPorId: por ?? 'sistema',
    registradaEm: em(-diasAtras, '21:00'),
  });
  const graduacoes: Graduacao[] = [
    graduacao(ID.lucas, 'jiu-jitsu', 'ibjjf-adulto', 'branca', 0, 420, 'inicial', null),
    graduacao(ID.lucas, 'jiu-jitsu', 'ibjjf-adulto', 'branca', 1, 320, 'promocao', ID.marcio),
    graduacao(ID.lucas, 'jiu-jitsu', 'ibjjf-adulto', 'branca', 2, 217, 'promocao', ID.marcio),
    graduacao(ID.lucas, 'muay-thai', 'muay-thai-adulto', 'amarelo', 0, 180, 'promocao', ID.diego),
    graduacao(ID.ana, 'muay-thai', 'muay-thai-adulto', 'amarelo', 0, 200, 'promocao', ID.diego),
    graduacao(ID.camila, 'muay-thai', 'muay-thai-adulto', 'amarelo', 0, 150, 'promocao', ID.diego),
    graduacao(ID.mateus, 'muay-thai', 'muay-thai-adulto', 'amarelo', 0, 400, 'promocao', ID.diego),
    graduacao(ID.bianca, 'jiu-jitsu', 'ibjjf-adulto', 'azul', 3, 120, 'promocao', ID.marcio),
    graduacao(ID.pedro, 'jiu-jitsu', 'ibjjf-kids', 'cinza-e-branca', 0, 90, 'promocao', ID.marcio),
  ];

  // o próximo exame de Jiu-Jitsu (sábado que vem, se houver)
  const exames: Exame[] = [{ id: 'exame-jj', academiaId, modalidadeId: 'jiu-jitsu', sistemaId: 'ibjjf-adulto', data: dia(10), hora: '10:00', local: 'Tatame da academia', avaliadorIds: [ID.marcio], candidatos: [{ alunoId: ID.bianca }] }];

  // --- eventos, lutas e Atletas ---------------------------------------------------------
  const eventos: EventoDaAcademia[] = [
    { id: 'evento-noite-de-lutas', academiaId, nome: 'Noite de lutas', tipo: 'luta', modalidadeIds: ['muay-thai'], data: dia(20), hora: '19:00', local: 'Lomba do Pinheiro', descricao: 'Card de lutas amadoras e semi-pró. A academia leva atletas e torcida.', publico: 'aberto', criadoPorId: ID.diego, criadoEm: em(-15) },
    { id: 'evento-exame-jj', academiaId, nome: 'Exame de graduação de Jiu-Jitsu', tipo: 'exame', modalidadeIds: ['jiu-jitsu'], data: dia(10), hora: '10:00', local: 'Raça Fight Gravataí', descricao: 'Exame dos alunos que o professor indicar. Taxa: veja com a recepção.', publico: 'alunos', criadoPorId: ID.marcio, criadoEm: em(-5) },
    { id: 'evento-aulao', academiaId, nome: 'Aulão de Muay Thai', tipo: 'aulao', modalidadeIds: ['muay-thai'], data: dia(-30), hora: '10:00', local: 'Raça Fight Gravataí', publico: 'aberto', criadoPorId: ID.diego, criadoEm: em(-45) },
    { id: 'evento-copa', academiaId, nome: 'Copa regional de Muay Thai', tipo: 'campeonato', modalidadeIds: ['muay-thai'], data: dia(-21), hora: '09:00', local: 'Porto Alegre', publico: 'aberto', criadoPorId: ID.diego, criadoEm: em(-60) },
  ];
  const lutas: Luta[] = [
    { id: 'luta-mateus-1', academiaId, eventoId: 'evento-noite-de-lutas', atletaId: ID.mateus, modalidadeId: 'muay-thai', adversario: 'Fábio Lemos', categoria: '60 kg', nivel: 'semi_pro', data: dia(20), local: 'Lomba do Pinheiro' },
    { id: 'luta-mateus-0', academiaId, eventoId: 'evento-copa', atletaId: ID.mateus, modalidadeId: 'muay-thai', adversario: 'Gustavo Prates', categoria: '60 kg', nivel: 'amador', data: dia(-21), local: 'Porto Alegre', resultado: 'vitoria', como: 'pontos' },
  ];
  const consentimentos: ConsentimentoDeAtleta[] = [definirAparecerEmAtletas(consentimentoInicial(ID.mateus, academiaId), true, em(-90)), consentimentoInicial(ID.lucas, academiaId)];
  const participacoes: Record<Id, Id[]> = { 'evento-noite-de-lutas': [ID.ana, ID.camila] };

  // --- técnicas e Raça Responde ---------------------------------------------------------
  // [decidir] L30: o vídeo é um link (a recomendação); o do exemplo é o perfil público da academia
  const PERFIL = 'https://www.instagram.com/racafightgravatai/';
  const tecnica = (id: string, modalidadeId: Id, titulo: string, nivel: Tecnica['nivel'], minutos: number, professorId: Id, diasAtras: number, aberta = false): Tecnica => ({ id, academiaId, modalidadeId, titulo, nivel, duracaoSegundos: minutos * 60, professorId, data: dia(-diasAtras), link: PERFIL, aberta, estado: 'publicada', temMenor: false });
  const tecnicas: Tecnica[] = [
    tecnica('tecnica-golpes-basicos', 'muay-thai', 'Golpes básicos', 'iniciante', 4, ID.diego, 20, true),
    tecnica('tecnica-curta-distancia', 'muay-thai', 'Golpes de curta distância', 'intermediario', 5, ID.diego, 12),
    tecnica('tecnica-guarda', 'jiu-jitsu', 'Passagem de guarda', 'iniciante', 6, ID.marcio, 9),
    tecnica('tecnica-jab', 'boxe', 'Jab e direto', 'iniciante', 3, ID.renato, 5, true),
  ];
  const perguntas: PerguntaFrequente[] = [
    { id: 'pergunta-1', academiaId, ordem: 1, pergunta: 'A aula experimental é grátis?', resposta: `Sim. Agende pelo WhatsApp ${CONTATO_RACA_FIGHT.whatsapp} e diga qual modalidade quer conhecer.` },
    { id: 'pergunta-2', academiaId, ordem: 2, pergunta: 'Tem turma para crianças?', resposta: 'Tem Muay Thai Kids (terça e quinta, 19h) e Jiu-Jitsu Kids (segunda e quarta, 19h).' },
    { id: 'pergunta-3', academiaId, ordem: 3, pergunta: 'Como funciona a Sexta OPEN?', resposta: 'Toda sexta, das 20h às 22h, você treina a modalidade que quiser, sem turma fixa.' },
    { id: 'pergunta-4', academiaId, ordem: 4, pergunta: 'Onde fica a academia?', resposta: `${CONTATO_RACA_FIGHT.endereco}, ${CONTATO_RACA_FIGHT.cidade}.` },
  ];

  // --- aula experimental e indicação ------------------------------------------------------
  const proximaMt = aulasEntre(turmas, hoje, dia(7), fuso).find((a) => a.turmaId === 'muay-thai-noite-1' && a.fimMs > agoraMs) ?? aulasEntre(turmas, dia(1), dia(8), fuso).find((a) => a.turmaId === 'muay-thai-noite-1')!;
  const interessados: Interessado[] = [
    { id: 'interessado-igor', academiaId, nome: 'Igor Lemos', whatsapp: '5551900000001', modalidadeId: 'muay-thai', comoConheceu: 'Indicação', codigoDeIndicacao: codigoDeIndicacao(ID.lucas), criadoEm: em(-3), criadoPorId: ID.simone },
    { id: 'interessado-helena', academiaId, nome: 'Helena Castro', whatsapp: '5551900000002', modalidadeId: 'jiu-jitsu', crianca: { nome: 'Sofia Castro', idade: 7 }, comoConheceu: 'Instagram', criadoEm: em(-6), criadoPorId: ID.simone },
    { id: 'interessado-vitor', academiaId, nome: 'Vítor Mendes', whatsapp: '5551900000003', modalidadeId: 'boxe', criadoEm: em(-12), criadoPorId: ID.simone },
  ];
  const kidsJj = aulasEntre(turmas, dia(1), dia(8), fuso).find((a) => a.turmaId === 'jiu-jitsu-kids')!;
  const boxePassado = aulasEntre(turmas, dia(-9), dia(-1), fuso).find((a) => a.turmaId === 'boxe-noite')!;
  const experimentais: AulaExperimental[] = [
    { id: 'experimental-igor', academiaId, interessadoId: 'interessado-igor', aulaId: proximaMt.id, turmaId: proximaMt.turmaId, data: proximaMt.data, modalidadeId: 'muay-thai', estado: 'agendada', marcadaPorId: ID.simone, criadaEm: em(-3), atualizadaEm: em(-3) },
    { id: 'experimental-sofia', academiaId, interessadoId: 'interessado-helena', aulaId: kidsJj.id, turmaId: kidsJj.turmaId, data: kidsJj.data, modalidadeId: 'jiu-jitsu', estado: 'agendada', marcadaPorId: ID.simone, criadaEm: em(-6), atualizadaEm: em(-6) },
    { id: 'experimental-vitor', academiaId, interessadoId: 'interessado-vitor', aulaId: boxePassado.id, turmaId: boxePassado.turmaId, data: boxePassado.data, modalidadeId: 'boxe', estado: 'compareceu', marcadaPorId: ID.simone, criadaEm: em(-12), atualizadaEm: em(-8) },
  ];
  const indicacoes: Indicacao[] = [{ id: 'indicacao-igor', academiaId, codigo: codigoDeIndicacao(ID.lucas), alunoId: ID.lucas, interessadoId: 'interessado-igor', estado: 'aberta', criadaEm: em(-3) }];

  // --- cadastro opcional (saúde: o exemplo não autoriza a academia) ---------------------------
  const perfis: PerfilDoAluno[] = [{ usuarioId: ID.lucas, academiaId, objetivo: 'aprender_a_lutar', autorizaAcademia: false, atualizadoEm: em(-100) }];

  // --- avisos -----------------------------------------------------------------------------------
  const avisos: AvisoDaAcademia[] = [
    { id: 'aviso-open', academiaId, texto: 'Sexta tem OPEN das 20h às 22h: venha treinar o que quiser.', publicadoEm: instanteComFusoDaAcademia(agoraMs - 2 * 3_600_000, fuso), validadeDias: 3, comNotificacao: true, autorId: ID.simone },
  ];

  // --- perfis dos professores (Professores, R16.14) ---------------------------------------------
  const perfilDe = (usuarioId: Id, nome: string, formacao: string, modalidadeIds: Id[], graduacao: { modalidadeId: Id; texto: string }[], sobre: string) => {
    const v = vinculoDe(usuarioId);
    const base = criarPerfilProfissional(v, { id: `perfil-${usuarioId.replace('usuario-', '')}`, nomeExibicao: nome, formacao }, em(-300));
    return editarPerfilProfissional(base, { modalidadeIds, graduacaoInformada: graduacao, sobre, visivelAosAlunos: true }, { usuarioId, vinculos: [v] }, em(-299));
  };
  const perfisProfissionais: PerfilProfissional[] = [
    perfilDe(ID.diego, 'Diego Moura', 'Professor de Muay Thai', ['muay-thai'], [{ modalidadeId: 'muay-thai', texto: 'Kruang preto' }], 'Dou aula de Muay Thai para adultos e para a turma Kids.'),
    perfilDe(ID.marcio, 'Márcio Teles', 'Professor de Jiu-Jitsu', ['jiu-jitsu', 'luta-livre', 'mma'], [{ modalidadeId: 'jiu-jitsu', texto: 'Faixa preta, 2º grau' }], 'Jiu-Jitsu, Luta Livre e MMA, do iniciante à competição.'),
    perfilDe(ID.renato, 'Renato Lopes', 'Professor de Boxe', ['boxe'], [], 'Boxe de manhã e à noite, técnica e condicionamento.'),
  ];

  return {
    academias: [academia],
    usuarios,
    vinculos,
    contas,
    luta,
    fichas,
    presencas,
    graduacoes,
    exames,
    ajustes: [],
    eventos,
    lutas,
    participacoes,
    consentimentos,
    tecnicas,
    perguntas,
    dependentes,
    interessados,
    experimentais,
    indicacoes,
    perfis,
    medicoes: [],
    assinaturas: [],
    planos: [],
    refeicoesRegistradas: [],
    avisos,
    perfisProfissionais,
  };
}

/** A data de hoje no fuso da academia (para quem monta o exemplo e os testes). */
export function hojeNaAcademia(agora: Date): DataISO {
  return dataNoFuso(agora.getTime(), FUSO_DA_ACADEMIA);
}
