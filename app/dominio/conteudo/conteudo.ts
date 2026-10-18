/**
 * O que a academia mostra além da grade: as TÉCNICAS em vídeo (R21) e as
 * perguntas frequentes, o "Raça Responde" (R22.3).
 *
 * - Onde fica o vídeo é [decidir] L30: o tipo aceita o LINK (a recomendação
 *   para a v1, porque os vídeos já estão no Instagram) e deixa o arquivo como
 *   possibilidade futura, sem escolher por ninguém.
 * - Sem comentário, curtida nem contagem de visualização (R21.5, R11.9).
 */
import type { DataISO, Id } from '../tipos.ts';

export type NivelDaTecnica = 'todos' | 'iniciante' | 'intermediario' | 'avancado';
export type EstadoDaTecnica = 'rascunho' | 'publicada' | 'arquivada';

export const NOME_DO_NIVEL_DA_TECNICA: Readonly<Record<NivelDaTecnica, string>> = { todos: 'Todos os níveis', iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

export interface Tecnica {
  id: Id;
  academiaId: Id;
  modalidadeId: Id;
  titulo: string;
  nivel: NivelDaTecnica;
  duracaoSegundos: number;
  professorId: Id;
  data: DataISO;
  /** L30: o link do vídeo já publicado (Instagram, YouTube). O app abre fora. */
  link?: string;
  /** Também sem conta, na vitrine (R21.4). */
  aberta: boolean;
  estado: EstadoDaTecnica;
  /** Vídeo com menor só com a autorização do responsável (R21.5). */
  temMenor: boolean;
}

export interface PerguntaFrequente {
  id: Id;
  academiaId: Id;
  pergunta: string;
  resposta: string;
  ordem: number;
}

export const LIMITE_DA_PERGUNTA = 120;
export const LIMITE_DA_RESPOSTA = 600;

export type ProblemaDaPergunta = 'pergunta_vazia' | 'pergunta_longa' | 'resposta_vazia' | 'resposta_longa';

export function validarPerguntaFrequente(p: Pick<PerguntaFrequente, 'pergunta' | 'resposta'>): ProblemaDaPergunta[] {
  const problemas: ProblemaDaPergunta[] = [];
  const pg = [...p.pergunta.trim()].length;
  const rs = [...p.resposta.trim()].length;
  if (pg === 0) problemas.push('pergunta_vazia');
  if (pg > LIMITE_DA_PERGUNTA) problemas.push('pergunta_longa');
  if (rs === 0) problemas.push('resposta_vazia');
  if (rs > LIMITE_DA_RESPOSTA) problemas.push('resposta_longa');
  return problemas;
}

export function perguntasEmOrdem(ps: readonly PerguntaFrequente[]): PerguntaFrequente[] {
  return [...ps].sort((a, b) => a.ordem - b.ordem);
}

/**
 * R21.4: quem tem vínculo ativo vê as publicadas de TODAS as modalidades; sem
 * conta (ou com o vínculo pendente), só as abertas. A de menor sem a
 * autorização do responsável não aparece para ninguém fora da equipe.
 */
export function tecnicasVisiveis(tecnicas: readonly Tecnica[], quem: { equipe: boolean; vinculoAtivo: boolean }, menorAutorizado: (t: Tecnica) => boolean = () => false): Tecnica[] {
  return tecnicas
    .filter((t) => (quem.equipe ? t.estado !== 'arquivada' : t.estado === 'publicada'))
    .filter((t) => quem.equipe || quem.vinculoAtivo || t.aberta)
    .filter((t) => quem.equipe || !t.temMenor || menorAutorizado(t))
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

/** "4 min" ou "45 s". */
export function duracaoDaTecnica(segundos: number): string {
  return segundos >= 60 ? `${Math.round(segundos / 60)} min` : `${segundos} s`;
}

/** L30: o link aceito é `https://` (o app abre fora). */
export function linkDeVideoValido(link: string): boolean {
  return /^https:\/\/[^\s/]+\.[^\s]+$/i.test(link.trim());
}
