/**
 * Aula experimental, interessado e indicação ("Traga um amiguinho") — R19.
 *
 * - O caminho da v1 é o WhatsApp (R19.2): o botão abre a conversa da academia
 *   com a modalidade NA MENSAGEM. O app não registra o toque; o registro
 *   nasce na recepção.
 * - Uma experimental grátis por pessoa por modalidade é proposta (L24): aqui
 *   só se AVISA a recepção; quem decide é ela.
 * - Apagar o interessado que não virou aluno (L23): o prazo é parâmetro.
 * - O desconto da indicação é do Admin (L26): aqui só o código e o estado.
 */
import type { DataISO, Id, InstanteISO } from '../tipos.ts';
import { somarDias } from '../turmas/horario.ts';
import { primeiroNome } from '../kids/kids.ts';

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

export function soDigitos(texto: string): string {
  return texto.replace(/\D+/g, '');
}

/** "(51) 98196-2077" → "5551981962077" (o formato do wa.me: DDI + DDD + número, sem nada mais). */
export function numeroParaWhatsApp(telefone: string): string {
  const d = soDigitos(telefone);
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  throw new RangeError('telefone sem DDD ou com dígitos a mais');
}

/** R19.2: "Olá! Quero agendar uma aula experimental de Muay Thai na Raça Fight." */
export function mensagemDaExperimental(modalidade: string | null, academia: string): string {
  if (!modalidade) return `Olá! Quero agendar uma aula experimental na ${academia}. Ainda não sei a modalidade.`;
  return `Olá! Quero agendar uma aula experimental de ${modalidade} na ${academia}.`;
}

/** O link de conversa do WhatsApp com a mensagem pronta. Sem o app, abre o WhatsApp Web. */
export function linkDoWhatsApp(telefone: string, mensagem: string): string {
  return `https://wa.me/${numeroParaWhatsApp(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

/** As opções da folha "Qual modalidade?" (F17): as modalidades, as turmas Kids e "Ainda não sei". */
export function opcoesDaExperimental(modalidades: readonly string[], turmasKids: readonly string[]): (string | null)[] {
  return [...modalidades, ...turmasKids, null];
}

// ---------------------------------------------------------------------------
// Interessado e aula experimental
// ---------------------------------------------------------------------------

export interface Interessado {
  id: Id;
  academiaId: Id;
  nome: string;
  /** Dado de contato: só a recepção e o dono veem (o professor, não: R19.5). */
  whatsapp: string;
  modalidadeId: Id | null;
  /** Experimental de criança (R19.10): o nome e a idade dela; o interessado é o responsável. */
  crianca?: { nome: string; idade: number };
  comoConheceu?: string;
  /** O código de indicação que a pessoa trouxe (R19.9). */
  codigoDeIndicacao?: string;
  criadoEm: InstanteISO;
  criadoPorId: Id;
}

export type EstadoDaExperimental = 'agendada' | 'compareceu' | 'faltou' | 'remarcada' | 'cancelada' | 'matriculou' | 'nao_seguiu';

export const NOME_DO_ESTADO_DA_EXPERIMENTAL: Readonly<Record<EstadoDaExperimental, string>> = {
  agendada: 'Agendada',
  compareceu: 'Compareceu',
  faltou: 'Faltou',
  remarcada: 'Remarcada',
  cancelada: 'Cancelada',
  matriculou: 'Matriculou',
  nao_seguiu: 'Não seguiu',
};

/** R19.3: agendada → compareceu · faltou · remarcada · cancelada; compareceu → matriculou · não seguiu. */
const TRANSICOES: Readonly<Record<EstadoDaExperimental, readonly EstadoDaExperimental[]>> = {
  agendada: ['compareceu', 'faltou', 'remarcada', 'cancelada'],
  faltou: ['remarcada', 'cancelada'],
  compareceu: ['matriculou', 'nao_seguiu'],
  remarcada: [],
  cancelada: [],
  matriculou: [],
  nao_seguiu: ['matriculou'],
};

export interface AulaExperimental {
  id: Id;
  academiaId: Id;
  interessadoId: Id;
  aulaId: Id;
  turmaId: Id;
  data: DataISO;
  modalidadeId: Id;
  estado: EstadoDaExperimental;
  marcadaPorId: Id;
  /** Remarcada: a nova aponta para a anterior. */
  remarcadaDe?: Id;
  criadaEm: InstanteISO;
  atualizadaEm: InstanteISO;
}

export class ErroDaExperimental extends Error {
  readonly codigo: 'transicao_invalida' | 'nome_vazio' | 'whatsapp_invalido';
  constructor(codigo: ErroDaExperimental['codigo'], mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
  }
}

export function podeMudarPara(de: EstadoDaExperimental, para: EstadoDaExperimental): boolean {
  return TRANSICOES[de].includes(para);
}

export function mudarEstadoDaExperimental(e: AulaExperimental, para: EstadoDaExperimental, em: InstanteISO): AulaExperimental {
  if (!podeMudarPara(e.estado, para)) throw new ErroDaExperimental('transicao_invalida', `De "${NOME_DO_ESTADO_DA_EXPERIMENTAL[e.estado]}" não dá para ir a "${NOME_DO_ESTADO_DA_EXPERIMENTAL[para]}".`);
  return { ...e, estado: para, atualizadaEm: em };
}

/** Remarcar: a antiga fica `remarcada` e nasce outra, ligada a ela. */
export function remarcarExperimental(e: AulaExperimental, nova: { id: Id; aulaId: Id; turmaId: Id; data: DataISO; porId: Id; em: InstanteISO }): { antiga: AulaExperimental; nova: AulaExperimental } {
  const antiga = mudarEstadoDaExperimental(e, 'remarcada', nova.em);
  return { antiga, nova: { ...e, id: nova.id, aulaId: nova.aulaId, turmaId: nova.turmaId, data: nova.data, estado: 'agendada', marcadaPorId: nova.porId, remarcadaDe: e.id, criadaEm: nova.em, atualizadaEm: nova.em } };
}

/** Valida o cadastro da recepção (F17, passo 5). */
export function novoInteressado(d: Omit<Interessado, 'nome' | 'whatsapp'> & { nome: string; whatsapp: string }): Interessado {
  const nome = d.nome.trim();
  if (!nome) throw new ErroDaExperimental('nome_vazio', 'Escreva o nome.');
  let whatsapp: string;
  try {
    whatsapp = numeroParaWhatsApp(d.whatsapp);
  } catch {
    throw new ErroDaExperimental('whatsapp_invalido', 'Confira o WhatsApp com o DDD.');
  }
  return { ...d, nome, whatsapp };
}

/**
 * R19.4 (proposta L24): o mesmo WhatsApp já fez experimental desta
 * modalidade? A tela AVISA a recepção; não bloqueia.
 */
export function jaFezExperimental(experimentais: readonly AulaExperimental[], interessados: readonly Interessado[], whatsapp: string, modalidadeId: Id): boolean {
  let numero: string;
  try {
    numero = numeroParaWhatsApp(whatsapp);
  } catch {
    return false;
  }
  const ids = new Set(interessados.filter((i) => i.whatsapp === numero).map((i) => i.id));
  return experimentais.some((e) => ids.has(e.interessadoId) && e.modalidadeId === modalidadeId && e.estado !== 'cancelada' && e.estado !== 'remarcada');
}

/** R19.5: na chamada o professor vê só o primeiro nome (da criança, se for de criança). */
export function nomeNaChamada(i: Interessado): string {
  return primeiroNome(i.crianca?.nome ?? i.nome);
}

/** [decidir] L23: depois de quantos dias apagar quem não virou aluno. O prazo chega por parâmetro. */
export function dataParaApagarInteressado(ultimaExperimental: DataISO, dias: number): DataISO {
  if (!Number.isInteger(dias) || dias <= 0) throw new RangeError('o prazo (L23) é um inteiro de dias');
  return somarDias(ultimaExperimental, dias);
}

/** Os grupos da aba Experimentais da recepção (mapa, Parte D). */
export function gruposDasExperimentais(experimentais: readonly AulaExperimental[], hoje: DataISO) {
  return {
    hoje: experimentais.filter((e) => e.estado === 'agendada' && e.data === hoje),
    agendadas: experimentais.filter((e) => e.estado === 'agendada' && e.data > hoje),
    compareceramSemMatricula: experimentais.filter((e) => e.estado === 'compareceu'),
    faltaram: experimentais.filter((e) => e.estado === 'faltou' || (e.estado === 'agendada' && e.data < hoje)),
  };
}

// ---------------------------------------------------------------------------
// Indicação ("Traga um amiguinho", R19.9)
// ---------------------------------------------------------------------------

/** Sem letras e números que se confundem (O e 0, I e 1). */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** O código de 6 caracteres do aluno, estável (o mesmo aluno, o mesmo código). */
export function codigoDeIndicacao(alunoId: Id): string {
  let h = 2166136261;
  for (const c of alunoId) {
    h ^= c.codePointAt(0)!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  let codigo = '';
  for (let i = 0; i < 6; i += 1) {
    codigo += ALFABETO[h % ALFABETO.length];
    h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0;
  }
  return codigo;
}

export function lerCodigoDeIndicacao(texto: string): string | null {
  const c = texto.trim().toUpperCase();
  return /^[A-HJ-NP-Z2-9]{6}$/.test(c) ? c : null;
}

/** A mensagem que o aluno compartilha (F25). */
export function mensagemDeIndicacao(codigo: string, academia: string, linkDaAcademia: string): string {
  return `Treina comigo na ${academia}! Aula experimental grátis: ${linkDaAcademia} Diga o código ${codigo}.`;
}

export type EstadoDaIndicacao = 'aberta' | 'convertida';

export interface Indicacao {
  id: Id;
  academiaId: Id;
  codigo: string;
  /** Quem indicou (o dono do código). */
  alunoId: Id;
  interessadoId: Id;
  estado: EstadoDaIndicacao;
  criadaEm: InstanteISO;
}

/** O que o aluno vê da indicação: o primeiro nome do indicado e o estado, nada mais (R19.9). */
export function resumoDaIndicacao(i: Indicacao, interessado: Pick<Interessado, 'nome'>): { nome: string; texto: string } {
  return { nome: primeiroNome(interessado.nome), texto: i.estado === 'convertida' ? 'Sua indicação virou matrícula' : 'Ainda não se matriculou' };
}
