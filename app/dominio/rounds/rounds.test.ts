import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alternar, iniciar, pularFase, restaurarCronometro } from '../cronometro.ts';
import { criarCronometroDeRounds, lerRound, marcasDosSinais, mmss, predefinicaoDeRound, PREDEFINICOES_DE_ROUND, resumoDosTempos, sinaisEntre, totalDosTempos } from './rounds.ts';

const T0 = 1_760_000_000_000;
const s = (n: number) => T0 + n * 1000;

test('as predefinições de luta do R17.2: Boxe e Muay Thai 3 × 3 min com 1 min de intervalo, MMA 3 × 5 min', () => {
  const boxe = predefinicaoDeRound('boxe').tempos;
  assert.deepEqual(boxe, { preparacaoSegundos: 10, trabalhoSegundos: 180, descansoSegundos: 60, rodadas: 3 });
  assert.deepEqual(predefinicaoDeRound('muay_thai').tempos, boxe);
  assert.deepEqual(predefinicaoDeRound('mma').tempos, { preparacaoSegundos: 10, trabalhoSegundos: 300, descansoSegundos: 60, rodadas: 3 });
  assert.equal(PREDEFINICOES_DE_ROUND.length, 5);
  assert.ok(PREDEFINICOES_DE_ROUND.every((p) => p.fonte.length > 0 && p.tempos.preparacaoSegundos === 10));
  assert.equal(resumoDosTempos(boxe), '3 × 3 min · intervalo 1:00');
  // total do Muay Thai: 10 s + 3 × 3 min + 2 × 1 min = 11:10
  assert.equal(mmss(totalDosTempos(boxe)), '11:10');
});

test('a fase se chama "Round 2 de 3" e "Intervalo" (R17.3)', () => {
  const c = iniciar(criarCronometroDeRounds(predefinicaoDeRound('muay_thai').tempos), T0);
  assert.equal(lerRound(c, s(5)).titulo, 'Prepare-se');
  assert.equal(lerRound(c, s(5)).segundos, 5);
  const r1 = lerRound(c, s(10));
  assert.equal(r1.titulo, 'Round 1 de 3');
  assert.equal(r1.rotulo, 'Luta');
  assert.equal(r1.segundos, 180);
  assert.equal(r1.depois, 'intervalo de 1:00');
  const intervalo = lerRound(c, s(10 + 180 + 30));
  assert.equal(intervalo.titulo, 'Intervalo');
  assert.equal(intervalo.segundos, 30);
  assert.equal(intervalo.depois, 'round 2 de 3');
  const r2 = lerRound(c, s(10 + 180 + 60 + 72));
  assert.equal(r2.titulo, 'Round 2 de 3');
  assert.equal(r2.segundos, 108);
  assert.equal(lerRound(c, s(10 + 3 * 180 + 2 * 60 + 1)).fase, 'fim');
  assert.equal(lerRound(criarCronometroDeRounds(predefinicaoDeRound('mma').tempos), T0).fase, 'parado');
});

test('o aviso dos 10 s: nos últimos 10 s de todo round de 60 s ou mais (R17.4)', () => {
  const c = iniciar(criarCronometroDeRounds(predefinicaoDeRound('boxe').tempos), T0);
  assert.equal(lerRound(c, s(10 + 169)).ultimos10s, false);
  assert.equal(lerRound(c, s(10 + 170)).ultimos10s, true);
  assert.equal(lerRound(c, s(10 + 180 + 55)).ultimos10s, false, 'no intervalo não');
  const curto = iniciar(criarCronometroDeRounds({ preparacaoSegundos: 0, trabalhoSegundos: 30, descansoSegundos: 10, rodadas: 2 }), T0);
  assert.equal(lerRound(curto, s(25)).ultimos10s, false, 'round de 30 s não tem aviso');
});

test('os sinais: gongo no começo e no fim de cada round e a batida dos 10 s (R17.5)', () => {
  const t = predefinicaoDeRound('muay_thai').tempos;
  const marcas = marcasDosSinais(t, true);
  assert.equal(marcas.filter((m) => m.sinal === 'gongo_inicio').length, 3);
  assert.equal(marcas.filter((m) => m.sinal === 'gongo_fim').length, 3);
  assert.equal(marcas.filter((m) => m.sinal === 'aviso_10s').length, 3);
  assert.equal(marcasDosSinais(t, false).filter((m) => m.sinal === 'aviso_10s').length, 0);
  const c = iniciar(criarCronometroDeRounds(t), T0);
  assert.deepEqual(sinaisEntre(c, s(9), s(10), true), ['gongo_inicio']);
  assert.deepEqual(sinaisEntre(c, s(10), s(11), true), []);
  assert.deepEqual(sinaisEntre(c, s(179), s(180), true), ['aviso_10s']);
  assert.deepEqual(sinaisEntre(c, s(189), s(190), true), ['gongo_fim']);
  // a tela dormiu o round inteiro: acorda sabendo tudo o que passou
  assert.deepEqual(sinaisEntre(c, s(5), s(200), true), ['gongo_inicio', 'aviso_10s', 'gongo_fim']);
});

test('sem preparação, o primeiro gongo toca no Iniciar', () => {
  const parado = criarCronometroDeRounds({ preparacaoSegundos: 0, trabalhoSegundos: 120, descansoSegundos: 30, rodadas: 2 });
  const c = iniciar(parado, s(0));
  assert.deepEqual(sinaisEntre(c, s(-1), s(0), true), ['gongo_inicio']);
});

test('pausado não anda e não toca; pular vai para a próxima fase', () => {
  const t = predefinicaoDeRound('saco').tempos;
  let c = iniciar(criarCronometroDeRounds(t), T0);
  c = alternar(c, s(20)); // pausa no round 1
  assert.equal(lerRound(c, s(500)).pausado, true);
  assert.equal(lerRound(c, s(500)).segundos, 110);
  assert.deepEqual(sinaisEntre(c, s(30), s(500), true), []);
  c = alternar(c, s(500));
  c = pularFase(c, s(501));
  assert.equal(lerRound(c, s(501)).titulo, 'Intervalo');
});

test('o estado vai e volta como JSON (o app pode morrer no meio do round)', () => {
  const c = iniciar(criarCronometroDeRounds(predefinicaoDeRound('mma').tempos), T0);
  const volta = restaurarCronometro(JSON.parse(JSON.stringify(c)))!;
  assert.deepEqual(lerRound(volta, s(400)), lerRound(c, s(400)));
});

test('a mesma validação do motor: rounds e tempos fora do limite são recusados', () => {
  assert.throws(() => criarCronometroDeRounds({ preparacaoSegundos: 10, trabalhoSegundos: 0, descansoSegundos: 60, rodadas: 3 }));
  assert.throws(() => criarCronometroDeRounds({ preparacaoSegundos: 10, trabalhoSegundos: 180, descansoSegundos: 60, rodadas: 0 }));
  assert.throws(() => lerRound({ ...criarCronometroDeRounds(predefinicaoDeRound('boxe').tempos), configuracao: { modo: 'livre' } }, T0));
});
