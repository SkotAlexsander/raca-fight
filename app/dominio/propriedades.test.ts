/**
 * Propriedades (revisão T, 11/10/2026): muitos casos gerados por um gerador
 * simples com SEMENTE FIXA, sem biblioteca. A mesma semente dá sempre os
 * mesmos casos: se um falhar, a mensagem traz a semente e o caso, e ele se
 * repete igual na próxima rodada.
 *
 * O que se confere:
 * - formatar e depois ler devolve o mesmo valor (data, tempo, número, carga);
 * - nenhuma duração é negativa (treino e cronômetro), com qualquer sequência
 *   de toques e com o relógio do telefone indo e voltando;
 * - o cronômetro nunca anda para trás entre dois toques, e o estado salvo
 *   volta igual (`restaurarCronometro`);
 * - nenhuma função muda o objeto que recebeu.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatarData,
  formatarNumero,
  formatarTempo,
  lerDataBrasileira,
  lerNumero,
  minutosSegundosParaSegundos,
  quilosParaGramas,
  segundosParaMinutosSegundos,
} from './unidades.ts';
import {
  type Cronometro,
  ajustar,
  alternar,
  criarCronometro,
  encerrar,
  iniciar,
  ler,
  marcarVolta,
  pausar,
  proximosAvisos,
  pularFase,
  restaurarCronometro,
  retomar,
} from './cronometro.ts';
import { criarCronometroDeRounds, lerRound, posicaoDoRound, sinaisEntrePosicoes } from './rounds/rounds.ts';

// ---------------------------------------------------------------------------
// Gerador com semente (mulberry32): 32 bits, rápido, sem dependência.
// ---------------------------------------------------------------------------

function gerador(semente: number) {
  let a = semente >>> 0;
  const proximo = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** Inteiro de `min` a `max`, inclusive. */
    inteiro: (min: number, max: number): number => min + Math.floor(proximo() * (max - min + 1)),
    escolher: <T>(lista: readonly T[]): T => lista[Math.floor(proximo() * lista.length)],
    chance: (p: number): boolean => proximo() < p,
  };
}

const SEMENTE = 20261011;
const CASOS = 500;

const dois = (n: number) => String(n).padStart(2, '0');
const congelar = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

// ---------------------------------------------------------------------------
describe('propriedades — formatar e ler devolve o mesmo valor', () => {
  test('data: AAAA-MM-DD → DD/MM/AAAA → AAAA-MM-DD, inclusive 29/02 e viradas de mês e ano', () => {
    const g = gerador(SEMENTE);
    for (let i = 0; i < CASOS; i += 1) {
      const ano = g.inteiro(1900, 2100);
      const mes = g.inteiro(1, 12);
      const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
      const dia = g.chance(0.3) ? ultimo : g.inteiro(1, ultimo);
      const iso = `${ano}-${dois(mes)}-${dois(dia)}`;
      assert.equal(lerDataBrasileira(formatarData(iso)), iso, `semente ${SEMENTE}, caso ${i}: ${iso}`);
    }
  });

  test('tempo: segundos → "mm:ss" ou "h:mm:ss" → segundos', () => {
    const g = gerador(SEMENTE + 1);
    for (let i = 0; i < CASOS; i += 1) {
      const s = g.chance(0.2) ? g.escolher([0, 59, 60, 3599, 3600, 3601, 86399, 86400]) : g.inteiro(0, 200000);
      assert.equal(minutosSegundosParaSegundos(formatarTempo(s)), s, `caso ${i}: ${s}`);
      assert.equal(minutosSegundosParaSegundos(segundosParaMinutosSegundos(s)) >= 0, true);
    }
  });

  test('número: formatar com 1 casa e ler (vírgula ou ponto) dá o número arredondado; peso em gramas volta igual', () => {
    const g = gerador(SEMENTE + 2);
    for (let i = 0; i < CASOS; i += 1) {
      const decimos = g.inteiro(0, 99999);
      const valor = decimos / 10;
      const texto = formatarNumero(valor, 1, false);
      assert.equal(lerNumero(texto), valor, `caso ${i}: ${valor} → "${texto}"`);
      assert.equal(lerNumero(texto.replace(',', '.')), valor);
      // peso: gramas em passos de 100 g → "x,y" → gramas
      const gramas = decimos * 100;
      const kg = formatarNumero(gramas / 1000, 1, false);
      assert.equal(quilosParaGramas(lerNumero(kg)), gramas, `caso ${i}: ${gramas} g → "${kg}"`);
    }
  });
});

// ---------------------------------------------------------------------------
describe('propriedades — cronômetro com toques e relógio aleatórios', () => {
  const T0 = Date.UTC(2026, 9, 11, 13, 0, 0);

  function novo(g: ReturnType<typeof gerador>): Cronometro {
    const modo = g.escolher(['livre', 'regressivo', 'intervalado'] as const);
    if (modo === 'livre') return criarCronometro({ modo });
    if (modo === 'regressivo') return criarCronometro({ modo, duracaoSegundos: g.inteiro(1, 600) });
    return criarCronometro({
      modo,
      preparacaoSegundos: g.inteiro(0, 15),
      trabalhoSegundos: g.inteiro(1, 60),
      descansoSegundos: g.inteiro(0, 30),
      rodadas: g.inteiro(1, 12),
    });
  }

  test('nenhum tempo negativo, nada para trás entre toques, JSON volta igual, o recebido nunca muda', () => {
    const g = gerador(SEMENTE + 4);
    for (let i = 0; i < 300; i += 1) {
      let c = novo(g);
      let relogio = T0;
      let decorridoNoUltimoToque = 0;
      for (let passo = 0; passo < 40; passo += 1) {
        // o relógio anda quase sempre para a frente; às vezes volta (ajuste à mão)
        relogio += g.chance(0.15) ? -g.inteiro(0, 60000) : g.inteiro(0, 20000);
        const antes = congelar(c);
        const recebido = congelar(c);
        const acao = g.escolher(['alternar', 'iniciar', 'pausar', 'retomar', 'ajustar', 'pular', 'volta', 'ler', 'parar'] as const);
        if (acao === 'alternar') c = alternar(c, relogio);
        else if (acao === 'iniciar') c = iniciar(c, relogio);
        else if (acao === 'pausar') c = pausar(c, relogio);
        else if (acao === 'retomar') c = retomar(c, relogio);
        else if (acao === 'ajustar' && c.configuracao.modo === 'regressivo') c = ajustar(c, g.escolher([-30, 30]), relogio);
        else if (acao === 'pular' && c.configuracao.modo !== 'livre') c = pularFase(c, relogio);
        else if (acao === 'volta' && c.configuracao.modo === 'livre') c = marcarVolta(c, relogio);
        else if (acao === 'parar' && g.chance(0.1)) c = encerrar(c, relogio);
        assert.deepEqual(recebido, antes, `caso ${i}, passo ${passo}: ${acao} mudou o recebido`);

        const leitura = ler(c, relogio);
        const ctx = `caso ${i}, passo ${passo} (${acao}, ${c.configuracao.modo}, ${leitura.estado})`;
        assert.ok(leitura.decorridoMs >= 0, ctx);
        assert.ok(leitura.restanteMs === null || leitura.restanteMs >= 0, ctx);
        assert.ok(leitura.segundosNaTela >= 0, ctx);
        assert.ok(leitura.progresso >= 0 && leitura.progresso <= 1, `${ctx}: progresso ${leitura.progresso}`);
        assert.ok(leitura.voltaAtualMs >= 0, ctx);
        assert.ok(leitura.voltas.every((v) => v.duracaoMs >= 0), ctx);
        assert.ok(c.pausas.every((p) => p.fimEm === null || p.fimEm >= p.inicioEm), ctx);
        // Depois de um toque gravado, a leitura nunca fica antes do que o último toque
        // gravado viu (R9.4). Leitura solta não é gravada: entre dois toques, quem
        // segura o número na tela é a tela (ver `ultimoToqueEm`).
        if (c.ultimoToqueEm !== antes.ultimoToqueEm) {
          assert.ok(leitura.decorridoMs >= decorridoNoUltimoToque || leitura.estado === 'parado', `${ctx}: ${leitura.decorridoMs} < ${decorridoNoUltimoToque}`);
          decorridoNoUltimoToque = leitura.estado === 'parado' ? 0 : leitura.decorridoMs;
        }
        for (const aviso of proximosAvisos(c, relogio)) {
          assert.ok(aviso.emSegundos >= 0, `${ctx}: aviso em ${aviso.emSegundos} s`);
        }
        assert.deepEqual(restaurarCronometro(congelar(c)), c, `${ctx}: o JSON não voltou igual`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
describe('propriedades — cronômetro de rounds (R17)', () => {
  test('o round nunca passa do total, os sinais saem em ordem e nenhum sinal toca duas vezes', () => {
    const g = gerador(SEMENTE + 5);
    const T0 = Date.UTC(2026, 9, 15, 23, 0, 0);
    for (let i = 0; i < 150; i += 1) {
      const tempos = { preparacaoSegundos: g.inteiro(0, 15), trabalhoSegundos: g.inteiro(30, 300), descansoSegundos: g.inteiro(0, 60), rodadas: g.inteiro(1, 6) };
      let c = iniciar(criarCronometroDeRounds(tempos), T0);
      let antes = T0;
      let posicao = -1;
      const tocados: string[] = [];
      for (let passo = 0; passo < 30; passo += 1) {
        const agora = antes + g.inteiro(0, 40000);
        // a tela lê ANTES do toque; o toque (pausar/retomar) não muda a posição
        const nova = posicaoDoRound(c, agora);
        tocados.push(...sinaisEntrePosicoes(tempos, posicao, nova, true));
        posicao = nova;
        if (g.chance(0.1)) c = alternar(c, agora);
        const l = lerRound(c, agora);
        assert.ok(l.round >= 0 && l.round <= tempos.rodadas, `caso ${i}`);
        assert.ok(l.segundos >= 0 && l.progresso >= 0 && l.progresso <= 1, `caso ${i}`);
        antes = agora;
      }
      // cada round toca, em ordem, gongo → (10 s) → gongo, uma vez só
      const esperado: string[] = [];
      for (let r = 0; r < tempos.rodadas; r += 1) esperado.push('gongo_inicio', ...(tempos.trabalhoSegundos >= 60 ? ['aviso_10s'] : []), 'gongo_fim');
      assert.deepEqual(tocados, esperado.slice(0, tocados.length), `caso ${i}: ${tocados.join(',')}`);
    }
  });
});
