import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  type Cronometro,
  AJUSTE_SEGUNDOS,
  SEGUNDOS_ACABANDO,
  MAXIMO_REGRESSIVO_SEGUNDOS,
  LIMITE_DE_AVISOS_AGENDADOS,
  PREDEFINICOES,
  ATALHOS_REGRESSIVO_SEGUNDOS,
  criarCronometro,
  criarDescanso,
  iniciar,
  pausar,
  retomar,
  alternar,
  ajustar,
  pularFase,
  marcarVolta,
  encerrar,
  zerar,
  atualizar,
  ler,
  montarFases,
  duracaoTotalSegundos,
  proximoAviso,
  proximosAvisos,
  decidirAoIniciar,
  formatarCronometro,
} from './cronometro.ts';

/** Um instante qualquer (10/10/2026 15:00 em Brasília), em ms desde 1970. */
const T0 = Date.UTC(2026, 9, 10, 18, 0, 0);
/** `s` segundos depois de T0. */
const t = (s: number) => T0 + Math.round(s * 1000);

const tabata = () => criarCronometro({ modo: 'intervalado', ...PREDEFINICOES.tabata.configuracao });

// ---------------------------------------------------------------------------
describe('criar: nasce parado e valida a configuração', () => {
  test('os três modos nascem parados, sem instante de início', () => {
    for (const c of [
      criarCronometro({ modo: 'livre' }),
      criarCronometro({ modo: 'regressivo', duracaoSegundos: 300 }),
      tabata(),
    ]) {
      assert.equal(c.estado, 'parado');
      assert.equal(c.inicioEm, null);
      assert.deepEqual(c.pausas, []);
      assert.equal(c.finalidade, 'avulso');
    }
  });

  test('regressivo: inteiro de 1 s até 3 h', () => {
    assert.throws(() => criarCronometro({ modo: 'regressivo', duracaoSegundos: 0 }), RangeError);
    assert.throws(() => criarCronometro({ modo: 'regressivo', duracaoSegundos: 1.5 }), RangeError);
    assert.throws(() => criarCronometro({ modo: 'regressivo', duracaoSegundos: MAXIMO_REGRESSIVO_SEGUNDOS + 1 }), RangeError);
    assert.equal(MAXIMO_REGRESSIVO_SEGUNDOS, 3 * 3600);
  });

  test('intervalado: trabalho ≥ 1, descanso ≥ 0, rodadas de 1 a 99, preparação até 60', () => {
    const base = { modo: 'intervalado' as const, preparacaoSegundos: 10, trabalhoSegundos: 20, descansoSegundos: 10, rodadas: 8 };
    assert.throws(() => criarCronometro({ ...base, trabalhoSegundos: 0 }), RangeError);
    assert.throws(() => criarCronometro({ ...base, descansoSegundos: -1 }), RangeError);
    assert.throws(() => criarCronometro({ ...base, rodadas: 0 }), RangeError);
    assert.throws(() => criarCronometro({ ...base, rodadas: 100 }), RangeError);
    assert.throws(() => criarCronometro({ ...base, preparacaoSegundos: 61 }), RangeError);
    assert.doesNotThrow(() => criarCronometro({ ...base, descansoSegundos: 0, preparacaoSegundos: 0 }));
  });

  test('descanso entre séries é um regressivo com finalidade "descanso"; descanso 0 não cria cronômetro', () => {
    const d = criarDescanso(60);
    assert.ok(d);
    assert.equal(d.finalidade, 'descanso');
    assert.deepEqual(d.configuracao, { modo: 'regressivo', duracaoSegundos: 60 });
    assert.equal(criarDescanso(0), null);
  });

  test('predefinições do intervalado: Tabata 20/10 × 8, EMOM 10 min, HIIT 30/30 × 10 e 40/20 × 8', () => {
    assert.deepEqual(PREDEFINICOES.tabata.configuracao, { preparacaoSegundos: 10, trabalhoSegundos: 20, descansoSegundos: 10, rodadas: 8 });
    assert.deepEqual(PREDEFINICOES.emom10.configuracao, { preparacaoSegundos: 10, trabalhoSegundos: 60, descansoSegundos: 0, rodadas: 10 });
    assert.deepEqual(PREDEFINICOES.hiit30x30.configuracao, { preparacaoSegundos: 10, trabalhoSegundos: 30, descansoSegundos: 30, rodadas: 10 });
    assert.deepEqual(PREDEFINICOES.hiit40x20.configuracao, { preparacaoSegundos: 10, trabalhoSegundos: 40, descansoSegundos: 20, rodadas: 8 });
    // Tabata: 10 de preparação + 8 × 20 + 7 × 10 (sem descanso depois da última) = 4:00
    assert.equal(duracaoTotalSegundos(tabata().configuracao), 240);
    assert.equal(duracaoTotalSegundos({ modo: 'intervalado', ...PREDEFINICOES.emom10.configuracao }), 610);
    assert.deepEqual(ATALHOS_REGRESSIVO_SEGUNDOS, [60, 120, 180, 300, 600]);
  });
});

// ---------------------------------------------------------------------------
describe('regressivo e descanso: instante de início, nunca contador', () => {
  test('lê o restante pela diferença de instantes; o objeto não muda', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    const congelado = JSON.stringify(d);
    const l = ler(d, t(15.2));
    assert.equal(l.estado, 'rodando');
    assert.equal(l.decorridoMs, 15200);
    assert.equal(l.restanteMs, 44800);
    assert.equal(l.segundosNaTela, 45, 'arredonda para cima: mostra 0:45 até o último milésimo');
    assert.equal(l.totalMs, 60000);
    assert.ok(Math.abs(l.progresso - 15.2 / 60) < 1e-9);
    assert.equal(JSON.stringify(d), congelado);
  });

  test('telefone bloqueado 10 minutos sem nenhuma chamada no meio: termina na hora certa', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    const l = ler(d, t(600));
    assert.equal(l.estado, 'terminado');
    assert.equal(l.restanteMs, 0);
    assert.equal(l.segundosNaTela, 0);
    assert.equal(l.comoTerminou, 'completou');
    const fixo = atualizar(d, t(600));
    assert.equal(fixo.estado, 'terminado');
    assert.equal(fixo.fimEm, t(60), 'o fim é o instante em que o tempo acabou, não quando o app olhou');
  });

  test('no último décimo ainda é 0:01; no instante exato do fim é terminado', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    assert.equal(ler(d, t(59.9)).segundosNaTela, 1);
    assert.equal(ler(d, t(59.9)).estado, 'rodando');
    assert.equal(ler(d, t(60)).estado, 'terminado');
  });

  test('"acabando" nos últimos 10 s', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    assert.equal(SEGUNDOS_ACABANDO, 10);
    assert.equal(ler(d, t(49.9)).acabando, false);
    assert.equal(ler(d, t(50)).acabando, true);
    assert.equal(ler(d, t(60)).acabando, false, 'terminado não está acabando');
  });

  test('+30 s estende só este descanso', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    const mais = ajustar(d, +AJUSTE_SEGUNDOS, t(20));
    assert.equal(AJUSTE_SEGUNDOS, 30);
    assert.equal(ler(mais, t(20)).restanteMs, 70000);
    assert.equal(ler(mais, t(20)).totalMs, 90000);
    assert.deepEqual(mais.configuracao, { modo: 'regressivo', duracaoSegundos: 60 }, 'a configuração (o descanso da série) não muda');
    assert.equal(ler(mais, t(89)).estado, 'rodando');
    assert.equal(atualizar(mais, t(200)).fimEm, t(90));
  });

  test('−30 s encurta; se faltava menos de 30 s, termina na hora', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    const menos = ajustar(d, -AJUSTE_SEGUNDOS, t(10));
    assert.equal(ler(menos, t(10)).restanteMs, 20000);
    const acabou = ajustar(menos, -AJUSTE_SEGUNDOS, t(15));
    assert.equal(acabou.estado, 'terminado');
    assert.equal(acabou.fimEm, t(15));
    assert.equal(ler(acabou, t(15)).restanteMs, 0);
    assert.equal(ler(acabou, t(300)).decorridoMs, 15000, 'depois de terminado o tempo não anda');
  });

  test('ajuste antes de começar muda a duração inicial, nunca abaixo de 1 s nem acima de 3 h', () => {
    const d = ajustar(criarDescanso(60)!, +AJUSTE_SEGUNDOS, T0);
    assert.equal(ler(d, T0).segundosNaTela, 90);
    const curto = ajustar(ajustar(criarDescanso(20)!, -AJUSTE_SEGUNDOS, T0), -AJUSTE_SEGUNDOS, T0);
    assert.equal(curto.estado, 'parado');
    assert.equal(ler(curto, T0).totalMs, 1000);
    const longo = ajustar(criarCronometro({ modo: 'regressivo', duracaoSegundos: MAXIMO_REGRESSIVO_SEGUNDOS - 10 }), +AJUSTE_SEGUNDOS, T0);
    assert.equal(ler(longo, T0).totalMs, MAXIMO_REGRESSIVO_SEGUNDOS * 1000);
  });

  test('pular o descanso termina na hora, marcado como "pulou"', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    const p = pularFase(d, t(12));
    assert.equal(p.estado, 'terminado');
    assert.equal(p.comoTerminou, 'pulou');
    assert.equal(p.fimEm, t(12));
  });

  test('ajuste de ±30 s só existe no regressivo', () => {
    assert.throws(() => ajustar(criarCronometro({ modo: 'livre' }), 30, T0), /só existe no regressivo/);
    assert.throws(() => ajustar(tabata(), 30, T0), /só existe no regressivo/);
  });
});

// ---------------------------------------------------------------------------
describe('pausar e retomar', () => {
  test('pausado, o tempo congela por quanto tempo for; retomado, as pausas não contam', () => {
    let d = iniciar(criarDescanso(60)!, T0);
    d = pausar(d, t(10));
    assert.equal(d.estado, 'pausado');
    assert.equal(ler(d, t(10)).restanteMs, 50000);
    assert.equal(ler(d, t(310)).restanteMs, 50000, 'cinco minutos depois, igual');
    assert.equal(ler(d, t(310)).estado, 'pausado', 'pausado não termina sozinho');
    d = retomar(d, t(310));
    assert.equal(ler(d, t(320)).restanteMs, 40000);
    d = pausar(d, t(330));
    d = retomar(d, t(400));
    assert.equal(ler(d, t(410)).decorridoMs, 40000);
    assert.equal(atualizar(d, t(999)).fimEm, t(430), 'fim = início + 60 s + 300 s + 70 s de pausa');
    assert.equal(d.pausas.length, 2);
  });

  test('pausar o que já está pausado e retomar o que já roda não mudam nada', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    assert.equal(retomar(d, t(5)), d);
    const p = pausar(d, t(5));
    assert.equal(pausar(p, t(8)), p);
  });

  test('o toque que chega depois do fim não quebra: pausar um descanso já acabado devolve o terminado', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    const p = pausar(d, t(61));
    assert.equal(p.estado, 'terminado');
    assert.equal(p.fimEm, t(60));
  });

  test('alternar: parado → rodando → pausado → rodando (o botão grande do meio)', () => {
    let c = criarCronometro({ modo: 'regressivo', duracaoSegundos: 120 });
    c = alternar(c, T0);
    assert.equal(c.estado, 'rodando');
    c = alternar(c, t(30));
    assert.equal(c.estado, 'pausado');
    c = alternar(c, t(40));
    assert.equal(c.estado, 'rodando');
    assert.equal(ler(c, t(50)).decorridoMs, 40000);
  });

  test('encerrar com pausa aberta fecha a pausa: o tempo fica o de antes de pausar', () => {
    let c = iniciar(criarCronometro({ modo: 'livre' }), T0);
    c = pausar(c, t(100));
    c = encerrar(c, t(500));
    assert.equal(c.estado, 'terminado');
    assert.equal(c.comoTerminou, 'parou');
    assert.equal(ler(c, t(9999)).decorridoMs, 100000);
  });

  test('zerar volta ao parado com a mesma configuração e finalidade', () => {
    const c = encerrar(iniciar(criarDescanso(30)!, T0), t(12));
    const z = zerar(c);
    assert.equal(z.estado, 'parado');
    assert.equal(z.finalidade, 'descanso');
    assert.deepEqual(z.configuracao, c.configuracao);
    assert.equal(z.inicioEm, null);
  });
});

// ---------------------------------------------------------------------------
describe('livre: conta para cima, com voltas', () => {
  test('conta o tempo ativo; volta guarda o decorrido e a duração de cada uma', () => {
    let c = iniciar(criarCronometro({ modo: 'livre' }), T0);
    assert.equal(ler(c, t(61.7)).segundosNaTela, 61, 'para cima, arredonda para baixo');
    assert.equal(ler(c, t(61.7)).restanteMs, null);
    assert.equal(ler(c, t(61.7)).totalMs, null);
    c = marcarVolta(c, t(397));
    c = pausar(c, t(400));
    c = retomar(c, t(460));
    c = marcarVolta(c, t(827));
    const l = ler(c, t(830));
    assert.deepEqual(
      l.voltas.map((v) => [v.numero, v.duracaoMs, v.decorridoMs]),
      [[1, 397000, 397000], [2, 370000, 767000]],
    );
    assert.equal(l.voltaAtualMs, 3000);
    assert.equal(ler(c, t(10_000)).estado, 'rodando', 'livre nunca termina sozinho');
  });

  test('volta só com o cronômetro rodando', () => {
    const c = criarCronometro({ modo: 'livre' });
    assert.equal(marcarVolta(c, T0), c);
    const p = pausar(iniciar(c, T0), t(5));
    assert.equal(marcarVolta(p, t(6)), p);
    assert.throws(() => marcarVolta(iniciar(criarDescanso(60)!, T0), t(1)), /só existe no cronômetro livre/);
  });

  test('livre não tem fase para pular', () => {
    assert.throws(() => pularFase(iniciar(criarCronometro({ modo: 'livre' }), T0), t(1)), /não tem fase para pular/);
  });
});

// ---------------------------------------------------------------------------
describe('intervalado: fases, rodadas e o fim', () => {
  test('as fases do Tabata: preparação, depois 8 de trabalho com 7 descansos entre elas', () => {
    const fases = montarFases({ modo: 'intervalado', ...PREDEFINICOES.tabata.configuracao });
    assert.equal(fases.length, 1 + 8 + 7);
    assert.deepEqual(fases.slice(0, 4).map((f) => [f.tipo, f.rodada, f.inicioMs, f.duracaoMs]), [
      ['preparacao', 0, 0, 10000],
      ['trabalho', 1, 10000, 20000],
      ['descanso', 1, 30000, 10000],
      ['trabalho', 2, 40000, 20000],
    ]);
    assert.deepEqual(fases.at(-1), { tipo: 'trabalho', rodada: 8, inicioMs: 220000, duracaoMs: 20000 });
  });

  test('o Tabata inteiro, lido em instantes soltos (nenhum tique no meio)', () => {
    const c = iniciar(tabata(), T0);
    const em = (s: number) => ler(c, t(s));

    assert.equal(em(0).fase?.tipo, 'preparacao');
    assert.equal(em(0).segundosNaTela, 10);
    assert.equal(em(9.5).segundosNaTela, 1);

    assert.equal(em(10).fase?.tipo, 'trabalho', 'a fronteira pertence à fase que começa');
    assert.equal(em(10).fase?.rodada, 1);
    assert.equal(em(10).segundosNaTela, 20);
    assert.equal(em(10).proximaFase?.tipo, 'descanso');

    assert.equal(em(31).fase?.tipo, 'descanso');
    assert.equal(em(31).segundosNaTela, 9);
    assert.equal(em(31).rodadasCompletas, 1);
    assert.ok(Math.abs(em(31).progresso - 0.1) < 1e-9, 'o progresso é o da fase');

    assert.equal(em(85).fase?.tipo, 'trabalho');
    assert.equal(em(85).fase?.rodada, 3);
    assert.equal(em(85).segundosNaTela, 5, 'trabalho 3 vai de 70 a 90 s');
    assert.equal(em(85).restanteMs, 155000, 'restante do intervalado inteiro');

    assert.equal(em(225).fase?.rodada, 8);
    assert.equal(em(225).proximaFase, null, 'depois da última rodada não há descanso');
    assert.equal(em(239.9).estado, 'rodando');

    const fim = em(240);
    assert.equal(fim.estado, 'terminado');
    assert.equal(fim.rodadasCompletas, 8);
    assert.equal(fim.segundosNaTela, 0);
    assert.equal(fim.comoTerminou, 'completou');
    assert.equal(atualizar(c, t(1000)).fimEm, t(240));
  });

  test('"acabando" no intervalado vale para a fase (fase curta: a fase inteira)', () => {
    const c = iniciar(tabata(), T0);
    assert.equal(ler(c, t(15)).acabando, false, 'trabalho com 15 s pela frente');
    assert.equal(ler(c, t(21)).acabando, true, 'trabalho com 9 s pela frente');
    assert.equal(ler(c, t(31)).acabando, true, 'descanso de 10 s');
  });

  test('pausa no meio do intervalado empurra todas as fases', () => {
    let c = iniciar(tabata(), T0);
    c = pausar(c, t(35)); // descanso 1, faltando 5 s
    c = retomar(c, t(95));
    const l = ler(c, t(100));
    assert.equal(l.fase?.tipo, 'trabalho');
    assert.equal(l.fase?.rodada, 2);
    assert.equal(l.segundosNaTela, 20);
    assert.equal(atualizar(c, t(9999)).fimEm, t(300));
  });

  test('pular fase: o descanso pulado vira trabalho na hora, e o fim chega mais cedo', () => {
    let c = iniciar(tabata(), T0);
    c = pularFase(c, t(3)); // pula a preparação
    assert.equal(ler(c, t(3)).fase?.tipo, 'trabalho');
    assert.equal(ler(c, t(3)).segundosNaTela, 20);
    c = pularFase(c, t(15)); // na linha do tempo, 22 s: pula os 8 s que faltam do trabalho 1
    assert.equal(ler(c, t(15)).fase?.tipo, 'descanso');
    assert.equal(ler(c, t(15)).segundosNaTela, 10);
    assert.equal(atualizar(c, t(9999)).fimEm, t(240 - 7 - 8));
  });

  test('pular a última fase termina o intervalado', () => {
    let c = iniciar(tabata(), T0);
    c = pularFase(c, t(230));
    assert.equal(c.estado, 'terminado');
    assert.equal(c.comoTerminou, 'pulou');
    assert.equal(c.fimEm, t(230));
  });

  test('EMOM: só trabalho, uma fase por minuto', () => {
    const c = iniciar(criarCronometro({ modo: 'intervalado', ...PREDEFINICOES.emom10.configuracao }), T0);
    assert.equal(ler(c, t(10 + 60 * 4 + 5)).fase?.rodada, 5);
    assert.equal(ler(c, t(10 + 60 * 4 + 5)).segundosNaTela, 55);
    assert.equal(ler(c, t(10 + 60 * 4 + 5)).proximaFase?.tipo, 'trabalho');
    assert.equal(ler(c, t(610)).estado, 'terminado');
  });

  test('sem preparação começa direto no trabalho', () => {
    const c = iniciar(criarCronometro({ modo: 'intervalado', preparacaoSegundos: 0, trabalhoSegundos: 30, descansoSegundos: 30, rodadas: 2 }), T0);
    assert.equal(ler(c, T0).fase?.tipo, 'trabalho');
    assert.equal(atualizar(c, t(500)).fimEm, t(90));
  });

  test('parado mostra a primeira fase inteira', () => {
    const l = ler(tabata(), T0);
    assert.equal(l.estado, 'parado');
    assert.equal(l.fase?.tipo, 'preparacao');
    assert.equal(l.segundosNaTela, 10);
    assert.equal(l.restanteMs, 240000);
  });
});

// ---------------------------------------------------------------------------
describe('"próximo aviso em X s": o que agendar como notificação local', () => {
  test('descanso: um aviso, no instante do fim', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    const a = proximoAviso(d, t(15.2));
    assert.ok(a);
    assert.equal(a.tipo, 'fim');
    assert.equal(a.avisoDaTabela, 'fim_do_descanso');
    assert.equal(a.instanteEm, t(60));
    assert.equal(a.emSegundos, 45);
  });

  test('+30 s e −30 s mudam o instante do aviso (o app cancela e agenda de novo)', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    assert.equal(proximoAviso(ajustar(d, 30, t(10)), t(10))?.instanteEm, t(90));
    assert.equal(proximoAviso(ajustar(d, 30, t(10)), t(10))?.emSegundos, 80);
    assert.equal(proximoAviso(ajustar(d, -30, t(10)), t(10))?.instanteEm, t(30));
  });

  test('pausado, parado, terminado e livre: nada agendado', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    assert.equal(proximoAviso(pausar(d, t(5)), t(5)), null);
    assert.equal(proximoAviso(criarDescanso(60)!, T0), null);
    assert.equal(proximoAviso(d, t(61)), null);
    assert.equal(proximoAviso(iniciar(criarCronometro({ modo: 'livre' }), T0), t(1)), null);
    assert.deepEqual(proximosAvisos(pausar(d, t(5)), t(5)), []);
  });

  test('retomar devolve o aviso, já com o tempo da pausa somado', () => {
    let d = iniciar(criarDescanso(60)!, T0);
    d = retomar(pausar(d, t(10)), t(70));
    assert.equal(proximoAviso(d, t(70))?.instanteEm, t(120));
  });

  test('o cronômetro avulso usa o tipo da tabela de avisos', () => {
    assert.equal(proximoAviso(iniciar(criarCronometro({ modo: 'regressivo', duracaoSegundos: 300 }), T0), T0)?.avisoDaTabela, 'fim_do_cronometro');
  });

  test('intervalado: cada troca de fase e o fim, em ordem, a partir de agora', () => {
    const c = iniciar(tabata(), T0);
    const lista = proximosAvisos(c, t(85)); // trabalho 3
    assert.deepEqual(lista.slice(0, 3).map((a) => [a.tipo, a.rodada, a.instanteEm]), [
      ['inicio_descanso', 3, t(90)],
      ['inicio_trabalho', 4, t(100)],
      ['inicio_descanso', 4, t(120)],
    ]);
    assert.equal(lista.at(-1)?.tipo, 'fim');
    assert.equal(lista.at(-1)?.instanteEm, t(240));
    assert.equal(lista.length, 5 + 5 + 1, 'descansos 3..7, trabalhos 4..8 e o fim');
    assert.equal(lista[0].emSegundos, 5);
    assert.equal(lista[0].avisoDaTabela, 'fim_do_cronometro', 'a troca de fase usa a linha 3 da tabela de avisos');
    assert.equal(lista.at(-1)?.avisoDaTabela, 'fim_do_cronometro');
    assert.deepEqual(proximoAviso(c, t(85)), lista[0]);
  });

  test('o Tabata inteiro cabe no limite de avisos agendados; um intervalado enorme é cortado no limite', () => {
    assert.equal(proximosAvisos(iniciar(tabata(), T0), T0).length, 16);
    const enorme = iniciar(criarCronometro({ modo: 'intervalado', preparacaoSegundos: 0, trabalhoSegundos: 20, descansoSegundos: 10, rodadas: 99 }), T0);
    assert.equal(proximosAvisos(enorme, T0).length, LIMITE_DE_AVISOS_AGENDADOS);
    assert.equal(proximosAvisos(enorme, T0, 3).length, 3);
  });
});

// ---------------------------------------------------------------------------
describe('o relógio do telefone e o app fechado', () => {
  test('relógio que volta (ajuste manual) não deixa o tempo negativo', () => {
    const d = iniciar(criarDescanso(60)!, T0);
    assert.equal(ler(d, t(-30)).decorridoMs, 0);
    assert.equal(ler(d, t(-30)).restanteMs, 60000);
    const p = pausar(d, t(20));
    const r = retomar(p, t(5)); // o relógio voltou 15 s durante a pausa
    assert.ok(r.pausas.every((x) => x.fimEm === null || x.fimEm >= x.inicioEm), 'nenhuma pausa com duração negativa');
    assert.equal(ler(r, t(20)).decorridoMs, 20000);
  });

  test('fuso e horário de verão não mexem no cronômetro: o instante é em ms desde 1970, sem fuso', () => {
    const d = iniciar(criarDescanso(90)!, Date.parse('2026-10-10T15:00:00-03:00'));
    // o mesmo instante escrito em outro fuso é o mesmo número
    assert.equal(ler(d, Date.parse('2026-10-10T17:00:30-01:00')).decorridoMs, 30000);
  });

  test('o estado vai e volta como JSON (app fechado e reaberto) com a mesma leitura', () => {
    let c = iniciar(tabata(), T0);
    c = pausar(c, t(50));
    c = retomar(c, t(70));
    c = pularFase(c, t(75));
    const volta = JSON.parse(JSON.stringify(c)) as Cronometro;
    assert.deepEqual(ler(volta, t(130)), ler(c, t(130)));
    assert.deepEqual(proximosAvisos(volta, t(130)), proximosAvisos(c, t(130)));
  });
});

// ---------------------------------------------------------------------------
describe('um cronômetro por vez', () => {
  const rodando = (c: Cronometro) => iniciar(c, T0);
  const agora = t(5);

  test('sem cronômetro, ou com um terminado: inicia', () => {
    assert.equal(decidirAoIniciar(null, 'descanso', agora), 'iniciar');
    assert.equal(decidirAoIniciar(encerrar(rodando(tabata()), t(1)), 'descanso', agora), 'iniciar');
    assert.equal(decidirAoIniciar(rodando(criarDescanso(2)!), 'avulso', agora), 'iniciar', 'o descanso de 2 s já acabou');
  });

  test('marcar outra série com um descanso rodando reinicia o descanso sem perguntar', () => {
    assert.equal(decidirAoIniciar(rodando(criarDescanso(60)!), 'descanso', agora), 'substituir');
  });

  test('descanso com o intervalado (ou outro cronômetro avulso) rodando ou pausado: não começa', () => {
    assert.equal(decidirAoIniciar(rodando(tabata()), 'descanso', agora), 'nao_iniciar');
    assert.equal(decidirAoIniciar(pausar(rodando(criarCronometro({ modo: 'livre' })), t(2)), 'descanso', agora), 'nao_iniciar');
  });

  test('cronômetro avulso por cima de outro: pergunta antes', () => {
    assert.equal(decidirAoIniciar(rodando(tabata()), 'avulso', agora), 'perguntar');
    assert.equal(decidirAoIniciar(rodando(criarDescanso(60)!), 'avulso', agora), 'perguntar');
  });
});

// ---------------------------------------------------------------------------
describe('formatar o número grande', () => {
  test('m:ss abaixo de 1 h e h:mm:ss acima, sem zero à esquerda nos minutos (componente 7: "1:30")', () => {
    assert.equal(formatarCronometro(0), '0:00');
    assert.equal(formatarCronometro(8), '0:08');
    assert.equal(formatarCronometro(90), '1:30');
    assert.equal(formatarCronometro(600), '10:00');
    assert.equal(formatarCronometro(3599), '59:59');
    assert.equal(formatarCronometro(3725), '1:02:05');
    assert.throws(() => formatarCronometro(-1), RangeError);
    assert.throws(() => formatarCronometro(1.5), RangeError);
  });
});
