/**
 * Que foto cada coisa de luta usa (as fotos da Raça Fight, agente AL,
 * `02-design/imagens/raca-fight/00-INDICE.md`). Regra: a foto mostra o que o
 * texto diz; turma Kids usa o CORDÃO, nunca foto de criança.
 */
import type { ImageSourcePropType } from 'react-native';
import { IMAGENS, type NomeDaImagem } from '@/imagens/indice';
import type { Turma } from '@/dominio/turmas/turmas';
import type { Id } from '@/dominio/tipos';

export type FormatoDaFoto = 'cartao' | 'mini';

const img = (nome: string): ImageSourcePropType | undefined => IMAGENS[nome as NomeDaImagem];

const PELA_MODALIDADE: Record<string, string> = {
  'muay-thai': 'modalidade-muay-thai',
  boxe: 'modalidade-boxe',
  'jiu-jitsu': 'modalidade-jiu-jitsu',
  'luta-livre': 'modalidade-jiu-jitsu',
  mma: 'modalidade-mma',
};

export function fotoDaModalidade(modalidadeId: Id, formato: FormatoDaFoto = 'cartao'): ImageSourcePropType | undefined {
  const base = PELA_MODALIDADE[modalidadeId];
  return base ? img(`raca-fight/${base}-${formato}`) : undefined;
}

/** A foto da turma: Kids → o cordão; OPEN e competição → a aula no tatame; o resto → a modalidade. */
export function fotoDaTurma(turma: Pick<Turma, 'publico' | 'modalidadeIds'> | undefined, formato: FormatoDaFoto = 'cartao'): ImageSourcePropType | undefined {
  if (!turma) return img('raca-fight/inicio-capa-cartao');
  if (turma.publico === 'kids') return img(`raca-fight/modalidade-kids-${formato}`);
  if (turma.publico === 'aberta' || turma.publico === 'competicao') return formato === 'mini' ? img('raca-fight/modalidade-mma-mini') : img('raca-fight/aula-capa-cartao');
  return fotoDaModalidade(turma.modalidadeIds[0] ?? '', formato) ?? img('raca-fight/inicio-capa-cartao');
}

export const FOTO_DO_INICIO = img('raca-fight/inicio-capa-capa');
export const FOTO_DA_AULA = img('raca-fight/aula-capa-capa');
export const FOTO_DO_SALAO = img('raca-fight/admin-fundo-cartao');
export const FOTO_DA_GRADUACAO = img('raca-fight/graduacao-cordao-capa');
export const FOTO_DO_EVENTO = img('raca-fight/evento-noite-de-luta-cartao');
export const FOTO_DO_EVENTO_ATLETA = img('raca-fight/evento-entrada-do-atleta-cartao');

/** O fundo do cronômetro de rounds (o saco de pancada), desfocado. */
export const FOTO_DO_CRONOMETRO = img('raca-fight/cronometro-fundo-tela-desfocado');

/** A foto da entrada (o capacete vermelho sobre o kimono, sem rosto), por tema. */
export function fotoDaEntrada(esquema: 'claro' | 'escuro', desfocada = false): ImageSourcePropType | undefined {
  return img(`raca-fight/entrada-fundo-tela-${esquema}${desfocada ? '-desfocado' : ''}`);
}
