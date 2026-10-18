/**
 * Hooks de leitura por caso de uso (React Query). A chave de cache SEMPRE leva
 * o `academiaId` da visão ativa (03-DECISOES-TECNICAS.md, seção 1): trocar de
 * visão invalida tudo.
 *
 * Luta (P12, agente AM2): saíram as leituras de treino (treinos, prontos,
 * exercícios, realizados, pedidos, envios); entraram as da academia de luta.
 * Sem vínculo ativo (aluno com o pedido pendente, R14.7, ou sem conta), a
 * academia é a do pedido ou a da VITRINE: o app mostra a grade, os
 * professores e a aula experimental, nunca dado de aluno.
 */
import { useQuery } from '@tanstack/react-query';
import type { DataISO, Id } from '../dominio/tipos';
import { useRepositorio, useSessao } from './ProvedorDeDados';

function useAcademiaAtiva(): Id | null {
  return useSessao().vinculoAtivo?.academiaId ?? null;
}

/** A academia que o aluno vê: a do vínculo ativo, a do pedido pendente (R12.9, R14.7) ou nenhuma (vitrine). */
export function useIdDaAcademia(): Id | null {
  const { vinculoAtivo, vinculos } = useSessao();
  return vinculoAtivo?.academiaId ?? vinculos.find((v) => v.estado === 'pendente')?.academiaId ?? null;
}

/** A academia de luta (grade, modalidades, réguas, janela). Sem academia: a da vitrine. */
export function useAcademiaDeLuta() {
  const repo = useRepositorio();
  const academiaId = useIdDaAcademia();
  return useQuery({ queryKey: ['academia-de-luta', academiaId], queryFn: () => (academiaId ? repo.academiaDeLuta(academiaId) : repo.academiaDaVitrine()), staleTime: Infinity });
}

/** O id da academia que as leituras de luta usam (o da vitrine, sem vínculo). */
function useAcademiaDaLeitura(): Id | null {
  return useAcademiaDeLuta().data?.academiaId ?? null;
}

export function useAjustesDeAula() {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['ajustes', academiaId], queryFn: () => repo.ajustesDeAula(academiaId!), enabled: !!academiaId });
}

export function useFichasDaAcademia() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['fichas', academiaId], queryFn: () => repo.fichasDaAcademia(academiaId!), enabled: !!academiaId });
}

/** As fichas de quem a conta cuida: a própria e as dos dependentes (R20). */
export function useFichasDoUsuario(usuarioId: Id | undefined) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['fichas-do-usuario', academiaId, usuarioId], queryFn: () => repo.fichasDoUsuario(usuarioId!), enabled: !!usuarioId });
}

export function useAlunosDaAcademia() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['alunos', academiaId], queryFn: () => repo.alunosDaAcademia(academiaId!), enabled: !!academiaId });
}

export function usePresencasDaAcademia() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['presencas', academiaId], queryFn: () => repo.presencasDaAcademia(academiaId!), enabled: !!academiaId });
}

/** As presenças de alguns alunos (o aluno e os dependentes dele). */
export function usePresencasDosAlunos(alunoIds: readonly Id[]) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['presencas', academiaId, 'de', [...alunoIds].sort().join(',')], queryFn: () => repo.presencasDosAlunos(alunoIds), enabled: alunoIds.length > 0 });
}

export function useGraduacoesDaAcademia() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['graduacoes', academiaId], queryFn: () => repo.graduacoesDaAcademia(academiaId!), enabled: !!academiaId });
}

export function useGraduacoesDosAlunos(alunoIds: readonly Id[]) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['graduacoes', academiaId, 'de', [...alunoIds].sort().join(',')], queryFn: () => repo.graduacoesDosAlunos(alunoIds), enabled: alunoIds.length > 0 });
}

export function useExames() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['exames', academiaId], queryFn: () => repo.exames(academiaId!), enabled: !!academiaId });
}

export function useEventos() {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['eventos', academiaId], queryFn: () => repo.eventos(academiaId!), enabled: !!academiaId });
}

export function useLutas() {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['lutas', academiaId], queryFn: () => repo.lutas(academiaId!), enabled: !!academiaId });
}

export function useParticipantes(eventoId: Id | undefined) {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['participantes', academiaId, eventoId], queryFn: () => repo.participantes(eventoId!), enabled: !!eventoId });
}

export function useConsentimentosDeAtleta() {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['consentimentos', academiaId], queryFn: () => repo.consentimentosDeAtleta(academiaId!), enabled: !!academiaId });
}

export function useTecnicas() {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['tecnicas', academiaId], queryFn: () => repo.tecnicas(academiaId!), enabled: !!academiaId });
}

export function usePerguntasFrequentes() {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['perguntas', academiaId], queryFn: () => repo.perguntasFrequentes(academiaId!), enabled: !!academiaId });
}

export function useDependentes(responsavelId: Id | undefined) {
  const repo = useRepositorio();
  return useQuery({ queryKey: ['dependentes', responsavelId], queryFn: () => repo.dependentes(responsavelId!), enabled: !!responsavelId });
}

export function useInteressados() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['interessados', academiaId], queryFn: () => repo.interessados(academiaId!), enabled: !!academiaId });
}

export function useExperimentais() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['experimentais', academiaId], queryFn: () => repo.experimentais(academiaId!), enabled: !!academiaId });
}

export function useIndicacoesDoAluno(alunoId: Id | undefined) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['indicacoes', academiaId, alunoId], queryFn: () => repo.indicacoesDoAluno(alunoId!), enabled: !!alunoId });
}

export function usePerfilDoAluno(alunoId: Id | undefined) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['perfil-do-aluno', academiaId, alunoId], queryFn: () => repo.perfilDoAluno(alunoId!), enabled: !!alunoId });
}

export function useMedicoesDoAluno(alunoId: Id | undefined) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['medicoes', academiaId, alunoId], queryFn: () => repo.medicoesDoAluno(alunoId!), enabled: !!alunoId });
}

export function useAssinaturaPlus(alunoId: Id | undefined) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['plus', academiaId, alunoId], queryFn: () => repo.assinaturaPlus(alunoId!), enabled: !!alunoId });
}

export function usePlanoDeDieta(alunoId: Id | undefined, data: DataISO) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['dieta', academiaId, alunoId, data], queryFn: () => repo.planoDeDieta(alunoId!, data), enabled: !!alunoId });
}

export function useRefeicoesRegistradas(alunoId: Id | undefined, data: DataISO) {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['refeicoes', academiaId, alunoId, data], queryFn: () => repo.refeicoesRegistradas(alunoId!, data), enabled: !!alunoId });
}

export function useAvisoDaAcademia() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['aviso', academiaId], queryFn: () => repo.avisoDaAcademia(academiaId!), enabled: !!academiaId });
}

/** Todos os avisos da academia ativa, com o histórico e os das turmas. */
export function useAvisosDaAcademia() {
  const repo = useRepositorio();
  const academiaId = useAcademiaAtiva();
  return useQuery({ queryKey: ['avisos', academiaId], queryFn: () => repo.avisosDaAcademia(academiaId!), enabled: !!academiaId });
}

/** A equipe (os professores da aba Academia e da vitrine). */
export function useEquipe() {
  const repo = useRepositorio();
  const academiaId = useAcademiaDaLeitura();
  return useQuery({ queryKey: ['equipe', academiaId], queryFn: () => repo.equipe(academiaId!), enabled: !!academiaId });
}

export function usePreferenciasDeAviso(usuarioId: Id | undefined) {
  const repo = useRepositorio();
  return useQuery({ queryKey: ['preferencias-de-aviso', usuarioId], queryFn: () => repo.preferenciasDeAviso(usuarioId!), enabled: !!usuarioId });
}

export function usePreferenciasDaEquipe(vinculoId: Id | undefined) {
  const repo = useRepositorio();
  return useQuery({ queryKey: ['preferencias-da-equipe', vinculoId], queryFn: () => repo.preferenciasDaEquipe(vinculoId!), enabled: !!vinculoId });
}
