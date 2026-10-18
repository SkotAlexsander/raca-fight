/**
 * As cinco abas do aluno (Início · Horários · Treinos · Academia · Perfil)
 * com a FAIXA do cronômetro de rounds acima da barra quando ele roda ou está
 * pausado (R9.14). A faixa do "treino em andamento" saiu com a musculação.
 */
import { AbasDaVisao } from '@/componentes';
import { ABAS_DO_ALUNO } from '@/telas/rotas';
import { FaixaDoCronometroDoApp } from '../../compartilhado/cronometro/FaixaDoCronometroDoApp';

export function AbasDoAluno() {
  return <AbasDaVisao abas={ABAS_DO_ALUNO} todas={ABAS_DO_ALUNO} acimaDaBarra={<FaixaDoCronometroDoApp />} />;
}
