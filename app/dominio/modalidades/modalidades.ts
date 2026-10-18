/**
 * Modalidade (R14.1): lista DA ACADEMIA, não do app. A chave (R14.1a) não
 * aparece na tela; serve aos modelos prontos de graduação e às fotos.
 * "Kids" não é modalidade: é o público de uma turma (R14.2).
 *
 * Os ids da Raça Fight são os mesmos do domínio financeiro do AM1
 * (`financeiro/exemplo.ts`): `muay-thai`, `boxe`, `jiu-jitsu`, `luta-livre`, `mma`.
 */
import type { Id } from '../tipos.ts';

export type ChaveDaModalidade = 'muay_thai' | 'boxe' | 'jiu_jitsu' | 'luta_livre' | 'mma' | 'judo' | 'karate' | 'kickboxing' | 'wrestling' | 'outra';

export const CHAVES_DAS_MODALIDADES: readonly ChaveDaModalidade[] = ['muay_thai', 'boxe', 'jiu_jitsu', 'luta_livre', 'mma', 'judo', 'karate', 'kickboxing', 'wrestling', 'outra'];

/** Compatível com a `Modalidade` do financeiro (id, academiaId, nome, ativa), mais a chave. */
export interface Modalidade {
  id: Id;
  academiaId: Id;
  chave: ChaveDaModalidade;
  nome: string;
  ativa: boolean;
}

/** As cinco da Raça Fight (`01-DADOS-REAIS.md`), na ordem do cartaz. */
export function modalidadesDaRacaFight(academiaId: Id): Modalidade[] {
  const m = (id: Id, chave: ChaveDaModalidade, nome: string): Modalidade => ({ id, academiaId, chave, nome, ativa: true });
  return [m('muay-thai', 'muay_thai', 'Muay Thai'), m('boxe', 'boxe', 'Boxe'), m('jiu-jitsu', 'jiu_jitsu', 'Jiu-Jitsu'), m('luta-livre', 'luta_livre', 'Luta Livre'), m('mma', 'mma', 'MMA')];
}

/** "Jiu-Jitsu / Luta Livre" (a turma de duas modalidades, R14.3). Ids sem cadastro somem. */
export function nomeDasModalidades(ids: readonly Id[], modalidades: readonly Modalidade[]): string {
  return ids
    .map((id) => modalidades.find((m) => m.id === id)?.nome)
    .filter((n): n is string => !!n)
    .join(' / ');
}

/** Só as ativas, na ordem do cadastro. */
export function modalidadesAtivas(modalidades: readonly Modalidade[]): Modalidade[] {
  return modalidades.filter((m) => m.ativa);
}
