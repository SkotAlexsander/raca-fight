/**
 * Sistemas de graduação como DADO (R16.1, R16.2): a régua não é código.
 *
 * Prontos na primeira versão (a pesquisa está em
 * `01-especificacao/luta/02-MODALIDADES-E-GRADUACAO.md`):
 * - **IBJJF adulto** (General System of Graduation, junho de 2026): faixas,
 *   graus, idade e tempo mínimos da FEDERAÇÃO. A IBJJF não exige número de
 *   aulas: presença mínima é sempre da academia (R16.3), e aqui fica vazia.
 * - **IBJJF kids**: as 13 faixas de 4 a 15 anos, sem tempo mínimo. O modelo de
 *   graus (trimestral, quadrimestral ou mensal) é [decidir] L5 e chega por
 *   parâmetro, sem padrão.
 *
 * "A configurar" (a academia monta com o professor):
 * - **Muay Thai** (L3): não há régua única no Brasil; a palavra (kruang ou
 *   prajied) também é [decidir] e chega por parâmetro.
 * - **Luta Livre** (L4): o modelo publicado fica em `MODELO_LUTA_LIVRE_A_CONFIRMAR`,
 *   só como sugestão para o Admin; o sistema nasce sem níveis.
 *
 * Boxe e MMA não têm sistema: não mostram faixa em lugar nenhum (R16.1, R16.9).
 */
import type { Id } from '../tipos.ts';
import type { ChaveDaModalidade } from '../modalidades/modalidades.ts';

export type PublicoDoSistema = 'adulto' | 'kids';
export type ContagemDaIdade = 'ano_civil' | 'aniversario';
export type OrigemDoMinimo = 'federacao' | 'academia';

export interface MinimoDeMeses {
  meses: number;
  origem: OrigemDoMinimo;
}

export interface NivelDeGraduacao {
  id: Id;
  /** "branca", "cinza e branca", "amarelo". A palavra do sistema vem antes ("Faixa branca"). */
  nome: string;
  /** De 1 a 3 cores, para desenhar a faixa ou o cordão (R16.2). */
  cores: string[];
  idadeMinima?: number;
  idadeMaxima?: number;
  /** Tempo mínimo NESTE nível antes de passar ao próximo. */
  mesesMinimos?: MinimoDeMeses;
  /** Presenças mínimas desde a última graduação para passar ao próximo nível (sempre da academia, L19). */
  presencasMinimas?: number;
  grausMaximos: number;
  /** Entre um grau e outro (R16.2). `mesesPorGrau[i]` vale para chegar ao grau i+1. */
  regraDosGraus?: { mesesPorGrau?: number[]; presencasPorGrau?: number; origem: OrigemDoMinimo };
  exigeExame?: boolean;
}

export interface SistemaDeGraduacao {
  id: Id;
  /** A modalidade do cadastro da academia (preenchida ao associar). */
  modalidadeId: Id | null;
  modalidadeChave: ChaveDaModalidade;
  publico: PublicoDoSistema;
  nome: string;
  /** "Faixa", "Kruang", "Prajied", "Nível". */
  palavraDoNivel: string;
  /** "Grau" ou nenhuma. */
  palavraDoGrau: string | null;
  contagemDaIdade: ContagemDaIdade;
  origem: 'modelo' | 'academia';
  /** A régua ainda não foi confirmada pela academia: a tela diz "régua a confirmar". */
  aConfigurar: boolean;
  niveis: NivelDeGraduacao[];
}

const meses = (n: number, origem: OrigemDoMinimo = 'federacao'): MinimoDeMeses => ({ meses: n, origem });

/** IBJJF, faixas a partir de 16 anos (Art. 1.2, 2.1.2, 3.1, 4.1.5). */
export function sistemaIbjjfAdulto(modalidadeId: Id | null = null): SistemaDeGraduacao {
  return {
    id: 'ibjjf-adulto',
    modalidadeId,
    modalidadeChave: 'jiu_jitsu',
    publico: 'adulto',
    nome: 'Jiu-Jitsu — IBJJF adulto (junho de 2026)',
    palavraDoNivel: 'Faixa',
    palavraDoGrau: 'grau',
    contagemDaIdade: 'ano_civil',
    origem: 'modelo',
    aConfigurar: false,
    niveis: [
      { id: 'branca', nome: 'branca', cores: ['#F5F5F5'], grausMaximos: 4 },
      { id: 'azul', nome: 'azul', cores: ['#1F4FA8'], idadeMinima: 16, mesesMinimos: meses(24), grausMaximos: 4 },
      { id: 'roxa', nome: 'roxa', cores: ['#6B2FA0'], idadeMinima: 16, mesesMinimos: meses(18), grausMaximos: 4 },
      { id: 'marrom', nome: 'marrom', cores: ['#6B3E1E'], idadeMinima: 18, mesesMinimos: meses(12), grausMaximos: 4 },
      // na preta os graus têm tempo fixo: 1º a 3º com 3 anos cada; 4º a 6º com 5 anos cada (Art. 4.1.5)
      { id: 'preta', nome: 'preta', cores: ['#1C1C1C'], idadeMinima: 19, mesesMinimos: meses(31 * 12), grausMaximos: 6, regraDosGraus: { mesesPorGrau: [36, 36, 36, 60, 60, 60], origem: 'federacao' } },
      { id: 'vermelha-e-preta', nome: 'vermelha e preta', cores: ['#C42024', '#1C1C1C'], idadeMinima: 49, mesesMinimos: meses(7 * 12), grausMaximos: 0 },
      { id: 'vermelha-e-branca', nome: 'vermelha e branca', cores: ['#C42024', '#F5F5F5'], idadeMinima: 56, mesesMinimos: meses(10 * 12), grausMaximos: 0 },
      { id: 'vermelha', nome: 'vermelha', cores: ['#C42024'], idadeMinima: 66, grausMaximos: 0 },
    ],
  };
}

/** [decidir] L5: o modelo de graus do Jiu-Jitsu Kids. `null` = a academia ainda não disse (o sistema fica "a configurar"). */
export type ModeloDeGrausKids = 'trimestral' | 'quadrimestral' | 'mensal';

/** Quantos graus por faixa em cada modelo do Anexo I da IBJJF. */
export const GRAUS_POR_MODELO_KIDS: Readonly<Record<ModeloDeGrausKids, number>> = { trimestral: 3, quadrimestral: 2, mensal: 11 };

/** IBJJF, faixas de 4 a 15 anos (Art. 1.1, 2.1.1, 3.1.1, Anexo I). Sem tempo mínimo. */
export function sistemaIbjjfKids(modeloDeGraus: ModeloDeGrausKids | null, modalidadeId: Id | null = null): SistemaDeGraduacao {
  const graus = modeloDeGraus ? GRAUS_POR_MODELO_KIDS[modeloDeGraus] : 0;
  const n = (id: string, nome: string, cores: string[], idadeMinima?: number): NivelDeGraduacao => ({ id, nome, cores, ...(idadeMinima ? { idadeMinima } : {}), idadeMaxima: 15, grausMaximos: graus });
  const CINZA = '#8A8A8A';
  const AMARELA = '#F2C230';
  const LARANJA = '#E8742A';
  const VERDE = '#2E8B3E';
  const BRANCA = '#F5F5F5';
  const PRETA = '#1C1C1C';
  return {
    id: 'ibjjf-kids',
    modalidadeId,
    modalidadeChave: 'jiu_jitsu',
    publico: 'kids',
    nome: 'Jiu-Jitsu — IBJJF kids (4 a 15 anos)',
    palavraDoNivel: 'Faixa',
    palavraDoGrau: 'grau',
    contagemDaIdade: 'ano_civil',
    origem: 'modelo',
    aConfigurar: modeloDeGraus === null,
    niveis: [
      { id: 'branca', nome: 'branca', cores: [BRANCA], grausMaximos: graus },
      n('cinza-e-branca', 'cinza e branca', [CINZA, BRANCA], 4),
      n('cinza', 'cinza', [CINZA], 4),
      n('cinza-e-preta', 'cinza e preta', [CINZA, PRETA], 4),
      n('amarela-e-branca', 'amarela e branca', [AMARELA, BRANCA], 7),
      n('amarela', 'amarela', [AMARELA], 7),
      n('amarela-e-preta', 'amarela e preta', [AMARELA, PRETA], 7),
      n('laranja-e-branca', 'laranja e branca', [LARANJA, BRANCA], 10),
      n('laranja', 'laranja', [LARANJA], 10),
      n('laranja-e-preta', 'laranja e preta', [LARANJA, PRETA], 10),
      n('verde-e-branca', 'verde e branca', [VERDE, BRANCA], 13),
      n('verde', 'verde', [VERDE], 13),
      n('verde-e-preta', 'verde e preta', [VERDE, PRETA], 13),
    ],
  };
}

/**
 * Muay Thai: régua A CONFIGURAR (L3). Nasce sem níveis; a academia preenche no
 * Admin com o professor. A palavra (kruang ou prajied) chega por parâmetro.
 */
export function sistemaMuayThaiAConfigurar(palavra: string, publico: PublicoDoSistema = 'adulto', modalidadeId: Id | null = null, niveis: NivelDeGraduacao[] = []): SistemaDeGraduacao {
  return {
    id: `muay-thai-${publico}`,
    modalidadeId,
    modalidadeChave: 'muay_thai',
    publico,
    nome: `Muay Thai — ${palavra.toLowerCase()} da academia`,
    palavraDoNivel: palavra,
    palavraDoGrau: null,
    contagemDaIdade: 'aniversario',
    origem: 'academia',
    aConfigurar: true,
    niveis,
  };
}

/** Luta Livre: régua A CONFIGURAR (L4). */
export function sistemaLutaLivreAConfigurar(modalidadeId: Id | null = null, niveis: NivelDeGraduacao[] = []): SistemaDeGraduacao {
  return {
    id: 'luta-livre-adulto',
    modalidadeId,
    modalidadeChave: 'luta_livre',
    publico: 'adulto',
    nome: 'Luta Livre — da academia',
    palavraDoNivel: 'Faixa',
    palavraDoGrau: 'grau',
    contagemDaIdade: 'aniversario',
    origem: 'academia',
    aConfigurar: true,
    niveis,
  };
}

/**
 * O modelo publicado de Luta Livre Esportiva (Wikipédia, consultada em
 * 15/10/2026; sem o regulamento da CBLLE). SÓ SUGESTÃO para o Admin oferecer
 * ao professor; nunca entra sozinho.
 */
export const MODELO_LUTA_LIVRE_A_CONFIRMAR: readonly string[] = ['branca', 'amarela', 'laranja', 'azul', 'roxa', 'marrom', 'preta', 'vermelha e branca'];
