/**
 * Quem da equipe o aluno pode ver (R11.4, R11.5): só com vínculo ATIVO, e só
 * os perfis visíveis. O nome de quem montou o treino aparece sempre; vira
 * link só quando o perfil está visível (R11.12).
 */
import { useEquipe, useSessao, type MembroDaEquipe } from '@/dados';
import { equipeParaMostrar, podeVerPerfil } from '@/dominio/perfil-profissional';
import type { Id } from '@/dominio/tipos';

export interface EquipeDoAluno {
  carregando: boolean;
  erro: boolean;
  tentarDeNovo: () => void;
  /** Os perfis que o aluno vê, em ordem alfabética (R11.9). */
  visiveis: MembroDaEquipe[];
  /** O nome curto de quem montou (perfil de exibição ou o primeiro nome da conta). */
  nomeDe: (usuarioId: Id) => string | undefined;
  /** O id do perfil para o link "Montado por", se o aluno pode abrir. */
  perfilVisivelDe: (usuarioId: Id) => Id | undefined;
}

export function useEquipeDoAluno(): EquipeDoAluno {
  const { usuario, vinculos, vinculoAtivo } = useSessao();
  const consulta = useEquipe();
  const membros = consulta.data ?? [];
  const ativo = vinculoAtivo?.estado === 'ativo';
  const quem = { usuarioId: usuario?.id ?? '', vinculos };
  const podeVer = (m: MembroDaEquipe) => ativo && !!m.perfil && podeVerPerfil(m.perfil, quem, m.vinculo);
  const perfis = equipeParaMostrar(membros.filter(podeVer).map((m) => m.perfil!));
  const visiveis = perfis.map((p) => membros.find((m) => m.perfil?.id === p.id)!).filter(Boolean);
  return {
    carregando: consulta.isLoading,
    erro: consulta.isError,
    tentarDeNovo: () => void consulta.refetch(),
    visiveis,
    nomeDe: (id) => {
      const m = membros.find((x) => x.usuario.id === id);
      return m?.perfil?.nomeExibicao ?? m?.usuario.nome.split(' ')[0];
    },
    perfilVisivelDe: (id) => visiveis.find((m) => m.usuario.id === id)?.perfil?.id,
  };
}
