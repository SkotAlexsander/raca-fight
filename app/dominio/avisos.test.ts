import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  SILENCIO_PADRAO,
  LIMITE_DE_LEMBRETES_POR_DIA,
  LIMITE_DO_AVISO_DA_ACADEMIA,
  PREFERENCIAS_PADRAO,
  agendaDaSemana,
  dentroDoSilencio,
  proximoMomentoPermitido,
  diasPelaFrequencia,
  respeitaSilencio,
  validarAvisoDaAcademia,
  CHAVE_DO_AVISO,
  TIPOS_DE_AVISO,
} from './avisos.ts';
import type { EntradaDaAgenda, PreferenciasDeAviso, RefeicaoParaLembrete, TipoDeAviso } from './avisos.ts';

// 12/10/2026 é uma segunda-feira.
const SEGUNDA = '2026-10-12';

function preferencias(mudancas: Partial<PreferenciasDeAviso> = {}): PreferenciasDeAviso {
  return { ...PREFERENCIAS_PADRAO, ...mudancas };
}

function entrada(mudancas: Partial<EntradaDaAgenda> = {}): EntradaDaAgenda {
  return {
    inicioDaSemana: SEGUNDA,
    fuso: '-03:00',
    preferencias: preferencias({
      lembreteDeTreino: { ligado: true, dias: ['seg', 'qua', 'sex'], hora: '18:00' },
    }),
    temPlus: false,
    refeicoes: [],
    datasComTreino: [],
    ...mudancas,
  };
}

const CINCO_REFEICOES: RefeicaoParaLembrete[] = [
  { id: 'r1', horario: '07:30', opcional: false },
  { id: 'r2', horario: '10:00', opcional: false },
  { id: 'r3', horario: '12:30', opcional: false },
  { id: 'r4', horario: '16:00', opcional: false },
  { id: 'r5', horario: '20:00', opcional: false },
];

describe('horário de silêncio', () => {
  test('o padrão é das 22:00 às 07:00', () => {
    assert.deepEqual(SILENCIO_PADRAO, { inicio: '22:00', fim: '07:00' });
  });

  test('atravessa a meia-noite: 22:00 e 06:59 estão dentro; 07:00 e 21:59 fora', () => {
    assert.equal(dentroDoSilencio('22:00'), true);
    assert.equal(dentroDoSilencio('23:30'), true);
    assert.equal(dentroDoSilencio('00:00'), true);
    assert.equal(dentroDoSilencio('06:59'), true);
    assert.equal(dentroDoSilencio('07:00'), false);
    assert.equal(dentroDoSilencio('21:59'), false);
  });

  test('silêncio que não atravessa a meia-noite e silêncio vazio', () => {
    const tarde = { inicio: '13:00', fim: '14:00' };
    assert.equal(dentroDoSilencio('13:30', tarde), true);
    assert.equal(dentroDoSilencio('14:00', tarde), false);
    assert.equal(dentroDoSilencio('03:00', { inicio: '00:00', fim: '00:00' }), false);
  });

  test('hora mal escrita é erro, não silêncio', () => {
    assert.throws(() => dentroDoSilencio('7:00'), RangeError);
    assert.throws(() => dentroDoSilencio('24:00'), RangeError);
    assert.throws(() => dentroDoSilencio('12:60'), RangeError);
  });

  test('o cronômetro do treino em andamento fura o silêncio; o resto respeita', () => {
    assert.equal(respeitaSilencio('fim_do_descanso'), false);
    assert.equal(respeitaSilencio('fim_do_cronometro'), false);
    assert.equal(respeitaSilencio('lembrete_treino'), true);
    assert.equal(respeitaSilencio('lembrete_refeicao'), true);
    assert.equal(respeitaSilencio('aviso_da_academia'), true);
  });

  test('o servidor segura o que cai no silêncio até as 07:00', () => {
    // Fora do silêncio: sai na hora.
    assert.deepEqual(proximoMomentoPermitido('2026-10-12', '15:10'), { data: '2026-10-12', hora: '15:10' });
    // Depois das 22h: vai para as 07:00 do dia seguinte.
    assert.deepEqual(proximoMomentoPermitido('2026-10-12', '23:40'), { data: '2026-10-13', hora: '07:00' });
    // De madrugada: 07:00 do mesmo dia.
    assert.deepEqual(proximoMomentoPermitido('2026-10-13', '05:15'), { data: '2026-10-13', hora: '07:00' });
    // Virada de mês.
    assert.deepEqual(proximoMomentoPermitido('2026-10-31', '22:00'), { data: '2026-11-01', hora: '07:00' });
  });
});

describe('dias de lembrete pela frequência pretendida', () => {
  test('espalha os dias pela semana', () => {
    assert.deepEqual(diasPelaFrequencia(1), ['seg']);
    assert.deepEqual(diasPelaFrequencia(2), ['seg', 'qui']);
    assert.deepEqual(diasPelaFrequencia(3), ['seg', 'qua', 'sex']);
    assert.deepEqual(diasPelaFrequencia(4), ['seg', 'ter', 'qui', 'sex']);
    assert.deepEqual(diasPelaFrequencia(5), ['seg', 'ter', 'qua', 'qui', 'sex']);
    assert.deepEqual(diasPelaFrequencia(6), ['seg', 'ter', 'qua', 'qui', 'sex', 'sab']);
    assert.deepEqual(diasPelaFrequencia(7), ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']);
  });

  test('frequência fora de 1 a 7 não vira dia nenhum', () => {
    assert.deepEqual(diasPelaFrequencia(0), []);
    assert.deepEqual(diasPelaFrequencia(8), []);
    assert.deepEqual(diasPelaFrequencia(2.5), []);
  });
});

describe('agenda da semana: lembrete de treino', () => {
  test('um lembrete em cada dia escolhido, na hora escolhida, com fuso', () => {
    const { agendadas } = agendaDaSemana(entrada());
    assert.deepEqual(
      agendadas.map((a) => a.quando),
      ['2026-10-12T18:00:00-03:00', '2026-10-14T18:00:00-03:00', '2026-10-16T18:00:00-03:00'],
    );
    assert.ok(agendadas.every((a) => a.tipo === 'lembrete_treino' && a.canal === 'lembretes'));
    // Id estável: o app cancela e reagenda pelo id sem duplicar.
    assert.equal(agendadas[0]?.id, 'lembrete_treino:2026-10-12');
  });

  test('o texto diz qual treino, sem pressão e sem dado de saúde', () => {
    const { agendadas } = agendaDaSemana(entrada({ proximoDiaDeTreino: 'Treino B' }));
    assert.equal(agendadas[0]?.titulo, 'Treino B pronto');
    assert.equal(agendadas[0]?.corpo, 'Está no app quando você quiser.');
    const semNome = agendaDaSemana(entrada()).agendadas[0];
    assert.equal(semNome?.titulo, 'Seu treino está pronto');
  });

  test('sem dias escolhidos, usa a frequência pretendida do cadastro', () => {
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: preferencias({ lembreteDeTreino: { ligado: true, dias: [], hora: '07:30' } }),
        frequenciaSemanalPretendida: 2,
      }),
    );
    assert.deepEqual(agendadas.map((a) => a.data), ['2026-10-12', '2026-10-15']);
  });

  test('sem dias e sem frequência, não inventa: avisa que faltam os dias', () => {
    const { agendadas, descartadas } = agendaDaSemana(
      entrada({ preferencias: preferencias({ lembreteDeTreino: { ligado: true, dias: [], hora: '18:00' } }) }),
    );
    assert.equal(agendadas.length, 0);
    assert.deepEqual(descartadas.map((d) => d.motivo), ['sem_dias']);
  });

  test('lembrete desligado não agenda nada', () => {
    const { agendadas, descartadas } = agendaDaSemana(
      entrada({ preferencias: preferencias({ lembreteDeTreino: { ligado: false, dias: ['seg'], hora: '18:00' } }) }),
    );
    assert.equal(agendadas.length, 0);
    assert.equal(descartadas.length, 0);
  });

  test('não lembra no dia em que você já treinou', () => {
    const { agendadas, descartadas } = agendaDaSemana(entrada({ datasComTreino: ['2026-10-14'] }));
    assert.deepEqual(agendadas.map((a) => a.data), ['2026-10-12', '2026-10-16']);
    assert.deepEqual(descartadas, [{ tipo: 'lembrete_treino', data: '2026-10-14', hora: '18:00', motivo: 'treino_feito' }]);
  });

  test('fechou a frequência da semana, para de lembrar até a semana que vem', () => {
    // Pretende 2 por semana; treinou segunda e terça (fora dos dias escolhidos). Quarta e sexta não lembram.
    const { agendadas, descartadas } = agendaDaSemana(
      entrada({ frequenciaSemanalPretendida: 2, datasComTreino: ['2026-10-12', '2026-10-13'] }),
    );
    assert.equal(agendadas.length, 0);
    assert.deepEqual(
      descartadas.map((d) => `${d.data}:${d.motivo}`),
      ['2026-10-12:treino_feito', '2026-10-14:meta_da_semana', '2026-10-16:meta_da_semana'],
    );
  });

  test('sem frequência informada, a meta é a quantidade de dias escolhidos', () => {
    const { agendadas } = agendaDaSemana(entrada({ datasComTreino: ['2026-10-12', '2026-10-13', '2026-10-14'] }));
    assert.equal(agendadas.length, 0);
  });

  test('treino de outra semana não conta para a meta desta', () => {
    const { agendadas } = agendaDaSemana(entrada({ datasComTreino: ['2026-10-09', '2026-10-10', '2026-10-11'] }));
    assert.equal(agendadas.length, 3);
  });

  test('hora escolhida dentro do silêncio é descartada, nunca movida', () => {
    const { agendadas, descartadas } = agendaDaSemana(
      entrada({ preferencias: preferencias({ lembreteDeTreino: { ligado: true, dias: ['seg', 'ter'], hora: '22:30' } }) }),
    );
    assert.equal(agendadas.length, 0);
    assert.deepEqual(descartadas.map((d) => d.motivo), ['silencio', 'silencio']);
  });

  test('o que já passou não é agendado', () => {
    const { agendadas, descartadas } = agendaDaSemana(entrada({ agora: '2026-10-14T18:00:00-03:00' }));
    assert.deepEqual(agendadas.map((a) => a.data), ['2026-10-16']);
    assert.deepEqual(descartadas.map((d) => `${d.data}:${d.motivo}`), ['2026-10-12:passado', '2026-10-14:passado']);
  });

  test('"agora" em outro fuso é comparado pelo instante, não pelo texto', () => {
    // 21:30 UTC de quarta = 18:30 em Brasília: o lembrete de quarta 18:00 já passou.
    const { agendadas } = agendaDaSemana(entrada({ agora: '2026-10-14T21:30:00Z' }));
    assert.deepEqual(agendadas.map((a) => a.data), ['2026-10-16']);
  });

  test('pausa ("vou ficar parado") silencia os lembretes até a data de volta', () => {
    const { agendadas, descartadas } = agendaDaSemana(entrada({ pausadoAte: '2026-10-14' }));
    assert.deepEqual(agendadas.map((a) => a.data), ['2026-10-16']);
    assert.deepEqual(descartadas.map((d) => d.motivo), ['pausa', 'pausa']);
  });

  test('a semana tem 7 dias a partir do início pedido, inclusive domingo', () => {
    const { agendadas } = agendaDaSemana(
      entrada({ preferencias: preferencias({ lembreteDeTreino: { ligado: true, dias: ['dom'], hora: '09:00' } }) }),
    );
    assert.deepEqual(agendadas.map((a) => a.data), ['2026-10-18']);
  });
});

describe('agenda da semana: lembrete de refeição (Plus)', () => {
  const semTreino = preferencias({ lembreteDeTreino: { ligado: false, dias: [], hora: '18:00' } });

  test('sem Plus, não há lembrete de refeição, mesmo ligado', () => {
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: { ...semTreino, lembreteDeRefeicao: { modo: 'resumo_noturno', horaDoResumo: '20:30' } },
        refeicoes: CINCO_REFEICOES,
        temPlus: false,
      }),
    );
    assert.equal(agendadas.length, 0);
  });

  test('o padrão é um resumo só, à noite, todo dia', () => {
    const { agendadas } = agendaDaSemana(
      entrada({ preferencias: semTreino, refeicoes: CINCO_REFEICOES, temPlus: true }),
    );
    assert.equal(PREFERENCIAS_PADRAO.lembreteDeRefeicao.modo, 'resumo_noturno');
    assert.equal(agendadas.length, 7);
    assert.ok(agendadas.every((a) => a.tipo === 'resumo_refeicao' && a.hora === '20:30'));
    assert.equal(agendadas[0]?.titulo, 'Como foi a alimentação hoje?');
    assert.equal(agendadas[0]?.id, 'resumo_refeicao:2026-10-12');
  });

  test('sem plano em vigor (nenhuma refeição), o resumo não aparece', () => {
    const { agendadas } = agendaDaSemana(entrada({ preferencias: semTreino, refeicoes: [], temPlus: true }));
    assert.equal(agendadas.length, 0);
  });

  test('por refeição: uma por horário, sem o nome da refeição (é dado de saúde)', () => {
    const tres: RefeicaoParaLembrete[] = [
      { id: 'cafe', horario: '07:30', opcional: false },
      { id: 'almoco', horario: '12:30', opcional: false },
      { id: 'ceia', horario: '21:00', opcional: true },
    ];
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: { ...semTreino, lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' } },
        refeicoes: tres,
        temPlus: true,
      }),
    );
    const segunda = agendadas.filter((a) => a.data === SEGUNDA);
    // A ceia é opcional: não lembra.
    assert.deepEqual(segunda.map((a) => a.hora), ['07:30', '12:30']);
    assert.equal(segunda[0]?.titulo, 'Hora da refeição');
    assert.equal(segunda[0]?.corpo, 'Marque no app quando fizer.');
    assert.equal(segunda[0]?.id, 'lembrete_refeicao:2026-10-12:07:30');
  });

  test('refeições a menos de 30 min uma da outra viram um aviso só', () => {
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: { ...semTreino, lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' } },
        refeicoes: [
          { id: 'a', horario: '10:00', opcional: false },
          { id: 'b', horario: '10:20', opcional: false },
          { id: 'c', horario: '15:00', opcional: false },
        ],
        temPlus: true,
      }),
    );
    const segunda = agendadas.filter((a) => a.data === SEGUNDA);
    assert.deepEqual(segunda.map((a) => a.hora), ['10:00', '15:00']);
    assert.equal(segunda[0]?.corpo, '2 refeições do plano agora. Marque no app quando fizer.');
  });

  test('refeição sem horário não tem lembrete próprio: entra no resumo da noite (revisão T, T4)', () => {
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: { ...semTreino, lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' } },
        refeicoes: [{ id: 'a', opcional: false }, { id: 'b', horario: '12:00', opcional: false }],
        temPlus: true,
      }),
    );
    // Antes da revisão T o teste fixava só ['12:00']: a refeição "a" sumia sem
    // aviso nem descarte, contra o comentário de `RefeicaoParaLembrete.horario`.
    assert.deepEqual([...new Set(agendadas.map((a) => a.hora))], ['12:00', '20:30']);
    assert.ok(agendadas.filter((a) => a.hora === '20:30').every((a) => a.tipo === 'resumo_refeicao'));
  });

  test('refeição no silêncio é descartada', () => {
    const { agendadas, descartadas } = agendaDaSemana(
      entrada({
        preferencias: { ...semTreino, lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' } },
        refeicoes: [{ id: 'cedo', horario: '06:00', opcional: false }],
        temPlus: true,
      }),
    );
    assert.equal(agendadas.length, 0);
    assert.equal(descartadas.length, 7);
    assert.ok(descartadas.every((d) => d.motivo === 'silencio'));
  });

  test('mais refeições que o limite do dia: vira o resumo da noite (agrupar, não cortar o jantar)', () => {
    const { agendadas, descartadas } = agendaDaSemana(
      entrada({
        // treino na segunda 18:00 + 5 refeições = 6 > limite 3
        preferencias: {
          ...preferencias({ lembreteDeTreino: { ligado: true, dias: ['seg'], hora: '18:00' } }),
          lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' },
        },
        refeicoes: CINCO_REFEICOES,
        temPlus: true,
      }),
    );
    assert.equal(LIMITE_DE_LEMBRETES_POR_DIA, 3);
    const segunda = agendadas.filter((a) => a.data === SEGUNDA);
    assert.deepEqual(segunda.map((a) => `${a.hora}:${a.tipo}`), ['18:00:lembrete_treino', '20:30:resumo_refeicao']);
    const agrupadas = descartadas.filter((d) => d.data === SEGUNDA);
    assert.equal(agrupadas.length, 5);
    assert.ok(agrupadas.every((d) => d.motivo === 'agrupado'));
  });

  test('nenhum dia passa do limite, seja qual for a combinação', () => {
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: {
          ...preferencias({ lembreteDeTreino: { ligado: true, dias: diasPelaFrequencia(7), hora: '06:00' } }),
          lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' },
        },
        refeicoes: CINCO_REFEICOES.slice(0, 3),
        temPlus: true,
        limitePorDia: 2,
      }),
    );
    const porDia = new Map<string, number>();
    for (const a of agendadas) porDia.set(a.data, (porDia.get(a.data) ?? 0) + 1);
    assert.ok([...porDia.values()].every((n) => n <= 2));
  });

  test('limite 1 com treino e refeição: fica o treino', () => {
    const { agendadas, descartadas } = agendaDaSemana(
      entrada({
        preferencias: {
          ...preferencias({ lembreteDeTreino: { ligado: true, dias: ['seg'], hora: '18:00' } }),
          lembreteDeRefeicao: { modo: 'resumo_noturno', horaDoResumo: '20:30' },
        },
        refeicoes: CINCO_REFEICOES,
        temPlus: true,
        limitePorDia: 1,
      }),
    );
    const segunda = agendadas.filter((a) => a.data === SEGUNDA);
    assert.deepEqual(segunda.map((a) => a.tipo), ['lembrete_treino']);
    assert.ok(descartadas.some((d) => d.data === SEGUNDA && d.motivo === 'limite_do_dia'));
  });

  test('a agenda sai em ordem de horário', () => {
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: {
          ...preferencias({ lembreteDeTreino: { ligado: true, dias: ['seg'], hora: '18:00' } }),
          lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' },
        },
        refeicoes: [{ id: 'a', horario: '12:00', opcional: false }],
        temPlus: true,
      }),
    );
    const instantes = agendadas.map((a) => Date.parse(a.quando));
    assert.deepEqual(instantes, [...instantes].sort((x, y) => x - y));
  });
});

describe('a agenda nunca leva dado de saúde', () => {
  test('nenhum número com unidade de corpo ou comida em título ou corpo', () => {
    const { agendadas } = agendaDaSemana(
      entrada({
        preferencias: {
          ...preferencias({ lembreteDeTreino: { ligado: true, dias: diasPelaFrequencia(7), hora: '18:00' } }),
          lembreteDeRefeicao: { modo: 'por_refeicao', horaDoResumo: '20:30' },
        },
        refeicoes: CINCO_REFEICOES,
        temPlus: true,
        proximoDiaDeTreino: 'Treino A',
        limitePorDia: 10,
      }),
    );
    assert.ok(agendadas.length > 0);
    for (const a of agendadas) {
      const texto = `${a.titulo} ${a.corpo}`;
      assert.doesNotMatch(texto, /\d\s*(kg|g|kcal|cm|m|%)\b/i, texto);
      assert.doesNotMatch(texto, /peso|gordura|dieta|caloria/i, texto);
    }
  });
});

describe('entrada inválida é erro, não agenda vazia', () => {
  test('data, fuso e hora', () => {
    assert.throws(() => agendaDaSemana(entrada({ inicioDaSemana: '12/10/2026' })), RangeError);
    assert.throws(() => agendaDaSemana(entrada({ inicioDaSemana: '2026-02-30' })), RangeError);
    assert.throws(() => agendaDaSemana(entrada({ fuso: 'America/Sao_Paulo' })), RangeError);
    assert.throws(
      () => agendaDaSemana(entrada({ preferencias: preferencias({ lembreteDeTreino: { ligado: true, dias: ['seg'], hora: '6h' } }) })),
      RangeError,
    );
    assert.throws(() => agendaDaSemana(entrada({ limitePorDia: 0 })), RangeError);
  });
});

describe('aviso da academia', () => {
  test('texto curto e validade de 1 a 14 dias', () => {
    assert.equal(LIMITE_DO_AVISO_DA_ACADEMIA, 160);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'Feriado: abrimos às 9h.', validadeDias: 3 }), []);
    assert.deepEqual(validarAvisoDaAcademia({ texto: '   ', validadeDias: 3 }), ['vazio']);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'a'.repeat(161), validadeDias: 3 }), ['longo_demais']);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'a'.repeat(160), validadeDias: 14 }), []);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'Oi', validadeDias: 0 }), ['validade_invalida']);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'Oi', validadeDias: 15 }), ['validade_invalida']);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'Oi', validadeDias: 1.5 }), ['validade_invalida']);
  });

  test('conta caractere, não unidade de UTF-16 (acento e emoji simples contam 1)', () => {
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'é'.repeat(160), validadeDias: 1 }), []);
    assert.deepEqual(validarAvisoDaAcademia({ texto: '💪'.repeat(160), validadeDias: 1 }), []);
  });

  test('aviso não é chat: link e quebra de linha em excesso não passam', () => {
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'Veja https://x.com', validadeDias: 1 }), ['tem_link']);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'a\nb\nc\nd', validadeDias: 1 }), ['linhas_demais']);
    assert.deepEqual(validarAvisoDaAcademia({ texto: 'a\nb\nc', validadeDias: 1 }), []);
  });
});

describe('cada aviso tem a sua chave na tela Avisos', () => {
  test('todo tipo de aviso está no mapa, e só o aviso ao dono de Plus sem personal não desliga', () => {
    const tipos = Object.keys(CHAVE_DO_AVISO) as TipoDeAviso[];
    assert.equal(tipos.length, TIPOS_DE_AVISO.length);
    for (const tipo of TIPOS_DE_AVISO) assert.ok(tipo in CHAVE_DO_AVISO, tipo);
    const fixos = TIPOS_DE_AVISO.filter((t) => CHAVE_DO_AVISO[t] === null);
    assert.deepEqual(fixos, ['plus_sem_personal']);
  });

  test('descanso, série por tempo e cronômetro dividem a mesma chave', () => {
    assert.equal(CHAVE_DO_AVISO.fim_do_descanso, 'cronometro');
    assert.equal(CHAVE_DO_AVISO.fim_do_cronometro, 'cronometro');
    assert.equal(CHAVE_DO_AVISO.resumo_refeicao, 'lembrete_refeicao');
  });

  test('o padrão: lembrete de treino só liga quando o aluno escolhe; o resto vem ligado', () => {
    assert.equal(PREFERENCIAS_PADRAO.lembreteDeTreino.ligado, false);
    assert.equal(PREFERENCIAS_PADRAO.cronometro, true);
    assert.equal(PREFERENCIAS_PADRAO.academia, true);
  });
});
