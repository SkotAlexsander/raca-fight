/**
 * O cronômetro de ROUNDS, um só no app (R9.9), nos dois apps: o aluno treina
 * em casa e o professor comanda o treino com ele (R17.1).
 *
 * - O motor é o de `dominio/cronometro.ts` (instante, nunca contador) e o uso
 *   de luta é o de `dominio/rounds/rounds.ts` (nomes das fases e os sinais).
 * - O estado vai para o aparelho a cada mudança e volta ao reabrir, pelo
 *   `restaurarCronometro` (R9.4): fechar o app no meio do round não perde nada.
 * - Os SINAIS (gongo no começo e no fim de cada round, a batida dos 10 s, R17.4)
 *   saem pela POSIÇÃO na linha do tempo (`sinaisEntrePosicoes`): a vibração é
 *   daqui (o app aberto); o som toca na tela do cronômetro (R17.5), que escuta
 *   `ultimoSinal`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRepositorio, useSessao } from '@/dados';
import { alternar, encerrar, iniciar, ler, pularFase, restaurarCronometro, type Cronometro, type TemposDoIntervalado } from '@/dominio/cronometro';
import { criarCronometroDeRounds, lerRound, posicaoDoRound, sinaisEntrePosicoes, type LeituraDoRound, type SinalDoRound } from '@/dominio/rounds/rounds';
import { useVibrar } from '@/tema';
import { useRelogioDoCronometro } from './relogio';

export interface CronometroDoApp {
  c: Cronometro;
  /** "Muay Thai · 3 × 3 min" */
  titulo: string;
  /** O aviso dos 10 s (R17.4): ligado nas predefinições de luta. */
  aviso10s: boolean;
  /** O som com o app aberto (R17.5). */
  som: boolean;
}

interface Valor {
  atual: CronometroDoApp | null;
  leitura: LeituraDoRound | null;
  agora: number;
  /** O último sinal que passou (o número muda a cada sinal, para a tela tocar o som). */
  ultimoSinal: { sinal: SinalDoRound; n: number } | null;
  comecar: (tempos: TemposDoIntervalado, titulo: string, opcoes: { aviso10s: boolean; som: boolean }) => void;
  agir: (acao: 'alternar' | 'pular' | 'parar') => void;
  definirSom: (som: boolean) => void;
  definirAviso10s: (ligado: boolean) => void;
  limpar: () => void;
}

const Contexto = createContext<Valor | null>(null);

export function useCronometroDoApp(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useCronometroDoApp() fora do <ProvedorDoCronometro>');
  return v;
}

/** O que voltou do aparelho é dado de fora: o domínio confere; o que não presta vira "sem cronômetro". */
function lerSalvo(texto: string | null): CronometroDoApp | null {
  try {
    const salvo = JSON.parse(texto ?? 'null') as Partial<CronometroDoApp> | null;
    const c = salvo ? restaurarCronometro(salvo.c) : null;
    if (!salvo || !c || c.configuracao.modo !== 'intervalado') return null;
    return { c, titulo: typeof salvo.titulo === 'string' ? salvo.titulo : 'Rounds', aviso10s: salvo.aviso10s !== false, som: salvo.som !== false };
  } catch {
    return null;
  }
}

export function ProvedorDoCronometro({ children }: { children: ReactNode }) {
  const repo = useRepositorio();
  const { usuario } = useSessao();
  const vibrar = useVibrar();
  const chave = `cronometro-de-rounds.${usuario?.id ?? 'sem-conta'}`;
  const [atual, setAtual] = useState<CronometroDoApp | null>(() => lerSalvo(repo.lerDoAparelho(chave)));
  const carregado = useRef(chave);
  const [agora, setAgora] = useRelogioDoCronometro(atual?.c ?? null);
  const [ultimoSinal, setUltimoSinal] = useState<{ sinal: SinalDoRound; n: number } | null>(null);
  const posicao = useRef<number | null>(null);

  // vai para o aparelho a cada mudança (R9.4); outra conta lê o dela antes de gravar
  useEffect(() => {
    if (carregado.current !== chave) {
      carregado.current = chave;
      setAtual(lerSalvo(repo.lerDoAparelho(chave)));
      posicao.current = null;
      return;
    }
    repo.gravarNoAparelho(chave, atual ? JSON.stringify(atual) : null);
  }, [atual, chave, repo]);

  // os sinais pela posição na linha do tempo (a tela que dormiu acorda sabendo o que passou)
  useEffect(() => {
    if (!atual) {
      posicao.current = null;
      return;
    }
    const nova = posicaoDoRound(atual.c, agora);
    const antes = posicao.current;
    posicao.current = nova;
    if (antes === null || atual.c.configuracao.modo !== 'intervalado') return;
    const sinais = sinaisEntrePosicoes(atual.c.configuracao, antes, nova, atual.aviso10s);
    const ultimo = sinais.at(-1);
    if (!ultimo) return;
    // R17.4: a batida dos 10 s é uma vibração média; o gongo, a troca de fase
    vibrar(ultimo === 'aviso_10s' ? 'trocaDeFase' : ultimo === 'gongo_fim' ? 'fimDescanso' : 'trocaDeFase');
    setUltimoSinal((s) => ({ sinal: ultimo, n: (s?.n ?? 0) + 1 }));
  }, [agora, atual, vibrar]);

  const agir = useCallback(
    (acao: 'alternar' | 'pular' | 'parar') => {
      setAtual((a) => {
        if (!a) return a;
        const ms = Date.now();
        // a tela lê ANTES do toque: a posição de agora fica guardada e o toque não toca nada sozinho
        if (posicao.current !== null) posicao.current = posicaoDoRound(a.c, ms);
        const c = acao === 'alternar' ? alternar(a.c, ms) : acao === 'pular' ? pularFase(a.c, ms) : encerrar(a.c, ms, 'parou');
        if (acao === 'pular') posicao.current = posicaoDoRound(c, ms);
        return { ...a, c };
      });
      setAgora(Date.now());
    },
    [setAgora],
  );

  const valor = useMemo<Valor>(
    () => ({
      atual,
      leitura: atual ? lerRound(atual.c, agora) : null,
      agora,
      ultimoSinal,
      comecar: (tempos, titulo, opcoes) => {
        const ms = Date.now();
        const c = iniciar(criarCronometroDeRounds(tempos), ms);
        posicao.current = -1;
        setAtual({ c, titulo, ...opcoes });
        setAgora(ms);
      },
      agir,
      definirSom: (som) => setAtual((a) => (a ? { ...a, som } : a)),
      definirAviso10s: (aviso10s) => setAtual((a) => (a ? { ...a, aviso10s } : a)),
      limpar: () => setAtual(null),
    }),
    [atual, agora, ultimoSinal, agir, setAgora],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** O cronômetro está rodando ou pausado (a faixa acima das abas aparece). */
export function cronometroEmUso(atual: CronometroDoApp | null, agora: number): boolean {
  if (!atual) return false;
  const e = ler(atual.c, agora).estado;
  return e === 'rodando' || e === 'pausado';
}
