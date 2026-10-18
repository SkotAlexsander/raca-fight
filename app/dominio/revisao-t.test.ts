/**
 * Revisão T (P10, 11/10/2026): um teste por bug achado na checagem final.
 * Cada teste foi escrito ANTES da correção e falhou contra o código antigo;
 * o relatório (`docs/revisao/T-CODIGO.md`) cita o número (T1, T2…) de cada um.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatarNumero,
  formatarReais,
  instanteComFuso,
  lerNumero,
  minutosSegundosParaSegundos,
} from './unidades.ts';
import {
  LIMITE_DE_AVISOS_AGENDADOS,
  PREDEFINICOES,
  criarCronometro,
  criarDescanso,
  iniciar,
  ler,
  marcarVolta,
  pausar,
  proximoAviso,
  proximosAvisos,
  pularFase,
  restaurarCronometro,
} from './cronometro.ts';
import { PREFERENCIAS_PADRAO, agendaDaSemana, validarAvisoDaAcademia } from './avisos.ts';
import type { EntradaDaAgenda, PreferenciasDeAviso } from './avisos.ts';

const T0 = Date.UTC(2026, 9, 10, 18, 0, 0);
const t = (s: number) => T0 + Math.round(s * 1000);

// ---------------------------------------------------------------------------
describe('revisão T — avisos', () => {
  const pref = (m: Partial<PreferenciasDeAviso> = {}): PreferenciasDeAviso => ({
    ...PREFERENCIAS_PADRAO,
    lembreteDeTreino: { ligado: true, dias: ['seg'], hora: '18:00' },
    ...m,
  });
  const entrada = (m: Partial<EntradaDaAgenda> = {}): EntradaDaAgenda => ({
    inicioDaSemana: '2026-10-12',
    fuso: '-03:00',
    preferencias: pref(),
    temPlus: false,
    refeicoes: [],
    datasComTreino: [],
    ...m,
  });

  test('T1: "agora" sem fuso é recusado (Date.parse leria na hora da máquina: o celular e o servidor dariam agendas diferentes)', () => {
    assert.throws(() => agendaDaSemana(entrada({ agora: '2026-10-12T19:00:00' })), /fuso/);
    assert.throws(() => agendaDaSemana(entrada({ agora: '2026-10-12' })), /fuso/);
    // com fuso continua valendo, em qualquer forma ISO
    assert.equal(agendaDaSemana(entrada({ agora: '2026-10-12T17:00:00-03:00' })).agendadas.length, 1);
    assert.equal(agendaDaSemana(entrada({ agora: '2026-10-12T22:00:00.000Z' })).agendadas.length, 0);
  });

  test('T4: "por refeição" com refeição sem horário cai no resumo da noite (antes: nenhum aviso e nenhum descarte)', () => {
    const porRefeicao = pref({ lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' } });
    const so = agendaDaSemana(entrada({ preferencias: { ...porRefeicao, lembreteDeTreino: { ligado: false, dias: [], hora: '18:00' } }, temPlus: true, refeicoes: [{ id: 'r', opcional: false }] }));
    assert.equal(so.agendadas.length, 7);
    assert.ok(so.agendadas.every((n) => n.tipo === 'resumo_refeicao' && n.hora === '20:30'));

    const mista = agendaDaSemana(
      entrada({
        preferencias: { ...porRefeicao, lembreteDeTreino: { ligado: false, dias: [], hora: '18:00' } },
        temPlus: true,
        refeicoes: [{ id: 'a', horario: '12:30', opcional: false }, { id: 'b', opcional: false }],
      }),
    );
    const segunda = mista.agendadas.filter((n) => n.data === '2026-10-12').map((n) => `${n.tipo} ${n.hora}`);
    assert.deepEqual(segunda, ['lembrete_refeicao 12:30', 'resumo_refeicao 20:30']);

    // opcional sem horário continua sem lembrete (não conta na adesão)
    const opcional = agendaDaSemana(entrada({ preferencias: { ...porRefeicao, lembreteDeTreino: { ligado: false, dias: [], hora: '18:00' } }, temPlus: true, refeicoes: [{ id: 'c', opcional: true }] }));
    assert.equal(opcional.agendadas.length, 0);
  });

  test('T5: dia da semana desconhecido e data de treino fora do formato são erro, não lembrete sumido em silêncio', () => {
    assert.throws(
      () => agendaDaSemana(entrada({ preferencias: pref({ lembreteDeTreino: { ligado: true, dias: ['segunda' as never], hora: '18:00' } }) })),
      /dia da semana/,
    );
    assert.throws(() => agendaDaSemana(entrada({ datasComTreino: ['2026-10-12T07:00:00-03:00'] })), /datasComTreino/);
  });

  test('T6: link sem "http" nem "www" também é link (R10.10: sem link)', () => {
    for (const texto of ['Promoção em bit.ly/plano', 'Pague em academia.com.br/pix', 'Fale em wa.me/5511999999999', 'Veja ACADEMIA.COM.BR']) {
      assert.ok(validarAvisoDaAcademia({ texto, validadeDias: 3 }).includes('tem_link'), texto);
    }
    for (const texto of ['Abrimos às 9h. Até amanhã!', 'Plus por R$ 49,90 no balcão.', 'Treino A.B fica igual.', 'Aula às 7.30, sala 2.']) {
      assert.deepEqual(validarAvisoDaAcademia({ texto, validadeDias: 3 }), [], texto);
    }
  });
});

// ---------------------------------------------------------------------------
describe('revisão T — cronômetro', () => {
  test('T2: relógio atrasado à mão não gera volta negativa (R9.4)', () => {
    let c = iniciar(criarCronometro({ modo: 'livre' }), t(0));
    c = marcarVolta(c, t(60));
    c = marcarVolta(c, t(30)); // o relógio voltou 30 s
    const leitura = ler(c, t(30));
    assert.ok(leitura.voltas.every((v) => v.duracaoMs >= 0), JSON.stringify(leitura.voltas));
    assert.ok(leitura.voltaAtualMs >= 0);
    assert.ok(leitura.decorridoMs >= 60000, 'o decorrido não anda para trás depois de uma marca');
  });

  test('T2: relógio atrasado depois de pular fase não volta para a fase pulada (R9.4, R9.7)', () => {
    let c = iniciar(criarCronometro({ modo: 'intervalado', preparacaoSegundos: 0, trabalhoSegundos: 20, descansoSegundos: 10, rodadas: 8 }), t(0));
    c = pularFase(c, t(5));
    assert.equal(ler(c, t(5)).fase?.tipo, 'descanso');
    const depois = ler(c, t(1)); // o relógio voltou 4 s
    assert.equal(depois.fase?.tipo, 'descanso');
    assert.equal(depois.fase?.rodada, 1);
    // pular de novo com o relógio atrasado vai para o trabalho 2, não repete o trabalho 1
    const outra = pularFase(c, t(2));
    assert.equal(ler(outra, t(2)).fase?.tipo, 'trabalho');
    assert.equal(ler(outra, t(2)).fase?.rodada, 2);
  });

  test('T3: intervalado com mais fases que o limite ainda agenda o aviso do fim (R9.11)', () => {
    const enorme = iniciar(criarCronometro({ modo: 'intervalado', preparacaoSegundos: 0, trabalhoSegundos: 20, descansoSegundos: 10, rodadas: 99 }), T0);
    const lista = proximosAvisos(enorme, T0);
    assert.equal(lista.length, LIMITE_DE_AVISOS_AGENDADOS);
    assert.equal(lista.at(-1)?.tipo, 'fim');
    assert.equal(lista.at(-1)?.instanteEm, T0 + (99 * 20 + 98 * 10) * 1000);
    // o primeiro continua sendo a próxima troca de fase
    assert.equal(proximoAviso(enorme, T0)?.tipo, 'inicio_descanso');
    assert.equal(proximosAvisos(enorme, T0, 3).at(-1)?.tipo, 'fim');
    // quem cabe inteiro não muda
    const tabata = iniciar(criarCronometro({ modo: 'intervalado', ...PREDEFINICOES.tabata.configuracao }), T0);
    assert.equal(proximosAvisos(tabata, T0).length, 16);
  });

  test('F1: o estado salvo no telefone volta igual; o que vier corrompido vira nulo, nunca um cronômetro que quebra a tela', () => {
    let c = iniciar(criarCronometro({ modo: 'intervalado', ...PREDEFINICOES.tabata.configuracao }), T0);
    c = pausar(c, t(50));
    const volta = restaurarCronometro(JSON.parse(JSON.stringify(c)));
    assert.deepEqual(volta, c);

    const valido = JSON.parse(JSON.stringify(iniciar(criarDescanso(60)!, T0))) as Record<string, unknown>;
    // estado gravado antes da revisão T, sem o campo novo: aceito
    const antigo = { ...valido };
    delete antigo.ultimoToqueEm;
    assert.equal(restaurarCronometro(antigo)?.ultimoToqueEm, null);

    const estragados: unknown[] = [
      null,
      'texto',
      {},
      { ...valido, estado: 'voando' },
      { ...valido, inicioEm: '2026-10-10' },
      { ...valido, inicioEm: null }, // rodando sem início
      { ...valido, pausas: [{ inicioEm: T0 + 5000, fimEm: T0 }] }, // pausa com duração negativa
      { ...valido, pausas: [{ inicioEm: T0 + 1, fimEm: null }] }, // rodando com pausa aberta
      { ...valido, ajusteMs: Number.NaN },
      { ...valido, voltasMs: [3, 1] },
      { ...valido, configuracao: { modo: 'regressivo', duracaoSegundos: 0 } },
      { ...valido, finalidade: 'descanso', configuracao: { modo: 'livre' } },
      { ...valido, configuracao: { modo: 'intervalado', preparacaoSegundos: 0, trabalhoSegundos: 20, descansoSegundos: 10, rodadas: 0 } },
      { ...valido, estado: 'terminado', fimEm: null },
      { ...valido, comoTerminou: 'explodiu' },
    ];
    for (const e of estragados) {
      assert.equal(restaurarCronometro(e), null, JSON.stringify(e));
    }
  });
});

// ---------------------------------------------------------------------------
describe('revisão T — unidades', () => {
  test('T7: lerNumero nunca devolve Infinity (é NaN, como diz a documentação)', () => {
    assert.ok(Number.isNaN(lerNumero('9'.repeat(400))));
    assert.equal(lerNumero('72,5'), 72.5);
  });

  test('T8: formatar número que não existe é erro, não "NaN" na tela', () => {
    assert.throws(() => formatarNumero(Number.NaN, 1), RangeError);
    assert.throws(() => formatarNumero(Number.POSITIVE_INFINITY, 1), RangeError);
    assert.equal(formatarNumero(-2.45, 1), '-2,5');
  });

  test('T8: instante de uma data inválida é erro, não "0NaN-NaN-NaN…" gravado no banco', () => {
    assert.throws(() => instanteComFuso(new Date('não é data')), RangeError);
  });

  test('T8: centavos fora do inteiro seguro são recusados (antes: "R$ 1e+298,00")', () => {
    assert.throws(() => formatarReais(1e300), RangeError);
    assert.equal(formatarReais(4990), 'R$ 49,90');
  });

  test('T9: tempo digitado enorme é recusado em vez de virar número inexato', () => {
    assert.throws(() => minutosSegundosParaSegundos('99999999999999999999'), RangeError);
    assert.equal(minutosSegundosParaSegundos('1:30'), 90);
  });
});

