/**
 * Papel e visão (03-arquitetura/03-DECISOES-TECNICAS.md, seção 1): a visão
 * vem do VÍNCULO, nunca de uma escolha "sou academia / sou aluno". Um aluno
 * que vira funcionário troca de visão sem trocar de conta.
 *
 * Para onde o app vai ao abrir:
 * 1. Sem sessão → entrada.
 * 2. Zero vínculos ativos → aluno sem academia (R8.4): treino livre, nada trava.
 *    Vínculo pendente (de aluno ou de equipe) ainda não abre nada.
 * 3. Um vínculo ativo → a visão do papel (aluno → aluno; qualquer outro → academia).
 * 4. Mais de um → o último escolhido, se ainda vale; senão, "Entrar como…".
 *
 * Puro, sem relógio. Testado em `papel.test.ts`. Veio de `dados/visao.ts`
 * (agente X) para o domínio (agente AA, P11).
 */
import type { Id, PapelNaAcademia, Vinculo, Visao } from './tipos.ts';

export function visaoDoPapel(papel: PapelNaAcademia): Visao {
  return papel === 'aluno' ? 'aluno' : 'academia';
}

export type Destino =
  | { tipo: 'entrada' }
  | { tipo: 'visao'; visao: Visao; vinculoId: Id | null }
  | { tipo: 'escolher' };

export function decidirDestino(sessao: { usuarioId: Id } | null, vinculos: readonly Vinculo[], ultimoVinculoId: Id | null): Destino {
  if (!sessao) return { tipo: 'entrada' };
  const ativos = vinculos.filter((v) => v.usuarioId === sessao.usuarioId && v.estado === 'ativo');
  if (ativos.length === 0) return { tipo: 'visao', visao: 'aluno', vinculoId: null };
  if (ativos.length === 1) return { tipo: 'visao', visao: visaoDoPapel(ativos[0].papel), vinculoId: ativos[0].id };
  const ultimo = ativos.find((v) => v.id === ultimoVinculoId);
  if (ultimo) return { tipo: 'visao', visao: visaoDoPapel(ultimo.papel), vinculoId: ultimo.id };
  return { tipo: 'escolher' };
}

// ---------------------------------------------------------------------------
// A equipe da academia de luta (P12, agente AM2): quem abre o quê
// ---------------------------------------------------------------------------

/**
 * O app da EQUIPE serve ao professor e à recepção (mapa de telas de luta,
 * Parte C e D). O dono usa o app Admin, que é outro app: ao entrar aqui, vê
 * "Abra o app Admin" — a não ser que também dê aula (vínculo de professor,
 * `instrutor` no dado), e aí entra como professor.
 *
 * Com o Plus desligado (L12), o `personal` entra como professor.
 */
export type EntradaDaEquipe = 'professor' | 'recepcao' | 'admin';

export function entradaDaEquipe(papeis: ReadonlySet<PapelNaAcademia>): EntradaDaEquipe {
  if (papeis.has('instrutor') || papeis.has('personal')) return 'professor';
  if (papeis.has('recepcao')) return 'recepcao';
  return 'admin';
}
