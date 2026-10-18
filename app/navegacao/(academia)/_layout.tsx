/**
 * O app da equipe (mapa de luta, Partes C, D e E): as abas seguem a ENTRADA
 * da pessoa nesta academia (`entradaDaEquipe`): professor (Hoje · Turmas ·
 * Alunos · Graduação · Perfil), recepção (Hoje · Alunos · Experimentais ·
 * Perfil) ou o dono que não dá aula, que vê "Abra o app Admin".
 * A rota de outra entrada não abre pelo endereço (volta ao Hoje).
 */
import { Redirect, useGlobalSearchParams, usePathname } from 'expo-router';
import { View } from 'react-native';
import { AbasDaVisao } from '@/componentes';
import { useSessao } from '@/dados';
import { entradaDaEquipe } from '@/dominio/papel';
import type { PapelNaAcademia } from '@/dominio/tipos';
import { useTema } from '@/tema';
import { ABAS_DA_EQUIPE, abasDaEquipePara, podeAbrirNaEquipe } from '@/telas/rotas';
import { FaixaDoCronometroDoApp } from '@/telas/compartilhado/cronometro/FaixaDoCronometroDoApp';
import { TelaAbraOAdmin } from '@/telas/equipe/TelaAbraOAdmin';

export default function LayoutDaEquipe() {
  const { carregando, destino, vinculos, vinculoAtivo } = useSessao();
  const { cores } = useTema();
  const caminho = usePathname();
  const { turma } = useGlobalSearchParams<{ turma?: string }>();
  if (carregando) return <View style={{ flex: 1, backgroundColor: cores.fundo }} />;
  if (destino.tipo !== 'visao' || destino.visao !== 'academia' || !vinculoAtivo) return <Redirect href="/" />;
  const papeis = new Set<PapelNaAcademia>(vinculos.filter((v) => v.estado === 'ativo' && v.academiaId === vinculoAtivo.academiaId && v.papel !== 'aluno').map((v) => v.papel));
  if (entradaDaEquipe(papeis) === 'admin') return <TelaAbraOAdmin />;
  if (!podeAbrirNaEquipe(papeis, caminho, { turma })) return <Redirect href="/hoje" />;
  return <AbasDaVisao abas={abasDaEquipePara(papeis)} todas={ABAS_DA_EQUIPE} acimaDaBarra={<FaixaDoCronometroDoApp />} />;
}
