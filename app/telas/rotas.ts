/**
 * Nomes das rotas e das abas de cada app (mapa de telas de luta,
 * `01-especificacao/luta/06-MAPA-DE-TELAS.md`; o desenho do AL, `luta.html`).
 *
 * As abas dos dois grupos têm NOMES DE ROTA diferentes: o Expo Router não
 * aceita dois arquivos no mesmo caminho em grupos diferentes. O rótulo na tela
 * é o do mapa ("Perfil" nos dois).
 *
 * - Aluno: Início · Horários · Treinos · Academia · Perfil ([decidir] L32: os
 *   nomes dos destaques do Instagram, como desenhados).
 * - Professor: Hoje · Turmas · Alunos · Graduação · Perfil.
 * - Recepção: Hoje · Alunos · Experimentais · Perfil.
 * - Dono: o app Admin; se dá aula, as abas do professor.
 */
import type { AbaDaVisao } from '@/componentes';
import { folha, raio } from '@/tema';
import type { PapelNaAcademia, Visao } from '@/dominio/tipos';
import { entradaDaEquipe, type EntradaDaEquipe } from '@/dominio/papel';

export const ROTA_INICIAL_DA_VISAO: Record<Visao, '/inicio' | '/hoje'> = {
  aluno: '/inicio',
  academia: '/hoje',
};

export type { AbaDaVisao };

export const ABAS_DO_ALUNO: AbaDaVisao[] = [
  { rota: 'inicio', rotulo: 'Início', icone: 'inicio' },
  { rota: 'horarios', rotulo: 'Horários', icone: 'horarios' },
  { rota: 'treinos', rotulo: 'Treinos', icone: 'faixa' },
  { rota: 'academia', rotulo: 'Academia', icone: 'academia' },
  { rota: 'perfil', rotulo: 'Perfil', icone: 'perfil' },
];

/** Todas as abas do app da equipe; cada entrada (professor, recepção) vê as suas. */
export const ABAS_DA_EQUIPE: (AbaDaVisao & { para: EntradaDaEquipe[] })[] = [
  { rota: 'hoje', rotulo: 'Hoje', icone: 'hoje', para: ['professor', 'recepcao'] },
  { rota: 'turmas', rotulo: 'Turmas', icone: 'tatame', para: ['professor'] },
  { rota: 'alunos', rotulo: 'Alunos', icone: 'alunos', para: ['professor', 'recepcao'] },
  { rota: 'graduacao', rotulo: 'Graduação', icone: 'faixa', para: ['professor'] },
  { rota: 'experimentais', rotulo: 'Experimentais', icone: 'convite', para: ['recepcao'] },
  { rota: 'perfil-da-equipe', rotulo: 'Perfil', icone: 'perfil', para: ['professor', 'recepcao'] },
];

export function abasDaEquipePara(papeis: ReadonlySet<PapelNaAcademia>): AbaDaVisao[] {
  const entrada = entradaDaEquipe(papeis);
  return ABAS_DA_EQUIPE.filter((a) => a.para.includes(entrada));
}

/**
 * As rotas que só alguns papéis abrem, pelo começo do caminho. Esconder a
 * aba (`href: null`) não basta: a rota abre pelo endereço (agente AB). O
 * layout da equipe confere isto e manda para `/hoje`.
 */
export function podeAbrirNaEquipe(papeis: ReadonlySet<PapelNaAcademia>, caminho: string, parametros: { turma?: string | string[] } = {}): boolean {
  const entrada = entradaDaEquipe(papeis);
  const aba = ABAS_DA_EQUIPE.find((a) => caminho === `/${a.rota}` || caminho.startsWith(`/${a.rota}/`));
  if (aba && !aba.para.includes(entrada)) return false;
  // o aviso para TODOS: dono e recepção (R10.10); o professor escreve o da turma (R22.1, L31)
  const daTurma = typeof parametros.turma === 'string' && parametros.turma !== '';
  if (caminho === '/alunos/novo-aviso' && daTurma && entrada === 'professor') return true;
  if (caminho === '/alunos/avisos' || caminho === '/alunos/novo-aviso') return papeis.has('dono') || papeis.has('recepcao');
  // registrar graduação é do professor da modalidade e do dono (R16.6), nunca da recepção
  if (/^\/alunos\/[^/]+\/graduar/.test(caminho)) return entrada === 'professor';
  return true;
}

/** A primeira aba de cada entrada (R13.7 adaptado): o Hoje. */
export function rotaInicialDaEquipe(): '/hoje' {
  return '/hoje';
}

/**
 * Folha de LISTA nativa no iPhone (componente 14, "No iPhone"): numa rota da
 * pilha, `<Stack.Screen options={OPCOES_DA_FOLHA_NATIVA} />`.
 */
export const OPCOES_DA_FOLHA_NATIVA = {
  presentation: 'formSheet',
  sheetAllowedDetents: [folha.media, folha.grande],
  sheetGrabberVisible: true,
  sheetCornerRadius: raio.folha,
} as const;
