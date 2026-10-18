/**
 * O repositório que roda hoje: os dados de exemplo em memória e, por cima
 * deles, TUDO o que o app grava, guardado no aparelho (SQLite no celular,
 * localStorage na web, memória no teste — `armazenamento/`).
 *
 * Como a gravação funciona (agente AA, P11):
 * - os dados de exemplo são montados do zero a cada abertura (datas relativas
 *   a "agora"; ids determinísticos);
 * - cada escrita GRAVA o objeto inteiro numa coleção do armazenamento e só
 *   então troca na lista em memória (agente AG: o disco cheio nunca deixa a
 *   tela mostrar como salvo o que não foi);
 * - ao abrir, as coleções gravadas são aplicadas por cima do exemplo, na
 *   ordem em que foram gravadas (`__apagado` apaga um registro do exemplo).
 *
 * Luta (P12, agente AM2): a PRESENÇA mora na coleção `presencas` e entra na
 * fila (check-in e chamada, R15.9), como o treino realizado entrava. O que é
 * da academia (graduação, cancelar aula, evento, experimental) precisa de
 * sinal: sem rede, `ErroSemSinal` e nada é gravado.
 *
 * O "envio" da fila é simulado: com `semRede` ligado, falha como falta de rede.
 * As regras são do domínio; aqui só se guarda o resultado.
 */
import type { AssinaturaPlus, Id, MedicaoCorporal, PerfilDoAluno, PerfilProfissional, RefeicaoRegistrada, Usuario, Vinculo } from '../../dominio/tipos.ts';
import { PAPEIS_DA_ACADEMIA } from '../../dominio/tipos.ts';
import type { ItemDaFila } from '../../dominio/sincronizacao.ts';
import { PREFERENCIAS_DA_EQUIPE_PADRAO, PREFERENCIAS_PADRAO, validarAvisoDaAcademia, type PreferenciasDaEquipe, type PreferenciasDeAviso } from '../../dominio/avisos.ts';
import { aulaPeloId, type AjusteDeAula } from '../../dominio/turmas/turmas.ts';
import { retirarPorCancelamento, type Presenca } from '../../dominio/presenca/presenca.ts';
import type { Exame, Graduacao } from '../../dominio/graduacao/graduacao.ts';
import { alternarParticipacao, consentimentoInicial, definirAparecerEmAtletas, type ConsentimentoDeAtleta, type EventoDaAcademia, type Luta } from '../../dominio/eventos/eventos.ts';
import type { Dependente } from '../../dominio/kids/kids.ts';
import type { AulaExperimental, Interessado } from '../../dominio/experimental/experimental.ts';
import { instanteComFusoDaAcademia } from '../../dominio/turmas/horario.ts';
import { gerarId } from '../../dominio/ambiente.ts';
import type { ArmazenamentoLocal } from '../armazenamento/tipos.ts';
import { COLECAO_DE_PRESENCAS, COLECAO_DE_REFEICOES, gravarPresencasEEnfileirar, gravarRefeicaoEEnfileirar, tirarRefeicaoDaFila, type DestinoDaFila } from '../fila.ts';
import { ErroSemSinal, type AvisoDaAcademia, type FichaDeLuta, type Repositorio, type ResumoDoAluno, type VinculoComAcademia } from '../repositorio.ts';
import type { DadosDeExemplo } from './dados-de-exemplo.ts';
import { gravarPreferenciaSemTravar } from '../preferencias.ts';

export { ErroSemSinal };

export interface RepositorioLocal extends Repositorio {
  readonly nome: 'local';
  /** O "servidor" de exemplo que recebe a fila. */
  readonly destino: DestinoDaFila & { semRede: boolean };
}

/** Marca de "apagado" numa coleção (para apagar um registro que veio do exemplo). */
const APAGADO = { __apagado: true } as const;
const apagado = (v: unknown) => typeof v === 'object' && v !== null && (v as { __apagado?: boolean }).__apagado === true;

/** O instante em ms, para ordenar (nunca comparar o texto: o fuso muda). */
const instante = (iso: string) => Date.parse(iso) || 0;

function somarDias(data: string, dias: number): string {
  const d = new Date(Date.UTC(+data.slice(0, 4), +data.slice(5, 7) - 1, +data.slice(8, 10) + dias));
  return d.toISOString().slice(0, 10);
}

export function criarRepositorioLocal(dados: DadosDeExemplo, arm: ArmazenamentoLocal, relogio: () => number = () => Date.now()): RepositorioLocal {
  const destino = {
    semRede: false,
    async enviar(_item: ItemDaFila) {
      await new Promise((r) => setTimeout(r, 300));
      if (destino.semRede) throw { status: 0 };
    },
  };
  const fuso = dados.luta.fuso;
  const agora = () => instanteComFusoDaAcademia(relogio(), fuso);
  const hoje = () => agora().slice(0, 10);
  const comSinal = () => {
    if (destino.semRede) throw new ErroSemSinal();
  };

  const chaveDoPerfil = (p: Pick<PerfilDoAluno, 'usuarioId' | 'academiaId'>) => `${p.usuarioId}|${p.academiaId ?? ''}`;

  /** As listas em memória que as escritas mudam: `atomico` tira uma foto e, se falhar no meio, põe de volta (agente AG). */
  const listasEmMemoria: unknown[][] = [];
  function atomico<R>(f: () => R): R {
    const fotos = listasEmMemoria.map((l) => l.slice());
    try {
      return arm.transacao(f);
    } catch (e) {
      listasEmMemoria.forEach((l, i) => l.splice(0, l.length, ...fotos[i]!));
      throw e;
    }
  }

  /** Uma coleção ligada a uma lista do exemplo. */
  function colecao<T>(nome: string, lista: T[], chave: (t: T) => Id) {
    listasEmMemoria.push(lista);
    for (const [id, valor] of arm.colecao(nome)) {
      // registro que não é objeto (armazenamento mexido) é ignorado (agente AB)
      if (typeof valor !== 'object' || valor === null) continue;
      const i = lista.findIndex((x) => chave(x) === id);
      if (apagado(valor)) {
        if (i >= 0) lista.splice(i, 1);
      } else if (i >= 0) lista[i] = valor as T;
      else lista.push(valor as T);
    }
    return {
      gravar(item: T) {
        const id = chave(item);
        arm.gravarNaColecao(nome, id, item);
        const i = lista.findIndex((x) => chave(x) === id);
        if (i >= 0) lista[i] = item;
        else lista.push(item);
      },
      apagar(id: Id) {
        arm.gravarNaColecao(nome, id, APAGADO);
        const i = lista.findIndex((x) => chave(x) === id);
        if (i >= 0) lista.splice(i, 1);
      },
    };
  }

  const usuarios = colecao<Usuario>('usuarios', dados.usuarios, (u) => u.id);
  const vinculos = colecao<Vinculo>('vinculos', dados.vinculos, (v) => v.id);
  const avisos = colecao<AvisoDaAcademia>('avisos', dados.avisos, (a) => a.id);
  const perfisProfissionais = colecao<PerfilProfissional>('perfis-profissionais', dados.perfisProfissionais, (p) => p.id);
  const perfisDosAlunos = colecao<PerfilDoAluno>('perfis-dos-alunos', dados.perfis, chaveDoPerfil);
  const medicoes = colecao<MedicaoCorporal>('medicoes', dados.medicoes, (m) => m.id);
  colecao<AssinaturaPlus>('assinaturas', dados.assinaturas, (a) => a.id);
  const refeicoes = colecao<RefeicaoRegistrada>(COLECAO_DE_REFEICOES, dados.refeicoesRegistradas, (r) => r.id);
  // luta
  colecao<Presenca>(COLECAO_DE_PRESENCAS, dados.presencas, (p) => p.id);
  const fichas = colecao<FichaDeLuta>('fichas', dados.fichas, (f) => f.alunoId);
  const ajustes = colecao<AjusteDeAula>('ajustes-de-aula', dados.ajustes, (a) => `${a.aulaId}|${a.tipo}|${a.em}`);
  const graduacoes = colecao<Graduacao>('graduacoes', dados.graduacoes, (g) => g.id);
  const exames = colecao<Exame>('exames', dados.exames, (e) => e.id);
  const eventos = colecao<EventoDaAcademia>('eventos', dados.eventos, (e) => e.id);
  const lutas = colecao<Luta>('lutas', dados.lutas, (l) => l.id);
  const consentimentos = colecao<ConsentimentoDeAtleta>('consentimentos-de-atleta', dados.consentimentos, (c) => `${c.academiaId}|${c.alunoId}`);
  const dependentes = colecao<Dependente>('dependentes', dados.dependentes, (d) => d.id);
  const interessados = colecao<Interessado>('interessados', dados.interessados, (i) => i.id);
  const experimentais = colecao<AulaExperimental>('experimentais', dados.experimentais, (e) => e.id);
  const participacoes = new Map<Id, Id[]>(Object.entries(dados.participacoes));
  for (const [id, v] of arm.colecao('participacoes')) if (Array.isArray(v)) participacoes.set(id, v.filter((x): x is Id => typeof x === 'string'));

  const academiaDe = (id: Id) => dados.academias.find((a) => a.id === id)!;
  const comAcademia = (v: Vinculo): VinculoComAcademia => ({ ...v, academia: academiaDe(v.academiaId) });
  const exigirVinculo = (id: Id) => {
    const v = dados.vinculos.find((x) => x.id === id);
    if (!v) throw new Error(`vínculo "${id}" não existe`);
    return v;
  };
  const normalizar = (codigo: string) => codigo.trim().toUpperCase();
  const emVigor = (a: AvisoDaAcademia, dia: string) => !a.retiradoEm && somarDias(a.publicadoEm.slice(0, 10), a.validadeDias) >= dia;
  const daAcademia = <T extends { academiaId: Id }>(lista: readonly T[], academiaId: Id) => lista.filter((x) => x.academiaId === academiaId);

  const repo: RepositorioLocal = {
    nome: 'local',
    destino,

    // --- conta e vínculos ------------------------------------------------------
    contasDeExemplo: () => dados.contas,
    usuario: async (id) => dados.usuarios.find((u) => u.id === id) ?? null,
    usuarioPeloEmail: async (email) => {
      const limpo = email.trim().toLowerCase();
      return dados.usuarios.find((u) => u.email.trim().toLowerCase() === limpo) ?? null;
    },
    vinculosDoUsuario: async (usuarioId) => dados.vinculos.filter((v) => v.usuarioId === usuarioId).map(comAcademia),
    criarConta: async ({ nome, email }) => {
      comSinal();
      const limpo = email.trim().toLowerCase();
      if (dados.usuarios.some((u) => u.email.toLowerCase() === limpo)) throw new Error('já existe uma conta com esse e-mail');
      const u: Usuario = { id: gerarId(), nome: nome.trim(), email: limpo, criadoEm: agora() };
      usuarios.gravar(u);
      return u;
    },
    academiaPeloCodigo: async (codigo) => dados.academias.find((a) => a.codigoDeVinculo === normalizar(codigo)) ?? null,
    academiaPeloCodigoDaEquipe: async (codigo) => dados.academias.find((a) => a.codigoDaEquipe === normalizar(codigo)) ?? null,
    pedirVinculo: async (usuarioId, academiaId, papel) => {
      comSinal();
      const ja = dados.vinculos.find((v) => v.usuarioId === usuarioId && v.academiaId === academiaId && v.papel === papel && v.estado !== 'encerrado');
      if (ja) return ja;
      const academia = academiaDe(academiaId);
      const v: Vinculo = { id: gerarId(), usuarioId, academiaId, papel, estado: papel === 'aluno' && academia.entrarSemConfirmacao ? 'ativo' : 'pendente', desde: hoje() };
      vinculos.gravar(v);
      return v;
    },
    cancelarPedidoDeVinculo: async (vinculoId, porId) => {
      comSinal();
      const v = exigirVinculo(vinculoId);
      if (v.estado !== 'pendente') throw new Error('só o pedido pendente se cancela');
      if (v.usuarioId !== porId) throw new Error('só quem pediu cancela');
      vinculos.gravar({ ...v, estado: 'encerrado', ate: hoje(), encerradoPor: porId });
    },

    // --- a academia de luta ------------------------------------------------------
    academiaDeLuta: async (academiaId) => {
      if (academiaId !== dados.luta.academiaId) throw new Error(`academia "${academiaId}" sem configuração de luta`);
      return dados.luta;
    },
    academiaDaVitrine: async () => dados.luta,
    ajustesDeAula: async (academiaId) => daAcademia(dados.ajustes, academiaId),
    cancelarAula: async (ajuste) => {
      comSinal();
      if (ajuste.tipo !== 'cancelada') throw new Error('cancelarAula recebe o ajuste de cancelamento');
      const retiradas = retirarPorCancelamento(dados.presencas, ajuste.aulaId, ajuste.porId, ajuste.em);
      // o cancelamento e as presenças retiradas vão juntos (R15.11)
      atomico(() => {
        ajustes.gravar(ajuste);
        if (retiradas.length) gravarPresencasEEnfileirar(arm, retiradas, 'chamada', ajuste.porId, ajuste.em);
        for (const p of retiradas) {
          const i = dados.presencas.findIndex((x) => x.id === p.id);
          if (i >= 0) dados.presencas[i] = p;
        }
      });
    },
    passarAula: async (ajuste) => {
      comSinal();
      if (ajuste.tipo !== 'substituto' || !ajuste.substitutoId) throw new Error('passarAula recebe o ajuste com o substituto');
      ajustes.gravar(ajuste);
    },

    // --- alunos de luta ------------------------------------------------------------
    fichasDaAcademia: async (academiaId) => daAcademia(dados.fichas, academiaId),
    fichasDoUsuario: async (usuarioId) => dados.fichas.filter((f) => f.alunoId === usuarioId || f.dependenteDe === usuarioId),
    marcarAtleta: async (alunoId, academiaId, modalidadeId, atleta) => {
      comSinal();
      const f = dados.fichas.find((x) => x.alunoId === alunoId && x.academiaId === academiaId);
      if (!f) throw new Error(`aluno "${alunoId}" sem ficha nesta academia`);
      const atletaEm = atleta ? [...new Set([...f.atletaEm, modalidadeId])] : f.atletaEm.filter((m) => m !== modalidadeId);
      fichas.gravar({ ...f, atletaEm });
    },
    alunosDaAcademia: async (academiaId): Promise<ResumoDoAluno[]> =>
      daAcademia(dados.fichas, academiaId).map((ficha) => {
        const donoDaConta = ficha.dependenteDe ?? ficha.alunoId;
        const vinculo = dados.vinculos.find((v) => v.usuarioId === donoDaConta && v.academiaId === academiaId && v.papel === 'aluno' && v.estado !== 'encerrado') ?? null;
        return { ficha, vinculo, usuario: dados.usuarios.find((u) => u.id === donoDaConta) ?? null };
      }),

    // --- presença -------------------------------------------------------------------
    presencasDaAcademia: async (academiaId) => daAcademia(dados.presencas, academiaId),
    presencasDosAlunos: async (alunoIds) => dados.presencas.filter((p) => alunoIds.includes(p.alunoId)),
    registrarPresencas: (presencas, tipo, usuarioId) =>
      atomico(() => {
        const itens = gravarPresencasEEnfileirar(arm, presencas, tipo, usuarioId, agora());
        for (const p of presencas) {
          const i = dados.presencas.findIndex((x) => x.id === p.id);
          if (i >= 0) dados.presencas[i] = p;
          else dados.presencas.push(p);
        }
        return itens;
      }),

    // --- graduação --------------------------------------------------------------------
    graduacoesDaAcademia: async (academiaId) => daAcademia(dados.graduacoes, academiaId),
    graduacoesDosAlunos: async (alunoIds) => dados.graduacoes.filter((g) => alunoIds.includes(g.alunoId)),
    salvarGraduacao: async (g) => {
      comSinal();
      graduacoes.gravar(g);
    },
    exames: async (academiaId) => daAcademia(dados.exames, academiaId),
    salvarExame: async (e) => {
      comSinal();
      exames.gravar(e);
    },

    // --- eventos, lutas, Atletas -----------------------------------------------------------
    eventos: async (academiaId) => daAcademia(dados.eventos, academiaId),
    salvarEvento: async (e) => {
      comSinal();
      eventos.gravar(e);
    },
    lutas: async (academiaId) => daAcademia(dados.lutas, academiaId),
    salvarLuta: async (l) => {
      comSinal();
      lutas.gravar(l);
    },
    participantes: async (eventoId) => participacoes.get(eventoId) ?? [],
    alternarParticipacao: async (eventoId, alunoId) => {
      comSinal();
      const nova = alternarParticipacao(participacoes.get(eventoId) ?? [], alunoId);
      arm.gravarNaColecao('participacoes', eventoId, nova);
      participacoes.set(eventoId, nova);
      return nova;
    },
    consentimentosDeAtleta: async (academiaId) => daAcademia(dados.consentimentos, academiaId),
    definirAparecerEmAtletas: async (alunoId, academiaId, ligado) => {
      comSinal();
      const atual = dados.consentimentos.find((c) => c.alunoId === alunoId && c.academiaId === academiaId) ?? consentimentoInicial(alunoId, academiaId);
      consentimentos.gravar(definirAparecerEmAtletas(atual, ligado, agora()));
    },

    // --- o que a academia mostra -------------------------------------------------------------
    tecnicas: async (academiaId) => daAcademia(dados.tecnicas, academiaId),
    perguntasFrequentes: async (academiaId) => daAcademia(dados.perguntas, academiaId),

    // --- Kids ---------------------------------------------------------------------------------
    dependentes: async (responsavelId) => dados.dependentes.filter((d) => d.responsavelId === responsavelId),
    salvarDependente: async (d) => {
      comSinal();
      dependentes.gravar(d);
      // o dependente novo ganha a ficha (a matrícula de verdade é do Admin, R20.1)
      if (!dados.fichas.some((f) => f.alunoId === d.id)) fichas.gravar({ alunoId: d.id, academiaId: d.academiaId, nome: d.nome, dependenteDe: d.responsavelId, ...(d.dataNascimento ? { dataNascimento: d.dataNascimento } : {}), modalidadeIds: [], turmaIds: [], atletaEm: [], desde: hoje() });
      else {
        const f = dados.fichas.find((x) => x.alunoId === d.id)!;
        if (f.nome !== d.nome || f.dataNascimento !== d.dataNascimento) fichas.gravar({ ...f, nome: d.nome, ...(d.dataNascimento ? { dataNascimento: d.dataNascimento } : {}) });
      }
    },

    // --- aula experimental e indicação ---------------------------------------------------------
    interessados: async (academiaId) => daAcademia(dados.interessados, academiaId),
    salvarInteressado: async (i) => {
      comSinal();
      interessados.gravar(i);
    },
    experimentais: async (academiaId) => daAcademia(dados.experimentais, academiaId),
    salvarExperimental: async (e) => {
      comSinal();
      // a experimental tem de cair numa aula que a grade gera
      if (!aulaPeloId(dados.luta.turmas, e.aulaId, fuso, dados.ajustes)) throw new Error('essa aula não está na grade');
      experimentais.gravar(e);
    },
    indicacoesDoAluno: async (alunoId) =>
      dados.indicacoes.filter((i) => i.alunoId === alunoId).map((indicacao) => ({ indicacao, interessado: dados.interessados.find((x) => x.id === indicacao.interessadoId) ?? null })),

    // --- cadastro opcional -----------------------------------------------------------------------
    perfilDoAluno: async (alunoId) => dados.perfis.find((p) => p.usuarioId === alunoId) ?? null,
    salvarPerfilDoAluno: async (perfil) => perfisDosAlunos.gravar({ ...perfil, atualizadoEm: agora() }),
    medicoesDoAluno: async (alunoId) => dados.medicoes.filter((m) => m.alunoId === alunoId).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0)),
    registrarMedicao: async (m) => medicoes.gravar(m),
    preferenciasDeAviso: async (usuarioId) => {
      const salvo = arm.registroDaColecao('preferencias-de-aviso', usuarioId) as Partial<PreferenciasDeAviso> | null;
      // gravado por uma versão anterior: o que falta vem do padrão (agente AG)
      const padrao = structuredClone(PREFERENCIAS_PADRAO) as PreferenciasDeAviso;
      if (!salvo || typeof salvo !== 'object') return padrao;
      return {
        ...padrao,
        ...salvo,
        lembreteDeTreino: { ...padrao.lembreteDeTreino, ...(salvo.lembreteDeTreino ?? {}) },
        lembreteDeRefeicao: { ...padrao.lembreteDeRefeicao, ...(salvo.lembreteDeRefeicao ?? {}) },
      };
    },
    salvarPreferenciasDeAviso: async (usuarioId, p) => arm.gravarNaColecao('preferencias-de-aviso', usuarioId, p),

    // --- Plus e dieta (desligados na v1; a mecânica fica) -----------------------------------------
    assinaturaPlus: async (alunoId) => dados.assinaturas.find((a) => a.alunoId === alunoId) ?? null,
    planoDeDieta: async (alunoId, data) => dados.planos.find((p) => p.alunoId === alunoId && p.estado === 'em_vigor' && p.inicio <= data && (!p.fim || p.fim >= data)) ?? null,
    refeicoesRegistradas: async (alunoId, data) => dados.refeicoesRegistradas.filter((r) => r.alunoId === alunoId && r.data === data),
    registrarRefeicao: (r, usuarioId) =>
      atomico(() => {
        for (const antiga of dados.refeicoesRegistradas.filter((x) => x.alunoId === r.alunoId && x.refeicaoId === r.refeicaoId && x.data === r.data && x.id !== r.id)) {
          refeicoes.apagar(antiga.id);
          tirarRefeicaoDaFila(arm, antiga, usuarioId, agora());
        }
        const item = gravarRefeicaoEEnfileirar(arm, r, usuarioId, agora());
        const i = dados.refeicoesRegistradas.findIndex((x) => x.id === r.id);
        if (i >= 0) dados.refeicoesRegistradas[i] = r;
        else dados.refeicoesRegistradas.push(r);
        return item;
      }),
    desfazerRefeicao: (alunoId, refeicaoId, data) =>
      atomico(() => {
        for (const r of dados.refeicoesRegistradas.filter((x) => x.alunoId === alunoId && x.refeicaoId === refeicaoId && x.data === data)) {
          refeicoes.apagar(r.id);
          tirarRefeicaoDaFila(arm, r, alunoId, agora());
        }
      }),

    // --- avisos, equipe, vínculos ---------------------------------------------------------------------
    avisoDaAcademia: async (academiaId) => {
      const dia = hoje();
      return dados.avisos.filter((a) => a.academiaId === academiaId && !a.turmaId && emVigor(a, dia)).sort((a, b) => instante(b.publicadoEm) - instante(a.publicadoEm))[0] ?? null;
    },
    avisosDaAcademia: async (academiaId) => dados.avisos.filter((a) => a.academiaId === academiaId),
    publicarAviso: async (rascunho) => {
      comSinal();
      const problemas = validarAvisoDaAcademia({ texto: rascunho.texto, validadeDias: rascunho.validadeDias });
      if (problemas.length) throw new Error(`aviso recusado: ${problemas.join(', ')}`);
      const dia = hoje();
      // no máximo um aviso COM notificação por dia (R10.10); o da turma, um por turma por dia (R22.1)
      const jaNotificou = dados.avisos.some((a) => a.academiaId === rascunho.academiaId && a.comNotificacao && a.publicadoEm.slice(0, 10) === dia && (a.turmaId ?? null) === (rascunho.turmaId ?? null));
      const a: AvisoDaAcademia = { ...rascunho, texto: rascunho.texto.trim(), comNotificacao: rascunho.comNotificacao && !jaNotificou, id: gerarId(), publicadoEm: agora() };
      avisos.gravar(a);
      return a;
    },
    retirarAviso: async (avisoId, porId) => {
      const a = dados.avisos.find((x) => x.id === avisoId);
      if (!a) throw new Error(`aviso "${avisoId}" não existe`);
      if (!a.retiradoEm) avisos.gravar({ ...a, retiradoEm: agora(), retiradoPorId: porId });
    },
    equipe: async (academiaId) =>
      dados.vinculos
        .filter((v) => v.academiaId === academiaId && v.estado === 'ativo' && PAPEIS_DA_ACADEMIA.includes(v.papel))
        .map((v) => ({ usuario: dados.usuarios.find((u) => u.id === v.usuarioId)!, vinculo: v, perfil: dados.perfisProfissionais.find((p) => p.vinculoId === v.id) ?? null })),
    salvarPerfilProfissional: async (perfil) => perfisProfissionais.gravar(perfil),
    preferenciasDaEquipe: async (vinculoId) => {
      const salvo = arm.registroDaColecao('preferencias-da-equipe', vinculoId) as Partial<PreferenciasDaEquipe> | null;
      const v = dados.vinculos.find((x) => x.id === vinculoId);
      const padrao = { ...PREFERENCIAS_DA_EQUIPE_PADRAO, alunosSemTreinar: v?.papel !== 'instrutor' };
      return salvo && typeof salvo === 'object' ? { ...padrao, ...salvo } : padrao;
    },
    salvarPreferenciasDaEquipe: async (vinculoId, p) => arm.gravarNaColecao('preferencias-da-equipe', vinculoId, p),
    confirmarVinculos: async (ids) => {
      comSinal();
      atomico(() => {
        for (const id of ids) {
          const v = exigirVinculo(id);
          if (v.estado === 'pendente') vinculos.gravar({ ...v, estado: 'ativo', desde: hoje() });
        }
      });
    },
    recusarVinculo: async (id, porId) => {
      comSinal();
      const v = exigirVinculo(id);
      if (v.estado !== 'pendente') throw new Error('só o pedido pendente se recusa');
      vinculos.gravar({ ...v, estado: 'encerrado', ate: hoje(), encerradoPor: porId });
    },
    encerrarVinculo: async (id, porId, motivo) => {
      comSinal();
      const v = exigirVinculo(id);
      if (v.estado === 'encerrado') return;
      vinculos.gravar({ ...v, estado: 'encerrado', ate: hoje(), encerradoPor: porId, ...(motivo ? { motivoDeSaida: motivo } : {}) });
    },

    // --- só deste aparelho -------------------------------------------------------------------------
    lerDoAparelho: (chave) => arm.lerPreferencia(`aparelho.${chave}`),
    // nunca lança (agente AG): o cronômetro é gravado num useEffect, e um erro ali derrubava a tela inteira
    gravarNoAparelho: (chave, valor) => void gravarPreferenciaSemTravar(arm, `aparelho.${chave}`, valor),
  };
  return repo;
}
