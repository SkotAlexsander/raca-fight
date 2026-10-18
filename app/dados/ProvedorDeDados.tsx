/**
 * A raiz dos dados do app: o repositório (hoje o LOCAL de exemplo), o cache
 * de leitura (React Query, chave sempre com o `academiaId` ativo), a sessão
 * com os vínculos e a visão, as preferências do aparelho e a fila de envio.
 *
 * Tela usa só os hooks daqui e de `consultas.ts`. Nada de Supabase na tela.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DataISO, Id, RefeicaoRegistrada, Usuario, Visao } from '../dominio/tipos';
import type { Presenca } from '../dominio/presenca/presenca';
import type { ItemDaFila } from '../dominio/sincronizacao';
import { abrirArmazenamentoLocal } from './armazenamento/banco';
import type { ArmazenamentoLocal } from './armazenamento/tipos';
import { enviarFila, pendentesDe, type ResultadoDoEnvio } from './fila';
import { montarDadosDeExemplo } from './local/dados-de-exemplo';
import { criarRepositorioLocal, type RepositorioLocal } from './local/RepositorioLocal';
import { gravarPreferenciaSemTravar } from './preferencias';
import { registro } from './redigir';
import { observarRede } from './rede';
import type { VinculoComAcademia } from './repositorio';
import { decidirDestino, type Destino } from '../dominio/papel';
import { AMBIENTE_PADRAO } from '../dominio/ambiente';

const CHAVE_SESSAO = 'sessao.usuarioId';
const CHAVE_ULTIMO_VINCULO = 'sessao.ultimoVinculoId';
const CHAVE_VIBRACAO = 'preferencia.vibracao';
const ENVIAR_A_CADA_MS = 15000;

// ---------------------------------------------------------------------------
// Contextos
// ---------------------------------------------------------------------------

export interface Sessao {
  carregando: boolean;
  usuario: Usuario | null;
  vinculos: VinculoComAcademia[];
  /** O vínculo da visão atual; null = aluno sem academia (ou sem sessão). */
  vinculoAtivo: VinculoComAcademia | null;
  visao: Visao | null;
  destino: Destino;
  /** Login simulado com uma conta de exemplo (sem chave real). */
  entrar: (usuarioId: Id) => Promise<void>;
  sair: () => void;
  /** "Entrar como…" e "Trocar de visão": guarda a escolha no aparelho. */
  escolherVinculo: (vinculoId: Id) => void;
  /** Relê a conta e os vínculos (depois de confirmar, pedir ou encerrar um vínculo). */
  recarregar: () => void;
}

export interface Preferencias {
  vibracao: boolean;
  definirVibracao: (ligada: boolean) => void;
}

export interface EstadoDaFila {
  /** Itens da conta atual esperando para subir ("2 presenças aguardando sinal"). */
  pendentes: ItemDaFila[];
  enviando: boolean;
  ultimoResultado: ResultadoDoEnvio | null;
  /** Só no repositório local: simula estar sem rede. */
  semRede: boolean;
  definirSemRede: (sem: boolean) => void;
  enviarAgora: () => Promise<void>;
  /**
   * O check-in (ou o desfazer) do aluno e a chamada do professor: grava
   * (síncrono, antes de animar) e põe na fila (R15.9). Devolve os itens.
   */
  registrarPresencas: (presencas: readonly Presenca[], tipo: 'checkin' | 'chamada') => ItemDaFila[];
  /** A refeição marcada (feita ou "não segui"): grava e põe na fila (a dieta está desligada na v1, L13). */
  registrarRefeicao: (refeicao: RefeicaoRegistrada) => ItemDaFila | null;
  /** "Desmarcar": tira o registro (e o item da fila, se ainda não subiu). */
  desfazerRefeicao: (refeicaoId: Id, data: DataISO) => void;
}

const ContextoDoRepositorio = createContext<RepositorioLocal | null>(null);
const ContextoDaSessao = createContext<Sessao | null>(null);
const ContextoDasPreferencias = createContext<Preferencias | null>(null);
const ContextoDaFila = createContext<EstadoDaFila | null>(null);

function exigir<T>(valor: T | null, nome: string): T {
  if (!valor) throw new Error(`${nome}() fora do <ProvedorDeDados>`);
  return valor;
}
export const useRepositorio = () => exigir(useContext(ContextoDoRepositorio), 'useRepositorio');
export const useSessao = () => exigir(useContext(ContextoDaSessao), 'useSessao');
export const usePreferencias = () => exigir(useContext(ContextoDasPreferencias), 'usePreferencias');
export const useFila = () => exigir(useContext(ContextoDaFila), 'useFila');

// ---------------------------------------------------------------------------
// Montagem (uma vez por abertura do app)
// ---------------------------------------------------------------------------

let instancia: { arm: ArmazenamentoLocal; repo: RepositorioLocal } | null = null;
function abrir() {
  if (!instancia) {
    const arm = abrirArmazenamentoLocal();
    const dados = montarDadosDeExemplo({ agora: new Date() });
    instancia = { arm, repo: criarRepositorioLocal(dados, arm) };
  }
  return instancia;
}

export function ProvedorDeDados({ children }: { children: ReactNode }) {
  const { arm, repo } = useMemo(abrir, []);
  // Agente AA (P11):
  // - networkMode 'always': o repositório local lê do aparelho e não precisa de rede. Com o padrão
  //   ('online'), o React Query PAUSAVA as leituras com o navegador sem rede, e o treino fechado no
  //   porão não aparecia no Histórico até o sinal voltar. Com o Supabase, vira 'offlineFirst'.
  // - gcTime infinito: o cache é pequeno (UMA academia, UMA conta), sair da conta limpa tudo
  //   (`cliente.clear()`) e o temporizador de coleta de 5 min segurava o Jest aberto depois dos
  //   testes de tela. Mudaria com o Supabase e listas grandes (volta a um tempo finito).
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60 * 1000, retry: 1, gcTime: Infinity, networkMode: 'always' },
          mutations: { networkMode: 'always' },
        },
      }),
  );

  // --- sessão --------------------------------------------------------------
  const [usuarioId, setUsuarioId] = useState<Id | null>(() => arm.lerPreferencia(CHAVE_SESSAO));
  const [ultimoVinculoId, setUltimoVinculoId] = useState<Id | null>(() => arm.lerPreferencia(CHAVE_ULTIMO_VINCULO));
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vinculos, setVinculos] = useState<VinculoComAcademia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [versaoDaSessao, setVersaoDaSessao] = useState(0);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    (async () => {
      if (!usuarioId) {
        setUsuario(null);
        setVinculos([]);
      } else {
        const [u, vs] = await Promise.all([repo.usuario(usuarioId), repo.vinculosDoUsuario(usuarioId)]);
        if (!vivo) return;
        setUsuario(u);
        setVinculos(vs);
      }
      if (vivo) setCarregando(false);
    })().catch((e) => {
      registro.erro('não deu para carregar a sessão', e);
      if (vivo) setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, [usuarioId, repo, versaoDaSessao]);

  const sessao = useMemo<Sessao>(() => {
    const destino = carregando ? ({ tipo: 'entrada' } as Destino) : decidirDestino(usuario ? { usuarioId: usuario.id } : null, vinculos, ultimoVinculoId);
    const vinculoAtivo = destino.tipo === 'visao' && destino.vinculoId ? (vinculos.find((v) => v.id === destino.vinculoId) ?? null) : null;
    return {
      carregando,
      usuario,
      vinculos,
      vinculoAtivo,
      visao: destino.tipo === 'visao' ? destino.visao : null,
      destino,
      // preferências do aparelho: com o disco cheio, a tela segue na memória (agente AG; antes, "Sair" lançava erro no toque)
      entrar: async (id) => {
        gravarPreferenciaSemTravar(arm, CHAVE_SESSAO, id);
        setUsuarioId(id);
      },
      sair: () => {
        // sair NÃO apaga a fila (R12.3): a presença do tatame sem sinal espera a conta voltar
        gravarPreferenciaSemTravar(arm, CHAVE_SESSAO, null);
        gravarPreferenciaSemTravar(arm, CHAVE_ULTIMO_VINCULO, null);
        setUltimoVinculoId(null);
        setUsuarioId(null);
        cliente.clear();
      },
      escolherVinculo: (id) => {
        gravarPreferenciaSemTravar(arm, CHAVE_ULTIMO_VINCULO, id);
        setUltimoVinculoId(id);
        // trocar de visão invalida o cache (a chave das consultas tem o academiaId)
        cliente.invalidateQueries();
      },
      recarregar: () => setVersaoDaSessao((v) => v + 1),
    };
  }, [carregando, usuario, vinculos, ultimoVinculoId, arm, cliente]);

  // --- preferências --------------------------------------------------------
  const [vibracao, setVibracao] = useState(() => arm.lerPreferencia(CHAVE_VIBRACAO) !== 'nao');
  const preferencias = useMemo<Preferencias>(
    () => ({
      vibracao,
      definirVibracao: (ligada) => {
        gravarPreferenciaSemTravar(arm, CHAVE_VIBRACAO, ligada ? 'sim' : 'nao');
        setVibracao(ligada);
      },
    }),
    [vibracao, arm],
  );

  // --- fila de envio -------------------------------------------------------
  const [versaoDaFila, setVersaoDaFila] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoDoEnvio | null>(null);
  const [semRede, setSemRede] = useState(repo.destino.semRede);
  const enviandoRef = useRef(false);
  const enviarAgoraRef = useRef<() => Promise<void>>(async () => {});

  const enviarAgora = useCallback(async () => {
    if (enviandoRef.current || !usuario) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const r = await enviarFila(arm, repo.destino, { usuarioId: usuario.id, valida: true }, () => AMBIENTE_PADRAO.agora());
      setUltimoResultado(r);
      // o item que MUDOU durante o envio (check-in desfeito no meio) ficou na fila: sobe na volta seguinte,
      // sem esperar os 15 s (agente AB). Só depois de um envio que andou, para não girar sem rede.
      if (r.enviados > 0 && !r.semRede && !r.precisaEntrar && pendentesDe(arm, usuario.id).length > 0) {
        setTimeout(() => void enviarAgoraRef.current(), 0);
      }
      if (r.enviados > 0) {
        cliente.invalidateQueries({ queryKey: ['presencas'] });
        cliente.invalidateQueries({ queryKey: ['refeicoes'] });
      }
    } catch (e) {
      registro.erro('a fila não subiu', e);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
      setVersaoDaFila((v) => v + 1);
    }
  }, [arm, repo, usuario, cliente]);

  useEffect(() => {
    const t = setInterval(() => void enviarAgora(), ENVIAR_A_CADA_MS);
    return () => clearInterval(t);
  }, [enviarAgora]);

  // a rede do aparelho liga e desliga o "sem rede" do repositório local; voltou, a fila sobe
  enviarAgoraRef.current = enviarAgora;
  useEffect(
    () =>
      observarRede((online) => {
        repo.destino.semRede = !online;
        setSemRede(!online);
        if (online) void enviarAgoraRef.current();
      }),
    [repo],
  );

  const fila = useMemo<EstadoDaFila>(
    () => ({
      pendentes: usuario ? pendentesDe(arm, usuario.id) : [],
      enviando,
      ultimoResultado,
      semRede,
      definirSemRede: (sem) => {
        repo.destino.semRede = sem;
        setSemRede(sem);
        if (!sem) void enviarAgora();
      },
      enviarAgora,
      registrarPresencas: (presencas, tipo) => {
        if (!usuario) return [];
        const itens = repo.registrarPresencas(presencas, tipo, usuario.id);
        setVersaoDaFila((v) => v + 1);
        void cliente.invalidateQueries({ queryKey: ['presencas'] });
        void enviarAgora();
        return itens;
      },
      registrarRefeicao: (refeicao) => {
        if (!usuario) return null;
        const item = repo.registrarRefeicao(refeicao, usuario.id);
        setVersaoDaFila((v) => v + 1);
        void cliente.invalidateQueries({ queryKey: ['refeicoes'] });
        void enviarAgora();
        return item;
      },
      desfazerRefeicao: (refeicaoId, data) => {
        if (!usuario) return;
        repo.desfazerRefeicao(usuario.id, refeicaoId, data);
        setVersaoDaFila((v) => v + 1);
        void cliente.invalidateQueries({ queryKey: ['refeicoes'] });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuario, arm, repo, enviando, ultimoResultado, semRede, enviarAgora, versaoDaFila, cliente],
  );

  return (
    <QueryClientProvider client={cliente}>
      <ContextoDoRepositorio.Provider value={repo}>
        <ContextoDasPreferencias.Provider value={preferencias}>
          <ContextoDaSessao.Provider value={sessao}>
            <ContextoDaFila.Provider value={fila}>{children}</ContextoDaFila.Provider>
          </ContextoDaSessao.Provider>
        </ContextoDasPreferencias.Provider>
      </ContextoDoRepositorio.Provider>
    </QueryClientProvider>
  );
}

