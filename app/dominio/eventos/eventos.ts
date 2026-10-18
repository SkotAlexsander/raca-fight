/**
 * Eventos, lutas e a área Atletas (R18).
 *
 * - Evento: exame, seminário, aulão, campeonato, luta, confraternização.
 *   "Vou participar" é do aluno; a lista de quem vai é só da equipe (R18.3).
 * - Luta: um combate de um atleta da academia, com o resultado depois (R18.4).
 * - Área "Atletas" (R18.6): só aparece quem LIGOU a chave, que nasce
 *   DESLIGADA. As lutas de quem não está em Atletas só a equipe vê — nem como
 *   "luta de um atleta da academia".
 * - Sem ranking, sem placar entre alunos (R18.7).
 * - Link no evento é [decidir] L22: a regra do `https://` está pronta, mas
 *   quem chama diz se a academia aceita link.
 */
import type { DataISO, Id, InstanteISO } from '../tipos.ts';

export type TipoDeEvento = 'exame' | 'seminario' | 'aulao' | 'campeonato' | 'luta' | 'confraternizacao' | 'outro';

export const NOME_DO_TIPO_DE_EVENTO: Readonly<Record<TipoDeEvento, string>> = {
  exame: 'Exame de graduação',
  seminario: 'Seminário',
  aulao: 'Aulão',
  campeonato: 'Campeonato',
  luta: 'Noite de lutas',
  confraternizacao: 'Confraternização',
  outro: 'Evento',
};

export type PublicoDoEvento = 'alunos' | 'aberto';

export interface EventoDaAcademia {
  id: Id;
  academiaId: Id;
  nome: string;
  tipo: TipoDeEvento;
  modalidadeIds: Id[];
  data: DataISO;
  /** `HH:MM`, no fuso da academia. */
  hora?: string;
  local: string;
  endereco?: string;
  descricao?: string;
  /** `aberto` aparece também na vitrine, sem conta (R14.11). */
  publico: PublicoDoEvento;
  link?: string;
  criadoPorId: Id;
  criadoEm: InstanteISO;
}

export type NivelDaLuta = 'amador' | 'semi_pro' | 'profissional';
export type ResultadoDaLuta = 'vitoria' | 'derrota' | 'empate' | 'sem_resultado';
export type ComoTerminouALuta = 'pontos' | 'nocaute' | 'finalizacao' | 'decisao';

export const NOME_DO_NIVEL_DA_LUTA: Readonly<Record<NivelDaLuta, string>> = { amador: 'amador', semi_pro: 'semi-pró', profissional: 'profissional' };
export const NOME_DO_RESULTADO: Readonly<Record<ResultadoDaLuta, string>> = { vitoria: 'Vitória', derrota: 'Derrota', empate: 'Empate', sem_resultado: 'Sem resultado' };
export const NOME_DE_COMO_TERMINOU: Readonly<Record<ComoTerminouALuta, string>> = { pontos: 'por pontos', nocaute: 'por nocaute', finalizacao: 'por finalização', decisao: 'por decisão' };

export interface Luta {
  id: Id;
  academiaId: Id;
  eventoId: Id;
  atletaId: Id;
  modalidadeId: Id;
  /** O nome como no cartaz (texto livre). */
  adversario: string;
  equipeDoAdversario?: string;
  /** "60 kg": a categoria anunciada, não o peso medido (R18.5). */
  categoria: string;
  nivel: NivelDaLuta;
  data: DataISO;
  local: string;
  resultado?: ResultadoDaLuta;
  como?: ComoTerminouALuta;
}

/** R18.6: o consentimento para a área Atletas. Nasce desligado. */
export interface ConsentimentoDeAtleta {
  alunoId: Id;
  academiaId: Id;
  ligado: boolean;
  /** Quando foi ligado ou desligado pela última vez. */
  em?: InstanteISO;
}

export type QuemOlha = 'equipe' | 'aluno' | 'vitrine';

export function consentimentoInicial(alunoId: Id, academiaId: Id): ConsentimentoDeAtleta {
  return { alunoId, academiaId, ligado: false };
}

export function definirAparecerEmAtletas(c: ConsentimentoDeAtleta, ligado: boolean, em: InstanteISO): ConsentimentoDeAtleta {
  return { ...c, ligado, em };
}

const consentiu = (consentimentos: readonly ConsentimentoDeAtleta[], alunoId: Id) => consentimentos.some((c) => c.alunoId === alunoId && c.ligado);

/** Quem aparece em Atletas: só quem ligou a chave (e, se menor, com a autorização do responsável: `kids.ts`). */
export function atletasVisiveis(consentimentos: readonly ConsentimentoDeAtleta[], podeAparecer: (alunoId: Id) => boolean = () => true): Id[] {
  return consentimentos.filter((c) => c.ligado && podeAparecer(c.alunoId)).map((c) => c.alunoId);
}

/** As lutas que cada um vê: a equipe, todas; o aluno e a vitrine, só as de quem está em Atletas. */
export function lutasVisiveis(lutas: readonly Luta[], consentimentos: readonly ConsentimentoDeAtleta[], quem: QuemOlha, podeAparecer: (alunoId: Id) => boolean = () => true): Luta[] {
  if (quem === 'equipe') return [...lutas];
  return lutas.filter((l) => consentiu(consentimentos, l.atletaId) && podeAparecer(l.atletaId));
}

/** A vitrine (sem conta) só vê evento aberto; o aluno e a equipe veem todos. */
export function eventosVisiveis(eventos: readonly EventoDaAcademia[], quem: QuemOlha): EventoDaAcademia[] {
  return eventos.filter((e) => quem !== 'vitrine' || e.publico === 'aberto');
}

export function proximosEventos(eventos: readonly EventoDaAcademia[], hoje: DataISO): EventoDaAcademia[] {
  return eventos.filter((e) => e.data >= hoje).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : (a.hora ?? '').localeCompare(b.hora ?? '')));
}

export function eventosPassados(eventos: readonly EventoDaAcademia[], hoje: DataISO): EventoDaAcademia[] {
  return eventos.filter((e) => e.data < hoje).sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

export type ProblemaDoLink = 'nao_aceito' | 'so_https' | 'invalido';

/** R18.1 e L22: só `https://` e só se a academia aceitar link em evento. Nulo = sem problema. */
export function validarLinkDoEvento(link: string, academiaAceitaLink: boolean): ProblemaDoLink | null {
  const l = link.trim();
  if (!l) return null;
  if (!academiaAceitaLink) return 'nao_aceito';
  if (!/^https:\/\//i.test(l)) return 'so_https';
  try {
    const u = new URL(l);
    return u.hostname.includes('.') ? null : 'invalido';
  } catch {
    return 'invalido';
  }
}

/** "Vou participar" (R18.3): marca e desmarca. */
export function alternarParticipacao(participantes: readonly Id[], alunoId: Id): Id[] {
  return participantes.includes(alunoId) ? participantes.filter((x) => x !== alunoId) : [...participantes, alunoId];
}

/** O título do cartão da luta, com o nome do atleta (só quando ele está em Atletas). */
export function tituloDaLuta(l: Luta, nomeDoAtleta: string): string {
  return `${nomeDoAtleta} vs ${l.adversario} · ${l.categoria} · ${NOME_DO_NIVEL_DA_LUTA[l.nivel]}`;
}

/** "Vitória por pontos" */
export function textoDoResultado(l: Luta): string | null {
  if (!l.resultado) return null;
  return l.como && l.resultado !== 'sem_resultado' ? `${NOME_DO_RESULTADO[l.resultado]} ${NOME_DE_COMO_TERMINOU[l.como]}` : NOME_DO_RESULTADO[l.resultado];
}
