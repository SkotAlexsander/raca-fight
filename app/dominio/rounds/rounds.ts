/**
 * Cronômetro de ROUNDS (R17): o intervalado de `../cronometro.ts` com as
 * predefinições de luta. O motor não muda (instante e pausas, à prova de tela
 * bloqueada); aqui ficam só o uso de luta:
 *
 * - as predefinições do R17.2, com a fonte de cada uma (editáveis antes de começar);
 * - os nomes das fases ("Round 2 de 3", "Intervalo", R17.3);
 * - os SINAIS que a tela toca com o app aberto (R17.4, R17.5): o gongo no
 *   começo e no fim de cada round e a batida dos 10 s em todo round de 60 s ou mais.
 *
 * Os sinais são calculados pela POSIÇÃO na linha do tempo entre duas leituras
 * (`sinaisEntre`): se a tela dormiu e acordou depois, ela sabe o que passou,
 * sem contar tique.
 */
import { criarCronometro, ler, montarFases, type Cronometro, type InstanteMs, type TemposDoIntervalado } from '../cronometro.ts';

export type ChaveDoRound = 'boxe' | 'muay_thai' | 'mma' | 'rola' | 'saco';

export interface PredefinicaoDeRound {
  chave: ChaveDoRound;
  /** "Boxe — 3 × 3 min" */
  nome: string;
  /** "Boxe · 3 × 3 min" (o título do cronômetro). */
  curto: string;
  fonte: string;
  tempos: TemposDoIntervalado;
}

/** R17.4: o aviso dos 10 s vale para round de 60 s ou mais. */
export const SEGUNDOS_DO_AVISO = 10;
export const ROUND_MINIMO_PARA_AVISO = 60;

const p = (chave: ChaveDoRound, nome: string, curto: string, fonte: string, roundSegundos: number, intervaloSegundos: number, rounds: number): PredefinicaoDeRound => ({
  chave,
  nome,
  curto,
  fonte,
  tempos: { preparacaoSegundos: 10, trabalhoSegundos: roundSegundos, descansoSegundos: intervaloSegundos, rodadas: rounds },
});

/** R17.2, na ordem da tela. Preparação de 10 s em todas. */
export const PREDEFINICOES_DE_ROUND: readonly PredefinicaoDeRound[] = [
  p('muay_thai', 'Muay Thai — 3 × 3 min', 'Muay Thai · 3 × 3 min', 'IFMA, regra 3 (sênior)', 180, 60, 3),
  p('boxe', 'Boxe — 3 × 3 min', 'Boxe · 3 × 3 min', 'AIBA 2016 / World Boxing (elite)', 180, 60, 3),
  p('mma', 'MMA — 3 × 5 min', 'MMA · 3 × 5 min', 'Regras Unificadas (ABC)', 300, 60, 3),
  p('rola', 'Rola de jiu-jitsu — 5 min', 'Rola · 5 min', 'prática de academia', 300, 60, 6),
  p('saco', 'Saco — 2 min', 'Saco · 2 min', 'prática de academia, ponto de partida', 120, 30, 6),
];

export function predefinicaoDeRound(chave: ChaveDoRound): PredefinicaoDeRound {
  return PREDEFINICOES_DE_ROUND.find((x) => x.chave === chave)!;
}

/** O cronômetro (parado) com os tempos escolhidos. Valida como o motor (R9.6). */
export function criarCronometroDeRounds(tempos: TemposDoIntervalado): Cronometro {
  return criarCronometro({ modo: 'intervalado', ...tempos });
}

/** "3:00", "1:48", "0:09". */
export function mmss(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "3 × 3 min · intervalo 1:00" */
export function resumoDosTempos(t: TemposDoIntervalado): string {
  const round = t.trabalhoSegundos % 60 === 0 ? `${t.trabalhoSegundos / 60} min` : mmss(t.trabalhoSegundos);
  return `${t.rodadas} × ${round} · intervalo ${mmss(t.descansoSegundos)}`;
}

/** O tempo total, preparação inclusa (o "Total 11:00" da tela). */
export function totalDosTempos(t: TemposDoIntervalado): number {
  return t.preparacaoSegundos + t.rodadas * t.trabalhoSegundos + Math.max(0, t.rodadas - 1) * t.descansoSegundos;
}

export type FaseDoRound = 'parado' | 'preparacao' | 'round' | 'intervalo' | 'fim';

export interface LeituraDoRound {
  fase: FaseDoRound;
  /** R17.3: "Prepare-se" · "Round 2 de 3" · "Intervalo" · "Fim". */
  titulo: string;
  /** O rótulo curto da fase, como no desenho: "Luta" · "Intervalo" · "Prepare-se". */
  rotulo: string;
  round: number;
  rounds: number;
  /** O número grande. */
  segundos: number;
  /** 0 a 1 do que JÁ passou na fase. */
  progresso: number;
  pausado: boolean;
  /** Nos últimos 10 s de um round de 60 s ou mais. */
  ultimos10s: boolean;
  /** O que vem depois desta fase ("intervalo de 1:00", "round 3", nulo no último). */
  depois: string | null;
  /** O tempo total que falta (todas as fases). */
  restanteTotal: number;
}

export function lerRound(c: Cronometro, agora: InstanteMs): LeituraDoRound {
  if (c.configuracao.modo !== 'intervalado') throw new Error('o cronômetro de rounds é sempre um intervalado');
  const conf = c.configuracao;
  const l = ler(c, agora);
  const rounds = conf.rodadas;
  const restanteTotal = Math.ceil((l.restanteMs ?? 0) / 1000);
  if (l.estado === 'parado') {
    return { fase: 'parado', titulo: `${rounds} rounds`, rotulo: 'Pronto', round: 0, rounds, segundos: conf.preparacaoSegundos || conf.trabalhoSegundos, progresso: 0, pausado: false, ultimos10s: false, depois: null, restanteTotal: totalDosTempos(conf) };
  }
  if (l.estado === 'terminado') {
    return { fase: 'fim', titulo: 'Fim', rotulo: 'Fim', round: rounds, rounds, segundos: 0, progresso: 1, pausado: false, ultimos10s: false, depois: null, restanteTotal: 0 };
  }
  const f = l.fase!;
  const fase: FaseDoRound = f.tipo === 'preparacao' ? 'preparacao' : f.tipo === 'trabalho' ? 'round' : 'intervalo';
  const round = f.tipo === 'preparacao' ? 1 : f.rodada;
  const proxima = l.proximaFase;
  const depois = !proxima ? null : proxima.tipo === 'descanso' ? `intervalo de ${mmss(proxima.duracaoMs / 1000)}` : `round ${proxima.rodada} de ${rounds}`;
  const ultimos10s = fase === 'round' && conf.trabalhoSegundos >= ROUND_MINIMO_PARA_AVISO && l.segundosNaTela <= SEGUNDOS_DO_AVISO && l.segundosNaTela > 0;
  return {
    fase,
    titulo: fase === 'preparacao' ? 'Prepare-se' : fase === 'round' ? `Round ${round} de ${rounds}` : 'Intervalo',
    rotulo: fase === 'preparacao' ? 'Prepare-se' : fase === 'round' ? 'Luta' : 'Intervalo',
    round,
    rounds,
    segundos: l.segundosNaTela,
    progresso: l.progresso,
    pausado: l.estado === 'pausado',
    ultimos10s,
    depois,
    restanteTotal,
  };
}

export type SinalDoRound = 'gongo_inicio' | 'aviso_10s' | 'gongo_fim';

interface Marca {
  posicaoMs: number;
  sinal: SinalDoRound;
  round: number;
}

/** Os pontos da linha do tempo em que a tela toca alguma coisa. */
export function marcasDosSinais(t: TemposDoIntervalado, comAviso10s: boolean): Marca[] {
  const marcas: Marca[] = [];
  for (const f of montarFases({ modo: 'intervalado', ...t })) {
    if (f.tipo !== 'trabalho') continue;
    marcas.push({ posicaoMs: f.inicioMs, sinal: 'gongo_inicio', round: f.rodada });
    if (comAviso10s && f.duracaoMs >= ROUND_MINIMO_PARA_AVISO * 1000) marcas.push({ posicaoMs: f.inicioMs + f.duracaoMs - SEGUNDOS_DO_AVISO * 1000, sinal: 'aviso_10s', round: f.rodada });
    marcas.push({ posicaoMs: f.inicioMs + f.duracaoMs, sinal: 'gongo_fim', round: f.rodada });
  }
  return marcas.sort((a, b) => a.posicaoMs - b.posicaoMs);
}

/**
 * A posição na linha do tempo (ms), para a tela guardar entre uma leitura e
 * outra. Parado: −1 (antes do começo: o gongo da posição 0 ainda vai tocar).
 */
export function posicaoDoRound(c: Cronometro, agora: InstanteMs): number {
  const l = ler(c, agora);
  return l.estado === 'parado' ? -1 : l.decorridoMs;
}

/**
 * Os sinais entre duas POSIÇÕES (a de antes, exclusive, até a de agora,
 * inclusive). A tela guarda a última posição que viu; um toque (pausar,
 * retomar) não muda a posição, então nada se perde nem toca duas vezes.
 * Se a tela dormiu, a posição pulou e os sinais do meio vêm juntos.
 */
export function sinaisEntrePosicoes(t: TemposDoIntervalado, posicaoAntes: number, posicaoAgora: number, comAviso10s: boolean): SinalDoRound[] {
  if (posicaoAgora <= posicaoAntes) return [];
  return marcasDosSinais(t, comAviso10s)
    .filter((m) => m.posicaoMs > posicaoAntes && m.posicaoMs <= posicaoAgora)
    .map((m) => m.sinal);
}

/** Atalho para duas leituras do MESMO cronômetro, sem toque no meio. */
export function sinaisEntre(c: Cronometro, deMs: InstanteMs, ateMs: InstanteMs, comAviso10s: boolean): SinalDoRound[] {
  if (c.configuracao.modo !== 'intervalado') return [];
  // a leitura de antes do "Iniciar" fica ANTES da posição 0 (o gongo do começo toca)
  const antes = c.inicioEm !== null && deMs <= c.inicioEm ? -1 : posicaoDoRound(c, deMs);
  return sinaisEntrePosicoes(c.configuracao, antes, posicaoDoRound(c, ateMs), comAviso10s);
}
