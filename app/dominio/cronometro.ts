/**
 * Cronômetro: uma máquina de estados pura para os três modos (livre,
 * regressivo, intervalado). Na academia de luta (P12, R17), o intervalado é o
 * cronômetro de ROUNDS (`rounds/rounds.ts`). A série por tempo e "o tempo
 * vira série" (R9.10) SAÍRAM com o treino de musculação (agente AM2).
 * Regras: seção 9 de `01-especificacao/03-REGRAS.md` (R9.x citadas abaixo).
 * Desenho: componentes 7 e 18 de `02-design/sistema-de-design/02-COMPONENTES.md`.
 *
 * O ponto central (R9.3): o cronômetro guarda o INSTANTE DE INÍCIO e as PAUSAS,
 * nunca um contador que soma de segundo em segundo. O tempo decorrido é sempre
 * uma conta: `agora − início − pausas (+ fases puladas)`. Por isso:
 * - com a tela bloqueada ou o app em segundo plano, o JavaScript para, mas a
 *   próxima leitura dá o tempo certo, sem ter visto nenhum tique no meio;
 * - o app pode morrer: o estado é JSON puro (números e listas), vai para o
 *   armazenamento do telefone e volta igual;
 * - fuso e horário de verão não mexem em nada: o instante é em milissegundos
 *   desde 1970 (`Date.now()`), que não tem fuso.
 *
 * Nenhuma função lê o relógio: quem chama passa `agora`. Tudo devolve um
 * cronômetro NOVO; o recebido nunca muda. Testado em `cronometro.test.ts`.
 */

import type { Segundos } from './tipos.ts';
import { SEGUNDOS_POR_HORA, SEGUNDOS_POR_MINUTO } from './unidades.ts';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/**
 * Instante em milissegundos desde 1970 (o `Date.now()` do telefone). Só existe
 * no estado transitório do cronômetro; o que vira dado do treino sai em
 * segundos inteiros (`Segundos`), como manda o CLAUDE.md.
 */
export type InstanteMs = number;

export type ModoDoCronometro = 'livre' | 'regressivo' | 'intervalado';

/**
 * Para que o cronômetro foi aberto (R9.1, R9.2):
 * - `avulso`: a ferramenta Cronômetro (os rounds, o livre, o regressivo);
 * - `descanso`: um descanso curto, um regressivo (sobrou do treino; a ferramenta de luta usa o intervalado).
 */
export type FinalidadeDoCronometro = 'avulso' | 'descanso';

export type EstadoDoCronometro = 'parado' | 'rodando' | 'pausado' | 'terminado';

/** `completou`: o tempo acabou · `pulou`: o aluno pulou a última fase ou o descanso · `parou`: o aluno parou. */
export type ComoTerminou = 'completou' | 'pulou' | 'parou';

export type TipoDeFase = 'preparacao' | 'trabalho' | 'descanso';

export interface ConfiguracaoLivre {
  modo: 'livre';
}

export interface ConfiguracaoRegressivo {
  modo: 'regressivo';
  duracaoSegundos: Segundos;
}

export interface TemposDoIntervalado {
  /** Contagem antes da 1ª rodada ("Prepare-se"); 0 = começa direto. */
  preparacaoSegundos: Segundos;
  trabalhoSegundos: Segundos;
  /** Descanso entre rodadas; 0 = sem descanso (EMOM). Não há descanso depois da última (R9.6). */
  descansoSegundos: Segundos;
  rodadas: number;
}

export interface ConfiguracaoIntervalado extends TemposDoIntervalado {
  modo: 'intervalado';
}

export type ConfiguracaoDoCronometro = ConfiguracaoLivre | ConfiguracaoRegressivo | ConfiguracaoIntervalado;

/** Uma pausa: aberta enquanto `fimEm` é nulo. */
export interface Pausa {
  inicioEm: InstanteMs;
  fimEm: InstanteMs | null;
}

/** Um "pular fase": em que ponto da linha do tempo foi e quanto tempo pulou. */
export interface Salto {
  posicaoMs: number;
  duracaoMs: number;
}

/**
 * O estado inteiro do cronômetro. Só números, textos, nulos e listas: vai e
 * volta como JSON sem perder nada (R9.4).
 */
export interface Cronometro {
  finalidade: FinalidadeDoCronometro;
  configuracao: ConfiguracaoDoCronometro;
  /** O estado gravado. O estado VERDADEIRO num instante é o de `ler()`: um regressivo `rodando` cujo tempo já passou está terminado. */
  estado: EstadoDoCronometro;
  inicioEm: InstanteMs | null;
  pausas: Pausa[];
  /** Soma dos +30 s / −30 s do regressivo, em ms (vale só para esta contagem, R9.8). */
  ajusteMs: number;
  saltos: Salto[];
  /** Livre: o tempo decorrido no momento de cada volta. */
  voltasMs: number[];
  fimEm: InstanteMs | null;
  comoTerminou: ComoTerminou | null;
  /**
   * O instante do último toque (iniciar, pausar, retomar, ±30 s, pular, volta,
   * parar). Revisão T (T2): com o relógio atrasado à mão, voltas e saltos são
   * POSIÇÕES, não instantes, e o "agora" podia cair antes deles: volta com
   * duração negativa e a fase pulada voltando. O "agora" nunca fica antes disto.
   */
  ultimoToqueEm: InstanteMs | null;
}

// ---------------------------------------------------------------------------
// Constantes das regras
// ---------------------------------------------------------------------------

/** Milissegundos num segundo: o estado é em ms (`Date.now()`), o dado do treino em segundos. */
export const MS_POR_SEGUNDO = 1000;

/** R9.8: os botões "−30 s" e "+30 s". */
export const AJUSTE_SEGUNDOS: Segundos = 30;

/** Componente 7: nos últimos 10 s o anel fica `atencao`. */
export const SEGUNDOS_ACABANDO: Segundos = 10;

/** R9.5: um regressivo vai de 1 s a 3 h. */
export const MAXIMO_REGRESSIVO_SEGUNDOS: Segundos = 3 * SEGUNDOS_POR_HORA;

/** R9.6. */
export const MAXIMO_PREPARACAO_SEGUNDOS: Segundos = 60;
export const MAXIMO_FASE_SEGUNDOS: Segundos = SEGUNDOS_POR_HORA;
export const MAXIMO_DE_RODADAS = 99;

/**
 * R9.11: quantas notificações locais o cronômetro agenda de uma vez. O iPhone
 * guarda no máximo 64 pendentes por app, e os lembretes da semana (avisos.ts)
 * dividem esse teto. O Tabata inteiro usa 16; o HIIT 30/30 × 10, 20.
 */
export const LIMITE_DE_AVISOS_AGENDADOS = 24;

/** Atalhos do regressivo na tela: 1, 2, 3, 5 e 10 min (R9.5). */
export const ATALHOS_REGRESSIVO_SEGUNDOS: readonly Segundos[] = [60, 120, 180, 300, 600];

export type ChaveDaPredefinicao = 'tabata' | 'emom10' | 'hiit30x30' | 'hiit40x20';

export interface Predefinicao {
  nome: string;
  descricao: string;
  configuracao: TemposDoIntervalado;
}

/** R9.6: as predefinições do intervalado. Todas com 10 s de preparação; o aluno muda qualquer número. */
export const PREDEFINICOES: Readonly<Record<ChaveDaPredefinicao, Predefinicao>> = {
  tabata: {
    nome: 'Tabata 20/10 × 8',
    descricao: '20 s de esforço, 10 s de descanso, 8 rodadas',
    configuracao: { preparacaoSegundos: 10, trabalhoSegundos: 20, descansoSegundos: 10, rodadas: 8 },
  },
  emom10: {
    nome: 'EMOM 10 min',
    descricao: 'a cada minuto, uma rodada; o que sobra do minuto é descanso',
    configuracao: { preparacaoSegundos: 10, trabalhoSegundos: 60, descansoSegundos: 0, rodadas: 10 },
  },
  hiit30x30: {
    nome: 'HIIT 30/30 × 10',
    descricao: '30 s forte, 30 s leve, 10 rodadas',
    configuracao: { preparacaoSegundos: 10, trabalhoSegundos: 30, descansoSegundos: 30, rodadas: 10 },
  },
  hiit40x20: {
    nome: 'HIIT 40/20 × 8',
    descricao: '40 s forte, 20 s leve, 8 rodadas',
    configuracao: { preparacaoSegundos: 10, trabalhoSegundos: 40, descansoSegundos: 20, rodadas: 8 },
  },
};

// ---------------------------------------------------------------------------
// Criar
// ---------------------------------------------------------------------------

export function criarCronometro(
  configuracao: ConfiguracaoDoCronometro,
  finalidade: FinalidadeDoCronometro = 'avulso',
): Cronometro {
  validarConfiguracao(configuracao);
  if (finalidade !== 'avulso' && configuracao.modo !== 'regressivo') {
    throw new Error('o descanso é sempre um regressivo (R9.2)');
  }
  return {
    finalidade,
    configuracao: { ...configuracao },
    estado: 'parado',
    inicioEm: null,
    pausas: [],
    ajusteMs: 0,
    saltos: [],
    voltasMs: [],
    fimEm: null,
    comoTerminou: null,
    ultimoToqueEm: null,
  };
}

/** R9.2 / R1.14: o descanso da série. Descanso 0 = sem cronômetro (devolve nulo). */
export function criarDescanso(descansoSegundos: Segundos): Cronometro | null {
  exigirInteiro('descanso em segundos', descansoSegundos, 0, MAXIMO_REGRESSIVO_SEGUNDOS);
  if (descansoSegundos === 0) {
    return null;
  }
  return criarCronometro({ modo: 'regressivo', duracaoSegundos: descansoSegundos }, 'descanso');
}

function validarConfiguracao(configuracao: ConfiguracaoDoCronometro): void {
  if (configuracao.modo === 'regressivo') {
    exigirInteiro('duração do regressivo em segundos', configuracao.duracaoSegundos, 1, MAXIMO_REGRESSIVO_SEGUNDOS);
  } else if (configuracao.modo === 'intervalado') {
    exigirInteiro('preparação em segundos', configuracao.preparacaoSegundos, 0, MAXIMO_PREPARACAO_SEGUNDOS);
    exigirInteiro('trabalho em segundos', configuracao.trabalhoSegundos, 1, MAXIMO_FASE_SEGUNDOS);
    exigirInteiro('descanso em segundos', configuracao.descansoSegundos, 0, MAXIMO_FASE_SEGUNDOS);
    exigirInteiro('rodadas', configuracao.rodadas, 1, MAXIMO_DE_RODADAS);
  } else if (configuracao.modo !== 'livre') {
    throw new Error(`modo de cronômetro desconhecido: ${String((configuracao as { modo?: unknown }).modo)}`);
  }
}

// ---------------------------------------------------------------------------
// Fases do intervalado
// ---------------------------------------------------------------------------

export interface FaseDoIntervalado {
  tipo: TipoDeFase;
  /** 0 na preparação; 1 a N no trabalho e no descanso. */
  rodada: number;
  /** Onde a fase começa na linha do tempo do intervalado (ms desde o início). */
  inicioMs: number;
  duracaoMs: number;
}

/**
 * R9.6: preparação (se houver) → trabalho 1 → descanso 1 → … → trabalho N.
 * Não há descanso depois da última rodada; fase de duração 0 não entra.
 */
export function montarFases(configuracao: ConfiguracaoIntervalado): FaseDoIntervalado[] {
  const fases: FaseDoIntervalado[] = [];
  let inicioMs = 0;
  const empurrar = (tipo: TipoDeFase, rodada: number, segundos: Segundos) => {
    if (segundos > 0) {
      fases.push({ tipo, rodada, inicioMs, duracaoMs: segundos * MS_POR_SEGUNDO });
      inicioMs += segundos * MS_POR_SEGUNDO;
    }
  };
  empurrar('preparacao', 0, configuracao.preparacaoSegundos);
  for (let rodada = 1; rodada <= configuracao.rodadas; rodada += 1) {
    empurrar('trabalho', rodada, configuracao.trabalhoSegundos);
    if (rodada < configuracao.rodadas) {
      empurrar('descanso', rodada, configuracao.descansoSegundos);
    }
  }
  return fases;
}

/** Duração planejada, em segundos: nula no livre (não tem fim). Não conta os ±30 s. */
export function duracaoTotalSegundos(configuracao: ConfiguracaoDoCronometro): Segundos | null {
  if (configuracao.modo === 'livre') {
    return null;
  }
  if (configuracao.modo === 'regressivo') {
    return configuracao.duracaoSegundos;
  }
  const c = configuracao;
  return c.preparacaoSegundos + c.rodadas * c.trabalhoSegundos + (c.rodadas - 1) * c.descansoSegundos;
}

// ---------------------------------------------------------------------------
// As contas: tempo ativo, decorrido e total
// ---------------------------------------------------------------------------

/** O instante mais recente que o cronômetro já viu. */
function ultimoInstante(c: Cronometro): InstanteMs {
  let ultimo = c.inicioEm ?? -Infinity;
  for (const p of c.pausas) {
    ultimo = Math.max(ultimo, p.inicioEm, p.fimEm ?? -Infinity);
  }
  return Math.max(ultimo, c.fimEm ?? -Infinity, c.ultimoToqueEm ?? -Infinity);
}

/** Carimba o instante do toque (ver `ultimoToqueEm`). */
function tocar(c: Cronometro, ref: InstanteMs): Cronometro {
  return { ...c, ultimoToqueEm: Math.max(ref, c.ultimoToqueEm ?? -Infinity) };
}

/**
 * R9.4: se o relógio do telefone voltar (ajuste manual), o cronômetro não
 * anda para trás nem fica negativo: o "agora" nunca é anterior ao que já viu.
 */
function agoraSeguro(c: Cronometro, agora: InstanteMs): InstanteMs {
  if (!Number.isFinite(agora)) {
    throw new RangeError(`agora precisa ser um instante em ms; veio ${String(agora)}`);
  }
  return Math.max(agora, ultimoInstante(c));
}

/** Tempo realmente cronometrado (sem pausas, sem saltos) até `referencia`. */
function tempoAtivoMs(c: Cronometro, referencia: InstanteMs): number {
  if (c.inicioEm === null) {
    return 0;
  }
  let pausado = 0;
  for (const p of c.pausas) {
    pausado += Math.max(0, (p.fimEm ?? referencia) - p.inicioEm);
  }
  return Math.max(0, referencia - c.inicioEm - pausado);
}

function somaDosSaltos(c: Cronometro): number {
  return c.saltos.reduce((soma, s) => soma + s.duracaoMs, 0);
}

/** Posição na linha do tempo: tempo ativo + o que foi pulado. */
function decorridoBrutoMs(c: Cronometro, referencia: InstanteMs): number {
  return tempoAtivoMs(c, referencia) + somaDosSaltos(c);
}

/** Total da contagem em ms (regressivo com os ajustes; intervalado pelas fases). Nulo no livre. */
function totalMs(c: Cronometro): number | null {
  const conf = c.configuracao;
  if (conf.modo === 'livre') {
    return null;
  }
  if (conf.modo === 'regressivo') {
    return conf.duracaoSegundos * MS_POR_SEGUNDO + c.ajusteMs;
  }
  return (duracaoTotalSegundos(conf) ?? 0) * MS_POR_SEGUNDO;
}

// ---------------------------------------------------------------------------
// Transições
// ---------------------------------------------------------------------------

/**
 * Põe o estado gravado em dia com `agora`: um regressivo ou intervalado
 * `rodando` cujo tempo já acabou vira `terminado`, com `fimEm` no instante
 * EXATO em que acabou (não quando o app olhou). Livre nunca termina sozinho.
 */
export function atualizar(c: Cronometro, agora: InstanteMs): Cronometro {
  const ref = agoraSeguro(c, agora);
  if (c.estado !== 'rodando') {
    return c;
  }
  const total = totalMs(c);
  if (total === null) {
    return c;
  }
  const decorrido = decorridoBrutoMs(c, ref);
  if (decorrido < total) {
    return c;
  }
  return { ...c, estado: 'terminado', fimEm: ref - (decorrido - total), comoTerminou: 'completou' };
}

/** parado → rodando. Em qualquer outro estado, devolve o mesmo cronômetro (R9.9). */
export function iniciar(c: Cronometro, agora: InstanteMs): Cronometro {
  if (c.estado !== 'parado') {
    return atualizar(c, agora);
  }
  const ref = agoraSeguro(c, agora);
  return tocar({ ...c, estado: 'rodando', inicioEm: ref }, ref);
}

/** rodando → pausado. Se o tempo já tinha acabado, devolve o terminado. */
export function pausar(c: Cronometro, agora: InstanteMs): Cronometro {
  const atual = atualizar(c, agora);
  if (atual.estado !== 'rodando') {
    return atual;
  }
  const ref = agoraSeguro(atual, agora);
  return tocar({ ...atual, estado: 'pausado', pausas: [...atual.pausas, { inicioEm: ref, fimEm: null }] }, ref);
}

/** pausado → rodando, fechando a pausa aberta. */
export function retomar(c: Cronometro, agora: InstanteMs): Cronometro {
  if (c.estado !== 'pausado') {
    return atualizar(c, agora);
  }
  const ref = agoraSeguro(c, agora);
  return tocar({ ...c, estado: 'rodando', pausas: fecharPausa(c.pausas, ref) }, ref);
}

/** O botão grande do meio: Iniciar · Pausar · Retomar. */
export function alternar(c: Cronometro, agora: InstanteMs): Cronometro {
  const atual = atualizar(c, agora);
  if (atual.estado === 'parado') {
    return iniciar(atual, agora);
  }
  if (atual.estado === 'rodando') {
    return pausar(atual, agora);
  }
  if (atual.estado === 'pausado') {
    return retomar(atual, agora);
  }
  return atual;
}

/**
 * R9.8: "+30 s" / "−30 s" no regressivo (descanso, série por tempo ou avulso).
 * Vale só para esta contagem; a série planejada não muda. Antes de começar,
 * nunca abaixo de 1 s; rodando, se faltava menos que o tirado, termina na hora.
 * Nunca acima de 3 h.
 */
export function ajustar(c: Cronometro, deltaSegundos: Segundos, agora: InstanteMs): Cronometro {
  if (c.configuracao.modo !== 'regressivo') {
    throw new Error('±30 s só existe no regressivo (descanso, série por tempo ou contagem regressiva)');
  }
  if (!Number.isSafeInteger(deltaSegundos)) {
    throw new RangeError(`ajuste em segundos precisa ser inteiro; veio ${String(deltaSegundos)}`);
  }
  const atual = atualizar(c, agora);
  if (atual.estado === 'terminado') {
    return atual;
  }
  const ref = agoraSeguro(atual, agora);
  const base = (atual.configuracao as ConfiguracaoRegressivo).duracaoSegundos * MS_POR_SEGUNDO;
  const decorrido = decorridoBrutoMs(atual, ref);
  const minimo = atual.estado === 'parado' ? MS_POR_SEGUNDO : decorrido;
  const novoTotal = Math.min(MAXIMO_REGRESSIVO_SEGUNDOS * MS_POR_SEGUNDO, Math.max(minimo, base + atual.ajusteMs + deltaSegundos * MS_POR_SEGUNDO));
  const ajustado: Cronometro = tocar({ ...atual, ajusteMs: novoTotal - base }, ref);
  if (atual.estado !== 'parado' && novoTotal <= decorrido) {
    return terminarAgora(ajustado, ref, 'completou');
  }
  return ajustado;
}

/**
 * "Pular": no regressivo termina na hora (pular o descanso); no intervalado
 * salta para o começo da próxima fase, e na última fase termina (R9.7).
 */
export function pularFase(c: Cronometro, agora: InstanteMs): Cronometro {
  const conf = c.configuracao;
  if (conf.modo === 'livre') {
    throw new Error('o livre não tem fase para pular');
  }
  const atual = atualizar(c, agora);
  if (atual.estado === 'terminado') {
    return atual;
  }
  const ref = agoraSeguro(atual, agora);
  if (conf.modo === 'regressivo') {
    return terminarAgora(atual, ref, 'pulou');
  }
  if (atual.estado === 'parado') {
    return atual;
  }
  const fases = montarFases(conf);
  const posicao = decorridoBrutoMs(atual, ref);
  const fase = faseEm(fases, posicao);
  const fimDaFase = fase.inicioMs + fase.duracaoMs;
  const comSalto: Cronometro = tocar({ ...atual, saltos: [...atual.saltos, { posicaoMs: posicao, duracaoMs: fimDaFase - posicao }] }, ref);
  if (fimDaFase >= (totalMs(atual) ?? 0)) {
    return terminarAgora(comSalto, ref, 'pulou');
  }
  return comSalto;
}

/** Livre, rodando: guarda o decorrido como uma volta. Pausado ou parado: nada muda. */
export function marcarVolta(c: Cronometro, agora: InstanteMs): Cronometro {
  if (c.configuracao.modo !== 'livre') {
    throw new Error('volta só existe no cronômetro livre');
  }
  if (c.estado !== 'rodando') {
    return c;
  }
  const ref = agoraSeguro(c, agora);
  return tocar({ ...c, voltasMs: [...c.voltasMs, decorridoBrutoMs(c, ref)] }, ref);
}

/** "Parar": termina agora, rodando ou pausado. Parado ou terminado: nada muda. */
export function encerrar(c: Cronometro, agora: InstanteMs, como: ComoTerminou = 'parou'): Cronometro {
  const atual = atualizar(c, agora);
  if (atual.estado === 'parado' || atual.estado === 'terminado') {
    return atual;
  }
  return terminarAgora(atual, agoraSeguro(atual, agora), como);
}

/** "Zerar": volta ao parado com a mesma configuração e finalidade. */
export function zerar(c: Cronometro): Cronometro {
  return criarCronometro(c.configuracao, c.finalidade);
}

function terminarAgora(c: Cronometro, ref: InstanteMs, como: ComoTerminou): Cronometro {
  return tocar({ ...c, estado: 'terminado', pausas: fecharPausa(c.pausas, ref), fimEm: ref, comoTerminou: como }, ref);
}

function fecharPausa(pausas: Pausa[], ref: InstanteMs): Pausa[] {
  return pausas.map((p) => (p.fimEm === null ? { ...p, fimEm: Math.max(ref, p.inicioEm) } : p));
}

// ---------------------------------------------------------------------------
// Ler (o que a tela mostra)
// ---------------------------------------------------------------------------

export interface FaseLida extends FaseDoIntervalado {
  decorridoNaFaseMs: number;
  restanteNaFaseMs: number;
}

export interface Volta {
  numero: number;
  duracaoMs: number;
  /** Tempo total no momento da volta. */
  decorridoMs: number;
}

export interface LeituraDoCronometro {
  /** O estado verdadeiro em `agora` (um regressivo cujo tempo passou já está terminado). */
  estado: EstadoDoCronometro;
  modo: ModoDoCronometro;
  finalidade: FinalidadeDoCronometro;
  /** Posição na linha do tempo, em ms: tempo ativo + fases puladas. */
  decorridoMs: number;
  /** Nulo no livre. */
  totalMs: number | null;
  restanteMs: number | null;
  /**
   * O número grande, em segundos: regressivo = restante (para cima, mostra
   * 0:01 até o último milésimo); intervalado = restante da fase; livre = decorrido (para baixo).
   */
  segundosNaTela: Segundos;
  /** 0 a 1, do anel ou da barra: regressivo = do total; intervalado = da fase; livre = 0. */
  progresso: number;
  /** Nos últimos 10 s do regressivo ou da fase (anel `atencao`). */
  acabando: boolean;
  fase: FaseLida | null;
  proximaFase: FaseDoIntervalado | null;
  rodadasCompletas: number;
  voltas: Volta[];
  /** Livre: tempo desde a última volta. */
  voltaAtualMs: number;
  comoTerminou: ComoTerminou | null;
}

export function ler(c: Cronometro, agora: InstanteMs): LeituraDoCronometro {
  const atual = atualizar(c, agora);
  const ref = atual.estado === 'terminado' && atual.fimEm !== null ? atual.fimEm : agoraSeguro(atual, agora);
  const total = totalMs(atual);
  const decorrido = total === null ? decorridoBrutoMs(atual, ref) : Math.min(total, decorridoBrutoMs(atual, ref));
  const restante = total === null ? null : Math.max(0, total - decorrido);
  const terminado = atual.estado === 'terminado';

  let fase: FaseLida | null = null;
  let proximaFase: FaseDoIntervalado | null = null;
  let rodadasCompletas = 0;
  let segundosNaTela: Segundos;
  let progresso = 0;
  let restanteQueConta = restante;

  const conf = atual.configuracao;
  if (conf.modo === 'intervalado') {
    const fases = montarFases(conf);
    const f = faseEm(fases, decorrido);
    const decorridoNaFase = Math.min(f.duracaoMs, Math.max(0, decorrido - f.inicioMs));
    fase = { ...f, decorridoNaFaseMs: decorridoNaFase, restanteNaFaseMs: f.duracaoMs - decorridoNaFase };
    const indice = fases.indexOf(f);
    proximaFase = terminado ? null : fases[indice + 1] ?? null;
    rodadasCompletas = fases.filter((x) => x.tipo === 'trabalho' && x.inicioMs + x.duracaoMs <= decorrido).length;
    restanteQueConta = terminado ? 0 : fase.restanteNaFaseMs;
    progresso = terminado ? 1 : decorridoNaFase / f.duracaoMs;
  } else if (conf.modo === 'regressivo' && total !== null) {
    progresso = total === 0 ? 1 : decorrido / total;
  }

  if (conf.modo === 'livre') {
    segundosNaTela = Math.floor(decorrido / MS_POR_SEGUNDO);
  } else {
    segundosNaTela = Math.ceil((restanteQueConta ?? 0) / MS_POR_SEGUNDO);
  }

  const voltas: Volta[] = atual.voltasMs.map((ms, i) => ({
    numero: i + 1,
    duracaoMs: ms - (i === 0 ? 0 : atual.voltasMs[i - 1]),
    decorridoMs: ms,
  }));
  const ultimaVolta = atual.voltasMs.length > 0 ? atual.voltasMs[atual.voltasMs.length - 1] : 0;

  return {
    estado: atual.estado,
    modo: conf.modo,
    finalidade: atual.finalidade,
    decorridoMs: decorrido,
    totalMs: total,
    restanteMs: restante,
    segundosNaTela,
    progresso,
    acabando: !terminado && restanteQueConta !== null && conf.modo !== 'livre' && restanteQueConta <= SEGUNDOS_ACABANDO * MS_POR_SEGUNDO,
    fase,
    proximaFase,
    rodadasCompletas,
    voltas,
    voltaAtualMs: decorrido - ultimaVolta,
    comoTerminou: atual.comoTerminou,
  };
}

/** A fase que contém a posição (intervalo [início, fim)); depois do fim, a última. */
function faseEm(fases: FaseDoIntervalado[], posicaoMs: number): FaseDoIntervalado {
  for (const f of fases) {
    if (posicaoMs < f.inicioMs + f.duracaoMs) {
      return f;
    }
  }
  return fases[fases.length - 1];
}

// ---------------------------------------------------------------------------
// Avisos: o que agendar como notificação local (R9.11)
// ---------------------------------------------------------------------------

export type TipoDeAvisoDoCronometro = 'fim' | 'inicio_trabalho' | 'inicio_descanso';

/**
 * O nome do aviso na tabela de avisos (`03-arquitetura/03-DECISOES-TECNICAS.md`,
 * seção 3, e `avisos.ts`), que dá o texto e a chave da tela Avisos. A troca de
 * fase do intervalado entra em `fim_do_cronometro` (linha 3 da tabela), com o
 * texto da fase; o `tipo` do aviso diz qual é.
 */
export type AvisoNaTabela = 'fim_do_descanso' | 'fim_do_cronometro';

export interface AvisoDoCronometro {
  tipo: TipoDeAvisoDoCronometro;
  avisoDaTabela: AvisoNaTabela;
  /** Instante exato do aviso (gatilho por data da notificação local). */
  instanteEm: InstanteMs;
  /** Daqui a quantos segundos, arredondado para cima (gatilho por intervalo). */
  emSegundos: Segundos;
  /** Rodada da fase que começa (intervalado); 0 no regressivo. */
  rodada: number;
}

/**
 * Os próximos avisos, em ordem, a partir de `agora`. Só com o cronômetro
 * rodando: pausado, parado, terminado e livre não têm nada agendado (o app
 * cancela o que tinha). Cada mudança (pausar, retomar, ±30 s, pular) muda a
 * lista: o app cancela os agendados e agenda esta de novo.
 */
export function proximosAvisos(c: Cronometro, agora: InstanteMs, limite = LIMITE_DE_AVISOS_AGENDADOS): AvisoDoCronometro[] {
  const atual = atualizar(c, agora);
  if (atual.estado !== 'rodando' || atual.configuracao.modo === 'livre' || limite <= 0) {
    return [];
  }
  const ref = agoraSeguro(atual, agora);
  const decorrido = decorridoBrutoMs(atual, ref);
  const total = totalMs(atual) ?? 0;
  const aviso = (tipo: TipoDeAvisoDoCronometro, posicaoMs: number, rodada: number): AvisoDoCronometro => {
    const instanteEm = ref + (posicaoMs - decorrido);
    return {
      tipo,
      avisoDaTabela: tipo === 'fim' ? avisoDeFim(atual.finalidade) : 'fim_do_cronometro',
      instanteEm,
      emSegundos: Math.ceil((instanteEm - ref) / MS_POR_SEGUNDO),
      rodada,
    };
  };

  const avisos: AvisoDoCronometro[] = [];
  if (atual.configuracao.modo === 'intervalado') {
    for (const f of montarFases(atual.configuracao)) {
      if (f.inicioMs > decorrido && f.tipo !== 'preparacao') {
        avisos.push(aviso(f.tipo === 'trabalho' ? 'inicio_trabalho' : 'inicio_descanso', f.inicioMs, f.rodada));
      }
    }
  }
  const fim = aviso('fim', total, 0);
  // Revisão T (T3): cortar no limite tirava o aviso do FIM de um intervalado
  // longo (99 rodadas = 197 avisos); com o app fechado, nada reagenda. O fim
  // fica sempre na última vaga (com uma vaga só, vale o próximo aviso).
  if (avisos.length + 1 > limite && limite >= 2) {
    return [...avisos.slice(0, limite - 1), fim];
  }
  avisos.push(fim);
  return avisos.slice(0, limite);
}

/** O primeiro de `proximosAvisos`, ou nulo. */
export function proximoAviso(c: Cronometro, agora: InstanteMs): AvisoDoCronometro | null {
  return proximosAvisos(c, agora, 1)[0] ?? null;
}

function avisoDeFim(finalidade: FinalidadeDoCronometro): AvisoNaTabela {
  if (finalidade === 'descanso') {
    return 'fim_do_descanso';
  }
  return 'fim_do_cronometro';
}

// ---------------------------------------------------------------------------
// Um cronômetro por vez (R9.9)
// ---------------------------------------------------------------------------

/**
 * - `iniciar`: não há outro rodando ou pausado;
 * - `substituir`: troca sem perguntar (outra série marcada reinicia o descanso);
 * - `perguntar`: folha "Parar o [atual] e começar o novo?";
 * - `nao_iniciar`: o descanso não começa porque um cronômetro avulso está em uso; o toast oferece "Descansar".
 */
export type DecisaoAoIniciar = 'iniciar' | 'substituir' | 'perguntar' | 'nao_iniciar';

export function decidirAoIniciar(
  atual: Cronometro | null,
  nova: FinalidadeDoCronometro,
  agora: InstanteMs,
): DecisaoAoIniciar {
  if (atual === null) {
    return 'iniciar';
  }
  const estado = atualizar(atual, agora).estado;
  if (estado !== 'rodando' && estado !== 'pausado') {
    return 'iniciar';
  }
  if (nova === 'descanso') {
    return atual.finalidade === 'descanso' ? 'substituir' : 'nao_iniciar';
  }
  return 'perguntar';
}

// ---------------------------------------------------------------------------
// Formatar
// ---------------------------------------------------------------------------

/**
 * O número grande do cronômetro: `m:ss` abaixo de 1 h, `h:mm:ss` acima, sem
 * zero à esquerda nos minutos (componente 7: "1:30", "0:45"). Diferente de
 * `formatarTempo` (`unidades.ts`, "01:30"), que serve às listas e ao histórico.
 */
export function formatarCronometro(segundos: Segundos): string {
  exigirInteiro('segundos', segundos, 0, Number.MAX_SAFE_INTEGER);
  const horas = Math.floor(segundos / SEGUNDOS_POR_HORA);
  const minutos = Math.floor((segundos % SEGUNDOS_POR_HORA) / SEGUNDOS_POR_MINUTO);
  const resto = String(segundos % SEGUNDOS_POR_MINUTO).padStart(2, '0');
  return horas > 0 ? `${horas}:${String(minutos).padStart(2, '0')}:${resto}` : `${minutos}:${resto}`;
}

function exigirInteiro(nome: string, valor: number, minimo: number, maximo: number): void {
  if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
    throw new RangeError(`${nome} precisa ser inteiro de ${minimo} a ${maximo}; veio ${String(valor)}`);
  }
}


// ---------------------------------------------------------------------------
// Voltar do armazenamento do telefone (R9.4)
// ---------------------------------------------------------------------------

const ESTADOS: readonly EstadoDoCronometro[] = ['parado', 'rodando', 'pausado', 'terminado'];
const FINALIDADES: readonly FinalidadeDoCronometro[] = ['avulso', 'descanso'];
const COMO_TERMINOU: readonly ComoTerminou[] = ['completou', 'pulou', 'parou'];

const ehInstante = (x: unknown): x is InstanteMs => typeof x === 'number' && Number.isFinite(x);
const ehInstanteOuNulo = (x: unknown): x is InstanteMs | null => x === null || ehInstante(x);
const ehObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Revisão T (F1): o estado vai para o armazenamento do telefone a cada toque e
 * volta quando o app reabre. O que volta é dado de FORA (versão antiga do app,
 * arquivo corrompido, edição à mão): antes, um `rodadas: 0` fazia `faseEm`
 * devolver `undefined` e a tela quebrar. Devolve um cronômetro válido ou `null`
 * (o app descarta e mostra o cronômetro zerado). Nunca lança.
 *
 * Aceita o estado gravado antes da revisão T, sem `ultimoToqueEm`.
 */
export function restaurarCronometro(salvo: unknown): Cronometro | null {
  if (!ehObjeto(salvo) || !ehObjeto(salvo.configuracao)) return null;
  const s = salvo;
  const finalidade = s.finalidade as FinalidadeDoCronometro;
  const estado = s.estado as EstadoDoCronometro;
  if (!FINALIDADES.includes(finalidade) || !ESTADOS.includes(estado)) return null;

  let configuracao: ConfiguracaoDoCronometro;
  try {
    const conf = s.configuracao as unknown as ConfiguracaoDoCronometro;
    validarConfiguracao(conf);
    if (finalidade !== 'avulso' && conf.modo !== 'regressivo') return null;
    configuracao =
      conf.modo === 'livre'
        ? { modo: 'livre' }
        : conf.modo === 'regressivo'
          ? { modo: 'regressivo', duracaoSegundos: conf.duracaoSegundos }
          : {
              modo: 'intervalado',
              preparacaoSegundos: conf.preparacaoSegundos,
              trabalhoSegundos: conf.trabalhoSegundos,
              descansoSegundos: conf.descansoSegundos,
              rodadas: conf.rodadas,
            };
  } catch {
    return null;
  }

  const { inicioEm, fimEm, ajusteMs } = s;
  const ultimoToqueEm = s.ultimoToqueEm === undefined ? null : s.ultimoToqueEm;
  const comoTerminou = s.comoTerminou ?? null;
  if (!ehInstanteOuNulo(inicioEm) || !ehInstanteOuNulo(fimEm) || !ehInstanteOuNulo(ultimoToqueEm)) return null;
  if (typeof ajusteMs !== 'number' || !Number.isFinite(ajusteMs)) return null;
  if (comoTerminou !== null && !COMO_TERMINOU.includes(comoTerminou as ComoTerminou)) return null;

  if (!Array.isArray(s.pausas) || !Array.isArray(s.saltos) || !Array.isArray(s.voltasMs)) return null;
  const pausas: Pausa[] = [];
  for (const p of s.pausas) {
    if (!ehObjeto(p) || !ehInstante(p.inicioEm) || !ehInstanteOuNulo(p.fimEm)) return null;
    if (p.fimEm !== null && p.fimEm < p.inicioEm) return null;
    pausas.push({ inicioEm: p.inicioEm, fimEm: p.fimEm });
  }
  const saltos: Salto[] = [];
  for (const x of s.saltos) {
    if (!ehObjeto(x) || !ehInstante(x.posicaoMs) || !ehInstante(x.duracaoMs) || x.posicaoMs < 0 || x.duracaoMs < 0) return null;
    saltos.push({ posicaoMs: x.posicaoMs, duracaoMs: x.duracaoMs });
  }
  const voltasMs: number[] = [];
  for (const v of s.voltasMs) {
    if (!ehInstante(v) || v < 0 || (voltasMs.length > 0 && v < voltasMs[voltasMs.length - 1])) return null;
    voltasMs.push(v);
  }

  // Coerência entre o estado e os instantes.
  const pausasAbertas = pausas.filter((p) => p.fimEm === null).length;
  if (estado === 'parado' && inicioEm !== null) return null;
  if ((estado === 'rodando' || estado === 'pausado') && inicioEm === null) return null;
  if (estado === 'rodando' && pausasAbertas !== 0) return null;
  if (estado === 'pausado' && pausasAbertas !== 1) return null;
  if (estado === 'terminado' && (fimEm === null || comoTerminou === null)) return null;
  if (estado !== 'terminado' && (fimEm !== null || comoTerminou !== null)) return null;

  return {
    finalidade,
    configuracao,
    estado,
    inicioEm,
    pausas,
    ajusteMs,
    saltos,
    voltasMs,
    fimEm,
    comoTerminou: comoTerminou as ComoTerminou | null,
    ultimoToqueEm,
  };
}
