/**
 * O estado da visão do aluno que passa de uma tela para outra (P12, agente
 * AM2: o treino de musculação, a sessão do Modo treino e o pedido de treino
 * SAÍRAM; o cronômetro de rounds é do app inteiro, `ProvedorDoCronometro`).
 *
 * Fica aqui o que é do aluno e muda nesta abertura, por cima do repositório
 * (a tela não espera o cache): o aviso dispensado (só do aparelho), o
 * cadastro opcional e a autorização (dado de saúde), o peso, as preferências
 * de aviso e a marca de refeição (a dieta está desligada na v1, L13).
 * Tudo gravado pelo repositório, com o aviso de erro e "Tentar de novo".
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useGravarComAviso } from '@/componentes';
import { useFila, useGravar, usePerfilDoAluno, usePreferenciasDeAviso, useRepositorio, useSessao } from '@/dados';
import { PREFERENCIAS_PADRAO, type PreferenciasDeAviso } from '@/dominio/avisos';
import { AMBIENTE_PADRAO } from '@/dominio/ambiente';
import type { DataISO, EstadoDaRefeicaoRegistrada, Id, MedicaoCorporal, PerfilDoAluno, RefeicaoRegistrada } from '@/dominio/tipos';
import { dataLocal } from '@/componentes/formatos';

/** As chaves da tela Avisos do aluno (R22.5). */
export type ChaveDoAvisoDoAluno = 'cronometro' | 'lembreteAula' | 'turmas' | 'graduacao' | 'academia';

interface Locais {
  avisoDispensado: Id | null;
  dispensarAviso: (id: Id) => void;
  refeicoes: RefeicaoRegistrada[];
  marcarRefeicao: (dados: { planoId: Id; refeicaoId: Id; data: DataISO; estado: EstadoDaRefeicaoRegistrada | null; motivo?: string }) => void;
  medicoesNovas: MedicaoCorporal[];
  registrarPeso: (gramas: number) => void;
  perfil: Partial<PerfilDoAluno>;
  atualizarPerfil: (m: Partial<PerfilDoAluno>) => void;
  /** As preferências de aviso de luta, completas (o que falta vem do padrão). */
  preferencias: PreferenciasDeAviso;
  avisos: Record<ChaveDoAvisoDoAluno, boolean>;
  definirAviso: (chave: ChaveDoAvisoDoAluno, ligado: boolean) => void;
  lembreteDeAula: NonNullable<PreferenciasDeAviso['lembreteDeAula']>;
  definirLembreteDeAula: (m: Partial<NonNullable<PreferenciasDeAviso['lembreteDeAula']>>) => void;
}

const CtxLocais = createContext<Locais | null>(null);

export const useDadosLocais = (): Locais => {
  const v = useContext(CtxLocais);
  if (!v) throw new Error('useDadosLocais() fora do <ProvedorDoAluno>');
  return v;
};

export function ProvedorDoAluno({ children }: { children: ReactNode }) {
  const { usuario, vinculoAtivo } = useSessao();
  const alunoId = usuario?.id;
  const fila = useFila();
  const repo = useRepositorio();
  const gravar = useGravar();
  // gravação de fundo com aviso de erro e "Tentar de novo" (agente AG): nenhuma é descartada
  const { gravar: comAviso } = useGravarComAviso((passo: () => unknown) => passo(), { umPorVez: false });

  const chaveDoAviso = alunoId ? `aviso-dispensado.${alunoId}` : null;
  const [avisoDispensado, setAvisoDispensado] = useState<Id | null>(() => (chaveDoAviso ? repo.lerDoAparelho(chaveDoAviso) : null));
  const consultaPerfil = usePerfilDoAluno(alunoId);
  const consultaPreferencias = usePreferenciasDeAviso(alunoId);
  const [perfil, setPerfil] = useState<Partial<PerfilDoAluno>>({});
  const [prefsMudadas, setPrefsMudadas] = useState<PreferenciasDeAviso | null>(null);

  const valor = useMemo<Locais>(() => {
    const base = (prefsMudadas ?? consultaPreferencias.data ?? PREFERENCIAS_PADRAO) as PreferenciasDeAviso;
    const prefs: PreferenciasDeAviso = { ...PREFERENCIAS_PADRAO, ...base, lembreteDeAula: { ...PREFERENCIAS_PADRAO.lembreteDeAula!, ...(base.lembreteDeAula ?? {}) } };
    const salvarPreferencias = (nova: PreferenciasDeAviso) => {
      if (!alunoId) return;
      setPrefsMudadas(nova);
      void comAviso(() => gravar.salvarPreferenciasDeAviso(alunoId, nova));
    };
    return {
      avisoDispensado,
      dispensarAviso: (id) => {
        if (chaveDoAviso) repo.gravarNoAparelho(chaveDoAviso, id);
        setAvisoDispensado(id);
      },
      refeicoes: [],
      marcarRefeicao: ({ planoId, refeicaoId, data, estado, motivo }) => {
        if (!alunoId || !vinculoAtivo) return;
        if (estado === null) {
          void comAviso(() => fila.desfazerRefeicao(refeicaoId, data));
          return;
        }
        const agora = AMBIENTE_PADRAO.agora();
        const marca: RefeicaoRegistrada = { id: AMBIENTE_PADRAO.gerarId(), alunoId, academiaId: vinculoAtivo.academiaId, planoId, refeicaoId, data, estado, ...(estado === 'feita' ? { feitaEm: agora } : {}), ...(motivo ? { motivo } : {}), registradaEm: agora };
        void comAviso(() => fila.registrarRefeicao(marca));
      },
      medicoesNovas: [],
      registrarPeso: (gramas) => {
        if (!alunoId) return;
        const medicao: MedicaoCorporal = { id: AMBIENTE_PADRAO.gerarId(), alunoId, academiaId: vinculoAtivo?.academiaId ?? null, data: dataLocal(), pesoGramas: gramas, registradoPorId: alunoId };
        void comAviso(() => gravar.registrarMedicao(medicao));
      },
      perfil,
      atualizarPerfil: (m) => {
        if (!alunoId) return;
        setPerfil((p) => ({ ...p, ...m }));
        const agora = AMBIENTE_PADRAO.agora();
        const anterior: PerfilDoAluno = consultaPerfil.data ?? { usuarioId: alunoId, academiaId: vinculoAtivo?.academiaId ?? null, autorizaAcademia: false, atualizadoEm: agora };
        const novo: PerfilDoAluno = { ...anterior, ...perfil, ...m, ...(m.autorizaAcademia !== undefined ? { autorizacaoEm: agora } : {}) };
        void comAviso(() => gravar.salvarPerfilDoAluno(novo));
      },
      preferencias: prefs,
      avisos: {
        cronometro: prefs.cronometro,
        lembreteAula: prefs.lembreteDeAula!.ligado,
        turmas: prefs.turmas !== false,
        graduacao: prefs.graduacao !== false,
        academia: prefs.academia,
      },
      definirAviso: (chave, ligado) => {
        const nova: PreferenciasDeAviso = structuredClone(prefs);
        if (chave === 'lembreteAula') nova.lembreteDeAula = { ...nova.lembreteDeAula!, ligado };
        else nova[chave] = ligado;
        salvarPreferencias(nova);
      },
      lembreteDeAula: prefs.lembreteDeAula!,
      definirLembreteDeAula: (m) => salvarPreferencias({ ...prefs, lembreteDeAula: { ...prefs.lembreteDeAula!, ...m } }),
    };
  }, [avisoDispensado, chaveDoAviso, perfil, prefsMudadas, consultaPreferencias.data, consultaPerfil.data, alunoId, vinculoAtivo, fila, gravar, repo, comAviso]);

  return <CtxLocais.Provider value={valor}>{children}</CtxLocais.Provider>;
}
