/**
 * As leituras de luta que as telas dos dois apps (aluno e equipe) juntam:
 * a academia (grade, réguas, janela), as aulas do dia, as presenças em dia
 * (com a confirmação sozinha das 23:59 já aplicada, R15.5) e as graduações.
 *
 * As regras são do domínio; aqui só se junta o que a tela precisa e se põe
 * o relógio (`useAgora`), que anda de 30 em 30 s para a janela do check-in
 * abrir e fechar sem a pessoa tocar.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  useAcademiaDeLuta,
  useAjustesDeAula,
  useDependentes,
  useEquipe,
  useFichasDaAcademia,
  useFichasDoUsuario,
  useGraduacoesDaAcademia,
  useGraduacoesDosAlunos,
  usePresencasDaAcademia,
  usePresencasDosAlunos,
  useSessao,
  type AcademiaDeLuta,
  type FichaDeLuta,
  type MembroDaEquipe,
} from '@/dados';
import type { Id, PapelNaAcademia } from '@/dominio/tipos';
import { entradaDaEquipe } from '@/dominio/papel';
import { dataNoFuso } from '@/dominio/turmas/horario';
import { aulasDoDia, type Aula, type Turma } from '@/dominio/turmas/turmas';
import { presencasEmDia, type Presenca } from '@/dominio/presenca/presenca';
import { graduacaoAtual, descreverGraduacao, type Graduacao } from '@/dominio/graduacao/graduacao';
import type { SistemaDeGraduacao } from '@/dominio/graduacao/sistemas';
import { nomeDasModalidades } from '@/dominio/modalidades/modalidades';

/** O "agora" em ms, que anda a cada `passoMs` (30 s: a janela do check-in muda de minuto em minuto). */
export function useAgora(passoMs = 30_000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), passoMs);
    return () => clearInterval(t);
  }, [passoMs]);
  return agora;
}

/** O que toda tela de luta usa da academia, com o "hoje" no fuso dela. */
export function useAcademia() {
  const consulta = useAcademiaDeLuta();
  const ajustes = useAjustesDeAula();
  const agora = useAgora();
  const luta = consulta.data ?? null;
  const hoje = luta ? dataNoFuso(agora, luta.fuso) : null;
  return {
    luta,
    ajustes: ajustes.data ?? [],
    agora,
    hoje,
    carregando: consulta.isLoading || ajustes.isLoading,
    erro: consulta.isError || ajustes.isError,
    tentarDeNovo: () => {
      void consulta.refetch();
      void ajustes.refetch();
    },
  };
}

export function turmaDe(luta: AcademiaDeLuta | null, turmaId: Id): Turma | undefined {
  return luta?.turmas.find((t) => t.id === turmaId);
}

/** "Muay Thai", "Jiu-Jitsu / Luta Livre". */
export function modalidadesDaTurma(luta: AcademiaDeLuta | null, turma: Turma | undefined): string {
  if (!luta || !turma) return '';
  if (turma.publico === 'aberta' || turma.publico === 'competicao') return 'Todas as modalidades';
  return nomeDasModalidades(turma.modalidadeIds, luta.modalidades);
}

export function nomeDaModalidade(luta: AcademiaDeLuta | null, modalidadeId: Id): string {
  return luta?.modalidades.find((m) => m.id === modalidadeId)?.nome ?? modalidadeId;
}

/** O sistema (régua) de uma modalidade para o público (adulto ou kids). Boxe e MMA: nenhum. */
export function sistemaDa(luta: AcademiaDeLuta | null, modalidadeId: Id, publico: 'adulto' | 'kids'): SistemaDeGraduacao | null {
  if (!luta) return null;
  return luta.sistemas.find((s) => s.modalidadeId === modalidadeId && s.publico === publico) ?? null;
}

/** O sistema da graduação registrada (pelo id), ou o da modalidade. */
export function sistemaDaGraduacao(luta: AcademiaDeLuta | null, g: Graduacao | null, modalidadeId: Id, publico: 'adulto' | 'kids'): SistemaDeGraduacao | null {
  if (!luta) return null;
  return (g && luta.sistemas.find((s) => s.id === g.sistemaId)) || sistemaDa(luta, modalidadeId, publico);
}

/** "Faixa branca, 2º grau" ou "Sem graduação" (a régua existe e ninguém registrou) ou null (modalidade sem régua). */
export function textoDaFaixa(luta: AcademiaDeLuta | null, graduacoes: readonly Graduacao[], alunoId: Id, modalidadeId: Id, publico: 'adulto' | 'kids'): { texto: string; cores: string[]; graus: number; aConfigurar: boolean } | null {
  const g = graduacaoAtual(graduacoes, alunoId, modalidadeId);
  const sistema = sistemaDaGraduacao(luta, g, modalidadeId, publico);
  if (!sistema) return null;
  if (!g) return { texto: 'Sem graduação', cores: [], graus: 0, aConfigurar: sistema.aConfigurar };
  const nivel = sistema.niveis.find((n) => n.id === g.nivelId);
  return { texto: descreverGraduacao(sistema, g.nivelId, g.grau), cores: nivel?.cores ?? [], graus: g.grau, aConfigurar: sistema.aConfigurar };
}

/** O nome que aparece de um professor (perfil de exibição ou o da conta). */
export function nomeDoProfessor(equipe: readonly MembroDaEquipe[] | undefined, id: Id | null | undefined): string | null {
  if (!id) return null;
  const m = equipe?.find((x) => x.usuario.id === id);
  return m ? (m.perfil?.nomeExibicao ?? m.usuario.nome) : null;
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

// ---------------------------------------------------------------------------
// O aluno (e o responsável, com os dependentes)
// ---------------------------------------------------------------------------

/**
 * O aluno com quem ele cuida: a ficha dele (se treina) e as dos dependentes
 * (R20), as presenças e as graduações de todos, em dia.
 */
export function useLutaDoAluno() {
  const { usuario, vinculoAtivo } = useSessao();
  const base = useAcademia();
  const fichas = useFichasDoUsuario(usuario?.id);
  const dependentes = useDependentes(usuario?.id);
  const ids = useMemo(() => (fichas.data ?? []).map((f) => f.alunoId), [fichas.data]);
  const presencas = usePresencasDosAlunos(ids);
  const graduacoes = useGraduacoesDosAlunos(ids);
  const equipe = useEquipe();
  const emDia = useMemo(() => (base.luta ? presencasEmDia(presencas.data ?? [], base.agora, base.luta.fuso) : []), [presencas.data, base.agora, base.luta]);
  const doUsuario = (fichas.data ?? []).filter((f) => f.alunoId === usuario?.id);
  return {
    ...base,
    usuario,
    vinculoAtivo: vinculoAtivo?.estado === 'ativo' ? vinculoAtivo : null,
    fichas: fichas.data ?? [],
    /** A ficha do próprio usuário (ele treina), se houver. */
    minhaFicha: (doUsuario[0] ?? null) as FichaDeLuta | null,
    dependentes: dependentes.data ?? [],
    presencas: emDia,
    graduacoes: graduacoes.data ?? [],
    equipe: equipe.data ?? [],
    carregando: base.carregando || fichas.isLoading || presencas.isLoading,
    erro: base.erro || fichas.isError || presencas.isError,
    tentarDeNovo: () => {
      base.tentarDeNovo();
      void fichas.refetch();
      void presencas.refetch();
    },
  };
}

// ---------------------------------------------------------------------------
// A equipe (professor e recepção)
// ---------------------------------------------------------------------------

/** Quem está no app da equipe, com os papéis NESTA academia e a entrada (professor, recepção ou "Abra o Admin"). */
export function useQuemEstaNaEquipe() {
  const { usuario, vinculoAtivo, vinculos } = useSessao();
  const papeis = useMemo(
    () => new Set<PapelNaAcademia>(vinculos.filter((v) => v.estado === 'ativo' && v.academiaId === vinculoAtivo?.academiaId && v.papel !== 'aluno').map((v) => v.papel)),
    [vinculos, vinculoAtivo],
  );
  const entrada = entradaDaEquipe(papeis);
  return {
    usuario,
    vinculo: vinculoAtivo,
    academiaId: vinculoAtivo?.academiaId ?? null,
    papeis,
    entrada,
    ehProfessor: entrada === 'professor',
    ehRecepcao: papeis.has('recepcao'),
    ehDono: papeis.has('dono'),
    /** Escreve o aviso para todos e cuida dos vínculos: dono e recepção (R10.10). */
    cuidaDosVinculos: papeis.has('dono') || papeis.has('recepcao'),
  };
}

export function useLutaDaEquipe() {
  const quem = useQuemEstaNaEquipe();
  const base = useAcademia();
  const fichas = useFichasDaAcademia();
  const presencas = usePresencasDaAcademia();
  const graduacoes = useGraduacoesDaAcademia();
  const equipe = useEquipe();
  const emDia = useMemo(() => (base.luta ? presencasEmDia(presencas.data ?? [], base.agora, base.luta.fuso) : []), [presencas.data, base.agora, base.luta]);
  /** As turmas do professor (responsável ou auxiliar); a recepção vê todas. */
  const minhasTurmas = useMemo(() => {
    const ts = base.luta?.turmas.filter((t) => t.ativa) ?? [];
    if (!quem.ehProfessor || quem.ehRecepcao) return ts;
    return ts.filter((t) => t.professorId === quem.usuario?.id || t.auxiliarIds.includes(quem.usuario?.id ?? ''));
  }, [base.luta, quem.ehProfessor, quem.ehRecepcao, quem.usuario]);
  const aulasDeHoje = useMemo(() => (base.luta && base.hoje ? aulasDoDia(base.luta.turmas, base.hoje, base.luta.fuso, base.ajustes) : []), [base.luta, base.hoje, base.ajustes]);
  /** As aulas de hoje que a pessoa dá (o professor: as dele e as que substitui; a recepção: todas). */
  const minhasAulasDeHoje = useMemo(
    () => (quem.ehProfessor && !quem.ehRecepcao ? aulasDeHoje.filter((a) => a.professorId === quem.usuario?.id || minhasTurmas.some((t) => t.id === a.turmaId && t.auxiliarIds.includes(quem.usuario?.id ?? ''))) : aulasDeHoje),
    [aulasDeHoje, minhasTurmas, quem.ehProfessor, quem.ehRecepcao, quem.usuario],
  );
  return {
    ...quem,
    ...base,
    fichas: fichas.data ?? [],
    presencas: emDia,
    graduacoes: graduacoes.data ?? [],
    equipe: equipe.data ?? [],
    minhasTurmas,
    aulasDeHoje,
    minhasAulasDeHoje,
    carregando: base.carregando || fichas.isLoading || presencas.isLoading || graduacoes.isLoading,
    erro: base.erro || fichas.isError || presencas.isError,
    tentarDeNovo: () => {
      base.tentarDeNovo();
      void fichas.refetch();
      void presencas.refetch();
      void graduacoes.refetch();
    },
  };
}

/** Os alunos de uma turma (pela ficha). */
export function alunosDaTurma(fichas: readonly FichaDeLuta[], turmaId: Id): FichaDeLuta[] {
  return fichas.filter((f) => f.turmaIds.includes(turmaId));
}

/** O público de uma ficha para escolher a régua: o dependente usa a kids. */
export const publicoDaFicha = (f: Pick<FichaDeLuta, 'dependenteDe'>): 'adulto' | 'kids' => (f.dependenteDe ? 'kids' : 'adulto');

export type { Aula, Presenca, Graduacao };
